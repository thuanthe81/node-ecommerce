import { Test, TestingModule } from '@nestjs/testing';
import { ProductsImageService } from './products-image.service';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('ProductsImageService - Image Retrieval with Backward Compatibility', () => {
  let service: ProductsImageService;
  let prismaService: PrismaService;

  const testUploadDir = path.join(process.cwd(), 'test-uploads');
  const testProductId = '123e4567-e89b-12d3-a456-426614174000';
  const testFilename = 'test-image.jpg';

  beforeAll(async () => {
    // Set test upload directory
    process.env.UPLOAD_DIR = testUploadDir;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsImageService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              findUnique: jest.fn(),
            },
            productImage: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              createMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProductsImageService>(ProductsImageService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    // Clean up test directories
    try {
      await fs.rm(testUploadDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }

    // Create test directories
    await fs.mkdir(path.join(testUploadDir, 'products'), { recursive: true });
    await fs.mkdir(path.join(testUploadDir, 'products', 'thumbnails'), {
      recursive: true,
    });
  });

  afterAll(async () => {
    // Clean up test directories
    try {
      await fs.rm(testUploadDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore errors
    }
  });

  describe('resolveImagePath', () => {
    it('should find image in hierarchical location first', async () => {
      // Create hierarchical directory structure
      const hierarchicalDir = path.join(
        testUploadDir,
        'products',
        testProductId,
      );
      await fs.mkdir(hierarchicalDir, { recursive: true });

      // Create test image in hierarchical location
      const hierarchicalPath = path.join(hierarchicalDir, testFilename);
      await fs.writeFile(hierarchicalPath, 'test image data');

      // Test resolution
      const imageUrl = `/uploads/products/${testProductId}/${testFilename}`;
      const result = await service.resolveImagePath(imageUrl, false);

      expect(result).not.toBeNull();
      expect(result?.filePath).toBe(hierarchicalPath);
      expect(result?.isLegacy).toBe(false);
    });

    it('should fall back to legacy location if not found in hierarchical location', async () => {
      // Create test image in legacy location only
      const legacyPath = path.join(
        testUploadDir,
        'products',
        `${testProductId}-${testFilename}`,
      );
      await fs.writeFile(legacyPath, 'test image data');

      // Test resolution with new URL format (but file doesn't exist there)
      const imageUrl = `/uploads/products/${testProductId}/${testFilename}`;
      const result = await service.resolveImagePath(imageUrl, false);

      // Should not find it because the filename in legacy location has product ID prefix
      expect(result).toBeNull();
    });

    it('should find image in legacy flat directory', async () => {
      // Create test image in legacy location
      const legacyFilename = testFilename;
      const legacyPath = path.join(testUploadDir, 'products', legacyFilename);
      await fs.writeFile(legacyPath, 'test image data');

      // Test resolution with legacy URL format
      const imageUrl = `/uploads/products/${legacyFilename}`;
      const result = await service.resolveImagePath(imageUrl, false);

      expect(result).not.toBeNull();
      expect(result?.filePath).toBe(legacyPath);
      expect(result?.isLegacy).toBe(true);
    });

    it('should handle thumbnail paths correctly', async () => {
      // Create hierarchical directory structure with thumbnail
      const hierarchicalDir = path.join(
        testUploadDir,
        'products',
        testProductId,
      );
      const thumbnailDir = path.join(hierarchicalDir, 'thumbnails');
      await fs.mkdir(thumbnailDir, { recursive: true });

      // Create test thumbnail in hierarchical location
      const thumbnailPath = path.join(thumbnailDir, testFilename);
      await fs.writeFile(thumbnailPath, 'test thumbnail data');

      // Test resolution
      const imageUrl = `/uploads/products/${testProductId}/thumbnails/${testFilename}`;
      const result = await service.resolveImagePath(imageUrl, true);

      expect(result).not.toBeNull();
      expect(result?.filePath).toBe(thumbnailPath);
      expect(result?.isLegacy).toBe(false);
    });

    it('should return null if image not found in any location', async () => {
      const imageUrl = `/uploads/products/${testProductId}/nonexistent.jpg`;
      const result = await service.resolveImagePath(imageUrl, false);

      expect(result).toBeNull();
    });
  });

  describe('imageExists', () => {
    it('should return true if image exists in hierarchical location', async () => {
      // Create hierarchical directory structure
      const hierarchicalDir = path.join(
        testUploadDir,
        'products',
        testProductId,
      );
      await fs.mkdir(hierarchicalDir, { recursive: true });

      // Create test image
      const hierarchicalPath = path.join(hierarchicalDir, testFilename);
      await fs.writeFile(hierarchicalPath, 'test image data');

      const imageUrl = `/uploads/products/${testProductId}/${testFilename}`;
      const exists = await service.imageExists(imageUrl);

      expect(exists).toBe(true);
    });

    it('should return true if image exists in legacy location', async () => {
      // Create test image in legacy location
      const legacyPath = path.join(testUploadDir, 'products', testFilename);
      await fs.writeFile(legacyPath, 'test image data');

      const imageUrl = `/uploads/products/${testFilename}`;
      const exists = await service.imageExists(imageUrl);

      expect(exists).toBe(true);
    });

    it('should return false if image does not exist', async () => {
      const imageUrl = `/uploads/products/${testProductId}/nonexistent.jpg`;
      const exists = await service.imageExists(imageUrl);

      expect(exists).toBe(false);
    });
  });
});
