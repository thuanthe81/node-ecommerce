import { join } from 'path';
import {
  TemplateLoaderConfig,
  VariableReplacerConfig,
  DesignSystemInjectorConfig,
  CSSInjectorConfig
} from '../interfaces';

/**
 * Get the correct templates path based on whether we're in development or production
 */
function getTemplatesPath(): string {
  if (process.env.NODE_ENV === 'production') {
    // In production, templates are copied to dist/notifications/templates by NestJS assets
    return join(process.cwd(), 'dist', 'notifications', 'templates');
  } else {
    // In development, use the source templates directory
    // Use process.cwd() to get the project root, then navigate to source templates
    return join(process.cwd(), 'src', 'notifications', 'templates');
  }
}

/**
 * Get the correct styles path based on whether we're in development or production
 */
function getStylesPath(): string {
  if (process.env.NODE_ENV === 'production') {
    // In production, styles are copied to dist/notifications/styles by NestJS assets
    return join(process.cwd(), 'dist', 'notifications', 'styles');
  } else {
    // In development, use the source styles directory
    // Use process.cwd() to get the project root, then navigate to source styles
    return join(process.cwd(), 'src', 'notifications', 'styles');
  }
}

/**
 * Default configuration for the email template system
 */
export const DEFAULT_TEMPLATE_SYSTEM_CONFIG = {
  templateLoader: {
    templatesPath: getTemplatesPath(),
    isDevelopment: process.env.NODE_ENV === 'development',
    templateExtension: '.html',
    enableCaching: true
  } as TemplateLoaderConfig,

  variableReplacer: {
    escapeHtml: true,
    logMissingVariables: true,
    missingVariableDefault: '',
    strictMode: false
  } as VariableReplacerConfig,

  designSystemInjector: {
    includeResponsive: true,
    includeDarkMode: true,
    includeAccessibility: true,
    includeEmailClientFallbacks: true
  } as DesignSystemInjectorConfig,

  cssInjector: {
    stylesPath: getStylesPath(),
    isDevelopment: process.env.NODE_ENV === 'development',
    minifyCSS: process.env.NODE_ENV === 'production',
    includeFallbacks: true
  } as CSSInjectorConfig
};

/**
 * Template file names mapping
 */
export const TEMPLATE_NAMES = {
  ORDER_CONFIRMATION: 'template-order-confirmation',
  ADMIN_ORDER_NOTIFICATION: 'template-admin-order-notification',
  SHIPPING_NOTIFICATION: 'template-shipping-notification',
  ORDER_STATUS_UPDATE: 'template-order-status-update',
  WELCOME_EMAIL: 'template-welcome-email',
  PASSWORD_RESET: 'template-password-reset'
} as const;

/**
 * Template subdirectories
 */
export const TEMPLATE_DIRECTORIES = {
  ORDERS: 'orders',
  AUTH: 'auth',
  SHARED: 'shared',
  PARTIALS: 'shared/partials',
  LAYOUTS: 'shared/layouts'
} as const;

/**
 * Get full template path including subdirectory
 */
export function getTemplateFilePath(templateName: string, subdirectory?: string): string {
  const basePath = DEFAULT_TEMPLATE_SYSTEM_CONFIG.templateLoader.templatesPath;
  const fileName = `${templateName}${DEFAULT_TEMPLATE_SYSTEM_CONFIG.templateLoader.templateExtension}`;

  if (subdirectory) {
    return join(basePath, subdirectory, fileName);
  }

  return join(basePath, fileName);
}

/**
 * Validate template system configuration
 */
export function validateTemplateSystemConfig(config: any): void {
  if (!config.templateLoader?.templatesPath) {
    throw new Error('Template loader configuration must include templatesPath');
  }

  if (typeof config.templateLoader.isDevelopment !== 'boolean') {
    throw new Error('Template loader isDevelopment must be a boolean');
  }

  if (typeof config.variableReplacer?.escapeHtml !== 'boolean') {
    throw new Error('Variable replacer escapeHtml must be a boolean');
  }
}