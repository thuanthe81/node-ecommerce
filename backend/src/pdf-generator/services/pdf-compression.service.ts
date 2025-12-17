import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PDFGenerationResult, OrderPDFData } from '../types/pdf.types';
import {
  OptimizedImageResult,
  ValidationResult,
  ImageAnalysisResult,
  FallbackResult,
  PerformanceMonitoringData
} from '../types/image-optimization.types';
import {
  ImageOptimizationConfig,
  AggressiveScalingOptions,
  getAggressiveScalingOptions,
  validateImageOptimizationConfig
} from '../config/image-optimization.config';
import { PDFImageOptimizationMetricsService } from './pdf-image-optimization-metrics.service';
import { PDFImageOptimizationConfigService } from './pdf-image-optimization-config.service';
import { PDFImageValidationService, ComprehensiveValidationResult } from './pdf-image-validation.service';
import { CompressedImageService } from './compressed-image.service';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * PDF Compression Service
 *
 * Handles PDF compression and size optimization:
 * - PDF compression to reduce file sizes
 * - Image optimization and compression for product images
 * - Alternative delivery methods for large PDF files
 * - Size validation and warnings for oversized attachments
 */
@Injectable()
export class PDFCompressionService {
  private readonly logger = new Logger(PDFCompressionService.name);

  // Configuration constants
  private readonly MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024; // 25MB max attachment size
  private readonly LARGE_FILE_THRESHOLD = 10 * 1024 * 1024; // 10MB threshold for large files
  private readonly IMAGE_QUALITY = 80; // JPEG quality for image compression
  private readonly MAX_IMAGE_WIDTH = 800; // Max width for product images
  private readonly MAX_IMAGE_HEIGHT = 600; // Max height for product images

  // Image optimization configuration
  private readonly optimizationConfig: ImageOptimizationConfig;

  constructor(
    @Inject(forwardRef(() => PDFImageOptimizationMetricsService))
    private metricsService: PDFImageOptimizationMetricsService,
    private configService: PDFImageOptimizationConfigService,
    private validationService: PDFImageValidationService,
    private compressedImageService: CompressedImageService
  ) {
    this.optimizationConfig = this.configService.getConfiguration();
    const validation = validateImageOptimizationConfig(this.optimizationConfig);

    if (!validation.isValid) {
      this.logger.error('Invalid image optimization configuration:', validation.errors);
      throw new Error(`Invalid image optimization configuration: ${validation.errors.join(', ')}`);
    }

    if (validation.warnings.length > 0) {
      this.logger.warn('Image optimization configuration warnings:', validation.warnings);
    }
  }

  /**
   * Reload configuration from ConfigService
   * Allows dynamic configuration updates without service restart
   * @returns Updated ImageOptimizationConfig
   */
  reloadConfiguration(): ImageOptimizationConfig {
    this.logger.log('Reloading image optimization configuration from ConfigService');

    const newConfig = this.configService.reloadConfiguration();

    // Update the current configuration reference
    Object.assign(this.optimizationConfig, newConfig);

    this.logger.log('Configuration successfully reloaded and applied');
    return this.optimizationConfig;
  }

  /**
   * Get current configuration for external access
   * @returns Current ImageOptimizationConfig
   */
  getCurrentConfiguration(): ImageOptimizationConfig {
    return this.configService.getConfiguration();
  }

  /**
   * Compress PDF file to reduce size
   * @param filePath - Path to the PDF file to compress
   * @returns Promise<{ success: boolean; originalSize: number; compressedSize: number; compressionRatio: number; error?: string }>
   */
  async compressPDF(filePath: string): Promise<{
    success: boolean;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    error?: string;
  }> {
    try {
      this.logger.log(`Compressing PDF file: ${filePath}`);

      if (!fs.existsSync(filePath)) {
        throw new Error(`PDF file not found: ${filePath}`);
      }

      const originalSize = fs.statSync(filePath).size;
      this.logger.log(`Original PDF size: ${this.formatFileSize(originalSize)}`);

      // For now, we'll use Puppeteer's built-in compression options
      // In a production environment, you might want to use a dedicated PDF compression library
      // like pdf-lib or ghostscript

      // Since we're using Puppeteer, the compression is handled during PDF generation
      // This method serves as a placeholder for future compression enhancements
      const compressedSize = originalSize; // No additional compression applied yet

      const compressionRatio = originalSize > 0 ? (originalSize - compressedSize) / originalSize : 0;

      this.logger.log(`PDF compression completed. Size: ${this.formatFileSize(compressedSize)}, Ratio: ${(compressionRatio * 100).toFixed(1)}%`);

      return {
        success: true,
        originalSize,
        compressedSize,
        compressionRatio,
      };
    } catch (error) {
      this.logger.error(`Failed to compress PDF: ${error.message}`);
      return {
        success: false,
        originalSize: 0,
        compressedSize: 0,
        compressionRatio: 0,
        error: error.message,
      };
    }
  }

  /**
   * Optimize and compress images for PDF inclusion
   * @param imageUrl - URL or path to the image
   * @returns Promise<{ optimizedImageData: Buffer; originalSize: number; optimizedSize: number; error?: string }>
   */
  async optimizeImage(imageUrl: string): Promise<{
    optimizedImageData?: Buffer;
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
    error?: string;
  }> {
    try {
      this.logger.log(`Optimizing image: ${imageUrl}`);

      // Use comprehensive optimization if aggressive mode is enabled
      if (this.optimizationConfig.aggressiveMode.enabled) {
        const result = await this.comprehensiveImageOptimization(imageUrl);
        return {
          optimizedImageData: result.optimizedBuffer,
          originalSize: result.originalSize,
          optimizedSize: result.optimizedSize,
          compressionRatio: result.compressionRatio,
          error: result.error,
        };
      }

      // Fallback to legacy optimization
      return this.legacyOptimizeImage(imageUrl);
    } catch (error) {
      this.logger.error(`Failed to optimize image ${imageUrl}: ${error.message}`);
      return {
        originalSize: 0,
        optimizedSize: 0,
        compressionRatio: 0,
        error: error.message,
      };
    }
  }

  /**
   * Legacy image optimization method (preserved for backward compatibility)
   */
  private async legacyOptimizeImage(imageUrl: string): Promise<{
    optimizedImageData?: Buffer;
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
    error?: string;
  }> {
    try {
      // Handle both local file paths and URLs
      let imageBuffer: Buffer;

      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        // Fetch image from URL
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        imageBuffer = Buffer.from(await response.arrayBuffer());
      } else {
        // Read local file
        const imagePath = imageUrl.startsWith('/') ? imageUrl : path.join(process.cwd(), imageUrl);
        if (!fs.existsSync(imagePath)) {
          throw new Error(`Image file not found: ${imagePath}`);
        }
        imageBuffer = fs.readFileSync(imagePath);
      }

      const originalSize = imageBuffer.length;
      this.logger.log(`Original image size: ${this.formatFileSize(originalSize)}`);

      // Optimize image using Sharp
      const optimizedImageData = await sharp(imageBuffer)
        .resize(this.MAX_IMAGE_WIDTH, this.MAX_IMAGE_HEIGHT, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({
          quality: this.IMAGE_QUALITY,
          progressive: true,
        })
        .toBuffer();

      const optimizedSize = optimizedImageData.length;
      const compressionRatio = originalSize > 0 ? (originalSize - optimizedSize) / originalSize : 0;

      this.logger.log(`Image optimization completed. Size: ${this.formatFileSize(optimizedSize)}, Ratio: ${(compressionRatio * 100).toFixed(1)}%`);

      return {
        optimizedImageData,
        originalSize,
        optimizedSize,
        compressionRatio,
      };
    } catch (error) {
      this.logger.error(`Failed to optimize image ${imageUrl}: ${error.message}`);
      return {
        originalSize: 0,
        optimizedSize: 0,
        compressionRatio: 0,
        error: error.message,
      };
    }
  }

  /**
   * Reduce image to minimum size with aggressive scaling
   * @param imageBuffer - Image data as Buffer
   * @param options - Aggressive scaling options
   * @returns Promise<OptimizedImageResult>
   */
  async reduceImageToMinimumSize(
    imageBuffer: Buffer,
    options: AggressiveScalingOptions
  ): Promise<OptimizedImageResult> {
    const startTime = Date.now();
    const operationId = `reduce-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const memoryStart = process.memoryUsage();

    try {
      this.logger.log(`Reducing image to minimum size with aggressive scaling`);

      const originalSize = imageBuffer.length;

      // Get image metadata
      const metadata = await sharp(imageBuffer).metadata();
      const originalWidth = metadata.width || 0;
      const originalHeight = metadata.height || 0;
      const originalFormat = metadata.format || 'unknown';

      this.logger.log(`Original dimensions: ${originalWidth}x${originalHeight}, format: ${originalFormat}`);

      // Calculate optimal dimensions
      const optimalDimensions = this.calculateOptimalDimensions(
        originalWidth,
        originalHeight,
        options.contentAware ? 'photo' : 'photo'
      );

      // Ensure dimensions are within bounds
      const targetWidth = Math.max(
        options.minWidth,
        Math.min(options.maxWidth, optimalDimensions.width)
      );
      const targetHeight = Math.max(
        options.minHeight,
        Math.min(options.maxHeight, optimalDimensions.height)
      );

      this.logger.log(`Target dimensions: ${targetWidth}x${targetHeight}`);

      // Determine quality based on size reduction needed
      const sizeReductionFactor = (originalWidth * originalHeight) / (targetWidth * targetHeight);
      const dynamicQuality = this.calculateDynamicQuality(sizeReductionFactor, options.qualityRange);

      // Create Sharp pipeline with proper minimum dimension enforcement
      let resizeOptions: sharp.ResizeOptions;

      if (options.maintainAspectRatio) {
        // When maintaining aspect ratio, we need to ensure minimum dimensions are respected
        // Calculate which dimension should be the constraint to meet minimum requirements
        const aspectRatio = originalWidth / originalHeight;
        const targetAspectRatio = targetWidth / targetHeight;

        let finalWidth = targetWidth;
        let finalHeight = targetHeight;

        // Adjust dimensions to ensure minimums are met while maintaining aspect ratio
        if (aspectRatio > targetAspectRatio) {
          // Image is wider - width will be the limiting factor
          finalWidth = Math.max(options.minWidth, targetWidth);
          finalHeight = Math.max(options.minHeight, Math.round(finalWidth / aspectRatio));
        } else {
          // Image is taller - height will be the limiting factor
          finalHeight = Math.max(options.minHeight, targetHeight);
          finalWidth = Math.max(options.minWidth, Math.round(finalHeight * aspectRatio));
        }

        // Ensure we don't exceed maximum dimensions
        if (finalWidth > options.maxWidth) {
          finalWidth = options.maxWidth;
          finalHeight = Math.round(finalWidth / aspectRatio);
        }
        if (finalHeight > options.maxHeight) {
          finalHeight = options.maxHeight;
          finalWidth = Math.round(finalHeight * aspectRatio);
        }

        // Final check to ensure minimums are still met after max constraints
        finalWidth = Math.max(options.minWidth, finalWidth);
        finalHeight = Math.max(options.minHeight, finalHeight);

        resizeOptions = {
          width: finalWidth,
          height: finalHeight,
          fit: 'fill', // Use fill to ensure exact dimensions
          withoutEnlargement: false,
          kernel: sharp.kernel.lanczos3
        };

        this.logger.log(`Enforced minimum dimensions: ${finalWidth}x${finalHeight} (min: ${options.minWidth}x${options.minHeight})`);
      } else {
        resizeOptions = {
          width: targetWidth,
          height: targetHeight,
          fit: 'fill',
          withoutEnlargement: false,
          kernel: sharp.kernel.lanczos3
        };
      }

      let pipeline = sharp(imageBuffer).resize(resizeOptions);

      // Apply enhanced format-specific optimization with consistent settings
      const optimizedBuffer = await this.applyFormatOptimization(
        imageBuffer,
        options.format,
        { width: targetWidth, height: targetHeight },
        dynamicQuality,
        options.contentAware ? 'photo' : 'photo' // Default content type, could be enhanced
      );

      const optimizedSize = optimizedBuffer.length;
      const compressionRatio = originalSize > 0 ? (originalSize - optimizedSize) / originalSize : 0;
      const processingTime = Date.now() - startTime;

      // Get final dimensions
      const finalMetadata = await sharp(optimizedBuffer).metadata();
      const finalWidth = finalMetadata.width || targetWidth;
      const finalHeight = finalMetadata.height || targetHeight;

      this.logger.log(
        `Aggressive scaling completed: ${originalWidth}x${originalHeight} → ${finalWidth}x${finalHeight}, ` +
        `${this.formatFileSize(originalSize)} → ${this.formatFileSize(optimizedSize)} ` +
        `(${(compressionRatio * 100).toFixed(1)}% reduction) in ${processingTime}ms`
      );

      const result: OptimizedImageResult = {
        optimizedBuffer,
        originalSize,
        optimizedSize,
        compressionRatio,
        dimensions: {
          original: { width: originalWidth, height: originalHeight },
          optimized: { width: finalWidth, height: finalHeight },
        },
        format: options.format,
        processingTime,
        metadata: {
          contentType: 'photo', // Default content type
          qualityUsed: dynamicQuality,
          formatConverted: originalFormat !== options.format,
          originalFormat,
          technique: 'aggressive',
        },
      };

      // Record metrics and performance data
      this.recordOptimizationMetrics(result, operationId, memoryStart, startTime, true);

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(`Failed to reduce image to minimum size: ${error.message}`);

      const result: OptimizedImageResult = {
        originalSize: imageBuffer.length,
        optimizedSize: 0,
        compressionRatio: 0,
        dimensions: {
          original: { width: 0, height: 0 },
          optimized: { width: 0, height: 0 },
        },
        format: options.format,
        processingTime,
        error: error.message,
        metadata: {
          contentType: 'photo',
          qualityUsed: 0,
          formatConverted: false,
          originalFormat: 'unknown',
          technique: 'aggressive',
        },
      };

      // Record metrics and performance data for failed operation
      this.recordOptimizationMetrics(result, operationId, memoryStart, startTime, false);

      return result;
    }
  }

  /**
   * Calculate optimal dimensions based on content type and aggressive scaling
   * @param width - Original width
   * @param height - Original height
   * @param contentType - Type of content (text, photo, graphics, logo)
   * @returns Optimal dimensions
   */
  calculateOptimalDimensions(
    width: number,
    height: number,
    contentType: string
  ): { width: number; height: number } {
    const config = this.optimizationConfig;
    const maxWidth = config.aggressiveMode.maxDimensions.width;
    const maxHeight = config.aggressiveMode.maxDimensions.height;
    const minWidth = config.aggressiveMode.minDimensions.width;
    const minHeight = config.aggressiveMode.minDimensions.height;

    // Calculate aspect ratio
    const aspectRatio = width / height;

    // Apply content-specific adjustments
    let targetWidth = maxWidth;
    let targetHeight = maxHeight;

    switch (contentType) {
      case 'text':
        // Text images need higher resolution to maintain readability
        targetWidth = Math.min(maxWidth * 1.2, width);
        targetHeight = Math.min(maxHeight * 1.2, height);
        break;

      case 'logo':
        // Logos need to maintain crispness
        targetWidth = Math.min(maxWidth * 1.1, width);
        targetHeight = Math.min(maxHeight * 1.1, height);
        break;

      case 'graphics':
        // Graphics can be more aggressively compressed
        targetWidth = maxWidth * 0.9;
        targetHeight = maxHeight * 0.9;
        break;

      case 'photo':
      default:
        // Photos can be most aggressively compressed
        targetWidth = maxWidth;
        targetHeight = maxHeight;
        break;
    }

    // Maintain aspect ratio
    if (aspectRatio > 1) {
      // Landscape orientation
      targetHeight = targetWidth / aspectRatio;
    } else {
      // Portrait orientation
      targetWidth = targetHeight * aspectRatio;
    }

    // Ensure minimum dimensions
    targetWidth = Math.max(minWidth, Math.round(targetWidth));
    targetHeight = Math.max(minHeight, Math.round(targetHeight));

    // Ensure we don't exceed maximums
    targetWidth = Math.min(maxWidth, targetWidth);
    targetHeight = Math.min(maxHeight, targetHeight);

    this.logger.log(
      `Calculated optimal dimensions for ${contentType}: ${width}x${height} → ${targetWidth}x${targetHeight} ` +
      `(aspect ratio: ${aspectRatio.toFixed(2)})`
    );

    return { width: targetWidth, height: targetHeight };
  }

  /**
   * Optimize image for PDF inclusion with aggressive settings
   * Enhanced with compressed image storage integration for reuse and performance
   * @param imageUrl - URL or path to the image
   * @param contentType - Type of content for content-aware optimization
   * @returns Promise<OptimizedImageResult>
   */
  async optimizeImageForPDF(
    imageUrl: string,
    contentType: 'text' | 'photo' | 'graphics' | 'logo' = 'photo'
  ): Promise<OptimizedImageResult> {
    const operationId = `optimize-pdf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      this.logger.log(`Optimizing image for PDF: ${imageUrl} (content type: ${contentType}, operation: ${operationId})`);

      // **INTEGRATION STEP 1: Check compressed directory before optimization with enhanced error handling**
      try {
        const compressedImage = await this.getCompressedImage(imageUrl);
        if (compressedImage) {
          this.logger.log(`Retrieved compressed image for ${imageUrl} (${this.formatFileSize(compressedImage.optimizedSize)})`);

          // Update metadata to indicate storage retrieval
          compressedImage.metadata.technique = 'storage';
          compressedImage.metadata.contentType = contentType;
          compressedImage.processingTime = Date.now() - startTime;

          // Record reuse metrics
          this.recordImageReuseMetrics(imageUrl, compressedImage, operationId);

          return compressedImage;
        }
      } catch (storageError) {
        // Enhanced error handling: Storage retrieval failed, but continue with fresh optimization
        this.logger.warn(`Compressed image retrieval failed for ${imageUrl}: ${storageError.message}, proceeding with fresh optimization`);
      }

      // **INTEGRATION STEP 2: Perform fresh optimization if not in storage**
      this.logger.log(`No compressed image found for ${imageUrl}, performing fresh optimization`);

      // Load image buffer with error handling
      const imageBuffer = await this.loadImageBufferWithRetry(imageUrl, operationId);

      // Get aggressive scaling options for the content type
      const scalingOptions = getAggressiveScalingOptions(this.optimizationConfig, contentType);

      // Apply aggressive scaling with timeout protection
      const result = await this.optimizeWithTimeoutProtection(
        () => this.reduceImageToMinimumSize(imageBuffer, scalingOptions),
        this.optimizationConfig.fallback.timeoutMs,
        `Image optimization for ${imageUrl}`
      );

      // Update metadata with correct content type
      if (result.metadata) {
        result.metadata.contentType = contentType;
      }

      // Validate the optimization result
      const validation = await this.validateImageOptimization(imageBuffer, result.optimizedBuffer || Buffer.alloc(0));

      if (!validation.isValid && this.optimizationConfig.fallback.enabled) {
        this.logger.warn(`Optimization validation failed, attempting comprehensive fallback: ${validation.errors.join(', ')}`);
        const fallbackResult = await this.handleOptimizationFallback(imageBuffer, scalingOptions, validation);

        // **INTEGRATION STEP 3: Save successful fallback result to compressed storage with enhanced error handling**
        if (fallbackResult.optimizedBuffer && !fallbackResult.error) {
          try {
            await this.saveCompressedImage(imageUrl, fallbackResult);
          } catch (saveError) {
            // Enhanced error handling: Storage save failed, but don't affect the fallback result
            this.logger.warn(`Failed to save compressed fallback image for ${imageUrl}: ${saveError.message}, but fallback succeeded`);
          }
        }

        return fallbackResult;
      }

      // **INTEGRATION STEP 4: Save successful optimization to compressed storage with enhanced error handling**
      if (result.optimizedBuffer && !result.error) {
        try {
          await this.saveCompressedImage(imageUrl, result);
        } catch (saveError) {
          // Enhanced error handling: Storage save failed, but don't affect the optimization result
          this.logger.warn(`Failed to save compressed image for ${imageUrl}: ${saveError.message}, but optimization succeeded`);
        }
      }

      this.logger.log(`Image optimization completed successfully for ${imageUrl} in ${Date.now() - startTime}ms`);
      return result;

    } catch (error) {
      this.logger.error(`Primary optimization failed for ${imageUrl}: ${error.message}`);

      // Enhanced error handling: Attempt comprehensive fallback if enabled
      if (this.optimizationConfig.fallback.enabled) {
        try {
          this.logger.log(`Attempting comprehensive fallback for ${imageUrl}`);

          const imageBuffer = await this.loadImageBufferWithRetry(imageUrl, operationId);
          const scalingOptions = getAggressiveScalingOptions(this.optimizationConfig, contentType);

          const fallbackResult = await this.handleOptimizationFallback(imageBuffer, scalingOptions, {
            isValid: false,
            aspectRatioPreserved: false,
            dimensionsCorrect: false,
            qualityAcceptable: false,
            errors: [error.message],
            warnings: [],
            metadata: {
              originalAspectRatio: 0,
              optimizedAspectRatio: 0,
              aspectRatioTolerance: 0.05,
              sizeReductionPercentage: 0,
            },
          });

          // **INTEGRATION STEP 5: Save successful fallback result to compressed storage with enhanced error handling**
          if (fallbackResult.optimizedBuffer && !fallbackResult.error) {
            try {
              await this.saveCompressedImage(imageUrl, fallbackResult);
            } catch (saveError) {
              // Enhanced error handling: Storage save failed, but don't affect the comprehensive fallback result
              this.logger.warn(`Failed to save compressed comprehensive fallback image for ${imageUrl}: ${saveError.message}, but comprehensive fallback succeeded`);
            }
          }

          this.logger.log(`Fallback optimization completed for ${imageUrl}`);
          return fallbackResult;

        } catch (fallbackError) {
          this.logger.error(`Comprehensive fallback failed for ${imageUrl}: ${fallbackError.message}`);

          // Enhanced error handling: Attempt critical error recovery
          try {
            return await this.performCriticalErrorRecovery(imageUrl, contentType, `Primary: ${error.message}; Fallback: ${fallbackError.message}`);
          } catch (recoveryError) {
            this.logger.error(`Critical error recovery failed for ${imageUrl}: ${recoveryError.message}`);

            // Final attempt: return a safe placeholder result to ensure PDF generation continues
            return this.createSafePlaceholderResult(imageUrl, contentType, error.message, fallbackError.message);
          }
        }
      }

      // Enhanced error handling: If fallback is disabled, attempt critical recovery
      try {
        this.logger.warn(`Fallback disabled, attempting critical recovery for ${imageUrl}`);
        return await this.performCriticalErrorRecovery(imageUrl, contentType, error.message);
      } catch (recoveryError) {
        this.logger.error(`Critical recovery failed for ${imageUrl}: ${recoveryError.message}`);

        // Final fallback: return safe placeholder to ensure PDF generation continues
        this.logger.warn(`All recovery attempts failed, returning safe placeholder for ${imageUrl}`);
        return this.createSafePlaceholderResult(imageUrl, contentType, error.message);
      }
    }
  }

  /**
   * Load image buffer with retry logic and comprehensive error handling
   * @param imageUrl - URL or path to the image
   * @param operationId - Operation identifier for tracking
   * @returns Promise<Buffer>
   */
  private async loadImageBufferWithRetry(imageUrl: string, operationId: string): Promise<Buffer> {
    const maxRetries = this.optimizationConfig.fallback.maxRetries;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(`Loading image buffer: ${imageUrl} (attempt ${attempt + 1}/${maxRetries + 1})`);

        // Add timeout protection to image loading
        const buffer = await this.optimizeWithTimeoutProtection(
          () => this.loadImageBuffer(imageUrl),
          this.optimizationConfig.fallback.timeoutMs,
          `Loading image from ${imageUrl}`
        );

        if (buffer.length === 0) {
          throw new Error('Loaded image buffer is empty');
        }

        this.logger.log(`Successfully loaded image buffer: ${imageUrl} (${buffer.length} bytes)`);
        return buffer;

      } catch (error) {
        lastError = error;
        this.logger.warn(`Failed to load image buffer (attempt ${attempt + 1}): ${error.message}`);

        // If this isn't the last attempt, wait before retrying
        if (attempt < maxRetries) {
          const delayMs = 1000 * (attempt + 1); // Progressive delay: 1s, 2s, 3s
          this.logger.log(`Retrying image load in ${delayMs}ms...`);
          await this.delay(delayMs);
        }
      }
    }

    throw new Error(`Failed to load image after ${maxRetries + 1} attempts. Last error: ${lastError?.message}`);
  }

  /**
   * Execute operation with timeout protection
   * @param operation - Operation to execute
   * @param timeoutMs - Timeout in milliseconds
   * @param operationName - Name for logging
   * @returns Promise with timeout protection
   */
  private async optimizeWithTimeoutProtection<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    operationName: string
  ): Promise<T> {
    return Promise.race([
      operation(),
      this.createTimeoutPromise<T>(timeoutMs, `${operationName} timed out after ${timeoutMs}ms`)
    ]);
  }

  /**
   * Create a safe placeholder result when all optimization attempts fail
   * This ensures PDF generation can continue even with failed image optimization
   * @param imageUrl - Original image URL
   * @param contentType - Content type
   * @param primaryError - Primary optimization error
   * @param fallbackError - Fallback error (optional)
   * @returns Safe placeholder result
   */
  private createSafePlaceholderResult(
    imageUrl: string,
    contentType: 'text' | 'photo' | 'graphics' | 'logo',
    primaryError: string,
    fallbackError?: string
  ): OptimizedImageResult {
    const errorMessage = fallbackError
      ? `Primary: ${primaryError}; Fallback: ${fallbackError}`
      : primaryError;

    this.logger.warn(`Creating safe placeholder result for ${imageUrl} due to: ${errorMessage}`);

    // Return a result that indicates failure but allows PDF generation to continue
    return {
      originalSize: 0,
      optimizedSize: 0,
      compressionRatio: 0,
      dimensions: {
        original: { width: 0, height: 0 },
        optimized: { width: 0, height: 0 },
      },
      format: 'placeholder',
      processingTime: 0,
      error: `Image optimization failed: ${errorMessage}`,
      metadata: {
        contentType,
        qualityUsed: 0,
        formatConverted: false,
        originalFormat: 'unknown',
        technique: 'fallback',
      },
    };
  }

  /**
   * Perform comprehensive validation of aggressively optimized images
   * Enhanced validation with detailed analysis, logging, and metrics
   * @param original - Original image buffer
   * @param optimized - Optimized image buffer
   * @param optimizationResult - Optimization result with metadata
   * @param operationId - Operation identifier for tracking
   * @returns Promise<ComprehensiveValidationResult>
   */
  async validateComprehensiveOptimization(
    original: Buffer,
    optimized: Buffer,
    optimizationResult: OptimizedImageResult,
    operationId?: string
  ): Promise<ComprehensiveValidationResult> {
    try {
      this.logger.log(`Performing comprehensive validation for aggressive optimization (${operationId || 'unknown'})`);

      // Perform comprehensive validation using the validation service
      const comprehensiveResult = await this.validationService.validateAggressiveOptimization(
        original,
        optimized,
        optimizationResult,
        this.optimizationConfig
      );

      // Log comprehensive optimization results and metrics
      this.validationService.logOptimizationResults(
        comprehensiveResult,
        optimizationResult,
        operationId
      );

      // Log summary for monitoring
      this.logValidationSummary(comprehensiveResult, operationId);

      return comprehensiveResult;

    } catch (error) {
      this.logger.error(`Comprehensive validation failed (${operationId || 'unknown'}): ${error.message}`);

      // Return basic validation as fallback
      const basicValidation = await this.validateImageOptimization(original, optimized);

      // Convert to comprehensive result format
      return this.convertToComprehensiveResult(basicValidation, error.message);
    }
  }

  /**
   * Validate image optimization results (legacy method)
   * @param original - Original image buffer
   * @param optimized - Optimized image buffer
   * @returns Promise<ValidationResult>
   */
  async validateImageOptimization(original: Buffer, optimized: Buffer): Promise<ValidationResult> {
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
            aspectRatioTolerance: 0.05,
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
      const aspectRatioTolerance = 0.05; // 5% tolerance

      const aspectRatioPreserved = Math.abs(originalAspectRatio - optimizedAspectRatio) <= aspectRatioTolerance;

      if (!aspectRatioPreserved) {
        warnings.push(`Aspect ratio changed: ${originalAspectRatio.toFixed(2)} → ${optimizedAspectRatio.toFixed(2)}`);
      }

      // Check dimensions are within acceptable range
      const config = this.optimizationConfig;
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
      const qualityAcceptable = sizeReductionPercentage > 0; // Any reduction is good

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
          aspectRatioTolerance,
          sizeReductionPercentage,
        },
      };

    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
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
          aspectRatioTolerance: 0.05,
          sizeReductionPercentage: 0,
        },
      };
    }
  }

  /**
   * Validate PDF file size and provide warnings for oversized attachments
   * @param filePath - Path to the PDF file
   * @returns Validation result with size information and warnings
   */
  validatePDFSize(filePath: string): {
    isValid: boolean;
    fileSize: number;
    isLarge: boolean;
    exceedsLimit: boolean;
    warnings: string[];
    recommendations: string[];
  } {
    try {
      if (!fs.existsSync(filePath)) {
        return {
          isValid: false,
          fileSize: 0,
          isLarge: false,
          exceedsLimit: false,
          warnings: ['PDF file not found'],
          recommendations: ['Ensure the PDF file exists before validation'],
        };
      }

      const fileSize = fs.statSync(filePath).size;
      const isLarge = fileSize > this.LARGE_FILE_THRESHOLD;
      const exceedsLimit = fileSize > this.MAX_ATTACHMENT_SIZE;

      const warnings: string[] = [];
      const recommendations: string[] = [];

      if (exceedsLimit) {
        warnings.push(`PDF file size (${this.formatFileSize(fileSize)}) exceeds email attachment limit (${this.formatFileSize(this.MAX_ATTACHMENT_SIZE)})`);
        recommendations.push('Consider using alternative delivery methods such as cloud storage links');
        recommendations.push('Optimize images and reduce PDF content to decrease file size');
      } else if (isLarge) {
        warnings.push(`PDF file size (${this.formatFileSize(fileSize)}) is large and may cause email delivery issues`);
        recommendations.push('Consider compressing the PDF or optimizing images to reduce file size');
      }

      this.logger.log(`PDF size validation completed. Size: ${this.formatFileSize(fileSize)}, Large: ${isLarge}, Exceeds limit: ${exceedsLimit}`);

      return {
        isValid: !exceedsLimit,
        fileSize,
        isLarge,
        exceedsLimit,
        warnings,
        recommendations,
      };
    } catch (error) {
      this.logger.error(`Failed to validate PDF size: ${error.message}`);
      return {
        isValid: false,
        fileSize: 0,
        isLarge: false,
        exceedsLimit: false,
        warnings: [`Validation error: ${error.message}`],
        recommendations: ['Check file permissions and ensure the PDF file is accessible'],
      };
    }
  }

  /**
   * Generate alternative delivery methods for large PDF files
   * @param filePath - Path to the large PDF file
   * @param orderData - Order data for context
   * @returns Alternative delivery options
   */
  generateAlternativeDeliveryMethods(
    filePath: string,
    orderData: OrderPDFData
  ): {
    methods: Array<{
      type: 'cloud_storage' | 'download_link' | 'split_pdf' | 'compressed_version';
      description: string;
      implementation: string;
    }>;
    recommendations: string[];
  } {
    this.logger.log(`Generating alternative delivery methods for large PDF: ${filePath}`);

    const methods = [
      {
        type: 'cloud_storage' as const,
        description: 'Upload PDF to cloud storage and send download link',
        implementation: 'Upload to AWS S3, Google Drive, or similar service and include secure download link in email',
      },
      {
        type: 'download_link' as const,
        description: 'Provide secure download link from your server',
        implementation: 'Host PDF on secure server endpoint with time-limited access token',
      },
      {
        type: 'split_pdf' as const,
        description: 'Split large PDF into smaller parts',
        implementation: 'Divide PDF into multiple smaller files and send as separate attachments',
      },
      {
        type: 'compressed_version' as const,
        description: 'Create highly compressed version for email',
        implementation: 'Generate lower quality version for email and provide link to full quality version',
      },
    ];

    const recommendations = [
      'Notify customer about alternative delivery method in email',
      'Provide clear instructions for accessing the PDF',
      'Ensure download links have reasonable expiration times',
      'Consider customer preferences for file delivery methods',
    ];

    return {
      methods,
      recommendations,
    };
  }

  /**
   * Optimize order data for smaller PDF generation with consistent optimization across multiple images
   * @param orderData - Original order data
   * @returns Optimized order data with compressed images and reduced content
   */
  async optimizeOrderDataForPDF(orderData: OrderPDFData): Promise<{
    optimizedData: OrderPDFData;
    optimizations: string[];
    sizeSavings: number;
  }> {
    this.logger.log(`Optimizing order data for PDF generation: ${orderData.orderNumber}`);

    const optimizations: string[] = [];
    let totalSizeSavings = 0;

    // Clone the order data to avoid mutations
    const optimizedData: OrderPDFData = JSON.parse(JSON.stringify(orderData));

    // Use comprehensive optimization if enabled
    if (this.optimizationConfig.aggressiveMode.enabled) {
      // Collect all images for batch optimization to ensure consistent settings
      const imageCollection = this.collectImagesFromOrderData(optimizedData);

      // Perform batch optimization for consistent processing across all images
      if (imageCollection.imageUrls.length > 0) {
        try {
          const batchResult = await this.optimizeImageBatchWithConsistentSettings(
            imageCollection.imageUrls,
            imageCollection.contentTypes
          );

          // Process results and update optimizations array
          const processedResults = this.processBatchOptimizationResults(
            batchResult,
            imageCollection.imageMetadata,
            optimizations
          );

          totalSizeSavings += processedResults.totalSizeSavings;

          // Log comprehensive batch optimization summary
          optimizations.push(
            `Consistent batch optimization completed: ${batchResult.successCount} successful, ${batchResult.failureCount} failed, ` +
            `overall ${(batchResult.overallCompressionRatio * 100).toFixed(1)}% reduction, ` +
            `total savings: ${this.formatFileSize(processedResults.totalSizeSavings)}`
          );

        } catch (error) {
          this.logger.error(`Batch optimization failed: ${error.message}`);
          // Fallback to individual optimization with consistent settings
          const fallbackResult = await this.fallbackToConsistentIndividualOptimization(
            optimizedData,
            optimizations
          );
          totalSizeSavings += fallbackResult.totalSizeSavings;
        }
      }
    } else {
      // Fallback to legacy optimization
      // Optimize product images
      for (const item of optimizedData.items) {
        if (item.imageUrl && typeof item.imageUrl === 'string') {
          try {
            const optimization = await this.legacyOptimizeImage(item.imageUrl);
            if (optimization.optimizedImageData && !optimization.error) {
              optimizations.push(`Optimized image for product ${item.name}: ${this.formatFileSize(optimization.originalSize)} → ${this.formatFileSize(optimization.optimizedSize)}`);
              totalSizeSavings += optimization.originalSize - optimization.optimizedSize;
            }
          } catch (error) {
            this.logger.warn(`Failed to optimize image for product ${item.name}: ${error.message}`);
          }
        }
      }

      // Optimize business logo
      if (optimizedData.businessInfo.logoUrl) {
        try {
          const optimization = await this.legacyOptimizeImage(optimizedData.businessInfo.logoUrl);
          if (optimization.optimizedImageData && !optimization.error) {
            optimizations.push(`Optimized business logo: ${this.formatFileSize(optimization.originalSize)} → ${this.formatFileSize(optimization.optimizedSize)}`);
            totalSizeSavings += optimization.originalSize - optimization.optimizedSize;
          }
        } catch (error) {
          this.logger.warn(`Failed to optimize business logo: ${error.message}`);
        }
      }

      // Optimize QR code image
      if (optimizedData.paymentMethod.qrCodeUrl) {
        try {
          const optimization = await this.legacyOptimizeImage(optimizedData.paymentMethod.qrCodeUrl);
          if (optimization.optimizedImageData && !optimization.error) {
            optimizations.push(`Optimized QR code: ${this.formatFileSize(optimization.originalSize)} → ${this.formatFileSize(optimization.optimizedSize)}`);
            totalSizeSavings += optimization.originalSize - optimization.optimizedSize;
          }
        } catch (error) {
          this.logger.warn(`Failed to optimize QR code: ${error.message}`);
        }
      }
    }

    // Truncate long descriptions if necessary
    optimizedData.items.forEach(item => {
      if (item.description && item.description.length > 200) {
        item.description = item.description.substring(0, 197) + '...';
        optimizations.push(`Truncated long description for product ${item.name}`);
      }
    });

    // Truncate long business information
    if (optimizedData.businessInfo.termsAndConditions && optimizedData.businessInfo.termsAndConditions.length > 500) {
      optimizedData.businessInfo.termsAndConditions = optimizedData.businessInfo.termsAndConditions.substring(0, 497) + '...';
      optimizations.push('Truncated long terms and conditions');
    }

    if (optimizedData.businessInfo.returnPolicy && optimizedData.businessInfo.returnPolicy.length > 300) {
      optimizedData.businessInfo.returnPolicy = optimizedData.businessInfo.returnPolicy.substring(0, 297) + '...';
      optimizations.push('Truncated long return policy');
    }

    this.logger.log(`Order data optimization completed. Total size savings: ${this.formatFileSize(totalSizeSavings)}`);

    return {
      optimizedData,
      optimizations,
      sizeSavings: totalSizeSavings,
    };
  }

  /**
   * Get Puppeteer PDF options optimized for compression
   * @param compressionLevel - Compression level (low, medium, high)
   * @returns Puppeteer PDF options with compression settings
   */
  getCompressionOptimizedPDFOptions(compressionLevel: 'low' | 'medium' | 'high' = 'medium'): any {
    const baseOptions = {
      format: 'A4' as const,
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="font-size: 10px; width: 100%; text-align: center; color: #666;" role="contentinfo" aria-label="Page information">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      `,
      tagged: true,
    };

    switch (compressionLevel) {
      case 'high':
        return {
          ...baseOptions,
          // High compression settings
          preferCSSPageSize: true,
          // Note: Puppeteer doesn't have direct compression options
          // In a production environment, you might post-process with ghostscript
        };

      case 'low':
        return {
          ...baseOptions,
          // Low compression settings (higher quality)
          preferCSSPageSize: false,
        };

      case 'medium':
      default:
        return {
          ...baseOptions,
          // Medium compression settings
          preferCSSPageSize: true,
        };
    }
  }

  /**
   * Load image buffer from URL or file path
   * @param imageUrl - URL or path to the image
   * @returns Promise<Buffer>
   */
  private async loadImageBuffer(imageUrl: string): Promise<Buffer> {
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      // Fetch image from URL
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      return Buffer.from(await response.arrayBuffer());
    } else {
      // Read local file - resolve relative to UPLOAD_DIR
      let imagePath: string;

      if (path.isAbsolute(imageUrl)) {
        // If it's an absolute path, it might be a relative path from the upload directory
        // Check if it starts with /uploads/ and resolve it relative to UPLOAD_DIR
        if (imageUrl.startsWith('/uploads/')) {
          const uploadDirEnv = process.env.UPLOAD_DIR || 'uploads';
          const baseUploadPath = path.isAbsolute(uploadDirEnv)
            ? uploadDirEnv
            : path.join(process.cwd(), uploadDirEnv);

          // Remove the /uploads/ prefix and resolve relative to the actual upload directory
          const relativePath = imageUrl.substring('/uploads/'.length);
          imagePath = path.join(baseUploadPath, relativePath);
        } else {
          // Use the absolute path as-is
          imagePath = imageUrl;
        }
      } else {
        // Relative path - join with current working directory
        imagePath = path.join(process.cwd(), imageUrl);
      }

      if (!fs.existsSync(imagePath)) {
        throw new Error(`Image file not found: ${imagePath}`);
      }
      return fs.readFileSync(imagePath);
    }
  }

  /**
   * Calculate dynamic quality based on size reduction factor
   * @param sizeReductionFactor - Factor by which the image is being reduced
   * @param qualityRange - Quality range to use
   * @returns Calculated quality value
   */
  private calculateDynamicQuality(
    sizeReductionFactor: number,
    qualityRange: { min: number; max: number }
  ): number {
    // For larger reductions, use lower quality
    // For smaller reductions, use higher quality
    const normalizedFactor = Math.min(Math.max(sizeReductionFactor, 1), 10); // Clamp between 1 and 10
    const qualityReduction = Math.log(normalizedFactor) / Math.log(10); // 0 to 1 scale

    const quality = qualityRange.max - (qualityReduction * (qualityRange.max - qualityRange.min));
    return Math.round(Math.max(qualityRange.min, Math.min(qualityRange.max, quality)));
  }

  /**
   * Handle optimization fallback when primary optimization fails
   * Enhanced with comprehensive error handling, retry logic, and multiple fallback strategies
   * @param imageBuffer - Original image buffer
   * @param options - Scaling options
   * @param validationResult - Validation result that triggered fallback
   * @returns Promise<OptimizedImageResult>
   */
  private async handleOptimizationFallback(
    imageBuffer: Buffer,
    options: AggressiveScalingOptions,
    validationResult: ValidationResult
  ): Promise<OptimizedImageResult> {
    const startTime = Date.now();
    const operationId = `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.logger.log(`Starting comprehensive fallback optimization (operation: ${operationId})`);
    this.logger.log(`Fallback triggered by: ${validationResult.errors.join(', ')}`);

    const fallbackStrategies = [
      'reduced_quality',
      'format_conversion',
      'dimension_reduction',
      'basic_compression',
      'original_image'
    ];

    let lastError: string | undefined;
    let retryAttempts = 0;
    const maxRetries = this.optimizationConfig.fallback.maxRetries;

    // Try each fallback strategy with retry logic
    for (const strategy of fallbackStrategies) {
      retryAttempts = 0;

      while (retryAttempts <= maxRetries) {
        try {
          this.logger.log(`Attempting fallback strategy: ${strategy} (attempt ${retryAttempts + 1}/${maxRetries + 1})`);

          const result = await this.executeFallbackStrategy(
            imageBuffer,
            options,
            strategy as 'reduced_quality' | 'format_conversion' | 'dimension_reduction' | 'basic_compression' | 'original_image',
            retryAttempts,
            operationId
          );

          if (result.optimizedBuffer && !result.error) {
            this.logger.log(`Fallback strategy '${strategy}' succeeded after ${retryAttempts + 1} attempts`);

            // Validate the fallback result
            const fallbackValidation = await this.validateImageOptimization(
              imageBuffer,
              result.optimizedBuffer
            );

            if (fallbackValidation.isValid || strategy === 'original_image') {
              result.metadata.technique = 'fallback';
              result.processingTime = Date.now() - startTime;

              // Record successful fallback metrics
              this.recordFallbackMetrics(operationId, strategy as 'reduced_quality' | 'format_conversion' | 'dimension_reduction' | 'basic_compression' | 'original_image', true, retryAttempts + 1, result);

              return result;
            } else {
              this.logger.warn(`Fallback strategy '${strategy}' produced invalid result, trying next strategy`);
              lastError = `Strategy ${strategy} validation failed: ${fallbackValidation.errors.join(', ')}`;
            }
          } else {
            lastError = result.error || `Strategy ${strategy} failed without error message`;
            this.logger.warn(`Fallback strategy '${strategy}' failed: ${lastError}`);
          }

        } catch (error) {
          lastError = error.message;
          this.logger.warn(`Fallback strategy '${strategy}' attempt ${retryAttempts + 1} failed: ${error.message}`);

          // Check if this is a timeout error and adjust strategy
          if (this.isTimeoutError(error) && retryAttempts < maxRetries) {
            this.logger.log(`Timeout detected, retrying with adjusted parameters`);
            await this.delay(1000 * (retryAttempts + 1)); // Progressive delay
          }
        }

        retryAttempts++;

        // Break if we've exceeded retries for this strategy
        if (retryAttempts > maxRetries) {
          this.logger.warn(`Strategy '${strategy}' exhausted all ${maxRetries + 1} attempts`);
          break;
        }
      }
    }

    // All fallback strategies failed - return original image with error information
    const processingTime = Date.now() - startTime;
    this.logger.error(`All fallback strategies failed after ${retryAttempts} total attempts. Last error: ${lastError}`);

    // Record failed fallback metrics
    this.recordFallbackMetrics(operationId, 'original_image', false, retryAttempts, null, lastError);

    // Return original image as absolute last resort to ensure PDF generation continues
    const originalMetadata = await this.getImageMetadataSafely(imageBuffer);

    return {
      optimizedBuffer: imageBuffer,
      originalSize: imageBuffer.length,
      optimizedSize: imageBuffer.length,
      compressionRatio: 0,
      dimensions: {
        original: { width: originalMetadata.width, height: originalMetadata.height },
        optimized: { width: originalMetadata.width, height: originalMetadata.height },
      },
      format: 'original',
      processingTime,
      error: `All fallback strategies failed: ${lastError}`,
      metadata: {
        contentType: 'photo',
        qualityUsed: 0,
        formatConverted: false,
        originalFormat: originalMetadata.format,
        technique: 'fallback',
      },
    };
  }

  /**
   * Execute a specific fallback strategy with timeout protection
   * @param imageBuffer - Original image buffer
   * @param options - Original scaling options
   * @param strategy - Fallback strategy to execute
   * @param attemptNumber - Current attempt number
   * @param operationId - Operation identifier for tracking
   * @returns Promise<OptimizedImageResult>
   */
  private async executeFallbackStrategy(
    imageBuffer: Buffer,
    options: AggressiveScalingOptions,
    strategy: 'reduced_quality' | 'format_conversion' | 'dimension_reduction' | 'basic_compression' | 'original_image',
    attemptNumber: number,
    operationId: string
  ): Promise<OptimizedImageResult> {
    const timeoutMs = this.optimizationConfig.fallback.timeoutMs;

    // Wrap strategy execution with timeout
    return Promise.race([
      this.executeStrategyImplementation(imageBuffer, options, strategy, attemptNumber, operationId),
      this.createTimeoutPromise<OptimizedImageResult>(timeoutMs, `Fallback strategy '${strategy}' timed out after ${timeoutMs}ms`)
    ]);
  }

  /**
   * Implementation of specific fallback strategies
   * @param imageBuffer - Original image buffer
   * @param options - Original scaling options
   * @param strategy - Fallback strategy to execute
   * @param attemptNumber - Current attempt number
   * @param operationId - Operation identifier for tracking
   * @returns Promise<OptimizedImageResult>
   */
  private async executeStrategyImplementation(
    imageBuffer: Buffer,
    options: AggressiveScalingOptions,
    strategy: 'reduced_quality' | 'format_conversion' | 'dimension_reduction' | 'basic_compression' | 'original_image',
    attemptNumber: number,
    operationId: string
  ): Promise<OptimizedImageResult> {
    const startTime = Date.now();
    const originalSize = imageBuffer.length;

    switch (strategy) {
      case 'reduced_quality': {
        // Progressively reduce quality based on attempt number
        const qualityReduction = 15 + (attemptNumber * 10); // 15%, 25%, 35%, etc.
        const fallbackOptions: AggressiveScalingOptions = {
          ...options,
          qualityRange: {
            min: Math.max(options.qualityRange.min - qualityReduction, 20),
            max: Math.max(options.qualityRange.max - qualityReduction, 40),
          },
        };

        this.logger.log(`Reduced quality strategy: quality reduced by ${qualityReduction}%`);
        return await this.reduceImageToMinimumSize(imageBuffer, fallbackOptions);
      }

      case 'format_conversion': {
        // Try different format based on attempt
        const formats: ('jpeg' | 'png' | 'webp')[] = ['jpeg', 'png', 'webp'];
        const targetFormat = formats[attemptNumber % formats.length];

        const formatOptions: AggressiveScalingOptions = {
          ...options,
          format: targetFormat,
          qualityRange: {
            min: Math.max(options.qualityRange.min - 5, 30),
            max: Math.max(options.qualityRange.max - 5, 50),
          },
        };

        this.logger.log(`Format conversion strategy: converting to ${targetFormat}`);
        return await this.reduceImageToMinimumSize(imageBuffer, formatOptions);
      }

      case 'dimension_reduction': {
        // Progressively reduce dimensions
        const reductionFactor = 0.8 - (attemptNumber * 0.1); // 80%, 70%, 60%, etc.
        const reducedOptions: AggressiveScalingOptions = {
          ...options,
          maxWidth: Math.max(Math.round(options.maxWidth * reductionFactor), options.minWidth),
          maxHeight: Math.max(Math.round(options.maxHeight * reductionFactor), options.minHeight),
        };

        this.logger.log(`Dimension reduction strategy: reducing to ${Math.round(reductionFactor * 100)}% of original target size`);
        return await this.reduceImageToMinimumSize(imageBuffer, reducedOptions);
      }

      case 'basic_compression': {
        // Simple compression with Sharp defaults
        const quality = Math.max(70 - (attemptNumber * 10), 40); // 70, 60, 50, 40

        this.logger.log(`Basic compression strategy: JPEG quality ${quality}`);
        const basicOptimized = await sharp(imageBuffer)
          .jpeg({ quality, progressive: true })
          .toBuffer();

        const optimizedSize = basicOptimized.length;
        const compressionRatio = (originalSize - optimizedSize) / originalSize;
        const processingTime = Date.now() - startTime;

        const [originalMetadata, optimizedMetadata] = await Promise.all([
          this.getImageMetadataSafely(imageBuffer),
          this.getImageMetadataSafely(basicOptimized)
        ]);

        return {
          optimizedBuffer: basicOptimized,
          originalSize,
          optimizedSize,
          compressionRatio,
          dimensions: {
            original: { width: originalMetadata.width, height: originalMetadata.height },
            optimized: { width: optimizedMetadata.width, height: optimizedMetadata.height },
          },
          format: 'jpeg',
          processingTime,
          metadata: {
            contentType: 'photo',
            qualityUsed: quality,
            formatConverted: true,
            originalFormat: originalMetadata.format,
            technique: 'fallback',
          },
        };
      }

      case 'original_image': {
        // Return original image unchanged
        this.logger.log('Original image strategy: returning unmodified image');
        const processingTime = Date.now() - startTime;
        const originalMetadata = await this.getImageMetadataSafely(imageBuffer);

        return {
          optimizedBuffer: imageBuffer,
          originalSize,
          optimizedSize: originalSize,
          compressionRatio: 0,
          dimensions: {
            original: { width: originalMetadata.width, height: originalMetadata.height },
            optimized: { width: originalMetadata.width, height: originalMetadata.height },
          },
          format: 'original',
          processingTime,
          metadata: {
            contentType: 'photo',
            qualityUsed: 100,
            formatConverted: false,
            originalFormat: originalMetadata.format,
            technique: 'fallback',
          },
        };
      }

      default:
        throw new Error(`Unknown fallback strategy: ${strategy}`);
    }
  }

  /**
   * Create a timeout promise that rejects after specified milliseconds
   * @param timeoutMs - Timeout in milliseconds
   * @param message - Error message for timeout
   * @returns Promise that rejects on timeout
   */
  private createTimeoutPromise<T>(timeoutMs: number, message: string): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    });
  }

  /**
   * Check if an error is a timeout error
   * @param error - Error to check
   * @returns Whether the error is timeout-related
   */
  private isTimeoutError(error: any): boolean {
    const errorMessage = error.message?.toLowerCase() || '';
    return errorMessage.includes('timeout') ||
           errorMessage.includes('timed out') ||
           errorMessage.includes('operation timeout') ||
           error.code === 'ETIMEDOUT';
  }

  /**
   * Add delay for retry logic
   * @param ms - Milliseconds to delay
   * @returns Promise that resolves after delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Safely get image metadata with error handling
   * @param imageBuffer - Image buffer to analyze
   * @returns Metadata with safe defaults
   */
  private async getImageMetadataSafely(imageBuffer: Buffer): Promise<{
    width: number;
    height: number;
    format: string;
  }> {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
      };
    } catch (error) {
      this.logger.warn(`Failed to get image metadata: ${error.message}`);
      return {
        width: 0,
        height: 0,
        format: 'unknown',
      };
    }
  }

  /**
   * Record fallback operation metrics
   * @param operationId - Operation identifier
   * @param strategy - Fallback strategy used
   * @param success - Whether fallback succeeded
   * @param attempts - Number of attempts made
   * @param result - Optimization result if successful
   * @param error - Error message if failed
   */
  private recordFallbackMetrics(
    operationId: string,
    strategy: 'reduced_quality' | 'format_conversion' | 'dimension_reduction' | 'basic_compression' | 'original_image',
    success: boolean,
    attempts: number,
    result?: OptimizedImageResult | null,
    error?: string
  ): void {
    try {
      const fallbackResult: FallbackResult = {
        fallbackTriggered: true,
        fallbackReason: error || 'Optimization validation failed',
        fallbackStrategy: strategy,
        result: result || undefined,
        retryAttempts: attempts,
        success,
      };

      // Record through metrics service if available
      if (this.metricsService && typeof this.metricsService.recordFallbackOperation === 'function') {
        this.metricsService.recordFallbackOperation(fallbackResult, operationId);
      }

      this.logger.log(
        `Fallback metrics recorded: strategy=${strategy}, success=${success}, attempts=${attempts}, ` +
        `operation=${operationId}`
      );
    } catch (metricsError) {
      this.logger.warn(`Failed to record fallback metrics: ${metricsError.message}`);
    }
  }

  /**
   * Comprehensive image optimization that processes all images regardless of size
   * Applies compression and format optimization with content-aware settings
   * @param imageUrl - URL or path to the image
   * @param contentType - Type of content for content-aware optimization
   * @returns Promise<OptimizedImageResult>
   */
  async comprehensiveImageOptimization(
    imageUrl: string,
    contentType: 'text' | 'photo' | 'graphics' | 'logo' = 'photo'
  ): Promise<OptimizedImageResult> {
    const startTime = Date.now();

    try {
      this.logger.log(`Starting comprehensive image optimization: ${imageUrl} (content type: ${contentType})`);

      // Load image buffer
      const imageBuffer = await this.loadImageBuffer(imageUrl);
      const originalSize = imageBuffer.length;

      // Get image metadata for analysis
      const metadata = await sharp(imageBuffer).metadata();
      const originalWidth = metadata.width || 0;
      const originalHeight = metadata.height || 0;
      const originalFormat = metadata.format || 'unknown';

      this.logger.log(`Original image: ${originalWidth}x${originalHeight}, ${originalFormat}, ${this.formatFileSize(originalSize)}`);

      // Perform content-aware analysis if enabled
      let detectedContentType = contentType;
      if (this.optimizationConfig.contentAware.enabled) {
        const analysisResult = await this.analyzeImageContent(imageBuffer);
        if (analysisResult.confidence > 0.7) {
          detectedContentType = analysisResult.contentType;
          this.logger.log(`Content analysis detected: ${detectedContentType} (confidence: ${analysisResult.confidence.toFixed(2)})`);
        }
      }

      // Apply optimization regardless of original size
      const optimizationResult = await this.applyComprehensiveOptimization(
        imageBuffer,
        detectedContentType,
        originalWidth,
        originalHeight,
        originalFormat
      );

      const processingTime = Date.now() - startTime;

      this.logger.log(
        `Comprehensive optimization completed: ${originalWidth}x${originalHeight} → ${optimizationResult.dimensions.optimized.width}x${optimizationResult.dimensions.optimized.height}, ` +
        `${this.formatFileSize(originalSize)} → ${this.formatFileSize(optimizationResult.optimizedSize)} ` +
        `(${(optimizationResult.compressionRatio * 100).toFixed(1)}% reduction) in ${processingTime}ms`
      );

      return {
        ...optimizationResult,
        processingTime,
        metadata: {
          ...optimizationResult.metadata,
          contentType: detectedContentType,
          technique: 'comprehensive',
        },
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(`Comprehensive image optimization failed: ${error.message}`);

      return {
        originalSize: 0,
        optimizedSize: 0,
        compressionRatio: 0,
        dimensions: {
          original: { width: 0, height: 0 },
          optimized: { width: 0, height: 0 },
        },
        format: 'jpeg',
        processingTime,
        error: error.message,
        metadata: {
          contentType,
          qualityUsed: 0,
          formatConverted: false,
          originalFormat: 'unknown',
          technique: 'comprehensive',
        },
      };
    }
  }

  /**
   * Apply comprehensive optimization with format and compression optimization
   * @param imageBuffer - Original image buffer
   * @param contentType - Detected or specified content type
   * @param originalWidth - Original image width
   * @param originalHeight - Original image height
   * @param originalFormat - Original image format
   * @returns Promise<OptimizedImageResult>
   */
  private async applyComprehensiveOptimization(
    imageBuffer: Buffer,
    contentType: 'text' | 'photo' | 'graphics' | 'logo',
    originalWidth: number,
    originalHeight: number,
    originalFormat: string
  ): Promise<OptimizedImageResult> {
    const originalSize = imageBuffer.length;

    // Get content-specific settings
    const contentSettings = this.optimizationConfig.contentAware.contentTypes[contentType];

    // Determine optimal format based on content type, original format, and image data
    const optimalFormat = this.determineOptimalFormat(contentType, originalFormat, imageBuffer);

    // Get format-specific quality settings for consistent behavior
    const formatSpecificQuality = this.getFormatSpecificQuality(optimalFormat, contentType);

    // Calculate optimal dimensions with content-aware scaling
    const optimalDimensions = this.calculateContentAwareDimensions(
      originalWidth,
      originalHeight,
      contentType
    );

    // Apply format-specific optimization with enhanced settings
    const optimizedBuffer = await this.applyFormatOptimization(
      imageBuffer,
      optimalFormat,
      optimalDimensions,
      formatSpecificQuality,
      contentType
    );

    const optimizedSize = optimizedBuffer.length;
    const compressionRatio = originalSize > 0 ? (originalSize - optimizedSize) / originalSize : 0;

    // Get final dimensions
    const finalMetadata = await sharp(optimizedBuffer).metadata();
    const finalWidth = finalMetadata.width || optimalDimensions.width;
    const finalHeight = finalMetadata.height || optimalDimensions.height;

    return {
      optimizedBuffer,
      originalSize,
      optimizedSize,
      compressionRatio,
      dimensions: {
        original: { width: originalWidth, height: originalHeight },
        optimized: { width: finalWidth, height: finalHeight },
      },
      format: optimalFormat,
      processingTime: 0, // Will be set by caller
      metadata: {
        contentType,
        qualityUsed: contentSettings.quality,
        formatConverted: originalFormat !== optimalFormat,
        originalFormat,
        technique: 'comprehensive',
      },
    };
  }

  /**
   * Analyze image content to determine optimal optimization strategy
   * @param imageBuffer - Image buffer to analyze
   * @returns Promise<ImageAnalysisResult>
   */
  private async analyzeImageContent(imageBuffer: Buffer): Promise<{
    contentType: 'text' | 'photo' | 'graphics' | 'logo';
    confidence: number;
  }> {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      const { width = 0, height = 0, channels = 3, density = 72 } = metadata;

      // Simple heuristic-based content analysis
      let contentType: 'text' | 'photo' | 'graphics' | 'logo' = 'photo';
      let confidence = 0.5;

      // Analyze image characteristics
      const aspectRatio = width / height;
      const pixelCount = width * height;
      const hasAlpha = channels === 4;

      // Logo detection heuristics
      if (hasAlpha && pixelCount < 100000 && (aspectRatio > 0.5 && aspectRatio < 2.0)) {
        contentType = 'logo';
        confidence = 0.8;
      }
      // Text detection heuristics (high DPI, rectangular aspect ratio)
      else if (density > 150 && (aspectRatio > 2.0 || aspectRatio < 0.5)) {
        contentType = 'text';
        confidence = 0.7;
      }
      // Graphics detection heuristics (medium size, has alpha or limited colors)
      else if (pixelCount < 500000 && (hasAlpha || channels < 3)) {
        contentType = 'graphics';
        confidence = 0.6;
      }
      // Default to photo for large, full-color images
      else if (pixelCount > 500000 && channels >= 3) {
        contentType = 'photo';
        confidence = 0.8;
      }

      this.logger.log(`Content analysis: ${contentType} (confidence: ${confidence.toFixed(2)}, ${width}x${height}, ${channels} channels, ${density} DPI)`);

      return { contentType, confidence };

    } catch (error) {
      this.logger.warn(`Content analysis failed, defaulting to photo: ${error.message}`);
      return { contentType: 'photo', confidence: 0.5 };
    }
  }

  /**
   * Detect image format from buffer or file extension
   * @param imageBuffer - Image buffer to analyze
   * @param originalFormat - Original format hint from metadata
   * @returns Detected format
   */
  private detectImageFormat(imageBuffer: Buffer, originalFormat?: string): 'jpeg' | 'png' | 'webp' | 'unknown' {
    try {
      // Check magic bytes for format detection
      const header = imageBuffer.slice(0, 12);

      // JPEG magic bytes: FF D8 FF
      if (header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) {
        return 'jpeg';
      }

      // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
      if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
        return 'png';
      }

      // WebP magic bytes: RIFF....WEBP
      if (header.slice(0, 4).toString() === 'RIFF' && header.slice(8, 12).toString() === 'WEBP') {
        return 'webp';
      }

      // Fallback to original format if provided
      if (originalFormat) {
        const normalized = originalFormat.toLowerCase();
        if (['jpeg', 'jpg'].includes(normalized)) return 'jpeg';
        if (normalized === 'png') return 'png';
        if (normalized === 'webp') return 'webp';
      }

      return 'unknown';
    } catch (error) {
      this.logger.warn(`Format detection failed: ${error.message}`);
      return originalFormat ? this.normalizeFormat(originalFormat) : 'unknown';
    }
  }

  /**
   * Normalize format string to supported format
   * @param format - Format string to normalize
   * @returns Normalized format
   */
  private normalizeFormat(format: string): 'jpeg' | 'png' | 'webp' | 'unknown' {
    const normalized = format.toLowerCase();
    if (['jpeg', 'jpg'].includes(normalized)) return 'jpeg';
    if (normalized === 'png') return 'png';
    if (normalized === 'webp') return 'webp';
    return 'unknown';
  }

  /**
   * Get format-specific quality settings based on configuration and content type
   * @param format - Target format
   * @param contentType - Content type for content-aware optimization
   * @returns Quality settings for the format
   */
  private getFormatSpecificQuality(
    format: 'jpeg' | 'png' | 'webp',
    contentType: 'text' | 'photo' | 'graphics' | 'logo'
  ): number {
    const formatConfig = this.optimizationConfig.quality[format];
    const contentConfig = this.optimizationConfig.contentAware.contentTypes[contentType];

    // Use content-specific quality if available, otherwise use format default
    const baseQuality = contentConfig.quality || formatConfig.default;

    // Ensure quality is within format-specific bounds
    return Math.max(formatConfig.min, Math.min(formatConfig.max, baseQuality));
  }

  /**
   * Handle unsupported image formats with fallback behavior
   * @param originalFormat - Original format that was unsupported
   * @param contentType - Content type for fallback selection
   * @returns Fallback format
   */
  private handleUnsupportedFormat(
    originalFormat: string,
    contentType: 'text' | 'photo' | 'graphics' | 'logo'
  ): 'jpeg' | 'png' | 'webp' {
    this.logger.warn(`Unsupported format detected: ${originalFormat}, applying fallback for ${contentType} content`);

    // Fallback to most appropriate format based on content type
    switch (contentType) {
      case 'text':
      case 'logo':
        return 'png'; // Best for text and logos
      case 'graphics':
        return this.optimizationConfig.compression.preferredFormat === 'webp' ? 'webp' : 'png';
      case 'photo':
      default:
        return 'jpeg'; // Best for photos
    }
  }

  /**
   * Determine optimal format based on content type, original format, and compression settings
   * Enhanced with better format detection, consistent handling, and error handling
   * @param contentType - Type of image content
   * @param originalFormat - Original image format
   * @param imageBuffer - Image buffer for format detection
   * @returns Optimal format for compression
   */
  private determineOptimalFormat(
    contentType: 'text' | 'photo' | 'graphics' | 'logo',
    originalFormat: string,
    imageBuffer?: Buffer
  ): 'jpeg' | 'png' | 'webp' {
    try {
      // Detect actual format from image data if buffer is provided
      let detectedFormat = originalFormat;
      if (imageBuffer) {
        const detected = this.detectImageFormat(imageBuffer, originalFormat);
        if (detected !== 'unknown') {
          detectedFormat = detected;
        }
      }

      // Log format detection for consistency tracking
      this.logger.log(`Format detection: original=${originalFormat}, detected=${detectedFormat}, content=${contentType}`);

      // Handle unsupported formats
      const normalizedFormat = this.normalizeFormat(detectedFormat);
      if (normalizedFormat === 'unknown') {
        return this.handleUnsupportedFormat(originalFormat, contentType);
      }

      if (!this.optimizationConfig.compression.enableFormatConversion) {
        // If format conversion is disabled, keep detected format if supported
        this.logger.log(`Format conversion disabled, keeping original format: ${normalizedFormat}`);
        return normalizedFormat;
      }
    } catch (error) {
      this.logger.error(`Error in format detection: ${error.message}, using fallback`);
      return this.handleUnsupportedFormat(originalFormat, contentType);
    }

    // Content-based format selection for optimal compression with consistent rules
    let optimalFormat: 'jpeg' | 'png' | 'webp';

    switch (contentType) {
      case 'text':
        // PNG is better for text due to lossless compression and sharp edges
        optimalFormat = 'png';
        break;

      case 'logo':
        // PNG is better for logos that may have transparency and need crisp edges
        optimalFormat = 'png';
        break;

      case 'graphics':
        // WebP provides good compression for graphics, fallback to PNG
        optimalFormat = this.optimizationConfig.compression.preferredFormat === 'webp' ? 'webp' : 'png';
        break;

      case 'photo':
      default:
        // JPEG is typically best for photographic content
        optimalFormat = 'jpeg';
        break;
    }

    // Apply consistent format selection rules across all image types
    if (this.optimizationConfig.compression.preferredFormat &&
        this.optimizationConfig.compression.enableFormatConversion) {
      // Override with preferred format if explicitly configured
      const preferredFormat = this.optimizationConfig.compression.preferredFormat;

      // Only use preferred format if it makes sense for the content type
      if (preferredFormat === 'jpeg' && contentType === 'photo') {
        optimalFormat = 'jpeg';
      } else if (preferredFormat === 'png' && ['text', 'logo', 'graphics'].includes(contentType)) {
        optimalFormat = 'png';
      } else if (preferredFormat === 'webp') {
        optimalFormat = 'webp';
      }
    }

    this.logger.log(`Optimal format determined: ${optimalFormat} for ${contentType} content (consistent across all input formats)`);
    return optimalFormat;
  }

  /**
   * Calculate content-aware dimensions for optimization
   * @param originalWidth - Original image width
   * @param originalHeight - Original image height
   * @param contentType - Type of image content
   * @returns Optimal dimensions
   */
  private calculateContentAwareDimensions(
    originalWidth: number,
    originalHeight: number,
    contentType: 'text' | 'photo' | 'graphics' | 'logo'
  ): { width: number; height: number } {
    const config = this.optimizationConfig;
    const baseMaxWidth = config.aggressiveMode.maxDimensions.width;
    const baseMaxHeight = config.aggressiveMode.maxDimensions.height;
    const minWidth = config.aggressiveMode.minDimensions.width;
    const minHeight = config.aggressiveMode.minDimensions.height;

    // Content-specific scaling factors
    let scalingFactor = 1.0;
    switch (contentType) {
      case 'text':
        // Text needs higher resolution to maintain readability
        scalingFactor = 1.3;
        break;
      case 'logo':
        // Logos need to maintain crispness
        scalingFactor = 1.2;
        break;
      case 'graphics':
        // Graphics can be moderately compressed
        scalingFactor = 1.0;
        break;
      case 'photo':
        // Photos can be most aggressively compressed
        scalingFactor = 0.9;
        break;
    }

    const maxWidth = Math.round(baseMaxWidth * scalingFactor);
    const maxHeight = Math.round(baseMaxHeight * scalingFactor);

    // Calculate aspect ratio
    const aspectRatio = originalWidth / originalHeight;

    // Calculate target dimensions maintaining aspect ratio
    let targetWidth = Math.min(maxWidth, originalWidth);
    let targetHeight = Math.min(maxHeight, originalHeight);

    // Adjust to maintain aspect ratio
    if (targetWidth / targetHeight > aspectRatio) {
      targetWidth = Math.round(targetHeight * aspectRatio);
    } else {
      targetHeight = Math.round(targetWidth / aspectRatio);
    }

    // Ensure minimum dimensions
    targetWidth = Math.max(minWidth, targetWidth);
    targetHeight = Math.max(minHeight, targetHeight);

    // Force optimization even for small images if configured
    if (config.aggressiveMode.forceOptimization) {
      // If image is already smaller than target, still apply some optimization
      if (originalWidth <= targetWidth && originalHeight <= targetHeight) {
        targetWidth = Math.max(minWidth, Math.round(originalWidth * 0.9));
        targetHeight = Math.max(minHeight, Math.round(originalHeight * 0.9));
      }
    }

    this.logger.log(
      `Content-aware dimensions for ${contentType}: ${originalWidth}x${originalHeight} → ${targetWidth}x${targetHeight} ` +
      `(scaling factor: ${scalingFactor})`
    );

    return { width: targetWidth, height: targetHeight };
  }

  /**
   * Apply format-specific optimization with compression and consistent settings
   * Enhanced with format-specific quality settings and consistent behavior
   * @param imageBuffer - Original image buffer
   * @param format - Target format
   * @param dimensions - Target dimensions
   * @param quality - Quality setting
   * @param contentType - Content type for format-specific adjustments
   * @returns Promise<Buffer>
   */
  private async applyFormatOptimization(
    imageBuffer: Buffer,
    format: 'jpeg' | 'png' | 'webp',
    dimensions: { width: number; height: number },
    quality: number,
    contentType: 'text' | 'photo' | 'graphics' | 'logo' = 'photo'
  ): Promise<Buffer> {
    this.logger.log(`Applying ${format} optimization: ${dimensions.width}x${dimensions.height}, quality=${quality}, content=${contentType}`);

    let pipeline = sharp(imageBuffer)
      .resize(dimensions.width, dimensions.height, {
        fit: 'fill', // Use fill to ensure exact dimensions are met
        withoutEnlargement: false, // Allow optimization even for small images
        kernel: sharp.kernel.lanczos3, // Use high-quality resampling
      });

    // Apply format-specific optimization with consistent settings across all input formats
    switch (format) {
      case 'jpeg':
        return this.applyJpegOptimization(pipeline, quality, contentType);

      case 'png':
        return this.applyPngOptimization(pipeline, quality, contentType);

      case 'webp':
        return this.applyWebpOptimization(pipeline, quality, contentType);

      default:
        // Fallback to JPEG with consistent settings
        this.logger.warn(`Unknown format ${format}, falling back to JPEG`);
        return this.applyJpegOptimization(pipeline, quality, contentType);
    }
  }

  /**
   * Apply JPEG-specific optimization with content-aware settings
   * @param pipeline - Sharp pipeline
   * @param quality - Quality setting
   * @param contentType - Content type for optimization adjustments
   * @returns Promise<Buffer>
   */
  private async applyJpegOptimization(
    pipeline: sharp.Sharp,
    quality: number,
    contentType: 'text' | 'photo' | 'graphics' | 'logo'
  ): Promise<Buffer> {
    const jpegConfig = this.optimizationConfig.quality.jpeg;

    // Content-specific JPEG settings
    const jpegOptions: sharp.JpegOptions = {
      quality,
      progressive: jpegConfig.progressive !== false, // Default to true
      mozjpeg: true, // Use mozjpeg for better compression
      optimiseScans: true,
      overshootDeringing: true,
      trellisQuantisation: true,
    };

    // Adjust settings based on content type for consistent behavior
    switch (contentType) {
      case 'text':
        // Higher quality for text to maintain readability
        jpegOptions.quality = Math.max(quality, 70);
        jpegOptions.quantisationTable = 0; // Less aggressive quantization for text
        break;

      case 'logo':
        // Balanced settings for logos
        jpegOptions.quality = Math.max(quality, 65);
        jpegOptions.quantisationTable = 1;
        break;

      case 'graphics':
        // Standard settings for graphics
        jpegOptions.quantisationTable = 2;
        break;

      case 'photo':
      default:
        // Most aggressive settings for photos
        jpegOptions.quantisationTable = 3;
        break;
    }

    this.logger.log(`JPEG optimization: quality=${jpegOptions.quality}, quantization=${jpegOptions.quantisationTable}`);
    return pipeline.jpeg(jpegOptions).toBuffer();
  }

  /**
   * Apply PNG-specific optimization with content-aware settings
   * @param pipeline - Sharp pipeline
   * @param quality - Quality setting
   * @param contentType - Content type for optimization adjustments
   * @returns Promise<Buffer>
   */
  private async applyPngOptimization(
    pipeline: sharp.Sharp,
    quality: number,
    contentType: 'text' | 'photo' | 'graphics' | 'logo'
  ): Promise<Buffer> {
    const pngConfig = this.optimizationConfig.quality.png;

    // Content-specific PNG settings
    const pngOptions: sharp.PngOptions = {
      compressionLevel: 9, // Maximum PNG compression
      progressive: pngConfig.progressive !== false, // Default to true
      palette: true, // Use palette when possible for smaller files
      quality,
    };

    // Adjust settings based on content type for consistent behavior
    switch (contentType) {
      case 'text':
        // Preserve quality for text readability
        pngOptions.quality = Math.max(quality, 80);
        pngOptions.palette = false; // Avoid palette for text to maintain quality
        break;

      case 'logo':
        // High quality for logos, but allow palette optimization
        pngOptions.quality = Math.max(quality, 75);
        pngOptions.palette = true;
        break;

      case 'graphics':
        // Standard settings for graphics
        pngOptions.palette = true;
        break;

      case 'photo':
      default:
        // Aggressive settings for photos (though PNG isn't ideal for photos)
        pngOptions.palette = false; // Photos typically don't benefit from palette
        break;
    }

    this.logger.log(`PNG optimization: quality=${pngOptions.quality}, compression=${pngOptions.compressionLevel}, palette=${pngOptions.palette}`);
    return pipeline.png(pngOptions).toBuffer();
  }

  /**
   * Apply WebP-specific optimization with content-aware settings
   * @param pipeline - Sharp pipeline
   * @param quality - Quality setting
   * @param contentType - Content type for optimization adjustments
   * @returns Promise<Buffer>
   */
  private async applyWebpOptimization(
    pipeline: sharp.Sharp,
    quality: number,
    contentType: 'text' | 'photo' | 'graphics' | 'logo'
  ): Promise<Buffer> {
    const webpConfig = this.optimizationConfig.quality.webp;

    // Content-specific WebP settings
    const webpOptions: sharp.WebpOptions = {
      quality,
      effort: 6, // Maximum effort for better compression
      lossless: webpConfig.lossless === true, // Use lossless if configured
      nearLossless: false,
      smartSubsample: true,
      preset: 'default',
    };

    // Adjust settings based on content type for consistent behavior
    switch (contentType) {
      case 'text':
        // Higher quality and consider lossless for text
        webpOptions.quality = Math.max(quality, 75);
        webpOptions.lossless = true; // Use lossless for text when possible
        webpOptions.nearLossless = false;
        webpOptions.preset = 'text';
        break;

      case 'logo':
        // High quality for logos with smart settings
        webpOptions.quality = Math.max(quality, 70);
        webpOptions.lossless = false; // Lossy usually better for file size
        webpOptions.nearLossless = true;
        webpOptions.preset = 'icon';
        break;

      case 'graphics':
        // Balanced settings for graphics
        webpOptions.preset = 'drawing';
        webpOptions.nearLossless = false;
        break;

      case 'photo':
      default:
        // Optimized for photographic content
        webpOptions.preset = 'photo';
        webpOptions.lossless = false;
        webpOptions.nearLossless = false;
        break;
    }

    this.logger.log(`WebP optimization: quality=${webpOptions.quality}, effort=${webpOptions.effort}, lossless=${webpOptions.lossless}, preset=${webpOptions.preset}`);
    return pipeline.webp(webpOptions).toBuffer();
  }

  /**
   * Optimize all images in a batch with comprehensive optimization
   * Enhanced with robust error handling to ensure batch processing continues even with individual failures
   * @param imageUrls - Array of image URLs or paths
   * @param contentTypes - Array of content types (optional, defaults to 'photo')
   * @returns Promise<BatchOptimizationResult>
   */
  async optimizeImageBatch(
    imageUrls: string[],
    contentTypes?: ('text' | 'photo' | 'graphics' | 'logo')[]
  ): Promise<{
    results: OptimizedImageResult[];
    totalOriginalSize: number;
    totalOptimizedSize: number;
    overallCompressionRatio: number;
    successCount: number;
    failureCount: number;
  }> {
    const batchId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    this.logger.log(`Starting robust batch optimization of ${imageUrls.length} images (batch: ${batchId})`);

    const results: OptimizedImageResult[] = [];
    let totalOriginalSize = 0;
    let totalOptimizedSize = 0;
    let successCount = 0;
    let failureCount = 0;
    let criticalFailures = 0;

    // Process each image with comprehensive error handling
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      const contentType = contentTypes?.[i] || 'photo';
      const imageId = `${batchId}-image-${i}`;

      this.logger.log(`Processing image ${i + 1}/${imageUrls.length}: ${imageUrl} (${contentType})`);

      try {
        // Use the enhanced optimizeImageForPDF method which has comprehensive error handling
        const result = await this.optimizeImageForPDF(imageUrl, contentType);
        results.push(result);

        // Track metrics even for failed optimizations (they return safe placeholders)
        totalOriginalSize += result.originalSize;
        totalOptimizedSize += result.optimizedSize;

        if (result.error) {
          failureCount++;
          this.logger.warn(`Image ${i + 1} optimization failed but batch continues: ${result.error}`);
        } else {
          successCount++;
          this.logger.log(`Image ${i + 1} optimized successfully: ${this.formatFileSize(result.originalSize)} → ${this.formatFileSize(result.optimizedSize)}`);
        }

      } catch (criticalError) {
        // This should rarely happen due to the comprehensive error handling in optimizeImageForPDF
        criticalFailures++;
        this.logger.error(`Critical failure processing image ${i + 1} (${imageUrl}): ${criticalError.message}`);

        // Create a safe placeholder result to ensure batch processing continues
        const placeholderResult = this.createSafePlaceholderResult(
          imageUrl,
          contentType,
          `Critical batch processing error: ${criticalError.message}`
        );

        results.push(placeholderResult);
        failureCount++;

        // Log but continue processing - don't let one critical failure stop the entire batch
        this.logger.warn(`Created placeholder result for image ${i + 1}, continuing batch processing`);
      }

      // Add small delay between images to prevent overwhelming the system
      if (i < imageUrls.length - 1) {
        await this.delay(100); // 100ms delay between images
      }
    }

    const processingTime = Date.now() - startTime;
    const overallCompressionRatio = totalOriginalSize > 0 ?
      (totalOriginalSize - totalOptimizedSize) / totalOriginalSize : 0;

    this.logger.log(
      `Robust batch optimization completed in ${processingTime}ms: ` +
      `${successCount} successful, ${failureCount} failed (${criticalFailures} critical), ` +
      `${this.formatFileSize(totalOriginalSize)} → ${this.formatFileSize(totalOptimizedSize)} ` +
      `(${(overallCompressionRatio * 100).toFixed(1)}% overall reduction)`
    );

    const batchResult = {
      results,
      totalOriginalSize,
      totalOptimizedSize,
      overallCompressionRatio,
      successCount,
      failureCount,
    };

    // Record comprehensive batch optimization metrics
    try {
      const batchMetrics = this.createBatchMetricsFromResults(results);
      const batchOptimizationResult = {
        results,
        batchMetrics,
        summary: {
          totalImages: results.length,
          successfulImages: successCount,
          failedImages: failureCount,
          criticalFailures,
          totalSizeReduction: totalOriginalSize - totalOptimizedSize,
          averageCompressionRatio: overallCompressionRatio,
          totalProcessingTime: processingTime,
          batchId,
        },
        configurationSnapshot: this.optimizationConfig
      };

      if (this.metricsService && typeof this.metricsService.recordBatchOptimization === 'function') {
        this.metricsService.recordBatchOptimization(batchOptimizationResult, batchId);
      }
    } catch (metricsError) {
      this.logger.warn(`Failed to record batch metrics (batch continues): ${metricsError.message}`);
    }

    // Log final batch statistics
    this.logBatchStatistics(batchResult, processingTime, criticalFailures);

    return batchResult;
  }

  /**
   * Log comprehensive batch processing statistics
   * @param batchResult - Batch optimization result
   * @param processingTime - Total processing time
   * @param criticalFailures - Number of critical failures
   */
  private logBatchStatistics(
    batchResult: {
      results: OptimizedImageResult[];
      totalOriginalSize: number;
      totalOptimizedSize: number;
      overallCompressionRatio: number;
      successCount: number;
      failureCount: number;
    },
    processingTime: number,
    criticalFailures: number
  ): void {
    const { results, successCount, failureCount, overallCompressionRatio } = batchResult;

    this.logger.log('=== Batch Optimization Statistics ===');
    this.logger.log(`Total Images: ${results.length}`);
    this.logger.log(`Successful: ${successCount} (${((successCount / results.length) * 100).toFixed(1)}%)`);
    this.logger.log(`Failed: ${failureCount} (${((failureCount / results.length) * 100).toFixed(1)}%)`);
    this.logger.log(`Critical Failures: ${criticalFailures}`);
    this.logger.log(`Overall Compression: ${(overallCompressionRatio * 100).toFixed(1)}%`);
    this.logger.log(`Processing Time: ${processingTime}ms (${(processingTime / results.length).toFixed(0)}ms avg per image)`);
    this.logger.log(`Size Reduction: ${this.formatFileSize(batchResult.totalOriginalSize - batchResult.totalOptimizedSize)}`);

    // Log error breakdown
    const errorTypes = new Map<string, number>();
    results.forEach(result => {
      if (result.error) {
        const errorType = this.categorizeError(result.error);
        errorTypes.set(errorType, (errorTypes.get(errorType) || 0) + 1);
      }
    });

    if (errorTypes.size > 0) {
      this.logger.log('Error Breakdown:');
      errorTypes.forEach((count, type) => {
        this.logger.log(`  ${type}: ${count}`);
      });
    }

    this.logger.log('=====================================');
  }

  /**
   * Collect all images from order data for batch processing
   * @param orderData - Order data to collect images from
   * @returns Collection of images with metadata
   */
  private collectImagesFromOrderData(orderData: OrderPDFData): {
    imageUrls: string[];
    contentTypes: ('text' | 'photo' | 'graphics' | 'logo')[];
    imageMetadata: Array<{ type: 'product' | 'logo' | 'qr_code'; name?: string; index?: number }>;
  } {
    const imageUrls: string[] = [];
    const contentTypes: ('text' | 'photo' | 'graphics' | 'logo')[] = [];
    const imageMetadata: Array<{ type: 'product' | 'logo' | 'qr_code'; name?: string; index?: number }> = [];

    // Collect product images with consistent indexing
    for (let i = 0; i < orderData.items.length; i++) {
      const item = orderData.items[i];
      if (item.imageUrl && typeof item.imageUrl === 'string') {
        imageUrls.push(item.imageUrl);
        contentTypes.push('photo');
        imageMetadata.push({ type: 'product', name: item.name, index: i });
      }
    }

    // Collect business logo
    if (orderData.businessInfo.logoUrl) {
      imageUrls.push(orderData.businessInfo.logoUrl);
      contentTypes.push('logo');
      imageMetadata.push({ type: 'logo' });
    }

    // Collect QR code image
    if (orderData.paymentMethod.qrCodeUrl) {
      imageUrls.push(orderData.paymentMethod.qrCodeUrl);
      contentTypes.push('graphics');
      imageMetadata.push({ type: 'qr_code' });
    }

    this.logger.log(`Collected ${imageUrls.length} images for batch optimization: ${imageMetadata.map(m => m.type).join(', ')}`);

    return { imageUrls, contentTypes, imageMetadata };
  }

  /**
   * Optimize image batch with consistent settings across all images
   * @param imageUrls - Array of image URLs or paths
   * @param contentTypes - Array of content types
   * @returns Promise<BatchOptimizationResult>
   */
  private async optimizeImageBatchWithConsistentSettings(
    imageUrls: string[],
    contentTypes: ('text' | 'photo' | 'graphics' | 'logo')[]
  ): Promise<{
    results: OptimizedImageResult[];
    totalOriginalSize: number;
    totalOptimizedSize: number;
    overallCompressionRatio: number;
    successCount: number;
    failureCount: number;
  }> {
    this.logger.log(`Starting consistent batch optimization of ${imageUrls.length} images`);

    // Ensure all images use the same optimization configuration
    const consistentConfig = { ...this.optimizationConfig };

    // Log the configuration being used for consistency
    this.logger.log(`Using consistent optimization settings: aggressive mode ${consistentConfig.aggressiveMode.enabled}, ` +
      `max dimensions ${consistentConfig.aggressiveMode.maxDimensions.width}x${consistentConfig.aggressiveMode.maxDimensions.height}`);

    // Use the existing optimizeImageBatch method but with enhanced logging for consistency
    const batchResult = await this.optimizeImageBatch(imageUrls, contentTypes);

    // Validate that all successful optimizations used consistent settings
    const successfulResults = batchResult.results.filter(r => !r.error && r.optimizedBuffer);
    if (successfulResults.length > 1) {
      this.validateConsistentOptimization(successfulResults);
    }

    return batchResult;
  }

  /**
   * Validate format handling consistency across different input formats
   * Ensures that the same scaling and optimization rules are applied regardless of input format
   * @param results - Array of optimization results to validate
   * @returns Validation result with consistency information
   */
  private validateFormatHandlingConsistency(results: OptimizedImageResult[]): {
    isConsistent: boolean;
    inconsistencies: string[];
    formatStats: { [format: string]: { count: number; avgCompressionRatio: number; avgQuality: number } };
  } {
    const inconsistencies: string[] = [];
    const formatStats: { [format: string]: { count: number; avgCompressionRatio: number; avgQuality: number } } = {};

    // Group results by format and analyze consistency
    results.forEach(result => {
      const format = result.format;
      if (!formatStats[format]) {
        formatStats[format] = { count: 0, avgCompressionRatio: 0, avgQuality: 0 };
      }

      const stats = formatStats[format];
      stats.count++;
      stats.avgCompressionRatio += result.compressionRatio;
      stats.avgQuality += result.metadata?.qualityUsed || 0;
    });

    // Calculate averages
    Object.keys(formatStats).forEach(format => {
      const stats = formatStats[format];
      stats.avgCompressionRatio /= stats.count;
      stats.avgQuality /= stats.count;
    });

    // Check for consistency across formats
    const formats = Object.keys(formatStats);
    if (formats.length > 1) {
      const maxDimensions = this.optimizationConfig.aggressiveMode.maxDimensions;

      // Validate that all formats respect the same dimension constraints
      results.forEach(result => {
        if (result.dimensions.optimized.width > maxDimensions.width * 1.1 ||
            result.dimensions.optimized.height > maxDimensions.height * 1.1) {
          inconsistencies.push(
            `Format ${result.format} exceeded dimension limits: ${result.dimensions.optimized.width}x${result.dimensions.optimized.height} > ${maxDimensions.width}x${maxDimensions.height}`
          );
        }
      });

      // Check that compression ratios are reasonable across formats
      const compressionRatios = formats.map(f => formatStats[f].avgCompressionRatio);
      const minRatio = Math.min(...compressionRatios);
      const maxRatio = Math.max(...compressionRatios);

      if (maxRatio - minRatio > 0.3) { // 30% difference threshold
        inconsistencies.push(
          `Large compression ratio variance across formats: ${minRatio.toFixed(2)} to ${maxRatio.toFixed(2)}`
        );
      }
    }

    const isConsistent = inconsistencies.length === 0;

    if (!isConsistent) {
      this.logger.warn(`Format handling inconsistencies detected: ${inconsistencies.join(', ')}`);
    } else {
      this.logger.log(`Format handling consistency validated across ${formats.length} formats`);
    }

    return { isConsistent, inconsistencies, formatStats };
  }

  /**
   * Validate that all optimization results used consistent settings
   * @param results - Array of successful optimization results
   */
  private validateConsistentOptimization(results: OptimizedImageResult[]): void {
    const firstResult = results[0];
    const inconsistencies: string[] = [];

    for (let i = 1; i < results.length; i++) {
      const result = results[i];

      // Check if optimization technique is consistent
      if (result.metadata?.technique !== firstResult.metadata?.technique) {
        inconsistencies.push(`Technique mismatch: ${firstResult.metadata?.technique} vs ${result.metadata?.technique}`);
      }

      // Check if dimensions are within expected ranges (allowing for aspect ratio differences)
      const maxDimensions = this.optimizationConfig.aggressiveMode.maxDimensions;
      if (result.dimensions.optimized.width > maxDimensions.width * 1.1 ||
          result.dimensions.optimized.height > maxDimensions.height * 1.1) {
        inconsistencies.push(
          `Inconsistent dimensions: ${result.dimensions.optimized.width}x${result.dimensions.optimized.height} exceeds limits`
        );
      }
    }

    // Validate format handling consistency
    const formatConsistency = this.validateFormatHandlingConsistency(results);
    inconsistencies.push(...formatConsistency.inconsistencies);

    if (inconsistencies.length > 0) {
      this.logger.warn(`Optimization consistency issues detected: ${inconsistencies.join(', ')}`);
    } else {
      this.logger.log(`Consistent optimization validated across ${results.length} images`);
    }
  }

  /**
   * Process batch optimization results and update optimization messages
   * @param batchResult - Batch optimization result
   * @param imageMetadata - Metadata for each image
   * @param optimizations - Array to collect optimization messages
   * @returns Processing result with total size savings
   */
  private processBatchOptimizationResults(
    batchResult: {
      results: OptimizedImageResult[];
      totalOriginalSize: number;
      totalOptimizedSize: number;
      overallCompressionRatio: number;
      successCount: number;
      failureCount: number;
    },
    imageMetadata: Array<{ type: 'product' | 'logo' | 'qr_code'; name?: string; index?: number }>,
    optimizations: string[]
  ): { totalSizeSavings: number } {
    let totalSizeSavings = 0;

    // Process individual results
    for (let i = 0; i < batchResult.results.length; i++) {
      const result = batchResult.results[i];
      const metadata = imageMetadata[i];

      if (!result.error && result.optimizedBuffer) {
        const imageTypeLabel = this.getImageTypeLabel(metadata);
        const compressionInfo = this.getCompressionInfo(result);

        optimizations.push(
          `Consistently optimized ${imageTypeLabel}: ${compressionInfo}`
        );
        totalSizeSavings += result.originalSize - result.optimizedSize;
      } else if (result.error) {
        this.logger.warn(`Failed to optimize ${metadata.type}${metadata.name ? ` (${metadata.name})` : ''}: ${result.error}`);
        optimizations.push(`Failed to optimize ${this.getImageTypeLabel(metadata)}: ${result.error}`);
      }
    }

    return { totalSizeSavings };
  }

  /**
   * Get human-readable image type label
   * @param metadata - Image metadata
   * @returns Human-readable label
   */
  private getImageTypeLabel(metadata: { type: 'product' | 'logo' | 'qr_code'; name?: string; index?: number }): string {
    switch (metadata.type) {
      case 'product':
        return `product image${metadata.name ? ` for ${metadata.name}` : ''}${metadata.index !== undefined ? ` (item ${metadata.index + 1})` : ''}`;
      case 'logo':
        return 'business logo';
      case 'qr_code':
        return 'QR code image';
      default:
        return 'image';
    }
  }

  /**
   * Get compression information string
   * @param result - Optimization result
   * @returns Compression information string
   */
  private getCompressionInfo(result: OptimizedImageResult): string {
    const originalSize = this.formatFileSize(result.originalSize);
    const optimizedSize = this.formatFileSize(result.optimizedSize);
    const compressionRatio = (result.compressionRatio * 100).toFixed(1);
    const dimensions = `${result.dimensions.original.width}x${result.dimensions.original.height} → ${result.dimensions.optimized.width}x${result.dimensions.optimized.height}`;

    return `${originalSize} → ${optimizedSize} (${compressionRatio}% reduction), ${dimensions}`;
  }

  /**
   * Fallback to consistent individual optimization when batch optimization fails
   * @param orderData - Order data being optimized
   * @param optimizations - Array to collect optimization messages
   * @returns Promise with total size savings
   */
  private async fallbackToConsistentIndividualOptimization(
    orderData: OrderPDFData,
    optimizations: string[]
  ): Promise<{ totalSizeSavings: number }> {
    this.logger.log('Falling back to consistent individual image optimization');

    let totalSizeSavings = 0;
    const imageCollection = this.collectImagesFromOrderData(orderData);

    // Process each image individually but with consistent settings
    for (let i = 0; i < imageCollection.imageUrls.length; i++) {
      const imageUrl = imageCollection.imageUrls[i];
      const contentType = imageCollection.contentTypes[i];
      const metadata = imageCollection.imageMetadata[i];

      try {
        const optimization = await this.comprehensiveImageOptimization(imageUrl, contentType);

        if (optimization.optimizedBuffer && !optimization.error) {
          const imageTypeLabel = this.getImageTypeLabel(metadata);
          const compressionInfo = this.getCompressionInfo(optimization);

          optimizations.push(`Individually optimized ${imageTypeLabel}: ${compressionInfo}`);
          totalSizeSavings += optimization.originalSize - optimization.optimizedSize;
        } else if (optimization.error) {
          this.logger.warn(`Failed to optimize ${metadata.type}: ${optimization.error}`);
          optimizations.push(`Failed to optimize ${this.getImageTypeLabel(metadata)}: ${optimization.error}`);
        }
      } catch (error) {
        this.logger.warn(`Exception during individual optimization of ${metadata.type}: ${error.message}`);
        optimizations.push(`Exception during optimization of ${this.getImageTypeLabel(metadata)}: ${error.message}`);
      }
    }

    this.logger.log(`Individual optimization fallback completed with ${this.formatFileSize(totalSizeSavings)} total savings`);
    return { totalSizeSavings };
  }

  /**
   * Fallback to individual optimization when batch optimization fails
   * @param optimizedData - Order data being optimized
   * @param optimizations - Array to collect optimization messages
   * @param totalSizeSavings - Running total of size savings
   */
  private async fallbackToIndividualOptimization(
    optimizedData: any,
    optimizations: string[],
    totalSizeSavings: number
  ): Promise<void> {
    this.logger.log('Falling back to individual image optimization');

    // Optimize product images individually
    for (const item of optimizedData.items) {
      if (item.imageUrl && typeof item.imageUrl === 'string') {
        try {
          const optimization = await this.comprehensiveImageOptimization(item.imageUrl, 'photo');
          if (optimization.optimizedBuffer && !optimization.error) {
            optimizations.push(
              `Comprehensively optimized product image ${item.name}: ` +
              `${this.formatFileSize(optimization.originalSize)} → ${this.formatFileSize(optimization.optimizedSize)} ` +
              `(${(optimization.compressionRatio * 100).toFixed(1)}% reduction)`
            );
            totalSizeSavings += optimization.originalSize - optimization.optimizedSize;
          }
        } catch (error) {
          this.logger.warn(`Failed to optimize image for product ${item.name}: ${error.message}`);
        }
      }
    }

    // Optimize business logo individually
    if (optimizedData.businessInfo.logoUrl) {
      try {
        const optimization = await this.comprehensiveImageOptimization(optimizedData.businessInfo.logoUrl, 'logo');
        if (optimization.optimizedBuffer && !optimization.error) {
          optimizations.push(
            `Comprehensively optimized business logo: ` +
            `${this.formatFileSize(optimization.originalSize)} → ${this.formatFileSize(optimization.optimizedSize)} ` +
            `(${(optimization.compressionRatio * 100).toFixed(1)}% reduction)`
          );
          totalSizeSavings += optimization.originalSize - optimization.optimizedSize;
        }
      } catch (error) {
        this.logger.warn(`Failed to optimize business logo: ${error.message}`);
      }
    }

    // Optimize QR code image individually
    if (optimizedData.paymentMethod.qrCodeUrl) {
      try {
        const optimization = await this.comprehensiveImageOptimization(optimizedData.paymentMethod.qrCodeUrl, 'graphics');
        if (optimization.optimizedBuffer && !optimization.error) {
          optimizations.push(
            `Comprehensively optimized QR code: ` +
            `${this.formatFileSize(optimization.originalSize)} → ${this.formatFileSize(optimization.optimizedSize)} ` +
            `(${(optimization.compressionRatio * 100).toFixed(1)}% reduction)`
          );
          totalSizeSavings += optimization.originalSize - optimization.optimizedSize;
        }
      } catch (error) {
        this.logger.warn(`Failed to optimize QR code: ${error.message}`);
      }
    }
  }

  /**
   * Create batch metrics from optimization results
   * @param results - Array of optimization results
   * @returns Batch optimization metrics
   */
  private createBatchMetricsFromResults(results: OptimizedImageResult[]) {
    const metrics = {
      totalImagesProcessed: results.length,
      successfulOptimizations: results.filter(r => !r.error).length,
      failedOptimizations: results.filter(r => !!r.error).length,
      totalOriginalSize: results.reduce((sum, r) => sum + r.originalSize, 0),
      totalOptimizedSize: results.reduce((sum, r) => sum + r.optimizedSize, 0),
      overallCompressionRatio: 0,
      averageProcessingTime: 0,
      totalProcessingTime: results.reduce((sum, r) => sum + r.processingTime, 0),
      formatBreakdown: {} as any,
      contentTypeBreakdown: {} as any,
      errorBreakdown: {} as any,
      timestamp: new Date()
    };

    // Calculate overall compression ratio
    metrics.overallCompressionRatio = metrics.totalOriginalSize > 0 ?
      (metrics.totalOriginalSize - metrics.totalOptimizedSize) / metrics.totalOriginalSize : 0;

    // Calculate average processing time
    metrics.averageProcessingTime = metrics.totalImagesProcessed > 0 ?
      metrics.totalProcessingTime / metrics.totalImagesProcessed : 0;

    // Build format and content type breakdowns
    results.forEach(result => {
      // Format breakdown
      const format = result.format || 'unknown';
      if (!metrics.formatBreakdown[format]) {
        metrics.formatBreakdown[format] = {
          count: 0,
          originalSize: 0,
          optimizedSize: 0,
          compressionRatio: 0
        };
      }
      const formatStats = metrics.formatBreakdown[format];
      formatStats.count++;
      formatStats.originalSize += result.originalSize;
      formatStats.optimizedSize += result.optimizedSize;
      formatStats.compressionRatio = formatStats.originalSize > 0 ?
        (formatStats.originalSize - formatStats.optimizedSize) / formatStats.originalSize : 0;

      // Content type breakdown
      const contentType = result.metadata?.contentType || 'unknown';
      if (!metrics.contentTypeBreakdown[contentType]) {
        metrics.contentTypeBreakdown[contentType] = {
          count: 0,
          originalSize: 0,
          optimizedSize: 0,
          compressionRatio: 0
        };
      }
      const contentStats = metrics.contentTypeBreakdown[contentType];
      contentStats.count++;
      contentStats.originalSize += result.originalSize;
      contentStats.optimizedSize += result.optimizedSize;
      contentStats.compressionRatio = contentStats.originalSize > 0 ?
        (contentStats.originalSize - contentStats.optimizedSize) / contentStats.originalSize : 0;

      // Error breakdown
      if (result.error) {
        const errorType = this.categorizeError(result.error);
        metrics.errorBreakdown[errorType] = (metrics.errorBreakdown[errorType] || 0) + 1;
      }
    });

    return metrics;
  }

  /**
   * Categorize error types for tracking
   * @param error - Error message
   * @returns Error category
   */
  private categorizeError(error: string): string {
    const errorLower = error.toLowerCase();

    if (errorLower.includes('not found') || errorLower.includes('file not found')) {
      return 'file_not_found';
    }
    if (errorLower.includes('fetch') || errorLower.includes('network')) {
      return 'network_error';
    }
    if (errorLower.includes('memory') || errorLower.includes('out of memory')) {
      return 'memory_error';
    }
    if (errorLower.includes('format') || errorLower.includes('invalid')) {
      return 'format_error';
    }
    if (errorLower.includes('timeout')) {
      return 'timeout_error';
    }

    return 'unknown_error';
  }

  /**
   * Record optimization metrics and performance data
   * @param result - Optimization result
   * @param operationId - Unique operation identifier
   * @param memoryStart - Memory usage at operation start
   * @param startTime - Operation start time
   * @param success - Whether the operation was successful
   */
  private recordOptimizationMetrics(
    result: OptimizedImageResult,
    operationId: string,
    memoryStart: NodeJS.MemoryUsage,
    startTime: number,
    success: boolean
  ): void {
    try {
      // Record image optimization metrics
      this.metricsService.recordImageOptimization(result, operationId);

      // Record performance monitoring data
      const memoryEnd = process.memoryUsage();
      const endTime = Date.now();

      const performanceData: PerformanceMonitoringData = {
        operationId,
        operationType: 'single_image',
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        duration: endTime - startTime,
        memoryUsage: {
          peak: Math.max(memoryStart.heapUsed, memoryEnd.heapUsed),
          average: (memoryStart.heapUsed + memoryEnd.heapUsed) / 2,
          start: memoryStart.heapUsed,
          end: memoryEnd.heapUsed
        },
        cpuUsage: {
          cpuTime: endTime - startTime, // Simplified CPU time calculation
          utilization: this.calculateCpuUtilization(startTime, endTime)
        },
        ioStats: {
          bytesRead: result.originalSize,
          bytesWritten: result.optimizedSize,
          readOperations: 1,
          writeOperations: success ? 1 : 0
        },
        success,
        error: result.error
      };

      this.metricsService.recordPerformanceData(performanceData);

    } catch (error) {
      this.logger.warn(`Failed to record optimization metrics: ${error.message}`);
    }
  }

  /**
   * Calculate CPU utilization (simplified implementation)
   * @param startTime - Operation start time
   * @param endTime - Operation end time
   * @returns CPU utilization percentage
   */
  private calculateCpuUtilization(startTime: number, endTime: number): number {
    // Simplified CPU utilization calculation
    // In a production system, you would use more sophisticated CPU monitoring
    const duration = endTime - startTime;
    const loadAverage = os.loadavg()[0]; // 1-minute load average
    const cpuCount = os.cpus().length;

    // Estimate utilization based on load average and operation duration
    const utilization = Math.min((loadAverage / cpuCount) * (duration / 1000), 1.0);
    return utilization;
  }

  /**
   * Log validation summary for monitoring
   * @param result - Comprehensive validation result
   * @param operationId - Operation identifier
   */
  private logValidationSummary(result: ComprehensiveValidationResult, operationId?: string): void {
    try {
      const logPrefix = operationId ? `[${operationId}]` : '';
      const status = result.isValid ? 'VALID' : 'INVALID';
      const confidence = (result.confidenceScore * 100).toFixed(1);

      this.logger.log(`${logPrefix} Comprehensive validation: ${status} (confidence: ${confidence}%)`);

      // Log key metrics
      const sizeReduction = result.validationBreakdown.sizeReduction;
      this.logger.log(`${logPrefix} Size reduction: ${(sizeReduction.actualReduction * 100).toFixed(1)}% (${sizeReduction.effectiveness})`);

      const quality = result.validationBreakdown.qualityPreservation;
      this.logger.log(`${logPrefix} Quality score: ${(quality.qualityScore * 100).toFixed(1)}%`);

      // Log performance
      const perf = result.performanceMetrics;
      this.logger.log(`${logPrefix} Validation performance: ${perf.validationTime}ms, ${this.formatFileSize(perf.memoryUsage)} memory`);

      // Log recommendations count
      if (result.recommendations.length > 0) {
        this.logger.log(`${logPrefix} Generated ${result.recommendations.length} optimization recommendations`);
      }

    } catch (error) {
      this.logger.error(`Failed to log validation summary: ${error.message}`);
    }
  }

  /**
   * Convert basic validation result to comprehensive format
   * @param basicResult - Basic validation result
   * @param errorMessage - Error message if conversion was due to error
   * @returns Comprehensive validation result
   */
  private convertToComprehensiveResult(
    basicResult: ValidationResult,
    errorMessage?: string
  ): ComprehensiveValidationResult {
    const errors = errorMessage ? [...basicResult.errors, errorMessage] : basicResult.errors;

    return {
      ...basicResult,
      errors,
      validationBreakdown: {
        sizeReduction: {
          isValid: basicResult.qualityAcceptable,
          actualReduction: basicResult.metadata.sizeReductionPercentage / 100,
          expectedMinimum: 0.1,
          effectiveness: basicResult.qualityAcceptable ? 'acceptable' : 'poor'
        },
        qualityPreservation: {
          isValid: basicResult.qualityAcceptable,
          qualityScore: basicResult.qualityAcceptable ? 0.7 : 0.3,
          readabilityMaintained: basicResult.qualityAcceptable,
          visualIntegrityScore: basicResult.qualityAcceptable ? 0.7 : 0.3
        },
        formatOptimization: {
          isValid: basicResult.qualityAcceptable,
          optimalFormatUsed: true, // Assume optimal format was used
          formatEfficiency: basicResult.qualityAcceptable ? 0.8 : 0.4,
          compressionEffectiveness: basicResult.metadata.sizeReductionPercentage / 100
        },
        dimensionOptimization: {
          isValid: basicResult.dimensionsCorrect,
          optimalDimensions: basicResult.dimensionsCorrect,
          aspectRatioAccuracy: basicResult.aspectRatioPreserved ? 1.0 : 0.5,
          scalingEffectiveness: 0.5 // Default moderate effectiveness
        }
      },
      performanceMetrics: {
        validationTime: 100, // Default validation time
        memoryUsage: 1024 * 1024, // Default 1MB
        cpuUsage: 50 // Default 50ms
      },
      recommendations: errors.length > 0 ? ['Review and fix validation errors'] : [],
      confidenceScore: basicResult.isValid ? 0.7 : 0.3
    };
  }

  /**
   * Get compressed image from storage with enhanced error handling and fallback
   * @param imageUrl - Original image URL/path
   * @returns Promise<OptimizedImageResult | null>
   */
  private async getCompressedImage(imageUrl: string): Promise<OptimizedImageResult | null> {
    try {
      // Enhanced error handling: Check if compressed storage is available
      if (!await this.isCompressedStorageAvailable()) {
        this.logger.log(`Compressed storage unavailable, skipping retrieval for ${imageUrl}`);
        return null;
      }

      const result = await this.compressedImageService.getCompressedImage(imageUrl);

      if (result) {
        this.logger.log(`Successfully retrieved compressed image for ${imageUrl}`);
      }

      return result;

    } catch (error) {
      // Enhanced error handling: Log but don't fail PDF generation
      this.logger.warn(`Failed to retrieve compressed image for ${imageUrl}: ${error.message}`);

      // Always return null to trigger fresh optimization - this ensures PDF generation continues
      return null;
    }
  }

  /**
   * Save compressed image to storage with enhanced error handling and fallback
   * @param imageUrl - Original image URL/path
   * @param result - Optimization result to save
   * @returns Promise<void>
   */
  private async saveCompressedImage(imageUrl: string, result: OptimizedImageResult): Promise<void> {
    try {
      // Enhanced error handling: Check if compressed storage is available
      if (!await this.isCompressedStorageAvailable()) {
        this.logger.log(`Compressed storage unavailable, skipping save for ${imageUrl}`);
        return;
      }

      // Enhanced error handling: Validate result before saving
      if (!result.optimizedBuffer || result.optimizedBuffer.length === 0) {
        this.logger.warn(`Invalid optimization result for ${imageUrl}, skipping save`);
        return;
      }

      const savedPath = await this.compressedImageService.saveCompressedImage(imageUrl, result);

      if (savedPath) {
        this.logger.log(`Saved compressed image for ${imageUrl} to ${savedPath}`);
        // Record storage metrics only on successful save
        this.recordImageStorageMetrics(imageUrl, result, savedPath);
      } else {
        // Empty path indicates graceful degradation was used
        this.logger.log(`Compressed image save gracefully skipped for ${imageUrl}`);
      }

    } catch (error) {
      // Enhanced error handling: Log but ensure PDF generation continues
      this.logger.warn(`Failed to save compressed image for ${imageUrl}: ${error.message}`);

      // Record failed storage attempt for monitoring
      this.recordFailedStorageAttempt(imageUrl, result, error.message);

      // Continue execution - storage failure should NEVER break PDF generation
      // This is critical for maintaining system reliability
    }
  }

  /**
   * Record metrics for image reuse from compressed storage
   * @param imageUrl - Original image URL/path
   * @param result - Retrieved optimization result
   * @param operationId - Operation identifier
   */
  private recordImageReuseMetrics(
    imageUrl: string,
    result: OptimizedImageResult,
    operationId: string
  ): void {
    try {
      // Record image reuse metrics if available
      if (this.metricsService) {
        // Using existing recordImageOptimization method instead
        this.metricsService.recordImageOptimization(result, operationId);
      }

      this.logger.log(`Recorded reuse metrics for ${imageUrl}: ${this.formatFileSize(result.optimizedSize)} retrieved from storage`);
    } catch (error) {
      this.logger.warn(`Failed to record reuse metrics for ${imageUrl}: ${error.message}`);
    }
  }

  /**
   * Record metrics for image storage operations
   * @param imageUrl - Original image URL/path
   * @param result - Optimization result that was stored
   * @param savedPath - Path where image was saved
   */
  private recordImageStorageMetrics(
    imageUrl: string,
    result: OptimizedImageResult,
    savedPath: string
  ): void {
    try {
      // Record image storage metrics if available
      if (this.metricsService) {
        // Using existing recordImageOptimization method instead
        this.metricsService.recordImageOptimization(result, `storage-${imageUrl}`);
      }

      this.logger.log(`Recorded storage metrics for ${imageUrl}: ${this.formatFileSize(result.optimizedSize)} saved to ${savedPath}`);
    } catch (error) {
      this.logger.warn(`Failed to record storage metrics for ${imageUrl}: ${error.message}`);
    }
  }

  /**
   * Check if compressed image exists for given path
   * @param imageUrl - Original image URL/path
   * @returns Promise<boolean>
   */
  async hasCompressedImage(imageUrl: string): Promise<boolean> {
    try {
      return await this.compressedImageService.hasCompressedImage(imageUrl);
    } catch (error) {
      this.logger.warn(`Failed to check compressed image existence for ${imageUrl}: ${error.message}`);
      return false;
    }
  }

  /**
   * Get compressed image storage metrics
   * @returns Promise<StorageMetrics>
   */
  async getCompressedImageStorageMetrics(): Promise<{
    totalStorageSize: number;
    totalCompressedImages: number;
    reuseRate: number;
    averageCompressionRatio: number;
    storageUtilization: number;
  }> {
    try {
      return await this.compressedImageService.getStorageMetrics();
    } catch (error) {
      this.logger.error(`Failed to get compressed image storage metrics: ${error.message}`);
      return {
        totalStorageSize: 0,
        totalCompressedImages: 0,
        reuseRate: 0,
        averageCompressionRatio: 0,
        storageUtilization: 0,
      };
    }
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

  // Enhanced error handling and fallback methods for compressed image storage

  /**
   * Check if compressed storage is available and functional
   * @returns Promise<boolean>
   */
  private async isCompressedStorageAvailable(): Promise<boolean> {
    try {
      // Check if compressed image service is available
      if (!this.compressedImageService) {
        return false;
      }

      // Check if storage is enabled in configuration
      if (!await this.compressedImageService.hasCompressedImage('__availability_test__')) {
        // This call will return false for non-existent file, but will fail if storage is unavailable
        return true;
      }

      return true;

    } catch (error) {
      this.logger.warn(`Compressed storage availability check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Record failed storage attempt for monitoring and debugging
   * @param imageUrl - Original image URL/path
   * @param result - Optimization result that failed to save
   * @param errorMessage - Error message
   */
  private recordFailedStorageAttempt(
    imageUrl: string,
    result: OptimizedImageResult,
    errorMessage: string
  ): void {
    try {
      // Record storage failure metrics if available
      if (this.metricsService) {
        // Create a failed result to record the failure
        const failedResult: OptimizedImageResult = {
          ...result,
          error: errorMessage
        };
        this.metricsService.recordImageOptimization(failedResult, `storage-failure-${imageUrl}`);
      }

      this.logger.warn(`Recorded storage failure for ${imageUrl}: ${errorMessage}`);

    } catch (metricsError) {
      // Don't let metrics recording failure affect the main operation
      this.logger.warn(`Failed to record storage failure metrics for ${imageUrl}: ${metricsError.message}`);
    }
  }

  /**
   * Enhanced fallback mechanism for when compressed storage completely fails
   * This ensures PDF generation continues even with total storage system failure
   * @param imageUrl - Original image URL/path
   * @param contentType - Content type for optimization
   * @returns Promise<OptimizedImageResult>
   */
  private async fallbackToFreshOptimizationOnly(
    imageUrl: string,
    contentType: 'text' | 'photo' | 'graphics' | 'logo' = 'photo'
  ): Promise<OptimizedImageResult> {
    this.logger.log(`Falling back to fresh optimization only for ${imageUrl} (storage unavailable)`);

    try {
      // Load image buffer
      const imageBuffer = await this.loadImageBuffer(imageUrl);

      // Get aggressive scaling options
      const scalingOptions = getAggressiveScalingOptions(this.optimizationConfig, contentType);

      // Perform optimization without any storage interaction
      const result = await this.reduceImageToMinimumSize(imageBuffer, scalingOptions);

      // Update metadata to indicate this was a fallback operation
      if (result.metadata) {
        result.metadata.technique = 'fallback-no-storage';
        result.metadata.contentType = contentType;
      }

      this.logger.log(`Fresh optimization fallback completed for ${imageUrl}`);
      return result;

    } catch (error) {
      this.logger.error(`Fresh optimization fallback failed for ${imageUrl}: ${error.message}`);

      // Return a safe placeholder to ensure PDF generation continues
      return this.createSafePlaceholderResult(imageUrl, contentType, error.message);
    }
  }

  /**
   * Enhanced error recovery for critical PDF generation path
   * This method ensures that PDF generation NEVER fails due to image optimization issues
   * @param imageUrl - Original image URL/path
   * @param contentType - Content type for optimization
   * @param primaryError - Primary error that occurred
   * @returns Promise<OptimizedImageResult>
   */
  private async performCriticalErrorRecovery(
    imageUrl: string,
    contentType: 'text' | 'photo' | 'graphics' | 'logo' = 'photo',
    primaryError: string
  ): Promise<OptimizedImageResult> {
    this.logger.warn(`Performing critical error recovery for ${imageUrl}: ${primaryError}`);

    try {
      // Attempt 1: Try to load original image and return it unoptimized
      const originalBuffer = await this.loadImageBuffer(imageUrl);

      this.logger.log(`Critical recovery: using original image for ${imageUrl}`);

      // Get basic metadata
      const originalMetadata = await this.getImageMetadataSafely(originalBuffer);

      return {
        optimizedBuffer: originalBuffer,
        originalSize: originalBuffer.length,
        optimizedSize: originalBuffer.length,
        compressionRatio: 0,
        dimensions: {
          original: { width: originalMetadata.width, height: originalMetadata.height },
          optimized: { width: originalMetadata.width, height: originalMetadata.height },
        },
        format: 'original',
        processingTime: 0,
        metadata: {
          contentType,
          qualityUsed: 0,
          formatConverted: false,
          originalFormat: originalMetadata.format,
          technique: 'critical-recovery',
        },
      };

    } catch (recoveryError) {
      this.logger.error(`Critical error recovery failed for ${imageUrl}: ${recoveryError.message}`);

      // Final fallback: return empty result that won't break PDF generation
      return this.createSafePlaceholderResult(
        imageUrl,
        contentType,
        `Primary: ${primaryError}; Recovery: ${recoveryError.message}`
      );
    }
  }
}