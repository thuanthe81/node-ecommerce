/**
 * Component Rendering Validation System
 * Requirements: 5.1
 *
 * Tests that generated SVG components render without errors
 * Validates React component structure and prop handling
 * Checks for runtime errors and warnings
 */

import * as React from 'react';
import { render, RenderResult } from '@testing-library/react';
import { GeneratedComponent } from './component-generator';
import { SvgProps, ImageProps } from '../../components/Svgs';

export interface RenderingValidationResult {
  /** Whether the component rendered successfully */
  success: boolean;
  /** Component name that was tested */
  componentName: string;
  /** Any errors encountered during rendering */
  errors: string[];
  /** Any warnings encountered during rendering */
  warnings: string[];
  /** Rendered HTML output for inspection */
  renderedHTML?: string;
  /** Whether the component accepts props correctly */
  acceptsProps: boolean;
  /** Whether the component spreads props to SVG element */
  spreadsProps: boolean;
  /** Whether the component has valid SVG structure */
  hasValidSvgStructure: boolean;
}

export interface ComponentValidationOptions {
  /** Whether to capture rendered HTML for inspection */
  captureHTML?: boolean;
  /** Whether to test prop spreading */
  testPropSpreading?: boolean;
  /** Whether to test with various prop combinations */
  testPropVariations?: boolean;
  /** Custom props to test with */
  testProps?: Record<string, any>;
}

export class ComponentRenderingValidator {
  private readonly defaultOptions: ComponentValidationOptions = {
    captureHTML: true,
    testPropSpreading: true,
    testPropVariations: true,
    testProps: {}
  };

  /**
   * Validate that a generated component renders correctly
   */
  async validateComponentRendering(
    component: GeneratedComponent,
    options: ComponentValidationOptions = {}
  ): Promise<RenderingValidationResult> {
    const opts = { ...this.defaultOptions, ...options };
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Create the component function from the generated code
      const componentFunction = this.createComponentFunction(component);

      if (!componentFunction) {
        return {
          success: false,
          componentName: component.name,
          errors: ['Failed to create component function from generated code'],
          warnings,
          acceptsProps: false,
          spreadsProps: false,
          hasValidSvgStructure: false
        };
      }

      // Test basic rendering
      const basicRenderResult = await this.testBasicRendering(componentFunction, component.name);
      errors.push(...basicRenderResult.errors);
      warnings.push(...basicRenderResult.warnings);

      let renderedHTML: string | undefined;
      if (opts.captureHTML && basicRenderResult.renderResult) {
        renderedHTML = basicRenderResult.renderResult.container.innerHTML;
      }

      // Test prop acceptance
      const propTestResult = await this.testPropAcceptance(componentFunction, component.name, opts);
      errors.push(...propTestResult.errors);
      warnings.push(...propTestResult.warnings);

      // Test prop spreading
      const spreadTestResult = await this.testPropSpreading(componentFunction, component.name, opts);
      errors.push(...spreadTestResult.errors);
      warnings.push(...spreadTestResult.warnings);

      // Validate SVG structure
      const structureResult = this.validateSvgStructure(component.code);
      errors.push(...structureResult.errors);
      warnings.push(...structureResult.warnings);

      // Clean up render results
      if (basicRenderResult.renderResult) {
        basicRenderResult.renderResult.unmount();
      }
      if (propTestResult.renderResult) {
        propTestResult.renderResult.unmount();
      }
      if (spreadTestResult.renderResult) {
        spreadTestResult.renderResult.unmount();
      }

      return {
        success: errors.length === 0,
        componentName: component.name,
        errors,
        warnings,
        renderedHTML,
        acceptsProps: propTestResult.success,
        spreadsProps: spreadTestResult.success,
        hasValidSvgStructure: structureResult.success
      };

    } catch (error) {
      return {
        success: false,
        componentName: component.name,
        errors: [`Unexpected error during validation: ${error instanceof Error ? error.message : String(error)}`],
        warnings,
        acceptsProps: false,
        spreadsProps: false,
        hasValidSvgStructure: false
      };
    }
  }

  /**
   * Validate multiple components
   */
  async validateMultipleComponents(
    components: GeneratedComponent[],
    options: ComponentValidationOptions = {}
  ): Promise<RenderingValidationResult[]> {
    const results: RenderingValidationResult[] = [];

    for (const component of components) {
      try {
        const result = await this.validateComponentRendering(component, options);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          componentName: component.name,
          errors: [`Failed to validate component: ${error instanceof Error ? error.message : String(error)}`],
          warnings: [],
          acceptsProps: false,
          spreadsProps: false,
          hasValidSvgStructure: false
        });
      }
    }

    return results;
  }

  /**
   * Create a React component function from generated code
   */
  private createComponentFunction(component: GeneratedComponent): React.ComponentType<SvgProps | ImageProps> | null {
    try {
      // Extract the component code and create a function
      const codeWithImports = `
        import React from 'react';

        export type SvgProps = React.SVGProps<SVGSVGElement>;
        export type ImageProps = {
          width?: number;
          height?: number;
          className?: string;
        };

        ${component.code}

        return ${component.name};
      `;

      // Use Function constructor to create the component
      // Note: This is for testing purposes only
      const componentFactory = new Function('React', codeWithImports);
      return componentFactory(React);

    } catch (error) {
      console.error(`Failed to create component function for ${component.name}:`, error);
      return null;
    }
  }

  /**
   * Test basic component rendering
   */
  private async testBasicRendering(
    ComponentFunction: React.ComponentType<any>,
    componentName: string
  ): Promise<{
    success: boolean;
    errors: string[];
    warnings: string[];
    renderResult?: RenderResult;
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Capture console errors during rendering
      const originalError = console.error;
      const consoleErrors: string[] = [];
      console.error = (...args) => {
        consoleErrors.push(args.join(' '));
      };

      const renderResult = render(React.createElement(ComponentFunction));

      // Restore console.error
      console.error = originalError;

      // Check for console errors
      if (consoleErrors.length > 0) {
        errors.push(...consoleErrors.map(err => `Console error: ${err}`));
      }

      // Check if component rendered something
      if (!renderResult.container.innerHTML.trim()) {
        warnings.push('Component rendered empty content');
      }

      return {
        success: errors.length === 0,
        errors,
        warnings,
        renderResult
      };

    } catch (error) {
      return {
        success: false,
        errors: [`Rendering failed: ${error instanceof Error ? error.message : String(error)}`],
        warnings
      };
    }
  }

  /**
   * Test that component accepts props correctly
   */
  private async testPropAcceptance(
    ComponentFunction: React.ComponentType<any>,
    componentName: string,
    options: ComponentValidationOptions
  ): Promise<{
    success: boolean;
    errors: string[];
    warnings: string[];
    renderResult?: RenderResult;
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!options.testPropSpreading) {
      return { success: true, errors, warnings };
    }

    try {
      // Test with common SVG props
      const testProps = {
        className: 'test-class',
        width: 24,
        height: 24,
        'aria-hidden': 'true',
        ...options.testProps
      };

      const renderResult = render(React.createElement(ComponentFunction, testProps));

      // Check if props were applied
      const svgElement = renderResult.container.querySelector('svg');
      if (!svgElement) {
        errors.push('No SVG element found in rendered component');
        return { success: false, errors, warnings, renderResult };
      }

      // Check specific props
      if (testProps.className && !svgElement.classList.contains('test-class')) {
        warnings.push('className prop may not be properly applied');
      }

      if (testProps['aria-hidden'] && svgElement.getAttribute('aria-hidden') !== 'true') {
        warnings.push('aria-hidden prop may not be properly applied');
      }

      return {
        success: errors.length === 0,
        errors,
        warnings,
        renderResult
      };

    } catch (error) {
      return {
        success: false,
        errors: [`Prop acceptance test failed: ${error instanceof Error ? error.message : String(error)}`],
        warnings
      };
    }
  }

  /**
   * Test that component spreads props to SVG element
   */
  private async testPropSpreading(
    ComponentFunction: React.ComponentType<any>,
    componentName: string,
    options: ComponentValidationOptions
  ): Promise<{
    success: boolean;
    errors: string[];
    warnings: string[];
    renderResult?: RenderResult;
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!options.testPropSpreading) {
      return { success: true, errors, warnings };
    }

    try {
      // Test with a unique data attribute to verify prop spreading
      const testProps = {
        'data-testid': 'svg-prop-test',
        'data-custom': 'custom-value'
      };

      const renderResult = render(React.createElement(ComponentFunction, testProps));

      const svgElement = renderResult.container.querySelector('svg');
      if (!svgElement) {
        errors.push('No SVG element found for prop spreading test');
        return { success: false, errors, warnings, renderResult };
      }

      // Check if custom props were spread to SVG element
      if (svgElement.getAttribute('data-testid') !== 'svg-prop-test') {
        errors.push('Props are not being spread to SVG element (data-testid not found)');
      }

      if (svgElement.getAttribute('data-custom') !== 'custom-value') {
        warnings.push('Custom data attributes may not be properly spread');
      }

      return {
        success: errors.length === 0,
        errors,
        warnings,
        renderResult
      };

    } catch (error) {
      return {
        success: false,
        errors: [`Prop spreading test failed: ${error instanceof Error ? error.message : String(error)}`],
        warnings
      };
    }
  }

  /**
   * Validate SVG structure in generated code
   */
  private validateSvgStructure(code: string): {
    success: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for required SVG elements
    if (!code.includes('<svg')) {
      errors.push('Component code does not contain SVG element');
    }

    // Check for proper prop spreading
    if (!code.includes('{...props}')) {
      errors.push('Component does not spread props to SVG element');
    }

    // Check for proper export
    if (!code.includes('export const')) {
      errors.push('Component is not properly exported');
    }

    // Check for proper props type
    if (!code.includes('props: SvgProps') && !code.includes('props: ImageProps')) {
      warnings.push('Component may not have proper props typing');
    }

    // Check for viewBox attribute
    if (!code.includes('viewBox=')) {
      warnings.push('SVG may be missing viewBox attribute');
    }

    // Check for accessibility considerations
    if (code.includes('aria-') || code.includes('role=')) {
      // Good - has accessibility attributes
    } else {
      warnings.push('Consider adding accessibility attributes');
    }

    return {
      success: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate a validation report
   */
  generateValidationReport(results: RenderingValidationResult[]): string {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    let report = '# Component Rendering Validation Report\n\n';

    report += `## Summary\n\n`;
    report += `- **Total Components**: ${results.length}\n`;
    report += `- **Successful**: ${successful.length}\n`;
    report += `- **Failed**: ${failed.length}\n`;
    report += `- **Success Rate**: ${((successful.length / results.length) * 100).toFixed(1)}%\n\n`;

    if (successful.length > 0) {
      report += `## ✅ Successfully Validated Components\n\n`;
      successful.forEach(result => {
        report += `### ${result.componentName}\n`;
        report += `- **Accepts Props**: ${result.acceptsProps ? '✅' : '❌'}\n`;
        report += `- **Spreads Props**: ${result.spreadsProps ? '✅' : '❌'}\n`;
        report += `- **Valid SVG Structure**: ${result.hasValidSvgStructure ? '✅' : '❌'}\n`;

        if (result.warnings.length > 0) {
          report += `- **Warnings**: ${result.warnings.length}\n`;
          result.warnings.forEach(warning => {
            report += `  - ⚠️ ${warning}\n`;
          });
        }
        report += '\n';
      });
    }

    if (failed.length > 0) {
      report += `## ❌ Failed Validations\n\n`;
      failed.forEach(result => {
        report += `### ${result.componentName}\n`;
        result.errors.forEach(error => {
          report += `- ❌ ${error}\n`;
        });
        if (result.warnings.length > 0) {
          result.warnings.forEach(warning => {
            report += `- ⚠️ ${warning}\n`;
          });
        }
        report += '\n';
      });
    }

    return report;
  }
}

/**
 * Utility function to create a component rendering validator
 */
export function createComponentRenderingValidator(): ComponentRenderingValidator {
  return new ComponentRenderingValidator();
}

/**
 * Quick validation function for a single component
 */
export async function validateComponentRendering(
  component: GeneratedComponent,
  options?: ComponentValidationOptions
): Promise<RenderingValidationResult> {
  const validator = createComponentRenderingValidator();
  return validator.validateComponentRendering(component, options);
}

/**
 * Quick validation function for multiple components
 */
export async function validateMultipleComponentRendering(
  components: GeneratedComponent[],
  options?: ComponentValidationOptions
): Promise<RenderingValidationResult[]> {
  const validator = createComponentRenderingValidator();
  return validator.validateMultipleComponents(components, options);
}