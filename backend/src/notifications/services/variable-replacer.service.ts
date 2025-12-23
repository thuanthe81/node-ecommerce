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
  MissingVariableError
} from '../errors/template-errors';
import { EmailHandlebarsHelpers } from '../helpers/email-handlebars-helpers';
import { DesignSystemInjector } from './design-system-injector.service';
import { EmailTranslationService } from './email-translation.service';

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
    @Inject('VariableReplacerConfig') private readonly config: VariableReplacerConfig
  ) {
    // Create isolated Handlebars instance to avoid global pollution
    this.handlebars = Handlebars.create();
    this.setupHandlebarsConfiguration();
    this.registerDefaultHelpers();
    this.registerEmailHelpers();
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

      // Execute template with context
      const result = compiledTemplate(context);

      this.logger.debug(`Successfully processed template for locale: ${locale}`);
      return result;

    } catch (error) {
      this.logger.error(`Failed to replace variables in template: ${error.message}`, error.stack);

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

    // Email header helper
    this.registerHelper('emailHeader', () => {
      return new this.handlebars.SafeString(this.generateEmailHeader());
    });

    // Email footer helper
    this.registerHelper('emailFooter', () => {
      return new this.handlebars.SafeString(this.generateEmailFooter());
    });

    // Address card helper
    this.registerHelper('generateAddressCard', (address: any, title: string, locale: string) => {
      return new this.handlebars.SafeString(this.generateAddressCard(address, title, locale));
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
      generateButton: templateHelpers.generateButton,
      generateStatusBadge: templateHelpers.generateStatusBadge,
      generateAddressCard: templateHelpers.generateAddressCard,
      // Add admin URL for button generation
      adminUrl: process.env.ADMIN_URL || 'https://admin.alacraft.com'
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
    generateButton: (text: string, url: string, style: string) => string;
    generateStatusBadge: (status: string, locale: string) => string;
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

      generateButton: (text: string, url: string, style: string = 'primary') => {
        const buttonStyles = this.getButtonStyles(style);
        return `<a href="${url}" style="${buttonStyles}">${this.htmlEscapingService.escapeHtmlContent(text)}</a>`;
      },

      generateStatusBadge: (status: string, badgeLocale: string = locale) => {
        const badgeStyles = this.getStatusBadgeStyles(status);
        const statusText = this.getStatusText(status, badgeLocale as 'en' | 'vi');
        return `<span style="${badgeStyles}">${this.htmlEscapingService.escapeHtmlContent(statusText)}</span>`;
      },

      generateAddressCard: (address: any, title: string, cardLocale: string = locale) => {
        return this.generateAddressCard(address, title, cardLocale);
      }
    };
  }

  /**
   * Get button styles based on button type
   */
  private getButtonStyles(style: string): string {
    const baseStyles = 'display: inline-block; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; text-align: center;';

    const styleMap: Record<string, string> = {
      primary: `${baseStyles} background-color: #007bff; color: white;`,
      secondary: `${baseStyles} background-color: #6c757d; color: white;`,
      success: `${baseStyles} background-color: #28a745; color: white;`,
      danger: `${baseStyles} background-color: #dc3545; color: white;`
    };

    return styleMap[style] || styleMap.primary;
  }

  /**
   * Get status badge styles based on status
   */
  private getStatusBadgeStyles(status: string): string {
    const baseStyles = 'display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;';

    const statusMap: Record<string, string> = {
      pending: `${baseStyles} background-color: #ffc107; color: #212529;`,
      confirmed: `${baseStyles} background-color: #28a745; color: white;`,
      shipped: `${baseStyles} background-color: #17a2b8; color: white;`,
      delivered: `${baseStyles} background-color: #28a745; color: white;`,
      cancelled: `${baseStyles} background-color: #dc3545; color: white;`
    };

    return statusMap[status] || statusMap.pending;
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
   * Generate email header HTML
   */
  private generateEmailHeader(): string {
    return `
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="
          color: #2c3e50;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 28px;
          font-weight: 600;
          margin: 0;
          text-decoration: none;
        ">AlaCraft</h1>
        <p style="
          color: #7f8c8d;
          font-size: 14px;
          margin: 8px 0 0 0;
          font-style: italic;
        ">Handcrafted with care</p>
      </div>
    `;
  }

  /**
   * Generate email footer HTML
   */
  private generateEmailFooter(): string {
    const currentYear = new Date().getFullYear();
    return `
      <div style="
        text-align: center;
        color: #7f8c8d;
        font-size: 12px;
        line-height: 1.5;
        margin-top: 32px;
        padding-top: 24px;
        border-top: 1px solid #ecf0f1;
      ">
        <p style="margin: 0 0 8px 0;">
          © ${currentYear} AlaCraft. All rights reserved.
        </p>
        <p style="margin: 0 0 8px 0;">
          <a href="mailto:support@alacraft.com" style="color: #3498db; text-decoration: none;">support@alacraft.com</a>
          |
          <a href="https://alacraft.com" style="color: #3498db; text-decoration: none;">alacraft.com</a>
        </p>
        <p style="margin: 0; font-size: 11px; color: #95a5a6;">
          This email was sent to you because you have an account with AlaCraft.
        </p>
      </div>
    `;
  }

  /**
   * Generate address card HTML
   */
  private generateAddressCard(address: any, title: string, locale: string): string {
    if (!address) return '';

    const addressLines = [];
    if (address.fullName) addressLines.push(address.fullName);
    if (address.phone) addressLines.push(address.phone);
    if (address.addressLine1) addressLines.push(address.addressLine1);
    if (address.addressLine2) addressLines.push(address.addressLine2);

    const cityStateZip = [];
    if (address.city) cityStateZip.push(address.city);
    if (address.state) cityStateZip.push(address.state);
    if (address.postalCode) cityStateZip.push(address.postalCode);
    if (cityStateZip.length > 0) addressLines.push(cityStateZip.join(', '));

    if (address.country) addressLines.push(address.country);

    return `
      <div style="
        background-color: #f8f9fa;
        padding: 20px;
        margin: 16px 0;
        border-radius: 8px;
        border-left: 4px solid #3498db;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      ">
        <h3 style="
          margin-top: 0;
          color: #2c3e50;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 16px;
          font-weight: 600;
        ">${this.htmlEscapingService.escapeHtmlContent(title)}</h3>
        <div style="
          color: #34495e;
          font-size: 14px;
          line-height: 1.5;
        ">
          ${addressLines.map(line =>
            `<div style="margin-bottom: 4px;">${this.htmlEscapingService.escapeHtmlContent(line)}</div>`
          ).join('')}
        </div>
      </div>
    `;
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
}