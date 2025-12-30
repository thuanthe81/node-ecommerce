/**
 * TypeScript Compilation Validation System
 * Requirements: 5.4
 *
 * Runs TypeScript compiler to check for type errors
 * Validates import resolution and type checking
 * Ensures no compilation errors related to SVG components
 */

import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import { GeneratedComponent } from './component-generator';
import { ConsolidationResult } from './svg-consolidation-system';

export interface TypeScriptValidationResult {
  /** Whether TypeScript compilation succeeded */
  success: boolean;
  /** Any compilation errors found */
  errors: TypeScriptError[];
  /** Any compilation warnings found */
  warnings: TypeScriptWarning[];
  /** Files that were checked */
  checkedFiles: string[];
  /** Import resolution results */
  importResolution: ImportResolutionResult[];
  /** Type checking results for SVG components */
  componentTypeChecking: ComponentTypeCheckResult[];
}

export interface TypeScriptError {
  /** File path where error occurred */
  file: string;
  /** Line number of error */
  line: number;
  /** Column number of error */
  column: number;
  /** Error message */
  message: string;
  /** TypeScript error code */
  code: number;
  /** Error category */
  category: 'error' | 'warning' | 'suggestion';
}

export interface TypeScriptWarning {
  /** File path where warning occurred */
  file: string;
  /** Line number of warning */
  line: number;
  /** Column number of warning */
  column: number;
  /** Warning message */
  message: string;
  /** TypeScript warning code */
  code: number;
}

export interface ImportResolutionResult {
  /** File that contains the import */
  importingFile: string;
  /** Import statement that was tested */
  importStatement: string;
  /** Whether the import resolved successfully */
  resolved: boolean;
  /** Resolved file path (if successful) */
  resolvedPath?: string;
  /** Error message (if failed) */
  error?: string;
}

export interface ComponentTypeCheckResult {
  /** Component name */
  componentName: string;
  /** Whether component types are valid */
  typesValid: boolean;
  /** Type errors specific to this component */
  typeErrors: string[];
  /** Whether props interface is correct */
  propsInterfaceValid: boolean;
  /** Whether return type is correct */
  returnTypeValid: boolean;
}

export interface TypeScriptValidationOptions {
  /** Frontend directory path */
  frontendDir?: string;
  /** TypeScript config file path */
  tsconfigPath?: string;
  /** Whether to check only SVG-related files */
  svgFilesOnly?: boolean;
  /** Specific files to check */
  filesToCheck?: string[];
  /** Whether to validate import resolution */
  validateImports?: boolean;
  /** Whether to validate component types */
  validateComponentTypes?: boolean;
  /** Whether to include warnings in results */
  includeWarnings?: boolean;
}

export class TypeScriptValidator {
  private readonly defaultOptions: TypeScriptValidationOptions = {
    frontendDir: 'frontend',
    tsconfigPath: 'frontend/tsconfig.json',
    svgFilesOnly: false,
    filesToCheck: [],
    validateImports: true,
    validateComponentTypes: true,
    includeWarnings: true
  };

  private program: ts.Program | null = null;
  private compilerOptions: ts.CompilerOptions | null = null;

  /**
   * Validate TypeScript compilation for SVG consolidation
   */
  async validateTypeScriptCompilation(
    consolidationResult: ConsolidationResult,
    options: TypeScriptValidationOptions = {}
  ): Promise<TypeScriptValidationResult> {
    const opts = { ...this.defaultOptions, ...options };

    try {
      // Initialize TypeScript program
      await this.initializeTypeScriptProgram(opts);

      if (!this.program) {
        return {
          success: false,
          errors: [{
            file: 'typescript-config',
            line: 0,
            column: 0,
            message: 'Failed to initialize TypeScript program',
            code: 0,
            category: 'error'
          }],
          warnings: [],
          checkedFiles: [],
          importResolution: [],
          componentTypeChecking: []
        };
      }

      // Get files to check
      const filesToCheck = this.getFilesToCheck(consolidationResult, opts);

      // Run compilation diagnostics
      const diagnostics = this.runCompilationDiagnostics(filesToCheck);

      // Validate import resolution
      const importResolution = opts.validateImports
        ? await this.validateImportResolution(consolidationResult, opts)
        : [];

      // Validate component types
      const componentTypeChecking = opts.validateComponentTypes
        ? await this.validateComponentTypes(consolidationResult.generatedComponents, opts)
        : [];

      // Process diagnostics
      const errors: TypeScriptError[] = [];
      const warnings: TypeScriptWarning[] = [];

      diagnostics.forEach(diagnostic => {
        const file = diagnostic.file?.fileName || 'unknown';
        const position = diagnostic.file?.getLineAndCharacterOfPosition(diagnostic.start || 0);
        const line = position?.line || 0;
        const column = position?.character || 0;
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');

        const error: TypeScriptError = {
          file,
          line: line + 1, // Convert to 1-based
          column: column + 1, // Convert to 1-based
          message,
          code: diagnostic.code,
          category: diagnostic.category === ts.DiagnosticCategory.Error ? 'error' :
                   diagnostic.category === ts.DiagnosticCategory.Warning ? 'warning' : 'suggestion'
        };

        if (error.category === 'error') {
          errors.push(error);
        } else if (error.category === 'warning' && opts.includeWarnings) {
          warnings.push({
            file: error.file,
            line: error.line,
            column: error.column,
            message: error.message,
            code: error.code
          });
        }
      });

      return {
        success: errors.length === 0,
        errors,
        warnings,
        checkedFiles: filesToCheck,
        importResolution,
        componentTypeChecking
      };

    } catch (error) {
      return {
        success: false,
        errors: [{
          file: 'validation-system',
          line: 0,
          column: 0,
          message: `TypeScript validation failed: ${error instanceof Error ? error.message : String(error)}`,
          code: 0,
          category: 'error'
        }],
        warnings: [],
        checkedFiles: [],
        importResolution: [],
        componentTypeChecking: []
      };
    }
  }

  /**
   * Validate TypeScript compilation for generated components only
   */
  async validateGeneratedComponents(
    components: GeneratedComponent[],
    options: TypeScriptValidationOptions = {}
  ): Promise<TypeScriptValidationResult> {
    const opts = { ...this.defaultOptions, ...options };

    try {
      // Create temporary files for generated components
      const tempFiles = await this.createTemporaryComponentFiles(components, opts);

      // Initialize TypeScript program with temp files
      await this.initializeTypeScriptProgram({
        ...opts,
        filesToCheck: tempFiles
      });

      if (!this.program) {
        return {
          success: false,
          errors: [{
            file: 'typescript-config',
            line: 0,
            column: 0,
            message: 'Failed to initialize TypeScript program for component validation',
            code: 0,
            category: 'error'
          }],
          warnings: [],
          checkedFiles: [],
          importResolution: [],
          componentTypeChecking: []
        };
      }

      // Run diagnostics on temp files
      const diagnostics = this.runCompilationDiagnostics(tempFiles);

      // Validate component types
      const componentTypeChecking = await this.validateComponentTypes(components, opts);

      // Process diagnostics
      const errors: TypeScriptError[] = [];
      const warnings: TypeScriptWarning[] = [];

      diagnostics.forEach(diagnostic => {
        const file = diagnostic.file?.fileName || 'unknown';
        const position = diagnostic.file?.getLineAndCharacterOfPosition(diagnostic.start || 0);
        const line = position?.line || 0;
        const column = position?.character || 0;
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');

        const error: TypeScriptError = {
          file,
          line: line + 1,
          column: column + 1,
          message,
          code: diagnostic.code,
          category: diagnostic.category === ts.DiagnosticCategory.Error ? 'error' :
                   diagnostic.category === ts.DiagnosticCategory.Warning ? 'warning' : 'suggestion'
        };

        if (error.category === 'error') {
          errors.push(error);
        } else if (error.category === 'warning' && opts.includeWarnings) {
          warnings.push({
            file: error.file,
            line: error.line,
            column: error.column,
            message: error.message,
            code: error.code
          });
        }
      });

      // Clean up temporary files
      await this.cleanupTemporaryFiles(tempFiles);

      return {
        success: errors.length === 0,
        errors,
        warnings,
        checkedFiles: tempFiles,
        importResolution: [],
        componentTypeChecking
      };

    } catch (error) {
      return {
        success: false,
        errors: [{
          file: 'component-validation',
          line: 0,
          column: 0,
          message: `Component validation failed: ${error instanceof Error ? error.message : String(error)}`,
          code: 0,
          category: 'error'
        }],
        warnings: [],
        checkedFiles: [],
        importResolution: [],
        componentTypeChecking: []
      };
    }
  }

  /**
   * Initialize TypeScript program
   */
  private async initializeTypeScriptProgram(options: TypeScriptValidationOptions): Promise<void> {
    try {
      const tsconfigPath = path.resolve(options.tsconfigPath || 'frontend/tsconfig.json');

      if (!fs.existsSync(tsconfigPath)) {
        throw new Error(`TypeScript config file not found: ${tsconfigPath}`);
      }

      // Read and parse tsconfig.json
      const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
      if (configFile.error) {
        throw new Error(`Error reading tsconfig.json: ${configFile.error.messageText}`);
      }

      const parsedConfig = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        path.dirname(tsconfigPath)
      );

      if (parsedConfig.errors.length > 0) {
        const errorMessages = parsedConfig.errors.map(err =>
          ts.flattenDiagnosticMessageText(err.messageText, '\n')
        ).join('\n');
        throw new Error(`Error parsing tsconfig.json: ${errorMessages}`);
      }

      this.compilerOptions = parsedConfig.options;

      // Get files to include
      let filesToInclude = parsedConfig.fileNames;
      if (options.filesToCheck && options.filesToCheck.length > 0) {
        filesToInclude = options.filesToCheck;
      }

      // Create TypeScript program
      this.program = ts.createProgram(filesToInclude, this.compilerOptions);

    } catch (error) {
      console.error('Failed to initialize TypeScript program:', error);
      throw error;
    }
  }

  /**
   * Get files to check based on consolidation result
   */
  private getFilesToCheck(
    consolidationResult: ConsolidationResult,
    options: TypeScriptValidationOptions
  ): string[] {
    if (options.filesToCheck && options.filesToCheck.length > 0) {
      return options.filesToCheck;
    }

    const files: string[] = [];

    // Add Svgs.tsx file
    const svgsFilePath = path.join(options.frontendDir || 'frontend', 'components', 'Svgs.tsx');
    if (fs.existsSync(svgsFilePath)) {
      files.push(svgsFilePath);
    }

    // Add files that were modified during replacement
    consolidationResult.replacementResults.forEach(result => {
      // Extract file path from replacement result (this would need to be added to the interface)
      // For now, we'll check common component directories
    });

    if (options.svgFilesOnly) {
      return files;
    }

    // Add all TypeScript files in components directory
    const componentsDir = path.join(options.frontendDir || 'frontend', 'components');
    if (fs.existsSync(componentsDir)) {
      const componentFiles = this.getTypeScriptFiles(componentsDir);
      files.push(...componentFiles);
    }

    return files;
  }

  /**
   * Get all TypeScript files in a directory recursively
   */
  private getTypeScriptFiles(dir: string): string[] {
    const files: string[] = [];

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          files.push(...this.getTypeScriptFiles(fullPath));
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Failed to read directory ${dir}:`, error);
    }

    return files;
  }

  /**
   * Run compilation diagnostics
   */
  private runCompilationDiagnostics(filesToCheck: string[]): ts.Diagnostic[] {
    if (!this.program) {
      return [];
    }

    const allDiagnostics: ts.Diagnostic[] = [];

    // Get pre-emit diagnostics
    const preEmitDiagnostics = ts.getPreEmitDiagnostics(this.program);
    allDiagnostics.push(...preEmitDiagnostics);

    // Get semantic diagnostics for specific files
    for (const filePath of filesToCheck) {
      const sourceFile = this.program.getSourceFile(filePath);
      if (sourceFile) {
        const semanticDiagnostics = this.program.getSemanticDiagnostics(sourceFile);
        allDiagnostics.push(...semanticDiagnostics);

        const syntacticDiagnostics = this.program.getSyntacticDiagnostics(sourceFile);
        allDiagnostics.push(...syntacticDiagnostics);
      }
    }

    return allDiagnostics;
  }

  /**
   * Validate import resolution
   */
  private async validateImportResolution(
    consolidationResult: ConsolidationResult,
    options: TypeScriptValidationOptions
  ): Promise<ImportResolutionResult[]> {
    const results: ImportResolutionResult[] = [];

    if (!this.program) {
      return results;
    }

    // Check imports of generated components
    for (const component of consolidationResult.generatedComponents) {
      // Test import from Svgs.tsx
      const importStatement = `import { ${component.name} } from '@/components/Svgs'`;

      try {
        // This is a simplified check - in a real implementation, you'd want to
        // use TypeScript's module resolution APIs
        const svgsFilePath = path.join(options.frontendDir || 'frontend', 'components', 'Svgs.tsx');
        const svgsContent = fs.readFileSync(svgsFilePath, 'utf-8');

        const resolved = svgsContent.includes(`export const ${component.name}`);

        results.push({
          importingFile: 'test-import',
          importStatement,
          resolved,
          resolvedPath: resolved ? svgsFilePath : undefined,
          error: resolved ? undefined : `Component ${component.name} not found in Svgs.tsx`
        });

      } catch (error) {
        results.push({
          importingFile: 'test-import',
          importStatement,
          resolved: false,
          error: `Failed to check import: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }

    return results;
  }

  /**
   * Validate component types
   */
  private async validateComponentTypes(
    components: GeneratedComponent[],
    options: TypeScriptValidationOptions
  ): Promise<ComponentTypeCheckResult[]> {
    const results: ComponentTypeCheckResult[] = [];

    for (const component of components) {
      const typeErrors: string[] = [];
      let propsInterfaceValid = true;
      let returnTypeValid = true;

      // Check props interface
      if (!component.code.includes('props: SvgProps') && !component.code.includes('props: ImageProps')) {
        typeErrors.push('Component does not use proper props interface (SvgProps or ImageProps)');
        propsInterfaceValid = false;
      }

      // Check return type (should be JSX.Element)
      if (!component.code.includes('=>') && !component.code.includes('return')) {
        typeErrors.push('Component does not have proper return structure');
        returnTypeValid = false;
      }

      // Check for proper TypeScript syntax
      if (!component.code.includes('export const')) {
        typeErrors.push('Component is not properly exported as const');
      }

      // Check for proper JSX
      if (!component.code.includes('<svg') || !component.code.includes('</svg>')) {
        typeErrors.push('Component does not contain proper SVG JSX');
        returnTypeValid = false;
      }

      results.push({
        componentName: component.name,
        typesValid: typeErrors.length === 0,
        typeErrors,
        propsInterfaceValid,
        returnTypeValid
      });
    }

    return results;
  }

  /**
   * Create temporary files for component validation
   */
  private async createTemporaryComponentFiles(
    components: GeneratedComponent[],
    options: TypeScriptValidationOptions
  ): Promise<string[]> {
    const tempFiles: string[] = [];
    const tempDir = path.join(options.frontendDir || 'frontend', '.temp-svg-validation');

    // Create temp directory
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    for (const component of components) {
      const tempFilePath = path.join(tempDir, `${component.name}.tsx`);

      const fileContent = `
import React from 'react';

export type SvgProps = React.SVGProps<SVGSVGElement>;
export type ImageProps = {
  width?: number;
  height?: number;
  className?: string;
};

${component.code}
`;

      fs.writeFileSync(tempFilePath, fileContent, 'utf-8');
      tempFiles.push(tempFilePath);
    }

    return tempFiles;
  }

  /**
   * Clean up temporary files
   */
  private async cleanupTemporaryFiles(tempFiles: string[]): Promise<void> {
    for (const filePath of tempFiles) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.warn(`Failed to delete temporary file ${filePath}:`, error);
      }
    }

    // Remove temp directory if empty
    try {
      const tempDir = path.dirname(tempFiles[0]);
      if (fs.existsSync(tempDir)) {
        const remainingFiles = fs.readdirSync(tempDir);
        if (remainingFiles.length === 0) {
          fs.rmdirSync(tempDir);
        }
      }
    } catch (error) {
      console.warn('Failed to clean up temp directory:', error);
    }
  }

  /**
   * Generate a TypeScript validation report
   */
  generateValidationReport(result: TypeScriptValidationResult): string {
    let report = '# TypeScript Compilation Validation Report\n\n';

    report += `## Summary\n\n`;
    report += `- **Compilation Success**: ${result.success ? '✅' : '❌'}\n`;
    report += `- **Files Checked**: ${result.checkedFiles.length}\n`;
    report += `- **Errors**: ${result.errors.length}\n`;
    report += `- **Warnings**: ${result.warnings.length}\n`;
    report += `- **Import Resolutions**: ${result.importResolution.length}\n`;
    report += `- **Component Type Checks**: ${result.componentTypeChecking.length}\n\n`;

    if (result.errors.length > 0) {
      report += `## ❌ Compilation Errors\n\n`;
      result.errors.forEach(error => {
        report += `### ${path.basename(error.file)}:${error.line}:${error.column}\n`;
        report += `- **Code**: TS${error.code}\n`;
        report += `- **Message**: ${error.message}\n\n`;
      });
    }

    if (result.warnings.length > 0) {
      report += `## ⚠️ Compilation Warnings\n\n`;
      result.warnings.forEach(warning => {
        report += `### ${path.basename(warning.file)}:${warning.line}:${warning.column}\n`;
        report += `- **Code**: TS${warning.code}\n`;
        report += `- **Message**: ${warning.message}\n\n`;
      });
    }

    if (result.importResolution.length > 0) {
      const resolvedImports = result.importResolution.filter(r => r.resolved);
      const failedImports = result.importResolution.filter(r => !r.resolved);

      report += `## Import Resolution Results\n\n`;
      report += `- **Resolved**: ${resolvedImports.length}\n`;
      report += `- **Failed**: ${failedImports.length}\n\n`;

      if (failedImports.length > 0) {
        report += `### ❌ Failed Import Resolutions\n\n`;
        failedImports.forEach(failed => {
          report += `- **Import**: \`${failed.importStatement}\`\n`;
          report += `- **File**: ${failed.importingFile}\n`;
          report += `- **Error**: ${failed.error}\n\n`;
        });
      }
    }

    if (result.componentTypeChecking.length > 0) {
      const validComponents = result.componentTypeChecking.filter(c => c.typesValid);
      const invalidComponents = result.componentTypeChecking.filter(c => !c.typesValid);

      report += `## Component Type Checking\n\n`;
      report += `- **Valid Types**: ${validComponents.length}\n`;
      report += `- **Invalid Types**: ${invalidComponents.length}\n\n`;

      if (invalidComponents.length > 0) {
        report += `### ❌ Components with Type Issues\n\n`;
        invalidComponents.forEach(component => {
          report += `#### ${component.componentName}\n`;
          report += `- **Props Interface Valid**: ${component.propsInterfaceValid ? '✅' : '❌'}\n`;
          report += `- **Return Type Valid**: ${component.returnTypeValid ? '✅' : '❌'}\n`;

          if (component.typeErrors.length > 0) {
            report += `- **Type Errors**:\n`;
            component.typeErrors.forEach(error => {
              report += `  - ${error}\n`;
            });
          }
          report += '\n';
        });
      }
    }

    return report;
  }
}

/**
 * Utility function to create a TypeScript validator
 */
export function createTypeScriptValidator(): TypeScriptValidator {
  return new TypeScriptValidator();
}

/**
 * Quick validation function for consolidation result
 */
export async function validateTypeScriptCompilation(
  consolidationResult: ConsolidationResult,
  options?: TypeScriptValidationOptions
): Promise<TypeScriptValidationResult> {
  const validator = createTypeScriptValidator();
  return validator.validateTypeScriptCompilation(consolidationResult, options);
}

/**
 * Quick validation function for generated components
 */
export async function validateGeneratedComponents(
  components: GeneratedComponent[],
  options?: TypeScriptValidationOptions
): Promise<TypeScriptValidationResult> {
  const validator = createTypeScriptValidator();
  return validator.validateGeneratedComponents(components, options);
}