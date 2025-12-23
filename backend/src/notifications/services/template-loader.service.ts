import { Injectable, Logger, OnModuleDestroy, Inject } from '@nestjs/common';
import { promises as fs, watch, FSWatcher } from 'fs';
import { join, resolve } from 'path';
import { existsSync } from 'fs';
import {
  ITemplateLoader,
  TemplateLoaderConfig,
  TemplateNotFoundError,
  TemplateLoadError,
  TemplateDirectoryError
} from '../interfaces';
import { DEFAULT_TEMPLATE_SYSTEM_CONFIG } from '../config/template-system.config';

/**
 * Service for loading and caching HTML template files from the file system.
 * Implements template caching for performance and supports hot-reloading in development.
 */
@Injectable()
export class TemplateLoaderService implements ITemplateLoader, OnModuleDestroy {
  private readonly logger = new Logger(TemplateLoaderService.name);
  private readonly templateCache = new Map<string, string>();
  private readonly config: TemplateLoaderConfig;
  private fileWatcher?: FSWatcher;
  private reloadCallbacks: Array<(templateName: string) => void> = [];

  constructor(@Inject('TemplateLoaderConfig') config?: Partial<TemplateLoaderConfig>) {
    this.config = {
      ...DEFAULT_TEMPLATE_SYSTEM_CONFIG.templateLoader,
      ...config
    };

    this.validateConfiguration();
    this.initializeTemplatesDirectory();
    this.setupDevelopmentMode();
  }

  /**
   * Cleanup resources when module is destroyed.
   */
  onModuleDestroy(): void {
    this.stopFileWatching();
  }

  /**
   * Load a template by name from the templates directory.
   * Templates are cached after first load for performance.
   * Supports subdirectory paths (e.g., 'orders/template-order-confirmation')
   */
  async loadTemplate(templateName: string): Promise<string> {
    try {
      // Check cache first if caching is enabled
      if (this.config.enableCaching && this.templateCache.has(templateName)) {
        this.logger.debug(`Loading template '${templateName}' from cache`);
        return this.templateCache.get(templateName)!;
      }

      // Check if template exists (handles both root and subdirectory templates)
      if (!this.templateExists(templateName)) {
        const expectedPath = this.getTemplatePath(templateName);
        throw new TemplateNotFoundError(templateName, expectedPath);
      }

      // Load template from file system
      const templatePath = this.getTemplatePath(templateName);
      this.logger.debug(`Loading template '${templateName}' from file: ${templatePath}`);

      const templateContent = await fs.readFile(templatePath, 'utf-8');

      // Cache the template if caching is enabled
      if (this.config.enableCaching) {
        this.templateCache.set(templateName, templateContent);
        this.logger.debug(`Cached template '${templateName}'`);
      }

      return templateContent;
    } catch (error) {
      if (error instanceof TemplateNotFoundError) {
        this.logger.error(`Template not found: ${error.message}`);
        throw error;
      }

      const templatePath = this.getTemplatePath(templateName);
      this.logger.error(`Failed to load template '${templateName}' from ${templatePath}: ${error.message}`);
      throw new TemplateLoadError(templateName, templatePath, error as Error);
    }
  }

  /**
   * Reload all cached templates from the file system.
   * Useful for development when templates are modified.
   */
  async reloadTemplates(): Promise<void> {
    this.logger.log('Reloading all cached templates');

    const cachedTemplateNames = Array.from(this.templateCache.keys());
    this.clearCache();

    // Reload each previously cached template
    for (const templateName of cachedTemplateNames) {
      try {
        await this.loadTemplate(templateName);
        this.logger.debug(`Reloaded template '${templateName}'`);
      } catch (error) {
        this.logger.warn(`Failed to reload template '${templateName}': ${error.message}`);
      }
    }

    this.logger.log(`Reloaded ${cachedTemplateNames.length} templates`);
  }

  /**
   * Check if a template file exists in the templates directory.
   * Supports subdirectory paths (e.g., 'orders/template-order-confirmation')
   */
  templateExists(templateName: string): boolean {
    const templatePath = this.getTemplatePath(templateName);
    return existsSync(templatePath);
  }

  /**
   * Clear the template cache.
   * Forces next loadTemplate call to read from file system.
   */
  clearCache(): void {
    const cacheSize = this.templateCache.size;
    this.templateCache.clear();
    this.logger.debug(`Cleared template cache (${cacheSize} templates)`);
  }

  /**
   * Get the full path to a template file.
   * Supports subdirectory paths (e.g., 'orders/template-order-confirmation')
   */
  getTemplatePath(templateName: string): string {
    // Handle subdirectory paths by preserving the path structure
    const fileName = templateName.includes('/')
      ? `${templateName}${this.config.templateExtension}`
      : `${templateName}${this.config.templateExtension}`;

    return resolve(join(this.config.templatesPath, fileName));
  }

  /**
   * Get the full path to a template file in a subdirectory.
   */
  getTemplatePathInSubdirectory(templateName: string, subdirectory: string): string {
    const fileName = `${templateName}${this.config.templateExtension}`;
    return resolve(join(this.config.templatesPath, subdirectory, fileName));
  }

  /**
   * Load a template from a specific subdirectory.
   */
  async loadTemplateFromSubdirectory(templateName: string, subdirectory: string): Promise<string> {
    const fullTemplateName = `${subdirectory}/${templateName}`;

    try {
      // Check cache first if caching is enabled
      if (this.config.enableCaching && this.templateCache.has(fullTemplateName)) {
        this.logger.debug(`Loading template '${fullTemplateName}' from cache`);
        return this.templateCache.get(fullTemplateName)!;
      }

      // Check if template exists in subdirectory
      const templatePath = this.getTemplatePathInSubdirectory(templateName, subdirectory);
      if (!existsSync(templatePath)) {
        throw new TemplateNotFoundError(fullTemplateName, templatePath);
      }

      // Load template from file system
      this.logger.debug(`Loading template '${fullTemplateName}' from file: ${templatePath}`);
      const templateContent = await fs.readFile(templatePath, 'utf-8');

      // Cache the template if caching is enabled
      if (this.config.enableCaching) {
        this.templateCache.set(fullTemplateName, templateContent);
        this.logger.debug(`Cached template '${fullTemplateName}'`);
      }

      return templateContent;
    } catch (error) {
      if (error instanceof TemplateNotFoundError) {
        this.logger.error(`Template not found: ${error.message}`);
        throw error;
      }

      const templatePath = this.getTemplatePathInSubdirectory(templateName, subdirectory);
      this.logger.error(`Failed to load template '${fullTemplateName}' from ${templatePath}: ${error.message}`);
      throw new TemplateLoadError(fullTemplateName, templatePath, error as Error);
    }
  }

  /**
   * Get configuration for debugging purposes.
   */
  getConfig(): TemplateLoaderConfig {
    return { ...this.config };
  }

  /**
   * Get cache statistics for monitoring.
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.templateCache.size,
      keys: Array.from(this.templateCache.keys())
    };
  }

  /**
   * Register a callback to be called when templates are reloaded.
   * Useful for development mode to notify other services of template changes.
   */
  onTemplateReload(callback: (templateName: string) => void): void {
    this.reloadCallbacks.push(callback);
  }

  /**
   * Start watching template files for changes in development mode.
   */
  startFileWatching(): void {
    if (!this.config.isDevelopment) {
      this.logger.debug('File watching disabled - not in development mode');
      return;
    }

    if (this.fileWatcher) {
      this.logger.debug('File watching already started');
      return;
    }

    try {
      const templatesPath = resolve(this.config.templatesPath);
      this.fileWatcher = watch(templatesPath, { recursive: true }, (eventType, filename) => {
        if (filename && filename.endsWith(this.config.templateExtension!)) {
          this.handleTemplateFileChange(eventType, filename);
        }
      });

      this.logger.log(`Started watching template files in: ${templatesPath}`);
    } catch (error) {
      this.logger.error(`Failed to start file watching: ${error.message}`);
    }
  }

  /**
   * Stop watching template files for changes.
   */
  stopFileWatching(): void {
    if (this.fileWatcher) {
      this.fileWatcher.close();
      this.fileWatcher = undefined;
      this.logger.log('Stopped watching template files');
    }
  }

  /**
   * Force reload a specific template from disk, bypassing cache.
   */
  async forceReloadTemplate(templateName: string): Promise<string> {
    this.logger.debug(`Force reloading template '${templateName}'`);

    // Remove from cache first
    this.templateCache.delete(templateName);

    // Load fresh from disk
    return this.loadTemplate(templateName);
  }

  /**
   * Check if development mode is enabled.
   */
  isDevelopmentMode(): boolean {
    return this.config.isDevelopment;
  }

  /**
   * Validate the configuration on initialization.
   */
  private validateConfiguration(): void {
    if (!this.config.templatesPath) {
      throw new Error('TemplateLoader configuration must include templatesPath');
    }

    if (typeof this.config.isDevelopment !== 'boolean') {
      throw new Error('TemplateLoader isDevelopment must be a boolean');
    }

    if (typeof this.config.enableCaching !== 'boolean') {
      throw new Error('TemplateLoader enableCaching must be a boolean');
    }

    if (!this.config.templateExtension) {
      throw new Error('TemplateLoader templateExtension must be provided');
    }
  }

  /**
   * Initialize and validate the templates directory.
   */
  private initializeTemplatesDirectory(): void {
    const templatesPath = resolve(this.config.templatesPath);

    if (!existsSync(templatesPath)) {
      const error = new Error(`Templates directory does not exist: ${templatesPath}`);
      this.logger.error(`Templates directory initialization failed: ${error.message}`);
      throw new TemplateDirectoryError(templatesPath, error);
    }

    this.logger.log(`Initialized TemplateLoader with templates directory: ${templatesPath}`);
    this.logger.debug(`Configuration: ${JSON.stringify(this.config, null, 2)}`);
  }

  /**
   * Setup development mode features like file watching.
   */
  private setupDevelopmentMode(): void {
    if (this.config.isDevelopment) {
      this.logger.log('Development mode enabled - template hot-reloading available');

      // Start file watching automatically in development
      process.nextTick(() => {
        this.startFileWatching();
      });
    } else {
      this.logger.log('Production mode - template caching enabled');
    }
  }

  /**
   * Handle template file changes in development mode.
   */
  private handleTemplateFileChange(eventType: string, filename: string): void {
    if (!this.config.isDevelopment) {
      return;
    }

    this.logger.debug(`Template file ${eventType}: ${filename}`);

    // Extract template name from filename (remove extension and path)
    const templateName = filename
      .replace(this.config.templateExtension!, '')
      .replace(/\\/g, '/'); // Normalize path separators

    // Remove from cache to force reload on next access
    const wasInCache = this.templateCache.has(templateName);
    this.templateCache.delete(templateName);

    if (wasInCache) {
      this.logger.log(`Template '${templateName}' changed - cleared from cache`);

      // Notify callbacks about the template change
      this.reloadCallbacks.forEach(callback => {
        try {
          callback(templateName);
        } catch (error) {
          this.logger.error(`Error in template reload callback: ${error.message}`);
        }
      });
    }
  }
}