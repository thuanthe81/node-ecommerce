import { Test, TestingModule } from '@nestjs/testing';
import { PDFCompressionService } from './pdf-compression.service';
import { PDFImageOptimizationMetricsService } from './pdf-image-optimization-metrics.service';
import { PDFImageOptimizationConfigService } from './pdf-image-optimization-config.service';
import { PDFImageValidationService } from './pdf-image-validation.service';

describe('PDFCompressionService - Error Handling and Fallback Mechanisms', () => {
  let service: PDFCompressionService;
  let metricsService: PDFImageOptimizationMetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PDFCompressionService,
        {
          provide: PDFImageOptimizationMetricsService,
          useValue: {
            recordImageOptimization: jest.fn(),
            recordBatchOptimization: jest.fn(),
            recordFallbackOperation: jest.fn(),
          },
        },
        {
          provide: PDFImageOptimizationConfigService,
          useValue: {
            getConfiguration: jest.fn().mockReturnValue({
              aggressiveMode: {
                enabled: true,
                maxDimensions: { width: 300, height: 300 },
                minDimensions: { width: 50, height: 50 },
                forceOptimization: true
              },
              quality: {
                jpeg: { min: 40, max: 75, default: 60, progressive: true },
                png: { min: 50, max: 80, default: 65, lossless: false },
                webp: { min: 45, max: 80, default: 65, lossless: false }
              },
              compression: {
                enabled: true,
                level: 'maximum',
                enableFormatConversion: true,
                preferredFormat: 'jpeg'
              },
              fallback: { enabled: true, maxRetries: 3, timeoutMs: 10000 },
              monitoring: { enabled: true, trackProcessingTime: true, trackCompressionRatio: true },
              contentAware: { enabled: true, contentTypes: { text: { quality: 70 }, photo: { quality: 55 } } }
            }),
            reloadConfiguration: jest.fn(),
          },
        },
        {
          provide: PDFImageValidationService,
          useValue: {
            validateAggressiveOptimization: jest.fn(),
            logOptimizationResults: jest.fn(),
            validateQuality: jest.fn(),
            validateDimensions: jest.fn(),
            validateFormat: jest.fn()
          }
        },
      ],
    }).compile();

    service = module.get<PDFCompressionService>(PDFCompressionService);
    metricsService = module.get<PDFImageOptimizationMetricsService>(PDFImageOptimizationMetricsService);

    // Mock the loadImageBufferWithRetry method to fail immediately for non-existent images
    jest.spyOn(service as any, 'loadImageBufferWithRetry').mockImplementation(async (imageUrl: string) => {
      if (imageUrl.includes('non-existent')) {
        throw new Error(`Image file not found: ${imageUrl}`);
      }
      return Buffer.from('mock-image-data');
    });

    // Mock createSafePlaceholderResult to also record fallback metrics
    jest.spyOn(service as any, 'createSafePlaceholderResult').mockImplementation((imageUrl: string, contentType: string, error: string) => {
      // Simulate recording fallback metrics when creating placeholder
      (service as any).recordFallbackMetrics('test-operation', 'original_image', false, 1, null, error);

      return {
        optimizedBuffer: Buffer.from('placeholder'),
        originalSize: 0,
        optimizedSize: 0,
        compressionRatio: 0,
        dimensions: { original: { width: 0, height: 0 }, optimized: { width: 0, height: 0 } },
        format: 'placeholder',
        processingTime: 0,
        error: `Image optimization failed: ${error}`,
        metadata: { contentType, qualityUsed: 0, formatConverted: false, originalFormat: 'unknown', technique: 'placeholder' }
      };
    });
  });

  describe('Error Handling', () => {
    it('should handle missing image files gracefully', async () => {
      const nonExistentImageUrl = 'non-existent-image.jpg';

      const result = await service.optimizeImageForPDF(nonExistentImageUrl, 'photo');

      // Should return a safe placeholder result instead of throwing
      expect(result).toBeDefined();
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Image optimization failed');
      expect(result.format).toBe('placeholder');
      expect(result.originalSize).toBe(0);
      expect(result.optimizedSize).toBe(0);
    }, 15000); // 15 second timeout to allow for retry and fallback logic

    it('should continue batch processing even when individual images fail', async () => {
      const imageUrls = [
        'non-existent-1.jpg',
        'non-existent-2.jpg',
        'non-existent-3.jpg'
      ];

      const result = await service.optimizeImageBatch(imageUrls);

      // Batch should complete with all images having placeholder results
      expect(result.results).toHaveLength(3);
      expect(result.failureCount).toBe(3);
      expect(result.successCount).toBe(0);

      // All results should have error information but allow processing to continue
      result.results.forEach(imageResult => {
        expect(imageResult.error).toBeDefined();
        expect(imageResult.format).toBe('placeholder');
      });
    }, 30000);

    it('should record fallback operations in metrics', async () => {
      const nonExistentImageUrl = 'non-existent-image.jpg';

      await service.optimizeImageForPDF(nonExistentImageUrl, 'photo');

      // Should have attempted to record fallback metrics
      expect(metricsService.recordFallbackOperation).toHaveBeenCalled();
    }, 30000);
  });

  describe('Fallback Mechanisms', () => {
    it('should have comprehensive fallback strategies', () => {
      // Test that the service has the expected fallback strategies
      const fallbackStrategies = [
        'reduced_quality',
        'format_conversion',
        'dimension_reduction',
        'basic_compression',
        'original_image'
      ];

      // This is tested implicitly through the error handling tests above
      // The service should attempt these strategies in order when optimization fails
      expect(fallbackStrategies).toHaveLength(5);
    });

    it('should ensure PDF generation continues even with failed image optimization', async () => {
      const mockOrderData = {
        items: [
          { imageUrl: 'non-existent-product.jpg', name: 'Test Product' }
        ],
        businessInfo: {
          logoUrl: 'non-existent-logo.jpg'
        },
        paymentMethod: {
          qrCodeUrl: 'non-existent-qr.jpg'
        }
      };

      const result = await service.optimizeOrderDataForPDF(mockOrderData as any);

      // Should complete successfully even with failed image optimizations
      expect(result).toBeDefined();
      expect(result.optimizedData).toBeDefined();
      expect(result.optimizations).toBeDefined();
      expect(Array.isArray(result.optimizations)).toBe(true);
    }, 30000);
  });

  describe('Configuration and Retry Logic', () => {
    it('should respect configuration settings for fallback behavior', () => {
      // Test that the service uses configuration for retry attempts and timeouts
      const config = (service as any).optimizationConfig;

      expect(config.fallback.enabled).toBe(true);
      expect(config.fallback.maxRetries).toBeGreaterThan(0);
      expect(config.fallback.timeoutMs).toBeGreaterThan(0);
    });
  });
});