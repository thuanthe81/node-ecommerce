/**
 * Design System Injector Service
 *
 * This service is responsible for injecting design system tokens, CSS styles,
 * and components into email templates. It extracts CSS generation from the
 * existing email-design-tokens and maintains compatibility with existing
 * button and badge generators.
 */

import {
  MODERN_EMAIL_STYLES,
  MODERN_BUTTON_STYLES,
  STATUS_BADGE_STYLES,
  EMAIL_CLIENT_FALLBACKS,
  DARK_MODE_COLORS,
  ACCESSIBILITY_STANDARDS,
  RESPONSIVE_BREAKPOINTS,
  ModernEmailStyles,
  ModernButtonStyle,
  StatusBadgeStyle,
  ResponsiveBreakpoints
} from './email-design-tokens';
import { ModernButtonGenerator, ButtonStyleType } from './email-button-generators';
import { StatusBadgeGenerator } from './email-status-badge-generators';
import { IDesignSystemInjector, DesignTokens } from '../interfaces/design-system-injector.interface';
import { DesignSystemInjectionError } from '../errors/template-errors';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class DesignSystemInjector implements IDesignSystemInjector {
  private readonly logger = new Logger(DesignSystemInjector.name);

  /**
   * Inject design system CSS and tokens into a template
   *
   * @param template - The HTML template string
   * @returns Template with design system CSS and tokens injected
   */
  injectDesignSystem(template: string): string {
    try {
      // Generate the complete CSS for the email
      const designSystemCSS = this.generateCSS();

      // Replace the design system CSS placeholder
      let processedTemplate = template.replace('{{{designSystemCSS}}}', designSystemCSS);

      // Make design tokens available as template variables
      processedTemplate = this.injectDesignTokens(processedTemplate);

      return processedTemplate;
    } catch (error) {
      this.logger.error(`Failed to inject design system: ${error.message}`);
      throw new DesignSystemInjectionError('unknown', error.message);
    }
  }

  /**
   * Generate complete CSS for email templates
   *
   * @returns Complete CSS string with all design system styles
   */
  generateCSS(): string {
    const baseCSS = this.generateBaseCSS();
    const buttonCSS = this.generateButtonStyles();
    const badgeCSS = this.generateStatusBadgeStyles();
    const responsiveCSS = this.generateResponsiveCSS();
    const darkModeCSS = this.generateDarkModeCSS();
    const accessibilityCSS = this.generateAccessibilityCSS();
    const emailClientFallbacks = this.generateEmailClientFallbacks();

    return `
      ${baseCSS}
      ${buttonCSS}
      ${badgeCSS}
      ${responsiveCSS}
      ${darkModeCSS}
      ${accessibilityCSS}
      ${emailClientFallbacks}
    `;
  }

  /**
   * Generate button styles CSS
   *
   * @returns CSS string for button styles
   */
  generateButtonStyles(): string {
    return `
      /* Modern Button Styles */
      .btn {
        display: inline-block;
        text-decoration: none;
        font-family: ${MODERN_EMAIL_STYLES.typography.fontFamily};
        font-weight: 600;
        text-align: center;
        vertical-align: middle;
        cursor: pointer;
        border: none;
        outline: none;
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
        padding: ${MODERN_EMAIL_STYLES.spacing.md} ${MODERN_EMAIL_STYLES.spacing.xl};
        font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
        min-height: ${ACCESSIBILITY_STANDARDS.minTouchTarget};
        line-height: 1.2;
        box-sizing: border-box;
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
        mso-style-priority: 99;
      }

      .btn-primary {
        background: linear-gradient(135deg, ${MODERN_EMAIL_STYLES.colors.primary} 0%, ${MODERN_EMAIL_STYLES.colors.secondary} 100%);
        color: #ffffff;
        box-shadow: ${MODERN_EMAIL_STYLES.shadows.medium};
      }

      .btn-secondary {
        background: ${MODERN_EMAIL_STYLES.colors.cardBackground};
        color: ${MODERN_EMAIL_STYLES.colors.primary};
        border: 2px solid ${MODERN_EMAIL_STYLES.colors.border};
        box-shadow: ${MODERN_EMAIL_STYLES.shadows.subtle};
      }

      .btn-success {
        background: linear-gradient(135deg, ${MODERN_EMAIL_STYLES.colors.success} 0%, #2ecc71 100%);
        color: #ffffff;
        box-shadow: ${MODERN_EMAIL_STYLES.shadows.medium};
      }

      .btn-warning {
        background: linear-gradient(135deg, ${MODERN_EMAIL_STYLES.colors.warning} 0%, #e67e22 100%);
        color: #ffffff;
        box-shadow: ${MODERN_EMAIL_STYLES.shadows.medium};
      }

      .btn-link {
        background: transparent;
        color: ${MODERN_EMAIL_STYLES.colors.secondary};
        text-decoration: underline;
        border: none;
        box-shadow: none;
        padding: 0;
        min-height: auto;
      }

      .btn-full-width {
        width: 100%;
        display: block;
      }

      .btn-small {
        padding: ${MODERN_EMAIL_STYLES.spacing.sm} ${MODERN_EMAIL_STYLES.spacing.md};
        font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body};
        min-height: 36px;
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.small};
      }

      .btn-large {
        padding: ${MODERN_EMAIL_STYLES.spacing.lg} ${MODERN_EMAIL_STYLES.spacing.xxl};
        font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.heading};
        min-height: 52px;
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.large};
      }

      /* Outlook-specific button fixes */
      .outlook-gradient {
        background: ${MODERN_EMAIL_STYLES.colors.primary} !important;
      }

      .outlook-rounded {
        border-radius: 0 !important;
      }

      .outlook-shadow {
        box-shadow: none !important;
      }
    `;
  }

  /**
   * Generate status badge styles CSS
   *
   * @returns CSS string for status badge styles
   */
  generateStatusBadgeStyles(): string {
    return `
      /* Status Badge Styles */
      .status-badge {
        display: inline-block;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.large};
        text-align: center;
        vertical-align: middle;
        padding: ${MODERN_EMAIL_STYLES.spacing.xs} ${MODERN_EMAIL_STYLES.spacing.md};
        font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
        line-height: 1.2;
      }

      .status-pending {
        background-color: ${MODERN_EMAIL_STYLES.colors.warning};
        color: #ffffff;
      }

      .status-processing {
        background-color: ${MODERN_EMAIL_STYLES.colors.secondary};
        color: #ffffff;
      }

      .status-shipped {
        background-color: #9b59b6;
        color: #ffffff;
      }

      .status-delivered {
        background-color: ${MODERN_EMAIL_STYLES.colors.success};
        color: #ffffff;
      }

      .status-cancelled {
        background-color: ${MODERN_EMAIL_STYLES.colors.accent};
        color: #ffffff;
      }

      .status-refunded {
        background-color: #95a5a6;
        color: #ffffff;
      }

      .status-paid {
        background-color: ${MODERN_EMAIL_STYLES.colors.success};
        color: #ffffff;
      }

      .status-failed {
        background-color: ${MODERN_EMAIL_STYLES.colors.accent};
        color: #ffffff;
      }

      .status-badge-small {
        padding: ${MODERN_EMAIL_STYLES.spacing.xs} ${MODERN_EMAIL_STYLES.spacing.sm};
        font-size: 10px;
      }

      .status-badge-large {
        padding: ${MODERN_EMAIL_STYLES.spacing.sm} ${MODERN_EMAIL_STYLES.spacing.lg};
        font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body};
      }
    `;
  }

  /**
   * Generate base CSS styles
   *
   * @private
   * @returns Base CSS string
   */
  private generateBaseCSS(): string {
    return `
      /* Base Email Styles */
      body {
        margin: 0;
        padding: 0;
        background-color: ${MODERN_EMAIL_STYLES.colors.background};
        font-family: ${MODERN_EMAIL_STYLES.typography.fontFamily};
        font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body};
        line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.normal};
        color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }

      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background-color: ${MODERN_EMAIL_STYLES.colors.cardBackground};
        padding: ${MODERN_EMAIL_STYLES.spacing.xl};
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
        box-shadow: ${MODERN_EMAIL_STYLES.shadows.subtle};
      }

      .email-header {
        text-align: center;
        margin-bottom: ${MODERN_EMAIL_STYLES.spacing.xl};
        padding-bottom: ${MODERN_EMAIL_STYLES.spacing.lg};
        border-bottom: 1px solid ${MODERN_EMAIL_STYLES.colors.border};
      }

      .email-content {
        margin-bottom: ${MODERN_EMAIL_STYLES.spacing.xl};
      }

      .email-footer {
        text-align: center;
        margin-top: ${MODERN_EMAIL_STYLES.spacing.xl};
        padding-top: ${MODERN_EMAIL_STYLES.spacing.lg};
        border-top: 1px solid ${MODERN_EMAIL_STYLES.colors.border};
        font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
        color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
      }

      h1, h2, h3, h4, h5, h6 {
        font-family: ${MODERN_EMAIL_STYLES.typography.headingFont};
        color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
        margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.md} 0;
        line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.tight};
      }

      h1 {
        font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.title};
      }

      h2 {
        font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.heading};
      }

      p {
        margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.md} 0;
        line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.normal};
      }

      a {
        color: ${MODERN_EMAIL_STYLES.colors.secondary};
        text-decoration: underline;
      }

      a:hover {
        color: ${MODERN_EMAIL_STYLES.colors.primary};
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin: ${MODERN_EMAIL_STYLES.spacing.md} 0;
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
        border-spacing: 0;
        border: 0;
      }

      td, th {
        padding: ${MODERN_EMAIL_STYLES.spacing.md};
        text-align: left;
        vertical-align: top;
        border-bottom: 1px solid ${MODERN_EMAIL_STYLES.colors.border};
        mso-line-height-rule: exactly;
      }

      th {
        background-color: ${MODERN_EMAIL_STYLES.colors.background};
        font-weight: 600;
        color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
      }

      img {
        max-width: 100%;
        height: auto;
        display: block;
        border: 0;
        outline: none;
        text-decoration: none;
        -ms-interpolation-mode: bicubic;
      }

      .text-center {
        text-align: center;
      }

      .text-left {
        text-align: left;
      }

      .text-right {
        text-align: right;
      }

      .mb-0 { margin-bottom: 0; }
      .mb-1 { margin-bottom: ${MODERN_EMAIL_STYLES.spacing.xs}; }
      .mb-2 { margin-bottom: ${MODERN_EMAIL_STYLES.spacing.sm}; }
      .mb-3 { margin-bottom: ${MODERN_EMAIL_STYLES.spacing.md}; }
      .mb-4 { margin-bottom: ${MODERN_EMAIL_STYLES.spacing.lg}; }
      .mb-5 { margin-bottom: ${MODERN_EMAIL_STYLES.spacing.xl}; }

      .mt-0 { margin-top: 0; }
      .mt-1 { margin-top: ${MODERN_EMAIL_STYLES.spacing.xs}; }
      .mt-2 { margin-top: ${MODERN_EMAIL_STYLES.spacing.sm}; }
      .mt-3 { margin-top: ${MODERN_EMAIL_STYLES.spacing.md}; }
      .mt-4 { margin-top: ${MODERN_EMAIL_STYLES.spacing.lg}; }
      .mt-5 { margin-top: ${MODERN_EMAIL_STYLES.spacing.xl}; }
    `;
  }

  /**
   * Generate responsive CSS for different screen sizes
   *
   * @private
   * @returns Responsive CSS string
   */
  private generateResponsiveCSS(): string {
    return `
      /* Responsive Styles */
      @media only screen and (${RESPONSIVE_BREAKPOINTS.mobile}) {
        .email-container {
          width: 100% !important;
          max-width: 100% !important;
          padding: ${MODERN_EMAIL_STYLES.spacing.md} !important;
          margin: 0 !important;
          border-radius: 0 !important;
        }

        .btn {
          width: 100% !important;
          display: block !important;
          margin-bottom: ${MODERN_EMAIL_STYLES.spacing.sm} !important;
        }

        h1 {
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.heading} !important;
        }

        h2 {
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large} !important;
        }

        .mobile-hide {
          display: none !important;
        }

        .mobile-center {
          text-align: center !important;
        }

        .mobile-full-width {
          width: 100% !important;
        }

        table {
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small} !important;
        }

        td, th {
          padding: ${MODERN_EMAIL_STYLES.spacing.sm} !important;
        }
      }

      @media only screen and (${RESPONSIVE_BREAKPOINTS.tablet}) {
        .email-container {
          padding: ${MODERN_EMAIL_STYLES.spacing.lg} !important;
        }

        .tablet-center {
          text-align: center !important;
        }

        .tablet-full-width {
          width: 100% !important;
        }
      }
    `;
  }

  /**
   * Generate dark mode CSS
   *
   * @private
   * @returns Dark mode CSS string
   */
  private generateDarkModeCSS(): string {
    return `
      /* Dark Mode Styles */
      @media (prefers-color-scheme: dark) {
        body {
          background-color: ${DARK_MODE_COLORS.background} !important;
          color: ${DARK_MODE_COLORS.textPrimary} !important;
        }

        .email-container {
          background-color: ${DARK_MODE_COLORS.cardBackground} !important;
          color: ${DARK_MODE_COLORS.textPrimary} !important;
        }

        h1, h2, h3, h4, h5, h6 {
          color: ${DARK_MODE_COLORS.textPrimary} !important;
        }

        p {
          color: ${DARK_MODE_COLORS.textPrimary} !important;
        }

        .email-footer {
          color: ${DARK_MODE_COLORS.textSecondary} !important;
          border-top-color: ${DARK_MODE_COLORS.border} !important;
        }

        .email-header {
          border-bottom-color: ${DARK_MODE_COLORS.border} !important;
        }

        a {
          color: ${DARK_MODE_COLORS.primary} !important;
        }

        a:hover {
          color: ${DARK_MODE_COLORS.linkHover} !important;
        }

        table {
          border-color: ${DARK_MODE_COLORS.border} !important;
        }

        td, th {
          border-bottom-color: ${DARK_MODE_COLORS.border} !important;
          color: ${DARK_MODE_COLORS.textPrimary} !important;
        }

        th {
          background-color: ${DARK_MODE_COLORS.surfaceVariant} !important;
        }

        .btn-primary {
          background: ${DARK_MODE_COLORS.primary} !important;
        }

        .btn-secondary {
          background-color: ${DARK_MODE_COLORS.cardBackground} !important;
          color: ${DARK_MODE_COLORS.primary} !important;
          border-color: ${DARK_MODE_COLORS.border} !important;
        }

        .btn-success {
          background: ${DARK_MODE_COLORS.success} !important;
        }

        .btn-warning {
          background: ${DARK_MODE_COLORS.warning} !important;
        }

        .btn-link {
          color: ${DARK_MODE_COLORS.primary} !important;
        }
      }
    `;
  }

  /**
   * Generate accessibility CSS
   *
   * @private
   * @returns Accessibility CSS string
   */
  private generateAccessibilityCSS(): string {
    return `
      /* Accessibility Styles */
      .sr-only {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      }

      .focus-visible:focus {
        ${ACCESSIBILITY_STANDARDS.focusIndicator}
      }

      /* High contrast mode support */
      @media (prefers-contrast: high) {
        .btn {
          border: 2px solid !important;
        }

        .btn-primary {
          border-color: #ffffff !important;
        }

        .btn-secondary {
          border-color: ${MODERN_EMAIL_STYLES.colors.primary} !important;
        }

        .status-badge {
          border: 1px solid #ffffff !important;
        }

        a {
          text-decoration: underline !important;
          text-decoration-thickness: 2px !important;
        }
      }

      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }

      /* Ensure minimum font size for accessibility */
      body, p, td, th, div, span {
        font-size: ${ACCESSIBILITY_STANDARDS.minFontSize} !important;
      }

      /* Ensure minimum touch target size */
      .btn, a[role="button"] {
        min-height: ${ACCESSIBILITY_STANDARDS.minTouchTarget} !important;
        min-width: ${ACCESSIBILITY_STANDARDS.minTouchTarget} !important;
      }
    `;
  }

  /**
   * Generate email client fallbacks
   *
   * @private
   * @returns Email client fallback CSS string
   */
  private generateEmailClientFallbacks(): string {
    return `
      /* Email Client Fallbacks */
      ${EMAIL_CLIENT_FALLBACKS.universalResets}

      /* Outlook specific fixes */
      <!--[if mso]>
      <style type="text/css">
        table {
          mso-table-lspace: 0pt !important;
          mso-table-rspace: 0pt !important;
        }

        td {
          mso-line-height-rule: exactly !important;
        }

        .outlook-gradient {
          background: ${MODERN_EMAIL_STYLES.colors.primary} !important;
        }

        .outlook-rounded {
          border-radius: 0 !important;
        }

        .outlook-shadow {
          box-shadow: none !important;
        }

        .outlook-hide {
          display: none !important;
          mso-hide: all !important;
        }
      </style>
      <![endif]-->

      /* Apple Mail fixes */
      .apple-mail-fix {
        ${EMAIL_CLIENT_FALLBACKS.appleMail.textSizeAdjust}
      }

      /* Yahoo Mail fixes */
      .yahoo-mail-center {
        ${EMAIL_CLIENT_FALLBACKS.yahooMail.centerFix}
      }

      .yahoo-mail-table {
        ${EMAIL_CLIENT_FALLBACKS.yahooMail.tableFix}
      }

      /* Windows Mail fixes */
      .windows-mail-line-height {
        ${EMAIL_CLIENT_FALLBACKS.windowsMail.lineHeightFix}
      }

      .windows-mail-font {
        ${EMAIL_CLIENT_FALLBACKS.windowsMail.fontFix}
      }

      /* Thunderbird fixes */
      .thunderbird-display {
        ${EMAIL_CLIENT_FALLBACKS.thunderbird.displayFix}
      }

      .thunderbird-image {
        ${EMAIL_CLIENT_FALLBACKS.thunderbird.imageFix}
      }
    `;
  }

  /**
   * Inject design tokens as template variables
   *
   * @private
   * @param template - The HTML template string
   * @returns Template with design tokens injected
   */
  private injectDesignTokens(template: string): string {
    // Create design tokens object for template access
    const designTokens = {
      colors: MODERN_EMAIL_STYLES.colors,
      typography: MODERN_EMAIL_STYLES.typography,
      spacing: MODERN_EMAIL_STYLES.spacing,
      borderRadius: MODERN_EMAIL_STYLES.borderRadius,
      shadows: MODERN_EMAIL_STYLES.shadows,
      buttons: MODERN_BUTTON_STYLES,
      badges: STATUS_BADGE_STYLES,
      breakpoints: RESPONSIVE_BREAKPOINTS,
      darkMode: DARK_MODE_COLORS,
      accessibility: ACCESSIBILITY_STANDARDS
    };

    // Replace design token placeholders
    let processedTemplate = template;

    // Replace color tokens
    Object.entries(designTokens.colors).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{designTokens\\.colors\\.${key}}}`, 'g');
      processedTemplate = processedTemplate.replace(placeholder, value);
    });

    // Replace typography tokens
    Object.entries(designTokens.typography.fontSize).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{designTokens\\.typography\\.fontSize\\.${key}}}`, 'g');
      processedTemplate = processedTemplate.replace(placeholder, value);
    });

    // Replace spacing tokens
    Object.entries(designTokens.spacing).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{designTokens\\.spacing\\.${key}}}`, 'g');
      processedTemplate = processedTemplate.replace(placeholder, value);
    });

    // Replace border radius tokens
    Object.entries(designTokens.borderRadius).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{designTokens\\.borderRadius\\.${key}}}`, 'g');
      processedTemplate = processedTemplate.replace(placeholder, value);
    });

    return processedTemplate;
  }

  /**
   * Get design tokens object for template context
   *
   * @returns Design tokens object
   */
  getDesignTokens(): DesignTokens {
    return {
      colors: {
        primary: MODERN_EMAIL_STYLES.colors.primary,
        secondary: MODERN_EMAIL_STYLES.colors.secondary,
        success: MODERN_EMAIL_STYLES.colors.success,
        warning: MODERN_EMAIL_STYLES.colors.warning,
        danger: MODERN_EMAIL_STYLES.colors.accent,
        light: MODERN_EMAIL_STYLES.colors.background,
        dark: MODERN_EMAIL_STYLES.colors.textPrimary,
        background: MODERN_EMAIL_STYLES.colors.background,
        text: MODERN_EMAIL_STYLES.colors.textPrimary,
        border: MODERN_EMAIL_STYLES.colors.border,
        accent: MODERN_EMAIL_STYLES.colors.accent,
        cardBackground: MODERN_EMAIL_STYLES.colors.cardBackground,
        textSecondary: MODERN_EMAIL_STYLES.colors.textSecondary
      },
      typography: {
        fontFamily: MODERN_EMAIL_STYLES.typography.fontFamily,
        fontSize: {
          small: MODERN_EMAIL_STYLES.typography.fontSize.small,
          medium: MODERN_EMAIL_STYLES.typography.fontSize.body,
          large: MODERN_EMAIL_STYLES.typography.fontSize.large,
          xlarge: MODERN_EMAIL_STYLES.typography.fontSize.heading,
          body: MODERN_EMAIL_STYLES.typography.fontSize.body,
          heading: MODERN_EMAIL_STYLES.typography.fontSize.heading,
          title: MODERN_EMAIL_STYLES.typography.fontSize.title
        },
        fontWeight: {
          normal: '400',
          bold: '600'
        },
        lineHeight: {
          normal: MODERN_EMAIL_STYLES.typography.lineHeight.normal,
          tight: MODERN_EMAIL_STYLES.typography.lineHeight.tight,
          loose: MODERN_EMAIL_STYLES.typography.lineHeight.relaxed
        }
      },
      spacing: {
        xs: MODERN_EMAIL_STYLES.spacing.xs,
        sm: MODERN_EMAIL_STYLES.spacing.sm,
        md: MODERN_EMAIL_STYLES.spacing.md,
        lg: MODERN_EMAIL_STYLES.spacing.lg,
        xl: MODERN_EMAIL_STYLES.spacing.xl,
        xxl: MODERN_EMAIL_STYLES.spacing.xxl
      },
      breakpoints: {
        mobile: RESPONSIVE_BREAKPOINTS.mobile,
        tablet: RESPONSIVE_BREAKPOINTS.tablet,
        desktop: RESPONSIVE_BREAKPOINTS.desktop
      },
      borderRadius: {
        none: '0',
        sm: MODERN_EMAIL_STYLES.borderRadius.small,
        md: MODERN_EMAIL_STYLES.borderRadius.medium,
        lg: MODERN_EMAIL_STYLES.borderRadius.large,
        full: '50%',
        small: MODERN_EMAIL_STYLES.borderRadius.small,
        medium: MODERN_EMAIL_STYLES.borderRadius.medium,
        large: MODERN_EMAIL_STYLES.borderRadius.large
      },
      shadows: {
        none: 'none',
        sm: MODERN_EMAIL_STYLES.shadows.subtle,
        md: MODERN_EMAIL_STYLES.shadows.medium,
        lg: MODERN_EMAIL_STYLES.shadows.strong,
        subtle: MODERN_EMAIL_STYLES.shadows.subtle,
        medium: MODERN_EMAIL_STYLES.shadows.medium,
        strong: MODERN_EMAIL_STYLES.shadows.strong
      }
    };
  }

  /**
   * Generate CSS for responsive layout styles
   *
   * @returns CSS string for responsive email layouts
   */
  generateResponsiveStyles(): string {
    return this.generateResponsiveCSS();
  }

  /**
   * Generate CSS for dark mode support
   *
   * @returns CSS string for dark mode styles
   */
  generateDarkModeStyles(): string {
    return this.generateDarkModeCSS();
  }

  /**
   * Generate HTML for a modern button component
   *
   * @param text - Button text
   * @param url - Button URL
   * @param style - Button style
   * @returns HTML string for button component
   */
  generateButton(text: string, url: string, style: string): string {
    try {
      return ModernButtonGenerator.generateModernButton({
        text,
        url,
        style: style as ButtonStyleType,
        fullWidth: false
      });
    } catch (error) {
      this.logger.warn(`Failed to generate modern button, using fallback: ${error.message}`);
      // Fallback to simple link
      return `<a href="${url}" style="color: #007bff; text-decoration: underline;">${text}</a>`;
    }
  }

  /**
   * Generate HTML for a status badge component
   *
   * @param status - Status value
   * @param locale - Locale for status text
   * @returns HTML string for status badge component
   */
  generateStatusBadge(status: string, locale: 'en' | 'vi'): string {
    try {
      return StatusBadgeGenerator.generateStatusBadge({
        status,
        type: 'order',
        size: 'medium',
        locale
      });
    } catch (error) {
      this.logger.warn(`Failed to generate status badge, using fallback: ${error.message}`);
      // Fallback to simple span
      return `<span style="background-color: #6c757d; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${status}</span>`;
    }
  }
}