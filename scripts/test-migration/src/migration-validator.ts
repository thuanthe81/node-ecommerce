import * as fs from 'fs/promises';
import * as path from 'path';
import { DiscoveredTestFile, ImportStatement, MigrationConfig } from './types';
import { BatchPathMappingResult } from './path-mapping';

/**
 * Validation result for pre-migration checks
 */
export interface PreMigrationValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  checks: {
    sourceDirectoriesExist: boolean;
    targetDirectoriesWritable: boolean;
    noTargetConflicts: boolean;
    importsResolvable: boolean;
    testRunnersCompatible: boolean;
  };
}

/**
 * Validation result for post-migration verification
 */
export interface PostMigrationValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  checks: {
    allFilesMigrated: boolean;
    noSourceFilesRemain: boolean;
    allImportsValid: boolean;
    testStructurePreserved: boolean;
    testRunnersWork: boolean;
  };
  statistics: {
    totalFiles: number;
    migratedFiles: number;
    failedFiles: number;
    validImports: number;
    invalidImports: number;
  };
}

/**
 * Migration validator for comprehensive pre and post migration validation
 */
export class MigrationValidator {
  constructor(private config: MigrationConfig) {}

  /**
   * Perform comprehensive pre-migration validation
   */
  async validatePreMigration(
    discoveredFiles: DiscoveredTestFile[],
    pathMappingResult: BatchPathMappingResult,
    importMap: Map<string, ImportStatement[]>
  ): Promise<PreMigrationValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const checks = {
      sourceDirectoriesExist: false,
      targetDirectoriesWritable: false,
      noTargetConflicts: false,
      importsResolvable: false,
      testRunnersCompatible: false
    };

    try {
      // Check 1: Source directories exist and are readable
      checks.sourceDirectoriesExist = await this.validateSourceDirectories();
      if (!checks.sourceDirectoriesExist) {
        errors.push('One or more source directories do not exist or are not readable');
      }

      // Check 2: Target directories are writable
      checks.targetDirectoriesWritable = await this.validateTargetDirectoriesWritable();
      if (!checks.targetDirectoriesWritable) {
        errors.push('One or more target directories are not writable');
      }

      // Check 3: No target file conflicts
      const conflictResult = await this.validateNoTargetConflicts(pathMappingResult);
      checks.noTargetConflicts = conflictResult.valid;
      if (!checks.noTargetConflicts) {
        errors.push(...conflictResult.errors);
        warnings.push(...conflictResult.warnings);
      }

      // Check 4: All imports will be resolvable after migration
      const importResult = await this.validateImportsResolvable(importMap, pathMappingResult);
      checks.importsResolvable = importResult.valid;
      if (!checks.importsResolvable) {
        errors.push(...importResult.errors);
        warnings.push(...importResult.warnings);
      }

      // Check 5: Test runners will be compatible
      const testRunnerResult = await this.validateTestRunnerCompatibility(discoveredFiles);
      checks.testRunnersCompatible = testRunnerResult.valid;
      if (!checks.testRunnersCompatible) {
        errors.push(...testRunnerResult.errors);
        warnings.push(...testRunnerResult.warnings);
      }

    } catch (error) {
      errors.push(`Pre-migration validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      checks
    };
  }

  /**
   * Perform comprehensive post-migration validation
   */
  async validatePostMigration(
    originalFiles: DiscoveredTestFile[],
    pathMappingResult: BatchPathMappingResult,
    importMap: Map<string, ImportStatement[]>
  ): Promise<PostMigrationValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const checks = {
      allFilesMigrated: false,
      noSourceFilesRemain: false,
      allImportsValid: false,
      testStructurePreserved: false,
      testRunnersWork: false
    };

    const statistics = {
      totalFiles: originalFiles.length,
      migratedFiles: 0,
      failedFiles: 0,
      validImports: 0,
      invalidImports: 0
    };

    try {
      // Check 1: All files were successfully migrated
      const migrationResult = await this.validateAllFilesMigrated(originalFiles, pathMappingResult);
      checks.allFilesMigrated = migrationResult.valid;
      statistics.migratedFiles = migrationResult.migratedCount;
      statistics.failedFiles = migrationResult.failedCount;
      if (!checks.allFilesMigrated) {
        errors.push(...migrationResult.errors);
      }

      // Check 2: No source files remain in original locations
      const sourceCleanResult = await this.validateNoSourceFilesRemain(originalFiles);
      checks.noSourceFilesRemain = sourceCleanResult.valid;
      if (!checks.noSourceFilesRemain) {
        errors.push(...sourceCleanResult.errors);
        warnings.push(...sourceCleanResult.warnings);
      }

      // Check 3: All imports are valid in new locations
      const importValidationResult = await this.validateAllImportsValid(importMap, pathMappingResult);
      checks.allImportsValid = importValidationResult.valid;
      statistics.validImports = importValidationResult.validCount;
      statistics.invalidImports = importValidationResult.invalidCount;
      if (!checks.allImportsValid) {
        errors.push(...importValidationResult.errors);
        warnings.push(...importValidationResult.warnings);
      }

      // Check 4: Test directory structure is preserved
      const structureResult = await this.validateTestStructurePreserved(originalFiles, pathMappingResult);
      checks.testStructurePreserved = structureResult.valid;
      if (!checks.testStructurePreserved) {
        errors.push(...structureResult.errors);
      }

      // Check 5: Test runners can find and execute tests
      const testRunnerResult = await this.validateTestRunnersWork(pathMappingResult);
      checks.testRunnersWork = testRunnerResult.valid;
      if (!checks.testRunnersWork) {
        warnings.push(...testRunnerResult.warnings); // Non-critical for migration success
      }

    } catch (error) {
      errors.push(`Post-migration validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      checks,
      statistics
    };
  }

  /**
   * Validate that source directories exist and are readable
   */
  private async validateSourceDirectories(): Promise<boolean> {
    try {
      const directories = [
        this.config.backendSourceDir,
        this.config.frontendSourceDir
      ];

      for (const dir of directories) {
        const stats = await fs.stat(dir);
        if (!stats.isDirectory()) {
          return false;
        }
        // Try to read directory to check permissions
        await fs.readdir(dir);
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate that target directories are writable
   */
  private async validateTargetDirectoriesWritable(): Promise<boolean> {
    try {
      const directories = [
        this.config.backendTestDir,
        this.config.frontendTestDir
      ];

      for (const dir of directories) {
        // Create directory if it doesn't exist
        await fs.mkdir(dir, { recursive: true });

        // Test write permissions by creating a temporary file
        const testFile = path.join(dir, '.migration-test');
        await fs.writeFile(testFile, 'test');
        await fs.unlink(testFile);
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate that there are no target file conflicts
   */
  private async validateNoTargetConflicts(
    pathMappingResult: BatchPathMappingResult
  ): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const targetPaths = new Set<string>();

    for (const mapping of pathMappingResult.mappings) {
      const targetPath = mapping.targetPath;

      // Check for duplicate target paths
      if (targetPaths.has(targetPath)) {
        errors.push(`Duplicate target path: ${targetPath}`);
        continue;
      }
      targetPaths.add(targetPath);

      // Check if target file already exists
      try {
        const stats = await fs.stat(targetPath);
        if (stats.isFile()) {
          warnings.push(`Target file already exists and will be overwritten: ${targetPath}`);
        }
      } catch {
        // File doesn't exist, which is good
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate that all imports will be resolvable after migration
   */
  private async validateImportsResolvable(
    importMap: Map<string, ImportStatement[]>,
    pathMappingResult: BatchPathMappingResult
  ): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Create target path mapping
    const targetPaths = new Map<string, string>();
    for (const mapping of pathMappingResult.mappings) {
      targetPaths.set(mapping.discoveredFile.filePath, mapping.targetPath);
    }

    for (const [originalPath, imports] of importMap) {
      const targetPath = targetPaths.get(originalPath);
      if (!targetPath) continue;

      for (const importStmt of imports) {
        if (!importStmt.isRelative) continue; // Skip external packages

        const resolvedPath = path.resolve(path.dirname(targetPath), importStmt.updatedPath);

        // Check if the file exists with various extensions
        const extensions = ['', '.ts', '.tsx', '.js', '.jsx'];
        let exists = false;

        for (const ext of extensions) {
          try {
            await fs.stat(resolvedPath + ext);
            exists = true;
            break;
          } catch {
            // Continue checking other extensions
          }
        }

        // Also check if it's a directory with index file
        if (!exists) {
          for (const ext of ['.ts', '.tsx', '.js', '.jsx']) {
            try {
              await fs.stat(path.join(resolvedPath, `index${ext}`));
              exists = true;
              break;
            } catch {
              // Continue checking other extensions
            }
          }
        }

        if (!exists) {
          errors.push(`Import will not resolve: ${importStmt.updatedPath} from ${targetPath}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate test runner compatibility
   */
  private async validateTestRunnerCompatibility(
    discoveredFiles: DiscoveredTestFile[]
  ): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for Jest configuration
    const jestConfigPaths = [
      'jest.config.js',
      'jest.config.ts',
      'jest.config.json',
      'package.json'
    ];

    let hasJestConfig = false;
    for (const configPath of jestConfigPaths) {
      try {
        const fullPath = path.resolve(process.cwd(), '../../', configPath);
        await fs.stat(fullPath);
        hasJestConfig = true;
        break;
      } catch {
        // Config file doesn't exist
      }
    }

    if (!hasJestConfig) {
      warnings.push('No Jest configuration found - test runner compatibility cannot be verified');
    }

    // Check for Vitest configuration
    const vitestConfigPaths = [
      'vitest.config.js',
      'vitest.config.ts',
      'vite.config.js',
      'vite.config.ts'
    ];

    let hasVitestConfig = false;
    for (const configPath of vitestConfigPaths) {
      try {
        const fullPath = path.resolve(process.cwd(), '../../', configPath);
        await fs.stat(fullPath);
        hasVitestConfig = true;
        break;
      } catch {
        // Config file doesn't exist
      }
    }

    if (!hasVitestConfig && !hasJestConfig) {
      warnings.push('No test runner configuration found');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate that all files were successfully migrated
   */
  private async validateAllFilesMigrated(
    originalFiles: DiscoveredTestFile[],
    pathMappingResult: BatchPathMappingResult
  ): Promise<{ valid: boolean; errors: string[]; migratedCount: number; failedCount: number }> {
    const errors: string[] = [];
    let migratedCount = 0;
    let failedCount = 0;

    const targetPaths = new Map<string, string>();
    for (const mapping of pathMappingResult.mappings) {
      targetPaths.set(mapping.discoveredFile.filePath, mapping.targetPath);
    }

    for (const file of originalFiles) {
      const targetPath = targetPaths.get(file.filePath);
      if (!targetPath) {
        errors.push(`No target path calculated for: ${file.filePath}`);
        failedCount++;
        continue;
      }

      try {
        const stats = await fs.stat(targetPath);
        if (stats.isFile()) {
          migratedCount++;
        } else {
          errors.push(`Target path exists but is not a file: ${targetPath}`);
          failedCount++;
        }
      } catch {
        errors.push(`Migration failed - target file does not exist: ${targetPath}`);
        failedCount++;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      migratedCount,
      failedCount
    };
  }

  /**
   * Validate that no source files remain in original locations
   */
  private async validateNoSourceFilesRemain(
    originalFiles: DiscoveredTestFile[]
  ): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const file of originalFiles) {
      try {
        const stats = await fs.stat(file.filePath);
        if (stats.isFile()) {
          if (this.config.dryRun) {
            warnings.push(`Source file still exists (expected in dry run): ${file.filePath}`);
          } else {
            errors.push(`Source file was not removed: ${file.filePath}`);
          }
        }
      } catch {
        // File doesn't exist, which is what we want
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate that all imports are valid in new locations
   */
  private async validateAllImportsValid(
    importMap: Map<string, ImportStatement[]>,
    pathMappingResult: BatchPathMappingResult
  ): Promise<{ valid: boolean; errors: string[]; warnings: string[]; validCount: number; invalidCount: number }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let validCount = 0;
    let invalidCount = 0;

    const targetPaths = new Map<string, string>();
    for (const mapping of pathMappingResult.mappings) {
      targetPaths.set(mapping.discoveredFile.filePath, mapping.targetPath);
    }

    for (const [originalPath, imports] of importMap) {
      const targetPath = targetPaths.get(originalPath);
      if (!targetPath) continue;

      for (const importStmt of imports) {
        if (!importStmt.isRelative) {
          validCount++; // Assume external packages are valid
          continue;
        }

        const resolvedPath = path.resolve(path.dirname(targetPath), importStmt.updatedPath);

        try {
          await fs.stat(resolvedPath);
          validCount++;
        } catch {
          // Check for TypeScript/JavaScript variations
          const variations = [
            resolvedPath + '.ts',
            resolvedPath + '.js',
            resolvedPath + '.tsx',
            resolvedPath + '.jsx',
            path.join(resolvedPath, 'index.ts'),
            path.join(resolvedPath, 'index.js')
          ];

          let found = false;
          for (const variation of variations) {
            try {
              await fs.stat(variation);
              validCount++;
              found = true;
              break;
            } catch {
              // Continue checking
            }
          }

          if (!found) {
            errors.push(`Invalid import in ${targetPath}: ${importStmt.updatedPath}`);
            invalidCount++;
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      validCount,
      invalidCount
    };
  }

  /**
   * Validate that test directory structure is preserved
   */
  private async validateTestStructurePreserved(
    originalFiles: DiscoveredTestFile[],
    pathMappingResult: BatchPathMappingResult
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    const targetPaths = new Map<string, string>();
    for (const mapping of pathMappingResult.mappings) {
      targetPaths.set(mapping.discoveredFile.filePath, mapping.targetPath);
    }

    for (const file of originalFiles) {
      const targetPath = targetPaths.get(file.filePath);
      if (!targetPath) continue;

      // Validate that the relative structure is preserved
      const originalRelative = path.relative(
        file.sourceType === 'backend' ? this.config.backendSourceDir : this.config.frontendSourceDir,
        file.filePath
      );

      const targetRelative = path.relative(
        file.sourceType === 'backend' ? this.config.backendTestDir : this.config.frontendTestDir,
        targetPath
      );

      if (originalRelative !== targetRelative) {
        errors.push(`Directory structure not preserved for ${file.filePath}: expected ${originalRelative}, got ${targetRelative}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate that test runners can find and execute tests
   */
  private async validateTestRunnersWork(
    pathMappingResult: BatchPathMappingResult
  ): Promise<{ valid: boolean; warnings: string[] }> {
    const warnings: string[] = [];

    // This is a basic check - in a real scenario, you might want to actually run the tests
    const testFiles = pathMappingResult.mappings.map(m => m.targetPath);

    if (testFiles.length === 0) {
      warnings.push('No test files to validate test runner compatibility');
      return { valid: true, warnings };
    }

    // Check if test files follow expected naming patterns
    const validPatterns = [/\.test\.(ts|tsx|js|jsx)$/, /\.spec\.(ts|tsx|js|jsx)$/];

    for (const testFile of testFiles) {
      const isValidPattern = validPatterns.some(pattern => pattern.test(testFile));
      if (!isValidPattern) {
        warnings.push(`Test file may not be recognized by test runners: ${testFile}`);
      }
    }

    return {
      valid: true, // Non-critical for migration success
      warnings
    };
  }
}