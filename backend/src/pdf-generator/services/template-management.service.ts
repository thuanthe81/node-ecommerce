import { Injectable, Logger } from '@nestjs/common';
import { PDFTemplateLoaderService } from './pdf-template-loader.service';
import { TemplateValidationService, TemplateValidationReport } from './template-validation.service';
import { TemplateMonitoringService } from './template-monitoring.service';
import { TemplateBackupService, RecoveryResult, BackupStats } from './template-backup.service';

export interface TemplateManagementStats {
  validation: {
    totalTemplates: number;
    validTemplates: number;
    invalidTemplates: number;
    totalErrors: number;
    totalWarnings: number;
    lastValidation: Date;
  };
  monitoring: {
    isMonitoring: boolean;
    watchedFiles: string[];
    totalChanges: number;
    uptime: number;
    startTime: Date;
  };
  backup: BackupStats;
  cache: {
    size: number;
    keys: string[];
  };
}

export interface TemplateHealthCheck {
  templateName: string;
  isHealthy: boolean;
  issues: string[];
  recommendations: string[];
  lastChecked: Date;
  validationReport?: TemplateValidationReport;
}

@Injectable()
export class TemplateManagementService {
  private readonly logger = new Logger(TemplateManagementService.name);

  constructor(
    private readonly templateLoader: PDFTemplateLoaderService,
    private readonly templateValidation: TemplateValidationService,
    private readonly templateMonitoring: TemplateMonitoringService,
    private readonly templateBackup: TemplateBackupService
  ) {}

  /**
   * Perform comprehensive health check on all templates
   * @returns Promise<TemplateHealthCheck[]> - Health check results for all templates
   */
  async performHealthCheck(): Promise<TemplateHealthCheck[]> {
    this.logger.log('Performing comprehensive template health check...');

    const templates: ('order-confirmation' | 'invoice')[] = ['order-confirmation', 'invoice'];
    const healthChecks: TemplateHealthCheck[] = [];

    for (const templateName of templates) {
      const healthCheck = await this.checkTemplateHealth(templateName);
      healthChecks.push(healthCheck);
    }

    const healthyTemplates = healthChecks.filter(hc => hc.isHealthy).length;
    this.logger.log(`Health check completed: ${healthyTemplates}/${healthChecks.length} templates healthy`);

    return healthChecks;
  }

  /**
   * Check health of a specific template
   * @param templateName - Name of the template to check
   * @returns Promise<TemplateHealthCheck> - Health check result
   */
  async checkTemplateHealth(templateName: 'order-confirmation' | 'invoice'): Promise<TemplateHealthCheck> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let validationReport: TemplateValidationReport | undefined;

    try {
      // 1. Check if template file exists and is accessible
      const templateExists = await this.templateLoader.templateExists(templateName);
      if (!templateExists) {
        issues.push(`Template file ${templateName}.html not found`);
        recommendations.push('Restore template from backup or recreate template file');
      }

      // 2. Validate template structure and content
      validationReport = await this.templateValidation.validateTemplate(templateName);
      if (!validationReport.isValid) {
        const errorCount = validationReport.errors.filter(e => e.severity === 'error').length;
        issues.push(`Template has ${errorCount} validation errors`);
        recommendations.push('Fix validation errors or restore from a valid backup');
      }

      if (validationReport.warnings.length > 0) {
        recommendations.push(`Address ${validationReport.warnings.length} validation warnings for better quality`);
      }

      // 3. Check template integrity
      const isIntact = await this.templateBackup.checkTemplateIntegrity(templateName);
      if (!isIntact) {
        issues.push('Template file integrity check failed');
        recommendations.push('Repair template using backup recovery system');
      }

      // 4. Check backup availability
      const versions = await this.templateBackup.getTemplateVersions(templateName);
      if (versions.length === 0) {
        recommendations.push('Create initial backup for template recovery');
      } else {
        const validBackups = versions.filter(v => v.isValid);
        if (validBackups.length === 0) {
          issues.push('No valid backups available for recovery');
          recommendations.push('Create a valid backup after fixing current template issues');
        }
      }

      // 5. Check cache status
      const cacheStats = this.templateLoader.getCacheStats();
      const isCached = cacheStats.keys.includes(`template-${templateName}`);
      if (!isCached && templateExists) {
        recommendations.push('Template not cached - consider pre-loading for better performance');
      }

    } catch (error) {
      issues.push(`Health check failed: ${error.message}`);
      recommendations.push('Investigate and resolve underlying system issues');
    }

    const isHealthy = issues.length === 0;

    return {
      templateName,
      isHealthy,
      issues,
      recommendations,
      lastChecked: new Date(),
      validationReport
    };
  }

  /**
   * Get comprehensive management statistics
   * @returns Promise<TemplateManagementStats> - Complete management statistics
   */
  async getManagementStats(): Promise<TemplateManagementStats> {
    try {
      const [validationSummary, monitoringStats, backupStats, cacheStats] = await Promise.all([
        this.templateValidation.getValidationSummary(),
        this.templateMonitoring.getMonitoringStats(),
        this.templateBackup.getBackupStats(),
        Promise.resolve(this.templateLoader.getCacheStats())
      ]);

      return {
        validation: validationSummary,
        monitoring: monitoringStats,
        backup: backupStats,
        cache: cacheStats
      };
    } catch (error) {
      this.logger.error(`Failed to get management stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Perform template maintenance operations
   * @returns Promise<object> - Maintenance results
   */
  async performMaintenance(): Promise<{
    backupsCreated: number;
    backupsRemoved: number;
    cacheCleared: boolean;
    templatesValidated: number;
    errors: string[];
  }> {
    this.logger.log('Starting template maintenance operations...');

    const results = {
      backupsCreated: 0,
      backupsRemoved: 0,
      cacheCleared: false,
      templatesValidated: 0,
      errors: [] as string[]
    };

    try {
      // 1. Create backups for current templates
      const templates: ('order-confirmation' | 'invoice')[] = ['order-confirmation', 'invoice'];

      for (const templateName of templates) {
        try {
          await this.templateBackup.createBackup(templateName, 'Scheduled maintenance backup');
          results.backupsCreated++;
        } catch (error) {
          results.errors.push(`Failed to backup ${templateName}: ${error.message}`);
        }
      }

      // 2. Clean up old backups
      try {
        results.backupsRemoved = await this.templateBackup.cleanupOldBackups();
      } catch (error) {
        results.errors.push(`Backup cleanup failed: ${error.message}`);
      }

      // 3. Clear and refresh template cache
      try {
        this.templateLoader.invalidateCache();
        results.cacheCleared = true;
      } catch (error) {
        results.errors.push(`Cache clearing failed: ${error.message}`);
      }

      // 4. Validate all templates
      try {
        const validationReports = await this.templateValidation.validateAllTemplates();
        results.templatesValidated = validationReports.length;
      } catch (error) {
        results.errors.push(`Template validation failed: ${error.message}`);
      }

      this.logger.log('Template maintenance completed', results);

    } catch (error) {
      this.logger.error(`Template maintenance failed: ${error.message}`);
      results.errors.push(`Maintenance operation failed: ${error.message}`);
    }

    return results;
  }

  /**
   * Emergency template recovery
   * @param templateName - Name of the template to recover
   * @returns Promise<RecoveryResult> - Recovery result
   */
  async emergencyRecovery(templateName: 'order-confirmation' | 'invoice'): Promise<RecoveryResult> {
    this.logger.warn(`Initiating emergency recovery for template: ${templateName}`);

    try {
      // 1. Check if template needs recovery
      const healthCheck = await this.checkTemplateHealth(templateName);

      if (healthCheck.isHealthy) {
        return {
          success: true,
          templateName,
          restoredVersion: 'current',
          backupPath: '',
          message: `Template ${templateName} is healthy, no recovery needed`
        };
      }

      // 2. Attempt automatic repair
      const repairResult = await this.templateBackup.repairTemplate(templateName);

      if (repairResult.success) {
        // 3. Clear cache to force reload
        this.templateLoader.invalidateCache(templateName);

        // 4. Validate the recovered template
        const validationReport = await this.templateValidation.validateTemplate(templateName);

        if (validationReport.isValid) {
          this.logger.log(`Emergency recovery successful for ${templateName}`);
          return repairResult;
        } else {
          this.logger.warn(`Recovered template ${templateName} has validation issues`);
          return {
            ...repairResult,
            message: `${repairResult.message} (with validation warnings)`
          };
        }
      }

      return repairResult;

    } catch (error) {
      this.logger.error(`Emergency recovery failed for ${templateName}: ${error.message}`);

      return {
        success: false,
        templateName,
        restoredVersion: '',
        backupPath: '',
        message: `Emergency recovery failed for ${templateName}`,
        error: error.message
      };
    }
  }

  /**
   * Validate and refresh all templates
   * @returns Promise<void>
   */
  async refreshAllTemplates(): Promise<void> {
    this.logger.log('Refreshing all templates...');

    try {
      // 1. Clear all caches
      this.templateLoader.invalidateCache();

      // 2. Validate all templates
      await this.templateValidation.validateAllTemplates();

      // 3. Refresh monitoring if active
      if (this.templateMonitoring.isMonitoringActive()) {
        await this.templateMonitoring.refreshAllTemplates();
      }

      this.logger.log('All templates refreshed successfully');

    } catch (error) {
      this.logger.error(`Failed to refresh templates: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get template change history
   * @param templateName - Optional specific template name
   * @param limit - Maximum number of changes to return
   * @returns Array of template changes
   */
  getTemplateChangeHistory(templateName?: string, limit: number = 20): any[] {
    if (templateName) {
      return this.templateMonitoring.getTemplateChanges(templateName, limit);
    }
    return this.templateMonitoring.getChangeHistory(limit);
  }

  /**
   * Create manual backup with description
   * @param templateName - Name of the template to backup
   * @param description - Description for the backup
   * @returns Promise<any> - Backup result
   */
  async createManualBackup(templateName: 'order-confirmation' | 'invoice', description: string): Promise<any> {
    this.logger.log(`Creating manual backup for ${templateName}: ${description}`);

    try {
      const backup = await this.templateBackup.createBackup(templateName, description);
      this.logger.log(`Manual backup created successfully for ${templateName}`);
      return backup;
    } catch (error) {
      this.logger.error(`Failed to create manual backup for ${templateName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * List available template versions for recovery
   * @param templateName - Name of the template
   * @returns Promise<any[]> - Array of available versions
   */
  async getAvailableVersions(templateName: 'order-confirmation' | 'invoice'): Promise<any[]> {
    return await this.templateBackup.getTemplateVersions(templateName);
  }

  /**
   * Restore template to specific version
   * @param templateName - Name of the template
   * @param version - Version to restore to
   * @returns Promise<RecoveryResult> - Recovery result
   */
  async restoreToVersion(templateName: 'order-confirmation' | 'invoice', version: string): Promise<RecoveryResult> {
    this.logger.log(`Restoring ${templateName} to version ${version}`);

    try {
      const result = await this.templateBackup.restoreFromBackup(templateName, version);

      if (result.success) {
        // Clear cache to force reload
        this.templateLoader.invalidateCache(templateName);
        this.logger.log(`Template ${templateName} restored to version ${version}`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to restore ${templateName} to version ${version}: ${error.message}`);
      throw error;
    }
  }
}