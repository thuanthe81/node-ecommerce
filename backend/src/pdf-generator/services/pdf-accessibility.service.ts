import { Injectable, Logger } from '@nestjs/common';
import { PDFStyling, OrderPDFData } from '../types/pdf.types';
import { CONSTANTS } from '@alacraft/shared';

/**
 * PDF Accessibility Service
 *
 * Handles accessibility features for PDF documents including:
 * - Proper text structure and heading hierarchy
 * - Accessibility tags and metadata for screen readers
 * - High contrast color options
 * - Alternative text for images and visual elements
 */
@Injectable()
export class PDFAccessibilityService {
  private readonly logger = new Logger(PDFAccessibilityService.name);

  /**
   * Generate accessibility-compliant HTML structure with proper semantic tags
   * @param content - Original HTML content
   * @param locale - Language locale for accessibility attributes
   * @returns HTML with accessibility enhancements
   */
  enhanceHTMLAccessibility(content: string, locale: 'en' | 'vi'): string {
    this.logger.log(`Enhancing HTML accessibility for locale ${locale}`);

    // Add semantic structure and ARIA attributes
    let accessibleContent = content;

    // Add language attribute to html tag
    accessibleContent = accessibleContent.replace(
      /<html[^>]*>/,
      `<html lang="${locale}" xml:lang="${locale}">`
    );

    // Add document structure roles and landmarks
    accessibleContent = accessibleContent.replace(
      /<header[^>]*>/,
      '<header role="banner" aria-label="Document header">'
    );

    accessibleContent = accessibleContent.replace(
      /<main[^>]*>/,
      '<main role="main" aria-label="Order details">'
    );

    accessibleContent = accessibleContent.replace(
      /<footer[^>]*>/,
      '<footer role="contentinfo" aria-label="Business information">'
    );

    // Enhance table accessibility
    accessibleContent = this.enhanceTableAccessibility(accessibleContent, locale);

    // Add skip navigation for screen readers
    accessibleContent = this.addSkipNavigation(accessibleContent, locale);

    // Enhance heading hierarchy
    accessibleContent = this.enhanceHeadingHierarchy(accessibleContent);

    return accessibleContent;
  }

  /**
   * Generate high contrast color scheme for accessibility
   * @param baseStyling - Base styling configuration
   * @returns High contrast styling configuration
   */
  generateHighContrastStyling(baseStyling: PDFStyling): PDFStyling {
    this.logger.log('Generating high contrast styling for accessibility');

    return {
      ...baseStyling,
      colors: {
        primary: '#000000',        // Pure black for maximum contrast
        secondary: '#000000',      // Pure black for consistency
        text: '#000000',           // Pure black text
        background: '#ffffff',     // Pure white background
        border: '#000000',         // Black borders for definition
      },
    };
  }

  /**
   * Generate accessible font configuration with readable sizes
   * @param baseStyling - Base styling configuration
   * @returns Styling with accessible font sizes
   */
  generateAccessibleFonts(baseStyling: PDFStyling): PDFStyling {
    this.logger.log('Generating accessible font configuration');

    return {
      ...baseStyling,
      fonts: {
        primary: 'Arial, Helvetica, sans-serif',     // High readability sans-serif
        heading: 'Arial, Helvetica, sans-serif',     // Consistent heading font
        monospace: 'Courier New, Courier, monospace', // Accessible monospace
      },
    };
  }

  /**
   * Add alternative text for all images in the PDF content
   * @param content - HTML content with images
   * @param orderData - Order data for context-aware alt text
   * @param locale - Language locale for alt text
   * @returns HTML with enhanced alt text
   */
  enhanceImageAltText(content: string, orderData: OrderPDFData, locale: 'en' | 'vi'): string {
    this.logger.log(`Enhancing image alt text for locale ${locale}`);

    // Enhance company logo alt text
    const companyName = orderData.businessInfo?.companyName || CONSTANTS.BUSINESS.COMPANY.NAME[locale.toUpperCase() as 'EN' | 'VI'];
    content = content.replace(
      /(<img[^>]*class="company-logo"[^>]*alt=")[^"]*(")/g,
      `$1${this.getCompanyLogoAltText(companyName, locale)}$2`
    );

    // Enhance product image alt text
    orderData.items.forEach(item => {
      if (item.imageUrl && typeof item.imageUrl === 'string') {
        const productAltText = this.getProductImageAltText(item, locale);
        const imageRegex = new RegExp(
          `(<img[^>]*src="${item.imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*alt=")[^"]*(")`
        );
        content = content.replace(imageRegex, `$1${productAltText}$2`);
      }
    });

    // Enhance QR code alt text
    if (orderData.paymentMethod.qrCodeUrl) {
      const qrAltText = this.getQRCodeAltText(orderData.paymentMethod, locale);
      content = content.replace(
        /(<img[^>]*class="qr-code"[^>]*alt=")[^"]*(")/g,
        `$1${qrAltText}$2`
      );
    }

    return content;
  }

  /**
   * Add accessibility metadata to PDF document
   * @param orderData - Order data for context
   * @param locale - Language locale
   * @returns Accessibility metadata object
   */
  generateAccessibilityMetadata(orderData: OrderPDFData, locale: 'en' | 'vi'): Record<string, any> {
    const isVietnamese = locale === 'vi';
    const companyName = orderData.businessInfo?.companyName || CONSTANTS.BUSINESS.COMPANY.NAME[locale.toUpperCase() as 'EN' | 'VI'];

    return {
      // PDF/UA compliance metadata
      'pdfuaid:part': '1',
      'pdfuaid:conformance': 'A',

      // Document structure metadata
      'dc:title': isVietnamese
        ? `Đơn hàng ${orderData.orderNumber} - ${companyName}`
        : `Order ${orderData.orderNumber} - ${companyName}`,

      'dc:description': isVietnamese
        ? `Chi tiết đơn hàng số ${orderData.orderNumber} bao gồm thông tin khách hàng, sản phẩm, thanh toán và giao hàng`
        : `Order details for order number ${orderData.orderNumber} including customer information, products, payment and shipping details`,

      'dc:language': locale,
      'dc:creator': companyName,
      'dc:subject': isVietnamese ? 'Xác nhận đơn hàng' : 'Order confirmation',

      // Accessibility metadata
      'accessibility:accessMode': 'textual, visual',
      'accessibility:accessModeSufficient': 'textual',
      'accessibility:accessibilityFeature': [
        'structuralNavigation',
        'alternativeText',
        'readingOrder',
        'tableHeaders'
      ],
      'accessibility:accessibilityHazard': 'none',
      'accessibility:accessibilitySummary': isVietnamese
        ? 'Tài liệu có cấu trúc rõ ràng với tiêu đề phân cấp, văn bản thay thế cho hình ảnh và bảng có tiêu đề phù hợp'
        : 'Document has clear structure with hierarchical headings, alternative text for images, and properly labeled tables'
    };
  }

  /**
   * Generate CSS for accessibility enhancements
   * @param styling - Base styling configuration
   * @returns CSS string with accessibility enhancements
   */
  generateAccessibilityCSS(styling: PDFStyling): string {
    return `
      /* Accessibility enhancements */

      /* Skip navigation for screen readers */
      .skip-nav {
        position: absolute;
        top: -40px;
        left: 6px;
        background: ${styling.colors.primary};
        color: ${styling.colors.background};
        padding: 8px;
        text-decoration: none;
        border-radius: 3px;
        font-size: 14px;
        font-weight: bold;
        z-index: 1000;
      }

      .skip-nav:focus {
        top: 6px;
      }

      /* Enhanced focus indicators */
      *:focus {
        outline: 3px solid ${styling.colors.primary};
        outline-offset: 2px;
      }

      /* High contrast mode support */
      @media (prefers-contrast: high) {
        body {
          background-color: white;
          color: black;
        }

        .header-container {
          border-bottom-color: black;
        }

        .items-table th {
          background-color: black;
          color: white;
        }

        .items-table td,
        .items-table th {
          border-color: black;
        }

        .summary-table td {
          border-bottom-color: black;
        }

        .total-row {
          border-top-color: black;
        }

        .payment-info,
        .shipping-info,
        .shipping-address,
        .billing-address {
          border-color: black;
        }

        .pdf-footer {
          border-top-color: black;
        }

        .footer-note {
          border-top-color: black;
        }
      }

      /* Improved readability */
      body {
        line-height: 1.6; /* Increased line height for better readability */
      }

      /* Ensure minimum font sizes for accessibility */
      .small-text {
        font-size: 11px !important; /* Minimum readable size */
      }

      /* Enhanced table accessibility */
      .items-table {
        border-collapse: separate;
        border-spacing: 0;
      }

      .items-table caption {
        font-weight: bold;
        text-align: left;
        margin-bottom: 8px;
        font-size: 16px;
      }

      .items-table th {
        font-weight: bold;
        text-align: left;
      }

      .items-table th[scope="col"] {
        background-color: ${styling.colors.primary};
        color: ${styling.colors.background};
      }

      /* Screen reader only content */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      /* Print accessibility */
      @media print {
        .skip-nav {
          display: none;
        }

        /* Ensure sufficient contrast in print */
        body {
          color: black;
          background: white;
        }

        .items-table th {
          background-color: black !important;
          color: white !important;
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }
      }
    `;
  }

  /**
   * Enhance table accessibility with proper headers and captions
   */
  private enhanceTableAccessibility(content: string, locale: 'en' | 'vi'): string {
    const isVietnamese = locale === 'vi';

    // Add table caption for order items table
    content = content.replace(
      /<table class="items-table">/,
      `<table class="items-table" role="table" aria-label="${isVietnamese ? 'Danh sách sản phẩm trong đơn hàng' : 'Order items list'}">
        <caption class="sr-only">${isVietnamese ? 'Bảng chi tiết các sản phẩm trong đơn hàng' : 'Detailed table of products in the order'}</caption>`
    );

    // Add scope attributes to table headers
    content = content.replace(
      /<th>/g,
      '<th scope="col">'
    );

    // Add table caption for summary table
    content = content.replace(
      /<table class="summary-table">/,
      `<table class="summary-table" role="table" aria-label="${isVietnamese ? 'Tóm tắt đơn hàng' : 'Order summary'}">
        <caption class="sr-only">${isVietnamese ? 'Bảng tóm tắt chi phí đơn hàng' : 'Order cost summary table'}</caption>`
    );

    return content;
  }

  /**
   * Add skip navigation for screen readers
   */
  private addSkipNavigation(content: string, locale: 'en' | 'vi'): string {
    const isVietnamese = locale === 'vi';
    const skipText = isVietnamese ? 'Bỏ qua đến nội dung chính' : 'Skip to main content';

    const skipNav = `
      <a href="#main-content" class="skip-nav">${skipText}</a>
    `;

    // Add skip navigation after body tag
    content = content.replace(
      /<body[^>]*>/,
      `$&${skipNav}`
    );

    // Add id to main content
    content = content.replace(
      /<main[^>]*>/,
      '<main role="main" id="main-content" aria-label="Order details">'
    );

    return content;
  }

  /**
   * Enhance heading hierarchy for proper document structure
   */
  private enhanceHeadingHierarchy(content: string): string {
    // Ensure proper heading hierarchy (h1 -> h2 -> h3 -> h4)
    // The document title should be h1, section titles h2, subsection titles h3, etc.

    // Main document title should be h1
    content = content.replace(
      /<h1[^>]*class="company-name"[^>]*>/,
      '<h1 class="company-name" role="heading" aria-level="1">'
    );

    // Order confirmation title should be h1
    content = content.replace(
      /<h1>([^<]*(?:Order|Invoice|Đơn hàng|Hóa đơn)[^<]*)<\/h1>/,
      '<h1 role="heading" aria-level="1">$1</h1>'
    );

    // Section headings should be h2
    content = content.replace(
      /<h3>/g,
      '<h2 role="heading" aria-level="2">'
    );

    content = content.replace(
      /<\/h3>/g,
      '</h2>'
    );

    // Subsection headings should be h3
    content = content.replace(
      /<h4>/g,
      '<h3 role="heading" aria-level="3">'
    );

    content = content.replace(
      /<\/h4>/g,
      '</h3>'
    );

    return content;
  }

  /**
   * Generate company logo alt text
   */
  private getCompanyLogoAltText(companyName: string, locale: 'en' | 'vi'): string {
    const isVietnamese = locale === 'vi';
    return isVietnamese
      ? `Logo của ${companyName}`
      : `${companyName} logo`;
  }

  /**
   * Generate product image alt text
   */
  private getProductImageAltText(item: any, locale: 'en' | 'vi'): string {
    const isVietnamese = locale === 'vi';
    const baseText = isVietnamese
      ? `Hình ảnh sản phẩm ${item.name}`
      : `Product image of ${item.name}`;

    if (item.description) {
      return isVietnamese
        ? `${baseText}, ${item.description}`
        : `${baseText}, ${item.description}`;
    }

    return baseText;
  }

  /**
   * Generate QR code alt text
   */
  private getQRCodeAltText(paymentMethod: any, locale: 'en' | 'vi'): string {
    const isVietnamese = locale === 'vi';
    return isVietnamese
      ? `Mã QR thanh toán cho ${paymentMethod.displayName}`
      : `Payment QR code for ${paymentMethod.displayName}`;
  }
}