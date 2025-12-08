import { Injectable } from '@nestjs/common';

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
export class EmailTemplateService {
  /**
   * Wraps email content in a consistent HTML layout with proper structure
   * @param content - The main email content HTML
   * @param locale - Language locale (en or vi)
   * @returns Complete HTML email with DOCTYPE, meta tags, and styling
   */
  private wrapInEmailLayout(content: string, locale: 'en' | 'vi'): string {
    const contactInfo =
      locale === 'vi'
        ? 'Nếu bạn có câu hỏi, vui lòng liên hệ với chúng tôi.'
        : 'If you have any questions, please contact us.';

    return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Email Notification</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, Helvetica, sans-serif;
      background-color: #f4f4f4;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .email-header {
      background-color: #2c3e50;
      color: #ffffff;
      padding: 20px;
      text-align: center;
    }
    .email-header h1 {
      margin: 0;
      font-size: 24px;
    }
    .email-content {
      padding: 30px 20px;
      color: #333333;
      line-height: 1.6;
    }
    .email-footer {
      background-color: #ecf0f1;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #7f8c8d;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    .info-table td {
      padding: 8px;
      border-bottom: 1px solid #ecf0f1;
    }
    .info-table td:first-child {
      font-weight: bold;
      width: 40%;
    }
    .items-table {
      margin: 20px 0;
    }
    .items-table th {
      background-color: #34495e;
      color: #ffffff;
      padding: 10px;
      text-align: left;
    }
    .items-table td {
      padding: 10px;
      border-bottom: 1px solid #ecf0f1;
    }
    .total-row {
      font-weight: bold;
      font-size: 16px;
      background-color: #f8f9fa;
    }
    .address-box {
      background-color: #f8f9fa;
      padding: 15px;
      margin: 10px 0;
      border-left: 4px solid #3498db;
    }
    @media only screen and (max-width: 600px) {
      .email-content {
        padding: 20px 15px;
      }
      .items-table th,
      .items-table td {
        padding: 8px 5px;
        font-size: 14px;
      }
    }
  </style>
</head>
<body>
  <table class="email-container" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td class="email-header">
        <h1>AlaCraft</h1>
      </td>
    </tr>
    <tr>
      <td class="email-content">
        ${content}
      </td>
    </tr>
    <tr>
      <td class="email-footer">
        <p>${contactInfo}</p>
        <p>&copy; ${new Date().getFullYear()} AlaCraft. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Formats currency values with proper decimal places and symbols
   * @param amount - The amount to format
   * @param locale - Language locale (en or vi)
   * @returns Formatted currency string
   */
  private formatCurrency(amount: number, locale: 'en' | 'vi'): string {
    if (locale === 'vi') {
      // VND uses 0 decimal places
      return `${amount.toLocaleString('vi-VN')} ₫`;
    }
    // USD uses 2 decimal places
    return `$${amount.toFixed(2)}`;
  }

  /**
   * Formats dates in a human-readable format
   * @param date - The date to format (Date object or string)
   * @param locale - Language locale (en or vi)
   * @returns Formatted date string
   */
  private formatDate(date: Date | string, locale: 'en' | 'vi'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (locale === 'vi') {
      return dateObj.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Admin order notification email template
   *
   * Generates a comprehensive HTML email for shop owners with complete order details.
   * Includes customer information, all order items with SKUs, addresses, and payment info.
   *
   * @param data - Admin order email data with all order and customer details
   * @param locale - Language locale (en or vi), defaults to 'en'
   * @returns Email subject and HTML content wrapped in professional layout
   *
   * @example
   * ```typescript
   * const adminEmailData = {
   *   orderNumber: 'ORD-123',
   *   orderDate: new Date().toISOString(),
   *   customerName: 'John Doe',
   *   customerEmail: 'john@example.com',
   *   customerPhone: '+1234567890',
   *   items: [{
   *     nameEn: 'Handmade Vase',
   *     nameVi: 'Bình gốm thủ công',
   *     sku: 'VASE-001',
   *     quantity: 2,
   *     price: 50.00,
   *     total: 100.00
   *   }],
   *   subtotal: 100.00,
   *   shippingCost: 10.00,
   *   shippingMethod: 'Standard Shipping',
   *   taxAmount: 11.00,
   *   discountAmount: 0,
   *   total: 121.00,
   *   shippingAddress: { ... },
   *   billingAddress: { ... },
   *   paymentMethod: 'Bank Transfer',
   *   paymentStatus: 'PENDING',
   *   notes: 'Please gift wrap'
   * };
   *
   * const template = emailTemplateService.getAdminOrderNotificationTemplate(adminEmailData, 'en');
   * // Returns: { subject: 'New Order #ORD-123', html: '<html>...</html>' }
   * ```
   *
   * @remarks
   * - Uses wrapInEmailLayout for consistent HTML structure
   * - Formats currency with formatCurrency helper
   * - Formats dates with formatDate helper
   * - Includes both English and Vietnamese product names
   * - Shows customer notes if provided
   * - Optimized for quick order review by shop owners
   */
  getAdminOrderNotificationTemplate(
    data: AdminOrderEmailData,
    locale: 'en' | 'vi' = 'en',
  ): { subject: string; html: string } {
    const translations = {
      en: {
        subject: `New Order #${data.orderNumber}`,
        title: 'New Order Received',
        orderDetails: 'Order Details',
        orderNumber: 'Order Number',
        orderDate: 'Order Date',
        customerInfo: 'Customer Information',
        name: 'Name',
        email: 'Email',
        phone: 'Phone',
        items: 'Order Items',
        product: 'Product',
        sku: 'SKU',
        quantity: 'Qty',
        price: 'Price',
        total: 'Total',
        subtotal: 'Subtotal',
        shipping: 'Shipping',
        shippingMethod: 'Shipping Method',
        tax: 'Tax',
        discount: 'Discount',
        grandTotal: 'Grand Total',
        shippingAddress: 'Shipping Address',
        billingAddress: 'Billing Address',
        paymentInfo: 'Payment Information',
        paymentMethod: 'Payment Method',
        paymentStatus: 'Payment Status',
        customerNotes: 'Customer Notes',
      },
      vi: {
        subject: `Đơn hàng mới #${data.orderNumber}`,
        title: 'Đã nhận đơn hàng mới',
        orderDetails: 'Chi tiết đơn hàng',
        orderNumber: 'Mã đơn hàng',
        orderDate: 'Ngày đặt hàng',
        customerInfo: 'Thông tin khách hàng',
        name: 'Tên',
        email: 'Email',
        phone: 'Điện thoại',
        items: 'Sản phẩm đặt hàng',
        product: 'Sản phẩm',
        sku: 'Mã SKU',
        quantity: 'SL',
        price: 'Giá',
        total: 'Tổng',
        subtotal: 'Tạm tính',
        shipping: 'Vận chuyển',
        shippingMethod: 'Phương thức vận chuyển',
        tax: 'Thuế',
        discount: 'Giảm giá',
        grandTotal: 'Tổng cộng',
        shippingAddress: 'Địa chỉ giao hàng',
        billingAddress: 'Địa chỉ thanh toán',
        paymentInfo: 'Thông tin thanh toán',
        paymentMethod: 'Phương thức thanh toán',
        paymentStatus: 'Trạng thái thanh toán',
        customerNotes: 'Ghi chú của khách hàng',
      },
    };

    const t = translations[locale];

    const itemsRows = data.items
      .map(
        (item) => `
        <tr>
          <td>${locale === 'vi' ? item.nameVi : item.nameEn}</td>
          <td>${item.sku}</td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right;">${this.formatCurrency(item.price, locale)}</td>
          <td style="text-align: right;">${this.formatCurrency(item.total, locale)}</td>
        </tr>
      `,
      )
      .join('');

    const content = `
      <h2>${t.title}</h2>

      <h3>${t.orderDetails}</h3>
      <table class="info-table">
        <tr>
          <td>${t.orderNumber}:</td>
          <td>${data.orderNumber}</td>
        </tr>
        <tr>
          <td>${t.orderDate}:</td>
          <td>${this.formatDate(data.orderDate, locale)}</td>
        </tr>
      </table>

      <h3>${t.customerInfo}</h3>
      <table class="info-table">
        <tr>
          <td>${t.name}:</td>
          <td>${data.customerName}</td>
        </tr>
        <tr>
          <td>${t.email}:</td>
          <td>${data.customerEmail}</td>
        </tr>
        <tr>
          <td>${t.phone}:</td>
          <td>${data.customerPhone}</td>
        </tr>
      </table>

      <h3>${t.items}</h3>
      <table class="items-table">
        <thead>
          <tr>
            <th>${t.product}</th>
            <th>${t.sku}</th>
            <th style="text-align: center;">${t.quantity}</th>
            <th style="text-align: right;">${t.price}</th>
            <th style="text-align: right;">${t.total}</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
          <tr>
            <td colspan="4" style="text-align: right;"><strong>${t.subtotal}:</strong></td>
            <td style="text-align: right;"><strong>${this.formatCurrency(data.subtotal, locale)}</strong></td>
          </tr>
          <tr>
            <td colspan="4" style="text-align: right;">${t.shipping}:</td>
            <td style="text-align: right;">${this.formatCurrency(data.shippingCost, locale)}</td>
          </tr>
          ${
            data.taxAmount > 0
              ? `
          <tr>
            <td colspan="4" style="text-align: right;">${t.tax}:</td>
            <td style="text-align: right;">${this.formatCurrency(data.taxAmount, locale)}</td>
          </tr>
          `
              : ''
          }
          ${
            data.discountAmount > 0
              ? `
          <tr>
            <td colspan="4" style="text-align: right;">${t.discount}:</td>
            <td style="text-align: right;">-${this.formatCurrency(data.discountAmount, locale)}</td>
          </tr>
          `
              : ''
          }
          <tr class="total-row">
            <td colspan="4" style="text-align: right;"><strong>${t.grandTotal}:</strong></td>
            <td style="text-align: right;"><strong>${this.formatCurrency(data.total, locale)}</strong></td>
          </tr>
        </tbody>
      </table>

      <h3>${t.shippingAddress}</h3>
      <div class="address-box">
        <p><strong>${data.shippingAddress.fullName}</strong></p>
        <p>${data.shippingAddress.phone}</p>
        <p>${data.shippingAddress.addressLine1}</p>
        ${data.shippingAddress.addressLine2 ? `<p>${data.shippingAddress.addressLine2}</p>` : ''}
        <p>${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}</p>
        <p>${data.shippingAddress.country}</p>
      </div>

      <h3>${t.billingAddress}</h3>
      <div class="address-box">
        <p><strong>${data.billingAddress.fullName}</strong></p>
        <p>${data.billingAddress.phone}</p>
        <p>${data.billingAddress.addressLine1}</p>
        ${data.billingAddress.addressLine2 ? `<p>${data.billingAddress.addressLine2}</p>` : ''}
        <p>${data.billingAddress.city}, ${data.billingAddress.state} ${data.billingAddress.postalCode}</p>
        <p>${data.billingAddress.country}</p>
      </div>

      <h3>${t.paymentInfo}</h3>
      <table class="info-table">
        <tr>
          <td>${t.paymentMethod}:</td>
          <td>${data.paymentMethod}</td>
        </tr>
        <tr>
          <td>${t.paymentStatus}:</td>
          <td>${data.paymentStatus}</td>
        </tr>
        <tr>
          <td>${t.shippingMethod}:</td>
          <td>${data.shippingMethod}</td>
        </tr>
      </table>

      ${
        data.notes
          ? `
      <h3>${t.customerNotes}</h3>
      <div class="address-box">
        <p>${data.notes}</p>
      </div>
      `
          : ''
      }
    `;

    return {
      subject: t.subject,
      html: this.wrapInEmailLayout(content, locale),
    };
  }

  /**
   * Order confirmation email template for customers
   *
   * Generates a professional HTML email confirming the customer's order.
   * Includes order details, items, totals, and shipping address.
   *
   * @param data - Order email data with items and totals
   * @param locale - Language locale (en or vi), defaults to 'en'
   * @returns Email subject and HTML content wrapped in professional layout
   *
   * @example
   * ```typescript
   * const orderData = {
   *   orderNumber: 'ORD-123',
   *   customerName: 'John Doe',
   *   orderDate: new Date().toISOString(),
   *   items: [{
   *     name: 'Handmade Vase',
   *     quantity: 2,
   *     price: 50.00
   *   }],
   *   subtotal: 100.00,
   *   shippingCost: 10.00,
   *   taxAmount: 11.00,
   *   discountAmount: 0,
   *   total: 121.00,
   *   shippingAddress: { ... }
   * };
   *
   * const template = emailTemplateService.getOrderConfirmationTemplate(orderData, 'en');
   * // Returns: { subject: 'Order Confirmation #ORD-123', html: '<html>...</html>' }
   * ```
   *
   * @remarks
   * - Uses wrapInEmailLayout for consistent HTML structure
   * - Formats currency and dates appropriately for locale
   * - Includes responsive design for mobile devices
   * - Shows discount and tax if applicable
   */
  getOrderConfirmationTemplate(
    data: OrderEmailData,
    locale: 'en' | 'vi' = 'en',
  ): { subject: string; html: string } {
    const translations = {
      en: {
        subject: `Order Confirmation #${data.orderNumber}`,
        title: 'Thank you for your order!',
        greeting: `Hello ${data.customerName},`,
        intro: 'We have received your order and are processing it.',
        orderDetails: 'Order Details',
        orderNumber: 'Order Number',
        orderDate: 'Order Date',
        items: 'Order Items',
        product: 'Product',
        quantity: 'Quantity',
        price: 'Price',
        subtotal: 'Subtotal',
        shipping: 'Shipping',
        tax: 'Tax',
        discount: 'Discount',
        total: 'Total',
        shippingAddress: 'Shipping Address',
        closing: 'We will notify you when your order ships.',
        signature: 'Best regards,<br>AlaCraft Team',
      },
      vi: {
        subject: `Xác nhận đơn hàng #${data.orderNumber}`,
        title: 'Cảm ơn bạn đã đặt hàng!',
        greeting: `Xin chào ${data.customerName},`,
        intro: 'Chúng tôi đã nhận được đơn hàng của bạn và đang xử lý.',
        orderDetails: 'Chi tiết đơn hàng',
        orderNumber: 'Mã đơn hàng',
        orderDate: 'Ngày đặt hàng',
        items: 'Sản phẩm đặt hàng',
        product: 'Sản phẩm',
        quantity: 'Số lượng',
        price: 'Giá',
        subtotal: 'Tạm tính',
        shipping: 'Phí vận chuyển',
        tax: 'Thuế',
        discount: 'Giảm giá',
        total: 'Tổng cộng',
        shippingAddress: 'Địa chỉ giao hàng',
        closing: 'Chúng tôi sẽ thông báo cho bạn khi đơn hàng được giao.',
        signature: 'Trân trọng,<br>Đội ngũ AlaCraft',
      },
    };

    const t = translations[locale];

    const itemsRows = data.items
      .map(
        (item) => `
        <tr>
          <td>${item.name}</td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right;">${this.formatCurrency(item.price, locale)}</td>
          <td style="text-align: right;">${this.formatCurrency(item.price * item.quantity, locale)}</td>
        </tr>
      `,
      )
      .join('');

    const content = `
      <h2>${t.title}</h2>
      <p>${t.greeting}</p>
      <p>${t.intro}</p>

      <h3>${t.orderDetails}</h3>
      <table class="info-table">
        <tr>
          <td>${t.orderNumber}:</td>
          <td>${data.orderNumber}</td>
        </tr>
        <tr>
          <td>${t.orderDate}:</td>
          <td>${this.formatDate(data.orderDate, locale)}</td>
        </tr>
      </table>

      <h3>${t.items}</h3>
      <table class="items-table">
        <thead>
          <tr>
            <th>${t.product}</th>
            <th style="text-align: center;">${t.quantity}</th>
            <th style="text-align: right;">${t.price}</th>
            <th style="text-align: right;">${t.total}</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
          <tr>
            <td colspan="3" style="text-align: right;"><strong>${t.subtotal}:</strong></td>
            <td style="text-align: right;"><strong>${this.formatCurrency(data.subtotal, locale)}</strong></td>
          </tr>
          <tr>
            <td colspan="3" style="text-align: right;">${t.shipping}:</td>
            <td style="text-align: right;">${this.formatCurrency(data.shippingCost, locale)}</td>
          </tr>
          ${
            data.taxAmount && data.taxAmount > 0
              ? `
          <tr>
            <td colspan="3" style="text-align: right;">${t.tax}:</td>
            <td style="text-align: right;">${this.formatCurrency(data.taxAmount, locale)}</td>
          </tr>
          `
              : ''
          }
          ${
            data.discountAmount && data.discountAmount > 0
              ? `
          <tr>
            <td colspan="3" style="text-align: right;">${t.discount}:</td>
            <td style="text-align: right;">-${this.formatCurrency(data.discountAmount, locale)}</td>
          </tr>
          `
              : ''
          }
          <tr class="total-row">
            <td colspan="3" style="text-align: right;"><strong>${t.total}:</strong></td>
            <td style="text-align: right;"><strong>${this.formatCurrency(data.total, locale)}</strong></td>
          </tr>
        </tbody>
      </table>

      <h3>${t.shippingAddress}</h3>
      <div class="address-box">
        <p><strong>${data.shippingAddress.fullName}</strong></p>
        <p>${data.shippingAddress.addressLine1}</p>
        ${data.shippingAddress.addressLine2 ? `<p>${data.shippingAddress.addressLine2}</p>` : ''}
        <p>${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}</p>
        <p>${data.shippingAddress.country}</p>
      </div>

      <p>${t.closing}</p>
      <p>${t.signature}</p>
    `;

    return {
      subject: t.subject,
      html: this.wrapInEmailLayout(content, locale),
    };
  }

  /**
   * Shipping notification email template for customers
   *
   * Generates an HTML email notifying the customer that their order has been shipped.
   * Includes tracking number if available.
   *
   * @param data - Order email data with shipping details
   * @param locale - Language locale (en or vi), defaults to 'en'
   * @returns Email subject and HTML content wrapped in professional layout
   *
   * @example
   * ```typescript
   * const orderData = {
   *   orderNumber: 'ORD-123',
   *   customerName: 'John Doe',
   *   orderDate: new Date().toISOString(),
   *   items: [...],
   *   subtotal: 100.00,
   *   shippingCost: 10.00,
   *   taxAmount: 11.00,
   *   discountAmount: 0,
   *   total: 121.00,
   *   shippingAddress: { ... },
   *   trackingNumber: 'TRACK123456'
   * };
   *
   * const template = emailTemplateService.getShippingNotificationTemplate(orderData, 'en');
   * // Returns: { subject: 'Order #ORD-123 has been shipped', html: '<html>...</html>' }
   * ```
   *
   * @remarks
   * - Uses wrapInEmailLayout for consistent HTML structure
   * - Shows tracking number prominently if provided
   * - Includes shipping address for reference
   */
  getShippingNotificationTemplate(
    data: OrderEmailData,
    locale: 'en' | 'vi' = 'en',
  ): { subject: string; html: string } {
    const translations = {
      en: {
        subject: `Order #${data.orderNumber} has been shipped`,
        title: 'Your order is on the way!',
        greeting: `Hello ${data.customerName},`,
        intro: `Your order #${data.orderNumber} has been shipped.`,
        trackingNumber: 'Tracking Number',
        shippingAddress: 'Shipping Address',
        closing: 'Thank you for your purchase!',
        signature: 'Best regards,<br>AlaCraft Team',
      },
      vi: {
        subject: `Đơn hàng #${data.orderNumber} đã được giao cho đơn vị vận chuyển`,
        title: 'Đơn hàng của bạn đang trên đường giao!',
        greeting: `Xin chào ${data.customerName},`,
        intro: `Đơn hàng #${data.orderNumber} của bạn đã được giao cho đơn vị vận chuyển.`,
        trackingNumber: 'Mã vận đơn',
        shippingAddress: 'Địa chỉ giao hàng',
        closing: 'Cảm ơn bạn đã mua hàng!',
        signature: 'Trân trọng,<br>Đội ngũ AlaCraft',
      },
    };

    const t = translations[locale];

    const content = `
      <h2>${t.title}</h2>
      <p>${t.greeting}</p>
      <p>${t.intro}</p>

      ${
        data.trackingNumber
          ? `
      <table class="info-table">
        <tr>
          <td>${t.trackingNumber}:</td>
          <td>${data.trackingNumber}</td>
        </tr>
      </table>
      `
          : ''
      }

      <h3>${t.shippingAddress}</h3>
      <div class="address-box">
        <p><strong>${data.shippingAddress.fullName}</strong></p>
        <p>${data.shippingAddress.addressLine1}</p>
        ${data.shippingAddress.addressLine2 ? `<p>${data.shippingAddress.addressLine2}</p>` : ''}
        <p>${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}</p>
      </div>

      <p>${t.closing}</p>
      <p>${t.signature}</p>
    `;

    return {
      subject: t.subject,
      html: this.wrapInEmailLayout(content, locale),
    };
  }

  /**
   * Order status update email template for customers
   *
   * Generates an HTML email notifying the customer of an order status change.
   * Includes status-specific messages explaining what the status means.
   *
   * @param data - Order email data with current status
   * @param locale - Language locale (en or vi), defaults to 'en'
   * @returns Email subject and HTML content wrapped in professional layout
   *
   * @example
   * ```typescript
   * const orderData = {
   *   orderNumber: 'ORD-123',
   *   customerName: 'John Doe',
   *   orderDate: new Date().toISOString(),
   *   items: [...],
   *   subtotal: 100.00,
   *   shippingCost: 10.00,
   *   taxAmount: 11.00,
   *   discountAmount: 0,
   *   total: 121.00,
   *   shippingAddress: { ... },
   *   status: 'processing'
   * };
   *
   * const template = emailTemplateService.getOrderStatusUpdateTemplate(orderData, 'en');
   * // Returns: { subject: 'Order #ORD-123 Status Update', html: '<html>...</html>' }
   * ```
   *
   * @remarks
   * - Uses wrapInEmailLayout for consistent HTML structure
   * - Provides localized status names (pending, processing, shipped, delivered, cancelled, refunded)
   * - Includes helpful status-specific messages for each status
   * - Supports both English and Vietnamese
   */
  getOrderStatusUpdateTemplate(
    data: OrderEmailData,
    locale: 'en' | 'vi' = 'en',
  ): { subject: string; html: string } {
    const statusTranslations = {
      en: {
        pending: 'Pending',
        processing: 'Processing',
        shipped: 'Shipped',
        delivered: 'Delivered',
        cancelled: 'Cancelled',
        refunded: 'Refunded',
      },
      vi: {
        pending: 'Chờ xử lý',
        processing: 'Đang xử lý',
        shipped: 'Đã giao vận',
        delivered: 'Đã giao hàng',
        cancelled: 'Đã hủy',
        refunded: 'Đã hoàn tiền',
      },
    };

    const statusMessages = {
      en: {
        pending:
          'Your order has been received and is awaiting processing.',
        processing:
          'Your order is currently being prepared for shipment.',
        shipped:
          'Your order has been shipped and is on its way to you.',
        delivered:
          'Your order has been successfully delivered. We hope you enjoy your purchase!',
        cancelled:
          'Your order has been cancelled. If you have any questions, please contact us.',
        refunded:
          'Your order has been refunded. The amount will be credited to your account within 5-7 business days.',
      },
      vi: {
        pending:
          'Đơn hàng của bạn đã được nhận và đang chờ xử lý.',
        processing:
          'Đơn hàng của bạn đang được chuẩn bị để giao hàng.',
        shipped:
          'Đơn hàng của bạn đã được giao cho đơn vị vận chuyển và đang trên đường đến bạn.',
        delivered:
          'Đơn hàng của bạn đã được giao thành công. Chúng tôi hy vọng bạn hài lòng với sản phẩm!',
        cancelled:
          'Đơn hàng của bạn đã bị hủy. Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.',
        refunded:
          'Đơn hàng của bạn đã được hoàn tiền. Số tiền sẽ được chuyển vào tài khoản của bạn trong vòng 5-7 ngày làm việc.',
      },
    };

    const translations = {
      en: {
        subject: `Order #${data.orderNumber} Status Update`,
        title: 'Your order has been updated',
        greeting: `Hello ${data.customerName},`,
        statusLabel: 'New Status',
        signature: 'Best regards,<br>AlaCraft Team',
      },
      vi: {
        subject: `Cập nhật đơn hàng #${data.orderNumber}`,
        title: 'Đơn hàng của bạn đã được cập nhật',
        greeting: `Xin chào ${data.customerName},`,
        statusLabel: 'Trạng thái mới',
        signature: 'Trân trọng,<br>Đội ngũ AlaCraft',
      },
    };

    const t = translations[locale];
    const statusText =
      (statusTranslations[locale] as any)[data.status as string] ||
      data.status;
    const statusMessage =
      (statusMessages[locale] as any)[data.status as string] ||
      '';

    const content = `
      <h2>${t.title}</h2>
      <p>${t.greeting}</p>

      <table class="info-table">
        <tr>
          <td>${t.statusLabel}:</td>
          <td><strong>${statusText}</strong></td>
        </tr>
      </table>

      ${statusMessage ? `<p>${statusMessage}</p>` : ''}

      <p>${t.signature}</p>
    `;

    return {
      subject: t.subject,
      html: this.wrapInEmailLayout(content, locale),
    };
  }

  /**
   * Welcome email template for new users
   *
   * Generates a welcome email for newly registered users.
   * Optionally includes email verification link.
   *
   * @param data - User email data with name and optional verification token
   * @param locale - Language locale (en or vi), defaults to 'en'
   * @returns Email subject and HTML content
   *
   * @example
   * ```typescript
   * const userData = {
   *   name: 'John Doe',
   *   email: 'john@example.com',
   *   verificationToken: 'abc123...'
   * };
   *
   * const template = emailTemplateService.getWelcomeEmailTemplate(userData, 'en');
   * // Returns: { subject: 'Welcome to our store!', html: '<html>...</html>' }
   * ```
   *
   * @remarks
   * - Includes verification link if verificationToken is provided
   * - Uses FRONTEND_URL environment variable for links
   */
  getWelcomeEmailTemplate(
    data: UserEmailData,
    locale: 'en' | 'vi' = 'en',
  ): { subject: string; html: string } {
    if (locale === 'vi') {
      return {
        subject: 'Chào mừng bạn đến với cửa hàng của chúng tôi!',
        html: `
          <h2>Chào mừng bạn!</h2>
          <p>Xin chào ${data.name},</p>
          <p>Cảm ơn bạn đã đăng ký tài khoản với chúng tôi.</p>
          <p>Bạn có thể bắt đầu mua sắm các sản phẩm thủ công độc đáo của chúng tôi ngay bây giờ!</p>

          ${data.verificationToken ? `<p>Vui lòng xác minh email của bạn bằng cách nhấp vào liên kết sau:<br><a href="${process.env.FRONTEND_URL}/verify-email?token=${data.verificationToken}">Xác minh Email</a></p>` : ''}

          <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
        `,
      };
    }

    return {
      subject: 'Welcome to our store!',
      html: `
        <h2>Welcome!</h2>
        <p>Hello ${data.name},</p>
        <p>Thank you for registering an account with us.</p>
        <p>You can now start shopping our unique handmade products!</p>

        ${data.verificationToken ? `<p>Please verify your email by clicking the link below:<br><a href="${process.env.FRONTEND_URL}/verify-email?token=${data.verificationToken}">Verify Email</a></p>` : ''}

        <p>Best regards,<br>Support Team</p>
      `,
    };
  }

  /**
   * Password reset email template
   *
   * Generates a password reset email with a secure reset link.
   * Link expires after 1 hour.
   *
   * @param data - User email data with name and reset token
   * @param locale - Language locale (en or vi), defaults to 'en'
   * @returns Email subject and HTML content
   *
   * @example
   * ```typescript
   * const userData = {
   *   name: 'John Doe',
   *   email: 'john@example.com',
   *   resetToken: 'xyz789...'
   * };
   *
   * const template = emailTemplateService.getPasswordResetTemplate(userData, 'en');
   * // Returns: { subject: 'Password Reset', html: '<html>...</html>' }
   * ```
   *
   * @remarks
   * - Includes reset link with token parameter
   * - Uses FRONTEND_URL environment variable for links
   * - Warns user that link expires in 1 hour
   * - Advises to ignore email if not requested
   */
  getPasswordResetTemplate(
    data: UserEmailData,
    locale: 'en' | 'vi' = 'en',
  ): { subject: string; html: string } {
    if (locale === 'vi') {
      return {
        subject: 'Đặt lại mật khẩu',
        html: `
          <h2>Yêu cầu đặt lại mật khẩu</h2>
          <p>Xin chào ${data.name},</p>
          <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>

          ${data.resetToken ? `<p>Nhấp vào liên kết sau để đặt lại mật khẩu của bạn:<br><a href="${process.env.FRONTEND_URL}/reset-password?token=${data.resetToken}">Đặt lại mật khẩu</a></p>` : ''}

          <p>Liên kết này sẽ hết hạn sau 1 giờ.</p>
          <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>

          <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
        `,
      };
    }

    return {
      subject: 'Password Reset',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${data.name},</p>
        <p>We received a request to reset the password for your account.</p>

        ${data.resetToken ? `<p>Click the link below to reset your password:<br><a href="${process.env.FRONTEND_URL}/reset-password?token=${data.resetToken}">Reset Password</a></p>` : ''}

        <p>This link will expire in 1 hour.</p>
        <p>If you did not request a password reset, please ignore this email.</p>

        <p>Best regards,<br>Support Team</p>
      `,
    };
  }
}
