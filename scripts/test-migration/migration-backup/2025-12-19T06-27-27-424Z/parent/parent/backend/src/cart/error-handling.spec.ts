import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { PrismaService } from '../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CartService - Error Handling', () => {
  let service: CartService;
  let prisma: PrismaService;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: PrismaService,
          useValue: {
            cart: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              findMany: jest.fn(),
            },
            cartItem: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              deleteMany: jest.fn(),
            },
            product: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('User ID mismatch error handling', () => {
    it('should throw error when cart item does not belong to user on removeItem', async () => {
      const itemId = 'item-1';
      const cartUserId = 'user-123';
      const requestUserId = 'user-456';

      const mockCartItem = {
        id: itemId,
        cartId: 'cart-1',
        productId: 'product-1',
        quantity: 1,
        price: '100',
        cart: {
          id: 'cart-1',
          userId: cartUserId,
          expiresAt: new Date(),
        },
      };

      jest.spyOn(prisma.cartItem, 'findUnique').mockResolvedValue(mockCartItem as any);

      await expect(
        service.removeItem(itemId, requestUserId)
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.removeItem(itemId, requestUserId)
      ).rejects.toThrow('Cart item does not belong to user');
    });

    it('should throw error when cart item does not belong to user on updateItem', async () => {
      const itemId = 'item-1';
      const cartUserId = 'user-123';
      const requestUserId = 'user-456';

      const mockCartItem = {
        id: itemId,
        cartId: 'cart-1',
        productId: 'product-1',
        quantity: 1,
        price: '100',
        cart: {
          id: 'cart-1',
          userId: cartUserId,
          expiresAt: new Date(),
        },
        product: {
          id: 'product-1',
          stockQuantity: 10,
        },
      };

      jest.spyOn(prisma.cartItem, 'findUnique').mockResolvedValue(mockCartItem as any);

      await expect(
        service.updateItem(itemId, { quantity: 2 }, requestUserId)
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.updateItem(itemId, { quantity: 2 }, requestUserId)
      ).rejects.toThrow('Cart item does not belong to user');
    });
  });

  describe('Cart item not found error handling', () => {
    it('should throw NotFoundException when cart item does not exist', async () => {
      const itemId = 'non-existent-item';

      jest.spyOn(prisma.cartItem, 'findUnique').mockResolvedValue(null);

      await expect(
        service.removeItem(itemId, 'user-123')
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.removeItem(itemId, 'user-123')
      ).rejects.toThrow('Cart item not found');
    });
  });
});
