import { Injectable, Logger } from '@nestjs/common';
import {
  OptimizedImageResult,
  ValidationResult,
  ImageAnalysisResult,
  PerformanceMonitoringData
} from '../types/image-optimization.types';
import {
  ImageOptimizationConfig,
  AggressiveScalingOptions
} from '../config/image-optimization.config';
import { PDFImageOptimizationMetricsService } from './pdf-image-optimization-metrics.service';
import sharp from 'sharp';

/**
 * Comprehensive Image Validation Result
 * Extended validation result with detailed analysis
 */
export interface ComprehensiveValidationResult extends ValidationResult {
  /** Detailed validation breakdown */
  validationBreakdown: {
    sizeReduction: {
      isValid: boolean;
      actualReduction: number;
      expectedMinimum: number;
      effectiveness: 'excellent' | 'good' | 'acceptable' | 'poor';
    };
    qualityPreservation: {
      isValid: boolean;
      qualityScore: number;
      readabilityMaintained: boolean;
      visualIntegrityScore: number;
    };
    formatOptimization: {
      isValid: boolean;
      optimalFormatUsed: boolean;
      formatEfficiency: number;
      compressionEffectiveness: number;
    };
    dimensionOptimization: {
      isValid: boolean;
      optimalDimensions: boolean;
      aspectRatioAccuracy: number;
      scalingEffectiveness: number;
    };
  };
  /** Performance metrics for this validation */
  performanceMetrics: {
    validationTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  /** Optimization recommendations */
  recommendations: string[];
  /** Validation confidence score (0-1) */
  confidenceScore: number;
}

/**
 * PDF Image Validation Service
 *
 * Implements comprehensive validation system for aggressively optimized images.
 * Validates size reduction, quality preservation, format optimization, and effectiveness.
 * Provides detailed logging and metrics for optimization results.
 *
 * Requirements: 2.1, 2.2, 2.4 - Validation for aggressive optimization effectiveness
 */
@Injectable()
export class PDFImageValidationService {
  private readonly logger = new Logger(PDFImageValidationService.name);

  // Validation thresholds for aggressive optimization
  private readonly MINIMUM_SIZE_REDUCTION = 0.1; // 10% minimum reduction
  private readonly EXCELLENT_SIZE_REDUCTION = 0.5; // 50% excellent reduction
  private readonly MINIMUM_QUALITY_SCORE = 0.6; // 60% minimum quality
  private readonly ASPECT_RATIO_TOLERANCE = 0.05; // 5% tolerance
  private readonly MAXIMUM_VALIDATION_TIME = 5000; // 5 seconds max validation time

  constructor(
    private metricsService: PDFImageOptimizationMetricsService
  ) {
    this.logger.log('PDF Image Validation Service initialized');
  }

  /**
   * Perform comprehensive validation of aggressively optimized images
   * @param original - Original image buffer
   * @param optimized - Optimized image buffer
   * @param optimizationResult - Optimization result with metadata
   * @param config - Image optimization configuration
   * @returns Promise<ComprehensiveValidationResult>
   */
  async validateAggressiveOptimization(
    original: Buffer,
    optimized: Buffer,
    optimizationResult: OptimizedImageResult,
    config: ImageOptimizationConfig
  ): Promise<ComprehensiveValidationResult> {
    const validationId = `validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    const memoryStart = process.memoryUsage();

    this.logger.log(`Starting comprehensive validation for aggressive optimization (${validationId})`);

    try {
      // Perform basic validation first
      const basicValidation = await this.performBasicValidation(original, optimized, config);

      // Perform detailed validation breakdown
      const validationBreakdown = await this.performDetailedValidation(
        original,
        optimized,
        optimizationResult,
        config
      );

      // Calculate performance metrics
      const validationTime = Date.now() - startTime;
      const memoryEnd = process.memoryUsage();
      const performanceMetrics = {
        validationTime,
        memoryUsage: memoryEnd.heapUsed - memoryStart.heapUsed,
        cpuUsage: process.cpuUsage().user / 1000 // Convert to milliseconds
      };

      // Generate recommendations
      const recommendations = this.generateOptimizationRecommendations(
        validationBreakdown,
        optimizationResult,
        config
      );

      // Calculate confidence score
      const confidenceScore = this.calculateValidationConfidence(validationBreakdown);

      // Determine overall validity
      const isValid = this.determineOverallValidity(validationBreakdown, basicValidation);

      const comprehensiveResult: ComprehensiveValidationResult = {
        ...basicValidation,
        isValid,
        validationBreakdown,
        performanceMetrics,
        recommendations,
        confidenceScore
      };

      // Log validation results
      this.logValidationResults(comprehensiveResult, validationId);

      // Record metrics
      this.recordValidationMetrics(comprehensiveResult, validationId, optimizationResult);

      return comprehensiveResult;

    } catch (error) {
      const validationTime = Date.now() - startTime;
      this.logger.error(`Comprehensive validation failed (${validationId}): ${error.message}`);

      // Return safe validation result on error
      return this.createFailedValidationResult(error.message, validationTime);
    }
  }

  /**
   * Validate maximum size reduction effectiveness
   * @param original - Original image buffer
   * @param optimized - Optimized image buffer
   * @param expectedReduction - Expected minimum reduction percentage
   * @returns Size reduction validation result
   */
  async validateMaximumSizeReduction(
    original: Buffer,
    optimized: Buffer,
    expectedReduction: number = this.MINIMUM_SIZE_REDUCTION
  ): Promise<{
    isValid: boolean;
    actualReduction: number;
    effectiveness: 'excellent' | 'good' | 'acceptable' | 'poor';
    details: string;
  }> {
    try {
      const originalSize = original.length;
      const optimizedSize = optimized.length;
      const actualReduction = originalSize > 0 ? (originalSize - optimizedSize) / originalSize : 0;

      let effectiveness: 'excellent' | 'good' | 'acceptable' | 'poor';
      if (actualReduction >= this.EXCELLENT_SIZE_REDUCTION) {
        effectiveness = 'excellent';
      } else if (actualReduction >= 0.3) {
        effectiveness = 'good';
      } else if (actualReduction >= expectedReduction) {
        effectiveness = 'acceptable';
      } else {
        effectiveness = 'poor';
      }

      const isValid = actualReduction >= expectedReduction;

      const details = `Size reduction: ${(actualReduction * 100).toFixed(1)}% ` +
        `(${this.formatFileSize(originalSize)} → ${this.formatFileSize(optimizedSize)})`;

      this.logger.debug(`Size reduction validation: ${details}, effectiveness: ${effectiveness}`);

      return {
        isValid,
        actualReduction,
        effectiveness,
        details
      };

    } catch (error) {
      this.logger.error(`Size reduction validation failed: ${error.message}`);
      return {
        isValid: false,
        actualReduction: 0,
        effectiveness: 'poor',
        details: `Validation error: ${error.message}`
      };
    }
  }

  /**
   * Validate quality preservation in aggressively optimized images
   * @param original - Original image buffer
   * @param optimized - Optimized image buffer
   * @param contentType - Type of image content
   * @returns Quality validation result
   */
  async validateQualityPreservation(
    original: Buffer,
    optimized: Buffer,
    contentType: 'text' | 'photo' | 'graphics' | 'logo' = 'photo'
  ): Promise<{
    isValid: boolean;
    qualityScore: number;
    readabilityMaintained: boolean;
    visualIntegrityScore: number;
    details: string;
  }> {
    try {
      // Get image metadata for quality analysis
      const [originalMeta, optimizedMeta] = await Promise.all([
        sharp(original).metadata(),
        sharp(optimized).metadata()
      ]);

      // Calculate quality metrics based on content type
      const qualityScore = await this.calculateQualityScore(
        original,
        optimized,
        originalMeta,
        optimizedMeta,
        contentType
      );

      // Check readability for text-based content
      const readabilityMaintained = await this.checkReadabilityMaintenance(
        optimized,
        optimizedMeta,
        contentType
      );

      // Calculate visual integrity score
      const visualIntegrityScore = await this.calculateVisualIntegrityScore(
        original,
        optimized,
        contentType
      );

      const isValid = qualityScore >= this.MINIMUM_QUALITY_SCORE &&
        (contentType !== 'text' || readabilityMaintained);

      const details = `Quality score: ${(qualityScore * 100).toFixed(1)}%, ` +
        `readability: ${readabilityMaintained ? 'maintained' : 'compromised'}, ` +
        `visual integrity: ${(visualIntegrityScore * 100).toFixed(1)}%`;

      this.logger.debug(`Quality validation for ${contentType}: ${details}`);

      return {
        isValid,
        qualityScore,
        readabilityMaintained,
        visualIntegrityScore,
        details
      };

    } catch (error) {
      this.logger.error(`Quality validation failed: ${error.message}`);
      return {
        isValid: false,
        qualityScore: 0,
        readabilityMaintained: false,
        visualIntegrityScore: 0,
        details: `Quality validation error: ${error.message}`
      };
    }
  }

  /**
   * Validate format optimization effectiveness
   * @param originalFormat - Original image format
   * @param optimizedFormat - Optimized image format
   * @param contentType - Type of image content
   * @param compressionRatio - Achieved compression ratio
   * @returns Format optimization validation result
   */
  validateFormatOptimization(
    originalFormat: string,
    optimizedFormat: string,
    contentType: 'text' | 'photo' | 'graphics' | 'logo',
    compressionRatio: number
  ): {
    isValid: boolean;
    optimalFormatUsed: boolean;
    formatEfficiency: number;
    compressionEffectiveness: number;
    details: string;
  } {
    try {
      // Determine optimal format for content type
      const optimalFormat = this.determineOptimalFormat(contentType);
      const optimalFormatUsed = optimizedFormat === optimalFormat;

      // Calculate format efficiency based on compression achieved
      const formatEfficiency = this.calculateFormatEfficiency(
        originalFormat,
        optimizedFormat,
        compressionRatio,
        contentType
      );

      // Evaluate compression effectiveness
      const compressionEffectiveness = Math.min(compressionRatio * 2, 1); // Scale to 0-1

      const isValid = formatEfficiency >= 0.7 && compressionEffectiveness >= 0.3;

      const details = `Format: ${originalFormat} → ${optimizedFormat} ` +
        `(optimal: ${optimalFormat}), efficiency: ${(formatEfficiency * 100).toFixed(1)}%, ` +
        `compression: ${(compressionEffectiveness * 100).toFixed(1)}%`;

      this.logger.debug(`Format optimization validation: ${details}`);

      return {
        isValid,
        optimalFormatUsed,
        formatEfficiency,
        compressionEffectiveness,
        details
      };

    } catch (error) {
      this.logger.error(`Format validation failed: ${error.message}`);
      return {
        isValid: false,
        optimalFormatUsed: false,
        formatEfficiency: 0,
        compressionEffectiveness: 0,
        details: `Format validation error: ${error.message}`
      };
    }
  }

  /**
   * Log comprehensive optimization results and size reduction metrics
   * @param validationResult - Comprehensive validation result
   * @param optimizationResult - Original optimization result
   * @param operationId - Operation identifier
   */
  logOptimizationResults(
    validationResult: ComprehensiveValidationResult,
    optimizationResult: OptimizedImageResult,
    operationId?: string
  ): void {
    try {
      const logPrefix = operationId ? `[${operationId}]` : '';

      this.logger.log(`${logPrefix} === Comprehensive Optimization Results ===`);

      // Log size reduction metrics
      const sizeReduction = validationResult.validationBreakdown.sizeReduction;
      this.logger.log(`${logPrefix} Size Reduction: ${(sizeReduction.actualReduction * 100).toFixed(1)}% ` +
        `(${sizeReduction.effectiveness}) - ${sizeReduction.isValid ? 'VALID' : 'INVALID'}`);

      // Log quality preservation
      const quality = validationResult.validationBreakdown.qualityPreservation;
      this.logger.log(`${logPrefix} Quality: ${(quality.qualityScore * 100).toFixed(1)}% ` +
        `(readability: ${quality.readabilityMaintained ? 'OK' : 'COMPROMISED'}) - ${quality.isValid ? 'VALID' : 'INVALID'}`);

      // Log format optimization
      const format = validationResult.validationBreakdown.formatOptimization;
      this.logger.log(`${logPrefix} Format: ${(format.formatEfficiency * 100).toFixed(1)}% efficiency ` +
        `(optimal: ${format.optimalFormatUsed ? 'YES' : 'NO'}) - ${format.isValid ? 'VALID' : 'INVALID'}`);

      // Log dimension optimization
      const dimensions = validationResult.validationBreakdown.dimensionOptimization;
      this.logger.log(`${logPrefix} Dimensions: ${(dimensions.aspectRatioAccuracy * 100).toFixed(1)}% accuracy ` +
        `(optimal: ${dimensions.optimalDimensions ? 'YES' : 'NO'}) - ${dimensions.isValid ? 'VALID' : 'INVALID'}`);

      // Log overall validation result
      this.logger.log(`${logPrefix} Overall Validation: ${validationResult.isValid ? 'PASSED' : 'FAILED'} ` +
        `(confidence: ${(validationResult.confidenceScore * 100).toFixed(1)}%)`);

      // Log performance metrics
      const perf = validationResult.performanceMetrics;
      this.logger.log(`${logPrefix} Performance: ${perf.validationTime}ms validation, ` +
        `${this.formatFileSize(perf.memoryUsage)} memory, ${perf.cpuUsage.toFixed(1)}ms CPU`);

      // Log recommendations if any
      if (validationResult.recommendations.length > 0) {
        this.logger.log(`${logPrefix} Recommendations:`);
        validationResult.recommendations.forEach((rec, index) => {
          this.logger.log(`${logPrefix}   ${index + 1}. ${rec}`);
        });
      }

      // Log errors and warnings
      if (validationResult.errors.length > 0) {
        this.logger.warn(`${logPrefix} Validation Errors: ${validationResult.errors.join(', ')}`);
      }
      if (validationResult.warnings.length > 0) {
        this.logger.warn(`${logPrefix} Validation Warnings: ${validationResult.warnings.join(', ')}`);
      }

      this.logger.log(`${logPrefix} ============================================`);

    } catch (error) {
      this.logger.error(`Failed to log optimization results: ${error.message}`);
    }
  }

  /**
   * Perform basic validation using existing validation logic
   */
  private async performBasicValidation(
    original: Buffer,
    optimized: Buffer,
    config: ImageOptimizationConfig
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      if (optimized.length === 0) {
        errors.push('Optimized image is empty');
        return {
          isValid: false,
          aspectRatioPreserved: false,
          dimensionsCorrect: false,
          qualityAcceptable: false,
          errors,
          warnings,
          metadata: {
            originalAspectRatio: 0,
            optimizedAspectRatio: 0,
            aspectRatioTolerance: this.ASPECT_RATIO_TOLERANCE,
            sizeReductionPercentage: 0,
          },
        };
      }

      // Get metadata for both images
      const [origMeta, optMeta] = await Promise.all([
        sharp(original).metadata(),
        sharp(optimized).metadata()
      ]);

      const originalWidth = origMeta.width || 0;
      const originalHeight = origMeta.height || 0;
      const optimizedWidth = optMeta.width || 0;
      const optimizedHeight = optMeta.height || 0;

      const originalAspectRatio = originalWidth / originalHeight;
      const optimizedAspectRatio = optimizedWidth / optimizedHeight;

      const aspectRatioPreserved = Math.abs(originalAspectRatio - optimizedAspectRatio) <= this.ASPECT_RATIO_TOLERANCE;

      if (!aspectRatioPreserved) {
        warnings.push(`Aspect ratio changed: ${originalAspectRatio.toFixed(2)} → ${optimizedAspectRatio.toFixed(2)}`);
      }

      // Check dimensions are within acceptable range
      const dimensionsCorrect =
        optimizedWidth >= config.aggressiveMode.minDimensions.width &&
        optimizedHeight >= config.aggressiveMode.minDimensions.height &&
        optimizedWidth <= config.aggressiveMode.maxDimensions.width &&
        optimizedHeight <= config.aggressiveMode.maxDimensions.height;

      if (!dimensionsCorrect) {
        errors.push(`Dimensions outside acceptable range: ${optimizedWidth}x${optimizedHeight}`);
      }

      // Check size reduction
      const sizeReductionPercentage = ((original.length - optimized.length) / original.length) * 100;
      const qualityAcceptable = sizeReductionPercentage > 0;

      if (optimized.length > original.length) {
        warnings.push('Optimized image is larger than original');
      }

      return {
        isValid: errors.length === 0,
        aspectRatioPreserved,
        dimensionsCorrect,
        qualityAcceptable,
        errors,
        warnings,
        metadata: {
          originalAspectRatio,
          optimizedAspectRatio,
          aspectRatioTolerance: this.ASPECT_RATIO_TOLERANCE,
          sizeReductionPercentage,
        },
      };

    } catch (error) {
      errors.push(`Basic validation error: ${error.message}`);
      return {
        isValid: false,
        aspectRatioPreserved: false,
        dimensionsCorrect: false,
        qualityAcceptable: false,
        errors,
        warnings,
        metadata: {
          originalAspectRatio: 0,
          optimizedAspectRatio: 0,
          aspectRatioTolerance: this.ASPECT_RATIO_TOLERANCE,
          sizeReductionPercentage: 0,
        },
      };
    }
  }

  /**
   * Perform detailed validation breakdown
   */
  private async performDetailedValidation(
    original: Buffer,
    optimized: Buffer,
    optimizationResult: OptimizedImageResult,
    config: ImageOptimizationConfig
  ): Promise<ComprehensiveValidationResult['validationBreakdown']> {
    // Validate size reduction
    const sizeReduction = await this.validateMaximumSizeReduction(original, optimized);

    // Validate quality preservation
    const contentType = optimizationResult.metadata?.contentType || 'photo';
    const qualityPreservation = await this.validateQualityPreservation(original, optimized, contentType);

    // Validate format optimization
    const originalFormat = optimizationResult.metadata?.originalFormat || 'unknown';
    const optimizedFormat = optimizationResult.format;
    const formatOptimization = this.validateFormatOptimization(
      originalFormat,
      optimizedFormat,
      contentType,
      optimizationResult.compressionRatio
    );

    // Validate dimension optimization
    const dimensionOptimization = await this.validateDimensionOptimization(
      original,
      optimized,
      optimizationResult,
      config
    );

    return {
      sizeReduction: {
        isValid: sizeReduction.isValid,
        actualReduction: sizeReduction.actualReduction,
        expectedMinimum: this.MINIMUM_SIZE_REDUCTION,
        effectiveness: sizeReduction.effectiveness
      },
      qualityPreservation: {
        isValid: qualityPreservation.isValid,
        qualityScore: qualityPreservation.qualityScore,
        readabilityMaintained: qualityPreservation.readabilityMaintained,
        visualIntegrityScore: qualityPreservation.visualIntegrityScore
      },
      formatOptimization: {
        isValid: formatOptimization.isValid,
        optimalFormatUsed: formatOptimization.optimalFormatUsed,
        formatEfficiency: formatOptimization.formatEfficiency,
        compressionEffectiveness: formatOptimization.compressionEffectiveness
      },
      dimensionOptimization: {
        isValid: dimensionOptimization.isValid,
        optimalDimensions: dimensionOptimization.optimalDimensions,
        aspectRatioAccuracy: dimensionOptimization.aspectRatioAccuracy,
        scalingEffectiveness: dimensionOptimization.scalingEffectiveness
      }
    };
  }

  /**
   * Validate dimension optimization
   */
  private async validateDimensionOptimization(
    original: Buffer,
    optimized: Buffer,
    optimizationResult: OptimizedImageResult,
    config: ImageOptimizationConfig
  ): Promise<{
    isValid: boolean;
    optimalDimensions: boolean;
    aspectRatioAccuracy: number;
    scalingEffectiveness: number;
  }> {
    try {
      const originalDims = optimizationResult.dimensions.original;
      const optimizedDims = optimizationResult.dimensions.optimized;

      // Check if dimensions are optimal for the configuration
      const optimalDimensions =
        optimizedDims.width <= config.aggressiveMode.maxDimensions.width &&
        optimizedDims.height <= config.aggressiveMode.maxDimensions.height &&
        optimizedDims.width >= config.aggressiveMode.minDimensions.width &&
        optimizedDims.height >= config.aggressiveMode.minDimensions.height;

      // Calculate aspect ratio accuracy
      const originalAspectRatio = originalDims.width / originalDims.height;
      const optimizedAspectRatio = optimizedDims.width / optimizedDims.height;
      const aspectRatioDiff = Math.abs(originalAspectRatio - optimizedAspectRatio);
      const aspectRatioAccuracy = Math.max(0, 1 - (aspectRatioDiff / this.ASPECT_RATIO_TOLERANCE));

      // Calculate scaling effectiveness (how much size reduction was achieved through scaling)
      const originalPixels = originalDims.width * originalDims.height;
      const optimizedPixels = optimizedDims.width * optimizedDims.height;
      const scalingEffectiveness = originalPixels > 0 ?
        (originalPixels - optimizedPixels) / originalPixels : 0;

      const isValid = optimalDimensions && aspectRatioAccuracy >= 0.9;

      return {
        isValid,
        optimalDimensions,
        aspectRatioAccuracy,
        scalingEffectiveness
      };

    } catch (error) {
      this.logger.error(`Dimension validation failed: ${error.message}`);
      return {
        isValid: false,
        optimalDimensions: false,
        aspectRatioAccuracy: 0,
        scalingEffectiveness: 0
      };
    }
  }

  /**
   * Calculate quality score based on image analysis
   */
  private async calculateQualityScore(
    original: Buffer,
    optimized: Buffer,
    originalMeta: sharp.Metadata,
    optimizedMeta: sharp.Metadata,
    contentType: 'text' | 'photo' | 'graphics' | 'logo'
  ): Promise<number> {
    try {
      // Simple quality estimation based on size reduction and content type
      const sizeRatio = optimized.length / original.length;
      const pixelRatio = ((optimizedMeta.width || 1) * (optimizedMeta.height || 1)) /
                        ((originalMeta.width || 1) * (originalMeta.height || 1));

      // Content-specific quality thresholds
      let baseQuality = 0.8;
      switch (contentType) {
        case 'text':
          baseQuality = 0.9; // Higher quality needed for text
          break;
        case 'logo':
          baseQuality = 0.85; // High quality for logos
          break;
        case 'graphics':
          baseQuality = 0.75; // Moderate quality for graphics
          break;
        case 'photo':
        default:
          baseQuality = 0.7; // Lower quality acceptable for photos
          break;
      }

      // Adjust quality based on compression ratio
      const compressionFactor = Math.min(sizeRatio * 2, 1);
      const pixelFactor = Math.min(pixelRatio * 1.5, 1);

      return Math.min(baseQuality * compressionFactor * pixelFactor, 1);

    } catch (error) {
      this.logger.error(`Quality score calculation failed: ${error.message}`);
      return 0.5; // Default moderate quality
    }
  }

  /**
   * Check if readability is maintained for text content
   */
  private async checkReadabilityMaintenance(
    optimized: Buffer,
    optimizedMeta: sharp.Metadata,
    contentType: 'text' | 'photo' | 'graphics' | 'logo'
  ): Promise<boolean> {
    try {
      if (contentType !== 'text') {
        return true; // Not applicable for non-text content
      }

      // Simple heuristic: text images should maintain minimum dimensions
      const width = optimizedMeta.width || 0;
      const height = optimizedMeta.height || 0;
      const minTextDimension = 100; // Minimum dimension for readable text

      return width >= minTextDimension && height >= minTextDimension;

    } catch (error) {
      this.logger.error(`Readability check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Calculate visual integrity score
   */
  private async calculateVisualIntegrityScore(
    original: Buffer,
    optimized: Buffer,
    contentType: 'text' | 'photo' | 'graphics' | 'logo'
  ): Promise<number> {
    try {
      // Simple visual integrity estimation based on size and content type
      const sizeRatio = optimized.length / original.length;

      // Content-specific integrity thresholds
      let integrityThreshold = 0.3;
      switch (contentType) {
        case 'text':
          integrityThreshold = 0.5; // Higher threshold for text
          break;
        case 'logo':
          integrityThreshold = 0.4; // Moderate threshold for logos
          break;
        case 'graphics':
          integrityThreshold = 0.35; // Moderate threshold for graphics
          break;
        case 'photo':
        default:
          integrityThreshold = 0.25; // Lower threshold for photos
          break;
      }

      // Calculate integrity score based on how much compression was applied
      return Math.min(sizeRatio / integrityThreshold, 1);

    } catch (error) {
      this.logger.error(`Visual integrity calculation failed: ${error.message}`);
      return 0.5; // Default moderate integrity
    }
  }

  /**
   * Determine optimal format for content type
   */
  private determineOptimalFormat(contentType: 'text' | 'photo' | 'graphics' | 'logo'): string {
    switch (contentType) {
      case 'text':
      case 'logo':
        return 'png';
      case 'graphics':
        return 'webp';
      case 'photo':
      default:
        return 'jpeg';
    }
  }

  /**
   * Calculate format efficiency
   */
  private calculateFormatEfficiency(
    originalFormat: string,
    optimizedFormat: string,
    compressionRatio: number,
    contentType: 'text' | 'photo' | 'graphics' | 'logo'
  ): number {
    const optimalFormat = this.determineOptimalFormat(contentType);
    const formatMatch = optimizedFormat === optimalFormat ? 1 : 0.8;
    const compressionEfficiency = Math.min(compressionRatio * 2, 1);

    return formatMatch * compressionEfficiency;
  }

  /**
   * Generate optimization recommendations
   */
  private generateOptimizationRecommendations(
    validationBreakdown: ComprehensiveValidationResult['validationBreakdown'],
    optimizationResult: OptimizedImageResult,
    config: ImageOptimizationConfig
  ): string[] {
    const recommendations: string[] = [];

    // Size reduction recommendations
    if (!validationBreakdown.sizeReduction.isValid) {
      if (validationBreakdown.sizeReduction.actualReduction < 0.1) {
        recommendations.push('Consider more aggressive compression settings to achieve better size reduction');
      }
      if (validationBreakdown.sizeReduction.effectiveness === 'poor') {
        recommendations.push('Try different optimization techniques or format conversion for better compression');
      }
    }

    // Quality recommendations
    if (!validationBreakdown.qualityPreservation.isValid) {
      if (validationBreakdown.qualityPreservation.qualityScore < 0.6) {
        recommendations.push('Increase quality settings to maintain better visual quality');
      }
      if (!validationBreakdown.qualityPreservation.readabilityMaintained) {
        recommendations.push('Preserve higher resolution for text-based content to maintain readability');
      }
    }

    // Format recommendations
    if (!validationBreakdown.formatOptimization.isValid) {
      if (!validationBreakdown.formatOptimization.optimalFormatUsed) {
        const contentType = optimizationResult.metadata?.contentType || 'photo';
        const optimalFormat = this.determineOptimalFormat(contentType);
        recommendations.push(`Consider using ${optimalFormat} format for ${contentType} content`);
      }
    }

    // Dimension recommendations
    if (!validationBreakdown.dimensionOptimization.isValid) {
      if (!validationBreakdown.dimensionOptimization.optimalDimensions) {
        recommendations.push('Adjust target dimensions to be within configured limits');
      }
      if (validationBreakdown.dimensionOptimization.aspectRatioAccuracy < 0.9) {
        recommendations.push('Improve aspect ratio preservation during scaling');
      }
    }

    return recommendations;
  }

  /**
   * Calculate validation confidence score
   */
  private calculateValidationConfidence(
    validationBreakdown: ComprehensiveValidationResult['validationBreakdown']
  ): number {
    const weights = {
      sizeReduction: 0.3,
      qualityPreservation: 0.3,
      formatOptimization: 0.2,
      dimensionOptimization: 0.2
    };

    let totalScore = 0;
    totalScore += validationBreakdown.sizeReduction.isValid ? weights.sizeReduction : 0;
    totalScore += validationBreakdown.qualityPreservation.isValid ? weights.qualityPreservation : 0;
    totalScore += validationBreakdown.formatOptimization.isValid ? weights.formatOptimization : 0;
    totalScore += validationBreakdown.dimensionOptimization.isValid ? weights.dimensionOptimization : 0;

    return totalScore;
  }

  /**
   * Determine overall validity
   */
  private determineOverallValidity(
    validationBreakdown: ComprehensiveValidationResult['validationBreakdown'],
    basicValidation: ValidationResult
  ): boolean {
    // Must pass basic validation and at least 75% of detailed validations
    const detailedValidations = [
      validationBreakdown.sizeReduction.isValid,
      validationBreakdown.qualityPreservation.isValid,
      validationBreakdown.formatOptimization.isValid,
      validationBreakdown.dimensionOptimization.isValid
    ];

    const passedCount = detailedValidations.filter(v => v).length;
    const passRate = passedCount / detailedValidations.length;

    return basicValidation.isValid && passRate >= 0.75;
  }

  /**
   * Log validation results
   */
  private logValidationResults(
    result: ComprehensiveValidationResult,
    validationId: string
  ): void {
    const status = result.isValid ? 'PASSED' : 'FAILED';
    const confidence = (result.confidenceScore * 100).toFixed(1);

    this.logger.log(`Comprehensive validation ${status} (${validationId}): confidence ${confidence}%`);

    if (!result.isValid) {
      this.logger.warn(`Validation failures: ${result.errors.join(', ')}`);
    }

    if (result.warnings.length > 0) {
      this.logger.warn(`Validation warnings: ${result.warnings.join(', ')}`);
    }
  }

  /**
   * Record validation metrics
   */
  private recordValidationMetrics(
    result: ComprehensiveValidationResult,
    validationId: string,
    optimizationResult: OptimizedImageResult
  ): void {
    try {
      // Create performance monitoring data
      const performanceData: PerformanceMonitoringData = {
        operationId: validationId,
        operationType: 'single_image',
        startTime: new Date(Date.now() - result.performanceMetrics.validationTime),
        endTime: new Date(),
        duration: result.performanceMetrics.validationTime,
        memoryUsage: {
          peak: result.performanceMetrics.memoryUsage,
          average: result.performanceMetrics.memoryUsage,
          start: 0,
          end: result.performanceMetrics.memoryUsage
        },
        cpuUsage: {
          cpuTime: result.performanceMetrics.cpuUsage,
          utilization: result.performanceMetrics.cpuUsage / result.performanceMetrics.validationTime
        },
        ioStats: {
          bytesRead: optimizationResult.originalSize,
          bytesWritten: optimizationResult.optimizedSize,
          readOperations: 2, // Original and optimized
          writeOperations: 1
        },
        success: result.isValid
      };

      this.metricsService.recordPerformanceData(performanceData);

    } catch (error) {
      this.logger.error(`Failed to record validation metrics: ${error.message}`);
    }
  }

  /**
   * Create failed validation result
   */
  private createFailedValidationResult(
    errorMessage: string,
    validationTime: number
  ): ComprehensiveValidationResult {
    return {
      isValid: false,
      aspectRatioPreserved: false,
      dimensionsCorrect: false,
      qualityAcceptable: false,
      errors: [errorMessage],
      warnings: [],
      metadata: {
        originalAspectRatio: 0,
        optimizedAspectRatio: 0,
        aspectRatioTolerance: this.ASPECT_RATIO_TOLERANCE,
        sizeReductionPercentage: 0,
      },
      validationBreakdown: {
        sizeReduction: {
          isValid: false,
          actualReduction: 0,
          expectedMinimum: this.MINIMUM_SIZE_REDUCTION,
          effectiveness: 'poor'
        },
        qualityPreservation: {
          isValid: false,
          qualityScore: 0,
          readabilityMaintained: false,
          visualIntegrityScore: 0
        },
        formatOptimization: {
          isValid: false,
          optimalFormatUsed: false,
          formatEfficiency: 0,
          compressionEffectiveness: 0
        },
        dimensionOptimization: {
          isValid: false,
          optimalDimensions: false,
          aspectRatioAccuracy: 0,
          scalingEffectiveness: 0
        }
      },
      performanceMetrics: {
        validationTime,
        memoryUsage: 0,
        cpuUsage: 0
      },
      recommendations: ['Fix validation errors and retry optimization'],
      confidenceScore: 0
    };
  }

  /**
   * Format file size in human-readable format
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}