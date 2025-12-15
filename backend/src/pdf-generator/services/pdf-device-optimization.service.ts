import { Injectable, Logger } from '@nestjs/common';
import { PDFStyling, OrderPDFData } from '../types/pdf.types';

/**
 * PDF Device Optimization Service
 *
 * Handles optimization for different devices and viewing scenarios:
 * - Mobile device readability with appropriate scaling
 * - Desktop viewing experience with proper zoom levels
 * - Print-optimized layouts with proper margins and page breaks
 * - Navigation features for multi-page PDFs
 */
@Injectable()
export class PDFDeviceOptimizationService {
  private readonly logger = new Logger(PDFDeviceOptimizationService.name);

  /**
   * Generate mobile-optimized CSS for PDF viewing on small screens
   * @param baseStyling - Base styling configuration
   * @returns CSS string optimized for mobile devices
   */
  generateMobileOptimizedCSS(baseStyling: PDFStyling): string {
    this.logger.log('Generating mobile-optimized CSS');

    return `
      /* Mobile device optimizations */
      @media screen and (max-width: 768px) {
        body {
          font-size: 14px; /* Larger base font for mobile readability */
          line-height: 1.6;
        }

        .pdf-container {
          padding: ${baseStyling.spacing.small}px;
          max-width: 100%;
        }

        .header-container {
          flex-direction: column;
          text-align: center;
          gap: ${baseStyling.spacing.medium}px;
        }

        .document-title {
          text-align: center;
        }

        .document-title h1 {
          font-size: 24px; /* Slightly smaller for mobile */
        }

        .company-logo {
          max-height: 50px;
          max-width: 150px;
        }

        .addresses-section {
          flex-direction: column;
          gap: ${baseStyling.spacing.small}px;
        }

        .shipping-address,
        .billing-address {
          margin-bottom: ${baseStyling.spacing.small}px;
        }

        /* Mobile-friendly table layout */
        .items-table {
          font-size: 12px;
        }

        .items-table th,
        .items-table td {
          padding: ${baseStyling.spacing.small / 2}px;
        }

        .product-info {
          flex-direction: column;
          text-align: center;
          gap: ${baseStyling.spacing.small / 2}px;
        }

        .product-image {
          width: 30px;
          height: 30px;
          align-self: center;
        }

        /* Stack table content vertically on very small screens */
        @media screen and (max-width: 480px) {
          .items-table,
          .items-table thead,
          .items-table tbody,
          .items-table th,
          .items-table td,
          .items-table tr {
            display: block;
          }

          .items-table thead tr {
            position: absolute;
            top: -9999px;
            left: -9999px;
          }

          .items-table tr {
            border: 1px solid ${baseStyling.colors.border};
            margin-bottom: ${baseStyling.spacing.small}px;
            padding: ${baseStyling.spacing.small}px;
            border-radius: 4px;
          }

          .items-table td {
            border: none;
            position: relative;
            padding-left: 50%;
            text-align: left;
          }

          .items-table td:before {
            content: attr(data-label) ": ";
            position: absolute;
            left: 6px;
            width: 45%;
            padding-right: 10px;
            white-space: nowrap;
            font-weight: bold;
          }
        }

        .summary-table {
          max-width: 100%;
          margin: 0;
        }

        .qr-code {
          max-width: 120px;
          max-height: 120px;
        }

        .footer-content {
          text-align: center;
        }

        .business-info {
          text-align: center;
        }
      }
    `;
  }

  /**
   * Generate desktop-optimized CSS for PDF viewing on larger screens
   * @param baseStyling - Base styling configuration
   * @returns CSS string optimized for desktop viewing
   */
  generateDesktopOptimizedCSS(baseStyling: PDFStyling): string {
    this.logger.log('Generating desktop-optimized CSS');

    return `
      /* Desktop optimizations */
      @media screen and (min-width: 1024px) {
        .pdf-container {
          max-width: 800px;
          margin: 0 auto;
          padding: ${baseStyling.spacing.large}px;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
          background: white;
        }

        .header-container {
          margin-bottom: ${baseStyling.spacing.large * 1.5}px;
        }

        .document-title h1 {
          font-size: 32px; /* Larger for desktop viewing */
        }

        .company-logo {
          max-height: 80px;
          max-width: 250px;
        }

        /* Enhanced spacing for desktop */
        .order-info-section,
        .items-section,
        .order-summary,
        .payment-info,
        .shipping-info {
          margin-bottom: ${baseStyling.spacing.large * 1.5}px;
        }

        /* Better table layout for desktop */
        .items-table {
          font-size: 13px;
        }

        .items-table th,
        .items-table td {
          padding: ${baseStyling.spacing.medium}px;
        }

        .product-image {
          width: 50px;
          height: 50px;
        }

        /* Enhanced QR code display */
        .qr-code {
          max-width: 180px;
          max-height: 180px;
        }

        /* Desktop navigation aids */
        .section-anchor {
          position: relative;
        }

        .section-anchor:before {
          content: '';
          position: absolute;
          top: -${baseStyling.spacing.large}px;
          height: ${baseStyling.spacing.large}px;
          width: 1px;
        }
      }

      /* High-resolution display optimizations */
      @media screen and (min-resolution: 192dpi) {
        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .company-logo,
        .product-image,
        .qr-code {
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
        }
      }
    `;
  }

  /**
   * Generate print-optimized CSS with proper margins and page breaks
   * @param baseStyling - Base styling configuration
   * @returns CSS string optimized for printing
   */
  generatePrintOptimizedCSS(baseStyling: PDFStyling): string {
    this.logger.log('Generating print-optimized CSS');

    return `
      /* Print optimizations */
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        @page {
          size: A4;
          margin: 20mm 15mm 20mm 15mm;

          @top-center {
            content: "";
          }

          @bottom-center {
            content: counter(page) " / " counter(pages);
            font-size: 10px;
            color: #666;
          }
        }

        body {
          font-size: 11pt;
          line-height: 1.4;
          color: black !important;
          background: white !important;
        }

        .pdf-container {
          padding: 0;
          margin: 0;
          box-shadow: none;
          max-width: none;
        }

        /* Ensure proper page breaks */
        .header-container {
          page-break-inside: avoid;
          page-break-after: avoid;
        }

        .order-info-section {
          page-break-inside: avoid;
        }

        .items-section {
          page-break-inside: avoid;
        }

        .items-table {
          page-break-inside: auto;
        }

        .items-table thead {
          display: table-header-group;
        }

        .items-table tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }

        .items-table th {
          background-color: ${baseStyling.colors.primary} !important;
          color: white !important;
        }

        .order-summary {
          page-break-inside: avoid;
          page-break-before: avoid;
        }

        .payment-info,
        .shipping-info {
          page-break-inside: avoid;
        }

        .pdf-footer {
          page-break-inside: avoid;
        }

        /* Hide screen-only elements */
        .skip-nav {
          display: none !important;
        }

        /* Ensure images print properly */
        .company-logo,
        .product-image,
        .qr-code {
          max-width: 100%;
          height: auto;
        }

        .company-logo {
          max-height: 60px;
        }

        .product-image {
          max-width: 40px;
          max-height: 40px;
        }

        .qr-code {
          max-width: 120px;
          max-height: 120px;
        }

        /* Ensure proper contrast for printing */
        .items-table td,
        .items-table th {
          border: 1px solid black !important;
        }

        .summary-table td {
          border-bottom: 1px solid black !important;
        }

        .total-row {
          border-top: 2px solid black !important;
        }

        .payment-info,
        .shipping-info,
        .shipping-address,
        .billing-address {
          border: 1px solid black !important;
        }

        .pdf-footer {
          border-top: 1px solid black !important;
        }

        .footer-note {
          border-top: 1px solid black !important;
        }

        /* Optimize text for print */
        .small-text {
          font-size: 9pt !important;
        }

        h1 {
          font-size: 18pt !important;
        }

        h2 {
          font-size: 14pt !important;
        }

        h3 {
          font-size: 12pt !important;
        }

        /* Avoid orphans and widows */
        p {
          orphans: 3;
          widows: 3;
        }

        h1, h2, h3, h4 {
          page-break-after: avoid;
          orphans: 4;
          widows: 4;
        }
      }
    `;
  }

  /**
   * Generate navigation features for multi-page PDFs
   * @param orderData - Order data for context
   * @param locale - Language locale
   * @returns HTML string with navigation elements
   */
  generateNavigationFeatures(orderData: OrderPDFData, locale: 'en' | 'vi'): string {
    const isVietnamese = locale === 'vi';

    return `
      <!-- PDF Navigation Features -->
      <nav class="pdf-navigation" role="navigation" aria-label="${isVietnamese ? 'Điều hướng tài liệu' : 'Document navigation'}">
        <div class="nav-links">
          <a href="#customer-info" class="nav-link">${isVietnamese ? 'Thông tin khách hàng' : 'Customer Info'}</a>
          <a href="#order-items" class="nav-link">${isVietnamese ? 'Sản phẩm' : 'Items'}</a>
          <a href="#order-summary" class="nav-link">${isVietnamese ? 'Tóm tắt' : 'Summary'}</a>
          <a href="#payment-info" class="nav-link">${isVietnamese ? 'Thanh toán' : 'Payment'}</a>
          <a href="#shipping-info" class="nav-link">${isVietnamese ? 'Giao hàng' : 'Shipping'}</a>
        </div>
      </nav>

      <style>
        .pdf-navigation {
          position: sticky;
          top: 0;
          background: rgba(255, 255, 255, 0.95);
          padding: ${orderData.locale === 'vi' ? '8px' : '10px'};
          border-bottom: 1px solid #ddd;
          margin-bottom: 20px;
          z-index: 100;
        }

        .nav-links {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          justify-content: center;
        }

        .nav-link {
          color: #2c3e50;
          text-decoration: none;
          padding: 5px 10px;
          border-radius: 3px;
          font-size: 12px;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .nav-link:hover,
        .nav-link:focus {
          background-color: #ecf0f1;
          text-decoration: underline;
        }

        /* Hide navigation in print */
        @media print {
          .pdf-navigation {
            display: none !important;
          }
        }

        /* Mobile navigation adjustments */
        @media screen and (max-width: 768px) {
          .pdf-navigation {
            position: relative;
          }

          .nav-links {
            flex-direction: column;
            align-items: center;
            gap: 8px;
          }

          .nav-link {
            padding: 8px 15px;
            font-size: 14px;
          }
        }
      </style>
    `;
  }

  /**
   * Add section anchors for navigation
   * @param content - HTML content to enhance
   * @returns HTML with navigation anchors
   */
  addNavigationAnchors(content: string): string {
    this.logger.log('Adding navigation anchors to PDF content');

    // Add anchors to major sections
    const anchors = [
      { id: 'customer-info', pattern: /<div class="customer-info">/ },
      { id: 'order-items', pattern: /<div class="items-section">/ },
      { id: 'order-summary', pattern: /<div class="order-summary">/ },
      { id: 'payment-info', pattern: /<div class="payment-info">/ },
      { id: 'shipping-info', pattern: /<div class="shipping-info">/ }
    ];

    anchors.forEach(anchor => {
      content = content.replace(
        anchor.pattern,
        `<div class="section-anchor" id="${anchor.id}">$&`
      );
    });

    return content;
  }

  /**
   * Generate responsive viewport meta tag for mobile optimization
   * @returns HTML meta tag string
   */
  generateResponsiveViewport(): string {
    return `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">`;
  }

  /**
   * Generate device-specific PDF options for Puppeteer
   * @param deviceType - Target device type
   * @returns Puppeteer PDF options optimized for device
   */
  getDeviceOptimizedPDFOptions(deviceType: 'mobile' | 'desktop' | 'print' = 'print'): any {
    const baseOptions = {
      format: 'A4' as const,
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="font-size: 10px; width: 100%; text-align: center; color: #666;" role="contentinfo" aria-label="Page information">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      `,
      tagged: true, // Enable tagged PDF for accessibility
    };

    switch (deviceType) {
      case 'mobile':
        return {
          ...baseOptions,
          format: 'A4',
          margin: {
            top: '15mm',
            right: '10mm',
            bottom: '15mm',
            left: '10mm',
          },
          // Optimize for mobile viewing
          preferCSSPageSize: true,
        };

      case 'desktop':
        return {
          ...baseOptions,
          format: 'A4',
          margin: {
            top: '25mm',
            right: '20mm',
            bottom: '25mm',
            left: '20mm',
          },
          // Optimize for desktop viewing with more generous margins
          preferCSSPageSize: true,
        };

      case 'print':
      default:
        return {
          ...baseOptions,
          // Standard print optimization
          preferCSSPageSize: false,
        };
    }
  }

  /**
   * Generate complete device optimization CSS
   * @param baseStyling - Base styling configuration
   * @returns Complete CSS string with all device optimizations
   */
  generateCompleteDeviceCSS(baseStyling: PDFStyling): string {
    const mobileCSS = this.generateMobileOptimizedCSS(baseStyling);
    const desktopCSS = this.generateDesktopOptimizedCSS(baseStyling);
    const printCSS = this.generatePrintOptimizedCSS(baseStyling);

    return `
      /* Base responsive styles */
      html {
        box-sizing: border-box;
      }

      *, *:before, *:after {
        box-sizing: inherit;
      }

      img {
        max-width: 100%;
        height: auto;
      }

      table {
        width: 100%;
        table-layout: fixed;
      }

      ${mobileCSS}
      ${desktopCSS}
      ${printCSS}
    `;
  }
}