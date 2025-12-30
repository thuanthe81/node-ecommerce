/**
 * Code Pattern Validation System
 * Requirements: 4.1, 4.3
 *
 * Ensures generated code follows existing TypeScript patterns
 * Validates component structure and prop handling
 * Checks for consistency with existing Svgs.tsx patterns
 */

import { SvgComponentInfo } from './types';
import { GeneratedComponent } from './component-generator';

export interface ValidationResult {
  /** Whether the validation passed */
  isValid: boolean;
  /** List of validation errors */
  errors: string[];
  /** List of validation warnings */
  warnings: string[];
  /** Validation score (0-100) */
  score: number;
}

export interface PatternValidationOptions {
  /** Whether to enforce strict naming conventions */
  strictNaming?: boolean;
  /** Whether to validate TypeScript types */
  validateTypes?: boolean;
  /** Whether to check prop spreading patterns */
  checkPropSpreading?: boolean;
  /** Whether to validate SVG attributes */
  validateSvgAttributes?: boolean;
  /** Whether to check accessibility patterns */
  checkAccessibility?: boolean;
}

export class CodePatternValidator {
  private readonly defaultOptions: PatternValidationOptions = {
    strictNaming: true,
    validateTypes: true,
    checkPropSpreading: true,
    validateSvgAttributes: true,
    checkAccessibility: true
  };

  /**
   * Validate a generated SVG component against existing patterns
   */
  validateComponent(
    component: GeneratedComponent,
    options: PatternValidationOptions = {}
  ): ValidationResult {
    const opts = { ...this.defaultOptions, ...options };
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Validate component naming
    if (opts.strictNaming) {
      const namingResult = this.validateNaming(component);
      errors.push(...namingResult.errors);
      warnings.push(...namingResult.warnings);
      score -= namingResult.penalty;
    }

    // Validate TypeScript patterns
    if (opts.validateTypes) {
      const typeResult = this.validateTypeScript(component);
      errors.push(...typeResult.errors);
      warnings.push(...typeResult.warnings);
      score -= typeResult.penalty;
    }

    // Validate prop spreading
    if (opts.checkPropSpreading) {
      const propResult = this.validatePropSpreading(component);
      errors.push(...propResult.errors);
      warnings.push(...propResult.warnings);
      score -= propResult.penalty;
    }

    // Validate SVG attributes
    if (opts.validateSvgAttributes) {
      const svgResult = this.validateSvgAttributes(component);
      errors.push(...svgResult.errors);
      warnings.push(...svgResult.warnings);
      score -= svgResult.penalty;
    }

    // Validate accessibility
    if (opts.checkAccessibility) {
      const a11yResult = this.validateAccessibility(component);
      errors.push(...a11yResult.errors);
      warnings.push(...a11yResult.warnings);
      score -= a11yResult.penalty;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score)
    };
  }

  /**
   * Validate multiple components
   */
  validateComponents(
    components: GeneratedComponent[],
    options: PatternValidationOptions = {}
  ): ValidationResult[] {
    return components.map(component => this.validateComponent(component, options));
  }

  /**
   * Validate component naming conventions
   */
  private validateNaming(component: GeneratedComponent): { errors: string[]; warnings: string[]; penalty: number } {
    const errors: string[] = [];
    const warnings: string[] = [];
    let penalty = 0;

    const { name } = component;

    // Must start with "Svg"
    if (!name.startsWith('Svg')) {
      errors.push(`Component name "${name}" must start with "Svg"`);
      penalty += 20;
    }

    // Must be PascalCase
    if (!/^Svg[A-Z][a-zA-Z0-9]*$/.test(name)) {
      errors.push(`Component name "${name}" must be in PascalCase format (e.g., SvgComponentName)`);
      penalty += 15;
    }

    // Should not contain numbers unless meaningful
    if (/\d/.test(name) && !/\d+$/.test(name)) {
      warnings.push(`Component name "${name}" contains numbers in the middle, consider if this is meaningful`);
      penalty += 5;
    }

    // Should not be too generic
    const genericNames = ['SvgIcon', 'SvgImage', 'SvgElement', 'SvgComponent'];
    if (genericNames.includes(name)) {
      warnings.push(`Component name "${name}" is too generic, consider a more descriptive name`);
      penalty += 10;
    }

    // Should not be too long
    if (name.length > 25) {
      warnings.push(`Component name "${name}" is quite long (${name.length} chars), consider shortening`);
      penalty += 5;
    }

    return { errors, warnings, penalty };
  }

  /**
   * Validate TypeScript patterns
   */
  private validateTypeScript(component: GeneratedComponent): { errors: string[]; warnings: string[]; penalty: number } {
    const errors: string[] = [];
    const warnings: string[] = [];
    let penalty = 0;

    const { code } = component;

    // Must use export const pattern
    if (!code.includes('export const')) {
      errors.push('Component must use "export const" pattern');
      penalty += 20;
    }

    // Must have proper props typing
    if (!code.includes('props: SvgProps') && !code.includes('props: ImageProps')) {
      errors.push('Component must accept props with proper typing (SvgProps or ImageProps)');
      penalty += 20;
    }

    // Should use arrow function
    if (!code.includes(') => (')) {
      warnings.push('Component should use arrow function syntax for consistency');
      penalty += 5;
    }

    // Should not have any TypeScript errors (basic check)
    const tsErrorPatterns = [
      /Type .* is not assignable to type/,
      /Property .* does not exist on type/,
      /Cannot find name/,
      /Expected \d+ arguments, but got \d+/
    ];

    tsErrorPatterns.forEach(pattern => {
      if (pattern.test(code)) {
        errors.push('Code contains potential TypeScript errors');
        penalty += 25;
      }
    });

    return { errors, warnings, penalty };
  }

  /**
   * Validate prop spreading patterns
   */
  private validatePropSpreading(component: GeneratedComponent): { errors: string[]; warnings: string[]; penalty: number } {
    const errors: string[] = [];
    const warnings: string[] = [];
    let penalty = 0;

    const { code } = component;

    // Must spread props to SVG element
    if (!code.includes('{...props}')) {
      errors.push('Component must spread props to SVG element using {...props}');
      penalty += 20;
    }

    // Props should be spread at the end of SVG attributes
    const svgMatch = code.match(/<svg[^>]*>/);
    if (svgMatch) {
      const svgTag = svgMatch[0];
      if (svgTag.includes('{...props}') && !svgTag.endsWith('{...props}>')) {
        warnings.push('Props spreading should be at the end of SVG attributes for consistency');
        penalty += 5;
      }
    }

    // Should not have conflicting attributes after props spreading
    const conflictingPatterns = [
      /\{\.\.\.props\}[^>]*className=/,
      /\{\.\.\.props\}[^>]*style=/,
      /\{\.\.\.props\}[^>]*fill=/,
      /\{\.\.\.props\}[^>]*stroke=/
    ];

    conflictingPatterns.forEach(pattern => {
      if (pattern.test(code)) {
        warnings.push('Attributes after props spreading may be overridden');
        penalty += 10;
      }
    });

    return { errors, warnings, penalty };
  }

  /**
   * Validate SVG attributes and structure
   */
  private validateSvgAttributes(component: GeneratedComponent): { errors: string[]; warnings: string[]; penalty: number } {
    const errors: string[] = [];
    const warnings: string[] = [];
    let penalty = 0;

    const { code } = component;

    // Must contain SVG element
    if (!code.includes('<svg')) {
      errors.push('Component must contain an SVG element');
      penalty += 30;
      return { errors, warnings, penalty };
    }

    // Should have viewBox attribute
    if (!code.includes('viewBox=')) {
      warnings.push('SVG should have a viewBox attribute for proper scaling');
      penalty += 10;
    }

    // Should use currentColor for consistency
    if (code.includes('fill="') && !code.includes('fill="currentColor"') && !code.includes('fill="none"')) {
      warnings.push('Consider using fill="currentColor" or fill="none" for theme consistency');
      penalty += 5;
    }

    if (code.includes('stroke="') && !code.includes('stroke="currentColor"')) {
      warnings.push('Consider using stroke="currentColor" for theme consistency');
      penalty += 5;
    }

    // Should not have hardcoded dimensions
    if (code.includes('width="') || code.includes('height="')) {
      warnings.push('Avoid hardcoded width/height attributes, use CSS classes instead');
      penalty += 10;
    }

    // Should have proper path structure
    const pathCount = (code.match(/<path/g) || []).length;
    const circleCount = (code.match(/<circle/g) || []).length;
    const rectCount = (code.match(/<rect/g) || []).length;

    if (pathCount === 0 && circleCount === 0 && rectCount === 0) {
      warnings.push('SVG appears to be empty or missing drawing elements');
      penalty += 15;
    }

    return { errors, warnings, penalty };
  }

  /**
   * Validate accessibility patterns
   */
  private validateAccessibility(component: GeneratedComponent): { errors: string[]; warnings: string[]; penalty: number } {
    const errors: string[] = [];
    const warnings: string[] = [];
    let penalty = 0;

    const { code, sourceAudit } = component;

    // Check if original had accessibility attributes
    const originalA11yAttrs = sourceAudit.accessibilityAttributes;

    if (originalA11yAttrs.length > 0) {
      // Should preserve accessibility attributes
      originalA11yAttrs.forEach(attr => {
        if (!code.includes(attr)) {
          warnings.push(`Original accessibility attribute "${attr}" was not preserved`);
          penalty += 10;
        }
      });
    }

    // Should consider aria-hidden for decorative icons
    if (!code.includes('aria-hidden') && !code.includes('aria-label') && !code.includes('role=')) {
      warnings.push('Consider adding aria-hidden="true" for decorative icons or aria-label for meaningful icons');
      penalty += 5;
    }

    return { errors, warnings, penalty };
  }

  /**
   * Validate consistency with existing Svgs.tsx patterns
   */
  validateConsistencyWithExisting(
    component: GeneratedComponent,
    existingComponents: SvgComponentInfo[]
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Check for naming conflicts
    const existingNames = existingComponents.map(comp => comp.name);
    if (existingNames.includes(component.name)) {
      errors.push(`Component name "${component.name}" conflicts with existing component`);
      score -= 30;
    }

    // Check for similar patterns in the same category
    const sameCategory = existingComponents.filter(comp => comp.category === component.category);
    if (sameCategory.length > 0) {
      // Analyze patterns in same category
      const hasStrokePattern = sameCategory.some(comp => comp.hasStroke);
      const hasFillPattern = sameCategory.some(comp => comp.hasFill);

      if (hasStrokePattern && !component.code.includes('stroke=')) {
        warnings.push(`Other ${component.category} components use stroke, consider consistency`);
        score -= 5;
      }

      if (hasFillPattern && !component.code.includes('fill=')) {
        warnings.push(`Other ${component.category} components use fill, consider consistency`);
        score -= 5;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score)
    };
  }

  /**
   * Generate validation report
   */
  generateValidationReport(results: ValidationResult[]): string {
    const totalComponents = results.length;
    const validComponents = results.filter(r => r.isValid).length;
    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / totalComponents;

    const allErrors = results.flatMap(r => r.errors);
    const allWarnings = results.flatMap(r => r.warnings);

    let report = `# SVG Component Validation Report\n\n`;
    report += `## Summary\n`;
    report += `- Total Components: ${totalComponents}\n`;
    report += `- Valid Components: ${validComponents}\n`;
    report += `- Success Rate: ${((validComponents / totalComponents) * 100).toFixed(1)}%\n`;
    report += `- Average Score: ${averageScore.toFixed(1)}/100\n\n`;

    if (allErrors.length > 0) {
      report += `## Errors (${allErrors.length})\n`;
      allErrors.forEach((error, index) => {
        report += `${index + 1}. ${error}\n`;
      });
      report += `\n`;
    }

    if (allWarnings.length > 0) {
      report += `## Warnings (${allWarnings.length})\n`;
      allWarnings.forEach((warning, index) => {
        report += `${index + 1}. ${warning}\n`;
      });
      report += `\n`;
    }

    report += `## Recommendations\n`;
    if (averageScore < 80) {
      report += `- Review and fix validation errors to improve code quality\n`;
    }
    if (allWarnings.length > 0) {
      report += `- Address warnings to ensure consistency with existing patterns\n`;
    }
    report += `- Ensure all components follow the established TypeScript and SVG patterns\n`;

    return report;
  }
}

/**
 * Utility function to create a pattern validator instance
 */
export function createPatternValidator(): CodePatternValidator {
  return new CodePatternValidator();
}

/**
 * Quick validation function for single component
 */
export function validateComponentPattern(component: GeneratedComponent): ValidationResult {
  const validator = createPatternValidator();
  return validator.validateComponent(component);
}