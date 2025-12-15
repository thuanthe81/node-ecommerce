import { Injectable } from '@nestjs/common';
import {
  MODERN_EMAIL_STYLES,
  MODERN_BUTTON_STYLES,
  STATUS_BADGE_STYLES,
  RESPONSIVE_BREAKPOINTS,
  EMAIL_CLIENT_FALLBACKS,
  DARK_MODE_COLORS,
  ACCESSIBILITY_STANDARDS
} from './email-design-tokens';
import { ModernButtonGenerator } from './email-button-generators';
import { StatusBadgeGenerator } from './email-status-badge-generators';
import { STATUS } from '../../common/constants';

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  orderDate: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shippingCost: number;
  taxAmount?: number;
  discountAmount?: number;
  total: number;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  trackingNumber?: string;
  status?: string;
}

export interface AdminOrderEmailData {
  orderNumber: string;
  orderDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Array<{
    nameEn: string;
    nameVi: string;
    sku: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  shippingCost: number;
  shippingMethod: string;
  taxAmount: number;
  discountAmount: number;
  total: number;
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  billingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: string;
  paymentStatus: string;
  notes?: string;
}

export interface UserEmailData {
  name: string;
  email: string;
  resetToken?: string;
  verificationToken?: string;
}

@Injectable()
export class EmailTemplateService {
  /**
   * Enhanced modern email layout wrapper with sophisticated styling and comprehensive accessibility
   * Implements semantic HTML structure, ARIA labels, and WCAG 2.1 AA compliance
   * @param content - The main email content HTML
   * @param locale - Language locale (en or vi)
   * @returns Complete HTML email with modern design, responsive layout, and accessibility features
   */
  private wrapInModernEmailLayout(content: string, locale: 'en' | 'vi'): string {
    const contactInfo =
      locale === 'vi'
        ? 'Nếu bạn có câu hỏi, vui lòng liên hệ với chúng tôi.'
        : 'If you have any questions, please contact us.';

    const skipLinkText = locale === 'vi'
      ? 'Chuyển đến nội dung chính'
      : 'Skip to main content';

    const modernStyles = this.getModernStyles();
    const responsiveStyles = this.getResponsiveStyles();
    const accessibilityStyles = this.getAccessibilityStyles();
    const darkModeStyles = this.getDarkModeStyles();
    const advancedBackgroundStyles = this.getAdvancedBackgroundStyles();
    const printStyles = this.getPrintStyles();
    const compatibilityStyles = this.getEmailClientCompatibilityStyles();

    return `
<!DOCTYPE html>
<html lang="${locale}" dir="${ACCESSIBILITY_STANDARDS.language.directionality}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  ${EMAIL_CLIENT_FALLBACKS.appleMail.autoLinkDisable}
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">

  <!-- Accessibility meta tags -->
  <meta name="description" content="${locale === 'vi' ? 'Email từ AlaCraft - Sản phẩm thủ công chất lượng cao' : 'Email from AlaCraft - Premium Handmade Products'}">
  <meta name="robots" content="noindex, nofollow">

  <title>AlaCraft Email</title>

  <!-- Outlook-specific settings -->
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->

  ${EMAIL_CLIENT_FALLBACKS.outlookResets}
  <style>
    ${EMAIL_CLIENT_FALLBACKS.universalResets}
    ${modernStyles}
    ${responsiveStyles}
    ${accessibilityStyles}
    ${darkModeStyles}
    ${advancedBackgroundStyles}
    ${printStyles}
    ${compatibilityStyles}
  </style>
</head>
<body class="email-body" style="${EMAIL_CLIENT_FALLBACKS.appleMail.textSizeAdjust}">
  <!-- Preheader text for email preview and screen readers -->
  <div class="preheader" style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: ${MODERN_EMAIL_STYLES.typography.fontFamily}; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;" aria-hidden="true">
    ${locale === 'vi' ? 'Email từ AlaCraft - Sản phẩm thủ công chất lượng cao' : 'Email from AlaCraft - Premium Handmade Products'}
  </div>

  <!-- Skip link for keyboard navigation -->
  <a href="#main-content" class="skip-link" tabindex="${ACCESSIBILITY_STANDARDS.keyboardNavigation.skipLinkTabIndex}">
    ${skipLinkText}
  </a>

  <!-- Main email wrapper with semantic structure and cross-client compatibility -->
  <div role="document" aria-label="${locale === 'vi' ? 'Email từ AlaCraft' : 'AlaCraft Email'}">
    <table class="email-wrapper gmail-fix yahoo-fix"
           cellpadding="0"
           cellspacing="0"
           border="0"
           role="presentation"
           style="${EMAIL_CLIENT_FALLBACKS.yahooMail.tableFix}"
           aria-hidden="true">
      <tr>
        <td class="email-wrapper-cell">
          <table class="email-container gmail-safe-card"
                 cellpadding="0"
                 cellspacing="0"
                 border="0"
                 role="presentation"
                 style="${EMAIL_CLIENT_FALLBACKS.yahooMail.tableFix}"
                 aria-hidden="true">
            <!-- Email Header -->
            <tr>
              <td class="email-header" role="banner" aria-label="${ACCESSIBILITY_STANDARDS.ariaLabels.navigation}">
                ${this.generateModernHeader(locale)}
              </td>
            </tr>
            <!-- Main Email Content -->
            <tr>
              <td class="email-content" role="main" aria-label="${ACCESSIBILITY_STANDARDS.ariaLabels.mainContent}" id="main-content">
                ${content}
              </td>
            </tr>
            <!-- Email Footer -->
            <tr>
              <td class="email-footer" role="contentinfo" aria-label="${ACCESSIBILITY_STANDARDS.ariaLabels.contactInfo}">
                ${this.generateModernFooter(locale)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>

  <!-- Screen reader announcements for dynamic content -->
  <div aria-live="polite" aria-atomic="true" class="sr-only" id="announcements"></div>
</body>
</html>
    `.trim();
  }

  /**
   * Wraps email content in a consistent HTML layout with proper structure
   * @param content - The main email content HTML
   * @param locale - Language locale (en or vi)
   * @returns Complete HTML email with DOCTYPE, meta tags, and styling
   */
  private wrapInEmailLayout(content: string, locale: 'en' | 'vi'): string {
    const contactInfo =
      locale === 'vi'
        ? 'Nếu bạn có câu hỏi, vui lòng liên hệ với chúng tôi.'
        : 'If you have any questions, please contact us.';

    return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Email Notification</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, Helvetica, sans-serif;
      background-color: #f4f4f4;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .email-header {
      background-color: #2c3e50;
      color: #ffffff;
      padding: 20px;
      text-align: center;
    }
    .email-header h1 {
      margin: 0;
      font-size: 24px;
    }
    .email-content {
      padding: 30px 20px;
      color: #333333;
      line-height: 1.6;
    }
    .email-footer {
      background-color: #ecf0f1;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #7f8c8d;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    .info-table td {
      padding: 8px;
      border-bottom: 1px solid #ecf0f1;
    }
    .info-table td:first-child {
      font-weight: bold;
      width: 40%;
    }
    .items-table {
      margin: 20px 0;
    }
    .items-table th {
      background-color: #34495e;
      color: #ffffff;
      padding: 10px;
      text-align: left;
    }
    .items-table td {
      padding: 10px;
      border-bottom: 1px solid #ecf0f1;
    }
    .total-row {
      font-weight: bold;
      font-size: 16px;
      background-color: #f8f9fa;
    }
    .address-box {
      background-color: #f8f9fa;
      padding: 15px;
      margin: 10px 0;
      border-left: 4px solid #3498db;
    }
    @media only screen and (max-width: 600px) {
      .email-content {
        padding: 20px 15px;
      }
      .items-table th,
      .items-table td {
        padding: 8px 5px;
        font-size: 14px;
      }
    }
  </style>
</head>
<body>
  <table class="email-container" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td class="email-header">
        <h1>AlaCraft</h1>
      </td>
    </tr>
    <tr>
      <td class="email-content">
        ${content}
      </td>
    </tr>
    <tr>
      <td class="email-footer">
        <p>${contactInfo}</p>
        <p>&copy; ${new Date().getFullYear()} AlaCraft. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Formats currency values with proper decimal places and symbols
   * @param amount - The amount to format
   * @param locale - Language locale (en or vi)
   * @returns Formatted currency string
   */
  private formatCurrency(amount: number, locale: 'en' | 'vi'): string {
    return `${amount.toLocaleString('vi-VN')} ₫`;
    // if (locale === 'vi') {
    //   // VND uses 0 decimal places
    //   return `${amount.toLocaleString('vi-VN')} ₫`;
    // }
    // // USD uses 2 decimal places
    // return `$${amount.toFixed(2)}`;
  }

  /**
   * Formats dates in a human-readable format
   * @param date - The date to format (Date object or string)
   * @param locale - Language locale (en or vi)
   * @returns Formatted date string
   */
  private formatDate(date: Date | string, locale: 'en' | 'vi'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (locale === 'vi') {
      return dateObj.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Generates email client compatibility CSS with progressive enhancement
   * Includes CSS Grid/Flexbox with table-based fallbacks and Outlook-specific VML
   * @returns CSS string with cross-client compatibility features
   */
  private getEmailClientCompatibilityStyles(): string {
    return `
      /* Progressive enhancement with modern CSS techniques */

      /* CSS Grid with table fallback */
      .email-grid {
        display: table !important;
        width: 100% !important;
        border-collapse: collapse !important;
      }

      .email-grid-row {
        display: table-row !important;
      }

      .email-grid-cell {
        display: table-cell !important;
        vertical-align: top !important;
        padding: ${MODERN_EMAIL_STYLES.spacing.md} !important;
      }

      /* Modern browsers with CSS Grid support */
      @supports (display: grid) {
        .email-grid {
          display: grid !important;
          grid-template-columns: 1fr !important;
          gap: ${MODERN_EMAIL_STYLES.spacing.md} !important;
        }

        .email-grid-row {
          display: contents !important;
        }

        .email-grid-cell {
          display: block !important;
        }

        .email-grid-two-column {
          grid-template-columns: 1fr 1fr !important;
        }

        .email-grid-three-column {
          grid-template-columns: 1fr 1fr 1fr !important;
        }
      }

      /* Flexbox with table fallback for button groups */
      .button-group {
        display: table !important;
        width: 100% !important;
        border-collapse: collapse !important;
      }

      .button-group .btn {
        display: table-cell !important;
        width: auto !important;
        margin: 0 ${MODERN_EMAIL_STYLES.spacing.sm} !important;
      }

      /* Modern browsers with Flexbox support */
      @supports (display: flex) {
        .button-group {
          display: flex !important;
          flex-wrap: wrap !important;
          gap: ${MODERN_EMAIL_STYLES.spacing.md} !important;
          justify-content: center !important;
        }

        .button-group .btn {
          display: inline-block !important;
          flex: 0 0 auto !important;
        }
      }

      /* Outlook-specific VML for gradients and rounded corners */
      <!--[if mso]>
      <style type="text/css">
        .outlook-gradient-primary {
          background: ${MODERN_EMAIL_STYLES.colors.primary} !important;
        }

        .outlook-gradient-secondary {
          background: ${MODERN_EMAIL_STYLES.colors.secondary} !important;
        }

        .outlook-rounded {
          border-radius: 0 !important;
        }

        .outlook-shadow {
          box-shadow: none !important;
        }

        /* Force Outlook to respect table widths */
        table {
          mso-table-lspace: 0pt !important;
          mso-table-rspace: 0pt !important;
        }

        /* Fix Outlook line height issues */
        td {
          mso-line-height-rule: exactly !important;
        }

        /* Outlook button fixes */
        .btn {
          mso-style-priority: 99 !important;
        }
      </style>
      <![endif]-->

      /* Gmail-specific compatibility fixes */
      .gmail-fix {
        display: table !important;
        width: 100% !important;
      }

      /* Gmail does not support CSS in head, so we use inline styles as primary */
      .gmail-safe-button {
        ${EMAIL_CLIENT_FALLBACKS.gmailSafeStyles.button}
      }

      .gmail-safe-card {
        ${EMAIL_CLIENT_FALLBACKS.gmailSafeStyles.card}
      }

      .gmail-safe-table {
        ${EMAIL_CLIENT_FALLBACKS.gmailSafeStyles.table}
      }

      /* Apple Mail specific fixes */
      @media only screen and (-webkit-min-device-pixel-ratio: 0) {
        .apple-mail-fix {
          -webkit-text-size-adjust: none !important;
        }
      }

      /* Yahoo Mail fixes */
      .yahoo-fix {
        margin: 0 !important;
        padding: 0 !important;
      }

      /* Windows Mail fixes */
      .windows-mail-fix {
        line-height: 100% !important;
      }

      /* Thunderbird fixes */
      .thunderbird-fix {
        display: block !important;
      }

      /* Generic email client resets */
      .email-client-reset {
        border: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        outline: 0 !important;
        text-decoration: none !important;
      }

      /* Force email clients to respect our styles */
      .force-styles {
        mso-line-height-rule: exactly !important;
        -ms-text-size-adjust: 100% !important;
        -webkit-text-size-adjust: 100% !important;
      }
    `;
  }

  /**
   * Generates Outlook-specific VML for gradients and rounded corners
   * @param elementType - Type of element (button, card, etc.)
   * @param startColor - Gradient start color
   * @param endColor - Gradient end color
   * @param width - Element width
   * @param height - Element height
   * @returns VML string for Outlook compatibility
   */
  private generateOutlookVML(
    elementType: 'button' | 'card' | 'header',
    startColor: string,
    endColor: string,
    width: string = '200px',
    height: string = '44px'
  ): string {
    return `
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml"
                   xmlns:w="urn:schemas-microsoft-com:office:word"
                   href="#"
                   style="height:${height};v-text-anchor:middle;width:${width};"
                   arcsize="18%"
                   stroke="f"
                   fillcolor="${startColor}">
        <w:anchorlock/>
        <center>
      <![endif]-->
    `;
  }

  /**
   * Closes Outlook VML elements
   * @returns VML closing tags
   */
  private closeOutlookVML(): string {
    return `
      <!--[if mso]>
        </center>
      </v:roundrect>
      <![endif]-->
    `;
  }

  /**
   * Generates Gmail-compatible inline styling approach
   * @param element - Element type to style
   * @param customStyles - Additional custom styles
   * @returns Inline style string optimized for Gmail
   */
  private generateGmailCompatibleStyles(
    element: 'button' | 'card' | 'table' | 'text',
    customStyles: Record<string, string> = {}
  ): string {
    const baseStyles = {
      button: {
        'display': 'inline-block',
        'padding': '16px 32px',
        'background-color': MODERN_EMAIL_STYLES.colors.primary,
        'color': '#ffffff',
        'text-decoration': 'none',
        'border-radius': '8px',
        'font-weight': '600',
        'font-size': '16px',
        'min-height': '44px',
        'line-height': '1.2',
        'text-align': 'center',
        'border': 'none',
        'cursor': 'pointer',
        'mso-style-priority': '99',
        '-webkit-text-size-adjust': '100%',
        '-ms-text-size-adjust': '100%'
      },
      card: {
        'background-color': MODERN_EMAIL_STYLES.colors.cardBackground,
        'padding': '24px',
        'margin': '16px 0',
        'border-radius': '8px',
        'border': `1px solid ${MODERN_EMAIL_STYLES.colors.border}`,
        'display': 'block',
        'width': '100%',
        'box-sizing': 'border-box'
      },
      table: {
        'width': '100%',
        'border-collapse': 'collapse',
        'margin': '16px 0',
        'mso-table-lspace': '0pt',
        'mso-table-rspace': '0pt',
        'border-spacing': '0',
        'border': '0'
      },
      text: {
        'font-family': MODERN_EMAIL_STYLES.typography.fontFamily,
        'font-size': MODERN_EMAIL_STYLES.typography.fontSize.body,
        'line-height': MODERN_EMAIL_STYLES.typography.lineHeight.normal,
        'color': MODERN_EMAIL_STYLES.colors.textPrimary,
        'margin': '0',
        'padding': '0'
      }
    };

    const styles = { ...baseStyles[element], ...customStyles };

    return Object.entries(styles)
      .map(([property, value]) => `${property}: ${value}`)
      .join('; ');
  }

  /**
   * Creates a progressive enhancement wrapper for modern CSS features
   * @param modernContent - Content using modern CSS
   * @param fallbackContent - Fallback content for older clients
   * @param feature - CSS feature being enhanced (grid, flexbox, etc.)
   * @returns HTML with progressive enhancement
   */
  private createProgressiveEnhancement(
    modernContent: string,
    fallbackContent: string,
    feature: 'grid' | 'flexbox' | 'gradients' | 'shadows'
  ): string {
    const supportQueries = {
      grid: '@supports (display: grid)',
      flexbox: '@supports (display: flex)',
      gradients: '@supports (background: linear-gradient(to right, #000, #fff))',
      shadows: '@supports (box-shadow: 0 0 0 #000)'
    };

    return `
      <!-- Fallback for older email clients -->
      <div class="fallback-content">
        ${fallbackContent}
      </div>

      <!-- Modern content with progressive enhancement -->
      <style>
        ${supportQueries[feature]} {
          .fallback-content {
            display: none !important;
          }
          .modern-content {
            display: block !important;
          }
        }

        .modern-content {
          display: none !important;
        }
      </style>

      <div class="modern-content">
        ${modernContent}
      </div>
    `;
  }

  /**
   * Generates modern CSS styles for email templates
   * @returns CSS string with modern styling
   */
  private getModernStyles(): string {
    return `
      /* Reset and base styles */
      body {
        margin: 0;
        padding: 0;
        font-family: ${MODERN_EMAIL_STYLES.typography.fontFamily};
        background-color: ${MODERN_EMAIL_STYLES.colors.background};
        color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
        line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.normal};
        font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body};
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }

      /* Email wrapper and container */
      .email-wrapper {
        width: 100%;
        background-color: ${MODERN_EMAIL_STYLES.colors.background};
        padding: ${MODERN_EMAIL_STYLES.spacing.lg} 0;
      }

      .email-wrapper-cell {
        padding: 0 ${MODERN_EMAIL_STYLES.spacing.md};
      }

      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background-color: ${MODERN_EMAIL_STYLES.colors.cardBackground};
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.large};
        box-shadow: ${MODERN_EMAIL_STYLES.shadows.medium};
        overflow: hidden;
      }

      /* Header styles */
      .email-header {
        background: linear-gradient(135deg, ${MODERN_EMAIL_STYLES.colors.primary} 0%, ${MODERN_EMAIL_STYLES.colors.secondary} 100%);
        color: #ffffff;
        padding: ${MODERN_EMAIL_STYLES.spacing.xl} ${MODERN_EMAIL_STYLES.spacing.lg};
        text-align: center;
      }

      .email-header h1 {
        margin: 0;
        font-family: ${MODERN_EMAIL_STYLES.typography.headingFont};
        font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.title};
        font-weight: 400;
        letter-spacing: 1px;
        line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.tight};
      }

      .email-header .tagline {
        margin: ${MODERN_EMAIL_STYLES.spacing.sm} 0 0 0;
        font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body};
        opacity: 0.9;
        font-weight: 300;
      }

      /* Content styles */
      .email-content {
        padding: ${MODERN_EMAIL_STYLES.spacing.xl} ${MODERN_EMAIL_STYLES.spacing.lg};
        color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
        line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.relaxed};
      }

      /* Footer styles */
      .email-footer {
        background-color: ${MODERN_EMAIL_STYLES.colors.background};
        padding: ${MODERN_EMAIL_STYLES.spacing.lg};
        text-align: center;
        font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
        color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
        border-top: 1px solid ${MODERN_EMAIL_STYLES.colors.border};
      }

      /* Typography */
      h1, h2, h3, h4, h5, h6 {
        font-family: ${MODERN_EMAIL_STYLES.typography.headingFont};
        color: ${MODERN_EMAIL_STYLES.colors.primary};
        margin: ${MODERN_EMAIL_STYLES.spacing.lg} 0 ${MODERN_EMAIL_STYLES.spacing.md} 0;
        line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.tight};
      }

      h2 {
        font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.heading};
        font-weight: 600;
      }

      h3 {
        font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
        font-weight: 600;
      }

      p {
        margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.md} 0;
        color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
      }

      /* Links */
      a {
        color: ${MODERN_EMAIL_STYLES.colors.secondary};
        text-decoration: none;
      }

      a:hover {
        text-decoration: underline;
      }

      /* Tables */
      table {
        border-collapse: collapse;
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
      }

      .info-table {
        width: 100%;
        margin: ${MODERN_EMAIL_STYLES.spacing.md} 0;
      }

      .info-table td {
        padding: ${MODERN_EMAIL_STYLES.spacing.sm} ${MODERN_EMAIL_STYLES.spacing.md};
        border-bottom: 1px solid ${MODERN_EMAIL_STYLES.colors.border};
        vertical-align: top;
      }

      .info-table td:first-child {
        font-weight: 600;
        width: 40%;
        color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
      }

      /* Modern table styles */
      .items-table {
        width: 100%;
        margin: ${MODERN_EMAIL_STYLES.spacing.lg} 0;
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
        overflow: hidden;
        box-shadow: ${MODERN_EMAIL_STYLES.shadows.subtle};
      }

      .items-table th {
        background: linear-gradient(135deg, ${MODERN_EMAIL_STYLES.colors.primary} 0%, #34495e 100%);
        color: #ffffff;
        padding: ${MODERN_EMAIL_STYLES.spacing.md};
        text-align: left;
        font-weight: 600;
        font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body};
      }

      .items-table td {
        padding: ${MODERN_EMAIL_STYLES.spacing.md};
        border-bottom: 1px solid ${MODERN_EMAIL_STYLES.colors.border};
        background-color: ${MODERN_EMAIL_STYLES.colors.cardBackground};
      }

      .items-table tbody tr:nth-child(even) td {
        background-color: #f8f9fa;
      }

      .total-row td {
        font-weight: 600;
        font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
        background-color: ${MODERN_EMAIL_STYLES.colors.background} !important;
        border-top: 2px solid ${MODERN_EMAIL_STYLES.colors.primary};
      }

      /* Address and card styles */
      .address-box, .card-section {
        background-color: ${MODERN_EMAIL_STYLES.colors.cardBackground};
        padding: ${MODERN_EMAIL_STYLES.spacing.lg};
        margin: ${MODERN_EMAIL_STYLES.spacing.md} 0;
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
        border-left: 4px solid ${MODERN_EMAIL_STYLES.colors.secondary};
        box-shadow: ${MODERN_EMAIL_STYLES.shadows.subtle};
      }

      .card-section h3 {
        margin-top: 0;
        color: ${MODERN_EMAIL_STYLES.colors.primary};
      }

      /* Button styles */
      .btn {
        display: inline-block;
        padding: ${MODERN_EMAIL_STYLES.spacing.md} ${MODERN_EMAIL_STYLES.spacing.xl};
        margin: ${MODERN_EMAIL_STYLES.spacing.md} 0;
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
        text-decoration: none;
        font-weight: 600;
        font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
        min-height: 44px;
        line-height: 1.2;
        text-align: center;
        cursor: pointer;
        border: none;
      }

      .btn-primary {
        ${MODERN_BUTTON_STYLES.primary}
      }

      .btn-secondary {
        ${MODERN_BUTTON_STYLES.secondary}
      }

      .btn-success {
        ${MODERN_BUTTON_STYLES.success}
      }

      .btn-warning {
        ${MODERN_BUTTON_STYLES.warning}
      }

      /* Status badges */
      .status-badge {
        display: inline-block;
        padding: ${MODERN_EMAIL_STYLES.spacing.xs} ${MODERN_EMAIL_STYLES.spacing.md};
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.large};
        font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .status-pending { ${STATUS_BADGE_STYLES.pending} }
      .status-processing { ${STATUS_BADGE_STYLES.processing} }
      .status-shipped { ${STATUS_BADGE_STYLES.shipped} }
      .status-delivered { ${STATUS_BADGE_STYLES.delivered} }
      .status-cancelled { ${STATUS_BADGE_STYLES.cancelled} }
      .status-refunded { ${STATUS_BADGE_STYLES.refunded} }
    `;
  }

  /**
   * Generates comprehensive responsive CSS styles for different screen sizes
   * Implements mobile-first responsive design approach with touch-friendly sizing
   * @returns CSS string with responsive media queries for desktop, tablet, and mobile
   */
  private getResponsiveStyles(): string {
    return `
      /* Base mobile-first styles (default) */
      .email-wrapper {
        width: 100% !important;
        min-width: 320px !important;
      }

      .email-container {
        max-width: 100% !important;
        width: 100% !important;
      }

      /* Ensure content is readable without horizontal scrolling */
      .email-content,
      .email-header,
      .email-footer {
        word-wrap: break-word !important;
        word-break: break-word !important;
        overflow-wrap: break-word !important;
      }

      /* Touch-friendly sizing for interactive elements */
      .btn,
      a[href] {
        min-height: ${ACCESSIBILITY_STANDARDS.minTouchTarget} !important;
        min-width: ${ACCESSIBILITY_STANDARDS.minTouchTarget} !important;
        display: inline-block !important;
        padding: ${MODERN_EMAIL_STYLES.spacing.md} ${MODERN_EMAIL_STYLES.spacing.lg} !important;
        text-align: center !important;
        line-height: 1.2 !important;
        box-sizing: border-box !important;
      }

      /* Mobile styles (up to 480px) */
      @media only screen and (${RESPONSIVE_BREAKPOINTS.mobile}) {
        /* Container adjustments */
        .email-wrapper-cell {
          padding: 0 ${MODERN_EMAIL_STYLES.spacing.sm} !important;
        }

        .email-container {
          border-radius: 0 !important;
          box-shadow: none !important;
          margin: 0 !important;
        }

        /* Header responsive adjustments */
        .email-header {
          padding: ${MODERN_EMAIL_STYLES.spacing.lg} ${MODERN_EMAIL_STYLES.spacing.md} !important;
          text-align: center !important;
        }

        .email-header h1 {
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.heading} !important;
          line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.tight} !important;
        }

        .email-header .tagline {
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small} !important;
        }

        /* Content area adjustments */
        .email-content {
          padding: ${MODERN_EMAIL_STYLES.spacing.lg} ${MODERN_EMAIL_STYLES.spacing.md} !important;
        }

        .email-footer {
          padding: ${MODERN_EMAIL_STYLES.spacing.md} !important;
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small} !important;
        }

        /* Typography scaling */
        h2 {
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large} !important;
          margin: ${MODERN_EMAIL_STYLES.spacing.md} 0 ${MODERN_EMAIL_STYLES.spacing.sm} 0 !important;
        }

        h3 {
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body} !important;
          margin: ${MODERN_EMAIL_STYLES.spacing.md} 0 ${MODERN_EMAIL_STYLES.spacing.sm} 0 !important;
        }

        h4 {
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body} !important;
        }

        p {
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body} !important;
          line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.relaxed} !important;
        }

        /* Table responsive behavior */
        .items-table {
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small} !important;
        }

        .items-table th,
        .items-table td {
          padding: ${MODERN_EMAIL_STYLES.spacing.sm} ${MODERN_EMAIL_STYLES.spacing.xs} !important;
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small} !important;
        }

        .items-table th {
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small} !important;
          font-weight: 600 !important;
        }

        /* Card and section adjustments */
        .address-box,
        .card-section {
          padding: ${MODERN_EMAIL_STYLES.spacing.md} !important;
          margin: ${MODERN_EMAIL_STYLES.spacing.sm} 0 !important;
          border-radius: ${MODERN_EMAIL_STYLES.borderRadius.small} !important;
        }

        /* Button mobile optimization */
        .btn {
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
          margin: ${MODERN_EMAIL_STYLES.spacing.sm} 0 !important;
          padding: ${MODERN_EMAIL_STYLES.spacing.md} !important;
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large} !important;
          min-height: ${ACCESSIBILITY_STANDARDS.minTouchTarget} !important;
        }

        /* Status badges mobile sizing */
        .status-badge {
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small} !important;
          padding: ${MODERN_EMAIL_STYLES.spacing.xs} ${MODERN_EMAIL_STYLES.spacing.sm} !important;
        }

        /* Info table mobile optimization */
        .info-table td {
          padding: ${MODERN_EMAIL_STYLES.spacing.sm} !important;
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small} !important;
        }

        .info-table td:first-child {
          width: 35% !important;
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small} !important;
        }

        /* Totals table mobile optimization */
        .totals-table {
          margin: ${MODERN_EMAIL_STYLES.spacing.md} 0 !important;
        }

        .totals-table td {
          padding: ${MODERN_EMAIL_STYLES.spacing.sm} !important;
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small} !important;
        }
      }

      /* Very small mobile screens (up to 360px) */
      @media only screen and (max-width: 360px) {
        .email-header {
          padding: ${MODERN_EMAIL_STYLES.spacing.md} ${MODERN_EMAIL_STYLES.spacing.sm} !important;
        }

        .email-content {
          padding: ${MODERN_EMAIL_STYLES.spacing.md} ${MODERN_EMAIL_STYLES.spacing.sm} !important;
        }

        .email-header h1 {
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large} !important;
        }

        /* Stack table cells vertically on very small screens */
        .items-table,
        .items-table thead,
        .items-table tbody,
        .items-table th,
        .items-table td,
        .items-table tr {
          display: block !important;
        }

        .items-table thead tr {
          position: absolute !important;
          top: -9999px !important;
          left: -9999px !important;
        }

        .items-table tr {
          border: 1px solid ${MODERN_EMAIL_STYLES.colors.border} !important;
          margin-bottom: ${MODERN_EMAIL_STYLES.spacing.sm} !important;
          border-radius: ${MODERN_EMAIL_STYLES.borderRadius.small} !important;
          padding: ${MODERN_EMAIL_STYLES.spacing.sm} !important;
          background-color: ${MODERN_EMAIL_STYLES.colors.cardBackground} !important;
        }

        .items-table td {
          border: none !important;
          position: relative !important;
          padding-left: 50% !important;
          text-align: right !important;
          padding-top: ${MODERN_EMAIL_STYLES.spacing.xs} !important;
          padding-bottom: ${MODERN_EMAIL_STYLES.spacing.xs} !important;
        }

        .items-table td:before {
          content: attr(data-label) ": " !important;
          position: absolute !important;
          left: ${MODERN_EMAIL_STYLES.spacing.sm} !important;
          width: 45% !important;
          text-align: left !important;
          font-weight: 600 !important;
          color: ${MODERN_EMAIL_STYLES.colors.textSecondary} !important;
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small} !important;
        }
      }

      /* Tablet styles (481px to 768px) */
      @media only screen and (min-width: 481px) and (${RESPONSIVE_BREAKPOINTS.tablet}) {
        .email-container {
          margin: 0 ${MODERN_EMAIL_STYLES.spacing.md} !important;
          border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium} !important;
        }

        .email-header {
          padding: ${MODERN_EMAIL_STYLES.spacing.xl} ${MODERN_EMAIL_STYLES.spacing.lg} !important;
        }

        .email-content {
          padding: ${MODERN_EMAIL_STYLES.spacing.xl} ${MODERN_EMAIL_STYLES.spacing.lg} !important;
        }

        .btn {
          width: auto !important;
          min-width: 200px !important;
          display: inline-block !important;
        }

        .items-table th,
        .items-table td {
          padding: ${MODERN_EMAIL_STYLES.spacing.md} ${MODERN_EMAIL_STYLES.spacing.sm} !important;
        }
      }

      /* Desktop styles (769px and up) */
      @media only screen and (${RESPONSIVE_BREAKPOINTS.desktop}) {
        .email-wrapper-cell {
          padding: 0 ${MODERN_EMAIL_STYLES.spacing.lg} !important;
        }

        .email-container {
          max-width: 600px !important;
          margin: 0 auto !important;
          border-radius: ${MODERN_EMAIL_STYLES.borderRadius.large} !important;
          box-shadow: ${MODERN_EMAIL_STYLES.shadows.medium} !important;
        }

        .email-header {
          padding: ${MODERN_EMAIL_STYLES.spacing.xxl} ${MODERN_EMAIL_STYLES.spacing.xl} !important;
        }

        .email-content {
          padding: ${MODERN_EMAIL_STYLES.spacing.xxl} ${MODERN_EMAIL_STYLES.spacing.xl} !important;
        }

        .email-footer {
          padding: ${MODERN_EMAIL_STYLES.spacing.xl} !important;
        }

        /* Desktop button styling */
        .btn {
          width: auto !important;
          min-width: 180px !important;
          margin: ${MODERN_EMAIL_STYLES.spacing.md} ${MODERN_EMAIL_STYLES.spacing.sm} !important;
        }

        /* Desktop table optimization */
        .items-table th,
        .items-table td {
          padding: ${MODERN_EMAIL_STYLES.spacing.md} !important;
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body} !important;
        }

        .address-box,
        .card-section {
          padding: ${MODERN_EMAIL_STYLES.spacing.xl} !important;
          margin: ${MODERN_EMAIL_STYLES.spacing.lg} 0 !important;
        }
      }

      /* High DPI displays */
      @media only screen and (-webkit-min-device-pixel-ratio: 2),
             only screen and (min-resolution: 192dpi) {
        /* Ensure images and icons are crisp on high DPI displays */
        img {
          -ms-interpolation-mode: bicubic !important;
        }
      }

      /* Landscape orientation adjustments */
      @media only screen and (orientation: landscape) and (max-height: 480px) {
        .email-header {
          padding: ${MODERN_EMAIL_STYLES.spacing.md} ${MODERN_EMAIL_STYLES.spacing.lg} !important;
        }

        .email-content {
          padding: ${MODERN_EMAIL_STYLES.spacing.lg} !important;
        }
      }
    `;
  }

  /**
   * Generates comprehensive accessibility-compliant CSS styles
   * Implements WCAG 2.1 AA standards for color contrast, font sizes, keyboard navigation,
   * and screen reader optimization
   * @returns CSS string with comprehensive accessibility features
   */
  private getAccessibilityStyles(): string {
    return `
      /* Screen reader only content */
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

      /* Skip link for keyboard navigation */
      .skip-link {
        position: absolute !important;
        top: -40px !important;
        left: 6px !important;
        background: ${MODERN_EMAIL_STYLES.colors.primary} !important;
        color: #ffffff !important;
        padding: 8px !important;
        text-decoration: none !important;
        border-radius: 4px !important;
        font-weight: 600 !important;
        z-index: 1000 !important;
        transition: top 0.3s !important;
      }

      .skip-link:focus {
        top: 6px !important;
        ${ACCESSIBILITY_STANDARDS.focusIndicator}
      }

      /* Enhanced focus indicators for all interactive elements */
      a:focus,
      .btn:focus,
      button:focus,
      input:focus,
      select:focus,
      textarea:focus,
      [tabindex]:focus {
        ${ACCESSIBILITY_STANDARDS.focusIndicator}
        box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.3) !important;
        transition: outline 0.2s ease-in-out, box-shadow 0.2s ease-in-out !important;
      }

      /* Ensure focus is visible even in high contrast mode */
      @media (prefers-contrast: high) {
        a:focus,
        .btn:focus,
        button:focus,
        input:focus,
        select:focus,
        textarea:focus,
        [tabindex]:focus {
          outline: ${ACCESSIBILITY_STANDARDS.highContrast.focusOutlineWidth} solid currentColor !important;
          outline-offset: 2px !important;
        }
      }

      /* High contrast mode support */
      @media (prefers-contrast: high) {
        .email-container {
          border: ${ACCESSIBILITY_STANDARDS.highContrast.borderWidth} solid ${MODERN_EMAIL_STYLES.colors.textPrimary} !important;
        }

        .btn {
          border: ${ACCESSIBILITY_STANDARDS.highContrast.borderWidth} solid currentColor !important;
          font-weight: 700 !important;
        }

        .card-section,
        .address-box {
          border: ${ACCESSIBILITY_STANDARDS.highContrast.borderWidth} solid ${MODERN_EMAIL_STYLES.colors.textPrimary} !important;
        }

        .items-table th,
        .items-table td {
          border: 1px solid ${MODERN_EMAIL_STYLES.colors.textPrimary} !important;
        }

        .status-badge {
          border: ${ACCESSIBILITY_STANDARDS.highContrast.borderWidth} solid currentColor !important;
          font-weight: 700 !important;
        }
      }

      /* Reduced motion support for users with vestibular disorders */
      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }

        /* Remove gradient animations in reduced motion */
        .btn-primary,
        .btn-success,
        .btn-warning {
          background: ${MODERN_EMAIL_STYLES.colors.primary} !important;
        }

        .email-header {
          background: ${MODERN_EMAIL_STYLES.colors.primary} !important;
        }
      }

      /* Ensure minimum font sizes for readability */
      body, p, td, th, div, span, li, blockquote {
        font-size: ${ACCESSIBILITY_STANDARDS.minFontSize} !important;
        line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.normal} !important;
      }

      /* Larger font sizes for headings to maintain hierarchy */
      h1 {
        font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.title} !important;
        line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.tight} !important;
      }

      h2 {
        font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.heading} !important;
        line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.tight} !important;
      }

      h3 {
        font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large} !important;
        line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.tight} !important;
      }

      h4, h5, h6 {
        font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body} !important;
        line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.normal} !important;
        font-weight: 600 !important;
      }

      /* Ensure minimum touch targets for mobile accessibility */
      .btn,
      a[href],
      button,
      input,
      select,
      textarea,
      [role="button"],
      [tabindex]:not([tabindex="-1"]) {
        min-height: ${ACCESSIBILITY_STANDARDS.minTouchTarget} !important;
        min-width: ${ACCESSIBILITY_STANDARDS.minTouchTarget} !important;
        display: inline-block !important;
        text-align: center !important;
        line-height: 1.2 !important;
        box-sizing: border-box !important;
        cursor: pointer !important;
      }

      /* Ensure proper spacing between interactive elements */
      .btn + .btn,
      a[href] + a[href],
      button + button {
        margin-left: ${MODERN_EMAIL_STYLES.spacing.sm} !important;
      }

      /* Color contrast compliance - ensure all text meets WCAG AA standards */
      .text-primary {
        color: ${MODERN_EMAIL_STYLES.colors.textPrimary} !important;
      }

      .text-secondary {
        color: ${MODERN_EMAIL_STYLES.colors.textSecondary} !important;
      }

      /* Ensure links have sufficient contrast and are identifiable */
      a {
        color: ${MODERN_EMAIL_STYLES.colors.secondary} !important;
        text-decoration: underline !important;
        font-weight: 500 !important;
      }

      a:hover {
        color: ${MODERN_EMAIL_STYLES.colors.primary} !important;
        text-decoration: underline !important;
      }

      /* Status badges with proper contrast ratios */
      .status-badge {
        font-weight: 600 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.5px !important;
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.large} !important;
        padding: ${MODERN_EMAIL_STYLES.spacing.xs} ${MODERN_EMAIL_STYLES.spacing.md} !important;
        display: inline-block !important;
        min-height: 24px !important;
        line-height: 1.2 !important;
      }

      /* Table accessibility improvements */
      table {
        border-collapse: collapse !important;
        width: 100% !important;
      }

      th {
        font-weight: 600 !important;
        text-align: left !important;
        background-color: ${MODERN_EMAIL_STYLES.colors.primary} !important;
        color: #ffffff !important;
      }

      /* Ensure table headers are properly associated with data */
      .items-table th[scope="col"] {
        scope: col !important;
      }

      .items-table td[headers] {
        /* Headers attribute will be added programmatically */
      }

      /* Language and direction support */
      [lang="vi"] {
        font-family: ${MODERN_EMAIL_STYLES.typography.fontFamily} !important;
      }

      [dir="rtl"] {
        text-align: right !important;
      }

      [dir="rtl"] .email-header,
      [dir="rtl"] .email-footer {
        text-align: center !important;
      }

      /* Print accessibility - ensure content is readable when printed */
      @media print {
        .skip-link {
          display: none !important;
        }

        a {
          color: #000000 !important;
          text-decoration: underline !important;
        }

        .btn {
          border: 2px solid #000000 !important;
          background: transparent !important;
          color: #000000 !important;
        }

        /* Ensure sufficient contrast in print */
        .status-badge {
          border: 1px solid #000000 !important;
          background: transparent !important;
          color: #000000 !important;
        }
      }

      /* Error and success message accessibility */
      .alert {
        padding: ${MODERN_EMAIL_STYLES.spacing.md} !important;
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium} !important;
        margin: ${MODERN_EMAIL_STYLES.spacing.md} 0 !important;
        font-weight: 500 !important;
      }

      .alert-success {
        background-color: #d4edda !important;
        border: 1px solid #c3e6cb !important;
        color: #155724 !important;
      }

      .alert-warning {
        background-color: #fff3cd !important;
        border: 1px solid #ffeaa7 !important;
        color: #856404 !important;
      }

      .alert-error {
        background-color: #f8d7da !important;
        border: 1px solid #f5c6cb !important;
        color: #721c24 !important;
      }

      /* Ensure form elements are accessible if present */
      input, select, textarea {
        border: 2px solid ${MODERN_EMAIL_STYLES.colors.border} !important;
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.small} !important;
        padding: ${MODERN_EMAIL_STYLES.spacing.sm} !important;
        font-size: ${ACCESSIBILITY_STANDARDS.minFontSize} !important;
        line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.normal} !important;
      }

      input:focus, select:focus, textarea:focus {
        border-color: ${MODERN_EMAIL_STYLES.colors.secondary} !important;
        ${ACCESSIBILITY_STANDARDS.focusIndicator}
      }

      /* Ensure proper heading hierarchy is maintained */
      .email-content h1 {
        margin-top: 0 !important;
      }

      .email-content h2 {
        margin-top: ${MODERN_EMAIL_STYLES.spacing.xl} !important;
      }

      .email-content h3 {
        margin-top: ${MODERN_EMAIL_STYLES.spacing.lg} !important;
      }

      .email-content h4,
      .email-content h5,
      .email-content h6 {
        margin-top: ${MODERN_EMAIL_STYLES.spacing.md} !important;
      }
    `;
  }

  /**
   * Generates comprehensive dark mode CSS styles with email client compatibility
   * Implements dark mode compatible color palette, ensures readability and accessibility,
   * and includes testing for major email clients that support dark mode
   * @returns CSS string with comprehensive dark mode overrides and email client compatibility
   */
  private getDarkModeStyles(): string {
    return `
      /* Dark mode styles with comprehensive email client support */

      /* Primary dark mode media query for modern email clients */
      @media (prefers-color-scheme: dark) {
        /* Email structure and layout */
        .email-wrapper {
          background-color: ${DARK_MODE_COLORS.background} !important;
        }

        .email-container {
          background-color: ${DARK_MODE_COLORS.cardBackground} !important;
          color: ${DARK_MODE_COLORS.textPrimary} !important;
          border: 1px solid ${DARK_MODE_COLORS.border} !important;
        }

        .email-content {
          color: ${DARK_MODE_COLORS.textPrimary} !important;
          background-color: ${DARK_MODE_COLORS.cardBackground} !important;
        }

        /* Header styling for dark mode */
        .email-header {
          background: linear-gradient(135deg, ${DARK_MODE_COLORS.primary} 0%, ${DARK_MODE_COLORS.secondary} 100%) !important;
          color: ${DARK_MODE_COLORS.textPrimary} !important;
        }

        .email-header h1 {
          color: ${DARK_MODE_COLORS.textPrimary} !important;
        }

        .email-header .tagline {
          color: rgba(255, 255, 255, 0.9) !important;
        }

        /* Footer styling for dark mode */
        .email-footer {
          background-color: ${DARK_MODE_COLORS.background} !important;
          color: ${DARK_MODE_COLORS.textSecondary} !important;
          border-top-color: ${DARK_MODE_COLORS.border} !important;
        }

        /* Typography adjustments for dark mode */
        h1, h2, h3, h4, h5, h6 {
          color: ${DARK_MODE_COLORS.textPrimary} !important;
        }

        p, span, div, td, th {
          color: ${DARK_MODE_COLORS.textPrimary} !important;
        }

        /* Secondary text elements */
        .text-secondary,
        .info-table td:first-child {
          color: ${DARK_MODE_COLORS.textSecondary} !important;
        }

        /* Link styling for dark mode */
        a {
          color: ${DARK_MODE_COLORS.secondary} !important;
        }

        a:hover {
          color: ${DARK_MODE_COLORS.primary} !important;
        }

        /* Table styling for dark mode */
        .info-table td {
          border-bottom-color: ${DARK_MODE_COLORS.border} !important;
          background-color: ${DARK_MODE_COLORS.cardBackground} !important;
        }

        .items-table {
          background-color: ${DARK_MODE_COLORS.cardBackground} !important;
          border: 1px solid ${DARK_MODE_COLORS.border} !important;
        }

        .items-table th {
          background: linear-gradient(135deg, ${DARK_MODE_COLORS.primary} 0%, #34495e 100%) !important;
          color: ${DARK_MODE_COLORS.textPrimary} !important;
          border-bottom-color: ${DARK_MODE_COLORS.border} !important;
        }

        .items-table td {
          background-color: ${DARK_MODE_COLORS.cardBackground} !important;
          border-bottom-color: ${DARK_MODE_COLORS.border} !important;
          color: ${DARK_MODE_COLORS.textPrimary} !important;
        }

        .items-table tbody tr:nth-child(even) td {
          background-color: ${DARK_MODE_COLORS.background} !important;
        }

        .total-row td {
          background-color: ${DARK_MODE_COLORS.background} !important;
          border-top-color: ${DARK_MODE_COLORS.primary} !important;
          color: ${DARK_MODE_COLORS.textPrimary} !important;
        }

        /* Card and section styling for dark mode */
        .address-box,
        .card-section {
          background-color: ${DARK_MODE_COLORS.cardBackground} !important;
          border-left-color: ${DARK_MODE_COLORS.primary} !important;
          border: 1px solid ${DARK_MODE_COLORS.border} !important;
          color: ${DARK_MODE_COLORS.textPrimary} !important;
        }

        .card-section h3,
        .address-box h4 {
          color: ${DARK_MODE_COLORS.textPrimary} !important;
        }

        /* Button styling for dark mode */
        .btn-primary {
          background: linear-gradient(135deg, ${DARK_MODE_COLORS.primary} 0%, ${DARK_MODE_COLORS.secondary} 100%) !important;
          color: ${DARK_MODE_COLORS.textPrimary} !important;
          border: 1px solid ${DARK_MODE_COLORS.border} !important;
        }

        .btn-secondary {
          background-color: ${DARK_MODE_COLORS.cardBackground} !important;
          color: ${DARK_MODE_COLORS.textPrimary} !important;
          border: 2px solid ${DARK_MODE_COLORS.border} !important;
        }

        .btn-success {
          background: linear-gradient(135deg, ${DARK_MODE_COLORS.success} 0%, #2ecc71 100%) !important;
          color: ${DARK_MODE_COLORS.textPrimary} !important;
        }

        .btn-warning {
          background: linear-gradient(135deg, ${DARK_MODE_COLORS.warning} 0%, #e67e22 100%) !important;
          color: ${DARK_MODE_COLORS.textPrimary} !important;
        }

        /* Status badge adjustments for dark mode */
        .status-badge {
          border: 1px solid ${DARK_MODE_COLORS.border} !important;
        }

        .status-pending {
          background-color: ${DARK_MODE_COLORS.warning} !important;
          color: #000000 !important; /* High contrast for readability */
        }

        .status-processing {
          background-color: ${DARK_MODE_COLORS.secondary} !important;
          color: ${DARK_MODE_COLORS.textPrimary} !important;
        }

        .status-shipped {
          background-color: #9b59b6 !important;
          color: ${DARK_MODE_COLORS.textPrimary} !important;
        }

        .status-delivered {
          background-color: ${DARK_MODE_COLORS.success} !important;
          color: ${DARK_MODE_COLORS.textPrimary} !important;
        }

        .status-cancelled {
          background-color: ${DARK_MODE_COLORS.accent} !important;
          color: ${DARK_MODE_COLORS.textPrimary} !important;
        }

        .status-refunded {
          background-color: #95a5a6 !important;
          color: ${DARK_MODE_COLORS.textPrimary} !important;
        }

        /* Image and media adjustments for dark mode */
        .image-container {
          background-color: ${DARK_MODE_COLORS.background} !important;
          border: 1px solid ${DARK_MODE_COLORS.border} !important;
        }

        .image-fallback {
          background-color: ${DARK_MODE_COLORS.background} !important;
          color: ${DARK_MODE_COLORS.textSecondary} !important;
          border-color: ${DARK_MODE_COLORS.border} !important;
        }

        /* Form elements for dark mode (if present) */
        input, select, textarea {
          background-color: ${DARK_MODE_COLORS.cardBackground} !important;
          color: ${DARK_MODE_COLORS.textPrimary} !important;
          border-color: ${DARK_MODE_COLORS.border} !important;
        }

        input:focus, select:focus, textarea:focus {
          border-color: ${DARK_MODE_COLORS.secondary} !important;
          box-shadow: 0 0 0 3px rgba(77, 144, 226, 0.3) !important;
        }

        /* Alert and notification styling for dark mode */
        .alert-success {
          background-color: rgba(46, 204, 113, 0.2) !important;
          border-color: ${DARK_MODE_COLORS.success} !important;
          color: ${DARK_MODE_COLORS.textPrimary} !important;
        }

        .alert-warning {
          background-color: rgba(243, 156, 18, 0.2) !important;
          border-color: ${DARK_MODE_COLORS.warning} !important;
          color: ${DARK_MODE_COLORS.textPrimary} !important;
        }

        .alert-error {
          background-color: rgba(231, 76, 60, 0.2) !important;
          border-color: ${DARK_MODE_COLORS.accent} !important;
          color: ${DARK_MODE_COLORS.textPrimary} !important;
        }

        /* Accessibility enhancements for dark mode */
        .skip-link {
          background: ${DARK_MODE_COLORS.primary} !important;
          color: ${DARK_MODE_COLORS.textPrimary} !important;
        }

        /* Focus indicators for dark mode */
        a:focus,
        .btn:focus,
        button:focus,
        input:focus,
        select:focus,
        textarea:focus,
        [tabindex]:focus {
          outline-color: ${DARK_MODE_COLORS.secondary} !important;
          box-shadow: 0 0 0 3px rgba(77, 144, 226, 0.3) !important;
        }
      }

      /* Apple Mail dark mode support (iOS/macOS) */
      @media (prefers-color-scheme: dark) and (-webkit-min-device-pixel-ratio: 0) {
        .email-container {
          -webkit-text-size-adjust: 100% !important;
        }

        /* Apple Mail specific dark mode adjustments */
        .apple-mail-dark {
          background-color: ${DARK_MODE_COLORS.background} !important;
          color: ${DARK_MODE_COLORS.textPrimary} !important;
        }
      }

      /* Gmail dark mode support (limited) */
      @media screen and (prefers-color-scheme: dark) {
        /* Gmail has limited dark mode support, so we use more conservative styles */
        .gmail-dark-mode .email-container {
          background-color: ${DARK_MODE_COLORS.cardBackground} !important;
          color: ${DARK_MODE_COLORS.textPrimary} !important;
        }

        .gmail-dark-mode .email-header {
          background-color: ${DARK_MODE_COLORS.primary} !important;
        }

        .gmail-dark-mode .email-footer {
          background-color: ${DARK_MODE_COLORS.background} !important;
        }
      }

      /* Outlook dark mode support (Windows 10/11) */
      @media (prefers-color-scheme: dark) {
        /* Outlook specific dark mode styles */
        [data-ogsc] .email-container {
          background-color: ${DARK_MODE_COLORS.cardBackground} !important;
          color: ${DARK_MODE_COLORS.textPrimary} !important;
        }

        [data-ogsc] .email-header {
          background-color: ${DARK_MODE_COLORS.primary} !important;
        }

        [data-ogsc] .items-table th {
          background-color: ${DARK_MODE_COLORS.primary} !important;
        }

        /* Outlook button fixes for dark mode */
        [data-ogsc] .btn {
          mso-style-priority: 99 !important;
        }
      }

      /* Thunderbird dark mode support */
      @media (prefers-color-scheme: dark) {
        .thunderbird-dark .email-wrapper {
          background-color: ${DARK_MODE_COLORS.background} !important;
        }

        .thunderbird-dark .email-container {
          background-color: ${DARK_MODE_COLORS.cardBackground} !important;
          color: ${DARK_MODE_COLORS.textPrimary} !important;
        }
      }

      /* High contrast dark mode support */
      @media (prefers-color-scheme: dark) and (prefers-contrast: high) {
        .email-container {
          border: 2px solid ${DARK_MODE_COLORS.textPrimary} !important;
        }

        .btn {
          border: 2px solid currentColor !important;
          font-weight: 700 !important;
        }

        .card-section,
        .address-box {
          border: 2px solid ${DARK_MODE_COLORS.textPrimary} !important;
        }

        .items-table th,
        .items-table td {
          border: 1px solid ${DARK_MODE_COLORS.textPrimary} !important;
        }

        .status-badge {
          border: 2px solid currentColor !important;
          font-weight: 700 !important;
        }

        /* Ensure maximum contrast for text */
        h1, h2, h3, h4, h5, h6, p, span, div, td, th {
          color: #ffffff !important;
        }

        .text-secondary {
          color: #cccccc !important;
        }
      }

      /* Reduced motion support in dark mode */
      @media (prefers-color-scheme: dark) and (prefers-reduced-motion: reduce) {
        .btn-primary,
        .btn-success,
        .btn-warning,
        .email-header {
          background: ${DARK_MODE_COLORS.primary} !important;
        }

        .items-table th {
          background: ${DARK_MODE_COLORS.primary} !important;
        }
      }

      /* Dark mode meta tag support for email clients */
      [data-color-scheme="dark"] .email-container,
      [data-color-scheme="dark"] .email-wrapper {
        background-color: ${DARK_MODE_COLORS.background} !important;
        color: ${DARK_MODE_COLORS.textPrimary} !important;
      }

      /* Force dark mode class support (for manual dark mode toggles) */
      .dark-mode .email-wrapper {
        background-color: ${DARK_MODE_COLORS.background} !important;
      }

      .dark-mode .email-container {
        background-color: ${DARK_MODE_COLORS.cardBackground} !important;
        color: ${DARK_MODE_COLORS.textPrimary} !important;
      }

      .dark-mode .email-header {
        background: linear-gradient(135deg, ${DARK_MODE_COLORS.primary} 0%, ${DARK_MODE_COLORS.secondary} 100%) !important;
      }

      .dark-mode .email-footer {
        background-color: ${DARK_MODE_COLORS.background} !important;
        color: ${DARK_MODE_COLORS.textSecondary} !important;
      }

      .dark-mode h1,
      .dark-mode h2,
      .dark-mode h3,
      .dark-mode h4,
      .dark-mode h5,
      .dark-mode h6,
      .dark-mode p,
      .dark-mode td,
      .dark-mode th {
        color: ${DARK_MODE_COLORS.textPrimary} !important;
      }

      .dark-mode a {
        color: ${DARK_MODE_COLORS.secondary} !important;
      }

      .dark-mode .items-table th {
        background: linear-gradient(135deg, ${DARK_MODE_COLORS.primary} 0%, #34495e 100%) !important;
        color: ${DARK_MODE_COLORS.textPrimary} !important;
      }

      .dark-mode .items-table td {
        background-color: ${DARK_MODE_COLORS.cardBackground} !important;
        border-bottom-color: ${DARK_MODE_COLORS.border} !important;
        color: ${DARK_MODE_COLORS.textPrimary} !important;
      }

      .dark-mode .address-box,
      .dark-mode .card-section {
        background-color: ${DARK_MODE_COLORS.cardBackground} !important;
        border-left-color: ${DARK_MODE_COLORS.primary} !important;
        color: ${DARK_MODE_COLORS.textPrimary} !important;
      }
    `;
  }

  /**
   * Generates advanced background styling with subtle patterns and gradients
   * Implements sophisticated background designs that enhance visual appeal without compromising readability
   * Includes email client fallbacks for complex backgrounds and ensures accessibility compliance
   * @returns CSS string with advanced background styling and email client compatibility
   */
  private getAdvancedBackgroundStyles(): string {
    return `
      /* Advanced background styling with email client compatibility */

      /* Subtle gradient backgrounds for main sections */
      .email-wrapper {
        background: linear-gradient(135deg, ${MODERN_EMAIL_STYLES.colors.background} 0%, #f1f3f4 100%);
        /* Fallback for email clients that don't support gradients */
        background-color: ${MODERN_EMAIL_STYLES.colors.background};
      }

      /* Enhanced header background with sophisticated gradient */
      .email-header {
        background: linear-gradient(135deg, ${MODERN_EMAIL_STYLES.colors.primary} 0%, ${MODERN_EMAIL_STYLES.colors.secondary} 50%, #34495e 100%);
        /* Fallback for older email clients */
        background-color: ${MODERN_EMAIL_STYLES.colors.primary};
        position: relative;
        overflow: hidden;
      }

      /* Subtle pattern overlay for header (CSS-only) */
      .email-header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image:
          radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 2px, transparent 2px),
          radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 1px, transparent 1px);
        background-size: 20px 20px, 15px 15px;
        background-position: 0 0, 10px 10px;
        pointer-events: none;
        z-index: 1;
      }

      /* Ensure header content is above the pattern */
      .email-header > * {
        position: relative;
        z-index: 2;
      }

      /* Card backgrounds with subtle texture */
      .card-section,
      .address-box {
        background: linear-gradient(145deg, ${MODERN_EMAIL_STYLES.colors.cardBackground} 0%, #fafbfc 100%);
        /* Fallback for email clients that don't support gradients */
        background-color: ${MODERN_EMAIL_STYLES.colors.cardBackground};
        position: relative;
      }

      /* Subtle texture pattern for cards */
      .card-section::after,
      .address-box::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image:
          linear-gradient(45deg, transparent 40%, rgba(0,0,0,0.01) 50%, transparent 60%),
          linear-gradient(-45deg, transparent 40%, rgba(0,0,0,0.01) 50%, transparent 60%);
        background-size: 8px 8px;
        pointer-events: none;
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
        z-index: 1;
      }

      /* Ensure card content is above the texture */
      .card-section > *,
      .address-box > * {
        position: relative;
        z-index: 2;
      }

      /* Enhanced footer background */
      .email-footer {
        background: linear-gradient(180deg, ${MODERN_EMAIL_STYLES.colors.background} 0%, #e8eaed 100%);
        /* Fallback for email clients that don't support gradients */
        background-color: ${MODERN_EMAIL_STYLES.colors.background};
        position: relative;
      }

      /* Subtle footer pattern */
      .email-footer::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image:
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.02) 2px,
            rgba(0,0,0,0.02) 4px
          );
        pointer-events: none;
        z-index: 1;
      }

      /* Ensure footer content is above the pattern */
      .email-footer > * {
        position: relative;
        z-index: 2;
      }

      /* Table background enhancements */
      .items-table {
        background: linear-gradient(145deg, ${MODERN_EMAIL_STYLES.colors.cardBackground} 0%, #f8f9fa 100%);
        /* Fallback for email clients that don't support gradients */
        background-color: ${MODERN_EMAIL_STYLES.colors.cardBackground};
      }

      .items-table th {
        background: linear-gradient(135deg, ${MODERN_EMAIL_STYLES.colors.primary} 0%, ${MODERN_EMAIL_STYLES.colors.secondary} 50%, #34495e 100%);
        /* Fallback for email clients that don't support gradients */
        background-color: ${MODERN_EMAIL_STYLES.colors.primary};
        position: relative;
      }

      /* Subtle pattern for table headers */
      .items-table th::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image:
          linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%),
          linear-gradient(-45deg, rgba(255,255,255,0.1) 25%, transparent 25%);
        background-size: 4px 4px;
        background-position: 0 0, 2px 2px;
        pointer-events: none;
        z-index: 1;
      }

      /* Ensure table header content is above the pattern */
      .items-table th > * {
        position: relative;
        z-index: 2;
      }

      /* Button background enhancements */
      .btn-primary {
        background: linear-gradient(135deg, ${MODERN_EMAIL_STYLES.colors.primary} 0%, ${MODERN_EMAIL_STYLES.colors.secondary} 100%);
        /* Fallback for email clients that don't support gradients */
        background-color: ${MODERN_EMAIL_STYLES.colors.primary};
        position: relative;
        overflow: hidden;
      }

      /* Subtle shine effect for primary buttons */
      .btn-primary::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transition: left 0.5s ease;
        pointer-events: none;
        z-index: 1;
      }

      .btn-primary:hover::before {
        left: 100%;
      }

      /* Ensure button content is above effects */
      .btn-primary > * {
        position: relative;
        z-index: 2;
      }

      /* Status badge background enhancements */
      .status-badge {
        position: relative;
        overflow: hidden;
      }

      .status-pending {
        background: linear-gradient(135deg, ${MODERN_EMAIL_STYLES.colors.warning} 0%, #e67e22 100%);
        /* Fallback for email clients that don't support gradients */
        background-color: ${MODERN_EMAIL_STYLES.colors.warning};
      }

      .status-processing {
        background: linear-gradient(135deg, ${MODERN_EMAIL_STYLES.colors.secondary} 0%, #2980b9 100%);
        /* Fallback for email clients that don't support gradients */
        background-color: ${MODERN_EMAIL_STYLES.colors.secondary};
      }

      .status-shipped {
        background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
        /* Fallback for email clients that don't support gradients */
        background-color: #9b59b6;
      }

      .status-delivered {
        background: linear-gradient(135deg, ${MODERN_EMAIL_STYLES.colors.success} 0%, #229954 100%);
        /* Fallback for email clients that don't support gradients */
        background-color: ${MODERN_EMAIL_STYLES.colors.success};
      }

      .status-cancelled {
        background: linear-gradient(135deg, ${MODERN_EMAIL_STYLES.colors.accent} 0%, #c0392b 100%);
        /* Fallback for email clients that don't support gradients */
        background-color: ${MODERN_EMAIL_STYLES.colors.accent};
      }

      .status-refunded {
        background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
        /* Fallback for email clients that don't support gradients */
        background-color: #95a5a6;
      }

      /* Email client specific fallbacks */

      /* Outlook fallbacks - remove complex backgrounds */
      <!--[if mso]>
      <style type="text/css">
        .email-wrapper {
          background: ${MODERN_EMAIL_STYLES.colors.background} !important;
        }

        .email-header {
          background: ${MODERN_EMAIL_STYLES.colors.primary} !important;
        }

        .email-header::before,
        .card-section::after,
        .address-box::after,
        .email-footer::before,
        .items-table th::before,
        .btn-primary::before {
          display: none !important;
        }

        .card-section,
        .address-box {
          background: ${MODERN_EMAIL_STYLES.colors.cardBackground} !important;
        }

        .email-footer {
          background: ${MODERN_EMAIL_STYLES.colors.background} !important;
        }

        .items-table {
          background: ${MODERN_EMAIL_STYLES.colors.cardBackground} !important;
        }

        .items-table th {
          background: ${MODERN_EMAIL_STYLES.colors.primary} !important;
        }

        .btn-primary {
          background: ${MODERN_EMAIL_STYLES.colors.primary} !important;
        }
      </style>
      <![endif]-->

      /* Gmail fallbacks - simplified backgrounds */
      @media screen and (max-width: 600px) {
        .gmail-app .email-header::before,
        .gmail-app .card-section::after,
        .gmail-app .address-box::after,
        .gmail-app .email-footer::before,
        .gmail-app .items-table th::before,
        .gmail-app .btn-primary::before {
          display: none !important;
        }

        .gmail-app .email-wrapper {
          background: ${MODERN_EMAIL_STYLES.colors.background} !important;
        }

        .gmail-app .email-header {
          background: ${MODERN_EMAIL_STYLES.colors.primary} !important;
        }
      }

      /* Apple Mail compatibility */
      @media only screen and (-webkit-min-device-pixel-ratio: 0) {
        .apple-mail .email-header::before,
        .apple-mail .card-section::after,
        .apple-mail .address-box::after {
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
        }
      }

      /* High contrast mode - remove decorative backgrounds */
      @media (prefers-contrast: high) {
        .email-header::before,
        .card-section::after,
        .address-box::after,
        .email-footer::before,
        .items-table th::before,
        .btn-primary::before {
          display: none !important;
        }

        .email-wrapper,
        .email-header,
        .card-section,
        .address-box,
        .email-footer,
        .items-table,
        .items-table th,
        .btn-primary {
          background: transparent !important;
        }
      }

      /* Reduced motion - disable animated effects */
      @media (prefers-reduced-motion: reduce) {
        .btn-primary::before {
          transition: none !important;
        }

        .btn-primary:hover::before {
          left: -100% !important;
        }
      }

      /* Dark mode background adjustments */
      @media (prefers-color-scheme: dark) {
        .email-wrapper {
          background: linear-gradient(135deg, ${DARK_MODE_COLORS.background} 0%, #0d1117 100%);
          background-color: ${DARK_MODE_COLORS.background};
        }

        .email-header {
          background: linear-gradient(135deg, ${DARK_MODE_COLORS.primary} 0%, ${DARK_MODE_COLORS.secondary} 50%, #1e2328 100%);
          background-color: ${DARK_MODE_COLORS.primary};
        }

        .email-header::before {
          background-image:
            radial-gradient(circle at 25% 25%, rgba(255,255,255,0.05) 2px, transparent 2px),
            radial-gradient(circle at 75% 75%, rgba(255,255,255,0.02) 1px, transparent 1px);
        }

        .card-section,
        .address-box {
          background: linear-gradient(145deg, ${DARK_MODE_COLORS.cardBackground} 0%, #252525 100%);
          background-color: ${DARK_MODE_COLORS.cardBackground};
        }

        .card-section::after,
        .address-box::after {
          background-image:
            linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.02) 50%, transparent 60%),
            linear-gradient(-45deg, transparent 40%, rgba(255,255,255,0.02) 50%, transparent 60%);
        }

        .email-footer {
          background: linear-gradient(180deg, ${DARK_MODE_COLORS.background} 0%, #0a0c10 100%);
          background-color: ${DARK_MODE_COLORS.background};
        }

        .email-footer::before {
          background-image:
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 2px,
              rgba(255,255,255,0.03) 2px,
              rgba(255,255,255,0.03) 4px
            );
        }

        .items-table {
          background: linear-gradient(145deg, ${DARK_MODE_COLORS.cardBackground} 0%, #252525 100%);
          background-color: ${DARK_MODE_COLORS.cardBackground};
        }

        .items-table th {
          background: linear-gradient(135deg, ${DARK_MODE_COLORS.primary} 0%, ${DARK_MODE_COLORS.secondary} 50%, #1e2328 100%);
          background-color: ${DARK_MODE_COLORS.primary};
        }

        .items-table th::before {
          background-image:
            linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(255,255,255,0.05) 25%, transparent 25%);
        }

        .btn-primary {
          background: linear-gradient(135deg, ${DARK_MODE_COLORS.primary} 0%, ${DARK_MODE_COLORS.secondary} 100%);
          background-color: ${DARK_MODE_COLORS.primary};
        }

        .status-pending {
          background: linear-gradient(135deg, ${DARK_MODE_COLORS.warning} 0%, #e67e22 100%);
          background-color: ${DARK_MODE_COLORS.warning};
        }

        .status-processing {
          background: linear-gradient(135deg, ${DARK_MODE_COLORS.secondary} 0%, #2980b9 100%);
          background-color: ${DARK_MODE_COLORS.secondary};
        }

        .status-delivered {
          background: linear-gradient(135deg, ${DARK_MODE_COLORS.success} 0%, #229954 100%);
          background-color: ${DARK_MODE_COLORS.success};
        }

        .status-cancelled {
          background: linear-gradient(135deg, ${DARK_MODE_COLORS.accent} 0%, #c0392b 100%);
          background-color: ${DARK_MODE_COLORS.accent};
        }
      }

      /* Print mode - remove all decorative backgrounds */
      @media print {
        .email-header::before,
        .card-section::after,
        .address-box::after,
        .email-footer::before,
        .items-table th::before,
        .btn-primary::before {
          display: none !important;
        }

        .email-wrapper,
        .email-header,
        .card-section,
        .address-box,
        .email-footer,
        .items-table,
        .items-table th,
        .btn-primary,
        .status-badge {
          background: white !important;
        }
      }
    `;
  }

  /**
   * Generates comprehensive print-friendly CSS styles with image handling
   * Ensures emails are readable and accessible when printed, with proper image fallbacks
   * @returns CSS string with print media queries and image accessibility
   */
  private getPrintStyles(): string {
    return `
      /* Print styles with comprehensive image and accessibility support */
      @media print {
        /* Basic print layout */
        body {
          background-color: white !important;
          color: black !important;
          font-size: 12pt !important;
          line-height: 1.4 !important;
          margin: 0 !important;
          padding: 20px !important;
        }

        .email-wrapper {
          background-color: white !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        .email-container {
          max-width: none !important;
          width: 100% !important;
          box-shadow: none !important;
          border: 2px solid #000 !important;
          border-radius: 0 !important;
          margin: 0 !important;
        }

        /* Header and footer print styling */
        .email-header {
          background: white !important;
          color: black !important;
          border-bottom: 3px solid #000 !important;
          padding: 15px !important;
          text-align: center !important;
        }

        .email-header h1 {
          color: black !important;
          font-size: 18pt !important;
          margin: 0 !important;
        }

        .email-footer {
          background: white !important;
          color: #333 !important;
          border-top: 2px solid #000 !important;
          padding: 15px !important;
          font-size: 10pt !important;
        }

        /* Content area print optimization */
        .email-content {
          padding: 20px !important;
          color: black !important;
        }

        /* Typography for print */
        h1, h2, h3, h4, h5, h6 {
          color: black !important;
          page-break-after: avoid !important;
          margin-top: 15pt !important;
          margin-bottom: 10pt !important;
        }

        h1 { font-size: 16pt !important; }
        h2 { font-size: 14pt !important; }
        h3 { font-size: 13pt !important; }
        h4, h5, h6 { font-size: 12pt !important; }

        p {
          margin: 8pt 0 !important;
          orphans: 3 !important;
          widows: 3 !important;
        }

        /* Interactive elements for print */
        .btn {
          background: white !important;
          color: black !important;
          border: 2px solid #000 !important;
          box-shadow: none !important;
          padding: 8pt 12pt !important;
          font-weight: bold !important;
          text-decoration: none !important;
          display: inline-block !important;
          margin: 5pt !important;
        }

        /* Links in print */
        a {
          color: black !important;
          text-decoration: underline !important;
          font-weight: normal !important;
        }

        a[href]:after {
          content: " (" attr(href) ")" !important;
          font-size: 9pt !important;
          color: #666 !important;
        }

        /* Status badges for print */
        .status-badge {
          background: white !important;
          color: black !important;
          border: 2px solid #000 !important;
          padding: 4pt 8pt !important;
          font-weight: bold !important;
          text-transform: uppercase !important;
        }

        /* Table print optimization */
        table {
          border-collapse: collapse !important;
          width: 100% !important;
          margin: 10pt 0 !important;
          page-break-inside: avoid !important;
        }

        .items-table {
          border: 2px solid #000 !important;
        }

        .items-table th {
          background: #f0f0f0 !important;
          color: black !important;
          border: 1px solid #000 !important;
          padding: 8pt !important;
          font-weight: bold !important;
          text-align: left !important;
        }

        .items-table td {
          border: 1px solid #000 !important;
          padding: 6pt !important;
          background: white !important;
          color: black !important;
        }

        .total-row td {
          background: #f0f0f0 !important;
          font-weight: bold !important;
          border-top: 3px solid #000 !important;
        }

        /* Card sections for print */
        .card-section,
        .address-box {
          border: 2px solid #000 !important;
          background: white !important;
          padding: 12pt !important;
          margin: 10pt 0 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          page-break-inside: avoid !important;
        }

        /* Image handling for print */
        .image-container {
          page-break-inside: avoid !important;
          margin: 10pt 0 !important;
        }

        .accessible-image {
          max-width: 300px !important;
          max-height: 200px !important;
          border: 2px solid #000 !important;
          display: block !important;
          margin: 0 auto !important;
        }

        .image-fallback {
          display: none !important;
        }

        /* QR codes and payment images */
        .payment-qr .accessible-image {
          max-width: 150px !important;
          max-height: 150px !important;
          border: 2px solid #000 !important;
        }

        .product-image .accessible-image {
          max-width: 200px !important;
          max-height: 150px !important;
        }

        /* Hide non-essential elements in print */
        .email-header .tagline {
          display: none !important;
        }

        .skip-link {
          display: none !important;
        }

        .preheader {
          display: none !important;
        }

        /* Social media links - show as text only */
        .email-footer nav a[href]:after {
          content: none !important;
        }

        /* Page break controls */
        .page-break-before {
          page-break-before: always !important;
        }

        .page-break-after {
          page-break-after: always !important;
        }

        .no-page-break {
          page-break-inside: avoid !important;
        }

        /* Ensure sufficient contrast for print */
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }

        /* Print-specific accessibility */
        .sr-only {
          position: static !important;
          width: auto !important;
          height: auto !important;
          padding: 0 !important;
          margin: 0 !important;
          overflow: visible !important;
          clip: auto !important;
          white-space: normal !important;
          border: 0 !important;
          font-size: 9pt !important;
          color: #666 !important;
          font-style: italic !important;
        }

        /* Print margins and spacing */
        @page {
          margin: 1in !important;
          size: letter !important;
        }

        /* Avoid breaking important content */
        .order-summary,
        .payment-info,
        .shipping-info {
          page-break-inside: avoid !important;
        }
      }

      /* Print preview styles (for screen when print preview is active) */
      @media screen and (prefers-color-scheme: print) {
        body {
          background: white !important;
          color: black !important;
        }
      }
    `;
  }

  /**
   * Generates modern header component with improved branding and accessibility
   * Includes semantic HTML structure, proper heading hierarchy, and ARIA labels
   * @param locale - Language locale (en or vi)
   * @returns HTML string for modern header with accessibility features
   */
  private generateModernHeader(locale: 'en' | 'vi'): string {
    const tagline = locale === 'vi'
      ? 'Sản phẩm thủ công chất lượng cao'
      : 'Premium Handmade Products';

    const logoAlt = locale === 'vi'
      ? 'Logo AlaCraft'
      : 'AlaCraft Logo';

    return `
      <header role="banner">
        <h1 style="
          margin: 0;
          font-family: ${MODERN_EMAIL_STYLES.typography.headingFont};
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.title};
          font-weight: 400;
          letter-spacing: 1px;
          line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.tight};
          color: #ffffff;
        " aria-label="${locale === 'vi' ? 'AlaCraft - Cửa hàng thủ công' : 'AlaCraft - Handmade Store'}">
          AlaCraft
        </h1>
        <p class="tagline" style="
          margin: ${MODERN_EMAIL_STYLES.spacing.sm} 0 0 0;
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body};
          opacity: 0.9;
          font-weight: 300;
          color: #ffffff;
          line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.normal};
        " role="text" aria-label="${locale === 'vi' ? 'Mô tả: ' + tagline : 'Description: ' + tagline}">
          ${tagline}
        </p>
      </header>
    `;
  }

  /**
   * Generates modern footer component with contact information, social links, and accessibility features
   * Includes semantic HTML structure, proper ARIA labels, and keyboard navigation support
   * @param locale - Language locale (en or vi)
   * @returns HTML string for modern footer with accessibility features
   */
  private generateModernFooter(locale: 'en' | 'vi'): string {
    const translations = {
      en: {
        contactInfo: 'If you have any questions, please contact us.',
        contactTitle: 'Contact Information',
        socialTitle: 'Follow Us',
        copyrightText: 'All rights reserved.',
        brandTagline: 'Premium Handmade Products',
        phone: 'Phone',
        email: 'Email',
        address: 'Address',
        businessHours: 'Business Hours',
        mondayFriday: 'Monday - Friday: 9:00 AM - 6:00 PM',
        saturday: 'Saturday: 10:00 AM - 4:00 PM',
        sunday: 'Sunday: Closed',
        unsubscribe: 'Unsubscribe',
        privacyPolicy: 'Privacy Policy',
        termsOfService: 'Terms of Service',
        socialAriaLabel: 'Social media links',
        contactAriaLabel: 'Contact information',
        legalAriaLabel: 'Legal information and links',
        brandAriaLabel: 'AlaCraft brand information'
      },
      vi: {
        contactInfo: 'Nếu bạn có câu hỏi, vui lòng liên hệ với chúng tôi.',
        contactTitle: 'Thông tin liên hệ',
        socialTitle: 'Theo dõi chúng tôi',
        copyrightText: 'Tất cả quyền được bảo lưu.',
        brandTagline: 'Sản phẩm thủ công chất lượng cao',
        phone: 'Điện thoại',
        email: 'Email',
        address: 'Địa chỉ',
        businessHours: 'Giờ làm việc',
        mondayFriday: 'Thứ 2 - Thứ 6: 9:00 - 18:00',
        saturday: 'Thứ 7: 10:00 - 16:00',
        sunday: 'Chủ nhật: Nghỉ',
        unsubscribe: 'Hủy đăng ký',
        privacyPolicy: 'Chính sách bảo mật',
        termsOfService: 'Điều khoản dịch vụ',
        socialAriaLabel: 'Liên kết mạng xã hội',
        contactAriaLabel: 'Thông tin liên hệ',
        legalAriaLabel: 'Thông tin pháp lý và liên kết',
        brandAriaLabel: 'Thông tin thương hiệu AlaCraft'
      }
    };

    const t = translations[locale];

    // Social media platforms with proper icons and URLs
    const socialPlatforms = [
      {
        name: 'Facebook',
        url: 'https://facebook.com/alacraft',
        icon: '📘',
        ariaLabel: locale === 'vi' ? 'Theo dõi chúng tôi trên Facebook' : 'Follow us on Facebook'
      },
      {
        name: 'Instagram',
        url: 'https://instagram.com/alacraft',
        icon: '📷',
        ariaLabel: locale === 'vi' ? 'Theo dõi chúng tôi trên Instagram' : 'Follow us on Instagram'
      },
      {
        name: 'WhatsApp',
        url: 'https://wa.me/1234567890',
        icon: '💬',
        ariaLabel: locale === 'vi' ? 'Liên hệ qua WhatsApp' : 'Contact us on WhatsApp'
      },
      {
        name: 'Zalo',
        url: 'https://zalo.me/alacraft',
        icon: '💬',
        ariaLabel: locale === 'vi' ? 'Liên hệ qua Zalo' : 'Contact us on Zalo'
      },
      {
        name: 'Website',
        url: 'https://alacraft.com',
        icon: '🌐',
        ariaLabel: locale === 'vi' ? 'Truy cập trang web của chúng tôi' : 'Visit our website'
      }
    ];

    // Contact information
    const contactDetails = {
      phone: '+84 123 456 789',
      email: 'contact@alacraft.com',
      address: locale === 'vi'
        ? '123 Đường ABC, Quận 1, TP.HCM, Việt Nam'
        : '123 ABC Street, District 1, Ho Chi Minh City, Vietnam'
    };

    return `
      <footer role="contentinfo" aria-label="${t.contactAriaLabel}" style="
        background-color: ${MODERN_EMAIL_STYLES.colors.background};
        padding: ${MODERN_EMAIL_STYLES.spacing.xl} ${MODERN_EMAIL_STYLES.spacing.lg};
        border-top: 1px solid ${MODERN_EMAIL_STYLES.colors.border};
        position: relative;
      ">
        <!-- Brand Section -->
        <div style="
          text-align: center;
          margin-bottom: ${MODERN_EMAIL_STYLES.spacing.xl};
          padding-bottom: ${MODERN_EMAIL_STYLES.spacing.lg};
          border-bottom: 1px solid ${MODERN_EMAIL_STYLES.colors.border};
        " role="banner" aria-label="${t.brandAriaLabel}">
          <h2 style="
            margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.sm} 0;
            font-family: ${MODERN_EMAIL_STYLES.typography.headingFont};
            font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.heading};
            font-weight: 400;
            color: ${MODERN_EMAIL_STYLES.colors.primary};
            letter-spacing: 1px;
          " role="heading" aria-level="2">
            AlaCraft
          </h2>
          <p style="
            margin: 0;
            font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body};
            color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
            font-style: italic;
            line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.normal};
          " role="text">
            ${t.brandTagline}
          </p>
        </div>

        <!-- Main Footer Content Grid -->
        <div style="
          display: table;
          width: 100%;
          border-collapse: collapse;
          margin-bottom: ${MODERN_EMAIL_STYLES.spacing.xl};
        " role="group" aria-label="${t.contactAriaLabel}" class="footer-grid">

          <!-- Contact Information Column -->
          <div style="
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding-right: ${MODERN_EMAIL_STYLES.spacing.lg};
          " role="region" aria-label="${t.contactAriaLabel}" class="footer-column">
            <h3 style="
              margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.md} 0;
              font-family: ${MODERN_EMAIL_STYLES.typography.headingFont};
              font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
              font-weight: 600;
              color: ${MODERN_EMAIL_STYLES.colors.primary};
            " role="heading" aria-level="3">
              ${t.contactTitle}
            </h3>

            <div style="margin-bottom: ${MODERN_EMAIL_STYLES.spacing.md};">
              <p style="
                margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.sm} 0;
                font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body};
                color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
                line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.normal};
              " role="text">
                <strong style="
                  color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
                  font-weight: 600;
                  display: inline-block;
                  width: 60px;
                  margin-right: ${MODERN_EMAIL_STYLES.spacing.sm};
                ">${t.phone}:</strong>
                <a href="tel:${contactDetails.phone.replace(/\s/g, '')}"
                   style="
                     color: ${MODERN_EMAIL_STYLES.colors.secondary};
                     text-decoration: none;
                     font-weight: 500;
                   "
                   role="link"
                   aria-label="${locale === 'vi' ? 'Gọi điện thoại' : 'Call phone number'}">${contactDetails.phone}</a>
              </p>

              <p style="
                margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.sm} 0;
                font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body};
                color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
                line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.normal};
              " role="text">
                <strong style="
                  color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
                  font-weight: 600;
                  display: inline-block;
                  width: 60px;
                  margin-right: ${MODERN_EMAIL_STYLES.spacing.sm};
                ">${t.email}:</strong>
                <a href="mailto:${contactDetails.email}"
                   style="
                     color: ${MODERN_EMAIL_STYLES.colors.secondary};
                     text-decoration: none;
                     font-weight: 500;
                   "
                   role="link"
                   aria-label="${locale === 'vi' ? 'Gửi email' : 'Send email'}">${contactDetails.email}</a>
              </p>

              <p style="
                margin: 0;
                font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body};
                color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
                line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.normal};
              " role="text">
                <strong style="
                  color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
                  font-weight: 600;
                  display: inline-block;
                  width: 60px;
                  margin-right: ${MODERN_EMAIL_STYLES.spacing.sm};
                  vertical-align: top;
                ">${t.address}:</strong>
                <span style="color: ${MODERN_EMAIL_STYLES.colors.textPrimary};">${contactDetails.address}</span>
              </p>
            </div>
          </div>

          <!-- Business Hours and Social Media Column -->
          <div style="
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding-left: ${MODERN_EMAIL_STYLES.spacing.lg};
          " role="region" aria-label="${t.socialAriaLabel}" class="footer-column">
            <h3 style="
              margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.md} 0;
              font-family: ${MODERN_EMAIL_STYLES.typography.headingFont};
              font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
              font-weight: 600;
              color: ${MODERN_EMAIL_STYLES.colors.primary};
            " role="heading" aria-level="3">
              ${t.businessHours}
            </h3>

            <div style="margin-bottom: ${MODERN_EMAIL_STYLES.spacing.lg};">
              <p style="
                margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.xs} 0;
                font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
                color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
                line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.normal};
              " role="text">${t.mondayFriday}</p>
              <p style="
                margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.xs} 0;
                font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
                color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
                line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.normal};
              " role="text">${t.saturday}</p>
              <p style="
                margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.md} 0;
                font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
                color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
                line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.normal};
              " role="text">${t.sunday}</p>
            </div>

            <h4 style="
              margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.md} 0;
              font-family: ${MODERN_EMAIL_STYLES.typography.headingFont};
              font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body};
              font-weight: 600;
              color: ${MODERN_EMAIL_STYLES.colors.primary};
            " role="heading" aria-level="4">
              ${t.socialTitle}
            </h4>

            <nav role="navigation" aria-label="${t.socialAriaLabel}">
              <div style="
                display: block;
                text-align: left;
              " class="social-buttons">
                ${socialPlatforms.map(platform => `
                  <a href="${platform.url}"
                     style="
                       display: inline-block;
                       padding: ${MODERN_EMAIL_STYLES.spacing.sm} ${MODERN_EMAIL_STYLES.spacing.md};
                       background: linear-gradient(135deg, ${MODERN_EMAIL_STYLES.colors.secondary} 0%, ${MODERN_EMAIL_STYLES.colors.primary} 100%);
                       color: #ffffff;
                       text-decoration: none;
                       border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
                       font-weight: 500;
                       font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
                       min-height: ${ACCESSIBILITY_STANDARDS.minTouchTarget};
                       min-width: ${ACCESSIBILITY_STANDARDS.minTouchTarget};
                       text-align: center;
                       line-height: 1.2;
                       box-shadow: ${MODERN_EMAIL_STYLES.shadows.subtle};
                       margin: 0 ${MODERN_EMAIL_STYLES.spacing.xs} ${MODERN_EMAIL_STYLES.spacing.xs} 0;
                     "
                     target="_blank"
                     rel="noopener noreferrer"
                     role="link"
                     aria-label="${platform.ariaLabel}"
                     tabindex="${ACCESSIBILITY_STANDARDS.keyboardNavigation.tabIndex}"
                     class="social-button">
                    <span style="margin-right: ${MODERN_EMAIL_STYLES.spacing.xs};" aria-hidden="true">${platform.icon}</span>
                    ${platform.name}
                  </a>
                `).join('')}
              </div>
            </nav>
          </div>
        </div>

        <!-- Legal and Utility Links -->
        <div style="
          padding-top: ${MODERN_EMAIL_STYLES.spacing.lg};
          border-top: 1px solid ${MODERN_EMAIL_STYLES.colors.border};
          text-align: center;
        " role="region" aria-label="${t.legalAriaLabel}">
          <nav role="navigation" aria-label="${t.legalAriaLabel}">
            <p style="
              margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.md} 0;
              font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
              line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.normal};
            ">
              <a href="#"
                 style="
                   color: ${MODERN_EMAIL_STYLES.colors.secondary};
                   text-decoration: underline;
                   font-weight: 500;
                   margin: 0 ${MODERN_EMAIL_STYLES.spacing.md};
                   min-height: ${ACCESSIBILITY_STANDARDS.minTouchTarget};
                   display: inline-block;
                   padding: ${MODERN_EMAIL_STYLES.spacing.xs};
                 "
                 role="link"
                 aria-label="${t.unsubscribe}"
                 tabindex="${ACCESSIBILITY_STANDARDS.keyboardNavigation.tabIndex}">
                ${t.unsubscribe}
              </a>
              <a href="#"
                 style="
                   color: ${MODERN_EMAIL_STYLES.colors.secondary};
                   text-decoration: underline;
                   font-weight: 500;
                   margin: 0 ${MODERN_EMAIL_STYLES.spacing.md};
                   min-height: ${ACCESSIBILITY_STANDARDS.minTouchTarget};
                   display: inline-block;
                   padding: ${MODERN_EMAIL_STYLES.spacing.xs};
                 "
                 role="link"
                 aria-label="${t.privacyPolicy}"
                 tabindex="${ACCESSIBILITY_STANDARDS.keyboardNavigation.tabIndex}">
                ${t.privacyPolicy}
              </a>
              <a href="#"
                 style="
                   color: ${MODERN_EMAIL_STYLES.colors.secondary};
                   text-decoration: underline;
                   font-weight: 500;
                   margin: 0 ${MODERN_EMAIL_STYLES.spacing.md};
                   min-height: ${ACCESSIBILITY_STANDARDS.minTouchTarget};
                   display: inline-block;
                   padding: ${MODERN_EMAIL_STYLES.spacing.xs};
                 "
                 role="link"
                 aria-label="${t.termsOfService}"
                 tabindex="${ACCESSIBILITY_STANDARDS.keyboardNavigation.tabIndex}">
                ${t.termsOfService}
              </a>
            </p>
          </nav>

          <!-- Copyright and Final Brand Statement -->
          <div style="
            margin-top: ${MODERN_EMAIL_STYLES.spacing.md};
            padding-top: ${MODERN_EMAIL_STYLES.spacing.md};
            border-top: 1px solid ${MODERN_EMAIL_STYLES.colors.border};
          ">
            <p style="
              margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.sm} 0;
              color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
              font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
              line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.normal};
              text-align: center;
            " role="text" aria-label="${locale === 'vi' ? 'Thông tin bản quyền' : 'Copyright information'}">
              &copy; ${new Date().getFullYear()} AlaCraft. ${t.copyrightText}
            </p>

            <p style="
              margin: 0;
              color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
              font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
              line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.normal};
              text-align: center;
              font-style: italic;
            " role="text">
              ${t.contactInfo}
            </p>
          </div>
        </div>
      </footer>
    `;
  }

  /**
   * Generates a card-based content section with modern styling
   * @param title - Section title
   * @param content - Section content HTML
   * @param variant - Card variant style ('default', 'highlighted', 'bordered')
   * @returns HTML string for card section
   */
  private generateCardSection(title: string, content: string, variant: 'default' | 'highlighted' | 'bordered' = 'default'): string {
    const variantClasses = {
      default: 'card-section',
      highlighted: 'card-section card-highlighted',
      bordered: 'card-section card-bordered'
    };

    const variantStyles = {
      default: '',
      highlighted: `background: linear-gradient(135deg, ${MODERN_EMAIL_STYLES.colors.cardBackground} 0%, #f8f9fa 100%); border-left-color: ${MODERN_EMAIL_STYLES.colors.accent};`,
      bordered: `border: 2px solid ${MODERN_EMAIL_STYLES.colors.border}; border-left-color: ${MODERN_EMAIL_STYLES.colors.secondary};`
    };

    return `
      <div class="${variantClasses[variant]}" style="${variantStyles[variant]}">
        ${title ? `<h3 style="margin-top: 0; color: ${MODERN_EMAIL_STYLES.colors.primary}; font-family: ${MODERN_EMAIL_STYLES.typography.headingFont}; font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large}; font-weight: 600;">${title}</h3>` : ''}
        <div style="color: ${MODERN_EMAIL_STYLES.colors.textPrimary};">
          ${content}
        </div>
      </div>
    `;
  }

  /**
   * Generates accessible image HTML with proper alt text and fallback styling
   * @param src - Image source URL
   * @param alt - Alt text for accessibility
   * @param options - Image styling and accessibility options
   * @returns HTML string for accessible image with fallbacks
   */
  private generateAccessibleImage(
    src: string,
    alt: string,
    options: {
      width?: string;
      height?: string;
      maxWidth?: string;
      maxHeight?: string;
      fallbackColor?: string;
      fallbackText?: string;
      isDecorative?: boolean;
      role?: string;
      ariaLabel?: string;
      className?: string;
    } = {}
  ): string {
    const {
      width = 'auto',
      height = 'auto',
      maxWidth = '100%',
      maxHeight = '200px',
      fallbackColor = MODERN_EMAIL_STYLES.colors.background,
      fallbackText = alt,
      isDecorative = false,
      role = 'img',
      ariaLabel,
      className = ''
    } = options;

    // For decorative images, use empty alt text and aria-hidden
    const imageAlt = isDecorative ? '' : alt;
    const ariaHidden = isDecorative ? 'aria-hidden="true"' : '';
    const imageRole = isDecorative ? 'presentation' : role;
    const ariaLabelAttr = ariaLabel ? `aria-label="${ariaLabel}"` : '';

    return `
      <div style="
        position: relative;
        display: inline-block;
        background-color: ${fallbackColor};
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.small};
        overflow: hidden;
        max-width: ${maxWidth};
        width: 100%;
        text-align: center;
      " class="image-container ${className}">
        <!-- Fallback content for when images are blocked -->
        <div style="
          display: block;
          padding: ${MODERN_EMAIL_STYLES.spacing.lg};
          color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body};
          line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.normal};
          background-color: ${fallbackColor};
          border: 2px dashed ${MODERN_EMAIL_STYLES.colors.border};
          border-radius: ${MODERN_EMAIL_STYLES.borderRadius.small};
          min-height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
        " class="image-fallback" ${ariaHidden} role="text">
          ${!isDecorative && fallbackText ? fallbackText : ''}
        </div>

        <!-- Actual image with accessibility attributes -->
        <img src="${src}"
             alt="${imageAlt}"
             ${ariaHidden}
             ${ariaLabelAttr}
             role="${imageRole}"
             style="
               display: block;
               width: ${width};
               height: ${height};
               max-width: ${maxWidth};
               max-height: ${maxHeight};
               border: 0;
               outline: none;
               text-decoration: none;
               -ms-interpolation-mode: bicubic;
               border-radius: ${MODERN_EMAIL_STYLES.borderRadius.small};
               position: absolute;
               top: 0;
               left: 0;
               right: 0;
               bottom: 0;
               margin: auto;
             "
             class="accessible-image ${className}"
             onload="this.style.display='block'; this.parentNode.querySelector('.image-fallback').style.display='none';"
             onerror="this.style.display='none'; this.parentNode.querySelector('.image-fallback').style.display='flex';" />
      </div>

      <style>
        /* Show image and hide fallback when images are enabled */
        .image-container .accessible-image {
          display: block !important;
        }
        .image-container .image-fallback {
          display: none !important;
        }

        /* Show fallback and hide image when images are blocked */
        @media screen and (-webkit-min-device-pixel-ratio: 0) {
          .image-container[data-images-blocked] .accessible-image {
            display: none !important;
          }
          .image-container[data-images-blocked] .image-fallback {
            display: flex !important;
          }
        }

        /* Print-friendly image handling */
        @media print {
          .image-container .accessible-image {
            max-width: 200px !important;
            max-height: 150px !important;
            border: 1px solid #ccc !important;
          }

          .image-container .image-fallback {
            display: none !important;
          }
        }

        /* High contrast mode adjustments */
        @media (prefers-contrast: high) {
          .image-container {
            border: 2px solid currentColor !important;
          }

          .image-fallback {
            border-color: currentColor !important;
            background-color: transparent !important;
            color: currentColor !important;
          }
        }
      </style>
    `;
  }

  /**
   * Generates a product card component for email templates with accessible images
   * @param product - Product information
   * @param locale - Language locale (en or vi)
   * @returns HTML string for product card with accessible images
   */
  private generateProductCard(product: any, locale: 'en' | 'vi'): string {
    const productName = product.name || (locale === 'vi' ? product.nameVi : product.nameEn) || 'Product';
    const productPrice = this.formatCurrency(product.price || 0, locale);
    const productImage = product.image || product.imageUrl || '';
    const productDescription = product.description || '';

    const imageAlt = locale === 'vi'
      ? `Hình ảnh sản phẩm: ${productName}`
      : `Product image: ${productName}`;

    const fallbackText = locale === 'vi'
      ? `[Hình ảnh sản phẩm: ${productName}]`
      : `[Product image: ${productName}]`;

    return `
      <div style="
        background-color: ${MODERN_EMAIL_STYLES.colors.cardBackground};
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
        box-shadow: ${MODERN_EMAIL_STYLES.shadows.subtle};
        padding: ${MODERN_EMAIL_STYLES.spacing.lg};
        margin: ${MODERN_EMAIL_STYLES.spacing.md} 0;
        border: 1px solid ${MODERN_EMAIL_STYLES.colors.border};
      " role="article" aria-label="${locale === 'vi' ? 'Thông tin sản phẩm' : 'Product information'}">
        ${productImage ? `
          <div style="text-align: center; margin-bottom: ${MODERN_EMAIL_STYLES.spacing.md};">
            ${this.generateAccessibleImage(productImage, imageAlt, {
              maxWidth: '100%',
              maxHeight: '200px',
              fallbackText: fallbackText,
              fallbackColor: MODERN_EMAIL_STYLES.colors.background,
              className: 'product-image'
            })}
          </div>
        ` : ''}
        <h4 style="
          margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.sm} 0;
          color: ${MODERN_EMAIL_STYLES.colors.primary};
          font-family: ${MODERN_EMAIL_STYLES.typography.headingFont};
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
          font-weight: 600;
          line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.tight};
        " role="heading" aria-level="4">${productName}</h4>
        ${productDescription ? `
          <p style="
            margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.md} 0;
            color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
            font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body};
            line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.normal};
          " role="text">${productDescription}</p>
        ` : ''}
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: ${MODERN_EMAIL_STYLES.spacing.md};
        " role="group" aria-label="${locale === 'vi' ? 'Thông tin giá và số lượng' : 'Price and quantity information'}">
          <span style="
            font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
            font-weight: 600;
            color: ${MODERN_EMAIL_STYLES.colors.accent};
          " role="text" aria-label="${locale === 'vi' ? 'Giá sản phẩm' : 'Product price'}">${productPrice}</span>
          ${product.quantity ? `
            <span style="
              color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
              font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body};
            " role="text" aria-label="${locale === 'vi' ? 'Số lượng sản phẩm' : 'Product quantity'}">${locale === 'vi' ? 'Số lượng' : 'Qty'}: ${product.quantity}</span>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Generates an address card component for email templates
   * @param address - Address information
   * @param title - Card title
   * @param locale - Language locale (en or vi)
   * @returns HTML string for address card
   */
  private generateAddressCard(address: any, title: string, locale: 'en' | 'vi' = 'en'): string {
    return `
      <div style="
        background-color: ${MODERN_EMAIL_STYLES.colors.cardBackground};
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
        box-shadow: ${MODERN_EMAIL_STYLES.shadows.subtle};
        padding: ${MODERN_EMAIL_STYLES.spacing.lg};
        margin: ${MODERN_EMAIL_STYLES.spacing.md} 0;
        border-left: 4px solid ${MODERN_EMAIL_STYLES.colors.secondary};
      ">
        <h4 style="
          margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.md} 0;
          color: ${MODERN_EMAIL_STYLES.colors.primary};
          font-family: ${MODERN_EMAIL_STYLES.typography.headingFont};
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
          font-weight: 600;
        ">${title}</h4>
        <div style="color: ${MODERN_EMAIL_STYLES.colors.textPrimary}; line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.relaxed};">
          <p style="margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.xs} 0; font-weight: 600;">
            ${address.fullName}
          </p>
          ${address.phone ? `
            <p style="margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.xs} 0; color: ${MODERN_EMAIL_STYLES.colors.textSecondary};">
              ${address.phone}
            </p>
          ` : ''}
          <p style="margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.xs} 0;">
            ${address.addressLine1}
          </p>
          ${address.addressLine2 ? `
            <p style="margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.xs} 0;">
              ${address.addressLine2}
            </p>
          ` : ''}
          <p style="margin: 0;">
            ${address.city}${address.state ? `, ${address.state}` : ''} ${address.postalCode || ''}
          </p>
          ${address.country ? `
            <p style="margin: ${MODERN_EMAIL_STYLES.spacing.xs} 0 0 0; font-weight: 500;">
              ${address.country}
            </p>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Generates graceful degradation wrapper for image-heavy content
   * Provides fallback content when images are blocked or fail to load
   * @param content - Main content with images
   * @param fallbackContent - Alternative content without images
   * @param locale - Language locale (en or vi)
   * @returns HTML string with graceful degradation
   */
  private generateImageGracefulDegradation(
    content: string,
    fallbackContent: string,
    locale: 'en' | 'vi'
  ): string {
    const fallbackMessage = locale === 'vi'
      ? 'Nếu bạn không thể xem hình ảnh, vui lòng bật hiển thị hình ảnh trong email hoặc xem phiên bản văn bản bên dưới.'
      : 'If you cannot see images, please enable image display in your email client or view the text version below.';

    return `
      <!-- Main content with images -->
      <div class="image-content" style="display: block;">
        ${content}
      </div>

      <!-- Fallback content for when images are blocked -->
      <div class="text-only-content" style="display: none;">
        <div style="
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
          padding: ${MODERN_EMAIL_STYLES.spacing.md};
          margin: ${MODERN_EMAIL_STYLES.spacing.md} 0;
          color: #856404;
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body};
          line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.normal};
        " role="alert" aria-live="polite">
          <p style="margin: 0; font-weight: 500;">
            ${fallbackMessage}
          </p>
        </div>
        ${fallbackContent}
      </div>

      <style>
        /* Show image content by default */
        .image-content {
          display: block !important;
        }
        .text-only-content {
          display: none !important;
        }

        /* When images are blocked, show text-only version */
        @media screen and (-webkit-min-device-pixel-ratio: 0) {
          .email-container[data-images-blocked="true"] .image-content {
            display: none !important;
          }
          .email-container[data-images-blocked="true"] .text-only-content {
            display: block !important;
          }
        }

        /* For email clients that don't support images */
        .no-images .image-content {
          display: none !important;
        }
        .no-images .text-only-content {
          display: block !important;
        }

        /* Print version always shows text content */
        @media print {
          .text-only-content {
            display: block !important;
          }
        }
      </style>

      <!-- JavaScript fallback detection (for supported clients) -->
      <script type="text/javascript">
        // Detect if images are blocked and show appropriate content
        (function() {
          var testImg = new Image();
          testImg.onerror = function() {
            var containers = document.querySelectorAll('.email-container');
            for (var i = 0; i < containers.length; i++) {
              containers[i].setAttribute('data-images-blocked', 'true');
            }
          };
          testImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        })();
      </script>

      <!-- No-script fallback -->
      <noscript>
        <style>
          .image-content { display: none !important; }
          .text-only-content { display: block !important; }
        </style>
      </noscript>
    `;
  }

  /**
   * Generates a payment information card component for email templates
   * @param paymentInfo - Payment information
   * @param locale - Language locale (en or vi)
   * @returns HTML string for payment info card
   */
  private generatePaymentInfoCard(paymentInfo: any, locale: 'en' | 'vi'): string {
    const translations = {
      en: {
        title: 'Payment Information',
        method: 'Payment Method',
        status: 'Payment Status',
        instructions: 'Payment Instructions',
        qrCode: 'QR Code for Payment'
      },
      vi: {
        title: 'Thông tin thanh toán',
        method: 'Phương thức thanh toán',
        status: 'Trạng thái thanh toán',
        instructions: 'Hướng dẫn thanh toán',
        qrCode: 'Mã QR thanh toán'
      }
    };

    const t = translations[locale];

    return `
      <div style="
        background-color: ${MODERN_EMAIL_STYLES.colors.cardBackground};
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
        box-shadow: ${MODERN_EMAIL_STYLES.shadows.subtle};
        padding: ${MODERN_EMAIL_STYLES.spacing.lg};
        margin: ${MODERN_EMAIL_STYLES.spacing.md} 0;
        border-left: 4px solid ${MODERN_EMAIL_STYLES.colors.success};
      ">
        <h4 style="
          margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.md} 0;
          color: ${MODERN_EMAIL_STYLES.colors.primary};
          font-family: ${MODERN_EMAIL_STYLES.typography.headingFont};
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
          font-weight: 600;
        ">${t.title}</h4>
        <div style="color: ${MODERN_EMAIL_STYLES.colors.textPrimary};">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="
                padding: ${MODERN_EMAIL_STYLES.spacing.sm} 0;
                font-weight: 600;
                color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
                width: 40%;
              ">${t.method}:</td>
              <td style="padding: ${MODERN_EMAIL_STYLES.spacing.sm} 0;">
                ${paymentInfo.displayName || paymentInfo.type || paymentInfo.method}
              </td>
            </tr>
            ${paymentInfo.status ? `
              <tr>
                <td style="
                  padding: ${MODERN_EMAIL_STYLES.spacing.sm} 0;
                  font-weight: 600;
                  color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
                ">${t.status}:</td>
                <td style="padding: ${MODERN_EMAIL_STYLES.spacing.sm} 0;">
                  ${paymentInfo.status}
                </td>
              </tr>
            ` : ''}
            ${paymentInfo.details ? `
              <tr>
                <td colspan="2" style="padding: ${MODERN_EMAIL_STYLES.spacing.md} 0 0 0;">
                  <div style="
                    background-color: ${MODERN_EMAIL_STYLES.colors.background};
                    padding: ${MODERN_EMAIL_STYLES.spacing.md};
                    border-radius: ${MODERN_EMAIL_STYLES.borderRadius.small};
                    font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body};
                  ">
                    ${paymentInfo.details}
                  </div>
                </td>
              </tr>
            ` : ''}
          </table>
          ${paymentInfo.instructions ? `
            <div style="margin-top: ${MODERN_EMAIL_STYLES.spacing.md};">
              <h5 style="
                margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.sm} 0;
                color: ${MODERN_EMAIL_STYLES.colors.primary};
                font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body};
                font-weight: 600;
              ">${t.instructions}:</h5>
              <div style="
                background-color: ${MODERN_EMAIL_STYLES.colors.background};
                padding: ${MODERN_EMAIL_STYLES.spacing.md};
                border-radius: ${MODERN_EMAIL_STYLES.borderRadius.small};
                border-left: 3px solid ${MODERN_EMAIL_STYLES.colors.warning};
              ">
                ${paymentInfo.instructions}
              </div>
            </div>
          ` : ''}
          ${paymentInfo.qrCode ? `
            <div style="text-align: center; margin-top: ${MODERN_EMAIL_STYLES.spacing.lg};">
              <h5 style="
                margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.md} 0;
                color: ${MODERN_EMAIL_STYLES.colors.primary};
                font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body};
                font-weight: 600;
              " role="heading" aria-level="5">${t.qrCode}:</h5>
              ${this.generateAccessibleImage(paymentInfo.qrCode, t.qrCode, {
                maxWidth: '200px',
                maxHeight: '200px',
                fallbackText: locale === 'vi'
                  ? '[Mã QR thanh toán - Vui lòng sử dụng ứng dụng ngân hàng để quét]'
                  : '[Payment QR Code - Please use your banking app to scan]',
                fallbackColor: MODERN_EMAIL_STYLES.colors.background,
                role: 'img',
                ariaLabel: locale === 'vi'
                  ? 'Mã QR để thanh toán đơn hàng'
                  : 'QR code for order payment',
                className: 'payment-qr'
              })}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Generates a contact information card component for email templates
   * Implements modern contact card layouts with icons, social media integration,
   * and improved typography for contact details with accessibility compliance
   * @param contactInfo - Contact information object
   * @param locale - Language locale (en or vi)
   * @returns HTML string for contact information card with accessibility features
   */
  private generateContactInfoCard(contactInfo: any, locale: 'en' | 'vi'): string {
    const translations = {
      en: {
        title: 'Contact Information',
        phone: 'Phone',
        email: 'Email',
        address: 'Address',
        website: 'Website',
        socialMedia: 'Follow Us',
        businessHours: 'Business Hours'
      },
      vi: {
        title: 'Thông tin liên hệ',
        phone: 'Điện thoại',
        email: 'Email',
        address: 'Địa chỉ',
        website: 'Website',
        socialMedia: 'Theo dõi chúng tôi',
        businessHours: 'Giờ làm việc'
      }
    };

    const t = translations[locale];

    // Generate social media links with proper accessibility
    const generateSocialLinks = (socialLinks: any) => {
      if (!socialLinks || Object.keys(socialLinks).length === 0) return '';

      const socialPlatforms = {
        facebook: { name: 'Facebook', icon: '📘' },
        instagram: { name: 'Instagram', icon: '📷' },
        twitter: { name: 'Twitter', icon: '🐦' },
        linkedin: { name: 'LinkedIn', icon: '💼' },
        youtube: { name: 'YouTube', icon: '📺' },
        tiktok: { name: 'TikTok', icon: '🎵' },
        whatsapp: { name: 'WhatsApp', icon: '💬' },
        zalo: { name: 'Zalo', icon: '💬' }
      };

      const links = Object.entries(socialLinks)
        .filter(([platform, url]) => url && url.toString().trim())
        .map(([platform, url]) => {
          const platformInfo = socialPlatforms[platform as keyof typeof socialPlatforms] ||
            { name: platform.charAt(0).toUpperCase() + platform.slice(1), icon: '🔗' };

          const ariaLabel = locale === 'vi'
            ? `Theo dõi chúng tôi trên ${platformInfo.name}`
            : `Follow us on ${platformInfo.name}`;

          return `
            <a href="${url}"
               style="
                 display: inline-block;
                 margin: 0 ${MODERN_EMAIL_STYLES.spacing.sm} ${MODERN_EMAIL_STYLES.spacing.sm} 0;
                 padding: ${MODERN_EMAIL_STYLES.spacing.sm} ${MODERN_EMAIL_STYLES.spacing.md};
                 background-color: ${MODERN_EMAIL_STYLES.colors.secondary};
                 color: #ffffff;
                 text-decoration: none;
                 border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
                 font-weight: 500;
                 font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body};
                 min-height: ${ACCESSIBILITY_STANDARDS.minTouchTarget};
                 min-width: ${ACCESSIBILITY_STANDARDS.minTouchTarget};
                 text-align: center;
                 line-height: 1.2;
                 transition: background-color 0.2s ease;
               "
               target="_blank"
               rel="noopener noreferrer"
               role="link"
               aria-label="${ariaLabel}"
               tabindex="${ACCESSIBILITY_STANDARDS.keyboardNavigation.tabIndex}">
              <span style="margin-right: ${MODERN_EMAIL_STYLES.spacing.xs};" aria-hidden="true">${platformInfo.icon}</span>
              ${platformInfo.name}
            </a>
          `;
        }).join('');

      return links ? `
        <div style="margin-top: ${MODERN_EMAIL_STYLES.spacing.lg};">
          <h5 style="
            margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.md} 0;
            color: ${MODERN_EMAIL_STYLES.colors.primary};
            font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body};
            font-weight: 600;
            font-family: ${MODERN_EMAIL_STYLES.typography.headingFont};
          " role="heading" aria-level="5">${t.socialMedia}:</h5>
          <div style="line-height: 1.5;" role="group" aria-label="${t.socialMedia}">
            ${links}
          </div>
        </div>
      ` : '';
    };

    // Generate contact details with icons and proper accessibility
    const generateContactDetails = () => {
      const details = [];

      if (contactInfo.phone) {
        details.push(`
          <div style="
            display: flex;
            align-items: center;
            margin-bottom: ${MODERN_EMAIL_STYLES.spacing.md};
            padding: ${MODERN_EMAIL_STYLES.spacing.sm} 0;
          " role="group" aria-label="${t.phone}">
            <span style="
              margin-right: ${MODERN_EMAIL_STYLES.spacing.md};
              font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
              color: ${MODERN_EMAIL_STYLES.colors.secondary};
              min-width: 24px;
              text-align: center;
            " aria-hidden="true">📞</span>
            <div>
              <div style="
                font-weight: 600;
                color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
                font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
                margin-bottom: ${MODERN_EMAIL_STYLES.spacing.xs};
              " role="text">${t.phone}:</div>
              <a href="tel:${contactInfo.phone.replace(/\s+/g, '')}"
                 style="
                   color: ${MODERN_EMAIL_STYLES.colors.secondary};
                   text-decoration: none;
                   font-weight: 500;
                   font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body};
                 "
                 role="link"
                 aria-label="${locale === 'vi' ? 'Gọi điện thoại' : 'Call phone number'} ${contactInfo.phone}">
                ${contactInfo.phone}
              </a>
            </div>
          </div>
        `);
      }

      if (contactInfo.email) {
        details.push(`
          <div style="
            display: flex;
            align-items: center;
            margin-bottom: ${MODERN_EMAIL_STYLES.spacing.md};
            padding: ${MODERN_EMAIL_STYLES.spacing.sm} 0;
          " role="group" aria-label="${t.email}">
            <span style="
              margin-right: ${MODERN_EMAIL_STYLES.spacing.md};
              font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
              color: ${MODERN_EMAIL_STYLES.colors.secondary};
              min-width: 24px;
              text-align: center;
            " aria-hidden="true">📧</span>
            <div>
              <div style="
                font-weight: 600;
                color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
                font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
                margin-bottom: ${MODERN_EMAIL_STYLES.spacing.xs};
              " role="text">${t.email}:</div>
              <a href="mailto:${contactInfo.email}"
                 style="
                   color: ${MODERN_EMAIL_STYLES.colors.secondary};
                   text-decoration: none;
                   font-weight: 500;
                   font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body};
                 "
                 role="link"
                 aria-label="${locale === 'vi' ? 'Gửi email đến' : 'Send email to'} ${contactInfo.email}">
                ${contactInfo.email}
              </a>
            </div>
          </div>
        `);
      }

      if (contactInfo.address) {
        details.push(`
          <div style="
            display: flex;
            align-items: flex-start;
            margin-bottom: ${MODERN_EMAIL_STYLES.spacing.md};
            padding: ${MODERN_EMAIL_STYLES.spacing.sm} 0;
          " role="group" aria-label="${t.address}">
            <span style="
              margin-right: ${MODERN_EMAIL_STYLES.spacing.md};
              font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
              color: ${MODERN_EMAIL_STYLES.colors.secondary};
              min-width: 24px;
              text-align: center;
              margin-top: 2px;
            " aria-hidden="true">📍</span>
            <div>
              <div style="
                font-weight: 600;
                color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
                font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
                margin-bottom: ${MODERN_EMAIL_STYLES.spacing.xs};
              " role="text">${t.address}:</div>
              <div style="
                color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
                font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body};
                line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.relaxed};
              " role="text">
                ${typeof contactInfo.address === 'string' ? contactInfo.address :
                  [contactInfo.address.addressLine1, contactInfo.address.addressLine2,
                   contactInfo.address.city, contactInfo.address.state, contactInfo.address.postalCode]
                   .filter(Boolean).join(', ')}
              </div>
            </div>
          </div>
        `);
      }

      if (contactInfo.website) {
        details.push(`
          <div style="
            display: flex;
            align-items: center;
            margin-bottom: ${MODERN_EMAIL_STYLES.spacing.md};
            padding: ${MODERN_EMAIL_STYLES.spacing.sm} 0;
          " role="group" aria-label="${t.website}">
            <span style="
              margin-right: ${MODERN_EMAIL_STYLES.spacing.md};
              font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
              color: ${MODERN_EMAIL_STYLES.colors.secondary};
              min-width: 24px;
              text-align: center;
            " aria-hidden="true">🌐</span>
            <div>
              <div style="
                font-weight: 600;
                color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
                font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
                margin-bottom: ${MODERN_EMAIL_STYLES.spacing.xs};
              " role="text">${t.website}:</div>
              <a href="${contactInfo.website}"
                 style="
                   color: ${MODERN_EMAIL_STYLES.colors.secondary};
                   text-decoration: none;
                   font-weight: 500;
                   font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body};
                 "
                 target="_blank"
                 rel="noopener noreferrer"
                 role="link"
                 aria-label="${locale === 'vi' ? 'Truy cập website' : 'Visit website'}">
                ${contactInfo.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          </div>
        `);
      }

      if (contactInfo.businessHours) {
        details.push(`
          <div style="
            display: flex;
            align-items: flex-start;
            margin-bottom: ${MODERN_EMAIL_STYLES.spacing.md};
            padding: ${MODERN_EMAIL_STYLES.spacing.sm} 0;
          " role="group" aria-label="${t.businessHours}">
            <span style="
              margin-right: ${MODERN_EMAIL_STYLES.spacing.md};
              font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
              color: ${MODERN_EMAIL_STYLES.colors.secondary};
              min-width: 24px;
              text-align: center;
              margin-top: 2px;
            " aria-hidden="true">🕒</span>
            <div>
              <div style="
                font-weight: 600;
                color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
                font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
                margin-bottom: ${MODERN_EMAIL_STYLES.spacing.xs};
              " role="text">${t.businessHours}:</div>
              <div style="
                color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
                font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body};
                line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.relaxed};
              " role="text">
                ${contactInfo.businessHours}
              </div>
            </div>
          </div>
        `);
      }

      return details.join('');
    };

    return `
      <div style="
        background-color: ${MODERN_EMAIL_STYLES.colors.cardBackground};
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
        box-shadow: ${MODERN_EMAIL_STYLES.shadows.subtle};
        padding: ${MODERN_EMAIL_STYLES.spacing.xl};
        margin: ${MODERN_EMAIL_STYLES.spacing.lg} 0;
        border-left: 4px solid ${MODERN_EMAIL_STYLES.colors.secondary};
        border: 1px solid ${MODERN_EMAIL_STYLES.colors.border};
      " role="region" aria-label="${t.title}">
        <h4 style="
          margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.lg} 0;
          color: ${MODERN_EMAIL_STYLES.colors.primary};
          font-family: ${MODERN_EMAIL_STYLES.typography.headingFont};
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
          font-weight: 600;
          line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.tight};
        " role="heading" aria-level="4">${t.title}</h4>

        <div style="
          color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
          line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.normal};
        ">
          ${generateContactDetails()}
          ${generateSocialLinks(contactInfo.socialMedia)}
        </div>
      </div>
    `;
  }

  /**
   * Generates a modern table with improved styling and responsive behavior
   * @param headers - Array of table headers
   * @param rows - Array of table rows (each row is an array of cell values)
   * @param options - Table styling options
   * @param locale - Language locale (en or vi)
   * @returns HTML string for modern table
   */
  private generateModernTable(
    headers: string[],
    rows: string[][],
    options: {
      variant?: 'default' | 'striped' | 'bordered';
      responsive?: boolean;
      showTotal?: boolean;
      totalRow?: string[];
      className?: string;
    } = {},
    locale: 'en' | 'vi' = 'en'
  ): string {
    const {
      variant = 'default',
      responsive = true,
      showTotal = false,
      totalRow = [],
      className = 'items-table'
    } = options;

    const tableClasses = [className];
    if (variant === 'striped') tableClasses.push('table-striped');
    if (variant === 'bordered') tableClasses.push('table-bordered');
    if (responsive) tableClasses.push('table-responsive');

    const headerCells = headers.map((header, index) => `
      <th scope="col"
          id="header-${index}"
          style="
            background: linear-gradient(135deg, ${MODERN_EMAIL_STYLES.colors.primary} 0%, #34495e 100%);
            color: #ffffff;
            padding: ${MODERN_EMAIL_STYLES.spacing.md};
            text-align: left;
            font-weight: 600;
            font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body};
            font-family: ${MODERN_EMAIL_STYLES.typography.fontFamily};
            border: none;
          "
          role="columnheader"
          aria-label="${header}">
        ${header}
      </th>
    `).join('');

    const bodyRows = rows.map((row, rowIndex) => {
      const isEven = rowIndex % 2 === 0;
      const backgroundColor = variant === 'striped' && !isEven
        ? '#f8f9fa'
        : MODERN_EMAIL_STYLES.colors.cardBackground;

      const cells = row.map((cell, cellIndex) => {
        // Apply right alignment to numeric columns (typically last few columns)
        const isNumericColumn = cellIndex >= headers.length - 2;
        const textAlign = isNumericColumn ? 'right' : 'left';

        return `
          <td headers="header-${cellIndex}"
              style="
                padding: ${MODERN_EMAIL_STYLES.spacing.md};
                border-bottom: 1px solid ${MODERN_EMAIL_STYLES.colors.border};
                background-color: ${backgroundColor};
                text-align: ${textAlign};
                font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body};
                color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
                vertical-align: top;
              "
              role="cell"
              ${responsive ? `data-label="${headers[cellIndex]}"` : ''}>
            ${cell}
          </td>
        `;
      }).join('');

      return `<tr role="row">${cells}</tr>`;
    }).join('');

    const totalRowHtml = showTotal && totalRow.length > 0 ? `
      <tr class="total-row" role="row" aria-label="${locale === 'vi' ? 'Tổng cộng' : 'Total row'}">
        ${totalRow.map((cell, cellIndex) => {
          const isNumericColumn = cellIndex >= headers.length - 2;
          const textAlign = isNumericColumn ? 'right' : 'left';
          const fontWeight = cellIndex === totalRow.length - 1 ? '700' : '600';

          return `
            <td headers="header-${cellIndex}"
                style="
                  padding: ${MODERN_EMAIL_STYLES.spacing.md};
                  background-color: ${MODERN_EMAIL_STYLES.colors.background} !important;
                  border-top: 2px solid ${MODERN_EMAIL_STYLES.colors.primary};
                  border-bottom: none;
                  text-align: ${textAlign};
                  font-weight: ${fontWeight};
                  font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
                  color: ${MODERN_EMAIL_STYLES.colors.primary};
                "
                role="cell"
                ${cellIndex === totalRow.length - 1 ? 'aria-label="' + (locale === 'vi' ? 'Tổng tiền cuối cùng' : 'Final total amount') + '"' : ''}>
              ${cell}
            </td>
          `;
        }).join('')}
      </tr>
    ` : '';

    const tableCaption = locale === 'vi' ? 'Bảng chi tiết đơn hàng' : 'Order details table';
    const tableSummary = locale === 'vi'
      ? `Bảng có ${headers.length} cột và ${rows.length} hàng dữ liệu${showTotal ? ' với hàng tổng cộng' : ''}`
      : `Table with ${headers.length} columns and ${rows.length} data rows${showTotal ? ' with total row' : ''}`;

    return `
      <div style="
        margin: ${MODERN_EMAIL_STYLES.spacing.lg} 0;
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
        overflow: hidden;
        box-shadow: ${MODERN_EMAIL_STYLES.shadows.subtle};
        ${responsive ? `
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        ` : ''}
      " role="region" aria-label="${ACCESSIBILITY_STANDARDS.ariaLabels.orderSummary}">
        <table class="${tableClasses.join(' ')}"
               style="
                 width: 100%;
                 border-collapse: collapse;
                 margin: 0;
                 font-family: ${MODERN_EMAIL_STYLES.typography.fontFamily};
                 background-color: ${MODERN_EMAIL_STYLES.colors.cardBackground};
               "
               cellpadding="0"
               cellspacing="0"
               border="0"
               role="table"
               aria-label="${tableSummary}">
          <caption style="
            position: absolute;
            left: -10000px;
            top: auto;
            width: 1px;
            height: 1px;
            overflow: hidden;
          " class="sr-only">
            ${tableCaption}
          </caption>
          <thead role="rowgroup">
            <tr role="row">
              ${headerCells}
            </tr>
          </thead>
          <tbody role="rowgroup">
            ${bodyRows}
            ${totalRowHtml}
          </tbody>
        </table>
      </div>

      ${responsive ? `
        <style>
          @media only screen and (${RESPONSIVE_BREAKPOINTS.mobile}) {
            .${className} th,
            .${className} td {
              padding: ${MODERN_EMAIL_STYLES.spacing.sm} !important;
              font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small} !important;
            }

            .${className} th {
              font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small} !important;
            }

            /* Stack table on very small screens */
            @media only screen and (max-width: 400px) {
              .${className},
              .${className} thead,
              .${className} tbody,
              .${className} th,
              .${className} td,
              .${className} tr {
                display: block !important;
              }

              .${className} thead tr {
                position: absolute !important;
                top: -9999px !important;
                left: -9999px !important;
              }

              .${className} tr {
                border: 1px solid ${MODERN_EMAIL_STYLES.colors.border} !important;
                margin-bottom: ${MODERN_EMAIL_STYLES.spacing.md} !important;
                border-radius: ${MODERN_EMAIL_STYLES.borderRadius.small} !important;
                padding: ${MODERN_EMAIL_STYLES.spacing.md} !important;
                background-color: ${MODERN_EMAIL_STYLES.colors.cardBackground} !important;
              }

              .${className} td {
                border: none !important;
                position: relative !important;
                padding-left: 50% !important;
                text-align: right !important;
              }

              .${className} td:before {
                content: attr(data-label) ": " !important;
                position: absolute !important;
                left: ${MODERN_EMAIL_STYLES.spacing.md} !important;
                width: 45% !important;
                text-align: left !important;
                font-weight: 600 !important;
                color: ${MODERN_EMAIL_STYLES.colors.textSecondary} !important;
              }
            }
          }
        </style>
      ` : ''}
    `;
  }

  /**
   * Generates a summary table for order totals with modern styling
   * @param totals - Object containing total amounts
   * @param locale - Language locale (en or vi)
   * @returns HTML string for totals table
   */
  private generateTotalsTable(totals: {
    subtotal: number;
    shipping?: number;
    tax?: number;
    discount?: number;
    total: number;
  }, locale: 'en' | 'vi'): string {
    const translations = {
      en: {
        subtotal: 'Subtotal',
        shipping: 'Shipping',
        tax: 'Tax',
        discount: 'Discount',
        total: 'Total'
      },
      vi: {
        subtotal: 'Tạm tính',
        shipping: 'Phí vận chuyển',
        tax: 'Thuế',
        discount: 'Giảm giá',
        total: 'Tổng cộng'
      }
    };

    const t = translations[locale];

    const rows: string[] = [];

    // Subtotal row
    rows.push(`
      <tr>
        <td style="
          padding: ${MODERN_EMAIL_STYLES.spacing.sm} ${MODERN_EMAIL_STYLES.spacing.md};
          text-align: right;
          font-weight: 600;
          color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
          border-bottom: 1px solid ${MODERN_EMAIL_STYLES.colors.border};
        ">${t.subtotal}:</td>
        <td style="
          padding: ${MODERN_EMAIL_STYLES.spacing.sm} ${MODERN_EMAIL_STYLES.spacing.md};
          text-align: right;
          font-weight: 600;
          border-bottom: 1px solid ${MODERN_EMAIL_STYLES.colors.border};
        ">${this.formatCurrency(totals.subtotal, locale)}</td>
      </tr>
    `);

    // Shipping row (if applicable)
    if (totals.shipping !== undefined && totals.shipping > 0) {
      rows.push(`
        <tr>
          <td style="
            padding: ${MODERN_EMAIL_STYLES.spacing.sm} ${MODERN_EMAIL_STYLES.spacing.md};
            text-align: right;
            color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
            border-bottom: 1px solid ${MODERN_EMAIL_STYLES.colors.border};
          ">${t.shipping}:</td>
          <td style="
            padding: ${MODERN_EMAIL_STYLES.spacing.sm} ${MODERN_EMAIL_STYLES.spacing.md};
            text-align: right;
            border-bottom: 1px solid ${MODERN_EMAIL_STYLES.colors.border};
          ">${this.formatCurrency(totals.shipping, locale)}</td>
        </tr>
      `);
    }

    // Tax row (if applicable)
    if (totals.tax !== undefined && totals.tax > 0) {
      rows.push(`
        <tr>
          <td style="
            padding: ${MODERN_EMAIL_STYLES.spacing.sm} ${MODERN_EMAIL_STYLES.spacing.md};
            text-align: right;
            color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
            border-bottom: 1px solid ${MODERN_EMAIL_STYLES.colors.border};
          ">${t.tax}:</td>
          <td style="
            padding: ${MODERN_EMAIL_STYLES.spacing.sm} ${MODERN_EMAIL_STYLES.spacing.md};
            text-align: right;
            border-bottom: 1px solid ${MODERN_EMAIL_STYLES.colors.border};
          ">${this.formatCurrency(totals.tax, locale)}</td>
        </tr>
      `);
    }

    // Discount row (if applicable)
    if (totals.discount !== undefined && totals.discount > 0) {
      rows.push(`
        <tr>
          <td style="
            padding: ${MODERN_EMAIL_STYLES.spacing.sm} ${MODERN_EMAIL_STYLES.spacing.md};
            text-align: right;
            color: ${MODERN_EMAIL_STYLES.colors.success};
            border-bottom: 1px solid ${MODERN_EMAIL_STYLES.colors.border};
          ">${t.discount}:</td>
          <td style="
            padding: ${MODERN_EMAIL_STYLES.spacing.sm} ${MODERN_EMAIL_STYLES.spacing.md};
            text-align: right;
            color: ${MODERN_EMAIL_STYLES.colors.success};
            border-bottom: 1px solid ${MODERN_EMAIL_STYLES.colors.border};
          ">-${this.formatCurrency(totals.discount, locale)}</td>
        </tr>
      `);
    }

    // Total row
    rows.push(`
      <tr>
        <td style="
          padding: ${MODERN_EMAIL_STYLES.spacing.md};
          text-align: right;
          font-weight: 700;
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
          color: ${MODERN_EMAIL_STYLES.colors.primary};
          border-top: 2px solid ${MODERN_EMAIL_STYLES.colors.primary};
          background-color: ${MODERN_EMAIL_STYLES.colors.background};
        ">${t.total}:</td>
        <td style="
          padding: ${MODERN_EMAIL_STYLES.spacing.md};
          text-align: right;
          font-weight: 700;
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
          color: ${MODERN_EMAIL_STYLES.colors.primary};
          border-top: 2px solid ${MODERN_EMAIL_STYLES.colors.primary};
          background-color: ${MODERN_EMAIL_STYLES.colors.background};
        ">${this.formatCurrency(totals.total, locale)}</td>
      </tr>
    `);

    return `
      <div style="
        margin: ${MODERN_EMAIL_STYLES.spacing.lg} 0;
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
        overflow: hidden;
        box-shadow: ${MODERN_EMAIL_STYLES.shadows.subtle};
        max-width: 400px;
        margin-left: auto;
      ">
        <table style="
          width: 100%;
          border-collapse: collapse;
          background-color: ${MODERN_EMAIL_STYLES.colors.cardBackground};
          font-family: ${MODERN_EMAIL_STYLES.typography.fontFamily};
        " cellpadding="0" cellspacing="0" border="0" role="presentation">
          <tbody>
            ${rows.join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Admin order notification email template
   *
   * Generates a comprehensive HTML email for shop owners with complete order details.
   * Includes customer information, all order items with SKUs, addresses, and payment info.
   *
   * @param data - Admin order email data with all order and customer details
   * @param locale - Language locale (en or vi), defaults to 'en'
   * @returns Email subject and HTML content wrapped in professional layout
   *
   * @example
   * ```typescript
   * const adminEmailData = {
   *   orderNumber: 'ORD-123',
   *   orderDate: new Date().toISOString(),
   *   customerName: 'John Doe',
   *   customerEmail: 'john@example.com',
   *   customerPhone: '+1234567890',
   *   items: [{
   *     nameEn: 'Handmade Vase',
   *     nameVi: 'Bình gốm thủ công',
   *     sku: 'VASE-001',
   *     quantity: 2,
   *     price: 50.00,
   *     total: 100.00
   *   }],
   *   subtotal: 100.00,
   *   shippingCost: 10.00,
   *   shippingMethod: 'Standard Shipping',
   *   taxAmount: 11.00,
   *   discountAmount: 0,
   *   total: 121.00,
   *   shippingAddress: { ... },
   *   billingAddress: { ... },
   *   paymentMethod: 'Bank Transfer',
   *   paymentStatus: 'PENDING', // Use STATUS.PAYMENT_STATUS constants
   *   notes: 'Please gift wrap'
   * };
   *
   * const template = emailTemplateService.getAdminOrderNotificationTemplate(adminEmailData, 'en');
   * // Returns: { subject: 'New Order #ORD-123', html: '<html>...</html>' }
   * ```
   *
   * @remarks
   * - Uses wrapInEmailLayout for consistent HTML structure
   * - Formats currency with formatCurrency helper
   * - Formats dates with formatDate helper
   * - Includes both English and Vietnamese product names
   * - Shows customer notes if provided
   * - Optimized for quick order review by shop owners
   */
  /**
   * Get simplified admin order notification template that works with swaks
   * @param data - Admin order email data
   * @param locale - Language locale
   * @returns Simplified admin email template
   */
  getSimplifiedAdminOrderNotificationTemplate(
    data: AdminOrderEmailData,
    locale: 'en' | 'vi' = 'en',
  ): { subject: string; html: string } {
    const translations = {
      en: {
        subject: `New Order Received - Order #${data.orderNumber}`,
        title: 'New Order Received',
        orderNumber: 'Order Number',
        orderDate: 'Order Date',
        customerName: 'Customer Name',
        customerEmail: 'Customer Email',
        total: 'Total',
        paymentMethod: 'Payment Method',
        paymentStatus: 'Payment Status',
        viewOrder: 'View Order Details',
      },
      vi: {
        subject: `Đơn hàng mới - Đơn hàng #${data.orderNumber}`,
        title: 'Đã nhận đơn hàng mới',
        orderNumber: 'Mã đơn hàng',
        orderDate: 'Ngày đặt hàng',
        customerName: 'Tên khách hàng',
        customerEmail: 'Email khách hàng',
        total: 'Tổng cộng',
        paymentMethod: 'Phương thức thanh toán',
        paymentStatus: 'Trạng thái thanh toán',
        viewOrder: 'Xem chi tiết đơn hàng',
      },
    };

    const t = translations[locale];

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${t.subject}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

<div style="background-color: #e74c3c; color: white; padding: 20px; text-align: center; margin-bottom: 20px;">
<h1 style="margin: 0;">${t.title}</h1>
</div>

<div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-left: 4px solid #e74c3c;">
<h3 style="margin-top: 0;">Order Information</h3>
<p><strong>${t.orderNumber}:</strong> ${data.orderNumber}</p>
<p><strong>${t.orderDate}:</strong> ${data.orderDate}</p>
<p><strong>${t.customerName}:</strong> ${data.customerName}</p>
<p><strong>${t.customerEmail}:</strong> ${data.customerEmail}</p>
<p><strong>${t.total}:</strong> ${this.formatCurrency(data.total, locale)}</p>
<p><strong>${t.paymentMethod}:</strong> ${data.paymentMethod}</p>
<p><strong>${t.paymentStatus}:</strong> ${data.paymentStatus}</p>
</div>

<div style="text-align: center; margin: 30px 0;">
<a href="${process.env.FRONTEND_URL || 'https://alacraft.com'}/admin/orders/${data.orderNumber}"
   style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
${t.viewOrder}
</a>
</div>

<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
<p>&copy; ${new Date().getFullYear()} AlaCraft Admin System</p>
</div>

</body>
</html>`;

    return {
      subject: t.subject,
      html,
    };
  }

  getAdminOrderNotificationTemplate(
    data: AdminOrderEmailData,
    locale: 'en' | 'vi' = 'en',
  ): { subject: string; html: string } {
    const translations = {
      en: {
        subject: `🔔 New Order #${data.orderNumber}`,
        title: 'New Order Received',
        orderDetails: 'Order Details',
        orderNumber: 'Order Number',
        orderDate: 'Order Date',
        customerInfo: 'Customer Information',
        name: 'Name',
        email: 'Email',
        phone: 'Phone',
        items: 'Order Items',
        product: 'Product',
        sku: 'SKU',
        quantity: 'Qty',
        price: 'Price',
        total: 'Total',
        subtotal: 'Subtotal',
        shipping: 'Shipping',
        shippingMethod: 'Shipping Method',
        tax: 'Tax',
        discount: 'Discount',
        grandTotal: 'Grand Total',
        shippingAddress: 'Shipping Address',
        billingAddress: 'Billing Address',
        paymentInfo: 'Payment Information',
        paymentMethod: 'Payment Method',
        paymentStatus: 'Payment Status',
        customerNotes: 'Customer Notes',
        viewOrder: 'View Order Details',
        processOrder: 'Process Order',
        priority: 'Priority',
        urgent: 'URGENT',
        normal: 'Normal',
      },
      vi: {
        subject: `🔔 Đơn hàng mới #${data.orderNumber}`,
        title: 'Đã nhận đơn hàng mới',
        orderDetails: 'Chi tiết đơn hàng',
        orderNumber: 'Mã đơn hàng',
        orderDate: 'Ngày đặt hàng',
        customerInfo: 'Thông tin khách hàng',
        name: 'Tên',
        email: 'Email',
        phone: 'Điện thoại',
        items: 'Sản phẩm đặt hàng',
        product: 'Sản phẩm',
        sku: 'Mã SKU',
        quantity: 'SL',
        price: 'Giá',
        total: 'Tổng',
        subtotal: 'Tạm tính',
        shipping: 'Vận chuyển',
        shippingMethod: 'Phương thức vận chuyển',
        tax: 'Thuế',
        discount: 'Giảm giá',
        grandTotal: 'Tổng cộng',
        shippingAddress: 'Địa chỉ giao hàng',
        billingAddress: 'Địa chỉ thanh toán',
        paymentInfo: 'Thông tin thanh toán',
        paymentMethod: 'Phương thức thanh toán',
        paymentStatus: 'Trạng thái thanh toán',
        customerNotes: 'Ghi chú của khách hàng',
        viewOrder: 'Xem chi tiết đơn hàng',
        processOrder: 'Xử lý đơn hàng',
        priority: 'Độ ưu tiên',
        urgent: 'KHẨN CẤP',
        normal: 'Bình thường',
      },
    };

    const t = translations[locale];

    // Determine order priority based on total amount
    const isHighValue = data.total > 1000000; // 1M VND
    const priorityLevel = isHighValue ? t.urgent : t.normal;
    const priorityColor = isHighValue ? MODERN_EMAIL_STYLES.colors.accent : MODERN_EMAIL_STYLES.colors.success;

    // Generate enhanced product cards for admin review
    const productCards = data.items
      .map((item) => this.generateProductCard({
        name: locale === 'vi' ? item.nameVi : item.nameEn,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      }, locale))
      .join('');

    // Generate modern table for order summary
    const summaryRows = [
      [t.subtotal, this.formatCurrency(data.subtotal, locale)],
      [t.shipping, this.formatCurrency(data.shippingCost, locale)],
    ];

    if (data.taxAmount > 0) {
      summaryRows.push([t.tax, this.formatCurrency(data.taxAmount, locale)]);
    }

    if (data.discountAmount > 0) {
      summaryRows.push([t.discount, `-${this.formatCurrency(data.discountAmount, locale)}`]);
    }

    summaryRows.push([`<strong>${t.grandTotal}</strong>`, `<strong>${this.formatCurrency(data.total, locale)}</strong>`]);

    const orderSummaryTable = this.generateModernTable(
      ['', ''],
      summaryRows
    );

    // Generate customer information card
    const customerInfoCard = this.generateCardSection(t.customerInfo, `
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="
            padding: ${MODERN_EMAIL_STYLES.spacing.sm} 0;
            font-weight: 600;
            color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
            width: 30%;
          ">${t.name}:</td>
          <td style="
            padding: ${MODERN_EMAIL_STYLES.spacing.sm} 0;
            color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
            font-weight: 600;
          ">${data.customerName}</td>
        </tr>
        <tr>
          <td style="
            padding: ${MODERN_EMAIL_STYLES.spacing.sm} 0;
            font-weight: 600;
            color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
          ">${t.email}:</td>
          <td style="
            padding: ${MODERN_EMAIL_STYLES.spacing.sm} 0;
            color: ${MODERN_EMAIL_STYLES.colors.secondary};
          ">
            <a href="mailto:${data.customerEmail}" style="
              color: ${MODERN_EMAIL_STYLES.colors.secondary};
              text-decoration: none;
            ">${data.customerEmail}</a>
          </td>
        </tr>
        <tr>
          <td style="
            padding: ${MODERN_EMAIL_STYLES.spacing.sm} 0;
            font-weight: 600;
            color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
          ">${t.phone}:</td>
          <td style="
            padding: ${MODERN_EMAIL_STYLES.spacing.sm} 0;
            color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
          ">
            <a href="tel:${data.customerPhone}" style="
              color: ${MODERN_EMAIL_STYLES.colors.secondary};
              text-decoration: none;
            ">${data.customerPhone}</a>
          </td>
        </tr>
      </table>
    `);

    // Generate address cards
    const shippingAddressCard = this.generateAddressCard(
      data.shippingAddress,
      t.shippingAddress,
      locale
    );

    const billingAddressCard = this.generateAddressCard(
      data.billingAddress,
      t.billingAddress,
      locale
    );

    // Generate payment info card
    const paymentInfoCard = this.generatePaymentInfoCard({
      type: data.paymentMethod,
      displayName: data.paymentMethod,
      status: data.paymentStatus,
      shippingMethod: data.shippingMethod
    }, locale);

    // Generate admin action buttons
    const viewOrderButton = ModernButtonGenerator.generatePrimaryButton(
      t.viewOrder,
      `${process.env.FRONTEND_URL || 'https://admin.alacraft.com'}/admin/orders/${data.orderNumber}`,
      false
    );

    const processOrderButton = ModernButtonGenerator.generateSuccessButton(
      t.processOrder,
      `${process.env.FRONTEND_URL || 'https://admin.alacraft.com'}/admin/orders/${data.orderNumber}/process`,
      false
    );

    const content = `
      <!-- Admin Alert Header with Priority -->
      <div style="
        text-align: center;
        margin-bottom: ${MODERN_EMAIL_STYLES.spacing.xl};
        padding: ${MODERN_EMAIL_STYLES.spacing.lg};
        background: linear-gradient(135deg, ${MODERN_EMAIL_STYLES.colors.primary} 0%, ${MODERN_EMAIL_STYLES.colors.secondary} 100%);
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
        color: white;
      ">
        <div style="
          display: inline-block;
          width: 64px;
          height: 64px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          margin-bottom: ${MODERN_EMAIL_STYLES.spacing.md};
          position: relative;
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 24px;
            font-weight: bold;
          ">🛒</div>
        </div>
        <h2 style="
          margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.sm} 0;
          font-family: ${MODERN_EMAIL_STYLES.typography.headingFont};
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.title};
        ">${t.title}</h2>
        <div style="
          display: inline-block;
          padding: ${MODERN_EMAIL_STYLES.spacing.xs} ${MODERN_EMAIL_STYLES.spacing.md};
          background-color: ${priorityColor};
          border-radius: ${MODERN_EMAIL_STYLES.borderRadius.large};
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        ">
          ${t.priority}: ${priorityLevel}
        </div>
      </div>

      <!-- Order Details Card -->
      ${this.generateCardSection(t.orderDetails, `
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="
              padding: ${MODERN_EMAIL_STYLES.spacing.sm} 0;
              font-weight: 600;
              color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
              width: 30%;
            ">${t.orderNumber}:</td>
            <td style="
              padding: ${MODERN_EMAIL_STYLES.spacing.sm} 0;
              color: ${MODERN_EMAIL_STYLES.colors.primary};
              font-weight: 600;
              font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
            ">#${data.orderNumber}</td>
          </tr>
          <tr>
            <td style="
              padding: ${MODERN_EMAIL_STYLES.spacing.sm} 0;
              font-weight: 600;
              color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
            ">${t.orderDate}:</td>
            <td style="
              padding: ${MODERN_EMAIL_STYLES.spacing.sm} 0;
              color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
            ">${this.formatDate(data.orderDate, locale)}</td>
          </tr>
        </table>
      `)}

      <!-- Customer Information Card -->
      <div style="margin: ${MODERN_EMAIL_STYLES.spacing.xl} 0;">
        ${customerInfoCard}
      </div>

      <!-- Order Items Section -->
      <h3 style="
        color: ${MODERN_EMAIL_STYLES.colors.primary};
        font-family: ${MODERN_EMAIL_STYLES.typography.headingFont};
        font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.heading};
        margin: ${MODERN_EMAIL_STYLES.spacing.xl} 0 ${MODERN_EMAIL_STYLES.spacing.lg} 0;
      ">${t.items}</h3>

      <!-- Enhanced Product Display for Admin Review -->
      <div style="margin: ${MODERN_EMAIL_STYLES.spacing.lg} 0;">
        ${productCards}
      </div>

      <!-- Order Summary -->
      <div style="margin: ${MODERN_EMAIL_STYLES.spacing.xl} 0;">
        ${orderSummaryTable}
      </div>

      <!-- Address Information -->
      <div style="margin: ${MODERN_EMAIL_STYLES.spacing.xl} 0;">
        ${shippingAddressCard}
      </div>

      <div style="margin: ${MODERN_EMAIL_STYLES.spacing.xl} 0;">
        ${billingAddressCard}
      </div>

      <!-- Payment Information -->
      <div style="margin: ${MODERN_EMAIL_STYLES.spacing.xl} 0;">
        ${paymentInfoCard}
      </div>

      <!-- Customer Notes (if available) -->
      ${data.notes ? `
        <div style="margin: ${MODERN_EMAIL_STYLES.spacing.xl} 0;">
          ${this.generateCardSection(t.customerNotes, `
            <div style="
              padding: ${MODERN_EMAIL_STYLES.spacing.md};
              background-color: ${MODERN_EMAIL_STYLES.colors.background};
              border-radius: ${MODERN_EMAIL_STYLES.borderRadius.small};
              border-left: 4px solid ${MODERN_EMAIL_STYLES.colors.warning};
              font-style: italic;
              color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
            ">
              "${data.notes}"
            </div>
          `)}
        </div>
      ` : ''}

      <!-- Admin Action Buttons -->
      <div style="
        text-align: center;
        margin: ${MODERN_EMAIL_STYLES.spacing.xxl} 0;
        padding: ${MODERN_EMAIL_STYLES.spacing.xl} 0;
        border-top: 2px solid ${MODERN_EMAIL_STYLES.colors.primary};
        border-bottom: 2px solid ${MODERN_EMAIL_STYLES.colors.primary};
        background-color: ${MODERN_EMAIL_STYLES.colors.background};
      ">
        <h3 style="
          color: ${MODERN_EMAIL_STYLES.colors.primary};
          margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.lg} 0;
          font-family: ${MODERN_EMAIL_STYLES.typography.headingFont};
        ">Quick Actions</h3>
        <div style="margin-bottom: ${MODERN_EMAIL_STYLES.spacing.md};">
          ${viewOrderButton}
        </div>
        <div>
          ${processOrderButton}
        </div>
      </div>
    `;

    return {
      subject: t.subject,
      html: this.wrapInModernEmailLayout(content, locale),
    };
  }

  /**
   * Order confirmation email template for customers
   *
   * Generates a professional HTML email confirming the customer's order.
   * Includes order details, items, totals, and shipping address.
   *
   * @param data - Order email data with items and totals
   * @param locale - Language locale (en or vi), defaults to 'en'
   * @returns Email subject and HTML content wrapped in professional layout
   *
   * @example
   * ```typescript
   * const orderData = {
   *   orderNumber: 'ORD-123',
   *   customerName: 'John Doe',
   *   orderDate: new Date().toISOString(),
   *   items: [{
   *     name: 'Handmade Vase',
   *     quantity: 2,
   *     price: 50.00
   *   }],
   *   subtotal: 100.00,
   *   shippingCost: 10.00,
   *   taxAmount: 11.00,
   *   discountAmount: 0,
   *   total: 121.00,
   *   shippingAddress: { ... }
   * };
   *
   * const template = emailTemplateService.getOrderConfirmationTemplate(orderData, 'en');
   * // Returns: { subject: 'Order Confirmation #ORD-123', html: '<html>...</html>' }
   * ```
   *
   * @remarks
   * - Uses wrapInEmailLayout for consistent HTML structure
   * - Formats currency and dates appropriately for locale
   * - Includes responsive design for mobile devices
   * - Shows discount and tax if applicable
   */
  /**
   * Get simplified order confirmation template that works with swaks
   * This method generates minimal HTML to avoid swaks syntax errors
   * @param data - Order email data
   * @param locale - Language locale
   * @returns Simplified email template
   */
  getSimplifiedOrderConfirmationTemplate(
    data: OrderEmailData,
    locale: 'en' | 'vi' = 'en',
  ): { subject: string; html: string } {
    const translations = {
      en: {
        subject: `Order Confirmation - Order #${data.orderNumber}`,
        greeting: `Hello ${data.customerName},`,
        thankYou: 'Thank you for your order at AlaCraft!',
        orderDetails: 'Your order details:',
        orderNumber: 'Order Number',
        orderDate: 'Order Date',
        total: 'Total',
        pdfAttachment: 'Please see the attached PDF for detailed information about your order.',
        contactInfo: 'If you have any questions, please contact us.',
        signature: 'Best regards,<br>The AlaCraft Team',
      },
      vi: {
        subject: `Xác nhận đơn hàng - Đơn hàng #${data.orderNumber}`,
        greeting: `Xin chào ${data.customerName},`,
        thankYou: 'Cảm ơn bạn đã đặt hàng tại AlaCraft!',
        orderDetails: 'Chi tiết đơn hàng của bạn:',
        orderNumber: 'Mã đơn hàng',
        orderDate: 'Ngày đặt hàng',
        total: 'Tổng cộng',
        pdfAttachment: 'Vui lòng xem file PDF đính kèm để biết thông tin chi tiết về đơn hàng của bạn.',
        contactInfo: 'Nếu bạn có câu hỏi, vui lòng liên hệ với chúng tôi.',
        signature: 'Trân trọng,<br>Đội ngũ AlaCraft',
      },
    };

    const t = translations[locale];

    // Generate simplified HTML that works with swaks
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${t.subject}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

<div style="background-color: #2c3e50; color: white; padding: 20px; text-align: center; margin-bottom: 20px;">
<h1 style="margin: 0;">AlaCraft</h1>
</div>

<p>${t.greeting}</p>

<p>${t.thankYou}</p>

<div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-left: 4px solid #3498db;">
<h3 style="margin-top: 0;">${t.orderDetails}</h3>
<p><strong>${t.orderNumber}:</strong> ${data.orderNumber}</p>
<p><strong>${t.orderDate}:</strong> ${data.orderDate}</p>
<p><strong>${t.total}:</strong> ${this.formatCurrency(data.total, locale)}</p>
</div>

<p><strong>${t.pdfAttachment}</strong></p>

<p>${t.contactInfo}</p>

<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
<p>${t.signature}</p>
<p>&copy; ${new Date().getFullYear()} AlaCraft. All rights reserved.</p>
</div>

</body>
</html>`;

    return {
      subject: t.subject,
      html,
    };
  }

  getOrderConfirmationTemplate(
    data: OrderEmailData,
    locale: 'en' | 'vi' = 'en',
  ): { subject: string; html: string } {
    const translations = {
      en: {
        subject: `Order Confirmation #${data.orderNumber}`,
        title: 'Thank you for your order!',
        greeting: `Hello ${data.customerName},`,
        intro: 'We have received your order and are processing it. Here are the details:',
        orderDetails: 'Order Details',
        orderNumber: 'Order Number',
        orderDate: 'Order Date',
        items: 'Order Items',
        product: 'Product',
        quantity: 'Quantity',
        price: 'Price',
        subtotal: 'Subtotal',
        shipping: 'Shipping',
        tax: 'Tax',
        discount: 'Discount',
        total: 'Total',
        shippingAddress: 'Shipping Address',
        paymentMethod: 'Payment Method',
        closing: 'We will notify you when your order ships.',
        signature: 'Best regards,<br>AlaCraft Team',
        trackOrder: 'Track Your Order',
        shopMore: 'Continue Shopping',
      },
      vi: {
        subject: `Xác nhận đơn hàng #${data.orderNumber}`,
        title: 'Cảm ơn bạn đã đặt hàng!',
        greeting: `Xin chào ${data.customerName},`,
        intro: 'Chúng tôi đã nhận được đơn hàng của bạn và đang xử lý. Dưới đây là chi tiết:',
        orderDetails: 'Chi tiết đơn hàng',
        orderNumber: 'Mã đơn hàng',
        orderDate: 'Ngày đặt hàng',
        items: 'Sản phẩm đặt hàng',
        product: 'Sản phẩm',
        quantity: 'Số lượng',
        price: 'Giá',
        subtotal: 'Tạm tính',
        shipping: 'Phí vận chuyển',
        tax: 'Thuế',
        discount: 'Giảm giá',
        total: 'Tổng cộng',
        shippingAddress: 'Địa chỉ giao hàng',
        paymentMethod: 'Phương thức thanh toán',
        closing: 'Chúng tôi sẽ thông báo cho bạn khi đơn hàng được giao.',
        signature: 'Trân trọng,<br>Đội ngũ AlaCraft',
        trackOrder: 'Theo dõi đơn hàng',
        shopMore: 'Tiếp tục mua sắm',
      },
    };

    const t = translations[locale];

    // Generate enhanced product cards for each item
    const productCards = data.items
      .map((item) => this.generateProductCard(item, locale))
      .join('');

    // Generate modern table for order summary
    const summaryRows = [
      [t.subtotal, this.formatCurrency(data.subtotal, locale)],
      [t.shipping, this.formatCurrency(data.shippingCost, locale)],
    ];

    if (data.taxAmount && data.taxAmount > 0) {
      summaryRows.push([t.tax, this.formatCurrency(data.taxAmount, locale)]);
    }

    if (data.discountAmount && data.discountAmount > 0) {
      summaryRows.push([t.discount, `-${this.formatCurrency(data.discountAmount, locale)}`]);
    }

    summaryRows.push([`<strong>${t.total}</strong>`, `<strong>${this.formatCurrency(data.total, locale)}</strong>`]);

    const orderSummaryTable = this.generateModernTable(
      [t.orderDetails, ''],
      summaryRows
    );

    // Generate address card
    const shippingAddressCard = this.generateAddressCard(
      data.shippingAddress,
      t.shippingAddress,
      locale
    );

    // Generate payment info card if payment method data is available
    const paymentInfoCard = (data as any).paymentMethod ?
      this.generatePaymentInfoCard({
        type: (data as any).paymentMethod,
        displayName: (data as any).paymentMethod,
        details: (data as any).paymentDetails,
        qrCode: (data as any).qrCode,
        instructions: (data as any).paymentInstructions
      }, locale) : '';

    // Generate call-to-action buttons
    const trackOrderButton = ModernButtonGenerator.generatePrimaryButton(
      t.trackOrder,
      `${process.env.FRONTEND_URL || 'https://alacraft.com'}/orders/${data.orderNumber}`,
      false
    );

    const shopMoreButton = ModernButtonGenerator.generateSecondaryButton(
      t.shopMore,
      `${process.env.FRONTEND_URL || 'https://alacraft.com'}/products`,
      false
    );

    const content = `
      <!-- Welcome Section with Visual Icon -->
      <div style="text-align: center; margin-bottom: ${MODERN_EMAIL_STYLES.spacing.xl};">
        <div style="
          display: inline-block;
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, ${MODERN_EMAIL_STYLES.colors.success} 0%, #27ae60 100%);
          border-radius: 50%;
          margin-bottom: ${MODERN_EMAIL_STYLES.spacing.md};
          position: relative;
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 24px;
            font-weight: bold;
          ">✓</div>
        </div>
        <h2 style="
          color: ${MODERN_EMAIL_STYLES.colors.primary};
          margin: 0;
          font-family: ${MODERN_EMAIL_STYLES.typography.headingFont};
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.title};
        ">${t.title}</h2>
      </div>

      <p style="
        font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
        color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
        margin-bottom: ${MODERN_EMAIL_STYLES.spacing.lg};
      ">${t.greeting}</p>

      <p style="
        color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
        margin-bottom: ${MODERN_EMAIL_STYLES.spacing.xl};
      ">${t.intro}</p>

      <!-- Order Details Card -->
      ${this.generateCardSection(t.orderDetails, `
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="
              padding: ${MODERN_EMAIL_STYLES.spacing.sm} 0;
              font-weight: 600;
              color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
              width: 40%;
            ">${t.orderNumber}:</td>
            <td style="
              padding: ${MODERN_EMAIL_STYLES.spacing.sm} 0;
              color: ${MODERN_EMAIL_STYLES.colors.primary};
              font-weight: 600;
            ">#${data.orderNumber}</td>
          </tr>
          <tr>
            <td style="
              padding: ${MODERN_EMAIL_STYLES.spacing.sm} 0;
              font-weight: 600;
              color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
            ">${t.orderDate}:</td>
            <td style="
              padding: ${MODERN_EMAIL_STYLES.spacing.sm} 0;
              color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
            ">${this.formatDate(data.orderDate, locale)}</td>
          </tr>
        </table>
      `)}

      <!-- Order Items Section -->
      <h3 style="
        color: ${MODERN_EMAIL_STYLES.colors.primary};
        font-family: ${MODERN_EMAIL_STYLES.typography.headingFont};
        font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.heading};
        margin: ${MODERN_EMAIL_STYLES.spacing.xl} 0 ${MODERN_EMAIL_STYLES.spacing.lg} 0;
      ">${t.items}</h3>

      <!-- Enhanced Product Display -->
      <div style="margin: ${MODERN_EMAIL_STYLES.spacing.lg} 0;">
        ${productCards}
      </div>

      <!-- Order Summary -->
      <div style="margin: ${MODERN_EMAIL_STYLES.spacing.xl} 0;">
        ${orderSummaryTable}
      </div>

      <!-- Shipping Address -->
      <div style="margin: ${MODERN_EMAIL_STYLES.spacing.xl} 0;">
        ${shippingAddressCard}
      </div>

      <!-- Payment Information (if available) -->
      ${paymentInfoCard ? `
        <div style="margin: ${MODERN_EMAIL_STYLES.spacing.xl} 0;">
          ${paymentInfoCard}
        </div>
      ` : ''}

      <!-- Call-to-Action Buttons -->
      <div style="
        text-align: center;
        margin: ${MODERN_EMAIL_STYLES.spacing.xxl} 0;
        padding: ${MODERN_EMAIL_STYLES.spacing.xl} 0;
        border-top: 1px solid ${MODERN_EMAIL_STYLES.colors.border};
        border-bottom: 1px solid ${MODERN_EMAIL_STYLES.colors.border};
      ">
        <div style="margin-bottom: ${MODERN_EMAIL_STYLES.spacing.md};">
          ${trackOrderButton}
        </div>
        <div>
          ${shopMoreButton}
        </div>
      </div>

      <!-- Closing Message -->
      <div style="
        text-align: center;
        margin: ${MODERN_EMAIL_STYLES.spacing.xl} 0;
        padding: ${MODERN_EMAIL_STYLES.spacing.lg};
        background-color: ${MODERN_EMAIL_STYLES.colors.background};
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
        border-left: 4px solid ${MODERN_EMAIL_STYLES.colors.secondary};
      ">
        <p style="
          color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
          margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.sm} 0;
          font-weight: 500;
        ">${t.closing}</p>
        <p style="
          color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
          margin: 0;
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
        ">${t.signature}</p>
      </div>
    `;

    return {
      subject: t.subject,
      html: this.wrapInModernEmailLayout(content, locale),
    };
  }

  /**
   * Shipping notification email template for customers
   *
   * Generates an HTML email notifying the customer that their order has been shipped.
   * Includes tracking number if available.
   *
   * @param data - Order email data with shipping details
   * @param locale - Language locale (en or vi), defaults to 'en'
   * @returns Email subject and HTML content wrapped in professional layout
   *
   * @example
   * ```typescript
   * const orderData = {
   *   orderNumber: 'ORD-123',
   *   customerName: 'John Doe',
   *   orderDate: new Date().toISOString(),
   *   items: [...],
   *   subtotal: 100.00,
   *   shippingCost: 10.00,
   *   taxAmount: 11.00,
   *   discountAmount: 0,
   *   total: 121.00,
   *   shippingAddress: { ... },
   *   trackingNumber: 'TRACK123456'
   * };
   *
   * const template = emailTemplateService.getShippingNotificationTemplate(orderData, 'en');
   * // Returns: { subject: 'Order #ORD-123 has been shipped', html: '<html>...</html>' }
   * ```
   *
   * @remarks
   * - Uses wrapInEmailLayout for consistent HTML structure
   * - Shows tracking number prominently if provided
   * - Includes shipping address for reference
   */
  /**
   * Get simplified shipping notification template that works with swaks
   * @param data - Order email data
   * @param locale - Language locale
   * @returns Simplified shipping notification template
   */
  getSimplifiedShippingNotificationTemplate(
    data: OrderEmailData,
    locale: 'en' | 'vi' = 'en',
  ): { subject: string; html: string } {
    const translations = {
      en: {
        subject: `Order #${data.orderNumber} has been shipped`,
        greeting: `Hello ${data.customerName},`,
        title: 'Your order has been shipped!',
        orderNumber: 'Order Number',
        trackingNumber: 'Tracking Number',
        shippingAddress: 'Shipping Address',
        message: 'Your order is on its way to you.',
        signature: 'Best regards,<br>The AlaCraft Team',
      },
      vi: {
        subject: `Đơn hàng #${data.orderNumber} đã được gửi`,
        greeting: `Xin chào ${data.customerName},`,
        title: 'Đơn hàng của bạn đã được gửi!',
        orderNumber: 'Mã đơn hàng',
        trackingNumber: 'Mã vận đơn',
        shippingAddress: 'Địa chỉ giao hàng',
        message: 'Đơn hàng của bạn đang trên đường đến với bạn.',
        signature: 'Trân trọng,<br>Đội ngũ AlaCraft',
      },
    };

    const t = translations[locale];

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${t.subject}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

<div style="background-color: #27ae60; color: white; padding: 20px; text-align: center; margin-bottom: 20px;">
<h1 style="margin: 0;">${t.title}</h1>
</div>

<p>${t.greeting}</p>

<p>${t.message}</p>

<div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-left: 4px solid #27ae60;">
<p><strong>${t.orderNumber}:</strong> ${data.orderNumber}</p>
${(data as any).trackingNumber ? `<p><strong>${t.trackingNumber}:</strong> ${(data as any).trackingNumber}</p>` : ''}
</div>

<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
<p>${t.signature}</p>
<p>&copy; ${new Date().getFullYear()} AlaCraft. All rights reserved.</p>
</div>

</body>
</html>`;

    return {
      subject: t.subject,
      html,
    };
  }

  getShippingNotificationTemplate(
    data: OrderEmailData,
    locale: 'en' | 'vi' = 'en',
  ): { subject: string; html: string } {
    const translations = {
      en: {
        subject: `🚚 Order #${data.orderNumber} has been shipped`,
        title: 'Your order is on the way!',
        greeting: `Hello ${data.customerName},`,
        intro: `Great news! Your order has been shipped and is on its way to you.`,
        trackingNumber: 'Tracking Number',
        shippingAddress: 'Shipping Address',
        estimatedDelivery: 'Estimated Delivery',
        trackPackage: 'Track Your Package',
        orderDetails: 'Order Details',
        closing: 'Thank you for your purchase! We hope you love your handmade items.',
        signature: 'Best regards,<br>AlaCraft Team',
        deliveryNote: 'Please ensure someone is available to receive your package.',
        supportNote: 'If you have any questions, feel free to contact our support team.',
      },
      vi: {
        subject: `🚚 Đơn hàng #${data.orderNumber} đã được giao cho đơn vị vận chuyển`,
        title: 'Đơn hàng của bạn đang trên đường giao!',
        greeting: `Xin chào ${data.customerName},`,
        intro: `Tin tốt! Đơn hàng của bạn đã được giao cho đơn vị vận chuyển và đang trên đường đến bạn.`,
        trackingNumber: 'Mã vận đơn',
        shippingAddress: 'Địa chỉ giao hàng',
        estimatedDelivery: 'Dự kiến giao hàng',
        trackPackage: 'Theo dõi gói hàng',
        orderDetails: 'Chi tiết đơn hàng',
        closing: 'Cảm ơn bạn đã mua hàng! Chúng tôi hy vọng bạn sẽ yêu thích những sản phẩm thủ công của mình.',
        signature: 'Trân trọng,<br>Đội ngũ AlaCraft',
        deliveryNote: 'Vui lòng đảm bảo có người nhận gói hàng.',
        supportNote: 'Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với đội ngũ hỗ trợ của chúng tôi.',
      },
    };

    const t = translations[locale];

    // Calculate estimated delivery (3-5 business days from now)
    const estimatedDeliveryDate = new Date();
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 4); // 4 days average

    // Generate tracking button if tracking number is available
    const trackingButton = data.trackingNumber ?
      ModernButtonGenerator.generatePrimaryButton(
        t.trackPackage,
        `https://tracking.example.com/${data.trackingNumber}`, // Replace with actual tracking URL
        false
      ) : '';

    // Generate order details button
    const orderDetailsButton = ModernButtonGenerator.generateSecondaryButton(
      t.orderDetails,
      `${process.env.FRONTEND_URL || 'https://alacraft.com'}/orders/${data.orderNumber}`,
      false
    );

    // Generate shipping address card
    const shippingAddressCard = this.generateAddressCard(
      data.shippingAddress,
      t.shippingAddress,
      locale
    );

    const content = `
      <!-- Shipping Notification Header -->
      <div style="
        text-align: center;
        margin-bottom: ${MODERN_EMAIL_STYLES.spacing.xl};
        padding: ${MODERN_EMAIL_STYLES.spacing.xl};
        background: linear-gradient(135deg, ${MODERN_EMAIL_STYLES.colors.success}15 0%, ${MODERN_EMAIL_STYLES.colors.primary}15 100%);
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
        border: 2px solid ${MODERN_EMAIL_STYLES.colors.success}30;
      ">
        <div style="
          display: inline-block;
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, ${MODERN_EMAIL_STYLES.colors.success} 0%, ${MODERN_EMAIL_STYLES.colors.primary} 100%);
          border-radius: 50%;
          margin-bottom: ${MODERN_EMAIL_STYLES.spacing.md};
          position: relative;
          box-shadow: ${MODERN_EMAIL_STYLES.shadows.medium};
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 32px;
          ">🚚</div>
        </div>
        <h2 style="
          color: ${MODERN_EMAIL_STYLES.colors.primary};
          margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.sm} 0;
          font-family: ${MODERN_EMAIL_STYLES.typography.headingFont};
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.title};
        ">${t.title}</h2>
        <div style="
          display: inline-block;
          padding: ${MODERN_EMAIL_STYLES.spacing.xs} ${MODERN_EMAIL_STYLES.spacing.md};
          background-color: ${MODERN_EMAIL_STYLES.colors.success};
          color: white;
          border-radius: ${MODERN_EMAIL_STYLES.borderRadius.large};
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        ">
          ${STATUS.ORDER_STATUS.SHIPPED}
        </div>
      </div>

      <p style="
        font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
        color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
        margin-bottom: ${MODERN_EMAIL_STYLES.spacing.lg};
      ">${t.greeting}</p>

      <p style="
        color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
        margin-bottom: ${MODERN_EMAIL_STYLES.spacing.xl};
        line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.relaxed};
      ">${t.intro}</p>

      <!-- Order and Tracking Information -->
      ${this.generateCardSection(t.orderDetails, `
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="
              padding: ${MODERN_EMAIL_STYLES.spacing.sm} 0;
              font-weight: 600;
              color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
              width: 40%;
            ">Order Number:</td>
            <td style="
              padding: ${MODERN_EMAIL_STYLES.spacing.sm} 0;
              color: ${MODERN_EMAIL_STYLES.colors.primary};
              font-weight: 600;
            ">#${data.orderNumber}</td>
          </tr>
          ${data.trackingNumber ? `
            <tr>
              <td style="
                padding: ${MODERN_EMAIL_STYLES.spacing.sm} 0;
                font-weight: 600;
                color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
              ">${t.trackingNumber}:</td>
              <td style="
                padding: ${MODERN_EMAIL_STYLES.spacing.sm} 0;
                color: ${MODERN_EMAIL_STYLES.colors.secondary};
                font-weight: 600;
                font-family: monospace;
                font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
              ">${data.trackingNumber}</td>
            </tr>
          ` : ''}
          <tr>
            <td style="
              padding: ${MODERN_EMAIL_STYLES.spacing.sm} 0;
              font-weight: 600;
              color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
            ">${t.estimatedDelivery}:</td>
            <td style="
              padding: ${MODERN_EMAIL_STYLES.spacing.sm} 0;
              color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
            ">${this.formatDate(estimatedDeliveryDate, locale)}</td>
          </tr>
        </table>
      `)}

      <!-- Shipping Address -->
      <div style="margin: ${MODERN_EMAIL_STYLES.spacing.xl} 0;">
        ${shippingAddressCard}
      </div>

      <!-- Action Buttons -->
      <div style="
        text-align: center;
        margin: ${MODERN_EMAIL_STYLES.spacing.xxl} 0;
        padding: ${MODERN_EMAIL_STYLES.spacing.xl} 0;
        border-top: 1px solid ${MODERN_EMAIL_STYLES.colors.border};
        border-bottom: 1px solid ${MODERN_EMAIL_STYLES.colors.border};
      ">
        ${trackingButton ? `
          <div style="margin-bottom: ${MODERN_EMAIL_STYLES.spacing.md};">
            ${trackingButton}
          </div>
        ` : ''}
        <div>
          ${orderDetailsButton}
        </div>
      </div>

      <!-- Delivery Instructions -->
      <div style="
        margin: ${MODERN_EMAIL_STYLES.spacing.xl} 0;
        padding: ${MODERN_EMAIL_STYLES.spacing.lg};
        background-color: ${MODERN_EMAIL_STYLES.colors.warning}15;
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
        border-left: 4px solid ${MODERN_EMAIL_STYLES.colors.warning};
      ">
        <h3 style="
          color: ${MODERN_EMAIL_STYLES.colors.warning};
          margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.sm} 0;
          font-family: ${MODERN_EMAIL_STYLES.typography.headingFont};
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
        ">📋 Delivery Information</h3>
        <p style="
          color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
          margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.sm} 0;
        ">${t.deliveryNote}</p>
        <p style="
          color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
          margin: 0;
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
        ">${t.supportNote}</p>
      </div>

      <!-- Closing Message -->
      <div style="
        text-align: center;
        margin: ${MODERN_EMAIL_STYLES.spacing.xl} 0;
        padding: ${MODERN_EMAIL_STYLES.spacing.lg};
        background-color: ${MODERN_EMAIL_STYLES.colors.background};
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
      ">
        <p style="
          color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
          margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.sm} 0;
          font-weight: 500;
        ">${t.closing}</p>
        <p style="
          color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
          margin: 0;
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
        ">${t.signature}</p>
      </div>
    `;

    return {
      subject: t.subject,
      html: this.wrapInModernEmailLayout(content, locale),
    };
  }

  /**
   * Order status update email template for customers
   *
   * Generates an HTML email notifying the customer of an order status change.
   * Includes status-specific messages explaining what the status means.
   *
   * @param data - Order email data with current status
   * @param locale - Language locale (en or vi), defaults to 'en'
   * @returns Email subject and HTML content wrapped in professional layout
   *
   * @example
   * ```typescript
   * const orderData = {
   *   orderNumber: 'ORD-123',
   *   customerName: 'John Doe',
   *   orderDate: new Date().toISOString(),
   *   items: [...],
   *   subtotal: 100.00,
   *   shippingCost: 10.00,
   *   taxAmount: 11.00,
   *   discountAmount: 0,
   *   total: 121.00,
   *   shippingAddress: { ... },
   *   status: 'processing'
   * };
   *
   * const template = emailTemplateService.getOrderStatusUpdateTemplate(orderData, 'en');
   * // Returns: { subject: 'Order #ORD-123 Status Update', html: '<html>...</html>' }
   * ```
   *
   * @remarks
   * - Uses wrapInEmailLayout for consistent HTML structure
   * - Provides localized status names (pending, processing, shipped, delivered, cancelled, refunded)
   * - Includes helpful status-specific messages for each status
   * - Supports both English and Vietnamese
   */
  /**
   * Get simplified order status update template that works with swaks
   * @param data - Order email data
   * @param locale - Language locale
   * @returns Simplified status update template
   */
  getSimplifiedOrderStatusUpdateTemplate(
    data: OrderEmailData,
    locale: 'en' | 'vi' = 'en',
  ): { subject: string; html: string } {
    const translations = {
      en: {
        subject: `Order #${data.orderNumber} Status Update`,
        greeting: `Hello ${data.customerName},`,
        title: 'Order Status Update',
        orderNumber: 'Order Number',
        newStatus: 'New Status',
        message: 'Your order status has been updated.',
        signature: 'Best regards,<br>The AlaCraft Team',
      },
      vi: {
        subject: `Cập nhật trạng thái đơn hàng #${data.orderNumber}`,
        greeting: `Xin chào ${data.customerName},`,
        title: 'Cập nhật trạng thái đơn hàng',
        orderNumber: 'Mã đơn hàng',
        newStatus: 'Trạng thái mới',
        message: 'Trạng thái đơn hàng của bạn đã được cập nhật.',
        signature: 'Trân trọng,<br>Đội ngũ AlaCraft',
      },
    };

    const t = translations[locale];

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${t.subject}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

<div style="background-color: #3498db; color: white; padding: 20px; text-align: center; margin-bottom: 20px;">
<h1 style="margin: 0;">${t.title}</h1>
</div>

<p>${t.greeting}</p>

<p>${t.message}</p>

<div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-left: 4px solid #3498db;">
<p><strong>${t.orderNumber}:</strong> ${data.orderNumber}</p>
<p><strong>${t.newStatus}:</strong> ${(data as any).newStatus || 'Updated'}</p>
</div>

<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
<p>${t.signature}</p>
<p>&copy; ${new Date().getFullYear()} AlaCraft. All rights reserved.</p>
</div>

</body>
</html>`;

    return {
      subject: t.subject,
      html,
    };
  }

  getOrderStatusUpdateTemplate(
    data: OrderEmailData,
    locale: 'en' | 'vi' = 'en',
  ): { subject: string; html: string } {
    const statusTranslations = {
      en: {
        [STATUS.ORDER_STATUS.PENDING.toLowerCase()]: 'Pending',
        [STATUS.ORDER_STATUS.PROCESSING.toLowerCase()]: 'Processing',
        [STATUS.ORDER_STATUS.SHIPPED.toLowerCase()]: 'Shipped',
        [STATUS.ORDER_STATUS.DELIVERED.toLowerCase()]: 'Delivered',
        [STATUS.ORDER_STATUS.CANCELLED.toLowerCase()]: 'Cancelled',
        [STATUS.ORDER_STATUS.REFUNDED.toLowerCase()]: 'Refunded',
      },
      vi: {
        [STATUS.ORDER_STATUS.PENDING.toLowerCase()]: 'Chờ xử lý',
        [STATUS.ORDER_STATUS.PROCESSING.toLowerCase()]: 'Đang xử lý',
        [STATUS.ORDER_STATUS.SHIPPED.toLowerCase()]: 'Đã giao vận',
        [STATUS.ORDER_STATUS.DELIVERED.toLowerCase()]: 'Đã giao hàng',
        [STATUS.ORDER_STATUS.CANCELLED.toLowerCase()]: 'Đã hủy',
        [STATUS.ORDER_STATUS.REFUNDED.toLowerCase()]: 'Đã hoàn tiền',
      },
    };

    const statusMessages = {
      en: {
        [STATUS.ORDER_STATUS.PENDING.toLowerCase()]:
          'Your order has been received and is awaiting processing. We will begin preparing your items soon.',
        [STATUS.ORDER_STATUS.PROCESSING.toLowerCase()]:
          'Great news! Your order is currently being prepared for shipment. Our team is carefully packaging your items.',
        [STATUS.ORDER_STATUS.SHIPPED.toLowerCase()]:
          'Your order has been shipped and is on its way to you. You should receive it within the estimated delivery time.',
        [STATUS.ORDER_STATUS.DELIVERED.toLowerCase()]:
          'Your order has been successfully delivered. We hope you enjoy your purchase! Please consider leaving a review.',
        [STATUS.ORDER_STATUS.CANCELLED.toLowerCase()]:
          'Your order has been cancelled. If you have any questions or concerns, please don\'t hesitate to contact us.',
        [STATUS.ORDER_STATUS.REFUNDED.toLowerCase()]:
          'Your order has been refunded. The amount will be credited to your account within 5-7 business days.',
      },
      vi: {
        [STATUS.ORDER_STATUS.PENDING.toLowerCase()]:
          'Đơn hàng của bạn đã được nhận và đang chờ xử lý. Chúng tôi sẽ bắt đầu chuẩn bị sản phẩm của bạn sớm.',
        [STATUS.ORDER_STATUS.PROCESSING.toLowerCase()]:
          'Tin tốt! Đơn hàng của bạn đang được chuẩn bị để giao hàng. Đội ngũ của chúng tôi đang cẩn thận đóng gói sản phẩm của bạn.',
        [STATUS.ORDER_STATUS.SHIPPED.toLowerCase()]:
          'Đơn hàng của bạn đã được giao cho đơn vị vận chuyển và đang trên đường đến bạn. Bạn sẽ nhận được trong thời gian giao hàng dự kiến.',
        [STATUS.ORDER_STATUS.DELIVERED.toLowerCase()]:
          'Đơn hàng của bạn đã được giao thành công. Chúng tôi hy vọng bạn hài lòng với sản phẩm! Vui lòng xem xét để lại đánh giá.',
        [STATUS.ORDER_STATUS.CANCELLED.toLowerCase()]:
          'Đơn hàng của bạn đã bị hủy. Nếu bạn có bất kỳ câu hỏi hoặc thắc mắc nào, vui lòng liên hệ với chúng tôi.',
        [STATUS.ORDER_STATUS.REFUNDED.toLowerCase()]:
          'Đơn hàng của bạn đã được hoàn tiền. Số tiền sẽ được chuyển vào tài khoản của bạn trong vòng 5-7 ngày làm việc.',
      },
    };

    const statusIcons = {
      [STATUS.ORDER_STATUS.PENDING.toLowerCase()]: '⏳',
      [STATUS.ORDER_STATUS.PROCESSING.toLowerCase()]: '📦',
      [STATUS.ORDER_STATUS.SHIPPED.toLowerCase()]: '🚚',
      [STATUS.ORDER_STATUS.DELIVERED.toLowerCase()]: '✅',
      [STATUS.ORDER_STATUS.CANCELLED.toLowerCase()]: '❌',
      [STATUS.ORDER_STATUS.REFUNDED.toLowerCase()]: '💰',
    };

    const statusColors = {
      [STATUS.ORDER_STATUS.PENDING.toLowerCase()]: MODERN_EMAIL_STYLES.colors.warning,
      [STATUS.ORDER_STATUS.PROCESSING.toLowerCase()]: MODERN_EMAIL_STYLES.colors.secondary,
      [STATUS.ORDER_STATUS.SHIPPED.toLowerCase()]: MODERN_EMAIL_STYLES.colors.primary,
      [STATUS.ORDER_STATUS.DELIVERED.toLowerCase()]: MODERN_EMAIL_STYLES.colors.success,
      [STATUS.ORDER_STATUS.CANCELLED.toLowerCase()]: MODERN_EMAIL_STYLES.colors.accent,
      [STATUS.ORDER_STATUS.REFUNDED.toLowerCase()]: MODERN_EMAIL_STYLES.colors.warning,
    };

    const translations = {
      en: {
        subject: `Order #${data.orderNumber} Status Update`,
        title: 'Your order has been updated',
        greeting: `Hello ${data.customerName},`,
        statusLabel: 'New Status',
        orderNumber: 'Order Number',
        whatNext: 'What happens next?',
        trackOrder: 'Track Your Order',
        contactUs: 'Contact Support',
        shopMore: 'Continue Shopping',
        signature: 'Best regards,<br>AlaCraft Team',
      },
      vi: {
        subject: `Cập nhật đơn hàng #${data.orderNumber}`,
        title: 'Đơn hàng của bạn đã được cập nhật',
        greeting: `Xin chào ${data.customerName},`,
        statusLabel: 'Trạng thái mới',
        orderNumber: 'Mã đơn hàng',
        whatNext: 'Điều gì sẽ xảy ra tiếp theo?',
        trackOrder: 'Theo dõi đơn hàng',
        contactUs: 'Liên hệ hỗ trợ',
        shopMore: 'Tiếp tục mua sắm',
        signature: 'Trân trọng,<br>Đội ngũ AlaCraft',
      },
    };

    const t = translations[locale];
    const statusText =
      (statusTranslations[locale] as any)[data.status as string] ||
      data.status;
    const statusMessage =
      (statusMessages[locale] as any)[data.status as string] ||
      '';
    const statusIcon = (statusIcons as any)[data.status as string] || '📋';
    const statusColor = (statusColors as any)[data.status as string] || MODERN_EMAIL_STYLES.colors.primary;

    // Generate modern status badge
    const statusBadge = StatusBadgeGenerator.generateOrderStatusBadge(
      data.status as any,
      locale,
      'large'
    );

    // Generate action buttons based on status
    let actionButtons = '';

    if (data.status === STATUS.ORDER_STATUS.SHIPPED.toLowerCase() || data.status === STATUS.ORDER_STATUS.PROCESSING.toLowerCase()) {
      const trackOrderButton = ModernButtonGenerator.generatePrimaryButton(
        t.trackOrder,
        `${process.env.FRONTEND_URL || 'https://alacraft.com'}/orders/${data.orderNumber}`,
        false
      );
      actionButtons = trackOrderButton;
    } else if (data.status === STATUS.ORDER_STATUS.DELIVERED.toLowerCase()) {
      const shopMoreButton = ModernButtonGenerator.generateSuccessButton(
        t.shopMore,
        `${process.env.FRONTEND_URL || 'https://alacraft.com'}/products`,
        false
      );
      actionButtons = shopMoreButton;
    } else if (data.status === STATUS.ORDER_STATUS.CANCELLED.toLowerCase() || data.status === STATUS.ORDER_STATUS.REFUNDED.toLowerCase()) {
      const contactButton = ModernButtonGenerator.generateSecondaryButton(
        t.contactUs,
        `${process.env.FRONTEND_URL || 'https://alacraft.com'}/contact`,
        false
      );
      actionButtons = contactButton;
    }

    const content = `
      <!-- Status Update Header with Visual Indicator -->
      <div style="
        text-align: center;
        margin-bottom: ${MODERN_EMAIL_STYLES.spacing.xl};
        padding: ${MODERN_EMAIL_STYLES.spacing.xl};
        background: linear-gradient(135deg, ${statusColor}15 0%, ${statusColor}05 100%);
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
        border: 2px solid ${statusColor}30;
      ">
        <div style="
          display: inline-block;
          width: 80px;
          height: 80px;
          background: ${statusColor};
          border-radius: 50%;
          margin-bottom: ${MODERN_EMAIL_STYLES.spacing.md};
          position: relative;
          box-shadow: ${MODERN_EMAIL_STYLES.shadows.medium};
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 32px;
          ">${statusIcon}</div>
        </div>
        <h2 style="
          color: ${MODERN_EMAIL_STYLES.colors.primary};
          margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.md} 0;
          font-family: ${MODERN_EMAIL_STYLES.typography.headingFont};
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.title};
        ">${t.title}</h2>
        <div style="margin: ${MODERN_EMAIL_STYLES.spacing.md} 0;">
          ${statusBadge}
        </div>
      </div>

      <p style="
        font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
        color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
        margin-bottom: ${MODERN_EMAIL_STYLES.spacing.lg};
      ">${t.greeting}</p>

      <!-- Order Information Card -->
      ${this.generateCardSection(t.orderNumber, `
        <div style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
        ">
          <div style="
            font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.heading};
            font-weight: 600;
            color: ${MODERN_EMAIL_STYLES.colors.primary};
          ">#${data.orderNumber}</div>
          <div style="
            font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
            color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
          ">${this.formatDate(data.orderDate, locale)}</div>
        </div>
      `)}

      <!-- Status Message -->
      <div style="
        margin: ${MODERN_EMAIL_STYLES.spacing.xl} 0;
        padding: ${MODERN_EMAIL_STYLES.spacing.lg};
        background-color: ${statusColor}10;
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
        border-left: 4px solid ${statusColor};
      ">
        <h3 style="
          color: ${statusColor};
          margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.md} 0;
          font-family: ${MODERN_EMAIL_STYLES.typography.headingFont};
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
        ">${t.whatNext}</h3>
        <p style="
          color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
          margin: 0;
          line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.relaxed};
        ">${statusMessage}</p>
      </div>

      <!-- Action Buttons (if applicable) -->
      ${actionButtons ? `
        <div style="
          text-align: center;
          margin: ${MODERN_EMAIL_STYLES.spacing.xxl} 0;
          padding: ${MODERN_EMAIL_STYLES.spacing.xl} 0;
          border-top: 1px solid ${MODERN_EMAIL_STYLES.colors.border};
          border-bottom: 1px solid ${MODERN_EMAIL_STYLES.colors.border};
        ">
          ${actionButtons}
        </div>
      ` : ''}

      <!-- Closing Message -->
      <div style="
        text-align: center;
        margin: ${MODERN_EMAIL_STYLES.spacing.xl} 0;
        padding: ${MODERN_EMAIL_STYLES.spacing.lg};
        background-color: ${MODERN_EMAIL_STYLES.colors.background};
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
      ">
        <p style="
          color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
          margin: 0;
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
        ">${t.signature}</p>
      </div>
    `;

    return {
      subject: t.subject,
      html: this.wrapInModernEmailLayout(content, locale),
    };
  }

  /**
   * Welcome email template for new users
   *
   * Generates a welcome email for newly registered users.
   * Optionally includes email verification link.
   *
   * @param data - User email data with name and optional verification token
   * @param locale - Language locale (en or vi), defaults to 'en'
   * @returns Email subject and HTML content
   *
   * @example
   * ```typescript
   * const userData = {
   *   name: 'John Doe',
   *   email: 'john@example.com',
   *   verificationToken: 'abc123...'
   * };
   *
   * const template = emailTemplateService.getWelcomeEmailTemplate(userData, 'en');
   * // Returns: { subject: 'Welcome to our store!', html: '<html>...</html>' }
   * ```
   *
   * @remarks
   * - Includes verification link if verificationToken is provided
   * - Uses FRONTEND_URL environment variable for links
   */
  getWelcomeEmailTemplate(
    data: UserEmailData,
    locale: 'en' | 'vi' = 'en',
  ): { subject: string; html: string } {
    const translations = {
      en: {
        subject: '🎉 Welcome to AlaCraft!',
        title: 'Welcome to AlaCraft!',
        greeting: `Hello ${data.name},`,
        intro: 'Thank you for joining our community of handmade craft enthusiasts!',
        shopNow: 'You can now start exploring our unique collection of handmade products crafted with love and attention to detail.',
        verifyEmail: 'To get started, please verify your email address:',
        verifyButton: 'Verify Email Address',
        exploreProducts: 'Explore Products',
        whatNext: 'What can you do now?',
        features: [
          'Browse our curated collection of handmade items',
          'Save your favorite products to your wishlist',
          'Track your orders and delivery status',
          'Get exclusive access to new arrivals and special offers'
        ],
        signature: 'Best regards,<br>AlaCraft Team',
        supportNote: 'If you have any questions, our support team is here to help!'
      },
      vi: {
        subject: '🎉 Chào mừng đến với AlaCraft!',
        title: 'Chào mừng đến với AlaCraft!',
        greeting: `Xin chào ${data.name},`,
        intro: 'Cảm ơn bạn đã tham gia cộng đồng những người yêu thích đồ thủ công của chúng tôi!',
        shopNow: 'Bây giờ bạn có thể bắt đầu khám phá bộ sưu tập độc đáo các sản phẩm thủ công được chế tác với tình yêu và sự chú ý đến từng chi tiết.',
        verifyEmail: 'Để bắt đầu, vui lòng xác minh địa chỉ email của bạn:',
        verifyButton: 'Xác minh địa chỉ Email',
        exploreProducts: 'Khám phá sản phẩm',
        whatNext: 'Bạn có thể làm gì bây giờ?',
        features: [
          'Duyệt bộ sưu tập được tuyển chọn các sản phẩm thủ công',
          'Lưu các sản phẩm yêu thích vào danh sách mong muốn',
          'Theo dõi đơn hàng và trạng thái giao hàng',
          'Nhận quyền truy cập độc quyền vào hàng mới và ưu đãi đặc biệt'
        ],
        signature: 'Trân trọng,<br>Đội ngũ AlaCraft',
        supportNote: 'Nếu bạn có bất kỳ câu hỏi nào, đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ!'
      }
    };

    const t = translations[locale];

    // Generate verification button if token is provided
    const verifyButton = data.verificationToken ?
      ModernButtonGenerator.generatePrimaryButton(
        t.verifyButton,
        `${process.env.FRONTEND_URL}/verify-email?token=${data.verificationToken}`,
        false
      ) : '';

    // Generate explore products button
    const exploreButton = ModernButtonGenerator.generateSecondaryButton(
      t.exploreProducts,
      `${process.env.FRONTEND_URL || 'https://alacraft.com'}/products`,
      false
    );

    // Generate features list
    const featuresList = t.features.map(feature => `
      <div style="
        display: flex;
        align-items: flex-start;
        margin-bottom: ${MODERN_EMAIL_STYLES.spacing.md};
      ">
        <div style="
          width: 20px;
          height: 20px;
          background-color: ${MODERN_EMAIL_STYLES.colors.success};
          border-radius: 50%;
          margin-right: ${MODERN_EMAIL_STYLES.spacing.md};
          margin-top: 2px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="
            color: white;
            font-size: 12px;
            font-weight: bold;
          ">✓</span>
        </div>
        <p style="
          margin: 0;
          color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
          line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.normal};
        ">${feature}</p>
      </div>
    `).join('');

    const content = `
      <!-- Welcome Header -->
      <div style="
        text-align: center;
        margin-bottom: ${MODERN_EMAIL_STYLES.spacing.xl};
        padding: ${MODERN_EMAIL_STYLES.spacing.xl};
        background: linear-gradient(135deg, ${MODERN_EMAIL_STYLES.colors.primary}15 0%, ${MODERN_EMAIL_STYLES.colors.secondary}15 100%);
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
        border: 2px solid ${MODERN_EMAIL_STYLES.colors.primary}30;
      ">
        <div style="
          display: inline-block;
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, ${MODERN_EMAIL_STYLES.colors.primary} 0%, ${MODERN_EMAIL_STYLES.colors.secondary} 100%);
          border-radius: 50%;
          margin-bottom: ${MODERN_EMAIL_STYLES.spacing.md};
          position: relative;
          box-shadow: ${MODERN_EMAIL_STYLES.shadows.medium};
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 32px;
          ">🎉</div>
        </div>
        <h2 style="
          color: ${MODERN_EMAIL_STYLES.colors.primary};
          margin: 0;
          font-family: ${MODERN_EMAIL_STYLES.typography.headingFont};
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.title};
        ">${t.title}</h2>
      </div>

      <p style="
        font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
        color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
        margin-bottom: ${MODERN_EMAIL_STYLES.spacing.lg};
      ">${t.greeting}</p>

      <p style="
        color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
        margin-bottom: ${MODERN_EMAIL_STYLES.spacing.lg};
        line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.relaxed};
      ">${t.intro}</p>

      <p style="
        color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
        margin-bottom: ${MODERN_EMAIL_STYLES.spacing.xl};
        line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.relaxed};
      ">${t.shopNow}</p>

      <!-- Email Verification (if needed) -->
      ${data.verificationToken ? `
        <div style="
          margin: ${MODERN_EMAIL_STYLES.spacing.xl} 0;
          padding: ${MODERN_EMAIL_STYLES.spacing.lg};
          background-color: ${MODERN_EMAIL_STYLES.colors.secondary}15;
          border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
          border-left: 4px solid ${MODERN_EMAIL_STYLES.colors.secondary};
          text-align: center;
        ">
          <h3 style="
            color: ${MODERN_EMAIL_STYLES.colors.secondary};
            margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.md} 0;
            font-family: ${MODERN_EMAIL_STYLES.typography.headingFont};
            font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
          ">📧 ${t.verifyEmail}</h3>
          <div style="margin: ${MODERN_EMAIL_STYLES.spacing.lg} 0;">
            ${verifyButton}
          </div>
        </div>
      ` : ''}

      <!-- What's Next Section -->
      <div style="margin: ${MODERN_EMAIL_STYLES.spacing.xl} 0;">
        ${this.generateCardSection(t.whatNext, `
          <div style="margin: ${MODERN_EMAIL_STYLES.spacing.md} 0;">
            ${featuresList}
          </div>
        `)}
      </div>

      <!-- Action Buttons -->
      <div style="
        text-align: center;
        margin: ${MODERN_EMAIL_STYLES.spacing.xxl} 0;
        padding: ${MODERN_EMAIL_STYLES.spacing.xl} 0;
        border-top: 1px solid ${MODERN_EMAIL_STYLES.colors.border};
        border-bottom: 1px solid ${MODERN_EMAIL_STYLES.colors.border};
      ">
        <div>
          ${exploreButton}
        </div>
      </div>

      <!-- Support Note -->
      <div style="
        text-align: center;
        margin: ${MODERN_EMAIL_STYLES.spacing.xl} 0;
        padding: ${MODERN_EMAIL_STYLES.spacing.lg};
        background-color: ${MODERN_EMAIL_STYLES.colors.background};
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
      ">
        <p style="
          color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
          margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.sm} 0;
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
        ">${t.supportNote}</p>
        <p style="
          color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
          margin: 0;
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
        ">${t.signature}</p>
      </div>
    `;

    return {
      subject: t.subject,
      html: this.wrapInModernEmailLayout(content, locale),
    };
  }

  /**
   * Password reset email template
   *
   * Generates a password reset email with a secure reset link.
   * Link expires after 1 hour.
   *
   * @param data - User email data with name and reset token
   * @param locale - Language locale (en or vi), defaults to 'en'
   * @returns Email subject and HTML content
   *
   * @example
   * ```typescript
   * const userData = {
   *   name: 'John Doe',
   *   email: 'john@example.com',
   *   resetToken: 'xyz789...'
   * };
   *
   * const template = emailTemplateService.getPasswordResetTemplate(userData, 'en');
   * // Returns: { subject: 'Password Reset', html: '<html>...</html>' }
   * ```
   *
   * @remarks
   * - Includes reset link with token parameter
   * - Uses FRONTEND_URL environment variable for links
   * - Warns user that link expires in 1 hour
   * - Advises to ignore email if not requested
   */
  getPasswordResetTemplate(
    data: UserEmailData,
    locale: 'en' | 'vi' = 'en',
  ): { subject: string; html: string } {
    const translations = {
      en: {
        subject: '🔐 Password Reset Request',
        title: 'Password Reset Request',
        greeting: `Hello ${data.name},`,
        intro: 'We received a request to reset the password for your AlaCraft account.',
        resetInstructions: 'To reset your password, click the button below:',
        resetButton: 'Reset My Password',
        expiry: 'This link will expire in 1 hour for security reasons.',
        ignore: 'If you did not request a password reset, please ignore this email. Your account remains secure.',
        securityTip: 'Security Tip',
        securityNote: 'For your account security, we recommend using a strong password with a mix of letters, numbers, and symbols.',
        signature: 'Best regards,<br>AlaCraft Security Team',
        contactSupport: 'Contact Support',
        needHelp: 'Need help? Our support team is here to assist you.'
      },
      vi: {
        subject: '🔐 Yêu cầu đặt lại mật khẩu',
        title: 'Yêu cầu đặt lại mật khẩu',
        greeting: `Xin chào ${data.name},`,
        intro: 'Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản AlaCraft của bạn.',
        resetInstructions: 'Để đặt lại mật khẩu, vui lòng nhấp vào nút bên dưới:',
        resetButton: 'Đặt lại mật khẩu',
        expiry: 'Liên kết này sẽ hết hạn sau 1 giờ vì lý do bảo mật.',
        ignore: 'Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.',
        securityTip: 'Mẹo bảo mật',
        securityNote: 'Để bảo mật tài khoản, chúng tôi khuyên bạn sử dụng mật khẩu mạnh với sự kết hợp của chữ cái, số và ký hiệu.',
        signature: 'Trân trọng,<br>Đội ngũ bảo mật AlaCraft',
        contactSupport: 'Liên hệ hỗ trợ',
        needHelp: 'Cần giúp đỡ? Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng hỗ trợ bạn.'
      }
    };

    const t = translations[locale];

    // Generate reset button if token is provided
    const resetButton = data.resetToken ?
      ModernButtonGenerator.generateWarningButton(
        t.resetButton,
        `${process.env.FRONTEND_URL}/reset-password?token=${data.resetToken}`,
        false
      ) : '';

    // Generate contact support button
    const supportButton = ModernButtonGenerator.generateSecondaryButton(
      t.contactSupport,
      `${process.env.FRONTEND_URL || 'https://alacraft.com'}/contact`,
      false
    );

    const content = `
      <!-- Security Alert Header -->
      <div style="
        text-align: center;
        margin-bottom: ${MODERN_EMAIL_STYLES.spacing.xl};
        padding: ${MODERN_EMAIL_STYLES.spacing.xl};
        background: linear-gradient(135deg, ${MODERN_EMAIL_STYLES.colors.warning}15 0%, ${MODERN_EMAIL_STYLES.colors.accent}15 100%);
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
        border: 2px solid ${MODERN_EMAIL_STYLES.colors.warning}30;
      ">
        <div style="
          display: inline-block;
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, ${MODERN_EMAIL_STYLES.colors.warning} 0%, ${MODERN_EMAIL_STYLES.colors.accent} 100%);
          border-radius: 50%;
          margin-bottom: ${MODERN_EMAIL_STYLES.spacing.md};
          position: relative;
          box-shadow: ${MODERN_EMAIL_STYLES.shadows.medium};
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 32px;
          ">🔐</div>
        </div>
        <h2 style="
          color: ${MODERN_EMAIL_STYLES.colors.primary};
          margin: 0;
          font-family: ${MODERN_EMAIL_STYLES.typography.headingFont};
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.title};
        ">${t.title}</h2>
      </div>

      <p style="
        font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
        color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
        margin-bottom: ${MODERN_EMAIL_STYLES.spacing.lg};
      ">${t.greeting}</p>

      <p style="
        color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
        margin-bottom: ${MODERN_EMAIL_STYLES.spacing.xl};
        line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.relaxed};
      ">${t.intro}</p>

      <!-- Reset Instructions -->
      ${data.resetToken ? `
        <div style="
          margin: ${MODERN_EMAIL_STYLES.spacing.xl} 0;
          padding: ${MODERN_EMAIL_STYLES.spacing.lg};
          background-color: ${MODERN_EMAIL_STYLES.colors.warning}15;
          border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
          border-left: 4px solid ${MODERN_EMAIL_STYLES.colors.warning};
          text-align: center;
        ">
          <h3 style="
            color: ${MODERN_EMAIL_STYLES.colors.warning};
            margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.md} 0;
            font-family: ${MODERN_EMAIL_STYLES.typography.headingFont};
            font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
          ">${t.resetInstructions}</h3>
          <div style="margin: ${MODERN_EMAIL_STYLES.spacing.lg} 0;">
            ${resetButton}
          </div>
        </div>
      ` : ''}

      <!-- Security Information -->
      <div style="
        margin: ${MODERN_EMAIL_STYLES.spacing.xl} 0;
        padding: ${MODERN_EMAIL_STYLES.spacing.lg};
        background-color: ${MODERN_EMAIL_STYLES.colors.accent}10;
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
        border-left: 4px solid ${MODERN_EMAIL_STYLES.colors.accent};
      ">
        <h3 style="
          color: ${MODERN_EMAIL_STYLES.colors.accent};
          margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.md} 0;
          font-family: ${MODERN_EMAIL_STYLES.typography.headingFont};
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
        ">⚠️ ${t.securityTip}</h3>
        <p style="
          color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
          margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.sm} 0;
          font-weight: 600;
        ">${t.expiry}</p>
        <p style="
          color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
          margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.md} 0;
        ">${t.ignore}</p>
        <p style="
          color: ${MODERN_EMAIL_STYLES.colors.textPrimary};
          margin: 0;
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
          font-style: italic;
        ">${t.securityNote}</p>
      </div>

      <!-- Support Section -->
      <div style="
        text-align: center;
        margin: ${MODERN_EMAIL_STYLES.spacing.xxl} 0;
        padding: ${MODERN_EMAIL_STYLES.spacing.xl} 0;
        border-top: 1px solid ${MODERN_EMAIL_STYLES.colors.border};
        border-bottom: 1px solid ${MODERN_EMAIL_STYLES.colors.border};
      ">
        <p style="
          color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
          margin: 0 0 ${MODERN_EMAIL_STYLES.spacing.lg} 0;
        ">${t.needHelp}</p>
        <div>
          ${supportButton}
        </div>
      </div>

      <!-- Closing Message -->
      <div style="
        text-align: center;
        margin: ${MODERN_EMAIL_STYLES.spacing.xl} 0;
        padding: ${MODERN_EMAIL_STYLES.spacing.lg};
        background-color: ${MODERN_EMAIL_STYLES.colors.background};
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
      ">
        <p style="
          color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
          margin: 0;
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
        ">${t.signature}</p>
      </div>
    `;

    return {
      subject: t.subject,
      html: this.wrapInModernEmailLayout(content, locale),
    };
  }
}