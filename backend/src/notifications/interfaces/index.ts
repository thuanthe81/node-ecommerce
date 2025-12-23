/**
 * Email Template System Interfaces
 *
 * This module exports all interfaces and types for the email template file system.
 * These interfaces define the contracts for template loading, variable replacement,
 * and design system integration components.
 */

// Template Loader interfaces
export type {
  ITemplateLoader,
  TemplateLoaderConfig
} from './template-loader.interface';

// Variable Replacer interfaces
export type {
  IVariableReplacer,
  TemplateContext,
  VariableReplacerConfig,
  HandlebarsTemplateDelegate
} from './variable-replacer.interface';

// Design System Injector interfaces
export type {
  IDesignSystemInjector,
  DesignTokens,
  DesignSystemInjectorConfig
} from './design-system-injector.interface';

// CSS Injector interfaces
export type {
  ICSSInjector,
  CSSInjectorConfig
} from './css-injector.interface';

export {
  CSSLoadError,
  CSSValidationError
} from './css-injector.interface';

// Error classes
export {
  TemplateError,
  TemplateNotFoundError,
  TemplateLoadError,
  TemplateValidationError,
  TemplateCompilationError,
  TemplateRuntimeError,
  TemplateDirectoryError,
  MissingVariableError,
  DesignSystemInjectionError
} from '../errors/template-errors';

// Re-export existing email data interfaces for convenience
// Note: These will be imported from the existing service during implementation
export type {
  OrderEmailData,
  AdminOrderEmailData,
  UserEmailData
} from '../services/email-template.service';