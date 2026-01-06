import { Injectable } from '@nestjs/common';

/**
 * PDF Localization Service
 *
 * Provides translation and localization support for PDF content generation.
 * Supports English and Vietnamese languages with locale-specific formatting
 * for dates, currency, addresses, and other content elements.
 */
@Injectable()
export class PDFLocalizationService {
  private readonly translations = {
    en: {
      // Document titles
      orderConfirmation: 'ORDER CONFIRMATION',
      invoice: 'INVOICE',

      // Order information
      orderNumber: 'Order Number',
      orderDate: 'Order Date',
      invoiceNumber: 'Invoice Number',
      issueDate: 'Issue Date',

      // Customer information
      customerInformation: 'Customer Information',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',

      // Address information
      shippingAddress: 'Shipping Address',
      billingAddress: 'Billing Address',

      // Order items
      orderItems: 'Order Items',
      product: 'Product',
      sku: 'SKU',
      quantity: 'Quantity',
      unitPrice: 'Unit Price',
      total: 'Total',

      // Order summary
      orderSummary: 'Order Summary',
      subtotal: 'Subtotal',
      shipping: 'Shipping',
      tax: 'Tax',
      discount: 'Discount',
      grandTotal: 'Total',

      // Payment information
      paymentInformation: 'Payment Information',
      paymentMethod: 'Method',
      paymentStatus: 'Status',
      paymentDetails: 'Details',
      paymentInstructions: 'Instructions',
      paymentQRCode: 'Payment QR Code',

      // Shipping information
      shippingInformation: 'Shipping Information',
      shippingMethod: 'Method',
      description: 'Description',
      estimatedDelivery: 'Estimated Delivery',
      trackingNumber: 'Tracking Number',
      carrier: 'Carrier',

      // Payment statuses
      paymentStatus_pending: 'Pending',
      paymentStatus_completed: 'Completed',
      paymentStatus_failed: 'Failed',
      paymentStatus_paid: 'Paid',
      paymentStatus_unpaid: 'Unpaid',
      paymentStatus_processing: 'Processing',

      // Payment methods
      paymentMethod_bankTransfer: 'Bank Transfer',
      paymentMethod_cashOnDelivery: 'Cash on Delivery',
      paymentMethod_qrCode: 'QR Code Payment',
      paymentMethod_standard: 'Standard',

      // Shipping methods
      shippingMethod_standard: 'Standard',
      shippingMethod_express: 'Express',
      shippingMethod_overnight: 'Overnight',
      shippingMethod_economy: 'Economy',

      // Shipping descriptions
      shippingDescription_standard: 'Standard Delivery (3-5 business days)',
      shippingDescription_express: 'Express Delivery (1-2 business days)',
      shippingDescription_overnight: 'Overnight Delivery (next business day)',
      shippingDescription_economy: 'Economy Delivery (5-7 business days)',

      // Business information
      termsAndConditions: 'Terms and Conditions',
      returnPolicy: 'Return Policy',
      customerService: 'Customer Service',
      contactUs: 'Contact Us',
      website: 'Website',

      // Footer messages
      thankYouMessage: 'Thank you for your purchase from {companyName}!',
      contactForQuestions: 'If you have any questions, please contact us.',

      // Bank transfer instructions
      bankTransferInstructions: 'Please transfer payment to {accountName} at {bankName}. Account number: {accountNumber}. Please include your order number in the transfer description.',
      bankTransferInstructionsSimple: 'Please contact us for bank transfer details.',

      // Date and time formatting
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',

      // Currency formatting
      currencySymbol: '₫',
      currencyPosition: 'after',

      // Address formatting
      addressFormat: '{addressLine1}\n{addressLine2}\n{city}, {state} {postalCode}\n{country}',
      phoneLabel: 'Phone',
    },
    vi: {
      // Document titles
      orderConfirmation: 'XÁC NHẬN ĐƠN HÀNG',
      invoice: 'HÓA ĐƠN',

      // Order information
      orderNumber: 'Số đơn hàng',
      orderDate: 'Ngày đặt hàng',
      invoiceNumber: 'Số hóa đơn',
      issueDate: 'Ngày phát hành',

      // Customer information
      customerInformation: 'Thông tin khách hàng',
      name: 'Tên',
      email: 'Email',
      phone: 'Điện thoại',

      // Address information
      shippingAddress: 'Địa chỉ giao hàng',
      billingAddress: 'Địa chỉ thanh toán',

      // Order items
      orderItems: 'Chi tiết đơn hàng',
      product: 'Sản phẩm',
      sku: 'SKU',
      quantity: 'Số lượng',
      unitPrice: 'Đơn giá',
      total: 'Thành tiền',

      // Order summary
      orderSummary: 'Tổng kết đơn hàng',
      subtotal: 'Tạm tính',
      shipping: 'Phí vận chuyển',
      tax: 'Thuế',
      discount: 'Giảm giá',
      grandTotal: 'Tổng cộng',

      // Payment information
      paymentInformation: 'Thông tin thanh toán',
      paymentMethod: 'Phương thức',
      paymentStatus: 'Trạng thái',
      paymentDetails: 'Chi tiết',
      paymentInstructions: 'Hướng dẫn',
      paymentQRCode: 'Mã QR thanh toán',

      // Shipping information
      shippingInformation: 'Thông tin vận chuyển',
      shippingMethod: 'Phương thức',
      description: 'Mô tả',
      estimatedDelivery: 'Dự kiến giao hàng',
      trackingNumber: 'Mã vận đơn',
      carrier: 'Đơn vị vận chuyển',

      // Payment statuses
      paymentStatus_pending: 'Đang chờ',
      paymentStatus_completed: 'Hoàn thành',
      paymentStatus_failed: 'Thất bại',
      paymentStatus_paid: 'Đã thanh toán',
      paymentStatus_unpaid: 'Chưa thanh toán',
      paymentStatus_processing: 'Đang xử lý',

      // Payment methods
      paymentMethod_bankTransfer: 'Chuyển khoản ngân hàng',
      paymentMethod_cashOnDelivery: 'Thanh toán khi nhận hàng',
      paymentMethod_qrCode: 'Thanh toán QR Code',
      paymentMethod_standard: 'Tiêu chuẩn',

      // Shipping methods
      shippingMethod_standard: 'Tiêu chuẩn',
      shippingMethod_express: 'Nhanh',
      shippingMethod_overnight: 'Qua đêm',
      shippingMethod_economy: 'Tiết kiệm',

      // Shipping descriptions
      shippingDescription_standard: 'Giao hàng tiêu chuẩn (3-5 ngày làm việc)',
      shippingDescription_express: 'Giao hàng nhanh (1-2 ngày làm việc)',
      shippingDescription_overnight: 'Giao hàng qua đêm (ngày làm việc tiếp theo)',
      shippingDescription_economy: 'Giao hàng tiết kiệm (5-7 ngày làm việc)',

      // Business information
      termsAndConditions: 'Điều khoản và điều kiện',
      returnPolicy: 'Chính sách đổi trả',
      customerService: 'Dịch vụ khách hàng',
      contactUs: 'Liên hệ',
      website: 'Website',

      // Footer messages
      thankYouMessage: 'Cảm ơn bạn đã mua hàng tại {companyName}!',
      contactForQuestions: 'Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.',

      // Bank transfer instructions
      bankTransferInstructions: 'Vui lòng chuyển khoản đến tài khoản {accountName} tại {bankName}. Số tài khoản: {accountNumber}. Vui lòng ghi rõ mã đơn hàng trong nội dung chuyển khoản.',
      bankTransferInstructionsSimple: 'Vui lòng liên hệ với chúng tôi để biết thông tin chuyển khoản.',

      // Date and time formatting
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',

      // Currency formatting
      currencySymbol: '₫',
      currencyPosition: 'after',

      // Address formatting
      addressFormat: '{addressLine1}\n{addressLine2}\n{city}, {state} {postalCode}\n{country}',
      phoneLabel: 'ĐT',
    },
  };

  /**
   * Get translated text for a given key and locale
   * @param key - Translation key
   * @param locale - Language locale ('en' | 'vi')
   * @param params - Optional parameters for string interpolation
   * @returns Translated text
   */
  translate(key: string, locale: 'en' | 'vi', params?: Record<string, string>): string {
    const translations = this.translations[locale] || this.translations.en;
    let text = (translations as any)[key] || key;

    // Handle string interpolation
    if (params) {
      Object.keys(params).forEach(param => {
        text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
      });
    }

    return text;
  }

  /**
   * Get translated text for template placeholders
   * @param key - Translation key
   * @param locale - Language locale ('en' | 'vi')
   * @param params - Optional parameters for string interpolation
   * @returns Translated text formatted for template use
   */
  translateForTemplate(key: string, locale: 'en' | 'vi', params?: Record<string, string>): string {
    return this.translate(key, locale, params);
  }

  /**
   * Get all template translations for a specific locale
   * @param locale - Language locale
   * @returns All translations formatted for template use
   */
  getTemplateTranslations(locale: 'en' | 'vi'): Record<string, string> {
    const translations = this.translations[locale] || this.translations.en;
    const templateTranslations: Record<string, string> = {};

    // Convert all translations to template-friendly format
    Object.keys(translations).forEach(key => {
      templateTranslations[key] = (translations as any)[key];
    });

    return templateTranslations;
  }

  /**
   * Extract translatable text from template content
   * @param templateContent - Template HTML content
   * @returns Array of translation keys found in template
   */
  extractTranslationKeysFromTemplate(templateContent: string): string[] {
    const translationKeys: string[] = [];

    // Match template translation placeholders like {{t 'translationKey'}}
    const translationRegex = /\{\{t\s+['"]([^'"]+)['"]\s*\}\}/g;
    let match;

    while ((match = translationRegex.exec(templateContent)) !== null) {
      const key = match[1];
      if (!translationKeys.includes(key)) {
        translationKeys.push(key);
      }
    }

    return translationKeys;
  }

  /**
   * Validate that all translation keys in template exist
   * @param templateContent - Template HTML content
   * @param locale - Language locale to validate against
   * @returns Validation result with missing keys
   */
  validateTemplateTranslations(templateContent: string, locale: 'en' | 'vi'): {
    isValid: boolean;
    missingKeys: string[];
  } {
    const extractedKeys = this.extractTranslationKeysFromTemplate(templateContent);
    const translations = this.translations[locale] || this.translations.en;
    const missingKeys: string[] = [];

    extractedKeys.forEach(key => {
      if (!(translations as any)[key]) {
        missingKeys.push(key);
      }
    });

    return {
      isValid: missingKeys.length === 0,
      missingKeys,
    };
  }

  /**
   * Process template content and replace translation placeholders
   * @param templateContent - Template HTML content with translation placeholders
   * @param locale - Language locale
   * @param params - Optional global parameters for all translations
   * @returns Template content with translations applied
   */
  processTemplateTranslations(
    templateContent: string,
    locale: 'en' | 'vi',
    params?: Record<string, string>
  ): string {
    // Replace translation placeholders like {{t 'translationKey'}}
    return templateContent.replace(/\{\{t\s+['"]([^'"]+)['"]\s*\}\}/g, (match, key) => {
      return this.translate(key, locale, params);
    });
  }

  /**
   * Get locale-specific formatting functions for templates
   * @param locale - Language locale
   * @returns Object with formatting functions
   */
  getTemplateFormatters(locale: 'en' | 'vi'): {
    formatCurrency: (amount: number) => string;
    formatDate: (date: string | Date) => string;
    formatPhoneNumber: (phone: string) => string;
    formatAddress: (address: any) => string;
  } {
    return {
      formatCurrency: (amount: number) => this.formatCurrency(amount, locale),
      formatDate: (date: string | Date) => this.formatDate(date, locale),
      formatPhoneNumber: (phone: string) => this.formatPhoneNumber(phone, locale),
      formatAddress: (address: any) => this.formatAddress(address, locale),
    };
  }

  /**
   * Support dynamic locale switching in templates
   * @param templateContent - Template content with locale-specific sections
   * @param locale - Target locale
   * @returns Template content with appropriate locale sections
   */
  processLocaleConditionals(templateContent: string, locale: 'en' | 'vi'): string {
    // Process locale-specific conditional blocks like {{#if locale_en}}...{{/if}}
    const localeConditionalRegex = /\{\{#if\s+locale_(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;

    return templateContent.replace(localeConditionalRegex, (match, conditionLocale, content) => {
      return conditionLocale === locale ? content : '';
    });
  }

  /**
   * Format currency amount according to locale
   * @param amount - Numeric amount
   * @param locale - Language locale
   * @returns Formatted currency string
   */
  formatCurrency(amount: number, locale: 'en' | 'vi'): string {
    // Use Vietnamese number formatting for all locales with consistent "amount ₫" pattern
    // This matches the email template service formatting for cross-service consistency
    const formattedAmount = amount.toLocaleString('vi-VN');
    return `${formattedAmount} ₫`;
  }

  /**
   * Format date according to locale
   * @param date - Date string or Date object
   * @param locale - Language locale
   * @returns Formatted date string
   */
  formatDate(date: string | Date, locale: 'en' | 'vi'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (locale === 'vi') {
      // Vietnamese format: DD/MM/YYYY
      return dateObj.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } else {
      // English format: MM/DD/YYYY
      return dateObj.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      });
    }
  }

  /**
   * Format address according to locale conventions
   * @param address - Address data object
   * @param locale - Language locale
   * @returns Formatted address string
   */
  formatAddress(address: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  }, locale: 'en' | 'vi'): string {
    const translations = this.translations[locale] || this.translations.en;

    let formattedAddress = `${address.fullName}\n`;
    formattedAddress += `${address.addressLine1}\n`;

    if (address.addressLine2) {
      formattedAddress += `${address.addressLine2}\n`;
    }

    formattedAddress += `${address.city}, ${address.state} ${address.postalCode}\n`;
    formattedAddress += `${address.country}`;

    if (address.phone) {
      formattedAddress += `\n${translations.phoneLabel}: ${address.phone}`;
    }

    return formattedAddress;
  }

  /**
   * Format phone number according to locale
   * @param phone - Phone number string
   * @param locale - Language locale
   * @returns Formatted phone number
   */
  formatPhoneNumber(phone: string, locale: 'en' | 'vi'): string {
    if (!phone) return '';

    // Basic phone number formatting
    // For Vietnamese numbers, ensure proper formatting
    if (locale === 'vi' && phone.startsWith('0')) {
      return phone.replace(/^0/, '+84 ');
    }

    return phone;
  }

  /**
   * Get payment status text in the appropriate locale
   * @param status - Payment status
   * @param locale - Language locale
   * @returns Localized status text
   */
  getPaymentStatusText(status: string, locale: 'en' | 'vi'): string {
    const key = `paymentStatus_${status.toLowerCase()}`;
    return this.translate(key, locale);
  }

  /**
   * Generate bank transfer instructions with proper localization
   * @param bankSettings - Bank account settings
   * @param locale - Language locale
   * @returns Localized bank transfer instructions
   */
  generateBankTransferInstructions(
    bankSettings: {
      accountName?: string;
      accountNumber?: string;
      bankName?: string;
    },
    locale: 'en' | 'vi'
  ): string {
    if (!bankSettings.accountName || !bankSettings.accountNumber) {
      return this.translate('bankTransferInstructionsSimple', locale);
    }

    return this.translate('bankTransferInstructions', locale, {
      accountName: bankSettings.accountName,
      accountNumber: bankSettings.accountNumber,
      bankName: bankSettings.bankName || (locale === 'vi' ? 'ngân hàng' : 'bank'),
    });
  }

  /**
   * Get all translations for a specific locale
   * @param locale - Language locale
   * @returns All translations for the locale
   */
  getAllTranslations(locale: 'en' | 'vi'): Record<string, string> {
    return (this.translations[locale] || this.translations.en) as Record<string, string>;
  }

  /**
   * Check if a locale is supported
   * @param locale - Language locale to check
   * @returns True if locale is supported
   */
  isLocaleSupported(locale: string): locale is 'en' | 'vi' {
    return locale === 'en' || locale === 'vi';
  }

  /**
   * Get default locale
   * @returns Default locale ('en')
   */
  getDefaultLocale(): 'en' | 'vi' {
    return 'en';
  }

  /**
   * Normalize locale string to supported format
   * @param locale - Input locale string
   * @returns Normalized locale or default
   */
  normalizeLocale(locale: string): 'en' | 'vi' {
    const normalized = locale.toLowerCase().substring(0, 2);
    return this.isLocaleSupported(normalized) ? normalized : this.getDefaultLocale();
  }

  /**
   * Validate that all existing translations work with template system
   * @returns Validation result
   */
  validateTemplateCompatibility(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check that all translation keys are template-safe
    ['en', 'vi'].forEach(locale => {
      const translations = this.translations[locale as 'en' | 'vi'];
      Object.keys(translations).forEach(key => {
        const value = (translations as any)[key];

        // Check for potential template conflicts
        if (typeof value === 'string') {
          // Check for unescaped template syntax that might conflict
          if (value.includes('{{') && !value.includes('}}')) {
            issues.push(`Translation key '${key}' in locale '${locale}' has unmatched template syntax`);
          }

          // Check for HTML that might need escaping in templates
          if (value.includes('<') && value.includes('>')) {
            // This is informational, not necessarily an error
            // issues.push(`Translation key '${key}' in locale '${locale}' contains HTML that may need template escaping`);
          }
        }
      });
    });

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Get template-safe version of all translations
   * @param locale - Language locale
   * @returns Template-safe translations with HTML escaped where needed
   */
  getTemplateSafeTranslations(locale: 'en' | 'vi'): Record<string, string> {
    const translations = this.translations[locale] || this.translations.en;
    const safeTranslations: Record<string, string> = {};

    Object.keys(translations).forEach(key => {
      const value = (translations as any)[key];
      if (typeof value === 'string') {
        // For now, return as-is since our templates handle HTML content
        // In the future, we might want to escape HTML based on context
        safeTranslations[key] = value;
      }
    });

    return safeTranslations;
  }
}