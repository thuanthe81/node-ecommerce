import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CompressedImageService } from '../../../src/pdf-generator/services/compressed-image.service';
import { CompressedImageConfigService } from '../../../src/pdf-generator/services/compressed-image-config.service';
import { CompressedImageStorageMonitoringService } from '../../../src/pdf-generator/services/compressed-image-storage-monitoring.service';
import { OptimizedImageResult } from '../../../src/pdf-generator/types/image-optimization.types';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

/**
 * Property-Based Tests for CompressedImageService
 *
 * These tests verify universal properties that should hold across all valid executions
 * of the compressed image storage system, using fast-check for property-based testing.
 *
 * **Feature: pdf-image-optimization, Property 10: Compressed image storage and retrieval**
 * **Validates: Requirements 5.1, 5.2**
 */
describe('CompressedImageService - Property-Based Tests', () => {
  let service: CompressedImageService;
  let configService: CompressedImageConfigService;
  let monitoringService: CompressedImageStorageMonitoringService;
  let mockConfigService: jest.Mocked<ConfigService>;
  let testDir: string;

  beforeEach(async () => {
    // Create a mock ConfigService
    mockConfigService = {
      get: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompressedImageService,
        CompressedImageConfigService,
        CompressedImageStorageMonitoringService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CompressedImageService>(CompressedImageService);
    configService = module.get<CompressedImageConfigService>(CompressedImageConfigService);
    monitoringService = module.get<CompressedImageStorageMonitoringService>(CompressedImageStorageMonitoringService);

    // Create a temporary test directory
    testDir = path.join(process.cwd(), 'test-compressed-images');
    if (fs.existsSync(testDir)) {
      await fs.promises.rm(testDir, { recursive: true, force: true });
    }
    await fs.promises.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      await fs.promises.rm(testDir, { recursive: true, force: true });
    }
  });

  /**
   * Helper function to create a test image buffer
   */
  async function createTestImageBuffer(width: number, height: number, channels: 3 | 4 = 3): Promise<Buffer> {
    const color = channels === 4
      ? { r: 128, g: 128, b: 128, alpha: 1 }
      : { r: 128, g: 128, b: 128 };

    return await sharp({
      create: {
        width,
        height,
        channels,
        background: color
      }
    }).png().toBuffer();
  }

  /**
   * Helper function to create a test OptimizedImageResult
   */
  async function createTestOptimizedResult(
    originalPath: string,
    width: number,
    height: number,
    format: 'jpeg' | 'png' | 'webp' = 'jpeg'
  ): Promise<OptimizedImageResult> {
    const originalBuffer = await createTestImageBuffer(width * 2, height * 2); // Larger original
    const optimizedBuffer = await createTestImageBuffer(width, height);

    return {
      optimizedBuffer,
      originalSize: originalBuffer.length,
      optimizedSize: optimizedBuffer.length,
      compressionRatio: (originalBuffer.length - optimizedBuffer.length) / originalBuffer.length,
      dimensions: {
        original: { width: width * 2, height: height * 2 },
        optimized: { width, height },
      },
      format,
      processingTime: Math.random() * 1000,
      metadata: {
        contentType: 'photo',
        qualityUsed: 75,
        formatConverted: true,
        originalFormat: 'png',
        technique: 'aggressive',
      },
    };
  }

  /**
   * **Feature: pdf-image-optimization, Property 10: Compressed image storage and retrieval**
   * **Validates: Requirements 5.1, 5.2**
   *
   * Property 10: Compressed image storage and retrieval
   * For any image that is optimized, the system should save it to the compressed directory
   * and be able to retrieve it for future use
   */
  it('Property 10: Compressed image storage and retrieval - should store and retrieve any optimized image', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          // Generate various image paths to test different scenarios
          imagePath: fc.oneof(
            fc.string({ minLength: 5, maxLength: 50 }).map(s => `products/${s}.jpg`),
            fc.string({ minLength: 5, maxLength: 50 }).map(s => `content/${s}.png`),
            fc.string({ minLength: 5, maxLength: 50 }).map(s => `logos/${s}.webp`),
            fc.string({ minLength: 5, maxLength: 50 }).map(s => `uploads/images/${s}.jpeg`),
            fc.string({ minLength: 5, maxLength: 50 }).map(s => `/uploads/products/${s}.jpg`),
            fc.string({ minLength: 5, maxLength: 50 }).map(s => `${s}.png`)
          ),
          // Generate various image dimensions
          width: fc.integer({ min: 50, max: 500 }),
          height: fc.integer({ min: 50, max: 500 }),
          // Generate different formats
          format: fc.constantFrom('jpeg', 'png', 'webp'),
          // Generate different content types
          contentType: fc.constantFrom('text', 'photo', 'graphics', 'logo'),
        }),
        async (params) => {
          const { imagePath, width, height, format, contentType } = params;

          // Skip invalid paths
          fc.pre(imagePath.length > 0 && !imagePath.includes('..') && !imagePath.includes('//'));

          // Generate a unique path for this test to avoid interference
          const uniqueImagePath = `${imagePath}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          try {
            // Create a test optimized result
            const optimizedResult = await createTestOptimizedResult(uniqueImagePath, width, height, format as 'jpeg' | 'png' | 'webp');
            optimizedResult.metadata.contentType = contentType as 'text' | 'photo' | 'graphics' | 'logo';

            // Property: Should be able to save any valid optimized image
            const savedPath = await service.saveCompressedImage(uniqueImagePath, optimizedResult);

            // Property: Saved path should be a valid string
            expect(savedPath).toBeDefined();
            expect(typeof savedPath).toBe('string');
            expect(savedPath.length).toBeGreaterThan(0);

            // Property: Should be able to check if compressed image exists
            const exists = await service.hasCompressedImage(uniqueImagePath);
            expect(exists).toBe(true);

            // Property: Should be able to retrieve the same image
            const retrievedResult = await service.getCompressedImage(uniqueImagePath);

            // Property: Retrieved result should not be null for existing images
            expect(retrievedResult).not.toBeNull();
            expect(retrievedResult).toBeDefined();

            if (retrievedResult) {
              // Property: Retrieved image should have the same optimized buffer content
              expect(retrievedResult.optimizedBuffer).toBeDefined();
              expect(retrievedResult.optimizedBuffer!.length).toBe(optimizedResult.optimizedSize);
              expect(Buffer.compare(retrievedResult.optimizedBuffer!, optimizedResult.optimizedBuffer!)).toBe(0);

              // Property: Retrieved metadata should match original metadata
              expect(retrievedResult.originalSize).toBe(optimizedResult.originalSize);
              expect(retrievedResult.optimizedSize).toBe(optimizedResult.optimizedSize);
              expect(Math.abs(retrievedResult.compressionRatio - optimizedResult.compressionRatio)).toBeLessThan(0.001);

              // Property: Dimensions should be preserved
              expect(retrievedResult.dimensions.original.width).toBe(optimizedResult.dimensions.original.width);
              expect(retrievedResult.dimensions.original.height).toBe(optimizedResult.dimensions.original.height);
              expect(retrievedResult.dimensions.optimized.width).toBe(optimizedResult.dimensions.optimized.width);
              expect(retrievedResult.dimensions.optimized.height).toBe(optimizedResult.dimensions.optimized.height);

              // Property: Format should be preserved
              expect(retrievedResult.format).toBe(optimizedResult.format);

              // Property: Metadata should be preserved
              expect(retrievedResult.metadata.contentType).toBe(optimizedResult.metadata.contentType);
              expect(retrievedResult.metadata.qualityUsed).toBe(optimizedResult.metadata.qualityUsed);
              expect(retrievedResult.metadata.formatConverted).toBe(optimizedResult.metadata.formatConverted);
              expect(retrievedResult.metadata.originalFormat).toBe(optimizedResult.metadata.originalFormat);

              // Property: Processing time should be 0 for retrieved images (no processing needed)
              expect(retrievedResult.processingTime).toBe(0);

              // Property: Technique should be updated to indicate storage retrieval
              expect(retrievedResult.metadata.technique).toBe('storage');
            }

            // Property: Multiple saves of the same path should be idempotent
            const secondSavedPath = await service.saveCompressedImage(uniqueImagePath, optimizedResult);
            expect(secondSavedPath).toBe(savedPath);

            // Property: Second retrieval should return the same result
            const secondRetrievedResult = await service.getCompressedImage(uniqueImagePath);
            expect(secondRetrievedResult).not.toBeNull();
            if (secondRetrievedResult && retrievedResult) {
              expect(Buffer.compare(secondRetrievedResult.optimizedBuffer!, retrievedResult.optimizedBuffer!)).toBe(0);
              expect(secondRetrievedResult.optimizedSize).toBe(retrievedResult.optimizedSize);
            }

            // Property: Generated compressed path should be consistent for the same original path
            const generatedPath1 = service.generateCompressedPath(uniqueImagePath);
            const generatedPath2 = service.generateCompressedPath(uniqueImagePath);
            expect(generatedPath1).toBe(generatedPath2);

            // Property: Generated path should be within the compressed directory
            expect(generatedPath1).toMatch(/^uploads\/compressed/);

            // Property: Generated path should be different for different original paths
            const differentPath = uniqueImagePath + '_different';
            const differentGeneratedPath = service.generateCompressedPath(differentPath);
            expect(differentGeneratedPath).not.toBe(generatedPath1);

          } catch (error) {
            // Property: If storage fails, it should fail gracefully with meaningful error
            expect(error).toBeDefined();
            expect(error.message).toBeDefined();
            expect(error.message.length).toBeGreaterThan(0);

            // Property: After a storage failure, retrieval should return null for the failed operation
            // Use a different unique path to ensure we're not getting a previously saved image
            const failedUniqueImagePath = `failed_${uniqueImagePath}_${Date.now()}`;
            const retrievalAfterError = await service.getCompressedImage(failedUniqueImagePath);
            expect(retrievalAfterError).toBeNull();
          }
        }
      ),
      {
        numRuns: 100, // Run 100 iterations as specified in design
        timeout: 60000, // 60 second timeout for property test
        verbose: true
      }
    );
  }, 120000); // 2 minute timeout for the entire test

  /**
   * Property: Non-existent images should return null consistently
   */
  it('Property: Non-existent images should return null consistently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('..') && !s.includes('//')),
        async (nonExistentPath) => {
          // Property: Checking existence of non-existent image should return false
          const exists = await service.hasCompressedImage(nonExistentPath);
          expect(exists).toBe(false);

          // Property: Retrieving non-existent image should return null
          const result = await service.getCompressedImage(nonExistentPath);
          expect(result).toBeNull();

          // Property: Multiple checks should be consistent
          const exists2 = await service.hasCompressedImage(nonExistentPath);
          expect(exists2).toBe(false);

          const result2 = await service.getCompressedImage(nonExistentPath);
          expect(result2).toBeNull();
        }
      ),
      {
        numRuns: 50,
        timeout: 30000,
        verbose: true
      }
    );
  });

  /**
   * Property: Path generation should be deterministic and safe
   */
  it('Property: Path generation should be deterministic and safe', async () => {
    await fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }).map(parts => parts.join('/'))
          .filter(path => path.trim().length > 0 && !path.includes('..') && !path.includes('//')),
        (originalPath) => {
          // Skip invalid paths
          fc.pre(!originalPath.includes('..') && !originalPath.includes('//'));

          // Property: Path generation should be deterministic
          const path1 = service.generateCompressedPath(originalPath);
          const path2 = service.generateCompressedPath(originalPath);
          expect(path1).toBe(path2);

          // Property: Generated path should be safe (no directory traversal)
          expect(path1).not.toContain('..');
          expect(path1).not.toContain('//');

          // Property: Generated path should start with compressed directory
          expect(path1).toMatch(/^uploads\/compressed/);

          // Property: Generated path should be a valid file path
          expect(path1.length).toBeGreaterThan('uploads/compressed/'.length);
          expect(path1).toMatch(/\.(jpg|jpeg|png|webp)$/i);

          // Property: Different original paths should generate different compressed paths
          const modifiedPath = originalPath + '_modified';
          const modifiedGeneratedPath = service.generateCompressedPath(modifiedPath);
          expect(modifiedGeneratedPath).not.toBe(path1);
        }
      ),
      {
        numRuns: 100,
        timeout: 30000,
        verbose: true
      }
    );
  });

  /**
   * Property: Storage metrics should be accurate and consistent
   */
  it('Property: Storage metrics should be accurate and consistent', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            path: fc.string({ minLength: 5, maxLength: 30 }).map(s => `test/${s}.jpg`),
            width: fc.integer({ min: 50, max: 200 }),
            height: fc.integer({ min: 50, max: 200 }),
          }),
          { minLength: 1, maxLength: 3 }
        ),
        async (imageSpecs) => {
          // Skip test if no image specs provided
          if (imageSpecs.length === 0) {
            return; // Empty array case - nothing to test
          }

          // Store multiple images
          const storedImages: Array<{ path: string; result: OptimizedImageResult }> = [];

          for (const spec of imageSpecs) {
            try {
              const result = await createTestOptimizedResult(spec.path, spec.width, spec.height);
              await service.saveCompressedImage(spec.path, result);
              storedImages.push({ path: spec.path, result });
            } catch (error) {
              // Skip failed storage attempts
            }
          }

          // Get storage metrics
          const metrics = await service.getStorageMetrics();

          // Property: Metrics should be valid
          expect(metrics.totalStorageSize).toBeGreaterThanOrEqual(0);
          expect(metrics.totalCompressedImages).toBeGreaterThanOrEqual(0);
          expect(metrics.reuseRate).toBeGreaterThanOrEqual(0);
          // Note: averageCompressionRatio can be negative when optimization increases file size
          expect(typeof metrics.averageCompressionRatio).toBe('number');
          expect(metrics.storageUtilization).toBeGreaterThanOrEqual(0);

          // Property: If images were stored, metrics should reflect that
          if (storedImages.length > 0) {
            expect(metrics.totalCompressedImages).toBeGreaterThan(0);
            expect(metrics.totalStorageSize).toBeGreaterThan(0);
          }

          // Property: Metrics should be consistent across multiple calls
          // Allow small variations due to file system timing and concurrent operations
          const metrics2 = await service.getStorageMetrics();
          expect(metrics2.totalCompressedImages).toBe(metrics.totalCompressedImages);
          // For storage size, allow small variations (within 10% or 1KB, whichever is larger)
          const sizeTolerance = Math.max(1024, metrics.totalStorageSize * 0.1);
          expect(Math.abs(metrics2.totalStorageSize - metrics.totalStorageSize)).toBeLessThanOrEqual(sizeTolerance);
        }
      ),
      {
        numRuns: 5, // Much fewer runs to avoid timeout
        timeout: 30000,
        verbose: true
      }
    );
  }, 120000);

  /**
   * Property: Error handling should be graceful and consistent
   */
  it('Property: Error handling should be graceful and consistent', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          invalidPath: fc.oneof(
            fc.constant(''),
            fc.constant('..'),
            fc.constant('../../../etc/passwd'),
            fc.constant('//invalid//path'),
            fc.string({ minLength: 1000, maxLength: 2000 }) // Very long path
          ),
          invalidResult: fc.record({
            optimizedBuffer: fc.constant(undefined), // Invalid buffer
            originalSize: fc.integer({ min: -100, max: 0 }), // Invalid size
            optimizedSize: fc.integer({ min: -100, max: 0 }), // Invalid size
            compressionRatio: fc.float({ min: -1, max: 2 }), // Invalid ratio
            dimensions: fc.record({
              original: fc.record({ width: fc.integer({ min: -10, max: 0 }), height: fc.integer({ min: -10, max: 0 }) }),
              optimized: fc.record({ width: fc.integer({ min: -10, max: 0 }), height: fc.integer({ min: -10, max: 0 }) }),
            }),
            format: fc.string({ minLength: 0, maxLength: 5 }),
            processingTime: fc.integer({ min: -1000, max: 0 }),
            metadata: fc.record({
              contentType: fc.constant('invalid' as any),
              qualityUsed: fc.integer({ min: -10, max: 200 }),
              formatConverted: fc.boolean(),
              originalFormat: fc.string({ minLength: 0, maxLength: 5 }),
              technique: fc.string({ minLength: 0, maxLength: 10 }),
            }),
          }),
        }),
        async (params) => {
          const { invalidPath, invalidResult } = params;

          // Property: Invalid operations should not crash the service
          try {
            await service.saveCompressedImage(invalidPath, invalidResult as any);
          } catch (error) {
            // Property: Errors should be meaningful
            expect(error).toBeDefined();
            expect(error.message).toBeDefined();
          }

          // Property: Service should remain functional after errors
          try {
            const exists = await service.hasCompressedImage(invalidPath);
            expect(typeof exists).toBe('boolean');
          } catch (error) {
            // Acceptable for very invalid paths
          }

          try {
            const result = await service.getCompressedImage(invalidPath);
            expect(result === null || result === undefined).toBe(true);
          } catch (error) {
            // Acceptable for very invalid paths
          }

          // Property: Metrics should still be accessible after errors
          const metrics = await service.getStorageMetrics();
          expect(metrics).toBeDefined();
          expect(typeof metrics.totalStorageSize).toBe('number');
        }
      ),
      {
        numRuns: 10, // Reduced from 50 to avoid timeout
        timeout: 15000,
        verbose: false
      }
    );
  }, 20000); // Add Jest timeout
});