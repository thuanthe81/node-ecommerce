import { Injectable, Logger, Inject } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import type { HelperDelegate } from 'handlebars';
import { HTMLEscapingService } from '../../common/services/html-escaping.service';
import type {
  IVariableReplacer,
  TemplateContext,
  VariableReplacerConfig,
  HandlebarsTemplateDelegate
} from '../interfaces/variable-replacer.interface';
import {
  TemplateCompilationError,
  TemplateRuntimeError,
  MissingVariableError,
  PartialTemplateError,
  TemplateValidationError
} from '../errors/template-errors';
import { EmailHandlebarsHelpers } from '../helpers/email-handlebars-helpers';
import { DesignSystemInjector } from './design-system-injector.service';
import { EmailTranslationService } from './email-translation.service';
import { TemplateLoaderService } from './template-loader.service';
import { CSSInjectorService } from './css-injector.service';
import { PartialTemplateValidator } from '../utils/partial-template-validator';
import { CSSComponentValidator } from '../utils/css-component-validator';

/**
 * Service for processing templates with Handlebars.js and replacing variables with actual data.
 * Supports variable replacement, conditional sections, array iteration, and custom helpers.
 */
@Injectable()
export class VariableReplacerService implements IVariableReplacer {
  private readonly logger = new Logger(VariableReplacerService.name);
  private readonly handlebars: typeof Handlebars;
  private readonly compiledTemplates = new Map<string, HandlebarsTemplateDelegate>();
  private readonly registeredHelpers = new Set<string>();

  constructor(
    private readonly htmlEscapingService: HTMLEscapingService,
    private readonly designSystemInjector: DesignSystemInjector,
    private readonly emailTranslationService: EmailTranslationService,
    private readonly templateLoaderService: TemplateLoaderService,
    private readonly cssInjectorService: CSSInjectorService,
    @Inject('VariableReplacerConfig') private readonly config: VariableReplacerConfig
  ) {
    // Create isolated Handlebars instance to avoid global pollution
    this.handlebars = Handlebars.create();
    this.setupHandlebarsConfiguration();
    this.registerDefaultHelpers();
    this.registerEmailHelpers();
    // Register partial templates asynchronously after construction
    this.initializePartialTemplates();
  }

  /**
   * Replace variables in a template with actual data using Handlebars.js.
   * Supports nested object access, conditionals, and iteration.
   */
  async replaceVariables(
    template: string,
    data: any,
    locale: 'en' | 'vi'
  ): Promise<string> {
    try {
      // Compile template if not already compiled
      const templateKey = this.generateTemplateKey(template);
      let compiledTemplate = this.compiledTemplates.get(templateKey);

      if (!compiledTemplate) {
        compiledTemplate = this.compileTemplate(template);
        this.compiledTemplates.set(templateKey, compiledTemplate);
      }

      // Prepare template context
      const context = this.prepareTemplateContext(data, locale);

      // Execute template with context and enhanced error handling
      let result: string;
      try {
        result = compiledTemplate(context);
      } catch (renderError) {
        // Check if this is a partial template rendering error
        if (this.isPartialTemplateError(renderError)) {
          const partialName = this.extractPartialNameFromError(renderError);
          this.logger.error(
            `Partial template rendering failed - Partial: '${partialName}', Error: ${renderError.message}`,
            renderError.stack
          );

          // Re-throw as PartialTemplateError for better error handling
          throw new PartialTemplateError(
            partialName,
            `Rendering failed: ${renderError.message}`
          );
        }

        // For other rendering errors, provide detailed context
        this.logger.error(
          `Template rendering failed - Template key: ${templateKey}, Locale: ${locale}, Error: ${renderError.message}`,
          renderError.stack
        );
        throw renderError;
      }

      this.logger.debug(`Successfully processed template for locale: ${locale}`);
      return result;

    } catch (error) {
      this.logger.error(`Failed to replace variables in template: ${error.message}`, error.stack);

      if (error instanceof PartialTemplateError) {
        // Re-throw partial template errors as-is
        throw error;
      }

      if (error.name === 'Error' && error.message.includes('Parse error')) {
        throw new TemplateCompilationError('unknown', error.message);
      }

      throw new TemplateRuntimeError('unknown', error.message, data);
    }
  }

  /**
   * Register a custom Handlebars helper function.
   */
  registerHelper(name: string, helper: HelperDelegate): void {
    try {
      this.handlebars.registerHelper(name, helper);
      this.registeredHelpers.add(name);
      this.logger.debug(`Registered Handlebars helper: ${name}`);
    } catch (error) {
      this.logger.error(`Failed to register helper '${name}': ${error.message}`);
      throw error;
    }
  }

  /**
   * Register multiple helpers at once.
   */
  registerHelpers(helpers: Record<string, HelperDelegate>): void {
    for (const [name, helper] of Object.entries(helpers)) {
      this.registerHelper(name, helper);
    }
  }

  /**
   * Compile a template string into a reusable template function.
   */
  compileTemplate(template: string): HandlebarsTemplateDelegate {
    try {
      return this.handlebars.compile(template, {
        noEscape: !this.config.escapeHtml,
        strict: false, // Disable strict mode to allow missing properties
        assumeObjects: true
      });
    } catch (error) {
      this.logger.error(`Failed to compile template: ${error.message}`);
      throw new TemplateCompilationError('unknown', error.message);
    }
  }

  /**
   * Get list of registered helper names.
   */
  getRegisteredHelpers(): string[] {
    return Array.from(this.registeredHelpers);
  }

  /**
   * Setup Handlebars configuration for security and functionality
   */
  private setupHandlebarsConfiguration(): void {
    // Configure Handlebars for security
    this.handlebars.registerHelper('helperMissing', (context) => {
      const helperName = context.name;

      if (this.config.logMissingVariables) {
        this.logger.warn(`Missing helper: ${helperName}`);
      }

      if (this.config.strictMode) {
        throw new MissingVariableError('unknown', helperName, this.getRegisteredHelpers());
      }

      return this.config.missingVariableDefault;
    });

    // Handle missing variables
    this.handlebars.registerHelper('blockHelperMissing', (context) => {
      if (this.config.logMissingVariables) {
        this.logger.warn(`Missing block helper: ${context.name}`);
      }

      if (this.config.strictMode) {
        throw new MissingVariableError('unknown', context.name, this.getRegisteredHelpers());
      }

      return this.config.missingVariableDefault;
    });

    // Handle missing variables in expressions
    this.handlebars.registerHelper('lookup', (obj: any, field: string) => {
      if (obj == null) {
        if (this.config.logMissingVariables) {
          this.logger.warn(`Attempting to access property '${field}' on null/undefined object`);
        }
        return this.config.missingVariableDefault;
      }

      const value = obj[field];
      if (value === undefined) {
        if (this.config.logMissingVariables) {
          this.logger.warn(`Missing property '${field}' in object`);
        }
        return this.config.missingVariableDefault;
      }

      return value;
    });

    // Custom helper for safe nested property access
    this.handlebars.registerHelper('get', (obj: any, path: string) => {
      return this.resolveNestedProperty(obj, path);
    });
  }

  /**
   * Resolve nested property access with proper error handling and logging
   */
  private resolveNestedProperty(obj: any, propertyPath: string): any {
    if (!propertyPath || typeof propertyPath !== 'string') {
      return this.config.missingVariableDefault;
    }

    const properties = propertyPath.split('.');
    let current = obj;
    let currentPath = '';

    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      currentPath = currentPath ? `${currentPath}.${property}` : property;

      if (current == null) {
        if (this.config.logMissingVariables) {
          this.logger.warn(`Cannot access property '${property}' on null/undefined object at path '${currentPath}'`);
        }

        if (this.config.strictMode) {
          throw new MissingVariableError('unknown', currentPath, Object.keys(obj || {}));
        }

        return this.config.missingVariableDefault;
      }

      current = current[property];

      if (current === undefined) {
        if (this.config.logMissingVariables) {
          this.logger.warn(`Missing nested property '${currentPath}' in template data`);
        }

        if (this.config.strictMode) {
          const availableProperties = typeof current === 'object' && current !== null
            ? Object.keys(current)
            : [];
          throw new MissingVariableError('unknown', currentPath, availableProperties);
        }

        return this.config.missingVariableDefault;
      }
    }

    return current;
  }

  /**
   * Register default Handlebars helpers for common operations
   */
  private registerDefaultHelpers(): void {
    // Explicitly register built-in conditional helpers for clarity and proper configuration
    // Note: These are available by default in Handlebars, but we register them explicitly
    // to ensure they work with our configuration and to make dependencies clear

    // Built-in conditional helpers (explicitly registered for proper configuration)
    this.handlebars.registerHelper('if', this.handlebars.helpers.if);
    this.handlebars.registerHelper('unless', this.handlebars.helpers.unless);
    this.handlebars.registerHelper('each', this.handlebars.helpers.each);
    this.handlebars.registerHelper('with', this.handlebars.helpers.with);

    // Type checking helpers
    this.registerHelper('typeof', (value: any) => typeof value);
    this.registerHelper('isString', (value: any) => typeof value === 'string');
    this.registerHelper('isNumber', (value: any) => typeof value === 'number');
    this.registerHelper('isObject', (value: any) => typeof value === 'object' && value !== null);
    this.registerHelper('isArray', (value: any) => Array.isArray(value));

    // Conditional helpers
    this.registerHelper('eq', (a: any, b: any) => a === b);
    this.registerHelper('ne', (a: any, b: any) => a !== b);
    this.registerHelper('gt', (a: number, b: number) => a > b);
    this.registerHelper('lt', (a: number, b: number) => a < b);
    this.registerHelper('gte', (a: number, b: number) => a >= b);
    this.registerHelper('lte', (a: number, b: number) => a <= b);
    this.registerHelper('and', (a: any, b: any) => a && b);
    this.registerHelper('or', (a: any, b: any) => a || b);
    this.registerHelper('not', (a: any) => !a);

    // String helpers
    this.registerHelper('uppercase', (str: string) => str?.toUpperCase() || '');
    this.registerHelper('lowercase', (str: string) => str?.toLowerCase() || '');
    this.registerHelper('capitalize', (str: string) => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    });

    // Array helpers
    this.registerHelper('length', (array: any[]) => Array.isArray(array) ? array.length : 0);
    this.registerHelper('isEmpty', (array: any[]) => !Array.isArray(array) || array.length === 0);

    // HTML escaping helper (when manual escaping is needed)
    this.registerHelper('escape', (str: string) => {
      return this.htmlEscapingService.escapeHtmlContent(str);
    });

    // Safe HTML helper (for pre-escaped content)
    this.registerHelper('safe', (str: string) => {
      return new this.handlebars.SafeString(str);
    });

    // Default value helper
    this.registerHelper('default', (value: any, defaultValue: any) => {
      return value != null && value !== '' ? value : defaultValue;
    });

    // Nested property access helper
    this.registerHelper('get', (obj: any, path: string) => {
      const result = this.resolveNestedProperty(obj, path);
      // Ensure we return a primitive value, not a proxy
      if (result && typeof result === 'object' && result.toString) {
        return result.toString();
      }
      return result || this.config.missingVariableDefault;
    });

    // Safe property access helper (doesn't log warnings)
    this.registerHelper('safeGet', (obj: any, path: string) => {
      if (!path || typeof path !== 'string') {
        return this.config.missingVariableDefault;
      }

      const properties = path.split('.');
      let current = obj;

      for (const property of properties) {
        if (current == null || current[property] === undefined) {
          return this.config.missingVariableDefault;
        }
        current = current[property];
      }

      return current;
    });

    this.logger.debug('Registered default Handlebars helpers including built-in conditional helpers');
  }

  /**
   * Register email-specific Handlebars helpers
   */
  private registerEmailHelpers(): void {
    const emailHelpers = EmailHandlebarsHelpers.getAllHelpers();
    this.registerHelpers(emailHelpers);

    // Register additional template-specific helpers
    this.registerTemplateHelpers();

    this.logger.debug(`Registered ${Object.keys(emailHelpers).length} email-specific Handlebars helpers`);
  }

  /**
   * Register template-specific helpers for email generation
   */
  private registerTemplateHelpers(): void {
    // Design system CSS helper
    this.registerHelper('designSystemCSS', () => {
      return new this.handlebars.SafeString(this.designSystemInjector.generateCSS());
    });

    // Status text translation helper
    this.registerHelper('getStatusText', (status: string, locale: string) => {
      return this.getStatusText(status, locale as 'en' | 'vi');
    });

    // Concat helper for URL building
    this.registerHelper('concat', (...args: any[]) => {
      // Remove the options object (last argument)
      const values = args.slice(0, -1);
      return values.join('');
    });

    this.logger.debug('Registered template-specific helpers');
  }

  /**
   * Prepare template context with data, translations, and helpers
   */
  private prepareTemplateContext(data: any, locale: 'en' | 'vi'): TemplateContext {
    // Pre-process data to handle missing nested properties
    const safeData = this.createSafeDataProxy(data);

    // Get template helpers
    const templateHelpers = this.getTemplateHelpers(locale);

    // Create a flattened context that provides direct access to data properties
    // while also maintaining the nested structure for compatibility
    const context = {
      // Direct access to data properties (for templates expecting {{orderNumber}})
      ...safeData,
      // Nested access (for templates expecting {{data.orderNumber}})
      data: safeData,
      locale,
      translations: this.getTranslationsForLocale(locale),
      designTokens: this.getDesignTokens(),
      // Make helpers available directly in the context
      helpers: templateHelpers,
      // Also make individual helper functions available at root level
      formatCurrency: templateHelpers.formatCurrency,
      formatDate: templateHelpers.formatDate,
      getStatusText: templateHelpers.getStatusText,
      // Add admin URL for button generation
      adminUrl: process.env.FRONTEND_URL,
    };

    // Register helpers directly with Handlebars for this context
    // This ensures they are accessible via {{helpers.functionName}} syntax
    for (const [helperName, helperFunction] of Object.entries(templateHelpers)) {
      if (!this.registeredHelpers.has(helperName)) {
        this.handlebars.registerHelper(helperName, helperFunction as HelperDelegate);
        this.registeredHelpers.add(helperName);
      }
    }

    return context;
  }

  /**
   * Create a proxy that safely handles missing nested properties
   */
  private createSafeDataProxy(data: any): any {
    if (data === null || data === undefined) {
      return this.createEmptyProxy();
    }

    if (typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.createSafeDataProxy(item));
    }

    return new Proxy(data, {
      get: (target, prop) => {
        if (prop in target) {
          const value = target[prop];
          if (typeof value === 'object' && value !== null) {
            return this.createSafeDataProxy(value);
          }
          return value;
        }

        // Return a proxy that will handle further nested access
        if (this.config.logMissingVariables) {
          this.logger.warn(`Missing property '${String(prop)}' in template data`);
        }

        return this.createEmptyProxy();
      }
    });
  }

  /**
   * Create a proxy that returns empty values for any property access
   */
  private createEmptyProxy(): any {
    return new Proxy({}, {
      get: (target, prop) => {
        if (prop === 'toString' || prop === 'valueOf') {
          return () => this.config.missingVariableDefault;
        }

        if (prop === Symbol.toPrimitive) {
          return () => this.config.missingVariableDefault;
        }

        if (prop === 'toHTML') {
          return () => this.config.missingVariableDefault;
        }

        // For any other property access, return another empty proxy
        return this.createEmptyProxy();
      }
    });
  }

  /**
   * Get translations for the specified locale
   */
  private getTranslationsForLocale(locale: 'en' | 'vi'): Record<string, string> {
    // Use the EmailTranslationService to get comprehensive translations
    return this.emailTranslationService.getEmailTemplateTranslations(locale);
  }

  /**
   * Get design system tokens
   */
  private getDesignTokens(): any {
    return this.designSystemInjector.getDesignTokens();
  }

  /**
   * Get template helper functions
   */
  private getTemplateHelpers(locale: 'en' | 'vi'): {
    formatCurrency: (amount: number, locale: string) => string;
    formatDate: (date: string, locale: string) => string;
    getStatusText: (status: string, locale: string) => string;
    [key: string]: Function;
  } {
    return {
      formatCurrency: (amount: number, currency: string = 'VND') => {
        if (typeof amount !== 'number') return '';

        if (locale === 'vi') {
          return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: currency
          }).format(amount);
        } else {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency === 'VND' ? 'USD' : currency
          }).format(amount);
        }
      },

      formatDate: (date: string | Date) => {
        if (!date) return '';

        const dateObj = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(dateObj.getTime())) return '';

        if (locale === 'vi') {
          return dateObj.toLocaleDateString('vi-VN');
        } else {
          return dateObj.toLocaleDateString('en-US');
        }
      },

      getStatusText: (status: string, statusLocale: string = locale) => {
        return this.getStatusText(status, statusLocale as 'en' | 'vi');
      }
    };
  }





  /**
   * Get localized status text
   */
  private getStatusText(status: string, locale: 'en' | 'vi'): string {
    const statusTranslations = this.emailTranslationService.getStatusTranslations(locale);
    return statusTranslations[status.toLowerCase()] || status;
  }

  /**
   * Generate a unique key for template caching
   */
  private generateTemplateKey(template: string): string {
    // Simple hash function for template caching
    let hash = 0;
    for (let i = 0; i < template.length; i++) {
      const char = template.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }







  /**
   * Initialize partial templates asynchronously after service construction
   */
  private initializePartialTemplates(): void {
    // Use setImmediate to register partials after constructor completes
    setImmediate(async () => {
      try {
        await this.registerPartialTemplates();
      } catch (error) {
        this.logger.error(`Failed to initialize partial templates: ${error.message}`);
        // Don't throw here as it would be unhandled - log the error instead
      }
    });
  }

  /**
   * Register partial templates with Handlebars for use in main templates
   */
  private async registerPartialTemplates(): Promise<void> {
    try {
      // List of partial templates to register with their organized paths
      const partialTemplates = [
        'layout/email-header',
        'layout/email-footer',
        'cards/address-card',
        'forms/button',
        'ui/status-badge'
      ];

      this.logger.debug('Starting partial template registration');

      for (const partialPath of partialTemplates) {
        // Extract the simple name from the path for registration
        const partialName = partialPath.split('/').pop();

        // Ensure partialName is not undefined
        if (!partialName) {
          throw new PartialTemplateError(
            partialPath,
            `Invalid partial path: ${partialPath}`
          );
        }

        try {
          // Check if partial exists before loading
          if (!this.templateLoaderService.partialExists(partialPath)) {
            const expectedPath = this.templateLoaderService.getPartialPath(partialPath);
            throw new PartialTemplateError(
              partialName,
              `Partial template '${partialName}' not found at expected path: ${expectedPath}`,
              expectedPath
            );
          }

          // Load partial content
          const partialContent = await this.templateLoaderService.loadPartial(partialPath);

          // Validate partial content is not empty
          if (!partialContent || partialContent.trim().length === 0) {
            throw new PartialTemplateError(
              partialName,
              `Partial template '${partialName}' is empty or contains only whitespace`
            );
          }

          // Validate partial template HTML structure and content
          try {
            PartialTemplateValidator.validatePartialTemplate(partialName, partialContent);
            this.logger.debug(`Partial template '${partialName}' passed validation`);
          } catch (error) {
            if (error instanceof TemplateValidationError) {
              // Re-throw as PartialTemplateError for consistency
              throw new PartialTemplateError(
                partialName,
                `Validation failed: ${error.message}`
              );
            }
            throw error;
          }

          // Validate expected parameters are present
          const expectedParams = PartialTemplateValidator.getExpectedParameters(partialName);
          const paramErrors = PartialTemplateValidator.validatePartialParameters(
            partialName,
            partialContent,
            expectedParams
          );

          if (paramErrors.length > 0) {
            this.logger.warn(`Partial template '${partialName}' parameter validation warnings: ${paramErrors.join(', ')}`);
            // Log warnings but don't fail - some parameters might be optional
          }

          // Register with Handlebars using the simple name
          this.handlebars.registerPartial(partialName, partialContent);

          this.logger.debug(`Registered partial template: ${partialName} from ${partialPath}`);
        } catch (error) {
          // Use enhanced error handling
          const partialError = this.handlePartialRegistrationError(partialName, error);
          throw partialError;
        }
      }

      this.logger.log(`Successfully registered ${partialTemplates.length} partial templates`);
    } catch (error) {
      this.logger.error(`Failed to register partial templates: ${error.message}`);
      throw error;
    }
  }

  /**
   * Format currency for display
   */
  private formatCurrency(amount: number, locale: string): string {
    if (typeof amount !== 'number') return '';

    if (locale === 'vi') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(amount);
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    }
  }

  /**
   * Validate a specific partial template
   * @param partialName - Name of the partial template to validate
   * @throws PartialTemplateError if validation fails
   */
  async validatePartialTemplate(partialName: string): Promise<void> {
    try {
      // Check if partial exists
      if (!this.templateLoaderService.partialExists(partialName)) {
        const expectedPath = this.templateLoaderService.getPartialPath(partialName);
        throw new PartialTemplateError(
          partialName,
          `Partial template '${partialName}' not found at expected path: ${expectedPath}`,
          expectedPath
        );
      }

      // Load partial content
      const partialContent = await this.templateLoaderService.loadPartial(partialName);

      // Validate using the validator utility
      PartialTemplateValidator.validatePartialTemplate(partialName, partialContent);

      this.logger.debug(`Partial template '${partialName}' validation successful`);
    } catch (error) {
      if (error instanceof TemplateValidationError) {
        throw new PartialTemplateError(
          partialName,
          `Validation failed: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Validate all registered partial templates
   * @returns Array of validation results for each partial
   */
  async validateAllPartialTemplates(): Promise<Array<{ partialName: string; isValid: boolean; error?: string }>> {
    const partialTemplates = [
      'email-header',
      'email-footer',
      'address-card',
      'button',
      'status-badge'
    ];

    const results: Array<{ partialName: string; isValid: boolean; error?: string }> = [];

    for (const partialName of partialTemplates) {
      try {
        await this.validatePartialTemplate(partialName);
        results.push({ partialName, isValid: true });
      } catch (error) {
        results.push({
          partialName,
          isValid: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Validate CSS component files
   * @param componentName - Name of the CSS component to validate
   * @param throwOnError - Whether to throw error or just log warnings (default: false)
   */
  async validateCSSComponent(componentName: string, throwOnError: boolean = false): Promise<string[]> {
    try {
      // Get CSS content from the CSS injector service
      const cssContent = await this.getCSSComponentContent(componentName);

      // Validate using the CSS validator utility
      const validationErrors = CSSComponentValidator.validateCSSComponent(
        componentName,
        cssContent,
        throwOnError
      );

      if (validationErrors.length === 0) {
        this.logger.debug(`CSS component '${componentName}' validation successful`);
      }

      return validationErrors;
    } catch (error) {
      const errorMessage = `Failed to validate CSS component '${componentName}': ${error.message}`;

      if (throwOnError) {
        this.logger.error(errorMessage);
        throw error;
      } else {
        this.logger.warn(errorMessage);
        return [error.message];
      }
    }
  }

  /**
   * Validate all CSS component files
   * @returns Array of validation results for each component
   */
  async validateAllCSSComponents(): Promise<Array<{ componentName: string; isValid: boolean; warnings: string[] }>> {
    const cssComponents = ['layout', 'buttons', 'badges', 'cards'];
    const results: Array<{ componentName: string; isValid: boolean; warnings: string[] }> = [];

    for (const componentName of cssComponents) {
      try {
        const warnings = await this.validateCSSComponent(componentName, false);
        results.push({
          componentName,
          isValid: warnings.length === 0,
          warnings
        });
      } catch (error) {
        results.push({
          componentName,
          isValid: false,
          warnings: [error.message]
        });
      }
    }

    return results;
  }

  /**
   * Get CSS component content (helper method)
   * This method loads CSS content from component files
   */
  private async getCSSComponentContent(componentName: string): Promise<string> {
    try {
      // Map component name to organized CSS file path
      const componentPathMap: Record<string, string> = {
        'layout': 'components/layout/layout.css',
        'buttons': 'components/forms/buttons.css',
        'badges': 'components/ui/badges.css',
        'cards': 'components/cards/cards.css'
      };

      const cssFileName = componentPathMap[componentName] || `components/${componentName}.css`;

      // Use the CSS injector service to load the component CSS file
      const cssContent = await this.cssInjectorService.loadCSSFile(cssFileName);

      return cssContent;
    } catch (error) {
      // If the component CSS file doesn't exist, return a minimal placeholder
      // This allows validation to proceed and provide appropriate warnings
      this.logger.warn(`CSS component file '${componentName}.css' not found: ${error.message}`);
      return `/* CSS component: ${componentName} - file not found */`;
    }
  }

  /**
   * Check if an error is related to partial template rendering
   */
  private isPartialTemplateError(error: any): boolean {
    if (!error || !error.message) {
      return false;
    }

    const errorMessage = error.message.toLowerCase();

    // Check for common partial template error patterns
    const partialErrorPatterns = [
      'partial',
      'missing partial',
      'could not find partial',
      'partial not found',
      'unknown partial',
      'email-header',
      'email-footer',
      'address-card',
      'button',
      'status-badge'
    ];

    return partialErrorPatterns.some(pattern => errorMessage.includes(pattern));
  }

  /**
   * Extract partial name from error message
   */
  private extractPartialNameFromError(error: any): string {
    if (!error || !error.message) {
      return 'unknown';
    }

    const errorMessage = error.message;

    // Try to extract partial name from common error message patterns
    const partialNamePatterns = [
      /partial\s+["']([^"']+)["']/i,
      /partial\s+([a-zA-Z0-9\-_]+)/i,
      /["']([a-zA-Z0-9\-_]+)["']\s+partial/i,
      /(email-header|email-footer|address-card|button|status-badge)/i
    ];

    for (const pattern of partialNamePatterns) {
      const match = errorMessage.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return 'unknown';
  }

  /**
   * Enhanced error handling for partial template registration
   */
  private handlePartialRegistrationError(partialName: string, error: any): PartialTemplateError {
    const errorDetails = {
      partialName,
      originalError: error.message,
      errorType: error.constructor.name,
      timestamp: new Date().toISOString()
    };

    this.logger.error(
      `Partial template registration failed - Details: ${JSON.stringify(errorDetails)}`,
      error.stack
    );

    if (error instanceof PartialTemplateError) {
      return error;
    }

    return new PartialTemplateError(
      partialName,
      `Registration failed: ${error.message}`
    );
  }

  /**
   * Log detailed information about partial template rendering failures
   */
  private logPartialRenderingError(partialName: string, error: any, context?: any): void {
    const errorDetails = {
      partialName,
      errorMessage: error.message,
      errorType: error.constructor.name,
      timestamp: new Date().toISOString(),
      contextKeys: context ? Object.keys(context) : [],
      stackTrace: error.stack
    };

    this.logger.error(
      `Partial template rendering error - Partial: '${partialName}' failed to render`,
      JSON.stringify(errorDetails, null, 2)
    );

    // Log additional context if available
    if (context) {
      this.logger.debug(
        `Partial template context for '${partialName}': ${JSON.stringify(context, null, 2)}`
      );
    }
  }

  /**
   * Validate partial template context before rendering
   */
  private validatePartialContext(partialName: string, context: any): string[] {
    const warnings: string[] = [];
    const expectedParams = PartialTemplateValidator.getExpectedParameters(partialName);

    for (const param of expectedParams) {
      if (context[param] === undefined || context[param] === null) {
        warnings.push(`Missing expected parameter '${param}' for partial '${partialName}'`);
      }
    }

    if (warnings.length > 0) {
      this.logger.warn(
        `Partial template context validation warnings for '${partialName}': ${warnings.join(', ')}`
      );
    }

    return warnings;
  }
}