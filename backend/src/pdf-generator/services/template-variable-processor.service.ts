import { Injectable, Logger } from '@nestjs/common';
import { OrderPDFData } from '../types/pdf.types';
import { PDFLocalizationService } from './pdf-localization.service';
import { CONSTANTS } from '@alacraft/shared';

@Injectable()
export class TemplateVariableProcessorService {
  private readonly logger = new Logger(TemplateVariableProcessorService.name);

  constructor(private localization: PDFLocalizationService) {}

  /**
   * Process all template variables in the template content
   * Following the correct processing order: loops (with conditionals inside) -> conditionals -> variables
   * @param template - Template content with placeholders
   * @param data - Order data for variable replacement
   * @param locale - Language locale
   * @returns Processed template with variables replaced
   */
  processVariables(template: string, data: OrderPDFData, locale: 'en' | 'vi'): string {
    this.logger.debug(`Processing template variables for order ${data.orderNumber} in locale ${locale}`);

    let processedTemplate = template;

    try {
      // Step 1: Process loops first (processLoops will handle conditionals within each iteration)
      processedTemplate = this.processLoops(processedTemplate, data);

      // Step 2: Process remaining conditionals (standalone conditionals not within loops)
      processedTemplate = this.processConditionals(processedTemplate, data);

      // Step 3: Process simple variables
      processedTemplate = this.processSimpleVariables(processedTemplate, data, locale);

      // Step 4: Process nested object variables
      processedTemplate = this.processNestedVariables(processedTemplate, data, locale);

      // Step 5: Process localization variables
      processedTemplate = this.processLocalizationVariables(processedTemplate, locale);

      // Step 6: Process formatted values
      processedTemplate = this.processFormattedValues(processedTemplate, data, locale);

      this.logger.debug(`Template variable processing completed for order ${data.orderNumber}`);
      return processedTemplate;
    } catch (error) {
      this.logger.error(`Template variable processing failed: ${error.message}`, {
        orderNumber: data.orderNumber,
        locale,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Template processing failed: ${error.message}`);
    }
  }

  /**
   * Process conditional rendering sections
   * @param template - Template content
   * @param data - Order data
   * @returns Template with conditionals processed
   */
  processConditionals(template: string, data: any): string {
    // Process {{#if condition}}...{{/if}} blocks with proper nesting support
    let processedTemplate = template;

    // Keep processing until no more conditionals are found
    while (processedTemplate.includes('{{#if')) {
      const beforeProcessing = processedTemplate;

      // Find and process the innermost conditional blocks first
      processedTemplate = this.processInnermostConditionals(processedTemplate, data);

      // If no changes were made, we're done (prevents infinite loop)
      if (beforeProcessing === processedTemplate) {
        break;
      }
    }

    return processedTemplate;
  }

  /**
   * Process the innermost conditional blocks (those without nested conditionals)
   * @param template - Template content
   * @param data - Data context
   * @returns Template with innermost conditionals processed
   */
  private processInnermostConditionals(template: string, data: any): string {
    // Find all conditional blocks and process the innermost ones first
    const conditionalRegex = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    let match;
    let processedTemplate = template;
    let foundMatch = false;

    // Find the first conditional that doesn't contain nested conditionals
    while ((match = conditionalRegex.exec(template)) !== null) {
      const [fullMatch, condition, content] = match;

      // Check if this conditional contains nested conditionals
      const hasNestedConditionals = content.includes('{{#if');

      if (!hasNestedConditionals) {
        // This is an innermost conditional, process it
        const shouldRender = this.evaluateCondition(condition.trim(), data);

        // Check if there's an {{else}} block within the content
        const elseMatch = content.match(/^([\s\S]*?)\{\{else\}\}([\s\S]*)$/);

        let replacement: string;
        if (elseMatch) {
          // Has {{else}} block
          const [, ifContent, elseContent] = elseMatch;
          replacement = shouldRender ? ifContent : elseContent;
        } else {
          // No {{else}} block
          replacement = shouldRender ? content : '';
        }

        processedTemplate = processedTemplate.replace(fullMatch, replacement);
        foundMatch = true;
        break; // Process one at a time to avoid regex issues
      }
    }

    // If we didn't find any innermost conditionals, try to process any conditional
    if (!foundMatch && template.includes('{{#if')) {
      conditionalRegex.lastIndex = 0; // Reset regex
      match = conditionalRegex.exec(template);
      if (match) {
        const [fullMatch, condition, content] = match;
        const shouldRender = this.evaluateCondition(condition.trim(), data);

        // Check if there's an {{else}} block within the content
        const elseMatch = content.match(/^([\s\S]*?)\{\{else\}\}([\s\S]*)$/);

        let replacement: string;
        if (elseMatch) {
          // Has {{else}} block
          const [, ifContent, elseContent] = elseMatch;
          replacement = shouldRender ? ifContent : elseContent;
        } else {
          // No {{else}} block
          replacement = shouldRender ? content : '';
        }

        processedTemplate = processedTemplate.replace(fullMatch, replacement);
      }
    }

    return processedTemplate;
  }

  /**
   * Process loop rendering sections
   * @param template - Template content
   * @param data - Order data
   * @returns Template with loops processed
   */
  processLoops(template: string, data: any): string {
    // Process {{#each array}}...{{/each}} blocks
    const loopRegex = /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;

    return template.replace(loopRegex, (match, arrayPath, content) => {
      const array = this.getNestedValue(data, arrayPath.trim());

      if (!Array.isArray(array)) {
        this.logger.warn(`Loop variable ${arrayPath} is not an array ${typeof array}`);
        return '';
      }

      return array.map((item: any, index: number) => {
        let itemContent = content;

        // Step 1: Process conditionals with the item context
        // Replace {{#if this.property}} with {{#if property}} for evaluation
        // Also need to handle the full conditional blocks properly
        let conditionalContent = itemContent;

        // Replace this.property references in conditionals for proper evaluation
        conditionalContent = conditionalContent.replace(/\{\{#if\s+this\.([^}]+)\}\}/g, '{{#if $1}}');

        // Process conditionals with item as context
        conditionalContent = this.processConditionals(conditionalContent, item);

        // Step 2: Replace remaining {{this.property}} references
        conditionalContent = conditionalContent.replace(/\{\{this\.([^}]+)\}\}/g, (_: string, prop: string) => {
          const value = this.getNestedValue(item, prop);
          return this.escapeHtml(String(value || ''));
        });

        // Step 3: Replace {{this}} with current item (for primitive arrays)
        conditionalContent = conditionalContent.replace(/\{\{this\}\}/g, this.escapeHtml(String(item)));

        // Step 4: Replace {{@index}} with current index
        conditionalContent = conditionalContent.replace(/\{\{@index\}\}/g, String(index));

        return conditionalContent;
      }).join('');
    });
  }

  /**
   * Process simple variable replacements
   * @param template - Template content
   * @param data - Order data
   * @param locale - Language locale
   * @returns Template with simple variables replaced
   */
  private processSimpleVariables(template: string, data: OrderPDFData, locale: 'en' | 'vi'): string {
    // Process simple variables like {{orderNumber}}, {{companyName}}, etc.
    const simpleVariables = {
      orderNumber: data.orderNumber,
      companyName: data.businessInfo?.companyName || CONSTANTS.BUSINESS.COMPANY.NAME[locale.toUpperCase() as 'EN' | 'VI'],
      documentTitle: this.getDocumentTitle(data, locale),
      isVietnamese: locale === 'vi',
      formattedOrderDate: this.localization.formatDate(data.orderDate, locale),
      formattedPhone: data.customerInfo.phone ? this.localization.formatPhoneNumber(data.customerInfo.phone, locale) : '',
      formattedTotal: this.localization.formatCurrency(data.pricing.total, locale),
      formattedSubtotal: this.localization.formatCurrency(data.pricing.subtotal, locale),
      formattedShippingCost: this.localization.formatCurrency(data.pricing.shippingCost, locale),
      formattedTaxAmount: data.pricing.taxAmount ? this.localization.formatCurrency(data.pricing.taxAmount, locale) : '',
      formattedDiscountAmount: data.pricing.discountAmount ? this.localization.formatCurrency(data.pricing.discountAmount, locale) : '',
      formattedPaymentStatus: this.localization.getPaymentStatusText(data.paymentMethod.status, locale),
      formattedEstimatedDelivery: data.shippingMethod.estimatedDelivery ? this.localization.formatDate(data.shippingMethod.estimatedDelivery, locale) : '',
      thankYouMessage: this.localization.translate('thankYouMessage', locale, { companyName: data.businessInfo?.companyName || CONSTANTS.BUSINESS.COMPANY.NAME[locale.toUpperCase() as 'EN' | 'VI'] })
    };

    let processedTemplate = template;

    for (const [key, value] of Object.entries(simpleVariables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      processedTemplate = processedTemplate.replace(regex, this.escapeHtml(String(value || '')));
    }

    return processedTemplate;
  }

  /**
   * Process nested object variables
   * @param template - Template content
   * @param data - Order data
   * @param locale - Language locale
   * @returns Template with nested variables replaced
   */
  private processNestedVariables(template: string, data: OrderPDFData, locale: 'en' | 'vi'): string {
    // Process nested variables like {{customerInfo.name}}, {{businessInfo.logoUrl}}, etc.
    const nestedRegex = /\{\{([^}]+\.[^}]+)\}\}/g;

    return template.replace(nestedRegex, (match, path) => {
      const value = this.getNestedValue(data, path);

      // Special handling for payment method and shipping method values that need translation
      if (path === 'paymentMethod.displayName' || path === 'paymentMethod.type') {
        return this.escapeHtml(this.translatePaymentMethod(String(value || ''), locale));
      }

      if (path === 'shippingMethod.name' || path === 'shippingMethod.type') {
        return this.escapeHtml(this.translateShippingMethod(String(value || ''), locale));
      }

      if (path === 'shippingMethod.description') {
        return this.escapeHtml(this.translateShippingDescription(String(value || ''), locale));
      }

      return this.escapeHtml(String(value || ''));
    });
  }

  /**
   * Process localization variables
   * @param template - Template content
   * @param locale - Language locale
   * @returns Template with localization variables replaced
   */
  private processLocalizationVariables(template: string, locale: 'en' | 'vi'): string {
    // Define localization mappings
    const localizationKeys = {
      orderConfirmationTitle: 'orderConfirmation',
      invoiceTitle: 'invoice',
      orderNumberLabel: 'orderNumber',
      invoiceNumberLabel: 'invoiceNumber',
      orderDateLabel: 'orderDate',
      issueDateLabel: 'issueDate',
      dueDateLabel: 'dueDate',
      customerInformationTitle: 'customerInformation',
      nameLabel: 'name',
      emailLabel: 'email',
      phoneLabel: 'phone',
      shippingAddressTitle: 'shippingAddress',
      billingAddressTitle: 'billingAddress',
      orderItemsTitle: 'orderItems',
      invoiceItemsTitle: 'orderItems', // Map to same as orderItems
      productLabel: 'product',
      skuLabel: 'sku',
      quantityLabel: 'quantity',
      unitPriceLabel: 'unitPrice',
      totalLabel: 'total',
      orderSummaryTitle: 'orderSummary',
      invoiceSummaryTitle: 'orderSummary', // Map to same as orderSummary
      subtotalLabel: 'subtotal',
      shippingLabel: 'shipping',
      taxLabel: 'tax',
      discountLabel: 'discount',
      totalAmountDueLabel: 'grandTotal', // Map to grandTotal which exists
      paymentInformationTitle: 'paymentInformation',
      paymentMethodLabel: 'paymentMethod',
      paymentStatusLabel: 'paymentStatus',
      paymentDetailsLabel: 'paymentDetails',
      paymentInstructionsLabel: 'paymentInstructions',
      paymentQRCodeLabel: 'paymentQRCode',
      shippingInformationTitle: 'shippingInformation',
      shippingMethodLabel: 'shippingMethod',
      descriptionLabel: 'description',
      estimatedDeliveryLabel: 'estimatedDelivery',
      trackingNumberLabel: 'trackingNumber',
      carrierLabel: 'carrier',
      termsAndConditionsTitle: 'termsAndConditions',
      returnPolicyTitle: 'returnPolicy',
      contactUsLabel: 'customerService', // Map to customerService which exists
      websiteLabel: 'website'
    };

    let processedTemplate = template;

    for (const [templateKey, translationKey] of Object.entries(localizationKeys)) {
      const regex = new RegExp(`\\{\\{${templateKey}\\}\\}`, 'g');
      const translatedValue = this.localization.translate(translationKey, locale);
      processedTemplate = processedTemplate.replace(regex, this.escapeHtml(translatedValue));
    }

    return processedTemplate;
  }

  /**
   * Process formatted values for items and addresses
   * @param template - Template content
   * @param data - Order data
   * @param locale - Language locale
   * @returns Template with formatted values replaced
   */
  private processFormattedValues(template: string, data: OrderPDFData, locale: 'en' | 'vi'): string {
    let processedTemplate = template;

    // Process formatted address lines
    const formattedShippingAddressLines = this.localization.formatAddress(data.shippingAddress, locale).split('\n');
    const formattedBillingAddressLines = this.localization.formatAddress(data.billingAddress, locale).split('\n');
    // Replace address line arrays
    processedTemplate = processedTemplate.replace(/\{\{formattedShippingAddressLines\}\}/g,
      formattedShippingAddressLines.map(line => `<p>${this.escapeHtml(line)}</p>`).join(''));
    processedTemplate = processedTemplate.replace(/\{\{formattedBillingAddressLines\}\}/g,
      formattedBillingAddressLines.map(line => `<p>${this.escapeHtml(line)}</p>`).join(''));

    // Process items with formatted prices
    const itemsWithFormattedPrices = data.items.map(item => ({
      ...item,
      formattedUnitPrice: this.localization.formatCurrency(item.unitPrice, locale),
      formattedTotalPrice: this.localization.formatCurrency(item.totalPrice, locale)
    }));

    // Replace items array in loops (this is handled by processLoops, but we ensure the data is available)
    // The actual replacement happens in processLoops method

    return processedTemplate;
  }

  /**
   * Evaluate condition for conditional rendering
   * @param condition - Condition string
   * @param data - Data context
   * @returns Whether condition is true
   */
  private evaluateCondition(condition: string, data: any): boolean {
    try {
      // Handle simple existence checks
      if (condition.includes('.')) {
        const value = this.getNestedValue(data, condition);
        return this.isTruthy(value);
      }

      // Handle direct property checks
      const value = data[condition];
      return this.isTruthy(value);
    } catch (error) {
      this.logger.warn(`Failed to evaluate condition "${condition}": ${error.message}`);
      return false;
    }
  }

  /**
   * Check if value is truthy for template conditions
   * @param value - Value to check
   * @returns Whether value is truthy
   */
  private isTruthy(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.length > 0;
    if (typeof value === 'number') return value !== 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return Boolean(value);
  }

  /**
   * Get nested value from object using dot notation
   * @param obj - Object to get value from
   * @param path - Dot notation path
   * @returns Value at path or undefined
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Escape HTML characters for security
   * @param value - String value to escape
   * @returns HTML-escaped string
   */
  escapeHtml(value: string): string {
    if (typeof value !== 'string') {
      return String(value || '');
    }

    const htmlEscapes: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };

    return value.replace(/[&<>"'/]/g, (match) => htmlEscapes[match]);
  }

  /**
   * Format value based on type and locale
   * @param value - Value to format
   * @param type - Format type
   * @param locale - Language locale
   * @returns Formatted value
   */
  formatValue(value: any, type: 'currency' | 'date' | 'text', locale: 'en' | 'vi'): string {
    try {
      switch (type) {
        case 'currency':
          return this.localization.formatCurrency(Number(value), locale);
        case 'date':
          return this.localization.formatDate(String(value), locale);
        case 'text':
        default:
          return this.escapeHtml(String(value || ''));
      }
    } catch (error) {
      this.logger.warn(`Failed to format value "${value}" as ${type}: ${error.message}`);
      return this.escapeHtml(String(value || ''));
    }
  }

  /**
   * Get document title based on template type
   * @param data - Order data
   * @param locale - Language locale
   * @returns Document title
   */
  private getDocumentTitle(data: OrderPDFData, locale: 'en' | 'vi'): string {
    const isVietnamese = locale === 'vi';
    return isVietnamese ? `Đơn hàng ${data.orderNumber}` : `Order ${data.orderNumber}`;
  }

  /**
   * Process partial templates (for CSS inclusion)
   * @param template - Template content
   * @param partials - Map of partial names to content
   * @returns Template with partials processed
   */
  processPartials(template: string, partials: Map<string, string>): string {
    // Process {{> partialName}} includes
    const partialRegex = /\{\{>\s*([^}]+)\s*\}\}/g;

    return template.replace(partialRegex, (match, partialName) => {
      const partialContent = partials.get(partialName.trim());
      if (!partialContent) {
        this.logger.warn(`Partial "${partialName}" not found`);
        return '';
      }
      return partialContent;
    });
  }

  /**
   * Translate payment method values
   * @param paymentMethod - Payment method value
   * @param locale - Language locale
   * @returns Translated payment method
   */
  private translatePaymentMethod(paymentMethod: string, locale: 'en' | 'vi'): string {
    // Convert payment method to translation key format
    const normalizedMethod = paymentMethod.toLowerCase().replace(/\s+/g, '');

    // Map common payment method values to translation keys
    const paymentMethodMap: { [key: string]: string } = {
      'banktransfer': 'paymentMethod_bankTransfer',
      'bank_transfer': 'paymentMethod_bankTransfer',
      'cashondelivery': 'paymentMethod_cashOnDelivery',
      'cash_on_delivery': 'paymentMethod_cashOnDelivery',
      'qrcode': 'paymentMethod_qrCode',
      'qr_code': 'paymentMethod_qrCode',
      'standard': 'paymentMethod_standard'
    };

    const translationKey = paymentMethodMap[normalizedMethod];
    if (translationKey) {
      return this.localization.translate(translationKey, locale);
    }

    // If no translation found, return original value
    return paymentMethod;
  }

  /**
   * Translate shipping method values using database shipping methods
   * @deprecated Use ShippingService.getShippingMethodDetails() or database shipping_methods table instead
   * @param shippingMethod - Shipping method value
   * @param locale - Language locale
   * @returns Translated shipping method
   */
  private translateShippingMethod(shippingMethod: string, locale: 'en' | 'vi'): string {
    // For PDF generation, we use a basic fallback since we can't easily make this async
    // Applications should use ShippingService.getShippingMethodDetails() for proper localization
    // from the shipping_methods database table

    this.logger.debug(`Using fallback shipping method translation for PDF generation: '${shippingMethod}'`, {
      shippingMethod,
      locale,
      note: 'Use ShippingService.getShippingMethodDetails() for database-driven translations'
    });

    if (!shippingMethod) return shippingMethod;

    // Return original method name as fallback
    // Applications should use ShippingService.getShippingMethodDetails() for proper localization
    return shippingMethod;
  }

  /**
   * Translate shipping method descriptions
   * @deprecated Use ShippingService.getShippingMethodDetails() or database shipping_methods table instead
   * @param description - Shipping description value
   * @param locale - Language locale
   * @returns Translated shipping description
   */
  private translateShippingDescription(description: string, locale: 'en' | 'vi'): string {
    // For PDF generation, we use a basic fallback since we can't easily make this async
    // Applications should use ShippingService.getShippingMethodDetails() for proper localization
    // from the shipping_methods database table

    if (!description) return description;

    // Return basic fallback description
    // Applications should use ShippingService.getShippingMethodDetails() for proper localization
    return locale === 'vi' ? 'Giao hàng tiêu chuẩn (3-7 ngày làm việc)' : 'Standard delivery (3-7 business days)';
  }
}