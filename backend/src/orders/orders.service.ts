import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { SetOrderItemPriceDto } from './dto/set-order-item-price.dto';
import { OrderStatus, PaymentStatus, UserRole } from '@prisma/client';
import { EmailService } from '../notifications/services/email.service';
import { EmailTemplateService } from '../notifications/services/email-template.service';
import { FooterSettingsService } from '../footer-settings/footer-settings.service';
import { EmailAttachmentService } from '../pdf-generator/services/email-attachment.service';
import { ResendEmailHandlerService } from '../pdf-generator/services/resend-email-handler.service';
import { OrderPDFData, AddressData, OrderItemData, PaymentMethodData, ShippingMethodData, BusinessInfoData, ResendResult } from '../pdf-generator/types/pdf.types';
import { STATUS, BUSINESS, ConstantUtils } from '../common/constants';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private emailTemplateService: EmailTemplateService,
    private footerSettingsService: FooterSettingsService,
    private emailAttachmentService: EmailAttachmentService,
    private resendEmailHandlerService: ResendEmailHandlerService,
  ) {}

  /**
   * Generate a unique order number
   */
  private async generateOrderNumber(): Promise<string> {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    const orderNumber = `ORD-${timestamp}-${random}`;

    // Check if order number already exists (very unlikely)
    const existing = await this.prisma.order.findUnique({
      where: { orderNumber },
    });

    if (existing) {
      // Recursively generate a new one if collision occurs
      return this.generateOrderNumber();
    }

    return orderNumber;
  }

  /**
   * Create a new order
   */
  async create(createOrderDto: CreateOrderDto, userId?: string) {
    const {
      email,
      shippingAddressId,
      billingAddressId,
      shippingMethod,
      shippingCost: providedShippingCost,
      paymentMethod,
      items,
      promotionCode,
      notes,
    } = createOrderDto;

    // Verify addresses exist and belong to user if authenticated
    const shippingAddress = await this.prisma.address.findUnique({
      where: { id: shippingAddressId },
    });

    if (!shippingAddress) {
      throw new NotFoundException('Shipping address not found');
    }

    // Only check ownership if both userId and address.userId exist
    // This allows guest addresses (null userId) to be used in orders
    if (userId && shippingAddress.userId && shippingAddress.userId !== userId) {
      throw new ForbiddenException('Shipping address does not belong to user');
    }

    const billingAddress = await this.prisma.address.findUnique({
      where: { id: billingAddressId },
    });

    if (!billingAddress) {
      throw new NotFoundException('Billing address not found');
    }

    // Only check ownership if both userId and address.userId exist
    // This allows guest addresses (null userId) to be used in orders
    if (userId && billingAddress.userId && billingAddress.userId !== userId) {
      throw new ForbiddenException('Billing address does not belong to user');
    }

    // Fetch products and validate stock
    const productIds = items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== items.length) {
      throw new BadRequestException('One or more products not found');
    }

    // Create a map for easy lookup
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate stock and calculate totals
    // Track if order contains zero-price products
    let subtotal = 0;
    let hasZeroPriceItems = false;
    const orderItems: Array<{
      productId: string;
      productNameEn: string;
      productNameVi: string;
      sku: string;
      quantity: number;
      price: any;
      total: number;
    }> = [];

    for (const item of items) {
      const product = productMap.get(item.productId);

      if (!product) {
        throw new BadRequestException(`Product ${item.productId} not found`);
      }

      if (!product.isActive) {
        throw new BadRequestException(
          `Product ${product.nameEn} is not available`,
        );
      }

      // Check if this is a zero-price product
      const isZeroPrice = Number(product.price) === 0;
      if (isZeroPrice) {
        hasZeroPriceItems = true;
      }

      // Only validate stock for non-zero-price products
      if (!isZeroPrice && product.stockQuantity < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product ${product.nameEn}. Available: ${product.stockQuantity}`,
        );
      }

      const itemTotal = Number(product.price) * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: product.id,
        productNameEn: product.nameEn,
        productNameVi: product.nameVi,
        sku: product.sku,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal,
      });
    }

    // Use provided shipping cost from frontend (calculated by shipping service)
    // Fall back to calculated cost if not provided (for backward compatibility)
    const shippingCost = providedShippingCost ?? this.calculateShippingCost(shippingMethod);

    // Calculate tax (simplified - 10% tax rate)
    const taxAmount = subtotal * 0.1;

    // Apply promotion if provided
    let discountAmount = 0;
    let promotionId = null;

    if (promotionCode) {
      const promotion = await this.prisma.promotion.findUnique({
        where: { code: promotionCode },
      });

      if (promotion && this.isPromotionValid(promotion, subtotal)) {
        promotionId = promotion.id;
        if (promotion.type === 'PERCENTAGE') {
          discountAmount = (subtotal * Number(promotion.value)) / 100;
          if (
            promotion.maxDiscountAmount &&
            discountAmount > Number(promotion.maxDiscountAmount)
          ) {
            discountAmount = Number(promotion.maxDiscountAmount);
          }
        } else {
          discountAmount = Number(promotion.value);
        }
      }
    }

    // Calculate total
    const total = subtotal + shippingCost + taxAmount - discountAmount;

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Determine order status based on zero-price items
    const orderStatus = hasZeroPriceItems
      ? OrderStatus.PENDING_QUOTE
      : OrderStatus.PENDING;

    // Create order with transaction to ensure atomicity
    const order = await this.prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          email,
          status: orderStatus,
          subtotal,
          shippingCost,
          taxAmount,
          discountAmount,
          total,
          requiresPricing: hasZeroPriceItems,
          shippingAddressId,
          billingAddressId,
          shippingMethod,
          paymentMethod,
          paymentStatus: PaymentStatus.PENDING,
          promotionId,
          notes,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          shippingAddress: true,
          billingAddress: true,
        },
      });

      // Deduct inventory for each product (only for non-zero-price products)
      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) {
          continue; // Skip if product not found (should not happen due to earlier validation)
        }

        const isZeroPrice = Number(product.price) === 0;

        // Only deduct stock for non-zero-price products
        if (!isZeroPrice) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          });
        }
      }

      // Update promotion usage count if applicable
      if (promotionId) {
        await tx.promotion.update({
          where: { id: promotionId },
          data: {
            usageCount: {
              increment: 1,
            },
          },
        });
      }

      return newOrder;
    });

    // Send order confirmation email
    await this.sendOrderConfirmationEmail(order);

    // Send admin notification email
    await this.sendAdminOrderNotification(order);

    return order;
  }

  /**
   * Send order confirmation email to customer with PDF attachment
   *
   * Generates a professional PDF document containing complete order details and sends it
   * as an attachment with a simplified HTML email. This approach eliminates swaks syntax
   * errors while providing customers with comprehensive, printable order records.
   *
   * @param order - The order object with items, addresses, and totals
   * @returns Promise<void> - Resolves when email sending is complete (success or failure)
   *
   * @example
   * ```typescript
   * // Automatically called after order creation
   * await this.sendOrderConfirmationEmail(order);
   * ```
   *
   * @remarks
   * - Uses EmailAttachmentService to generate PDF and send simplified email
   * - Defaults to English locale (can be enhanced to use customer preference)
   * - Logs success/failure without throwing exceptions
   * - Includes comprehensive order information in PDF format
   * - Handles PDF generation failures gracefully with fallback notifications
   */
  private async sendOrderConfirmationEmail(order: any): Promise<void> {
    try {
      const locale = 'en' as 'en' | 'vi'; // Default to English, can be determined from user preferences

      // Convert order data to PDF format
      const orderPDFData = await this.convertOrderToPDFData(order, locale);

      // Send email with PDF attachment using the new system
      const result = await this.emailAttachmentService.sendOrderConfirmationWithPDF(
        order.email,
        orderPDFData,
        locale
      );

      if (result.success) {
        console.log(`Order confirmation email with PDF sent to ${order.email} for order ${order.orderNumber}`);
      } else {
        console.warn(`Failed to send order confirmation email with PDF to ${order.email} for order ${order.orderNumber}: ${result.error}`);

        // Fallback to original email system if PDF attachment fails
        await this.sendFallbackOrderConfirmationEmail(order, locale);
      }
    } catch (error) {
      // Log error but don't fail the order creation
      console.error(`Failed to send order confirmation email for order ${order.orderNumber}:`, error);

      // Attempt fallback email without PDF
      try {
        await this.sendFallbackOrderConfirmationEmail(order, 'en');
      } catch (fallbackError) {
        console.error(`Fallback email also failed for order ${order.orderNumber}:`, fallbackError);
      }
    }
  }

  /**
   * Convert order data to PDF data format with comprehensive validation and edge case handling
   * @param order - The order object from database
   * @param locale - Language locale for the PDF
   * @returns Promise<OrderPDFData> - Formatted data for PDF generation
   */
  private async convertOrderToPDFData(order: any, locale: 'en' | 'vi'): Promise<OrderPDFData> {
    // Validate order data before conversion
    this.validateOrderDataForPDF(order);

    // Get business information from footer settings
    const footerSettings = await this.footerSettingsService.getFooterSettings();

    // Convert address data with fallback handling for missing data
    const billingAddress: AddressData = this.convertAddressData(
      order.billingAddress,
      'Billing Address Not Available',
      locale
    );

    const shippingAddress: AddressData = this.convertAddressData(
      order.shippingAddress,
      'Shipping Address Not Available',
      locale
    );

    // Convert order items with special handling for different order types
    const items: OrderItemData[] = this.convertOrderItems(order.items, locale);

    // Convert payment method data with comprehensive payment type support
    const paymentMethod: PaymentMethodData = await this.convertPaymentMethodData(
      order.paymentMethod,
      order.paymentStatus,
      locale
    );

    // Convert shipping method data with enhanced shipping option support
    const shippingMethod: ShippingMethodData = this.convertShippingMethodData(
      order.shippingMethod,
      order.status,
      locale
    );

    // Create business info with fallback values
    const businessInfo: BusinessInfoData = this.createBusinessInfo(footerSettings, locale);

    // Handle special order types and statuses
    const orderDate = this.formatOrderDate(order.createdAt, locale);
    const customerInfo = this.extractCustomerInfo(order, shippingAddress);

    return {
      orderNumber: order.orderNumber || 'N/A',
      orderDate,
      customerInfo,
      billingAddress,
      shippingAddress,
      items,
      pricing: {
        subtotal: Number(order.subtotal) || 0,
        shippingCost: Number(order.shippingCost) || 0,
        taxAmount: Number(order.taxAmount) || 0,
        discountAmount: Number(order.discountAmount) || 0,
        total: Number(order.total) || 0,
      },
      paymentMethod,
      shippingMethod,
      businessInfo,
      locale,
    };
  }

  /**
   * Validate order data before PDF generation
   * @param order - Order object to validate
   * @throws Error if critical data is missing
   */
  private validateOrderDataForPDF(order: any): void {
    const errors: string[] = [];

    if (!order) {
      throw new Error('Order data is required for PDF generation');
    }

    if (!order.orderNumber) {
      errors.push('Order number is missing');
    }

    if (!order.email) {
      errors.push('Customer email is missing');
    }

    if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
      errors.push('Order must contain at least one item');
    }

    if (!order.shippingAddress) {
      errors.push('Shipping address is required');
    }

    if (!order.billingAddress) {
      errors.push('Billing address is required');
    }

    if (errors.length > 0) {
      throw new Error(`Order data validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Convert address data with fallback handling
   * @param address - Address object from order
   * @param fallbackName - Fallback name if address is missing
   * @param locale - Language locale
   * @returns AddressData with fallback values
   */
  private convertAddressData(
    address: any,
    fallbackName: string,
    locale: 'en' | 'vi'
  ): AddressData {
    if (!address) {
      const notAvailable = locale === 'vi' ? 'Không có thông tin' : 'Not Available';
      return {
        fullName: fallbackName,
        addressLine1: notAvailable,
        city: notAvailable,
        state: notAvailable,
        postalCode: notAvailable,
        country: notAvailable,
      };
    }

    return {
      fullName: address.fullName || fallbackName,
      addressLine1: address.addressLine1 || (locale === 'vi' ? 'Không có địa chỉ' : 'No address provided'),
      addressLine2: address.addressLine2 || undefined,
      city: address.city || (locale === 'vi' ? 'Không xác định' : 'Unknown'),
      state: address.state || (locale === 'vi' ? 'Không xác định' : 'Unknown'),
      postalCode: address.postalCode || '00000',
      country: address.country || (locale === 'vi' ? 'Việt Nam' : 'Vietnam'),
      phone: address.phone || undefined,
    };
  }

  /**
   * Convert order items with special handling for different order types
   * @param items - Array of order items
   * @param locale - Language locale
   * @returns Array of OrderItemData with proper handling for all item types
   */
  private convertOrderItems(items: any[], locale: 'en' | 'vi'): OrderItemData[] {
    if (!items || !Array.isArray(items)) {
      return [];
    }

    return items.map((item: any, index: number) => {
      // Handle zero-price products
      const unitPrice = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 1;
      const totalPrice = Number(item.total) || (unitPrice * quantity);

      // Handle missing product names
      let itemName = '';
      if (locale === 'vi' && item.productNameVi) {
        itemName = item.productNameVi;
      } else if (item.productNameEn) {
        itemName = item.productNameEn;
      } else if (item.productNameVi) {
        itemName = item.productNameVi;
      } else {
        itemName = locale === 'vi' ? `Sản phẩm ${index + 1}` : `Product ${index + 1}`;
      }

      // Handle missing or incomplete product data
      const description = item.product?.descriptionEn ||
                         item.product?.descriptionVi ||
                         (locale === 'vi' ? 'Không có mô tả' : 'No description available');

      // Handle product images
      let imageUrl: string | undefined;
      if (item.product?.images && Array.isArray(item.product.images) && item.product.images.length > 0) {
        imageUrl = item.product.images[0].url;
      }

      return {
        id: item.id || `item-${index}`,
        name: itemName,
        description: description,
        sku: item.sku || `SKU-${index + 1}`,
        quantity: quantity,
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        imageUrl: imageUrl,
        category: item.product?.category?.nameEn ||
                 item.product?.category?.nameVi ||
                 (locale === 'vi' ? 'Khác' : 'Other'),
      };
    });
  }

  /**
   * Convert payment method data with comprehensive payment type support
   * @param paymentMethod - Payment method string from order
   * @param paymentStatus - Payment status from order
   * @param locale - Language locale
   * @returns PaymentMethodData with complete payment information
   */
  private async convertPaymentMethodData(
    paymentMethod: string,
    paymentStatus: string,
    locale: 'en' | 'vi'
  ): Promise<PaymentMethodData> {
    const method = (paymentMethod || 'bank_transfer').toLowerCase();
    const type = this.mapPaymentMethodType(method);

    const paymentData: PaymentMethodData = {
      type,
      displayName: this.getPaymentMethodDisplayName(method, locale),
      details: this.getPaymentMethodDetails(method, locale),
      status: this.mapPaymentStatus(paymentStatus),
    };

    // Add specific payment method enhancements
    if (type === 'bank_transfer') {
      // For bank transfers, we could enhance with actual bank details
      // This would typically come from payment settings
      paymentData.instructions = locale === 'vi'
        ? 'Vui lòng chuyển khoản theo thông tin được cung cấp và gửi ảnh chụp biên lai để xác nhận.'
        : 'Please transfer payment according to the provided information and send receipt photo for confirmation.';
    } else if (type === 'cash_on_delivery') {
      paymentData.instructions = locale === 'vi'
        ? 'Thanh toán bằng tiền mặt khi nhận hàng. Vui lòng chuẩn bị đúng số tiền.'
        : 'Pay with cash upon delivery. Please prepare exact amount.';
    } else if (type === 'qr_code') {
      paymentData.instructions = locale === 'vi'
        ? 'Quét mã QR bằng ứng dụng ngân hàng để thanh toán.'
        : 'Scan QR code with your banking app to make payment.';
    }

    return paymentData;
  }

  /**
   * Convert shipping method data with enhanced shipping option support
   * @param shippingMethod - Shipping method string from order
   * @param orderStatus - Current order status
   * @param locale - Language locale
   * @returns ShippingMethodData with complete shipping information
   */
  private convertShippingMethodData(
    shippingMethod: string,
    orderStatus: string,
    locale: 'en' | 'vi'
  ): ShippingMethodData {
    const method = (shippingMethod || 'standard').toLowerCase();

    const shippingData: ShippingMethodData = {
      name: this.getShippingMethodDisplayName(method, locale),
      description: this.getShippingMethodDescription(method, locale),
    };

    // Add estimated delivery based on shipping method
    if (method.includes('standard')) {
      shippingData.estimatedDelivery = locale === 'vi' ? '3-5 ngày làm việc' : '3-5 business days';
    } else if (method.includes('express')) {
      shippingData.estimatedDelivery = locale === 'vi' ? '1-2 ngày làm việc' : '1-2 business days';
    } else if (method.includes('overnight')) {
      shippingData.estimatedDelivery = locale === 'vi' ? 'Trong ngày' : 'Same day';
    } else {
      shippingData.estimatedDelivery = locale === 'vi' ? '3-7 ngày làm việc' : '3-7 business days';
    }

    // Add tracking information if order is shipped
    if (orderStatus && orderStatus.toLowerCase() === 'shipped') {
      // In a real implementation, this would come from the order tracking system
      shippingData.trackingNumber = 'Will be provided when available';
      shippingData.carrier = 'Local Carrier';
    }

    return shippingData;
  }

  /**
   * Create comprehensive business information with legal content integration
   * @param footerSettings - Footer settings from database
   * @param locale - Language locale
   * @returns BusinessInfoData with complete business and legal information
   */
  private createBusinessInfo(footerSettings: any, locale: 'en' | 'vi'): BusinessInfoData {
    const companyName = ConstantUtils.getCompanyName(locale);

    return {
      companyName,
      logoUrl: BUSINESS.ASSETS.LOGO,
      contactEmail: footerSettings?.contactEmail || BUSINESS.CONTACT.EMAIL.PRIMARY,
      contactPhone: footerSettings?.contactPhone || undefined,
      website: this.constructWebsiteUrl(footerSettings),
      address: this.createBusinessAddress(footerSettings, companyName, locale),
      returnPolicy: undefined,
      termsAndConditions: undefined,
    };
  }

  /**
   * Construct website URL from available settings
   * @param footerSettings - Footer settings from database
   * @returns Website URL or undefined
   */
  private constructWebsiteUrl(footerSettings: any): string | undefined {
    // Try to construct website URL from available social media links or contact info
    if (footerSettings?.facebookUrl) {
      // Extract domain from Facebook URL if it's a business page
      const match = footerSettings.facebookUrl.match(/facebook\.com\/([^\/]+)/);
      if (match && !match[1].includes('profile.php')) {
        return `https://www.${match[1]}.com`; // Attempt to guess website
      }
    }

    // Default to the primary website URL
    return BUSINESS.WEBSITE.WWW;
  }

  /**
   * Create comprehensive business address
   * @param footerSettings - Footer settings from database
   * @param companyName - Company name
   * @param locale - Language locale
   * @returns Complete business address
   */
  private createBusinessAddress(footerSettings: any, companyName: string, locale: 'en' | 'vi'): AddressData {
    return {
      fullName: companyName,
      addressLine1: footerSettings?.address || undefined,
      addressLine2: undefined,
      city: locale === 'vi' ? 'Thành phố Hồ Chí Minh' : 'Ho Chi Minh City',
      state: locale === 'vi' ? 'Hồ Chí Minh' : 'Ho Chi Minh',
      postalCode: '70000',
      country: locale === 'vi' ? 'Việt Nam' : 'Vietnam',
      phone: footerSettings?.contactPhone || undefined,
    };
  }

  /**
   * Format order date based on locale
   * @param createdAt - Order creation date
   * @param locale - Language locale
   * @returns Formatted date string
   */
  private formatOrderDate(createdAt: Date, locale: 'en' | 'vi'): string {
    if (!createdAt) {
      return locale === 'vi' ? 'Không xác định' : 'Unknown';
    }

    const date = new Date(createdAt);
    if (locale === 'vi') {
      return date.toLocaleDateString('vi-VN');
    } else {
      return date.toLocaleDateString('en-US');
    }
  }

  /**
   * Extract customer information with fallback handling
   * @param order - Order object
   * @param shippingAddress - Shipping address data
   * @returns Customer information object
   */
  private extractCustomerInfo(order: any, shippingAddress: AddressData): {
    name: string;
    email: string;
    phone?: string;
  } {
    return {
      name: shippingAddress.fullName || order.email || 'Customer',
      email: order.email || 'no-email@example.com',
      phone: shippingAddress.phone || order.shippingAddress?.phone || undefined,
    };
  }

  /**
   * Map payment status to standardized format
   * @param paymentStatus - Payment status from order
   * @returns Standardized payment status
   */
  private mapPaymentStatus(paymentStatus: string): 'pending' | 'completed' | 'failed' {
    if (!paymentStatus) return 'pending';

    const status = paymentStatus.toLowerCase();
    if (status.includes('completed') || status.includes('paid') || status.includes('success')) {
      return 'completed';
    }
    if (status.includes('failed') || status.includes('error') || status.includes('declined')) {
      return 'failed';
    }
    return 'pending';
  }

  /**
   * Get display name for shipping method
   * @param shippingMethod - Shipping method string
   * @param locale - Language locale
   * @returns Display name for shipping method
   */
  private getShippingMethodDisplayName(shippingMethod: string, locale: 'en' | 'vi'): string {
    const method = shippingMethod.toLowerCase();

    if (method.includes('standard')) {
      return locale === 'vi' ? 'Giao hàng tiêu chuẩn' : 'Standard Shipping';
    }
    if (method.includes('express')) {
      return locale === 'vi' ? 'Giao hàng nhanh' : 'Express Shipping';
    }
    if (method.includes('overnight')) {
      return locale === 'vi' ? 'Giao hàng trong ngày' : 'Overnight Shipping';
    }

    return shippingMethod || (locale === 'vi' ? 'Giao hàng tiêu chuẩn' : 'Standard Shipping');
  }

  /**
   * Send fallback order confirmation email without PDF attachment
   * @param order - The order object
   * @param locale - Language locale
   */
  private async sendFallbackOrderConfirmationEmail(order: any, locale: 'en' | 'vi'): Promise<void> {
    try {
      console.log(`Sending fallback order confirmation email for order ${order.orderNumber}`);

      const customerName = order.shippingAddress.fullName;

      const emailData = {
        orderNumber: order.orderNumber,
        customerName,
        orderDate: order.createdAt.toLocaleDateString(),
        items: order.items.map((item: any) => ({
          name: locale === 'vi' ? item.productNameVi : item.productNameEn,
          quantity: item.quantity,
          price: Number(item.price),
        })),
        subtotal: Number(order.subtotal),
        shippingCost: Number(order.shippingCost),
        taxAmount: Number(order.taxAmount),
        discountAmount: Number(order.discountAmount),
        total: Number(order.total),
        shippingAddress: order.shippingAddress,
      };

      const template = this.emailTemplateService.getSimplifiedOrderConfirmationTemplate(
        emailData,
        locale,
      );

      const emailSent = await this.emailService.sendEmail({
        to: order.email,
        subject: template.subject,
        html: template.html,
        locale,
      });

      if (emailSent) {
        console.log(`Fallback order confirmation email sent to ${order.email} for order ${order.orderNumber}`);
      } else {
        console.warn(`Fallback order confirmation email also failed for ${order.email} for order ${order.orderNumber}`);
      }
    } catch (error) {
      console.error(`Fallback order confirmation email failed for order ${order.orderNumber}:`, error);
    }
  }

  /**
   * Map payment method string to PaymentMethodData type
   * @param paymentMethod - Payment method string from order
   * @returns Mapped payment method type
   */
  private mapPaymentMethodType(paymentMethod: string): 'bank_transfer' | 'cash_on_delivery' | 'qr_code' {
    const method = paymentMethod.toLowerCase();
    if (method.includes('bank') || method.includes('transfer')) {
      return 'bank_transfer';
    }
    if (method.includes('cash') || method.includes('cod')) {
      return 'cash_on_delivery';
    }
    if (method.includes('qr')) {
      return 'qr_code';
    }
    // Default to bank transfer for unknown methods
    return 'bank_transfer';
  }

  /**
   * Get display name for payment method
   * @param paymentMethod - Payment method string
   * @param locale - Language locale
   * @returns Display name for payment method
   */
  private getPaymentMethodDisplayName(paymentMethod: string, locale: 'en' | 'vi'): string {
    const method = paymentMethod.toLowerCase();

    if (method.includes('bank') || method.includes('transfer')) {
      return locale === 'vi' ? 'Chuyển khoản ngân hàng' : 'Bank Transfer';
    }
    if (method.includes('cash') || method.includes('cod')) {
      return locale === 'vi' ? 'Thanh toán khi nhận hàng' : 'Cash on Delivery';
    }
    if (method.includes('qr')) {
      return locale === 'vi' ? 'Thanh toán QR Code' : 'QR Code Payment';
    }

    return paymentMethod;
  }

  /**
   * Get payment method details
   * @param paymentMethod - Payment method string
   * @param locale - Language locale
   * @returns Payment method details
   */
  private getPaymentMethodDetails(paymentMethod: string, locale: 'en' | 'vi'): string {
    const method = paymentMethod.toLowerCase();

    if (method.includes('bank') || method.includes('transfer')) {
      return locale === 'vi'
        ? 'Vui lòng chuyển khoản theo thông tin trong PDF đính kèm'
        : 'Please transfer payment according to the information in the attached PDF';
    }
    if (method.includes('cash') || method.includes('cod')) {
      return locale === 'vi'
        ? 'Thanh toán bằng tiền mặt khi nhận hàng'
        : 'Pay with cash upon delivery';
    }
    if (method.includes('qr')) {
      return locale === 'vi'
        ? 'Quét mã QR để thanh toán'
        : 'Scan QR code to make payment';
    }

    return '';
  }

  /**
   * Get shipping method description
   * @param shippingMethod - Shipping method string
   * @param locale - Language locale
   * @returns Shipping method description
   */
  private getShippingMethodDescription(shippingMethod: string, locale: 'en' | 'vi'): string {
    const method = shippingMethod.toLowerCase();

    if (method.includes('standard')) {
      return locale === 'vi' ? 'Giao hàng tiêu chuẩn (3-5 ngày)' : 'Standard delivery (3-5 days)';
    }
    if (method.includes('express')) {
      return locale === 'vi' ? 'Giao hàng nhanh (1-2 ngày)' : 'Express delivery (1-2 days)';
    }
    if (method.includes('overnight')) {
      return locale === 'vi' ? 'Giao hàng trong ngày' : 'Overnight delivery';
    }

    return shippingMethod;
  }

  /**
   * Send admin order notification email to shop owner
   *
   * Sends a comprehensive order notification to the admin email configured in footer settings.
   * Includes all order details, customer information, and payment status for quick order review.
   * Gracefully handles missing admin email configuration.
   *
   * @param order - The order object with complete details including items, addresses, and customer info
   * @returns Promise<void> - Resolves when email sending is complete (success or failure)
   *
   * @example
   * ```typescript
   * // Automatically called after order creation and customer email
   * await this.sendAdminOrderNotification(order);
   * ```
   *
   * @remarks
   * - Queries FooterSettingsService for admin email address
   * - Skips sending if contactEmail is not configured (logs warning)
   * - Includes customer name, email, phone, and all order items with SKUs
   * - Shows both shipping and billing addresses
   * - Displays payment method, status, and customer notes
   * - Uses English locale by default for admin emails
   * - Email failures are logged but do not interrupt order processing
   *
   * @see FooterSettingsService.getFooterSettings
   * @see EmailTemplateService.getAdminOrderNotificationTemplate
   */
  private async sendAdminOrderNotification(order: any): Promise<void> {
    try {
      // Query footer settings for admin email
      const footerSettings = await this.footerSettingsService.getFooterSettings();

      // Handle missing admin email gracefully
      if (!footerSettings.contactEmail) {
        console.warn(`Admin email not configured, skipping admin notification for order ${order.orderNumber}`);
        return;
      }

      const locale = 'en' as 'en' | 'vi'; // Default to English for admin emails

      // Prepare admin email data with all required fields
      const adminEmailData = {
        orderNumber: order.orderNumber,
        orderDate: order.createdAt.toLocaleDateString(),
        customerName: order.shippingAddress.fullName,
        customerEmail: order.email,
        customerPhone: order.shippingAddress.phone,
        items: order.items.map((item: any) => ({
          nameEn: item.productNameEn,
          nameVi: item.productNameVi,
          sku: item.sku,
          quantity: item.quantity,
          price: Number(item.price),
          total: Number(item.total),
        })),
        subtotal: Number(order.subtotal),
        shippingCost: Number(order.shippingCost),
        shippingMethod: order.shippingMethod,
        taxAmount: Number(order.taxAmount),
        discountAmount: Number(order.discountAmount),
        total: Number(order.total),
        shippingAddress: {
          fullName: order.shippingAddress.fullName,
          phone: order.shippingAddress.phone,
          addressLine1: order.shippingAddress.addressLine1,
          addressLine2: order.shippingAddress.addressLine2,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          postalCode: order.shippingAddress.postalCode,
          country: order.shippingAddress.country,
        },
        billingAddress: {
          fullName: order.billingAddress.fullName,
          phone: order.billingAddress.phone,
          addressLine1: order.billingAddress.addressLine1,
          addressLine2: order.billingAddress.addressLine2,
          city: order.billingAddress.city,
          state: order.billingAddress.state,
          postalCode: order.billingAddress.postalCode,
          country: order.billingAddress.country,
        },
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        notes: order.notes,
      };

      // Generate simplified admin email template
      const template = this.emailTemplateService.getSimplifiedAdminOrderNotificationTemplate(
        adminEmailData,
        locale,
      );

      // Send email to admin
      await this.emailService.sendEmail({
        to: footerSettings.contactEmail,
        subject: template.subject,
        html: template.html,
        locale,
      });

      console.log(`Admin notification sent to ${footerSettings.contactEmail} for order ${order.orderNumber}`);
    } catch (error) {
      // Log error but don't fail the order creation
      console.error(`Failed to send admin notification for order ${order.orderNumber}:`, error);
    }
  }

  /**
   * Calculate shipping cost based on method
   */
  private calculateShippingCost(shippingMethod: string): number {
    const shippingRates: Record<string, number> = {
      standard: 5.0,
      express: 15.0,
      overnight: 25.0,
    };

    return shippingRates[shippingMethod.toLowerCase()] || 5.0;
  }

  /**
   * Validate if promotion is valid
   */
  private isPromotionValid(promotion: any, orderAmount: number): boolean {
    const now = new Date();

    if (!promotion.isActive) {
      return false;
    }

    if (now < promotion.startDate || now > promotion.endDate) {
      return false;
    }

    if (
      promotion.minOrderAmount &&
      orderAmount < Number(promotion.minOrderAmount)
    ) {
      return false;
    }

    if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
      return false;
    }

    return true;
  }

  /**
   * Get all orders for a user
   */
  async findAllByUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: { displayOrder: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
        shippingAddress: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all orders (admin only)
   */
  async findAll(filters?: {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    startDate?: Date;
    endDate?: Date;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    // Add search functionality for order number or email
    if (filters?.search) {
      where.OR = [
        { orderNumber: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
        billingAddress: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single order by ID
   */
  async findOne(id: string, userId?: string, userRole?: UserRole) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: { displayOrder: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
        shippingAddress: true,
        billingAddress: true,
        promotion: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check authorization
    // - Admins can view any order
    // - Authenticated users can only view their own orders
    // - Guest users (no userId) can view guest orders (order.userId is null)
    if (userRole === STATUS.USER_ROLES.ADMIN) {
      // Admin can view any order
      return order;
    }

    if (userId && order.userId && order.userId !== userId) {
      // Authenticated user trying to view another user's order
      throw new ForbiddenException('You do not have access to this order');
    }

    if (userId && !order.userId) {
      // Authenticated user trying to view a guest order
      throw new ForbiddenException('You do not have access to this order');
    }

    if (!userId && order.userId) {
      // Guest user trying to view an authenticated user's order
      throw new ForbiddenException('You do not have access to this order');
    }

    // Allow: authenticated user viewing their own order, or guest viewing guest order

    return order;
  }

  /**
   * Set price for an order item (admin only)
   */
  async setOrderItemPrice(
    orderId: string,
    orderItemId: string,
    setOrderItemPriceDto: SetOrderItemPriceDto,
  ) {
    // Verify order exists
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify order item exists and belongs to this order
    const orderItem = order.items.find((item) => item.id === orderItemId);

    if (!orderItem) {
      throw new NotFoundException('Order item not found');
    }

    // Update the order item price and total
    const updatedOrderItem = await this.prisma.orderItem.update({
      where: { id: orderItemId },
      data: {
        price: setOrderItemPriceDto.price,
        total: setOrderItemPriceDto.price * orderItem.quantity,
      },
    });

    // Recalculate order total
    await this.recalculateOrderTotal(orderId);

    // Verify product base price remains unchanged
    const product = await this.prisma.product.findUnique({
      where: { id: orderItem.productId },
    });

    return {
      orderItem: updatedOrderItem,
      productBasePriceUnchanged: product
        ? Number(product.price) === 0
        : false,
    };
  }

  /**
   * Recalculate order total after price updates
   */
  async recalculateOrderTotal(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Calculate new subtotal from order items
    const subtotal = order.items.reduce((sum, item) => {
      return sum + Number(item.total);
    }, 0);

    // Recalculate tax based on new subtotal
    const taxAmount = subtotal * 0.1;

    // Recalculate total
    const total =
      subtotal +
      Number(order.shippingCost) +
      taxAmount -
      Number(order.discountAmount);

    // Check if all items are priced
    const allItemsPriced = order.items.every((item) => Number(item.price) > 0);

    // Update order status if all items are now priced
    const newStatus =
      allItemsPriced && order.status === OrderStatus.PENDING_QUOTE
        ? OrderStatus.PENDING
        : order.status;

    // Update order with new totals
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        subtotal,
        taxAmount,
        total,
        status: newStatus,
        requiresPricing: !allItemsPriced,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
        billingAddress: true,
      },
    });

    return updatedOrder;
  }

  /**
   * Update order status (admin only)
   */
  async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        shippingAddress: true,
        billingAddress: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Validate that order doesn't have unpriced items if moving to PROCESSING or SHIPPED
    if (
      updateOrderStatusDto.status === OrderStatus.PROCESSING ||
      updateOrderStatusDto.status === OrderStatus.SHIPPED
    ) {
      const hasUnpricedItems = order.items.some(
        (item) => Number(item.price) === 0,
      );

      if (hasUnpricedItems) {
        throw new BadRequestException(
          'Cannot process order with unpriced items. Please set prices for all items first.',
        );
      }
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: updateOrderStatusDto.status,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
        billingAddress: true,
      },
    });

    // Send appropriate email based on status
    if (updateOrderStatusDto.status === OrderStatus.SHIPPED) {
      await this.sendShippingNotificationEmail(updatedOrder);
    } else {
      await this.sendOrderStatusUpdateEmail(updatedOrder);
    }

    return updatedOrder;
  }

  /**
   * Send shipping notification email to customer
   *
   * Notifies the customer that their order has been shipped.
   * Includes tracking number if available.
   *
   * @param order - The order object with shipping details
   * @returns Promise<void> - Resolves when email sending is complete (success or failure)
   *
   * @example
   * ```typescript
   * // Automatically called when order status changes to SHIPPED
   * if (updateOrderStatusDto.status === OrderStatus.SHIPPED) {
   *   await this.sendShippingNotificationEmail(updatedOrder);
   * }
   * ```
   *
   * @remarks
   * - Uses EmailTemplateService to generate shipping notification template
   * - Includes tracking number if available in order data
   * - Email failures are logged but do not interrupt status update
   */
  private async sendShippingNotificationEmail(order: any): Promise<void> {
    try {
      const customerName = order.shippingAddress.fullName;
      const locale = 'en' as 'en' | 'vi'; // Default to English
      const isVietnamese = locale === 'vi';

      const emailData = {
        orderNumber: order.orderNumber,
        customerName,
        orderDate: order.createdAt.toLocaleDateString(),
        items: order.items.map((item: any) => ({
          name: isVietnamese ? item.productNameVi : item.productNameEn,
          quantity: item.quantity,
          price: Number(item.price),
        })),
        subtotal: Number(order.subtotal),
        shippingCost: Number(order.shippingCost),
        taxAmount: Number(order.taxAmount),
        discountAmount: Number(order.discountAmount),
        total: Number(order.total),
        shippingAddress: order.shippingAddress,
        trackingNumber: undefined,
      };

      const template =
        this.emailTemplateService.getSimplifiedShippingNotificationTemplate(
          emailData,
          locale,
        );

      const emailSent = await this.emailService.sendEmail({
        to: order.email,
        subject: template.subject,
        html: template.html,
        locale,
      });

      if (emailSent) {
        console.log(`Shipping notification email sent to ${order.email} for order ${order.orderNumber}`);
      } else {
        console.warn(`Failed to send shipping notification email to ${order.email} for order ${order.orderNumber}`);
      }
    } catch (error) {
      console.error(`Failed to send shipping notification email for order ${order.orderNumber}:`, error);
    }
  }

  /**
   * Send order status update email to customer
   *
   * Notifies the customer when their order status changes.
   * Includes status-specific messages explaining what the status means.
   *
   * @param order - The order object with current status
   * @returns Promise<void> - Resolves when email sending is complete (success or failure)
   *
   * @example
   * ```typescript
   * // Automatically called when order status changes (except SHIPPED which uses shipping notification)
   * await this.sendOrderStatusUpdateEmail(updatedOrder);
   * ```
   *
   * @remarks
   * - Uses EmailTemplateService to generate status update template
   * - Includes localized status names and status-specific messages
   * - Supports statuses: PENDING, PROCESSING, DELIVERED, CANCELLED, REFUNDED
   * - Email failures are logged but do not interrupt status update
   */
  private async sendOrderStatusUpdateEmail(order: any): Promise<void> {
    try {
      const customerName = order.shippingAddress.fullName;
      const locale = 'en' as 'en' | 'vi'; // Default to English
      const isVietnamese = locale === 'vi';

      const emailData = {
        orderNumber: order.orderNumber,
        customerName,
        orderDate: order.createdAt.toLocaleDateString(),
        items: order.items.map((item: any) => ({
          name: isVietnamese ? item.productNameVi : item.productNameEn,
          quantity: item.quantity,
          price: Number(item.price),
        })),
        subtotal: Number(order.subtotal),
        shippingCost: Number(order.shippingCost),
        taxAmount: Number(order.taxAmount),
        discountAmount: Number(order.discountAmount),
        total: Number(order.total),
        shippingAddress: order.shippingAddress,
        status: order.status,
      };

      const template =
        this.emailTemplateService.getSimplifiedOrderStatusUpdateTemplate(
          emailData,
          locale,
        );

      const emailSent = await this.emailService.sendEmail({
        to: order.email,
        subject: template.subject,
        html: template.html,
        locale,
      });

      if (emailSent) {
        console.log(`Order status update email sent to ${order.email} for order ${order.orderNumber} (status: ${order.status})`);
      } else {
        console.warn(`Failed to send order status update email to ${order.email} for order ${order.orderNumber}`);
      }
    } catch (error) {
      console.error(`Failed to send order status update email for order ${order.orderNumber}:`, error);
    }
  }

  /**
   * Update payment status (admin only)
   */
  async updatePaymentStatus(
    id: string,
    updatePaymentStatusDto: UpdatePaymentStatusDto,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        paymentStatus: updatePaymentStatusDto.paymentStatus,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
        billingAddress: true,
        promotion: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updatedOrder;
  }

  /**
   * Resend order confirmation email with PDF attachment
   * @param orderNumber - Order number to resend
   * @param customerEmail - Customer's email address
   * @param locale - Language locale for email content
   * @returns Promise<ResendResult> - Result of resend operation
   */
  async resendOrderConfirmationEmail(
    orderNumber: string,
    customerEmail: string,
    locale: 'en' | 'vi' = 'en'
  ): Promise<ResendResult> {
    try {
      // Use the ResendEmailHandlerService to handle the request
      const result = await this.resendEmailHandlerService.handleResendRequest(
        orderNumber,
        customerEmail,
        locale
      );

      return result;

    } catch (error) {
      console.error(`Failed to resend order confirmation email for order ${orderNumber}:`, error);

      return {
        success: false,
        message: locale === 'vi'
          ? 'Đã xảy ra lỗi khi gửi lại email. Vui lòng thử lại sau.'
          : 'An error occurred while resending the email. Please try again later.',
        error: error.message,
      };
    }
  }
}