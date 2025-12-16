/**
 * Compressed Image Storage Configuration
 *
 * Centralized configuration for compressed image storage and management.
 * This configuration enables efficient storage and retrieval of optimized images
 * to improve performance for future PDF generations.
 */

/**
 * File naming strategy configuration
 */
export interface FileNamingConfig {
  /** Include hash in filename for uniqueness */
  includeHash: boolean;
  /** Preserve original file extension */
  preserveExtension: boolean;
  /** Hash algorithm to use for filename generation */
  hashAlgorithm: 'md5' | 'sha1' | 'sha256';
  /** Maximum filename length */
  maxFilenameLength: number;
  /** Prefix for compressed files */
  filePrefix?: string;
  /** Suffix for compressed files */
  fileSuffix?: string;
}

/**
 * Directory organization strategy configuration
 */
export interface DirectoryOrganizationConfig {
  /** Preserve original directory structure */
  preserveStructure: boolean;
  /** Maximum directory depth */
  maxDepth: number;
  /** Directory naming strategy */
  namingStrategy: 'flat' | 'structured' | 'date-based' | 'hash-based';
  /** Date format for date-based organization (YYYY/MM/DD) */
  dateFormat?: string;
  /** Create subdirectories by file type */
  organizeByType: boolean;
  /** Subdirectory names by file type */
  typeDirectories: {
    jpeg: string;
    png: string;
    webp: string;
    other: string;
  };
}

/**
 * Storage monitoring and cleanup configuration
 */
export interface StorageMonitoringConfig {
  /** Enable storage monitoring */
  enabled: boolean;
  /** Maximum storage size in bytes (0 = unlimited) */
  maxStorageSize: number;
  /** Maximum number of files (0 = unlimited) */
  maxFileCount: number;
  /** Maximum age of files in days (0 = no age limit) */
  maxFileAge: number;
  /** Cleanup strategy when limits are exceeded */
  cleanupStrategy: 'oldest-first' | 'largest-first' | 'least-used' | 'random';
  /** Enable automatic cleanup */
  autoCleanup: boolean;
  /** Cleanup interval in hours */
  cleanupInterval: number;
  /** Minimum free space percentage to maintain */
  minFreeSpacePercent: number;
}

/**
 * Performance optimization configuration
 */
export interface PerformanceConfig {
  /** Enable parallel file operations */
  enableParallelOps: boolean;
  /** Maximum concurrent file operations */
  maxConcurrentOps: number;
  /** Enable file system caching */
  enableFsCache: boolean;
  /** Cache size in MB */
  cacheSize: number;
  /** Enable compression for metadata files */
  compressMetadata: boolean;
  /** Batch size for bulk operations */
  batchSize: number;
}

/**
 * Comprehensive compressed image storage configuration interface
 */
export interface CompressedImageConfig {
  /** Enable compressed image storage */
  enabled: boolean;
  /** Base directory for compressed images */
  baseDirectory: string;
  /** File naming configuration */
  fileNaming: FileNamingConfig;
  /** Directory organization configuration */
  directoryOrganization: DirectoryOrganizationConfig;
  /** Storage monitoring and cleanup configuration */
  storageMonitoring: StorageMonitoringConfig;
  /** Performance optimization configuration */
  performance: PerformanceConfig;
  /** Metadata storage configuration */
  metadata: {
    /** Enable metadata storage */
    enabled: boolean;
    /** Metadata file format */
    format: 'json' | 'yaml' | 'binary';
    /** Include detailed optimization metrics in metadata */
    includeMetrics: boolean;
    /** Include original image information */
    includeOriginalInfo: boolean;
    /** Compress metadata files */
    compress: boolean;
  };
  /** Error handling configuration */
  errorHandling: {
    /** Enable graceful degradation on storage errors */
    gracefulDegradation: boolean;
    /** Maximum retry attempts for storage operations */
    maxRetries: number;
    /** Retry delay in milliseconds */
    retryDelay: number;
    /** Fallback to memory storage on disk errors */
    fallbackToMemory: boolean;
    /** Log storage errors */
    logErrors: boolean;
  };
}

/**
 * Default configuration for compressed image storage
 * Optimized for performance and efficient storage management
 */
export const defaultCompressedImageConfig: CompressedImageConfig = {
  enabled: true,
  baseDirectory: 'uploads/compressed',
  fileNaming: {
    includeHash: true,
    preserveExtension: true,
    hashAlgorithm: 'md5',
    maxFilenameLength: 100,
    filePrefix: undefined,
    fileSuffix: undefined,
  },
  directoryOrganization: {
    preserveStructure: true,
    maxDepth: 5,
    namingStrategy: 'structured',
    dateFormat: 'YYYY/MM/DD',
    organizeByType: false,
    typeDirectories: {
      jpeg: 'jpeg',
      png: 'png',
      webp: 'webp',
      other: 'other',
    },
  },
  storageMonitoring: {
    enabled: true,
    maxStorageSize: 1024 * 1024 * 1024, // 1GB default limit
    maxFileCount: 10000, // 10k files default limit
    maxFileAge: 30, // 30 days default
    cleanupStrategy: 'oldest-first',
    autoCleanup: true,
    cleanupInterval: 24, // Every 24 hours
    minFreeSpacePercent: 10, // Keep 10% free space
  },
  performance: {
    enableParallelOps: true,
    maxConcurrentOps: 5,
    enableFsCache: true,
    cacheSize: 50, // 50MB cache
    compressMetadata: false,
    batchSize: 10,
  },
  metadata: {
    enabled: true,
    format: 'json',
    includeMetrics: true,
    includeOriginalInfo: true,
    compress: false,
  },
  errorHandling: {
    gracefulDegradation: true,
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    fallbackToMemory: false,
    logErrors: true,
  },
};

/**
 * Environment-based configuration factory
 * Allows customization through environment variables with proper type safety
 */
export const createCompressedImageConfig = (configService: { get<T>(key: string): T | undefined }): CompressedImageConfig => {
  // Deep clone to avoid mutating the default configuration
  const config = JSON.parse(JSON.stringify(defaultCompressedImageConfig));

  // Main settings
  const enabled = configService.get<string>('COMPRESSED_IMAGE_STORAGE_ENABLED');
  if (enabled !== undefined) {
    config.enabled = enabled === 'true';
  }

  const baseDirectory = configService.get<string>('COMPRESSED_IMAGE_BASE_DIRECTORY');
  if (baseDirectory !== undefined) {
    config.baseDirectory = baseDirectory;
  }

  // File naming settings
  const includeHash = configService.get<string>('COMPRESSED_IMAGE_INCLUDE_HASH');
  if (includeHash !== undefined) {
    config.fileNaming.includeHash = includeHash === 'true';
  }

  const preserveExtension = configService.get<string>('COMPRESSED_IMAGE_PRESERVE_EXTENSION');
  if (preserveExtension !== undefined) {
    config.fileNaming.preserveExtension = preserveExtension === 'true';
  }

  const hashAlgorithm = configService.get<string>('COMPRESSED_IMAGE_HASH_ALGORITHM');
  if (hashAlgorithm && ['md5', 'sha1', 'sha256'].includes(hashAlgorithm)) {
    config.fileNaming.hashAlgorithm = hashAlgorithm as 'md5' | 'sha1' | 'sha256';
  }

  const maxFilenameLength = configService.get<string>('COMPRESSED_IMAGE_MAX_FILENAME_LENGTH');
  if (maxFilenameLength !== undefined) {
    config.fileNaming.maxFilenameLength = parseInt(maxFilenameLength, 10);
  }

  const filePrefix = configService.get<string>('COMPRESSED_IMAGE_FILE_PREFIX');
  if (filePrefix !== undefined) {
    config.fileNaming.filePrefix = filePrefix;
  }

  const fileSuffix = configService.get<string>('COMPRESSED_IMAGE_FILE_SUFFIX');
  if (fileSuffix !== undefined) {
    config.fileNaming.fileSuffix = fileSuffix;
  }

  // Directory organization settings
  const preserveStructure = configService.get<string>('COMPRESSED_IMAGE_PRESERVE_STRUCTURE');
  if (preserveStructure !== undefined) {
    config.directoryOrganization.preserveStructure = preserveStructure === 'true';
  }

  const maxDepth = configService.get<string>('COMPRESSED_IMAGE_MAX_DEPTH');
  if (maxDepth !== undefined) {
    config.directoryOrganization.maxDepth = parseInt(maxDepth, 10);
  }

  const namingStrategy = configService.get<string>('COMPRESSED_IMAGE_NAMING_STRATEGY');
  if (namingStrategy && ['flat', 'structured', 'date-based', 'hash-based'].includes(namingStrategy)) {
    config.directoryOrganization.namingStrategy = namingStrategy as 'flat' | 'structured' | 'date-based' | 'hash-based';
  }

  const dateFormat = configService.get<string>('COMPRESSED_IMAGE_DATE_FORMAT');
  if (dateFormat !== undefined) {
    config.directoryOrganization.dateFormat = dateFormat;
  }

  const organizeByType = configService.get<string>('COMPRESSED_IMAGE_ORGANIZE_BY_TYPE');
  if (organizeByType !== undefined) {
    config.directoryOrganization.organizeByType = organizeByType === 'true';
  }

  // Storage monitoring settings
  const monitoringEnabled = configService.get<string>('COMPRESSED_IMAGE_MONITORING_ENABLED');
  if (monitoringEnabled !== undefined) {
    config.storageMonitoring.enabled = monitoringEnabled === 'true';
  }

  const maxStorageSize = configService.get<string>('COMPRESSED_IMAGE_MAX_STORAGE_SIZE');
  if (maxStorageSize !== undefined) {
    config.storageMonitoring.maxStorageSize = parseInt(maxStorageSize, 10);
  }

  const maxFileCount = configService.get<string>('COMPRESSED_IMAGE_MAX_FILE_COUNT');
  if (maxFileCount !== undefined) {
    config.storageMonitoring.maxFileCount = parseInt(maxFileCount, 10);
  }

  const maxFileAge = configService.get<string>('COMPRESSED_IMAGE_MAX_FILE_AGE');
  if (maxFileAge !== undefined) {
    config.storageMonitoring.maxFileAge = parseInt(maxFileAge, 10);
  }

  const cleanupStrategy = configService.get<string>('COMPRESSED_IMAGE_CLEANUP_STRATEGY');
  if (cleanupStrategy && ['oldest-first', 'largest-first', 'least-used', 'random'].includes(cleanupStrategy)) {
    config.storageMonitoring.cleanupStrategy = cleanupStrategy as 'oldest-first' | 'largest-first' | 'least-used' | 'random';
  }

  const autoCleanup = configService.get<string>('COMPRESSED_IMAGE_AUTO_CLEANUP');
  if (autoCleanup !== undefined) {
    config.storageMonitoring.autoCleanup = autoCleanup === 'true';
  }

  const cleanupInterval = configService.get<string>('COMPRESSED_IMAGE_CLEANUP_INTERVAL');
  if (cleanupInterval !== undefined) {
    config.storageMonitoring.cleanupInterval = parseInt(cleanupInterval, 10);
  }

  const minFreeSpacePercent = configService.get<string>('COMPRESSED_IMAGE_MIN_FREE_SPACE_PERCENT');
  if (minFreeSpacePercent !== undefined) {
    config.storageMonitoring.minFreeSpacePercent = parseInt(minFreeSpacePercent, 10);
  }

  // Performance settings
  const enableParallelOps = configService.get<string>('COMPRESSED_IMAGE_ENABLE_PARALLEL_OPS');
  if (enableParallelOps !== undefined) {
    config.performance.enableParallelOps = enableParallelOps === 'true';
  }

  const maxConcurrentOps = configService.get<string>('COMPRESSED_IMAGE_MAX_CONCURRENT_OPS');
  if (maxConcurrentOps !== undefined) {
    config.performance.maxConcurrentOps = parseInt(maxConcurrentOps, 10);
  }

  const enableFsCache = configService.get<string>('COMPRESSED_IMAGE_ENABLE_FS_CACHE');
  if (enableFsCache !== undefined) {
    config.performance.enableFsCache = enableFsCache === 'true';
  }

  const cacheSize = configService.get<string>('COMPRESSED_IMAGE_CACHE_SIZE');
  if (cacheSize !== undefined) {
    config.performance.cacheSize = parseInt(cacheSize, 10);
  }

  const compressMetadata = configService.get<string>('COMPRESSED_IMAGE_COMPRESS_METADATA');
  if (compressMetadata !== undefined) {
    config.performance.compressMetadata = compressMetadata === 'true';
  }

  const batchSize = configService.get<string>('COMPRESSED_IMAGE_BATCH_SIZE');
  if (batchSize !== undefined) {
    config.performance.batchSize = parseInt(batchSize, 10);
  }

  // Metadata settings
  const metadataEnabled = configService.get<string>('COMPRESSED_IMAGE_METADATA_ENABLED');
  if (metadataEnabled !== undefined) {
    config.metadata.enabled = metadataEnabled === 'true';
  }

  const metadataFormat = configService.get<string>('COMPRESSED_IMAGE_METADATA_FORMAT');
  if (metadataFormat && ['json', 'yaml', 'binary'].includes(metadataFormat)) {
    config.metadata.format = metadataFormat as 'json' | 'yaml' | 'binary';
  }

  const includeMetrics = configService.get<string>('COMPRESSED_IMAGE_INCLUDE_METRICS');
  if (includeMetrics !== undefined) {
    config.metadata.includeMetrics = includeMetrics === 'true';
  }

  const includeOriginalInfo = configService.get<string>('COMPRESSED_IMAGE_INCLUDE_ORIGINAL_INFO');
  if (includeOriginalInfo !== undefined) {
    config.metadata.includeOriginalInfo = includeOriginalInfo === 'true';
  }

  const metadataCompress = configService.get<string>('COMPRESSED_IMAGE_METADATA_COMPRESS');
  if (metadataCompress !== undefined) {
    config.metadata.compress = metadataCompress === 'true';
  }

  // Error handling settings
  const gracefulDegradation = configService.get<string>('COMPRESSED_IMAGE_GRACEFUL_DEGRADATION');
  if (gracefulDegradation !== undefined) {
    config.errorHandling.gracefulDegradation = gracefulDegradation === 'true';
  }

  const maxRetries = configService.get<string>('COMPRESSED_IMAGE_MAX_RETRIES');
  if (maxRetries !== undefined) {
    config.errorHandling.maxRetries = parseInt(maxRetries, 10);
  }

  const retryDelay = configService.get<string>('COMPRESSED_IMAGE_RETRY_DELAY');
  if (retryDelay !== undefined) {
    config.errorHandling.retryDelay = parseInt(retryDelay, 10);
  }

  const fallbackToMemory = configService.get<string>('COMPRESSED_IMAGE_FALLBACK_TO_MEMORY');
  if (fallbackToMemory !== undefined) {
    config.errorHandling.fallbackToMemory = fallbackToMemory === 'true';
  }

  const logErrors = configService.get<string>('COMPRESSED_IMAGE_LOG_ERRORS');
  if (logErrors !== undefined) {
    config.errorHandling.logErrors = logErrors === 'true';
  }

  return config;
};

/**
 * Validation function for compressed image configuration
 * Ensures all configuration values are within acceptable ranges and logically consistent
 */
export const validateCompressedImageConfig = (config: CompressedImageConfig): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate base directory
  if (!config.baseDirectory || config.baseDirectory.trim().length === 0) {
    errors.push('Base directory cannot be empty');
  }

  // Validate file naming settings
  if (config.fileNaming.maxFilenameLength <= 0) {
    errors.push('Maximum filename length must be greater than 0');
  }
  if (config.fileNaming.maxFilenameLength < 20) {
    warnings.push('Very short filename length may cause naming conflicts');
  }

  // Validate directory organization
  if (config.directoryOrganization.maxDepth < 0) {
    errors.push('Maximum directory depth cannot be negative');
  }
  if (config.directoryOrganization.maxDepth > 10) {
    warnings.push('Very deep directory structure may impact performance');
  }

  // Validate storage monitoring
  if (config.storageMonitoring.maxStorageSize < 0) {
    errors.push('Maximum storage size cannot be negative');
  }
  if (config.storageMonitoring.maxFileCount < 0) {
    errors.push('Maximum file count cannot be negative');
  }
  if (config.storageMonitoring.maxFileAge < 0) {
    errors.push('Maximum file age cannot be negative');
  }
  if (config.storageMonitoring.cleanupInterval <= 0) {
    errors.push('Cleanup interval must be greater than 0');
  }
  if (config.storageMonitoring.minFreeSpacePercent < 0 || config.storageMonitoring.minFreeSpacePercent > 100) {
    errors.push('Minimum free space percentage must be between 0 and 100');
  }

  // Validate performance settings
  if (config.performance.maxConcurrentOps <= 0) {
    errors.push('Maximum concurrent operations must be greater than 0');
  }
  if (config.performance.maxConcurrentOps > 20) {
    warnings.push('Very high concurrent operations may impact system performance');
  }
  if (config.performance.cacheSize < 0) {
    errors.push('Cache size cannot be negative');
  }
  if (config.performance.batchSize <= 0) {
    errors.push('Batch size must be greater than 0');
  }

  // Validate error handling
  if (config.errorHandling.maxRetries < 0) {
    errors.push('Maximum retries cannot be negative');
  }
  if (config.errorHandling.retryDelay < 0) {
    errors.push('Retry delay cannot be negative');
  }

  // Logical consistency checks
  if (config.storageMonitoring.enabled && config.storageMonitoring.maxStorageSize === 0 && config.storageMonitoring.maxFileCount === 0) {
    warnings.push('Storage monitoring is enabled but no limits are set');
  }

  if (config.performance.enableParallelOps && config.performance.maxConcurrentOps === 1) {
    warnings.push('Parallel operations enabled but limited to 1 concurrent operation');
  }

  if (config.metadata.enabled && config.metadata.compress && config.performance.compressMetadata) {
    warnings.push('Metadata compression is configured in multiple places');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Helper function to get storage metrics configuration
 */
export const getStorageMetricsConfig = (config: CompressedImageConfig) => {
  return {
    enabled: config.storageMonitoring.enabled,
    includeMetrics: config.metadata.includeMetrics,
    trackUsage: config.storageMonitoring.enabled,
    trackPerformance: config.performance.enableFsCache,
  };
};

/**
 * Helper function to get directory path based on organization strategy
 */
export const getDirectoryPath = (
  config: CompressedImageConfig,
  originalPath: string,
  fileType: 'jpeg' | 'png' | 'webp' | 'other' = 'other'
): string => {
  let basePath = config.baseDirectory;

  switch (config.directoryOrganization.namingStrategy) {
    case 'flat':
      return basePath;

    case 'structured':
      if (config.directoryOrganization.preserveStructure) {
        const pathParts = originalPath.split('/').slice(0, -1); // Remove filename
        const limitedParts = pathParts.slice(0, config.directoryOrganization.maxDepth);
        basePath = [basePath, ...limitedParts].join('/');
      }
      break;

    case 'date-based':
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      basePath = `${basePath}/${year}/${month}/${day}`;
      break;

    case 'hash-based':
      const hash = require('crypto').createHash('md5').update(originalPath).digest('hex');
      basePath = `${basePath}/${hash.substring(0, 2)}/${hash.substring(2, 4)}`;
      break;
  }

  if (config.directoryOrganization.organizeByType) {
    const typeDir = config.directoryOrganization.typeDirectories[fileType];
    basePath = `${basePath}/${typeDir}`;
  }

  return basePath;
};