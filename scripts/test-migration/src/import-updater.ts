import * as fs from 'fs';
import * as path from 'path';
import { ImportAnalyzer, ImportPathUtils } from './import-analyzer';
import { TestFileInfo, ImportStatement, DiscoveredTestFile } from './types';

/**
 * Handles updating import paths in test files during migration
 */
export class ImportUpdater {
  private importAnalyzer: ImportAnalyzer;

  constructor() {
    this.importAnalyzer = new ImportAnalyzer();
  }

  /**
   * Analyze imports in a test file and calculate updated paths
   */
  analyzeTestFileImports(
    testFile: DiscoveredTestFile,
    targetPath: string,
    projectRoot: string
  ): ImportStatement[] {
    try {
      const imports = this.importAnalyzer.parseFile(testFile.filePath);

      // Update each import path for the new location
      for (const importStmt of imports) {
        if (importStmt.isRelative) {
          importStmt.updatedPath = this.importAnalyzer.calculateUpdatedImportPath(
            importStmt.originalPath,
            testFile.filePath,
            targetPath,
            projectRoot
          );
        }
      }

      return imports;
    } catch (error) {
      console.warn(`Failed to analyze imports in ${testFile.filePath}: ${error}`);
      return [];
    }
  }

  /**
   * Update imports for a batch of test files
   */
  batchAnalyzeImports(
    testFiles: DiscoveredTestFile[],
    targetPaths: Map<string, string>,
    projectRoot: string
  ): Map<string, ImportStatement[]> {
    const importMap = new Map<string, ImportStatement[]>();

    for (const testFile of testFiles) {
      const targetPath = targetPaths.get(testFile.filePath);
      if (!targetPath) {
        console.warn(`No target path found for ${testFile.filePath}`);
        continue;
      }

      const imports = this.analyzeTestFileImports(testFile, targetPath, projectRoot);
      importMap.set(testFile.filePath, imports);
    }

    return importMap;
  }

  /**
   * Update test-to-test imports when multiple test files are being moved
   */
  updateTestToTestImports(
    importMap: Map<string, ImportStatement[]>,
    testFiles: DiscoveredTestFile[],
    targetPaths: Map<string, string>
  ): void {
    const testFilePaths = testFiles.map(f => f.filePath);

    for (const [testFilePath, imports] of importMap) {
      const targetPath = targetPaths.get(testFilePath);
      if (!targetPath) continue;

      // Find imports that reference other test files
      const testFileImports = this.importAnalyzer.getTestFileImports(
        imports,
        testFilePath,
        testFilePaths
      );

      // Update paths for test-to-test imports
      for (const testImport of testFileImports) {
        const referencedTestFile = this.findReferencedTestFile(
          testImport,
          testFilePath,
          testFiles
        );

        if (referencedTestFile) {
          const referencedTargetPath = targetPaths.get(referencedTestFile.filePath);
          if (referencedTargetPath) {
            testImport.updatedPath = ImportPathUtils.toRelativeImportPath(
              targetPath,
              referencedTargetPath
            );
          }
        }
      }
    }
  }

  /**
   * Find which test file is referenced by an import statement
   */
  private findReferencedTestFile(
    importStmt: ImportStatement,
    fromTestFilePath: string,
    allTestFiles: DiscoveredTestFile[]
  ): DiscoveredTestFile | null {
    const fromDir = path.dirname(fromTestFilePath);
    const targetPath = path.resolve(fromDir, importStmt.originalPath);

    for (const testFile of allTestFiles) {
      const testFileResolved = path.resolve(testFile.filePath);

      // Check with and without extensions
      if (targetPath === testFileResolved ||
          targetPath === testFileResolved.replace(/\.(ts|tsx|js|jsx)$/, '') ||
          targetPath + '.ts' === testFileResolved ||
          targetPath + '.tsx' === testFileResolved ||
          targetPath + '.js' === testFileResolved ||
          targetPath + '.jsx' === testFileResolved) {
        return testFile;
      }
    }

    return null;
  }

  /**
   * Generate updated file content with new import paths
   */
  generateUpdatedFileContent(
    originalFilePath: string,
    imports: ImportStatement[]
  ): string {
    const originalContent = fs.readFileSync(originalFilePath, 'utf-8');
    return this.importAnalyzer.updateImportsInContent(originalContent, imports);
  }

  /**
   * Validate that all updated import paths are correct
   */
  validateUpdatedImports(
    imports: ImportStatement[],
    newTestFilePath: string,
    projectRoot: string
  ): { valid: ImportStatement[], invalid: ImportStatement[], warnings: string[] } {
    const validation = this.importAnalyzer.validateImportPaths(
      imports,
      newTestFilePath,
      projectRoot
    );

    const warnings: string[] = [];

    // Check for potential issues
    for (const invalidImport of validation.invalid) {
      if (invalidImport.isRelative) {
        warnings.push(
          `Import "${invalidImport.updatedPath}" in ${newTestFilePath} may not resolve correctly`
        );
      }
    }

    return {
      valid: validation.valid,
      invalid: validation.invalid,
      warnings
    };
  }

  /**
   * Create TestFileInfo with analyzed imports
   */
  createTestFileInfoWithImports(
    testFile: DiscoveredTestFile,
    targetPath: string,
    sourceFilePath: string,
    projectRoot: string
  ): TestFileInfo {
    const imports = this.analyzeTestFileImports(testFile, targetPath, projectRoot);

    return {
      currentPath: testFile.filePath,
      targetPath,
      sourceFilePath,
      testType: testFile.testType,
      imports
    };
  }

  /**
   * Get statistics about import updates
   */
  getImportUpdateStats(importMap: Map<string, ImportStatement[]>): {
    totalImports: number;
    relativeImports: number;
    updatedImports: number;
    testToTestImports: number;
  } {
    let totalImports = 0;
    let relativeImports = 0;
    let updatedImports = 0;
    let testToTestImports = 0;

    for (const imports of importMap.values()) {
      totalImports += imports.length;

      for (const importStmt of imports) {
        if (importStmt.isRelative) {
          relativeImports++;

          if (importStmt.originalPath !== importStmt.updatedPath) {
            updatedImports++;
          }

          // Check if this looks like a test-to-test import
          if (ImportPathUtils.isTestFile(importStmt.originalPath)) {
            testToTestImports++;
          }
        }
      }
    }

    return {
      totalImports,
      relativeImports,
      updatedImports,
      testToTestImports
    };
  }
}

/**
 * Utility class for import path calculations
 */
export class ImportPathCalculator {
  /**
   * Calculate the relative path from a test file to its corresponding source file
   */
  static calculateSourceImportPath(
    testFilePath: string,
    sourceFilePath: string
  ): string {
    return ImportPathUtils.toRelativeImportPath(testFilePath, sourceFilePath);
  }

  /**
   * Calculate import path between two test files
   */
  static calculateTestToTestImportPath(
    fromTestPath: string,
    toTestPath: string
  ): string {
    return ImportPathUtils.toRelativeImportPath(fromTestPath, toTestPath);
  }

  /**
   * Determine if an import path needs updating
   */
  static needsUpdate(
    originalPath: string,
    currentTestPath: string,
    newTestPath: string,
    projectRoot: string
  ): boolean {
    if (!ImportPathUtils.normalizeImportPath(originalPath).match(/^\.\.?\//)) {
      return false; // Not a relative import
    }

    const currentDir = path.dirname(currentTestPath);
    const newDir = path.dirname(newTestPath);

    // If the relative directory structure is the same, no update needed
    const currentRelativeDir = path.relative(projectRoot, currentDir);
    const newRelativeDir = path.relative(projectRoot, newDir);

    return currentRelativeDir !== newRelativeDir;
  }

  /**
   * Get the depth difference between old and new test locations
   */
  static getDepthDifference(
    oldTestPath: string,
    newTestPath: string,
    projectRoot: string
  ): number {
    const oldRelative = path.relative(projectRoot, path.dirname(oldTestPath));
    const newRelative = path.relative(projectRoot, path.dirname(newTestPath));

    const oldDepth = oldRelative === '' ? 0 : oldRelative.split(path.sep).length;
    const newDepth = newRelative === '' ? 0 : newRelative.split(path.sep).length;

    return newDepth - oldDepth;
  }
}