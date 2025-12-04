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

  describe('Session ID mismatch error handling', () => {
    it('should throw detailed error with session ID information on removeItem mismatch', async () => {
      const itemId = 'item-1';
      const cartSessionId = 'sess_123';
      const requestSessionId = 'sess_456';

      const mockCartItem = {
        id: itemId,
        cartId: 'cart-1',
        productId: 'product-1',
        quantity: 1,
        price: '100',
        cart: {
          id: 'cart-1',
          userId: null,
          sessionId: cartSessionId,
          expiresAt: new Date(),
        },
      };

      jest.spyOn(prisma.cartItem, 'findUnique').mockResolvedValue(mockCartItem as any);

      try {
        await service.removeItem(itemId, undefined, requestSessionId);
        fail('Should have thrown BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = error.getResponse() as any;

        // Verify error message includes session ID details
        expect(response.message).toContain('does not belong to session');
        expect(response.message).toContain(cartSessionId);
        expect(response.message).toContain(requestSessionId);

        // Verify error code
        expect(response.error).toBe('CART_SESSION_MISMATCH');

        // Verify error details
        expect(response.details).toBeDefined();
        expect(response.details.operation).toBe('removeItem');
        expect(response.details.itemId).toBe(itemId);
        expect(response.details.cartId).toBe('cart-1');
        expect(response.details.expectedSessionId).toBe(cartSessionId);
        expect(response.details.receivedSessionId).toBe(requestSessionId);
        expect(response.details.timestamp).toBeDefined();
      }
    });

    it('should throw detailed error with session ID information on updateItem mismatch', async () => {
      const itemId = 'item-1';
      const cartSessionId = 'sess_123';
      const requestSessionId = 'sess_456';

      const mockCartItem = {
        id: itemId,
        cartId: 'cart-1',
        productId: 'product-1',
        quantity: 1,
        price: '100',
        cart: {
          id: 'cart-1',
          userId: null,
          sessionId: cartSessionId,
          expiresAt: new Date(),
        },
        product: {
          id: 'product-1',
          stockQuantity: 10,
        },
      };

      jest.spyOn(prisma.cartItem, 'findUnique').mockResolvedValue(mockCartItem as any);

      try {
        await service.updateItem(itemId, { quantity: 2 }, undefined, requestSessionId);
        fail('Should have thrown BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = error.getResponse() as any;

        // Verify error message includes session ID details
        expect(response.message).toContain('does not belong to session');
        expect(response.message).toContain(cartSessionId);
        expect(response.message).toContain(requestSessionId);

        // Verify error code
        expect(response.error).toBe('CART_SESSION_MISMATCH');

        // Verify error details
        expect(response.details).toBeDefined();
        expect(response.details.operation).toBe('updateItem');
        expect(response.details.itemId).toBe(itemId);
        expect(response.details.cartId).toBe('cart-1');
        expect(response.details.expectedSessionId).toBe(cartSessionId);
        expect(response.details.receivedSessionId).toBe(requestSessionId);
        expect(response.details.timestamp).toBeDefined();
      }
    });

    it('should throw detailed error with user ID information on removeItem mismatch', async () => {
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
          sessionId: null,
          expiresAt: new Date(),
        },
      };

      jest.spyOn(prisma.cartItem, 'findUnique').mockResolvedValue(mockCartItem as any);

      try {
        await service.removeItem(itemId, requestUserId, undefined);
        fail('Should have thrown BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = error.getResponse() as any;

        // Verify error message includes user ID details
        expect(response.message).toContain('does not belong to user');
        expect(response.message).toContain(cartUserId);
        expect(response.message).toContain(requestUserId);

        // Verify error code
        expect(response.error).toBe('CART_OWNERSHIP_MISMATCH');

        // Verify error details
        expect(response.details).toBeDefined();
        expect(response.details.operation).toBe('removeItem');
        expect(response.details.itemId).toBe(itemId);
        expect(response.details.cartId).toBe('cart-1');
        expect(response.details.expectedUserId).toBe(cartUserId);
        expect(response.details.receivedUserId).toBe(requestUserId);
        expect(response.details.timestamp).toBeDefined();
      }
    });
  });

  describe('Cart item not found error handling', () => {
    it('should throw NotFoundException when cart item does not exist', async () => {
      const itemId = 'non-existent-item';

      jest.spyOn(prisma.cartItem, 'findUnique').mockResolvedValue(null);

      await expect(
        service.removeItem(itemId, undefined, 'sess_123')
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.removeItem(itemId, undefined, 'sess_123')
      ).rejects.toThrow('Cart item not found');
    });
  });
});
