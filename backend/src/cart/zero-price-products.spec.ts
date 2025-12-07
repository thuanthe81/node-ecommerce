import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { PrismaService } from '../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException } from '@nestjs/common';

describe('CartService - Zero Price Products', () => {
  let service: CartService;
  let prismaService: PrismaService;

  const mockZeroPriceProduct = {
    id: 'prod-zero',
    slug: 'custom-product',
    sku: 'SKU-CUSTOM',
    nameEn: 'Custom Product',
    nameVi: 'Sản phẩm tùy chỉnh',
    descriptionEn: 'Custom made product',
    descriptionVi: 'Sản phẩm làm theo yêu cầu',
    price: 0.0,
    compareAtPrice: null,
    costPrice: null,
    stockQuantity: 0,
    lowStockThreshold: 0,
    weight: null,
    dimensions: null,
    categoryId: 'cat-1',
    isActive: true,
    isFeatured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRegularProduct = {
    id: 'prod-regular',
    slug: 'regular-product',
    sku: 'SKU-REG',
    nameEn: 'Regular Product',
    nameVi: 'Sản phẩm thường',
    descriptionEn: 'Regular product',
    descriptionVi: 'Sản phẩm thường',
    price: 50.0,
    compareAtPrice: null,
    costPrice: null,
    stockQuantity: 10,
    lowStockThreshold: 5,
    weight: null,
    dimensions: null,
    categoryId: 'cat-1',
    isActive: true,
    isFeatured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCart = {
    id: 'cart-1',
    userId: 'user-1',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
  };

  const mockPrismaService = {
    product: {
      findUnique: jest.fn(),
    },
    cart: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    cartItem: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('addItem with zero-price products', () => {
    it('should allow adding zero-price product to cart regardless of stock', async () => {
      const addToCartDto = {
        productId: 'prod-zero',
        quantity: 5,
      };

      mockPrismaService.product.findUnique.mockResolvedValue(
        mockZeroPriceProduct,
      );
      mockPrismaService.cart.findFirst.mockResolvedValue(mockCart);
      mockPrismaService.cart.update.mockResolvedValue(mockCart);
      mockPrismaService.cartItem.findUnique.mockResolvedValue(null);
      mockPrismaService.cartItem.create.mockResolvedValue({
        id: 'item-1',
        cartId: 'cart-1',
        productId: 'prod-zero',
        quantity: 5,
        price: 0.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrismaService.cart.findUnique.mockResolvedValue({
        ...mockCart,
        items: [
          {
            id: 'item-1',
            cartId: 'cart-1',
            productId: 'prod-zero',
            quantity: 5,
            price: 0.0,
            product: mockZeroPriceProduct,
          },
        ],
      });
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.addItem(addToCartDto, 'user-1');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].price).toBe(0.0);
      expect(mockPrismaService.cartItem.create).toHaveBeenCalledWith({
        data: {
          cartId: 'cart-1',
          productId: 'prod-zero',
          quantity: 5,
          price: 0.0,
        },
      });
    });

    it('should enforce stock validation for regular products', async () => {
      const addToCartDto = {
        productId: 'prod-regular',
        quantity: 15, // More than available stock (10)
      };

      mockPrismaService.product.findUnique.mockResolvedValue(
        mockRegularProduct,
      );
      mockPrismaService.cart.findFirst.mockResolvedValue(mockCart);

      await expect(
        service.addItem(addToCartDto, 'user-1'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.addItem(addToCartDto, 'user-1'),
      ).rejects.toThrow('Insufficient stock');
    });

    it('should allow adding regular product within stock limits', async () => {
      const addToCartDto = {
        productId: 'prod-regular',
        quantity: 5, // Within stock (10)
      };

      mockPrismaService.product.findUnique.mockResolvedValue(
        mockRegularProduct,
      );
      mockPrismaService.cart.findFirst.mockResolvedValue(mockCart);
      mockPrismaService.cart.update.mockResolvedValue(mockCart);
      mockPrismaService.cartItem.findUnique.mockResolvedValue(null);
      mockPrismaService.cartItem.create.mockResolvedValue({
        id: 'item-1',
        cartId: 'cart-1',
        productId: 'prod-regular',
        quantity: 5,
        price: 50.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrismaService.cart.findUnique.mockResolvedValue({
        ...mockCart,
        items: [
          {
            id: 'item-1',
            cartId: 'cart-1',
            productId: 'prod-regular',
            quantity: 5,
            price: 50.0,
            product: mockRegularProduct,
          },
        ],
      });
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.addItem(addToCartDto, 'user-1');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].price).toBe(50.0);
    });

    it('should update quantity for existing zero-price item without stock check', async () => {
      const addToCartDto = {
        productId: 'prod-zero',
        quantity: 10,
      };

      const existingCartItem = {
        id: 'item-1',
        cartId: 'cart-1',
        productId: 'prod-zero',
        quantity: 5,
        price: 0.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.product.findUnique.mockResolvedValue(
        mockZeroPriceProduct,
      );
      mockPrismaService.cart.findFirst.mockResolvedValue(mockCart);
      mockPrismaService.cart.update.mockResolvedValue(mockCart);
      mockPrismaService.cartItem.findUnique.mockResolvedValue(
        existingCartItem,
      );
      mockPrismaService.cartItem.update.mockResolvedValue({
        ...existingCartItem,
        quantity: 15,
      });
      mockPrismaService.cart.findUnique.mockResolvedValue({
        ...mockCart,
        items: [
          {
            ...existingCartItem,
            quantity: 15,
            product: mockZeroPriceProduct,
          },
        ],
      });
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.addItem(addToCartDto, 'user-1');

      expect(result.items[0].quantity).toBe(15);
      expect(mockPrismaService.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { quantity: 15 },
      });
    });

    it('should cap quantity at max stock when updating existing regular product item exceeds stock', async () => {
      const addToCartDto = {
        productId: 'prod-regular',
        quantity: 8,
      };

      const existingCartItem = {
        id: 'item-1',
        cartId: 'cart-1',
        productId: 'prod-regular',
        quantity: 5,
        price: 50.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.product.findUnique.mockResolvedValue(
        mockRegularProduct,
      );
      mockPrismaService.cart.findFirst.mockResolvedValue(mockCart);
      mockPrismaService.cart.update.mockResolvedValue(mockCart);
      mockPrismaService.cartItem.findUnique.mockResolvedValue(
        existingCartItem,
      );
      mockPrismaService.cartItem.update.mockResolvedValue({
        ...existingCartItem,
        quantity: 10, // Capped at max stock
      });
      mockPrismaService.cart.findUnique.mockResolvedValue({
        ...mockCart,
        items: [
          {
            ...existingCartItem,
            quantity: 10, // Capped at max stock
            product: mockRegularProduct,
          },
        ],
      });
      mockCacheManager.get.mockResolvedValue(null);

      // New quantity would be 5 + 8 = 13, which exceeds stock of 10
      // Should cap at max stock (10) instead of throwing error
      const result = await service.addItem(addToCartDto, 'user-1');

      expect(result.items[0].quantity).toBe(10);
      expect(mockPrismaService.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { quantity: 10 },
      });
    });
  });
});
