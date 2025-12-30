/**
 * Code Quality and Formatting Integration System
 * Requirements: 4.1, 4.2, 4.3
 *
 * Integrates code pattern validation and Prettier formatting
 * Provides unified interface for code quality checks
 * Handles formatting and validation for SVG consolidation workflow
 */

import { SvgComponentInfo } from './types';
import { GeneratedComponent } from './component-generator';
import { CodePatternValidator, ValidationResult, PatternValidationOptions } from './code-pattern-validator';
import { PrettierFormatter, FormattingResult, FormattingOptions } from './prettier-formatter';

export interface CodeQualityResult {
  /** Component being processed */
  component: GeneratedComponent;
  /** Pattern validation result */
  validation: ValidationResult;
  /** Formatting result */
  formatting: FormattingResult;
  /** Overall quality score (0-100) */
  overallScore: number;
  /** Whether the component passes all quality checks */
  passesQuality: boolean;
  /** Combined recommendations */
  recommendations: string[];
}

export interface CodeQualityOptions {
  /** Pattern validation options */
  validationOptions?: PatternValidationOptions;
  /** Formatting options */
  formattingOptions?: FormattingOptions;
  /** Minimum quality score required to pass */
  minimumScore?: number;
  /** Whether to auto-fix formatting issues */
  autoFixFormatting?: boolean;
  /** Whether to fail on warnings */
  failOnWarnings?: boolean;
}

export class CodeQualitySystem {
  private validator: CodePatternValidator;
  private formatter: PrettierFormatter;

  constructor() {
    this.validator = new CodePatternValidator();
    this.formatter = new PrettierFormatter();
  }

  /**
   * Perform comprehensive code quality check on a component
   */
  async checkComponentQuality(
    component: GeneratedComponent,
    options: CodeQualityOptions = {}
  ): Promise<CodeQualityResult> {
    const opts = this.getDefaultOptions(options);

    // Step 1: Format the code
    const formatting = await this.formatter.formatCode(
      component.code,
      opts.formattingOptions
    );

    // Step 2: Use formatted code for validation if formatting succeeded
    const codeToValidate = formatting.success && formatting.formattedCode
      ? formatting.formattedCode
      : component.code;

    const componentToValidate = formatting.success && formatting.formattedCode
      ? { ...component, code: formatting.formattedCode }
      : component;

    // Step 3: Validate patterns
    const validation = this.validator.validateComponent(
      componentToValidate,
      opts.validationOptions
    );

    // Step 4: Calculate overall score
    const overallScore = this.calculateOverallScore(validation, formatting);

    // Step 5: Determine if component passes quality checks
    const passesQuality = this.determineQualityPass(
      validation,
      formatting,
      overallScore,
      opts
    );

    // Step 6: Generate recommendations
    const recommendations = this.generateRecommendations(
      validation,
      formatting,
      opts
    );

    return {
      component: componentToValidate,
      validation,
      formatting,
      overallScore,
      passesQuality,
      recommendations
    };
  }

  /**
   * Check quality for multiple components
   */
  async checkMultipleComponents(
    components: GeneratedComponent[],
    options: CodeQualityOptions = {}
  ): Promise<CodeQualityResult[]> {
    const results: CodeQualityResult[] = [];

    for (const component of components) {
      const result = await this.checkComponentQuality(component, options);
      results.push(result);
    }

    return results;
  }

  /**
   * Process components with quality checks and return only passing ones
   */
  async processAndFilterComponents(
    components: GeneratedComponent[],
    options: CodeQualityOptions = {}
  ): Promise<{
    passing: GeneratedComponent[];
    failing: CodeQualityResult[];
    summary: QualitySummary;
  }> {
    const results = await this.checkMultipleComponents(components, options);

    const passing = results
      .filter(r => r.passesQuality)
      .map(r => r.component);

    const failing = results.filter(r => !r.passesQuality);

    const summary = this.generateQualitySummary(results);

    return { passing, failing, summary };
  }

  /**
   * Validate and format code for file writing
   */
  async prepareCodeForWriting(
    code: string,
    filePath: string,
    options: CodeQualityOptions = {}
  ): Promise<{
    success: boolean;
    formattedCode?: string;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Format the code
    const formatting = await this.formatter.formatCode(code, {
      filePath,
      ...options.formattingOptions
    });

    if (!formatting.success) {
      errors.push(`Formatting failed: ${formatting.error}`);
      return { success: false, errors, warnings };
    }

    // Validate formatting compliance
    const formatValidation = await this.formatter.validateFormatting(
      formatting.formattedCode!,
      { filePath, ...options.formattingOptions }
    );

    if (!formatValidation.isValid) {
      errors.push(...formatValidation.errors);
    }
    warnings.push(...formatValidation.suggestions);

    return {
      success: errors.length === 0,
      formattedCode: formatting.formattedCode,
      errors,
      warnings
    };
  }

  /**
   * Validate consistency with existing components
   */
  async validateConsistencyWithExisting(
    components: GeneratedComponent[],
    existingComponents: SvgComponentInfo[]
  ): Promise<ValidationResult[]> {
    return components.map(component =>
      this.validator.validateConsistencyWithExisting(component, existingComponents)
    );
  }

  /**
   * Generate comprehensive quality report
   */
  generateQualityReport(results: CodeQualityResult[]): string {
    const summary = this.generateQualitySummary(results);

    let report = `# SVG Component Code Quality Report\n\n`;

    // Summary section
    report += `## Summary\n`;
    report += `- Total Components: ${summary.totalComponents}\n`;
    report += `- Passing Quality Checks: ${summary.passingComponents}\n`;
    report += `- Failing Quality Checks: ${summary.failingComponents}\n`;
    report += `- Success Rate: ${summary.successRate.toFixed(1)}%\n`;
    report += `- Average Quality Score: ${summary.averageScore.toFixed(1)}/100\n`;
    report += `- Components with Formatting Issues: ${summary.formattingIssues}\n`;
    report += `- Components with Validation Errors: ${summary.validationErrors}\n\n`;

    // Detailed results
    if (summary.failingComponents > 0) {
      report += `## Failed Components\n`;
      const failedComponents = results.filter(r => !r.passesQuality);

      failedComponents.forEach((result, index) => {
        report += `### ${index + 1}. ${result.component.name} (Score: ${result.overallScore}/100)\n`;

        if (result.validation.errors.length > 0) {
          report += `**Validation Errors:**\n`;
          result.validation.errors.forEach(error => {
            report += `- ${error}\n`;
          });
        }

        if (!result.formatting.success) {
          report += `**Formatting Error:** ${result.formatting.error}\n`;
        }

        if (result.recommendations.length > 0) {
          report += `**Recommendations:**\n`;
          result.recommendations.forEach(rec => {
            report += `- ${rec}\n`;
          });
        }

        report += `\n`;
      });
    }

    // Overall recommendations
    report += `## Overall Recommendations\n`;
    if (summary.averageScore < 80) {
      report += `- Review and address validation errors to improve code quality\n`;
    }
    if (summary.formattingIssues > 0) {
      report += `- Fix formatting issues to ensure consistency\n`;
    }
    if (summary.validationErrors > 0) {
      report += `- Address pattern validation errors before proceeding\n`;
    }
    report += `- Ensure all components follow established TypeScript and SVG patterns\n`;
    report += `- Consider running automated fixes where possible\n`;

    return report;
  }

  /**
   * Get default options with sensible defaults
   */
  private getDefaultOptions(options: CodeQualityOptions): Required<CodeQualityOptions> {
    return {
      validationOptions: options.validationOptions || {},
      formattingOptions: options.formattingOptions || {},
      minimumScore: options.minimumScore || 80,
      autoFixFormatting: options.autoFixFormatting || true,
      failOnWarnings: options.failOnWarnings || false
    };
  }

  /**
   * Calculate overall quality score
   */
  private calculateOverallScore(
    validation: ValidationResult,
    formatting: FormattingResult
  ): number {
    let score = validation.score;

    // Penalize formatting failures
    if (!formatting.success) {
      score -= 20;
    } else if (!formatting.wasAlreadyFormatted) {
      score -= 5; // Minor penalty for needing formatting
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Determine if component passes quality checks
   */
  private determineQualityPass(
    validation: ValidationResult,
    formatting: FormattingResult,
    overallScore: number,
    options: Required<CodeQualityOptions>
  ): boolean {
    // Must have successful formatting
    if (!formatting.success) {
      return false;
    }

    // Must not have validation errors
    if (validation.errors.length > 0) {
      return false;
    }

    // Check if warnings should fail the check
    if (options.failOnWarnings && validation.warnings.length > 0) {
      return false;
    }

    // Must meet minimum score
    if (overallScore < options.minimumScore) {
      return false;
    }

    return true;
  }

  /**
   * Generate recommendations based on results
   */
  private generateRecommendations(
    validation: ValidationResult,
    formatting: FormattingResult,
    options: Required<CodeQualityOptions>
  ): string[] {
    const recommendations: string[] = [];

    // Formatting recommendations
    if (!formatting.success) {
      recommendations.push(`Fix formatting error: ${formatting.error}`);
    } else if (!formatting.wasAlreadyFormatted) {
      recommendations.push('Code was reformatted - ensure consistent formatting in future');
    }

    // Validation recommendations
    validation.errors.forEach(error => {
      recommendations.push(`Fix validation error: ${error}`);
    });

    validation.warnings.forEach(warning => {
      recommendations.push(`Consider addressing: ${warning}`);
    });

    // Score-based recommendations
    if (validation.score < 90) {
      recommendations.push('Review component structure and patterns for improvements');
    }

    return recommendations;
  }

  /**
   * Generate quality summary statistics
   */
  private generateQualitySummary(results: CodeQualityResult[]): QualitySummary {
    const totalComponents = results.length;
    const passingComponents = results.filter(r => r.passesQuality).length;
    const failingComponents = totalComponents - passingComponents;
    const successRate = totalComponents > 0 ? (passingComponents / totalComponents) * 100 : 0;
    const averageScore = totalComponents > 0
      ? results.reduce((sum, r) => sum + r.overallScore, 0) / totalComponents
      : 0;
    const formattingIssues = results.filter(r => !r.formatting.success).length;
    const validationErrors = results.filter(r => r.validation.errors.length > 0).length;

    return {
      totalComponents,
      passingComponents,
      failingComponents,
      successRate,
      averageScore,
      formattingIssues,
      validationErrors
    };
  }
}

export interface QualitySummary {
  totalComponents: number;
  passingComponents: number;
  failingComponents: number;
  successRate: number;
  averageScore: number;
  formattingIssues: number;
  validationErrors: number;
}

/**
 * Utility function to create a code quality system instance
 */
export function createCodeQualitySystem(): CodeQualitySystem {
  return new CodeQualitySystem();
}

/**
 * Quick quality check function for single component
 */
export async function checkComponentQuality(
  component: GeneratedComponent,
  options: CodeQualityOptions = {}
): Promise<CodeQualityResult> {
  const system = createCodeQualitySystem();
  return system.checkComponentQuality(component, options);
}