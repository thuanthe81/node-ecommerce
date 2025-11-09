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

export interface UserEmailData {
  name: string;
  email: string;
  resetToken?: string;
  verificationToken?: string;
}

@Injectable()
export class EmailTemplateService {
  /**
   * Order confirmation email template
   */
  getOrderConfirmationTemplate(
    data: OrderEmailData,
    locale: 'en' | 'vi' = 'en',
  ): { subject: string; html: string } {
    if (locale === 'vi') {
      return {
        subject: `Xác nhận đơn hàng #${data.orderNumber}`,
        html: `
          <h2>Cảm ơn bạn đã đặt hàng!</h2>
          <p>Xin chào ${data.customerName},</p>
          <p>Chúng tôi đã nhận được đơn hàng của bạn và đang xử lý.</p>
          
          <h3>Chi tiết đơn hàng</h3>
          <p><strong>Số đơn hàng:</strong> ${data.orderNumber}</p>
          <p><strong>Ngày đặt hàng:</strong> ${data.orderDate}</p>
          
          <h3>Sản phẩm</h3>
          ${data.items.map((item) => `<p>${item.name} x ${item.quantity} - ${item.price.toLocaleString('vi-VN')} ₫</p>`).join('')}
          
          <h3>Tổng cộng</h3>
          <p>Tạm tính: ${data.subtotal.toLocaleString('vi-VN')} ₫</p>
          <p>Phí vận chuyển: ${data.shippingCost.toLocaleString('vi-VN')} ₫</p>
          <p><strong>Tổng cộng: ${data.total.toLocaleString('vi-VN')} ₫</strong></p>
          
          <h3>Địa chỉ giao hàng</h3>
          <p>${data.shippingAddress.fullName}</p>
          <p>${data.shippingAddress.addressLine1}</p>
          ${data.shippingAddress.addressLine2 ? `<p>${data.shippingAddress.addressLine2}</p>` : ''}
          <p>${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}</p>
          <p>${data.shippingAddress.country}</p>
          
          <p>Chúng tôi sẽ thông báo cho bạn khi đơn hàng được giao.</p>
          <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
        `,
      };
    }

    return {
      subject: `Order Confirmation #${data.orderNumber}`,
      html: `
        <h2>Thank you for your order!</h2>
        <p>Hello ${data.customerName},</p>
        <p>We have received your order and are processing it.</p>
        
        <h3>Order Details</h3>
        <p><strong>Order Number:</strong> ${data.orderNumber}</p>
        <p><strong>Order Date:</strong> ${data.orderDate}</p>
        
        <h3>Items</h3>
        ${data.items.map((item) => `<p>${item.name} x ${item.quantity} - $${item.price.toFixed(2)}</p>`).join('')}
        
        <h3>Order Total</h3>
        <p>Subtotal: $${data.subtotal.toFixed(2)}</p>
        <p>Shipping: $${data.shippingCost.toFixed(2)}</p>
        <p><strong>Total: $${data.total.toFixed(2)}</strong></p>
        
        <h3>Shipping Address</h3>
        <p>${data.shippingAddress.fullName}</p>
        <p>${data.shippingAddress.addressLine1}</p>
        ${data.shippingAddress.addressLine2 ? `<p>${data.shippingAddress.addressLine2}</p>` : ''}
        <p>${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}</p>
        <p>${data.shippingAddress.country}</p>
        
        <p>We will notify you when your order ships.</p>
        <p>Best regards,<br>Support Team</p>
      `,
    };
  }

  /**
   * Shipping notification email template
   */
  getShippingNotificationTemplate(
    data: OrderEmailData,
    locale: 'en' | 'vi' = 'en',
  ): { subject: string; html: string } {
    if (locale === 'vi') {
      return {
        subject: `Đơn hàng #${data.orderNumber} đã được giao cho đơn vị vận chuyển`,
        html: `
          <h2>Đơn hàng của bạn đang trên đường giao!</h2>
          <p>Xin chào ${data.customerName},</p>
          <p>Đơn hàng #${data.orderNumber} của bạn đã được giao cho đơn vị vận chuyển.</p>
          
          ${data.trackingNumber ? `<p><strong>Mã vận đơn:</strong> ${data.trackingNumber}</p>` : ''}
          
          <h3>Địa chỉ giao hàng</h3>
          <p>${data.shippingAddress.fullName}</p>
          <p>${data.shippingAddress.addressLine1}</p>
          ${data.shippingAddress.addressLine2 ? `<p>${data.shippingAddress.addressLine2}</p>` : ''}
          <p>${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}</p>
          
          <p>Cảm ơn bạn đã mua hàng!</p>
          <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
        `,
      };
    }

    return {
      subject: `Order #${data.orderNumber} has been shipped`,
      html: `
        <h2>Your order is on the way!</h2>
        <p>Hello ${data.customerName},</p>
        <p>Your order #${data.orderNumber} has been shipped.</p>
        
        ${data.trackingNumber ? `<p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>` : ''}
        
        <h3>Shipping Address</h3>
        <p>${data.shippingAddress.fullName}</p>
        <p>${data.shippingAddress.addressLine1}</p>
        ${data.shippingAddress.addressLine2 ? `<p>${data.shippingAddress.addressLine2}</p>` : ''}
        <p>${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}</p>
        
        <p>Thank you for your purchase!</p>
        <p>Best regards,<br>Support Team</p>
      `,
    };
  }

  /**
   * Order status update email template
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

    const statusText =
      statusTranslations[locale][data.status] || data.status;

    if (locale === 'vi') {
      return {
        subject: `Cập nhật đơn hàng #${data.orderNumber}`,
        html: `
          <h2>Đơn hàng của bạn đã được cập nhật</h2>
          <p>Xin chào ${data.customerName},</p>
          <p>Trạng thái đơn hàng #${data.orderNumber} đã được cập nhật thành: <strong>${statusText}</strong></p>
          
          <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
          <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
        `,
      };
    }

    return {
      subject: `Order #${data.orderNumber} Status Update`,
      html: `
        <h2>Your order has been updated</h2>
        <p>Hello ${data.customerName},</p>
        <p>The status of order #${data.orderNumber} has been updated to: <strong>${statusText}</strong></p>
        
        <p>If you have any questions, please contact us.</p>
        <p>Best regards,<br>Support Team</p>
      `,
    };
  }

  /**
   * Welcome email template
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
