import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import {
  PDFTemplate,
  PDFSection,
  PDFStyling,
  PDFMetadata,
  OrderPDFData,
  ValidationResult
} from './types/pdf.types';
import { OptimizedImageResult, FallbackResult, PerformanceMonitoringData } from './types/image-optimization.types';
import { PDFDocumentStructureService } from './pdf-document-structure.service';
import { PDFLocalizationService } from './services/pdf-localization.service';
import { PDFAccessibilityService } from './services/pdf-accessibility.service';
import { PDFDeviceOptimizationService } from './services/pdf-device-optimization.service';
import { PDFImageConverterService } from './services/pdf-image-converter.service';
import { PDFImageOptimizationMetricsService } from './services/pdf-image-optimization-metrics.service';
import { PDFTemplateLoaderService } from './services/pdf-template-loader.service';
import { TemplateVariableProcessorService } from './services/template-variable-processor.service';
import { CONSTANTS, getPdfMetadataTranslations } from '@alacraft/shared';
import { PDFCompressionService } from './services/pdf-compression.service';

@Injectable()
export class PDFTemplateEngine {
  private readonly logger = new Logger(PDFTemplateEngine.name);
  private useFileBasedTemplates = true; // Configuration option to switch between programmatic and file-based templates

  constructor(
    private documentStructure: PDFDocumentStructureService,
    private localization: PDFLocalizationService,
    private accessibilityService: PDFAccessibilityService,
    private deviceOptimization: PDFDeviceOptimizationService,
    private imageConverter: PDFImageConverterService,
    @Inject(forwardRef(() => PDFCompressionService))
    private compressionService: PDFCompressionService,
    private metricsService: PDFImageOptimizationMetricsService,
    private templateLoader: PDFTemplateLoaderService,
    private variableProcessor: TemplateVariableProcessorService
  ) {}

  /**
   * Create order confirmation PDF template
   * @param data - Order data for template generation
   * @param locale - Language locale for the template
   * @returns Complete PDF template with styling and content
   */
  async createOrderTemplate(data: OrderPDFData, locale: 'en' | 'vi' = 'en'): Promise<PDFTemplate> {
    this.logger.log(`Creating order template for order ${data.orderNumber} in locale ${locale}`);

    // Convert images to base64 before creating template
    const dataWithBase64Images = await this.convertImagesToBase64(data);

    if (this.useFileBasedTemplates) {
      // Use new file-based template system
      return this.createOrderTemplateFromFile(dataWithBase64Images, locale);
    } else {
      // Use legacy programmatic template system for backward compatibility
      return this.createOrderTemplateProgrammatic(dataWithBase64Images, locale);
    }
  }

  /**
   * Create order template using file-based template system
   * @param data - Order data for template generation
   * @param locale - Language locale for the template
   * @returns Complete PDF template with styling and content
   */
  private async createOrderTemplateFromFile(data: OrderPDFData, locale: 'en' | 'vi'): Promise<PDFTemplate> {
    const styling = this.getDefaultStyling();
    const metadata = this.createMetadata(data, locale);

    // Load template file and process variables
    const htmlContent = await this.generateHTMLFromTemplateFile('order-confirmation', data, locale);

    const template: PDFTemplate = {
      header: { type: 'header', content: '' }, // Content is now in the full HTML
      content: [{ type: 'content', content: htmlContent }],
      footer: { type: 'footer', content: '' }, // Content is now in the full HTML
      styling,
      metadata,
      templateFile: 'order-confirmation.html'
    };

    return this.applyBranding(template);
  }

  /**
   * Create order template using legacy programmatic system
   * @param data - Order data for template generation
   * @param locale - Language locale for the template
   * @returns Complete PDF template with styling and content
   */
  private async createOrderTemplateProgrammatic(data: OrderPDFData, locale: 'en' | 'vi'): Promise<PDFTemplate> {
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
  async createInvoiceTemplate(data: OrderPDFData, locale: 'en' | 'vi' = 'en'): Promise<PDFTemplate> {
    this.logger.log(`Creating invoice template for order ${data.orderNumber} in locale ${locale}`);

    // Convert images to base64 before creating template
    const dataWithBase64Images = await this.convertImagesToBase64(data);

    // Use file-based template system
    return this.createInvoiceTemplateFromFile(dataWithBase64Images, locale);
  }

  /**
   * Create invoice template using file-based template system
   * @param data - Order data for invoice generation
   * @param locale - Language locale for the template
   * @returns Complete PDF template formatted as invoice
   */
  private async createInvoiceTemplateFromFile(data: OrderPDFData, locale: 'en' | 'vi'): Promise<PDFTemplate> {
    const styling = this.getDefaultStyling();
    const metadata = this.createInvoiceMetadata(data, locale);

    // Load template file and process variables
    const htmlContent = await this.generateHTMLFromTemplateFile('invoice', data, locale);

    const template: PDFTemplate = {
      header: { type: 'header', content: '' }, // Content is now in the full HTML
      content: [{ type: 'content', content: htmlContent }],
      footer: { type: 'footer', content: '' }, // Content is now in the full HTML
      styling,
      metadata,
      templateFile: 'invoice.html'
    };

    return this.applyBranding(template);
  }

  /**
   * Apply branding elements to the template
   * @param template - Base template to apply branding to
   * @returns Template with branding applied
   */
  applyBranding(template: PDFTemplate): PDFTemplate {
    // Apply company branding colors and styling
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
    // If template was created from file, use the content directly
    if (template.templateFile && template.content.length === 1 && template.content[0].content) {
      return this.validateBase64ImageEmbedding(template.content[0].content);
    }

    // For backward compatibility, use the original template-based approach
    const { styling } = template;

    const htmlContent = `
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

    // Validate and ensure proper base64 image embedding
    return this.validateBase64ImageEmbedding(htmlContent);
  }

  /**
   * Generate complete HTML from order data directly using document structure service
   * @param orderData - Order data for document generation
   * @param locale - Language locale
   * @param templateType - Type of template to use ('order-confirmation' or 'invoice')
   * @returns Complete HTML string ready for PDF generation
   */
  async generateHTMLFromOrderData(orderData: OrderPDFData, locale: 'en' | 'vi', templateType: 'order-confirmation' | 'invoice' = 'order-confirmation'): Promise<string> {
    // Convert images to base64 before generating HTML
    const dataWithBase64Images = await this.convertImagesToBase64(orderData);

    // Use file-based template system with specified template type
    return this.generateHTMLFromTemplateFile(templateType, dataWithBase64Images, locale);
  }

  /**
   * Generate HTML from template file
   * @param templateName - Name of the template file
   * @param data - Order data for variable replacement
   * @param locale - Language locale
   * @returns Complete HTML string ready for PDF generation
   */
  async generateHTMLFromTemplateFile(templateName: 'order-confirmation' | 'invoice', data: OrderPDFData, locale: 'en' | 'vi'): Promise<string> {
    try {
      const enhanceData = {...data,
        formattedShippingAddress: this.localization.formatAddress(data.shippingAddress, locale),
        formattedBillingAddress: this.localization.formatAddress(data.billingAddress, locale),
        items: data.items.map((i)=> {
          return {
            ...i,
            formattedUnitPrice: this.localization.formatCurrency(i.unitPrice, locale),
            formattedTotalPrice: this.localization.formatCurrency(i.totalPrice, locale)
          }
        })
      }
      // Load template file
      const template = await this.templateLoader.loadTemplate(templateName);

      // Load CSS stylesheet
      const stylesheet = await this.templateLoader.loadStylesheet();

      // Create partials map for CSS inclusion
      const partials = new Map<string, string>();
      partials.set('pdf-styles', stylesheet);

      // Process partials first (CSS inclusion)
      let processedTemplate = this.variableProcessor.processPartials(template, partials);

      // Process template variables
      processedTemplate = this.variableProcessor.processVariables(processedTemplate, enhanceData, locale);

      // Validate and ensure proper base64 image embedding
      // return this.validateBase64ImageEmbedding(processedTemplate);
      return processedTemplate;
    } catch (error) {
      this.logger.error(`Failed to generate HTML from template file ${templateName}: ${error.message}`, {
        templateName,
        orderNumber: data.orderNumber,
        locale,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Template file processing failed: ${error.message}`);
    }
  }

  /**
   * Load template file from filesystem
   * @param templateName - Name of the template file
   * @returns Template content
   */
  async loadTemplateFile(templateName: string): Promise<string> {
    return this.templateLoader.loadTemplate(templateName as 'order-confirmation' | 'invoice');
  }

  /**
   * Process template variables in a template string
   * @param template - Template content with placeholders
   * @param data - Order data for variable replacement
   * @param locale - Language locale
   * @returns Processed template with variables replaced
   */
  processTemplateVariables(template: string, data: OrderPDFData, locale: 'en' | 'vi'): string {
    return this.variableProcessor.processVariables(template, data, locale);
  }

  /**
   * Create invoice metadata
   * @param data - Order data
   * @param locale - Language locale
   * @returns PDF metadata for invoice
   */
  private createInvoiceMetadata(data: OrderPDFData, locale: 'en' | 'vi'): PDFMetadata {
    const translations = getPdfMetadataTranslations(locale);
    const companyName = data.businessInfo?.companyName || CONSTANTS.BUSINESS.COMPANY.NAME[locale.toUpperCase() as 'EN' | 'VI'];

    return {
      title: translations.orderInvoiceTitle.replace('{orderNumber}', data.orderNumber),
      author: companyName,
      subject: translations.orderInvoiceSubject,
      creator: `${CONSTANTS.BUSINESS.COMPANY.NAME.EN} PDF Generator`,
      producer: `${CONSTANTS.BUSINESS.COMPANY.NAME.EN} E-commerce System`,
      creationDate: new Date(),
      keywords: [
        'invoice',
        'order',
        data.orderNumber,
        companyName,
        locale === 'vi' ? 'vietnamese' : 'english',
      ],
    };
  }

  /**
   * Set template generation mode
   * @param useFileBasedTemplates - Whether to use file-based templates
   */
  setTemplateMode(useFileBasedTemplates: boolean): void {
    this.useFileBasedTemplates = useFileBasedTemplates;
    // Safety check for logger initialization
    if (this.logger) {
      this.logger.log(`Template mode set to: ${useFileBasedTemplates ? 'file-based' : 'programmatic'}`);
    }
  }

  /**
   * Get current template generation mode
   * @returns Whether file-based templates are enabled
   */
  getTemplateMode(): boolean {
    return this.useFileBasedTemplates;
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
    const companyName =
      data.businessInfo?.companyName ||
      CONSTANTS.BUSINESS.COMPANY.NAME[locale.toUpperCase() as 'EN' | 'VI'];

    return `
      <div class="header-container">
        <div class="logo-section">
          ${data.businessInfo.logoUrl
              ? `<img src="${data.businessInfo.logoUrl}" alt="${companyName}" class="company-logo">`
              : `<h1 class="company-name">${companyName}</h1>`
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
            <td class="text-right">${this.localization.formatCurrency(data.pricing.subtotal, locale)}</td>
          </tr>
          <tr>
            <td>${this.localization.translate('shipping', locale)}:</td>
            <td class="text-right">${this.localization.formatCurrency(data.pricing.shippingCost, locale)}</td>
          </tr>
          ${data.pricing.taxAmount ? `
            <tr>
              <td>${isVietnamese ? 'Thuế' : 'Tax'}:</td>
              <td class="text-right">${this.localization.formatCurrency(data.pricing.taxAmount, locale)}</td>
            </tr>
          ` : ''}
          ${data.pricing.discountAmount ? `
            <tr>
              <td>${isVietnamese ? 'Giảm giá' : 'Discount'}:</td>
              <td class="text-right">-${this.localization.formatCurrency(data.pricing.discountAmount, locale)}</td>
            </tr>
          ` : ''}
          <tr class="total-row">
            <td><strong>${isVietnamese ? 'Tổng cộng' : 'Total'}:</strong></td>
            <td class="text-right"><strong>${this.localization.formatCurrency(data.pricing.total, locale)}</strong></td>
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
    const companyName = data.businessInfo?.companyName || CONSTANTS.BUSINESS.COMPANY.NAME[locale.toUpperCase() as 'EN' | 'VI'];

    return `
      <div class="footer-content">
        <div class="footer-note">
          <p class="small-text">${this.localization.translate('thankYouMessage', locale, { companyName })}</p>
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
    const companyName = data.businessInfo?.companyName || CONSTANTS.BUSINESS.COMPANY.NAME[locale.toUpperCase() as 'EN' | 'VI'];

    return {
      title: isVietnamese ? `Đơn hàng ${data.orderNumber}` : `Order ${data.orderNumber}`,
      author: companyName,
      subject: isVietnamese ? 'Xác nhận đơn hàng' : 'Order Confirmation',
      creator: `${CONSTANTS.BUSINESS.COMPANY.NAME.EN} PDF Generator`,
      producer: `${CONSTANTS.BUSINESS.COMPANY.NAME.EN} E-commerce System`,
      creationDate: new Date(),
      keywords: [
        'order',
        'confirmation',
        data.orderNumber,
        companyName,
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
        width: 80px;
        height: 80px;
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

  /**
   * Convert all images in order data to optimized base64 data URLs
   * Enhanced to use aggressive image optimization for maximum size reduction
   * @param data - Order data with image URLs
   * @returns Promise<OrderPDFData> - Order data with optimized base64 image URLs
   */
  private async convertImagesToBase64(data: OrderPDFData): Promise<OrderPDFData> {
    this.logger.debug(`Converting images to optimized base64 for order ${data.orderNumber}`);

    // Initialize metrics collection for this batch operation
    const batchStartTime = Date.now();
    const operationId = `batch-${data.orderNumber}-${Date.now()}`;

    this.logger.log(`Starting image optimization batch operation: ${operationId}`);

    // Track total original and optimized sizes for file size comparison
    let totalOriginalSize = 0;
    let totalOptimizedSize = 0;

    // Step 1: Load and validate image optimization configuration
    this.logger.log('Loading image optimization configuration for PDF generation');
    let config: any;

    try {
      // Try to access configuration through compression service
      config = this.compressionService['configService']?.getConfiguration();

      if (!config) {
        this.logger.warn('Configuration service not available, using default optimization behavior');
        // Continue with image processing without detailed configuration logging
      } else {
        // Log configuration values being applied
        this.logger.log('Image Optimization Configuration:');
        this.logger.log(`  - Aggressive Mode: ${config.aggressiveMode?.enabled ? 'ENABLED' : 'DISABLED'}`);
        this.logger.log(`  - Max Dimensions: ${config.aggressiveMode?.maxDimensions?.width || 'unknown'}x${config.aggressiveMode?.maxDimensions?.height || 'unknown'}px`);
        this.logger.log(`  - Min Dimensions: ${config.aggressiveMode?.minDimensions?.width || 'unknown'}x${config.aggressiveMode?.minDimensions?.height || 'unknown'}px`);
        this.logger.log(`  - Force Optimization: ${config.aggressiveMode?.forceOptimization}`);
        this.logger.log(`  - Compression Level: ${config.compression?.level || 'unknown'}`);
        this.logger.log(`  - Preferred Format: ${config.compression?.preferredFormat || 'unknown'}`);
        this.logger.log(`  - Format Conversion: ${config.compression?.enableFormatConversion ? 'ENABLED' : 'DISABLED'}`);
        this.logger.log(`  - Content-Aware Optimization: ${config.contentAware?.enabled ? 'ENABLED' : 'DISABLED'}`);

        // Log content-type specific quality settings
        if (config.contentAware?.enabled && config.contentAware?.contentTypes) {
          this.logger.log('  - Content Type Quality Settings:');
          this.logger.log(`    * Text: ${config.contentAware.contentTypes.text?.quality || 'unknown'}`);
          this.logger.log(`    * Photo: ${config.contentAware.contentTypes.photo?.quality || 'unknown'}`);
          this.logger.log(`    * Graphics: ${config.contentAware.contentTypes.graphics?.quality || 'unknown'}`);
          this.logger.log(`    * Logo: ${config.contentAware.contentTypes.logo?.quality || 'unknown'}`);
        }

        // Log fallback configuration
        this.logger.log(`  - Fallback: ${config.fallback?.enabled ? 'ENABLED' : 'DISABLED'}`);
        this.logger.log(`  - Max Retries: ${config.fallback?.maxRetries || 'unknown'}`);
        this.logger.log(`  - Timeout: ${config.fallback?.timeoutMs || 'unknown'}ms`);

        // Log monitoring configuration
        this.logger.log(`  - Monitoring: ${config.monitoring?.enabled ? 'ENABLED' : 'DISABLED'}`);

        // Validate configuration is properly loaded
        if (config.aggressiveMode && !config.aggressiveMode.enabled) {
          this.logger.warn('WARNING: Aggressive mode is DISABLED - images may not be optimized');
        }

        if (config.aggressiveMode?.maxDimensions &&
            (config.aggressiveMode.maxDimensions.width > 800 || config.aggressiveMode.maxDimensions.height > 800)) {
          this.logger.warn(`WARNING: Max dimensions (${config.aggressiveMode.maxDimensions.width}x${config.aggressiveMode.maxDimensions.height}) are larger than recommended (300x300) - may result in larger PDF files`);
        }

        if (config.compression && config.compression.level !== 'maximum') {
          this.logger.warn(`WARNING: Compression level is '${config.compression.level}' instead of 'maximum' - may result in larger PDF files`);
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to load image optimization configuration: ${error.message}. Continuing with default behavior.`);
      config = null;
    }

    // Collect all image URLs that are not already base64 data URLs
    const imageUrls: string[] = [];
    const imageContentTypes: ('text' | 'photo' | 'graphics' | 'logo')[] = [];

    // Collect product images (skip if already base64)
    data.items.forEach(item => {
      this.logger.debug(`imageUrl: ${item.imageUrl}`)
      if (item.imageUrl && typeof item.imageUrl === 'string' && !item.imageUrl.startsWith('data:')) {
        imageUrls.push(item.imageUrl);
        imageContentTypes.push('photo'); // Product images are typically photos
      }
    });

    // Collect QR code image (skip if already base64)
    if (data.paymentMethod.qrCodeUrl && typeof data.paymentMethod.qrCodeUrl === 'string' && !data.paymentMethod.qrCodeUrl.startsWith('data:')) {
      imageUrls.push(data.paymentMethod.qrCodeUrl);
      imageContentTypes.push('graphics'); // QR codes are graphics
    }

    // Collect business logo (skip if already base64)
    if (data.businessInfo.logoUrl && typeof data.businessInfo.logoUrl === 'string' && !data.businessInfo.logoUrl.startsWith('data:')) {
      imageUrls.push(data.businessInfo.logoUrl);
      imageContentTypes.push('logo'); // Business logos are logos
    }

    // If no images to process, return original data
    if (imageUrls.length === 0) {
      this.logger.debug(`No images to optimize for order ${data.orderNumber}`);
      return data;
    }

    // Use compression service for image optimization with fallback
    const optimizedImageMap = new Map<string, string>();
    let successfulOptimizations = 0;
    let fallbackConversions = 0;
    let totalFailures = 0;

    try {
      // Process all images in parallel with proper error handling for each image
      // This ensures consistent optimization settings are applied to all images simultaneously
      this.logger.debug(`Starting parallel processing of ${imageUrls.length} images`);

      const imageProcessingPromises = imageUrls.map(async (imageUrl, index) => {
        const contentType = imageContentTypes[index];

        this.logger.debug(`Processing image ${index + 1}/${imageUrls.length}: ${imageUrl} (${contentType})`);

        // Validate that configuration settings are correctly passed to compression service
        let contentTypeSettings: any = null;
        try {
          contentTypeSettings = this.compressionService['configService']?.getContentTypeSettings?.(contentType);
        } catch (error) {
          this.logger.debug(`Could not retrieve content type settings for '${contentType}': ${error.message}`);
        }

        if (contentTypeSettings) {
          this.logger.debug(`Using content-type settings for '${contentType}': quality=${contentTypeSettings.quality}`);
        }

        // Verify that the compression service has access to the same configuration
        if (config) {
          let compressionServiceConfig: any = null;
          try {
            compressionServiceConfig = this.compressionService['configService']?.getConfiguration?.();
          } catch (error) {
            this.logger.debug(`Could not verify compression service configuration: ${error.message}`);
          }

          if (compressionServiceConfig && !compressionServiceConfig.aggressiveMode?.enabled) {
            this.logger.warn(`Configuration mismatch: Compression service has aggressive mode DISABLED for image ${imageUrl}`);
          }

          // Log the specific settings that will be applied to this image
          this.logger.debug(`Applying optimization settings to ${imageUrl}:`);
          this.logger.debug(`  - Content Type: ${contentType}`);
          this.logger.debug(`  - Target Quality: ${contentTypeSettings?.quality || 'unknown'}`);
          this.logger.debug(`  - Max Dimensions: ${compressionServiceConfig?.aggressiveMode?.maxDimensions?.width || 'unknown'}x${compressionServiceConfig?.aggressiveMode?.maxDimensions?.height || 'unknown'}`);
          this.logger.debug(`  - Compression Level: ${compressionServiceConfig?.compression?.level || 'unknown'}`);
          this.logger.debug(`  - Preferred Format: ${compressionServiceConfig?.compression?.preferredFormat || 'unknown'}`);
        }

        try {
          // Use compression service for optimization
          const optimizationResult = await this.compressionService.optimizeImageForPDF(imageUrl, contentType);

          if (optimizationResult.optimizedBuffer && !optimizationResult.error) {
            // Convert optimized buffer to base64 data URL
            const mimeType = `image/${optimizationResult.format}`;
            const base64Data = optimizationResult.optimizedBuffer.toString('base64');
            const dataUrl = `data:${mimeType};base64,${base64Data}`;

            // Track file sizes for comparison and validation
            totalOriginalSize += optimizationResult.originalSize;
            totalOptimizedSize += optimizationResult.optimizedSize;

            // Log detailed optimization results with configuration validation
            this.logger.debug(`Successfully optimized image: ${imageUrl}`);
            this.logger.debug(`  - Original Size: ${optimizationResult.originalSize} bytes`);
            this.logger.debug(`  - Optimized Size: ${optimizationResult.optimizedSize} bytes`);
            this.logger.debug(`  - Compression Ratio: ${(optimizationResult.compressionRatio * 100).toFixed(1)}%`);
            this.logger.debug(`  - Processing Time: ${optimizationResult.processingTime}ms`);
            this.logger.debug(`  - Applied Quality: ${optimizationResult.metadata?.qualityUsed || 'unknown'}`);
            this.logger.debug(`  - Technique Used: ${optimizationResult.metadata?.technique || 'unknown'}`);

            // Validate that the optimization actually applied the expected settings
            if (optimizationResult.metadata?.qualityUsed && contentTypeSettings?.quality &&
                optimizationResult.metadata.qualityUsed !== contentTypeSettings.quality) {
              this.logger.warn(`Quality setting mismatch for ${imageUrl}: expected ${contentTypeSettings.quality}, applied ${optimizationResult.metadata.qualityUsed}`);
            }

            // Validate that compression was actually achieved
            if (optimizationResult.compressionRatio < 0.1) { // Less than 10% compression
              this.logger.warn(`Low compression ratio (${(optimizationResult.compressionRatio * 100).toFixed(1)}%) for ${imageUrl} - configuration may not be optimal`);
            }

            return { imageUrl, dataUrl, status: 'optimized' as const };
          } else {
            const errorMessage = optimizationResult.error || 'Unknown optimization error';
            this.logger.warn(`Optimization failed for image: ${imageUrl}, error: ${errorMessage}`);

            // Fallback to simple conversion with error context
            const fallbackResult = await this.fallbackToSimpleConversionWithResult(imageUrl, errorMessage);

            if (fallbackResult) {
              return { imageUrl, dataUrl: fallbackResult, status: 'fallback' as const };
            } else {
              return { imageUrl, dataUrl: null, status: 'failed' as const };
            }
          }
        } catch (error) {
          const errorMessage = `Optimization service error: ${error.message}`;
          this.logger.warn(`Failed to optimize image ${imageUrl}: ${errorMessage}`);

          // Fallback to simple conversion with error context
          const fallbackResult = await this.fallbackToSimpleConversionWithResult(imageUrl, errorMessage);

          if (fallbackResult) {
            return { imageUrl, dataUrl: fallbackResult, status: 'fallback' as const };
          } else {
            return { imageUrl, dataUrl: null, status: 'failed' as const };
          }
        }
      });

      // Wait for all image processing to complete in parallel
      // This maintains order consistency through the original array indices
      const results = await Promise.all(imageProcessingPromises);

      // Process results and populate the optimized image map
      // Order is maintained because Promise.all preserves array order
      results.forEach(result => {
        if (result.dataUrl) {
          optimizedImageMap.set(result.imageUrl, result.dataUrl);

          if (result.status === 'optimized') {
            successfulOptimizations++;
          } else if (result.status === 'fallback') {
            fallbackConversions++;
          }
        } else {
          totalFailures++;
        }
      });

      this.logger.debug(`Parallel processing completed: ${successfulOptimizations} optimized, ${fallbackConversions} fallback, ${totalFailures} failed`);
    } catch (error) {
      // This catch block handles catastrophic failures in Promise.all
      // Individual image failures are already handled within each promise
      this.logger.error(`Unexpected error during parallel image processing: ${error.message}`, {
        error: error.message,
        stack: error.stack,
      });

      // Re-throw to be caught by outer try-catch
      throw error;
    }

    try {

    // Log comprehensive processing summary with configuration validation and file size comparison
    this.logger.log(`Image processing summary for order ${data.orderNumber}: ${successfulOptimizations} optimized, ${fallbackConversions} fallback conversions, ${totalFailures} failures out of ${imageUrls.length} total images`);

    // Perform file size comparison and validation
    if (totalOriginalSize > 0 && totalOptimizedSize > 0) {
      const totalSizeReduction = totalOriginalSize - totalOptimizedSize;
      const compressionEffectiveness = (totalSizeReduction / totalOriginalSize) * 100;

      this.logger.log(`File size comparison results for order ${data.orderNumber}:`);
      this.logger.log(`  - Total Original Size: ${this.formatFileSize(totalOriginalSize)}`);
      this.logger.log(`  - Total Optimized Size: ${this.formatFileSize(totalOptimizedSize)}`);
      this.logger.log(`  - Total Size Reduction: ${this.formatFileSize(totalSizeReduction)}`);
      this.logger.log(`  - Compression Effectiveness: ${compressionEffectiveness.toFixed(1)}%`);

      // Validate significant file size reduction is achieved
      if (compressionEffectiveness >= 50) {
        this.logger.log(`✓ Excellent compression effectiveness: ${compressionEffectiveness.toFixed(1)}% reduction achieved`);
      } else if (compressionEffectiveness >= 25) {
        this.logger.log(`✓ Good compression effectiveness: ${compressionEffectiveness.toFixed(1)}% reduction achieved`);
      } else if (compressionEffectiveness >= 10) {
        this.logger.warn(`⚠ Moderate compression effectiveness: ${compressionEffectiveness.toFixed(1)}% reduction - consider reviewing optimization settings`);
      } else if (compressionEffectiveness > 0) {
        this.logger.warn(`⚠ Low compression effectiveness: ${compressionEffectiveness.toFixed(1)}% reduction - optimization may not be working optimally`);
      } else {
        this.logger.error(`✗ No compression achieved: Images may not be optimized properly`);
      }

      // Log compression effectiveness metrics for monitoring
      this.logger.log(`Compression metrics - Original: ${totalOriginalSize}B, Optimized: ${totalOptimizedSize}B, Reduction: ${totalSizeReduction}B (${compressionEffectiveness.toFixed(1)}%)`);
    } else if (imageUrls.length > 0) {
      this.logger.warn(`Unable to calculate file size comparison - missing size data for ${imageUrls.length} images`);
    }

    // Validate that configuration was applied effectively
    if (successfulOptimizations > 0) {
      this.logger.log(`Configuration validation: Successfully applied optimization settings to ${successfulOptimizations} images`);

      // Check if aggressive mode was effective
      if (config && config.aggressiveMode && config.aggressiveMode.enabled && successfulOptimizations === imageUrls.length) {
        this.logger.log('✓ Configuration validation PASSED: All images processed with aggressive optimization');
      } else if (config && config.aggressiveMode && config.aggressiveMode.enabled && successfulOptimizations < imageUrls.length) {
        this.logger.warn(`⚠ Configuration validation WARNING: Aggressive mode enabled but only ${successfulOptimizations}/${imageUrls.length} images optimized`);
      }
    } else if (imageUrls.length > 0) {
      this.logger.error(`✗ Configuration validation FAILED: No images were optimized despite having ${imageUrls.length} images to process`);
      this.logger.error('This indicates a configuration or service integration issue');
    }

      // Log final configuration compliance status
      this.logger.log('Configuration compliance check completed');

      // Warn if significant failures occurred but continue processing
      if (totalFailures > 0) {
        this.logger.warn(`${totalFailures} images failed to process for order ${data.orderNumber}, but PDF generation will continue with available images`);
      }

      // Warn if no optimizations succeeded (all fallbacks or failures)
      if (successfulOptimizations === 0 && imageUrls.length > 0) {
        this.logger.warn(`No images were successfully optimized for order ${data.orderNumber}, all processed images used fallback conversion or failed`);
      }

    } catch (error) {
      this.logger.error(`Critical error during batch image processing for order ${data.orderNumber}: ${error.message}`, {
        error: error.message,
        stack: error.stack,
        imageCount: imageUrls.length,
        orderNumber: data.orderNumber
      });

      // Even if batch processing fails completely, continue with PDF generation
      this.logger.warn(`Continuing PDF generation for order ${data.orderNumber} without image optimization due to critical processing error`);

      // Return original data if all image processing fails
      return data;
    }

    // Create a copy of the data with converted images
    const convertedData: OrderPDFData = {
      ...data,
      items: data.items.map(item => ({
        ...item,
        imageUrl: item.imageUrl && typeof item.imageUrl === 'string'
          ? (item.imageUrl.startsWith('data:') ? item.imageUrl : (optimizedImageMap.get(item.imageUrl) || item.imageUrl))
          : item.imageUrl
      })),
      paymentMethod: {
        ...data.paymentMethod,
        qrCodeUrl: data.paymentMethod.qrCodeUrl && typeof data.paymentMethod.qrCodeUrl === 'string'
          ? (data.paymentMethod.qrCodeUrl.startsWith('data:') ? data.paymentMethod.qrCodeUrl : (optimizedImageMap.get(data.paymentMethod.qrCodeUrl) || data.paymentMethod.qrCodeUrl))
          : data.paymentMethod.qrCodeUrl
      },
      businessInfo: {
        ...data.businessInfo,
        logoUrl: data.businessInfo.logoUrl && typeof data.businessInfo.logoUrl === 'string'
          ? (data.businessInfo.logoUrl.startsWith('data:') ? data.businessInfo.logoUrl : (optimizedImageMap.get(data.businessInfo.logoUrl) || data.businessInfo.logoUrl))
          : data.businessInfo.logoUrl
      }
    };

    this.logger.log(`Image conversion completed for order ${data.orderNumber}: ${optimizedImageMap.size} images processed successfully (${successfulOptimizations} optimized, ${fallbackConversions} fallback, ${totalFailures} failed)`);

    // Collect and log comprehensive optimization metrics for monitoring
    const batchEndTime = Date.now();
    const batchProcessingTime = batchEndTime - batchStartTime;

    // Calculate success/failure rates for monitoring
    const totalImages = imageUrls.length;
    const successRate = totalImages > 0 ? (successfulOptimizations / totalImages) * 100 : 0;
    const fallbackRate = totalImages > 0 ? (fallbackConversions / totalImages) * 100 : 0;
    const failureRate = totalImages > 0 ? (totalFailures / totalImages) * 100 : 0;

    // Calculate compression effectiveness metrics
    const compressionEffectiveness = totalOriginalSize > 0 ? ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) * 100 : 0;
    const averageCompressionRatio = successfulOptimizations > 0 ? compressionEffectiveness / 100 : 0;

    // Log optimization effectiveness metrics
    this.logger.log(`Batch optimization metrics for operation ${operationId}:`);
    this.logger.log(`  - Total Images: ${totalImages}`);
    this.logger.log(`  - Successful Optimizations: ${successfulOptimizations} (${successRate.toFixed(1)}%)`);
    this.logger.log(`  - Fallback Conversions: ${fallbackConversions} (${fallbackRate.toFixed(1)}%)`);
    this.logger.log(`  - Failed Conversions: ${totalFailures} (${failureRate.toFixed(1)}%)`);
    this.logger.log(`  - Total Processing Time: ${batchProcessingTime}ms`);
    this.logger.log(`  - Average Time per Image: ${totalImages > 0 ? (batchProcessingTime / totalImages).toFixed(1) : 0}ms`);
    this.logger.log(`  - Total Original Size: ${this.formatFileSize(totalOriginalSize)}`);
    this.logger.log(`  - Total Optimized Size: ${this.formatFileSize(totalOptimizedSize)}`);
    this.logger.log(`  - Total Size Reduction: ${this.formatFileSize(totalOriginalSize - totalOptimizedSize)}`);
    this.logger.log(`  - Compression Effectiveness: ${compressionEffectiveness.toFixed(1)}%`);

    // Validate file size reduction effectiveness
    if (totalOriginalSize > 0 && totalOptimizedSize > 0) {
      const sizeReductionBytes = totalOriginalSize - totalOptimizedSize;

      if (sizeReductionBytes > 0) {
        this.logger.log(`✓ File size reduction validation PASSED: ${this.formatFileSize(sizeReductionBytes)} saved (${compressionEffectiveness.toFixed(1)}% reduction)`);

        // Ensure significant file size reduction is achieved (Requirements 3.1, 3.2)
        if (compressionEffectiveness < 10) {
          this.logger.warn(`⚠ File size reduction below optimal threshold: ${compressionEffectiveness.toFixed(1)}% < 10% - consider reviewing optimization settings`);
        }
      } else {
        this.logger.error(`✗ File size reduction validation FAILED: No size reduction achieved`);
      }
    } else if (totalImages > 0) {
      this.logger.warn(`⚠ File size reduction validation SKIPPED: Missing size data for comparison`);
    }

    // Record performance monitoring data for this batch operation
    try {
      const performanceData: PerformanceMonitoringData = {
        operationId,
        operationType: 'batch_images',
        startTime: new Date(batchStartTime),
        endTime: new Date(batchEndTime),
        duration: batchProcessingTime,
        success: totalFailures === 0, // Success if no complete failures
        memoryUsage: {
          peak: process.memoryUsage().heapUsed,
          average: process.memoryUsage().heapUsed, // Simplified for this implementation
          start: process.memoryUsage().heapUsed,
          end: process.memoryUsage().heapUsed,
        },
        cpuUsage: {
          cpuTime: 0, // Would need more complex CPU monitoring in production
          utilization: 0, // Would need more complex CPU monitoring in production
        },
        ioStats: {
          bytesRead: totalOriginalSize,
          bytesWritten: totalOptimizedSize,
          readOperations: totalImages,
          writeOperations: successfulOptimizations,
        },
        // Add file size comparison metrics
        fileSizeMetrics: {
          originalSize: totalOriginalSize,
          optimizedSize: totalOptimizedSize,
          sizeReduction: totalOriginalSize - totalOptimizedSize,
          compressionRatio: averageCompressionRatio,
          compressionEffectiveness: compressionEffectiveness,
        }
      };

      this.metricsService.recordPerformanceData(performanceData);
      this.logger.debug(`Performance data recorded for batch operation ${operationId}`);
    } catch (metricsError) {
      this.logger.warn(`Failed to record performance metrics for batch operation ${operationId}: ${metricsError.message}`);
    }

    // Log success/failure rate tracking for monitoring integration
    if (totalImages > 0) {
      if (successRate >= 90) {
        this.logger.log(`✓ High optimization success rate: ${successRate.toFixed(1)}% - System performing well`);
      } else if (successRate >= 70) {
        this.logger.warn(`⚠ Moderate optimization success rate: ${successRate.toFixed(1)}% - Monitor for potential issues`);
      } else {
        this.logger.error(`✗ Low optimization success rate: ${successRate.toFixed(1)}% - Investigation required`);
      }

      // Alert on high failure rates
      if (failureRate > 30) {
        this.logger.error(`🚨 High failure rate detected: ${failureRate.toFixed(1)}% - Immediate attention required`);
      }

      // Log monitoring summary for integration with PDF monitoring service
      this.logger.log(`Monitoring summary - Order: ${data.orderNumber}, Success: ${successRate.toFixed(1)}%, Fallback: ${fallbackRate.toFixed(1)}%, Failed: ${failureRate.toFixed(1)}%, Duration: ${batchProcessingTime}ms, Size Reduction: ${this.formatFileSize(totalOriginalSize - totalOptimizedSize)} (${compressionEffectiveness.toFixed(1)}%)`);
    }

    return convertedData;
  }

  /**
   * Fallback to simple image conversion when optimization fails
   * Enhanced with detailed error logging and graceful degradation
   * @param imageUrl - URL of the image to convert
   * @param optimizedImageMap - Map to store the converted image
   * @param originalError - The original optimization error for context
   */
  private async fallbackToSimpleConversion(
    imageUrl: string,
    optimizedImageMap: Map<string, string>,
    originalError?: string
  ): Promise<void> {
    try {
      this.logger.warn(`Image optimization failed for ${imageUrl}${originalError ? `: ${originalError}` : ''}, attempting fallback to simple conversion`);

      const fallbackStartTime = Date.now();
      const base64Result = await this.imageConverter.convertImageToBase64(imageUrl);
      const fallbackDuration = Date.now() - fallbackStartTime;

      if (base64Result) {
        optimizedImageMap.set(imageUrl, base64Result);
        this.logger.log(`Successfully converted image using fallback: ${imageUrl} (${fallbackDuration}ms, unoptimized)`);

        // Log metrics for monitoring
        this.logger.debug(`Fallback conversion metrics - URL: ${imageUrl}, Duration: ${fallbackDuration}ms, Size: ${base64Result.length} chars`);

        // Log fallback success for monitoring integration
        this.logger.log(`Fallback operation successful for ${imageUrl} - Strategy: basic_compression, Duration: ${fallbackDuration}ms`);
      } else {
        this.logger.error(`Fallback conversion returned empty result for image: ${imageUrl}, image will be skipped in PDF`);

        // Log detailed failure information for debugging
        this.logger.debug(`Fallback failure details - URL: ${imageUrl}, Original error: ${originalError || 'Unknown'}, Fallback duration: ${fallbackDuration}ms`);

        // Log fallback failure for monitoring integration
        this.logger.error(`Fallback operation failed for ${imageUrl} - Strategy: basic_compression, Error: Empty result`);
      }
    } catch (fallbackError) {
      this.logger.error(`Fallback conversion failed for image ${imageUrl}: ${fallbackError.message}`, {
        originalError: originalError || 'Unknown optimization error',
        fallbackError: fallbackError.message,
        imageUrl,
        stack: fallbackError.stack
      });

      // Continue with other images even if fallback fails - this ensures PDF generation continues
      this.logger.warn(`Skipping image ${imageUrl} due to both optimization and fallback failures, PDF generation will continue without this image`);

      // Log fallback error for monitoring integration
      this.logger.error(`Fallback operation error for ${imageUrl} - Strategy: basic_compression, Error: ${fallbackError.message}`);
    }
  }

  /**
   * Fallback to simple image conversion when optimization fails (returns result instead of modifying map)
   * Used for parallel processing where each promise needs to return its own result
   * @param imageUrl - URL of the image to convert
   * @param originalError - The original optimization error for context
   * @returns Promise<string | null> - Base64 data URL or null if conversion fails
   */
  private async fallbackToSimpleConversionWithResult(
    imageUrl: string,
    originalError?: string
  ): Promise<string | null> {
    try {
      this.logger.warn(`Image optimization failed for ${imageUrl}${originalError ? `: ${originalError}` : ''}, attempting fallback to simple conversion`);

      const fallbackStartTime = Date.now();
      const base64Result = await this.imageConverter.convertImageToBase64(imageUrl);
      const fallbackDuration = Date.now() - fallbackStartTime;

      if (base64Result) {
        this.logger.log(`Successfully converted image using fallback: ${imageUrl} (${fallbackDuration}ms, unoptimized)`);

        // Log metrics for monitoring
        this.logger.debug(`Fallback conversion metrics - URL: ${imageUrl}, Duration: ${fallbackDuration}ms, Size: ${base64Result.length} chars`);

        // Log fallback success for monitoring integration
        this.logger.log(`Fallback operation successful for ${imageUrl} - Strategy: basic_compression, Duration: ${fallbackDuration}ms`);

        return base64Result;
      } else {
        this.logger.error(`Fallback conversion returned empty result for image: ${imageUrl}, image will be skipped in PDF`);

        // Log detailed failure information for debugging
        this.logger.debug(`Fallback failure details - URL: ${imageUrl}, Original error: ${originalError || 'Unknown'}, Fallback duration: ${fallbackDuration}ms`);

        // Log fallback failure for monitoring integration
        this.logger.error(`Fallback operation failed for ${imageUrl} - Strategy: basic_compression, Error: Empty result`);

        return null;
      }
    } catch (fallbackError) {
      this.logger.error(`Fallback conversion failed for image ${imageUrl}: ${fallbackError.message}`, {
        originalError: originalError || 'Unknown optimization error',
        fallbackError: fallbackError.message,
        imageUrl,
        stack: fallbackError.stack
      });

      // Continue with other images even if fallback fails - this ensures PDF generation continues
      this.logger.warn(`Skipping image ${imageUrl} due to both optimization and fallback failures, PDF generation will continue without this image`);

      // Log fallback error for monitoring integration
      this.logger.error(`Fallback operation error for ${imageUrl} - Strategy: basic_compression, Error: ${fallbackError.message}`);

      return null;
    }
  }

  /**
   * Format file size in bytes to human-readable format
   * @param bytes - File size in bytes
   * @returns Formatted file size string
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Get MIME type from image format
   * @param format - Image format (jpeg, png, webp, etc.)
   * @returns MIME type string
   */
  private getMimeTypeFromFormat(format: string): string {
    switch (format.toLowerCase()) {
      case 'jpeg':
      case 'jpg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'gif':
        return 'image/gif';
      case 'bmp':
        return 'image/bmp';
      case 'tiff':
      case 'tif':
        return 'image/tiff';
      case 'svg':
        return 'image/svg+xml';
      default:
        // Default to JPEG for unknown formats
        return 'image/jpeg';
    }
  }

  /**
   * Validate and ensure proper base64 image embedding in HTML templates
   * @param htmlContent - HTML content with embedded images
   * @returns Validated HTML content with proper base64 image handling
   */
  private validateBase64ImageEmbedding(htmlContent: string): string {
    // Add error handling for base64 images that might fail to load
    const imageRegex = /<img([^>]*?)src="(data:[^"]*?)"([^>]*?)>/g;

    return htmlContent.replace(imageRegex, (match, beforeSrc, dataUrl, afterSrc) => {
      // Validate base64 data URL format
      if (!this.isValidBase64DataUrl(dataUrl)) {
        this.logger.warn(`Invalid base64 data URL detected, adding error handling: ${dataUrl.substring(0, 50)}...`);
        // Add error handling to hide broken images
        return `<img${beforeSrc}src="${dataUrl}"${afterSrc} onerror="this.style.display='none';" onload="this.style.display='block';">`;
      }

      // Add loading optimization for valid base64 images
      return `<img${beforeSrc}src="${dataUrl}"${afterSrc} onerror="this.style.display='none';" onload="this.style.display='block';">`;
    });
  }

  /**
   * Validate base64 data URL format
   * @param dataUrl - Base64 data URL to validate
   * @returns Whether the data URL is valid
   */
  private isValidBase64DataUrl(dataUrl: string): boolean {
    try {
      // Check basic data URL format
      if (!dataUrl.startsWith('data:')) {
        return false;
      }

      // Extract the base64 part
      const parts = dataUrl.split(',');
      if (parts.length !== 2) {
        return false;
      }

      const [header, base64Data] = parts;

      // Validate header format (data:image/type;base64)
      if (!header.includes('image/') || !header.includes('base64')) {
        return false;
      }

      // Validate base64 data (basic check)
      if (base64Data.length === 0) {
        return false;
      }

      // Check if base64 string contains only valid characters
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      return base64Regex.test(base64Data);
    } catch (error) {
      this.logger.warn(`Base64 validation error: ${error.message}`);
      return false;
    }
  }

}