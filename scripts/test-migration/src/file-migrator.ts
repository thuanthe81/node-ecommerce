import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { DiscoveredTestFile, ImportStatement, MigrationConfig } from './types';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);
const rmdir = promisify(fs.rmdir);
const readdir = promisify(fs.readdir);

/**
 * Result of a file migration operation
 */
export interface MigrationResult {
  success: boolean;
  filePath: string;
  targetPath: string;
  error?: string;
  warnings: string[];
}

/**
 * Result of a batch migration operation
 */
export interface BatchMigrationResult {
  successful: MigrationResult[];
  failed: MigrationResult[];
  totalFiles: number;
  errors: string[];
  warnings: string[];
}

/**
 * Options for directory cleanup
 */
export interface CleanupOptions {
  removeEmptyDirectories: boolean;
  preserveDirectories: string[];
  dryRun: boolean;
}

/**
 * File migration system that handles moving test files and updating their content
 */
export class FileMigrator {
  private config: MigrationConfig;

  constructor(config: MigrationConfig) {
    this.config = config;
  }

  /**
   * Create target directory structure for a file path
   */
  async createTargetDirectory(targetPath: string): Promise<{ success: boolean, error?: string }> {
    try {
      const targetDir = path.dirname(targetPath);

      // Check if directory already exists
      try {
        const stats = await stat(targetDir);
        if (stats.isDirectory()) {
          return { success: true };
        }
      } catch (error) {
        // Directory doesn't exist, continue to create it
      }

      if (this.config.dryRun) {
        if (this.config.verbose) {
          console.log(`[DRY RUN] Would create directory: ${targetDir}`);
        }
        return { success: true };
      }

      await mkdir(targetDir, { recursive: true });

      if (this.config.verbose) {
        console.log(`Created directory: ${targetDir}`);
      }

      return { success: true };
    } catch (error) {
      const errorMessage = `Failed to create directory for ${targetPath}: ${error instanceof Error ? error.message : String(error)}`;
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Update file content with new import paths
   */
  updateFileContent(originalContent: string, imports: ImportStatement[]): string {
    let updatedContent = originalContent;
    const lines = originalContent.split('\n');

    // Sort imports by line number in descending order to avoid line number shifts
    const sortedImports = [...imports].sort((a, b) => b.lineNumber - a.lineNumber);

    for (const importStatement of sortedImports) {
      if (importStatement.originalPath !== importStatement.updatedPath) {
        const lineIndex = importStatement.lineNumber - 1;
        if (lineIndex >= 0 && lineIndex < lines.length) {
          const originalLine = lines[lineIndex];
          const updatedLine = originalLine.replace(
            importStatement.originalPath,
            importStatement.updatedPath
          );
          lines[lineIndex] = updatedLine;
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Migrate a single test file
   */
  async migrateFile(
    filePath: string,
    targetPath: string,
    imports: ImportStatement[]
  ): Promise<MigrationResult> {
    const warnings: string[] = [];

    try {
      // Check if source file exists
      try {
        await stat(filePath);
      } catch (error) {
        return {
          success: false,
          filePath,
          targetPath,
          error: `Source file does not exist: ${filePath}`,
          warnings
        };
      }

      // Check if target file already exists
      try {
        await stat(targetPath);
        warnings.push(`Target file already exists and will be overwritten: ${targetPath}`);
      } catch (error) {
        // Target doesn't exist, which is expected
      }

      // Create target directory
      const dirResult = await this.createTargetDirectory(targetPath);
      if (!dirResult.success) {
        return {
          success: false,
          filePath,
          targetPath,
          error: dirResult.error,
          warnings
        };
      }

      // Read original file content
      const originalContent = await readFile(filePath, 'utf8');

      // Update content with new import paths
      const updatedContent = this.updateFileContent(originalContent, imports);

      if (this.config.dryRun) {
        if (this.config.verbose) {
          console.log(`[DRY RUN] Would migrate: ${filePath} -> ${targetPath}`);
          if (imports.length > 0) {
            console.log(`[DRY RUN] Would update ${imports.length} import statements`);
          }
        }
        return {
          success: true,
          filePath,
          targetPath,
          warnings
        };
      }

      // Write updated content to target location
      await writeFile(targetPath, updatedContent, 'utf8');

      // Remove original file
      await unlink(filePath);

      if (this.config.verbose) {
        console.log(`Migrated: ${filePath} -> ${targetPath}`);
        if (imports.length > 0) {
          console.log(`Updated ${imports.length} import statements`);
        }
      }

      return {
        success: true,
        filePath,
        targetPath,
        warnings
      };

    } catch (error) {
      return {
        success: false,
        filePath,
        targetPath,
        error: `Migration failed: ${error instanceof Error ? error.message : String(error)}`,
        warnings
      };
    }
  }

  /**
   * Migrate multiple test files in batch
   */
  async batchMigrateFiles(
    migrations: Array<{
      filePath: string;
      targetPath: string;
      imports: ImportStatement[];
    }>
  ): Promise<BatchMigrationResult> {
    const successful: MigrationResult[] = [];
    const failed: MigrationResult[] = [];
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    if (this.config.verbose) {
      console.log(`Starting batch migration of ${migrations.length} files...`);
    }

    for (const migration of migrations) {
      const result = await this.migrateFile(
        migration.filePath,
        migration.targetPath,
        migration.imports
      );

      if (result.success) {
        successful.push(result);
      } else {
        failed.push(result);
        if (result.error) {
          allErrors.push(result.error);
        }
      }

      allWarnings.push(...result.warnings);
    }

    if (this.config.verbose) {
      console.log(`Batch migration complete: ${successful.length} successful, ${failed.length} failed`);
    }

    return {
      successful,
      failed,
      totalFiles: migrations.length,
      errors: allErrors,
      warnings: allWarnings
    };
  }

  /**
   * Check if a directory is empty
   */
  async isDirectoryEmpty(dirPath: string): Promise<boolean> {
    try {
      const files = await readdir(dirPath);
      return files.length === 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Remove empty directories after migration
   */
  async cleanupEmptyDirectories(
    sourceDirectories: string[],
    options: CleanupOptions = {
      removeEmptyDirectories: true,
      preserveDirectories: [],
      dryRun: false
    }
  ): Promise<{ removed: string[], errors: string[] }> {
    const removed: string[] = [];
    const errors: string[] = [];

    if (!options.removeEmptyDirectories) {
      return { removed, errors };
    }

    for (const sourceDir of sourceDirectories) {
      try {
        await this.cleanupDirectoryRecursive(sourceDir, options, removed, errors);
      } catch (error) {
        errors.push(`Failed to cleanup directory ${sourceDir}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return { removed, errors };
  }

  /**
   * Recursively clean up empty directories
   */
  private async cleanupDirectoryRecursive(
    dirPath: string,
    options: CleanupOptions,
    removed: string[],
    errors: string[]
  ): Promise<void> {
    try {
      // Check if directory should be preserved
      if (options.preserveDirectories.includes(dirPath)) {
        return;
      }

      // Get directory contents
      const files = await readdir(dirPath);

      // Recursively process subdirectories first
      for (const file of files) {
        const fullPath = path.join(dirPath, file);
        try {
          const stats = await stat(fullPath);
          if (stats.isDirectory()) {
            await this.cleanupDirectoryRecursive(fullPath, options, removed, errors);
          }
        } catch (error) {
          // Skip files that can't be accessed
        }
      }

      // Check if directory is now empty
      if (await this.isDirectoryEmpty(dirPath)) {
        if (options.dryRun) {
          if (this.config.verbose) {
            console.log(`[DRY RUN] Would remove empty directory: ${dirPath}`);
          }
        } else {
          await rmdir(dirPath);
          removed.push(dirPath);

          if (this.config.verbose) {
            console.log(`Removed empty directory: ${dirPath}`);
          }
        }
      }
    } catch (error) {
      errors.push(`Failed to process directory ${dirPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate file system permissions before migration
   */
  async validatePermissions(
    filePaths: string[],
    targetPaths: string[]
  ): Promise<{ valid: boolean, errors: string[] }> {
    const errors: string[] = [];

    // Check read permissions for source files
    for (const filePath of filePaths) {
      try {
        await fs.promises.access(filePath, fs.constants.R_OK);
      } catch (error) {
        errors.push(`Cannot read source file: ${filePath}`);
      }
    }

    // Check write permissions for target directories
    const targetDirs = new Set(targetPaths.map(p => path.dirname(p)));
    for (const targetDir of targetDirs) {
      try {
        // Try to create directory if it doesn't exist
        await mkdir(targetDir, { recursive: true });
        await fs.promises.access(targetDir, fs.constants.W_OK);
      } catch (error) {
        errors.push(`Cannot write to target directory: ${targetDir}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create a backup of files before migration
   */
  async createBackup(
    filePaths: string[],
    backupDir: string
  ): Promise<{ success: boolean, backupPaths: string[], errors: string[] }> {
    const backupPaths: string[] = [];
    const errors: string[] = [];

    try {
      // Create backup directory
      await mkdir(backupDir, { recursive: true });

      for (const filePath of filePaths) {
        try {
          // Create a safe backup path that preserves structure but avoids path traversal issues
          const absolutePath = path.resolve(filePath);
          const relativePath = path.relative(process.cwd(), absolutePath);

          // Replace any path separators that go up directories with safe alternatives
          const safePath = relativePath.replace(/\.\./g, 'parent').replace(/^\/+/, '');
          const backupPath = path.join(backupDir, safePath);
          const backupDirPath = path.dirname(backupPath);

          // Create backup subdirectory
          await mkdir(backupDirPath, { recursive: true });

          // Copy file to backup location
          const content = await readFile(filePath, 'utf8');
          await writeFile(backupPath, content, 'utf8');

          backupPaths.push(backupPath);

          if (this.config.verbose) {
            console.log(`Backed up: ${filePath} -> ${backupPath}`);
          }
        } catch (error) {
          errors.push(`Failed to backup ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      return {
        success: errors.length === 0,
        backupPaths,
        errors
      };
    } catch (error) {
      errors.push(`Failed to create backup directory: ${error instanceof Error ? error.message : String(error)}`);
      return {
        success: false,
        backupPaths,
        errors
      };
    }
  }
}