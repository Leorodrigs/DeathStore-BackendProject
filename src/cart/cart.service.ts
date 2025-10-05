import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class CartService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getOrCreateCart(userId: number) {
    let cart = await this.databaseService.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await this.databaseService.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: true,
                },
              },
            },
          },
        },
      });
    }

    return cart;
  }

  async getCartByUserId(userId: number) {
    const cart = await this.getOrCreateCart(userId);

    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.items.reduce(
      (sum, item) => sum + item.priceAtTime * item.quantity,
      0,
    );

    return {
      ...cart,
      totalItems,
      totalPrice,
    };
  }

  async addToCart(userId: number, productId: number, quantity: number) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantidade deve ser maior que zero');
    }

    const product = await this.databaseService.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    if (product.stock < quantity) {
      throw new BadRequestException('Estoque insuficiente');
    }

    const cart = await this.getOrCreateCart(userId);

    const existingItem = await this.databaseService.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: productId,
        },
      },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      if (product.stock < newQuantity) {
        throw new BadRequestException(
          'Estoque insuficiente para a quantidade total',
        );
      }

      return this.databaseService.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
        include: {
          product: {
            include: {
              images: true,
            },
          },
        },
      });
    } else {
      return this.databaseService.cartItem.create({
        data: {
          cartId: cart.id,
          productId: productId,
          quantity: quantity,
          priceAtTime: product.price,
        },
        include: {
          product: {
            include: {
              images: true,
            },
          },
        },
      });
    }
  }

  async updateCartItem(userId: number, itemId: number, quantity: number) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantidade deve ser maior que zero');
    }

    const cart = await this.getOrCreateCart(userId);

    const item = await this.databaseService.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
      include: {
        product: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Item não encontrado no carrinho');
    }

    if (item.product.stock < quantity) {
      throw new BadRequestException('Estoque insuficiente');
    }

    return this.databaseService.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: {
        product: {
          include: {
            images: true,
          },
        },
      },
    });
  }

  async removeFromCart(userId: number, itemId: number) {
    const cart = await this.getOrCreateCart(userId);

    const item = await this.databaseService.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (!item) {
      throw new NotFoundException('Item não encontrado no carrinho');
    }

    return this.databaseService.cartItem.delete({
      where: { id: itemId },
    });
  }

  async clearCart(userId: number) {
    const cart = await this.getOrCreateCart(userId);

    await this.databaseService.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return { message: 'Carrinho limpo com sucesso' };
  }

  async checkout(userId: number) {
    try {
      const cartData = await this.getCartByUserId(userId);

      if (!cartData || !cartData.items || cartData.items.length === 0) {
        throw new BadRequestException('Carrinho vazio');
      }

      const cartItems = cartData.items;

      for (const item of cartItems) {
        const product = await this.databaseService.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundException(
            `Produto ${item.productId} não encontrado`,
          );
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Estoque insuficiente para ${product.name}. Disponível: ${product.stock}, Solicitado: ${item.quantity}`,
          );
        }

        await this.databaseService.product.update({
          where: { id: item.productId },
          data: {
            stock: product.stock - item.quantity,
          },
        });
      }

      await this.clearCart(userId);

      return {
        success: true,
        message: 'Compra finalizada com sucesso!',
        timestamp: new Date().toISOString(),
        totalItems: cartItems.length,
        totalPrice: cartData.totalPrice || 0,
      };
    } catch (error) {
      console.error('Erro no checkout:', error);
      throw error;
    }
  }

  async getCartItemCount(userId: number) {
    const cart = await this.getOrCreateCart(userId);

    const totalItems = await this.databaseService.cartItem.aggregate({
      where: { cartId: cart.id },
      _sum: { quantity: true },
    });

    return { count: totalItems._sum.quantity || 0 };
  }

  async getCartTotal(userId: number) {
    const cart = await this.getOrCreateCart(userId);

    const items = await this.databaseService.cartItem.findMany({
      where: { cartId: cart.id },
    });

    const total = items.reduce(
      (sum, item) => sum + item.priceAtTime * item.quantity,
      0,
    );

    return { total };
  }
}
