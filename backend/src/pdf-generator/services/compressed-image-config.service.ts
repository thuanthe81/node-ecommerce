import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CompressedImageConfig,
  defaultCompressedImageConfig,
  createCompressedImageConfig,
  validateCompressedImageConfig,
  getStorageMetricsConfig,
  getDirectoryPath,
} from '../config/compressed-image.config';

/**
 * Compressed Image Configuration Service
 *
 * Manages configuration for compressed image storage system.
 * Provides centralized access to configuration with environment variable support,
 * validation, and runtime configuration updates.
 */
@Injectable()
export class CompressedImageConfigService {
  private readonly logger = new Logger(CompressedImageConfigService.name);
  private config: CompressedImageConfig;
  private configValidation: { isValid: boolean; errors: string[]; warnings: string[] };

  constructor(private readonly configService: ConfigService) {
    this.loadConfiguration();
  }

  /**
   * Load and validate configuration from environment variables
   */
  private loadConfiguration(): void {
    try {
      // Create configuration from environment variables
      this.config = createCompressedImageConfig(this.configService);

      // Validate the configuration
      this.configValidation = validateCompressedImageConfig(this.config);

      if (!this.configValidation.isValid) {
        this.logger.error('Invalid compressed image configuration:', this.configValidation.errors);
        // Fall back to default configuration
        this.config = { ...defaultCompressedImageConfig };
        this.configValidation = validateCompressedImageConfig(this.config);
      }

      if (this.configValidation.warnings.length > 0) {
        this.logger.warn('Compressed image configuration warnings:', this.configValidation.warnings);
      }

      this.logger.log('Compressed image configuration loaded successfully');
      this.logConfigurationSummary();

    } catch (error) {
      this.logger.error(`Failed to load compressed image configuration: ${error.message}`);
      // Fall back to default configuration
      this.config = { ...defaultCompressedImageConfig };
      this.configValidation = validateCompressedImageConfig(this.config);
    }
  }

  /**
   * Get the current configuration
   */
  getConfig(): CompressedImageConfig {
    return { ...this.config }; // Return a copy to prevent external modification
  }

  /**
   * Get configuration validation result
   */
  getConfigValidation(): { isValid: boolean; errors: string[]; warnings: string[] } {
    return { ...this.configValidation };
  }

  /**
   * Check if compressed image storage is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get base directory for compressed images
   */
  getBaseDirectory(): string {
    return this.config.baseDirectory;
  }

  /**
   * Get file naming configuration
   */
  getFileNamingConfig() {
    return { ...this.config.fileNaming };
  }

  /**
   * Get directory organization configuration
   */
  getDirectoryOrganizationConfig() {
    return { ...this.config.directoryOrganization };
  }

  /**
   * Get storage monitoring configuration
   */
  getStorageMonitoringConfig() {
    return { ...this.config.storageMonitoring };
  }

  /**
   * Get performance configuration
   */
  getPerformanceConfig() {
    return { ...this.config.performance };
  }

  /**
   * Get metadata configuration
   */
  getMetadataConfig() {
    return { ...this.config.metadata };
  }

  /**
   * Get error handling configuration
   */
  getErrorHandlingConfig() {
    return { ...this.config.errorHandling };
  }

  /**
   * Get storage metrics configuration
   */
  getStorageMetricsConfig() {
    return getStorageMetricsConfig(this.config);
  }

  /**
   * Get directory path for a given original path and file type
   */
  getDirectoryPath(originalPath: string, fileType: 'jpeg' | 'png' | 'webp' | 'other' = 'other'): string {
    return getDirectoryPath(this.config, originalPath, fileType);
  }

  /**
   * Check if storage monitoring is enabled
   */
  isStorageMonitoringEnabled(): boolean {
    return this.config.storageMonitoring.enabled;
  }

  /**
   * Check if auto cleanup is enabled
   */
  isAutoCleanupEnabled(): boolean {
    return this.config.storageMonitoring.enabled && this.config.storageMonitoring.autoCleanup;
  }

  /**
   * Get cleanup configuration
   */
  getCleanupConfig() {
    return {
      strategy: this.config.storageMonitoring.cleanupStrategy,
      maxStorageSize: this.config.storageMonitoring.maxStorageSize,
      maxFileCount: this.config.storageMonitoring.maxFileCount,
      maxFileAge: this.config.storageMonitoring.maxFileAge,
      interval: this.config.storageMonitoring.cleanupInterval,
      minFreeSpacePercent: this.config.storageMonitoring.minFreeSpacePercent,
    };
  }

  /**
   * Check if parallel operations are enabled
   */
  isParallelOpsEnabled(): boolean {
    return this.config.performance.enableParallelOps;
  }

  /**
   * Get maximum concurrent operations
   */
  getMaxConcurrentOps(): number {
    return this.config.performance.maxConcurrentOps;
  }

  /**
   * Check if file system caching is enabled
   */
  isFsCacheEnabled(): boolean {
    return this.config.performance.enableFsCache;
  }

  /**
   * Get cache size in MB
   */
  getCacheSize(): number {
    return this.config.performance.cacheSize;
  }

  /**
   * Get batch size for bulk operations
   */
  getBatchSize(): number {
    return this.config.performance.batchSize;
  }

  /**
   * Check if metadata storage is enabled
   */
  isMetadataEnabled(): boolean {
    return this.config.metadata.enabled;
  }

  /**
   * Get metadata format
   */
  getMetadataFormat(): 'json' | 'yaml' | 'binary' {
    return this.config.metadata.format;
  }

  /**
   * Check if graceful degradation is enabled
   */
  isGracefulDegradationEnabled(): boolean {
    return this.config.errorHandling.gracefulDegradation;
  }

  /**
   * Get retry configuration
   */
  getRetryConfig() {
    return {
      maxRetries: this.config.errorHandling.maxRetries,
      retryDelay: this.config.errorHandling.retryDelay,
    };
  }

  /**
   * Check if fallback to memory is enabled
   */
  isFallbackToMemoryEnabled(): boolean {
    return this.config.errorHandling.fallbackToMemory;
  }

  /**
   * Check if error logging is enabled
   */
  isErrorLoggingEnabled(): boolean {
    return this.config.errorHandling.logErrors;
  }

  /**
   * Update configuration at runtime (for testing or dynamic configuration)
   */
  updateConfig(newConfig: Partial<CompressedImageConfig>): boolean {
    try {
      // Merge with existing configuration
      const updatedConfig = { ...this.config, ...newConfig };

      // Validate the updated configuration
      const validation = validateCompressedImageConfig(updatedConfig);

      if (!validation.isValid) {
        this.logger.error('Invalid configuration update:', validation.errors);
        return false;
      }

      // Apply the update
      this.config = updatedConfig;
      this.configValidation = validation;

      if (validation.warnings.length > 0) {
        this.logger.warn('Configuration update warnings:', validation.warnings);
      }

      this.logger.log('Configuration updated successfully');
      return true;

    } catch (error) {
      this.logger.error(`Failed to update configuration: ${error.message}`);
      return false;
    }
  }

  /**
   * Reset configuration to defaults
   */
  resetToDefaults(): void {
    this.config = { ...defaultCompressedImageConfig };
    this.configValidation = validateCompressedImageConfig(this.config);
    this.logger.log('Configuration reset to defaults');
  }

  /**
   * Reload configuration from environment variables
   */
  reloadConfiguration(): void {
    this.loadConfiguration();
  }

  /**
   * Get configuration summary for logging
   */
  getConfigurationSummary(): string {
    return `Compressed Image Storage Config:
  - Enabled: ${this.config.enabled}
  - Base Directory: ${this.config.baseDirectory}
  - File Naming: Hash=${this.config.fileNaming.includeHash}, Ext=${this.config.fileNaming.preserveExtension}
  - Directory Strategy: ${this.config.directoryOrganization.namingStrategy}
  - Storage Monitoring: ${this.config.storageMonitoring.enabled}
  - Max Storage: ${this.formatBytes(this.config.storageMonitoring.maxStorageSize)}
  - Max Files: ${this.config.storageMonitoring.maxFileCount}
  - Auto Cleanup: ${this.config.storageMonitoring.autoCleanup}
  - Parallel Ops: ${this.config.performance.enableParallelOps} (max: ${this.config.performance.maxConcurrentOps})
  - FS Cache: ${this.config.performance.enableFsCache} (${this.config.performance.cacheSize}MB)
  - Metadata: ${this.config.metadata.enabled} (${this.config.metadata.format})
  - Error Handling: Graceful=${this.config.errorHandling.gracefulDegradation}, Retries=${this.config.errorHandling.maxRetries}`;
  }

  /**
   * Log configuration summary
   */
  private logConfigurationSummary(): void {
    this.logger.log(this.getConfigurationSummary());
  }

  /**
   * Format bytes for human-readable display
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    if (bytes < 0) return 'Unlimited';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Validate a specific configuration section
   */
  validateConfigSection(section: keyof CompressedImageConfig, value: any): { isValid: boolean; errors: string[] } {
    const testConfig = { ...this.config };
    testConfig[section] = value;

    const validation = validateCompressedImageConfig(testConfig);
    return {
      isValid: validation.isValid,
      errors: validation.errors,
    };
  }

  /**
   * Get environment variable names used by this configuration
   */
  getEnvironmentVariables(): string[] {
    return [
      'COMPRESSED_IMAGE_STORAGE_ENABLED',
      'COMPRESSED_IMAGE_BASE_DIRECTORY',
      'COMPRESSED_IMAGE_INCLUDE_HASH',
      'COMPRESSED_IMAGE_PRESERVE_EXTENSION',
      'COMPRESSED_IMAGE_HASH_ALGORITHM',
      'COMPRESSED_IMAGE_MAX_FILENAME_LENGTH',
      'COMPRESSED_IMAGE_FILE_PREFIX',
      'COMPRESSED_IMAGE_FILE_SUFFIX',
      'COMPRESSED_IMAGE_PRESERVE_STRUCTURE',
      'COMPRESSED_IMAGE_MAX_DEPTH',
      'COMPRESSED_IMAGE_NAMING_STRATEGY',
      'COMPRESSED_IMAGE_DATE_FORMAT',
      'COMPRESSED_IMAGE_ORGANIZE_BY_TYPE',
      'COMPRESSED_IMAGE_MONITORING_ENABLED',
      'COMPRESSED_IMAGE_MAX_STORAGE_SIZE',
      'COMPRESSED_IMAGE_MAX_FILE_COUNT',
      'COMPRESSED_IMAGE_MAX_FILE_AGE',
      'COMPRESSED_IMAGE_CLEANUP_STRATEGY',
      'COMPRESSED_IMAGE_AUTO_CLEANUP',
      'COMPRESSED_IMAGE_CLEANUP_INTERVAL',
      'COMPRESSED_IMAGE_MIN_FREE_SPACE_PERCENT',
      'COMPRESSED_IMAGE_ENABLE_PARALLEL_OPS',
      'COMPRESSED_IMAGE_MAX_CONCURRENT_OPS',
      'COMPRESSED_IMAGE_ENABLE_FS_CACHE',
      'COMPRESSED_IMAGE_CACHE_SIZE',
      'COMPRESSED_IMAGE_COMPRESS_METADATA',
      'COMPRESSED_IMAGE_BATCH_SIZE',
      'COMPRESSED_IMAGE_METADATA_ENABLED',
      'COMPRESSED_IMAGE_METADATA_FORMAT',
      'COMPRESSED_IMAGE_INCLUDE_METRICS',
      'COMPRESSED_IMAGE_INCLUDE_ORIGINAL_INFO',
      'COMPRESSED_IMAGE_METADATA_COMPRESS',
      'COMPRESSED_IMAGE_GRACEFUL_DEGRADATION',
      'COMPRESSED_IMAGE_MAX_RETRIES',
      'COMPRESSED_IMAGE_RETRY_DELAY',
      'COMPRESSED_IMAGE_FALLBACK_TO_MEMORY',
      'COMPRESSED_IMAGE_LOG_ERRORS',
    ];
  }
}