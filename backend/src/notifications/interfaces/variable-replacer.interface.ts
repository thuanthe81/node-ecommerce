/**
 * Interface for processing templates with Handlebars.js and replacing variables with actual data.
 * Supports variable replacement, conditional sections, array iteration, and custom helpers.
 */
export interface IVariableReplacer {
  /**
   * Replace variables in a template with actual data using Handlebars.js.
   * Supports nested object access, conditionals, and iteration.
   *
   * @param template - HTML template string with Handlebars placeholders
   * @param data - Data object containing values for template variables
   * @param locale - Locale for localized content ('en' | 'vi')
   * @returns Promise resolving to processed HTML with variables replaced
   * @throws TemplateCompilationError if template has syntax errors
   * @throws TemplateRuntimeError if template execution fails
   */
  replaceVariables(
    template: string,
    data: any,
    locale: 'en' | 'vi'
  ): Promise<string>;

  /**
   * Register a custom Handlebars helper function.
   * Helpers can be used in templates for custom formatting and logic.
   *
   * @param name - Name of the helper (used in templates as {{helperName}})
   * @param helper - Helper function implementation
   */
  registerHelper(name: string, helper: Function): void;

  /**
   * Register multiple helpers at once.
   *
   * @param helpers - Object mapping helper names to functions
   */
  registerHelpers(helpers: Record<string, Function>): void;

  /**
   * Compile a template string into a reusable template function.
   * Useful for templates that will be used multiple times.
   *
   * @param template - Template string to compile
   * @returns Compiled template function
   */
  compileTemplate(template: string): HandlebarsTemplateDelegate;

  /**
   * Get list of registered helper names.
   *
   * @returns Array of helper names
   */
  getRegisteredHelpers(): string[];
}

/**
 * Template context data structure passed to templates
 */
export interface TemplateContext {
  /** Original data (OrderEmailData, AdminOrderEmailData, etc.) */
  data: any;

  /** Locale-specific translations */
  translations: Record<string, string>;

  /** Current locale */
  locale: 'en' | 'vi';

  /** Design system tokens */
  designTokens: {
    colors: any;
    typography: any;
    spacing: any;
    [key: string]: any;
  };

  /** Utility functions available in templates */
  helpers: {
    formatCurrency: (amount: number, locale: string) => string;
    formatDate: (date: string, locale: string) => string;
    generateButton: (text: string, url: string, style: string) => string;
    generateStatusBadge: (status: string, locale: string) => string;
    [key: string]: Function;
  };
}

/**
 * Configuration for VariableReplacer
 */
export interface VariableReplacerConfig {
  /** Whether to enable HTML escaping by default */
  escapeHtml: boolean;

  /** Whether to log warnings for missing variables */
  logMissingVariables: boolean;

  /** Default value for missing variables */
  missingVariableDefault: string;

  /** Whether to enable strict mode (throw on missing variables) */
  strictMode: boolean;
}

/**
 * Handlebars template delegate type
 */
export type HandlebarsTemplateDelegate = (context: any) => string;