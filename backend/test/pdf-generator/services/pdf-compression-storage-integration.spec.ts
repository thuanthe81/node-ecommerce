import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PDFCompressionService } from '../../../src/pdf-generator/services/pdf-compression.service';
import { PDFImageOptimizationMetricsService } from '../../../src/pdf-generator/services/pdf-image-optimization-metrics.service';
import { PDFImageOptimizationConfigService } from '../../../src/pdf-generator/services/pdf-image-optimization-config.service';
import { PDFImageValidationService } from '../../../src/pdf-generator/services/pdf-image-validation.service';
import { CompressedImageService } from '../../../src/pdf-generator/services/compressed-image.service';
import { CompressedImageConfigService } from '../../../src/pdf-generator/services/compressed-image-config.service';
import { CompressedImageStorageMonitoringService } from '../../../src/pdf-generator/services/compressed-image-storage-monitoring.service';
import { OptimizedImageResult } from '../../../src/pdf-generator/types/image-optimization.types';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

/**
 * Integration Tests for PDFCompressionService with Compressed Storage
 *
 * Tests the integration between PDFCompressionService and CompressedImageService
 * to verify that compressed image storage and retrieval works correctly.
 */
describe('PDFCompressionService - Compressed Storage Integration', () => {
  let compressionService: PDFCompressionService;
  let compressedImageService: CompressedImageService;
  let mockConfigService: jest.Mocked<ConfigService>;
  let testDir: string;

  beforeEach(async () => {
    // Create a mock ConfigService
    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        switch (key) {
          case 'UPLOAD_DIR':
            return 'uploads';
          case 'COMPRESSED_IMAGE_ENABLED':
            return 'true';
          case 'COMPRESSED_IMAGE_BASE_DIR':
            return 'uploads/compressed';
          default:
            return undefined;
        }
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PDFCompressionService,
        CompressedImageService,
        CompressedImageConfigService,
        CompressedImageStorageMonitoringService,
        PDFImageOptimizationMetricsService,
        PDFImageOptimizationConfigService,
        PDFImageValidationService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    compressionService = module.get<PDFCompressionService>(PDFCompressionService);
    compressedImageService = module.get<CompressedImageService>(CompressedImageService);

    // Create a temporary test directory
    testDir = path.join(process.cwd(), 'test-integration-images');
    if (fs.existsSync(testDir)) {
      await fs.promises.rm(testDir, { recursive: true, force: true });
    }
    await fs.promises.mkdir(testDir, { recursive: true });

    // Clean up compressed images directory to ensure clean state
    const compressedDir = path.join(process.cwd(), 'uploads', 'compressed');
    if (fs.existsSync(compressedDir)) {
      try {
        await fs.promises.rm(compressedDir, { recursive: true, force: true });
      } catch (error) {
        console.warn('Failed to clean up compressed directory in beforeEach:', error.message);
      }
    }
  });

  afterEach(async () => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      await fs.promises.rm(testDir, { recursive: true, force: true });
    }

    // Clean up compressed images directory with retry logic
    const compressedDir = path.join(process.cwd(), 'uploads', 'compressed');
    if (fs.existsSync(compressedDir)) {
      try {
        await fs.promises.rm(compressedDir, { recursive: true, force: true });
      } catch (error) {
        // Retry once more if cleanup fails
        try {
          await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
          await fs.promises.rm(compressedDir, { recursive: true, force: true });
        } catch (retryError) {
          console.warn('Failed to clean up compressed directory:', retryError.message);
        }
      }
    }
  });

  /**
   * Helper function to create a test image file
   */
  async function createTestImageFile(
    filePath: string,
    width: number = 200,
    height: number = 200
  ): Promise<string> {
    const fullPath = path.join(testDir, filePath);
    const dir = path.dirname(fullPath);

    // Ensure directory exists
    await fs.promises.mkdir(dir, { recursive: true });

    // Create test image
    const imageBuffer = await sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 128, g: 128, b: 128 }
      }
    }).jpeg({ quality: 80 }).toBuffer();

    await fs.promises.writeFile(fullPath, imageBuffer);
    return fullPath;
  }

  it('should integrate compressed storage with image optimization - first optimization saves, second retrieves', async () => {
    // Create a test image
    const imagePath = await createTestImageFile('test-integration/sample.jpg');

    // First optimization - should perform fresh optimization and save to storage
    const firstResult = await compressionService.optimizeImageForPDF(imagePath, 'photo');

    // Verify first optimization succeeded
    expect(firstResult).toBeDefined();
    expect(firstResult.error).toBeUndefined();
    expect(firstResult.optimizedBuffer).toBeDefined();
    expect(firstResult.optimizedSize).toBeGreaterThan(0);

    // Verify image was saved to compressed storage
    const hasCompressed = await compressedImageService.hasCompressedImage(imagePath);
    expect(hasCompressed).toBe(true);

    // Second optimization - should retrieve from storage
    const secondResult = await compressionService.optimizeImageForPDF(imagePath, 'photo');

    // Verify second optimization succeeded
    expect(secondResult).toBeDefined();
    expect(secondResult.error).toBeUndefined();
    expect(secondResult.optimizedBuffer).toBeDefined();

    // Verify results are consistent
    expect(secondResult.optimizedSize).toBe(firstResult.optimizedSize);
    expect(Buffer.compare(secondResult.optimizedBuffer!, firstResult.optimizedBuffer!)).toBe(0);

    // Verify second result came from storage (technique should be 'storage')
    expect(secondResult.metadata.technique).toBe('storage');

    // Verify processing time for retrieval is minimal (should be 0 or very small)
    expect(secondResult.processingTime).toBeLessThanOrEqual(firstResult.processingTime);

    console.log(`Integration test completed:`);
    console.log(`  First optimization: ${firstResult.processingTime}ms, technique: ${firstResult.metadata.technique}`);
    console.log(`  Second optimization: ${secondResult.processingTime}ms, technique: ${secondResult.metadata.technique}`);
    console.log(`  Image size: ${firstResult.optimizedSize} bytes`);
  }, 30000); // 30 second timeout

  it('should handle storage failures gracefully and continue with optimization', async () => {
    // Create a test image
    const imagePath = await createTestImageFile('test-graceful/sample.jpg');

    // Mock storage failure for saveCompressedImage
    const originalSave = compressedImageService.saveCompressedImage;
    jest.spyOn(compressedImageService, 'saveCompressedImage').mockRejectedValue(new Error('Storage failure'));

    // Optimization should still succeed even if storage fails
    const result = await compressionService.optimizeImageForPDF(imagePath, 'photo');

    // Verify optimization succeeded despite storage failure
    expect(result).toBeDefined();
    expect(result.error).toBeUndefined();
    expect(result.optimizedBuffer).toBeDefined();
    expect(result.optimizedSize).toBeGreaterThan(0);

    // Restore original method
    jest.restoreAllMocks();
  }, 15000);

  it('should handle retrieval failures gracefully and perform fresh optimization', async () => {
    // Create a test image
    const imagePath = await createTestImageFile('test-retrieval-failure/sample.jpg');

    // Mock retrieval failure for getCompressedImage
    jest.spyOn(compressedImageService, 'getCompressedImage').mockRejectedValue(new Error('Retrieval failure'));

    // Optimization should succeed by performing fresh optimization
    const result = await compressionService.optimizeImageForPDF(imagePath, 'photo');

    // Verify optimization succeeded despite retrieval failure
    expect(result).toBeDefined();
    expect(result.error).toBeUndefined();
    expect(result.optimizedBuffer).toBeDefined();
    expect(result.optimizedSize).toBeGreaterThan(0);

    // Verify it performed fresh optimization (not from storage)
    expect(result.metadata.technique).not.toBe('storage');

    // Restore original method
    jest.restoreAllMocks();
  }, 15000);

  it('should provide storage metrics through compression service', async () => {
    // Create and optimize a few test images
    const imagePaths = [
      await createTestImageFile('test-metrics/image1.jpg'),
      await createTestImageFile('test-metrics/image2.jpg'),
      await createTestImageFile('test-metrics/image3.jpg'),
    ];

    // Optimize all images (should save to storage)
    for (const imagePath of imagePaths) {
      await compressionService.optimizeImageForPDF(imagePath, 'photo');
    }

    // Get storage metrics through compression service
    const metrics = await compressionService.getCompressedImageStorageMetrics();

    // Verify metrics are available
    expect(metrics).toBeDefined();
    expect(typeof metrics.totalStorageSize).toBe('number');
    expect(typeof metrics.totalCompressedImages).toBe('number');
    expect(typeof metrics.reuseRate).toBe('number');
    expect(typeof metrics.averageCompressionRatio).toBe('number');
    expect(typeof metrics.storageUtilization).toBe('number');

    // Verify some images were stored
    expect(metrics.totalCompressedImages).toBeGreaterThan(0);
    expect(metrics.totalStorageSize).toBeGreaterThan(0);

    console.log('Storage metrics:', metrics);
  }, 20000);

  it('should check compressed image existence correctly', async () => {
    // Create a test image
    const imagePath = await createTestImageFile('test-existence/sample.jpg');

    // Initially, compressed image should not exist
    const existsInitially = await compressionService.hasCompressedImage(imagePath);
    expect(existsInitially).toBe(false);

    // Optimize the image (should save to storage)
    await compressionService.optimizeImageForPDF(imagePath, 'photo');

    // Now compressed image should exist
    const existsAfterOptimization = await compressionService.hasCompressedImage(imagePath);
    expect(existsAfterOptimization).toBe(true);
  }, 15000);

  it('should maintain consistency between original and retrieved images', async () => {
    // Create a test image
    const imagePath = await createTestImageFile('test-consistency/sample.jpg', 300, 300);

    // Perform first optimization
    const originalResult = await compressionService.optimizeImageForPDF(imagePath, 'logo');

    // Perform second optimization (should retrieve from storage)
    const retrievedResult = await compressionService.optimizeImageForPDF(imagePath, 'logo');

    // Verify consistency
    expect(retrievedResult.originalSize).toBe(originalResult.originalSize);
    expect(retrievedResult.optimizedSize).toBe(originalResult.optimizedSize);
    expect(retrievedResult.compressionRatio).toBeCloseTo(originalResult.compressionRatio, 6);
    expect(retrievedResult.format).toBe(originalResult.format);

    // Verify dimensions consistency
    expect(retrievedResult.dimensions.original.width).toBe(originalResult.dimensions.original.width);
    expect(retrievedResult.dimensions.original.height).toBe(originalResult.dimensions.original.height);
    expect(retrievedResult.dimensions.optimized.width).toBe(originalResult.dimensions.optimized.width);
    expect(retrievedResult.dimensions.optimized.height).toBe(originalResult.dimensions.optimized.height);

    // Verify metadata consistency (excluding technique and processing time)
    expect(retrievedResult.metadata.contentType).toBe(originalResult.metadata.contentType);
    expect(retrievedResult.metadata.qualityUsed).toBe(originalResult.metadata.qualityUsed);
    expect(retrievedResult.metadata.formatConverted).toBe(originalResult.metadata.formatConverted);
    expect(retrievedResult.metadata.originalFormat).toBe(originalResult.metadata.originalFormat);

    // Verify buffer content is identical
    expect(Buffer.compare(retrievedResult.optimizedBuffer!, originalResult.optimizedBuffer!)).toBe(0);
  }, 20000);
});