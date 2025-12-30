/**
 * Import Statement Generator
 * Requirements: 3.1
 *
 * Generates and manages import statements for SVG components
 * Handles import organization, deduplication, and updates
 */

import * as ts from 'typescript';
import { readFileSync, writeFileSync } from 'fs';
import { GeneratedComponent } from './component-generator';

export interface ImportInfo {
  /** Component name to import */
  componentName: string;
  /** Import source (e.g., '@/components/Svgs') */
  importSource: string;
  /** Whether this is a default import */
  isDefault: boolean;
  /** Whether this is a type import */
  isTypeOnly: boolean;
}

export interface ImportUpdateResult {
  /** Updated file content */
  updatedContent: string;
  /** List of imports that were added */
  addedImports: string[];
  /** List of imports that were updated */
  updatedImports: string[];
  /** List of imports that already existed */
  existingImports: string[];
  /** Any warnings encountered */
  warnings: string[];
  /** Whether the update was successful */
  success: boolean;
}

export interface ImportGenerationOptions {
  /** Import source path (default: '@/components/Svgs') */
  importSource?: string;
  /** Whether to sort imports alphabetically */
  sortImports?: boolean;
  /** Whether to group imports by source */
  groupBySource?: boolean;
  /** Maximum imports per line before splitting */
  maxImportsPerLine?: number;
  /** Whether to preserve existing import formatting */
  preserveFormatting?: boolean;
}

export class ImportStatementGenerator {
  private readonly options: Required<ImportGenerationOptions>;

  constructor(options: ImportGenerationOptions = {}) {
    this.options = {
      importSource: '@/components/Svgs',
      sortImports: true,
      groupBySource: true,
      maxImportsPerLine: 5,
      preserveFormatting: false,
      ...options
    };
  }

  /**
   * Generate import statement for a single component
   */
  generateImportStatement(componentName: string, importSource?: string): string {
    const source = importSource || this.options.importSource;
    return `import { ${componentName} } from '${source}';`;
  }

  /**
   * Generate import statement for multiple components from the same source
   */
  generateMultipleImportStatement(componentNames: string[], importSource?: string): string {
    const source = importSource || this.options.importSource;
    const sortedNames = this.options.sortImports
      ? [...componentNames].sort()
      : componentNames;

    if (sortedNames.length <= this.options.maxImportsPerLine) {
      return `import { ${sortedNames.join(', ')} } from '${source}';`;
    }

    // Multi-line import for many components
    const imports = sortedNames.map(name => `  ${name}`).join(',\n');
    return `import {\n${imports}\n} from '${source}';`;
  }

  /**
   * Parse existing imports from a TypeScript file
   */
  parseExistingImports(fileContent: string): ImportInfo[] {
    const sourceFile = ts.createSourceFile(
      'temp.tsx',
      fileContent,
      ts.ScriptTarget.Latest,
      true
    );

    const imports: ImportInfo[] = [];

    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier;
        if (ts.isStringLiteral(moduleSpecifier)) {
          const importSource = moduleSpecifier.text;

          if (node.importClause) {
            // Handle named imports
            if (node.importClause.namedBindings &&
                ts.isNamedImports(node.importClause.namedBindings)) {

              for (const element of node.importClause.namedBindings.elements) {
                imports.push({
                  componentName: element.name.text,
                  importSource,
                  isDefault: false,
                  isTypeOnly: element.isTypeOnly || false
                });
              }
            }

            // Handle default imports
            if (node.importClause.name) {
              imports.push({
                componentName: node.importClause.name.text,
                importSource,
                isDefault: true,
                isTypeOnly: false
              });
            }
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return imports;
  }

  /**
   * Update imports in a TypeScript file
   */
  updateFileImports(
    filePath: string,
    newComponents: GeneratedComponent[]
  ): ImportUpdateResult {
    try {
      const fileContent = readFileSync(filePath, 'utf-8');
      return this.updateImportsInContent(fileContent, newComponents);
    } catch (error: any) {
      return {
        updatedContent: '',
        addedImports: [],
        updatedImports: [],
        existingImports: [],
        warnings: [`Failed to read file ${filePath}: ${error?.message || 'Unknown error'}`],
        success: false
      };
    }
  }

  /**
   * Update imports in file content string
   */
  updateImportsInContent(
    fileContent: string,
    newComponents: GeneratedComponent[]
  ): ImportUpdateResult {
    const warnings: string[] = [];
    const addedImports: string[] = [];
    const updatedImports: string[] = [];
    const existingImports: string[] = [];

    try {
      // Parse existing imports
      const currentImports = this.parseExistingImports(fileContent);

      // Find existing Svgs imports
      const svgsImports = currentImports.filter(imp =>
        imp.importSource === this.options.importSource
      );

      const existingSvgComponents = svgsImports.map(imp => imp.componentName);

      // Determine which components need to be added
      const componentsToAdd = newComponents.filter(comp =>
        !existingSvgComponents.includes(comp.name)
      );

      // Track what we're doing
      for (const comp of newComponents) {
        if (existingSvgComponents.includes(comp.name)) {
          existingImports.push(comp.name);
        } else {
          addedImports.push(comp.name);
        }
      }

      if (componentsToAdd.length === 0) {
        return {
          updatedContent: fileContent,
          addedImports: [],
          updatedImports: [],
          existingImports,
          warnings: ['No new imports needed'],
          success: true
        };
      }

      // Generate updated content
      let updatedContent = fileContent;

      if (svgsImports.length > 0) {
        // Update existing import statement
        updatedContent = this.updateExistingImportStatement(
          updatedContent,
          componentsToAdd.map(c => c.name)
        );
        updatedImports.push(...componentsToAdd.map(c => c.name));
      } else {
        // Add new import statement
        updatedContent = this.addNewImportStatement(
          updatedContent,
          componentsToAdd.map(c => c.name)
        );
      }

      return {
        updatedContent,
        addedImports,
        updatedImports,
        existingImports,
        warnings,
        success: true
      };

    } catch (error: any) {
      return {
        updatedContent: fileContent,
        addedImports: [],
        updatedImports: [],
        existingImports: [],
        warnings: [`Error updating imports: ${error?.message || 'Unknown error'}`],
        success: false
      };
    }
  }

  /**
   * Update an existing import statement to include new components
   */
  private updateExistingImportStatement(
    fileContent: string,
    newComponentNames: string[]
  ): string {
    const sourceFile = ts.createSourceFile(
      'temp.tsx',
      fileContent,
      ts.ScriptTarget.Latest,
      true
    );

    let updatedContent = fileContent;

    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier;
        if (ts.isStringLiteral(moduleSpecifier) &&
            moduleSpecifier.text === this.options.importSource) {

          if (node.importClause?.namedBindings &&
              ts.isNamedImports(node.importClause.namedBindings)) {

            // Get existing component names
            const existingNames = node.importClause.namedBindings.elements
              .map(element => element.name.text);

            // Combine and sort all component names
            const allNames = [...existingNames, ...newComponentNames];
            const sortedNames = this.options.sortImports
              ? allNames.sort()
              : allNames;

            // Generate new import statement
            const newImportStatement = this.generateMultipleImportStatement(
              sortedNames,
              this.options.importSource
            );

            // Replace the old import statement
            const start = node.getFullStart();
            const end = node.getEnd();
            const before = updatedContent.substring(0, start);
            const after = updatedContent.substring(end);
            updatedContent = before + newImportStatement + after;
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return updatedContent;
  }

  /**
   * Add a new import statement to the file
   */
  private addNewImportStatement(
    fileContent: string,
    componentNames: string[]
  ): string {
    const importStatement = this.generateMultipleImportStatement(
      componentNames,
      this.options.importSource
    );

    // Find the best place to insert the import
    const lines = fileContent.split('\n');
    let insertIndex = 0;

    // Look for existing imports to insert after
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('import ')) {
        insertIndex = i + 1;
      } else if (line.length > 0 && !line.startsWith('import ')) {
        break;
      }
    }

    // Insert the new import statement
    lines.splice(insertIndex, 0, importStatement);
    return lines.join('\n');
  }

  /**
   * Remove unused imports from a file
   */
  removeUnusedImports(
    fileContent: string,
    usedComponents: string[]
  ): ImportUpdateResult {
    const warnings: string[] = [];
    const removedImports: string[] = [];

    try {
      const currentImports = this.parseExistingImports(fileContent);
      const svgsImports = currentImports.filter(imp =>
        imp.importSource === this.options.importSource
      );

      const unusedImports = svgsImports.filter(imp =>
        !usedComponents.includes(imp.componentName)
      );

      if (unusedImports.length === 0) {
        return {
          updatedContent: fileContent,
          addedImports: [],
          updatedImports: [],
          existingImports: usedComponents,
          warnings: ['No unused imports found'],
          success: true
        };
      }

      // Remove unused imports
      const usedSvgComponents = svgsImports
        .filter(imp => usedComponents.includes(imp.componentName))
        .map(imp => imp.componentName);

      let updatedContent = fileContent;

      if (usedSvgComponents.length > 0) {
        // Update import statement with only used components
        updatedContent = this.updateExistingImportStatement(
          updatedContent,
          []
        );
        updatedContent = this.updateExistingImportStatement(
          updatedContent,
          usedSvgComponents
        );
      } else {
        // Remove the entire import statement
        updatedContent = this.removeImportStatement(updatedContent);
      }

      removedImports.push(...unusedImports.map(imp => imp.componentName));

      return {
        updatedContent,
        addedImports: [],
        updatedImports: removedImports,
        existingImports: usedSvgComponents,
        warnings,
        success: true
      };

    } catch (error: any) {
      return {
        updatedContent: fileContent,
        addedImports: [],
        updatedImports: [],
        existingImports: [],
        warnings: [`Error removing unused imports: ${error?.message || 'Unknown error'}`],
        success: false
      };
    }
  }

  /**
   * Remove the entire Svgs import statement
   */
  private removeImportStatement(fileContent: string): string {
    const sourceFile = ts.createSourceFile(
      'temp.tsx',
      fileContent,
      ts.ScriptTarget.Latest,
      true
    );

    let updatedContent = fileContent;

    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier;
        if (ts.isStringLiteral(moduleSpecifier) &&
            moduleSpecifier.text === this.options.importSource) {

          // Remove the entire import statement
          const start = node.getFullStart();
          const end = node.getEnd();
          const before = updatedContent.substring(0, start);
          const after = updatedContent.substring(end);
          updatedContent = before + after;
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return updatedContent;
  }

  /**
   * Validate import statement syntax
   */
  validateImportStatement(importStatement: string): {
    isValid: boolean;
    errors: string[];
  } {
    try {
      const sourceFile = ts.createSourceFile(
        'temp.tsx',
        importStatement,
        ts.ScriptTarget.Latest,
        true
      );

      const diagnostics = ts.getPreEmitDiagnostics(
        ts.createProgram(['temp.tsx'], {}, {
          getSourceFile: () => sourceFile,
          writeFile: () => {},
          getCurrentDirectory: () => '',
          getDirectories: () => [],
          fileExists: () => true,
          readFile: () => '',
          getCanonicalFileName: (fileName) => fileName,
          useCaseSensitiveFileNames: () => true,
          getNewLine: () => '\n',
          getDefaultLibFileName: () => 'lib.d.ts'
        })
      );

      if (diagnostics.length > 0) {
        return {
          isValid: false,
          errors: diagnostics.map(d => d.messageText.toString())
        };
      }

      return { isValid: true, errors: [] };

    } catch (error: any) {
      return {
        isValid: false,
        errors: [`Syntax error: ${error?.message || 'Unknown error'}`]
      };
    }
  }

  /**
   * Get import statistics for a file
   */
  getImportStatistics(fileContent: string): {
    totalImports: number;
    svgsImports: number;
    svgsComponents: string[];
    otherImports: { source: string; components: string[] }[];
  } {
    const imports = this.parseExistingImports(fileContent);
    const svgsImports = imports.filter(imp =>
      imp.importSource === this.options.importSource
    );

    const otherImports = imports
      .filter(imp => imp.importSource !== this.options.importSource)
      .reduce((acc, imp) => {
        const existing = acc.find(item => item.source === imp.importSource);
        if (existing) {
          existing.components.push(imp.componentName);
        } else {
          acc.push({
            source: imp.importSource,
            components: [imp.componentName]
          });
        }
        return acc;
      }, [] as { source: string; components: string[] }[]);

    return {
      totalImports: imports.length,
      svgsImports: svgsImports.length,
      svgsComponents: svgsImports.map(imp => imp.componentName),
      otherImports
    };
  }
}

/**
 * Utility function to create an import generator
 */
export function createImportGenerator(options?: ImportGenerationOptions): ImportStatementGenerator {
  return new ImportStatementGenerator(options);
}

/**
 * Quick utility to generate a single import statement
 */
export function generateImport(
  componentName: string,
  importSource: string = '@/components/Svgs'
): string {
  const generator = createImportGenerator({ importSource });
  return generator.generateImportStatement(componentName, importSource);
}

/**
 * Quick utility to generate multiple import statements
 */
export function generateMultipleImports(
  componentNames: string[],
  importSource: string = '@/components/Svgs'
): string {
  const generator = createImportGenerator({ importSource });
  return generator.generateMultipleImportStatement(componentNames, importSource);
}