import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BUSINESS } from '../../common/constants';
import { TemplateLoaderService } from './template-loader.service';
import { VariableReplacerService } from './variable-replacer.service';
import { DesignSystemInjector } from './design-system-injector.service';

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
   * Admin order notification email template
   */
  async getAdminOrderNotificationTemplate(
    data: AdminOrderEmailData,
    locale: 'en' | 'vi' = 'en',
  ): Promise<{ subject: string; html: string }> {
    // Use the new template system
    const templateName = 'orders/template-admin-order-notification';

    // Load and process template
    const templateContent = await this.templateLoader.loadTemplate(templateName);
    const processedTemplate = await this.variableReplacer.replaceVariables(templateContent, data, locale);

    const finalHtml = this.designSystemInjector.injectDesignSystem(processedTemplate);

    return {
      subject: locale === 'vi'
        ? `🔔 Đơn hàng mới #${data.orderNumber}`
        : `🔔 New Order #${data.orderNumber}`,
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
    // Use the new template system
    const templateName = 'orders/template-order-confirmation';

    // Add debug logging to ensure correct template is being used
    console.log(`[EmailTemplateService] Loading order confirmation template: ${templateName}`);

    // Load and process template
    const templateContent = await this.templateLoader.loadTemplate(templateName);

    // Verify we're loading the correct template by checking for distinctive content
    if (!templateContent.includes('Welcome Section with Visual Icon')) {
      console.error(`[EmailTemplateService] WARNING: Order confirmation template does not contain expected content. Template may be incorrect.`);
    } else {
      console.log(`[EmailTemplateService] Order confirmation template verified - contains expected welcome section`);
    }

    const processedTemplate = await this.variableReplacer.replaceVariables(templateContent, data, locale);

    const finalHtml = this.designSystemInjector.injectDesignSystem(processedTemplate);

    return {
      subject: locale === 'vi'
        ? `Xác nhận đơn hàng #${data.orderNumber}`
        : `Order Confirmation #${data.orderNumber}`,
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
    // Use the new template system
    const templateName = 'orders/template-shipping-notification';

    // Load and process template
    const templateContent = await this.templateLoader.loadTemplate(templateName);
    const processedTemplate = await this.variableReplacer.replaceVariables(templateContent, data, locale);

    const finalHtml = this.designSystemInjector.injectDesignSystem(processedTemplate);

    return {
      subject: locale === 'vi'
        ? `🚚 Đơn hàng #${data.orderNumber} đã được giao`
        : `🚚 Order #${data.orderNumber} has been shipped`,
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
    // Use the new template system
    const templateName = 'orders/template-order-status-update';

    // Load and process template
    const templateContent = await this.templateLoader.loadTemplate(templateName);
    const processedTemplate = await this.variableReplacer.replaceVariables(templateContent, data, locale);

    const finalHtml = this.designSystemInjector.injectDesignSystem(processedTemplate);

    return {
      subject: locale === 'vi'
        ? `Cập nhật trạng thái đơn hàng #${data.orderNumber}`
        : `Order Status Update #${data.orderNumber}`,
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
    const processedTemplate = await this.variableReplacer.replaceVariables(templateContent, data, locale);

    const finalHtml = this.designSystemInjector.injectDesignSystem(processedTemplate);

    return {
      subject: locale === 'vi'
        ? `Chào mừng đến với ${BUSINESS.COMPANY.NAME.VI}!`
        : `Welcome to ${BUSINESS.COMPANY.NAME.EN}!`,
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
    const processedTemplate = await this.variableReplacer.replaceVariables(templateContent, data, locale);

    const finalHtml = this.designSystemInjector.injectDesignSystem(processedTemplate);

    return {
      subject: locale === 'vi'
        ? 'Đặt lại mật khẩu'
        : 'Password Reset',
      html: finalHtml
    };
  }
}