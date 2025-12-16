import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ImageOptimizationConfig,
  defaultImageOptimizationConfig,
  validateImageOptimizationConfig,
  createImageOptimizationConfig
} from '../config/image-optimization.config';

/**
 * PDF Image Optimization Configuration Service
 *
 * Centralized service for managing image optimization configuration
 * Integrates with NestJS ConfigService for environment variable support
 * Provides dynamic configuration updates and validation
 */
@Injectable()
export class PDFImageOptimizationConfigService {
  private readonly logger = new Logger(PDFImageOptimizationConfigService.name);
  private currentConfig: ImageOptimizationConfig;

  constructor(private configService: ConfigService) {
    this.currentConfig = this.loadConfiguration();
    this.validateAndLogConfiguration();
  }

  /**
   * Load configuration from ConfigService
   * @returns ImageOptimizationConfig with values from environment variables
   */
  private loadConfiguration(): ImageOptimizationConfig {
    try {
      const config = createImageOptimizationConfig(this.configService);
      this.logger.log('Image optimization configuration loaded from ConfigService');
      return config;
    } catch (error) {
      this.logger.error(`Failed to load configuration: ${error.message}`);
      this.logger.warn('Falling back to default configuration');
      return { ...defaultImageOptimizationConfig };
    }
  }

  /**
   * Validate and log current configuration
   */
  private validateAndLogConfiguration(): void {
    const validation = validateImageOptimizationConfig(this.currentConfig);

    if (!validation.isValid) {
      this.logger.error('Invalid image optimization configuration:', validation.errors);
      throw new Error(`Invalid image optimization configuration: ${validation.errors.join(', ')}`);
    }

    if (validation.warnings.length > 0) {
      this.logger.warn('Image optimization configuration warnings:', validation.warnings);
    }

    this.logger.log('Image optimization configuration validated successfully');
    this.logConfigurationSummary();
  }

  /**
   * Log configuration summary for debugging
   */
  private logConfigurationSummary(): void {
    const config = this.currentConfig;
    this.logger.log('Configuration Summary:');
    this.logger.log(`  Aggressive Mode: ${config.aggressiveMode.enabled}`);
    this.logger.log(`  Max Dimensions: ${config.aggressiveMode.maxDimensions.width}x${config.aggressiveMode.maxDimensions.height}`);
    this.logger.log(`  Min Dimensions: ${config.aggressiveMode.minDimensions.width}x${config.aggressiveMode.minDimensions.height}`);
    this.logger.log(`  Force Optimization: ${config.aggressiveMode.forceOptimization}`);
    this.logger.log(`  Compression Level: ${config.compression.level}`);
    this.logger.log(`  Preferred Format: ${config.compression.preferredFormat}`);
    this.logger.log(`  Format Conversion: ${config.compression.enableFormatConversion}`);
    this.logger.log(`  Fallback Enabled: ${config.fallback.enabled}`);
    this.logger.log(`  Max Retries: ${config.fallback.maxRetries}`);
    this.logger.log(`  Timeout: ${config.fallback.timeoutMs}ms`);
    this.logger.log(`  Monitoring: ${config.monitoring.enabled}`);
    this.logger.log(`  Content-Aware: ${config.contentAware.enabled}`);
  }

  /**
   * Get current configuration
   * @returns Current ImageOptimizationConfig
   */
  getConfiguration(): ImageOptimizationConfig {
    return { ...this.currentConfig };
  }

  /**
   * Reload configuration from ConfigService
   * Allows dynamic configuration updates without service restart
   * @returns Updated ImageOptimizationConfig
   */
  reloadConfiguration(): ImageOptimizationConfig {
    this.logger.log('Reloading image optimization configuration from ConfigService');

    try {
      const newConfig = this.loadConfiguration();
      const validation = validateImageOptimizationConfig(newConfig);

      if (!validation.isValid) {
        this.logger.error('Invalid reloaded configuration, keeping current config:', validation.errors);
        return this.currentConfig;
      }

      if (validation.warnings.length > 0) {
        this.logger.warn('Configuration warnings after reload:', validation.warnings);
      }

      // Update the current configuration
      this.currentConfig = newConfig;

      this.logger.log('Configuration successfully reloaded and applied');
      this.logConfigurationSummary();

      return this.currentConfig;
    } catch (error) {
      this.logger.error(`Failed to reload configuration: ${error.message}`);
      this.logger.warn('Keeping current configuration');
      return this.currentConfig;
    }
  }

  /**
   * Update specific configuration values
   * @param updates - Partial configuration updates
   * @returns Updated configuration
   */
  updateConfiguration(updates: Partial<ImageOptimizationConfig>): ImageOptimizationConfig {
    this.logger.log('Updating image optimization configuration');

    try {
      // Deep merge the updates with current configuration
      const updatedConfig = this.deepMerge(this.currentConfig, updates);

      // Validate the updated configuration
      const validation = validateImageOptimizationConfig(updatedConfig);

      if (!validation.isValid) {
        this.logger.error('Invalid configuration update, keeping current config:', validation.errors);
        throw new Error(`Invalid configuration update: ${validation.errors.join(', ')}`);
      }

      if (validation.warnings.length > 0) {
        this.logger.warn('Configuration warnings after update:', validation.warnings);
      }

      // Apply the updates
      this.currentConfig = updatedConfig;

      this.logger.log('Configuration successfully updated');
      this.logConfigurationSummary();

      return this.currentConfig;
    } catch (error) {
      this.logger.error(`Failed to update configuration: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get configuration value by path
   * @param path - Dot-separated path to configuration value
   * @returns Configuration value or undefined
   */
  getConfigValue<T>(path: string): T | undefined {
    try {
      const keys = path.split('.');
      let value: any = this.currentConfig;

      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          return undefined;
        }
      }

      return value as T;
    } catch (error) {
      this.logger.warn(`Failed to get config value for path '${path}': ${error.message}`);
      return undefined;
    }
  }

  /**
   * Check if aggressive mode is enabled
   * @returns Whether aggressive optimization is enabled
   */
  isAggressiveModeEnabled(): boolean {
    return this.currentConfig.aggressiveMode.enabled;
  }

  /**
   * Check if monitoring is enabled
   * @returns Whether monitoring is enabled
   */
  isMonitoringEnabled(): boolean {
    return this.currentConfig.monitoring.enabled;
  }

  /**
   * Check if content-aware optimization is enabled
   * @returns Whether content-aware optimization is enabled
   */
  isContentAwareEnabled(): boolean {
    return this.currentConfig.contentAware.enabled;
  }

  /**
   * Get quality settings for a specific format
   * @param format - Image format
   * @returns Quality settings for the format
   */
  getQualitySettings(format: 'jpeg' | 'png' | 'webp') {
    return { ...this.currentConfig.quality[format] };
  }

  /**
   * Get content type quality settings
   * @param contentType - Content type
   * @returns Quality settings for the content type
   */
  getContentTypeSettings(contentType: 'text' | 'photo' | 'graphics' | 'logo') {
    return { ...this.currentConfig.contentAware.contentTypes[contentType] };
  }

  /**
   * Deep merge two objects
   * @param target - Target object
   * @param source - Source object
   * @returns Merged object
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = this.deepMerge(target[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }

    return result;
  }

  /**
   * Reset configuration to defaults
   * @returns Default configuration
   */
  resetToDefaults(): ImageOptimizationConfig {
    this.logger.log('Resetting image optimization configuration to defaults');

    // Use deep clone to ensure we get a fresh copy of the default configuration
    this.currentConfig = JSON.parse(JSON.stringify(defaultImageOptimizationConfig));

    this.logger.log('Configuration reset to defaults');
    this.logConfigurationSummary();

    return this.currentConfig;
  }

  /**
   * Export current configuration as JSON
   * @returns Configuration as JSON string
   */
  exportConfiguration(): string {
    try {
      return JSON.stringify(this.currentConfig, null, 2);
    } catch (error) {
      this.logger.error(`Failed to export configuration: ${error.message}`);
      throw new Error(`Failed to export configuration: ${error.message}`);
    }
  }

  /**
   * Import configuration from JSON
   * @param configJson - Configuration as JSON string
   * @returns Imported configuration
   */
  importConfiguration(configJson: string): ImageOptimizationConfig {
    this.logger.log('Importing image optimization configuration from JSON');

    try {
      const importedConfig = JSON.parse(configJson) as ImageOptimizationConfig;

      // Validate the imported configuration
      const validation = validateImageOptimizationConfig(importedConfig);

      if (!validation.isValid) {
        throw new Error(`Invalid imported configuration: ${validation.errors.join(', ')}`);
      }

      if (validation.warnings.length > 0) {
        this.logger.warn('Configuration warnings after import:', validation.warnings);
      }

      // Apply the imported configuration
      this.currentConfig = importedConfig;

      this.logger.log('Configuration successfully imported');
      this.logConfigurationSummary();

      return this.currentConfig;
    } catch (error) {
      this.logger.error(`Failed to import configuration: ${error.message}`);
      throw new Error(`Failed to import configuration: ${error.message}`);
    }
  }
}