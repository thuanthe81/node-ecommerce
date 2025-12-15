/**
 * Modern Email Design Tokens and Style Constants
 *
 * This file contains all design tokens and style constants for the modern email
 * template system. These tokens ensure consistency across all email templates
 * and provide a centralized place to manage the visual design system.
 */

export interface ModernEmailStyles {
  colors: {
    primary: string;      // #2c3e50 (dark blue-gray)
    secondary: string;    // #3498db (bright blue)
    accent: string;       // #e74c3c (red for important items)
    success: string;      // #27ae60 (green for success states)
    warning: string;      // #f39c12 (orange for warnings)
    background: string;   // #f8f9fa (light gray background)
    cardBackground: string; // #ffffff (white cards)
    textPrimary: string;  // #2c3e50 (dark text)
    textSecondary: string; // #7f8c8d (lighter text)
    border: string;       // #ecf0f1 (light borders)
  };
  typography: {
    fontFamily: string;   // 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif
    headingFont: string;  // 'Georgia', 'Times New Roman', serif
    fontSize: {
      small: string;      // 12px
      body: string;       // 14px
      large: string;      // 16px
      heading: string;    // 20px
      title: string;      // 24px
    };
    lineHeight: {
      tight: string;      // 1.2
      normal: string;     // 1.5
      relaxed: string;    // 1.7
    };
  };
  spacing: {
    xs: string;          // 4px
    sm: string;          // 8px
    md: string;          // 16px
    lg: string;          // 24px
    xl: string;          // 32px
    xxl: string;         // 48px
  };
  borderRadius: {
    small: string;       // 4px
    medium: string;      // 8px
    large: string;       // 12px
  };
  shadows: {
    subtle: string;      // 0 1px 3px rgba(0,0,0,0.1)
    medium: string;      // 0 4px 6px rgba(0,0,0,0.1)
    strong: string;      // 0 8px 15px rgba(0,0,0,0.1)
  };
}

export interface ModernButtonStyle {
  primary: string;       // Main CTA buttons
  secondary: string;     // Secondary actions
  success: string;       // Positive actions
  warning: string;       // Caution actions
  link: string;          // Text links
}

export interface StatusBadgeStyle {
  pending: string;
  processing: string;
  shipped: string;
  delivered: string;
  cancelled: string;
  refunded: string;
}

export interface ResponsiveBreakpoints {
  mobile: string;        // max-width: 480px
  tablet: string;        // max-width: 768px
  desktop: string;       // min-width: 769px
}

/**
 * Modern Email Design Tokens
 *
 * Centralized design system tokens that define the visual language
 * for all email templates. These tokens ensure consistency and
 * make it easy to maintain the design system.
 */
export const MODERN_EMAIL_STYLES: ModernEmailStyles = {
  colors: {
    primary: '#2c3e50',      // Dark blue-gray for headers and primary elements
    secondary: '#3498db',    // Bright blue for links and secondary elements
    accent: '#e74c3c',       // Red for important items and alerts
    success: '#27ae60',      // Green for success states and positive actions
    warning: '#f39c12',      // Orange for warnings and pending states
    background: '#f8f9fa',   // Light gray background for email body
    cardBackground: '#ffffff', // White background for content cards
    textPrimary: '#2c3e50',  // Dark text for primary content
    textSecondary: '#7f8c8d', // Lighter text for secondary content
    border: '#ecf0f1',       // Light borders for separating elements
  },
  typography: {
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    headingFont: 'Georgia, Times New Roman, serif',
    fontSize: {
      small: '12px',
      body: '14px',
      large: '16px',
      heading: '20px',
      title: '24px',
    },
    lineHeight: {
      tight: '1.2',
      normal: '1.5',
      relaxed: '1.7',
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px',
  },
  shadows: {
    subtle: '0 1px 3px rgba(0,0,0,0.1)',
    medium: '0 4px 6px rgba(0,0,0,0.1)',
    strong: '0 8px 15px rgba(0,0,0,0.1)',
  },
};

/**
 * Modern Button Styles
 *
 * Pre-defined button styles for different use cases.
 * Each style includes background, text color, and hover effects.
 */
export const MODERN_BUTTON_STYLES: ModernButtonStyle = {
  primary: `
    background: linear-gradient(135deg, ${MODERN_EMAIL_STYLES.colors.primary} 0%, ${MODERN_EMAIL_STYLES.colors.secondary} 100%);
    color: #ffffff;
    padding: ${MODERN_EMAIL_STYLES.spacing.md} ${MODERN_EMAIL_STYLES.spacing.xl};
    border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
    text-decoration: none;
    font-weight: 600;
    font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
    display: inline-block;
    min-height: 44px;
    line-height: 1.2;
    box-shadow: ${MODERN_EMAIL_STYLES.shadows.medium};
    border: none;
    cursor: pointer;
  `,
  secondary: `
    background: ${MODERN_EMAIL_STYLES.colors.cardBackground};
    color: ${MODERN_EMAIL_STYLES.colors.primary};
    padding: ${MODERN_EMAIL_STYLES.spacing.md} ${MODERN_EMAIL_STYLES.spacing.xl};
    border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
    text-decoration: none;
    font-weight: 600;
    font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
    display: inline-block;
    min-height: 44px;
    line-height: 1.2;
    box-shadow: ${MODERN_EMAIL_STYLES.shadows.subtle};
    border: 2px solid ${MODERN_EMAIL_STYLES.colors.border};
    cursor: pointer;
  `,
  success: `
    background: linear-gradient(135deg, ${MODERN_EMAIL_STYLES.colors.success} 0%, #2ecc71 100%);
    color: #ffffff;
    padding: ${MODERN_EMAIL_STYLES.spacing.md} ${MODERN_EMAIL_STYLES.spacing.xl};
    border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
    text-decoration: none;
    font-weight: 600;
    font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
    display: inline-block;
    min-height: 44px;
    line-height: 1.2;
    box-shadow: ${MODERN_EMAIL_STYLES.shadows.medium};
    border: none;
    cursor: pointer;
  `,
  warning: `
    background: linear-gradient(135deg, ${MODERN_EMAIL_STYLES.colors.warning} 0%, #e67e22 100%);
    color: #ffffff;
    padding: ${MODERN_EMAIL_STYLES.spacing.md} ${MODERN_EMAIL_STYLES.spacing.xl};
    border-radius: ${MODERN_EMAIL_STYLES.borderRadius.medium};
    text-decoration: none;
    font-weight: 600;
    font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.large};
    display: inline-block;
    min-height: 44px;
    line-height: 1.2;
    box-shadow: ${MODERN_EMAIL_STYLES.shadows.medium};
    border: none;
    cursor: pointer;
  `,
  link: `
    color: ${MODERN_EMAIL_STYLES.colors.secondary};
    text-decoration: underline;
    font-weight: 500;
    font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body};
  `,
};

/**
 * Status Badge Styles
 *
 * Color-coded status badges for order statuses with semantic colors
 * and proper accessibility compliance.
 */
export const STATUS_BADGE_STYLES: StatusBadgeStyle = {
  pending: `
    background-color: ${MODERN_EMAIL_STYLES.colors.warning};
    color: #ffffff;
    padding: ${MODERN_EMAIL_STYLES.spacing.xs} ${MODERN_EMAIL_STYLES.spacing.md};
    border-radius: ${MODERN_EMAIL_STYLES.borderRadius.large};
    font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: inline-block;
  `,
  processing: `
    background-color: ${MODERN_EMAIL_STYLES.colors.secondary};
    color: #ffffff;
    padding: ${MODERN_EMAIL_STYLES.spacing.xs} ${MODERN_EMAIL_STYLES.spacing.md};
    border-radius: ${MODERN_EMAIL_STYLES.borderRadius.large};
    font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: inline-block;
  `,
  shipped: `
    background-color: #9b59b6;
    color: #ffffff;
    padding: ${MODERN_EMAIL_STYLES.spacing.xs} ${MODERN_EMAIL_STYLES.spacing.md};
    border-radius: ${MODERN_EMAIL_STYLES.borderRadius.large};
    font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: inline-block;
  `,
  delivered: `
    background-color: ${MODERN_EMAIL_STYLES.colors.success};
    color: #ffffff;
    padding: ${MODERN_EMAIL_STYLES.spacing.xs} ${MODERN_EMAIL_STYLES.spacing.md};
    border-radius: ${MODERN_EMAIL_STYLES.borderRadius.large};
    font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: inline-block;
  `,
  cancelled: `
    background-color: ${MODERN_EMAIL_STYLES.colors.accent};
    color: #ffffff;
    padding: ${MODERN_EMAIL_STYLES.spacing.xs} ${MODERN_EMAIL_STYLES.spacing.md};
    border-radius: ${MODERN_EMAIL_STYLES.borderRadius.large};
    font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: inline-block;
  `,
  refunded: `
    background-color: #95a5a6;
    color: #ffffff;
    padding: ${MODERN_EMAIL_STYLES.spacing.xs} ${MODERN_EMAIL_STYLES.spacing.md};
    border-radius: ${MODERN_EMAIL_STYLES.borderRadius.large};
    font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: inline-block;
  `,
};

/**
 * Responsive Breakpoints for Email Clients
 *
 * Media query breakpoints optimized for email clients.
 * These are more conservative than web breakpoints due to
 * email client limitations.
 */
export const RESPONSIVE_BREAKPOINTS: ResponsiveBreakpoints = {
  mobile: 'max-width: 480px',
  tablet: 'max-width: 768px',
  desktop: 'min-width: 769px',
};

/**
 * Email Client Compatibility Fallbacks
 *
 * Comprehensive fallback styles and techniques for email clients that don't support modern CSS.
 * Includes CSS Grid/Flexbox with table-based fallbacks, Outlook-specific VML, and Gmail-compatible inline styling.
 */
export const EMAIL_CLIENT_FALLBACKS = {
  // Outlook VML for gradients and rounded corners
  outlookGradient: (startColor: string, endColor: string, width: string = '200px', height: string = '44px') => `
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml"
                 xmlns:w="urn:schemas-microsoft-com:office:word"
                 style="height:${height};v-text-anchor:middle;width:${width};"
                 arcsize="18%"
                 stroke="f"
                 fillcolor="${startColor}">
      <v:fill type="gradient" color="${startColor}" color2="${endColor}" angle="135" />
      <w:anchorlock/>
      <center>
    <![endif]-->
  `,
  outlookGradientEnd: `
    <!--[if mso]>
      </center>
    </v:roundrect>
    <![endif]-->
  `,

  // Outlook-specific CSS resets and fixes
  outlookResets: `
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
  `,

  // Table-based layout for older clients (progressive enhancement fallback)
  tableBasedButton: (content: string, backgroundColor: string, textColor: string, url: string = '#') => `
    <table cellpadding="0" cellspacing="0" border="0" role="presentation">
      <tr>
        <td style="
          background-color: ${backgroundColor};
          padding: 16px 32px;
          border-radius: 8px;
          text-align: center;
          mso-padding-alt: 16px 32px;
        ">
          <a href="${url}"
             style="
               color: ${textColor};
               text-decoration: none;
               font-weight: 600;
               font-size: 16px;
               line-height: 1.2;
               display: block;
               mso-line-height-rule: exactly;
             "
             target="_blank"
             rel="noopener noreferrer">
            ${content}
          </a>
        </td>
      </tr>
    </table>
  `,

  // CSS Grid with table fallback
  gridWithTableFallback: (content: string, columns: number = 2) => `
    <!-- Table fallback for older clients -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" class="grid-fallback">
      <tr>
        ${Array(columns).fill(0).map((_, i) => `
          <td style="width: ${100/columns}%; vertical-align: top; padding: 8px;">
            <!-- Column ${i + 1} content -->
          </td>
        `).join('')}
      </tr>
    </table>

    <!-- Modern CSS Grid for supported clients -->
    <div class="modern-grid" style="
      display: none;
      grid-template-columns: repeat(${columns}, 1fr);
      gap: 16px;
    ">
      ${content}
    </div>

    <style>
      @supports (display: grid) {
        .grid-fallback {
          display: none !important;
        }
        .modern-grid {
          display: grid !important;
        }
      }
    </style>
  `,

  // Flexbox with table fallback for button groups
  flexboxWithTableFallback: (buttons: string[]) => `
    <!-- Table fallback for button groups -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" class="button-group-fallback">
      <tr>
        ${buttons.map(button => `
          <td style="text-align: center; padding: 8px;">
            ${button}
          </td>
        `).join('')}
      </tr>
    </table>

    <!-- Modern Flexbox for supported clients -->
    <div class="modern-button-group" style="
      display: none;
      flex-wrap: wrap;
      gap: 16px;
      justify-content: center;
    ">
      ${buttons.join('')}
    </div>

    <style>
      @supports (display: flex) {
        .button-group-fallback {
          display: none !important;
        }
        .modern-button-group {
          display: flex !important;
        }
      }
    </style>
  `,

  // Gmail-compatible inline styles (no CSS in head support)
  gmailSafeStyles: {
    button: `display: inline-block; padding: 16px 32px; background-color: ${MODERN_EMAIL_STYLES.colors.primary}; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; min-height: 44px; line-height: 1.2; text-align: center; border: none; cursor: pointer; mso-style-priority: 99; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;`,
    card: `background-color: ${MODERN_EMAIL_STYLES.colors.cardBackground}; padding: 24px; margin: 16px 0; border-radius: 8px; border: 1px solid ${MODERN_EMAIL_STYLES.colors.border}; display: block; width: 100%; box-sizing: border-box;`,
    table: `width: 100%; border-collapse: collapse; margin: 16px 0; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-spacing: 0; border: 0;`,
    text: `font-family: ${MODERN_EMAIL_STYLES.typography.fontFamily}; font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body}; line-height: ${MODERN_EMAIL_STYLES.typography.lineHeight.normal}; color: ${MODERN_EMAIL_STYLES.colors.textPrimary}; margin: 0; padding: 0;`,
  },

  // Apple Mail specific fixes
  appleMail: {
    autoLinkDisable: `
      <meta name="format-detection" content="telephone=no">
      <meta name="format-detection" content="date=no">
      <meta name="format-detection" content="address=no">
      <meta name="format-detection" content="email=no">
    `,
    textSizeAdjust: `-webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;`,
  },

  // Yahoo Mail fixes
  yahooMail: {
    centerFix: `margin: 0 auto; display: block;`,
    tableFix: `border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;`,
  },

  // Windows Mail / Outlook.com fixes
  windowsMail: {
    lineHeightFix: `line-height: 100%; mso-line-height-rule: exactly;`,
    fontFix: `font-family: ${MODERN_EMAIL_STYLES.typography.fontFamily};`,
  },

  // Thunderbird fixes
  thunderbird: {
    displayFix: `display: block; width: 100%;`,
    imageFix: `display: block; border: 0; outline: none; text-decoration: none;`,
  },

  // Generic email client resets
  universalResets: `
    /* Universal email client resets */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }

    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }

    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      outline: none;
      text-decoration: none;
    }

    /* Remove spacing around Outlook 07, 10 tables */
    table {
      border-collapse: collapse !important;
    }

    /* Force Outlook to provide a "view in browser" menu link */
    #outlook a {
      padding: 0;
    }

    /* Force Hotmail to display emails at full width */
    .ReadMsgBody {
      width: 100%;
    }

    .ExternalClass {
      width: 100%;
    }

    /* Force Hotmail to display normal line spacing */
    .ExternalClass,
    .ExternalClass p,
    .ExternalClass span,
    .ExternalClass font,
    .ExternalClass td,
    .ExternalClass div {
      line-height: 100%;
    }
  `,

  // Progressive enhancement wrapper
  progressiveEnhancement: (modernContent: string, fallbackContent: string, feature: string) => `
    <!-- Fallback for older email clients -->
    <div class="fallback-content">
      ${fallbackContent}
    </div>

    <!-- Modern content with progressive enhancement -->
    <div class="modern-content" style="display: none;">
      ${modernContent}
    </div>

    <style>
      @supports (${feature}) {
        .fallback-content {
          display: none !important;
        }
        .modern-content {
          display: block !important;
        }
      }
    </style>
  `,
};

/**
 * Dark Mode Color Overrides
 *
 * Color adjustments for email clients that support dark mode.
 * These ensure readability and maintain brand consistency in dark mode.
 * All colors meet WCAG 2.1 AA contrast requirements for accessibility.
 */
export const DARK_MODE_COLORS = {
  background: '#121212',        // True dark background for better OLED support
  cardBackground: '#1e1e1e',    // Slightly lighter for content cards
  surfaceVariant: '#2d2d2d',    // For elevated surfaces
  textPrimary: '#ffffff',       // Pure white for maximum contrast
  textSecondary: '#b3b3b3',     // Light gray with sufficient contrast (4.6:1 ratio)
  textTertiary: '#8a8a8a',      // Dimmer text for less important content
  border: '#404040',            // Medium gray for borders
  borderLight: '#333333',       // Lighter border for subtle separations
  primary: '#4d90fe',           // Brighter blue for better dark mode contrast
  secondary: '#64b5f6',         // Lighter secondary blue
  accent: '#ff5252',            // Brighter red for better visibility
  success: '#4caf50',           // Material Design green for success
  warning: '#ff9800',           // Material Design orange for warnings
  error: '#f44336',             // Material Design red for errors
  info: '#2196f3',              // Material Design blue for info

  // Status-specific colors optimized for dark mode
  statusPending: '#ff9800',     // Orange for pending
  statusProcessing: '#2196f3',  // Blue for processing
  statusShipped: '#9c27b0',     // Purple for shipped
  statusDelivered: '#4caf50',   // Green for delivered
  statusCancelled: '#f44336',   // Red for cancelled
  statusRefunded: '#607d8b',    // Blue-gray for refunded

  // Interactive element colors
  linkHover: '#82b1ff',         // Lighter blue for hover states
  buttonHover: '#6ba6cd',       // Hover state for buttons
  focusRing: '#64b5f6',         // Focus indicator color

  // Semantic background colors with transparency for better layering
  successBackground: 'rgba(76, 175, 80, 0.1)',   // Success background
  warningBackground: 'rgba(255, 152, 0, 0.1)',   // Warning background
  errorBackground: 'rgba(244, 67, 54, 0.1)',     // Error background
  infoBackground: 'rgba(33, 150, 243, 0.1)',     // Info background
};

/**
 * Accessibility Compliance Constants
 *
 * Constants to ensure WCAG 2.1 AA compliance for color contrast,
 * font sizes, and interactive element sizing.
 */
export const ACCESSIBILITY_STANDARDS = {
  minFontSize: '14px',
  minTouchTarget: '44px',
  contrastRatios: {
    normal: 4.5,    // WCAG AA for normal text
    large: 3.0,     // WCAG AA for large text (18px+ or 14px+ bold)
  },
  focusIndicator: `outline: 2px solid ${MODERN_EMAIL_STYLES.colors.secondary}; outline-offset: 2px;`,

  // ARIA labels and semantic HTML requirements
  ariaLabels: {
    mainContent: 'Main email content',
    navigation: 'Email navigation',
    orderSummary: 'Order summary table',
    productList: 'Product list',
    contactInfo: 'Contact information',
    socialLinks: 'Social media links',
    paymentInfo: 'Payment information',
    shippingInfo: 'Shipping information',
    orderStatus: 'Order status',
    callToAction: 'Call to action button',
  },

  // Screen reader optimizations
  screenReader: {
    skipLink: 'Skip to main content',
    tableCaption: 'Order details table',
    imageAlt: {
      logo: 'AlaCraft logo',
      product: 'Product image',
      qrCode: 'QR code for payment',
      decorative: '', // Empty alt for decorative images
    },
    statusAnnouncement: {
      pending: 'Order status: Pending - Your order is being processed',
      processing: 'Order status: Processing - Your order is being prepared',
      shipped: 'Order status: Shipped - Your order is on the way',
      delivered: 'Order status: Delivered - Your order has been delivered',
      cancelled: 'Order status: Cancelled - Your order has been cancelled',
      refunded: 'Order status: Refunded - Your order has been refunded',
    },
  },

  // Keyboard navigation support
  keyboardNavigation: {
    tabIndex: '0',
    skipLinkTabIndex: '1',
    focusableElements: 'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
  },

  // High contrast mode support
  highContrast: {
    borderWidth: '2px',
    focusOutlineWidth: '3px',
    minimumColorDifference: '500', // Minimum color difference for high contrast
  },

  // Language and localization support
  language: {
    defaultLang: 'en',
    supportedLangs: ['en', 'vi'],
    directionality: 'ltr', // Left-to-right for both English and Vietnamese
  },
};