import { Logger } from '@nestjs/common';
import { CONSTANTS } from '@alacraft/shared';
import { CSSValidationError } from '../interfaces/css-injector.interface';

/**
 * Utility class for validating CSS component files
 */
export class CSSComponentValidator {
  private static readonly logger = new Logger(CSSComponentValidator.name);

  /**
   * Validate CSS component file content
   * @param componentName - Name of the CSS component
   * @param cssContent - CSS content to validate
   * @param throwOnError - Whether to throw error or just log warnings
   * @throws CSSValidationError if validation fails and throwOnError is true
   */
  static validateCSSComponent(
    componentName: string,
    cssContent: string,
    throwOnError: boolean = false
  ): string[] {
    const validationErrors: string[] = [];

    // Check if content is empty
    if (!cssContent || cssContent.trim().length === 0) {
      validationErrors.push('CSS component content is empty');
    } else {
      // Check for balanced braces
      const braceValidation = this.validateBraces(cssContent);
      if (braceValidation.length > 0) {
        validationErrors.push(...braceValidation);
      }

      // Check for valid CSS syntax
      const syntaxValidation = this.validateCSSSyntax(cssContent);
      if (syntaxValidation.length > 0) {
        validationErrors.push(...syntaxValidation);
      }

      // Check for component-specific patterns
      const componentValidation = this.validateComponentPatterns(componentName, cssContent);
      if (componentValidation.length > 0) {
        validationErrors.push(...componentValidation);
      }

      // Check for email client compatibility
      const compatibilityValidation = this.validateEmailClientCompatibility(cssContent);
      if (compatibilityValidation.length > 0) {
        validationErrors.push(...compatibilityValidation);
      }
    }

    if (validationErrors.length > 0) {
      const errorMessage = `CSS component '${componentName}' validation issues: ${validationErrors.join(', ')}`;

      if (throwOnError) {
        this.logger.error(errorMessage);
        throw new CSSValidationError(componentName, validationErrors);
      } else {
        this.logger.warn(errorMessage);
      }
    } else {
      this.logger.debug(`CSS component '${componentName}' passed validation`);
    }

    return validationErrors;
  }

  /**
   * Validate CSS brace balance
   */
  private static validateBraces(cssContent: string): string[] {
    const errors: string[] = [];

    const openBraces = (cssContent.match(/\{/g) || []).length;
    const closeBraces = (cssContent.match(/\}/g) || []).length;

    if (openBraces !== closeBraces) {
      errors.push(`Unbalanced braces: ${openBraces} opening, ${closeBraces} closing`);
    }

    return errors;
  }

  /**
   * Validate basic CSS syntax
   */
  private static validateCSSSyntax(cssContent: string): string[] {
    const errors: string[] = [];

    // Check for basic CSS structure (at least one rule or comment)
    const hasRules = /[^{}]*\{[^{}]*\}/.test(cssContent);
    const hasComments = /\/\*[\s\S]*?\*\//.test(cssContent);
    const hasImports = /@import\s+/.test(cssContent);

    if (!hasRules && !hasComments && !hasImports && cssContent.trim().length > 0) {
      errors.push('No valid CSS rules, comments, or imports found');
    }

    // Check for invalid CSS syntax patterns (more lenient)
    const invalidPatterns = [
      { pattern: /\{[^}]*\{[^}]*\}/g, message: 'Nested braces without proper CSS nesting syntax' }
    ];

    for (const { pattern, message } of invalidPatterns) {
      // Reset regex lastIndex to avoid issues with global flag
      pattern.lastIndex = 0;
      if (pattern.test(cssContent)) {
        errors.push(message);
      }
    }

    // Check for unclosed comments
    const commentStart = cssContent.indexOf('/*');
    const commentEnd = cssContent.indexOf('*/', commentStart);
    if (commentStart !== -1 && (commentEnd === -1 || commentEnd < commentStart)) {
      errors.push('Unclosed CSS comment');
    }

    return errors;
  }

  /**
   * Validate component-specific CSS patterns
   */
  private static validateComponentPatterns(componentName: string, cssContent: string): string[] {
    const errors: string[] = [];

    switch (componentName) {
      case 'buttons':
        if (!cssContent.includes('.btn')) {
          errors.push('Button component should contain .btn class definitions');
        }
        const buttonStyles = ['primary', 'secondary', 'success', 'danger'];
        const missingStyles = buttonStyles.filter(style => !cssContent.includes(`.btn-${style}`));
        if (missingStyles.length > 0) {
          errors.push(`Missing button styles: ${missingStyles.join(', ')}`);
        }
        break;

      case 'badges':
        if (!cssContent.includes('.badge')) {
          errors.push('Badge component should contain .badge class definitions');
        }
        const badgeStyles = [
          CONSTANTS.STATUS.ORDER_STATUS.PENDING.toLowerCase(),
          'confirmed', // This is not an order status, it's a UI state
          CONSTANTS.STATUS.ORDER_STATUS.SHIPPED.toLowerCase(),
          CONSTANTS.STATUS.ORDER_STATUS.DELIVERED.toLowerCase(),
          CONSTANTS.STATUS.ORDER_STATUS.CANCELLED.toLowerCase(),
        ];
        const missingBadgeStyles = badgeStyles.filter(style => !cssContent.includes(`.badge-${style}`));
        if (missingBadgeStyles.length > 0) {
          errors.push(`Missing badge styles: ${missingBadgeStyles.join(', ')}`);
        }
        break;

      case 'cards':
        if (!cssContent.includes('.address-card') && !cssContent.includes('.card')) {
          errors.push('Card component should contain card-related class definitions');
        }
        break;

      case 'layout':
        const layoutClasses = ['email-header', 'email-footer'];
        const missingLayoutClasses = layoutClasses.filter(cls => !cssContent.includes(`.${cls}`));
        if (missingLayoutClasses.length > 0) {
          errors.push(`Missing layout classes: ${missingLayoutClasses.join(', ')}`);
        }
        break;
    }

    return errors;
  }

  /**
   * Validate email client compatibility
   */
  private static validateEmailClientCompatibility(cssContent: string): string[] {
    const warnings: string[] = [];

    // Check for potentially problematic CSS properties for email clients
    const problematicProperties = [
      { pattern: /position\s*:\s*(fixed|sticky)/gi, message: 'Fixed/sticky positioning may not work in all email clients' },
      { pattern: /display\s*:\s*(flex|grid)/gi, message: 'Flexbox/Grid may not be supported in older email clients' },
      { pattern: /transform\s*:/gi, message: 'CSS transforms may not work in all email clients' },
      { pattern: /animation\s*:/gi, message: 'CSS animations may not work in all email clients' },
      { pattern: /@media\s*\([^)]*hover/gi, message: 'Hover media queries may not work on mobile email clients' },
      { pattern: /box-shadow\s*:/gi, message: 'Box shadows may not render consistently across email clients' }
    ];

    for (const { pattern, message } of problematicProperties) {
      pattern.lastIndex = 0; // Reset regex
      if (pattern.test(cssContent)) {
        warnings.push(message);
      }
    }

    // Check for vendor prefixes (good practice for email)
    const prefixableProperties = ['border-radius', 'box-shadow', 'transform', 'transition'];
    for (const property of prefixableProperties) {
      const propertyPattern = new RegExp(`${property}\\s*:`, 'gi');
      const webkitPattern = new RegExp(`-webkit-${property}\\s*:`, 'gi');

      if (propertyPattern.test(cssContent) && !webkitPattern.test(cssContent)) {
        warnings.push(`Consider adding -webkit- prefix for ${property} for better email client support`);
      }
    }

    return warnings;
  }

  /**
   * Check if a CSS selector is valid
   */
  private static isValidSelector(selector: string): boolean {
    // Basic validation for CSS selectors
    if (!selector || selector.trim().length === 0) {
      return false;
    }

    // Check for obviously invalid characters
    const invalidChars = /[{}]/;
    if (invalidChars.test(selector)) {
      return false;
    }

    // Check for valid selector patterns (basic validation)
    const validSelectorPattern = /^[a-zA-Z0-9\s\-_#.\[\]:(),>+~*"'=^$|]+$/;
    return validSelectorPattern.test(selector);
  }

  /**
   * Get expected CSS classes for a component
   */
  static getExpectedClasses(componentName: string): string[] {
    switch (componentName) {
      case 'buttons':
        return ['.btn', '.btn-primary', '.btn-secondary', '.btn-success', '.btn-danger'];
      case 'badges':
        return ['.badge', '.badge-pending', '.badge-confirmed', '.badge-shipped', '.badge-delivered', '.badge-cancelled'];
      case 'cards':
        return ['.address-card', '.address-title', '.address-content', '.address-line'];
      case 'layout':
        return ['.email-header', '.email-footer', '.company-name', '.company-tagline'];
      default:
        return [];
    }
  }

  /**
   * Validate that expected CSS classes are present
   */
  static validateExpectedClasses(componentName: string, cssContent: string): string[] {
    const errors: string[] = [];
    const expectedClasses = this.getExpectedClasses(componentName);

    for (const className of expectedClasses) {
      if (!cssContent.includes(className)) {
        errors.push(`Expected CSS class '${className}' not found`);
      }
    }

    return errors;
  }
}