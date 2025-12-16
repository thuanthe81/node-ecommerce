/**
 * Image Optimization Configuration
 *
 * Centralized configuration for aggressive image optimization in PDF generation.
 * This configuration enables maximum size reduction while maintaining acceptable visual quality.
 */

/**
 * Aggressive scaling options for image optimization
 */
export interface AggressiveScalingOptions {
  /** Maximum width in pixels for optimized images */
  maxWidth: number;
  /** Maximum height in pixels for optimized images */
  maxHeight: number;
  /** Minimum width in pixels to prevent over-compression */
  minWidth: number;
  /** Minimum height in pixels to prevent over-compression */
  minHeight: number;
  /** Whether to maintain aspect ratio during scaling */
  maintainAspectRatio: boolean;
  /** Quality range for dynamic quality adjustment */
  qualityRange: { min: number; max: number };
  /** Target output format for optimization */
  format: 'jpeg' | 'png' | 'webp';
  /** Enable content-aware optimization */
  contentAware: boolean;
}

/**
 * Format-specific optimization settings
 */
export interface FormatOptimizationSettings {
  /** Minimum quality setting (0-100) */
  min: number;
  /** Maximum quality setting (0-100) */
  max: number;
  /** Default quality setting (0-100) */
  default: number;
  /** Enable progressive encoding for supported formats */
  progressive?: boolean;
  /** Enable lossless compression where applicable */
  lossless?: boolean;
}

/**
 * Comprehensive image optimization configuration interface
 */
export interface ImageOptimizationConfig {
  /** Aggressive mode settings for maximum size reduction */
  aggressiveMode: {
    /** Enable aggressive optimization */
    enabled: boolean;
    /** Maximum dimensions for aggressive scaling */
    maxDimensions: {
      width: number;
      height: number;
    };
    /** Minimum dimensions to prevent over-compression */
    minDimensions: {
      width: number;
      height: number;
    };
    /** Force optimization even for small images */
    forceOptimization: boolean;
  };
  /** Quality settings per image format */
  quality: {
    jpeg: FormatOptimizationSettings;
    png: FormatOptimizationSettings;
    webp: FormatOptimizationSettings;
  };
  /** Compression settings */
  compression: {
    /** Enable compression */
    enabled: boolean;
    /** Compression level for maximum size reduction */
    level: 'maximum' | 'high' | 'medium' | 'low';
    /** Enable format conversion for better compression */
    enableFormatConversion: boolean;
    /** Preferred format for conversion */
    preferredFormat: 'jpeg' | 'png' | 'webp';
  };
  /** Fallback behavior configuration */
  fallback: {
    /** Enable fallback to original image on optimization failure */
    enabled: boolean;
    /** Maximum retry attempts for optimization */
    maxRetries: number;
    /** Timeout for optimization operations (milliseconds) */
    timeoutMs: number;
  };
  /** Performance monitoring settings */
  monitoring: {
    /** Enable optimization metrics collection */
    enabled: boolean;
    /** Track processing time */
    trackProcessingTime: boolean;
    /** Track compression ratios */
    trackCompressionRatio: boolean;
    /** Track file size reductions */
    trackSizeReduction: boolean;
  };
  /** Content-aware optimization settings */
  contentAware: {
    /** Enable content-aware optimization */
    enabled: boolean;
    /** Different quality settings based on image content type */
    contentTypes: {
      /** Settings for images containing text */
      text: { quality: number; preserveSharpness: boolean };
      /** Settings for photographic content */
      photo: { quality: number; allowAggressive: boolean };
      /** Settings for graphics and illustrations */
      graphics: { quality: number; preserveColors: boolean };
      /** Settings for logos and branding */
      logo: { quality: number; maintainCrisp: boolean };
    };
  };
}

/**
 * Default configuration for aggressive image optimization
 * Optimized for maximum size reduction while maintaining document usability
 */
export const defaultImageOptimizationConfig: ImageOptimizationConfig = {
  aggressiveMode: {
    enabled: true,
    maxDimensions: {
      width: 300,  // Aggressive maximum width for PDF images
      height: 300, // Aggressive maximum height for PDF images
    },
    minDimensions: {
      width: 50,   // Minimum width to maintain readability
      height: 50,  // Minimum height to maintain readability
    },
    forceOptimization: true, // Optimize all images regardless of original size
  },
  quality: {
    jpeg: {
      min: 40,      // Aggressive minimum quality for maximum compression
      max: 75,      // Maximum quality to balance size and visual quality
      default: 60,  // Default quality for aggressive optimization
      progressive: true,
    },
    png: {
      min: 50,      // PNG minimum quality
      max: 80,      // PNG maximum quality
      default: 65,  // PNG default quality
      lossless: false, // Disable lossless for size reduction
    },
    webp: {
      min: 45,      // WebP minimum quality for best compression
      max: 80,      // WebP maximum quality
      default: 65,  // WebP default quality
      lossless: false,
    },
  },
  compression: {
    enabled: true,
    level: 'maximum', // Maximum compression level
    enableFormatConversion: true,
    preferredFormat: 'jpeg', // JPEG typically provides best compression for photos
  },
  fallback: {
    enabled: true,
    maxRetries: 3,
    timeoutMs: 10000, // 10 second timeout for optimization
  },
  monitoring: {
    enabled: true,
    trackProcessingTime: true,
    trackCompressionRatio: true,
    trackSizeReduction: true,
  },
  contentAware: {
    enabled: true,
    contentTypes: {
      text: {
        quality: 70, // Higher quality for text readability
        preserveSharpness: true,
      },
      photo: {
        quality: 55, // Lower quality acceptable for photos
        allowAggressive: true,
      },
      graphics: {
        quality: 65, // Balanced quality for graphics
        preserveColors: true,
      },
      logo: {
        quality: 75, // Higher quality for branding elements
        maintainCrisp: true,
      },
    },
  },
};

/**
 * Environment-based configuration overrides (Legacy)
 * @deprecated Use ConfigService integration in PDFCompressionService instead
 * Allows customization through environment variables
 */
export const getImageOptimizationConfig = (): ImageOptimizationConfig => {
  const config = { ...defaultImageOptimizationConfig };

  // Override with environment variables if present
  if (process.env.IMAGE_OPTIMIZATION_ENABLED !== undefined) {
    config.aggressiveMode.enabled = process.env.IMAGE_OPTIMIZATION_ENABLED === 'true';
  }

  if (process.env.IMAGE_MAX_WIDTH) {
    config.aggressiveMode.maxDimensions.width = parseInt(process.env.IMAGE_MAX_WIDTH, 10);
  }

  if (process.env.IMAGE_MAX_HEIGHT) {
    config.aggressiveMode.maxDimensions.height = parseInt(process.env.IMAGE_MAX_HEIGHT, 10);
  }

  if (process.env.IMAGE_MIN_WIDTH) {
    config.aggressiveMode.minDimensions.width = parseInt(process.env.IMAGE_MIN_WIDTH, 10);
  }

  if (process.env.IMAGE_MIN_HEIGHT) {
    config.aggressiveMode.minDimensions.height = parseInt(process.env.IMAGE_MIN_HEIGHT, 10);
  }

  if (process.env.IMAGE_JPEG_QUALITY) {
    const quality = parseInt(process.env.IMAGE_JPEG_QUALITY, 10);
    config.quality.jpeg.default = quality;
  }

  if (process.env.IMAGE_PNG_QUALITY) {
    const quality = parseInt(process.env.IMAGE_PNG_QUALITY, 10);
    config.quality.png.default = quality;
  }

  if (process.env.IMAGE_WEBP_QUALITY) {
    const quality = parseInt(process.env.IMAGE_WEBP_QUALITY, 10);
    config.quality.webp.default = quality;
  }

  if (process.env.IMAGE_COMPRESSION_LEVEL) {
    const level = process.env.IMAGE_COMPRESSION_LEVEL as 'maximum' | 'high' | 'medium' | 'low';
    if (['maximum', 'high', 'medium', 'low'].includes(level)) {
      config.compression.level = level;
    }
  }

  if (process.env.IMAGE_PREFERRED_FORMAT) {
    const format = process.env.IMAGE_PREFERRED_FORMAT as 'jpeg' | 'png' | 'webp';
    if (['jpeg', 'png', 'webp'].includes(format)) {
      config.compression.preferredFormat = format;
    }
  }

  if (process.env.IMAGE_OPTIMIZATION_TIMEOUT) {
    config.fallback.timeoutMs = parseInt(process.env.IMAGE_OPTIMIZATION_TIMEOUT, 10);
  }

  if (process.env.IMAGE_OPTIMIZATION_RETRIES) {
    config.fallback.maxRetries = parseInt(process.env.IMAGE_OPTIMIZATION_RETRIES, 10);
  }

  return config;
};

/**
 * Configuration factory for use with NestJS ConfigService
 * Provides type-safe configuration loading with validation
 * @param configService - NestJS ConfigService instance
 * @returns ImageOptimizationConfig with values from ConfigService
 */
export const createImageOptimizationConfig = (configService: { get<T>(key: string): T | undefined }): ImageOptimizationConfig => {
  // Use deep clone to avoid mutating the default configuration
  const config = JSON.parse(JSON.stringify(defaultImageOptimizationConfig));

  // Override with environment variables using ConfigService
  const enabled = configService.get<string>('IMAGE_OPTIMIZATION_ENABLED');
  if (enabled !== undefined) {
    config.aggressiveMode.enabled = enabled === 'true';
  }

  const maxWidth = configService.get<string>('IMAGE_MAX_WIDTH');
  if (maxWidth !== undefined) {
    config.aggressiveMode.maxDimensions.width = parseInt(maxWidth, 10);
  }

  const maxHeight = configService.get<string>('IMAGE_MAX_HEIGHT');
  if (maxHeight !== undefined) {
    config.aggressiveMode.maxDimensions.height = parseInt(maxHeight, 10);
  }

  const minWidth = configService.get<string>('IMAGE_MIN_WIDTH');
  if (minWidth !== undefined) {
    config.aggressiveMode.minDimensions.width = parseInt(minWidth, 10);
  }

  const minHeight = configService.get<string>('IMAGE_MIN_HEIGHT');
  if (minHeight !== undefined) {
    config.aggressiveMode.minDimensions.height = parseInt(minHeight, 10);
  }

  const forceOptimization = configService.get<string>('IMAGE_FORCE_OPTIMIZATION');
  if (forceOptimization !== undefined) {
    config.aggressiveMode.forceOptimization = forceOptimization === 'true';
  }

  // Quality settings
  const jpegQuality = configService.get<string>('IMAGE_JPEG_QUALITY');
  if (jpegQuality !== undefined) {
    config.quality.jpeg.default = parseInt(jpegQuality, 10);
  }

  const jpegMinQuality = configService.get<string>('IMAGE_JPEG_MIN_QUALITY');
  if (jpegMinQuality !== undefined) {
    config.quality.jpeg.min = parseInt(jpegMinQuality, 10);
  }

  const jpegMaxQuality = configService.get<string>('IMAGE_JPEG_MAX_QUALITY');
  if (jpegMaxQuality !== undefined) {
    config.quality.jpeg.max = parseInt(jpegMaxQuality, 10);
  }

  const pngQuality = configService.get<string>('IMAGE_PNG_QUALITY');
  if (pngQuality !== undefined) {
    config.quality.png.default = parseInt(pngQuality, 10);
  }

  const pngMinQuality = configService.get<string>('IMAGE_PNG_MIN_QUALITY');
  if (pngMinQuality !== undefined) {
    config.quality.png.min = parseInt(pngMinQuality, 10);
  }

  const pngMaxQuality = configService.get<string>('IMAGE_PNG_MAX_QUALITY');
  if (pngMaxQuality !== undefined) {
    config.quality.png.max = parseInt(pngMaxQuality, 10);
  }

  const webpQuality = configService.get<string>('IMAGE_WEBP_QUALITY');
  if (webpQuality !== undefined) {
    config.quality.webp.default = parseInt(webpQuality, 10);
  }

  const webpMinQuality = configService.get<string>('IMAGE_WEBP_MIN_QUALITY');
  if (webpMinQuality !== undefined) {
    config.quality.webp.min = parseInt(webpMinQuality, 10);
  }

  const webpMaxQuality = configService.get<string>('IMAGE_WEBP_MAX_QUALITY');
  if (webpMaxQuality !== undefined) {
    config.quality.webp.max = parseInt(webpMaxQuality, 10);
  }

  // Compression settings
  const compressionEnabled = configService.get<string>('IMAGE_COMPRESSION_ENABLED');
  if (compressionEnabled !== undefined) {
    config.compression.enabled = compressionEnabled === 'true';
  }

  const compressionLevel = configService.get<string>('IMAGE_COMPRESSION_LEVEL');
  if (compressionLevel && ['maximum', 'high', 'medium', 'low'].includes(compressionLevel)) {
    config.compression.level = compressionLevel as 'maximum' | 'high' | 'medium' | 'low';
  }

  const enableFormatConversion = configService.get<string>('IMAGE_ENABLE_FORMAT_CONVERSION');
  if (enableFormatConversion !== undefined) {
    config.compression.enableFormatConversion = enableFormatConversion === 'true';
  }

  const preferredFormat = configService.get<string>('IMAGE_PREFERRED_FORMAT');
  if (preferredFormat && ['jpeg', 'png', 'webp'].includes(preferredFormat)) {
    config.compression.preferredFormat = preferredFormat as 'jpeg' | 'png' | 'webp';
  }

  // Fallback settings
  const fallbackEnabled = configService.get<string>('IMAGE_FALLBACK_ENABLED');
  if (fallbackEnabled !== undefined) {
    config.fallback.enabled = fallbackEnabled === 'true';
  }

  const maxRetries = configService.get<string>('IMAGE_OPTIMIZATION_RETRIES');
  if (maxRetries !== undefined) {
    config.fallback.maxRetries = parseInt(maxRetries, 10);
  }

  const timeoutMs = configService.get<string>('IMAGE_OPTIMIZATION_TIMEOUT');
  if (timeoutMs !== undefined) {
    config.fallback.timeoutMs = parseInt(timeoutMs, 10);
  }

  // Monitoring settings
  const monitoringEnabled = configService.get<string>('IMAGE_MONITORING_ENABLED');
  if (monitoringEnabled !== undefined) {
    config.monitoring.enabled = monitoringEnabled === 'true';
  }

  const trackProcessingTime = configService.get<string>('IMAGE_TRACK_PROCESSING_TIME');
  if (trackProcessingTime !== undefined) {
    config.monitoring.trackProcessingTime = trackProcessingTime === 'true';
  }

  const trackCompressionRatio = configService.get<string>('IMAGE_TRACK_COMPRESSION_RATIO');
  if (trackCompressionRatio !== undefined) {
    config.monitoring.trackCompressionRatio = trackCompressionRatio === 'true';
  }

  const trackSizeReduction = configService.get<string>('IMAGE_TRACK_SIZE_REDUCTION');
  if (trackSizeReduction !== undefined) {
    config.monitoring.trackSizeReduction = trackSizeReduction === 'true';
  }

  // Content-aware settings
  const contentAwareEnabled = configService.get<string>('IMAGE_CONTENT_AWARE_ENABLED');
  if (contentAwareEnabled !== undefined) {
    config.contentAware.enabled = contentAwareEnabled === 'true';
  }

  // Content type specific quality settings
  const textQuality = configService.get<string>('IMAGE_TEXT_QUALITY');
  if (textQuality !== undefined) {
    config.contentAware.contentTypes.text.quality = parseInt(textQuality, 10);
  }

  const photoQuality = configService.get<string>('IMAGE_PHOTO_QUALITY');
  if (photoQuality !== undefined) {
    config.contentAware.contentTypes.photo.quality = parseInt(photoQuality, 10);
  }

  const graphicsQuality = configService.get<string>('IMAGE_GRAPHICS_QUALITY');
  if (graphicsQuality !== undefined) {
    config.contentAware.contentTypes.graphics.quality = parseInt(graphicsQuality, 10);
  }

  const logoQuality = configService.get<string>('IMAGE_LOGO_QUALITY');
  if (logoQuality !== undefined) {
    config.contentAware.contentTypes.logo.quality = parseInt(logoQuality, 10);
  }

  return config;
};

/**
 * Validation function for image optimization configuration
 * Ensures all configuration values are within acceptable ranges
 */
export const validateImageOptimizationConfig = (config: ImageOptimizationConfig): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate dimensions
  if (config.aggressiveMode.maxDimensions.width <= 0) {
    errors.push('Maximum width must be greater than 0');
  }
  if (config.aggressiveMode.maxDimensions.height <= 0) {
    errors.push('Maximum height must be greater than 0');
  }
  if (config.aggressiveMode.minDimensions.width <= 0) {
    errors.push('Minimum width must be greater than 0');
  }
  if (config.aggressiveMode.minDimensions.height <= 0) {
    errors.push('Minimum height must be greater than 0');
  }

  // Validate dimension relationships
  if (config.aggressiveMode.maxDimensions.width < config.aggressiveMode.minDimensions.width) {
    errors.push('Maximum width cannot be less than minimum width');
  }
  if (config.aggressiveMode.maxDimensions.height < config.aggressiveMode.minDimensions.height) {
    errors.push('Maximum height cannot be less than minimum height');
  }

  // Validate quality settings
  const validateQuality = (format: string, settings: FormatOptimizationSettings) => {
    if (settings.min < 0 || settings.min > 100) {
      errors.push(`${format} minimum quality must be between 0 and 100`);
    }
    if (settings.max < 0 || settings.max > 100) {
      errors.push(`${format} maximum quality must be between 0 and 100`);
    }
    if (settings.default < 0 || settings.default > 100) {
      errors.push(`${format} default quality must be between 0 and 100`);
    }
    if (settings.min > settings.max) {
      errors.push(`${format} minimum quality cannot be greater than maximum quality`);
    }
    if (settings.default < settings.min || settings.default > settings.max) {
      errors.push(`${format} default quality must be between minimum and maximum quality`);
    }
  };

  validateQuality('JPEG', config.quality.jpeg);
  validateQuality('PNG', config.quality.png);
  validateQuality('WebP', config.quality.webp);

  // Validate timeout and retries
  if (config.fallback.timeoutMs <= 0) {
    errors.push('Timeout must be greater than 0');
  }
  if (config.fallback.maxRetries < 0) {
    errors.push('Maximum retries cannot be negative');
  }

  // Warnings for potentially problematic settings
  if (config.aggressiveMode.maxDimensions.width < 100 || config.aggressiveMode.maxDimensions.height < 100) {
    warnings.push('Very small maximum dimensions may result in unreadable images');
  }
  if (config.quality.jpeg.default < 50) {
    warnings.push('Very low JPEG quality may result in poor visual quality');
  }
  if (config.fallback.timeoutMs < 5000) {
    warnings.push('Short timeout may cause optimization failures for large images');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Helper function to get aggressive scaling options from configuration
 */
export const getAggressiveScalingOptions = (
  config: ImageOptimizationConfig,
  contentType: 'text' | 'photo' | 'graphics' | 'logo' = 'photo'
): AggressiveScalingOptions => {
  const contentSettings = config.contentAware.contentTypes[contentType];
  const formatSettings = config.quality[config.compression.preferredFormat];

  return {
    maxWidth: config.aggressiveMode.maxDimensions.width,
    maxHeight: config.aggressiveMode.maxDimensions.height,
    minWidth: config.aggressiveMode.minDimensions.width,
    minHeight: config.aggressiveMode.minDimensions.height,
    maintainAspectRatio: true,
    qualityRange: {
      min: formatSettings.min,
      max: Math.min(formatSettings.max, contentSettings.quality),
    },
    format: config.compression.preferredFormat,
    contentAware: config.contentAware.enabled,
  };
};