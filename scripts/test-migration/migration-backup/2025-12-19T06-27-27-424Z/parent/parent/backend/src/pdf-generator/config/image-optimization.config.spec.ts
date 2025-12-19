import {
  defaultImageOptimizationConfig,
  getImageOptimizationConfig,
  validateImageOptimizationConfig,
  getAggressiveScalingOptions,
  ImageOptimizationConfig,
} from './image-optimization.config';

describe('ImageOptimizationConfig', () => {
  // Global cleanup to prevent test pollution
  beforeEach(() => {
    // Clear all image optimization related env vars before each test
    const envVarsToClean = [
      'IMAGE_OPTIMIZATION_ENABLED',
      'IMAGE_MAX_WIDTH',
      'IMAGE_MAX_HEIGHT',
      'IMAGE_MIN_WIDTH',
      'IMAGE_MIN_HEIGHT',
      'IMAGE_JPEG_QUALITY',
      'IMAGE_PNG_QUALITY',
      'IMAGE_WEBP_QUALITY',
      'IMAGE_COMPRESSION_LEVEL',
      'IMAGE_PREFERRED_FORMAT',
      'IMAGE_OPTIMIZATION_TIMEOUT',
      'IMAGE_OPTIMIZATION_RETRIES'
    ];

    envVarsToClean.forEach(varName => {
      delete process.env[varName];
    });
  });
  describe('defaultImageOptimizationConfig', () => {
    it('should have aggressive mode enabled by default', () => {
      expect(defaultImageOptimizationConfig.aggressiveMode.enabled).toBe(true);
    });

    it('should have maximum dimensions set to 300x300 for aggressive optimization', () => {
      expect(defaultImageOptimizationConfig.aggressiveMode.maxDimensions.width).toBe(300);
      expect(defaultImageOptimizationConfig.aggressiveMode.maxDimensions.height).toBe(300);
    });

    it('should have minimum dimensions set to prevent over-compression', () => {
      expect(defaultImageOptimizationConfig.aggressiveMode.minDimensions.width).toBe(50);
      expect(defaultImageOptimizationConfig.aggressiveMode.minDimensions.height).toBe(50);
    });

    it('should force optimization for all images', () => {
      expect(defaultImageOptimizationConfig.aggressiveMode.forceOptimization).toBe(true);
    });

    it('should have aggressive quality settings for maximum compression', () => {
      expect(defaultImageOptimizationConfig.quality.jpeg.default).toBe(60);
      expect(defaultImageOptimizationConfig.quality.jpeg.min).toBe(40);
      expect(defaultImageOptimizationConfig.quality.jpeg.max).toBe(75);
    });

    it('should have maximum compression level enabled', () => {
      expect(defaultImageOptimizationConfig.compression.enabled).toBe(true);
      expect(defaultImageOptimizationConfig.compression.level).toBe('maximum');
    });

    it('should have fallback mechanisms enabled', () => {
      expect(defaultImageOptimizationConfig.fallback.enabled).toBe(true);
      expect(defaultImageOptimizationConfig.fallback.maxRetries).toBe(3);
    });

    it('should have monitoring enabled', () => {
      expect(defaultImageOptimizationConfig.monitoring.enabled).toBe(true);
      expect(defaultImageOptimizationConfig.monitoring.trackProcessingTime).toBe(true);
      expect(defaultImageOptimizationConfig.monitoring.trackCompressionRatio).toBe(true);
    });

    it('should have content-aware optimization enabled', () => {
      expect(defaultImageOptimizationConfig.contentAware.enabled).toBe(true);
      expect(defaultImageOptimizationConfig.contentAware.contentTypes.text.quality).toBe(70);
      expect(defaultImageOptimizationConfig.contentAware.contentTypes.photo.quality).toBe(55);
    });
  });

  describe('getImageOptimizationConfig', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      // Clear all image optimization related env vars
      delete process.env.IMAGE_OPTIMIZATION_ENABLED;
      delete process.env.IMAGE_MAX_WIDTH;
      delete process.env.IMAGE_MAX_HEIGHT;
      delete process.env.IMAGE_MIN_WIDTH;
      delete process.env.IMAGE_MIN_HEIGHT;
      delete process.env.IMAGE_JPEG_QUALITY;
      delete process.env.IMAGE_PNG_QUALITY;
      delete process.env.IMAGE_WEBP_QUALITY;
      delete process.env.IMAGE_COMPRESSION_LEVEL;
      delete process.env.IMAGE_PREFERRED_FORMAT;
      delete process.env.IMAGE_OPTIMIZATION_TIMEOUT;
      delete process.env.IMAGE_OPTIMIZATION_RETRIES;
    });

    afterEach(() => {
      // Clean up after each test
      delete process.env.IMAGE_OPTIMIZATION_ENABLED;
      delete process.env.IMAGE_MAX_WIDTH;
      delete process.env.IMAGE_MAX_HEIGHT;
      delete process.env.IMAGE_MIN_WIDTH;
      delete process.env.IMAGE_MIN_HEIGHT;
      delete process.env.IMAGE_JPEG_QUALITY;
      delete process.env.IMAGE_PNG_QUALITY;
      delete process.env.IMAGE_WEBP_QUALITY;
      delete process.env.IMAGE_COMPRESSION_LEVEL;
      delete process.env.IMAGE_PREFERRED_FORMAT;
      delete process.env.IMAGE_OPTIMIZATION_TIMEOUT;
      delete process.env.IMAGE_OPTIMIZATION_RETRIES;
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should return default configuration when no environment variables are set', () => {
      const config = getImageOptimizationConfig();
      expect(config).toEqual(defaultImageOptimizationConfig);
    });

    it('should override aggressive mode from environment variable', () => {
      process.env.IMAGE_OPTIMIZATION_ENABLED = 'false';
      const config = getImageOptimizationConfig();
      expect(config.aggressiveMode.enabled).toBe(false);
    });

    it('should override maximum dimensions from environment variables', () => {
      process.env.IMAGE_MAX_WIDTH = '400';
      process.env.IMAGE_MAX_HEIGHT = '400';
      const config = getImageOptimizationConfig();
      expect(config.aggressiveMode.maxDimensions.width).toBe(400);
      expect(config.aggressiveMode.maxDimensions.height).toBe(400);
    });

    it('should override minimum dimensions from environment variables', () => {
      process.env.IMAGE_MIN_WIDTH = '100';
      process.env.IMAGE_MIN_HEIGHT = '100';
      const config = getImageOptimizationConfig();
      expect(config.aggressiveMode.minDimensions.width).toBe(100);
      expect(config.aggressiveMode.minDimensions.height).toBe(100);
    });

    it('should override quality settings from environment variables', () => {
      process.env.IMAGE_JPEG_QUALITY = '50';
      process.env.IMAGE_PNG_QUALITY = '70';
      process.env.IMAGE_WEBP_QUALITY = '55';
      const config = getImageOptimizationConfig();
      expect(config.quality.jpeg.default).toBe(50);
      expect(config.quality.png.default).toBe(70);
      expect(config.quality.webp.default).toBe(55);
    });

    it('should override compression level from environment variable', () => {
      process.env.IMAGE_COMPRESSION_LEVEL = 'high';
      const config = getImageOptimizationConfig();
      expect(config.compression.level).toBe('high');
    });

    it('should override preferred format from environment variable', () => {
      process.env.IMAGE_PREFERRED_FORMAT = 'webp';
      const config = getImageOptimizationConfig();
      expect(config.compression.preferredFormat).toBe('webp');
    });

    it('should override timeout and retries from environment variables', () => {
      process.env.IMAGE_OPTIMIZATION_TIMEOUT = '15000';
      process.env.IMAGE_OPTIMIZATION_RETRIES = '5';
      const config = getImageOptimizationConfig();
      expect(config.fallback.timeoutMs).toBe(15000);
      expect(config.fallback.maxRetries).toBe(5);
    });

    it('should ignore invalid compression level values', () => {
      process.env.IMAGE_COMPRESSION_LEVEL = 'invalid';
      const config = getImageOptimizationConfig();
      expect(config.compression.level).toBe(defaultImageOptimizationConfig.compression.level);
    });

    it('should ignore invalid format values', () => {
      process.env.IMAGE_PREFERRED_FORMAT = 'invalid';
      const config = getImageOptimizationConfig();
      expect(config.compression.preferredFormat).toBe(defaultImageOptimizationConfig.compression.preferredFormat);
    });
  });

  describe('validateImageOptimizationConfig', () => {
    it('should validate a correct configuration', () => {
      const result = validateImageOptimizationConfig(defaultImageOptimizationConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid maximum dimensions', () => {
      const invalidConfig: ImageOptimizationConfig = {
        ...defaultImageOptimizationConfig,
        aggressiveMode: {
          ...defaultImageOptimizationConfig.aggressiveMode,
          maxDimensions: { width: 0, height: -1 },
        },
      };
      const result = validateImageOptimizationConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Maximum width must be greater than 0');
      expect(result.errors).toContain('Maximum height must be greater than 0');
    });

    it('should detect invalid minimum dimensions', () => {
      const invalidConfig: ImageOptimizationConfig = {
        ...defaultImageOptimizationConfig,
        aggressiveMode: {
          ...defaultImageOptimizationConfig.aggressiveMode,
          minDimensions: { width: 0, height: -1 },
        },
      };
      const result = validateImageOptimizationConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Minimum width must be greater than 0');
      expect(result.errors).toContain('Minimum height must be greater than 0');
    });

    it('should detect when max dimensions are less than min dimensions', () => {
      const invalidConfig: ImageOptimizationConfig = {
        ...defaultImageOptimizationConfig,
        aggressiveMode: {
          ...defaultImageOptimizationConfig.aggressiveMode,
          maxDimensions: { width: 100, height: 100 },
          minDimensions: { width: 200, height: 200 },
        },
      };
      const result = validateImageOptimizationConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Maximum width cannot be less than minimum width');
      expect(result.errors).toContain('Maximum height cannot be less than minimum height');
    });

    it('should detect invalid quality settings', () => {
      const invalidConfig: ImageOptimizationConfig = {
        ...defaultImageOptimizationConfig,
        quality: {
          ...defaultImageOptimizationConfig.quality,
          jpeg: {
            min: -10,
            max: 150,
            default: 200,
            progressive: true,
          },
        },
      };
      const result = validateImageOptimizationConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('JPEG minimum quality must be between 0 and 100');
      expect(result.errors).toContain('JPEG maximum quality must be between 0 and 100');
      expect(result.errors).toContain('JPEG default quality must be between 0 and 100');
    });

    it('should detect when min quality is greater than max quality', () => {
      const invalidConfig: ImageOptimizationConfig = {
        ...defaultImageOptimizationConfig,
        quality: {
          ...defaultImageOptimizationConfig.quality,
          jpeg: {
            min: 80,
            max: 60,
            default: 70,
            progressive: true,
          },
        },
      };
      const result = validateImageOptimizationConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('JPEG minimum quality cannot be greater than maximum quality');
    });

    it('should detect when default quality is outside min-max range', () => {
      const invalidConfig: ImageOptimizationConfig = {
        ...defaultImageOptimizationConfig,
        quality: {
          ...defaultImageOptimizationConfig.quality,
          jpeg: {
            min: 60,
            max: 80,
            default: 90,
            progressive: true,
          },
        },
      };
      const result = validateImageOptimizationConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('JPEG default quality must be between minimum and maximum quality');
    });

    it('should detect invalid timeout and retries', () => {
      const invalidConfig: ImageOptimizationConfig = {
        ...defaultImageOptimizationConfig,
        fallback: {
          ...defaultImageOptimizationConfig.fallback,
          timeoutMs: 0,
          maxRetries: -1,
        },
      };
      const result = validateImageOptimizationConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Timeout must be greater than 0');
      expect(result.errors).toContain('Maximum retries cannot be negative');
    });

    it('should generate warnings for potentially problematic settings', () => {
      const problematicConfig: ImageOptimizationConfig = {
        aggressiveMode: {
          enabled: true,
          maxDimensions: { width: 80, height: 80 }, // Small but valid (> min dimensions)
          minDimensions: { width: 50, height: 50 },
          forceOptimization: true,
        },
        quality: {
          jpeg: {
            min: 20,
            max: 50,
            default: 30,
            progressive: true,
          },
          png: {
            min: 20,
            max: 50,
            default: 30,
            lossless: false,
          },
          webp: {
            min: 20,
            max: 50,
            default: 30,
            lossless: false,
          },
        },
        compression: {
          enabled: true,
          level: 'maximum',
          enableFormatConversion: true,
          preferredFormat: 'jpeg',
        },
        fallback: {
          enabled: true,
          maxRetries: 3,
          timeoutMs: 3000, // Short timeout for warning
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
            text: { quality: 70, preserveSharpness: true },
            photo: { quality: 55, allowAggressive: true },
            graphics: { quality: 65, preserveColors: true },
            logo: { quality: 75, maintainCrisp: true },
          },
        },
      };
      const result = validateImageOptimizationConfig(problematicConfig);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Very small maximum dimensions may result in unreadable images');
      expect(result.warnings).toContain('Very low JPEG quality may result in poor visual quality');
      expect(result.warnings).toContain('Short timeout may cause optimization failures for large images');
    });
  });

  describe('getAggressiveScalingOptions', () => {
    // Create a fresh config for each test to avoid pollution
    const getFreshConfig = (): ImageOptimizationConfig => ({
      aggressiveMode: {
        enabled: true,
        maxDimensions: { width: 300, height: 300 },
        minDimensions: { width: 50, height: 50 },
        forceOptimization: true,
      },
      quality: {
        jpeg: { min: 40, max: 75, default: 60, progressive: true },
        png: { min: 50, max: 80, default: 65, lossless: false },
        webp: { min: 45, max: 80, default: 65, lossless: false },
      },
      compression: {
        enabled: true,
        level: 'maximum',
        enableFormatConversion: true,
        preferredFormat: 'jpeg',
      },
      fallback: {
        enabled: true,
        maxRetries: 3,
        timeoutMs: 10000,
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
          text: { quality: 70, preserveSharpness: true },
          photo: { quality: 55, allowAggressive: true },
          graphics: { quality: 65, preserveColors: true },
          logo: { quality: 75, maintainCrisp: true },
        },
      },
    });

    it('should return correct scaling options for photo content', () => {
      const freshConfig = getFreshConfig();
      const options = getAggressiveScalingOptions(freshConfig, 'photo');
      expect(options.maxWidth).toBe(300);
      expect(options.maxHeight).toBe(300);
      expect(options.minWidth).toBe(50);
      expect(options.minHeight).toBe(50);
      expect(options.maintainAspectRatio).toBe(true);
      expect(options.format).toBe('jpeg');
      expect(options.contentAware).toBe(true);
      expect(options.qualityRange.min).toBe(40);
      expect(options.qualityRange.max).toBe(55); // Should use photo quality (55) as max
    });

    it('should return correct scaling options for text content', () => {
      const freshConfig = getFreshConfig();
      const options = getAggressiveScalingOptions(freshConfig, 'text');
      expect(options.qualityRange.max).toBe(70); // Should use text quality (70) as max
    });

    it('should return correct scaling options for graphics content', () => {
      const freshConfig = getFreshConfig();
      const options = getAggressiveScalingOptions(freshConfig, 'graphics');
      expect(options.qualityRange.max).toBe(65); // Should use graphics quality (65) as max
    });

    it('should return correct scaling options for logo content', () => {
      const freshConfig = getFreshConfig();
      const options = getAggressiveScalingOptions(freshConfig, 'logo');
      expect(options.qualityRange.max).toBe(75); // Should use logo quality (75) as max, but capped by format max (75)
    });

    it('should respect format maximum quality limits', () => {
      const customConfig = getFreshConfig();
      customConfig.quality.jpeg.max = 60; // Lower format max
      customConfig.contentAware.contentTypes.logo.quality = 80; // Higher content quality

      const options = getAggressiveScalingOptions(customConfig, 'logo');
      expect(options.qualityRange.max).toBe(60); // Should be capped by format max
    });

    it('should use preferred format from configuration', () => {
      const webpConfig = getFreshConfig();
      webpConfig.compression.preferredFormat = 'webp';

      const options = getAggressiveScalingOptions(webpConfig, 'photo');
      expect(options.format).toBe('webp');
    });
  });
});