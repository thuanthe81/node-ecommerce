import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { isAbsolute } from 'path';
import { StorageResult, CleanupResult, StorageCapacityResult } from '../types/pdf.types';
import { StorageErrorHandlerService } from './storage-error-handler.service';

/**
 * Document Storage Service
 *
 * Manages temporary PDF file storage and cleanup for order attachments.
 * Provides secure file storage with unique filename generation, capacity monitoring,
 * and automatic cleanup scheduling.
 */
@Injectable()
export class DocumentStorageService {
  private readonly logger = new Logger(DocumentStorageService.name);
  private readonly uploadDir: string;
  private readonly maxStorageSize = 1024 * 1024 * 1024; // 1GB default limit
  private readonly cleanupSchedule = new Map<string, NodeJS.Timeout>();

  constructor(private readonly errorHandler: StorageErrorHandlerService) {
    // Initialize upload directory from environment variable
    const uploadDirEnv = process.env.UPLOAD_DIR || 'uploads';
    const baseUploadPath = isAbsolute(uploadDirEnv)
      ? uploadDirEnv
      : path.join(process.cwd(), uploadDirEnv);
    this.uploadDir = path.join(baseUploadPath, 'pdfs');

    this.ensureUploadDirectory();
  }

  /**
   * Store PDF buffer to temporary storage with unique filename
   * Requirements: 5.1 - Store file temporarily with unique filename
   */
  async storePDF(pdfBuffer: Buffer, orderNumber: string): Promise<StorageResult> {
    // Generate unique filename with timestamp and random suffix
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileName = `order-${orderNumber}-${timestamp}-${randomSuffix}.pdf`;
    const filePath = path.join(this.uploadDir, fileName);

    try {
      // Validate storage capacity before storing
      const capacityCheck = await this.validateStorageCapacity();
      if (capacityCheck.isNearCapacity) {
        this.logger.warn('Storage capacity is near limit, triggering cleanup');
        await this.cleanupExpiredPDFs();
      }

      // Ensure directory exists
      await this.ensureUploadDirectory();

      // Write PDF buffer to file with proper permissions
      await fs.promises.writeFile(filePath, pdfBuffer, { mode: 0o644 });

      // Get file size for result
      const stats = await fs.promises.stat(filePath);
      const fileSize = stats.size;

      // Log successful operation
      this.errorHandler.logStorageOperation('storePDF', {
        orderNumber,
        fileName,
        fileSize,
      });

      return {
        success: true,
        filePath,
        fileName,
        fileSize,
      };
    } catch (error) {
      // Handle storage capacity errors
      if (error.code === 'ENOSPC') {
        this.errorHandler.handleCapacityError(0, this.maxStorageSize);
      }

      // Handle permission errors
      if (error.code === 'EACCES') {
        this.errorHandler.handlePermissionError(filePath, 'store PDF', error);
      }

      this.logger.error(`Failed to store PDF for order ${orderNumber}:`, error);
      return {
        success: false,
        error: `Failed to store PDF: ${error.message}`,
      };
    }
  }

  /**
   * Retrieve PDF buffer from storage
   * Requirements: 5.5 - Ensure proper file permissions and security measures
   */
  async retrievePDF(filePath: string): Promise<Buffer> {
    try {
      // Validate file path is within upload directory (security measure)
      const resolvedPath = path.resolve(filePath);
      const resolvedUploadDir = path.resolve(this.uploadDir);

      if (!resolvedPath.startsWith(resolvedUploadDir)) {
        throw new Error('Invalid file path - outside upload directory');
      }

      // Check if file exists
      if (!await this.fileExists(filePath)) {
        throw new Error('PDF file not found');
      }

      // Read and return file buffer
      const buffer = await fs.promises.readFile(filePath);

      // Log successful operation
      this.errorHandler.logStorageOperation('retrievePDF', {
        filePath: path.basename(filePath),
        size: buffer.length,
      });

      return buffer;
    } catch (error) {
      // Handle specific errors
      if (error.code === 'ENOENT') {
        this.errorHandler.handleStorageError('retrieve PDF', error, { filePath });
      }
      if (error.code === 'EACCES') {
        this.errorHandler.handlePermissionError(filePath, 'retrieve PDF', error);
      }

      this.logger.error(`Failed to retrieve PDF from ${filePath}:`, error);
      throw new InternalServerErrorException(`Failed to retrieve PDF: ${error.message}`);
    }
  }

  /**
   * Schedule PDF cleanup after retention period
   * Requirements: 5.2 - Schedule PDF file for deletion after retention period
   */
  async schedulePDFCleanup(filePath: string, retentionHours: number): Promise<void> {
    try {
      const fileName = path.basename(filePath);
      const retentionMs = retentionHours * 60 * 60 * 1000;

      // Clear existing timeout if any
      if (this.cleanupSchedule.has(filePath)) {
        clearTimeout(this.cleanupSchedule.get(filePath));
      }

      // Schedule cleanup
      const timeout = setTimeout(async () => {
        try {
          if (await this.fileExists(filePath)) {
            await fs.promises.unlink(filePath);
            this.logger.log(`Scheduled cleanup completed for: ${fileName}`);
          }
        } catch (error) {
          this.logger.error(`Scheduled cleanup failed for ${fileName}:`, error);
        } finally {
          this.cleanupSchedule.delete(filePath);
        }
      }, retentionMs);

      this.cleanupSchedule.set(filePath, timeout);
      this.logger.log(`PDF cleanup scheduled for ${fileName} in ${retentionHours} hours`);
    } catch (error) {
      this.logger.error(`Failed to schedule cleanup for ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Clean up expired PDF files
   * Requirements: 5.3 - Remove PDF files older than retention period
   */
  async cleanupExpiredPDFs(): Promise<CleanupResult> {
    const result: CleanupResult = {
      filesRemoved: 0,
      spaceFreed: 0,
      errors: [],
    };

    try {
      const files = await fs.promises.readdir(this.uploadDir);
      const now = Date.now();
      const defaultRetentionMs = 24 * 60 * 60 * 1000; // 24 hours default

      for (const file of files) {
        if (!file.endsWith('.pdf')) continue;

        const filePath = path.join(this.uploadDir, file);

        try {
          const stats = await fs.promises.stat(filePath);
          const fileAge = now - stats.mtime.getTime();

          // Remove files older than retention period
          if (fileAge > defaultRetentionMs) {
            const fileSize = stats.size;
            await fs.promises.unlink(filePath);

            result.filesRemoved++;
            result.spaceFreed += fileSize;

            this.logger.log(`Cleaned up expired PDF: ${file} (${fileSize} bytes)`);
          }
        } catch (fileError) {
          const errorMsg = `Failed to process file ${file}: ${fileError.message}`;
          result.errors.push(errorMsg);
          this.logger.error(errorMsg);
        }
      }

      this.logger.log(`Cleanup completed: ${result.filesRemoved} files removed, ${result.spaceFreed} bytes freed`);
    } catch (error) {
      const errorMsg = `Cleanup operation failed: ${error.message}`;
      result.errors.push(errorMsg);
      this.logger.error(errorMsg);
    }

    return result;
  }

  /**
   * Validate storage capacity and usage
   * Requirements: 5.4 - Implement appropriate error handling for storage capacity limits
   */
  async validateStorageCapacity(): Promise<StorageCapacityResult> {
    try {
      let totalSize = 0;
      const files = await fs.promises.readdir(this.uploadDir);

      // Calculate total size of PDF files
      for (const file of files) {
        if (file.endsWith('.pdf')) {
          const filePath = path.join(this.uploadDir, file);
          try {
            const stats = await fs.promises.stat(filePath);
            totalSize += stats.size;
          } catch (error) {
            this.logger.warn(`Could not stat file ${file}: ${error.message}`);
          }
        }
      }

      const utilizationPercentage = (totalSize / this.maxStorageSize) * 100;
      const isNearCapacity = utilizationPercentage > 80; // 80% threshold

      return {
        totalSpace: this.maxStorageSize,
        usedSpace: totalSize,
        availableSpace: this.maxStorageSize - totalSize,
        utilizationPercentage,
        isNearCapacity,
      };
    } catch (error) {
      this.logger.error('Failed to validate storage capacity:', error);
      throw new InternalServerErrorException('Storage capacity validation failed');
    }
  }

  /**
   * Handle filename conflicts with unique suffixes
   * Requirements: 5.6 - Handle filename conflicts appropriately
   */
  async resolveFilenameConflict(originalPath: string): Promise<string> {
    let counter = 1;
    let resolvedPath = originalPath;

    while (await this.fileExists(resolvedPath)) {
      const dir = path.dirname(originalPath);
      const ext = path.extname(originalPath);
      const name = path.basename(originalPath, ext);

      resolvedPath = path.join(dir, `${name}-${counter}${ext}`);
      counter++;
    }

    return resolvedPath;
  }

  /**
   * Ensure upload directory exists with proper permissions
   * Requirements: 5.5 - Ensure proper file permissions and security measures
   */
  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.promises.mkdir(this.uploadDir, {
        recursive: true,
        mode: 0o755 // Read/write for owner, read for group and others
      });
    } catch (error) {
      this.logger.error('Failed to create upload directory:', error);
      throw new InternalServerErrorException('Failed to initialize storage directory');
    }
  }

  /**
   * Check if file exists
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
   * Cleanup scheduled timeouts on service destruction
   */
  onModuleDestroy() {
    for (const timeout of this.cleanupSchedule.values()) {
      clearTimeout(timeout);
    }
    this.cleanupSchedule.clear();
  }
}