import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

export type SupportedLocale = 'en' | 'vi';

export interface EmailTranslations {
  [key: string]: {
    en: string;
    vi: string;
  };
}

/**
 * Email Translation Service
 *
 * Provides locale-specific translations for email templates by loading
 * translations from the frontend translations.json file and providing
 * email-specific translation methods.
 */
@Injectable()
export class EmailTranslationService {
  private readonly logger = new Logger(EmailTranslationService.name);
  private translationsCache: EmailTranslations | null = null;
  private readonly translationsPath: string;

  constructor() {
    // Path to frontend translations file (relative to backend directory)
    this.translationsPath = resolve(process.cwd(), '../frontend/locales/translations.json');
    this.loadTranslations();
  }

  /**
   * Load translations from the frontend translations.json file
   */
  private async loadTranslations(): Promise<void> {
    try {
      if (!existsSync(this.translationsPath)) {
        this.logger.warn(`Translations file not found at: ${this.translationsPath}`);
        this.translationsCache = {};
        return;
      }

      const translationsContent = await fs.readFile(this.translationsPath, 'utf-8');
      const fullTranslations = JSON.parse(translationsContent);

      // Extract email-specific translations
      this.translationsCache = this.extractEmailTranslations(fullTranslations);
      this.logger.log('Email translations loaded successfully');
    } catch (error) {
      this.logger.error(`Failed to load translations: ${error.message}`);
      this.translationsCache = {};
    }
  }

  /**
   * Extract email-specific translations from the full translations object
   */
  private extractEmailTranslations(fullTranslations: any): EmailTranslations {
    const emailTranslations: EmailTranslations = {};

    // Extract email section
    if (fullTranslations.email) {
      this.flattenTranslations(fullTranslations.email, 'email', emailTranslations);
    }

    // Extract common translations that might be used in emails
    const commonSections = ['common', 'account', 'orders', 'products', 'checkout'];
    for (const section of commonSections) {
      if (fullTranslations[section]) {
        this.flattenTranslations(fullTranslations[section], section, emailTranslations);
      }
    }

    return emailTranslations;
  }

  /**
   * Flatten nested translation object into dot notation keys
   */
  private flattenTranslations(obj: any, prefix: string, result: EmailTranslations): void {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (obj[key] && typeof obj[key] === 'object') {
          // Check if this is a translation object with en/vi keys
          if (obj[key].en && obj[key].vi) {
            result[newKey] = {
              en: obj[key].en,
              vi: obj[key].vi
            };
          } else {
            // Recursively flatten nested objects
            this.flattenTranslations(obj[key], newKey, result);
          }
        }
      }
    }
  }

  /**
   * Get translation for a specific key and locale
   */
  getTranslation(key: string, locale: SupportedLocale = 'en'): string {
    if (!this.translationsCache) {
      this.logger.warn('Translations not loaded, returning key as fallback');
      return key;
    }

    const translation = this.translationsCache[key];
    if (!translation) {
      this.logger.debug(`Translation not found for key: ${key}`);
      return key;
    }

    return translation[locale] || translation.en || key;
  }

  /**
   * Get all translations for a specific locale
   */
  getAllTranslations(locale: SupportedLocale = 'en'): Record<string, string> {
    if (!this.translationsCache) {
      return {};
    }

    const result: Record<string, string> = {};
    for (const [key, translation] of Object.entries(this.translationsCache)) {
      result[key] = translation[locale] || translation.en || key;
    }

    return result;
  }

  /**
   * Get translations for email template context
   * Returns commonly used email translations in a flat structure
   */
  getEmailTemplateTranslations(locale: SupportedLocale = 'en'): Record<string, string> {
    const commonEmailKeys = [
      // Order confirmation
      'email.orderConfirmation.subject',
      'email.orderConfirmation.greeting',
      'email.orderConfirmation.thankYou',
      'email.orderConfirmation.orderReceived',
      'email.orderConfirmation.orderDetails',
      'email.orderConfirmation.orderNumber',
      'email.orderConfirmation.orderDate',
      'email.orderConfirmation.items',
      'email.orderConfirmation.quantity',
      'email.orderConfirmation.price',
      'email.orderConfirmation.total',
      'email.orderConfirmation.subtotal',
      'email.orderConfirmation.shipping',
      'email.orderConfirmation.tax',
      'email.orderConfirmation.discount',
      'email.orderConfirmation.grandTotal',
      'email.orderConfirmation.shippingAddress',
      'email.orderConfirmation.paymentMethod',
      'email.orderConfirmation.contactUs',
      'email.orderConfirmation.trackOrder',

      // Admin order notification
      'email.adminOrderNotification.subject',
      'email.adminOrderNotification.newOrder',
      'email.adminOrderNotification.orderReceived',
      'email.adminOrderNotification.customerInformation',
      'email.adminOrderNotification.customerName',
      'email.adminOrderNotification.customerEmail',
      'email.adminOrderNotification.customerPhone',

      // Order status update
      'email.orderStatusUpdate.subject',
      'email.orderStatusUpdate.greeting',
      'email.orderStatusUpdate.statusUpdated',
      'email.orderStatusUpdate.orderNumber',
      'email.orderStatusUpdate.newStatus',
      'email.orderStatusUpdate.trackingNumber',
      'email.orderStatusUpdate.trackYourOrder',
      'email.orderStatusUpdate.contactUs',

      // Order statuses
      'email.orderStatus.pending',
      'email.orderStatus.processing',
      'email.orderStatus.shipped',
      'email.orderStatus.delivered',
      'email.orderStatus.cancelled',
      'email.orderStatus.refunded',

      // Common
      'common.loading',
      'common.error',
      'common.success',
      'common.cancel',
      'common.save',
      'common.edit',
      'common.delete',
      'common.view',
      'common.back',
      'common.next',
      'common.previous',
      'common.close',
      'common.confirm',
      'common.yes',
      'common.no',

      // Layout and branding
      'layout.header.companyName',
      'layout.footer.copyright',
      'email.common.signature'
    ];

    const translations: Record<string, string> = {};

    for (const key of commonEmailKeys) {
      const translation = this.getTranslation(key, locale);
      // Use the last part of the key as the template variable name
      const templateKey = key.split('.').pop() || key;
      translations[templateKey] = translation;
    }

    // Add specific translations that templates expect with exact key names
    // Admin order notification template translations
    translations.subject = this.getTranslation('email.adminOrderNotification.subject', locale);
    translations.title = this.getTranslation('email.adminOrderNotification.newOrder', locale);
    translations.greeting = this.getTranslation('email.adminOrderNotification.greeting', locale);
    translations.orderDetails = this.getTranslation('email.adminOrderNotification.orderDetails', locale);
    translations.orderNumber = this.getTranslation('email.adminOrderNotification.orderNumber', locale);
    translations.orderDate = this.getTranslation('email.adminOrderNotification.orderDate', locale);
    translations.customerInfo = this.getTranslation('email.adminOrderNotification.customerInformation', locale);
    translations.name = this.getTranslation('email.adminOrderNotification.customerName', locale);
    translations.email = this.getTranslation('email.adminOrderNotification.customerEmail', locale);
    translations.phone = this.getTranslation('email.adminOrderNotification.customerPhone', locale);
    translations.items = this.getTranslation('email.adminOrderNotification.items', locale);
    translations.product = this.getTranslation('email.adminOrderNotification.product', locale);
    translations.sku = this.getTranslation('email.adminOrderNotification.sku', locale);
    translations.quantity = this.getTranslation('email.adminOrderNotification.quantity', locale);
    translations.price = this.getTranslation('email.adminOrderNotification.price', locale);
    translations.total = this.getTranslation('email.adminOrderNotification.total', locale);
    translations.subtotal = this.getTranslation('email.adminOrderNotification.subtotal', locale);
    translations.shipping = this.getTranslation('email.adminOrderNotification.shipping', locale);
    translations.tax = this.getTranslation('email.adminOrderNotification.tax', locale);
    translations.discount = this.getTranslation('email.adminOrderNotification.discount', locale);
    translations.grandTotal = this.getTranslation('email.adminOrderNotification.grandTotal', locale);
    translations.shippingAddress = this.getTranslation('email.adminOrderNotification.shippingAddress', locale);
    translations.billingAddress = this.getTranslation('email.adminOrderNotification.billingAddress', locale);
    translations.paymentInfo = this.getTranslation('email.adminOrderNotification.paymentInfo', locale);
    translations.paymentMethod = this.getTranslation('email.adminOrderNotification.paymentMethod', locale);
    translations.paymentStatus = this.getTranslation('email.adminOrderNotification.paymentStatus', locale);
    translations.customerNotes = this.getTranslation('email.adminOrderNotification.customerNotes', locale);
    translations.viewOrder = this.getTranslation('email.adminOrderNotification.viewOrder', locale);
    translations.processOrder = this.getTranslation('email.adminOrderNotification.processOrder', locale);
    translations.urgent = this.getTranslation('email.adminOrderNotification.urgent', locale);
    translations.normal = this.getTranslation('email.adminOrderNotification.normal', locale);
    translations.skipToContent = this.getTranslation('common.skipToContent', locale);
    translations.emailLabel = this.getTranslation('email.common.emailLabel', locale);
    translations.signature = this.getTranslation('email.common.signature', locale);

    // Add special handling for layout-specific translations
    translations.companyName = this.getTranslation('layout.header.companyName', locale);
    translations.copyright = this.getTranslation('layout.footer.copyright', locale);

    // Fallback values for missing admin order notification translations
    if (!translations.subject) translations.subject = locale === 'vi' ? 'Đơn hàng mới' : 'New Order';
    if (!translations.title) translations.title = locale === 'vi' ? 'Đơn hàng mới đã được đặt' : 'New Order Received';
    if (!translations.greeting) translations.greeting = locale === 'vi' ? 'Xin chào' : 'Hello';
    if (!translations.orderDetails) translations.orderDetails = locale === 'vi' ? 'Chi tiết đơn hàng' : 'Order Details';
    if (!translations.orderNumber) translations.orderNumber = locale === 'vi' ? 'Mã đơn hàng' : 'Order Number';
    if (!translations.orderDate) translations.orderDate = locale === 'vi' ? 'Ngày đặt hàng' : 'Order Date';
    if (!translations.customerInfo) translations.customerInfo = locale === 'vi' ? 'Thông tin khách hàng' : 'Customer Information';
    if (!translations.name) translations.name = locale === 'vi' ? 'Tên' : 'Name';
    if (!translations.email) translations.email = locale === 'vi' ? 'Email' : 'Email';
    if (!translations.phone) translations.phone = locale === 'vi' ? 'Số điện thoại' : 'Phone';
    if (!translations.items) translations.items = locale === 'vi' ? 'Sản phẩm' : 'Items';
    if (!translations.product) translations.product = locale === 'vi' ? 'Sản phẩm' : 'Product';
    if (!translations.sku) translations.sku = locale === 'vi' ? 'Mã sản phẩm' : 'SKU';
    if (!translations.quantity) translations.quantity = locale === 'vi' ? 'Số lượng' : 'Quantity';
    if (!translations.price) translations.price = locale === 'vi' ? 'Giá' : 'Price';
    if (!translations.total) translations.total = locale === 'vi' ? 'Tổng' : 'Total';
    if (!translations.subtotal) translations.subtotal = locale === 'vi' ? 'Tạm tính' : 'Subtotal';
    if (!translations.shipping) translations.shipping = locale === 'vi' ? 'Phí vận chuyển' : 'Shipping';
    if (!translations.tax) translations.tax = locale === 'vi' ? 'Thuế' : 'Tax';
    if (!translations.discount) translations.discount = locale === 'vi' ? 'Giảm giá' : 'Discount';
    if (!translations.grandTotal) translations.grandTotal = locale === 'vi' ? 'Tổng cộng' : 'Grand Total';
    if (!translations.shippingAddress) translations.shippingAddress = locale === 'vi' ? 'Địa chỉ giao hàng' : 'Shipping Address';
    if (!translations.billingAddress) translations.billingAddress = locale === 'vi' ? 'Địa chỉ thanh toán' : 'Billing Address';
    if (!translations.paymentInfo) translations.paymentInfo = locale === 'vi' ? 'Thông tin thanh toán' : 'Payment Information';
    if (!translations.paymentMethod) translations.paymentMethod = locale === 'vi' ? 'Phương thức thanh toán' : 'Payment Method';
    if (!translations.paymentStatus) translations.paymentStatus = locale === 'vi' ? 'Trạng thái thanh toán' : 'Payment Status';
    if (!translations.customerNotes) translations.customerNotes = locale === 'vi' ? 'Ghi chú của khách hàng' : 'Customer Notes';
    if (!translations.viewOrder) translations.viewOrder = locale === 'vi' ? 'Xem đơn hàng' : 'View Order';
    if (!translations.processOrder) translations.processOrder = locale === 'vi' ? 'Xử lý đơn hàng' : 'Process Order';
    if (!translations.urgent) translations.urgent = locale === 'vi' ? 'Khẩn cấp' : 'Urgent';
    if (!translations.normal) translations.normal = locale === 'vi' ? 'Bình thường' : 'Normal';
    if (!translations.skipToContent) translations.skipToContent = locale === 'vi' ? 'Chuyển đến nội dung chính' : 'Skip to main content';
    if (!translations.emailLabel) translations.emailLabel = locale === 'vi' ? 'Email từ AlaCraft' : 'Email from AlaCraft';
    if (!translations.signature) translations.signature = locale === 'vi' ? 'Trân trọng,<br>Đội ngũ AlaCraft' : 'Best regards,<br>AlaCraft Team';

    // Add fallbacks for layout-specific translations
    if (!translations.companyName) translations.companyName = locale === 'vi' ? 'AlaCraft' : 'AlaCraft';
    if (!translations.copyright) translations.copyright = locale === 'vi' ? '© 2024 AlaCraft. Tất cả quyền được bảo lưu.' : '© 2024 AlaCraft. All rights reserved.';

    return translations;
  }

  /**
   * Get translations specifically for order confirmation emails
   * Returns order confirmation translations without admin notification overrides
   */
  getOrderConfirmationTranslations(locale: SupportedLocale = 'en'): Record<string, string> {
    const orderConfirmationKeys = [
      // Order confirmation specific
      'email.orderConfirmation.subject',
      'email.orderConfirmation.greeting',
      'email.orderConfirmation.thankYou',
      'email.orderConfirmation.orderReceived',
      'email.orderConfirmation.orderDetails',
      'email.orderConfirmation.orderNumber',
      'email.orderConfirmation.orderDate',
      'email.orderConfirmation.items',
      'email.orderConfirmation.quantity',
      'email.orderConfirmation.price',
      'email.orderConfirmation.total',
      'email.orderConfirmation.subtotal',
      'email.orderConfirmation.shipping',
      'email.orderConfirmation.tax',
      'email.orderConfirmation.discount',
      'email.orderConfirmation.grandTotal',
      'email.orderConfirmation.shippingAddress',
      'email.orderConfirmation.paymentMethod',
      'email.orderConfirmation.contactUs',
      'email.orderConfirmation.trackOrder',

      // Common
      'common.loading',
      'common.error',
      'common.success',
      'common.cancel',
      'common.save',
      'common.edit',
      'common.delete',
      'common.view',
      'common.back',
      'common.next',
      'common.previous',
      'common.close',
      'common.confirm',
      'common.yes',
      'common.no',

      // Layout and branding
      'layout.header.companyName',
      'layout.footer.copyright',
      'email.common.signature'
    ];

    const translations: Record<string, string> = {};

    for (const key of orderConfirmationKeys) {
      const translation = this.getTranslation(key, locale);
      // Use the last part of the key as the template variable name
      const templateKey = key.split('.').pop() || key;
      translations[templateKey] = translation;
    }

    // Add special handling for layout-specific translations
    translations.companyName = this.getTranslation('layout.header.companyName', locale);
    translations.copyright = this.getTranslation('layout.footer.copyright', locale);

    // Fallback values for missing order confirmation translations
    if (!translations.subject) translations.subject = locale === 'vi' ? 'Xác nhận đơn hàng' : 'Order Confirmation';
    if (!translations.greeting) translations.greeting = locale === 'vi' ? 'Xin chào' : 'Hello';
    if (!translations.thankYou) translations.thankYou = locale === 'vi' ? 'Cảm ơn bạn đã đặt hàng!' : 'Thank you for your order!';
    if (!translations.orderReceived) translations.orderReceived = locale === 'vi' ? 'Chúng tôi đã nhận được đơn hàng của bạn' : 'We have received your order';
    if (!translations.orderDetails) translations.orderDetails = locale === 'vi' ? 'Chi tiết đơn hàng' : 'Order Details';
    if (!translations.orderNumber) translations.orderNumber = locale === 'vi' ? 'Mã đơn hàng' : 'Order Number';
    if (!translations.orderDate) translations.orderDate = locale === 'vi' ? 'Ngày đặt hàng' : 'Order Date';
    if (!translations.items) translations.items = locale === 'vi' ? 'Sản phẩm' : 'Items';
    if (!translations.quantity) translations.quantity = locale === 'vi' ? 'Số lượng' : 'Quantity';
    if (!translations.price) translations.price = locale === 'vi' ? 'Giá' : 'Price';
    if (!translations.total) translations.total = locale === 'vi' ? 'Tổng' : 'Total';
    if (!translations.subtotal) translations.subtotal = locale === 'vi' ? 'Tạm tính' : 'Subtotal';
    if (!translations.shipping) translations.shipping = locale === 'vi' ? 'Phí vận chuyển' : 'Shipping';
    if (!translations.tax) translations.tax = locale === 'vi' ? 'Thuế' : 'Tax';
    if (!translations.discount) translations.discount = locale === 'vi' ? 'Giảm giá' : 'Discount';
    if (!translations.grandTotal) translations.grandTotal = locale === 'vi' ? 'Tổng cộng' : 'Grand Total';
    if (!translations.shippingAddress) translations.shippingAddress = locale === 'vi' ? 'Địa chỉ giao hàng' : 'Shipping Address';
    if (!translations.paymentMethod) translations.paymentMethod = locale === 'vi' ? 'Phương thức thanh toán' : 'Payment Method';
    if (!translations.contactUs) translations.contactUs = locale === 'vi' ? 'Liên hệ với chúng tôi nếu bạn có bất kỳ câu hỏi nào.' : 'Contact us if you have any questions.';
    if (!translations.trackOrder) translations.trackOrder = locale === 'vi' ? 'Theo dõi đơn hàng' : 'Track Order';

    // Add fallbacks for layout-specific translations
    if (!translations.companyName) translations.companyName = locale === 'vi' ? 'AlaCraft' : 'AlaCraft';
    if (!translations.copyright) translations.copyright = locale === 'vi' ? '© 2024 AlaCraft. Tất cả quyền được bảo lưu.' : '© 2024 AlaCraft. All rights reserved.';
    if (!translations.signature) translations.signature = locale === 'vi' ? 'Trân trọng,<br>Đội ngũ AlaCraft' : 'Best regards,<br>AlaCraft Team';

    return translations;
  }

  /**
   * Get status-specific translations
   */
  getStatusTranslations(locale: SupportedLocale = 'en'): Record<string, string> {
    const statusKeys = [
      'email.orderStatus.pending',
      'email.orderStatus.processing',
      'email.orderStatus.shipped',
      'email.orderStatus.delivered',
      'email.orderStatus.cancelled',
      'email.orderStatus.refunded'
    ];

    const translations: Record<string, string> = {};

    for (const key of statusKeys) {
      const status = key.split('.').pop() || key;
      translations[status] = this.getTranslation(key, locale);
    }

    return translations;
  }

  /**
   * Get status message translations for order status updates
   */
  getStatusMessageTranslations(locale: SupportedLocale = 'en'): Record<string, string> {
    const messageKeys = [
      'email.orderStatusUpdate.statusMessages.pending',
      'email.orderStatusUpdate.statusMessages.processing',
      'email.orderStatusUpdate.statusMessages.shipped',
      'email.orderStatusUpdate.statusMessages.delivered',
      'email.orderStatusUpdate.statusMessages.cancelled',
      'email.orderStatusUpdate.statusMessages.refunded'
    ];

    const translations: Record<string, string> = {};

    for (const key of messageKeys) {
      const status = key.split('.').pop() || key;
      translations[status] = this.getTranslation(key, locale);
    }

    return translations;
  }

  /**
   * Reload translations from file (useful for development)
   */
  async reloadTranslations(): Promise<void> {
    await this.loadTranslations();
  }

  /**
   * Check if translations are loaded
   */
  isLoaded(): boolean {
    return this.translationsCache !== null;
  }

  /**
   * Get available translation keys (for debugging)
   */
  getAvailableKeys(): string[] {
    if (!this.translationsCache) {
      return [];
    }
    return Object.keys(this.translationsCache);
  }
}