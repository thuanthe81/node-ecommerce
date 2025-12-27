import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CONSTANTS, OrderStatus, PaymentStatus } from '@alacraft/shared';
import { TemplateLoaderService } from './template-loader.service';
import { VariableReplacerService } from './variable-replacer.service';
import { DesignSystemInjector } from './design-system-injector.service';

export interface OrderEmailData {
  orderId: string;
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

export interface OrderCancellationEmailData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  orderDate: string;
  cancelledAt: string;
  cancellationReason?: string;
  items: Array<{
    nameEn: string;
    nameVi: string;
    sku?: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  orderTotal: number;
  refundRequired: boolean;
  refundAmount?: number;
  refundMethod?: string;
  estimatedRefundDate?: string;
  paymentStatus?: string;
}

export interface PaymentStatusUpdateEmailData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  orderDate: string;
  orderTotal: number;
  paymentStatus: string;
  statusMessage?: string;
}

export interface AdminOrderEmailData {
  orderId: string;
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
export class EmailTemplateService implements OnModuleInit {
  private readonly logger = new Logger(EmailTemplateService.name);

  constructor(
    private readonly templateLoader: TemplateLoaderService,
    private readonly variableReplacer: VariableReplacerService,
    private readonly designSystemInjector: DesignSystemInjector
  ) {}

  /**
   * Initialize the email template service
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('Email template service initialized');
  }

  /**
   * Formats currency values with proper decimal places and symbols
   * @param amount - The amount to format
   * @param locale - Language locale (en or vi)
   * @returns Formatted currency string
   */
  private formatCurrency(amount: number, locale: 'en' | 'vi'): string {
    return `${amount.toLocaleString('vi-VN')} ₫`;
  }

  /**
   * Sanitizes order data to handle undefined/null price values
   * @param data - The order data to sanitize
   * @returns Sanitized order data with hasQuoteItems flag
   */
  private sanitizeOrderData(data: any): any {
    const sanitized = { ...data };

    // Check for quote items (items with undefined/null/zero prices)
    let hasQuoteItems = false;

    // Sanitize order items
    if (sanitized.items && Array.isArray(sanitized.items)) {
      sanitized.items = sanitized.items.map((item: any) => {
        const originalPrice = item.price;
        const originalTotal = item.total;

        // Check if this item has undefined/null prices (quote item)
        if (originalPrice === undefined || originalPrice === null ||
            originalTotal === undefined || originalTotal === null ||
            (typeof originalPrice === 'number' && originalPrice === 0) ||
            (typeof originalTotal === 'number' && originalTotal === 0)) {
          hasQuoteItems = true;
        }

        return {
          ...item,
          price: this.sanitizePrice(item.price),
          total: this.sanitizePrice(item.total)
        };
      });
    }

    // Sanitize order totals
    sanitized.subtotal = this.sanitizePrice(sanitized.subtotal);
    sanitized.total = this.sanitizePrice(sanitized.total);
    sanitized.shippingCost = this.sanitizePrice(sanitized.shippingCost);
    sanitized.taxAmount = this.sanitizePrice(sanitized.taxAmount);
    sanitized.discountAmount = this.sanitizePrice(sanitized.discountAmount);

    // Add flag for quote items
    sanitized.hasQuoteItems = hasQuoteItems;

    return sanitized;
  }

  /**
   * Sanitizes a price value to handle undefined/null values
   * @param price - The price value to sanitize
   * @returns Sanitized price (0 for undefined/null values)
   */
  private sanitizePrice(price: any): number {
    if (price === undefined || price === null || typeof price !== 'number' || isNaN(price)) {
      // Log the occurrence for debugging
      console.warn(`[EmailTemplateService] Sanitizing undefined price value: ${price}`);
      return 0; // Default to 0 for calculation purposes
    }
    return price;
  }



  /**
   * Admin order notification email template
   */
  async getAdminOrderNotificationTemplate(
    data: AdminOrderEmailData,
    locale: 'en' | 'vi' = 'en',
  ): Promise<{ subject: string; html: string }> {
    // Sanitize data before processing
    const sanitizedData = this.sanitizeOrderData(data);

    // Use the new template system
    const templateName = 'orders/template-admin-order-notification';

    // Load and process template
    const templateContent = await this.templateLoader.loadTemplate(templateName);
    const processedTemplate = await this.variableReplacer.replaceVariables(templateName, templateContent, sanitizedData, locale);

    const finalHtml = this.designSystemInjector.injectDesignSystem(processedTemplate);

    return {
      subject: locale === 'vi'
        ? `🔔 Đơn hàng mới #${sanitizedData.orderNumber}`
        : `🔔 New Order #${sanitizedData.orderNumber}`,
      html: finalHtml
    };
  }

  /**
   * Order confirmation email template
   */
  async getOrderConfirmationTemplate(
    data: OrderEmailData,
    locale: 'en' | 'vi' = 'en',
  ): Promise<{ subject: string; html: string }> {
    // Sanitize data before processing
    const sanitizedData = this.sanitizeOrderData(data);

    // Use the new template system
    const templateName = 'orders/template-order-confirmation';

    // Add debug logging to ensure correct template is being used
    console.log(`[EmailTemplateService] Loading order confirmation template: ${templateName}`);

    // Load and process template
    const templateContent = await this.templateLoader.loadTemplate(templateName);

    // Check if template was loaded successfully
    if (!templateContent) {
      throw new Error(`Failed to load template content for '${templateName}'`);
    }

    // Verify we're loading the correct template by checking for distinctive content
    if (!templateContent.includes('{{> email-header')) {
      console.error(`[EmailTemplateService] WARNING: Order confirmation template does not contain expected partial template content. Template may be incorrect.`);
    } else {
      console.log(`[EmailTemplateService] Order confirmation template verified - contains expected partial templates`);
    }

    const processedTemplate = await this.variableReplacer.replaceVariables(templateName, templateContent, sanitizedData, locale);

    // Check if template processing was successful
    if (!processedTemplate) {
      throw new Error(`Failed to process template variables for '${templateName}'`);
    }

    const finalHtml = this.designSystemInjector.injectDesignSystem(processedTemplate);

    // Check if design system injection was successful
    if (!finalHtml) {
      throw new Error(`Failed to inject design system for '${templateName}'`);
    }

    return {
      subject: locale === 'vi'
        ? `Xác nhận đơn hàng #${sanitizedData.orderNumber}`
        : `Order Confirmation #${sanitizedData.orderNumber}`,
      html: finalHtml
    };
  }

  /**
   * Clear template cache and reload templates
   * Useful for ensuring fresh templates are loaded
   */
  async clearTemplateCache(): Promise<void> {
    console.log('[EmailTemplateService] Clearing template cache');
    this.templateLoader.clearCache();
    await this.templateLoader.reloadTemplates();
    console.log('[EmailTemplateService] Template cache cleared and reloaded');
  }



  /**
   * Shipping notification email template
   */
  async getShippingNotificationTemplate(
    data: OrderEmailData,
    locale: 'en' | 'vi' = 'en',
  ): Promise<{ subject: string; html: string }> {
    // Sanitize data before processing
    const sanitizedData = this.sanitizeOrderData(data);

    // Use the new template system
    const templateName = 'orders/template-shipping-notification';

    // Load and process template
    const templateContent = await this.templateLoader.loadTemplate(templateName);
    const processedTemplate = await this.variableReplacer.replaceVariables(templateName, templateContent, sanitizedData, locale);

    const finalHtml = this.designSystemInjector.injectDesignSystem(processedTemplate);

    return {
      subject: locale === 'vi'
        ? `🚚 Đơn hàng #${sanitizedData.orderNumber} đã được giao`
        : `🚚 Order #${sanitizedData.orderNumber} has been shipped`,
      html: finalHtml
    };
  }



  /**
   * Order status update email template
   */
  async getOrderStatusUpdateTemplate(
    data: OrderEmailData,
    locale: 'en' | 'vi' = 'en',
  ): Promise<{ subject: string; html: string }> {
    // Sanitize data before processing
    const sanitizedData = this.sanitizeOrderData(data);

    // Use the new template system
    const templateName = 'orders/template-order-status-update';

    // Load and process template
    const templateContent = await this.templateLoader.loadTemplate(templateName);
    const processedTemplate = await this.variableReplacer.replaceVariables(templateName, templateContent, sanitizedData, locale);

    const finalHtml = this.designSystemInjector.injectDesignSystem(processedTemplate);

    return {
      subject: locale === 'vi'
        ? `Cập nhật trạng thái đơn hàng #${sanitizedData.orderNumber}`
        : `Order Status Update #${sanitizedData.orderNumber}`,
      html: finalHtml
    };
  }

  /**
   * Welcome email template
   */
  async getWelcomeEmailTemplate(
    data: UserEmailData,
    locale: 'en' | 'vi' = 'en',
  ): Promise<{ subject: string; html: string }> {
    // Use the new template system
    const templateName = 'auth/template-welcome-email';

    // Load and process template
    const templateContent = await this.templateLoader.loadTemplate(templateName);
    const processedTemplate = await this.variableReplacer.replaceVariables(templateName, templateContent, data, locale);

    const finalHtml = this.designSystemInjector.injectDesignSystem(processedTemplate);

    return {
      subject: locale === 'vi'
        ? `Chào mừng đến với ${CONSTANTS.BUSINESS.COMPANY.NAME.VI}!`
        : `Welcome to ${CONSTANTS.BUSINESS.COMPANY.NAME.EN}!`,
      html: finalHtml
    };
  }

  /**
   * Password reset email template
   */
  async getPasswordResetTemplate(
    data: UserEmailData,
    locale: 'en' | 'vi' = 'en',
  ): Promise<{ subject: string; html: string }> {
    // Use the new template system
    const templateName = 'auth/template-password-reset';

    // Load and process template
    const templateContent = await this.templateLoader.loadTemplate(templateName);
    const processedTemplate = await this.variableReplacer.replaceVariables(templateName, templateContent, data, locale);

    const finalHtml = this.designSystemInjector.injectDesignSystem(processedTemplate);

    return {
      subject: locale === 'vi'
        ? 'Đặt lại mật khẩu'
        : 'Password Reset',
      html: finalHtml
    };
  }

  /**
   * Order cancellation email template
   */
  async getOrderCancellationTemplate(
    data: OrderCancellationEmailData,
    locale: 'en' | 'vi' = 'en',
  ): Promise<{ subject: string; html: string }> {
    // Sanitize data before processing
    const sanitizedData = this.sanitizeOrderData(data);

    // Use the new template system
    const templateName = 'orders/template-order-cancellation';

    // Load and process template
    const templateContent = await this.templateLoader.loadTemplate(templateName);
    const processedTemplate = await this.variableReplacer.replaceVariables(templateName, templateContent, sanitizedData, locale);

    const finalHtml = this.designSystemInjector.injectDesignSystem(processedTemplate);

    return {
      subject: locale === 'vi'
        ? `Đơn hàng đã hủy - Đơn hàng #${sanitizedData.orderNumber}`
        : `Order Cancelled - Order #${sanitizedData.orderNumber}`,
      html: finalHtml
    };
  }

  /**
   * Admin order cancellation notification email template
   */
  async getAdminOrderCancellationTemplate(
    data: OrderCancellationEmailData,
    locale: 'en' | 'vi' = 'en',
  ): Promise<{ subject: string; html: string }> {
    // Sanitize data before processing
    const sanitizedData = this.sanitizeOrderData(data);

    // Use the new template system
    const templateName = 'orders/template-admin-order-cancellation';

    // Load and process template
    const templateContent = await this.templateLoader.loadTemplate(templateName);
    const processedTemplate = await this.variableReplacer.replaceVariables(templateName, templateContent, sanitizedData, locale);

    const finalHtml = this.designSystemInjector.injectDesignSystem(processedTemplate);

    return {
      subject: locale === 'vi'
        ? `Đơn hàng bị hủy bởi khách hàng - Đơn hàng #${sanitizedData.orderNumber}`
        : `Order Cancelled by Customer - Order #${sanitizedData.orderNumber}`,
      html: finalHtml
    };
  }

  /**
   * Payment status update email template
   */
  async getPaymentStatusUpdateTemplate(
    data: PaymentStatusUpdateEmailData,
    locale: 'en' | 'vi' = 'en',
  ): Promise<{ subject: string; html: string }> {
    // Sanitize data before processing
    const sanitizedData = this.sanitizeOrderData(data);

    // Use the new template system
    const templateName = 'orders/template-payment-status-update';

    // Load and process template
    const templateContent = await this.templateLoader.loadTemplate(templateName);
    const processedTemplate = await this.variableReplacer.replaceVariables(templateName, templateContent, sanitizedData, locale);

    const finalHtml = this.designSystemInjector.injectDesignSystem(processedTemplate);

    return {
      subject: locale === 'vi'
        ? `Cập nhật trạng thái thanh toán - Đơn hàng #${sanitizedData.orderNumber}`
        : `Payment Status Update - Order #${sanitizedData.orderNumber}`,
      html: finalHtml
    };
  }

  /**
   * Simplified order status update email template
   */
  async getSimplifiedOrderStatusUpdateTemplate(
    data: OrderEmailData,
    locale: 'en' | 'vi' = 'en',
  ): Promise<{ subject: string; html: string }> {
    // Sanitize data before processing
    const sanitizedData = this.sanitizeOrderData(data);

    // Use the new template system
    const templateName = 'orders/template-order-status-update-simplified';

    // Load and process template
    const templateContent = await this.templateLoader.loadTemplate(templateName);
    const processedTemplate = await this.variableReplacer.replaceVariables(templateName, templateContent, sanitizedData, locale);

    const finalHtml = this.designSystemInjector.injectDesignSystem(processedTemplate);

    return {
      subject: locale === 'vi'
        ? `Cập nhật đơn hàng #${sanitizedData.orderNumber}`
        : `Order Update #${sanitizedData.orderNumber}`,
      html: finalHtml
    };
  }
}