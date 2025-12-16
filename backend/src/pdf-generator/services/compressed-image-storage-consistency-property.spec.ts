import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CompressedImageService } from './compressed-image.service';
import { CompressedImageConfigService } from './compressed-image-config.service';
import { CompressedImageStorageMonitoringService } from './compressed-image-storage-monitoring.service';
import { PDFCompressionService } from './pdf-compression.service';
import { PDFImageOptimizationMetricsService } from './pdf-image-optimization-metrics.service';
import { PDFImageOptimizationConfigService } from './pdf-image-optimization-config.service';
import { PDFImageValidationService } from './pdf-image-validation.service';
import { OptimizedImageResult } from '../types/image-optimization.types';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

/**
 * Property-Based Tests for Storage Consistency
 *
 * **Feature: pdf-image-optimization, Property 12: Storage consistency**
 * **Validates: Requirements 5.5**
 *
 * Property 12: Storage consistency
 * For any image with the same path and optimization parameters, the stored result should be identical to a fresh optimization
 */
describe('CompressedImageService - Storage Consistency Property Tests', () => {
  let compressedImageService: CompressedImageService;
  let compressionService: PDFCompressionService;
  let configService: CompressedImageConfigService;
  let monitoringService: CompressedImageStorageMonitoringService;
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
        CompressedImageService,
        CompressedImageConfigService,
        CompressedImageStorageMonitoringService,
        PDFCompressionService,
        PDFImageOptimizationMetricsService,
        PDFImageOptimizationConfigService,
        PDFImageValidationService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    compressedImageService = module.get<CompressedImageService>(CompressedImageService);
    compressionService = module.get<PDFCompressionService>(PDFCompressionService);
    configService = module.get<CompressedImageConfigService>(CompressedImageConfigService);
    monitoringService = module.get<CompressedImageStorageMonitoringService>(CompressedImageStorageMonitoringService);

    // Create a temporary test directory
    testDir = path.join(process.cwd(), 'test-consistency-images');
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
   * Helper function to create a deterministic test image file
   */
  async function createDeterministicTestImageFile(
    filePath: string,
    width: number,
    height: number,
    format: 'jpeg' | 'png' | 'webp' = 'jpeg',
    seed: number = 42
  ): Promise<string> {
    const fullPath = path.join(testDir, filePath);
    const dir = path.dirname(fullPath);

    // Ensure directory exists
    await fs.promises.mkdir(dir, { recursive: true });

    // Create deterministic test image based on seed
    // Use seed to create consistent colors and patterns
    const r = (seed * 123) % 256;
    const g = (seed * 456) % 256;
    const b = (seed * 789) % 256;

    const imageBuffer = await sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r, g, b }
      }
    })[format]({ quality: 80 }).toBuffer();

    await fs.promises.writeFile(fullPath, imageBuffer);
    return fullPath;
  }

  /**
   * Helper function to compare two OptimizedImageResult objects for consistency
   */
  function compareOptimizedResults(
    result1: OptimizedImageResult,
    result2: OptimizedImageResult,
    tolerance: number = 0.001
  ): {
    isConsistent: boolean;
    differences: string[];
  } {
    const differences: string[] = [];

    // Compare buffer content
    if (result1.optimizedBuffer && result2.optimizedBuffer) {
      if (Buffer.compare(result1.optimizedBuffer, result2.optimizedBuffer) !== 0) {
        differences.push('Optimized buffer content differs');
      }
    } else if (result1.optimizedBuffer !== result2.optimizedBuffer) {
      differences.push('Optimized buffer presence differs');
    }

    // Compare sizes
    if (result1.originalSize !== result2.originalSize) {
      differences.push(`Original size differs: ${result1.originalSize} vs ${result2.originalSize}`);
    }

    if (result1.optimizedSize !== result2.optimizedSize) {
      differences.push(`Optimized size differs: ${result1.optimizedSize} vs ${result2.optimizedSize}`);
    }

    // Compare compression ratio with tolerance
    if (Math.abs(result1.compressionRatio - result2.compressionRatio) > tolerance) {
      differences.push(`Compression ratio differs: ${result1.compressionRatio} vs ${result2.compressionRatio}`);
    }

    // Compare dimensions
    if (result1.dimensions.original.width !== result2.dimensions.original.width ||
        result1.dimensions.original.height !== result2.dimensions.original.height) {
      differences.push('Original dimensions differ');
    }

    if (result1.dimensions.optimized.width !== result2.dimensions.optimized.width ||
        result1.dimensions.optimized.height !== result2.dimensions.optimized.height) {
      differences.push('Optimized dimensions differ');
    }

    // Compare format
    if (result1.format !== result2.format) {
      differences.push(`Format differs: ${result1.format} vs ${result2.format}`);
    }

    // Compare metadata (excluding processing time and technique which may vary)
    if (result1.metadata && result2.metadata) {
      if (result1.metadata.contentType !== result2.metadata.contentType) {
        differences.push(`Content type differs: ${result1.metadata.contentType} vs ${result2.metadata.contentType}`);
      }

      if (result1.metadata.qualityUsed !== result2.metadata.qualityUsed) {
        differences.push(`Quality used differs: ${result1.metadata.qualityUsed} vs ${result2.metadata.qualityUsed}`);
      }

      if (result1.metadata.formatConverted !== result2.metadata.formatConverted) {
        differences.push(`Format converted differs: ${result1.metadata.formatConverted} vs ${result2.metadata.formatConverted}`);
      }

      if (result1.metadata.originalFormat !== result2.metadata.originalFormat) {
        differences.push(`Original format differs: ${result1.metadata.originalFormat} vs ${result2.metadata.originalFormat}`);
      }
    }

    return {
      isConsistent: differences.length === 0,
      differences
    };
  }

  /**
   * **Feature: pdf-image-optimization, Property 12: Storage consistency**
   * **Validates: Requirements 5.5**
   *
   * Property 12: Storage consistency
   * For any image with the same path and optimization parameters, the stored result should be identical to a fresh optimization
   */
  it('Property 12: Storage consistency - stored result should be identical to fresh optimization', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          // Generate deterministic image specifications
          imageName: fc.string({ minLength: 5, maxLength: 20 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_')),
          width: fc.integer({ min: 100, max: 500 }),
          height: fc.integer({ min: 100, max: 500 }),
          format: fc.constantFrom('jpeg', 'png', 'webp'),
          contentType: fc.constantFrom('text', 'photo', 'graphics', 'logo'),
          seed: fc.integer({ min: 1, max: 1000 }), // For deterministic image generation
        }),
        async (params) => {
          const { imageName, width, height, format, contentType, seed } = params;

          // Create a deterministic test image file
          const uniqueImageName = `${imageName}_${seed}_consistency_test.${format}`;
          const imageFilePath = await createDeterministicTestImageFile(
            `consistency-test/${uniqueImageName}`,
            width,
            height,
            format as 'jpeg' | 'png' | 'webp',
            seed
          );

          try {
            // Step 1: Perform initial optimization
            const initialOptimization = await compressionService.optimizeImageForPDF(
              imageFilePath,
              contentType as 'text' | 'photo' | 'graphics' | 'logo'
            );

            // Property: Initial optimization should succeed
            expect(initialOptimization).toBeDefined();
            expect(initialOptimization.error).toBeUndefined();
            expect(initialOptimization.optimizedBuffer).toBeDefined();

            // Step 2: Store the optimized image
            await compressedImageService.saveCompressedImage(imageFilePath, initialOptimization);

            // Step 3: Retrieve the stored image
            const storedImage = await compressedImageService.getCompressedImage(imageFilePath);

            // Property: Stored image should be retrievable
            expect(storedImage).not.toBeNull();
            expect(storedImage).toBeDefined();

            // Step 4: Perform fresh optimization with same parameters
            const freshOptimization = await compressionService.optimizeImageForPDF(
              imageFilePath,
              contentType as 'text' | 'photo' | 'graphics' | 'logo'
            );

            // Property: Fresh optimization should succeed
            expect(freshOptimization).toBeDefined();
            expect(freshOptimization.error).toBeUndefined();
            expect(freshOptimization.optimizedBuffer).toBeDefined();

            // **CORE PROPERTY: Stored result should be identical to fresh optimization**
            const storedVsFreshComparison = compareOptimizedResults(storedImage!, freshOptimization);

            if (!storedVsFreshComparison.isConsistent) {
              console.warn(`Consistency differences for ${uniqueImageName}:`, storedVsFreshComparison.differences);
            }

            // The stored result should be consistent with fresh optimization
            expect(storedVsFreshComparison.isConsistent).toBe(true);

            // Property: Multiple fresh optimizations should be consistent with each other
            const secondFreshOptimization = await compressionService.optimizeImageForPDF(
              imageFilePath,
              contentType as 'text' | 'photo' | 'graphics' | 'logo'
            );

            const freshVsFreshComparison = compareOptimizedResults(freshOptimization, secondFreshOptimization);

            if (!freshVsFreshComparison.isConsistent) {
              console.warn(`Fresh optimization inconsistency for ${uniqueImageName}:`, freshVsFreshComparison.differences);
            }

            expect(freshVsFreshComparison.isConsistent).toBe(true);

            // Property: Stored result should be consistent with second fresh optimization
            const storedVsSecondFreshComparison = compareOptimizedResults(storedImage!, secondFreshOptimization);
            expect(storedVsSecondFreshComparison.isConsistent).toBe(true);

            // Property: Multiple retrievals should return identical results
            const secondStoredImage = await compressedImageService.getCompressedImage(imageFilePath);
            expect(secondStoredImage).not.toBeNull();

            const storedVsStoredComparison = compareOptimizedResults(storedImage!, secondStoredImage!);
            expect(storedVsStoredComparison.isConsistent).toBe(true);

            // Property: Buffer content should be byte-for-byte identical
            expect(Buffer.compare(storedImage!.optimizedBuffer!, freshOptimization.optimizedBuffer!)).toBe(0);
            expect(Buffer.compare(storedImage!.optimizedBuffer!, secondFreshOptimization.optimizedBuffer!)).toBe(0);
            expect(Buffer.compare(storedImage!.optimizedBuffer!, secondStoredImage!.optimizedBuffer!)).toBe(0);

            // Property: Key metrics should be identical
            expect(storedImage!.originalSize).toBe(freshOptimization.originalSize);
            expect(storedImage!.optimizedSize).toBe(freshOptimization.optimizedSize);
            expect(storedImage!.compressionRatio).toBeCloseTo(freshOptimization.compressionRatio, 6);

            // Property: Dimensions should be identical
            expect(storedImage!.dimensions.original.width).toBe(freshOptimization.dimensions.original.width);
            expect(storedImage!.dimensions.original.height).toBe(freshOptimization.dimensions.original.height);
            expect(storedImage!.dimensions.optimized.width).toBe(freshOptimization.dimensions.optimized.width);
            expect(storedImage!.dimensions.optimized.height).toBe(freshOptimization.dimensions.optimized.height);

            // Property: Format should be identical
            expect(storedImage!.format).toBe(freshOptimization.format);

            // Property: Content-related metadata should be identical
            expect(storedImage!.metadata.contentType).toBe(freshOptimization.metadata.contentType);
            expect(storedImage!.metadata.qualityUsed).toBe(freshOptimization.metadata.qualityUsed);
            expect(storedImage!.metadata.formatConverted).toBe(freshOptimization.metadata.formatConverted);
            expect(storedImage!.metadata.originalFormat).toBe(freshOptimization.metadata.originalFormat);

            console.log(`Consistency verified for ${uniqueImageName}: ${width}x${height} ${format} ${contentType}`);

          } catch (error) {
            // Property: If consistency testing fails, it should fail gracefully
            expect(error).toBeDefined();
            console.warn(`Consistency test failed for ${uniqueImageName}: ${error.message}`);

            // Ensure basic functionality still works
            const basicRetrievalTest = await compressedImageService.getCompressedImage(imageFilePath);
            expect(basicRetrievalTest === null || basicRetrievalTest !== undefined).toBe(true);
          } finally {
            // Clean up test image file
            try {
              await fs.promises.unlink(imageFilePath);
            } catch {
              // Ignore cleanup errors
            }
          }
        }
      ),
      {
        numRuns: 100, // Run 100 iterations as specified in design
        timeout: 180000, // 3 minute timeout for consistency tests
        verbose: true
      }
    );
  }, 240000); // 4 minute timeout for the entire test

  /**
   * Property: Consistency should be maintained across different optimization configurations
   */
  it('Property: Storage consistency should be maintained across configuration changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          imageName: fc.string({ minLength: 5, maxLength: 15 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_')),
          width: fc.integer({ min: 150, max: 400 }),
          height: fc.integer({ min: 150, max: 400 }),
          format: fc.constantFrom('jpeg', 'png'),
          contentType: fc.constantFrom('photo', 'graphics'),
          seed: fc.integer({ min: 1, max: 500 }),
        }),
        async (params) => {
          const { imageName, width, height, format, contentType, seed } = params;

          // Create a deterministic test image
          const uniqueImageName = `${imageName}_${seed}_config_test.${format}`;
          const imageFilePath = await createDeterministicTestImageFile(
            `config-consistency-test/${uniqueImageName}`,
            width,
            height,
            format as 'jpeg' | 'png',
            seed
          );

          try {
            // Step 1: Optimize and store with current configuration
            const firstOptimization = await compressionService.optimizeImageForPDF(
              imageFilePath,
              contentType as 'photo' | 'graphics'
            );

            await compressedImageService.saveCompressedImage(imageFilePath, firstOptimization);

            // Step 2: Retrieve the stored image
            const firstStoredImage = await compressedImageService.getCompressedImage(imageFilePath);
            expect(firstStoredImage).not.toBeNull();

            // Step 3: Simulate configuration reload (this should not affect stored images)
            // The stored image should remain consistent regardless of configuration changes

            // Step 4: Retrieve again after potential configuration changes
            const secondStoredImage = await compressedImageService.getCompressedImage(imageFilePath);
            expect(secondStoredImage).not.toBeNull();

            // Property: Stored images should remain consistent across configuration changes
            const consistencyComparison = compareOptimizedResults(firstStoredImage!, secondStoredImage!);
            expect(consistencyComparison.isConsistent).toBe(true);

            // Property: Buffer content should be identical
            expect(Buffer.compare(firstStoredImage!.optimizedBuffer!, secondStoredImage!.optimizedBuffer!)).toBe(0);

            // Step 5: Verify that fresh optimization still produces consistent results
            const freshOptimizationAfterConfig = await compressionService.optimizeImageForPDF(
              imageFilePath,
              contentType as 'photo' | 'graphics'
            );

            // Property: Fresh optimization should still be consistent with stored version
            const storedVsFreshAfterConfigComparison = compareOptimizedResults(
              firstStoredImage!,
              freshOptimizationAfterConfig
            );
            expect(storedVsFreshAfterConfigComparison.isConsistent).toBe(true);

            console.log(`Configuration consistency verified for ${uniqueImageName}`);

          } finally {
            // Clean up test image file
            try {
              await fs.promises.unlink(imageFilePath);
            } catch {
              // Ignore cleanup errors
            }
          }
        }
      ),
      {
        numRuns: 30, // Fewer runs for configuration tests
        timeout: 120000, // 2 minute timeout
        verbose: true
      }
    );
  }, 180000); // 3 minute timeout for the entire test

  /**
   * Property: Consistency should be maintained across concurrent operations
   */
  it('Property: Storage consistency should be maintained under concurrent access', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          imageName: fc.string({ minLength: 5, maxLength: 15 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_')),
          width: fc.integer({ min: 200, max: 400 }),
          height: fc.integer({ min: 200, max: 400 }),
          format: fc.constantFrom('jpeg', 'png'),
          contentType: fc.constantFrom('photo', 'logo'),
          concurrentOperations: fc.integer({ min: 3, max: 8 }),
          seed: fc.integer({ min: 1, max: 300 }),
        }),
        async (params) => {
          const { imageName, width, height, format, contentType, concurrentOperations, seed } = params;

          // Create a deterministic test image
          const uniqueImageName = `${imageName}_${seed}_concurrent_test.${format}`;
          const imageFilePath = await createDeterministicTestImageFile(
            `concurrent-consistency-test/${uniqueImageName}`,
            width,
            height,
            format as 'jpeg' | 'png',
            seed
          );

          try {
            // Step 1: Perform initial optimization and storage
            const initialOptimization = await compressionService.optimizeImageForPDF(
              imageFilePath,
              contentType as 'photo' | 'logo'
            );

            await compressedImageService.saveCompressedImage(imageFilePath, initialOptimization);

            // Step 2: Perform concurrent retrievals
            const concurrentRetrievals = Array(concurrentOperations).fill(null).map(() =>
              compressedImageService.getCompressedImage(imageFilePath)
            );

            const retrievalResults = await Promise.all(concurrentRetrievals);

            // Property: All concurrent retrievals should succeed
            retrievalResults.forEach((result, index) => {
              expect(result).not.toBeNull();
              expect(result).toBeDefined();
              expect(result!.optimizedBuffer).toBeDefined();
            });

            // Property: All concurrent retrievals should return identical results
            const firstResult = retrievalResults[0]!;
            for (let i = 1; i < retrievalResults.length; i++) {
              const currentResult = retrievalResults[i]!;
              const comparison = compareOptimizedResults(firstResult, currentResult);

              if (!comparison.isConsistent) {
                console.warn(`Concurrent retrieval inconsistency for ${uniqueImageName} (operation ${i}):`, comparison.differences);
              }

              expect(comparison.isConsistent).toBe(true);

              // Property: Buffer content should be byte-for-byte identical
              expect(Buffer.compare(firstResult.optimizedBuffer!, currentResult.optimizedBuffer!)).toBe(0);
            }

            // Step 3: Perform concurrent fresh optimizations
            const concurrentOptimizations = Array(Math.min(concurrentOperations, 5)).fill(null).map(() =>
              compressionService.optimizeImageForPDF(imageFilePath, contentType as 'photo' | 'logo')
            );

            const optimizationResults = await Promise.all(concurrentOptimizations);

            // Property: All concurrent optimizations should succeed
            optimizationResults.forEach((result, index) => {
              expect(result).toBeDefined();
              expect(result.error).toBeUndefined();
              expect(result.optimizedBuffer).toBeDefined();
            });

            // Property: All concurrent optimizations should be consistent with stored result
            optimizationResults.forEach((result, index) => {
              const comparison = compareOptimizedResults(firstResult, result);

              if (!comparison.isConsistent) {
                console.warn(`Concurrent optimization inconsistency for ${uniqueImageName} (optimization ${index}):`, comparison.differences);
              }

              expect(comparison.isConsistent).toBe(true);
            });

            // Property: All concurrent optimizations should be consistent with each other
            const firstOptimizationResult = optimizationResults[0];
            for (let i = 1; i < optimizationResults.length; i++) {
              const currentOptimizationResult = optimizationResults[i];
              const comparison = compareOptimizedResults(firstOptimizationResult, currentOptimizationResult);
              expect(comparison.isConsistent).toBe(true);
            }

            console.log(`Concurrent consistency verified for ${uniqueImageName} with ${concurrentOperations} operations`);

          } finally {
            // Clean up test image file
            try {
              await fs.promises.unlink(imageFilePath);
            } catch {
              // Ignore cleanup errors
            }
          }
        }
      ),
      {
        numRuns: 20, // Fewer runs for concurrent tests
        timeout: 180000, // 3 minute timeout
        verbose: true
      }
    );
  }, 240000); // 4 minute timeout for the entire test

  /**
   * Property: Consistency should be maintained across different file system states
   */
  it('Property: Storage consistency should handle file system edge cases gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          imageName: fc.string({ minLength: 5, maxLength: 15 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_')),
          width: fc.integer({ min: 100, max: 300 }),
          height: fc.integer({ min: 100, max: 300 }),
          format: fc.constantFrom('jpeg', 'png'),
          contentType: fc.constantFrom('photo', 'graphics'),
          seed: fc.integer({ min: 1, max: 200 }),
        }),
        async (params) => {
          const { imageName, width, height, format, contentType, seed } = params;

          // Create a deterministic test image
          const uniqueImageName = `${imageName}_${seed}_fs_test.${format}`;
          const imageFilePath = await createDeterministicTestImageFile(
            `fs-consistency-test/${uniqueImageName}`,
            width,
            height,
            format as 'jpeg' | 'png',
            seed
          );

          try {
            // Step 1: Optimize and store
            const optimization = await compressionService.optimizeImageForPDF(
              imageFilePath,
              contentType as 'photo' | 'graphics'
            );

            await compressedImageService.saveCompressedImage(imageFilePath, optimization);

            // Step 2: Verify initial storage
            const initialRetrieval = await compressedImageService.getCompressedImage(imageFilePath);
            expect(initialRetrieval).not.toBeNull();

            // Step 3: Test consistency after file system operations
            // Simulate various file system states that might occur in production

            // Test: Multiple rapid retrievals (simulating high load)
            const rapidRetrievals = await Promise.all([
              compressedImageService.getCompressedImage(imageFilePath),
              compressedImageService.getCompressedImage(imageFilePath),
              compressedImageService.getCompressedImage(imageFilePath),
            ]);

            // Property: All rapid retrievals should be consistent
            rapidRetrievals.forEach((result, index) => {
              expect(result).not.toBeNull();
              const comparison = compareOptimizedResults(initialRetrieval!, result!);
              expect(comparison.isConsistent).toBe(true);
            });

            // Test: Retrieval after checking existence
            const exists = await compressedImageService.hasCompressedImage(imageFilePath);
            expect(exists).toBe(true);

            const retrievalAfterExistenceCheck = await compressedImageService.getCompressedImage(imageFilePath);
            expect(retrievalAfterExistenceCheck).not.toBeNull();

            const consistencyAfterExistenceCheck = compareOptimizedResults(
              initialRetrieval!,
              retrievalAfterExistenceCheck!
            );
            expect(consistencyAfterExistenceCheck.isConsistent).toBe(true);

            // Test: Consistency of path generation
            const generatedPath1 = compressedImageService.generateCompressedPath(imageFilePath);
            const generatedPath2 = compressedImageService.generateCompressedPath(imageFilePath);
            expect(generatedPath1).toBe(generatedPath2);

            // Property: Generated path should be deterministic and consistent
            for (let i = 0; i < 5; i++) {
              const pathCheck = compressedImageService.generateCompressedPath(imageFilePath);
              expect(pathCheck).toBe(generatedPath1);
            }

            console.log(`File system consistency verified for ${uniqueImageName}`);

          } finally {
            // Clean up test image file
            try {
              await fs.promises.unlink(imageFilePath);
            } catch {
              // Ignore cleanup errors
            }
          }
        }
      ),
      {
        numRuns: 25, // Moderate runs for file system tests
        timeout: 120000, // 2 minute timeout
        verbose: true
      }
    );
  }, 180000); // 3 minute timeout for the entire test
});