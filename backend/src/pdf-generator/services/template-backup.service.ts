import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile, writeFile, mkdir, readdir, stat, copyFile, unlink } from 'fs/promises';
import { join, dirname, basename, extname } from 'path';
import { existsSync } from 'fs';
import { TemplateValidationService } from './template-validation.service';

export interface TemplateBackup {
  templateName: string;
  version: string;
  filePath: string;
  backupPath: string;
  timestamp: Date;
  fileSize: number;
  checksum: string;
  isValid: boolean;
  validationErrors?: string[];
}

export interface TemplateVersion {
  version: string;
  timestamp: Date;
  filePath: string;
  fileSize: number;
  checksum: string;
  isValid: boolean;
  description?: string;
}

export interface BackupStats {
  totalBackups: number;
  totalVersions: number;
  oldestBackup: Date;
  newestBackup: Date;
  totalSize: number;
  templatesWithBackups: string[];
}

export interface RecoveryResult {
  success: boolean;
  templateName: string;
  restoredVersion: string;
  backupPath: string;
  message: string;
  error?: string;
}

@Injectable()
export class TemplateBackupService {
  private readonly logger = new Logger(TemplateBackupService.name);
  private readonly templateDir = join(__dirname, '..', 'templates');
  private readonly backupDir: string;
  private readonly maxBackupsPerTemplate: number;
  private readonly maxBackupAge: number; // in days

  constructor(
    private readonly configService: ConfigService,
    private readonly templateValidation: TemplateValidationService
  ) {
    this.backupDir = this.configService.get('TEMPLATE_BACKUP_DIR', join(this.templateDir, '..', 'backups'));
    this.maxBackupsPerTemplate = parseInt(this.configService.get('MAX_TEMPLATE_BACKUPS', '10'));
    this.maxBackupAge = parseInt(this.configService.get('MAX_BACKUP_AGE_DAYS', '30'));
  }

  /**
   * Create a backup of a template file before modification
   * @param templateName - Name of the template to backup
   * @param description - Optional description for the backup
   * @returns Promise<TemplateBackup> - Backup information
   */
  async createBackup(templateName: string, description?: string): Promise<TemplateBackup> {
    this.logger.debug(`Creating backup for template: ${templateName}`);

    try {
      // Ensure backup directory exists
      await this.ensureBackupDirectory();

      const templatePath = join(this.templateDir, `${templateName}.html`);

      // Check if template file exists
      if (!existsSync(templatePath)) {
        throw new Error(`Template file not found: ${templatePath}`);
      }

      // Read template content
      const templateContent = await readFile(templatePath, 'utf-8');
      const templateStats = await stat(templatePath);

      // Generate version and backup path
      const version = this.generateVersion();
      const backupFileName = `${templateName}_${version}.html`;
      const backupPath = join(this.backupDir, templateName, backupFileName);

      // Ensure template backup directory exists
      await mkdir(dirname(backupPath), { recursive: true });

      // Create backup file
      await writeFile(backupPath, templateContent, 'utf-8');

      // Generate checksum
      const checksum = this.generateChecksum(templateContent);

      // Validate the backup
      const validationReport = await this.templateValidation.validateTemplate(templateName as any);

      const backup: TemplateBackup = {
        templateName,
        version,
        filePath: templatePath,
        backupPath,
        timestamp: new Date(),
        fileSize: templateStats.size,
        checksum,
        isValid: validationReport.isValid,
        validationErrors: validationReport.isValid ? undefined : validationReport.errors
          .filter(e => e.severity === 'error')
          .map(e => e.message)
      };

      // Save backup metadata
      await this.saveBackupMetadata(backup, description);

      // Clean up old backups
      await this.cleanupOldBackups(templateName);

      this.logger.log(`Backup created successfully for ${templateName} (version: ${version})`);
      return backup;

    } catch (error) {
      this.logger.error(`Failed to create backup for ${templateName}: ${error.message}`, {
        templateName,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Backup creation failed: ${error.message}`);
    }
  }

  /**
   * Restore a template from a backup
   * @param templateName - Name of the template to restore
   * @param version - Version to restore (latest if not specified)
   * @returns Promise<RecoveryResult> - Recovery result
   */
  async restoreFromBackup(templateName: string, version?: string): Promise<RecoveryResult> {
    this.logger.debug(`Restoring template ${templateName}${version ? ` to version ${version}` : ' to latest backup'}`);

    try {
      const backups = await this.getTemplateVersions(templateName);

      if (backups.length === 0) {
        return {
          success: false,
          templateName,
          restoredVersion: '',
          backupPath: '',
          message: `No backups found for template ${templateName}`,
          error: 'No backups available'
        };
      }

      // Find the backup to restore
      let backupToRestore: TemplateVersion;
      if (version) {
        const specificBackup = backups.find(b => b.version === version);
        if (!specificBackup) {
          return {
            success: false,
            templateName,
            restoredVersion: version,
            backupPath: '',
            message: `Backup version ${version} not found for template ${templateName}`,
            error: 'Version not found'
          };
        }
        backupToRestore = specificBackup;
      } else {
        // Use the latest backup
        backupToRestore = backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
      }

      // Create a backup of the current template before restoring
      await this.createBackup(templateName, `Pre-restore backup before restoring to ${backupToRestore.version}`);

      // Restore the template
      const templatePath = join(this.templateDir, `${templateName}.html`);
      await copyFile(backupToRestore.filePath, templatePath);

      // Verify the restored template
      const validationReport = await this.templateValidation.validateTemplate(templateName as any);

      if (!validationReport.isValid) {
        this.logger.warn(`Restored template ${templateName} has validation errors`, {
          templateName,
          version: backupToRestore.version,
          errors: validationReport.errors.filter(e => e.severity === 'error').map(e => e.message)
        });
      }

      this.logger.log(`Template ${templateName} restored successfully to version ${backupToRestore.version}`);

      return {
        success: true,
        templateName,
        restoredVersion: backupToRestore.version,
        backupPath: backupToRestore.filePath,
        message: `Template ${templateName} restored to version ${backupToRestore.version}${!validationReport.isValid ? ' (with validation warnings)' : ''}`
      };

    } catch (error) {
      this.logger.error(`Failed to restore template ${templateName}: ${error.message}`, {
        templateName,
        version,
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        templateName,
        restoredVersion: version || 'latest',
        backupPath: '',
        message: `Failed to restore template ${templateName}`,
        error: error.message
      };
    }
  }

  /**
   * Get all versions of a template
   * @param templateName - Name of the template
   * @returns Promise<TemplateVersion[]> - Array of template versions
   */
  async getTemplateVersions(templateName: string): Promise<TemplateVersion[]> {
    try {
      const templateBackupDir = join(this.backupDir, templateName);

      if (!existsSync(templateBackupDir)) {
        return [];
      }

      const files = await readdir(templateBackupDir);
      const versions: TemplateVersion[] = [];

      for (const file of files) {
        if (file.endsWith('.html')) {
          const filePath = join(templateBackupDir, file);
          const fileStats = await stat(filePath);
          const content = await readFile(filePath, 'utf-8');

          // Extract version from filename
          const versionMatch = file.match(new RegExp(`${templateName}_(\\d{14})\\.html`));
          const version = versionMatch ? versionMatch[1] : 'unknown';

          // Validate the backup
          let isValid = true;
          try {
            const validationReport = await this.templateValidation.validateTemplate(templateName as any);
            isValid = validationReport.isValid;
          } catch {
            isValid = false;
          }

          versions.push({
            version,
            timestamp: fileStats.mtime,
            filePath,
            fileSize: fileStats.size,
            checksum: this.generateChecksum(content),
            isValid
          });
        }
      }

      // Sort by timestamp (newest first)
      return versions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    } catch (error) {
      this.logger.error(`Failed to get template versions for ${templateName}: ${error.message}`);
      return [];
    }
  }

  /**
   * Check template file integrity
   * @param templateName - Name of the template to check
   * @returns Promise<boolean> - Whether template is intact
   */
  async checkTemplateIntegrity(templateName: string): Promise<boolean> {
    try {
      const templatePath = join(this.templateDir, `${templateName}.html`);

      if (!existsSync(templatePath)) {
        this.logger.warn(`Template file not found: ${templatePath}`);
        return false;
      }

      // Read and validate template
      const templateContent = await readFile(templatePath, 'utf-8');

      // Basic integrity checks
      if (templateContent.length === 0) {
        this.logger.warn(`Template ${templateName} is empty`);
        return false;
      }

      // Validate template structure
      const validationReport = await this.templateValidation.validateTemplate(templateName as any);

      if (!validationReport.isValid) {
        this.logger.warn(`Template ${templateName} failed validation`, {
          errors: validationReport.errors.filter(e => e.severity === 'error').map(e => e.message)
        });
        return false;
      }

      return true;

    } catch (error) {
      this.logger.error(`Error checking template integrity for ${templateName}: ${error.message}`);
      return false;
    }
  }

  /**
   * Repair a corrupted template from backup
   * @param templateName - Name of the template to repair
   * @returns Promise<RecoveryResult> - Repair result
   */
  async repairTemplate(templateName: string): Promise<RecoveryResult> {
    this.logger.log(`Attempting to repair template: ${templateName}`);

    try {
      // Check if template needs repair
      const isIntact = await this.checkTemplateIntegrity(templateName);

      if (isIntact) {
        return {
          success: true,
          templateName,
          restoredVersion: 'current',
          backupPath: '',
          message: `Template ${templateName} is already intact, no repair needed`
        };
      }

      // Find the latest valid backup
      const versions = await this.getTemplateVersions(templateName);
      const validBackup = versions.find(v => v.isValid);

      if (!validBackup) {
        return {
          success: false,
          templateName,
          restoredVersion: '',
          backupPath: '',
          message: `No valid backup found for template ${templateName}`,
          error: 'No valid backups available'
        };
      }

      // Restore from the valid backup
      return await this.restoreFromBackup(templateName, validBackup.version);

    } catch (error) {
      this.logger.error(`Failed to repair template ${templateName}: ${error.message}`);

      return {
        success: false,
        templateName,
        restoredVersion: '',
        backupPath: '',
        message: `Failed to repair template ${templateName}`,
        error: error.message
      };
    }
  }

  /**
   * Get backup statistics
   * @returns Promise<BackupStats> - Backup statistics
   */
  async getBackupStats(): Promise<BackupStats> {
    try {
      if (!existsSync(this.backupDir)) {
        return {
          totalBackups: 0,
          totalVersions: 0,
          oldestBackup: new Date(),
          newestBackup: new Date(),
          totalSize: 0,
          templatesWithBackups: []
        };
      }

      const templateDirs = await readdir(this.backupDir);
      let totalBackups = 0;
      let totalVersions = 0;
      let totalSize = 0;
      let oldestBackup = new Date();
      let newestBackup = new Date(0);
      const templatesWithBackups: string[] = [];

      for (const templateDir of templateDirs) {
        const templatePath = join(this.backupDir, templateDir);
        const templateStat = await stat(templatePath);

        if (templateStat.isDirectory()) {
          templatesWithBackups.push(templateDir);
          const versions = await this.getTemplateVersions(templateDir);
          totalVersions += versions.length;

          for (const version of versions) {
            totalBackups++;
            totalSize += version.fileSize;

            if (version.timestamp < oldestBackup) {
              oldestBackup = version.timestamp;
            }

            if (version.timestamp > newestBackup) {
              newestBackup = version.timestamp;
            }
          }
        }
      }

      return {
        totalBackups,
        totalVersions,
        oldestBackup,
        newestBackup,
        totalSize,
        templatesWithBackups
      };

    } catch (error) {
      this.logger.error(`Failed to get backup stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clean up old backups based on retention policy
   * @param templateName - Optional specific template to clean up
   * @returns Promise<number> - Number of backups removed
   */
  async cleanupOldBackups(templateName?: string): Promise<number> {
    let removedCount = 0;

    try {
      const templatesToClean = templateName ? [templateName] : await this.getTemplatesWithBackups();

      for (const template of templatesToClean) {
        const versions = await this.getTemplateVersions(template);

        // Remove backups exceeding max count
        if (versions.length > this.maxBackupsPerTemplate) {
          const toRemove = versions.slice(this.maxBackupsPerTemplate);
          for (const version of toRemove) {
            await unlink(version.filePath);
            removedCount++;
            this.logger.debug(`Removed old backup: ${version.filePath}`);
          }
        }

        // Remove backups exceeding max age
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.maxBackupAge);

        const expiredBackups = versions.filter(v => v.timestamp < cutoffDate);
        for (const expired of expiredBackups) {
          if (existsSync(expired.filePath)) {
            await unlink(expired.filePath);
            removedCount++;
            this.logger.debug(`Removed expired backup: ${expired.filePath}`);
          }
        }
      }

      if (removedCount > 0) {
        this.logger.log(`Cleaned up ${removedCount} old backups`);
      }

    } catch (error) {
      this.logger.error(`Error during backup cleanup: ${error.message}`);
    }

    return removedCount;
  }

  /**
   * Generate a version string based on timestamp
   * @returns string - Version string (YYYYMMDDHHMMSS)
   */
  private generateVersion(): string {
    const now = new Date();
    return now.getFullYear().toString() +
           (now.getMonth() + 1).toString().padStart(2, '0') +
           now.getDate().toString().padStart(2, '0') +
           now.getHours().toString().padStart(2, '0') +
           now.getMinutes().toString().padStart(2, '0') +
           now.getSeconds().toString().padStart(2, '0');
  }

  /**
   * Generate a simple checksum for file content
   * @param content - File content
   * @returns string - Checksum
   */
  private generateChecksum(content: string): string {
    // Simple hash function for checksum
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Ensure backup directory exists
   * @returns Promise<void>
   */
  private async ensureBackupDirectory(): Promise<void> {
    if (!existsSync(this.backupDir)) {
      await mkdir(this.backupDir, { recursive: true });
      this.logger.log(`Created backup directory: ${this.backupDir}`);
    }
  }

  /**
   * Save backup metadata
   * @param backup - Backup information
   * @param description - Optional description
   * @returns Promise<void>
   */
  private async saveBackupMetadata(backup: TemplateBackup, description?: string): Promise<void> {
    const metadataPath = join(dirname(backup.backupPath), `${basename(backup.backupPath, '.html')}.meta.json`);

    const metadata = {
      ...backup,
      description,
      createdAt: backup.timestamp.toISOString()
    };

    await writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
  }

  /**
   * Get list of templates that have backups
   * @returns Promise<string[]> - Array of template names
   */
  private async getTemplatesWithBackups(): Promise<string[]> {
    try {
      if (!existsSync(this.backupDir)) {
        return [];
      }

      const items = await readdir(this.backupDir);
      const templates: string[] = [];

      for (const item of items) {
        const itemPath = join(this.backupDir, item);
        const itemStat = await stat(itemPath);

        if (itemStat.isDirectory()) {
          templates.push(item);
        }
      }

      return templates;
    } catch (error) {
      this.logger.error(`Error getting templates with backups: ${error.message}`);
      return [];
    }
  }
}