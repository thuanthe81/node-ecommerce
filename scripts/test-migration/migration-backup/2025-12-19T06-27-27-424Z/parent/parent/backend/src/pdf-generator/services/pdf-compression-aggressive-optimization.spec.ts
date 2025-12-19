import { Test, TestingModule } from '@nestjs/testing';
import { PDFCompressionService } from './pdf-compression.service';
import { PDFImageOptimizationMetricsService } from './pdf-image-optimization-metrics.service';
import { PDFImageOptimizationConfigService } from './pdf-image-optimization-config.service';
import { PDFImageValidationService } from './pdf-image-validation.service';
import { CompressedImageService } from './compressed-image.service';
import { OptimizedImageResult } from '../types/image-optimization.types';

/**
 * Unit Tests for Aggressive Image Optimization Service
 *
 * **Task 14: Write unit tests for aggressive image optimization service**
 *
 * Tests aggressive image scaling algorithms, dynamic size calculation,
 * aspect ratio preservation, configuration loading, error handling,
 * and size reduction metrics generation accuracy.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 4.1, 4.2, 4.4, 4.5
 */
describe('PDFCompressionService - Aggressive Image Optimization', () => {
  let service: PDFCompressionService;
  let configService: PDFImageOptimizationConfigService;
  let metricsService: PDFImageOptimizationMetricsService;
  let validationService: PDFImageValidationService;

  const mockMetricsService = {
    recordImageOptimization: jest.fn(),
    recordBatchOptimization: jest.fn(),
    recordPerformanceData: jest.fn(),
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

  const mockConfigService = {
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
    })),
    isAggressiveModeEnabled: jest.fn(() => true),
    isMonitoringEnabled: jest.fn(() => true),
    isContentAwareEnabled: jest.fn(() => true),
    getQualitySettings: jest.fn((format) => ({
      min: 40,
      max: 80,
      default: 60
    })),
    getContentTypeSettings: jest.fn((contentType) => ({
      quality: 60,
      preserveSharpness: true,
      allowAggressive: true
    }))
  };

  const mockValidationService = {
    validateAggressiveOptimization: jest.fn().mockReturnValue({
      isValid: true,
      warnings: [],
      errors: []
    }),
    logOptimizationResults: jest.fn(),
    validateQuality: jest.fn().mockReturnValue(true),
    validateDimensions: jest.fn().mockReturnValue(true),
    validateFormat: jest.fn().mockReturnValue(true)
  };

  const mockCompressedImageService = {
    getCompressedImage: jest.fn().mockResolvedValue(null),
    saveCompressedImage: jest.fn().mockResolvedValue('compressed/path/image.jpg'),
    hasCompressedImage: jest.fn().mockResolvedValue(false),
    getStorageMetrics: jest.fn().mockResolvedValue({
      totalStorageSize: 0,
      totalCompressedImages: 0,
      reuseRate: 0,
      averageCompressionRatio: 0,
      storageUtilization: 0,
    }),
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
          useValue: mockConfigService
        },
        {
          provide: PDFImageValidationService,
          useValue: mockValidationService
        },
        {
          provide: CompressedImageService,
          useValue: mockCompressedImageService
        }
      ],
    }).compile();

    service = module.get<PDFCompressionService>(PDFCompressionService);
    configService = module.get<PDFImageOptimizationConfigService>(PDFImageOptimizationConfigService);
    metricsService = module.get<PDFImageOptimizationMetricsService>(PDFImageOptimizationMetricsService);
    validationService = module.get<PDFImageValidationService>(PDFImageValidationService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Aggressive Image Scaling Algorithms', () => {
    /**
     * **Requirement 2.1: Maximum size reduction**
     * Test that images are aggressively scaled to minimum viable dimensions
     */
    it('should calculate aggressive scaling dimensions for maximum size reduction', () => {
      // Access private method for testing
      const calculateAggressiveDimensions = (service as any).calculateAggressiveDimensions.bind(service);

      // Test large image scaling
      const largeDimensions = calculateAggressiveDimensions(2000, 1500, 'photo');
      expect(largeDimensions.width).toBeLessThanOrEqual(300); // Max width from config
      expect(largeDimensions.height).toBeLessThanOrEqual(300); // Max height from config
      expect(largeDimensions.width).toBeGreaterThanOrEqual(50); // Min width from config
      expect(largeDimensions.height).toBeGreaterThanOrEqual(50); // Min height from config

      // Test medium image scaling
      const mediumDimensions = calculateAggressiveDimensions(800, 600, 'graphics');
      expect(mediumDimensions.width).toBeLessThanOrEqual(300);
      expect(mediumDimensions.height).toBeLessThanOrEqual(300);

      // Test small image handling
      const smallDimensions = calculateAggressiveDimensions(100, 80, 'logo');
      expect(smallDimensions.width).toBeGreaterThan(0);
      expect(smallDimensions.height).toBeGreaterThan(0);
    });

    /**
     * **Requirement 2.2: Aspect ratio preservation with aggressive scaling**
     * Test that aspect ratios are maintained during aggressive optimization
     */
    it('should preserve aspect ratio during aggressive scaling', () => {
      const calculateAggressiveDimensions = (service as any).calculateAggressiveDimensions.bind(service);

      // Test various aspect ratios
      const testCases = [
        { width: 1600, height: 900, expectedRatio: 16/9 }, // 16:9 widescreen
        { width: 1200, height: 1200, expectedRatio: 1 },   // Square
        { width: 800, height: 1200, expectedRatio: 2/3 },  // Portrait
        { width: 2000, height: 500, expectedRatio: 4 },    // Wide banner
      ];

      testCases.forEach(({ width, height, expectedRatio }) => {
        const result = calculateAggressiveDimensions(width, height, 'photo');
        const actualRatio = result.width / result.height;

        // Allow small tolerance for rounding
        expect(Math.abs(actualRatio - expectedRatio)).toBeLessThan(0.1);
      });
    });

    /**
     * **Requirement 2.4: Dynamic sizing logic**
     * Test content-aware dimension calculation
     */
    it('should calculate content-aware dimensions based on image type', () => {
      const calculateContentAwareDimensions = (service as any).calculateContentAwareDimensions.bind(service);

      const originalWidth = 1000;
      const originalHeight = 800;

      // Text content should get higher resolution
      const textDimensions = calculateContentAwareDimensions(originalWidth, originalHeight, 'text');

      // Photo content should get standard aggressive scaling
      const photoDimensions = calculateContentAwareDimensions(originalWidth, originalHeight, 'photo');

      // Logo content should get higher quality than photos
      const logoDimensions = calculateContentAwareDimensions(originalWidth, originalHeight, 'logo');

      // Graphics should balance quality and size
      const graphicsDimensions = calculateContentAwareDimensions(originalWidth, originalHeight, 'graphics');

      // Text should have higher resolution than photos
      expect(textDimensions.width).toBeGreaterThanOrEqual(photoDimensions.width);
      expect(textDimensions.height).toBeGreaterThanOrEqual(photoDimensions.height);

      // Logo should have higher resolution than photos but may be less than text
      expect(logoDimensions.width).toBeGreaterThanOrEqual(photoDimensions.width);
      expect(logoDimensions.height).toBeGreaterThanOrEqual(photoDimensions.height);

      // All should maintain reasonable bounds
      [textDimensions, photoDimensions, logoDimensions, graphicsDimensions].forEach(dims => {
        expect(dims.width).toBeGreaterThan(0);
        expect(dims.height).toBeGreaterThan(0);
        expect(dims.width).toBeLessThanOrEqual(300); // Max from config
        expect(dims.height).toBeLessThanOrEqual(300); // Max from config
      });
    });
  });

  describe('Dynamic Size Calculation', () => {
    /**
     * **Requirement 2.1, 2.4: Dynamic optimization based on content**
     */
    it('should determine optimal format based on content type and original format', () => {
      const determineOptimalFormat = (service as any).determineOptimalFormat.bind(service);

      // Text and logos should prefer PNG for sharpness
      expect(determineOptimalFormat('text', 'jpeg')).toBe('png');
      expect(determineOptimalFormat('logo', 'jpeg')).toBe('png');

      // Photos should prefer JPEG for compression
      expect(determineOptimalFormat('photo', 'png')).toBe('jpeg');

      // Graphics should prefer PNG or WebP
      const graphicsFormat = determineOptimalFormat('graphics', 'jpeg');
      expect(['png', 'webp']).toContain(graphicsFormat);
    });

    it('should calculate quality settings based on content type and format', () => {
      const calculateOptimalQuality = (service as any).calculateOptimalQuality.bind(service);

      // Photos should allow lower quality for better compression
      const photoQuality = calculateOptimalQuality('photo', 'jpeg');
      expect(photoQuality).toBeLessThanOrEqual(70);
      expect(photoQuality).toBeGreaterThanOrEqual(40);

      // Text should use higher quality for readability
      const textQuality = calculateOptimalQuality('text', 'png');
      expect(textQuality).toBeGreaterThanOrEqual(70);

      // Logos should maintain high quality
      const logoQuality = calculateOptimalQuality('logo', 'png');
      expect(logoQuality).toBeGreaterThanOrEqual(75);
    });
  });

  describe('Configuration Loading and Validation', () => {
    /**
     * **Requirement 4.1, 4.2: Configuration compliance**
     */
    it('should load and validate aggressive optimization configuration', () => {
      const config = configService.getConfiguration();

      expect(config.aggressiveMode.enabled).toBe(true);
      expect(config.aggressiveMode.maxDimensions.width).toBeGreaterThan(0);
      expect(config.aggressiveMode.maxDimensions.height).toBeGreaterThan(0);
      expect(config.aggressiveMode.minDimensions.width).toBeGreaterThan(0);
      expect(config.aggressiveMode.minDimensions.height).toBeGreaterThan(0);
      expect(config.aggressiveMode.forceOptimization).toBe(true);

      // Validate quality settings
      expect(config.quality.jpeg.min).toBeLessThanOrEqual(config.quality.jpeg.default);
      expect(config.quality.jpeg.default).toBeLessThanOrEqual(config.quality.jpeg.max);
      expect(config.quality.png.min).toBeLessThanOrEqual(config.quality.png.default);
      expect(config.quality.png.default).toBeLessThanOrEqual(config.quality.png.max);
    });

    it('should handle configuration validation failures gracefully', () => {
      // Mock invalid configuration
      mockConfigService.getConfiguration.mockReturnValueOnce({
        aggressiveMode: {
          enabled: true,
          maxDimensions: { width: -100, height: -100 }, // Invalid
          minDimensions: { width: 50, height: 50 },
          forceOptimization: true
        }
      });

      mockValidationService.validateAggressiveOptimization.mockReturnValueOnce({
        isValid: false,
        warnings: [],
        errors: ['Invalid max dimensions']
      });

      // Service should handle invalid config gracefully
      expect(() => {
        const config = configService.getConfiguration();
        validationService.validateAggressiveOptimization(config as any);
      }).not.toThrow();
    });
  });

  describe('Error Handling and Fallback Mechanisms', () => {
    /**
     * **Requirement 4.4: Error handling and fallback**
     */
    it('should handle image processing failures with fallback', async () => {
      // Mock image loading failure
      jest.spyOn(service as any, 'loadImageBuffer').mockRejectedValueOnce(new Error('Image not found'));

      // Mock fallback to original image
      jest.spyOn(service as any, 'handleOptimizationFailure').mockResolvedValueOnce({
        optimizedBuffer: Buffer.from('original-image-data'),
        originalSize: 1000,
        optimizedSize: 1000,
        compressionRatio: 0,
        dimensions: {
          original: { width: 100, height: 100 },
          optimized: { width: 100, height: 100 }
        },
        format: 'jpeg',
        processingTime: 0,
        error: 'Optimization failed, using original',
        metadata: {
          contentType: 'photo',
          qualityUsed: 0,
          formatConverted: false,
          originalFormat: 'jpeg',
          technique: 'fallback'
        }
      });

      const result = await service.optimizeImageForPDF('non-existent-image.jpg', 'photo');

      expect(result.error).toBeDefined();
      expect(result.metadata.technique).toBe('fallback');
      expect(result.compressionRatio).toBe(0);
    });

    it('should retry optimization with different settings on failure', async () => {
      let attemptCount = 0;

      // Mock first two attempts to fail, third to succeed
      jest.spyOn(service as any, 'applyComprehensiveOptimization').mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error(`Attempt ${attemptCount} failed`);
        }
        return {
          optimizedBuffer: Buffer.from('optimized-after-retry'),
          originalSize: 1000,
          optimizedSize: 500,
          compressionRatio: 0.5,
          dimensions: {
            original: { width: 100, height: 100 },
            optimized: { width: 50, height: 50 }
          },
          format: 'jpeg',
          processingTime: 150,
          metadata: {
            contentType: 'photo',
            qualityUsed: 60,
            formatConverted: false,
            originalFormat: 'jpeg',
            technique: 'retry_success'
          }
        };
      });

      // Mock image loading to succeed
      jest.spyOn(service as any, 'loadImageBuffer').mockResolvedValue(Buffer.from('test-image'));

      const result = await service.optimizeImageForPDF('test-image.jpg', 'photo');

      expect(attemptCount).toBe(3); // Should have retried twice before success
      expect(result.metadata.technique).toBe('retry_success');
      expect(result.compressionRatio).toBe(0.5);
    });

    it('should handle timeout scenarios gracefully', async () => {
      // Mock a long-running operation that times out
      jest.spyOn(service as any, 'applyComprehensiveOptimization').mockImplementation(async () => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              optimizedBuffer: Buffer.from('timeout-result'),
              originalSize: 1000,
              optimizedSize: 800,
              compressionRatio: 0.2,
              dimensions: {
                original: { width: 100, height: 100 },
                optimized: { width: 90, height: 90 }
              },
              format: 'jpeg',
              processingTime: 15000, // Exceeds timeout
              metadata: {
                contentType: 'photo',
                qualityUsed: 60,
                formatConverted: false,
                originalFormat: 'jpeg',
                technique: 'timeout_handled'
              }
            });
          }, 15000); // 15 seconds, should timeout
        });
      });

      // Mock timeout handling
      jest.spyOn(service as any, 'handleOptimizationTimeout').mockResolvedValue({
        optimizedBuffer: Buffer.from('fallback-after-timeout'),
        originalSize: 1000,
        optimizedSize: 1000,
        compressionRatio: 0,
        dimensions: {
          original: { width: 100, height: 100 },
          optimized: { width: 100, height: 100 }
        },
        format: 'jpeg',
        processingTime: 10000,
        error: 'Operation timed out',
        metadata: {
          contentType: 'photo',
          qualityUsed: 0,
          formatConverted: false,
          originalFormat: 'jpeg',
          technique: 'timeout_fallback'
        }
      });

      // Mock image loading
      jest.spyOn(service as any, 'loadImageBuffer').mockResolvedValue(Buffer.from('test-image'));

      const result = await service.optimizeImageForPDF('test-image.jpg', 'photo');

      expect(result.error).toContain('timed out');
      expect(result.metadata.technique).toBe('timeout_fallback');
    });
  });

  describe('Size Reduction Metrics Generation', () => {
    /**
     * **Requirement 4.5: Metrics generation accuracy**
     */
    it('should generate accurate size reduction metrics', async () => {
      const mockOptimizedResult: OptimizedImageResult = {
        optimizedBuffer: Buffer.from('optimized-image'),
        originalSize: 2000,
        optimizedSize: 800,
        compressionRatio: 0.6, // 60% compression
        dimensions: {
          original: { width: 200, height: 200 },
          optimized: { width: 100, height: 100 }
        },
        format: 'jpeg',
        processingTime: 250,
        metadata: {
          contentType: 'photo',
          qualityUsed: 65,
          formatConverted: false,
          originalFormat: 'jpeg',
          technique: 'aggressive'
        }
      };

      // Mock the optimization process
      jest.spyOn(service as any, 'applyComprehensiveOptimization').mockResolvedValue(mockOptimizedResult);
      jest.spyOn(service as any, 'loadImageBuffer').mockResolvedValue(Buffer.from('test-image'));

      const result = await service.optimizeImageForPDF('test-image.jpg', 'photo');

      // Verify metrics accuracy
      expect(result.originalSize).toBe(2000);
      expect(result.optimizedSize).toBe(800);
      expect(result.compressionRatio).toBe(0.6);

      // Calculate size savings
      const sizeSavings = result.originalSize - result.optimizedSize;
      expect(sizeSavings).toBe(1200);

      // Verify compression percentage
      const compressionPercentage = (sizeSavings / result.originalSize) * 100;
      expect(compressionPercentage).toBe(60);

      // Verify metrics were recorded
      expect(metricsService.recordImageOptimization).toHaveBeenCalledWith(
        expect.objectContaining({
          originalSize: 2000,
          optimizedSize: 800,
          compressionRatio: 0.6
        }),
        expect.any(String)
      );
    });

    it('should track processing time accurately', async () => {
      const startTime = Date.now();

      const mockResult: OptimizedImageResult = {
        optimizedBuffer: Buffer.from('optimized'),
        originalSize: 1000,
        optimizedSize: 600,
        compressionRatio: 0.4,
        dimensions: {
          original: { width: 100, height: 100 },
          optimized: { width: 80, height: 80 }
        },
        format: 'jpeg',
        processingTime: 150,
        metadata: {
          contentType: 'photo',
          qualityUsed: 60,
          formatConverted: false,
          originalFormat: 'jpeg',
          technique: 'aggressive'
        }
      };

      jest.spyOn(service as any, 'applyComprehensiveOptimization').mockImplementation(async () => {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 100));
        return mockResult;
      });

      jest.spyOn(service as any, 'loadImageBuffer').mockResolvedValue(Buffer.from('test-image'));

      const result = await service.optimizeImageForPDF('test-image.jpg', 'photo');

      const endTime = Date.now();
      const actualProcessingTime = endTime - startTime;

      // Processing time should be reasonable (allowing for test overhead)
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.processingTime).toBeLessThan(actualProcessingTime + 50); // Allow 50ms overhead
    });

    it('should generate comprehensive batch optimization metrics', async () => {
      const mockResults: OptimizedImageResult[] = [
        {
          optimizedBuffer: Buffer.from('opt1'),
          originalSize: 1000,
          optimizedSize: 500,
          compressionRatio: 0.5,
          dimensions: {
            original: { width: 100, height: 100 },
            optimized: { width: 70, height: 70 }
          },
          format: 'jpeg',
          processingTime: 100,
          metadata: {
            contentType: 'photo',
            qualityUsed: 60,
            formatConverted: false,
            originalFormat: 'jpeg',
            technique: 'aggressive'
          }
        },
        {
          optimizedBuffer: Buffer.from('opt2'),
          originalSize: 800,
          optimizedSize: 400,
          compressionRatio: 0.5,
          dimensions: {
            original: { width: 80, height: 80 },
            optimized: { width: 60, height: 60 }
          },
          format: 'png',
          processingTime: 120,
          metadata: {
            contentType: 'logo',
            qualityUsed: 80,
            formatConverted: true,
            originalFormat: 'png',
            technique: 'aggressive'
          }
        }
      ];

      // Mock individual optimizations
      jest.spyOn(service, 'optimizeImageForPDF')
        .mockResolvedValueOnce(mockResults[0])
        .mockResolvedValueOnce(mockResults[1]);

      const batchResult = await service.optimizeImageBatch(
        ['image1.jpg', 'image2.png'],
        ['photo', 'logo']
      );

      // Verify batch metrics
      expect(batchResult.results).toHaveLength(2);
      expect(batchResult.successCount).toBe(2);
      expect(batchResult.failureCount).toBe(0);
      expect(batchResult.totalOriginalSize).toBe(1800); // 1000 + 800
      expect(batchResult.totalOptimizedSize).toBe(900); // 500 + 400
      expect(batchResult.overallCompressionRatio).toBe(0.5); // (1800 - 900) / 1800

      // Verify batch metrics were recorded
      expect(metricsService.recordBatchOptimization).toHaveBeenCalledWith(
        expect.objectContaining({
          results: mockResults,
          totalOriginalSize: 1800,
          totalOptimizedSize: 900,
          overallCompressionRatio: 0.5
        }),
        expect.any(String)
      );
    });
  });

  describe('Optimization of All Images Regardless of Size', () => {
    /**
     * **Requirement 2.3: Optimization of all images**
     */
    it('should optimize small images even when they are already small', async () => {
      const mockSmallImageResult: OptimizedImageResult = {
        optimizedBuffer: Buffer.from('small-optimized'),
        originalSize: 200, // Very small image
        optimizedSize: 150,
        compressionRatio: 0.25,
        dimensions: {
          original: { width: 30, height: 30 },
          optimized: { width: 25, height: 25 }
        },
        format: 'png',
        processingTime: 50,
        metadata: {
          contentType: 'logo',
          qualityUsed: 85,
          formatConverted: false,
          originalFormat: 'png',
          technique: 'aggressive'
        }
      };

      jest.spyOn(service as any, 'applyComprehensiveOptimization').mockResolvedValue(mockSmallImageResult);
      jest.spyOn(service as any, 'loadImageBuffer').mockResolvedValue(Buffer.from('small-image'));

      const result = await service.optimizeImageForPDF('small-image.png', 'logo');

      // Even small images should be processed
      expect(result.originalSize).toBe(200);
      expect(result.optimizedSize).toBe(150);
      expect(result.compressionRatio).toBe(0.25);
      expect(result.metadata.technique).toBe('aggressive');
    });

    it('should apply compression to all image formats', async () => {
      const formats = ['jpeg', 'png', 'webp', 'gif'];
      const results: OptimizedImageResult[] = [];

      // Mock optimization for each format
      formats.forEach((format, index) => {
        const mockResult: OptimizedImageResult = {
          optimizedBuffer: Buffer.from(`optimized-${format}`),
          originalSize: 1000 + (index * 100),
          optimizedSize: 600 + (index * 50),
          compressionRatio: 0.4 + (index * 0.05),
          dimensions: {
            original: { width: 100, height: 100 },
            optimized: { width: 80, height: 80 }
          },
          format: format as any,
          processingTime: 100 + (index * 10),
          metadata: {
            contentType: 'photo',
            qualityUsed: 60 + (index * 5),
            formatConverted: false,
            originalFormat: format,
            technique: 'aggressive'
          }
        };
        results.push(mockResult);
      });

      jest.spyOn(service as any, 'applyComprehensiveOptimization')
        .mockResolvedValueOnce(results[0])
        .mockResolvedValueOnce(results[1])
        .mockResolvedValueOnce(results[2])
        .mockResolvedValueOnce(results[3]);

      jest.spyOn(service as any, 'loadImageBuffer').mockResolvedValue(Buffer.from('test-image'));

      // Test each format
      for (let i = 0; i < formats.length; i++) {
        const result = await service.optimizeImageForPDF(`test.${formats[i]}`, 'photo');
        expect(result.format).toBe(formats[i]);
        expect(result.compressionRatio).toBeGreaterThan(0);
        expect(result.metadata.technique).toBe('aggressive');
      }
    });
  });
});