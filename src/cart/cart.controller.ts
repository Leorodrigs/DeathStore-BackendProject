import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

export class AddToCartDto {
  productId: number;
  quantity: number;
}

export class UpdateCartItemDto {
  quantity: number;
}

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getMyCart(@Req() req: any) {
    const userId = req.user.sub;
    return this.cartService.getCartByUserId(userId);
  }

  @Post('items')
  addToCart(@Req() req: any, @Body() addToCartDto: AddToCartDto) {
    const userId = req.user.sub;
    return this.cartService.addToCart(
      userId,
      addToCartDto.productId,
      addToCartDto.quantity,
    );
  }

  @Post('checkout')
  async checkout(@Req() req: any) {
    const userId = req.user.sub;
    return this.cartService.checkout(userId);
  }

  @Patch('items/:itemId')
  updateCartItem(
    @Req() req: any,
    @Param('itemId') itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    const userId = req.user.sub;
    return this.cartService.updateCartItem(
      userId,
      +itemId,
      updateCartItemDto.quantity,
    );
  }

  @Delete('items/:itemId')
  removeFromCart(@Req() req: any, @Param('itemId') itemId: string) {
    const userId = req.user.sub;
    return this.cartService.removeFromCart(userId, +itemId);
  }

  @Delete()
  clearCart(@Req() req: any) {
    const userId = req.user.sub;
    return this.cartService.clearCart(userId);
  }

  @Get('count')
  getCartItemCount(@Req() req: any) {
    const userId = req.user.sub;
    return this.cartService.getCartItemCount(userId);
  }

  @Get('total')
  getCartTotal(@Req() req: any) {
    const userId = req.user.sub;
    return this.cartService.getCartTotal(userId);
  }
}
