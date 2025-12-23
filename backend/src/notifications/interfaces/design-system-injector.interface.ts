/**
 * Interface for injecting design system tokens, CSS styles, and components into templates.
 * Maintains compatibility with existing design system while supporting template-based emails.
 */
export interface IDesignSystemInjector {
  /**
   * Inject design system CSS and tokens into a template.
   * Adds CSS styles and makes design tokens available as template variables.
   *
   * @param template - HTML template string
   * @returns Template with design system CSS and tokens injected
   */
  injectDesignSystem(template: string): string;

  /**
   * Generate complete CSS from design tokens.
   * Includes base styles, responsive breakpoints, and email client fallbacks.
   *
   * @returns CSS string with all design system styles
   */
  generateCSS(): string;

  /**
   * Generate CSS for modern button styles.
   *
   * @returns CSS string for button components
   */
  generateButtonStyles(): string;

  /**
   * Generate CSS for status badge styles.
   *
   * @returns CSS string for status badge components
   */
  generateStatusBadgeStyles(): string;

  /**
   * Generate CSS for responsive layout styles.
   *
   * @returns CSS string for responsive email layouts
   */
  generateResponsiveStyles(): string;

  /**
   * Generate CSS for dark mode support.
   *
   * @returns CSS string for dark mode styles
   */
  generateDarkModeStyles(): string;

  /**
   * Get design tokens as template variables.
   * Returns design tokens in a format suitable for template context.
   *
   * @returns Object containing design token values
   */
  getDesignTokens(): DesignTokens;

  /**
   * Generate HTML for a modern button component.
   *
   * @param text - Button text
   * @param url - Button URL
   * @param style - Button style ('primary' | 'secondary' | 'success' | 'warning' | 'danger')
   * @returns HTML string for button component
   */
  generateButton(text: string, url: string, style: string): string;

  /**
   * Generate HTML for a status badge component.
   *
   * @param status - Status value
   * @param locale - Locale for status text
   * @returns HTML string for status badge component
   */
  generateStatusBadge(status: string, locale: 'en' | 'vi'): string;
}

/**
 * Design tokens structure for templates
 */
export interface DesignTokens {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    danger: string;
    light: string;
    dark: string;
    background: string;
    text: string;
    border: string;
    [key: string]: string;
  };

  typography: {
    fontFamily: string;
    fontSize: {
      small: string;
      medium: string;
      large: string;
      xlarge: string;
      [key: string]: string;
    };
    fontWeight: {
      normal: string;
      bold: string;
      [key: string]: string;
    };
    lineHeight: {
      normal: string;
      tight: string;
      loose: string;
      [key: string]: string;
    };
  };

  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
    [key: string]: string;
  };

  breakpoints: {
    mobile: string;
    tablet: string;
    desktop: string;
    [key: string]: string;
  };

  borderRadius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    full: string;
    [key: string]: string;
  };

  shadows: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    [key: string]: string;
  };
}

/**
 * Configuration for DesignSystemInjector
 */
export interface DesignSystemInjectorConfig {
  /** Whether to include responsive styles */
  includeResponsive: boolean;

  /** Whether to include dark mode styles */
  includeDarkMode: boolean;

  /** Whether to include accessibility enhancements */
  includeAccessibility: boolean;

  /** Whether to include email client fallbacks */
  includeEmailClientFallbacks: boolean;

  /** Custom CSS to inject */
  customCSS?: string;
}