import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from '../../src/products/products.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ProductsImageService } from '../../src/products/products-image.service';

describe('ProductsService - Zero-Price Product Filtering and Sorting', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockProductsImageService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              findMany: jest.fn(),
              count: jest.fn(),
            },
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: ProductsImageService,
          useValue: mockProductsImageService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Price filtering with zero-price products', () => {
    it('should include zero-price products when minPrice is 0', async () => {
      const mockProducts = [
        { id: '1', price: 0, nameEn: 'Zero Price Product' },
        { id: '2', price: 100, nameEn: 'Regular Product' },
      ];

      mockCacheManager.get.mockResolvedValue(null);
      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (prisma.product.count as jest.Mock).mockResolvedValue(2);

      const result = await service.findAll({ minPrice: 0, page: 1, limit: 20 });

      expect(result.data).toHaveLength(2);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: { gte: 0 },
          }),
        }),
      );
    });

    it('should exclude zero-price products when minPrice is greater than 0', async () => {
      const mockProducts = [
        { id: '2', price: 100, nameEn: 'Regular Product' },
      ];

      mockCacheManager.get.mockResolvedValue(null);
      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (prisma.product.count as jest.Mock).mockResolvedValue(1);

      const result = await service.findAll({ minPrice: 1, page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].price).toBeGreaterThan(0);
    });

    it('should handle maxPrice filter with zero-price products', async () => {
      const mockProducts = [
        { id: '1', price: 0, nameEn: 'Zero Price Product' },
      ];

      mockCacheManager.get.mockResolvedValue(null);
      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (prisma.product.count as jest.Mock).mockResolvedValue(1);

      const result = await service.findAll({ maxPrice: 0, page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].price).toBe(0);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: { lte: 0 },
          }),
        }),
      );
    });

    it('should handle price range that includes zero', async () => {
      const mockProducts = [
        { id: '1', price: 0, nameEn: 'Zero Price Product' },
        { id: '2', price: 50, nameEn: 'Mid Price Product' },
        { id: '3', price: 100, nameEn: 'High Price Product' },
      ];

      mockCacheManager.get.mockResolvedValue(null);
      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (prisma.product.count as jest.Mock).mockResolvedValue(3);

      const result = await service.findAll({
        minPrice: 0,
        maxPrice: 100,
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(3);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: { gte: 0, lte: 100 },
          }),
        }),
      );
    });
  });

  describe('Price sorting with zero-price products', () => {
    it('should sort zero-price products first when sorting by price ascending', async () => {
      const mockProducts = [
        { id: '1', price: 0, nameEn: 'Zero Price Product' },
        { id: '2', price: 50, nameEn: 'Low Price Product' },
        { id: '3', price: 100, nameEn: 'High Price Product' },
      ];

      mockCacheManager.get.mockResolvedValue(null);
      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (prisma.product.count as jest.Mock).mockResolvedValue(3);

      const result = await service.findAll({
        sortBy: 'price',
        sortOrder: 'asc',
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(3);
      expect(result.data[0].price).toBe(0);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { price: 'asc' },
        }),
      );
    });

    it('should sort zero-price products last when sorting by price descending', async () => {
      const mockProducts = [
        { id: '3', price: 100, nameEn: 'High Price Product' },
        { id: '2', price: 50, nameEn: 'Low Price Product' },
        { id: '1', price: 0, nameEn: 'Zero Price Product' },
      ];

      mockCacheManager.get.mockResolvedValue(null);
      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (prisma.product.count as jest.Mock).mockResolvedValue(3);

      const result = await service.findAll({
        sortBy: 'price',
        sortOrder: 'desc',
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(3);
      expect(result.data[2].price).toBe(0);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { price: 'desc' },
        }),
      );
    });

    it('should handle sorting by name with zero-price products', async () => {
      const mockProducts = [
        { id: '1', price: 0, nameEn: 'Alpha Product' },
        { id: '2', price: 100, nameEn: 'Beta Product' },
        { id: '3', price: 0, nameEn: 'Gamma Product' },
      ];

      mockCacheManager.get.mockResolvedValue(null);
      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (prisma.product.count as jest.Mock).mockResolvedValue(3);

      const result = await service.findAll({
        sortBy: 'name',
        sortOrder: 'asc',
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(3);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { nameEn: 'asc' },
        }),
      );
    });
  });

  describe('Edge cases with all zero-price products', () => {
    it('should handle listing when all products are zero-price', async () => {
      const mockProducts = [
        { id: '1', price: 0, nameEn: 'Zero Price Product 1' },
        { id: '2', price: 0, nameEn: 'Zero Price Product 2' },
        { id: '3', price: 0, nameEn: 'Zero Price Product 3' },
      ];

      mockCacheManager.get.mockResolvedValue(null);
      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (prisma.product.count as jest.Mock).mockResolvedValue(3);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(3);
      expect(result.data.every((p) => p.price === 0)).toBe(true);
    });

    it('should handle price filtering when all products are zero-price', async () => {
      const mockProducts = [
        { id: '1', price: 0, nameEn: 'Zero Price Product 1' },
        { id: '2', price: 0, nameEn: 'Zero Price Product 2' },
      ];

      mockCacheManager.get.mockResolvedValue(null);
      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (prisma.product.count as jest.Mock).mockResolvedValue(2);

      const result = await service.findAll({
        minPrice: 0,
        maxPrice: 0,
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(2);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: { gte: 0, lte: 0 },
          }),
        }),
      );
    });

    it('should return empty results when filtering for price > 0 with all zero-price products', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.product.count as jest.Mock).mockResolvedValue(0);

      const result = await service.findAll({
        minPrice: 1,
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });

    it('should handle price sorting when all products are zero-price', async () => {
      const mockProducts = [
        { id: '1', price: 0, nameEn: 'Zero Price Product 1' },
        { id: '2', price: 0, nameEn: 'Zero Price Product 2' },
      ];

      mockCacheManager.get.mockResolvedValue(null);
      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (prisma.product.count as jest.Mock).mockResolvedValue(2);

      const result = await service.findAll({
        sortBy: 'price',
        sortOrder: 'asc',
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(2);
      expect(result.data.every((p) => p.price === 0)).toBe(true);
    });
  });

  describe('Mixed zero and non-zero price products', () => {
    it('should correctly filter mixed products with minPrice', async () => {
      const mockProducts = [
        { id: '2', price: 100, nameEn: 'Regular Product' },
        { id: '3', price: 200, nameEn: 'Premium Product' },
      ];

      mockCacheManager.get.mockResolvedValue(null);
      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (prisma.product.count as jest.Mock).mockResolvedValue(2);

      const result = await service.findAll({
        minPrice: 50,
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(2);
      expect(result.data.every((p) => p.price >= 50)).toBe(true);
    });

    it('should correctly sort mixed products by price ascending', async () => {
      const mockProducts = [
        { id: '1', price: 0, nameEn: 'Zero Price Product' },
        { id: '2', price: 50, nameEn: 'Low Price Product' },
        { id: '3', price: 100, nameEn: 'Mid Price Product' },
        { id: '4', price: 200, nameEn: 'High Price Product' },
      ];

      mockCacheManager.get.mockResolvedValue(null);
      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (prisma.product.count as jest.Mock).mockResolvedValue(4);

      const result = await service.findAll({
        sortBy: 'price',
        sortOrder: 'asc',
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(4);
      expect(result.data[0].price).toBe(0);
      expect(result.data[1].price).toBe(50);
      expect(result.data[2].price).toBe(100);
      expect(result.data[3].price).toBe(200);
    });
  });

  describe('isContactForPrice helper', () => {
    it('should return true for zero price', () => {
      expect(service.isContactForPrice({ price: 0 })).toBe(true);
    });

    it('should return true for string "0"', () => {
      expect(service.isContactForPrice({ price: '0' })).toBe(true);
    });

    it('should return false for non-zero price', () => {
      expect(service.isContactForPrice({ price: 100 })).toBe(false);
    });

    it('should return false for string non-zero price', () => {
      expect(service.isContactForPrice({ price: '100' })).toBe(false);
    });
  });
});
