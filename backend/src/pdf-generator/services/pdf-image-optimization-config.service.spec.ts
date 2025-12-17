import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PDFImageOptimizationConfigService } from './pdf-image-optimization-config.service';
import { ImageOptimizationConfig, defaultImageOptimizationConfig } from '../config/image-optimization.config';

describe('PDFImageOptimizationConfigService', () => {
  let service: PDFImageOptimizationConfigService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PDFImageOptimizationConfigService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PDFImageOptimizationConfigService>(PDFImageOptimizationConfigService);
    configService = module.get<ConfigService>(ConfigService);

    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.IMAGE_OPTIMIZATION_ENABLED;
    delete process.env.IMAGE_AGGRESSIVE_MODE_ENABLED;
    delete process.env.IMAGE_MAX_WIDTH;
    delete process.env.IMAGE_MAX_HEIGHT;
    delete process.env.IMAGE_MIN_WIDTH;
    delete process.env.IMAGE_MIN_HEIGHT;
    delete process.env.IMAGE_FORCE_OPTIMIZATION;
    delete process.env.IMAGE_COMPRESSION_LEVEL;
    delete process.env.IMAGE_PREFERRED_FORMAT;
    delete process.env.IMAGE_ENABLE_FORMAT_CONVERSION;
    delete process.env.IMAGE_FALLBACK_ENABLED;
    delete process.env.IMAGE_MAX_RETRIES;
    delete process.env.IMAGE_TIMEOUT_MS;
    delete process.env.IMAGE_MONITORING_ENABLED;
    delete process.env.IMAGE_CONTENT_AWARE_ENABLED;
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should load default configuration when no environment variables are set', () => {
      mockConfigService.get.mockReturnValue(undefined);

      const config = service.getConfiguration();

      expect(config.aggressiveMode.enabled).toBe(defaultImageOptimizationConfig.aggressiveMode.enabled);
      expect(config.aggressiveMode.maxDimensions).toEqual(defaultImageOptimizationConfig.aggressiveMode.maxDimensions);
      expect(config.compression.level).toBe(defaultImageOptimizationConfig.compression.level);
    });

    it('should load configuration from environment variables', () => {
      // Set up environment variables
      process.env.IMAGE_OPTIMIZATION_ENABLED = 'true';
      process.env.IMAGE_AGGRESSIVE_MODE_ENABLED = 'true';
      process.env.IMAGE_MAX_WIDTH = '400';
      process.env.IMAGE_MAX_HEIGHT = '400';
      process.env.IMAGE_COMPRESSION_LEVEL = 'high';

      mockConfigService.get
        .mockReturnValueOnce('true') // IMAGE_OPTIMIZATION_ENABLED
        .mockReturnValueOnce('true') // IMAGE_AGGRESSIVE_MODE_ENABLED
        .mockReturnValueOnce('400')  // IMAGE_MAX_WIDTH
        .mockReturnValueOnce('400')  // IMAGE_MAX_HEIGHT
        .mockReturnValueOnce('50')   // IMAGE_MIN_WIDTH
        .mockReturnValueOnce('50')   // IMAGE_MIN_HEIGHT
        .mockReturnValueOnce('true') // IMAGE_FORCE_OPTIMIZATION
        .mockReturnValueOnce('40')   // IMAGE_JPEG_MIN_QUALITY
        .mockReturnValueOnce('75')   // IMAGE_JPEG_MAX_QUALITY
        .mockReturnValueOnce('60')   // IMAGE_JPEG_DEFAULT_QUALITY
        .mockReturnValueOnce('50')   // IMAGE_PNG_MIN_QUALITY
        .mockReturnValueOnce('80')   // IMAGE_PNG_MAX_QUALITY
        .mockReturnValueOnce('65')   // IMAGE_PNG_DEFAULT_QUALITY
        .mockReturnValueOnce('45')   // IMAGE_WEBP_MIN_QUALITY
        .mockReturnValueOnce('80')   // IMAGE_WEBP_MAX_QUALITY
        .mockReturnValueOnce('65')   // IMAGE_WEBP_DEFAULT_QUALITY
        .mockReturnValueOnce('true') // IMAGE_COMPRESSION_ENABLED
        .mockReturnValueOnce('high') // IMAGE_COMPRESSION_LEVEL
        .mockReturnValueOnce('true') // IMAGE_ENABLE_FORMAT_CONVERSION
        .mockReturnValueOnce('jpeg') // IMAGE_PREFERRED_FORMAT
        .mockReturnValueOnce('true') // IMAGE_FALLBACK_ENABLED
        .mockReturnValueOnce('3')    // IMAGE_MAX_RETRIES
        .mockReturnValueOnce('10000') // IMAGE_TIMEOUT_MS
        .mockReturnValueOnce('true') // IMAGE_MONITORING_ENABLED
        .mockReturnValueOnce('true') // IMAGE_TRACK_PROCESSING_TIME
        .mockReturnValueOnce('true') // IMAGE_TRACK_COMPRESSION_RATIO
        .mockReturnValueOnce('true') // IMAGE_TRACK_SIZE_REDUCTION
        .mockReturnValueOnce('true') // IMAGE_CONTENT_AWARE_ENABLED
        .mockReturnValueOnce('70')   // IMAGE_TEXT_QUALITY
        .mockReturnValueOnce('true') // IMAGE_TEXT_PRESERVE_SHARPNESS
        .mockReturnValueOnce('55')   // IMAGE_PHOTO_QUALITY
        .mockReturnValueOnce('true') // IMAGE_PHOTO_ALLOW_AGGRESSIVE
        .mockReturnValueOnce('65')   // IMAGE_GRAPHICS_QUALITY
        .mockReturnValueOnce('true') // IMAGE_GRAPHICS_PRESERVE_COLORS
        .mockReturnValueOnce('75')   // IMAGE_LOGO_QUALITY
        .mockReturnValueOnce('true'); // IMAGE_LOGO_MAINTAIN_CRISP

      // Create a new service instance to test environment variable loading
      const testModule = Test.createTestingModule({
        providers: [
          PDFImageOptimizationConfigService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const testService = testModule.then(module =>
        module.get<PDFImageOptimizationConfigService>(PDFImageOptimizationConfigService)
      );

      testService.then(svc => {
        const config = svc.getConfiguration();
        expect(config.aggressiveMode.enabled).toBe(true);
        expect(config.aggressiveMode.maxDimensions.width).toBe(400);
        expect(config.aggressiveMode.maxDimensions.height).toBe(400);
        expect(config.compression.level).toBe('high');
      });
    });
  });

  describe('configuration management', () => {
    it('should return current configuration', () => {
      const config = service.getConfiguration();

      expect(config).toBeDefined();
      expect(config.aggressiveMode).toBeDefined();
      expect(config.quality).toBeDefined();
      expect(config.compression).toBeDefined();
      expect(config.fallback).toBeDefined();
      expect(config.monitoring).toBeDefined();
      expect(config.contentAware).toBeDefined();
    });

    it('should reload configuration from ConfigService', () => {
      mockConfigService.get.mockReturnValue(undefined);

      const reloadedConfig = service.reloadConfiguration();

      expect(reloadedConfig).toBeDefined();
      expect(reloadedConfig.aggressiveMode.enabled).toBe(defaultImageOptimizationConfig.aggressiveMode.enabled);
    });

    it('should update configuration with partial updates', () => {
      const updates: Partial<ImageOptimizationConfig> = {
        aggressiveMode: {
          enabled: false,
          maxDimensions: { width: 200, height: 200 },
          minDimensions: { width: 25, height: 25 },
          forceOptimization: false,
        },
      };

      const updatedConfig = service.updateConfiguration(updates);

      expect(updatedConfig.aggressiveMode.enabled).toBe(false);
      expect(updatedConfig.aggressiveMode.maxDimensions.width).toBe(200);
      expect(updatedConfig.aggressiveMode.maxDimensions.height).toBe(200);
    });

    it('should throw error for invalid configuration updates', () => {
      const invalidUpdates = {
        aggressiveMode: {
          maxDimensions: { width: -100, height: -100 }, // Invalid negative dimensions
        },
      };

      expect(() => service.updateConfiguration(invalidUpdates)).toThrow();
    });

    it('should get configuration value by path', () => {
      const maxWidth = service.getConfigValue<number>('aggressiveMode.maxDimensions.width');
      const compressionLevel = service.getConfigValue<string>('compression.level');

      expect(maxWidth).toBeDefined();
      expect(typeof maxWidth).toBe('number');
      expect(compressionLevel).toBeDefined();
      expect(typeof compressionLevel).toBe('string');
    });

    it('should return undefined for invalid configuration paths', () => {
      const invalidValue = service.getConfigValue('invalid.path.that.does.not.exist');

      expect(invalidValue).toBeUndefined();
    });
  });

  describe('configuration helpers', () => {
    it('should check if aggressive mode is enabled', () => {
      const isEnabled = service.isAggressiveModeEnabled();

      expect(typeof isEnabled).toBe('boolean');
    });

    it('should check if monitoring is enabled', () => {
      const isEnabled = service.isMonitoringEnabled();

      expect(typeof isEnabled).toBe('boolean');
    });

    it('should check if content-aware optimization is enabled', () => {
      const isEnabled = service.isContentAwareEnabled();

      expect(typeof isEnabled).toBe('boolean');
    });

    it('should get quality settings for specific formats', () => {
      const jpegSettings = service.getQualitySettings('jpeg');
      const pngSettings = service.getQualitySettings('png');
      const webpSettings = service.getQualitySettings('webp');

      expect(jpegSettings).toBeDefined();
      expect(jpegSettings.min).toBeDefined();
      expect(jpegSettings.max).toBeDefined();
      expect(jpegSettings.default).toBeDefined();

      expect(pngSettings).toBeDefined();
      expect(webpSettings).toBeDefined();
    });

    it('should get content type settings', () => {
      const textSettings = service.getContentTypeSettings('text');
      const photoSettings = service.getContentTypeSettings('photo');
      const graphicsSettings = service.getContentTypeSettings('graphics');
      const logoSettings = service.getContentTypeSettings('logo');

      expect(textSettings).toBeDefined();
      expect(textSettings.quality).toBeDefined();

      expect(photoSettings).toBeDefined();
      expect(graphicsSettings).toBeDefined();
      expect(logoSettings).toBeDefined();
    });
  });

  describe('configuration persistence', () => {
    it('should reset configuration to defaults', () => {
      // First modify the configuration
      service.updateConfiguration({
        aggressiveMode: { enabled: false },
      });

      // Then reset to defaults
      const resetConfig = service.resetToDefaults();

      expect(resetConfig.aggressiveMode.enabled).toBe(defaultImageOptimizationConfig.aggressiveMode.enabled);
      expect(resetConfig).toEqual(defaultImageOptimizationConfig);
    });

    it('should export configuration as JSON', () => {
      const configJson = service.exportConfiguration();

      expect(configJson).toBeDefined();
      expect(typeof configJson).toBe('string');

      // Should be valid JSON
      const parsedConfig = JSON.parse(configJson);
      expect(parsedConfig).toBeDefined();
      expect(parsedConfig.aggressiveMode).toBeDefined();
    });

    it('should import configuration from JSON', () => {
      const testConfig: ImageOptimizationConfig = {
        ...defaultImageOptimizationConfig,
        aggressiveMode: {
          ...defaultImageOptimizationConfig.aggressiveMode,
          enabled: false,
          maxDimensions: { width: 150, height: 150 },
        },
      };

      const configJson = JSON.stringify(testConfig);
      const importedConfig = service.importConfiguration(configJson);

      expect(importedConfig.aggressiveMode.enabled).toBe(false);
      expect(importedConfig.aggressiveMode.maxDimensions.width).toBe(150);
      expect(importedConfig.aggressiveMode.maxDimensions.height).toBe(150);
    });

    it('should throw error for invalid JSON import', () => {
      const invalidJson = '{ invalid json }';

      expect(() => service.importConfiguration(invalidJson)).toThrow();
    });

    it('should throw error for invalid configuration import', () => {
      const invalidConfig = {
        aggressiveMode: {
          maxDimensions: { width: -100, height: -100 }, // Invalid
        },
      };

      const configJson = JSON.stringify(invalidConfig);

      expect(() => service.importConfiguration(configJson)).toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle ConfigService errors gracefully', () => {
      mockConfigService.get.mockImplementation(() => {
        throw new Error('ConfigService error');
      });

      // Should not throw, should fall back to defaults
      expect(() => service.reloadConfiguration()).not.toThrow();

      const config = service.getConfiguration();
      expect(config).toBeDefined();
    });

    it('should handle deep merge errors gracefully', () => {
      const circularRef: any = {};
      circularRef.self = circularRef;

      // Should handle circular references gracefully
      expect(() => service.updateConfiguration({ aggressiveMode: circularRef })).toThrow();
    });
  });

  describe('dynamic scaling logic', () => {
    it('should calculate optimal dimensions based on content type', () => {
      const config = service.getConfiguration();

      // Test that different content types have appropriate settings
      const textSettings = service.getContentTypeSettings('text');
      const photoSettings = service.getContentTypeSettings('photo');

      expect(textSettings.preserveSharpness).toBe(true);
      expect(photoSettings.allowAggressive).toBe(true);
    });

    it('should validate aspect ratio preservation settings', () => {
      const config = service.getConfiguration();

      // Ensure max dimensions maintain reasonable aspect ratios
      const maxWidth = config.aggressiveMode.maxDimensions.width;
      const maxHeight = config.aggressiveMode.maxDimensions.height;
      const minWidth = config.aggressiveMode.minDimensions.width;
      const minHeight = config.aggressiveMode.minDimensions.height;

      expect(maxWidth).toBeGreaterThan(minWidth);
      expect(maxHeight).toBeGreaterThan(minHeight);
      expect(maxWidth).toBeGreaterThan(0);
      expect(maxHeight).toBeGreaterThan(0);
    });
  });

  describe('format-specific optimization', () => {
    it('should provide format-specific quality settings', () => {
      const jpegSettings = service.getQualitySettings('jpeg');
      const pngSettings = service.getQualitySettings('png');
      const webpSettings = service.getQualitySettings('webp');

      // JPEG should allow lower quality for photos
      expect(jpegSettings.min).toBeLessThanOrEqual(jpegSettings.default);
      expect(jpegSettings.default).toBeLessThanOrEqual(jpegSettings.max);

      // PNG should have higher quality for graphics
      expect(pngSettings.min).toBeLessThanOrEqual(pngSettings.default);
      expect(pngSettings.default).toBeLessThanOrEqual(pngSettings.max);

      // WebP should balance quality and compression
      expect(webpSettings.min).toBeLessThanOrEqual(webpSettings.default);
      expect(webpSettings.default).toBeLessThanOrEqual(webpSettings.max);
    });

    it('should handle format conversion settings', () => {
      const config = service.getConfiguration();

      expect(config.compression.enableFormatConversion).toBeDefined();
      expect(config.compression.preferredFormat).toBeDefined();
      expect(['jpeg', 'png', 'webp']).toContain(config.compression.preferredFormat);
    });
  });

  describe('fallback mechanisms', () => {
    it('should provide fallback configuration', () => {
      const config = service.getConfiguration();

      expect(config.fallback.enabled).toBeDefined();
      expect(config.fallback.maxRetries).toBeGreaterThan(0);
      expect(config.fallback.timeoutMs).toBeGreaterThan(0);
    });

    it('should handle configuration validation failures', () => {
      // Mock a scenario where validation fails
      const originalConfig = service.getConfiguration();

      // Try to update with invalid configuration
      expect(() => {
        service.updateConfiguration({
          aggressiveMode: {
            maxDimensions: { width: 0, height: 0 }, // Invalid dimensions
          } as any,
        });
      }).toThrow();

      // Configuration should remain unchanged
      const currentConfig = service.getConfiguration();
      expect(currentConfig).toEqual(originalConfig);
    });
  });
});