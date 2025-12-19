/**
 * Integration test for PDF Image Optimization Configuration Management
 *
 * This test verifies that the configuration management integration works correctly
 * and that configuration changes are properly applied to all PDF generation processes.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PDFImageOptimizationConfigService } from '../../../src/pdf-generator/services/pdf-image-optimization-config.service';
import { PDFCompressionService } from '../../../src/pdf-generator/services/pdf-compression.service';
import { PDFImageOptimizationMetricsService } from '../../../src/pdf-generator/services/pdf-image-optimization-metrics.service';
import { PDFImageValidationService } from '../../../src/pdf-generator/services/pdf-image-validation.service';
import { CompressedImageService } from '../../../src/pdf-generator/services/compressed-image.service';

describe('PDF Image Optimization Configuration Integration', () => {
  let configService: PDFImageOptimizationConfigService;
  let compressionService: PDFCompressionService;
  let module: TestingModule;

  beforeEach(async () => {
    // Set up environment variables for testing
    process.env.IMAGE_OPTIMIZATION_ENABLED = 'true';
    process.env.IMAGE_MAX_WIDTH = '250';
    process.env.IMAGE_MAX_HEIGHT = '250';
    process.env.IMAGE_JPEG_QUALITY = '50';
    process.env.IMAGE_COMPRESSION_LEVEL = 'high';

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true, // Use process.env directly for testing
        }),
      ],
      providers: [
        PDFImageOptimizationConfigService,
        PDFCompressionService,
        {
          provide: PDFImageOptimizationMetricsService,
          useValue: {
            recordImageOptimization: jest.fn(),
            recordBatchOptimization: jest.fn(),
            recordPerformanceData: jest.fn(),
            getCurrentMetrics: jest.fn(),
            getMetricsSummaryForMonitoring: jest.fn(),
          },
        },
        {
          provide: PDFImageValidationService,
          useValue: {
            validateAggressiveOptimization: jest.fn(),
            logOptimizationResults: jest.fn(),
            validateQuality: jest.fn(),
            validateDimensions: jest.fn(),
            validateFormat: jest.fn()
          }
        },
        {
          provide: CompressedImageService,
          useValue: {
            hasCompressedImage: jest.fn().mockResolvedValue(false),
            getCompressedImage: jest.fn().mockResolvedValue(null),
            saveCompressedImage: jest.fn().mockResolvedValue('test-path'),
            generateCompressedPath: jest.fn().mockReturnValue('test-path'),
            getStorageMetrics: jest.fn().mockResolvedValue({
              totalStorageSize: 0,
              totalCompressedImages: 0,
              reuseRate: 0,
              averageCompressionRatio: 0,
              storageUtilization: 0,
            }),
          },
        },
      ],
    }).compile();

    configService = module.get<PDFImageOptimizationConfigService>(PDFImageOptimizationConfigService);
    compressionService = module.get<PDFCompressionService>(PDFCompressionService);
  });

  afterEach(async () => {
    // Clean up environment variables
    delete process.env.IMAGE_OPTIMIZATION_ENABLED;
    delete process.env.IMAGE_MAX_WIDTH;
    delete process.env.IMAGE_MAX_HEIGHT;
    delete process.env.IMAGE_JPEG_QUALITY;
    delete process.env.IMAGE_COMPRESSION_LEVEL;

    await module.close();
  });

  it('should load configuration from environment variables', () => {
    const config = configService.getConfiguration();

    expect(config.aggressiveMode.enabled).toBe(true);
    expect(config.aggressiveMode.maxDimensions.width).toBe(250);
    expect(config.aggressiveMode.maxDimensions.height).toBe(250);
    expect(config.quality.jpeg.default).toBe(50);
    expect(config.compression.level).toBe('high');
  });

  it('should provide configuration to compression service', () => {
    const currentConfig = compressionService.getCurrentConfiguration();

    expect(currentConfig.aggressiveMode.enabled).toBe(true);
    expect(currentConfig.aggressiveMode.maxDimensions.width).toBe(250);
    expect(currentConfig.aggressiveMode.maxDimensions.height).toBe(250);
    expect(currentConfig.quality.jpeg.default).toBe(50);
    expect(currentConfig.compression.level).toBe('high');
  });

  it('should allow configuration reloading', () => {
    // Change environment variables
    process.env.IMAGE_MAX_WIDTH = '200';
    process.env.IMAGE_JPEG_QUALITY = '40';

    // Reload configuration
    const reloadedConfig = compressionService.reloadConfiguration();

    expect(reloadedConfig.aggressiveMode.maxDimensions.width).toBe(200);
    expect(reloadedConfig.quality.jpeg.default).toBe(40);
  });

  it('should validate configuration on startup', () => {
    // The service should start successfully with valid configuration
    expect(configService).toBeDefined();
    expect(compressionService).toBeDefined();

    const config = configService.getConfiguration();
    expect(config.aggressiveMode.maxDimensions.width).toBeGreaterThan(0);
    expect(config.aggressiveMode.maxDimensions.height).toBeGreaterThan(0);
    expect(config.quality.jpeg.default).toBeGreaterThanOrEqual(config.quality.jpeg.min);
    expect(config.quality.jpeg.default).toBeLessThanOrEqual(config.quality.jpeg.max);
  });

  it('should provide helper methods for configuration access', () => {
    expect(configService.isAggressiveModeEnabled()).toBe(true);
    expect(configService.isMonitoringEnabled()).toBe(true);
    expect(configService.isContentAwareEnabled()).toBe(true);

    const jpegSettings = configService.getQualitySettings('jpeg');
    expect(jpegSettings.default).toBe(50);

    const photoSettings = configService.getContentTypeSettings('photo');
    expect(photoSettings.quality).toBeDefined();
  });

  it('should handle configuration updates', () => {
    const updates = {
      aggressiveMode: {
        maxDimensions: {
          width: 150,
          height: 150,
        },
      },
    };

    const updatedConfig = configService.updateConfiguration(updates);
    expect(updatedConfig.aggressiveMode.maxDimensions.width).toBe(150);
    expect(updatedConfig.aggressiveMode.maxDimensions.height).toBe(150);
  });

  it('should export and import configuration', () => {
    const exportedConfig = configService.exportConfiguration();
    expect(exportedConfig).toBeDefined();
    expect(typeof exportedConfig).toBe('string');

    const parsedConfig = JSON.parse(exportedConfig);
    expect(parsedConfig.aggressiveMode.enabled).toBe(true);

    // Test import
    const importedConfig = configService.importConfiguration(exportedConfig);
    expect(importedConfig.aggressiveMode.enabled).toBe(true);
    expect(importedConfig.aggressiveMode.maxDimensions.width).toBe(250);
  });

  it('should handle invalid configuration gracefully', () => {
    expect(() => {
      configService.updateConfiguration({
        aggressiveMode: {
          maxDimensions: {
            width: -1, // Invalid width
            height: -1, // Invalid height
          },
        },
      } as any);
    }).toThrow();
  });

  it('should reset to defaults', () => {
    // Make some changes
    configService.updateConfiguration({
      aggressiveMode: {
        maxDimensions: {
          width: 100,
          height: 100,
        },
      },
    });

    // Verify the change was applied
    let currentConfig = configService.getConfiguration();
    expect(currentConfig.aggressiveMode.maxDimensions.width).toBe(100);

    // Reset to defaults (this resets to the hardcoded defaults)
    // Clear environment variable to ensure we get hardcoded defaults
    delete process.env.IMAGE_COMPRESSION_LEVEL;
    const defaultConfig = configService.resetToDefaults();



    // The reset functionality works - verify it resets to hardcoded defaults
    expect(defaultConfig.aggressiveMode.enabled).toBe(true);
    expect(defaultConfig.compression.level).toBe('maximum'); // Should be hardcoded default
    expect(defaultConfig.fallback.enabled).toBe(true);
    expect(defaultConfig.aggressiveMode.maxDimensions.width).toBe(300); // Should be hardcoded default
    expect(defaultConfig.aggressiveMode.maxDimensions.height).toBe(300); // Should be hardcoded default
  });
});