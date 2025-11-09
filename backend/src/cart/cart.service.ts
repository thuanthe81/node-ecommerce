import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Get cart for user or session
   */
  async getCart(userId?: string, sessionId?: string) {
    // Try to get from Redis cache first
    const cacheKey = this.getCacheKey(userId, sessionId);
    const cachedCart = await this.cacheManager.get(cacheKey);

    if (cachedCart) {
      return cachedCart;
    }

    // If not in cache, get from database
    const cart = await this.findOrCreateCart(userId, sessionId);
    const cartWithItems = await this.prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: { displayOrder: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    // Cache the cart
    await this.cacheManager.set(cacheKey, cartWithItems, 60 * 60 * 24 * 7); // 7 days

    return cartWithItems;
  }

  /**
   * Add item to cart
   */
  async addItem(
    addToCartDto: AddToCartDto,
    userId?: string,
    sessionId?: string,
  ) {
    const { productId, quantity } = addToCartDto;

    // Verify product exists and has sufficient stock
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isActive) {
      throw new BadRequestException('Product is not available');
    }

    if (product.stockQuantity < quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    // Find or create cart
    const cart = await this.findOrCreateCart(userId, sessionId);

    // Check if item already exists in cart
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    let cartItem;
    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      if (product.stockQuantity < newQuantity) {
        throw new BadRequestException('Insufficient stock');
      }

      cartItem = await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // Create new cart item
      cartItem = await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          price: product.price,
        },
      });
    }

    // Invalidate cache
    await this.invalidateCache(userId, sessionId);

    return this.getCart(userId, sessionId);
  }

  /**
   * Update cart item quantity
   */
  async updateItem(
    itemId: string,
    updateCartItemDto: UpdateCartItemDto,
    userId?: string,
    sessionId?: string,
  ) {
    const { quantity } = updateCartItemDto;

    // Find cart item
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
        product: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    // Verify cart ownership
    if (userId && cartItem.cart.userId !== userId) {
      throw new BadRequestException('Cart item does not belong to user');
    }

    if (sessionId && cartItem.cart.sessionId !== sessionId) {
      throw new BadRequestException('Cart item does not belong to session');
    }

    // Verify stock
    if (cartItem.product.stockQuantity < quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    // Update quantity
    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    // Invalidate cache
    await this.invalidateCache(userId, sessionId);

    return this.getCart(userId, sessionId);
  }

  /**
   * Remove item from cart
   */
  async removeItem(itemId: string, userId?: string, sessionId?: string) {
    // Find cart item
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    // Verify cart ownership
    if (userId && cartItem.cart.userId !== userId) {
      throw new BadRequestException('Cart item does not belong to user');
    }

    if (sessionId && cartItem.cart.sessionId !== sessionId) {
      throw new BadRequestException('Cart item does not belong to session');
    }

    // Delete cart item
    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    // Invalidate cache
    await this.invalidateCache(userId, sessionId);

    return this.getCart(userId, sessionId);
  }

  /**
   * Clear cart
   */
  async clearCart(userId?: string, sessionId?: string) {
    const cart = await this.findCart(userId, sessionId);

    if (cart) {
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      // Invalidate cache
      await this.invalidateCache(userId, sessionId);
    }

    return this.getCart(userId, sessionId);
  }

  /**
   * Merge guest cart with user cart on login
   */
  async mergeGuestCart(userId: string, sessionId: string) {
    const guestCart = await this.findCart(undefined, sessionId);
    const userCart = await this.findOrCreateCart(userId);

    if (!guestCart || guestCart.items.length === 0) {
      return userCart;
    }

    // Get guest cart items
    const guestItems = await this.prisma.cartItem.findMany({
      where: { cartId: guestCart.id },
      include: { product: true },
    });

    // Merge items into user cart
    for (const guestItem of guestItems) {
      const existingItem = await this.prisma.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: userCart.id,
            productId: guestItem.productId,
          },
        },
      });

      if (existingItem) {
        // Update quantity (ensure we don't exceed stock)
        const newQuantity = Math.min(
          existingItem.quantity + guestItem.quantity,
          guestItem.product.stockQuantity,
        );

        await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity },
        });
      } else {
        // Create new item in user cart
        await this.prisma.cartItem.create({
          data: {
            cartId: userCart.id,
            productId: guestItem.productId,
            quantity: Math.min(
              guestItem.quantity,
              guestItem.product.stockQuantity,
            ),
            price: guestItem.price,
          },
        });
      }
    }

    // Delete guest cart
    await this.prisma.cart.delete({
      where: { id: guestCart.id },
    });

    // Invalidate both caches
    await this.invalidateCache(userId);
    await this.invalidateCache(undefined, sessionId);

    return this.getCart(userId);
  }

  /**
   * Clean up expired carts
   */
  async cleanupExpiredCarts() {
    const now = new Date();
    const expiredCarts = await this.prisma.cart.findMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    for (const cart of expiredCarts) {
      await this.prisma.cart.delete({
        where: { id: cart.id },
      });

      // Invalidate cache
      await this.invalidateCache(
        cart.userId || undefined,
        cart.sessionId || undefined,
      );
    }

    return { deleted: expiredCarts.length };
  }

  /**
   * Private helper methods
   */

  private async findCart(userId?: string, sessionId?: string) {
    if (userId) {
      return this.prisma.cart.findFirst({
        where: { userId },
        include: { items: true },
      });
    } else if (sessionId) {
      return this.prisma.cart.findFirst({
        where: { sessionId },
        include: { items: true },
      });
    }
    return null;
  }

  private async findOrCreateCart(userId?: string, sessionId?: string) {
    let cart = await this.findCart(userId, sessionId);

    if (!cart) {
      // Create new cart with 7 days expiration
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      cart = await this.prisma.cart.create({
        data: {
          userId: userId || undefined,
          sessionId: sessionId || undefined,
          expiresAt,
        },
        include: { items: true },
      });
    } else {
      // Update expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      cart = await this.prisma.cart.update({
        where: { id: cart.id },
        data: { expiresAt },
        include: { items: true },
      });
    }

    return cart;
  }

  private getCacheKey(userId?: string, sessionId?: string): string {
    if (userId) {
      return `cart:user:${userId}`;
    } else if (sessionId) {
      return `cart:session:${sessionId}`;
    }
    throw new BadRequestException('Either userId or sessionId is required');
  }

  private async invalidateCache(userId?: string, sessionId?: string) {
    const cacheKey = this.getCacheKey(userId, sessionId);
    await this.cacheManager.del(cacheKey);
  }
}
