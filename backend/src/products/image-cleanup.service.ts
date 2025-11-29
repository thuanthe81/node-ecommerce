import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface CleanupResult {
  orphanedDirectories: string[];
  totalSize: number;
  recommendations: string[];
}

@Injectable()
export class ImageCleanupService {
  private readonly logger = new Logger(ImageCleanupService.name);
  private uploadDir: string;

  constructor(private prisma: PrismaService) {
    const uploadDirEnv = process.env.UPLOAD_DIR || 'uploads';
    const baseUploadPath = path.isAbsolute(uploadDirEnv)
      ? uploadDirEnv
      : path.join(process.cwd(), uploadDirEnv);

    this.uploadDir = path.join(baseUploadPath, 'products');
  }

  /**
   * Find all orphaned product directories
   * Scans the uploads/products directory for subdirectories and checks if they correspond to existing products
   * @returns CleanupResult with orphaned directories, total size, and recommendations
   */
  async findOrphanedDirectories(): Promise<CleanupResult> {
    this.logger.log('Starting orphaned directory discovery');

    const result: CleanupResult = {
      orphanedDirectories: [],
      totalSize: 0,
      recommendations: [],
    };

    try {
      // Check if upload directory exists
      try {
        await fs.access(this.uploadDir);
      } catch (error) {
        this.logger.warn(`Upload directory does not exist: ${this.uploadDir}`);
        result.recommendations.push('Upload directory does not exist - no cleanup needed');
        return result;
      }

      // Scan uploads/products directory for subdirectories
      const entries = await fs.readdir(this.uploadDir, { withFileTypes: true });

      // Filter to only directories (excluding 'thumbnails' which is legacy)
      const directories = entries.filter(
        (entry) => entry.isDirectory() && entry.name !== 'thumbnails',
      );

      this.logger.log(`Found ${directories.length} product directories to check`);

      // Extract product IDs from directory names and check if they exist in database
      for (const dir of directories) {
        const productId = dir.name;

        // Validate that directory name looks like a UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(productId)) {
          this.logger.warn(`Directory name is not a valid UUID: ${productId}`);
          continue;
        }

        // Check if product exists in database
        const product = await this.prisma.product.findUnique({
          where: { id: productId },
        });

        if (!product) {
          // Product doesn't exist - this is an orphaned directory
          this.logger.debug(`Found orphaned directory: ${productId}`);
          result.orphanedDirectories.push(productId);

          // Calculate directory size
          const dirPath = path.join(this.uploadDir, productId);
          const dirSize = await this.calculateDirectorySize(dirPath);
          result.totalSize += dirSize;
        }
      }

      // Generate recommendations
      if (result.orphanedDirectories.length === 0) {
        result.recommendations.push('No orphaned directories found - system is clean');
      } else {
        result.recommendations.push(
          `Found ${result.orphanedDirectories.length} orphaned directories consuming ${this.formatBytes(result.totalSize)}`,
        );
        result.recommendations.push(
          'Run cleanup with --confirm flag to remove these directories',
        );
        result.recommendations.push(
          'Ensure you have a backup before running cleanup',
        );
      }

      this.logger.log(
        `Discovery complete: ${result.orphanedDirectories.length} orphaned directories found`,
      );

      return result;
    } catch (error) {
      this.logger.error('Error during directory discovery:', error);
      throw error;
    }
  }

  /**
   * Calculate the total size of a directory recursively
   * @param dirPath - Path to the directory
   * @returns Total size in bytes
   */
  private async calculateDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          // Recursively calculate subdirectory size
          totalSize += await this.calculateDirectorySize(fullPath);
        } else if (entry.isFile()) {
          // Get file size
          const stats = await fs.stat(fullPath);
          totalSize += stats.size;
        }
      }
    } catch (error) {
      this.logger.warn(`Error calculating size for ${dirPath}:`, error);
    }

    return totalSize;
  }

  /**
   * Format bytes to human-readable string
   * @param bytes - Number of bytes
   * @returns Formatted string (e.g., "1.5 MB")
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Remove a specific orphaned directory
   * @param productId - The product ID (directory name) to remove
   */
  async removeOrphanedDirectory(productId: string): Promise<void> {
    this.logger.log(`Removing orphaned directory: ${productId}`);

    try {
      // Validate that directory name looks like a UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(productId)) {
        throw new Error(`Invalid product ID format: ${productId}`);
      }

      // Verify product doesn't exist in database (safety check)
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
      });

      if (product) {
        throw new Error(
          `Cannot remove directory for existing product: ${productId}`,
        );
      }

      // Remove the directory and all contents
      const dirPath = path.join(this.uploadDir, productId);

      try {
        await fs.access(dirPath);
      } catch (error) {
        this.logger.warn(`Directory does not exist: ${dirPath}`);
        return;
      }

      try {
        await fs.rm(dirPath, { recursive: true, force: true });
        this.logger.log(`Successfully removed directory: ${productId}`);
      } catch (error) {
        if (error.code === 'EACCES' || error.code === 'EPERM') {
          throw new Error(
            `Permission denied when removing directory: ${productId}. Check file permissions.`,
          );
        }
        throw error;
      }
    } catch (error) {
      this.logger.error(`Error removing orphaned directory ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Clean up all orphaned directories
   * @param confirm - Safety confirmation flag (must be true to proceed)
   * @returns CleanupResult with details of cleaned directories
   */
  async cleanupAllOrphaned(confirm: boolean): Promise<CleanupResult> {
    if (!confirm) {
      throw new Error(
        'Cleanup requires explicit confirmation. Set confirm=true to proceed.',
      );
    }

    this.logger.log('Starting cleanup of all orphaned directories');

    // First, find all orphaned directories
    const discoveryResult = await this.findOrphanedDirectories();

    if (discoveryResult.orphanedDirectories.length === 0) {
      this.logger.log('No orphaned directories to clean up');
      return discoveryResult;
    }

    const result: CleanupResult = {
      orphanedDirectories: [],
      totalSize: 0,
      recommendations: [],
    };

    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    // Remove each orphaned directory
    for (const productId of discoveryResult.orphanedDirectories) {
      try {
        await this.removeOrphanedDirectory(productId);
        successCount++;
      } catch (error) {
        failureCount++;
        errors.push(`${productId}: ${error.message}`);
        this.logger.error(`Failed to remove directory ${productId}:`, error);
        // Continue with other directories
      }
    }

    // Generate result
    result.recommendations.push(
      `Cleanup complete: ${successCount} directories removed, ${failureCount} failed`,
    );

    if (failureCount > 0) {
      result.recommendations.push('Errors encountered:');
      result.recommendations.push(...errors);
    }

    if (successCount > 0) {
      result.recommendations.push(
        `Freed approximately ${this.formatBytes(discoveryResult.totalSize)}`,
      );
    }

    this.logger.log(
      `Cleanup complete: ${successCount} removed, ${failureCount} failed`,
    );

    return result;
  }
}
