import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CompressedImageConfigService } from './compressed-image-config.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Storage metrics interface
 */
export interface StorageMetrics {
  /** Total storage size in bytes */
  totalStorageSize: number;
  /** Total number of compressed images */
  totalCompressedImages: number;
  /** Number of metadata files */
  totalMetadataFiles: number;
  /** Reuse rate (percentage of cache hits) */
  reuseRate: number;
  /** Average compression ratio */
  averageCompressionRatio: number;
  /** Storage utilization percentage */
  storageUtilization: number;
  /** Free space available in bytes */
  freeSpaceAvailable: number;
  /** Oldest file age in days */
  oldestFileAge: number;
  /** Newest file age in days */
  newestFileAge: number;
  /** Files by type breakdown */
  filesByType: {
    jpeg: number;
    png: number;
    webp: number;
    other: number;
  };
  /** Size by type breakdown */
  sizeByType: {
    jpeg: number;
    png: number;
    webp: number;
    other: number;
  };
  /** Performance metrics */
  performance: {
    averageRetrievalTime: number;
    averageStorageTime: number;
    cacheHitRate: number;
    errorRate: number;
  };
  /** Last updated timestamp */
  lastUpdated: Date;
}

/**
 * File information interface
 */
interface FileInfo {
  path: string;
  size: number;
  mtime: Date;
  atime: Date;
  type: 'jpeg' | 'png' | 'webp' | 'other';
  isMetadata: boolean;
  compressionRatio?: number;
}

/**
 * Cleanup result interface
 */
export interface CleanupResult {
  /** Number of files cleaned up */
  filesRemoved: number;
  /** Total size freed in bytes */
  sizeFreed: number;
  /** Cleanup strategy used */
  strategy: string;
  /** Cleanup duration in milliseconds */
  duration: number;
  /** Any errors encountered */
  errors: string[];
  /** Success status */
  success: boolean;
}

/**
 * Compressed Image Storage Monitoring Service
 *
 * Handles storage monitoring, metrics collection, and automatic cleanup
 * for the compressed image storage system.
 */
@Injectable()
export class CompressedImageStorageMonitoringService {
  private readonly logger = new Logger(CompressedImageStorageMonitoringService.name);
  private currentMetrics: StorageMetrics | null = null;
  private performanceData: {
    retrievalTimes: number[];
    storageTimes: number[];
    cacheHits: number;
    cacheMisses: number;
    errors: number;
    operations: number;
  } = {
    retrievalTimes: [],
    storageTimes: [],
    cacheHits: 0,
    cacheMisses: 0,
    errors: 0,
    operations: 0,
  };

  constructor(
    private readonly configService: CompressedImageConfigService
  ) {
    this.initializeMonitoring();
  }

  /**
   * Initialize monitoring system
   */
  private initializeMonitoring(): void {
    if (this.configService.isStorageMonitoringEnabled()) {
      this.logger.log('Initializing compressed image storage monitoring');
      this.collectMetrics().catch(error => {
        this.logger.error(`Failed to collect initial metrics: ${error.message}`);
      });
    }
  }

  /**
   * Collect comprehensive storage metrics
   */
  async collectMetrics(): Promise<StorageMetrics> {
    try {
      const startTime = Date.now();
      const baseDir = this.getFullPath(this.configService.getBaseDirectory());

      if (!await this.directoryExists(baseDir)) {
        return this.getEmptyMetrics();
      }

      const files = await this.getAllFiles(baseDir);
      const metrics = await this.calculateMetrics(files);

      this.currentMetrics = metrics;

      const duration = Date.now() - startTime;
      this.logger.log(`Metrics collection completed in ${duration}ms - ${metrics.totalCompressedImages} files, ${this.formatBytes(metrics.totalStorageSize)}`);

      return metrics;

    } catch (error) {
      this.logger.error(`Failed to collect storage metrics: ${error.message}`);
      return this.getEmptyMetrics();
    }
  }

  /**
   * Get current metrics (cached)
   */
  getCurrentMetrics(): StorageMetrics | null {
    return this.currentMetrics;
  }

  /**
   * Record retrieval operation performance
   */
  recordRetrievalOperation(duration: number, success: boolean): void {
    this.performanceData.operations++;

    if (success) {
      this.performanceData.retrievalTimes.push(duration);
      this.performanceData.cacheHits++;

      // Keep only recent measurements (last 1000)
      if (this.performanceData.retrievalTimes.length > 1000) {
        this.performanceData.retrievalTimes = this.performanceData.retrievalTimes.slice(-1000);
      }
    } else {
      this.performanceData.cacheMisses++;
      this.performanceData.errors++;
    }
  }

  /**
   * Record storage operation performance
   */
  recordStorageOperation(duration: number, success: boolean): void {
    this.performanceData.operations++;

    if (success) {
      this.performanceData.storageTimes.push(duration);

      // Keep only recent measurements (last 1000)
      if (this.performanceData.storageTimes.length > 1000) {
        this.performanceData.storageTimes = this.performanceData.storageTimes.slice(-1000);
      }
    } else {
      this.performanceData.errors++;
    }
  }

  /**
   * Perform cleanup based on configuration
   */
  async performCleanup(force: boolean = false): Promise<CleanupResult> {
    const startTime = Date.now();
    const result: CleanupResult = {
      filesRemoved: 0,
      sizeFreed: 0,
      strategy: 'none',
      duration: 0,
      errors: [],
      success: false,
    };

    try {
      if (!this.configService.isStorageMonitoringEnabled() && !force) {
        result.success = true;
        return result;
      }

      const cleanupConfig = this.configService.getCleanupConfig();
      const baseDir = this.getFullPath(this.configService.getBaseDirectory());

      if (!await this.directoryExists(baseDir)) {
        result.success = true;
        return result;
      }

      const files = await this.getAllFiles(baseDir);
      const filesToCleanup = this.selectFilesForCleanup(files, cleanupConfig);

      result.strategy = cleanupConfig.strategy;

      for (const file of filesToCleanup) {
        try {
          await this.deleteFile(file);
          result.filesRemoved++;
          result.sizeFreed += file.size;
        } catch (error) {
          result.errors.push(`Failed to delete ${file.path}: ${error.message}`);
        }
      }

      result.success = result.errors.length === 0;
      result.duration = Date.now() - startTime;

      this.logger.log(`Cleanup completed: ${result.filesRemoved} files removed, ${this.formatBytes(result.sizeFreed)} freed`);

      return result;

    } catch (error) {
      result.errors.push(error.message);
      result.duration = Date.now() - startTime;
      this.logger.error(`Cleanup failed: ${error.message}`);
      return result;
    }
  }

  /**
   * Automatic cleanup cron job
   */
  @Cron(CronExpression.EVERY_HOUR)
  async automaticCleanup(): void {
    if (!this.configService.isAutoCleanupEnabled()) {
      return;
    }

    try {
      const cleanupConfig = this.configService.getCleanupConfig();
      const now = new Date();
      const lastCleanup = this.getLastCleanupTime();

      // Check if cleanup interval has passed
      const hoursSinceLastCleanup = (now.getTime() - lastCleanup.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastCleanup >= cleanupConfig.interval) {
        this.logger.log('Starting automatic cleanup');
        const result = await this.performCleanup();

        if (result.success && result.filesRemoved > 0) {
          this.logger.log(`Automatic cleanup completed: ${result.filesRemoved} files removed`);
        }

        this.setLastCleanupTime(now);
      }
    } catch (error) {
      this.logger.error(`Automatic cleanup failed: ${error.message}`);
    }
  }

  /**
   * Metrics collection cron job
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async scheduledMetricsCollection(): void {
    if (this.configService.isStorageMonitoringEnabled()) {
      await this.collectMetrics();
    }
  }

  /**
   * Check if cleanup is needed based on current metrics
   */
  async isCleanupNeeded(): Promise<boolean> {
    try {
      const metrics = await this.collectMetrics();
      const cleanupConfig = this.configService.getCleanupConfig();

      // Check storage size limit
      if (cleanupConfig.maxStorageSize > 0 && metrics.totalStorageSize > cleanupConfig.maxStorageSize) {
        return true;
      }

      // Check file count limit
      if (cleanupConfig.maxFileCount > 0 && metrics.totalCompressedImages > cleanupConfig.maxFileCount) {
        return true;
      }

      // Check free space
      if (cleanupConfig.minFreeSpacePercent > 0) {
        const freeSpacePercent = (metrics.freeSpaceAvailable / (metrics.totalStorageSize + metrics.freeSpaceAvailable)) * 100;
        if (freeSpacePercent < cleanupConfig.minFreeSpacePercent) {
          return true;
        }
      }

      return false;

    } catch (error) {
      this.logger.error(`Failed to check cleanup need: ${error.message}`);
      return false;
    }
  }

  /**
   * Get storage health status
   */
  async getStorageHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    try {
      const metrics = await this.collectMetrics();
      const cleanupConfig = this.configService.getCleanupConfig();

      // Check storage utilization
      if (metrics.storageUtilization > 90) {
        status = 'critical';
        issues.push('Storage utilization is critically high (>90%)');
        recommendations.push('Perform immediate cleanup or increase storage limits');
      } else if (metrics.storageUtilization > 75) {
        status = 'warning';
        issues.push('Storage utilization is high (>75%)');
        recommendations.push('Consider cleanup or monitor storage growth');
      }

      // Check error rate
      if (metrics.performance.errorRate > 10) {
        status = 'critical';
        issues.push('High error rate in storage operations');
        recommendations.push('Check storage system health and permissions');
      } else if (metrics.performance.errorRate > 5) {
        if (status === 'healthy') status = 'warning';
        issues.push('Elevated error rate in storage operations');
        recommendations.push('Monitor storage system for issues');
      }

      // Check old files
      if (cleanupConfig.maxFileAge > 0 && metrics.oldestFileAge > cleanupConfig.maxFileAge * 1.5) {
        if (status === 'healthy') status = 'warning';
        issues.push('Very old files detected beyond cleanup threshold');
        recommendations.push('Run cleanup to remove old files');
      }

      // Check cache performance
      if (metrics.performance.cacheHitRate < 50) {
        if (status === 'healthy') status = 'warning';
        issues.push('Low cache hit rate indicates poor reuse');
        recommendations.push('Review image optimization patterns');
      }

      if (issues.length === 0) {
        recommendations.push('Storage system is operating normally');
      }

    } catch (error) {
      status = 'critical';
      issues.push(`Failed to assess storage health: ${error.message}`);
      recommendations.push('Check storage system accessibility');
    }

    return { status, issues, recommendations };
  }

  // Private helper methods

  /**
   * Calculate comprehensive metrics from file list
   */
  private async calculateMetrics(files: FileInfo[]): Promise<StorageMetrics> {
    const imageFiles = files.filter(f => !f.isMetadata);
    const metadataFiles = files.filter(f => f.isMetadata);

    const totalStorageSize = files.reduce((sum, f) => sum + f.size, 0);
    const filesByType = { jpeg: 0, png: 0, webp: 0, other: 0 };
    const sizeByType = { jpeg: 0, png: 0, webp: 0, other: 0 };

    let totalCompressionRatio = 0;
    let compressionRatioCount = 0;

    for (const file of imageFiles) {
      filesByType[file.type]++;
      sizeByType[file.type] += file.size;

      if (file.compressionRatio !== undefined) {
        totalCompressionRatio += file.compressionRatio;
        compressionRatioCount++;
      }
    }

    const now = new Date();
    const oldestFile = files.reduce((oldest, file) =>
      file.mtime < oldest.mtime ? file : oldest, files[0] || { mtime: now });
    const newestFile = files.reduce((newest, file) =>
      file.mtime > newest.mtime ? file : newest, files[0] || { mtime: now });

    const oldestFileAge = files.length > 0 ? (now.getTime() - oldestFile.mtime.getTime()) / (1000 * 60 * 60 * 24) : 0;
    const newestFileAge = files.length > 0 ? (now.getTime() - newestFile.mtime.getTime()) / (1000 * 60 * 60 * 24) : 0;

    // Calculate performance metrics
    const averageRetrievalTime = this.performanceData.retrievalTimes.length > 0
      ? this.performanceData.retrievalTimes.reduce((sum, time) => sum + time, 0) / this.performanceData.retrievalTimes.length
      : 0;

    const averageStorageTime = this.performanceData.storageTimes.length > 0
      ? this.performanceData.storageTimes.reduce((sum, time) => sum + time, 0) / this.performanceData.storageTimes.length
      : 0;

    const totalOperations = this.performanceData.cacheHits + this.performanceData.cacheMisses;
    const cacheHitRate = totalOperations > 0 ? (this.performanceData.cacheHits / totalOperations) * 100 : 0;
    const errorRate = this.performanceData.operations > 0 ? (this.performanceData.errors / this.performanceData.operations) * 100 : 0;

    // Get free space (simplified - would need platform-specific implementation for accuracy)
    const freeSpaceAvailable = await this.getFreeSpace();

    return {
      totalStorageSize,
      totalCompressedImages: imageFiles.length,
      totalMetadataFiles: metadataFiles.length,
      reuseRate: cacheHitRate,
      averageCompressionRatio: compressionRatioCount > 0 ? totalCompressionRatio / compressionRatioCount : 0,
      storageUtilization: totalStorageSize > 0 ? (totalStorageSize / (totalStorageSize + freeSpaceAvailable)) * 100 : 0,
      freeSpaceAvailable,
      oldestFileAge,
      newestFileAge,
      filesByType,
      sizeByType,
      performance: {
        averageRetrievalTime,
        averageStorageTime,
        cacheHitRate,
        errorRate,
      },
      lastUpdated: new Date(),
    };
  }

  /**
   * Get all files in directory recursively
   */
  private async getAllFiles(dirPath: string): Promise<FileInfo[]> {
    const files: FileInfo[] = [];

    try {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          const subFiles = await this.getAllFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          const stat = await fs.promises.stat(fullPath);
          const isMetadata = entry.name.endsWith('.meta.json');

          let fileType: 'jpeg' | 'png' | 'webp' | 'other' = 'other';
          const ext = path.extname(entry.name).toLowerCase();

          if (['.jpg', '.jpeg'].includes(ext)) fileType = 'jpeg';
          else if (ext === '.png') fileType = 'png';
          else if (ext === '.webp') fileType = 'webp';

          let compressionRatio: number | undefined;

          // Try to read compression ratio from metadata
          if (!isMetadata) {
            const metadataPath = this.getMetadataPath(fullPath);
            if (await this.fileExists(metadataPath)) {
              try {
                const metadataContent = await fs.promises.readFile(metadataPath, 'utf-8');
                const metadata = JSON.parse(metadataContent);
                compressionRatio = metadata.compressionRatio;
              } catch {
                // Ignore metadata read errors
              }
            }
          }

          files.push({
            path: fullPath,
            size: stat.size,
            mtime: stat.mtime,
            atime: stat.atime,
            type: fileType,
            isMetadata,
            compressionRatio,
          });
        }
      }
    } catch (error) {
      this.logger.warn(`Error scanning directory ${dirPath}: ${error.message}`);
    }

    return files;
  }

  /**
   * Select files for cleanup based on strategy
   */
  private selectFilesForCleanup(files: FileInfo[], cleanupConfig: any): FileInfo[] {
    const imageFiles = files.filter(f => !f.isMetadata);
    let filesToCleanup: FileInfo[] = [];

    // Filter by age if specified
    if (cleanupConfig.maxFileAge > 0) {
      const cutoffDate = new Date(Date.now() - (cleanupConfig.maxFileAge * 24 * 60 * 60 * 1000));
      filesToCleanup = imageFiles.filter(f => f.mtime < cutoffDate);
    }

    // If we still need to clean up more files, apply strategy
    if (filesToCleanup.length === 0 || this.needsMoreCleanup(files, cleanupConfig)) {
      switch (cleanupConfig.strategy) {
        case 'oldest-first':
          filesToCleanup = [...imageFiles].sort((a, b) => a.mtime.getTime() - b.mtime.getTime());
          break;
        case 'largest-first':
          filesToCleanup = [...imageFiles].sort((a, b) => b.size - a.size);
          break;
        case 'least-used':
          // Sort by access time (least recently accessed first)
          filesToCleanup = [...imageFiles].sort((a, b) => a.atime.getTime() - b.atime.getTime());
          break;
        case 'random':
          filesToCleanup = [...imageFiles].sort(() => Math.random() - 0.5);
          break;
        default:
          filesToCleanup = [...imageFiles].sort((a, b) => a.mtime.getTime() - b.mtime.getTime());
      }
    }

    // Limit cleanup to what's needed
    return this.limitCleanupFiles(filesToCleanup, files, cleanupConfig);
  }

  /**
   * Check if more cleanup is needed
   */
  private needsMoreCleanup(files: FileInfo[], cleanupConfig: any): boolean {
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    const totalFiles = files.filter(f => !f.isMetadata).length;

    return (cleanupConfig.maxStorageSize > 0 && totalSize > cleanupConfig.maxStorageSize) ||
           (cleanupConfig.maxFileCount > 0 && totalFiles > cleanupConfig.maxFileCount);
  }

  /**
   * Limit cleanup files to what's actually needed
   */
  private limitCleanupFiles(candidates: FileInfo[], allFiles: FileInfo[], cleanupConfig: any): FileInfo[] {
    const result: FileInfo[] = [];
    let currentSize = allFiles.reduce((sum, f) => sum + f.size, 0);
    let currentCount = allFiles.filter(f => !f.isMetadata).length;

    for (const file of candidates) {
      const shouldRemove =
        (cleanupConfig.maxStorageSize > 0 && currentSize > cleanupConfig.maxStorageSize) ||
        (cleanupConfig.maxFileCount > 0 && currentCount > cleanupConfig.maxFileCount);

      if (!shouldRemove) {
        break;
      }

      result.push(file);
      currentSize -= file.size;
      currentCount--;
    }

    return result;
  }

  /**
   * Delete a file and its metadata
   */
  private async deleteFile(file: FileInfo): Promise<void> {
    // Delete the image file
    await fs.promises.unlink(file.path);

    // Delete the metadata file if it exists
    const metadataPath = this.getMetadataPath(file.path);
    if (await this.fileExists(metadataPath)) {
      await fs.promises.unlink(metadataPath);
    }
  }

  /**
   * Get empty metrics structure
   */
  private getEmptyMetrics(): StorageMetrics {
    return {
      totalStorageSize: 0,
      totalCompressedImages: 0,
      totalMetadataFiles: 0,
      reuseRate: 0,
      averageCompressionRatio: 0,
      storageUtilization: 0,
      freeSpaceAvailable: 0,
      oldestFileAge: 0,
      newestFileAge: 0,
      filesByType: { jpeg: 0, png: 0, webp: 0, other: 0 },
      sizeByType: { jpeg: 0, png: 0, webp: 0, other: 0 },
      performance: {
        averageRetrievalTime: 0,
        averageStorageTime: 0,
        cacheHitRate: 0,
        errorRate: 0,
      },
      lastUpdated: new Date(),
    };
  }

  /**
   * Helper methods
   */
  private getFullPath(relativePath: string): string {
    return path.isAbsolute(relativePath) ? relativePath : path.join(process.cwd(), relativePath);
  }

  private getMetadataPath(imagePath: string): string {
    const parsedPath = path.parse(imagePath);
    return path.join(parsedPath.dir, `${parsedPath.name}.meta.json`);
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.promises.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  private async getFreeSpace(): Promise<number> {
    // Simplified implementation - in production, would use platform-specific methods
    try {
      const stats = await fs.promises.statfs?.(process.cwd());
      return stats ? stats.bavail * stats.bsize : 1024 * 1024 * 1024; // Default to 1GB
    } catch {
      return 1024 * 1024 * 1024; // Default to 1GB
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  private getLastCleanupTime(): Date {
    // In production, this would be stored in a persistent store
    return new Date(Date.now() - 25 * 60 * 60 * 1000); // Default to 25 hours ago
  }

  private setLastCleanupTime(time: Date): void {
    // In production, this would be stored in a persistent store
    this.logger.log(`Last cleanup time set to: ${time.toISOString()}`);
  }
}