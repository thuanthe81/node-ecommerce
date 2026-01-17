import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { isAbsolute } from 'path';
import * as https from 'https';
import * as http from 'http';
import { CONSTANTS } from '@alacraft/shared';

/**
 * PDF Image Converter Service
 *
 * Converts images to base64 data URLs for embedding in PDFs.
 * Handles both local file paths and remote URLs.
 */
@Injectable()
export class PDFImageConverterService {
  private readonly logger = new Logger(PDFImageConverterService.name);
  private readonly imageCache = new Map<string, string>();
  private readonly maxCacheSize = 100;

  /**
   * Get the base upload directory path from environment variable
   * @returns The absolute path to the upload directory
   */
  private getUploadPath(): string {
    const uploadDirEnv = process.env.UPLOAD_DIR || 'uploads';
    return isAbsolute(uploadDirEnv)
      ? uploadDirEnv
      : path.join(process.cwd(), uploadDirEnv);
  }

  /**
   * Convert image to base64 data URL
   * @param imageUrl - Image URL or file path
   * @returns Promise<string> - Base64 data URL or empty string if conversion fails
   */
  async convertImageToBase64(imageUrl: string): Promise<string> {
    if (!imageUrl || typeof imageUrl !== 'string') {
      return '';
    }

    // Check cache first
    if (this.imageCache.has(imageUrl)) {
      return this.imageCache.get(imageUrl)!;
    }

    try {
      let imageBuffer: Buffer;
      let mimeType: string;

      if (this.isUrl(imageUrl)) {
        // Handle remote URLs
        const result = await this.fetchImageFromUrl(imageUrl);
        imageBuffer = result.buffer;
        mimeType = result.mimeType;
      } else {
        // Handle local file paths
        const result = await this.readLocalImage(imageUrl);
        imageBuffer = result.buffer;
        mimeType = result.mimeType;
      }

      // Convert to base64 data URL
      const base64Data = imageBuffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64Data}`;

      // Cache the result (with size limit)
      this.cacheImage(imageUrl, dataUrl);

      this.logger.debug(`Successfully converted image to base64: ${imageUrl} (${imageBuffer.length} bytes)`);
      return dataUrl;

    } catch (error) {
      this.logger.warn(`Failed to convert image to base64: ${imageUrl} - ${error.message}`);
      return '';
    }
  }

  /**
   * Convert multiple images to base64 data URLs
   * @param imageUrls - Array of image URLs or file paths
   * @returns Promise<Map<string, string>> - Map of original URL to base64 data URL
   */
  async convertMultipleImages(imageUrls: string[]): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    // Process images in parallel with concurrency limit
    const concurrencyLimit = 5;
    const chunks = this.chunkArray(imageUrls, concurrencyLimit);

    for (const chunk of chunks) {
      const promises = chunk.map(async (url) => {
        const base64 = await this.convertImageToBase64(url);
        return { url, base64 };
      });

      const chunkResults = await Promise.all(promises);
      chunkResults.forEach(({ url, base64 }) => {
        if (base64) {
          results.set(url, base64);
        }
      });
    }

    return results;
  }

  /**
   * Check if string is a URL
   * @param str - String to check
   * @returns boolean - True if string is a URL
   */
  private isUrl(str: string): boolean {
    return str.startsWith('http://') || str.startsWith('https://');
  }

  /**
   * Fetch image from remote URL
   * @param url - Image URL
   * @returns Promise<{buffer: Buffer, mimeType: string}> - Image buffer and MIME type
   */
  private async fetchImageFromUrl(url: string): Promise<{ buffer: Buffer; mimeType: string }> {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https://') ? https : http;

      const request = client.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }

        const chunks: Buffer[] = [];

        response.on('data', (chunk) => {
          chunks.push(chunk);
        });

        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const mimeType = this.getMimeTypeFromResponse(response, url);
          resolve({ buffer, mimeType });
        });

        response.on('error', (error) => {
          reject(error);
        });
      });

      request.on('error', (error) => {
        reject(error);
      });

      // Set timeout
      request.setTimeout(10000, () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  /**
   * Read local image file
   * @param filePath - Local file path
   * @returns Promise<{buffer: Buffer, mimeType: string}> - Image buffer and MIME type
   */
  private async readLocalImage(filePath: string): Promise<{ buffer: Buffer; mimeType: string }> {
    let fullPath = filePath;

    // Handle web-style paths that start with /uploads, /public, etc.
    if (filePath.startsWith('/uploads/') || filePath.startsWith('/public/') || filePath.startsWith('/assets/')) {
      // Remove leading slash and resolve based on UPLOAD_DIR for uploads, or process.cwd() for others
      if (filePath.startsWith('/uploads/')) {
        const relativePath = filePath.substring('/uploads/'.length);
        fullPath = path.join(this.getUploadPath(), relativePath);
      } else {
        fullPath = path.join(process.cwd(), filePath.substring(1));
      }
      this.logger.debug(`Converted web-style path: ${filePath} -> ${fullPath}`);
    } else if (!path.isAbsolute(filePath)) {
      // Try different base paths for relative paths
      const basePaths = [
        process.cwd(),
        this.getUploadPath(),
        path.join(process.cwd(), 'public'),
        path.join(process.cwd(), 'assets'),
      ];

      let found = false;
      for (const basePath of basePaths) {
        const testPath = path.join(basePath, filePath);
        if (fs.existsSync(testPath)) {
          fullPath = testPath;
          found = true;
          break;
        }
      }

      // If not found in base paths, use original path
      if (!found) {
        fullPath = filePath;
      }
    }

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Image file not found: ${fullPath}`);
    }

    const buffer = await fs.promises.readFile(fullPath);
    const mimeType = this.getMimeTypeFromExtension(fullPath);

    return { buffer, mimeType };
  }

  /**
   * Get MIME type from HTTP response
   * @param response - HTTP response
   * @param url - Original URL (fallback)
   * @returns string - MIME type
   */
  private getMimeTypeFromResponse(response: any, url: string): string {
    const contentType = response.headers['content-type'];
    if (contentType && contentType.startsWith('image/')) {
      return contentType.split(';')[0]; // Remove charset if present
    }

    // Fallback to extension-based detection
    return this.getMimeTypeFromExtension(url);
  }

  /**
   * Get MIME type from file extension
   * @param filePath - File path or URL
   * @returns string - MIME type
   */
  private getMimeTypeFromExtension(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();

    const mimeTypes: Record<string, string> = {
      '.jpg': CONSTANTS.SYSTEM.MIME_TYPES.JPEG,
      '.jpeg': CONSTANTS.SYSTEM.MIME_TYPES.JPEG,
      '.png': CONSTANTS.SYSTEM.MIME_TYPES.PNG,
      '.gif': 'image/gif',
      '.webp': CONSTANTS.SYSTEM.MIME_TYPES.WEBP,
      '.svg': 'image/svg+xml',
      '.bmp': 'image/bmp',
      '.ico': 'image/x-icon',
    };

    return mimeTypes[ext] || CONSTANTS.SYSTEM.MIME_TYPES.JPEG; // Default to JPEG
  }

  /**
   * Cache image conversion result
   * @param url - Original image URL
   * @param dataUrl - Base64 data URL
   */
  private cacheImage(url: string, dataUrl: string): void {
    // Implement LRU cache behavior
    if (this.imageCache.size >= this.maxCacheSize) {
      const firstKey = this.imageCache.keys().next().value;
      this.imageCache.delete(firstKey);
    }

    this.imageCache.set(url, dataUrl);
  }

  /**
   * Split array into chunks
   * @param array - Array to split
   * @param size - Chunk size
   * @returns Array of chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Clear image cache
   */
  clearCache(): void {
    this.imageCache.clear();
    this.logger.debug('Image cache cleared');
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  getCacheStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.imageCache.size,
      maxSize: this.maxCacheSize,
    };
  }

  /**
   * Preload images for better performance
   * @param imageUrls - Array of image URLs to preload
   */
  async preloadImages(imageUrls: string[]): Promise<void> {
    this.logger.debug(`Preloading ${imageUrls.length} images`);
    await this.convertMultipleImages(imageUrls);
  }
}