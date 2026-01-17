import { Injectable, Logger } from '@nestjs/common';
import { OptimizedImageResult } from '../types/image-optimization.types';
import { CompressedImageConfigService } from './compressed-image-config.service';
// import { CompressedImageStorageMonitoringService } from './compressed-image-storage-monitoring.service';
import * as fs from 'fs';
import * as path from 'path';
import { isAbsolute } from 'path';
import * as crypto from 'crypto';

/**
 * Compressed Image Storage Service
 *
 * Manages directory-based storage of optimized images for reuse in future PDF generations.
 * Provides simple file-based storage and retrieval functionality with organized directory structure.
 * Now integrated with comprehensive configuration management and storage monitoring.
 */
@Injectable()
export class CompressedImageService {
  private readonly logger = new Logger(CompressedImageService.name);

  constructor(
    private readonly configService: CompressedImageConfigService,
  ) {
    this.ensureBaseDirectoryExists();
  }

  /**
   * Save optimized image to compressed directory
   * @param originalPath - Original image path
   * @param result - Optimization result to store
   * @returns Promise<string> - Path to stored compressed image
   */
  async saveCompressedImage(originalPath: string, result: OptimizedImageResult): Promise<string> {
    // Enhanced error handling: Check if storage is available before attempting
    if (!this.configService.isEnabled()) {
      if (this.configService.isGracefulDegradationEnabled()) {
        this.logger.log(`Compressed image storage is disabled, gracefully continuing without storage for: ${originalPath}`);
        return ''; // Return empty path to indicate storage is disabled but continue
      }
      throw new Error('Compressed image storage is disabled');
    }

    if (!result.optimizedBuffer) {
      if (this.configService.isGracefulDegradationEnabled()) {
        this.logger.warn(`No optimized buffer to save for ${originalPath}, gracefully continuing`);
        return '';
      }
      throw new Error('No optimized buffer to save');
    }

    // Enhanced error handling: Check directory availability before proceeding
    const baseDir = this.getFullPath(this.configService.getBaseDirectory());
    if (!await this.isDirectoryAvailable(baseDir)) {
      if (this.configService.isGracefulDegradationEnabled()) {
        this.logger.warn(`Compressed directory unavailable: ${baseDir}, gracefully continuing without storage for: ${originalPath}`);
        return '';
      }
      throw new Error(`Compressed directory unavailable: ${baseDir}`);
    }

    // logic with enhanced error handling
    this.logger.log(`Saving compressed image for: ${originalPath}`);

    const compressedPath = this.generateCompressedPath(originalPath);
    const fullCompressedPath = this.getFullPath(compressedPath);

    // Enhanced error handling: Ensure directory exists with proper error handling
    const compressedDir = path.dirname(fullCompressedPath);
    await this.ensureDirectoryExistsWithRecovery(compressedDir);

    // Enhanced error handling: Write file with atomic operation
    await this.writeFileAtomically(fullCompressedPath, result.optimizedBuffer);

    // Save metadata alongside the image if enabled
    if (this.configService.isMetadataEnabled()) {
      try {
        await this.saveMetadataWithFallback(fullCompressedPath, originalPath, compressedPath, result);
      } catch (metadataError) {
        // Metadata save failure should not fail the entire operation
        if (this.configService.isErrorLoggingEnabled()) {
          this.logger.warn(`Failed to save metadata for ${originalPath}: ${metadataError.message}`);
        }
      }
    }

    this.logger.log(`Compressed image saved: ${compressedPath} (${this.formatFileSize(result.optimizedSize)})`);
    return compressedPath;
  }

  /**
   * Retrieve compressed image if it exists
   * @param originalPath - Original image path to look up
   * @returns Promise<OptimizedImageResult | null> - Compressed image result or null if not found
   */
  async getCompressedImage(originalPath: string): Promise<OptimizedImageResult | null> {
    // Enhanced error handling: Check if storage is available
    if (!this.configService.isEnabled()) {
      this.logger.log(`Compressed image storage is disabled, returning null for: ${originalPath}`);
      return null;
    }

    // Enhanced error handling: Check directory availability
    const baseDir = this.getFullPath(this.configService.getBaseDirectory());
    if (!await this.isDirectoryAvailable(baseDir)) {
      if (this.configService.isErrorLoggingEnabled()) {
        this.logger.warn(`Compressed directory unavailable: ${baseDir}, returning null for: ${originalPath}`);
      }
      return null;
    }

    const compressedPath = this.generateCompressedPath(originalPath);
    const fullCompressedPath = this.getFullPath(compressedPath);

    // Enhanced error handling: Read file with recovery mechanisms
    const optimizedBuffer = await this.readFileWithRecovery(fullCompressedPath);

    // Enhanced error handling: Read metadata with fallback
    let metadata: any = {};
    if (this.configService.isMetadataEnabled()) {
      metadata = await this.readMetadataWithFallback(fullCompressedPath);
    }

    const result: OptimizedImageResult = {
      optimizedBuffer,
      originalSize: metadata.originalSize || 0,
      optimizedSize: optimizedBuffer.length,
      compressionRatio: metadata.compressionRatio || 0,
      dimensions: metadata.dimensions || {
        original: { width: 0, height: 0 },
        optimized: { width: 0, height: 0 },
      },
      format: metadata.format || 'unknown',
      processingTime: 0, // Retrieved from storage, no processing time
      metadata: metadata.metadata || {
        contentType: 'photo',
        qualityUsed: 0,
        formatConverted: false,
        originalFormat: 'unknown',
        technique: 'storage',
      },
    };

    this.logger.log(`Compressed image retrieved: ${compressedPath} (${this.formatFileSize(result.optimizedSize)})`);
    return result;
  }

  /**
   * Generate compressed path based on original image path
   * @param originalPath - Original image path
   * @returns Relative compressed path
   */
  generateCompressedPath(originalPath: string): string {
    try {
      // Validate input path
      if (!originalPath || typeof originalPath !== 'string' || originalPath.trim().length === 0) {
        throw new Error('Invalid original path');
      }

      // Normalize the original path
      const normalizedPath = this.normalizePath(originalPath);

      // Extract directory and filename
      const parsedPath = path.parse(normalizedPath);

      // Generate hash for uniqueness if enabled
      let filename = parsedPath.name;

      // Handle empty or invalid filenames
      if (!filename || filename.trim().length === 0 || filename === '.') {
        filename = 'compressed';
      } else {
        // Clean filename to remove invalid characters
        filename = filename.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
      }

      const fileNamingConfig = this.configService.getFileNamingConfig();
      if (fileNamingConfig.includeHash) {
        const hash = this.generatePathHash(originalPath, fileNamingConfig.hashAlgorithm);
        filename = `${filename}_${hash}`;
      }

      // Preserve extension if enabled and valid
      let extension = '';
      if (fileNamingConfig.preserveExtension && parsedPath.ext) {
        const cleanExt = parsedPath.ext.toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.webp'].includes(cleanExt)) {
          extension = cleanExt;
        } else {
          extension = '.jpg'; // Default for invalid extensions
        }
      } else {
        extension = '.jpg'; // Default extension
      }

      // Build compressed path using configuration service
      const directoryPath = this.configService.getDirectoryPath(originalPath, this.getFileTypeFromExtension(extension));
      let compressedPath = path.join(directoryPath, `${filename}${extension}`);

      // Normalize path to avoid double slashes and ensure consistent separators
      compressedPath = path.normalize(compressedPath).replace(/\\/g, '/').replace(/\/+/g, '/');

      return compressedPath;

    } catch (error) {
      this.logger.error(`Failed to generate compressed path for ${originalPath}: ${error.message}`);
      // Fallback to simple hash-based naming
      const hash = this.generatePathHash(originalPath || 'unknown');
      return path.join(this.configService.getBaseDirectory(), `compressed_${hash}.jpg`).replace(/\\/g, '/');
    }
  }

  /**
   * Check if compressed image exists for given original path
   * @param originalPath - Original image path
   * @returns Promise<boolean> - Whether compressed image exists
   */
  async hasCompressedImage(originalPath: string): Promise<boolean> {
    try {
      if (!this.configService.isEnabled()) {
        return false;
      }

      const compressedPath = this.generateCompressedPath(originalPath);
      const fullCompressedPath = this.getFullPath(compressedPath);

      return await this.fileExists(fullCompressedPath);
    } catch (error) {
      this.logger.warn(`Error checking compressed image existence for ${originalPath}: ${error.message}`);
      return false;
    }
  }

  // Private helper methods

  /**
   * Ensure base directory exists
   */
  private ensureBaseDirectoryExists(): void {
    try {
      const baseDir = this.getFullPath(this.configService.getBaseDirectory());
      if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
        this.logger.log(`Created compressed images directory: ${baseDir}`);
      }
    } catch (error) {
      this.logger.error(`Failed to create base directory: ${error.message}`);
    }
  }

  /**
   * Ensure directory exists
   * @param dirPath - Directory path to create
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Get full filesystem path
   * @param relativePath - Relative path
   * @returns Full filesystem path
   */
  private getFullPath(relativePath: string): string {
    if (path.isAbsolute(relativePath)) {
      return relativePath;
    }

    // If it's an upload-related path, use UPLOAD_DIR
    if (relativePath.startsWith('uploads/') || relativePath.includes('/uploads/')) {
      const uploadDirEnv = process.env.UPLOAD_DIR || 'uploads';
      const baseUploadPath = isAbsolute(uploadDirEnv)
        ? uploadDirEnv
        : path.join(process.cwd(), uploadDirEnv);

      // Remove 'uploads/' prefix if present
      const cleanPath = relativePath.startsWith('uploads/')
        ? relativePath.substring('uploads/'.length)
        : relativePath;

      return path.join(baseUploadPath, cleanPath);
    }

    // For non-upload paths, use process.cwd()
    return path.join(process.cwd(), relativePath);
  }

  /**
   * Get metadata file path for compressed image
   * @param compressedImagePath - Path to compressed image
   * @returns Path to metadata file
   */
  private getMetadataPath(compressedImagePath: string): string {
    const parsedPath = path.parse(compressedImagePath);
    return path.join(parsedPath.dir, `${parsedPath.name}.meta.json`);
  }

  /**
   * Normalize path for consistent handling
   * @param inputPath - Input path to normalize
   * @returns Normalized path
   */
  private normalizePath(inputPath: string): string {
    // Remove leading slash and normalize separators
    let normalized = inputPath.replace(/^\/+/, '').replace(/\\/g, '/');

    // Remove uploads prefix if present
    if (normalized.startsWith('uploads/')) {
      normalized = normalized.substring('uploads/'.length);
    }

    return normalized;
  }

  /**
   * Generate hash for path uniqueness
   * @param inputPath - Input path to hash
   * @param algorithm - Hash algorithm to use
   * @returns Hash string
   */
  private generatePathHash(inputPath: string, algorithm: 'md5' | 'sha1' | 'sha256' = 'md5'): string {
    return crypto.createHash(algorithm).update(inputPath).digest('hex').substring(0, 8);
  }

  /**
   * Get file type from extension
   * @param extension - File extension
   * @returns File type
   */
  private getFileTypeFromExtension(extension: string): 'jpeg' | 'png' | 'webp' | 'other' {
    const ext = extension.toLowerCase();
    if (['.jpg', '.jpeg'].includes(ext)) return 'jpeg';
    if (ext === '.png') return 'png';
    if (ext === '.webp') return 'webp';
    return 'other';
  }

  /**
   * Check if file exists
   * @param filePath - File path to check
   * @returns Promise<boolean>
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if directory exists
   * @param dirPath - Directory path to check
   * @returns Promise<boolean>
   */
  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.promises.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Format file size for logging
   * @param bytes - Size in bytes
   * @returns Formatted size string
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  // Enhanced error handling and recovery methods

  /**
   * Check if directory is available and accessible
   * @param dirPath - Directory path to check
   * @returns Promise<boolean>
   */
  private async isDirectoryAvailable(dirPath: string): Promise<boolean> {
    try {
      // Check if directory exists
      if (!await this.directoryExists(dirPath)) {
        // Try to create it if it doesn't exist
        try {
          await fs.promises.mkdir(dirPath, { recursive: true });
          this.logger.log(`Created missing compressed directory: ${dirPath}`);
          return true;
        } catch (createError) {
          this.logger.warn(`Failed to create compressed directory ${dirPath}: ${createError.message}`);
          return false;
        }
      }

      // Check if directory is writable
      try {
        await fs.promises.access(dirPath, fs.constants.W_OK | fs.constants.R_OK);
        return true;
      } catch (accessError) {
        this.logger.warn(`Compressed directory ${dirPath} is not accessible: ${accessError.message}`);
        return false;
      }
    } catch (error) {
      this.logger.warn(`Error checking directory availability ${dirPath}: ${error.message}`);
      return false;
    }
  }

  /**
   * Ensure directory exists with recovery mechanisms
   * @param dirPath - Directory path to create
   */
  private async ensureDirectoryExistsWithRecovery(dirPath: string): Promise<void> {
    await fs.promises.mkdir(dirPath, { recursive: true });

    // Verify the directory was created and is accessible
    await fs.promises.access(dirPath, fs.constants.W_OK | fs.constants.R_OK);
    return;
  }

  /**
   * Write file atomically with recovery mechanisms
   * @param filePath - File path to write
   * @param data - Data to write
   */
  private async writeFileAtomically(filePath: string, data: Buffer): Promise<void> {
    const tempPath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Write to temporary file first
      await fs.promises.writeFile(tempPath, data);

      // Verify the temporary file was written correctly
      const writtenData = await fs.promises.readFile(tempPath);
      if (writtenData.length !== data.length) {
        throw new Error(`File write verification failed: expected ${data.length} bytes, got ${writtenData.length} bytes`);
      }

      // Atomically move temporary file to final location
      await fs.promises.rename(tempPath, filePath);

    } catch (error) {
      // Clean up temporary file if it exists
      try {
        if (await this.fileExists(tempPath)) {
          await fs.promises.unlink(tempPath);
        }
      } catch (cleanupError) {
        this.logger.warn(`Failed to cleanup temporary file ${tempPath}: ${cleanupError.message}`);
      }

      throw error;
    }
  }

  /**
   * Read file with recovery mechanisms
   * @param filePath - File path to read
   * @returns Promise<Buffer>
   */
  private async readFileWithRecovery(filePath: string): Promise<Buffer> {
      try {
        const data = await fs.promises.readFile(filePath);

        // Verify the file is not empty (unless it's supposed to be)
        if (data.length === 0) {
          throw new Error('File is empty or corrupted');
        }

        return data;
      } catch (error) {
        throw error;
      }
  }

  /**
   * Check if file exists with recovery mechanisms
   * @param filePath - File path to check
   * @returns Promise<boolean>
   */
  private async fileExistsWithRecovery(filePath: string): Promise<boolean> {
    const retryConfig = this.configService.getRetryConfig();

    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Save metadata with fallback mechanisms
   * @param compressedImagePath - Path to compressed image
   * @param originalPath - Original image path
   * @param compressedPath - Compressed image path
   * @param result - Optimization result
   */
  private async saveMetadataWithFallback(
    compressedImagePath: string,
    originalPath: string,
    compressedPath: string,
    result: OptimizedImageResult
  ): Promise<void> {
    try {
      const metadataPath = this.getMetadataPath(compressedImagePath);
      const metadata = {
        originalPath,
        compressedPath,
        fileSize: result.optimizedSize,
        createdAt: new Date(),
        compressionRatio: result.compressionRatio,
        originalSize: result.originalSize,
        optimizedSize: result.optimizedSize,
        dimensions: result.dimensions,
        format: result.format,
        processingTime: result.processingTime,
        metadata: result.metadata,
      };

      const metadataContent = this.configService.getMetadataFormat() === 'json'
        ? JSON.stringify(metadata, null, 2)
        : JSON.stringify(metadata);

      await this.writeFileAtomically(metadataPath, Buffer.from(metadataContent, 'utf-8'));

    } catch (error) {
      // Metadata save failure should not fail the entire operation
      if (this.configService.isErrorLoggingEnabled()) {
        this.logger.warn(`Failed to save metadata for ${originalPath}: ${error.message}`);
      }

      // If graceful degradation is enabled, continue without metadata
      if (!this.configService.isGracefulDegradationEnabled()) {
        throw error;
      }
    }
  }

  /**
   * Read metadata with fallback mechanisms
   * @param compressedImagePath - Path to compressed image
   * @returns Promise<any> - Metadata object or empty object
   */
  private async readMetadataWithFallback(compressedImagePath: string): Promise<any> {
    try {
      const metadataPath = this.getMetadataPath(compressedImagePath);

      if (!await this.fileExistsWithRecovery(metadataPath)) {
        return {};
      }

      const metadataContent = await this.readFileWithRecovery(metadataPath);
      return JSON.parse(metadataContent.toString('utf-8'));

    } catch (error) {
      if (this.configService.isErrorLoggingEnabled()) {
        this.logger.warn(`Failed to read metadata for ${compressedImagePath}: ${error.message}`);
      }

      // Return empty metadata object on failure
      return {};
    }
  }

  /**
   * Check if an error is recoverable (temporary) or permanent
   * @param error - Error to check
   * @returns boolean - True if error might be recoverable with retry
   */
  private isRecoverableError(error: any): boolean {
    if (!error || !error.code) {
      return false;
    }

    // File system errors that might be temporary
    const recoverableErrorCodes = [
      'EBUSY',     // Resource busy
      'EAGAIN',    // Resource temporarily unavailable
      'ENOTREADY', // Device not ready
      'ETIMEDOUT', // Operation timed out
      'ECONNRESET', // Connection reset
      'EPIPE',     // Broken pipe
      'EMFILE',    // Too many open files
      'ENFILE',    // File table overflow
      'ENOSPC',    // No space left on device (might be temporary)
    ];

    return recoverableErrorCodes.includes(error.code);
  }

  /**
   * Delay execution for specified milliseconds
   * @param ms - Milliseconds to delay
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}