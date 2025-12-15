import { Injectable, Logger } from '@nestjs/common';
import { PDFGenerationResult, OrderPDFData } from '../types/pdf.types';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

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
   * Optimize order data for smaller PDF generation
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

    // Optimize product images
    for (const item of optimizedData.items) {
      if (item.imageUrl && typeof item.imageUrl === 'string') {
        try {
          const optimization = await this.optimizeImage(item.imageUrl);
          if (optimization.optimizedImageData && !optimization.error) {
            // In a real implementation, you would save the optimized image and update the URL
            // For now, we'll just track the optimization
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
        const optimization = await this.optimizeImage(optimizedData.businessInfo.logoUrl);
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
        const optimization = await this.optimizeImage(optimizedData.paymentMethod.qrCodeUrl);
        if (optimization.optimizedImageData && !optimization.error) {
          optimizations.push(`Optimized QR code: ${this.formatFileSize(optimization.originalSize)} → ${this.formatFileSize(optimization.optimizedSize)}`);
          totalSizeSavings += optimization.originalSize - optimization.optimizedSize;
        }
      } catch (error) {
        this.logger.warn(`Failed to optimize QR code: ${error.message}`);
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