import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from '../../src/products/products.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ProductsImageService } from '../../src/products/products-image.service';

describe('ProductsService - Zero Price Products', () => {
  let service: ProductsService;

  const mockPrismaService = {};
  const mockCacheManager = {};
  const mockProductsImageService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: ProductsImageService, useValue: mockProductsImageService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  describe('isContactForPrice', () => {
    it('should return true for product with price 0', () => {
      const product = { price: 0 };
      expect(service.isContactForPrice(product)).toBe(true);
    });

    it('should return true for product with price 0.0', () => {
      const product = { price: 0.0 };
      expect(service.isContactForPrice(product)).toBe(true);
    });

    it('should return true for product with price "0"', () => {
      const product = { price: '0' };
      expect(service.isContactForPrice(product)).toBe(true);
    });

    it('should return true for product with price "0.00"', () => {
      const product = { price: '0.00' };
      expect(service.isContactForPrice(product)).toBe(true);
    });

    it('should return false for product with positive price', () => {
      const product = { price: 50.0 };
      expect(service.isContactForPrice(product)).toBe(false);
    });

    it('should return false for product with price "50.00"', () => {
      const product = { price: '50.00' };
      expect(service.isContactForPrice(product)).toBe(false);
    });

    it('should return false for product with very small positive price', () => {
      const product = { price: 0.01 };
      expect(service.isContactForPrice(product)).toBe(false);
    });
  });
});
