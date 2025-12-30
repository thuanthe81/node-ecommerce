/**
 * Interaction Testing System
 * Requirements: 5.2
 *
 * Verifies that interactive elements (hover, click) work correctly
 * Tests event handler preservation and functionality
 * Validates touch and keyboard interactions
 */

import * as React from 'react';
import { render, fireEvent, RenderResult } from '@testing-library/react';
import { GeneratedComponent } from './component-generator';
import { InlineSvgAudit } from './types';

export interface InteractionTestResult {
  /** Whether all interaction tests passed */
  success: boolean;
  /** Component name that was tested */
  componentName: string;
  /** Any errors encountered during testing */
  errors: string[];
  /** Any warnings encountered during testing */
  warnings: string[];
  /** Results of specific interaction tests */
  testResults: {
    clickHandling: boolean;
    hoverHandling: boolean;
    keyboardHandling: boolean;
    touchHandling: boolean;
    eventPropagation: boolean;
    accessibilityInteractions: boolean;
  };
  /** Event handlers that were preserved from original */
  preservedHandlers: string[];
  /** Event handlers that were lost during consolidation */
  lostHandlers: string[];
}

export interface InteractionTestOptions {
  /** Whether to test click interactions */
  testClick?: boolean;
  /** Whether to test hover interactions */
  testHover?: boolean;
  /** Whether to test keyboard interactions */
  testKeyboard?: boolean;
  /** Whether to test touch interactions */
  testTouch?: boolean;
  /** Whether to test event propagation */
  testEventPropagation?: boolean;
  /** Whether to test accessibility interactions */
  testAccessibility?: boolean;
  /** Custom event handlers to test */
  customHandlers?: Record<string, (event: any) => void>;
}

export class InteractionTester {
  private readonly defaultOptions: InteractionTestOptions = {
    testClick: true,
    testHover: true,
    testKeyboard: true,
    testTouch: true,
    testEventPropagation: true,
    testAccessibility: true,
    customHandlers: {}
  };

  /**
   * Test interactions for a generated component
   */
  async testComponentInteractions(
    component: GeneratedComponent,
    options: InteractionTestOptions = {}
  ): Promise<InteractionTestResult> {
    const opts = { ...this.defaultOptions, ...options };
    const errors: string[] = [];
    const warnings: string[] = [];
    const testResults = {
      clickHandling: false,
      hoverHandling: false,
      keyboardHandling: false,
      touchHandling: false,
      eventPropagation: false,
      accessibilityInteractions: false
    };

    try {
      // Create component function from generated code
      const componentFunction = this.createComponentFunction(component);

      if (!componentFunction) {
        return {
          success: false,
          componentName: component.name,
          errors: ['Failed to create component function for interaction testing'],
          warnings,
          testResults,
          preservedHandlers: [],
          lostHandlers: []
        };
      }

      // Analyze original SVG for event handlers
      const originalHandlers = this.extractEventHandlers(component.sourceAudit);
      const preservedHandlers: string[] = [];
      const lostHandlers: string[] = [];

      // Test click interactions
      if (opts.testClick) {
        const clickResult = await this.testClickInteractions(componentFunction, component.name, opts);
        testResults.clickHandling = clickResult.success;
        errors.push(...clickResult.errors);
        warnings.push(...clickResult.warnings);
      }

      // Test hover interactions
      if (opts.testHover) {
        const hoverResult = await this.testHoverInteractions(componentFunction, component.name, opts);
        testResults.hoverHandling = hoverResult.success;
        errors.push(...hoverResult.errors);
        warnings.push(...hoverResult.warnings);
      }

      // Test keyboard interactions
      if (opts.testKeyboard) {
        const keyboardResult = await this.testKeyboardInteractions(componentFunction, component.name, opts);
        testResults.keyboardHandling = keyboardResult.success;
        errors.push(...keyboardResult.errors);
        warnings.push(...keyboardResult.warnings);
      }

      // Test touch interactions
      if (opts.testTouch) {
        const touchResult = await this.testTouchInteractions(componentFunction, component.name, opts);
        testResults.touchHandling = touchResult.success;
        errors.push(...touchResult.errors);
        warnings.push(...touchResult.warnings);
      }

      // Test event propagation
      if (opts.testEventPropagation) {
        const propagationResult = await this.testEventPropagation(componentFunction, component.name, opts);
        testResults.eventPropagation = propagationResult.success;
        errors.push(...propagationResult.errors);
        warnings.push(...propagationResult.warnings);
      }

      // Test accessibility interactions
      if (opts.testAccessibility) {
        const accessibilityResult = await this.testAccessibilityInteractions(componentFunction, component.name, opts);
        testResults.accessibilityInteractions = accessibilityResult.success;
        errors.push(...accessibilityResult.errors);
        warnings.push(...accessibilityResult.warnings);
      }

      // Check for preserved/lost handlers
      for (const handler of originalHandlers) {
        if (component.code.includes(handler) || opts.customHandlers?.[handler]) {
          preservedHandlers.push(handler);
        } else {
          lostHandlers.push(handler);
          warnings.push(`Event handler '${handler}' from original SVG was not preserved`);
        }
      }

      return {
        success: errors.length === 0,
        componentName: component.name,
        errors,
        warnings,
        testResults,
        preservedHandlers,
        lostHandlers
      };

    } catch (error) {
      return {
        success: false,
        componentName: component.name,
        errors: [`Unexpected error during interaction testing: ${error instanceof Error ? error.message : String(error)}`],
        warnings,
        testResults,
        preservedHandlers: [],
        lostHandlers: []
      };
    }
  }

  /**
   * Test interactions for multiple components
   */
  async testMultipleComponentInteractions(
    components: GeneratedComponent[],
    options: InteractionTestOptions = {}
  ): Promise<InteractionTestResult[]> {
    const results: InteractionTestResult[] = [];

    for (const component of components) {
      try {
        const result = await this.testComponentInteractions(component, options);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          componentName: component.name,
          errors: [`Failed to test interactions: ${error instanceof Error ? error.message : String(error)}`],
          warnings: [],
          testResults: {
            clickHandling: false,
            hoverHandling: false,
            keyboardHandling: false,
            touchHandling: false,
            eventPropagation: false,
            accessibilityInteractions: false
          },
          preservedHandlers: [],
          lostHandlers: []
        });
      }
    }

    return results;
  }

  /**
   * Create a React component function from generated code
   */
  private createComponentFunction(component: GeneratedComponent): React.ComponentType<any> | null {
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
      const componentFactory = new Function('React', codeWithImports);
      return componentFactory(React);

    } catch (error) {
      console.error(`Failed to create component function for ${component.name}:`, error);
      return null;
    }
  }

  /**
   * Extract event handlers from original SVG audit
   */
  private extractEventHandlers(audit: InlineSvgAudit): string[] {
    const handlers: string[] = [];
    const eventHandlerPattern = /\b(on[A-Z][a-zA-Z]*)\s*=/g;

    let match;
    while ((match = eventHandlerPattern.exec(audit.svgContent)) !== null) {
      handlers.push(match[1]);
    }

    // Also check context for event handlers
    while ((match = eventHandlerPattern.exec(audit.context)) !== null) {
      handlers.push(match[1]);
    }

    return Array.from(new Set(handlers)); // Remove duplicates
  }

  /**
   * Test click interactions
   */
  private async testClickInteractions(
    ComponentFunction: React.ComponentType<any>,
    componentName: string,
    options: InteractionTestOptions
  ): Promise<{ success: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      let clickHandled = false;
      const testProps = {
        onClick: (event: React.MouseEvent) => {
          clickHandled = true;
          event.preventDefault();
        },
        'data-testid': 'click-test',
        ...options.customHandlers
      };

      const renderResult = render(React.createElement(ComponentFunction, testProps));
      const svgElement = renderResult.container.querySelector('svg');

      if (!svgElement) {
        errors.push('No SVG element found for click testing');
        renderResult.unmount();
        return { success: false, errors, warnings };
      }

      // Test click event
      fireEvent.click(svgElement);

      if (!clickHandled && testProps.onClick) {
        warnings.push('Click event may not be properly handled');
      }

      // Test double click
      fireEvent.doubleClick(svgElement);

      // Test mouse down/up
      fireEvent.mouseDown(svgElement);
      fireEvent.mouseUp(svgElement);

      renderResult.unmount();
      return { success: errors.length === 0, errors, warnings };

    } catch (error) {
      return {
        success: false,
        errors: [`Click interaction test failed: ${error instanceof Error ? error.message : String(error)}`],
        warnings
      };
    }
  }

  /**
   * Test hover interactions
   */
  private async testHoverInteractions(
    ComponentFunction: React.ComponentType<any>,
    componentName: string,
    options: InteractionTestOptions
  ): Promise<{ success: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      let hoverEntered = false;
      let hoverLeft = false;

      const testProps = {
        onMouseEnter: () => { hoverEntered = true; },
        onMouseLeave: () => { hoverLeft = true; },
        'data-testid': 'hover-test',
        ...options.customHandlers
      };

      const renderResult = render(React.createElement(ComponentFunction, testProps));
      const svgElement = renderResult.container.querySelector('svg');

      if (!svgElement) {
        errors.push('No SVG element found for hover testing');
        renderResult.unmount();
        return { success: false, errors, warnings };
      }

      // Test mouse enter
      fireEvent.mouseEnter(svgElement);

      // Test mouse over
      fireEvent.mouseOver(svgElement);

      // Test mouse move
      fireEvent.mouseMove(svgElement);

      // Test mouse leave
      fireEvent.mouseLeave(svgElement);

      if (!hoverEntered && testProps.onMouseEnter) {
        warnings.push('Mouse enter event may not be properly handled');
      }

      if (!hoverLeft && testProps.onMouseLeave) {
        warnings.push('Mouse leave event may not be properly handled');
      }

      renderResult.unmount();
      return { success: errors.length === 0, errors, warnings };

    } catch (error) {
      return {
        success: false,
        errors: [`Hover interaction test failed: ${error instanceof Error ? error.message : String(error)}`],
        warnings
      };
    }
  }

  /**
   * Test keyboard interactions
   */
  private async testKeyboardInteractions(
    ComponentFunction: React.ComponentType<any>,
    componentName: string,
    options: InteractionTestOptions
  ): Promise<{ success: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      let keyPressed = false;
      const testProps = {
        onKeyDown: (event: React.KeyboardEvent) => {
          keyPressed = true;
        },
        tabIndex: 0, // Make it focusable
        'data-testid': 'keyboard-test',
        ...options.customHandlers
      };

      const renderResult = render(React.createElement(ComponentFunction, testProps));
      const svgElement = renderResult.container.querySelector('svg');

      if (!svgElement) {
        errors.push('No SVG element found for keyboard testing');
        renderResult.unmount();
        return { success: false, errors, warnings };
      }

      // Test focus
      fireEvent.focus(svgElement);

      // Test key events
      fireEvent.keyDown(svgElement, { key: 'Enter', code: 'Enter' });
      fireEvent.keyDown(svgElement, { key: ' ', code: 'Space' });
      fireEvent.keyDown(svgElement, { key: 'Tab', code: 'Tab' });

      // Test blur
      fireEvent.blur(svgElement);

      if (!keyPressed && testProps.onKeyDown) {
        warnings.push('Keyboard events may not be properly handled');
      }

      renderResult.unmount();
      return { success: errors.length === 0, errors, warnings };

    } catch (error) {
      return {
        success: false,
        errors: [`Keyboard interaction test failed: ${error instanceof Error ? error.message : String(error)}`],
        warnings
      };
    }
  }

  /**
   * Test touch interactions
   */
  private async testTouchInteractions(
    ComponentFunction: React.ComponentType<any>,
    componentName: string,
    options: InteractionTestOptions
  ): Promise<{ success: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      let touchHandled = false;
      const testProps = {
        onTouchStart: () => { touchHandled = true; },
        'data-testid': 'touch-test',
        ...options.customHandlers
      };

      const renderResult = render(React.createElement(ComponentFunction, testProps));
      const svgElement = renderResult.container.querySelector('svg');

      if (!svgElement) {
        errors.push('No SVG element found for touch testing');
        renderResult.unmount();
        return { success: false, errors, warnings };
      }

      // Test touch events
      fireEvent.touchStart(svgElement);
      fireEvent.touchMove(svgElement);
      fireEvent.touchEnd(svgElement);

      if (!touchHandled && testProps.onTouchStart) {
        warnings.push('Touch events may not be properly handled');
      }

      renderResult.unmount();
      return { success: errors.length === 0, errors, warnings };

    } catch (error) {
      return {
        success: false,
        errors: [`Touch interaction test failed: ${error instanceof Error ? error.message : String(error)}`],
        warnings
      };
    }
  }

  /**
   * Test event propagation
   */
  private async testEventPropagation(
    ComponentFunction: React.ComponentType<any>,
    componentName: string,
    options: InteractionTestOptions
  ): Promise<{ success: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      let parentClicked = false;
      let childClicked = false;

      const testProps = {
        onClick: (event: React.MouseEvent) => {
          childClicked = true;
          // Test if we can stop propagation
          event.stopPropagation();
        },
        'data-testid': 'propagation-test'
      };

      // Wrap component in a parent with click handler
      const WrappedComponent = () =>
        React.createElement('div',
          { onClick: () => { parentClicked = true; } },
          React.createElement(ComponentFunction, testProps)
        );

      const renderResult = render(React.createElement(WrappedComponent));
      const svgElement = renderResult.container.querySelector('svg');

      if (!svgElement) {
        errors.push('No SVG element found for event propagation testing');
        renderResult.unmount();
        return { success: false, errors, warnings };
      }

      // Test event propagation
      fireEvent.click(svgElement);

      if (!childClicked) {
        warnings.push('Child click event may not be firing');
      }

      if (parentClicked) {
        warnings.push('Event propagation may not be properly controlled');
      }

      renderResult.unmount();
      return { success: errors.length === 0, errors, warnings };

    } catch (error) {
      return {
        success: false,
        errors: [`Event propagation test failed: ${error instanceof Error ? error.message : String(error)}`],
        warnings
      };
    }
  }

  /**
   * Test accessibility interactions
   */
  private async testAccessibilityInteractions(
    ComponentFunction: React.ComponentType<any>,
    componentName: string,
    options: InteractionTestOptions
  ): Promise<{ success: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const testProps = {
        'aria-label': 'Test SVG',
        'aria-hidden': 'false',
        role: 'img',
        tabIndex: 0,
        'data-testid': 'accessibility-test',
        ...options.customHandlers
      };

      const renderResult = render(React.createElement(ComponentFunction, testProps));
      const svgElement = renderResult.container.querySelector('svg');

      if (!svgElement) {
        errors.push('No SVG element found for accessibility testing');
        renderResult.unmount();
        return { success: false, errors, warnings };
      }

      // Check accessibility attributes
      if (!svgElement.getAttribute('aria-label') && !svgElement.getAttribute('aria-labelledby')) {
        warnings.push('SVG may be missing accessibility labels');
      }

      if (!svgElement.getAttribute('role')) {
        warnings.push('SVG may be missing role attribute for accessibility');
      }

      // Test focus management
      svgElement.focus();
      if (document.activeElement !== svgElement) {
        warnings.push('SVG may not be properly focusable');
      }

      renderResult.unmount();
      return { success: errors.length === 0, errors, warnings };

    } catch (error) {
      return {
        success: false,
        errors: [`Accessibility interaction test failed: ${error instanceof Error ? error.message : String(error)}`],
        warnings
      };
    }
  }

  /**
   * Generate an interaction testing report
   */
  generateInteractionReport(results: InteractionTestResult[]): string {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    let report = '# Interaction Testing Report\n\n';

    report += `## Summary\n\n`;
    report += `- **Total Components**: ${results.length}\n`;
    report += `- **Successful**: ${successful.length}\n`;
    report += `- **Failed**: ${failed.length}\n`;
    report += `- **Success Rate**: ${((successful.length / results.length) * 100).toFixed(1)}%\n\n`;

    // Interaction type statistics
    const interactionStats = {
      clickHandling: results.filter(r => r.testResults.clickHandling).length,
      hoverHandling: results.filter(r => r.testResults.hoverHandling).length,
      keyboardHandling: results.filter(r => r.testResults.keyboardHandling).length,
      touchHandling: results.filter(r => r.testResults.touchHandling).length,
      eventPropagation: results.filter(r => r.testResults.eventPropagation).length,
      accessibilityInteractions: results.filter(r => r.testResults.accessibilityInteractions).length
    };

    report += `## Interaction Type Results\n\n`;
    Object.entries(interactionStats).forEach(([type, count]) => {
      const percentage = ((count / results.length) * 100).toFixed(1);
      report += `- **${type}**: ${count}/${results.length} (${percentage}%)\n`;
    });
    report += '\n';

    // Event handler preservation
    const totalPreserved = results.reduce((sum, r) => sum + r.preservedHandlers.length, 0);
    const totalLost = results.reduce((sum, r) => sum + r.lostHandlers.length, 0);

    if (totalPreserved > 0 || totalLost > 0) {
      report += `## Event Handler Preservation\n\n`;
      report += `- **Preserved Handlers**: ${totalPreserved}\n`;
      report += `- **Lost Handlers**: ${totalLost}\n`;
      report += `- **Preservation Rate**: ${((totalPreserved / (totalPreserved + totalLost)) * 100).toFixed(1)}%\n\n`;
    }

    if (successful.length > 0) {
      report += `## ✅ Successfully Tested Components\n\n`;
      successful.forEach(result => {
        report += `### ${result.componentName}\n`;
        report += `- **Click Handling**: ${result.testResults.clickHandling ? '✅' : '❌'}\n`;
        report += `- **Hover Handling**: ${result.testResults.hoverHandling ? '✅' : '❌'}\n`;
        report += `- **Keyboard Handling**: ${result.testResults.keyboardHandling ? '✅' : '❌'}\n`;
        report += `- **Touch Handling**: ${result.testResults.touchHandling ? '✅' : '❌'}\n`;
        report += `- **Event Propagation**: ${result.testResults.eventPropagation ? '✅' : '❌'}\n`;
        report += `- **Accessibility**: ${result.testResults.accessibilityInteractions ? '✅' : '❌'}\n`;

        if (result.preservedHandlers.length > 0) {
          report += `- **Preserved Handlers**: ${result.preservedHandlers.join(', ')}\n`;
        }

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
      report += `## ❌ Failed Interaction Tests\n\n`;
      failed.forEach(result => {
        report += `### ${result.componentName}\n`;
        result.errors.forEach(error => {
          report += `- ❌ ${error}\n`;
        });
        if (result.lostHandlers.length > 0) {
          report += `- **Lost Handlers**: ${result.lostHandlers.join(', ')}\n`;
        }
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
 * Utility function to create an interaction tester
 */
export function createInteractionTester(): InteractionTester {
  return new InteractionTester();
}

/**
 * Quick interaction test function for a single component
 */
export async function testComponentInteractions(
  component: GeneratedComponent,
  options?: InteractionTestOptions
): Promise<InteractionTestResult> {
  const tester = createInteractionTester();
  return tester.testComponentInteractions(component, options);
}

/**
 * Quick interaction test function for multiple components
 */
export async function testMultipleComponentInteractions(
  components: GeneratedComponent[],
  options?: InteractionTestOptions
): Promise<InteractionTestResult[]> {
  const tester = createInteractionTester();
  return tester.testMultipleComponentInteractions(components, options);
}