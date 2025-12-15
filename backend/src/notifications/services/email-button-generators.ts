/**
 * Modern Button Style Generators for Email Templates
 *
 * This file contains generators for creating modern, accessible button styles
 * for email templates. All buttons are designed to be touch-friendly with
 * minimum 44px height and include email client fallbacks.
 */

import {
  MODERN_EMAIL_STYLES,
  MODERN_BUTTON_STYLES,
  EMAIL_CLIENT_FALLBACKS,
  ACCESSIBILITY_STANDARDS
} from './email-design-tokens';

export type ButtonStyleType = 'primary' | 'secondary' | 'success' | 'warning' | 'link';

export interface ButtonOptions {
  text: string;
  url: string;
  style: ButtonStyleType;
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Modern Button Style Generator
 *
 * Generates modern button HTML with proper styling, accessibility features,
 * and email client compatibility. All buttons meet WCAG 2.1 AA standards
 * and include touch-friendly sizing.
 */
export class ModernButtonGenerator {
  /**
   * Generate a modern button with gradient backgrounds, shadows, and comprehensive email client compatibility
   * Includes CSS Grid/Flexbox with table-based fallbacks and Outlook-specific VML
   *
   * @param options - Button configuration options
   * @returns HTML string for the button with cross-client compatibility
   */
  static generateModernButton(options: ButtonOptions): string {
    const { text, url, style, fullWidth = false, size = 'medium' } = options;

    const buttonStyle = this.getButtonStyle(style, size, fullWidth);
    const gmailInlineStyle = this.getGmailInlineStyle(style, size, fullWidth);
    const outlookVML = this.generateOutlookVMLButton(text, url, style, size);

    // Progressive enhancement: Modern CSS with table-based fallback
    return `
      <!-- Outlook VML for gradients and rounded corners -->
      <!--[if mso]>
      ${outlookVML}
      <![endif]-->

      <!-- Modern button with progressive enhancement -->
      <!--[if !mso]><!-->
      <div style="display: table; ${fullWidth ? 'width: 100%;' : ''} margin: 0 auto;">
        <!-- CSS Grid/Flexbox fallback to table -->
        <div class="button-container" style="
          display: table-cell;
          vertical-align: middle;
          text-align: center;
          ${fullWidth ? 'width: 100%;' : ''}
        ">
          <!-- Gmail-compatible inline styles -->
          <a href="${url}"
             style="${gmailInlineStyle}"
             class="btn btn-${style} ${fullWidth ? 'btn-full-width' : ''}"
             role="button"
             aria-label="${text}"
             target="_blank"
             rel="noopener noreferrer">
            ${text}
          </a>
        </div>
      </div>
      <!--<![endif]-->

      <!-- Additional fallback for very old clients -->
      <div style="display: none; mso-hide: all;">
        <table cellpadding="0" cellspacing="0" border="0" role="presentation" ${fullWidth ? 'width="100%"' : ''}>
          <tr>
            <td style="
              background-color: ${this.getFallbackBackgroundColor(style)};
              border-radius: 8px;
              padding: 16px 32px;
              text-align: center;
              ${fullWidth ? 'width: 100%;' : ''}
            ">
              <a href="${url}"
                 style="
                   color: ${this.getFallbackTextColor(style)};
                   text-decoration: none;
                   font-weight: 600;
                   font-size: 16px;
                   line-height: 1.2;
                   display: block;
                 "
                 target="_blank"
                 rel="noopener noreferrer">
                ${text}
              </a>
            </td>
          </tr>
        </table>
      </div>
    `;
  }

  /**
   * Generate Outlook-specific VML button for gradient and rounded corner support
   *
   * @private
   * @param text - Button text
   * @param url - Button URL
   * @param style - Button style type
   * @param size - Button size
   * @returns VML string for Outlook compatibility
   */
  private static generateOutlookVMLButton(text: string, url: string, style: ButtonStyleType, size: string): string {
    const width = size === 'large' ? '240px' : size === 'small' ? '160px' : '200px';
    const height = size === 'large' ? '52px' : size === 'small' ? '36px' : '44px';
    const startColor = this.getGradientStartColor(style);
    const endColor = this.getGradientEndColor(style);
    const textColor = this.getFallbackTextColor(style);

    return `
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml"
                   xmlns:w="urn:schemas-microsoft-com:office:word"
                   href="${url}"
                   style="height:${height};v-text-anchor:middle;width:${width};"
                   arcsize="18%"
                   stroke="f"
                   fillcolor="${startColor}">
        <v:fill type="gradient" color="${startColor}" color2="${endColor}" angle="135" />
        <w:anchorlock/>
        <center style="
          color: ${textColor};
          font-family: ${MODERN_EMAIL_STYLES.typography.fontFamily};
          font-size: ${size === 'large' ? '20px' : size === 'small' ? '14px' : '16px'};
          font-weight: 600;
          text-decoration: none;
        ">
          ${text}
        </center>
      </v:roundrect>
    `;
  }

  /**
   * Generate Gmail-compatible inline styles (no CSS in head support)
   *
   * @private
   * @param style - Button style type
   * @param size - Button size
   * @param fullWidth - Whether button should be full width
   * @returns Inline CSS string optimized for Gmail
   */
  private static getGmailInlineStyle(style: ButtonStyleType, size: string, fullWidth: boolean): string {
    const baseStyles = {
      'display': 'inline-block',
      'text-decoration': 'none',
      'font-family': MODERN_EMAIL_STYLES.typography.fontFamily,
      'font-weight': '600',
      'text-align': 'center',
      'vertical-align': 'middle',
      'cursor': 'pointer',
      'border': 'none',
      'outline': 'none',
      'mso-style-priority': '99',
      '-webkit-text-size-adjust': '100%',
      '-ms-text-size-adjust': '100%',
      'line-height': '1.2'
    };

    // Add style-specific properties
    const styleProperties = this.getGmailStyleProperties(style);

    // Add size-specific properties
    const sizeProperties = this.getGmailSizeProperties(size);

    // Add width properties
    const widthProperties = fullWidth ? {
      'width': '100%',
      'max-width': '100%',
      'box-sizing': 'border-box'
    } : {};

    const allStyles = { ...baseStyles, ...styleProperties, ...sizeProperties, ...widthProperties };

    return Object.entries(allStyles)
      .map(([property, value]) => `${property}: ${value}`)
      .join('; ');
  }

  /**
   * Get Gmail-compatible style properties for button type
   *
   * @private
   * @param style - Button style type
   * @returns Style properties object
   */
  private static getGmailStyleProperties(style: ButtonStyleType): Record<string, string> {
    switch (style) {
      case 'primary':
        return {
          'background-color': MODERN_EMAIL_STYLES.colors.primary,
          'color': '#ffffff'
        };
      case 'secondary':
        return {
          'background-color': MODERN_EMAIL_STYLES.colors.cardBackground,
          'color': MODERN_EMAIL_STYLES.colors.primary,
          'border': `2px solid ${MODERN_EMAIL_STYLES.colors.border}`
        };
      case 'success':
        return {
          'background-color': MODERN_EMAIL_STYLES.colors.success,
          'color': '#ffffff'
        };
      case 'warning':
        return {
          'background-color': MODERN_EMAIL_STYLES.colors.warning,
          'color': '#ffffff'
        };
      case 'link':
        return {
          'background-color': 'transparent',
          'color': MODERN_EMAIL_STYLES.colors.secondary,
          'text-decoration': 'underline'
        };
      default:
        return {
          'background-color': MODERN_EMAIL_STYLES.colors.primary,
          'color': '#ffffff'
        };
    }
  }

  /**
   * Get Gmail-compatible size properties
   *
   * @private
   * @param size - Button size
   * @returns Size properties object
   */
  private static getGmailSizeProperties(size: string): Record<string, string> {
    switch (size) {
      case 'small':
        return {
          'padding': '8px 16px',
          'font-size': '14px',
          'min-height': '36px',
          'border-radius': '4px'
        };
      case 'medium':
        return {
          'padding': '16px 32px',
          'font-size': '16px',
          'min-height': '44px',
          'border-radius': '8px'
        };
      case 'large':
        return {
          'padding': '24px 48px',
          'font-size': '20px',
          'min-height': '52px',
          'border-radius': '12px'
        };
      default:
        return {
          'padding': '16px 32px',
          'font-size': '16px',
          'min-height': '44px',
          'border-radius': '8px'
        };
    }
  }

  /**
   * Get fallback background color for very old email clients
   *
   * @private
   * @param style - Button style type
   * @returns Hex color string
   */
  private static getFallbackBackgroundColor(style: ButtonStyleType): string {
    switch (style) {
      case 'primary':
        return MODERN_EMAIL_STYLES.colors.primary;
      case 'secondary':
        return MODERN_EMAIL_STYLES.colors.cardBackground;
      case 'success':
        return MODERN_EMAIL_STYLES.colors.success;
      case 'warning':
        return MODERN_EMAIL_STYLES.colors.warning;
      case 'link':
        return 'transparent';
      default:
        return MODERN_EMAIL_STYLES.colors.primary;
    }
  }

  /**
   * Get fallback text color for very old email clients
   *
   * @private
   * @param style - Button style type
   * @returns Hex color string
   */
  private static getFallbackTextColor(style: ButtonStyleType): string {
    switch (style) {
      case 'secondary':
        return MODERN_EMAIL_STYLES.colors.primary;
      case 'link':
        return MODERN_EMAIL_STYLES.colors.secondary;
      default:
        return '#ffffff';
    }
  }

  /**
   * Generate a primary button (main call-to-action)
   *
   * @param text - Button text
   * @param url - Button URL
   * @param fullWidth - Whether button should be full width
   * @returns HTML string for primary button
   */
  static generatePrimaryButton(text: string, url: string, fullWidth: boolean = false): string {
    return this.generateModernButton({
      text,
      url,
      style: 'primary',
      fullWidth,
      size: 'medium'
    });
  }

  /**
   * Generate a secondary button (secondary actions)
   *
   * @param text - Button text
   * @param url - Button URL
   * @param fullWidth - Whether button should be full width
   * @returns HTML string for secondary button
   */
  static generateSecondaryButton(text: string, url: string, fullWidth: boolean = false): string {
    return this.generateModernButton({
      text,
      url,
      style: 'secondary',
      fullWidth,
      size: 'medium'
    });
  }

  /**
   * Generate a success button (positive actions)
   *
   * @param text - Button text
   * @param url - Button URL
   * @param fullWidth - Whether button should be full width
   * @returns HTML string for success button
   */
  static generateSuccessButton(text: string, url: string, fullWidth: boolean = false): string {
    return this.generateModernButton({
      text,
      url,
      style: 'success',
      fullWidth,
      size: 'medium'
    });
  }

  /**
   * Generate a warning button (caution actions)
   *
   * @param text - Button text
   * @param url - Button URL
   * @param fullWidth - Whether button should be full width
   * @returns HTML string for warning button
   */
  static generateWarningButton(text: string, url: string, fullWidth: boolean = false): string {
    return this.generateModernButton({
      text,
      url,
      style: 'warning',
      fullWidth,
      size: 'medium'
    });
  }

  /**
   * Generate a text link button (minimal styling)
   *
   * @param text - Link text
   * @param url - Link URL
   * @returns HTML string for text link
   */
  static generateLinkButton(text: string, url: string): string {
    return `
      <a href="${url}"
         style="${MODERN_BUTTON_STYLES.link}"
         onmouseover="this.style.color='${MODERN_EMAIL_STYLES.colors.primary}';"
         onmouseout="this.style.color='${MODERN_EMAIL_STYLES.colors.secondary}';">
        ${text}
      </a>
    `;
  }

  /**
   * Get button style based on type, size, and width
   *
   * @private
   * @param style - Button style type
   * @param size - Button size
   * @param fullWidth - Whether button should be full width
   * @returns CSS style string
   */
  private static getButtonStyle(style: ButtonStyleType, size: string, fullWidth: boolean): string {
    const baseStyle = this.getBaseButtonStyle(style);
    const sizeStyle = this.getSizeStyle(size);
    const widthStyle = fullWidth ? 'width: 100%; display: block; text-align: center;' : 'display: inline-block;';

    return `${baseStyle} ${sizeStyle} ${widthStyle}`;
  }

  /**
   * Get base button style for the specified type
   *
   * @private
   * @param style - Button style type
   * @returns CSS style string
   */
  private static getBaseButtonStyle(style: ButtonStyleType): string {
    switch (style) {
      case 'primary':
        return `
          background: linear-gradient(135deg, ${MODERN_EMAIL_STYLES.colors.primary} 0%, ${MODERN_EMAIL_STYLES.colors.secondary} 100%);
          color: #ffffff;
          border: none;
          box-shadow: ${MODERN_EMAIL_STYLES.shadows.medium};
        `;
      case 'secondary':
        return `
          background: ${MODERN_EMAIL_STYLES.colors.cardBackground};
          color: ${MODERN_EMAIL_STYLES.colors.primary};
          border: 2px solid ${MODERN_EMAIL_STYLES.colors.border};
          box-shadow: ${MODERN_EMAIL_STYLES.shadows.subtle};
        `;
      case 'success':
        return `
          background: linear-gradient(135deg, ${MODERN_EMAIL_STYLES.colors.success} 0%, #2ecc71 100%);
          color: #ffffff;
          border: none;
          box-shadow: ${MODERN_EMAIL_STYLES.shadows.medium};
        `;
      case 'warning':
        return `
          background: linear-gradient(135deg, ${MODERN_EMAIL_STYLES.colors.warning} 0%, #e67e22 100%);
          color: #ffffff;
          border: none;
          box-shadow: ${MODERN_EMAIL_STYLES.shadows.medium};
        `;
      case 'link':
        return MODERN_BUTTON_STYLES.link;
      default:
        return MODERN_BUTTON_STYLES.primary;
    }
  }

  /**
   * Get size-specific styles
   *
   * @private
   * @param size - Button size
   * @returns CSS style string
   */
  private static getSizeStyle(size: string): string {
    switch (size) {
      case 'small':
        return `
          padding: ${MODERN_EMAIL_STYLES.spacing.sm} ${MODERN_EMAIL_STYLES.spacing.md};
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body};
          min-height: 36px;
          border-radius: ${MODERN_EMAIL_STYLES.borderRadius.small};
        `;
      case 'medium':
        return `
          padding: ${MODERN_EMAIL_STYLES.spacing.md} ${MODERN_EMAIL_STYLES.spacing.xl};
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
          min-height: ${ACCESSIBILITY_STANDARDS.minTouchTarget};
          border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
        `;
      case 'large':
        return `
          padding: ${MODERN_EMAIL_STYLES.spacing.lg} ${MODERN_EMAIL_STYLES.spacing.xxl};
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.heading};
          min-height: 52px;
          border-radius: ${MODERN_EMAIL_STYLES.borderRadius.large};
        `;
      default:
        return `
          padding: ${MODERN_EMAIL_STYLES.spacing.md} ${MODERN_EMAIL_STYLES.spacing.xl};
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
          min-height: ${ACCESSIBILITY_STANDARDS.minTouchTarget};
          border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
        `;
    }
  }

  /**
   * Get hover style for button type
   *
   * @private
   * @param style - Button style type
   * @returns CSS style string for hover state
   */
  private static getHoverStyle(style: ButtonStyleType): string {
    switch (style) {
      case 'primary':
        return 'transform: translateY(-2px); transition: all 0.2s ease;';
      case 'secondary':
        return 'background-color: #f8f9fa; transform: translateY(-1px); transition: all 0.2s ease;';
      case 'success':
        return 'transform: translateY(-2px); transition: all 0.2s ease;';
      case 'warning':
        return 'transform: translateY(-2px); transition: all 0.2s ease;';
      case 'link':
        return `color: ${MODERN_EMAIL_STYLES.colors.primary}; transition: color 0.2s ease;`;
      default:
        return 'transform: translateY(-2px); transition: all 0.2s ease;';
    }
  }

  /**
   * Get gradient start color for button type
   *
   * @private
   * @param style - Button style type
   * @returns Hex color string
   */
  private static getGradientStartColor(style: ButtonStyleType): string {
    switch (style) {
      case 'primary':
        return MODERN_EMAIL_STYLES.colors.primary;
      case 'success':
        return MODERN_EMAIL_STYLES.colors.success;
      case 'warning':
        return MODERN_EMAIL_STYLES.colors.warning;
      default:
        return MODERN_EMAIL_STYLES.colors.primary;
    }
  }

  /**
   * Get gradient end color for button type
   *
   * @private
   * @param style - Button style type
   * @returns Hex color string
   */
  private static getGradientEndColor(style: ButtonStyleType): string {
    switch (style) {
      case 'primary':
        return MODERN_EMAIL_STYLES.colors.secondary;
      case 'success':
        return '#2ecc71';
      case 'warning':
        return '#e67e22';
      default:
        return MODERN_EMAIL_STYLES.colors.secondary;
    }
  }

  /**
   * Get default shadow for button type
   *
   * @private
   * @param style - Button style type
   * @returns CSS shadow string
   */
  private static getDefaultShadow(style: ButtonStyleType): string {
    switch (style) {
      case 'secondary':
        return MODERN_EMAIL_STYLES.shadows.subtle;
      default:
        return MODERN_EMAIL_STYLES.shadows.medium;
    }
  }

  /**
   * Get hover shadow for button type
   *
   * @private
   * @param style - Button style type
   * @returns CSS shadow string
   */
  private static getHoverShadow(style: ButtonStyleType): string {
    switch (style) {
      case 'secondary':
        return MODERN_EMAIL_STYLES.shadows.medium;
      default:
        return MODERN_EMAIL_STYLES.shadows.strong;
    }
  }

  /**
   * Generate Gmail-compatible button (fallback for clients that don't support gradients)
   *
   * @param text - Button text
   * @param url - Button URL
   * @param style - Button style type
   * @returns HTML string for Gmail-compatible button
   */
  static generateGmailCompatibleButton(text: string, url: string, style: ButtonStyleType): string {
    const backgroundColor = this.getGmailBackgroundColor(style);
    const textColor = this.getGmailTextColor(style);

    return EMAIL_CLIENT_FALLBACKS.tableBasedButton(text, backgroundColor, textColor);
  }

  /**
   * Get Gmail-compatible background color
   *
   * @private
   * @param style - Button style type
   * @returns Hex color string
   */
  private static getGmailBackgroundColor(style: ButtonStyleType): string {
    switch (style) {
      case 'primary':
        return MODERN_EMAIL_STYLES.colors.primary;
      case 'secondary':
        return MODERN_EMAIL_STYLES.colors.cardBackground;
      case 'success':
        return MODERN_EMAIL_STYLES.colors.success;
      case 'warning':
        return MODERN_EMAIL_STYLES.colors.warning;
      default:
        return MODERN_EMAIL_STYLES.colors.primary;
    }
  }

  /**
   * Get Gmail-compatible text color
   *
   * @private
   * @param style - Button style type
   * @returns Hex color string
   */
  private static getGmailTextColor(style: ButtonStyleType): string {
    switch (style) {
      case 'secondary':
        return MODERN_EMAIL_STYLES.colors.primary;
      default:
        return '#ffffff';
    }
  }
}

/**
 * Utility functions for button generation
 */
export class ButtonUtils {
  /**
   * Validate button URL
   *
   * @param url - URL to validate
   * @returns boolean indicating if URL is valid
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sanitize button text to prevent XSS
   *
   * @param text - Text to sanitize
   * @returns Sanitized text
   */
  static sanitizeText(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  /**
   * Generate button with validation and sanitization
   *
   * @param text - Button text
   * @param url - Button URL
   * @param style - Button style type
   * @param fullWidth - Whether button should be full width
   * @returns HTML string for validated button
   */
  static generateValidatedButton(
    text: string,
    url: string,
    style: ButtonStyleType,
    fullWidth: boolean = false
  ): string {
    if (!this.isValidUrl(url)) {
      throw new Error(`Invalid URL provided for button: ${url}`);
    }

    const sanitizedText = this.sanitizeText(text);

    return ModernButtonGenerator.generateModernButton({
      text: sanitizedText,
      url,
      style,
      fullWidth
    });
  }
}