import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from '../../src/products/products.service';
import { ProductsImageService } from '../../src/products/products-image.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

describe('ProductsService', () => {
  let service: ProductsService;
  let prismaService: PrismaService;
  let cacheManager: any;
  let productsImageService: ProductsImageService;

  const mockCategory = {
    id: 'cat-1',
    slug: 'handmade-jewelry',
    nameEn: 'Handmade Jewelry',
    nameVi: 'Trang sức thủ công',
    descriptionEn: 'Beautiful handmade jewelry',
    descriptionVi: 'Trang sức thủ công đẹp',
    parentId: null,
    imageUrl: null,
    displayOrder: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProduct = {
    id: 'prod-1',
    slug: 'silver-necklace',
    sku: 'SKU-001',
    nameEn: 'Silver Necklace',
    nameVi: 'Dây chuyền bạc',
    descriptionEn: 'Beautiful silver necklace',
    descriptionVi: 'Dây chuyền bạc đẹp',
    price: 99.99,
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

  const mockPrismaService = {
    product: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
    review: {
      aggregate: jest.fn(),
    },
    cartItem: {
      deleteMany: jest.fn(),
    },
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockProductsImageService = {
    uploadProductImage: jest.fn(),
    uploadMultipleImages: jest.fn(),
    deleteProductImage: jest.fn(),
    updateImageOrder: jest.fn(),
    getProductImages: jest.fn(),
  };

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
    prismaService = module.get<PrismaService>(PrismaService);
    cacheManager = module.get(CACHE_MANAGER);
    productsImageService = module.get<ProductsImageService>(ProductsImageService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createProductDto = {
      slug: 'new-product',
      sku: 'SKU-NEW',
      nameEn: 'New Product',
      nameVi: 'Sản phẩm mới',
      descriptionEn: 'Description',
      descriptionVi: 'Mô tả',
      price: 50.0,
      stockQuantity: 20,
      lowStockThreshold: 5,
      categoryId: 'cat-1',
      isActive: true,
      isFeatured: false,
    };

    it('should successfully create a product', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.product.create.mockResolvedValue({
        ...mockProduct,
        ...createProductDto,
        category: mockCategory,
        images: [],
      });

      const result = await service.create(createProductDto);

      expect(result).toHaveProperty('id');
      expect(result.nameEn).toBe(createProductDto.nameEn);
      expect(mockPrismaService.product.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if slug already exists', async () => {
      mockPrismaService.product.findUnique.mockResolvedValueOnce(mockProduct);

      await expect(service.create(createProductDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if SKU already exists', async () => {
      mockPrismaService.product.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockProduct);

      await expect(service.create(createProductDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if category not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.create(createProductDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const query = { page: 1, limit: 20 };
      const products = [mockProduct];

      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.product.findMany.mockResolvedValue(products);
      mockPrismaService.product.count.mockResolvedValue(1);

      const result = await service.findAll(query);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should return cached results if available', async () => {
      const query = { page: 1, limit: 20 };
      const cachedResult = {
        data: [mockProduct],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };

      mockCacheManager.get.mockResolvedValue(cachedResult);

      const result = await service.findAll(query);

      expect(result).toEqual(cachedResult);
      expect(mockPrismaService.product.findMany).not.toHaveBeenCalled();
    });

    it('should filter products by search term', async () => {
      const query = { search: 'silver', page: 1, limit: 20 };

      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);
      mockPrismaService.product.count.mockResolvedValue(1);

      await service.findAll(query);

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a product by ID', async () => {
      const productWithDetails = {
        ...mockProduct,
        category: mockCategory,
        images: [],
        reviews: [],
        _count: { reviews: 0 },
      };

      mockPrismaService.product.findUnique.mockResolvedValue(
        productWithDetails,
      );
      mockPrismaService.review.aggregate.mockResolvedValue({
        _avg: { rating: 4.5 },
      });

      const result = await service.findOne(mockProduct.id);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('averageRating');
      expect(result.averageRating).toBe(4.5);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findBySlug', () => {
    it('should return a product by slug with related products', async () => {
      const productWithDetails = {
        ...mockProduct,
        category: mockCategory,
        images: [],
        reviews: [],
        _count: { reviews: 0 },
      };

      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.product.findUnique.mockResolvedValue(
        productWithDetails,
      );
      mockPrismaService.review.aggregate.mockResolvedValue({
        _avg: { rating: 4.5 },
      });
      mockPrismaService.product.findMany.mockResolvedValue([]);

      const result = await service.findBySlug(mockProduct.slug);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('relatedProducts');
      expect(mockCacheManager.set).toHaveBeenCalled();
    });

    it('should throw NotFoundException if product not found', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.findBySlug('non-existent-slug')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateProductDto = {
      nameEn: 'Updated Product',
      price: 79.99,
    };

    it('should successfully update a product', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.product.update.mockResolvedValue({
        ...mockProduct,
        ...updateProductDto,
        category: mockCategory,
        images: [],
      });

      const result = await service.update(mockProduct.id, updateProductDto);

      expect(result.nameEn).toBe(updateProductDto.nameEn);
      expect(mockCacheManager.del).toHaveBeenCalled();
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', updateProductDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should successfully delete a product', async () => {
      const productWithCounts = {
        ...mockProduct,
        _count: { orderItems: 0, cartItems: 0 },
      };

      mockPrismaService.product.findUnique.mockResolvedValue(
        productWithCounts,
      );
      mockPrismaService.product.delete.mockResolvedValue(mockProduct);

      const result = await service.remove(mockProduct.id);

      expect(result).toEqual(mockProduct);
      expect(mockCacheManager.del).toHaveBeenCalled();
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if product has been ordered', async () => {
      const productWithOrders = {
        ...mockProduct,
        _count: { orderItems: 5, cartItems: 0 },
      };

      mockPrismaService.product.findUnique.mockResolvedValue(
        productWithOrders,
      );

      await expect(service.remove(mockProduct.id)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('search', () => {
    it('should return products matching search term', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);

      const result = await service.search('silver', 10);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockProduct);
    });
  });
});
