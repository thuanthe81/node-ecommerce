import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { watch, FSWatcher } from 'chokidar';
import { join } from 'path';
import { PDFTemplateLoaderService } from './pdf-template-loader.service';
import { TemplateValidationService } from './template-validation.service';

export interface TemplateChangeEvent {
  templateName: string;
  changeType: 'added' | 'changed' | 'removed';
  filePath: string;
  timestamp: Date;
  isValid?: boolean;
  validationErrors?: string[];
}

export interface TemplateMonitoringStats {
  isMonitoring: boolean;
  watchedFiles: string[];
  totalChanges: number;
  lastChange?: TemplateChangeEvent;
  uptime: number;
  startTime: Date;
}

@Injectable()
export class TemplateMonitoringService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TemplateMonitoringService.name);
  private readonly templateDir = join(__dirname, '..', 'templates');
  private watcher: FSWatcher | null = null;
  private isMonitoring = false;
  private changeHistory: TemplateChangeEvent[] = [];
  private startTime: Date = new Date();
  private readonly maxHistorySize = 100;

  constructor(
    private readonly configService: ConfigService,
    private readonly templateLoader: PDFTemplateLoaderService,
    private readonly templateValidation: TemplateValidationService
  ) {}

  async onModuleInit() {
    // Only enable monitoring in development environment
    const isDevelopment = this.configService.get('NODE_ENV') === 'development';
    const enableMonitoring = this.configService.get('TEMPLATE_MONITORING_ENABLED', 'true') === 'true';

    if (isDevelopment && enableMonitoring) {
      await this.startMonitoring();
    } else {
      this.logger.log('Template monitoring disabled (not in development mode or explicitly disabled)');
    }
  }

  async onModuleDestroy() {
    await this.stopMonitoring();
  }

  /**
   * Start monitoring template files for changes
   * @returns Promise<void>
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      this.logger.warn('Template monitoring is already active');
      return;
    }

    try {
      this.logger.log('Starting template file monitoring...');

      // Watch template directory for changes
      this.watcher = watch(this.templateDir, {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true,
        ignoreInitial: true,
        depth: 1 // only watch direct children
      });

      // Set up event handlers
      this.watcher
        .on('add', (filePath) => this.handleFileChange(filePath, 'added'))
        .on('change', (filePath) => this.handleFileChange(filePath, 'changed'))
        .on('unlink', (filePath) => this.handleFileChange(filePath, 'removed'))
        .on('error', (error) => {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorStack = error instanceof Error ? error.stack : undefined;

          this.logger.error(`Template monitoring error: ${errorMessage}`, {
            error: errorMessage,
            stack: errorStack
          });
        })
        .on('ready', () => {
          this.isMonitoring = true;
          this.startTime = new Date();
          this.logger.log(`Template monitoring started - watching ${this.templateDir}`);
        });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to start template monitoring: ${errorMessage}`, {
        templateDir: this.templateDir,
        error: errorMessage,
        stack: errorStack
      });
      throw error;
    }
  }

  /**
   * Stop monitoring template files
   * @returns Promise<void>
   */
  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring || !this.watcher) {
      return;
    }

    try {
      this.logger.log('Stopping template file monitoring...');

      await this.watcher.close();
      this.watcher = null;
      this.isMonitoring = false;

      this.logger.log('Template monitoring stopped');
    } catch (error) {
      this.logger.error(`Error stopping template monitoring: ${error.message}`, {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Handle file system changes
   * @param filePath - Path of the changed file
   * @param changeType - Type of change
   */
  private async handleFileChange(filePath: string, changeType: 'added' | 'changed' | 'removed'): Promise<void> {
    const fileName = filePath.split(/[/\\]/).pop() || '';

    // Only process template files
    if (!this.isTemplateFile(fileName)) {
      return;
    }

    const templateName = this.getTemplateName(fileName);
    if (!templateName) {
      return;
    }

    this.logger.debug(`Template file ${changeType}: ${fileName}`);

    const changeEvent: TemplateChangeEvent = {
      templateName,
      changeType,
      filePath,
      timestamp: new Date()
    };

    try {
      // Validate the changed template (except for removed files)
      if (changeType !== 'removed') {
        const validationReport = await this.templateValidation.validateTemplate(templateName as any);
        changeEvent.isValid = validationReport.isValid;

        if (!validationReport.isValid) {
          changeEvent.validationErrors = validationReport.errors
            .filter(e => e.severity === 'error')
            .map(e => e.message);

          this.logger.warn(`Template ${templateName} has validation errors after ${changeType}:`, {
            templateName,
            errors: changeEvent.validationErrors
          });
        } else {
          this.logger.log(`Template ${templateName} validated successfully after ${changeType}`);
        }

        // Invalidate cache for hot-reloading
        this.templateLoader.invalidateCache(templateName);
        this.logger.debug(`Cache invalidated for template: ${templateName}`);
      }

      // Add to change history
      this.addToHistory(changeEvent);

      // Log the change
      this.logTemplateChange(changeEvent);

    } catch (error) {
      this.logger.error(`Error processing template change for ${templateName}: ${error.message}`, {
        templateName,
        changeType,
        filePath,
        error: error.message,
        stack: error.stack
      });

      changeEvent.isValid = false;
      changeEvent.validationErrors = [`Processing error: ${error.message}`];
      this.addToHistory(changeEvent);
    }
  }

  /**
   * Check if file is a template file
   * @param fileName - Name of the file
   * @returns boolean - Whether file is a template file
   */
  private isTemplateFile(fileName: string): boolean {
    return fileName.endsWith('.html') || fileName.endsWith('.css');
  }

  /**
   * Get template name from file name
   * @param fileName - Name of the file
   * @returns string | null - Template name or null if not a template
   */
  private getTemplateName(fileName: string): string | null {
    if (fileName === 'order-confirmation.html') return 'order-confirmation';
    if (fileName === 'invoice.html') return 'invoice';
    if (fileName === 'pdf-styles.css') return 'pdf-styles';
    return null;
  }

  /**
   * Add change event to history
   * @param changeEvent - Change event to add
   */
  private addToHistory(changeEvent: TemplateChangeEvent): void {
    this.changeHistory.unshift(changeEvent);

    // Keep history size manageable
    if (this.changeHistory.length > this.maxHistorySize) {
      this.changeHistory = this.changeHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Log template change with appropriate level
   * @param changeEvent - Change event to log
   */
  private logTemplateChange(changeEvent: TemplateChangeEvent): void {
    const { templateName, changeType, isValid, validationErrors } = changeEvent;

    if (changeType === 'removed') {
      this.logger.warn(`Template ${templateName} was removed`, { changeEvent });
    } else if (isValid === false) {
      this.logger.error(`Template ${templateName} ${changeType} with validation errors`, {
        templateName,
        changeType,
        errors: validationErrors
      });
    } else {
      this.logger.log(`Template ${templateName} ${changeType} successfully`, {
        templateName,
        changeType,
        isValid
      });
    }
  }

  /**
   * Get monitoring statistics
   * @returns TemplateMonitoringStats - Current monitoring statistics
   */
  getMonitoringStats(): TemplateMonitoringStats {
    return {
      isMonitoring: this.isMonitoring,
      watchedFiles: this.watcher ? this.watcher.getWatched()[this.templateDir] || [] : [],
      totalChanges: this.changeHistory.length,
      lastChange: this.changeHistory[0],
      uptime: this.isMonitoring ? Date.now() - this.startTime.getTime() : 0,
      startTime: this.startTime
    };
  }

  /**
   * Get change history
   * @param limit - Maximum number of changes to return
   * @returns TemplateChangeEvent[] - Array of recent changes
   */
  getChangeHistory(limit: number = 20): TemplateChangeEvent[] {
    return this.changeHistory.slice(0, limit);
  }

  /**
   * Get changes for a specific template
   * @param templateName - Name of the template
   * @param limit - Maximum number of changes to return
   * @returns TemplateChangeEvent[] - Array of changes for the template
   */
  getTemplateChanges(templateName: string, limit: number = 10): TemplateChangeEvent[] {
    return this.changeHistory
      .filter(change => change.templateName === templateName)
      .slice(0, limit);
  }

  /**
   * Manually trigger cache invalidation for hot-reloading
   * @param templateName - Optional template name, or all if not provided
   */
  invalidateTemplateCache(templateName?: string): void {
    this.templateLoader.invalidateCache(templateName);
    this.logger.log(`Manual cache invalidation triggered${templateName ? ` for ${templateName}` : ' for all templates'}`);
  }

  /**
   * Check if monitoring is active
   * @returns boolean - Whether monitoring is currently active
   */
  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }

  /**
   * Get list of currently watched files
   * @returns string[] - Array of watched file paths
   */
  getWatchedFiles(): string[] {
    if (!this.watcher) return [];

    const watched = this.watcher.getWatched();
    const files: string[] = [];

    for (const [dir, fileList] of Object.entries(watched)) {
      for (const file of fileList) {
        files.push(join(dir, file));
      }
    }

    return files;
  }

  /**
   * Manually validate all templates and update cache
   * @returns Promise<void>
   */
  async refreshAllTemplates(): Promise<void> {
    this.logger.log('Manually refreshing all templates...');

    try {
      // Invalidate all caches
      this.templateLoader.invalidateCache();

      // Validate all templates
      const validationSummary = await this.templateValidation.getValidationSummary();

      this.logger.log('Template refresh completed', {
        totalTemplates: validationSummary.totalTemplates,
        validTemplates: validationSummary.validTemplates,
        invalidTemplates: validationSummary.invalidTemplates,
        totalErrors: validationSummary.totalErrors,
        totalWarnings: validationSummary.totalWarnings
      });

    } catch (error) {
      this.logger.error(`Error refreshing templates: ${error.message}`, {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}