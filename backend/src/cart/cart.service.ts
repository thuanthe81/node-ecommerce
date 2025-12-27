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
import { CONSTANTS } from '@alacraft/shared';

@Injectable()
export class CartService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Get cart for authenticated user only
   */
  async getCart(userId: string) {
    // Try to get from Redis cache first
    const cacheKey = this.getCacheKey(userId);
    const cachedCart = await this.cacheManager.get(cacheKey);

    if (cachedCart) {
      console.log(`[Cart Service] Cart retrieved from cache - UserId: ${userId}`);
      return cachedCart;
    }

    // If not in cache, get from database
    console.log(`[Cart Service] Cart not in cache, fetching from database - UserId: ${userId}`);
    const cart = await this.findOrCreateCart(userId);
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
    console.log(`[Cart Service] Cart cached - UserId: ${userId}, Items: ${cartWithItems?.items?.length || 0}`);

    return cartWithItems;
  }

  /**
   * Add item to cart - handles quantity merging automatically
   */
  async addItem(addToCartDto: AddToCartDto, userId: string) {
    const { productId, quantity } = addToCartDto;

    console.log(
      `[Cart Service] Adding item to cart - UserId: ${userId}, ProductId: ${productId}, Quantity: ${quantity}`,
    );

    // Verify product exists and has sufficient stock
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      console.error(`[Cart Service] Product not found - ProductId: ${productId}`);
      throw new NotFoundException('Product not found');
    }

    if (!product.isActive) {
      console.warn(`[Cart Service] Product not available - ProductId: ${productId}`);
      throw new BadRequestException('Product is not available');
    }

    // Check stock for non-zero-price products
    // Zero-price products can be added to cart regardless of stock
    const isZeroPrice = Number(product.price) === 0;
    if (!isZeroPrice && product.stockQuantity < quantity) {
      console.warn(
        `[Cart Service] Insufficient stock - ProductId: ${productId}, ` +
        `Requested: ${quantity}, Available: ${product.stockQuantity}`,
      );
      throw new BadRequestException('Insufficient stock');
    }

    // Find or create cart
    const cart = await this.findOrCreateCart(userId);

    // Check if item already exists in cart
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      // Merge quantities
      const newQuantity = existingItem.quantity + quantity;

      // Check stock limit
      if (!isZeroPrice && product.stockQuantity < newQuantity) {
        // Set to max available stock
        await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: product.stockQuantity },
        });

        console.log(
          `[Cart Service] Quantity merging - UserId: ${userId}, ProductId: ${productId}, ` +
          `Original quantity: ${existingItem.quantity}, Requested quantity: ${quantity}, ` +
          `Combined would be: ${newQuantity}, Stock available: ${product.stockQuantity}, ` +
          `Final quantity: ${product.stockQuantity} (capped at stock limit)`,
        );
      } else {
        await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity },
        });

        console.log(
          `[Cart Service] Quantity merging - UserId: ${userId}, ProductId: ${productId}, ` +
          `Original quantity: ${existingItem.quantity}, Added quantity: ${quantity}, ` +
          `New quantity: ${newQuantity}`,
        );
      }
    } else {
      // Create new cart item (price will be 0 for zero-price products)
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          price: product.price,
        },
      });

      console.log(
        `[Cart Service] Created new cart item - UserId: ${userId}, ProductId: ${productId}, ` +
        `Quantity: ${quantity}, Price: ${product.price}`,
      );
    }

    // Invalidate cache
    await this.invalidateCache(userId);

    return this.getCart(userId);
  }

  /**
   * Update cart item quantity
   */
  async updateItem(
    itemId: string,
    updateCartItemDto: UpdateCartItemDto,
    userId: string,
  ) {
    const { quantity } = updateCartItemDto;

    console.log(
      `[Cart Service] Updating cart item - UserId: ${userId}, ItemId: ${itemId}, New quantity: ${quantity}`,
    );

    // Find cart item
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
        product: true,
      },
    });

    if (!cartItem) {
      console.error(`[Cart Service] Cart item not found - ItemId: ${itemId}`);
      throw new NotFoundException('Cart item not found');
    }

    // Verify cart ownership
    if (cartItem.cart.userId !== userId) {
      console.error(
        `[Cart Service] Cart ownership mismatch - ItemId: ${itemId}, ` +
        `Expected UserId: ${userId}, Actual UserId: ${cartItem.cart.userId}`,
      );
      throw new BadRequestException('Cart item does not belong to user');
    }

    // Verify stock
    if (cartItem.product.stockQuantity < quantity) {
      console.warn(
        `[Cart Service] Insufficient stock for update - ProductId: ${cartItem.productId}, ` +
        `Requested: ${quantity}, Available: ${cartItem.product.stockQuantity}`,
      );
      throw new BadRequestException('Insufficient stock');
    }

    // Update quantity
    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    console.log(
      `[Cart Service] Cart item updated successfully - ItemId: ${itemId}, ` +
      `Old quantity: ${cartItem.quantity}, New quantity: ${quantity}`,
    );

    // Invalidate cache
    await this.invalidateCache(userId);

    return this.getCart(userId);
  }

  /**
   * Remove item from cart
   */
  async removeItem(itemId: string, userId: string) {
    console.log(`[Cart Service] Removing cart item - UserId: ${userId}, ItemId: ${itemId}`);

    // Find cart item
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
      },
    });

    if (!cartItem) {
      console.error(`[Cart Service] Cart item not found - ItemId: ${itemId}`);
      throw new NotFoundException('Cart item not found');
    }

    // Verify cart ownership
    if (cartItem.cart.userId !== userId) {
      console.error(
        `[Cart Service] Cart ownership mismatch - ItemId: ${itemId}, ` +
        `Expected UserId: ${userId}, Actual UserId: ${cartItem.cart.userId}`,
      );
      throw new BadRequestException('Cart item does not belong to user');
    }

    // Delete cart item
    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    console.log(
      `[Cart Service] Cart item removed successfully - ItemId: ${itemId}, ProductId: ${cartItem.productId}`,
    );

    // Invalidate cache
    await this.invalidateCache(userId);

    return this.getCart(userId);
  }

  /**
   * Clear cart
   */
  async clearCart(userId: string) {
    console.log(`[Cart Service] Clearing cart - UserId: ${userId}`);

    const cart = await this.findCart(userId);

    if (cart) {
      const itemCount = cart.items.length;
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      console.log(`[Cart Service] Cart cleared successfully - UserId: ${userId}, Items removed: ${itemCount}`);

      // Invalidate cache
      await this.invalidateCache(userId);
    } else {
      console.log(`[Cart Service] No cart found to clear - UserId: ${userId}`);
    }

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
      if (cart.userId) {
        await this.invalidateCache(cart.userId);
      }
    }

    return { deleted: expiredCarts.length };
  }

  /**
   * Private helper methods
   */

  private async findCart(userId: string) {
    return this.prisma.cart.findFirst({
      where: { userId },
      include: { items: true },
    });
  }

  private async findOrCreateCart(userId: string) {
    let cart = await this.findCart(userId);

    if (!cart) {
      // Create new cart with 7 days expiration
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      cart = await this.prisma.cart.create({
        data: {
          userId,
          expiresAt,
        },
        include: { items: true },
      });

      console.log(`[Cart Service] Created new cart for user: ${userId}`);
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

  private getCacheKey(userId: string): string {
    return CONSTANTS.CACHE_KEYS.CART.BY_USER(userId);
  }

  private async invalidateCache(userId: string) {
    const cacheKey = this.getCacheKey(userId);
    await this.cacheManager.del(cacheKey);
    console.log(`[Cart Service] Cache invalidated for user: ${userId}`);
  }
}
