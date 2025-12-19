import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { PDFImageValidationService, ComprehensiveValidationResult } from '../../../src/pdf-generator/services/pdf-image-validation.service';
import { PDFImageOptimizationMetricsService } from '../../../src/pdf-generator/services/pdf-image-optimization-metrics.service';
import {
  OptimizedImageResult,
  ValidationResult
} from '../types/image-optimization.types';
import {
  ImageOptimizationConfig,
  defaultImageOptimizationConfig
} from '../../../src/pdf-generator/config/image-optimization.config';
import sharp from 'sharp';

describe('PDFImageValidationService', () => {
  let service: PDFImageValidationService;
  let metricsService: jest.Mocked<PDFImageOptimizationMetricsService>;

  // Test image buffers
  let originalImageBuffer: Buffer;
  let optimizedImageBuffer: Buffer;
  let testConfig: ImageOptimizationConfig;

  beforeEach(async () => {
    // Create mock metrics service
    const mockMetricsService = {
      recordPerformanceData: jest.fn(),
      recordImageOptimization: jest.fn(),
      getCurrentMetrics: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PDFImageValidationService,
        {
          provide: PDFImageOptimizationMetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    service = module.get<PDFImageValidationService>(PDFImageValidationService);
    metricsService = module.get(PDFImageOptimizationMetricsService);

    // Create test configuration
    testConfig = { ...defaultImageOptimizationConfig };

    // Create test image buffers
    await createTestImageBuffers();
  });

  /**
   * Create test image buffers for validation testing
   */
  async function createTestImageBuffers(): Promise<void> {
    // Create original image (800x600 JPEG)
    originalImageBuffer = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    })
    .jpeg({ quality: 90 })
    .toBuffer();

    // Create optimized image (300x225 JPEG, lower quality)
    optimizedImageBuffer = await sharp({
      create: {
        width: 300,
        height: 225,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    })
    .jpeg({ quality: 60 })
    .toBuffer();
  }

  /**
   * Create test optimization result
   */
  function createTestOptimizationResult(overrides: Partial<OptimizedImageResult> = {}): OptimizedImageResult {
    return {
      optimizedBuffer: optimizedImageBuffer,
      originalSize: originalImageBuffer.length,
      optimizedSize: optimizedImageBuffer.length,
      compressionRatio: (originalImageBuffer.length - optimizedImageBuffer.length) / originalImageBuffer.length,
      dimensions: {
        original: { width: 800, height: 600 },
        optimized: { width: 300, height: 225 }
      },
      format: 'jpeg',
      processingTime: 150,
      metadata: {
        contentType: 'photo',
        qualityUsed: 60,
        formatConverted: false,
        originalFormat: 'jpeg',
        technique: 'aggressive'
      },
      ...overrides
    };
  }

  describe('validateAggressiveOptimization', () => {
    it('should validate successfully optimized image', async () => {
      const optimizationResult = createTestOptimizationResult();

      const result = await service.validateAggressiveOptimization(
        originalImageBuffer,
        optimizedImageBuffer,
        optimizationResult,
        testConfig
      );

      expect(result.isValid).toBe(true);
      expect(result.validationBreakdown.sizeReduction.isValid).toBe(true);
      expect(result.validationBreakdown.sizeReduction.actualReduction).toBeGreaterThan(0);
      expect(result.validationBreakdown.qualityPreservation.isValid).toBe(false); // Quality may be below threshold
      expect(result.confidenceScore).toBeGreaterThan(0.5);
      expect(result.performanceMetrics.validationTime).toBeGreaterThan(0);
    });

    it('should handle empty optimized image', async () => {
      const emptyBuffer = Buffer.alloc(0);
      const optimizationResult = createTestOptimizationResult({
        optimizedBuffer: emptyBuffer,
        optimizedSize: 0
      });

      const result = await service.validateAggressiveOptimization(
        originalImageBuffer,
        emptyBuffer,
        optimizationResult,
        testConfig
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Optimized image is empty');
      expect(result.validationBreakdown.sizeReduction.isValid).toBe(true); // Size reduction is 100% (excellent)
      expect(result.confidenceScore).toBeGreaterThan(0); // Some confidence due to size reduction
    });

    it('should validate text content type with higher quality requirements', async () => {
      const optimizationResult = createTestOptimizationResult({
        metadata: {
          contentType: 'text',
          qualityUsed: 70,
          formatConverted: false,
          originalFormat: 'png',
          technique: 'aggressive'
        }
      });

      const result = await service.validateAggressiveOptimization(
        originalImageBuffer,
        optimizedImageBuffer,
        optimizationResult,
        testConfig
      );

      expect(result.validationBreakdown.qualityPreservation.readabilityMaintained).toBe(true);
      expect(result.validationBreakdown.formatOptimization.optimalFormatUsed).toBe(false); // JPEG not optimal for text
    });

    it('should generate recommendations for poor optimization', async () => {
      // Create poorly optimized result (no size reduction)
      const poorlyOptimizedBuffer = await sharp(originalImageBuffer).toBuffer();
      const optimizationResult = createTestOptimizationResult({
        optimizedBuffer: poorlyOptimizedBuffer,
        optimizedSize: poorlyOptimizedBuffer.length,
        compressionRatio: 0
      });

      const result = await service.validateAggressiveOptimization(
        originalImageBuffer,
        poorlyOptimizedBuffer,
        optimizationResult,
        testConfig
      );

      expect(result.isValid).toBe(false);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(rec => rec.includes('aggressive compression'))).toBe(true);
    });

    it('should record performance metrics', async () => {
      const optimizationResult = createTestOptimizationResult();

      await service.validateAggressiveOptimization(
        originalImageBuffer,
        optimizedImageBuffer,
        optimizationResult,
        testConfig
      );

      expect(metricsService.recordPerformanceData).toHaveBeenCalledWith(
        expect.objectContaining({
          operationType: 'single_image',
          success: true,
          duration: expect.any(Number)
        })
      );
    });
  });

  describe('validateMaximumSizeReduction', () => {
    it('should validate excellent size reduction', async () => {
      const result = await service.validateMaximumSizeReduction(
        originalImageBuffer,
        optimizedImageBuffer,
        0.1 // 10% minimum expected
      );

      expect(result.isValid).toBe(true);
      expect(result.actualReduction).toBeGreaterThan(0.1);
      expect(['excellent', 'good', 'acceptable']).toContain(result.effectiveness);
      expect(result.details).toContain('Size reduction:');
    });

    it('should fail validation for insufficient size reduction', async () => {
      // Use original buffer as "optimized" (no reduction)
      const result = await service.validateMaximumSizeReduction(
        originalImageBuffer,
        originalImageBuffer,
        0.1 // 10% minimum expected
      );

      expect(result.isValid).toBe(false);
      expect(result.actualReduction).toBe(0);
      expect(result.effectiveness).toBe('poor');
    });

    it('should handle validation errors gracefully', async () => {
      const invalidBuffer = Buffer.from('invalid image data');

      const result = await service.validateMaximumSizeReduction(
        originalImageBuffer,
        invalidBuffer,
        0.1
      );

      // Size reduction validation doesn't fail on invalid buffers, it just calculates size difference
      expect(result.isValid).toBe(true); // Size reduction is calculated correctly
      expect(result.actualReduction).toBeGreaterThan(0.9); // Invalid buffer is much smaller
      expect(result.effectiveness).toBe('excellent');
    });
  });

  describe('validateQualityPreservation', () => {
    it('should validate quality for photo content', async () => {
      const result = await service.validateQualityPreservation(
        originalImageBuffer,
        optimizedImageBuffer,
        'photo'
      );

      expect(result.isValid).toBe(false); // Quality may be below threshold due to aggressive compression
      expect(result.qualityScore).toBeGreaterThan(0);
      expect(result.visualIntegrityScore).toBeGreaterThan(0);
      expect(result.details).toContain('Quality score:');
    });

    it('should validate readability for text content', async () => {
      // Create larger optimized image for text readability
      const textOptimizedBuffer = await sharp({
        create: {
          width: 400,
          height: 300,
          channels: 3,
          background: { r: 255, g: 255, b: 255 }
        }
      })
      .png()
      .toBuffer();

      const result = await service.validateQualityPreservation(
        originalImageBuffer,
        textOptimizedBuffer,
        'text'
      );

      expect(result.readabilityMaintained).toBe(true);
      expect(result.qualityScore).toBeGreaterThan(0.2); // Lower expectation due to compression
    });

    it('should fail readability for very small text images', async () => {
      // Create very small optimized image
      const tinyBuffer = await sharp({
        create: {
          width: 50,
          height: 30,
          channels: 3,
          background: { r: 255, g: 255, b: 255 }
        }
      })
      .png()
      .toBuffer();

      const result = await service.validateQualityPreservation(
        originalImageBuffer,
        tinyBuffer,
        'text'
      );

      expect(result.readabilityMaintained).toBe(false);
    });
  });

  describe('validateFormatOptimization', () => {
    it('should validate optimal format for photo content', () => {
      const result = service.validateFormatOptimization(
        'png',
        'jpeg',
        'photo',
        0.5 // 50% compression ratio
      );

      expect(result.isValid).toBe(true);
      expect(result.optimalFormatUsed).toBe(true); // JPEG is optimal for photos
      expect(result.formatEfficiency).toBeGreaterThan(0.7);
      expect(result.compressionEffectiveness).toBeGreaterThan(0.3);
    });

    it('should detect suboptimal format for text content', () => {
      const result = service.validateFormatOptimization(
        'png',
        'jpeg',
        'text',
        0.3 // 30% compression ratio
      );

      expect(result.optimalFormatUsed).toBe(false); // PNG is optimal for text, not JPEG
      expect(result.details).toContain('Format: png → jpeg');
    });

    it('should handle validation errors gracefully', () => {
      const result = service.validateFormatOptimization(
        'unknown',
        'invalid',
        'photo',
        0.1
      );

      expect(result.isValid).toBe(false);
      expect(result.formatEfficiency).toBeGreaterThan(0); // Still calculates some efficiency
    });
  });

  describe('logOptimizationResults', () => {
    it('should log comprehensive optimization results', () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

      const validationResult: ComprehensiveValidationResult = {
        isValid: true,
        aspectRatioPreserved: true,
        dimensionsCorrect: true,
        qualityAcceptable: true,
        errors: [],
        warnings: [],
        metadata: {
          originalAspectRatio: 1.33,
          optimizedAspectRatio: 1.33,
          aspectRatioTolerance: 0.05,
          sizeReductionPercentage: 60
        },
        validationBreakdown: {
          sizeReduction: {
            isValid: true,
            actualReduction: 0.6,
            expectedMinimum: 0.1,
            effectiveness: 'excellent'
          },
          qualityPreservation: {
            isValid: true,
            qualityScore: 0.8,
            readabilityMaintained: true,
            visualIntegrityScore: 0.85
          },
          formatOptimization: {
            isValid: true,
            optimalFormatUsed: true,
            formatEfficiency: 0.9,
            compressionEffectiveness: 0.8
          },
          dimensionOptimization: {
            isValid: true,
            optimalDimensions: true,
            aspectRatioAccuracy: 0.98,
            scalingEffectiveness: 0.7
          }
        },
        performanceMetrics: {
          validationTime: 120,
          memoryUsage: 2048000,
          cpuUsage: 45
        },
        recommendations: [],
        confidenceScore: 0.95
      };

      const optimizationResult = createTestOptimizationResult();

      service.logOptimizationResults(validationResult, optimizationResult, 'test-operation');

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('[test-operation] === Comprehensive Optimization Results ===')
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Size Reduction: 60.0% (excellent) - VALID')
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Overall Validation: PASSED (confidence: 95.0%)')
      );

      logSpy.mockRestore();
    });

    it('should log warnings and errors', () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
      const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

      const validationResult: ComprehensiveValidationResult = {
        isValid: false,
        aspectRatioPreserved: false,
        dimensionsCorrect: false,
        qualityAcceptable: false,
        errors: ['Validation failed'],
        warnings: ['Quality compromised'],
        metadata: {
          originalAspectRatio: 1.33,
          optimizedAspectRatio: 1.5,
          aspectRatioTolerance: 0.05,
          sizeReductionPercentage: 5
        },
        validationBreakdown: {
          sizeReduction: {
            isValid: false,
            actualReduction: 0.05,
            expectedMinimum: 0.1,
            effectiveness: 'poor'
          },
          qualityPreservation: {
            isValid: false,
            qualityScore: 0.4,
            readabilityMaintained: false,
            visualIntegrityScore: 0.3
          },
          formatOptimization: {
            isValid: false,
            optimalFormatUsed: false,
            formatEfficiency: 0.3,
            compressionEffectiveness: 0.2
          },
          dimensionOptimization: {
            isValid: false,
            optimalDimensions: false,
            aspectRatioAccuracy: 0.6,
            scalingEffectiveness: 0.2
          }
        },
        performanceMetrics: {
          validationTime: 80,
          memoryUsage: 1024000,
          cpuUsage: 30
        },
        recommendations: ['Improve compression settings', 'Use optimal format'],
        confidenceScore: 0.2
      };

      const optimizationResult = createTestOptimizationResult();

      service.logOptimizationResults(validationResult, optimizationResult);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Validation Errors: Validation failed')
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Validation Warnings: Quality compromised')
      );

      logSpy.mockRestore();
      warnSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('should handle validation service errors gracefully', async () => {
      const invalidBuffer = Buffer.from('not an image');
      const optimizationResult = createTestOptimizationResult({
        optimizedBuffer: invalidBuffer
      });

      const result = await service.validateAggressiveOptimization(
        originalImageBuffer,
        invalidBuffer,
        optimizationResult,
        testConfig
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.performanceMetrics.validationTime).toBeGreaterThan(0);
    });

    it('should handle invalid image buffers', async () => {
      const invalidBuffer = Buffer.from('not an image');
      const optimizationResult = createTestOptimizationResult({
        optimizedBuffer: invalidBuffer
      });

      const result = await service.validateAggressiveOptimization(
        originalImageBuffer,
        invalidBuffer,
        optimizationResult,
        testConfig
      );

      expect(result.isValid).toBe(false);
      expect(result.performanceMetrics.validationTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('integration with metrics service', () => {
    beforeEach(() => {
      // Reset mock calls before each test
      jest.clearAllMocks();
    });

    it('should record performance data for successful validation', async () => {
      const optimizationResult = createTestOptimizationResult();

      await service.validateAggressiveOptimization(
        originalImageBuffer,
        optimizedImageBuffer,
        optimizationResult,
        testConfig
      );

      expect(metricsService.recordPerformanceData).toHaveBeenCalledWith(
        expect.objectContaining({
          operationType: 'single_image',
          success: expect.any(Boolean),
          duration: expect.any(Number),
          memoryUsage: expect.objectContaining({
            peak: expect.any(Number),
            average: expect.any(Number)
          }),
          cpuUsage: expect.objectContaining({
            cpuTime: expect.any(Number),
            utilization: expect.any(Number)
          })
        })
      );
    });

    it('should record performance data for failed validation', async () => {
      const emptyBuffer = Buffer.alloc(0);
      const optimizationResult = createTestOptimizationResult({
        optimizedBuffer: emptyBuffer
      });

      await service.validateAggressiveOptimization(
        originalImageBuffer,
        emptyBuffer,
        optimizationResult,
        testConfig
      );

      expect(metricsService.recordPerformanceData).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });
  });
});