import { Injectable, Logger } from '@nestjs/common';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';

export interface TemplateValidationOptions {
  checkSyntax?: boolean;
  checkPlaceholders?: boolean;
  checkStructure?: boolean;
  checkCSS?: boolean;
  checkCompatibility?: boolean;
  templateVersion?: string;
}

export interface TemplateValidationReport {
  templateName: string;
  isValid: boolean;
  errors: TemplateValidationError[];
  warnings: TemplateValidationWarning[];
  validationTime: number;
  templateSize: number;
  lastModified: Date;
  version?: string;
}

export interface TemplateValidationError {
  type: 'syntax' | 'structure' | 'placeholder' | 'css' | 'compatibility';
  severity: 'error' | 'warning';
  message: string;
  line?: number;
  column?: number;
  context?: string;
}

export interface TemplateValidationWarning {
  type: 'performance' | 'accessibility' | 'compatibility' | 'best-practice';
  message: string;
  suggestion?: string;
  line?: number;
  context?: string;
}

@Injectable()
export class TemplateValidationService {
  private readonly logger = new Logger(TemplateValidationService.name);
  private readonly templateDir = this.resolveTemplateDirectory();

  // Required template sections for structure validation
  private readonly requiredSections = [
    'pdf-container',
    'pdf-header',
    'pdf-content',
    'pdf-footer'
  ];

  // Essential placeholders that must be present
  private readonly essentialPlaceholders = [
    '{{orderNumber}}',
    '{{customerInfo.name}}',
    '{{customerInfo.email}}',
    '{{items}}',
    '{{formattedTotal}}'
  ];

  // Recommended placeholders for completeness
  private readonly recommendedPlaceholders = [
    '{{companyName}}',
    '{{documentTitle}}',
    '{{formattedOrderDate}}',
    '{{formattedSubtotal}}',
    '{{formattedShippingCost}}',
    '{{paymentMethod.displayName}}',
    '{{shippingMethod.name}}'
  ];

  // CSS properties that should be present for proper styling
  private readonly requiredCSSClasses = [
    '.pdf-container',
    '.pdf-header',
    '.pdf-content',
    '.pdf-footer',
    '.company-logo',
    '.order-items-table',
    '.order-summary'
  ];

  /**
   * Resolve template directory path for both development and production environments
   * @returns string - Resolved template directory path
   */
  private resolveTemplateDirectory(): string {
    // Try multiple possible locations for template files
    const possiblePaths = [
      // Development: source directory
      join(process.cwd(), 'backend', 'src', 'pdf-generator', 'templates'),
      join(process.cwd(), 'src', 'pdf-generator', 'templates'),
      // Production: compiled directory (correct path)
      join(process.cwd(), 'backend', 'dist', 'pdf-generator', 'templates'),
      join(process.cwd(), 'dist', 'pdf-generator', 'templates'),
      // Fallback: relative to current file
      join(__dirname, '..', 'templates'),
      // Alternative production paths
      join(process.cwd(), 'backend', 'dist', 'src', 'pdf-generator', 'templates'),
      join(process.cwd(), 'dist', 'src', 'pdf-generator', 'templates'),
    ];

    for (const templatePath of possiblePaths) {
      try {
        // Check if the directory exists and contains template files
        const fs = require('fs');
        if (fs.existsSync(templatePath)) {
          const files = fs.readdirSync(templatePath);
          // Check if it contains expected template files
          if (files.some((file: string) => file.endsWith('.html') || file.endsWith('.css'))) {
            this.logger.log(`Template directory resolved to: ${templatePath}`);
            return templatePath;
          }
        }
      } catch (error) {
        // Continue to next path
        continue;
      }
    }

    // Fallback to the original path if none found
    const fallbackPath = join(__dirname, '..', 'templates');
    this.logger.warn(`Could not find template directory, falling back to: ${fallbackPath}`);
    return fallbackPath;
  }

  /**
   * Validate a template file with comprehensive checks
   * @param templateName - Name of the template to validate
   * @param options - Validation options
   * @returns Promise<TemplateValidationReport> - Detailed validation report
   */
  async validateTemplate(
    templateName: 'order-confirmation' | 'invoice',
    options: TemplateValidationOptions = {}
  ): Promise<TemplateValidationReport> {
    const startTime = Date.now();
    this.logger.debug(`Starting validation for template: ${templateName}`);

    const defaultOptions: TemplateValidationOptions = {
      checkSyntax: true,
      checkPlaceholders: true,
      checkStructure: true,
      checkCSS: true,
      checkCompatibility: true,
      ...options
    };

    const errors: TemplateValidationError[] = [];
    const warnings: TemplateValidationWarning[] = [];

    try {
      // Load template file
      const templatePath = join(this.templateDir, `${templateName}.html`);
      const templateContent = await readFile(templatePath, 'utf-8');
      const templateStats = await stat(templatePath);

      // Perform validation checks
      if (defaultOptions.checkStructure) {
        const structureResults = this.validateTemplateStructure(templateContent);
        errors.push(...structureResults.errors);
        warnings.push(...structureResults.warnings);
      }

      if (defaultOptions.checkSyntax) {
        const syntaxResults = this.validateTemplateSyntax(templateContent);
        errors.push(...syntaxResults.errors);
        warnings.push(...syntaxResults.warnings);
      }

      if (defaultOptions.checkPlaceholders) {
        const placeholderResults = this.validateTemplatePlaceholders(templateContent);
        errors.push(...placeholderResults.errors);
        warnings.push(...placeholderResults.warnings);
      }

      if (defaultOptions.checkCSS) {
        const cssResults = await this.validateTemplateCSS(templateContent);
        errors.push(...cssResults.errors);
        warnings.push(...cssResults.warnings);
      }

      if (defaultOptions.checkCompatibility) {
        const compatibilityResults = this.validateTemplateCompatibility(templateContent, defaultOptions.templateVersion);
        errors.push(...compatibilityResults.errors);
        warnings.push(...compatibilityResults.warnings);
      }

      const validationTime = Date.now() - startTime;
      const isValid = errors.filter(e => e.severity === 'error').length === 0;

      this.logger.log(`Template validation completed for ${templateName}: ${isValid ? 'VALID' : 'INVALID'} (${validationTime}ms)`);

      return {
        templateName,
        isValid,
        errors,
        warnings,
        validationTime,
        templateSize: templateStats.size,
        lastModified: templateStats.mtime,
        version: defaultOptions.templateVersion
      };

    } catch (error) {
      this.logger.error(`Template validation failed for ${templateName}: ${error.message}`, {
        templateName,
        error: error.message,
        stack: error.stack
      });

      return {
        templateName,
        isValid: false,
        errors: [{
          type: 'structure',
          severity: 'error',
          message: `Failed to load or validate template: ${error.message}`
        }],
        warnings: [],
        validationTime: Date.now() - startTime,
        templateSize: 0,
        lastModified: new Date(),
        version: defaultOptions.templateVersion
      };
    }
  }

  /**
   * Validate template HTML structure and required elements
   * @param template - Template content
   * @returns Validation results with errors and warnings
   */
  private validateTemplateStructure(template: string): { errors: TemplateValidationError[]; warnings: TemplateValidationWarning[] } {
    const errors: TemplateValidationError[] = [];
    const warnings: TemplateValidationWarning[] = [];

    // Check for basic HTML structure
    const requiredElements = [
      { element: '<!DOCTYPE html>', message: 'Template must include DOCTYPE declaration' },
      { element: '<html', message: 'Template must include html element' },
      { element: '<head>', message: 'Template must include head element' },
      { element: '<body>', message: 'Template must include body element' },
      { element: '<meta charset="UTF-8">', message: 'Template should include UTF-8 charset declaration' }
    ];

    for (const { element, message } of requiredElements) {
      if (!template.includes(element)) {
        errors.push({
          type: 'structure',
          severity: 'error',
          message,
          context: element
        });
      }
    }

    // Check for required template sections
    for (const section of this.requiredSections) {
      if (!template.includes(section)) {
        errors.push({
          type: 'structure',
          severity: 'error',
          message: `Template must include ${section} section`,
          context: section
        });
      }
    }

    // Check for proper nesting and closing tags
    const tagPairs = [
      { open: '<html', close: '</html>' },
      { open: '<head>', close: '</head>' },
      { open: '<body>', close: '</body>' },
      { open: '<main', close: '</main>' },
      { open: '<header', close: '</header>' },
      { open: '<footer', close: '</footer>' }
    ];

    for (const { open, close } of tagPairs) {
      const hasOpen = template.includes(open);
      const hasClose = template.includes(close);

      if (hasOpen && !hasClose) {
        errors.push({
          type: 'structure',
          severity: 'error',
          message: `Opening tag ${open} found but missing closing tag ${close}`,
          context: `${open}...${close}`
        });
      }
    }

    // Check for accessibility features
    if (!template.includes('lang=')) {
      warnings.push({
        type: 'accessibility',
        message: 'Template should include lang attribute on html element for accessibility',
        suggestion: 'Add lang="{{#if isVietnamese}}vi{{else}}en{{/if}}" to html element'
      });
    }

    if (!template.includes('alt=')) {
      warnings.push({
        type: 'accessibility',
        message: 'Images should include alt attributes for accessibility',
        suggestion: 'Add alt attributes to all img elements'
      });
    }

    // Check for semantic HTML structure
    const semanticElements = ['<main', '<header', '<footer', '<section', '<article'];
    const foundSemantic = semanticElements.some(element => template.includes(element));

    if (!foundSemantic) {
      warnings.push({
        type: 'best-practice',
        message: 'Template should use semantic HTML elements for better structure',
        suggestion: 'Use elements like <main>, <header>, <footer>, <section> for better document structure'
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate Handlebars template syntax
   * @param template - Template content
   * @returns Validation results with errors and warnings
   */
  private validateTemplateSyntax(template: string): { errors: TemplateValidationError[]; warnings: TemplateValidationWarning[] } {
    const errors: TemplateValidationError[] = [];
    const warnings: TemplateValidationWarning[] = [];

    // Check for proper Handlebars syntax
    const handlebarsRegex = /\{\{[^}]*\}\}/g;
    const matches = template.match(handlebarsRegex) || [];

    for (const match of matches) {
      // Check for unclosed braces
      const openBraces = (match.match(/\{\{/g) || []).length;
      const closeBraces = (match.match(/\}\}/g) || []).length;

      if (openBraces !== closeBraces) {
        errors.push({
          type: 'syntax',
          severity: 'error',
          message: `Invalid Handlebars syntax: mismatched braces in ${match}`,
          context: match
        });
      }

      // Check for empty placeholders
      if (match === '{{}}') {
        errors.push({
          type: 'syntax',
          severity: 'error',
          message: 'Empty Handlebars placeholder found',
          context: match
        });
      }

      // Check for invalid characters in placeholders
      const content = match.slice(2, -2).trim();
      if (content.includes('<') || content.includes('>')) {
        errors.push({
          type: 'syntax',
          severity: 'error',
          message: `Invalid characters in Handlebars placeholder: ${match}`,
          context: match
        });
      }
    }

    // Check for proper conditional syntax
    const conditionalRegex = /\{\{#if\s+[^}]+\}\}/g;
    const conditionalMatches = template.match(conditionalRegex) || [];

    for (const conditional of conditionalMatches) {
      const conditionName = conditional.match(/\{\{#if\s+([^}]+)\}\}/)?.[1];
      if (conditionName) {
        // Check if conditional is properly closed
        const ifCount = (template.match(new RegExp(conditional.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        const endifCount = (template.match(/\{\{\/if\}\}/g) || []).length;

        if (ifCount > endifCount) {
          errors.push({
            type: 'syntax',
            severity: 'error',
            message: `Conditional ${conditional} is not properly closed with {{/if}}`,
            context: conditional
          });
        }
      }
    }

    // Check for proper loop syntax
    const loopRegex = /\{\{#each\s+[^}]+\}\}/g;
    const loopMatches = template.match(loopRegex) || [];

    for (const loop of loopMatches) {
      const loopName = loop.match(/\{\{#each\s+([^}]+)\}\}/)?.[1];
      if (loopName) {
        // Check if loop is properly closed
        const eachCount = (template.match(new RegExp(loop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        const endeachCount = (template.match(/\{\{\/each\}\}/g) || []).length;

        if (eachCount > endeachCount) {
          errors.push({
            type: 'syntax',
            severity: 'error',
            message: `Loop ${loop} is not properly closed with {{/each}}`,
            context: loop
          });
        }
      }
    }

    // Check for partial syntax
    const partialRegex = /\{\{>\s*[^}]+\s*\}\}/g;
    const partialMatches = template.match(partialRegex) || [];

    for (const partial of partialMatches) {
      const partialName = partial.match(/\{\{>\s*([^}]+)\s*\}\}/)?.[1];
      if (!partialName || partialName.trim().length === 0) {
        errors.push({
          type: 'syntax',
          severity: 'error',
          message: `Invalid partial syntax: ${partial}`,
          context: partial
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate template placeholders for completeness
   * @param template - Template content
   * @returns Validation results with errors and warnings
   */
  private validateTemplatePlaceholders(template: string): { errors: TemplateValidationError[]; warnings: TemplateValidationWarning[] } {
    const errors: TemplateValidationError[] = [];
    const warnings: TemplateValidationWarning[] = [];

    // Check for essential placeholders
    for (const placeholder of this.essentialPlaceholders) {
      if (!template.includes(placeholder)) {
        errors.push({
          type: 'placeholder',
          severity: 'error',
          message: `Essential placeholder ${placeholder} is missing from template`,
          context: placeholder
        });
      }
    }

    // Check for recommended placeholders
    for (const placeholder of this.recommendedPlaceholders) {
      if (!template.includes(placeholder)) {
        warnings.push({
          type: 'best-practice',
          message: `Recommended placeholder ${placeholder} is missing from template`,
          suggestion: `Consider adding ${placeholder} for better user experience`,
          context: placeholder
        });
      }
    }

    // Check for unused or potentially invalid placeholders
    const handlebarsRegex = /\{\{([^}#/]+)\}\}/g;
    const matches = template.match(handlebarsRegex) || [];
    const knownPlaceholders = [
      ...this.essentialPlaceholders,
      ...this.recommendedPlaceholders,
      '{{companyName}}',
      '{{documentTitle}}',
      '{{isVietnamese}}',
      '{{formattedPhone}}',
      '{{formattedOrderDate}}',
      '{{thankYouMessage}}',
      '{{orderConfirmationTitle}}',
      '{{invoiceTitle}}',
      '{{customerInformationTitle}}',
      '{{nameLabel}}',
      '{{emailLabel}}',
      '{{phoneLabel}}',
      '{{shippingAddressTitle}}',
      '{{billingAddressTitle}}',
      '{{orderItemsTitle}}',
      '{{invoiceItemsTitle}}',
      '{{productLabel}}',
      '{{quantityLabel}}',
      '{{unitPriceLabel}}',
      '{{totalLabel}}',
      '{{orderSummaryTitle}}',
      '{{subtotalLabel}}',
      '{{shippingLabel}}',
      '{{taxLabel}}',
      '{{discountLabel}}',
      '{{totalAmountDueLabel}}',
      '{{paymentInformationTitle}}',
      '{{paymentMethodLabel}}',
      '{{paymentStatusLabel}}',
      '{{shippingInformationTitle}}',
      '{{shippingMethodLabel}}',
      '{{estimatedDeliveryLabel}}',
      '{{contactUsLabel}}',
      '{{websiteLabel}}'
    ];

    for (const match of matches) {
      const placeholder = `{{${match.match(/\{\{([^}#/]+)\}\}/)?.[1] || ''}}}`;
      if (!knownPlaceholders.includes(placeholder) && !placeholder.includes('.')) {
        warnings.push({
          type: 'best-practice',
          message: `Unknown placeholder ${placeholder} found in template`,
          suggestion: 'Verify this placeholder is properly handled in the template processor',
          context: placeholder
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate CSS references and styling consistency
   * @param template - Template content
   * @returns Validation results with errors and warnings
   */
  private async validateTemplateCSS(template: string): Promise<{ errors: TemplateValidationError[]; warnings: TemplateValidationWarning[] }> {
    const errors: TemplateValidationError[] = [];
    const warnings: TemplateValidationWarning[] = [];

    try {
      // Check for CSS partial reference
      if (!template.includes('{{> pdf-styles}}')) {
        errors.push({
          type: 'css',
          severity: 'error',
          message: 'Template must include {{> pdf-styles}} partial for styling',
          context: '{{> pdf-styles}}'
        });
      }

      // Load and validate CSS file
      const cssPath = join(this.templateDir, 'pdf-styles.css');
      const cssContent = await readFile(cssPath, 'utf-8');

      // Check for required CSS classes
      for (const cssClass of this.requiredCSSClasses) {
        if (!cssContent.includes(cssClass)) {
          warnings.push({
            type: 'best-practice',
            message: `CSS class ${cssClass} not found in stylesheet`,
            suggestion: `Add styling for ${cssClass} to ensure proper template rendering`,
            context: cssClass
          });
        }
      }

      // Check for CSS syntax issues
      const unclosedBraces = (cssContent.match(/\{/g) || []).length - (cssContent.match(/\}/g) || []).length;
      if (unclosedBraces !== 0) {
        errors.push({
          type: 'css',
          severity: 'error',
          message: 'CSS file has mismatched braces - check for unclosed rules',
          context: 'pdf-styles.css'
        });
      }

      // Check for print-specific styles
      if (!cssContent.includes('@media print')) {
        warnings.push({
          type: 'best-practice',
          message: 'CSS should include print-specific styles for better PDF rendering',
          suggestion: 'Add @media print rules for optimal printing experience'
        });
      }

      // Check for accessibility-friendly colors
      if (!cssContent.includes('color:') && !cssContent.includes('background-color:')) {
        warnings.push({
          type: 'accessibility',
          message: 'CSS should define colors for better accessibility',
          suggestion: 'Add color and background-color properties with sufficient contrast'
        });
      }

    } catch (error) {
      errors.push({
        type: 'css',
        severity: 'error',
        message: `Failed to validate CSS file: ${error.message}`,
        context: 'pdf-styles.css'
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate template compatibility with different versions
   * @param template - Template content
   * @param version - Template version to check compatibility
   * @returns Validation results with errors and warnings
   */
  private validateTemplateCompatibility(template: string, version?: string): { errors: TemplateValidationError[]; warnings: TemplateValidationWarning[] } {
    const errors: TemplateValidationError[] = [];
    const warnings: TemplateValidationWarning[] = [];

    // Check for deprecated features
    const deprecatedFeatures = [
      { pattern: /style\s*=\s*["'][^"']*["']/, message: 'Inline styles are deprecated, use CSS classes instead' },
      { pattern: /<font[^>]*>/, message: '<font> tag is deprecated, use CSS for styling' },
      { pattern: /<center[^>]*>/, message: '<center> tag is deprecated, use CSS text-align instead' },
      { pattern: /align\s*=\s*["'][^"']*["']/, message: 'align attribute is deprecated, use CSS instead' }
    ];

    for (const { pattern, message } of deprecatedFeatures) {
      if (pattern.test(template)) {
        warnings.push({
          type: 'compatibility',
          message,
          suggestion: 'Update template to use modern CSS practices'
        });
      }
    }

    // Check for modern HTML5 features
    const html5Features = [
      { pattern: /<main[^>]*>/, feature: 'main element' },
      { pattern: /<section[^>]*>/, feature: 'section element' },
      { pattern: /<article[^>]*>/, feature: 'article element' },
      { pattern: /<header[^>]*>/, feature: 'header element' },
      { pattern: /<footer[^>]*>/, feature: 'footer element' }
    ];

    const foundModernFeatures = html5Features.filter(({ pattern }) => pattern.test(template));
    if (foundModernFeatures.length === 0) {
      warnings.push({
        type: 'compatibility',
        message: 'Template uses older HTML structure',
        suggestion: 'Consider using HTML5 semantic elements for better structure and accessibility'
      });
    }

    // Version-specific compatibility checks
    if (version) {
      const versionNumber = parseFloat(version);

      if (versionNumber < 1.0) {
        warnings.push({
          type: 'compatibility',
          message: `Template version ${version} may not be compatible with current system`,
          suggestion: 'Consider updating template to latest version'
        });
      }

      // Check for version-specific features
      if (versionNumber >= 2.0 && !template.includes('{{> pdf-styles}}')) {
        errors.push({
          type: 'compatibility',
          severity: 'error',
          message: 'Version 2.0+ templates must use external CSS files',
          context: 'Template version compatibility'
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate all templates in the template directory
   * @param options - Validation options
   * @returns Promise<TemplateValidationReport[]> - Array of validation reports
   */
  async validateAllTemplates(options: TemplateValidationOptions = {}): Promise<TemplateValidationReport[]> {
    this.logger.log('Starting validation for all templates');

    const templates: ('order-confirmation' | 'invoice')[] = ['order-confirmation', 'invoice'];
    const reports: TemplateValidationReport[] = [];

    for (const template of templates) {
      try {
        const report = await this.validateTemplate(template, options);
        reports.push(report);
      } catch (error) {
        this.logger.error(`Failed to validate template ${template}: ${error.message}`);
        reports.push({
          templateName: template,
          isValid: false,
          errors: [{
            type: 'structure',
            severity: 'error',
            message: `Validation failed: ${error.message}`
          }],
          warnings: [],
          validationTime: 0,
          templateSize: 0,
          lastModified: new Date()
        });
      }
    }

    const validTemplates = reports.filter(r => r.isValid).length;
    this.logger.log(`Template validation completed: ${validTemplates}/${reports.length} templates valid`);

    return reports;
  }

  /**
   * Get validation summary for monitoring
   * @returns Promise<object> - Validation summary statistics
   */
  async getValidationSummary(): Promise<{
    totalTemplates: number;
    validTemplates: number;
    invalidTemplates: number;
    totalErrors: number;
    totalWarnings: number;
    lastValidation: Date;
  }> {
    const reports = await this.validateAllTemplates();

    return {
      totalTemplates: reports.length,
      validTemplates: reports.filter(r => r.isValid).length,
      invalidTemplates: reports.filter(r => !r.isValid).length,
      totalErrors: reports.reduce((sum, r) => sum + r.errors.filter(e => e.severity === 'error').length, 0),
      totalWarnings: reports.reduce((sum, r) => sum + r.warnings.length, 0),
      lastValidation: new Date()
    };
  }
}