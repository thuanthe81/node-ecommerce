import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import { ImportStatement } from './types';

/**
 * Analyzes and updates import statements in TypeScript/JavaScript test files
 */
export class ImportAnalyzer {
  private sourceFile: ts.SourceFile | null = null;
  private filePath: string = '';

  /**
   * Parse a TypeScript/JavaScript file and extract import statements
   */
  parseFile(filePath: string): ImportStatement[] {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    this.filePath = filePath;
    this.sourceFile = ts.createSourceFile(
      filePath,
      fileContent,
      ts.ScriptTarget.Latest,
      true
    );

    const imports: ImportStatement[] = [];
    this.visitNode(this.sourceFile, imports);

    return imports;
  }

  /**
   * Visit AST nodes to find import statements
   */
  private visitNode(node: ts.Node, imports: ImportStatement[]): void {
    if (ts.isImportDeclaration(node)) {
      const importPath = this.extractImportPath(node);
      if (importPath) {
        const lineNumber = this.getLineNumber(node);
        const isRelative = this.isRelativeImport(importPath);

        imports.push({
          originalPath: importPath,
          updatedPath: importPath, // Will be updated later
          isRelative,
          lineNumber
        });
      }
    }

    // Also check for dynamic imports and require statements
    if (ts.isCallExpression(node)) {
      const importPath = this.extractDynamicImportPath(node);
      if (importPath) {
        const lineNumber = this.getLineNumber(node);
        const isRelative = this.isRelativeImport(importPath);

        imports.push({
          originalPath: importPath,
          updatedPath: importPath,
          isRelative,
          lineNumber
        });
      }
    }

    ts.forEachChild(node, child => this.visitNode(child, imports));
  }

  /**
   * Extract import path from import declaration
   */
  private extractImportPath(node: ts.ImportDeclaration): string | null {
    if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      return node.moduleSpecifier.text;
    }
    return null;
  }

  /**
   * Extract import path from dynamic import or require call
   */
  private extractDynamicImportPath(node: ts.CallExpression): string | null {
    // Handle import() calls
    if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const arg = node.arguments[0];
      if (arg && ts.isStringLiteral(arg)) {
        return arg.text;
      }
    }

    // Handle require() calls
    if (ts.isIdentifier(node.expression) && node.expression.text === 'require') {
      const arg = node.arguments[0];
      if (arg && ts.isStringLiteral(arg)) {
        return arg.text;
      }
    }

    return null;
  }

  /**
   * Get line number for a node
   */
  private getLineNumber(node: ts.Node): number {
    if (!this.sourceFile) return 0;
    const lineAndChar = this.sourceFile.getLineAndCharacterOfPosition(node.getStart());
    return lineAndChar.line + 1; // Convert to 1-based line numbers
  }

  /**
   * Check if an import path is relative
   */
  private isRelativeImport(importPath: string): boolean {
    return importPath.startsWith('./') || importPath.startsWith('../');
  }

  /**
   * Calculate updated import path for a moved test file
   */
  calculateUpdatedImportPath(
    originalImportPath: string,
    currentTestFilePath: string,
    newTestFilePath: string,
    projectRoot: string
  ): string {
    // If it's not a relative import, no change needed
    if (!this.isRelativeImport(originalImportPath)) {
      return originalImportPath;
    }

    // Resolve the original target file path
    const currentTestDir = path.dirname(currentTestFilePath);
    const originalTargetPath = path.resolve(currentTestDir, originalImportPath);

    // Calculate new relative path from new test file location
    const newTestDir = path.dirname(newTestFilePath);
    let newRelativePath = path.relative(newTestDir, originalTargetPath);

    // Ensure forward slashes for consistency
    newRelativePath = newRelativePath.replace(/\\/g, '/');

    // Ensure relative path starts with ./ or ../
    if (!newRelativePath.startsWith('./') && !newRelativePath.startsWith('../')) {
      newRelativePath = './' + newRelativePath;
    }

    return newRelativePath;
  }

  /**
   * Update import statements in file content
   */
  updateImportsInContent(
    fileContent: string,
    imports: ImportStatement[]
  ): string {
    let updatedContent = fileContent;
    const lines = fileContent.split('\n');

    // Sort imports by line number in descending order to avoid line number shifts
    const sortedImports = [...imports].sort((a, b) => b.lineNumber - a.lineNumber);

    for (const importStmt of sortedImports) {
      if (importStmt.originalPath !== importStmt.updatedPath) {
        const lineIndex = importStmt.lineNumber - 1;
        if (lineIndex >= 0 && lineIndex < lines.length) {
          const originalLine = lines[lineIndex];
          const updatedLine = originalLine.replace(
            new RegExp(`(['"\`])${this.escapeRegExp(importStmt.originalPath)}\\1`, 'g'),
            `$1${importStmt.updatedPath}$1`
          );
          lines[lineIndex] = updatedLine;
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Escape special regex characters
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Validate that all import paths can be resolved
   */
  validateImportPaths(
    imports: ImportStatement[],
    testFilePath: string,
    projectRoot: string
  ): { valid: ImportStatement[], invalid: ImportStatement[] } {
    const valid: ImportStatement[] = [];
    const invalid: ImportStatement[] = [];

    const testFileDir = path.dirname(testFilePath);

    for (const importStmt of imports) {
      if (!importStmt.isRelative) {
        // For non-relative imports, assume they're valid (node_modules, etc.)
        valid.push(importStmt);
        continue;
      }

      try {
        const targetPath = path.resolve(testFileDir, importStmt.updatedPath);

        // Check if the target file exists (with common extensions)
        const extensions = ['', '.ts', '.tsx', '.js', '.jsx'];
        let exists = false;

        for (const ext of extensions) {
          if (fs.existsSync(targetPath + ext)) {
            exists = true;
            break;
          }
        }

        // Also check if it's a directory with index file
        if (!exists) {
          for (const ext of ['.ts', '.tsx', '.js', '.jsx']) {
            if (fs.existsSync(path.join(targetPath, `index${ext}`))) {
              exists = true;
              break;
            }
          }
        }

        if (exists) {
          valid.push(importStmt);
        } else {
          invalid.push(importStmt);
        }
      } catch (error) {
        invalid.push(importStmt);
      }
    }

    return { valid, invalid };
  }

  /**
   * Get import statements that reference other test files
   */
  getTestFileImports(
    imports: ImportStatement[],
    testFilePath: string,
    allTestFiles: string[]
  ): ImportStatement[] {
    const testFileImports: ImportStatement[] = [];
    const testFileDir = path.dirname(testFilePath);

    for (const importStmt of imports) {
      if (!importStmt.isRelative) continue;

      try {
        const targetPath = path.resolve(testFileDir, importStmt.originalPath);

        // Check if this import points to any of the test files
        for (const testFile of allTestFiles) {
          const testFileResolved = path.resolve(testFile);

          // Check with and without extensions
          if (targetPath === testFileResolved ||
              targetPath === testFileResolved.replace(/\.(ts|tsx|js|jsx)$/, '') ||
              targetPath + '.ts' === testFileResolved ||
              targetPath + '.tsx' === testFileResolved ||
              targetPath + '.js' === testFileResolved ||
              targetPath + '.jsx' === testFileResolved) {
            testFileImports.push(importStmt);
            break;
          }
        }
      } catch (error) {
        // Skip invalid paths
        continue;
      }
    }

    return testFileImports;
  }
}

/**
 * Utility functions for import path operations
 */
export class ImportPathUtils {
  /**
   * Normalize import path to use forward slashes
   */
  static normalizeImportPath(importPath: string): string {
    return importPath.replace(/\\/g, '/');
  }

  /**
   * Convert absolute path to relative import path
   */
  static toRelativeImportPath(fromPath: string, toPath: string): string {
    let relativePath = path.relative(path.dirname(fromPath), toPath);
    relativePath = this.normalizeImportPath(relativePath);

    // Remove file extension for imports
    relativePath = relativePath.replace(/\.(ts|tsx|js|jsx)$/, '');

    // Ensure it starts with ./ or ../
    if (!relativePath.startsWith('./') && !relativePath.startsWith('../')) {
      relativePath = './' + relativePath;
    }

    return relativePath;
  }

  /**
   * Check if a path points to a test file
   */
  static isTestFile(filePath: string): boolean {
    const testPatterns = [
      /\.test\.(ts|tsx|js|jsx)$/,
      /\.spec\.(ts|tsx|js|jsx)$/,
      /__tests__/,
      /test/
    ];

    return testPatterns.some(pattern => pattern.test(filePath));
  }

  /**
   * Get the source file path that corresponds to a test file
   */
  static getCorrespondingSourceFile(
    testFilePath: string,
    sourceDirectories: string[]
  ): string | null {
    const testFileName = path.basename(testFilePath);
    const sourceFileName = testFileName
      .replace(/\.(test|spec)\.(ts|tsx|js|jsx)$/, '.$2')
      .replace(/\.test$/, '')
      .replace(/\.spec$/, '');

    // Get the relative directory structure
    const testDir = path.dirname(testFilePath);

    for (const sourceDir of sourceDirectories) {
      // Try to find the corresponding source file
      const potentialSourcePath = path.join(sourceDir, path.relative(testDir, testDir), sourceFileName);

      if (fs.existsSync(potentialSourcePath)) {
        return potentialSourcePath;
      }

      // Also try without the relative path adjustment for co-located tests
      const directSourcePath = path.join(path.dirname(testFilePath), sourceFileName);
      if (fs.existsSync(directSourcePath)) {
        return directSourcePath;
      }
    }

    return null;
  }
}