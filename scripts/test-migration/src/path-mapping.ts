import * as path from 'path';
import * as fs from 'fs';
import { DiscoveredTestFile, TestFileInfo, MigrationConfig } from './types';

/**
 * Path mapping utilities for calculating target locations and directory structure mirroring
 */
export class PathMapper {
  private config: MigrationConfig;

  constructor(config: MigrationConfig) {
    this.config = config;
  }

  /**
   * Calculate target path for a test file based on its source location
   */
  calculateTargetPath(discoveredFile: DiscoveredTestFile): string {
    const { sourceType, relativePath } = discoveredFile;

    if (sourceType === 'backend') {
      return this.calculateBackendTargetPath(relativePath);
    } else {
      return this.calculateFrontendTargetPath(relativePath);
    }
  }

  /**
   * Calculate target path for backend test files
   * Maps from backend/src/module/component.spec.ts to backend/test/module/component.spec.ts
   */
  private calculateBackendTargetPath(relativePath: string): string {
    return path.join(this.config.backendTestDir, relativePath);
  }

  /**
   * Calculate target path for frontend test files
   * Maps from frontend/components/Component/Component.test.tsx to frontend/__tests__/components/Component/Component.test.tsx
   * Maps from frontend/app/page/page.test.tsx to frontend/__tests__/app/page/page.test.tsx
   * Maps from frontend/contexts/Context.test.tsx to frontend/__tests__/contexts/Context.test.tsx
   */
  private calculateFrontendTargetPath(relativePath: string): string {
    // For frontend, we need to preserve the full directory structure under __tests__
    // The relativePath should include the source directory structure (e.g., "Header/Header.test.tsx")
    // We need to prepend "components" to maintain the structure
    const targetPath = path.join(this.config.frontendTestDir, 'components', relativePath);
    return targetPath;
  }

  /**
   * Mirror directory structure from source to target location
   */
  mirrorDirectoryStructure(sourcePath: string, targetPath: string): DirectoryMirrorResult {
    const sourceDir = path.dirname(sourcePath);
    const targetDir = path.dirname(targetPath);

    const result: DirectoryMirrorResult = {
      sourceDirectory: sourceDir,
      targetDirectory: targetDir,
      directoriesToCreate: [],
      conflicts: [],
      valid: true
    };

    // Calculate all directories that need to be created
    const dirsToCreate = this.calculateDirectoriesToCreate(targetDir);
    result.directoriesToCreate = dirsToCreate;

    // Check for conflicts (existing files with same name as directories)
    const conflicts = this.checkForDirectoryConflicts(dirsToCreate);
    result.conflicts = conflicts;
    result.valid = conflicts.length === 0;

    return result;
  }

  /**
   * Calculate all directories that need to be created for a target path
   */
  private calculateDirectoriesToCreate(targetDir: string): string[] {
    const directories: string[] = [];
    let currentDir = targetDir;

    while (currentDir && !fs.existsSync(currentDir)) {
      directories.unshift(currentDir);
      const parentDir = path.dirname(currentDir);

      // Stop if we've reached the root or if parent is the same as current
      if (parentDir === currentDir || parentDir === '.') {
        break;
      }

      currentDir = parentDir;
    }

    return directories;
  }

  /**
   * Check for conflicts where a file exists with the same name as a directory we want to create
   */
  private checkForDirectoryConflicts(directoriesToCreate: string[]): string[] {
    const conflicts: string[] = [];

    for (const dir of directoriesToCreate) {
      try {
        if (fs.existsSync(dir)) {
          const stats = fs.statSync(dir);
          if (!stats.isDirectory()) {
            conflicts.push(`File exists where directory is needed: ${dir}`);
          }
        }
      } catch (error) {
        // Ignore errors - if we can't stat it, it's probably fine
      }
    }

    return conflicts;
  }

  /**
   * Validate target path calculation
   */
  validateTargetPath(discoveredFile: DiscoveredTestFile, targetPath: string): PathValidationResult {
    const result: PathValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    // Check if target path is absolute
    if (!path.isAbsolute(targetPath)) {
      result.errors.push('Target path must be absolute');
      result.valid = false;
    }

    // Check if target path is within the appropriate test directory
    const expectedTestDir = discoveredFile.sourceType === 'backend'
      ? this.config.backendTestDir
      : this.config.frontendTestDir;

    if (!targetPath.startsWith(expectedTestDir)) {
      result.errors.push(`Target path must be within ${expectedTestDir}`);
      result.valid = false;
    }

    // Check if target file already exists
    if (fs.existsSync(targetPath)) {
      result.warnings.push(`Target file already exists: ${targetPath}`);
    }

    // Validate file extension is preserved
    const sourceExt = path.extname(discoveredFile.fileName);
    const targetExt = path.extname(targetPath);
    if (sourceExt !== targetExt) {
      result.errors.push(`File extension mismatch: ${sourceExt} vs ${targetExt}`);
      result.valid = false;
    }

    return result;
  }

  /**
   * Create TestFileInfo with calculated paths
   */
  createTestFileInfo(discoveredFile: DiscoveredTestFile): TestFileInfo {
    const targetPath = this.calculateTargetPath(discoveredFile);

    // For now, we'll set sourceFilePath to empty - this will be calculated by import analysis
    const testFileInfo: TestFileInfo = {
      currentPath: discoveredFile.filePath,
      targetPath: targetPath,
      sourceFilePath: '', // Will be populated by import analysis
      testType: discoveredFile.testType,
      imports: [] // Will be populated by import analysis
    };

    return testFileInfo;
  }

  /**
   * Batch process multiple discovered files
   */
  batchCalculateTargetPaths(discoveredFiles: DiscoveredTestFile[]): BatchPathMappingResult {
    const result: BatchPathMappingResult = {
      mappings: [],
      errors: [],
      warnings: []
    };

    for (const file of discoveredFiles) {
      try {
        const targetPath = this.calculateTargetPath(file);
        const validation = this.validateTargetPath(file, targetPath);
        const directoryMirror = this.mirrorDirectoryStructure(file.filePath, targetPath);

        const mapping: PathMapping = {
          discoveredFile: file,
          targetPath: targetPath,
          validation: validation,
          directoryMirror: directoryMirror
        };

        result.mappings.push(mapping);

        // Collect errors and warnings
        result.errors.push(...validation.errors);
        result.warnings.push(...validation.warnings);
        result.errors.push(...directoryMirror.conflicts);
      } catch (error) {
        result.errors.push(`Error processing ${file.filePath}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return result;
  }

  /**
   * Get relative path from test directory to source file
   * This is used for calculating import paths
   */
  getRelativePathToSource(testFilePath: string, sourceFilePath: string): string {
    const testDir = path.dirname(testFilePath);
    const relativePath = path.relative(testDir, sourceFilePath);

    // Ensure the path uses forward slashes for imports
    return relativePath.replace(/\\/g, '/');
  }

  /**
   * Calculate the source file path that corresponds to a test file
   * This is a heuristic based on naming conventions
   */
  inferSourceFilePath(discoveredFile: DiscoveredTestFile): string | null {
    const { fileName, directory, sourceType } = discoveredFile;

    // Remove test suffixes to get the likely source file name
    let sourceFileName = fileName
      .replace(/\.spec\.(ts|tsx)$/, '.$1')
      .replace(/\.test\.(ts|tsx)$/, '.$1');

    // For frontend components, look for the component file
    if (sourceType === 'frontend') {
      const componentDir = directory;
      const possibleSourcePaths = [
        path.join(componentDir, sourceFileName),
        path.join(componentDir, 'index.ts'),
        path.join(componentDir, 'index.tsx')
      ];

      for (const sourcePath of possibleSourcePaths) {
        if (fs.existsSync(sourcePath)) {
          return sourcePath;
        }
      }
    }

    // For backend, look in the same directory
    const possibleSourcePath = path.join(directory, sourceFileName);
    if (fs.existsSync(possibleSourcePath)) {
      return possibleSourcePath;
    }

    return null;
  }
}

/**
 * Result of directory structure mirroring
 */
export interface DirectoryMirrorResult {
  sourceDirectory: string;
  targetDirectory: string;
  directoriesToCreate: string[];
  conflicts: string[];
  valid: boolean;
}

/**
 * Result of path validation
 */
export interface PathValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Individual path mapping result
 */
export interface PathMapping {
  discoveredFile: DiscoveredTestFile;
  targetPath: string;
  validation: PathValidationResult;
  directoryMirror: DirectoryMirrorResult;
}

/**
 * Batch path mapping result
 */
export interface BatchPathMappingResult {
  mappings: PathMapping[];
  errors: string[];
  warnings: string[];
}