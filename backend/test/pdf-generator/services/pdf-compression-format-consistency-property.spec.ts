import { Test, TestingModule } from '@nestjs/testing';
import { PDFCompressionService } from '../../../src/pdf-generator/services/pdf-compression.service';
import { PDFImageOptimizationMetricsService } from '../../../src/pdf-generator/services/pdf-image-optimization-metrics.service';
import { PDFImageOptimizationConfigService } from '../../../src/pdf-generator/services/pdf-image-optimization-config.service';
import { PDFImageValidationService } from '../../../src/pdf-generator/services/pdf-image-validation.service';
import { CompressedImageService } from '../../../src/pdf-generator/services/compressed-image.service';
import * as fc from 'fast-check';
import sharp from 'sharp';

/**
 * Property-Based Test for Format Handling Consistency
 *
 * This test verifies that the PDF compression system handles different image formats
 * consistently, applying the same scaling and optimization rules regardless of input format.
 */
describe('PDFCompressionService - Format Handling Consistency Property Test', () => {
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
        jpeg: { min: 40, max: 75, default: 60, progressive: true },
        png: { min: 50, max: 80, default: 65, progressive: true },
        webp: { min: 45, max: 80, default: 65, lossless: false }
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
    })),
    reloadConfiguration: jest.fn()
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
   * Helper function to create a test image buffer in a specific format
   */
  async function createTestImageInFormat(
    width: number,
    height: number,
    format: 'jpeg' | 'png' | 'webp',
    channels: 3 | 4 = 3
  ): Promise<Buffer> {
    const color = channels === 4
      ? { r: 128, g: 128, b: 128, alpha: 1 }
      : { r: 128, g: 128, b: 128 };

    let pipeline = sharp({
      create: {
        width,
        height,
        channels,
        background: color
      }
    });

    // Create image in the specified format
    switch (format) {
      case 'jpeg':
        return pipeline.jpeg({ quality: 90 }).toBuffer();
      case 'png':
        return pipeline.png({ compressionLevel: 6 }).toBuffer();
      case 'webp':
        return pipeline.webp({ quality: 90 }).toBuffer();
      default:
        return pipeline.png().toBuffer();
    }
  }

  /**
   * **Feature: pdf-image-optimization, Property 6: Format handling consistency**
   * **Validates: Requirements 3.4, 4.3**
   *
   * Property 6: Format handling consistency
   * For any supported image format (JPEG, PNG, WebP), the system should apply the same
   * scaling and optimization rules regardless of input format
   */
  it('Property 6: Format handling consistency - should apply same scaling and optimization rules regardless of input format', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          width: fc.integer({ min: 100, max: 800 }),
          height: fc.integer({ min: 100, max: 800 }),
          channels: fc.constantFrom(3, 4),
          contentType: fc.constantFrom('text', 'photo', 'graphics', 'logo'),
          maxWidth: fc.integer({ min: 100, max: 300 }),
          maxHeight: fc.integer({ min: 100, max: 300 }),
          minWidth: fc.integer({ min: 50, max: 100 }),
          minHeight: fc.integer({ min: 50, max: 100 }),
          qualityMin: fc.integer({ min: 40, max: 60 }),
          qualityMax: fc.integer({ min: 60, max: 80 })
        }).filter(params =>
          params.minWidth <= params.maxWidth &&
          params.minHeight <= params.maxHeight &&
          params.qualityMin <= params.qualityMax
        ),
        async (params) => {
          const { width, height, channels, contentType, maxWidth, maxHeight, minWidth, minHeight, qualityMin, qualityMax } = params;

          // Skip if image dimensions are too small to be meaningful
          fc.pre(width > 50 && height > 50);

          // Create test images in all supported formats
          const formats: ('jpeg' | 'png' | 'webp')[] = ['jpeg', 'png', 'webp'];
          const imageBuffers: { [format: string]: Buffer } = {};

          // Create identical images in different formats
          for (const format of formats) {
            imageBuffers[format] = await createTestImageInFormat(width, height, format, channels as 3 | 4);
          }

          // Skip if any buffer is too small
          for (const format of formats) {
            fc.pre(imageBuffers[format].length > 1000);
          }

          const scalingOptions = {
            maxWidth,
            maxHeight,
            minWidth,
            minHeight,
            maintainAspectRatio: true,
            qualityRange: { min: qualityMin, max: qualityMax },
            format: 'jpeg' as const, // Target format for consistency
            contentAware: true
          };

          const results: { [format: string]: any } = {};
          const errors: { [format: string]: string } = {};

          // Process each format and collect results
          for (const inputFormat of formats) {
            try {
              const result = await service.reduceImageToMinimumSize(imageBuffers[inputFormat], scalingOptions);
              results[inputFormat] = result;
            } catch (error) {
              errors[inputFormat] = error.message;
            }
          }

          // Property: All formats should be processed successfully (or all fail consistently)
          const successfulFormats = Object.keys(results).filter(format => !results[format].error);
          const failedFormats = Object.keys(errors);

          // If some formats succeed, they should all succeed (consistency)
          if (successfulFormats.length > 0) {
            expect(successfulFormats.length).toBe(formats.length);
            expect(failedFormats.length).toBe(0);

            // Property: Consistent scaling rules - all formats should produce similar dimensions
            const dimensionResults = successfulFormats.map(format => ({
              format,
              width: results[format].dimensions.optimized.width,
              height: results[format].dimensions.optimized.height,
              aspectRatio: results[format].dimensions.optimized.width / results[format].dimensions.optimized.height
            }));

            // All optimized images should have the same dimensions (within tolerance)
            const firstResult = dimensionResults[0];
            for (let i = 1; i < dimensionResults.length; i++) {
              const currentResult = dimensionResults[i];

              // Property: Width should be consistent across formats (within 1 pixel tolerance)
              expect(Math.abs(currentResult.width - firstResult.width)).toBeLessThanOrEqual(1);

              // Property: Height should be consistent across formats (within 1 pixel tolerance)
              expect(Math.abs(currentResult.height - firstResult.height)).toBeLessThanOrEqual(1);

              // Property: Aspect ratio should be consistent across formats
              const aspectRatioTolerance = 0.01; // 1% tolerance
              expect(Math.abs(currentResult.aspectRatio - firstResult.aspectRatio)).toBeLessThanOrEqual(aspectRatioTolerance);
            }

            // Property: All formats should respect the same dimension constraints
            for (const format of successfulFormats) {
              const result = results[format];

              // Property: Dimensions should be within maximum bounds for all formats
              expect(result.dimensions.optimized.width).toBeLessThanOrEqual(maxWidth);
              expect(result.dimensions.optimized.height).toBeLessThanOrEqual(maxHeight);

              // Property: Dimensions should be at least minimum bounds for all formats
              expect(result.dimensions.optimized.width).toBeGreaterThanOrEqual(minWidth);
              expect(result.dimensions.optimized.height).toBeGreaterThanOrEqual(minHeight);

              // Property: Original dimensions should be preserved in metadata for all formats
              expect(result.dimensions.original.width).toBe(width);
              expect(result.dimensions.original.height).toBe(height);
            }

            // Property: Consistent optimization behavior - all formats should apply similar optimization
            for (const format of successfulFormats) {
              const result = results[format];

              // Property: All formats should produce some optimization (size reduction or processing)
              const hasOptimization =
                result.optimizedSize < result.originalSize || // Size was reduced
                result.processingTime > 0 || // Processing occurred
                result.metadata?.technique === 'aggressive'; // Aggressive technique was applied

              expect(hasOptimization).toBe(true);

              // Property: Compression ratio should be calculated consistently for all formats
              if (result.originalSize > 0) {
                const expectedCompressionRatio = (result.originalSize - result.optimizedSize) / result.originalSize;
                expect(Math.abs(result.compressionRatio - expectedCompressionRatio)).toBeLessThan(0.001);
              }

              // Property: Processing time should be reasonable for all formats
              expect(result.processingTime).toBeGreaterThanOrEqual(0);
              expect(result.processingTime).toBeLessThan(30000); // Should complete within 30 seconds

              // Property: Metadata should be populated consistently for all formats
              expect(result.metadata).toBeDefined();
              expect(result.metadata.technique).toBe('aggressive');

              // Property: Content type should be consistent (current implementation defaults to 'photo')
              expect(result.metadata.contentType).toBeDefined();
              expect(['text', 'photo', 'graphics', 'logo'].includes(result.metadata.contentType)).toBe(true);

              // Property: Quality should be within the specified range for all formats
              if (result.metadata.qualityUsed) {
                expect(result.metadata.qualityUsed).toBeGreaterThanOrEqual(qualityMin);
                expect(result.metadata.qualityUsed).toBeLessThanOrEqual(qualityMax);
              }
            }

            // Property: Content-aware optimization should be applied consistently
            for (const format of successfulFormats) {
              const result = results[format];

              // Property: Content type should be applied consistently across all formats
              const firstContentType = results[successfulFormats[0]].metadata.contentType;
              expect(result.metadata.contentType).toBe(firstContentType);

              // Property: Format conversion should be handled consistently
              expect(result.format).toBeDefined();
              expect(['jpeg', 'png', 'webp'].includes(result.format)).toBe(true);
            }

            // Property: Consistent error handling - if optimization works for one format, it should work for all
            const hasErrors = successfulFormats.some(format => results[format].error);
            expect(hasErrors).toBe(false);

          } else {
            // Property: If all formats fail, they should fail consistently
            expect(failedFormats.length).toBe(formats.length);

            // All formats should have meaningful error messages
            for (const format of failedFormats) {
              expect(errors[format]).toBeDefined();
              expect(errors[format].length).toBeGreaterThan(0);
            }
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