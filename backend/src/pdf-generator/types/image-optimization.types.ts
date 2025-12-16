/**
 * TypeScript interfaces for image optimization system
 * Defines types for optimization results, metrics, and validation
 */

/**
 * Result of image optimization operation
 */
export interface OptimizedImageResult {
  /** Optimized image data as Buffer */
  optimizedBuffer?: Buffer;
  /** Original image size in bytes */
  originalSize: number;
  /** Optimized image size in bytes */
  optimizedSize: number;
  /** Compression ratio (0-1, where 0.5 means 50% size reduction) */
  compressionRatio: number;
  /** Dimensions information */
  dimensions: {
    original: { width: number; height: number };
    optimized: { width: number; height: number };
  };
  /** Final output format */
  format: string;
  /** Processing time in milliseconds */
  processingTime: number;
  /** Error message if optimization failed */
  error?: string;
  /** Optimization metadata */
  metadata: {
    /** Content type detected (text, photo, graphics, logo) */
    contentType: 'text' | 'photo' | 'graphics' | 'logo';
    /** Quality setting used */
    qualityUsed: number;
    /** Whether format conversion was applied */
    formatConverted: boolean;
    /** Original format */
    originalFormat: string;
    /** Optimization technique applied */
    technique: 'aggressive' | 'standard' | 'fallback' | 'comprehensive';
  };
}

/**
 * Validation result for optimized images
 */
export interface ValidationResult {
  /** Whether the optimization is valid */
  isValid: boolean;
  /** Whether aspect ratio was preserved */
  aspectRatioPreserved: boolean;
  /** Whether dimensions are within acceptable range */
  dimensionsCorrect: boolean;
  /** Whether quality is acceptable */
  qualityAcceptable: boolean;
  /** List of validation errors */
  errors: string[];
  /** List of validation warnings */
  warnings: string[];
  /** Validation metadata */
  metadata: {
    /** Original aspect ratio */
    originalAspectRatio: number;
    /** Optimized aspect ratio */
    optimizedAspectRatio: number;
    /** Aspect ratio tolerance used */
    aspectRatioTolerance: number;
    /** Size reduction percentage */
    sizeReductionPercentage: number;
  };
}

/**
 * Optimization metrics for monitoring and analysis
 */
export interface OptimizationMetrics {
  /** Total number of images processed */
  totalImagesProcessed: number;
  /** Number of successful optimizations */
  successfulOptimizations: number;
  /** Number of failed optimizations */
  failedOptimizations: number;
  /** Total original size of all images */
  totalOriginalSize: number;
  /** Total optimized size of all images */
  totalOptimizedSize: number;
  /** Overall compression ratio */
  overallCompressionRatio: number;
  /** Average processing time per image */
  averageProcessingTime: number;
  /** Total processing time */
  totalProcessingTime: number;
  /** Breakdown by format */
  formatBreakdown: {
    [format: string]: {
      count: number;
      originalSize: number;
      optimizedSize: number;
      compressionRatio: number;
    };
  };
  /** Breakdown by content type */
  contentTypeBreakdown: {
    [contentType: string]: {
      count: number;
      originalSize: number;
      optimizedSize: number;
      compressionRatio: number;
    };
  };
  /** Error breakdown */
  errorBreakdown: {
    [errorType: string]: number;
  };
  /** Timestamp when metrics were collected */
  timestamp: Date;
}

/**
 * Enhanced order PDF data with optimization metadata
 */
export interface OptimizedOrderPDFData {
  /** Original order data */
  orderData: any; // This would be the existing OrderPDFData type
  /** Optimization metadata */
  optimizationMetadata: {
    /** Total original size of all images */
    totalOriginalSize: number;
    /** Total optimized size of all images */
    totalOptimizedSize: number;
    /** Overall compression ratio */
    compressionRatio: number;
    /** Number of images optimized */
    optimizedImages: number;
    /** Number of optimization failures */
    failedOptimizations: number;
    /** Total processing time for all optimizations */
    processingTime: number;
    /** List of optimization operations performed */
    operations: Array<{
      imageType: 'product' | 'logo' | 'qr_code' | 'other';
      originalSize: number;
      optimizedSize: number;
      compressionRatio: number;
      format: string;
      success: boolean;
      error?: string;
    }>;
    /** Configuration used for optimization */
    configurationUsed: {
      aggressiveMode: boolean;
      maxDimensions: { width: number; height: number };
      qualitySettings: { [format: string]: number };
      compressionLevel: string;
    };
  };
}

/**
 * Batch optimization result for multiple images
 */
export interface BatchOptimizationResult {
  /** Individual optimization results */
  results: OptimizedImageResult[];
  /** Overall batch metrics */
  batchMetrics: OptimizationMetrics;
  /** Batch processing summary */
  summary: {
    /** Total images in batch */
    totalImages: number;
    /** Successfully processed images */
    successfulImages: number;
    /** Failed images */
    failedImages: number;
    /** Total size reduction achieved */
    totalSizeReduction: number;
    /** Average compression ratio */
    averageCompressionRatio: number;
    /** Total batch processing time */
    totalProcessingTime: number;
  };
  /** Batch configuration used */
  configurationSnapshot: any; // ImageOptimizationConfig type
}

/**
 * Image analysis result for content-aware optimization
 */
export interface ImageAnalysisResult {
  /** Detected content type */
  contentType: 'text' | 'photo' | 'graphics' | 'logo';
  /** Confidence score for content type detection (0-1) */
  confidence: number;
  /** Image characteristics */
  characteristics: {
    /** Whether image contains text */
    hasText: boolean;
    /** Whether image is primarily photographic */
    isPhotographic: boolean;
    /** Whether image has transparency */
    hasTransparency: boolean;
    /** Color complexity (number of unique colors) */
    colorComplexity: number;
    /** Edge density (measure of detail/sharpness) */
    edgeDensity: number;
  };
  /** Recommended optimization settings */
  recommendations: {
    /** Recommended quality setting */
    quality: number;
    /** Recommended format */
    format: 'jpeg' | 'png' | 'webp';
    /** Whether aggressive optimization is suitable */
    allowAggressive: boolean;
    /** Special considerations */
    considerations: string[];
  };
}

/**
 * Fallback operation result
 */
export interface FallbackResult {
  /** Whether fallback was triggered */
  fallbackTriggered: boolean;
  /** Reason for fallback */
  fallbackReason: string;
  /** Fallback strategy used */
  fallbackStrategy: 'original_image' | 'reduced_quality' | 'format_conversion' | 'dimension_reduction' | 'basic_compression';
  /** Result after fallback */
  result?: OptimizedImageResult;
  /** Number of retry attempts made */
  retryAttempts: number;
  /** Final success status */
  success: boolean;
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  /** Whether configuration is valid */
  isValid: boolean;
  /** Configuration errors */
  errors: string[];
  /** Configuration warnings */
  warnings: string[];
  /** Validated configuration (with corrections applied) */
  validatedConfig?: any; // ImageOptimizationConfig type
  /** Validation metadata */
  metadata: {
    /** Validation timestamp */
    timestamp: Date;
    /** Configuration source */
    source: 'default' | 'environment' | 'custom';
    /** Applied corrections */
    corrections: string[];
  };
}

/**
 * Performance monitoring data
 */
export interface PerformanceMonitoringData {
  /** Operation identifier */
  operationId: string;
  /** Operation type */
  operationType: 'single_image' | 'batch_images' | 'pdf_generation';
  /** Start timestamp */
  startTime: Date;
  /** End timestamp */
  endTime: Date;
  /** Duration in milliseconds */
  duration: number;
  /** Memory usage data */
  memoryUsage: {
    /** Peak memory usage in bytes */
    peak: number;
    /** Average memory usage in bytes */
    average: number;
    /** Memory usage at start */
    start: number;
    /** Memory usage at end */
    end: number;
  };
  /** CPU usage data */
  cpuUsage: {
    /** CPU time used in milliseconds */
    cpuTime: number;
    /** CPU utilization percentage */
    utilization: number;
  };
  /** I/O statistics */
  ioStats: {
    /** Bytes read */
    bytesRead: number;
    /** Bytes written */
    bytesWritten: number;
    /** Number of read operations */
    readOperations: number;
    /** Number of write operations */
    writeOperations: number;
  };
  /** Success/failure status */
  success: boolean;
  /** Error information if failed */
  error?: string;
}