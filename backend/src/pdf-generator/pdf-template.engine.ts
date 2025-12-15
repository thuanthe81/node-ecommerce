import { Injectable, Logger } from '@nestjs/common';
import {
  PDFTemplate,
  PDFSection,
  PDFStyling,
  PDFMetadata,
  OrderPDFData,
  ValidationResult
} from './types/pdf.types';
import { PDFDocumentStructureService } from './pdf-document-structure.service';
import { PDFLocalizationService } from './services/pdf-localization.service';
import { PDFAccessibilityService } from './services/pdf-accessibility.service';
import { PDFDeviceOptimizationService } from './services/pdf-device-optimization.service';

@Injectable()
export class PDFTemplateEngine {
  private readonly logger = new Logger(PDFTemplateEngine.name);

  constructor(
    private documentStructure: PDFDocumentStructureService,
    private localization: PDFLocalizationService,
    private accessibilityService: PDFAccessibilityService,
    private deviceOptimization: PDFDeviceOptimizationService
  ) {}

  /**
   * Create order confirmation PDF template
   * @param data - Order data for template generation
   * @param locale - Language locale for the template
   * @returns Complete PDF template with styling and content
   */
  createOrderTemplate(data: OrderPDFData, locale: 'en' | 'vi' = 'en'): PDFTemplate {
    this.logger.log(`Creating order template for order ${data.orderNumber} in locale ${locale}`);

    const styling = this.getDefaultStyling();
    const metadata = this.createMetadata(data, locale);

    const template: PDFTemplate = {
      header: this.createHeaderSection(data, locale),
      content: this.createContentSections(data, locale),
      footer: this.createFooterSection(data, locale),
      styling,
      metadata,
    };

    return this.applyBranding(template);
  }

  /**
   * Create invoice PDF template (for completed orders)
   * @param data - Order data for invoice generation
   * @param locale - Language locale for the template
   * @returns Complete PDF template formatted as invoice
   */
  createInvoiceTemplate(data: OrderPDFData, locale: 'en' | 'vi' = 'en'): PDFTemplate {
    this.logger.log(`Creating invoice template for order ${data.orderNumber} in locale ${locale}`);

    const orderTemplate = this.createOrderTemplate(data, locale);

    // Modify template for invoice format
    orderTemplate.metadata.title = locale === 'vi' ? `Hóa đơn ${data.orderNumber}` : `Invoice ${data.orderNumber}`;
    orderTemplate.metadata.subject = locale === 'vi' ? 'Hóa đơn đơn hàng' : 'Order Invoice';

    // Update header for invoice
    orderTemplate.header.content = this.generateInvoiceHeaderHTML(data, locale);

    return orderTemplate;
  }

  /**
   * Apply branding elements to the template
   * @param template - Base template to apply branding to
   * @returns Template with branding applied
   */
  applyBranding(template: PDFTemplate): PDFTemplate {
    // Apply AlaCraft branding colors and styling
    template.styling.colors = {
      ...template.styling.colors,
      primary: '#2c3e50',      // Dark blue-gray for headers
      secondary: '#3498db',    // Blue for accents
      text: '#2c3e50',         // Dark text for readability
      background: '#ffffff',   // White background
      border: '#bdc3c7',       // Light gray for borders
    };

    // Apply professional fonts
    template.styling.fonts = {
      primary: 'Arial, sans-serif',
      heading: 'Arial, sans-serif',
      monospace: 'Courier New, monospace',
    };

    return template;
  }

  /**
   * Validate template structure and content
   * @param template - Template to validate
   * @returns Validation result with any errors
   */
  validateTemplate(template: PDFTemplate): ValidationResult {
    const errors: string[] = [];

    if (!template.header || !template.header.content) {
      errors.push('Template header is required');
    }

    if (!template.content || template.content.length === 0) {
      errors.push('Template content sections are required');
    }

    if (!template.footer || !template.footer.content) {
      errors.push('Template footer is required');
    }

    if (!template.styling) {
      errors.push('Template styling is required');
    }

    if (!template.metadata) {
      errors.push('Template metadata is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate complete HTML from template
   * @param template - PDF template to convert to HTML
   * @returns Complete HTML string ready for PDF generation
   */
  generateHTML(template: PDFTemplate): string {
    // For backward compatibility, use the original template-based approach
    const { styling } = template;

    return `
      <!DOCTYPE html>
      <html lang="${template.metadata.keywords.includes('vietnamese') ? 'vi' : 'en'}">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${template.metadata.title}</title>
          <style>
            ${this.generateCSS(styling)}
          </style>
        </head>
        <body>
          <div class="pdf-container">
            <header class="pdf-header">
              ${template.header.content}
            </header>

            <main class="pdf-content">
              ${template.content.map(section => section.content).join('\n')}
            </main>

            <footer class="pdf-footer">
              ${template.footer.content}
            </footer>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate complete HTML from order data directly using document structure service
   * @param orderData - Order data for document generation
   * @param locale - Language locale
   * @returns Complete HTML string ready for PDF generation
   */
  generateHTMLFromOrderData(orderData: OrderPDFData, locale: 'en' | 'vi'): string {
    const styling = this.getDefaultStyling();
    return this.documentStructure.generateDocumentStructure(orderData, locale, styling);
  }

  /**
   * Create header section for order template
   */
  private createHeaderSection(data: OrderPDFData, locale: 'en' | 'vi'): PDFSection {
    return {
      type: 'header',
      content: this.generateOrderHeaderHTML(data, locale),
    };
  }

  /**
   * Create content sections for order template
   */
  private createContentSections(data: OrderPDFData, locale: 'en' | 'vi'): PDFSection[] {
    return [
      {
        type: 'content',
        content: this.generateOrderInfoHTML(data, locale),
      },
      {
        type: 'table',
        content: this.generateOrderItemsTableHTML(data, locale),
      },
      {
        type: 'content',
        content: this.generateOrderSummaryHTML(data, locale),
      },
      {
        type: 'content',
        content: this.generatePaymentInfoHTML(data, locale),
      },
      {
        type: 'content',
        content: this.generateShippingInfoHTML(data, locale),
      },
    ];
  }

  /**
   * Create footer section for order template
   */
  private createFooterSection(data: OrderPDFData, locale: 'en' | 'vi'): PDFSection {
    return {
      type: 'footer',
      content: this.generateFooterHTML(data, locale),
    };
  }

  /**
   * Generate order header HTML
   */
  private generateOrderHeaderHTML(data: OrderPDFData, locale: 'en' | 'vi'): string {
    const formattedDate = this.localization.formatDate(data.orderDate, locale);

    return `
      <div class="header-container">
        <div class="logo-section">
          ${data.businessInfo.logoUrl ?
            `<img src="${data.businessInfo.logoUrl}" alt="${data.businessInfo.companyName}" class="company-logo">` :
            `<h1 class="company-name">${data.businessInfo.companyName}</h1>`
          }
        </div>
        <div class="document-title">
          <h1>${this.localization.translate('orderConfirmation', locale)}</h1>
          <p class="order-number">${this.localization.translate('orderNumber', locale)}: <strong>${data.orderNumber}</strong></p>
          <p class="order-date">${this.localization.translate('orderDate', locale)}: <strong>${formattedDate}</strong></p>
        </div>
      </div>
    `;
  }

  /**
   * Generate invoice header HTML
   */
  private generateInvoiceHeaderHTML(data: OrderPDFData, locale: 'en' | 'vi'): string {
    const formattedDate = this.localization.formatDate(data.orderDate, locale);

    return `
      <div class="header-container">
        <div class="logo-section">
          ${data.businessInfo.logoUrl ?
            `<img src="${data.businessInfo.logoUrl}" alt="${data.businessInfo.companyName}" class="company-logo">` :
            `<h1 class="company-name">${data.businessInfo.companyName}</h1>`
          }
        </div>
        <div class="document-title">
          <h1>${this.localization.translate('invoice', locale)}</h1>
          <p class="order-number">${this.localization.translate('invoiceNumber', locale)}: <strong>${data.orderNumber}</strong></p>
          <p class="order-date">${this.localization.translate('issueDate', locale)}: <strong>${formattedDate}</strong></p>
        </div>
      </div>
    `;
  }

  /**
   * Generate order information HTML
   */
  private generateOrderInfoHTML(data: OrderPDFData, locale: 'en' | 'vi'): string {
    const formattedShippingAddress = this.localization.formatAddress(data.shippingAddress, locale);
    const formattedBillingAddress = this.localization.formatAddress(data.billingAddress, locale);
    const formattedPhone = data.customerInfo.phone ? this.localization.formatPhoneNumber(data.customerInfo.phone, locale) : '';

    return `
      <div class="order-info-section">
        <div class="customer-info">
          <h3>${this.localization.translate('customerInformation', locale)}</h3>
          <p><strong>${this.localization.translate('name', locale)}:</strong> ${data.customerInfo.name}</p>
          <p><strong>${this.localization.translate('email', locale)}:</strong> ${data.customerInfo.email}</p>
          ${formattedPhone ? `<p><strong>${this.localization.translate('phone', locale)}:</strong> ${formattedPhone}</p>` : ''}
        </div>

        <div class="addresses-section">
          <div class="shipping-address">
            <h4>${this.localization.translate('shippingAddress', locale)}</h4>
            <div class="address-content">
              ${formattedShippingAddress.split('\n').map(line => `<p>${line}</p>`).join('')}
            </div>
          </div>

          <div class="billing-address">
            <h4>${this.localization.translate('billingAddress', locale)}</h4>
            <div class="address-content">
              ${formattedBillingAddress.split('\n').map(line => `<p>${line}</p>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate order items table HTML
   */
  private generateOrderItemsTableHTML(data: OrderPDFData, locale: 'en' | 'vi'): string {
    const isVietnamese = locale === 'vi';

    return `
      <div class="items-section">
        <h3>${this.localization.translate('orderItems', locale)}</h3>
        <table class="items-table">
          <thead>
            <tr>
              <th>${this.localization.translate('product', locale)}</th>
              <th>${this.localization.translate('sku', locale)}</th>
              <th>${this.localization.translate('quantity', locale)}</th>
              <th>${this.localization.translate('unitPrice', locale)}</th>
              <th>${this.localization.translate('total', locale)}</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map(item => `
              <tr>
                <td>
                  <div class="product-info">
                    ${item.imageUrl && typeof item.imageUrl === 'string' ? `<img src="${item.imageUrl}" alt="${item.name}" class="product-image">` : ''}
                    <div class="product-details">
                      <strong>${item.name}</strong>
                      ${item.description ? `<br><small>${item.description}</small>` : ''}
                    </div>
                  </div>
                </td>
                <td>${item.sku || '-'}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">${this.localization.formatCurrency(item.unitPrice, locale)}</td>
                <td class="text-right"><strong>${this.localization.formatCurrency(item.totalPrice, locale)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Generate order summary HTML
   */
  private generateOrderSummaryHTML(data: OrderPDFData, locale: 'en' | 'vi'): string {
    const isVietnamese = locale === 'vi';

    return `
      <div class="order-summary">
        <h3>${this.localization.translate('orderSummary', locale)}</h3>
        <table class="summary-table">
          <tr>
            <td>${this.localization.translate('subtotal', locale)}:</td>
            <td class="text-right">$${data.pricing.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td>${this.localization.translate('shipping', locale)}:</td>
            <td class="text-right">$${data.pricing.shippingCost.toFixed(2)}</td>
          </tr>
          ${data.pricing.taxAmount ? `
            <tr>
              <td>${isVietnamese ? 'Thuế' : 'Tax'}:</td>
              <td class="text-right">$${data.pricing.taxAmount.toFixed(2)}</td>
            </tr>
          ` : ''}
          ${data.pricing.discountAmount ? `
            <tr>
              <td>${isVietnamese ? 'Giảm giá' : 'Discount'}:</td>
              <td class="text-right">-$${data.pricing.discountAmount.toFixed(2)}</td>
            </tr>
          ` : ''}
          <tr class="total-row">
            <td><strong>${isVietnamese ? 'Tổng cộng' : 'Total'}:</strong></td>
            <td class="text-right"><strong>$${data.pricing.total.toFixed(2)}</strong></td>
          </tr>
        </table>
      </div>
    `;
  }

  /**
   * Generate payment information HTML
   */
  private generatePaymentInfoHTML(data: OrderPDFData, locale: 'en' | 'vi'): string {
    return `
      <div class="payment-info">
        <h3>${this.localization.translate('paymentInformation', locale)}</h3>
        <p><strong>${this.localization.translate('paymentMethod', locale)}:</strong> ${data.paymentMethod.displayName}</p>
        <p><strong>${this.localization.translate('paymentStatus', locale)}:</strong> ${this.localization.getPaymentStatusText(data.paymentMethod.status, locale)}</p>
        ${data.paymentMethod.details ? `<p><strong>${this.localization.translate('paymentDetails', locale)}:</strong> ${data.paymentMethod.details}</p>` : ''}
        ${data.paymentMethod.instructions ? `<p><strong>${this.localization.translate('paymentInstructions', locale)}:</strong> ${data.paymentMethod.instructions}</p>` : ''}
        ${data.paymentMethod.qrCodeUrl ? `
          <div class="qr-code-section">
            <p><strong>${this.localization.translate('paymentQRCode', locale)}:</strong></p>
            <img src="${data.paymentMethod.qrCodeUrl}" alt="Payment QR Code" class="qr-code">
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Generate shipping information HTML
   */
  private generateShippingInfoHTML(data: OrderPDFData, locale: 'en' | 'vi'): string {
    // Format estimated delivery date if provided
    const formattedEstimatedDelivery = data.shippingMethod.estimatedDelivery
      ? this.localization.formatDate(data.shippingMethod.estimatedDelivery, locale)
      : data.shippingMethod.estimatedDelivery;

    return `
      <div class="shipping-info">
        <h3>${this.localization.translate('shippingInformation', locale)}</h3>
        <p><strong>${this.localization.translate('shippingMethod', locale)}:</strong> ${data.shippingMethod.name}</p>
        ${data.shippingMethod.description ? `<p><strong>${this.localization.translate('description', locale)}:</strong> ${data.shippingMethod.description}</p>` : ''}
        ${formattedEstimatedDelivery ? `<p><strong>${this.localization.translate('estimatedDelivery', locale)}:</strong> ${formattedEstimatedDelivery}</p>` : ''}
        ${data.shippingMethod.trackingNumber ? `<p><strong>${this.localization.translate('trackingNumber', locale)}:</strong> ${data.shippingMethod.trackingNumber}</p>` : ''}
        ${data.shippingMethod.carrier ? `<p><strong>${this.localization.translate('carrier', locale)}:</strong> ${data.shippingMethod.carrier}</p>` : ''}
      </div>
    `;
  }

  /**
   * Generate footer HTML
   */
  private generateFooterHTML(data: OrderPDFData, locale: 'en' | 'vi'): string {
    const isVietnamese = locale === 'vi';

    return `
      <div class="footer-content">
        <div class="business-info">
          <h4>${data.businessInfo.companyName}</h4>
          <p>${data.businessInfo.address.addressLine1}</p>
          ${data.businessInfo.address.addressLine2 ? `<p>${data.businessInfo.address.addressLine2}</p>` : ''}
          <p>${data.businessInfo.address.city}, ${data.businessInfo.address.state} ${data.businessInfo.address.postalCode}</p>
          <p>${data.businessInfo.address.country}</p>
          <p>Email: ${data.businessInfo.contactEmail}</p>
          ${data.businessInfo.contactPhone ? `<p>${this.localization.translate('phone', locale)}: ${this.localization.formatPhoneNumber(data.businessInfo.contactPhone, locale)}</p>` : ''}
          ${data.businessInfo.website ? `<p>Website: ${data.businessInfo.website}</p>` : ''}
        </div>

        ${data.businessInfo.termsAndConditions || data.businessInfo.returnPolicy ? `
          <div class="policies">
            ${data.businessInfo.termsAndConditions ? `
              <p><strong>${this.localization.translate('termsAndConditions', locale)}:</strong></p>
              <p class="small-text">${data.businessInfo.termsAndConditions}</p>
            ` : ''}
            ${data.businessInfo.returnPolicy ? `
              <p><strong>${this.localization.translate('returnPolicy', locale)}:</strong></p>
              <p class="small-text">${data.businessInfo.returnPolicy}</p>
            ` : ''}
          </div>
        ` : ''}

        <div class="footer-note">
          <p class="small-text">${this.localization.translate('thankYouMessage', locale, { companyName: data.businessInfo.companyName })}</p>
        </div>
      </div>
    `;
  }

  /**
   * Get default PDF styling configuration
   */
  private getDefaultStyling(): PDFStyling {
    return {
      fonts: {
        primary: 'Arial, sans-serif',
        heading: 'Arial, sans-serif',
        monospace: 'Courier New, monospace',
      },
      colors: {
        primary: '#2c3e50',
        secondary: '#3498db',
        text: '#2c3e50',
        background: '#ffffff',
        border: '#bdc3c7',
      },
      spacing: {
        small: 8,
        medium: 16,
        large: 24,
      },
      pageFormat: {
        size: 'A4',
        orientation: 'portrait',
        margins: {
          top: 20,
          right: 15,
          bottom: 20,
          left: 15,
        },
      },
    };
  }

  /**
   * Create PDF metadata
   */
  private createMetadata(data: OrderPDFData, locale: 'en' | 'vi'): PDFMetadata {
    const isVietnamese = locale === 'vi';

    return {
      title: isVietnamese ? `Đơn hàng ${data.orderNumber}` : `Order ${data.orderNumber}`,
      author: data.businessInfo.companyName,
      subject: isVietnamese ? 'Xác nhận đơn hàng' : 'Order Confirmation',
      creator: 'AlaCraft PDF Generator',
      producer: 'AlaCraft E-commerce System',
      creationDate: new Date(),
      keywords: [
        'order',
        'confirmation',
        data.orderNumber,
        data.businessInfo.companyName,
        isVietnamese ? 'vietnamese' : 'english',
      ],
    };
  }

  /**
   * Generate CSS styles for the PDF
   */
  private generateCSS(styling: PDFStyling): string {
    const baseCSS = `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: ${styling.fonts.primary};
        font-size: 12px;
        line-height: 1.4;
        color: ${styling.colors.text};
        background-color: ${styling.colors.background};
      }

      .pdf-container {
        max-width: 100%;
        margin: 0 auto;
        padding: ${styling.spacing.medium}px;
      }

      .header-container {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: ${styling.spacing.large}px;
        padding-bottom: ${styling.spacing.medium}px;
        border-bottom: 2px solid ${styling.colors.primary};
      }

      .logo-section {
        flex: 1;
      }

      .company-logo {
        max-height: 60px;
        max-width: 200px;
      }

      .company-name {
        font-size: 24px;
        color: ${styling.colors.primary};
        margin: 0;
      }

      .document-title {
        flex: 1;
        text-align: right;
      }

      .document-title h1 {
        font-size: 28px;
        color: ${styling.colors.primary};
        margin-bottom: ${styling.spacing.small}px;
      }

      .order-number, .order-date {
        font-size: 14px;
        margin-bottom: ${styling.spacing.small / 2}px;
      }

      .order-info-section {
        margin-bottom: ${styling.spacing.large}px;
      }

      .customer-info {
        margin-bottom: ${styling.spacing.medium}px;
      }

      .addresses-section {
        display: flex;
        justify-content: space-between;
        gap: ${styling.spacing.medium}px;
      }

      .shipping-address, .billing-address {
        flex: 1;
        padding: ${styling.spacing.medium}px;
        border: 1px solid ${styling.colors.border};
        border-radius: 4px;
      }

      .items-section {
        margin-bottom: ${styling.spacing.large}px;
      }

      .items-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: ${styling.spacing.medium}px;
      }

      .items-table th,
      .items-table td {
        padding: ${styling.spacing.small}px;
        border: 1px solid ${styling.colors.border};
        text-align: left;
      }

      .items-table th {
        background-color: ${styling.colors.primary};
        color: white;
        font-weight: bold;
      }

      .product-info {
        display: flex;
        align-items: center;
        gap: ${styling.spacing.small}px;
      }

      .product-image {
        width: 40px;
        height: 40px;
        object-fit: cover;
        border-radius: 4px;
      }

      .text-center {
        text-align: center;
      }

      .text-right {
        text-align: right;
      }

      .order-summary {
        margin-bottom: ${styling.spacing.large}px;
      }

      .summary-table {
        width: 100%;
        max-width: 300px;
        margin-left: auto;
        border-collapse: collapse;
      }

      .summary-table td {
        padding: ${styling.spacing.small / 2}px ${styling.spacing.small}px;
        border-bottom: 1px solid ${styling.colors.border};
      }

      .total-row {
        border-top: 2px solid ${styling.colors.primary};
        font-size: 14px;
      }

      .payment-info, .shipping-info {
        margin-bottom: ${styling.spacing.large}px;
        padding: ${styling.spacing.medium}px;
        border: 1px solid ${styling.colors.border};
        border-radius: 4px;
      }

      .qr-code-section {
        margin-top: ${styling.spacing.medium}px;
        text-align: center;
      }

      .qr-code {
        max-width: 150px;
        max-height: 150px;
      }

      .pdf-footer {
        margin-top: ${styling.spacing.large}px;
        padding-top: ${styling.spacing.medium}px;
        border-top: 1px solid ${styling.colors.border};
      }

      .footer-content {
        display: flex;
        flex-direction: column;
        gap: ${styling.spacing.medium}px;
      }

      .business-info h4 {
        color: ${styling.colors.primary};
        margin-bottom: ${styling.spacing.small}px;
      }

      .policies {
        margin-top: ${styling.spacing.medium}px;
      }

      .small-text {
        font-size: 10px;
        color: #666;
        line-height: 1.3;
      }

      .footer-note {
        text-align: center;
        margin-top: ${styling.spacing.medium}px;
        padding-top: ${styling.spacing.medium}px;
        border-top: 1px solid ${styling.colors.border};
      }

      h3 {
        color: ${styling.colors.primary};
        margin-bottom: ${styling.spacing.medium}px;
        font-size: 16px;
      }

      h4 {
        color: ${styling.colors.primary};
        margin-bottom: ${styling.spacing.small}px;
        font-size: 14px;
      }

      p {
        margin-bottom: ${styling.spacing.small / 2}px;
      }

      strong {
        font-weight: bold;
      }

      @media print {
        .pdf-container {
          padding: 0;
        }

        .header-container {
          page-break-inside: avoid;
        }

        .items-table {
          page-break-inside: auto;
        }

        .items-table tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }

        .order-summary {
          page-break-inside: avoid;
        }
      }
    `;

    // Add accessibility CSS enhancements
    const accessibilityCSS = this.accessibilityService.generateAccessibilityCSS(styling);

    // Add device optimization CSS
    const deviceCSS = this.deviceOptimization.generateCompleteDeviceCSS(styling);

    return baseCSS + accessibilityCSS + deviceCSS;
  }


}