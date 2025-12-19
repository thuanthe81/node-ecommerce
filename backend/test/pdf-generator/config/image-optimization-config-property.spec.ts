import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PDFImageOptimizationConfigService } from '../../../src/pdf-generator/services/pdf-image-optimization-config.service';
import {
  ImageOptimizationConfig,
  defaultImageOptimizationConfig,
  createImageOptimizationConfig,
  validateImageOptimizationConfig,
} from '../../../src/pdf-generator/config/image-optimization.config';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for Image Optimization Configuration Compliance
 *
 * These tests verify universal properties that should hold across all valid executions
 * of the image optimization configuration system, using fast-check for property-based testing.
 *
 * **Feature: pdf-image-optimization, Property 7: Configuration compliance**
 */
describe('ImageOptimizationConfig - Property-Based Tests', () => {
  let configService: PDFImageOptimizationConfigService;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    // Create a mock ConfigService
    mockConfigService = {
      get: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PDFImageOptimizationConfigService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    configService = module.get<PDFImageOptimizationConfigService>(PDFImageOptimizationConfigService);
  });

  /**
   * Property 7: Configuration compliance
   * For any change to image optimization configuration, all subsequent PDF generations should use the updated settings
   * **Validates: Requirements 4.1, 4.2**
   */
  it('Property 7: Configuration compliance - should apply configuration changes consistently across all subsequent operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          // Aggressive mode settings
          aggressiveModeEnabled: fc.boolean(),
          maxWidth: fc.integer({ min: 100, max: 1000 }),
          maxHeight: fc.integer({ min: 100, max: 1000 }),
          minWidth: fc.integer({ min: 20, max: 200 }),
          minHeight: fc.integer({ min: 20, max: 200 }),
          forceOptimization: fc.boolean(),

          // Quality settings
          jpegQuality: fc.integer({ min: 10, max: 100 }),
          jpegMinQuality: fc.integer({ min: 10, max: 60 }),
          jpegMaxQuality: fc.integer({ min: 60, max: 100 }),
          pngQuality: fc.integer({ min: 10, max: 100 }),
          pngMinQuality: fc.integer({ min: 10, max: 60 }),
          pngMaxQuality: fc.integer({ min: 60, max: 100 }),
          webpQuality: fc.integer({ min: 10, max: 100 }),
          webpMinQuality: fc.integer({ min: 10, max: 60 }),
          webpMaxQuality: fc.integer({ min: 60, max: 100 }),

          // Compression settings
          compressionEnabled: fc.boolean(),
          compressionLevel: fc.constantFrom('maximum', 'high', 'medium', 'low'),
          enableFormatConversion: fc.boolean(),
          preferredFormat: fc.constantFrom('jpeg', 'png', 'webp'),

          // Fallback settings
          fallbackEnabled: fc.boolean(),
          maxRetries: fc.integer({ min: 0, max: 10 }),
          timeoutMs: fc.integer({ min: 1000, max: 60000 }),

          // Monitoring settings
          monitoringEnabled: fc.boolean(),
          trackProcessingTime: fc.boolean(),
          trackCompressionRatio: fc.boolean(),
          trackSizeReduction: fc.boolean(),

          // Content-aware settings
          contentAwareEnabled: fc.boolean(),
          textQuality: fc.integer({ min: 50, max: 100 }),
          photoQuality: fc.integer({ min: 30, max: 80 }),
          graphicsQuality: fc.integer({ min: 40, max: 90 }),
          logoQuality: fc.integer({ min: 60, max: 100 }),
        }).filter(params => {
          // Ensure valid dimension relationships
          const validDimensions = params.minWidth <= params.maxWidth &&
                                 params.minHeight <= params.maxHeight;

          // Ensure valid quality relationships
          const validJpegQuality = params.jpegMinQuality <= params.jpegMaxQuality &&
                                  params.jpegQuality >= params.jpegMinQuality &&
                                  params.jpegQuality <= params.jpegMaxQuality;

          const validPngQuality = params.pngMinQuality <= params.pngMaxQuality &&
                                 params.pngQuality >= params.pngMinQuality &&
                                 params.pngQuality <= params.pngMaxQuality;

          const validWebpQuality = params.webpMinQuality <= params.webpMaxQuality &&
                                  params.webpQuality >= params.webpMinQuality &&
                                  params.webpQuality <= params.webpMaxQuality;

          return validDimensions && validJpegQuality && validPngQuality && validWebpQuality;
        }),
        async (params) => {
          // Create a configuration update based on the generated parameters
          const configUpdate: Partial<ImageOptimizationConfig> = {
            aggressiveMode: {
              enabled: params.aggressiveModeEnabled,
              maxDimensions: {
                width: params.maxWidth,
                height: params.maxHeight,
              },
              minDimensions: {
                width: params.minWidth,
                height: params.minHeight,
              },
              forceOptimization: params.forceOptimization,
            },
            quality: {
              jpeg: {
                min: params.jpegMinQuality,
                max: params.jpegMaxQuality,
                default: params.jpegQuality,
                progressive: true,
              },
              png: {
                min: params.pngMinQuality,
                max: params.pngMaxQuality,
                default: params.pngQuality,
                lossless: false,
              },
              webp: {
                min: params.webpMinQuality,
                max: params.webpMaxQuality,
                default: params.webpQuality,
                lossless: false,
              },
            },
            compression: {
              enabled: params.compressionEnabled,
              level: params.compressionLevel,
              enableFormatConversion: params.enableFormatConversion,
              preferredFormat: params.preferredFormat,
            },
            fallback: {
              enabled: params.fallbackEnabled,
              maxRetries: params.maxRetries,
              timeoutMs: params.timeoutMs,
            },
            monitoring: {
              enabled: params.monitoringEnabled,
              trackProcessingTime: params.trackProcessingTime,
              trackCompressionRatio: params.trackCompressionRatio,
              trackSizeReduction: params.trackSizeReduction,
            },
            contentAware: {
              enabled: params.contentAwareEnabled,
              contentTypes: {
                text: { quality: params.textQuality, preserveSharpness: true },
                photo: { quality: params.photoQuality, allowAggressive: true },
                graphics: { quality: params.graphicsQuality, preserveColors: true },
                logo: { quality: params.logoQuality, maintainCrisp: true },
              },
            },
          };

          // Apply the configuration update
          const updatedConfig = configService.updateConfiguration(configUpdate);

          // Verify that the configuration was applied correctly
          const currentConfig = configService.getConfiguration();

          // Property: Configuration changes should be applied consistently
          // All subsequent calls to getConfiguration() should return the updated values

          // Test aggressive mode settings
          expect(currentConfig.aggressiveMode.enabled).toBe(params.aggressiveModeEnabled);
          expect(currentConfig.aggressiveMode.maxDimensions.width).toBe(params.maxWidth);
          expect(currentConfig.aggressiveMode.maxDimensions.height).toBe(params.maxHeight);
          expect(currentConfig.aggressiveMode.minDimensions.width).toBe(params.minWidth);
          expect(currentConfig.aggressiveMode.minDimensions.height).toBe(params.minHeight);
          expect(currentConfig.aggressiveMode.forceOptimization).toBe(params.forceOptimization);

          // Test quality settings
          expect(currentConfig.quality.jpeg.min).toBe(params.jpegMinQuality);
          expect(currentConfig.quality.jpeg.max).toBe(params.jpegMaxQuality);
          expect(currentConfig.quality.jpeg.default).toBe(params.jpegQuality);
          expect(currentConfig.quality.png.min).toBe(params.pngMinQuality);
          expect(currentConfig.quality.png.max).toBe(params.pngMaxQuality);
          expect(currentConfig.quality.png.default).toBe(params.pngQuality);
          expect(currentConfig.quality.webp.min).toBe(params.webpMinQuality);
          expect(currentConfig.quality.webp.max).toBe(params.webpMaxQuality);
          expect(currentConfig.quality.webp.default).toBe(params.webpQuality);

          // Test compression settings
          expect(currentConfig.compression.enabled).toBe(params.compressionEnabled);
          expect(currentConfig.compression.level).toBe(params.compressionLevel);
          expect(currentConfig.compression.enableFormatConversion).toBe(params.enableFormatConversion);
          expect(currentConfig.compression.preferredFormat).toBe(params.preferredFormat);

          // Test fallback settings
          expect(currentConfig.fallback.enabled).toBe(params.fallbackEnabled);
          expect(currentConfig.fallback.maxRetries).toBe(params.maxRetries);
          expect(currentConfig.fallback.timeoutMs).toBe(params.timeoutMs);

          // Test monitoring settings
          expect(currentConfig.monitoring.enabled).toBe(params.monitoringEnabled);
          expect(currentConfig.monitoring.trackProcessingTime).toBe(params.trackProcessingTime);
          expect(currentConfig.monitoring.trackCompressionRatio).toBe(params.trackCompressionRatio);
          expect(currentConfig.monitoring.trackSizeReduction).toBe(params.trackSizeReduction);

          // Test content-aware settings
          expect(currentConfig.contentAware.enabled).toBe(params.contentAwareEnabled);
          expect(currentConfig.contentAware.contentTypes.text.quality).toBe(params.textQuality);
          expect(currentConfig.contentAware.contentTypes.photo.quality).toBe(params.photoQuality);
          expect(currentConfig.contentAware.contentTypes.graphics.quality).toBe(params.graphicsQuality);
          expect(currentConfig.contentAware.contentTypes.logo.quality).toBe(params.logoQuality);

          // Verify that multiple calls to getConfiguration() return the same updated values
          const secondCall = configService.getConfiguration();
          const thirdCall = configService.getConfiguration();

          expect(secondCall).toEqual(currentConfig);
          expect(thirdCall).toEqual(currentConfig);

          // Verify that specific getter methods also reflect the updated configuration
          expect(configService.isAggressiveModeEnabled()).toBe(params.aggressiveModeEnabled);
          expect(configService.isMonitoringEnabled()).toBe(params.monitoringEnabled);
          expect(configService.isContentAwareEnabled()).toBe(params.contentAwareEnabled);

          // Verify that format-specific getters return updated values
          const jpegSettings = configService.getQualitySettings('jpeg');
          expect(jpegSettings.min).toBe(params.jpegMinQuality);
          expect(jpegSettings.max).toBe(params.jpegMaxQuality);
          expect(jpegSettings.default).toBe(params.jpegQuality);

          const pngSettings = configService.getQualitySettings('png');
          expect(pngSettings.min).toBe(params.pngMinQuality);
          expect(pngSettings.max).toBe(params.pngMaxQuality);
          expect(pngSettings.default).toBe(params.pngQuality);

          const webpSettings = configService.getQualitySettings('webp');
          expect(webpSettings.min).toBe(params.webpMinQuality);
          expect(webpSettings.max).toBe(params.webpMaxQuality);
          expect(webpSettings.default).toBe(params.webpQuality);

          // Verify content type settings
          const textSettings = configService.getContentTypeSettings('text');
          expect(textSettings.quality).toBe(params.textQuality);

          const photoSettings = configService.getContentTypeSettings('photo');
          expect(photoSettings.quality).toBe(params.photoQuality);

          const graphicsSettings = configService.getContentTypeSettings('graphics');
          expect(graphicsSettings.quality).toBe(params.graphicsQuality);

          const logoSettings = configService.getContentTypeSettings('logo');
          expect(logoSettings.quality).toBe(params.logoQuality);

          // Verify that getConfigValue works with the updated configuration
          expect(configService.getConfigValue<boolean>('aggressiveMode.enabled')).toBe(params.aggressiveModeEnabled);
          expect(configService.getConfigValue<number>('aggressiveMode.maxDimensions.width')).toBe(params.maxWidth);
          expect(configService.getConfigValue<string>('compression.preferredFormat')).toBe(params.preferredFormat);

          // Property verification: Configuration should remain valid after updates
          const validation = validateImageOptimizationConfig(currentConfig);
          expect(validation.isValid).toBe(true);
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in the design document
    );
  });

  /**
   * Additional property test: Configuration reload should maintain consistency with valid environment variables
   */
  it('Property 7 (Extended): Configuration reload should maintain consistency with valid environment variables', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          enabled: fc.boolean(),
          maxWidth: fc.integer({ min: 100, max: 800 }),
          maxHeight: fc.integer({ min: 100, max: 800 }),
          jpegQuality: fc.integer({ min: 40, max: 75 }), // Within default min-max range
          compressionLevel: fc.constantFrom('maximum', 'high', 'medium', 'low'),
          preferredFormat: fc.constantFrom('jpeg', 'png', 'webp'),
          timeout: fc.integer({ min: 5000, max: 30000 }),
          retries: fc.integer({ min: 1, max: 8 }),
        }),
        async (params) => {
          // Store the original configuration before mocking
          const originalConfig = configService.getConfiguration();

          // Mock environment variables with valid values
          mockConfigService.get.mockImplementation((key: string) => {
            switch (key) {
              case 'IMAGE_OPTIMIZATION_ENABLED':
                return params.enabled.toString();
              case 'IMAGE_MAX_WIDTH':
                return params.maxWidth.toString();
              case 'IMAGE_MAX_HEIGHT':
                return params.maxHeight.toString();
              case 'IMAGE_JPEG_QUALITY':
                return params.jpegQuality.toString();
              case 'IMAGE_COMPRESSION_LEVEL':
                return params.compressionLevel;
              case 'IMAGE_PREFERRED_FORMAT':
                return params.preferredFormat;
              case 'IMAGE_OPTIMIZATION_TIMEOUT':
                return params.timeout.toString();
              case 'IMAGE_OPTIMIZATION_RETRIES':
                return params.retries.toString();
              default:
                return undefined;
            }
          });

          // Create expected configuration using the same logic as createImageOptimizationConfig
          const expectedConfig = createImageOptimizationConfig(mockConfigService);

          // Validate that our expected configuration is valid
          const validation = validateImageOptimizationConfig(expectedConfig);

          // Skip this test case if the generated configuration would be invalid
          fc.pre(validation.isValid);

          // Reload configuration to pick up the mocked environment variables
          const reloadedConfig = configService.reloadConfiguration();

          // Property: Valid configuration changes should be applied consistently
          // If the configuration is valid, it should be applied
          if (validation.isValid) {
            expect(reloadedConfig.aggressiveMode.enabled).toBe(params.enabled);
            expect(reloadedConfig.aggressiveMode.maxDimensions.width).toBe(params.maxWidth);
            expect(reloadedConfig.aggressiveMode.maxDimensions.height).toBe(params.maxHeight);
            expect(reloadedConfig.quality.jpeg.default).toBe(params.jpegQuality);
            expect(reloadedConfig.compression.level).toBe(params.compressionLevel);
            expect(reloadedConfig.compression.preferredFormat).toBe(params.preferredFormat);
            expect(reloadedConfig.fallback.timeoutMs).toBe(params.timeout);
            expect(reloadedConfig.fallback.maxRetries).toBe(params.retries);

            // Verify that subsequent calls return the same configuration
            const currentConfig = configService.getConfiguration();
            expect(currentConfig).toEqual(reloadedConfig);

            // Property: Configuration should remain consistent across multiple accesses
            const multipleAccesses = [
              configService.getConfiguration(),
              configService.getConfiguration(),
              configService.getConfiguration(),
            ];

            multipleAccesses.forEach(config => {
              expect(config).toEqual(reloadedConfig);
            });
          }

          // Clean up mocks
          mockConfigService.get.mockReset();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property test: Configuration export/import should maintain consistency
   */
  it('Property 7 (Extended): Configuration export/import should maintain consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          aggressiveModeEnabled: fc.boolean(),
          maxWidth: fc.integer({ min: 100, max: 600 }),
          maxHeight: fc.integer({ min: 100, max: 600 }),
          jpegQuality: fc.integer({ min: 40, max: 80 }),
          compressionLevel: fc.constantFrom('maximum', 'high', 'medium', 'low'),
          monitoringEnabled: fc.boolean(),
        }),
        async (params) => {
          // Update configuration with test parameters
          const configUpdate: Partial<ImageOptimizationConfig> = {
            aggressiveMode: {
              enabled: params.aggressiveModeEnabled,
              maxDimensions: {
                width: params.maxWidth,
                height: params.maxHeight,
              },
              minDimensions: {
                width: 50,
                height: 50,
              },
              forceOptimization: true,
            },
            quality: {
              jpeg: {
                min: 30,
                max: 90,
                default: params.jpegQuality,
                progressive: true,
              },
              png: {
                min: 40,
                max: 85,
                default: 65,
                lossless: false,
              },
              webp: {
                min: 35,
                max: 85,
                default: 60,
                lossless: false,
              },
            },
            compression: {
              enabled: true,
              level: params.compressionLevel,
              enableFormatConversion: true,
              preferredFormat: 'jpeg',
            },
            monitoring: {
              enabled: params.monitoringEnabled,
              trackProcessingTime: true,
              trackCompressionRatio: true,
              trackSizeReduction: true,
            },
          };

          // Apply the configuration update
          configService.updateConfiguration(configUpdate);
          const originalConfig = configService.getConfiguration();

          // Export the configuration
          const exportedJson = configService.exportConfiguration();

          // Reset to defaults
          configService.resetToDefaults();

          // Verify that configuration was reset
          const resetConfig = configService.getConfiguration();
          expect(resetConfig).toEqual(defaultImageOptimizationConfig);

          // Import the previously exported configuration
          const importedConfig = configService.importConfiguration(exportedJson);

          // Property: Imported configuration should match the original configuration
          expect(importedConfig.aggressiveMode.enabled).toBe(params.aggressiveModeEnabled);
          expect(importedConfig.aggressiveMode.maxDimensions.width).toBe(params.maxWidth);
          expect(importedConfig.aggressiveMode.maxDimensions.height).toBe(params.maxHeight);
          expect(importedConfig.quality.jpeg.default).toBe(params.jpegQuality);
          expect(importedConfig.compression.level).toBe(params.compressionLevel);
          expect(importedConfig.monitoring.enabled).toBe(params.monitoringEnabled);

          // Verify that the current configuration matches the imported configuration
          const currentConfig = configService.getConfiguration();
          expect(currentConfig).toEqual(importedConfig);

          // Property: Configuration should remain consistent after import
          const postImportConfig = configService.getConfiguration();
          expect(postImportConfig).toEqual(importedConfig);
        }
      ),
      { numRuns: 100 }
    );
  });
});