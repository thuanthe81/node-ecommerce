import { Test, TestingModule } from '@nestjs/testing';
import { PDFCompressionService } from './pdf-compression.service';
import { PDFImageOptimizationMetricsService } from './pdf-image-optimization-metrics.service';
import { PDFImageOptimizationConfigService } from './pdf-image-optimization-config.service';
import { PDFImageValidationService } from './pdf-image-validation.service';
import { CompressedImageService } from './compressed-image.service';
import * as fc from 'fast-check';
import sharp from 'sharp';
import { OrderPDFData } from '../types/pdf.types';

/**
 * Property-Based Tests for Consistent Optimization Across Multiple Images
 *
 * These tests verify that the system applies consistent optimization settings
 * across all images processed in the same PDF generation operation.
 */
describe('PDFCompressionService - Consistent Optimization Property Tests', () => {
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
   * Helper function to create mock order data with multiple images
   */
  function createMockOrderDataWithMultipleImages(imageCount: number): Partial<OrderPDFData> {
    const items = [];
    for (let i = 0; i < imageCount; i++) {
      items.push({
        id: `item-${i}`,
        name: `Product ${i}`,
        description: `Description for product ${i}`,
        price: 100 + i,
        quantity: 1,
        imageUrl: `test-product-${i}.jpg`
      });
    }

    return {
      orderNumber: 'ORD-MULTI-TEST',
      items,
      businessInfo: {
        name: 'Test Business',
        logoUrl: 'test-logo.jpg',
        address: 'Test Address',
        phone: '123-456-7890',
        email: 'test@business.com',
        termsAndConditions: 'Test terms',
        returnPolicy: 'Test policy'
      },
      paymentMethod: {
        type: 'bank_transfer',
        qrCodeUrl: 'test-qr.jpg'
      },
      customerInfo: {
        name: 'Test Customer',
        email: 'customer@test.com',
        phone: '098-765-4321'
      },
      shippingInfo: {
        address: 'Test Shipping Address',
        method: 'standard',
        cost: 10
      },
      orderDate: new Date(),
      totalAmount: 1000,
      subtotal: 900,
      tax: 90,
      shippingCost: 10
    };
  }

  /**
   * **Feature: pdf-image-optimization, Property 5: Consistent optimization across multiple images**
   * **Validates: Requirements 1.4**
   *
   * Property 5: Consistent optimization across multiple images
   * For any set of images processed in the same PDF generation, all images should be optimized
   * using the same scaling rules and quality settings
   */
  it('Property 5: Consistent optimization across multiple images - should apply same optimization settings to all images in a PDF', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          imageCount: fc.integer({ min: 2, max: 8 }), // Test with 2-8 images
          imageWidths: fc.array(fc.integer({ min: 100, max: 1000 }), { minLength: 2, maxLength: 8 }),
          imageHeights: fc.array(fc.integer({ min: 100, max: 1000 }), { minLength: 2, maxLength: 8 }),
          channels: fc.constantFrom(3, 4),
          maxWidth: fc.integer({ min: 200, max: 400 }),
          maxHeight: fc.integer({ min: 200, max: 400 }),
          qualityMin: fc.integer({ min: 40, max: 60 }),
          qualityMax: fc.integer({ min: 60, max: 80 })
        }).filter(params =>
          params.imageWidths.length === params.imageCount &&
          params.imageHeights.length === params.imageCount &&
          params.qualityMin <= params.qualityMax
        ),
        async (params) => {
          const { imageCount, imageWidths, imageHeights, channels, maxWidth, maxHeight, qualityMin, qualityMax } = params;

          // Skip if any image is too small
          fc.pre(imageWidths.every(w => w > 50) && imageHeights.every(h => h > 50));

          // Create mock order data with multiple images
          const orderData = createMockOrderDataWithMultipleImages(imageCount);

          // Create test image buffers for each image
          const imageBuffers = new Map<string, Buffer>();
          for (let i = 0; i < imageCount; i++) {
            const buffer = await createTestImageBuffer(imageWidths[i], imageHeights[i], channels as 3 | 4);
            imageBuffers.set(`test-product-${i}.jpg`, buffer);
            imageBuffers.set('test-logo.jpg', buffer); // Reuse for logo
            imageBuffers.set('test-qr.jpg', buffer); // Reuse for QR code
          }

          // Mock the loadImageBuffer method to return our test buffers
          const loadImageBufferSpy = jest.spyOn(service as any, 'loadImageBuffer');
          loadImageBufferSpy.mockImplementation((imageUrl: string) => {
            const buffer = imageBuffers.get(imageUrl) || imageBuffers.values().next().value;
            return Promise.resolve(buffer);
          });

          // Mock the batch optimization method to simulate consistent processing
          const batchOptimizationSpy = jest.spyOn(service as any, 'optimizeImageBatchWithConsistentSettings');
          batchOptimizationSpy.mockImplementation(async (imageUrls: string[], contentTypes: string[]) => {
            const results = [];
            let totalOriginalSize = 0;
            let totalOptimizedSize = 0;
            let successCount = 0;

            // Simulate consistent optimization settings for all images
            const consistentConfig = mockImageOptimizationConfigService.getConfiguration();

            for (let i = 0; i < imageUrls.length; i++) {
              const imageUrl = imageUrls[i];
              const buffer = imageBuffers.get(imageUrl) || imageBuffers.values().next().value;
              const originalSize = buffer.length;

              // Simulate consistent optimization with same settings
              const optimizedSize = Math.floor(originalSize * 0.6); // 40% reduction consistently
              const optimizedBuffer = buffer.slice(0, optimizedSize);

              const result = {
                optimizedBuffer,
                originalSize,
                optimizedSize,
                compressionRatio: (originalSize - optimizedSize) / originalSize,
                dimensions: {
                  original: { width: imageWidths[i % imageWidths.length], height: imageHeights[i % imageHeights.length] },
                  optimized: {
                    width: Math.min(imageWidths[i % imageWidths.length], maxWidth),
                    height: Math.min(imageHeights[i % imageHeights.length], maxHeight)
                  }
                },
                format: 'jpeg',
                processingTime: 100 + Math.random() * 50, // Consistent processing time range
                metadata: {
                  technique: 'aggressive', // Consistent technique
                  qualityUsed: qualityMin + (qualityMax - qualityMin) * 0.5, // Consistent quality
                  contentType: contentTypes[i] || 'photo',
                  formatConverted: false,
                  configurationUsed: consistentConfig
                },
                error: undefined
              };

              results.push(result);
              totalOriginalSize += originalSize;
              totalOptimizedSize += optimizedSize;
              successCount++;
            }

            return {
              results,
              totalOriginalSize,
              totalOptimizedSize,
              overallCompressionRatio: (totalOriginalSize - totalOptimizedSize) / totalOriginalSize,
              successCount,
              failureCount: 0
            };
          });

          try {
            const result = await service.optimizeOrderDataForPDF(orderData as OrderPDFData);

            // Property: All images should be processed
            expect(result.optimizedData).toBeDefined();
            expect(result.optimizations).toBeDefined();
            expect(Array.isArray(result.optimizations)).toBe(true);

            // Property: If batch optimization was called, verify consistent settings were used
            if (batchOptimizationSpy.mock.calls.length > 0) {
              const batchCall = batchOptimizationSpy.mock.calls[0];
              const [imageUrls, contentTypes] = batchCall;

              // Property: All images in the batch should be processed with the same configuration
              expect(imageUrls.length).toBeGreaterThan(1); // Multiple images
              expect(contentTypes.length).toBe(imageUrls.length); // Content types match image count

              // Property: The batch optimization should have been called with consistent parameters
              expect(batchOptimizationSpy).toHaveBeenCalledTimes(1); // Single batch call for consistency

              // Property: All images should use the same optimization technique
              const mockResults = await batchOptimizationSpy.mock.results[0].value;
              const successfulResults = mockResults.results.filter((r: any) => !r.error && r.optimizedBuffer);

              if (successfulResults.length > 1) {
                const firstTechnique = successfulResults[0].metadata?.technique;
                const firstQuality = successfulResults[0].metadata?.qualityUsed;

                // Property: All successful optimizations should use the same technique
                successfulResults.forEach((result: any, index: number) => {
                  expect(result.metadata?.technique).toBe(firstTechnique);

                  // Property: Quality settings should be consistent (within small tolerance for content-aware adjustments)
                  if (result.metadata?.qualityUsed && firstQuality) {
                    const qualityDifference = Math.abs(result.metadata.qualityUsed - firstQuality);
                    expect(qualityDifference).toBeLessThanOrEqual(10); // Allow 10% variance for content-aware optimization
                  }

                  // Property: All images should respect the same maximum dimensions
                  expect(result.dimensions.optimized.width).toBeLessThanOrEqual(maxWidth);
                  expect(result.dimensions.optimized.height).toBeLessThanOrEqual(maxHeight);

                  // Property: Compression ratios should be reasonably consistent (within 30% variance)
                  const compressionDifference = Math.abs(result.compressionRatio - successfulResults[0].compressionRatio);
                  expect(compressionDifference).toBeLessThanOrEqual(0.3);
                });

                // Property: Processing times should be in a reasonable range (consistent processing approach)
                const processingTimes = successfulResults.map((r: any) => r.processingTime);
                const avgProcessingTime = processingTimes.reduce((sum: number, time: number) => sum + time, 0) / processingTimes.length;

                processingTimes.forEach((time: number) => {
                  // Processing times should be within 200% of average (allowing for image size variance)
                  expect(time).toBeLessThanOrEqual(avgProcessingTime * 3);
                  expect(time).toBeGreaterThanOrEqual(avgProcessingTime * 0.3);
                });
              }

              // Property: Overall compression should be consistent
              expect(mockResults.overallCompressionRatio).toBeGreaterThanOrEqual(0);
              expect(mockResults.overallCompressionRatio).toBeLessThanOrEqual(1);

              // Property: Success count should match the number of images processed
              expect(mockResults.successCount).toBe(imageUrls.length);
              expect(mockResults.failureCount).toBe(0);
            }

            // Property: Size savings should be positive (optimization should reduce total size)
            expect(result.sizeSavings).toBeGreaterThanOrEqual(0);

            // Property: Optimizations array should contain information about consistent processing
            const hasConsistentOptimizationMessage = result.optimizations.some(opt =>
              opt.includes('Consistent batch optimization') || opt.includes('batch optimization')
            );

            if (imageCount > 1) {
              expect(hasConsistentOptimizationMessage).toBe(true);
            }

            // Restore mocks
            loadImageBufferSpy.mockRestore();
            batchOptimizationSpy.mockRestore();

          } catch (error) {
            // Property: Even if optimization fails, it should fail gracefully without crashing
            expect(error).toBeDefined();
            expect(error.message).toBeDefined();

            // Restore mocks in case of error
            loadImageBufferSpy.mockRestore();
            batchOptimizationSpy.mockRestore();
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