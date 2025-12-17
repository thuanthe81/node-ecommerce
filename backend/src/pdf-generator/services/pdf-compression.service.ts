import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

/**
 * PDF Compression Service
 *
 * Simplified service for basic image compression with fallback to original image on error
 */
@Injectable()
export class PDFCompressionService {
  private readonly logger = new Logger(PDFCompressionService.name);

  // Configuration constants
  private readonly IMAGE_QUALITY = 80; // JPEG quality for image compression
  private readonly MAX_IMAGE_WIDTH = 800; // Max width for product images
  private readonly MAX_IMAGE_HEIGHT = 600; // Max height for product images

  constructor() {
    this.logger.log('PDF Compression Service initialized with simplified configuration');
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
   * Simple image optimization for PDF (alias for optimizeImage)
   * @param imageUrl - URL or path to the image
   * @param contentType - Content type (ignored in simplified version)
   * @returns Promise with optimization result
   */
  async optimizeImageForPDF(
    imageUrl: string,
    contentType: 'text' | 'photo' | 'graphics' | 'logo' = 'photo'
  ): Promise<{
    optimizedBuffer?: Buffer;
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
    format: string;
    error?: string;
  }> {
    const result = await this.optimizeImage(imageUrl);
    return {
      optimizedBuffer: result.optimizedImageData,
      originalSize: result.originalSize,
      optimizedSize: result.optimizedSize,
      compressionRatio: result.compressionRatio,
      format: result.error ? 'placeholder' : 'jpeg',
      error: result.error,
    };
  }

  /**
   * Optimize order data for PDF (simplified - just returns original data)
   * @param orderData - Order data to optimize
   * @returns Promise with optimization result
   */
  async optimizeOrderDataForPDF(orderData: any): Promise<{
    optimizedData: any;
    optimizations: any[];
    sizeSavings: number;
  }> {
    this.logger.log('Using simplified order data optimization (no changes applied)');
    return {
      optimizedData: orderData,
      optimizations: [],
      sizeSavings: 0,
    };
  }

  /**
   * Get compressed image storage metrics (simplified - returns empty metrics)
   * @returns Promise with storage metrics
   */
  async getCompressedImageStorageMetrics(): Promise<{
    totalStorageSize: number;
    totalCompressedImages: number;
    reuseRate: number;
    averageCompressionRatio: number;
    storageUtilization: number;
  }> {
    return {
      totalStorageSize: 0,
      totalCompressedImages: 0,
      reuseRate: 0,
      averageCompressionRatio: 0,
      storageUtilization: 0,
    };
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
}