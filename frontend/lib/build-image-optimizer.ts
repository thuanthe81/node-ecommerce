/**
 * Build Image Optimizer
 *
 * Implements progressive image optimization, image compression during build,
 * and image asset deduplication for build-time operations.
 */

import { promises as fs } from 'fs';
import { join, extname, basename, dirname } from 'path';
import { createHash } from 'crypto';
import { getBuildCacheManager, BuildCacheManager } from './build-cache-manager';

export interface ImageOptimizationConfig {
  enabled: boolean;
  outputDirectory: string;
  supportedFormats: string[];
  quality: {
    jpeg: number;
    webp: number;
    avif: number;
    png: number;
  };
  sizes: number[];
  enableProgressive: boolean;
  enableDeduplication: boolean;
  maxConcurrentOptimizations: number;
  compressionLevel: number;
  enableWebP: boolean;
  enableAVIF: boolean;
}

export interface ImageAsset {
  id: string;
  originalPath: string;
  originalSize: number;
  hash: string;
  format: string;
  width: number;
  height: number;
  metadata: Record<string, any>;
}

export interface OptimizedImage {
  id: string;
  originalAsset: ImageAsset;
  variants: ImageVariant[];
  totalSizeReduction: number;
  compressionRatio: number;
  processingTime: number;
  deduplicationSavings: number;
}

export interface ImageVariant {
  format: 'jpeg' | 'webp' | 'avif' | 'png';
  width: number;
  height: number;
  quality: number;
  size: number;
  path: string;
  progressive: boolean;
}

export interface ImageProcessingStats {
  totalImages: number;
  processedImages: number;
  skippedImages: number;
  duplicatesFound: number;
  totalSizeReduction: number;
  averageCompressionRatio: number;
  processingTime: number;
  memoryUsage: number;
}

export interface ImageDeduplicationResult {
  originalCount: number;
  uniqueCount: number;
  duplicateGroups: Array<{
    hash: string;
    paths: string[];
    size: number;
  }>;
  spaceSaved: number;
}

export class BuildImageOptimizer {
  private cacheManager: BuildCacheManager;
  private config: ImageOptimizationConfig;
  private imageCache: Map<string, OptimizedImage> = new Map();
  private processingQueue: Array<{ asset: ImageAsset; resolve: Function; reject: Function }> = [];
  private activeOptimizations = 0;
  private stats: ImageProcessingStats = {
    totalImages: 0,
    processedImages: 0,
    skippedImages: 0,
    duplicatesFound: 0,
    totalSizeReduction: 0,
    averageCompressionRatio: 0,
    processingTime: 0,
    memoryUsage: 0,
  };

  constructor(config: Partial<ImageOptimizationConfig> = {}) {
    this.cacheManager = getBuildCacheManager();

    this.config = {
      enabled: true,
      outputDirectory: join(process.cwd(), '.next', 'optimized-images'),
      supportedFormats: ['.jpg', '.jpeg', '.png', '.webp', '.avif'],
      quality: {
        jpeg: 85,
        webp: 80,
        avif: 75,
        png: 90,
      },
      sizes: [640, 768, 1024, 1280, 1920],
      enableProgressive: true,
      enableDeduplication: true,
      maxConcurrentOptimizations: 4,
      compressionLevel: 6,
      enableWebP: true,
      enableAVIF: false, // Disabled by default due to processing time
      ...config,
    };

    this.ensureOutputDirectory();
  }

  /**
   * Optimize image processing during build
   */
  async optimizeImageProcessing(images: ImageAsset[]): Promise<OptimizedImage[]> {
    if (!this.config.enabled || images.length === 0) {
      return [];
    }

    console.log(`[IMAGE OPTIMIZER] Starting optimization of ${images.length} images`);
    const startTime = Date.now();

    this.stats.totalImages = images.length;
    this.stats.processedImages = 0;
    this.stats.skippedImages = 0;

    // Deduplicate images first
    const deduplicationResult = await this.deduplicateImages(images);
    const uniqueImages = this.getUniqueImages(images, deduplicationResult);

    console.log(`[IMAGE OPTIMIZER] Found ${deduplicationResult.duplicateGroups.length} duplicate groups, processing ${uniqueImages.length} unique images`);

    // Process images with concurrency control
    const optimizedImages = await this.processImagesWithConcurrency(uniqueImages);

    // Calculate final stats
    this.stats.processingTime = Date.now() - startTime;
    this.stats.averageCompressionRatio = optimizedImages.length > 0 ?
      optimizedImages.reduce((sum, img) => sum + img.compressionRatio, 0) / optimizedImages.length : 0;

    console.log(`[IMAGE OPTIMIZER] Optimization complete: ${this.stats.processedImages} processed, ${this.stats.skippedImages} skipped, ${this.formatBytes(this.stats.totalSizeReduction)} saved`);

    return optimizedImages;
  }

  /**
   * Add image compression during build
   */
  async compressImage(asset: ImageAsset, targetFormats: string[] = []): Promise<OptimizedImage> {
    const cacheKey = `image_${asset.hash}`;

    // Check cache first
    const cached = await this.cacheManager.get<OptimizedImage>(cacheKey);
    if (cached) {
      console.log(`[IMAGE OPTIMIZER] Using cached optimization for ${asset.originalPath}`);
      return cached;
    }

    console.log(`[IMAGE OPTIMIZER] Compressing ${asset.originalPath}`);
    const startTime = Date.now();

    try {
      const variants = await this.generateImageVariants(asset, targetFormats);
      const totalOriginalSize = asset.originalSize;
      const totalOptimizedSize = variants.reduce((sum, variant) => sum + variant.size, 0);
      const sizeReduction = totalOriginalSize - totalOptimizedSize;
      const compressionRatio = totalOptimizedSize / totalOriginalSize;

      const optimizedImage: OptimizedImage = {
        id: asset.id,
        originalAsset: asset,
        variants,
        totalSizeReduction: sizeReduction,
        compressionRatio,
        processingTime: Date.now() - startTime,
        deduplicationSavings: 0,
      };

      // Cache the result
      await this.cacheManager.set(cacheKey, optimizedImage, 86400); // 24 hours

      this.stats.totalSizeReduction += sizeReduction;
      this.stats.processedImages++;

      return optimizedImage;

    } catch (error) {
      console.error(`[IMAGE OPTIMIZER] Failed to compress ${asset.originalPath}:`, error);
      this.stats.skippedImages++;

      // Return minimal optimized image on error
      return {
        id: asset.id,
        originalAsset: asset,
        variants: [],
        totalSizeReduction: 0,
        compressionRatio: 1,
        processingTime: Date.now() - startTime,
        deduplicationSavings: 0,
      };
    }
  }

  /**
   * Create image asset deduplication
   */
  async deduplicateImages(images: ImageAsset[]): Promise<ImageDeduplicationResult> {
    if (!this.config.enableDeduplication) {
      return {
        originalCount: images.length,
        uniqueCount: images.length,
        duplicateGroups: [],
        spaceSaved: 0,
      };
    }

    console.log(`[IMAGE OPTIMIZER] Deduplicating ${images.length} images`);

    const hashGroups = new Map<string, ImageAsset[]>();

    // Group images by hash
    for (const image of images) {
      const hash = image.hash || await this.calculateImageHash(image.originalPath);
      if (!hashGroups.has(hash)) {
        hashGroups.set(hash, []);
      }
      hashGroups.get(hash)!.push(image);
    }

    // Find duplicate groups
    const duplicateGroups = Array.from(hashGroups.entries())
      .filter(([_, group]) => group.length > 1)
      .map(([hash, group]) => ({
        hash,
        paths: group.map(img => img.originalPath),
        size: group[0].originalSize,
      }));

    const uniqueCount = hashGroups.size;
    const spaceSaved = duplicateGroups.reduce((sum, group) =>
      sum + (group.size * (group.paths.length - 1)), 0);

    this.stats.duplicatesFound = duplicateGroups.length;

    console.log(`[IMAGE OPTIMIZER] Deduplication complete: ${duplicateGroups.length} duplicate groups found, ${this.formatBytes(spaceSaved)} space can be saved`);

    return {
      originalCount: images.length,
      uniqueCount,
      duplicateGroups,
      spaceSaved,
    };
  }

  /**
   * Get processing statistics
   */
  getStats(): ImageProcessingStats {
    return { ...this.stats };
  }

  /**
   * Clear image cache
   */
  async clearCache(): Promise<void> {
    this.imageCache.clear();
    await this.cacheManager.invalidate(/^image_/);
    console.log('[IMAGE OPTIMIZER] Image cache cleared');
  }

  /**
   * Process images with concurrency control
   */
  private async processImagesWithConcurrency(images: ImageAsset[]): Promise<OptimizedImage[]> {
    const results: OptimizedImage[] = [];

    // Process images in batches
    for (let i = 0; i < images.length; i += this.config.maxConcurrentOptimizations) {
      const batch = images.slice(i, i + this.config.maxConcurrentOptimizations);

      const batchPromises = batch.map(image => this.compressImage(image));
      const batchResults = await Promise.allSettled(batchPromises);

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      }

      // Log progress
      console.log(`[IMAGE OPTIMIZER] Processed batch ${Math.floor(i / this.config.maxConcurrentOptimizations) + 1}/${Math.ceil(images.length / this.config.maxConcurrentOptimizations)}`);
    }

    return results;
  }

  /**
   * Generate image variants for different formats and sizes
   */
  private async generateImageVariants(asset: ImageAsset, targetFormats: string[] = []): Promise<ImageVariant[]> {
    const variants: ImageVariant[] = [];

    // Determine formats to generate
    const formats = targetFormats.length > 0 ? targetFormats : this.getDefaultFormats(asset.format);

    for (const format of formats) {
      for (const size of this.config.sizes) {
        // Skip if size is larger than original
        if (size > asset.width) continue;

        try {
          const variant = await this.generateImageVariant(asset, format as any, size);
          if (variant) {
            variants.push(variant);
          }
        } catch (error) {
          console.warn(`[IMAGE OPTIMIZER] Failed to generate ${format} variant at ${size}px for ${asset.originalPath}:`, error);
        }
      }
    }

    return variants;
  }

  /**
   * Generate single image variant
   */
  private async generateImageVariant(
    asset: ImageAsset,
    format: 'jpeg' | 'webp' | 'avif' | 'png',
    width: number
  ): Promise<ImageVariant | null> {
    // This is a simplified implementation
    // In a real implementation, you would use a library like Sharp or similar

    const quality = this.config.quality[format];
    const height = Math.round((asset.height / asset.width) * width);

    // Simulate image processing
    const originalSize = asset.originalSize;
    const compressionFactor = this.getCompressionFactor(format, quality);
    const sizeFactor = (width * height) / (asset.width * asset.height);
    const estimatedSize = Math.round(originalSize * compressionFactor * sizeFactor);

    const outputPath = this.generateOutputPath(asset, format, width);

    // Simulate file creation (in real implementation, actually process the image)
    await this.simulateImageProcessing(asset.originalPath, outputPath, width, height, format, quality);

    return {
      format,
      width,
      height,
      quality,
      size: estimatedSize,
      path: outputPath,
      progressive: this.config.enableProgressive && (format === 'jpeg' || format === 'webp'),
    };
  }

  /**
   * Get default formats for optimization
   */
  private getDefaultFormats(originalFormat: string): string[] {
    const formats = [originalFormat];

    if (this.config.enableWebP && !formats.includes('webp')) {
      formats.push('webp');
    }

    if (this.config.enableAVIF && !formats.includes('avif')) {
      formats.push('avif');
    }

    return formats;
  }

  /**
   * Get compression factor for format and quality
   */
  private getCompressionFactor(format: string, quality: number): number {
    const baseFactors = {
      jpeg: 0.3,
      webp: 0.25,
      avif: 0.2,
      png: 0.8,
    };

    const baseFactor = baseFactors[format as keyof typeof baseFactors] || 0.5;
    const qualityFactor = quality / 100;

    return baseFactor * (0.5 + qualityFactor * 0.5);
  }

  /**
   * Generate output path for optimized image
   */
  private generateOutputPath(asset: ImageAsset, format: string, width: number): string {
    const name = basename(asset.originalPath, extname(asset.originalPath));
    const filename = `${name}_${width}w.${format}`;
    return join(this.config.outputDirectory, filename);
  }

  /**
   * Simulate image processing (replace with actual image processing library)
   */
  private async simulateImageProcessing(
    inputPath: string,
    outputPath: string,
    width: number,
    height: number,
    format: string,
    quality: number
  ): Promise<void> {
    // In a real implementation, use Sharp or similar:
    // const sharp = require('sharp');
    // await sharp(inputPath)
    //   .resize(width, height)
    //   .jpeg({ quality, progressive: this.config.enableProgressive })
    //   .toFile(outputPath);

    // For now, just simulate the processing time
    await new Promise(resolve => setTimeout(resolve, 50));

    // Create placeholder file
    await fs.writeFile(outputPath, `Optimized ${format} image ${width}x${height} at ${quality}% quality`, 'utf8');
  }

  /**
   * Calculate image hash
   */
  private async calculateImageHash(imagePath: string): Promise<string> {
    try {
      const buffer = await fs.readFile(imagePath);
      return createHash('md5').update(buffer).digest('hex');
    } catch (error) {
      console.warn(`[IMAGE OPTIMIZER] Failed to calculate hash for ${imagePath}:`, error);
      return createHash('md5').update(imagePath).digest('hex');
    }
  }

  /**
   * Get unique images from deduplication result
   */
  private getUniqueImages(images: ImageAsset[], deduplicationResult: ImageDeduplicationResult): ImageAsset[] {
    if (deduplicationResult.duplicateGroups.length === 0) {
      return images;
    }

    const duplicatePaths = new Set<string>();

    // Mark all but the first image in each duplicate group
    for (const group of deduplicationResult.duplicateGroups) {
      for (let i = 1; i < group.paths.length; i++) {
        duplicatePaths.add(group.paths[i]);
      }
    }

    return images.filter(image => !duplicatePaths.has(image.originalPath));
  }

  /**
   * Ensure output directory exists
   */
  private async ensureOutputDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.outputDirectory, { recursive: true });
    } catch (error) {
      console.warn('[IMAGE OPTIMIZER] Failed to create output directory:', error);
    }
  }

  /**
   * Format bytes for display
   */
  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}

/**
 * Create singleton image optimizer instance
 */
let imageOptimizer: BuildImageOptimizer | null = null;

export function createImageOptimizer(config?: Partial<ImageOptimizationConfig>): BuildImageOptimizer {
  if (!imageOptimizer) {
    imageOptimizer = new BuildImageOptimizer(config);
  }
  return imageOptimizer;
}

/**
 * Get singleton image optimizer instance
 */
export function getImageOptimizer(): BuildImageOptimizer {
  if (!imageOptimizer) {
    imageOptimizer = new BuildImageOptimizer();
  }
  return imageOptimizer;
}

/**
 * Scan directory for image assets
 */
export async function scanImageAssets(directory: string): Promise<ImageAsset[]> {
  const assets: ImageAsset[] = [];

  const scanDir = async (dir: string): Promise<void> => {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          await scanDir(fullPath);
        } else if (entry.isFile()) {
          const ext = extname(entry.name).toLowerCase();

          if (['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext)) {
            try {
              const stats = await fs.stat(fullPath);
              const hash = createHash('md5').update(fullPath).digest('hex');

              // In a real implementation, extract actual image dimensions
              const asset: ImageAsset = {
                id: hash,
                originalPath: fullPath,
                originalSize: stats.size,
                hash,
                format: ext.slice(1),
                width: 1920, // Placeholder - extract from actual image
                height: 1080, // Placeholder - extract from actual image
                metadata: {
                  lastModified: stats.mtime.getTime(),
                },
              };

              assets.push(asset);
            } catch (error) {
              console.warn(`[IMAGE OPTIMIZER] Failed to process ${fullPath}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.warn(`[IMAGE OPTIMIZER] Failed to scan directory ${dir}:`, error);
    }
  };

  await scanDir(directory);
  return assets;
}

/**
 * Default image optimization configuration
 */
export function getDefaultImageOptimizationConfig(): ImageOptimizationConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    enabled: !isDevelopment, // Disable in development for faster builds
    outputDirectory: join(process.cwd(), '.next', 'optimized-images'),
    supportedFormats: ['.jpg', '.jpeg', '.png', '.webp', '.avif'],
    quality: {
      jpeg: isDevelopment ? 90 : 85,
      webp: isDevelopment ? 85 : 80,
      avif: isDevelopment ? 80 : 75,
      png: 90,
    },
    sizes: isDevelopment ? [1280] : [640, 768, 1024, 1280, 1920],
    enableProgressive: !isDevelopment,
    enableDeduplication: true,
    maxConcurrentOptimizations: isDevelopment ? 2 : 4,
    compressionLevel: isDevelopment ? 3 : 6,
    enableWebP: true,
    enableAVIF: false, // Disabled by default due to processing time
  };
}