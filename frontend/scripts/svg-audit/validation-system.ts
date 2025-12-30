/**
 * Comprehensive Validation and Verification System
 * Requirements: 5.1, 5.2, 5.4
 *
 * Integrates component rendering validation, interaction testing, and TypeScript compilation validation
 * Provides a unified interface for complete SVG consolidation verification
 */

import { GeneratedComponent } from './component-generator';
import { ConsolidationResult } from './svg-consolidation-system';
import {
  ComponentRenderingValidator,
  RenderingValidationResult,
  ComponentValidationOptions,
  createComponentRenderingValidator
} from './component-renderer-validator';
import {
  InteractionTester,
  InteractionTestResult,
  InteractionTestOptions,
  createInteractionTester
} from './interaction-tester';
import {
  TypeScriptValidator,
  TypeScriptValidationResult,
  TypeScriptValidationOptions,
  createTypeScriptValidator
} from './typescript-validator';

export interface ComprehensiveValidationResult {
  /** Overall validation success */
  success: boolean;
  /** Component rendering validation results */
  renderingValidation: RenderingValidationResult[];
  /** Interaction testing results */
  interactionTesting: InteractionTestResult[];
  /** TypeScript compilation validation results */
  typeScriptValidation: TypeScriptValidationResult;
  /** Summary statistics */
  summary: ValidationSummary;
  /** Combined warnings from all validation types */
  warnings: string[];
  /** Combined errors from all validation types */
  errors: string[];
}

export interface ValidationSummary {
  /** Total components validated */
  totalComponents: number;
  /** Components that passed all validations */
  fullyValidComponents: number;
  /** Components that passed rendering validation */
  renderingValidComponents: number;
  /** Components that passed interaction testing */
  interactionValidComponents: number;
  /** Whether TypeScript compilation succeeded */
  typeScriptValid: boolean;
  /** Overall success rate */
  successRate: number;
  /** Validation time in milliseconds */
  validationTime: number;
}

export interface ComprehensiveValidationOptions {
  /** Component rendering validation options */
  renderingOptions?: ComponentValidationOptions;
  /** Interaction testing options */
  interactionOptions?: InteractionTestOptions;
  /** TypeScript validation options */
  typeScriptOptions?: TypeScriptValidationOptions;
  /** Whether to run all validations in parallel */
  runInParallel?: boolean;
  /** Whether to stop on first failure */
  stopOnFailure?: boolean;
  /** Whether to generate detailed reports */
  generateReports?: boolean;
}

export class ComprehensiveValidationSystem {
  private readonly renderingValidator: ComponentRenderingValidator;
  private readonly interactionTester: InteractionTester;
  private readonly typeScriptValidator: TypeScriptValidator;

  constructor() {
    this.renderingValidator = createComponentRenderingValidator();
    this.interactionTester = createInteractionTester();
    this.typeScriptValidator = createTypeScriptValidator();
  }

  /**
   * Run comprehensive validation on consolidation result
   */
  async validateConsolidationResult(
    consolidationResult: ConsolidationResult,
    options: ComprehensiveValidationOptions = {}
  ): Promise<ComprehensiveValidationResult> {
    const startTime = Date.now();
    const components = consolidationResult.generatedComponents;

    try {
      let renderingValidation: RenderingValidationResult[] = [];
      let interactionTesting: InteractionTestResult[] = [];
      let typeScriptValidation: TypeScriptValidationResult;

      if (options.runInParallel) {
        // Run all validations in parallel
        const [renderingResults, interactionResults, typeScriptResults] = await Promise.all([
          this.renderingValidator.validateMultipleComponents(components, options.renderingOptions),
          this.interactionTester.testMultipleComponentInteractions(components, options.interactionOptions),
          this.typeScriptValidator.validateTypeScriptCompilation(consolidationResult, options.typeScriptOptions)
        ]);

        renderingValidation = renderingResults;
        interactionTesting = interactionResults;
        typeScriptValidation = typeScriptResults;

      } else {
        // Run validations sequentially
        console.log('Running component rendering validation...');
        renderingValidation = await this.renderingValidator.validateMultipleComponents(
          components,
          options.renderingOptions
        );

        if (options.stopOnFailure && renderingValidation.some(r => !r.success)) {
          const validationTime = Date.now() - startTime;
          return this.createFailedResult(renderingValidation, [], {
            success: false,
            errors: [{ file: 'validation', line: 0, column: 0, message: 'Stopped due to rendering validation failures', code: 0, category: 'error' as const }],
            warnings: [],
            checkedFiles: [],
            importResolution: [],
            componentTypeChecking: []
          }, validationTime);
        }

        console.log('Running interaction testing...');
        interactionTesting = await this.interactionTester.testMultipleComponentInteractions(
          components,
          options.interactionOptions
        );

        if (options.stopOnFailure && interactionTesting.some(r => !r.success)) {
          const validationTime = Date.now() - startTime;
          return this.createFailedResult(renderingValidation, interactionTesting, {
            success: false,
            errors: [{ file: 'validation', line: 0, column: 0, message: 'Stopped due to interaction testing failures', code: 0, category: 'error' as const }],
            warnings: [],
            checkedFiles: [],
            importResolution: [],
            componentTypeChecking: []
          }, validationTime);
        }

        console.log('Running TypeScript compilation validation...');
        typeScriptValidation = await this.typeScriptValidator.validateTypeScriptCompilation(
          consolidationResult,
          options.typeScriptOptions
        );
      }

      const validationTime = Date.now() - startTime;

      // Compile results
      const result = this.compileValidationResults(
        renderingValidation,
        interactionTesting,
        typeScriptValidation,
        validationTime
      );

      // Generate reports if requested
      if (options.generateReports) {
        await this.generateValidationReports(result);
      }

      return result;

    } catch (error) {
      const validationTime = Date.now() - startTime;
      return {
        success: false,
        renderingValidation: [],
        interactionTesting: [],
        typeScriptValidation: {
          success: false,
          errors: [{
            file: 'validation-system',
            line: 0,
            column: 0,
            message: `Validation system error: ${error instanceof Error ? error.message : String(error)}`,
            code: 0,
            category: 'error'
          }],
          warnings: [],
          checkedFiles: [],
          importResolution: [],
          componentTypeChecking: []
        },
        summary: {
          totalComponents: components.length,
          fullyValidComponents: 0,
          renderingValidComponents: 0,
          interactionValidComponents: 0,
          typeScriptValid: false,
          successRate: 0,
          validationTime
        },
        warnings: [],
        errors: [`Validation system error: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  /**
   * Run validation on generated components only (without full consolidation)
   */
  async validateGeneratedComponents(
    components: GeneratedComponent[],
    options: ComprehensiveValidationOptions = {}
  ): Promise<ComprehensiveValidationResult> {
    const startTime = Date.now();

    try {
      let renderingValidation: RenderingValidationResult[] = [];
      let interactionTesting: InteractionTestResult[] = [];
      let typeScriptValidation: TypeScriptValidationResult;

      if (options.runInParallel) {
        // Run all validations in parallel
        const [renderingResults, interactionResults, typeScriptResults] = await Promise.all([
          this.renderingValidator.validateMultipleComponents(components, options.renderingOptions),
          this.interactionTester.testMultipleComponentInteractions(components, options.interactionOptions),
          this.typeScriptValidator.validateGeneratedComponents(components, options.typeScriptOptions)
        ]);

        renderingValidation = renderingResults;
        interactionTesting = interactionResults;
        typeScriptValidation = typeScriptResults;

      } else {
        // Run validations sequentially
        renderingValidation = await this.renderingValidator.validateMultipleComponents(
          components,
          options.renderingOptions
        );

        if (options.stopOnFailure && renderingValidation.some(r => !r.success)) {
          const validationTime = Date.now() - startTime;
          return this.createFailedResult(renderingValidation, [], {
            success: false,
            errors: [{ file: 'validation', line: 0, column: 0, message: 'Stopped due to rendering validation failures', code: 0, category: 'error' as const }],
            warnings: [],
            checkedFiles: [],
            importResolution: [],
            componentTypeChecking: []
          }, validationTime);
        }

        interactionTesting = await this.interactionTester.testMultipleComponentInteractions(
          components,
          options.interactionOptions
        );

        if (options.stopOnFailure && interactionTesting.some(r => !r.success)) {
          const validationTime = Date.now() - startTime;
          return this.createFailedResult(renderingValidation, interactionTesting, {
            success: false,
            errors: [{ file: 'validation', line: 0, column: 0, message: 'Stopped due to interaction testing failures', code: 0, category: 'error' as const }],
            warnings: [],
            checkedFiles: [],
            importResolution: [],
            componentTypeChecking: []
          }, validationTime);
        }

        typeScriptValidation = await this.typeScriptValidator.validateGeneratedComponents(
          components,
          options.typeScriptOptions
        );
      }

      const validationTime = Date.now() - startTime;

      return this.compileValidationResults(
        renderingValidation,
        interactionTesting,
        typeScriptValidation,
        validationTime
      );

    } catch (error) {
      const validationTime = Date.now() - startTime;
      return {
        success: false,
        renderingValidation: [],
        interactionTesting: [],
        typeScriptValidation: {
          success: false,
          errors: [{
            file: 'validation-system',
            line: 0,
            column: 0,
            message: `Validation system error: ${error instanceof Error ? error.message : String(error)}`,
            code: 0,
            category: 'error'
          }],
          warnings: [],
          checkedFiles: [],
          importResolution: [],
          componentTypeChecking: []
        },
        summary: {
          totalComponents: components.length,
          fullyValidComponents: 0,
          renderingValidComponents: 0,
          interactionValidComponents: 0,
          typeScriptValid: false,
          successRate: 0,
          validationTime
        },
        warnings: [],
        errors: [`Validation system error: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  /**
   * Create a failed result for early termination
   */
  private createFailedResult(
    renderingValidation: RenderingValidationResult[],
    interactionTesting: InteractionTestResult[],
    typeScriptValidation: TypeScriptValidationResult,
    validationTime: number
  ): ComprehensiveValidationResult {
    const totalComponents = Math.max(renderingValidation.length, interactionTesting.length);

    return {
      success: false,
      renderingValidation,
      interactionTesting,
      typeScriptValidation,
      summary: {
        totalComponents,
        fullyValidComponents: 0,
        renderingValidComponents: renderingValidation.filter(r => r.success).length,
        interactionValidComponents: interactionTesting.filter(r => r.success).length,
        typeScriptValid: typeScriptValidation.success,
        successRate: 0,
        validationTime
      },
      warnings: [
        ...renderingValidation.flatMap(r => r.warnings),
        ...interactionTesting.flatMap(r => r.warnings),
        ...typeScriptValidation.warnings.map(w => w.message)
      ],
      errors: [
        ...renderingValidation.flatMap(r => r.errors),
        ...interactionTesting.flatMap(r => r.errors),
        ...typeScriptValidation.errors.map(e => e.message)
      ]
    };
  }

  /**
   * Compile validation results into comprehensive result
   */
  private compileValidationResults(
    renderingValidation: RenderingValidationResult[],
    interactionTesting: InteractionTestResult[],
    typeScriptValidation: TypeScriptValidationResult,
    validationTime: number
  ): ComprehensiveValidationResult {
    const totalComponents = Math.max(renderingValidation.length, interactionTesting.length);
    const renderingValidComponents = renderingValidation.filter(r => r.success).length;
    const interactionValidComponents = interactionTesting.filter(r => r.success).length;

    // Find components that passed all validations
    const fullyValidComponents = renderingValidation.filter(renderingResult => {
      const interactionResult = interactionTesting.find(
        ir => ir.componentName === renderingResult.componentName
      );
      return renderingResult.success && (interactionResult?.success ?? true);
    }).length;

    const overallSuccess = renderingValidation.every(r => r.success) &&
                          interactionTesting.every(r => r.success) &&
                          typeScriptValidation.success;

    const successRate = totalComponents > 0 ? (fullyValidComponents / totalComponents) * 100 : 0;

    return {
      success: overallSuccess,
      renderingValidation,
      interactionTesting,
      typeScriptValidation,
      summary: {
        totalComponents,
        fullyValidComponents,
        renderingValidComponents,
        interactionValidComponents,
        typeScriptValid: typeScriptValidation.success,
        successRate,
        validationTime
      },
      warnings: [
        ...renderingValidation.flatMap(r => r.warnings),
        ...interactionTesting.flatMap(r => r.warnings),
        ...typeScriptValidation.warnings.map(w => w.message)
      ],
      errors: [
        ...renderingValidation.flatMap(r => r.errors),
        ...interactionTesting.flatMap(r => r.errors),
        ...typeScriptValidation.errors.map(e => e.message)
      ]
    };
  }

  /**
   * Generate comprehensive validation report
   */
  generateComprehensiveReport(result: ComprehensiveValidationResult): string {
    let report = '# Comprehensive SVG Consolidation Validation Report\n\n';

    // Executive Summary
    report += `## Executive Summary\n\n`;
    report += `- **Overall Success**: ${result.success ? '✅' : '❌'}\n`;
    report += `- **Total Components**: ${result.summary.totalComponents}\n`;
    report += `- **Fully Valid Components**: ${result.summary.fullyValidComponents}\n`;
    report += `- **Success Rate**: ${result.summary.successRate.toFixed(1)}%\n`;
    report += `- **Validation Time**: ${result.summary.validationTime}ms\n\n`;

    // Validation Type Breakdown
    report += `## Validation Type Results\n\n`;
    report += `### Component Rendering\n`;
    report += `- **Valid**: ${result.summary.renderingValidComponents}/${result.summary.totalComponents}\n`;
    report += `- **Success Rate**: ${((result.summary.renderingValidComponents / result.summary.totalComponents) * 100).toFixed(1)}%\n\n`;

    report += `### Interaction Testing\n`;
    report += `- **Valid**: ${result.summary.interactionValidComponents}/${result.summary.totalComponents}\n`;
    report += `- **Success Rate**: ${((result.summary.interactionValidComponents / result.summary.totalComponents) * 100).toFixed(1)}%\n\n`;

    report += `### TypeScript Compilation\n`;
    report += `- **Status**: ${result.summary.typeScriptValid ? '✅ Passed' : '❌ Failed'}\n`;
    report += `- **Errors**: ${result.typeScriptValidation.errors.length}\n`;
    report += `- **Warnings**: ${result.typeScriptValidation.warnings.length}\n\n`;

    // Component-by-Component Results
    if (result.renderingValidation.length > 0) {
      report += `## Component Validation Details\n\n`;

      for (const renderingResult of result.renderingValidation) {
        const interactionResult = result.interactionTesting.find(
          ir => ir.componentName === renderingResult.componentName
        );

        const fullyValid = renderingResult.success && (interactionResult?.success ?? true);

        report += `### ${renderingResult.componentName} ${fullyValid ? '✅' : '❌'}\n\n`;

        report += `#### Rendering Validation\n`;
        report += `- **Status**: ${renderingResult.success ? '✅ Passed' : '❌ Failed'}\n`;
        report += `- **Accepts Props**: ${renderingResult.acceptsProps ? '✅' : '❌'}\n`;
        report += `- **Spreads Props**: ${renderingResult.spreadsProps ? '✅' : '❌'}\n`;
        report += `- **Valid SVG Structure**: ${renderingResult.hasValidSvgStructure ? '✅' : '❌'}\n`;

        if (interactionResult) {
          report += `\n#### Interaction Testing\n`;
          report += `- **Status**: ${interactionResult.success ? '✅ Passed' : '❌ Failed'}\n`;
          report += `- **Click Handling**: ${interactionResult.testResults.clickHandling ? '✅' : '❌'}\n`;
          report += `- **Hover Handling**: ${interactionResult.testResults.hoverHandling ? '✅' : '❌'}\n`;
          report += `- **Keyboard Handling**: ${interactionResult.testResults.keyboardHandling ? '✅' : '❌'}\n`;
          report += `- **Touch Handling**: ${interactionResult.testResults.touchHandling ? '✅' : '❌'}\n`;
          report += `- **Accessibility**: ${interactionResult.testResults.accessibilityInteractions ? '✅' : '❌'}\n`;
        }

        // Show errors and warnings
        const allErrors = [
          ...renderingResult.errors,
          ...(interactionResult?.errors || [])
        ];

        const allWarnings = [
          ...renderingResult.warnings,
          ...(interactionResult?.warnings || [])
        ];

        if (allErrors.length > 0) {
          report += `\n#### Errors\n`;
          allErrors.forEach(error => {
            report += `- ❌ ${error}\n`;
          });
        }

        if (allWarnings.length > 0) {
          report += `\n#### Warnings\n`;
          allWarnings.forEach(warning => {
            report += `- ⚠️ ${warning}\n`;
          });
        }

        report += '\n';
      }
    }

    // TypeScript Details
    if (result.typeScriptValidation.errors.length > 0 || result.typeScriptValidation.warnings.length > 0) {
      report += `## TypeScript Compilation Details\n\n`;

      if (result.typeScriptValidation.errors.length > 0) {
        report += `### Errors\n`;
        result.typeScriptValidation.errors.forEach(error => {
          report += `- **${error.file}:${error.line}:${error.column}** - ${error.message} (TS${error.code})\n`;
        });
        report += '\n';
      }

      if (result.typeScriptValidation.warnings.length > 0) {
        report += `### Warnings\n`;
        result.typeScriptValidation.warnings.forEach(warning => {
          report += `- **${warning.file}:${warning.line}:${warning.column}** - ${warning.message} (TS${warning.code})\n`;
        });
        report += '\n';
      }
    }

    return report;
  }

  /**
   * Generate and save validation reports
   */
  private async generateValidationReports(result: ComprehensiveValidationResult): Promise<void> {
    try {
      const fs = require('fs');
      const path = require('path');

      const reportsDir = path.join('frontend', 'scripts', 'svg-audit', 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      // Generate comprehensive report
      const comprehensiveReport = this.generateComprehensiveReport(result);
      fs.writeFileSync(
        path.join(reportsDir, 'comprehensive-validation-report.md'),
        comprehensiveReport,
        'utf-8'
      );

      // Generate individual reports
      const renderingReport = this.renderingValidator.generateValidationReport(result.renderingValidation);
      fs.writeFileSync(
        path.join(reportsDir, 'rendering-validation-report.md'),
        renderingReport,
        'utf-8'
      );

      const interactionReport = this.interactionTester.generateInteractionReport(result.interactionTesting);
      fs.writeFileSync(
        path.join(reportsDir, 'interaction-testing-report.md'),
        interactionReport,
        'utf-8'
      );

      const typeScriptReport = this.typeScriptValidator.generateValidationReport(result.typeScriptValidation);
      fs.writeFileSync(
        path.join(reportsDir, 'typescript-validation-report.md'),
        typeScriptReport,
        'utf-8'
      );

      console.log(`Validation reports generated in ${reportsDir}`);

    } catch (error) {
      console.warn('Failed to generate validation reports:', error);
    }
  }
}

/**
 * Utility function to create a comprehensive validation system
 */
export function createComprehensiveValidationSystem(): ComprehensiveValidationSystem {
  return new ComprehensiveValidationSystem();
}

/**
 * Quick comprehensive validation function
 */
export async function validateConsolidationResult(
  consolidationResult: ConsolidationResult,
  options?: ComprehensiveValidationOptions
): Promise<ComprehensiveValidationResult> {
  const system = createComprehensiveValidationSystem();
  return system.validateConsolidationResult(consolidationResult, options);
}

/**
 * Quick validation function for generated components
 */
export async function validateGeneratedComponents(
  components: GeneratedComponent[],
  options?: ComprehensiveValidationOptions
): Promise<ComprehensiveValidationResult> {
  const system = createComprehensiveValidationSystem();
  return system.validateGeneratedComponents(components, options);
}