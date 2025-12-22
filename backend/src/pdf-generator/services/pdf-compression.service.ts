import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { CompressedImageService } from './compressed-image.service';
import { PDFImageOptimizationConfigService } from './pdf-image-optimization-config.service';
import { PDFImageOptimizationMetricsService } from './pdf-image-optimization-metrics.service';
import { OptimizedImageResult } from '../types/image-optimization.types';

/**
 * PDF Compression Service
 *
 * Enhanced service for image compression with compressed image storage integration
 */
@Injectable()
export class PDFCompressionService {
  private readonly logger = new Logger(PDFCompressionService.name);

  // Configuration constants
  private readonly IMAGE_QUALITY = 80; // JPEG quality for image compression
  private readonly MAX_IMAGE_WIDTH = 800; // Max width for product images
  private readonly MAX_IMAGE_HEIGHT = 600; // Max height for product images

  constructor(
    private readonly compressedImageService: CompressedImageService,
    private readonly configService: PDFImageOptimizationConfigService,
    private readonly metricsService: PDFImageOptimizationMetricsService
  ) {
    this.logger.log('PDF Compression Service initialized with compressed image storage integration');
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
   * Simple image optimization with fallback to original image on error
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

      // Load image buffer
      const imageBuffer = await this.loadImageBuffer(imageUrl);
      const originalSize = imageBuffer.length;

      // Try to optimize the image
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
      this.logger.warn(`Image optimization failed for ${imageUrl}: ${error.message}. Using original image.`);

      // Fallback: try to return original image
      try {
        const originalBuffer = await this.loadImageBuffer(imageUrl);
        return {
          optimizedImageData: originalBuffer,
          originalSize: originalBuffer.length,
          optimizedSize: originalBuffer.length,
          compressionRatio: 0,
          error: `Optimization failed, using original: ${error.message}`,
        };
      } catch (fallbackError) {
        this.logger.error(`Failed to load original image ${imageUrl}: ${fallbackError.message}`);
        return {
          originalSize: 0,
          optimizedSize: 0,
          compressionRatio: 0,
          error: `Both optimization and fallback failed: ${error.message}; ${fallbackError.message}`,
        };
      }
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
      // Read local file - handle UPLOAD_DIR resolution
      let imagePath: string;

      if (imageUrl.startsWith('/uploads/')) {
        // Handle paths that start with /uploads/ - resolve relative to UPLOAD_DIR
        const uploadDirEnv = process.env.UPLOAD_DIR || 'uploads';
        const baseUploadPath = path.isAbsolute(uploadDirEnv)
          ? uploadDirEnv
          : path.join(process.cwd(), uploadDirEnv);

        // Remove the leading /uploads/ and resolve relative to the actual upload directory
        const relativePath = imageUrl.substring('/uploads/'.length);
        imagePath = path.join(baseUploadPath, relativePath);
      } else if (imageUrl.startsWith('/')) {
        // Absolute path - use as is
        imagePath = imageUrl;
      } else {
        // Relative path - resolve relative to current working directory
        imagePath = path.join(process.cwd(), imageUrl);
      }

      this.logger.log(`Resolving image path: ${imageUrl} -> ${imagePath}`);

      if (!fs.existsSync(imagePath)) {
        throw new Error(`Image file not found: ${imagePath} (original URL: ${imageUrl})`);
      }
      return fs.readFileSync(imagePath);
    }
  }

  /**
   * Format file size for logging
   * @param bytes - File size in bytes
   * @returns Formatted file size string
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Enhanced image optimization for PDF with compressed image storage integration
   * @param imageUrl - URL or path to the image
   * @param contentType - Content type for optimization strategy
   * @returns Promise with optimization result
   */
  async optimizeImageForPDF(
    imageUrl: string,
    contentType: 'text' | 'photo' | 'graphics' | 'logo' = 'photo'
  ): Promise<OptimizedImageResult> {
    const startTime = Date.now();

    try {
      this.logger.log(`Optimizing image for PDF: ${imageUrl} (type: ${contentType})`);

      // Step 1: Check if compressed image already exists
      let existingCompressed: OptimizedImageResult | null = null;
      try {
        this.logger.log(`Checking compressed storage for: ${imageUrl}`);
        existingCompressed = await this.compressedImageService.getCompressedImage(imageUrl);
      } catch (retrievalError) {
        this.logger.warn(`Failed to retrieve compressed image for ${imageUrl}: ${retrievalError.message}. Proceeding with fresh optimization.`);
        // Continue with fresh optimization
      }

      if (existingCompressed) {
        this.logger.log(`✓ STORAGE HIT: Using existing compressed image for: ${imageUrl}`);
        this.logger.log(`  - Reused Size: ${this.formatFileSize(existingCompressed.optimizedSize)}`);
        this.logger.log(`  - Original Compression Ratio: ${(existingCompressed.compressionRatio * 100).toFixed(1)}%`);
        this.logger.log(`  - Storage retrieval avoided fresh optimization`);

        // Verify that reused image maintains expected quality
        await this.verifyReusedImageQuality(existingCompressed, imageUrl, contentType);

        // Update technique to indicate this came from storage
        existingCompressed.metadata.technique = 'storage';
        existingCompressed.processingTime = 0; // No processing time for retrieval
        this.metricsService.recordImageOptimization(existingCompressed, `reuse-${imageUrl}`);
        return existingCompressed;
      }

      // Log storage miss
      this.logger.log(`✗ STORAGE MISS: No compressed image found for: ${imageUrl}, performing fresh optimization`);

      // Step 2: Perform fresh optimization
      const imageBuffer = await this.loadImageBuffer(imageUrl);
      const originalSize = imageBuffer.length;

      // Get optimization settings based on content type
      const contentTypeSettings = this.configService.getContentTypeSettings(contentType);
      const config = this.configService.getConfiguration();

      const optimizationSettings = {
        maxWidth: config.aggressiveMode.maxDimensions.width,
        maxHeight: config.aggressiveMode.maxDimensions.height,
        quality: contentTypeSettings.quality
      };

      // Optimize the image using Sharp
      const optimizedImageData = await sharp(imageBuffer)
        .resize(optimizationSettings.maxWidth, optimizationSettings.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({
          quality: optimizationSettings.quality,
          progressive: true,
        })
        .toBuffer();

      const optimizedSize = optimizedImageData.length;
      const compressionRatio = originalSize > 0 ? (originalSize - optimizedSize) / originalSize : 0;
      const processingTime = Date.now() - startTime;

      // Create optimization result
      const result: OptimizedImageResult = {
        optimizedBuffer: optimizedImageData,
        originalSize,
        optimizedSize,
        compressionRatio,
        dimensions: {
          original: { width: 0, height: 0 }, // Would need Sharp metadata for exact dimensions
          optimized: { width: optimizationSettings.maxWidth, height: optimizationSettings.maxHeight }
        },
        format: 'jpeg',
        processingTime,
        metadata: {
          contentType,
          qualityUsed: optimizationSettings.quality,
          formatConverted: true,
          originalFormat: 'unknown',
          technique: 'aggressive'
        }
      };

      // Step 3: Save to compressed storage for future reuse
      try {
        this.logger.log(`Saving compressed image to storage for future reuse: ${imageUrl}`);
        const savedPath = await this.compressedImageService.saveCompressedImage(imageUrl, result);
        if (savedPath) {
          this.logger.log(`✓ STORAGE SAVE: Compressed image saved for future reuse: ${savedPath}`);
          this.logger.log(`  - Saved Size: ${this.formatFileSize(result.optimizedSize)}`);
          this.logger.log(`  - Future requests for this image will be served from storage`);
        } else {
          this.logger.warn(`⚠ STORAGE SAVE: Empty path returned, storage may be disabled or failed gracefully`);
        }
      } catch (storageError) {
        // Storage failure should not fail the optimization
        this.logger.warn(`✗ STORAGE SAVE FAILED: Failed to save compressed image for ${imageUrl}: ${storageError.message}`);
        this.logger.warn(`  - Future requests will require fresh optimization`);
      }

      // Record metrics
      this.metricsService.recordImageOptimization(result, `optimize-${imageUrl}`);

      this.logger.log(`Image optimization completed for ${imageUrl}. Size: ${this.formatFileSize(optimizedSize)}, Ratio: ${(compressionRatio * 100).toFixed(1)}%`);
      return result;

    } catch (error) {
      this.logger.error(`Image optimization failed for ${imageUrl}: ${error.message}`);

      // Fallback: try to return original image
      try {
        const originalBuffer = await this.loadImageBuffer(imageUrl);
        const fallbackResult: OptimizedImageResult = {
          optimizedBuffer: originalBuffer,
          originalSize: originalBuffer.length,
          optimizedSize: originalBuffer.length,
          compressionRatio: 0,
          dimensions: {
            original: { width: 0, height: 0 },
            optimized: { width: 0, height: 0 }
          },
          format: 'original',
          processingTime: Date.now() - startTime,
          error: `Optimization failed, using original: ${error.message}`,
          metadata: {
            contentType,
            qualityUsed: 0,
            formatConverted: false,
            originalFormat: 'unknown',
            technique: 'fallback'
          }
        };

        return fallbackResult;
      } catch (fallbackError) {
        this.logger.error(`Failed to load original image ${imageUrl}: ${fallbackError.message}`);
        throw new Error(`Both optimization and fallback failed: ${error.message}; ${fallbackError.message}`);
      }
    }
  }

  /**
   * Optimize order data for PDF with image optimization and compressed storage
   * @param orderData - Order data to optimize
   * @returns Promise with optimization result
   */
  async optimizeOrderDataForPDF(orderData: any): Promise<{
    optimizedData: any;
    optimizations: any[];
    sizeSavings: number;
  }> {
    this.logger.log('Optimizing order data for PDF with image compression');

    try {
      const optimizations: any[] = [];
      let totalSizeSavings = 0;
      const optimizedData = { ...orderData };

      // Optimize product images if present
      if (orderData.items && Array.isArray(orderData.items)) {
        for (let i = 0; i < orderData.items.length; i++) {
          const item = orderData.items[i];

          if (item.product && item.product.imageUrl) {
            try {
              const originalImageUrl = item.product.imageUrl;
              const optimizationResult = await this.optimizeImageForPDF(originalImageUrl, 'photo');

              if (optimizationResult.optimizedBuffer && !optimizationResult.error) {
                // Convert optimized buffer to base64 for PDF template
                const base64Image = `data:image/jpeg;base64,${optimizationResult.optimizedBuffer.toString('base64')}`;
                optimizedData.items[i].product.optimizedImageUrl = base64Image;

                const sizeSaving = optimizationResult.originalSize - optimizationResult.optimizedSize;
                totalSizeSavings += sizeSaving;

                optimizations.push({
                  type: 'product_image',
                  originalUrl: originalImageUrl,
                  originalSize: optimizationResult.originalSize,
                  optimizedSize: optimizationResult.optimizedSize,
                  sizeSaving,
                  compressionRatio: optimizationResult.compressionRatio
                });

                this.logger.log(`Optimized product image: ${originalImageUrl} (saved ${this.formatFileSize(sizeSaving)})`);
              }
            } catch (error) {
              this.logger.warn(`Failed to optimize product image for item ${i}: ${error.message}`);
              // Continue with other images even if one fails
            }
          }
        }
      }

      // Optimize company logo if present
      if (orderData.company && orderData.company.logoUrl) {
        try {
          const originalLogoUrl = orderData.company.logoUrl;
          const optimizationResult = await this.optimizeImageForPDF(originalLogoUrl, 'logo');

          if (optimizationResult.optimizedBuffer && !optimizationResult.error) {
            const base64Logo = `data:image/jpeg;base64,${optimizationResult.optimizedBuffer.toString('base64')}`;
            optimizedData.company.optimizedLogoUrl = base64Logo;

            const sizeSaving = optimizationResult.originalSize - optimizationResult.optimizedSize;
            totalSizeSavings += sizeSaving;

            optimizations.push({
              type: 'company_logo',
              originalUrl: originalLogoUrl,
              originalSize: optimizationResult.originalSize,
              optimizedSize: optimizationResult.optimizedSize,
              sizeSaving,
              compressionRatio: optimizationResult.compressionRatio
            });

            this.logger.log(`Optimized company logo: ${originalLogoUrl} (saved ${this.formatFileSize(sizeSaving)})`);
          }
        } catch (error) {
          this.logger.warn(`Failed to optimize company logo: ${error.message}`);
        }
      }

      this.logger.log(`Order data optimization completed. Total size savings: ${this.formatFileSize(totalSizeSavings)}, Optimizations: ${optimizations.length}`);

      return {
        optimizedData,
        optimizations,
        sizeSavings: totalSizeSavings,
      };

    } catch (error) {
      this.logger.error(`Failed to optimize order data: ${error.message}`);
      return {
        optimizedData: orderData,
        optimizations: [],
        sizeSavings: 0,
      };
    }
  }

  /**
   * Check if compressed image exists for given path
   * @param imagePath - Path to check
   * @returns Promise<boolean>
   */
  async hasCompressedImage(imagePath: string): Promise<boolean> {
    try {
      return await this.compressedImageService.hasCompressedImage(imagePath);
    } catch (error) {
      this.logger.warn(`Failed to check compressed image existence for ${imagePath}: ${error.message}`);
      return false;
    }
  }

  /**
   * Get compressed image storage metrics from the compressed image service
   * @returns Promise with storage metrics
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
   * Get compression optimized PDF options (simplified)
   * @param compressionLevel - Compression level
   * @returns PDF options
   */
  getCompressionOptimizedPDFOptions(compressionLevel: string): any {
    this.logger.log(`Using simplified PDF options for compression level: ${compressionLevel}`);
    return {
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
    };
  }

  /**
   * Validate PDF size (simplified)
   * @param filePath - Path to PDF file
   * @returns Size validation result
   */
  validatePDFSize(filePath: string): {
    isValid: boolean;
    size: number;
    maxSize: number;
    warnings: string[];
  } {
    try {
      const size = fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
      const maxSize = 25 * 1024 * 1024; // 25MB
      const isValid = size <= maxSize;
      const warnings = isValid ? [] : ['PDF exceeds maximum size limit'];

      return {
        isValid,
        size,
        maxSize,
        warnings,
      };
    } catch (error) {
      return {
        isValid: false,
        size: 0,
        maxSize: 25 * 1024 * 1024,
        warnings: [`Error validating PDF size: ${error.message}`],
      };
    }
  }

  /**
   * Generate alternative delivery methods (simplified)
   * @param filePath - Path to PDF file
   * @param orderData - Order data
   * @returns Alternative delivery methods
   */
  generateAlternativeDeliveryMethods(filePath: string, orderData: any): {
    methods: string[];
    recommendations: string[];
  } {
    this.logger.log('Using simplified alternative delivery methods');
    return {
      methods: ['email_link', 'download_portal'],
      recommendations: ['Consider using download link for large files'],
    };
  }

  /**
   * Optimize image batch (simplified - processes images one by one)
   * @param imageUrls - Array of image URLs
   * @param contentTypes - Array of content types (optional)
   * @returns Promise with batch optimization result
   */
  async optimizeImageBatch(
    imageUrls: string[],
    contentTypes?: ('text' | 'photo' | 'graphics' | 'logo')[]
  ): Promise<{
    results: any[];
    summary: {
      totalImages: number;
      successfulImages: number;
      failedImages: number;
    };
    failureCount: number;
  }> {
    this.logger.log(`Processing batch of ${imageUrls.length} images`);

    const results = [];
    let successfulImages = 0;
    let failedImages = 0;

    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      const contentType = contentTypes?.[i] || 'photo';

      try {
        const result = await this.optimizeImageForPDF(imageUrl, contentType);
        results.push(result);
        if (!result.error) {
          successfulImages++;
        } else {
          failedImages++;
        }
      } catch (error) {
        results.push({
          optimizedBuffer: undefined,
          originalSize: 0,
          optimizedSize: 0,
          compressionRatio: 0,
          error: error.message,
          format: 'placeholder',
        });
        failedImages++;
      }
    }

    return {
      results,
      summary: {
        totalImages: imageUrls.length,
        successfulImages,
        failedImages,
      },
      failureCount: failedImages,
    };
  }

  /**
   * Check if PDF file size exceeds attachment limits
   * @param filePath - Path to the PDF file
   * @returns Promise<{ isOversized: boolean; size: number; maxSize: number; recommendation?: string }>
   */
  async checkPDFSize(filePath: string): Promise<{
    isOversized: boolean;
    size: number;
    maxSize: number;
    recommendation?: string;
  }> {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`PDF file not found: ${filePath}`);
      }

      const size = fs.statSync(filePath).size;
      const maxSize = 25 * 1024 * 1024; // 25MB max attachment size
      const isOversized = size > maxSize;

      let recommendation: string | undefined;
      if (isOversized) {
        recommendation = 'Consider using alternative delivery methods for large PDF files';
      } else if (size > 10 * 1024 * 1024) { // 10MB threshold
        recommendation = 'PDF is large but within limits. Consider compression if email delivery is slow';
      }

      return {
        isOversized,
        size,
        maxSize,
        recommendation,
      };
    } catch (error) {
      this.logger.error(`Failed to check PDF size: ${error.message}`);
      return {
        isOversized: false,
        size: 0,
        maxSize: 25 * 1024 * 1024,
        recommendation: `Error checking file size: ${error.message}`,
      };
    }
  }

  /**
   * Verify that reused images maintain the same quality as fresh optimizations
   * @param reusedImage - The reused image result from storage
   * @param imageUrl - Original image URL
   * @param contentType - Content type for optimization strategy
   */
  private async verifyReusedImageQuality(
    reusedImage: OptimizedImageResult,
    imageUrl: string,
    contentType: 'text' | 'photo' | 'graphics' | 'logo'
  ): Promise<void> {
    try {
      // Get current optimization settings for this content type
      const contentTypeSettings = this.configService.getContentTypeSettings(contentType);
      const config = this.configService.getConfiguration();

      // Verify quality settings match expectations
      if (reusedImage.metadata?.qualityUsed && contentTypeSettings?.quality) {
        if (reusedImage.metadata.qualityUsed !== contentTypeSettings.quality) {
          this.logger.warn(`Quality mismatch for reused image ${imageUrl}: stored=${reusedImage.metadata.qualityUsed}, expected=${contentTypeSettings.quality}`);
          this.logger.warn(`  - This may indicate configuration changes since the image was stored`);
        } else {
          this.logger.log(`✓ Quality verification passed: reused image quality (${reusedImage.metadata.qualityUsed}) matches current settings`);
        }
      }

      // Verify dimensions are within current limits
      if (config?.aggressiveMode?.maxDimensions && reusedImage.dimensions?.optimized) {
        const maxWidth = config.aggressiveMode.maxDimensions.width;
        const maxHeight = config.aggressiveMode.maxDimensions.height;
        const actualWidth = reusedImage.dimensions.optimized.width;
        const actualHeight = reusedImage.dimensions.optimized.height;

        if (actualWidth > maxWidth || actualHeight > maxHeight) {
          this.logger.warn(`Dimension mismatch for reused image ${imageUrl}: stored=${actualWidth}x${actualHeight}, max allowed=${maxWidth}x${maxHeight}`);
          this.logger.warn(`  - This may indicate configuration changes since the image was stored`);
        } else {
          this.logger.log(`✓ Dimension verification passed: reused image dimensions (${actualWidth}x${actualHeight}) within current limits (${maxWidth}x${maxHeight})`);
        }
      }

      // Verify compression effectiveness
      if (reusedImage.compressionRatio < 0.1) { // Less than 10% compression
        this.logger.warn(`Low compression ratio for reused image ${imageUrl}: ${(reusedImage.compressionRatio * 100).toFixed(1)}%`);
        this.logger.warn(`  - This may indicate the original image was already highly compressed or configuration issues`);
      } else {
        this.logger.log(`✓ Compression verification passed: reused image has good compression ratio (${(reusedImage.compressionRatio * 100).toFixed(1)}%)`);
      }

      // Log overall quality verification result
      this.logger.log(`Quality verification completed for reused image: ${imageUrl}`);

    } catch (error) {
      // Quality verification failure should not fail the image reuse
      this.logger.warn(`Quality verification failed for reused image ${imageUrl}: ${error.message}`);
      this.logger.warn(`  - Continuing with reused image despite verification failure`);
    }
  }
}