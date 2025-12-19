import { Test, TestingModule } from '@nestjs/testing';
import { ProductsImageService } from './products-image.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ProductsImageService', () => {
  let service: ProductsImageService;
  let prismaService: PrismaService;

  const mockProduct = {
    id: 'prod-1',
    slug: 'test-product',
    sku: 'SKU-001',
    nameEn: 'Test Product',
    nameVi: 'Sản phẩm test',
    descriptionEn: 'Test description',
    descriptionVi: 'Mô tả test',
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

  const mockImages = [
    {
      id: 'img-1',
      productId: 'prod-1',
      url: '/uploads/products/image1.jpg',
      altTextEn: 'Image 1',
      altTextVi: 'Hình 1',
      displayOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'img-2',
      productId: 'prod-1',
      url: '/uploads/products/image2.jpg',
      altTextEn: 'Image 2',
      altTextVi: 'Hình 2',
      displayOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'img-3',
      productId: 'prod-1',
      url: '/uploads/products/image3.jpg',
      altTextEn: 'Image 3',
      altTextVi: 'Hình 3',
      displayOrder: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockPrismaService = {
    product: {
      findUnique: jest.fn(),
    },
    productImage: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsImageService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ProductsImageService>(ProductsImageService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('getProductImages', () => {
    it('should return images ordered by displayOrder', async () => {
      // Setup: Product exists
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      // Setup: Images exist
      mockPrismaService.productImage.findMany.mockResolvedValue(mockImages);

      const result = await service.getProductImages('prod-1');

      expect(result).toEqual(mockImages);
      expect(mockPrismaService.productImage.findMany).toHaveBeenCalledWith({
        where: { productId: 'prod-1' },
        orderBy: { displayOrder: 'asc' },
      });
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.getProductImages('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteProductImage', () => {
    it('should delete image and normalize display order', async () => {
      // Setup: Product exists
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      // Setup: Image exists
      mockPrismaService.productImage.findFirst.mockResolvedValue(mockImages[1]);

      // Setup: Image count (not the last image)
      mockPrismaService.productImage.count.mockResolvedValue(3);

      // Setup: Transaction mock
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          productImage: {
            delete: jest.fn().mockResolvedValue(mockImages[1]),
            findMany: jest.fn().mockResolvedValue([mockImages[0], mockImages[2]]),
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      const result = await service.deleteProductImage('prod-1', 'img-2');

      expect(result).toEqual({ message: 'Image deleted successfully' });
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteProductImage('non-existent', 'img-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if image not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.productImage.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteProductImage('prod-1', 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateImageMetadata', () => {
    it('should update alt text for an image', async () => {
      // Setup: Product exists
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      // Setup: Image exists
      mockPrismaService.productImage.findFirst.mockResolvedValue(mockImages[0]);

      // Setup: Update mock
      const updatedImage = {
        ...mockImages[0],
        altTextEn: 'Updated Alt Text',
        altTextVi: 'Văn bản thay thế đã cập nhật',
      };
      mockPrismaService.productImage.update.mockResolvedValue(updatedImage);

      const result = await service.updateImageMetadata('prod-1', 'img-1', {
        altTextEn: 'Updated Alt Text',
        altTextVi: 'Văn bản thay thế đã cập nhật',
      });

      expect(result).toEqual(updatedImage);
      expect(mockPrismaService.productImage.update).toHaveBeenCalledWith({
        where: { id: 'img-1' },
        data: {
          altTextEn: 'Updated Alt Text',
          altTextVi: 'Văn bản thay thế đã cập nhật',
        },
      });
    });

    it('should update display order for an image', async () => {
      // Setup: Product exists
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      // Setup: Image exists
      mockPrismaService.productImage.findFirst.mockResolvedValue(mockImages[0]);

      // Setup: Update mock
      const updatedImage = { ...mockImages[0], displayOrder: 5 };
      mockPrismaService.productImage.update.mockResolvedValue(updatedImage);

      const result = await service.updateImageMetadata('prod-1', 'img-1', {
        displayOrder: 5,
      });

      expect(result).toEqual(updatedImage);
      expect(mockPrismaService.productImage.update).toHaveBeenCalledWith({
        where: { id: 'img-1' },
        data: { displayOrder: 5 },
      });
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(
        service.updateImageMetadata('non-existent', 'img-1', {
          altTextEn: 'New Alt',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if image not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.productImage.findFirst.mockResolvedValue(null);

      await expect(
        service.updateImageMetadata('prod-1', 'non-existent', {
          altTextEn: 'New Alt',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
