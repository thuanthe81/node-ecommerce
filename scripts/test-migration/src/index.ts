import * as path from 'path';
import { FileDiscovery } from './file-discovery';
import { PathMapper, BatchPathMappingResult } from './path-mapping';
import { ImportUpdater } from './import-updater';
import { FileMigrator, BatchMigrationResult, CleanupOptions } from './file-migrator';
import { MigrationValidator, PreMigrationValidation, PostMigrationValidation } from './migration-validator';
import { RollbackManager, RollbackPlan, RollbackResult } from './rollback-manager';
import { loadConfig, validateConfig } from './config';
import { MigrationConfig, DiscoveredTestFile, TestFileInfo, ImportStatement } from './types';

/**
 * Main entry point for test file migration system
 */
export class TestMigrationSystem {
  private fileDiscovery: FileDiscovery;
  private pathMapper: PathMapper;
  private importUpdater: ImportUpdater;
  private fileMigrator: FileMigrator;
  private migrationValidator: MigrationValidator;
  private rollbackManager: RollbackManager;
  private config: MigrationConfig;

  constructor(configOverrides: Partial<MigrationConfig> = {}) {
    this.config = loadConfig(configOverrides);
    this.fileDiscovery = new FileDiscovery();
    this.pathMapper = new PathMapper(this.config);
    this.importUpdater = new ImportUpdater();
    this.fileMigrator = new FileMigrator(this.config);
    this.migrationValidator = new MigrationValidator(this.config);
    this.rollbackManager = new RollbackManager(this.config);
  }

  /**
   * Initialize the migration system and validate configuration
   */
  async initialize(): Promise<{ success: boolean, errors: string[] }> {
    const validation = validateConfig(this.config);

    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors
      };
    }

    // Validate source directories exist
    const directories = [
      this.config.backendSourceDir,
      this.config.frontendSourceDir
    ];

    const { invalid } = this.fileDiscovery.validateSourceDirectories(directories);

    if (invalid.length > 0) {
      return {
        success: false,
        errors: [`Invalid directories: ${invalid.join(', ')}`]
      };
    }

    if (this.config.verbose) {
      console.log('Migration system initialized successfully');
      console.log('Configuration:', this.config);
    }

    return { success: true, errors: [] };
  }

  /**
   * Discover all test files that need to be migrated
   */
  async discoverTestFiles(): Promise<DiscoveredTestFile[]> {
    if (this.config.verbose) {
      console.log('Discovering test files...');
    }

    const testFiles = await this.fileDiscovery.getTestFilesToMigrate(
      this.config.backendSourceDir,
      this.config.backendTestDir,
      this.config.frontendSourceDir,
      this.config.frontendTestDir
    );

    if (this.config.verbose) {
      console.log(`Found ${testFiles.length} test files to migrate`);
      console.log('Backend files:', testFiles.filter(f => f.sourceType === 'backend').length);
      console.log('Frontend files:', testFiles.filter(f => f.sourceType === 'frontend').length);
    }

    return testFiles;
  }

  /**
   * Get current configuration
   */
  getConfig(): MigrationConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<MigrationConfig>): void {
    this.config = { ...this.config, ...updates };
    this.pathMapper = new PathMapper(this.config);
    this.migrationValidator = new MigrationValidator(this.config);
    this.rollbackManager = new RollbackManager(this.config);
  }

  /**
   * Calculate target paths for discovered test files
   */
  async calculateTargetPaths(discoveredFiles: DiscoveredTestFile[]): Promise<BatchPathMappingResult> {
    if (this.config.verbose) {
      console.log('Calculating target paths for test files...');
    }

    const result = this.pathMapper.batchCalculateTargetPaths(discoveredFiles);

    if (this.config.verbose) {
      console.log(`Calculated paths for ${result.mappings.length} files`);
      if (result.errors.length > 0) {
        console.log(`Errors: ${result.errors.length}`);
        result.errors.forEach(error => console.error(`  - ${error}`));
      }
      if (result.warnings.length > 0) {
        console.log(`Warnings: ${result.warnings.length}`);
        result.warnings.forEach(warning => console.warn(`  - ${warning}`));
      }
    }

    return result;
  }

  /**
   * Create TestFileInfo objects with calculated paths
   */
  createTestFileInfos(discoveredFiles: DiscoveredTestFile[]): TestFileInfo[] {
    return discoveredFiles.map(file => this.pathMapper.createTestFileInfo(file));
  }

  /**
   * Analyze imports for all test files and calculate updated paths
   */
  async analyzeImports(
    discoveredFiles: DiscoveredTestFile[],
    pathMappingResult: BatchPathMappingResult
  ): Promise<Map<string, ImportStatement[]>> {
    if (this.config.verbose) {
      console.log('Analyzing import statements in test files...');
    }

    // Create target path map
    const targetPaths = new Map<string, string>();
    for (const mapping of pathMappingResult.mappings) {
      targetPaths.set(mapping.discoveredFile.filePath, mapping.targetPath);
    }

    // Analyze imports for each file
    const importMap = this.importUpdater.batchAnalyzeImports(
      discoveredFiles,
      targetPaths,
      process.cwd()
    );

    // Update test-to-test imports
    this.importUpdater.updateTestToTestImports(importMap, discoveredFiles, targetPaths);

    if (this.config.verbose) {
      const stats = this.importUpdater.getImportUpdateStats(importMap);
      console.log(`Import analysis complete:`);
      console.log(`  Total imports: ${stats.totalImports}`);
      console.log(`  Relative imports: ${stats.relativeImports}`);
      console.log(`  Imports requiring updates: ${stats.updatedImports}`);
      console.log(`  Test-to-test imports: ${stats.testToTestImports}`);
    }

    return importMap;
  }

  /**
   * Validate import paths after migration
   */
  validateImports(
    importMap: Map<string, ImportStatement[]>,
    targetPaths: Map<string, string>
  ): { valid: number, invalid: number, warnings: string[] } {
    let totalValid = 0;
    let totalInvalid = 0;
    const allWarnings: string[] = [];

    for (const [testFilePath, imports] of importMap) {
      const targetPath = targetPaths.get(testFilePath);
      if (!targetPath) continue;

      const validation = this.importUpdater.validateUpdatedImports(
        imports,
        targetPath,
        process.cwd()
      );

      totalValid += validation.valid.length;
      totalInvalid += validation.invalid.length;
      allWarnings.push(...validation.warnings);
    }

    return {
      valid: totalValid,
      invalid: totalInvalid,
      warnings: allWarnings
    };
  }

  /**
   * Generate updated file content for a test file
   */
  generateUpdatedContent(
    testFilePath: string,
    imports: ImportStatement[]
  ): string {
    return this.importUpdater.generateUpdatedFileContent(testFilePath, imports);
  }

  /**
   * Validate file system permissions before migration
   */
  async validatePermissions(
    discoveredFiles: DiscoveredTestFile[],
    pathMappingResult: BatchPathMappingResult
  ): Promise<{ valid: boolean, errors: string[] }> {
    const filePaths = discoveredFiles.map(f => f.filePath);
    const targetPaths = pathMappingResult.mappings.map(m => m.targetPath);

    return this.fileMigrator.validatePermissions(filePaths, targetPaths);
  }

  /**
   * Create backup of test files before migration
   */
  async createBackup(
    discoveredFiles: DiscoveredTestFile[],
    backupDir?: string
  ): Promise<{ success: boolean, backupPaths: string[], errors: string[] }> {
    const filePaths = discoveredFiles.map(f => f.filePath);
    const defaultBackupDir = path.join(process.cwd(), 'migration-backup', new Date().toISOString().replace(/[:.]/g, '-'));
    const actualBackupDir = backupDir || defaultBackupDir;

    if (this.config.verbose) {
      console.log(`Creating backup in: ${actualBackupDir}`);
    }

    return this.fileMigrator.createBackup(filePaths, actualBackupDir);
  }

  /**
   * Execute the complete migration process
   */
  async executeMigration(
    discoveredFiles: DiscoveredTestFile[],
    pathMappingResult: BatchPathMappingResult,
    importMap: Map<string, ImportStatement[]>,
    options: {
      createBackup?: boolean;
      backupDir?: string;
      cleanupEmptyDirs?: boolean;
      preserveDirectories?: string[];
    } = {}
  ): Promise<{
    migrationResult: BatchMigrationResult;
    backupResult?: { success: boolean, backupPaths: string[], errors: string[] };
    cleanupResult?: { removed: string[], errors: string[] };
  }> {
    const {
      createBackup = true,
      backupDir,
      cleanupEmptyDirs = true,
      preserveDirectories = []
    } = options;

    if (this.config.verbose) {
      console.log('Starting migration execution...');
    }

    // Create backup if requested
    let backupResult;
    if (createBackup && !this.config.dryRun) {
      backupResult = await this.createBackup(discoveredFiles, backupDir);
      if (!backupResult.success) {
        console.warn('Backup creation failed, but continuing with migration...');
        if (this.config.verbose) {
          backupResult.errors.forEach(error => console.warn(`  - ${error}`));
        }
      }
    }

    // Prepare migration data
    const migrations = pathMappingResult.mappings.map(mapping => ({
      filePath: mapping.discoveredFile.filePath,
      targetPath: mapping.targetPath,
      imports: importMap.get(mapping.discoveredFile.filePath) || []
    }));

    // Execute migration
    const migrationResult = await this.fileMigrator.batchMigrateFiles(migrations);

    // Cleanup empty directories if requested
    let cleanupResult;
    if (cleanupEmptyDirs && migrationResult.successful.length > 0) {
      const sourceDirectories = [
        this.config.backendSourceDir,
        this.config.frontendSourceDir
      ];

      const cleanupOptions: CleanupOptions = {
        removeEmptyDirectories: true,
        preserveDirectories,
        dryRun: this.config.dryRun
      };

      cleanupResult = await this.fileMigrator.cleanupEmptyDirectories(sourceDirectories, cleanupOptions);

      if (this.config.verbose && cleanupResult.removed.length > 0) {
        console.log(`Cleaned up ${cleanupResult.removed.length} empty directories`);
      }
    }

    if (this.config.verbose) {
      console.log('Migration execution complete');
      console.log(`  Successful: ${migrationResult.successful.length}`);
      console.log(`  Failed: ${migrationResult.failed.length}`);
      if (cleanupResult) {
        console.log(`  Directories cleaned: ${cleanupResult.removed.length}`);
      }
    }

    return {
      migrationResult,
      backupResult,
      cleanupResult
    };
  }

  /**
   * Perform comprehensive pre-migration validation
   */
  async validatePreMigration(
    discoveredFiles: DiscoveredTestFile[],
    pathMappingResult: BatchPathMappingResult,
    importMap: Map<string, ImportStatement[]>
  ): Promise<PreMigrationValidation> {
    if (this.config.verbose) {
      console.log('Performing pre-migration validation...');
    }

    const validation = await this.migrationValidator.validatePreMigration(
      discoveredFiles,
      pathMappingResult,
      importMap
    );

    if (this.config.verbose) {
      console.log('Pre-migration validation complete:');
      console.log(`  Valid: ${validation.valid}`);
      console.log(`  Errors: ${validation.errors.length}`);
      console.log(`  Warnings: ${validation.warnings.length}`);
    }

    return validation;
  }

  /**
   * Perform comprehensive post-migration validation
   */
  async validatePostMigration(
    originalFiles: DiscoveredTestFile[],
    pathMappingResult: BatchPathMappingResult,
    importMap: Map<string, ImportStatement[]>
  ): Promise<PostMigrationValidation> {
    if (this.config.verbose) {
      console.log('Performing post-migration validation...');
    }

    const validation = await this.migrationValidator.validatePostMigration(
      originalFiles,
      pathMappingResult,
      importMap
    );

    if (this.config.verbose) {
      console.log('Post-migration validation complete:');
      console.log(`  Valid: ${validation.valid}`);
      console.log(`  Migrated files: ${validation.statistics.migratedFiles}`);
      console.log(`  Failed files: ${validation.statistics.failedFiles}`);
      console.log(`  Valid imports: ${validation.statistics.validImports}`);
      console.log(`  Invalid imports: ${validation.statistics.invalidImports}`);
    }

    return validation;
  }

  /**
   * Create rollback plan before migration
   */
  async createRollbackPlan(
    originalFiles: DiscoveredTestFile[],
    pathMappingResult: BatchPathMappingResult,
    backupDirectory: string
  ): Promise<RollbackPlan> {
    if (this.config.verbose) {
      console.log('Creating rollback plan...');
    }

    const plan = await this.rollbackManager.createRollbackPlan(
      originalFiles,
      pathMappingResult,
      backupDirectory
    );

    if (this.config.verbose) {
      console.log(`Rollback plan created: ${plan.id}`);
    }

    return plan;
  }

  /**
   * Execute rollback to restore original state
   */
  async executeRollback(planId: string): Promise<RollbackResult> {
    if (this.config.verbose) {
      console.log(`Executing rollback: ${planId}`);
    }

    const result = await this.rollbackManager.executeRollback(planId);

    if (this.config.verbose) {
      console.log('Rollback complete:');
      console.log(`  Success: ${result.success}`);
      console.log(`  Restored files: ${result.restoredFiles.length}`);
      console.log(`  Failed files: ${result.failedFiles.length}`);
    }

    return result;
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
    return this.rollbackManager.listRollbackPlans();
  }

  /**
   * Verify that a rollback can be performed
   */
  async verifyRollbackPossible(planId: string): Promise<{
    possible: boolean;
    errors: string[];
    warnings: string[];
  }> {
    return this.rollbackManager.verifyRollbackPossible(planId);
  }

  /**
   * Run a complete migration workflow with enhanced validation and rollback
   */
  async runMigration(options: {
    createBackup?: boolean;
    backupDir?: string;
    cleanupEmptyDirs?: boolean;
    preserveDirectories?: string[];
    skipPreValidation?: boolean;
    skipPostValidation?: boolean;
    autoRollbackOnFailure?: boolean;
  } = {}): Promise<{
    success: boolean;
    summary: {
      totalFiles: number;
      migratedFiles: number;
      failedFiles: number;
      backupCreated: boolean;
      directoriesCleaned: number;
    };
    errors: string[];
    warnings: string[];
    rollbackPlanId?: string;
    validationResults?: {
      preValidation?: PreMigrationValidation;
      postValidation?: PostMigrationValidation;
    };
  }> {
    const {
      createBackup = true,
      backupDir,
      cleanupEmptyDirs = true,
      preserveDirectories = [],
      skipPreValidation = false,
      skipPostValidation = false,
      autoRollbackOnFailure = true
    } = options;

    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    let rollbackPlanId: string | undefined;
    const validationResults: {
      preValidation?: PreMigrationValidation;
      postValidation?: PostMigrationValidation;
    } = {};

    try {
      // Initialize system
      const initResult = await this.initialize();
      if (!initResult.success) {
        return {
          success: false,
          summary: {
            totalFiles: 0,
            migratedFiles: 0,
            failedFiles: 0,
            backupCreated: false,
            directoriesCleaned: 0
          },
          errors: initResult.errors,
          warnings: [],
          validationResults
        };
      }

      // Discover test files
      const discoveredFiles = await this.discoverTestFiles();
      if (discoveredFiles.length === 0) {
        return {
          success: true,
          summary: {
            totalFiles: 0,
            migratedFiles: 0,
            failedFiles: 0,
            backupCreated: false,
            directoriesCleaned: 0
          },
          errors: [],
          warnings: ['No test files found to migrate']
        };
      }

      // Calculate target paths
      const pathMappingResult = await this.calculateTargetPaths(discoveredFiles);
      allErrors.push(...pathMappingResult.errors);
      allWarnings.push(...pathMappingResult.warnings);

      if (pathMappingResult.mappings.length === 0) {
        return {
          success: false,
          summary: {
            totalFiles: discoveredFiles.length,
            migratedFiles: 0,
            failedFiles: discoveredFiles.length,
            backupCreated: false,
            directoriesCleaned: 0
          },
          errors: ['No valid target paths could be calculated', ...allErrors],
          warnings: allWarnings
        };
      }

      // Validate permissions
      const permissionResult = await this.validatePermissions(discoveredFiles, pathMappingResult);
      if (!permissionResult.valid) {
        allErrors.push(...permissionResult.errors);
        return {
          success: false,
          summary: {
            totalFiles: discoveredFiles.length,
            migratedFiles: 0,
            failedFiles: discoveredFiles.length,
            backupCreated: false,
            directoriesCleaned: 0
          },
          errors: allErrors,
          warnings: allWarnings
        };
      }

      // Analyze imports
      const importMap = await this.analyzeImports(discoveredFiles, pathMappingResult);

      // Pre-migration validation
      if (!skipPreValidation) {
        const preValidation = await this.validatePreMigration(
          discoveredFiles,
          pathMappingResult,
          importMap
        );
        validationResults.preValidation = preValidation;
        allErrors.push(...preValidation.errors);
        allWarnings.push(...preValidation.warnings);

        if (!preValidation.valid) {
          return {
            success: false,
            summary: {
              totalFiles: discoveredFiles.length,
              migratedFiles: 0,
              failedFiles: discoveredFiles.length,
              backupCreated: false,
              directoriesCleaned: 0
            },
            errors: allErrors,
            warnings: allWarnings,
            validationResults
          };
        }
      }

      // Create rollback plan before migration
      let rollbackPlan: RollbackPlan | undefined;
      if (createBackup && !this.config.dryRun) {
        const defaultBackupDir = path.join(process.cwd(), 'migration-backup', new Date().toISOString().replace(/[:.]/g, '-'));
        const actualBackupDir = backupDir || defaultBackupDir;

        rollbackPlan = await this.createRollbackPlan(
          discoveredFiles,
          pathMappingResult,
          actualBackupDir
        );
        rollbackPlanId = rollbackPlan.id;
      }

      // Execute migration
      const executionResult = await this.executeMigration(
        discoveredFiles,
        pathMappingResult,
        importMap,
        { createBackup, backupDir, cleanupEmptyDirs, preserveDirectories }
      );

      allErrors.push(...executionResult.migrationResult.errors);
      allWarnings.push(...executionResult.migrationResult.warnings);

      if (executionResult.backupResult) {
        allErrors.push(...executionResult.backupResult.errors);
      }

      if (executionResult.cleanupResult) {
        allErrors.push(...executionResult.cleanupResult.errors);

        // Update rollback plan with removed directories
        if (rollbackPlan && executionResult.cleanupResult.removed.length > 0) {
          await this.rollbackManager.updateRollbackPlanWithRemovedDirectories(
            rollbackPlan.id,
            executionResult.cleanupResult.removed
          );
        }
      }

      const migrationFailed = executionResult.migrationResult.failed.length > 0;

      // Post-migration validation
      if (!skipPostValidation && !migrationFailed) {
        const postValidation = await this.validatePostMigration(
          discoveredFiles,
          pathMappingResult,
          importMap
        );
        validationResults.postValidation = postValidation;
        allErrors.push(...postValidation.errors);
        allWarnings.push(...postValidation.warnings);

        // If post-validation fails and auto-rollback is enabled
        if (!postValidation.valid && autoRollbackOnFailure && rollbackPlanId && !this.config.dryRun) {
          if (this.config.verbose) {
            console.log('Post-migration validation failed, initiating automatic rollback...');
          }

          const rollbackResult = await this.executeRollback(rollbackPlanId);
          if (rollbackResult.success) {
            allWarnings.push('Migration was automatically rolled back due to validation failures');
          } else {
            allErrors.push('Migration failed and automatic rollback also failed');
            allErrors.push(...rollbackResult.errors);
          }
        }
      }

      // Handle migration failure with auto-rollback
      if (migrationFailed && autoRollbackOnFailure && rollbackPlanId && !this.config.dryRun) {
        if (this.config.verbose) {
          console.log('Migration failed, initiating automatic rollback...');
        }

        const rollbackResult = await this.executeRollback(rollbackPlanId);
        if (rollbackResult.success) {
          allWarnings.push('Migration was automatically rolled back due to migration failures');
        } else {
          allErrors.push('Migration failed and automatic rollback also failed');
          allErrors.push(...rollbackResult.errors);
        }
      }

      const finalSuccess = executionResult.migrationResult.failed.length === 0 &&
                          (skipPostValidation || validationResults.postValidation?.valid !== false);

      return {
        success: finalSuccess,
        summary: {
          totalFiles: discoveredFiles.length,
          migratedFiles: executionResult.migrationResult.successful.length,
          failedFiles: executionResult.migrationResult.failed.length,
          backupCreated: executionResult.backupResult?.success || false,
          directoriesCleaned: executionResult.cleanupResult?.removed.length || 0
        },
        errors: allErrors,
        warnings: allWarnings,
        rollbackPlanId,
        validationResults
      };

    } catch (error) {
      allErrors.push(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);

      // Attempt rollback on unexpected failure
      if (autoRollbackOnFailure && rollbackPlanId && !this.config.dryRun) {
        try {
          if (this.config.verbose) {
            console.log('Unexpected error occurred, initiating automatic rollback...');
          }

          const rollbackResult = await this.executeRollback(rollbackPlanId);
          if (rollbackResult.success) {
            allWarnings.push('Migration was automatically rolled back due to unexpected error');
          } else {
            allErrors.push('Migration failed and automatic rollback also failed');
            allErrors.push(...rollbackResult.errors);
          }
        } catch (rollbackError) {
          allErrors.push(`Rollback failed: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`);
        }
      }

      return {
        success: false,
        summary: {
          totalFiles: 0,
          migratedFiles: 0,
          failedFiles: 0,
          backupCreated: false,
          directoriesCleaned: 0
        },
        errors: allErrors,
        warnings: allWarnings,
        rollbackPlanId,
        validationResults
      };
    }
  }
}

// Export main classes and types
export { FileDiscovery } from './file-discovery';
export { PathMapper } from './path-mapping';
export { ImportUpdater } from './import-updater';
export { FileMigrator } from './file-migrator';
export { ImportAnalyzer, ImportPathUtils } from './import-analyzer';
export { MigrationValidator } from './migration-validator';
export { RollbackManager } from './rollback-manager';
export { loadConfig, validateConfig, DEFAULT_CONFIG } from './config';
export * from './types';

// CLI entry point
if (require.main === module) {
  async function main() {
    const args = process.argv.slice(2);
    const command = args.find(arg => !arg.startsWith('--'));

    if (command === 'rollback') {
      const rollbackArgs = args.filter(arg => arg !== 'rollback');
      await handleRollbackCommand(rollbackArgs);
      return;
    }

    if (command === 'list-rollbacks') {
      await handleListRollbacksCommand();
      return;
    }

    // Default migration command
    const isDryRun = args.includes('--dry-run');
    const isVerbose = args.includes('--verbose') || args.includes('-v');
    const skipBackup = args.includes('--no-backup');
    const skipCleanup = args.includes('--no-cleanup');
    const skipPreValidation = args.includes('--skip-pre-validation');
    const skipPostValidation = args.includes('--skip-post-validation');
    const noAutoRollback = args.includes('--no-auto-rollback');

    console.log('Test File Migration System');
    console.log('==========================');

    if (isDryRun) {
      console.log('Running in DRY RUN mode - no files will be modified');
    }

    const system = new TestMigrationSystem({
      verbose: isVerbose,
      dryRun: isDryRun
    });

    // Run complete migration workflow
    const result = await system.runMigration({
      createBackup: !skipBackup,
      cleanupEmptyDirs: !skipCleanup,
      skipPreValidation,
      skipPostValidation,
      autoRollbackOnFailure: !noAutoRollback
    });

    console.log('\nMigration Summary:');
    console.log(`  Total files: ${result.summary.totalFiles}`);
    console.log(`  Successfully migrated: ${result.summary.migratedFiles}`);
    console.log(`  Failed: ${result.summary.failedFiles}`);
    console.log(`  Backup created: ${result.summary.backupCreated ? 'Yes' : 'No'}`);
    console.log(`  Empty directories cleaned: ${result.summary.directoriesCleaned}`);

    if (result.rollbackPlanId) {
      console.log(`  Rollback plan ID: ${result.rollbackPlanId}`);
    }

    if (result.validationResults?.preValidation) {
      const preVal = result.validationResults.preValidation;
      console.log(`\nPre-migration validation: ${preVal.valid ? '✅ Passed' : '❌ Failed'}`);
    }

    if (result.validationResults?.postValidation) {
      const postVal = result.validationResults.postValidation;
      console.log(`Post-migration validation: ${postVal.valid ? '✅ Passed' : '❌ Failed'}`);
      console.log(`  Valid imports: ${postVal.statistics.validImports}`);
      console.log(`  Invalid imports: ${postVal.statistics.invalidImports}`);
    }

    if (result.warnings.length > 0) {
      console.log('\nWarnings:');
      result.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }

    if (result.errors.length > 0) {
      console.log('\nErrors:');
      result.errors.forEach(error => console.error(`  - ${error}`));
    }

    if (result.success) {
      console.log('\n✅ Migration completed successfully!');
      if (isDryRun) {
        console.log('Run without --dry-run to execute the migration.');
      }
      if (result.rollbackPlanId && !isDryRun) {
        console.log(`\nTo rollback this migration, run:`);
        console.log(`  npm run migrate rollback ${result.rollbackPlanId}`);
      }
    } else {
      console.log('\n❌ Migration completed with errors.');
      if (result.rollbackPlanId && !isDryRun) {
        console.log(`\nTo rollback this migration, run:`);
        console.log(`  npm run migrate rollback ${result.rollbackPlanId}`);
      }
      process.exit(1);
    }
  }

  async function handleRollbackCommand(args: string[]) {
    const planId = args[0];
    const isVerbose = args.includes('--verbose') || args.includes('-v');

    if (!planId) {
      console.error('Error: Rollback plan ID is required');
      console.log('Usage: npm run migrate rollback <plan-id>');
      console.log('Use "npm run migrate list-rollbacks" to see available plans');
      process.exit(1);
    }

    console.log('Test File Migration Rollback');
    console.log('============================');

    const system = new TestMigrationSystem({ verbose: isVerbose });

    // Verify rollback is possible
    const verification = await system.verifyRollbackPossible(planId);
    if (!verification.possible) {
      console.log('❌ Rollback not possible:');
      verification.errors.forEach(error => console.error(`  - ${error}`));
      process.exit(1);
    }

    if (verification.warnings.length > 0) {
      console.log('⚠️  Rollback warnings:');
      verification.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }

    // Execute rollback
    const result = await system.executeRollback(planId);

    console.log('\nRollback Summary:');
    console.log(`  Success: ${result.success ? 'Yes' : 'No'}`);
    console.log(`  Restored files: ${result.restoredFiles.length}`);
    console.log(`  Failed files: ${result.failedFiles.length}`);
    console.log(`  Removed directories: ${result.removedDirectories.length}`);

    if (result.warnings.length > 0) {
      console.log('\nWarnings:');
      result.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }

    if (result.errors.length > 0) {
      console.log('\nErrors:');
      result.errors.forEach(error => console.error(`  - ${error}`));
    }

    if (result.success) {
      console.log('\n✅ Rollback completed successfully!');
    } else {
      console.log('\n❌ Rollback completed with errors.');
      process.exit(1);
    }
  }

  async function handleListRollbacksCommand() {
    console.log('Available Rollback Plans');
    console.log('========================');

    const system = new TestMigrationSystem();
    const plans = await system.listRollbackPlans();

    if (plans.length === 0) {
      console.log('No rollback plans found.');
      return;
    }

    plans.forEach(plan => {
      console.log(`\nPlan ID: ${plan.id}`);
      console.log(`  Created: ${plan.timestamp.toLocaleString()}`);
      console.log(`  Files: ${plan.fileCount}`);
      console.log(`  Backup: ${plan.backupDirectory}`);
    });

    console.log(`\nTo execute a rollback, run:`);
    console.log(`  npm run migrate rollback <plan-id>`);
  }

  main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}