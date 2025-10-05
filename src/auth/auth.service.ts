import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    if (!user.password) {
      throw new UnauthorizedException('Senha inválida');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Senha inválida');
    }

    const { password: _pw, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
      },
    };
  }

  async signup(signupData: { name: string; email: string; password: string }) {
    const { name, email, password } = signupData;

    if (!name || name.trim().length === 0) {
      throw new BadRequestException('Nome é obrigatório');
    }

    if (!email || !email.includes('@')) {
      throw new BadRequestException('Email deve ser válido');
    }

    if (!password || password.length < 6) {
      throw new BadRequestException('Senha deve ter pelo menos 6 caracteres');
    }

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await this.usersService.create({
      name,
      email,
      password: hashedPassword,
      isAdmin: false,
    });

    const { password: _pw, ...result } = user;

    return {
      message: 'Usuário criado com sucesso',
      user: result,
    };
  }
}
