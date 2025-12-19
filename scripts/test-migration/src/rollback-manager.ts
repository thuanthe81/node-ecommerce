import * as fs from 'fs/promises';
import * as path from 'path';
import { DiscoveredTestFile, MigrationConfig } from './types';
import { BatchPathMappingResult } from './path-mapping';

/**
 * Rollback plan containing all information needed to restore original state
 */
export interface RollbackPlan {
  id: string;
  timestamp: Date;
  backupDirectory: string;
  originalFiles: DiscoveredTestFile[];
  targetPaths: Map<string, string>;
  createdDirectories: string[];
  removedDirectories: string[];
  config: MigrationConfig;
}

/**
 * Result of rollback operation
 */
export interface RollbackResult {
  success: boolean;
  restoredFiles: string[];
  failedFiles: string[];
  removedDirectories: string[];
  errors: string[];
  warnings: string[];
}

/**
 * Rollback manager for handling migration failures and restoration
 */
export class RollbackManager {
  private rollbackPlansDir: string;

  constructor(private config: MigrationConfig) {
    this.rollbackPlansDir = path.join(process.cwd(), '.migration-rollback-plans');
  }

  /**
   * Create a rollback plan before migration
   */
  async createRollbackPlan(
    originalFiles: DiscoveredTestFile[],
    pathMappingResult: BatchPathMappingResult,
    backupDirectory: string
  ): Promise<RollbackPlan> {
    const id = `migration-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date();

    // Create target paths map
    const targetPaths = new Map<string, string>();
    for (const mapping of pathMappingResult.mappings) {
      targetPaths.set(mapping.discoveredFile.filePath, mapping.targetPath);
    }

    // Identify directories that will be created
    const createdDirectories = await this.identifyDirectoriesToCreate(pathMappingResult);

    const rollbackPlan: RollbackPlan = {
      id,
      timestamp,
      backupDirectory,
      originalFiles,
      targetPaths,
      createdDirectories,
      removedDirectories: [], // Will be populated during cleanup
      config: { ...this.config }
    };

    // Save rollback plan
    await this.saveRollbackPlan(rollbackPlan);

    return rollbackPlan;
  }

  /**
   * Update rollback plan with directories that were removed during cleanup
   */
  async updateRollbackPlanWithRemovedDirectories(
    planId: string,
    removedDirectories: string[]
  ): Promise<void> {
    const plan = await this.loadRollbackPlan(planId);
    if (plan) {
      plan.removedDirectories = removedDirectories;
      await this.saveRollbackPlan(plan);
    }
  }

  /**
   * Execute rollback to restore original state
   */
  async executeRollback(planId: string): Promise<RollbackResult> {
    const plan = await this.loadRollbackPlan(planId);
    if (!plan) {
      return {
        success: false,
        restoredFiles: [],
        failedFiles: [],
        removedDirectories: [],
        errors: [`Rollback plan not found: ${planId}`],
        warnings: []
      };
    }

    const restoredFiles: string[] = [];
    const failedFiles: string[] = [];
    const removedDirectories: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      if (this.config.verbose) {
        console.log(`Executing rollback plan: ${planId}`);
        console.log(`Backup directory: ${plan.backupDirectory}`);
      }

      // Step 1: Verify backup exists
      const backupExists = await this.verifyBackupExists(plan.backupDirectory);
      if (!backupExists) {
        errors.push(`Backup directory not found: ${plan.backupDirectory}`);
        return {
          success: false,
          restoredFiles,
          failedFiles,
          removedDirectories,
          errors,
          warnings
        };
      }

      // Step 2: Remove migrated files from target locations
      await this.removeMigratedFiles(plan, errors, warnings);

      // Step 3: Restore original files from backup
      const restoreResult = await this.restoreFilesFromBackup(plan);
      restoredFiles.push(...restoreResult.restored);
      failedFiles.push(...restoreResult.failed);
      errors.push(...restoreResult.errors);

      // Step 4: Remove created directories (in reverse order)
      const dirRemovalResult = await this.removeCreatedDirectories(plan);
      removedDirectories.push(...dirRemovalResult.removed);
      errors.push(...dirRemovalResult.errors);

      // Step 5: Restore removed directories
      await this.restoreRemovedDirectories(plan, warnings);

      if (this.config.verbose) {
        console.log(`Rollback completed:`);
        console.log(`  Restored files: ${restoredFiles.length}`);
        console.log(`  Failed files: ${failedFiles.length}`);
        console.log(`  Removed directories: ${removedDirectories.length}`);
      }

    } catch (error) {
      errors.push(`Rollback execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      success: errors.length === 0 && failedFiles.length === 0,
      restoredFiles,
      failedFiles,
      removedDirectories,
      errors,
      warnings
    };
  }

  /**
   * List available rollback plans
   */
  async listRollbackPlans(): Promise<Array<{
    id: string;
    timestamp: Date;
    fileCount: number;
    backupDirectory: string;
  }>> {
    try {
      await fs.mkdir(this.rollbackPlansDir, { recursive: true });
      const files = await fs.readdir(this.rollbackPlansDir);
      const plans = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const plan = await this.loadRollbackPlan(file.replace('.json', ''));
            if (plan) {
              plans.push({
                id: plan.id,
                timestamp: plan.timestamp,
                fileCount: plan.originalFiles.length,
                backupDirectory: plan.backupDirectory
              });
            }
          } catch {
            // Skip invalid plan files
          }
        }
      }

      return plans.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch {
      return [];
    }
  }

  /**
   * Delete a rollback plan
   */
  async deleteRollbackPlan(planId: string): Promise<boolean> {
    try {
      const planPath = path.join(this.rollbackPlansDir, `${planId}.json`);
      await fs.unlink(planPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clean up old rollback plans (older than specified days)
   */
  async cleanupOldRollbackPlans(olderThanDays: number = 30): Promise<{
    deleted: string[];
    errors: string[];
  }> {
    const deleted: string[] = [];
    const errors: string[] = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    try {
      const plans = await this.listRollbackPlans();

      for (const plan of plans) {
        if (plan.timestamp < cutoffDate) {
          const success = await this.deleteRollbackPlan(plan.id);
          if (success) {
            deleted.push(plan.id);
          } else {
            errors.push(`Failed to delete rollback plan: ${plan.id}`);
          }
        }
      }
    } catch (error) {
      errors.push(`Failed to cleanup rollback plans: ${error instanceof Error ? error.message : String(error)}`);
    }

    return { deleted, errors };
  }

  /**
   * Verify that a rollback can be performed
   */
  async verifyRollbackPossible(planId: string): Promise<{
    possible: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const plan = await this.loadRollbackPlan(planId);
    if (!plan) {
      errors.push(`Rollback plan not found: ${planId}`);
      return { possible: false, errors, warnings };
    }

    // Check if backup directory exists
    const backupExists = await this.verifyBackupExists(plan.backupDirectory);
    if (!backupExists) {
      errors.push(`Backup directory not found: ${plan.backupDirectory}`);
    }

    // Check if original source directories are writable
    const sourceDirectories = [
      path.dirname(plan.originalFiles[0]?.filePath || ''),
      // Add more as needed
    ].filter(Boolean);

    for (const dir of sourceDirectories) {
      try {
        await fs.access(dir, fs.constants.W_OK);
      } catch {
        errors.push(`Source directory not writable: ${dir}`);
      }
    }

    // Check if any original files have been modified since backup
    for (const file of plan.originalFiles) {
      const targetPath = plan.targetPaths.get(file.filePath);
      if (targetPath) {
        try {
          const stats = await fs.stat(targetPath);
          if (stats.mtime > plan.timestamp) {
            warnings.push(`Target file has been modified since migration: ${targetPath}`);
          }
        } catch {
          // File doesn't exist, which is fine for rollback
        }
      }
    }

    return {
      possible: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Save rollback plan to disk
   */
  private async saveRollbackPlan(plan: RollbackPlan): Promise<void> {
    await fs.mkdir(this.rollbackPlansDir, { recursive: true });
    const planPath = path.join(this.rollbackPlansDir, `${plan.id}.json`);

    // Convert Map to object for JSON serialization
    const serializable = {
      ...plan,
      targetPaths: Object.fromEntries(plan.targetPaths)
    };

    await fs.writeFile(planPath, JSON.stringify(serializable, null, 2));
  }

  /**
   * Load rollback plan from disk
   */
  private async loadRollbackPlan(planId: string): Promise<RollbackPlan | null> {
    try {
      const planPath = path.join(this.rollbackPlansDir, `${planId}.json`);
      const content = await fs.readFile(planPath, 'utf8');
      const data = JSON.parse(content);

      // Convert object back to Map
      return {
        ...data,
        timestamp: new Date(data.timestamp),
        targetPaths: new Map(Object.entries(data.targetPaths))
      };
    } catch {
      return null;
    }
  }

  /**
   * Identify directories that will be created during migration
   */
  private async identifyDirectoriesToCreate(
    pathMappingResult: BatchPathMappingResult
  ): Promise<string[]> {
    const directories = new Set<string>();

    for (const mapping of pathMappingResult.mappings) {
      let currentDir = path.dirname(mapping.targetPath);

      // Walk up the directory tree until we find an existing directory
      while (currentDir !== path.dirname(currentDir)) {
        try {
          await fs.stat(currentDir);
          break; // Directory exists
        } catch {
          directories.add(currentDir);
          currentDir = path.dirname(currentDir);
        }
      }
    }

    return Array.from(directories).sort((a, b) => b.length - a.length); // Deepest first
  }

  /**
   * Verify that backup directory exists and contains expected files
   */
  private async verifyBackupExists(backupDirectory: string): Promise<boolean> {
    try {
      const stats = await fs.stat(backupDirectory);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Remove migrated files from target locations
   */
  private async removeMigratedFiles(
    plan: RollbackPlan,
    errors: string[],
    warnings: string[]
  ): Promise<void> {
    for (const [, targetPath] of plan.targetPaths) {
      try {
        await fs.unlink(targetPath);
        if (this.config.verbose) {
          console.log(`Removed migrated file: ${targetPath}`);
        }
      } catch (error) {
        if ((error as any).code === 'ENOENT') {
          warnings.push(`Target file already removed: ${targetPath}`);
        } else {
          errors.push(`Failed to remove target file ${targetPath}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
  }

  /**
   * Restore files from backup to original locations
   */
  private async restoreFilesFromBackup(plan: RollbackPlan): Promise<{
    restored: string[];
    failed: string[];
    errors: string[];
  }> {
    const restored: string[] = [];
    const failed: string[] = [];
    const errors: string[] = [];

    for (const originalFile of plan.originalFiles) {
      try {
        // Find backup file
        const relativePath = path.relative(process.cwd(), originalFile.filePath);
        const backupPath = path.join(plan.backupDirectory, relativePath);

        // Ensure target directory exists
        const targetDir = path.dirname(originalFile.filePath);
        await fs.mkdir(targetDir, { recursive: true });

        // Copy file from backup to original location
        await fs.copyFile(backupPath, originalFile.filePath);
        restored.push(originalFile.filePath);

        if (this.config.verbose) {
          console.log(`Restored file: ${originalFile.filePath}`);
        }
      } catch (error) {
        failed.push(originalFile.filePath);
        errors.push(`Failed to restore ${originalFile.filePath}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return { restored, failed, errors };
  }

  /**
   * Remove directories that were created during migration
   */
  private async removeCreatedDirectories(plan: RollbackPlan): Promise<{
    removed: string[];
    errors: string[];
  }> {
    const removed: string[] = [];
    const errors: string[] = [];

    // Remove in reverse order (deepest first)
    for (const dir of plan.createdDirectories) {
      try {
        // Only remove if directory is empty
        const contents = await fs.readdir(dir);
        if (contents.length === 0) {
          await fs.rmdir(dir);
          removed.push(dir);
          if (this.config.verbose) {
            console.log(`Removed created directory: ${dir}`);
          }
        }
      } catch (error) {
        if ((error as any).code !== 'ENOENT') {
          errors.push(`Failed to remove directory ${dir}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    return { removed, errors };
  }

  /**
   * Restore directories that were removed during cleanup
   */
  private async restoreRemovedDirectories(
    plan: RollbackPlan,
    warnings: string[]
  ): Promise<void> {
    for (const dir of plan.removedDirectories) {
      try {
        await fs.mkdir(dir, { recursive: true });
        if (this.config.verbose) {
          console.log(`Restored removed directory: ${dir}`);
        }
      } catch (error) {
        warnings.push(`Failed to restore directory ${dir}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
}