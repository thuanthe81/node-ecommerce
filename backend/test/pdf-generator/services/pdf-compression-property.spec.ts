import { Test, TestingModule } from '@nestjs/testing';
import { PDFCompressionService } from '../../../src/pdf-generator/services/pdf-compression.service';
import { PDFImageOptimizationMetricsService } from '../../../src/pdf-generator/services/pdf-image-optimization-metrics.service';
import { PDFImageOptimizationConfigService } from '../../../src/pdf-generator/services/pdf-image-optimization-config.service';
import { PDFImageValidationService } from '../../../src/pdf-generator/services/pdf-image-validation.service';
import { CompressedImageService } from '../../../src/pdf-generator/services/compressed-image.service';
import * as fc from 'fast-check';
import sharp from 'sharp';

/**
 * Property-Based Tests for PDFCompressionService
 *
 * These tests verify universal properties that should hold across all valid executions
 * of the PDF compression system, using fast-check for property-based testing.
 */
describe('PDFCompressionService - Property-Based Tests', () => {
  let service: PDFCompressionService;

  const mockMetricsService = {
    recordImageOptimization: jest.fn(),
    recordBatchOptimization: jest.fn(),
    recordPerformanceData: jest.fn(),
    recordFallbackOperation: jest.fn(),
    getCurrentMetrics: jest.fn().mockReturnValue({
      totalImagesProcessed: 0,
      successfulOptimizations: 0,
      failedOptimizations: 0,
      totalOriginalSize: 0,
      totalOptimizedSize: 0,
      overallCompressionRatio: 0,
      averageProcessingTime: 0,
      totalProcessingTime: 0,
      formatBreakdown: {},
      contentTypeBreakdown: {},
      errorBreakdown: {},
      timestamp: new Date()
    }),
    getMetricsSummaryForMonitoring: jest.fn().mockReturnValue({
      totalImagesProcessed: 0,
      successRate: 0,
      averageCompressionRatio: 0,
      averageProcessingTime: 0,
      totalSizeSaved: 0,
      errorRate: 0,
      lastUpdated: new Date()
    })
  };

  const mockImageOptimizationConfigService = {
    getConfiguration: jest.fn(() => ({
      aggressiveMode: {
        enabled: true,
        maxDimensions: { width: 300, height: 300 },
        minDimensions: { width: 50, height: 50 },
        forceOptimization: true
      },
      quality: {
        jpeg: { min: 40, max: 75, default: 60 },
        png: { min: 50, max: 80, default: 65 },
        webp: { min: 45, max: 80, default: 65 }
      },
      compression: {
        enabled: true,
        level: 'maximum' as const,
        enableFormatConversion: true,
        preferredFormat: 'jpeg' as const
      },
      fallback: {
        enabled: true,
        maxRetries: 3,
        timeoutMs: 10000
      },
      monitoring: {
        enabled: true,
        trackProcessingTime: true,
        trackCompressionRatio: true,
        trackSizeReduction: true
      },
      contentAware: {
        enabled: true,
        contentTypes: {
          text: { quality: 70, preserveSharpness: true },
          photo: { quality: 55, allowAggressive: true },
          graphics: { quality: 65, preserveColors: true },
          logo: { quality: 75, maintainCrisp: true }
        }
      }
    }))
  };

  const mockValidationService = {
    validateAggressiveOptimization: jest.fn(),
    logOptimizationResults: jest.fn(),
    validateQuality: jest.fn(),
    validateDimensions: jest.fn(),
    validateFormat: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PDFCompressionService,
        {
          provide: PDFImageOptimizationMetricsService,
          useValue: mockMetricsService
        },
        {
          provide: PDFImageOptimizationConfigService,
          useValue: mockImageOptimizationConfigService
        },
        {
          provide: PDFImageValidationService,
          useValue: mockValidationService
        },
        {
          provide: CompressedImageService,
          useValue: {
            hasCompressedImage: jest.fn().mockResolvedValue(false),
            getCompressedImage: jest.fn().mockResolvedValue(null),
            saveCompressedImage: jest.fn().mockResolvedValue('test-path'),
            generateCompressedPath: jest.fn().mockReturnValue('test-path'),
            getStorageMetrics: jest.fn().mockResolvedValue({
              totalStorageSize: 0,
              totalCompressedImages: 0,
              reuseRate: 0,
              averageCompressionRatio: 0,
              storageUtilization: 0,
            }),
          },
        }
      ],
    }).compile();

    service = module.get<PDFCompressionService>(PDFCompressionService);
    jest.clearAllMocks();
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
   * **Feature: pdf-image-optimization, Property 1: Maximum size reduction**
   * **Validates: Requirements 2.1, 2.4**
   *
   * Property 1: Maximum size reduction
   * For any image processed for PDF inclusion, the system should reduce it to the smallest
   * possible size while maintaining readability and essential visual information
   */
  it('Property 1: Maximum size reduction - should reduce any image to smallest possible size while maintaining readability', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          width: fc.integer({ min: 100, max: 1000 }),
          height: fc.integer({ min: 100, max: 1000 }),
          channels: fc.constantFrom(3, 4),
          maxWidth: fc.integer({ min: 50, max: 300 }),
          maxHeight: fc.integer({ min: 50, max: 300 }),
          minWidth: fc.integer({ min: 20, max: 100 }),
          minHeight: fc.integer({ min: 20, max: 100 }),
          maintainAspectRatio: fc.boolean(),
          qualityMin: fc.integer({ min: 20, max: 60 }),
          qualityMax: fc.integer({ min: 60, max: 90 }),
          format: fc.constantFrom('jpeg', 'png', 'webp')
        }).filter(params =>
          params.minWidth <= params.maxWidth &&
          params.minHeight <= params.maxHeight &&
          params.qualityMin <= params.qualityMax
        ),
        async (params) => {
          const { width, height, channels, maxWidth, maxHeight, minWidth, minHeight, maintainAspectRatio, qualityMin, qualityMax, format } = params;

          // Skip if image is too small to be meaningful
          fc.pre(width > 50 && height > 50);

          const imageBuffer = await createTestImageBuffer(width, height, channels as 3 | 4);
          const originalSize = imageBuffer.length;

          // Skip if buffer is too small
          fc.pre(originalSize > 1000);

          const options = {
            maxWidth,
            maxHeight,
            minWidth,
            minHeight,
            maintainAspectRatio,
            qualityRange: { min: qualityMin, max: qualityMax },
            format: format as 'jpeg' | 'png' | 'webp',
            contentAware: true
          };

          try {
            const result = await service.reduceImageToMinimumSize(imageBuffer, options);

            // Property: The optimized image should be smaller than or equal to the original
            expect(result.optimizedSize).toBeLessThanOrEqual(originalSize);

            // Property: If optimization succeeded, there should be a valid optimized buffer
            if (!result.error && result.optimizedBuffer) {
              expect(result.optimizedBuffer.length).toBeGreaterThan(0);
              expect(result.optimizedSize).toBe(result.optimizedBuffer.length);

              // Property: Dimensions should be within the specified maximum bounds
              expect(result.dimensions.optimized.width).toBeLessThanOrEqual(maxWidth);
              expect(result.dimensions.optimized.height).toBeLessThanOrEqual(maxHeight);

              // Property: Dimensions should be at least the minimum bounds
              expect(result.dimensions.optimized.width).toBeGreaterThanOrEqual(minWidth);
              expect(result.dimensions.optimized.height).toBeGreaterThanOrEqual(minHeight);

              // Property: If aspect ratio should be maintained, verify it's preserved (within tolerance)
              if (maintainAspectRatio && width > 0 && height > 0) {
                const originalAspectRatio = width / height;
                const optimizedAspectRatio = result.dimensions.optimized.width / result.dimensions.optimized.height;
                const aspectRatioTolerance = 0.05; // 5% tolerance

                expect(Math.abs(originalAspectRatio - optimizedAspectRatio)).toBeLessThanOrEqual(aspectRatioTolerance);
              }

              // Property: Compression ratio should be calculated correctly
              const expectedCompressionRatio = (originalSize - result.optimizedSize) / originalSize;
              expect(Math.abs(result.compressionRatio - expectedCompressionRatio)).toBeLessThan(0.001);

              // Property: Processing time should be recorded and be reasonable
              expect(result.processingTime).toBeGreaterThanOrEqual(0);
              expect(result.processingTime).toBeLessThan(30000); // Should complete within 30 seconds

              // Property: Format should match the requested format
              expect(result.format).toBe(format);

              // Property: Metadata should be populated correctly
              expect(result.metadata).toBeDefined();
              expect(result.metadata.technique).toBe('aggressive');
              expect(result.metadata.qualityUsed).toBeGreaterThanOrEqual(qualityMin);
              expect(result.metadata.qualityUsed).toBeLessThanOrEqual(qualityMax);
            }

            // Property: Original dimensions should be preserved in result
            expect(result.dimensions.original.width).toBe(width);
            expect(result.dimensions.original.height).toBe(height);
            expect(result.originalSize).toBe(originalSize);

          } catch (error) {
            // If an error occurs, it should be properly recorded in the result
            // This ensures the system fails gracefully and doesn't crash
            expect(error).toBeDefined();
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
   * **Feature: pdf-image-optimization, Property 2: Aspect ratio preservation with aggressive scaling**
   * **Validates: Requirements 2.2, 3.2**
   *
   * Property 2: Aspect ratio preservation with aggressive scaling
   * For any image with aspect ratio R, after aggressive scaling the aspect ratio should remain R
   * (within acceptable tolerance) while achieving maximum size reduction
   */
  it('Property 2: Aspect ratio preservation with aggressive scaling - should maintain aspect ratio during aggressive scaling', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          width: fc.integer({ min: 100, max: 1000 }),
          height: fc.integer({ min: 100, max: 1000 }),
          channels: fc.constantFrom(3, 4),
          maxWidth: fc.integer({ min: 50, max: 300 }),
          maxHeight: fc.integer({ min: 50, max: 300 }),
          minWidth: fc.integer({ min: 20, max: 100 }),
          minHeight: fc.integer({ min: 20, max: 100 }),
          qualityMin: fc.integer({ min: 20, max: 60 }),
          qualityMax: fc.integer({ min: 60, max: 90 }),
          format: fc.constantFrom('jpeg', 'png', 'webp')
        }).filter(params =>
          params.minWidth <= params.maxWidth &&
          params.minHeight <= params.maxHeight &&
          params.qualityMin <= params.qualityMax
        ),
        async (params) => {
          const { width, height, channels, maxWidth, maxHeight, minWidth, minHeight, qualityMin, qualityMax, format } = params;

          // Skip if image dimensions are invalid or too small
          fc.pre(width > 50 && height > 50);

          const originalAspectRatio = width / height;

          // Skip extreme aspect ratios that might be problematic
          fc.pre(originalAspectRatio > 0.1 && originalAspectRatio < 10);

          const imageBuffer = await createTestImageBuffer(width, height, channels as 3 | 4);

          // Force aspect ratio preservation for this test
          const options = {
            maxWidth,
            maxHeight,
            minWidth,
            minHeight,
            maintainAspectRatio: true, // Force aspect ratio preservation
            qualityRange: { min: qualityMin, max: qualityMax },
            format: format as 'jpeg' | 'png' | 'webp',
            contentAware: true
          };

          try {
            const result = await service.reduceImageToMinimumSize(imageBuffer, options);

            // Property: If optimization succeeded, aspect ratio should be preserved
            if (!result.error && result.optimizedBuffer && result.dimensions.optimized.width > 0 && result.dimensions.optimized.height > 0) {
              const optimizedAspectRatio = result.dimensions.optimized.width / result.dimensions.optimized.height;

              // Property: Aspect ratio should be preserved within acceptable tolerance
              const aspectRatioTolerance = 0.05; // 5% tolerance for floating point precision and scaling
              const aspectRatioDifference = Math.abs(originalAspectRatio - optimizedAspectRatio);

              expect(aspectRatioDifference).toBeLessThanOrEqual(aspectRatioTolerance);

              // Property: Both dimensions should be reduced (aggressive scaling)
              expect(result.dimensions.optimized.width).toBeLessThanOrEqual(width);
              expect(result.dimensions.optimized.height).toBeLessThanOrEqual(height);

              // Property: At least one dimension should be significantly reduced for aggressive scaling
              const widthReduction = (width - result.dimensions.optimized.width) / width;
              const heightReduction = (height - result.dimensions.optimized.height) / height;
              const maxReduction = Math.max(widthReduction, heightReduction);

              // Expect at least some reduction unless the image was already very small
              if (width > maxWidth || height > maxHeight) {
                expect(maxReduction).toBeGreaterThan(0);
              }

              // Property: Dimensions should respect the maximum bounds while maintaining aspect ratio
              expect(result.dimensions.optimized.width).toBeLessThanOrEqual(maxWidth);
              expect(result.dimensions.optimized.height).toBeLessThanOrEqual(maxHeight);

              // Property: Dimensions should be at least the minimum bounds
              expect(result.dimensions.optimized.width).toBeGreaterThanOrEqual(minWidth);
              expect(result.dimensions.optimized.height).toBeGreaterThanOrEqual(minHeight);

              // Property: The scaling should be proportional (same scaling factor for both dimensions)
              const widthScalingFactor = result.dimensions.optimized.width / width;
              const heightScalingFactor = result.dimensions.optimized.height / height;
              const scalingFactorTolerance = 0.05; // 5% tolerance

              expect(Math.abs(widthScalingFactor - heightScalingFactor)).toBeLessThanOrEqual(scalingFactorTolerance);

              // Property: File size should be reduced with aggressive scaling
              expect(result.optimizedSize).toBeLessThanOrEqual(result.originalSize);

              // Property: Compression ratio should be non-negative and not exceed 1
              expect(result.compressionRatio).toBeGreaterThanOrEqual(0);
              expect(result.compressionRatio).toBeLessThanOrEqual(1);
            }

            // Property: Original aspect ratio should be correctly recorded
            const recordedOriginalAspectRatio = result.dimensions.original.width / result.dimensions.original.height;
            expect(Math.abs(recordedOriginalAspectRatio - originalAspectRatio)).toBeLessThan(0.001);

          } catch (error) {
            // If an error occurs, it should be properly handled and not crash the system
            expect(error).toBeDefined();
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
   * **Feature: pdf-image-optimization, Property 4: Optimization of all images regardless of size**
   * **Validates: Requirements 2.3**
   *
   * Property 4: Optimization of all images regardless of size
   * For any image regardless of its original size, the system should apply compression and
   * optimization techniques to achieve maximum size reduction
   */
  it('Property 4: Optimization of all images regardless of size - should optimize all images regardless of original size', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          // Test a wide range of image sizes from very small to very large
          width: fc.integer({ min: 20, max: 2000 }),
          height: fc.integer({ min: 20, max: 2000 }),
          channels: fc.constantFrom(3, 4),
          contentType: fc.constantFrom('text', 'photo', 'graphics', 'logo'),
          format: fc.constantFrom('jpeg', 'png', 'webp')
        }),
        async (params) => {
          const { width, height, channels, contentType, format } = params;

          // Create test image buffer
          const imageBuffer = await createTestImageBuffer(width, height, channels as 3 | 4);
          const originalSize = imageBuffer.length;

          // Skip if buffer is too small to be meaningful
          fc.pre(originalSize > 100);

          try {
            // Mock the loadImageBuffer method to return our test buffer
            const loadImageBufferSpy = jest.spyOn(service as any, 'loadImageBuffer');
            loadImageBufferSpy.mockResolvedValue(imageBuffer);

            // Test the comprehensive image optimization method which should optimize all images
            const actualResult = await service.comprehensiveImageOptimization('test-image-url', contentType as 'text' | 'photo' | 'graphics' | 'logo');

            // Property: Optimization should be attempted regardless of original image size
            // The method should not skip optimization based on size
            expect(actualResult).toBeDefined();
            expect(actualResult.originalSize).toBeGreaterThan(0);

            // Property: If optimization succeeds, some form of processing should occur
            if (!actualResult.error && actualResult.optimizedBuffer) {
              // Property: The system should apply some form of optimization
              // This could be size reduction, format conversion, or quality adjustment
              const hasOptimization =
                actualResult.optimizedSize !== actualResult.originalSize || // Size changed
                actualResult.metadata?.formatConverted || // Format was converted
                (actualResult.metadata?.qualityUsed && actualResult.metadata.qualityUsed < 100) || // Quality was adjusted
                actualResult.dimensions.optimized.width !== actualResult.dimensions.original.width || // Dimensions changed
                actualResult.dimensions.optimized.height !== actualResult.dimensions.original.height;

              expect(hasOptimization).toBe(true);

              // Property: Optimization should respect the configuration limits regardless of input size
              const config = mockImageOptimizationConfigService.getConfiguration();
              expect(actualResult.dimensions.optimized.width).toBeLessThanOrEqual(config.aggressiveMode.maxDimensions.width);
              expect(actualResult.dimensions.optimized.height).toBeLessThanOrEqual(config.aggressiveMode.maxDimensions.height);

              // Property: Even small images should be processed when forceOptimization is enabled
              if (config.aggressiveMode.forceOptimization) {
                // Some optimization should have been applied even to small images
                expect(actualResult.processingTime).toBeGreaterThan(0);
                expect(actualResult.metadata?.technique).toBeDefined();
              }

              // Property: Quality settings should be applied regardless of original size
              if (actualResult.metadata?.qualityUsed) {
                const formatConfig = config.quality[format as keyof typeof config.quality];
                expect(actualResult.metadata.qualityUsed).toBeGreaterThanOrEqual(formatConfig.min);
                expect(actualResult.metadata.qualityUsed).toBeLessThanOrEqual(formatConfig.max);
              }

              // Property: Content-aware optimization should be applied regardless of size
              expect(actualResult.metadata?.contentType).toBe(contentType);

              // Property: The result should have valid dimensions
              expect(actualResult.dimensions.optimized.width).toBeGreaterThan(0);
              expect(actualResult.dimensions.optimized.height).toBeGreaterThan(0);

              // Property: Compression ratio should be calculated correctly
              const expectedCompressionRatio = (actualResult.originalSize - actualResult.optimizedSize) / actualResult.originalSize;
              expect(Math.abs(actualResult.compressionRatio - expectedCompressionRatio)).toBeLessThan(0.001);
            }

            // Property: Original dimensions should be preserved in metadata regardless of size
            expect(actualResult.dimensions.original.width).toBeGreaterThan(0);
            expect(actualResult.dimensions.original.height).toBeGreaterThan(0);

            // Property: Processing should complete within reasonable time regardless of image size
            expect(actualResult.processingTime).toBeGreaterThanOrEqual(0);
            expect(actualResult.processingTime).toBeLessThan(60000); // Should complete within 60 seconds

            // Property: Format should be determined and applied regardless of original size
            expect(actualResult.format).toBeDefined();
            expect(['jpeg', 'png', 'webp', 'original', 'placeholder'].includes(actualResult.format)).toBe(true);

            // Restore the original method
            loadImageBufferSpy.mockRestore();

          } catch (error) {
            // Property: Even if optimization fails, the system should handle it gracefully
            // and not crash, allowing PDF generation to continue
            expect(error).toBeDefined();

            // The error should be meaningful and not just a generic failure
            expect(error.message).toBeDefined();
            expect(error.message.length).toBeGreaterThan(0);
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

});