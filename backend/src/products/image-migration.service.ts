import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsImageService } from './products-image.service';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface MigrationResult {
  totalImages: number;
  migratedImages: number;
  failedImages: number;
  skippedImages: number;
  errors: Array<{
    imageId: string;
    filename: string;
    error: string;
  }>;
}

export interface MigrationOptions {
  dryRun?: boolean;
  batchSize?: number;
  backupDatabase?: boolean;
}

@Injectable()
export class ImageMigrationService {
  private readonly logger = new Logger(ImageMigrationService.name);
  private uploadDir: string;

  constructor(
    private prisma: PrismaService,
    private productsImageService: ProductsImageService,
  ) {
    const uploadDirEnv = process.env.UPLOAD_DIR || 'uploads';
    const baseUploadPath = path.isAbsolute(uploadDirEnv)
      ? uploadDirEnv
      : path.join(process.cwd(), uploadDirEnv);

    this.uploadDir = path.join(baseUploadPath, 'products');
  }

  /**
   * Extract product ID from legacy filename format
   * Handles formats like:
   * - [product-id]-[timestamp]-[random].jpg
   * - [product-id]-[timestamp].jpg
   * @param filename - The filename to extract product ID from
   * @returns The product ID or null if invalid format
   */
  private extractProductIdFromFilename(filename: string): string | null {
    try {
      // Remove extension
      const nameWithoutExt = filename.replace(/\.[^.]+$/, '');

      // UUID format: 8-4-4-4-12 characters (with hyphens)
      // Match UUID at the start of the filename
      const uuidRegex = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
      const match = nameWithoutExt.match(uuidRegex);

      if (match && match[1]) {
        return match[1];
      }

      return null;
    } catch (error) {
      this.logger.warn(`Error extracting product ID from filename ${filename}:`, error);
      return null;
    }
  }

  /**
   * Move image files from old flat structure to new hierarchical structure
   * @param productId - The product ID
   * @param oldPath - The old file path
   * @param newPath - The new file path
   */
  private async moveImageFiles(
    productId: string,
    oldPath: string,
    newPath: string,
  ): Promise<void> {
    try {
      // Create target directories if they don't exist
      const newDir = path.dirname(newPath);
      await fs.mkdir(newDir, { recursive: true });

      // Determine if this is a thumbnail or original image
      const isThumbnail = oldPath.includes('/thumbnails/');
      const filename = path.basename(oldPath);

      // Define paths for both original and thumbnail
      let originalOldPath: string;
      let originalNewPath: string;
      let thumbnailOldPath: string;
      let thumbnailNewPath: string;

      if (isThumbnail) {
        // If processing thumbnail, derive original paths
        thumbnailOldPath = oldPath;
        thumbnailNewPath = newPath;
        originalOldPath = path.join(this.uploadDir, filename);
        originalNewPath = path.join(this.uploadDir, productId, filename);
      } else {
        // If processing original, derive thumbnail paths
        originalOldPath = oldPath;
        originalNewPath = newPath;
        thumbnailOldPath = path.join(this.uploadDir, 'thumbnails', filename);
        thumbnailNewPath = path.join(this.uploadDir, productId, 'thumbnails', filename);
      }

      // Ensure thumbnail directory exists
      const thumbnailDir = path.dirname(thumbnailNewPath);
      await fs.mkdir(thumbnailDir, { recursive: true });

      // Copy original file
      try {
        await fs.copyFile(originalOldPath, originalNewPath);
        // Verify copy succeeded by checking file exists
        await fs.access(originalNewPath);
      } catch (error) {
        throw new Error(`Failed to copy original file: ${error.message}`);
      }

      // Copy thumbnail file
      try {
        await fs.copyFile(thumbnailOldPath, thumbnailNewPath);
        // Verify copy succeeded by checking file exists
        await fs.access(thumbnailNewPath);
      } catch (error) {
        // If thumbnail doesn't exist, log warning but don't fail
        this.logger.warn(`Thumbnail not found for ${filename}, skipping thumbnail migration`);
      }

      // Only delete originals after successful copy verification
      try {
        await fs.unlink(originalOldPath);
      } catch (error) {
        this.logger.warn(`Failed to delete original file ${originalOldPath}:`, error);
      }

      try {
        await fs.unlink(thumbnailOldPath);
      } catch (error) {
        // Thumbnail might not exist, which is okay
        this.logger.debug(`Failed to delete thumbnail file ${thumbnailOldPath}:`, error);
      }
    } catch (error) {
      throw new Error(`Failed to move image files: ${error.message}`);
    }
  }

  /**
   * Update database URLs for migrated images
   * @param imageId - The image ID
   * @param newUrl - The new URL path
   */
  private async updateDatabaseUrls(
    imageId: string,
    newUrl: string,
  ): Promise<void> {
    try {
      // Use transaction for atomicity
      await this.prisma.$transaction(async (tx) => {
        await tx.productImage.update({
          where: { id: imageId },
          data: { url: newUrl },
        });
      });
    } catch (error) {
      throw new Error(`Failed to update database URL for image ${imageId}: ${error.message}`);
    }
  }

  /**
   * Main migration method to migrate all images from flat to hierarchical structure
   * @param options - Migration options
   * @returns Migration result with statistics
   */
  async migrateImages(options?: MigrationOptions): Promise<MigrationResult> {
    const dryRun = options?.dryRun ?? false;
    const batchSize = options?.batchSize ?? 50;
    const backupDatabase = options?.backupDatabase ?? true;

    this.logger.log(`Starting image migration (dry run: ${dryRun})`);

    const result: MigrationResult = {
      totalImages: 0,
      migratedImages: 0,
      failedImages: 0,
      skippedImages: 0,
      errors: [],
    };

    try {
      // Create database backup if requested
      if (backupDatabase && !dryRun) {
        await this.createDatabaseBackup();
      }

      // Query all ProductImage records from database
      const allImages = await this.prisma.productImage.findMany({
        orderBy: { createdAt: 'asc' },
      });

      result.totalImages = allImages.length;
      this.logger.log(`Found ${result.totalImages} images to process`);

      // Process images in batches
      for (let i = 0; i < allImages.length; i += batchSize) {
        const batch = allImages.slice(i, i + batchSize);
        this.logger.log(`Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} images)`);

        for (const image of batch) {
          try {
            // Extract filename from URL
            const filename = path.basename(image.url);

            // Extract product ID from filename
            const extractedProductId = this.extractProductIdFromFilename(filename);

            if (!extractedProductId) {
              this.logger.warn(`Could not extract product ID from filename: ${filename}`);
              result.skippedImages++;
              result.errors.push({
                imageId: image.id,
                filename,
                error: 'Invalid filename format - could not extract product ID',
              });
              continue;
            }

            // Verify extracted product ID matches database product ID
            if (extractedProductId !== image.productId) {
              this.logger.warn(
                `Product ID mismatch: filename has ${extractedProductId}, database has ${image.productId}`,
              );
              result.skippedImages++;
              result.errors.push({
                imageId: image.id,
                filename,
                error: `Product ID mismatch: filename=${extractedProductId}, database=${image.productId}`,
              });
              continue;
            }

            // Check if already migrated (URL contains product ID in path)
            if (image.url.includes(`/products/${image.productId}/`)) {
              this.logger.debug(`Image already migrated: ${filename}`);
              result.skippedImages++;
              continue;
            }

            // Define old and new paths
            const oldPath = path.join(this.uploadDir, filename);
            const newPath = path.join(this.uploadDir, image.productId, filename);
            const newUrl = `/uploads/products/${image.productId}/${filename}`;

            // Check if old file exists
            try {
              await fs.access(oldPath);
            } catch (error) {
              this.logger.warn(`Original file not found: ${oldPath}`);
              result.skippedImages++;
              result.errors.push({
                imageId: image.id,
                filename,
                error: 'Original file not found',
              });
              continue;
            }

            if (!dryRun) {
              // Move files
              await this.moveImageFiles(image.productId, oldPath, newPath);

              // Update database URL
              await this.updateDatabaseUrls(image.id, newUrl);
            }

            result.migratedImages++;
            this.logger.debug(`Successfully migrated: ${filename}`);
          } catch (error) {
            this.logger.error(`Error migrating image ${image.id}:`, error);
            result.failedImages++;
            result.errors.push({
              imageId: image.id,
              filename: path.basename(image.url),
              error: error.message,
            });
            // Continue with other images
          }
        }
      }

      this.logger.log('Migration completed');
      this.logger.log(`Total: ${result.totalImages}, Migrated: ${result.migratedImages}, Failed: ${result.failedImages}, Skipped: ${result.skippedImages}`);

      return result;
    } catch (error) {
      this.logger.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Verify migration by checking all database URLs point to existing files
   * @returns Verification result with any mismatches
   */
  async verifyMigration(): Promise<{ valid: boolean; issues: string[] }> {
    this.logger.log('Starting migration verification');

    const issues: string[] = [];

    try {
      // Get all product images from database
      const allImages = await this.prisma.productImage.findMany();

      this.logger.log(`Verifying ${allImages.length} images`);

      for (const image of allImages) {
        // Extract filename from URL
        const urlPath = image.url.replace(/^\//, ''); // Remove leading slash
        const fullPath = path.join(process.cwd(), urlPath);

        // Check if file exists
        try {
          await fs.access(fullPath);
        } catch (error) {
          issues.push(`Image ${image.id} (${image.url}) - file not found at ${fullPath}`);
        }

        // Check if URL format is correct (should include product ID in path)
        if (!image.url.includes(`/products/${image.productId}/`)) {
          issues.push(`Image ${image.id} (${image.url}) - URL does not follow new format`);
        }
      }

      const valid = issues.length === 0;

      if (valid) {
        this.logger.log('Migration verification passed - all images valid');
      } else {
        this.logger.warn(`Migration verification found ${issues.length} issues`);
      }

      return { valid, issues };
    } catch (error) {
      this.logger.error('Verification failed:', error);
      throw error;
    }
  }

  /**
   * Create a backup of ProductImage table before migration
   * Stores backup as JSON file with timestamp
   */
  private async createDatabaseBackup(): Promise<void> {
    try {
      this.logger.log('Creating database backup');

      // Get all product images
      const allImages = await this.prisma.productImage.findMany();

      // Create backup directory if it doesn't exist
      const backupDir = path.join(process.cwd(), 'backups');
      await fs.mkdir(backupDir, { recursive: true });

      // Create backup file with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(backupDir, `product-images-backup-${timestamp}.json`);

      // Write backup
      await fs.writeFile(backupFile, JSON.stringify(allImages, null, 2), 'utf-8');

      this.logger.log(`Database backup created: ${backupFile}`);
    } catch (error) {
      this.logger.error('Failed to create database backup:', error);
      throw new Error(`Database backup failed: ${error.message}`);
    }
  }
}
