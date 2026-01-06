/**
 * Email Template Translations
 *
 * Centralized translations for all email templates used throughout the application.
 * Supports English (en) and Vietnamese (vi) locales.
 */

import type { SupportedLocale } from './types';

/**
 * Email Translations Object
 *
 * Contains comprehensive translations for all email templates including
 * order confirmations, admin notifications, status updates, and common elements.
 */
export const EMAIL_TRANSLATIONS = {
  // Order Confirmation Email
  orderConfirmation: {
    subject: { en: 'Order Confirmation', vi: 'Xác nhận đơn hàng' },
    greeting: { en: 'Hello', vi: 'Xin chào' },
    thankYou: {
      en: 'Thank you for your order!',
      vi: 'Cảm ơn bạn đã đặt hàng!',
    },
    orderReceived: {
      en: 'We have received your order',
      vi: 'Chúng tôi đã nhận được đơn hàng của bạn',
    },
    orderDetails: { en: 'Order Details', vi: 'Chi tiết đơn hàng' },
    orderNumber: { en: 'Order Number', vi: 'Mã đơn hàng' },
    orderDate: { en: 'Order Date', vi: 'Ngày đặt hàng' },
    items: { en: 'Items', vi: 'Sản phẩm' },
    quantity: { en: 'Quantity', vi: 'Số lượng' },
    price: { en: 'Price', vi: 'Giá' },
    total: { en: 'Total', vi: 'Tổng' },
    subtotal: { en: 'Subtotal', vi: 'Tạm tính' },
    shipping: { en: 'Shipping', vi: 'Phí vận chuyển' },
    tax: { en: 'Tax', vi: 'Thuế' },
    discount: { en: 'Discount', vi: 'Giảm giá' },
    grandTotal: { en: 'Grand Total', vi: 'Tổng cộng' },
    shippingAddress: { en: 'Shipping Address', vi: 'Địa chỉ giao hàng' },
    paymentMethod: { en: 'Payment Method', vi: 'Phương thức thanh toán' },
    contactUs: {
      en: 'Contact us if you have any questions.',
      vi: 'Liên hệ với chúng tôi nếu bạn có bất kỳ câu hỏi nào.',
    },
    trackOrder: { en: 'Track Order', vi: 'Theo dõi đơn hàng' },
  },

  // Order Invoice Email
  orderInvoice: {
    subject: { en: 'Invoice for Order', vi: 'Hóa đơn cho Đơn hàng' },
    title: { en: 'Invoice', vi: 'Hóa đơn' },
    greeting: { en: 'Dear', vi: 'Kính chào' },
    invoiceMessage: {
      en: 'Please find attached the invoice for your order. This document contains all the details of your purchase including final pricing.',
      vi: 'Vui lòng xem hóa đơn đính kèm cho đơn hàng của bạn. Tài liệu này chứa tất cả chi tiết về giao dịch mua hàng bao gồm giá cuối cùng.',
    },
    orderDetails: { en: 'Order Details', vi: 'Chi tiết đơn hàng' },
    orderNumber: { en: 'Order Number', vi: 'Mã đơn hàng' },
    orderDate: { en: 'Order Date', vi: 'Ngày đặt hàng' },
    totalAmount: { en: 'Total Amount', vi: 'Tổng tiền' },
    orderItems: { en: 'Order Items', vi: 'Sản phẩm đặt hàng' },
    product: { en: 'Product', vi: 'Sản phẩm' },
    quantity: { en: 'Quantity', vi: 'Số lượng' },
    price: { en: 'Price', vi: 'Giá' },
    total: { en: 'Total', vi: 'Tổng' },
    attachmentNote: {
      en: 'The attached PDF contains your complete invoice with all order details.',
      vi: 'File PDF đính kèm chứa hóa đơn đầy đủ với tất cả chi tiết đơn hàng.',
    },
    contactInfo: {
      en: 'If you have any questions, please contact us.',
      vi: 'Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.',
    },
    tagline: { en: 'Handmade with Love', vi: 'Làm thủ công với tình yêu' },
    viewOrderDetails: { en: 'View Order Details', vi: 'Xem chi tiết đơn hàng' },
    disclaimer: {
      en: 'This is an automated message. Please do not reply to this email.',
      vi: 'Đây là tin nhắn tự động. Vui lòng không trả lời email này.',
    },
  },

  // Admin Order Notification Email
  adminOrderNotification: {
    subject: { en: 'New Order', vi: 'Đơn hàng mới' },
    title: { en: 'New Order Received', vi: 'Đơn hàng mới đã được đặt' },
    newOrder: { en: 'New Order Received', vi: 'Đơn hàng mới đã được đặt' },
    greeting: { en: 'Hello', vi: 'Xin chào' },
    orderDetails: { en: 'Order Details', vi: 'Chi tiết đơn hàng' },
    orderNumber: { en: 'Order Number', vi: 'Số đơn hàng' },
    orderDate: { en: 'Order Date', vi: 'Ngày đặt hàng' },
    total: { en: 'Total', vi: 'Tổng cộng' },
    customerInfo: { en: 'Customer Information', vi: 'Thông tin khách hàng' },
    customerInformation: {
      en: 'Customer Information',
      vi: 'Thông tin khách hàng',
    },
    name: { en: 'Name', vi: 'Tên' },
    email: { en: 'Email', vi: 'Email' },
    customerName: { en: 'Name', vi: 'Tên' },
    customerEmail: { en: 'Email', vi: 'Email' },
    customerPhone: { en: 'Phone', vi: 'Số điện thoại' },
    viewOrder: { en: 'View Order', vi: 'Xem đơn hàng' },
    trackOrder: { en: 'Track Order', vi: 'Theo dõi đơn hàng' },
    processOrder: { en: 'Process Order', vi: 'Xử lý đơn hàng' },
    urgent: { en: 'URGENT', vi: 'KHẨN CẤP' },
    normal: { en: 'NORMAL', vi: 'BÌNH THƯỜNG' },
    emailLabel: { en: 'Email from AlaCraft', vi: 'Email từ AlaCraft' },
    companyName: { en: 'AlaCraft', vi: 'AlaCraft' },
    disclaimer: { en: 'This is an automated message. Please do not reply to this email.', vi: 'Đây là tin nhắn tự động. Vui lòng không trả lời email này.' },
  },

  // Order Status Update Email
  orderStatusUpdate: {
    subject: { en: 'Order Status Update', vi: 'Cập nhật trạng thái đơn hàng' },
    title: { en: 'Order Status Update', vi: 'Cập nhật trạng thái đơn hàng' },
    greeting: { en: 'Hello', vi: 'Xin chào' },
    intro: {
      en: 'Your order status has been updated',
      vi: 'Trạng thái đơn hàng của bạn đã được cập nhật',
    },
    statusUpdated: {
      en: 'Your order status has been updated',
      vi: 'Trạng thái đơn hàng của bạn đã được cập nhật',
    },
    newStatus: { en: 'New Status', vi: 'Trạng thái mới' },
    trackingNumber: { en: 'Tracking Number', vi: 'Mã theo dõi' },
    trackYourOrder: { en: 'Track Your Order', vi: 'Theo dõi đơn hàng của bạn' },
    trackOrder: { en: 'Track Order', vi: 'Theo dõi đơn hàng' },
    contactUs: {
      en: 'Contact us if you have any questions.',
      vi: 'Liên hệ với chúng tôi nếu bạn có bất kỳ câu hỏi nào.',
    },
    // Additional translations for simplified template
    companyName: { en: 'AlaCraft', vi: 'AlaCraft' },
    tagline: { en: 'Handmade with Love', vi: 'Làm thủ công với tình yêu' },
    emailLabel: { en: 'Order status update email from AlaCraft', vi: 'Email cập nhật trạng thái đơn hàng từ AlaCraft' },
    orderOverview: { en: 'Order Overview', vi: 'Tổng quan đơn hàng' },
    orderNumber: { en: 'Order Number', vi: 'Mã đơn hàng' },
    orderDate: { en: 'Order Date', vi: 'Ngày đặt hàng' },
    orderTotal: { en: 'Order Total', vi: 'Tổng đơn hàng' },
    orderStatus: { en: 'Order Status', vi: 'Trạng thái đơn hàng' },
    paymentStatus: { en: 'Payment Status', vi: 'Trạng thái thanh toán' },
    viewOrderDetails: { en: 'View Order Details', vi: 'Xem chi tiết đơn hàng' },
    copyright: {
      en: '© 2024 AlaCraft. All rights reserved.',
      vi: '© 2024 AlaCraft. Tất cả quyền được bảo lưu.',
    },
  },

  // Order Cancellation Email (Customer)
  orderCancellation: {
    subject: { en: 'Order Cancelled', vi: 'Đơn hàng đã hủy' },
    title: { en: 'Order Cancelled', vi: 'Đơn hàng đã hủy' },
    greeting: { en: 'Hello', vi: 'Xin chào' },
    intro: {
      en: 'We have successfully cancelled your order as requested. Below are the details of your cancelled order.',
      vi: 'Chúng tôi đã hủy thành công đơn hàng của bạn theo yêu cầu. Dưới đây là chi tiết đơn hàng đã hủy.',
    },
    cancellationDetails: { en: 'Cancellation Details', vi: 'Chi tiết hủy đơn' },
    orderNumber: { en: 'Order Number', vi: 'Mã đơn hàng' },
    orderDate: { en: 'Order Date', vi: 'Ngày đặt hàng' },
    cancellationDate: { en: 'Cancellation Date', vi: 'Ngày hủy đơn' },
    cancellationReason: { en: 'Cancellation Reason', vi: 'Lý do hủy đơn' },
    refundInformation: { en: 'Refund Information', vi: 'Thông tin hoàn tiền' },
    refundAmount: { en: 'Refund Amount', vi: 'Số tiền hoàn lại' },
    refundMethod: { en: 'Refund Method', vi: 'Phương thức hoàn tiền' },
    estimatedRefundDate: { en: 'Estimated Refund Date', vi: 'Ngày hoàn tiền dự kiến' },
    refundProcessing: {
      en: 'Your refund will be processed within 3-5 business days and will appear in your original payment method.',
      vi: 'Tiền hoàn sẽ được xử lý trong vòng 3-5 ngày làm việc và sẽ xuất hiện trong phương thức thanh toán gốc của bạn.',
    },
    noRefundRequired: {
      en: 'No refund is required as payment has not been processed yet.',
      vi: 'Không cần hoàn tiền vì thanh toán chưa được xử lý.',
    },
    orderItems: { en: 'Cancelled Items', vi: 'Sản phẩm đã hủy' },
    orderTotal: { en: 'Order Total', vi: 'Tổng đơn hàng' },
    shopAgain: { en: 'Shop Again', vi: 'Mua sắm lại' },
    contactUs: { en: 'Contact Us', vi: 'Liên hệ chúng tôi' },
    skipToContent: { en: 'Skip to main content', vi: 'Chuyển đến nội dung chính' },
    emailLabel: { en: 'Order cancellation email from AlaCraft', vi: 'Email hủy đơn hàng từ AlaCraft' },
    companyName: { en: 'AlaCraft', vi: 'AlaCraft' },
    tagline: { en: 'Handmade with Love', vi: 'Làm thủ công với tình yêu' },
    signature: {
      en: 'Best regards,<br>AlaCraft Team',
      vi: 'Trân trọng,<br>Đội ngũ AlaCraft',
    },
    disclaimer: {
      en: 'This is an automated message. Please do not reply to this email.',
      vi: 'Đây là tin nhắn tự động. Vui lòng không trả lời email này.',
    },
  },

  // Admin Order Cancellation Notification
  adminOrderCancellation: {
    subject: { en: 'Order Cancelled by Customer', vi: 'Đơn hàng bị hủy bởi khách hàng' },
    title: { en: 'Order Cancellation Alert', vi: 'Cảnh báo hủy đơn hàng' },
    greeting: { en: 'Hello Admin,', vi: 'Xin chào Admin,' },
    intro: {
      en: 'A customer has cancelled their order. Please review the details below and take necessary actions.',
      vi: 'Một khách hàng đã hủy đơn hàng của họ. Vui lòng xem xét chi tiết bên dưới và thực hiện các hành động cần thiết.',
    },
    orderDetails: { en: 'Order Details', vi: 'Chi tiết đơn hàng' },
    orderNumber: { en: 'Order Number', vi: 'Mã đơn hàng' },
    orderDate: { en: 'Order Date', vi: 'Ngày đặt hàng' },
    cancellationDate: { en: 'Cancellation Date', vi: 'Ngày hủy đơn' },
    orderTotal: { en: 'Order Total', vi: 'Tổng đơn hàng' },
    customerInfo: { en: 'Customer Information', vi: 'Thông tin khách hàng' },
    customerName: { en: 'Customer Name', vi: 'Tên khách hàng' },
    customerEmail: { en: 'Customer Email', vi: 'Email khách hàng' },
    phone: { en: 'Phone', vi: 'Số điện thoại' },
    cancellationReason: { en: 'Cancellation Reason', vi: 'Lý do hủy đơn' },
    actionRequired: { en: 'Action Required', vi: 'Hành động cần thiết' },
    processRefund: {
      en: 'Process refund if payment was completed',
      vi: 'Xử lý hoàn tiền nếu thanh toán đã hoàn tất',
    },
    updateInventory: {
      en: 'Update inventory levels for cancelled items',
      vi: 'Cập nhật mức tồn kho cho các sản phẩm đã hủy',
    },
    orderItems: { en: 'Cancelled Items', vi: 'Sản phẩm đã hủy' },
    viewOrder: { en: 'View Order', vi: 'Xem đơn hàng' },
    processOrder: { en: 'Process Cancellation', vi: 'Xử lý hủy đơn' },
    skipToContent: { en: 'Skip to main content', vi: 'Chuyển đến nội dung chính' },
    emailLabel: { en: 'Admin order cancellation notification from AlaCraft', vi: 'Thông báo hủy đơn hàng admin từ AlaCraft' },
    companyName: { en: 'AlaCraft', vi: 'AlaCraft' },
    tagline: { en: 'Handmade with Love', vi: 'Làm thủ công với tình yêu' },
    signature: {
      en: 'Best regards,<br>AlaCraft System',
      vi: 'Trân trọng,<br>Hệ thống AlaCraft',
    },
    disclaimer: {
      en: 'This is an automated message. Please do not reply to this email.',
      vi: 'Đây là tin nhắn tự động. Vui lòng không trả lời email này.',
    },
  },

  // Welcome Email
  welcomeEmail: {
    subject: { en: 'Welcome to AlaCraft!', vi: 'Chào mừng đến với AlaCraft!' },
    title: { en: 'Welcome to AlaCraft!', vi: 'Chào mừng đến với AlaCraft!' },
    greeting: { en: 'Hello and welcome!', vi: 'Xin chào và chào mừng!' },
    intro: {
      en: 'Thank you for joining AlaCraft! We\'re excited to have you as part of our community of handmade craft lovers.',
      vi: 'Cảm ơn bạn đã tham gia AlaCraft! Chúng tôi rất vui mừng khi có bạn là một phần của cộng đồng những người yêu thích đồ thủ công.',
    },
    shopNow: {
      en: 'Start exploring our unique collection of handmade items crafted with love and attention to detail.',
      vi: 'Bắt đầu khám phá bộ sưu tập độc đáo của chúng tôi với những món đồ thủ công được chế tác với tình yêu và sự chú ý đến từng chi tiết.',
    },
    verifyEmail: { en: 'Verify Your Email', vi: 'Xác minh Email của bạn' },
    verifyButton: { en: 'Verify Email Address', vi: 'Xác minh địa chỉ Email' },
    whatNext: { en: 'What\'s Next?', vi: 'Tiếp theo là gì?' },
    features: {
      en: [
        'Browse our curated collection of handmade items',
        'Save your favorite products to your wishlist',
        'Enjoy secure and easy checkout process',
        'Track your orders in real-time',
        'Get exclusive offers and updates'
      ],
      vi: [
        'Duyệt bộ sưu tập được tuyển chọn của chúng tôi',
        'Lưu các sản phẩm yêu thích vào danh sách mong muốn',
        'Tận hưởng quy trình thanh toán an toàn và dễ dàng',
        'Theo dõi đơn hàng của bạn theo thời gian thực',
        'Nhận ưu đãi độc quyền và cập nhật'
      ],
    },
    exploreProducts: { en: 'Explore Products', vi: 'Khám phá sản phẩm' },
    supportNote: {
      en: 'If you have any questions, our support team is here to help.',
      vi: 'Nếu bạn có bất kỳ câu hỏi nào, đội ngũ hỗ trợ của chúng tôi sẵn sàng giúp đỡ.',
    },
    skipToContent: { en: 'Skip to main content', vi: 'Chuyển đến nội dung chính' },
    emailLabel: { en: 'Welcome email from AlaCraft', vi: 'Email chào mừng từ AlaCraft' },
    companyName: { en: 'AlaCraft', vi: 'AlaCraft' },
    tagline: { en: 'Handmade with Love', vi: 'Làm thủ công với tình yêu' },
    signature: {
      en: 'Best regards,<br>AlaCraft Team',
      vi: 'Trân trọng,<br>Đội ngũ AlaCraft',
    },
    disclaimer: {
      en: 'This is an automated message. Please do not reply to this email.',
      vi: 'Đây là tin nhắn tự động. Vui lòng không trả lời email này.',
    },
  },

  // Shipping Notification Email
  shippingNotification: {
    subject: { en: 'Your Order is on the Way!', vi: 'Đơn hàng của bạn đang được giao!' },
    title: { en: 'Shipping Update', vi: 'Cập nhật vận chuyển' },
    greeting: { en: 'Hello', vi: 'Xin chào' },
    intro: {
      en: 'Great news! Your order has been shipped and is on its way to you.',
      vi: 'Tin tuyệt vời! Đơn hàng của bạn đã được gửi và đang trên đường đến với bạn.',
    },
    orderNumber: { en: 'Order Number', vi: 'Số đơn hàng' },
    trackingNumber: { en: 'Tracking Number', vi: 'Mã theo dõi' },
    trackingInfo: {
      en: 'You can track your package using the tracking number below:',
      vi: 'Bạn có thể theo dõi gói hàng của mình bằng mã theo dõi bên dưới:',
    },
    trackPackage: { en: 'Track Your Package', vi: 'Theo dõi gói hàng' },
    estimatedDelivery: { en: 'Estimated Delivery', vi: 'Dự kiến giao hàng' },
    shippingAddress: { en: 'Shipping Address', vi: 'Địa chỉ giao hàng' },
    shippingMethod: { en: 'Shipping Method', vi: 'Phương thức vận chuyển' },
    carrier: { en: 'Carrier', vi: 'Đơn vị vận chuyển' },
    deliveryInstructions: {
      en: 'Delivery Instructions',
      vi: 'Hướng dẫn giao hàng',
    },
    contactCarrier: {
      en: 'If you have any questions about your delivery, please contact the carrier directly.',
      vi: 'Nếu bạn có bất kỳ câu hỏi nào về việc giao hàng, vui lòng liên hệ trực tiếp với đơn vị vận chuyển.',
    },
    orderSummary: { en: 'Order Summary', vi: 'Tóm tắt đơn hàng' },
    needHelp: {
      en: 'Need help? Contact our customer support team.',
      vi: 'Cần trợ giúp? Liên hệ với đội ngũ hỗ trợ khách hàng của chúng tôi.',
    },
    contactSupport: { en: 'Contact Support', vi: 'Liên hệ hỗ trợ' },
    thankYou: {
      en: 'Thank you for choosing AlaCraft!',
      vi: 'Cảm ơn bạn đã chọn AlaCraft!',
    },
    skipToContent: { en: 'Skip to main content', vi: 'Chuyển đến nội dung chính' },
    emailLabel: { en: 'Shipping notification from AlaCraft', vi: 'Thông báo vận chuyển từ AlaCraft' },
    companyName: { en: 'AlaCraft', vi: 'AlaCraft' },
    tagline: { en: 'Handmade with Love', vi: 'Làm thủ công với tình yêu' },
    signature: {
      en: 'Best regards,<br>AlaCraft Shipping Team',
      vi: 'Trân trọng,<br>Đội ngũ vận chuyển AlaCraft',
    },
    disclaimer: {
      en: 'This is an automated message. Please do not reply to this email.',
      vi: 'Đây là tin nhắn tự động. Vui lòng không trả lời email này.',
    },
  },

  // Payment Status Update Email
  paymentStatusUpdate: {
    subject: { en: 'Payment Status Update', vi: 'Cập nhật trạng thái thanh toán' },
    title: { en: 'Payment Update', vi: 'Cập nhật thanh toán' },
    greeting: { en: 'Hello', vi: 'Xin chào' },
    intro: {
      en: 'We have an update regarding the payment for your order.',
      vi: 'Chúng tôi có cập nhật về thanh toán cho đơn hàng của bạn.',
    },
    orderNumber: { en: 'Order Number', vi: 'Số đơn hàng' },
    paymentStatus: { en: 'Payment Status', vi: 'Trạng thái thanh toán' },
    paymentMethod: { en: 'Payment Method', vi: 'Phương thức thanh toán' },
    amount: { en: 'Amount', vi: 'Số tiền' },
    transactionId: { en: 'Transaction ID', vi: 'Mã giao dịch' },
    paymentDate: { en: 'Payment Date', vi: 'Ngày thanh toán' },
    // Payment status messages
    paymentSuccessful: {
      en: 'Your payment has been successfully processed.',
      vi: 'Thanh toán của bạn đã được xử lý thành công.',
    },
    paymentPending: {
      en: 'Your payment is currently being processed.',
      vi: 'Thanh toán của bạn hiện đang được xử lý.',
    },
    paymentFailed: {
      en: 'Unfortunately, your payment could not be processed.',
      vi: 'Rất tiếc, thanh toán của bạn không thể được xử lý.',
    },
    paymentRefunded: {
      en: 'Your payment has been refunded.',
      vi: 'Thanh toán của bạn đã được hoàn lại.',
    },
    nextSteps: { en: 'Next Steps', vi: 'Các bước tiếp theo' },
    nextStepsSuccessful: {
      en: 'Your order is now being prepared for shipment.',
      vi: 'Đơn hàng của bạn hiện đang được chuẩn bị để gửi.',
    },
    nextStepsPending: {
      en: 'We will notify you once the payment is confirmed.',
      vi: 'Chúng tôi sẽ thông báo cho bạn khi thanh toán được xác nhận.',
    },
    nextStepsFailed: {
      en: 'Please try again or contact our support team for assistance.',
      vi: 'Vui lòng thử lại hoặc liên hệ với đội ngũ hỗ trợ của chúng tôi để được trợ giúp.',
    },
    nextStepsRefunded: {
      en: 'The refund will appear in your account within 3-5 business days.',
      vi: 'Khoản hoàn tiền sẽ xuất hiện trong tài khoản của bạn trong vòng 3-5 ngày làm việc.',
    },
    orderSummary: { en: 'Order Summary', vi: 'Tóm tắt đơn hàng' },
    needHelp: {
      en: 'Need help? Contact our customer support team.',
      vi: 'Cần trợ giúp? Liên hệ với đội ngũ hỗ trợ khách hàng của chúng tôi.',
    },
    contactSupport: { en: 'Contact Support', vi: 'Liên hệ hỗ trợ' },
    viewOrder: { en: 'View Order Details', vi: 'Xem chi tiết đơn hàng' },
    skipToContent: { en: 'Skip to main content', vi: 'Chuyển đến nội dung chính' },
    emailLabel: { en: 'Payment status update from AlaCraft', vi: 'Cập nhật trạng thái thanh toán từ AlaCraft' },
    companyName: { en: 'AlaCraft', vi: 'AlaCraft' },
    tagline: { en: 'Handmade with Love', vi: 'Làm thủ công với tình yêu' },
    signature: {
      en: 'Best regards,<br>AlaCraft Payment Team',
      vi: 'Trân trọng,<br>Đội ngũ thanh toán AlaCraft',
    },
    disclaimer: {
      en: 'This is an automated message. Please do not reply to this email.',
      vi: 'Đây là tin nhắn tự động. Vui lòng không trả lời email này.',
    },
  },

  // Password Reset Email
  passwordReset: {
    subject: { en: 'Password Reset Request', vi: 'Yêu cầu đặt lại mật khẩu' },
    title: { en: 'Password Reset Request', vi: 'Yêu cầu đặt lại mật khẩu' },
    greeting: { en: 'Hello', vi: 'Xin chào' },
    intro: {
      en: 'We received a request to reset your password for your AlaCraft account.',
      vi: 'Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản AlaCraft của bạn.',
    },
    resetInstructions: {
      en: 'Click the button below to reset your password. This link will expire in 1 hour for security reasons.',
      vi: 'Nhấp vào nút bên dưới để đặt lại mật khẩu của bạn. Liên kết này sẽ hết hạn sau 1 giờ vì lý do bảo mật.',
    },
    resetButton: { en: 'Reset Password', vi: 'Đặt lại mật khẩu' },
    expiry: {
      en: 'This link will expire in 1 hour',
      vi: 'Liên kết này sẽ hết hạn sau 1 giờ',
    },
    importantNote: { en: 'Important Security Note', vi: 'Lưu ý bảo mật quan trọng' },
    ignore: {
      en: 'If you did not request a password reset, please ignore this email. Your password will remain unchanged.',
      vi: 'Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Mật khẩu của bạn sẽ không thay đổi.',
    },
    securityTip: { en: 'Security Tip', vi: 'Mẹo bảo mật' },
    securityNote: {
      en: 'For your security, always use a strong, unique password and never share your login credentials with anyone.',
      vi: 'Để bảo mật, hãy luôn sử dụng mật khẩu mạnh, duy nhất và không bao giờ chia sẻ thông tin đăng nhập của bạn với bất kỳ ai.',
    },
    needHelp: {
      en: 'Need help? Contact our support team.',
      vi: 'Cần trợ giúp? Liên hệ với đội ngũ hỗ trợ của chúng tôi.',
    },
    contactSupport: { en: 'Contact Support', vi: 'Liên hệ hỗ trợ' },
    skipToContent: { en: 'Skip to main content', vi: 'Chuyển đến nội dung chính' },
    emailLabel: { en: 'Password reset email from AlaCraft', vi: 'Email đặt lại mật khẩu từ AlaCraft' },
    companyName: { en: 'AlaCraft', vi: 'AlaCraft' },
    tagline: { en: 'Handmade with Love', vi: 'Làm thủ công với tình yêu' },
    signature: {
      en: 'Best regards,<br>AlaCraft Security Team',
      vi: 'Trân trọng,<br>Đội ngũ bảo mật AlaCraft',
    },
    disclaimer: {
      en: 'This is an automated message. Please do not reply to this email.',
      vi: 'Đây là tin nhắn tự động. Vui lòng không trả lời email này.',
    },
  },

  // PDF Error Handling Translations
  pdfErrorHandling: {
    orderConfirmationSubject: { en: 'Order Confirmation - {orderNumber}', vi: 'Xác nhận đơn hàng - {orderNumber}' },
    technicalIssueMessage: {
      en: 'We encountered a technical issue generating your order PDF. Detailed order information is included below.',
      vi: 'Chúng tôi gặp sự cố kỹ thuật khi tạo file PDF đơn hàng. Thông tin chi tiết đơn hàng được bao gồm bên dưới.'
    },
  },

  // PDF Metadata Translations
  pdfMetadata: {
    orderConfirmationSubject: { en: 'Order confirmation', vi: 'Xác nhận đơn hàng' },
    orderInvoiceSubject: { en: 'Order Invoice', vi: 'Hóa đơn đơn hàng' },
    orderConfirmationTitle: { en: 'Order {orderNumber} - {companyName}', vi: 'Đơn hàng {orderNumber} - {companyName}' },
    orderInvoiceTitle: { en: 'Invoice {orderNumber}', vi: 'Hóa đơn {orderNumber}' },
    orderConfirmationDescription: {
      en: 'Order details for order number {orderNumber} including customer information, products, payment and shipping details',
      vi: 'Chi tiết đơn hàng số {orderNumber} bao gồm thông tin khách hàng, sản phẩm, thanh toán và giao hàng'
    },
    accessibilitySummary: {
      en: 'This PDF contains order confirmation details with structured headings, tables with proper headers, and alternative text for images. Content is organized in logical reading order.',
      vi: 'PDF này chứa chi tiết xác nhận đơn hàng với tiêu đề có cấu trúc, bảng có tiêu đề phù hợp và văn bản thay thế cho hình ảnh. Nội dung được tổ chức theo thứ tự đọc logic.'
    },
  },

  // Contact Form Email
  contactForm: {
    subject: { en: 'New Contact Form Submission', vi: 'Liên hệ mới' },
    subjectWithName: { en: 'New Contact Form Submission from {name}', vi: 'Liên hệ mới từ {name}' },
    title: { en: 'New Contact Form Submission', vi: 'Liên hệ mới' },
    name: { en: 'Name', vi: 'Tên' },
    email: { en: 'Email', vi: 'Email' },
    message: { en: 'Message', vi: 'Tin nhắn' },
    companyName: { en: 'AlaCraft', vi: 'AlaCraft' },
    tagline: { en: 'Handmade with Love', vi: 'Làm thủ công với tình yêu' },
  },

  // Common Email Elements
  common: {
    signature: {
      en: 'Best regards,<br>AlaCraft Team',
      vi: 'Trân trọng,<br>Đội ngũ AlaCraft',
    },
    emailLabel: { en: 'Email from AlaCraft', vi: 'Email từ AlaCraft' },
    copyright: {
      en: '© 2024 AlaCraft. All rights reserved.',
      vi: '© 2024 AlaCraft. Tất cả quyền được bảo lưu.',
    },
    companyName: { en: 'AlaCraft', vi: 'AlaCraft' },
    website: {
      en: 'Visit our website',
      vi: 'Truy cập trang web của chúng tôi',
    },
    unsubscribe: { en: 'Unsubscribe', vi: 'Hủy đăng ký' },
    privacyPolicy: { en: 'Privacy Policy', vi: 'Chính sách bảo mật' },
    termsOfService: { en: 'Terms of Service', vi: 'Điều khoản dịch vụ' },
    supportEmail: { en: 'Support Email', vi: 'Email hỗ trợ' },
    phoneSupport: { en: 'Phone Support', vi: 'Hỗ trợ qua điện thoại' },
  },

  // Payment Related Translations
  payment: {
    paymentReceived: { en: 'Payment Received', vi: 'Đã nhận thanh toán' },
    paymentPending: { en: 'Payment Pending', vi: 'Chờ thanh toán' },
    paymentFailed: { en: 'Payment Failed', vi: 'Thanh toán thất bại' },
    paymentRefunded: { en: 'Payment Refunded', vi: 'Đã hoàn tiền' },
    refundProcessed: { en: 'Refund Processed', vi: 'Đã xử lý hoàn tiền' },
    refundAmount: { en: 'Refund Amount', vi: 'Số tiền hoàn lại' },
  },

  // Shipping Related Translations
  shipping: {
    shippingConfirmation: {
      en: 'Shipping Confirmation',
      vi: 'Xác nhận giao hàng',
    },
    orderShipped: {
      en: 'Your order has been shipped',
      vi: 'Đơn hàng của bạn đã được giao',
    },
    estimatedDelivery: { en: 'Estimated Delivery', vi: 'Dự kiến giao hàng' },
    shippingMethod: { en: 'Shipping Method', vi: 'Phương thức vận chuyển' },
    trackingInfo: { en: 'Tracking Information', vi: 'Thông tin theo dõi' },
    deliveryAddress: { en: 'Delivery Address', vi: 'Địa chỉ giao hàng' },
  },

  // Error and System Messages
  system: {
    errorOccurred: { en: 'An error occurred', vi: 'Đã xảy ra lỗi' },
    tryAgainLater: { en: 'Please try again later', vi: 'Vui lòng thử lại sau' },
    systemMaintenance: { en: 'System Maintenance', vi: 'Bảo trì hệ thống' },
    temporaryUnavailable: {
      en: 'Service temporarily unavailable',
      vi: 'Dịch vụ tạm thời không khả dụng',
    },
  },

  // Status Messages for Email Updates
  statusMessages: {
    // Order Status Messages
    order: {
      PENDING: {
        en: 'Your order has been received and is awaiting processing.',
        vi: 'Đơn hàng của bạn đã được nhận và đang chờ xử lý.',
      },
      PENDING_QUOTE: {
        en: 'Your order is pending quote approval. We will contact you soon with pricing details.',
        vi: 'Đơn hàng của bạn đang chờ phê duyệt báo giá. Chúng tôi sẽ liên hệ với bạn sớm với chi tiết giá cả.',
      },
      PROCESSING: {
        en: 'Your order is being prepared for shipment. We will notify you once it ships.',
        vi: 'Đơn hàng của bạn đang được chuẩn bị để giao hàng. Chúng tôi sẽ thông báo cho bạn khi nó được giao.',
      },
      SHIPPED: {
        en: 'Your order has been shipped and is on its way to you.',
        vi: 'Đơn hàng của bạn đã được giao và đang trên đường đến với bạn.',
      },
      DELIVERED: {
        en: 'Your order has been successfully delivered. Thank you for your business!',
        vi: 'Đơn hàng của bạn đã được giao thành công. Cảm ơn bạn đã mua hàng!',
      },
      CANCELLED: {
        en: 'Your order has been cancelled. If you have any questions, please contact us.',
        vi: 'Đơn hàng của bạn đã bị hủy. Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.',
      },
      REFUNDED: {
        en: 'Your order has been refunded. The refund will appear in your original payment method within 3-5 business days.',
        vi: 'Đơn hàng của bạn đã được hoàn tiền. Tiền hoàn sẽ xuất hiện trong phương thức thanh toán gốc của bạn trong vòng 3-5 ngày làm việc.',
      },
    },
    // Payment Status Messages
    payment: {
      PENDING: {
        en: 'Your payment is being processed. We will update you once the payment is confirmed.',
        vi: 'Thanh toán của bạn đang được xử lý. Chúng tôi sẽ cập nhật cho bạn khi thanh toán được xác nhận.',
      },
      PAID: {
        en: 'Your payment has been successfully processed. Thank you for your payment!',
        vi: 'Thanh toán của bạn đã được xử lý thành công. Cảm ơn bạn đã thanh toán!',
      },
      FAILED: {
        en: 'Your payment could not be processed. Please try again or contact us for assistance.',
        vi: 'Thanh toán của bạn không thể được xử lý. Vui lòng thử lại hoặc liên hệ với chúng tôi để được hỗ trợ.',
      },
      REFUNDED: {
        en: 'Your payment has been refunded. The refund will appear in your original payment method within 3-5 business days.',
        vi: 'Thanh toán của bạn đã được hoàn lại. Tiền hoàn sẽ xuất hiện trong phương thức thanh toán gốc của bạn trong vòng 3-5 ngày làm việc.',
      },
    },
  },
} as const;

/**
 * Email Translation Types
 *
 * Type definitions for email translation categories and keys.
 */
export type EmailTranslationCategory = keyof typeof EMAIL_TRANSLATIONS;
export type EmailTranslationKey<T extends EmailTranslationCategory> =
  keyof (typeof EMAIL_TRANSLATIONS)[T];

/**
 * Get Email Translation
 *
 * Retrieves a specific email translation with fallback logic.
 *
 * @param category - The email translation category
 * @param key - The translation key within the category
 * @param locale - The target locale (defaults to 'en')
 * @returns The translated string
 */
export function getEmailTranslation<T extends EmailTranslationCategory>(
  category: T,
  key: EmailTranslationKey<T>,
  locale: SupportedLocale = 'en'
): string {
  const categoryTranslations = EMAIL_TRANSLATIONS[category];
  if (!categoryTranslations) {
    console.warn(`Unknown email translation category: ${category}`);
    return String(key);
  }

  const translation = categoryTranslations[key] as { en: string; vi: string };
  if (!translation) {
    console.warn(`Missing email translation for ${category}.${String(key)}`);
    return String(key);
  }

  return translation[locale] || translation.en; // Fallback to English
}

/**
 * Get Email Template Translations
 *
 * Retrieves all translations for email templates in the specified locale.
 * This is a comprehensive function that returns all email-related translations.
 *
 * @param locale - The target locale (defaults to 'en')
 * @returns Record containing all email template translations
 */
export function getEmailTemplateTranslations(
  locale: SupportedLocale = 'en'
): Record<string, string> {
  const translations: Record<string, string> = {};

  // Flatten all email translations into a single object
  Object.entries(EMAIL_TRANSLATIONS).forEach(
    ([category, categoryTranslations]) => {
      Object.entries(categoryTranslations).forEach(([key, translation]) => {
        const flatKey = `${category}.${key}`;
        const translationObj = translation as { en: string; vi: string };
        translations[flatKey] = translationObj[locale] || translationObj.en;
      });
    }
  );

  return translations;
}

/**
 * Get Order Confirmation Translations
 *
 * Retrieves all translations specific to order confirmation emails.
 *
 * @param locale - The target locale (defaults to 'en')
 * @returns Record containing order confirmation translations
 */
export function getOrderConfirmationTranslations(
  locale: SupportedLocale = 'en'
): Record<string, string> {
  const translations: Record<string, string> = {};

  // Get order confirmation translations
  Object.entries(EMAIL_TRANSLATIONS.orderConfirmation).forEach(
    ([key, translation]) => {
      translations[key] = translation[locale] || translation.en;
    }
  );

  // Include common translations
  Object.entries(EMAIL_TRANSLATIONS.common).forEach(([key, translation]) => {
    translations[`common.${key}`] = translation[locale] || translation.en;
  });

  // Include payment translations
  Object.entries(EMAIL_TRANSLATIONS.payment).forEach(([key, translation]) => {
    translations[`payment.${key}`] = translation[locale] || translation.en;
  });

  return translations;
}

/**
 * Get Invoice Email Translations
 *
 * Retrieves all translations specific to invoice emails.
 *
 * @param locale - The target locale (defaults to 'en')
 * @returns Record containing invoice email translations
 */
export function getInvoiceEmailTranslations(
  locale: SupportedLocale = 'en'
): Record<string, string> {
  const translations: Record<string, string> = {};

  // Get invoice email translations
  Object.entries(EMAIL_TRANSLATIONS.orderInvoice).forEach(
    ([key, translation]) => {
      translations[key] = translation[locale] || translation.en;
    }
  );

  // Include common translations
  Object.entries(EMAIL_TRANSLATIONS.common).forEach(([key, translation]) => {
    translations[`common.${key}`] = translation[locale] || translation.en;
  });

  // Include payment translations
  Object.entries(EMAIL_TRANSLATIONS.payment).forEach(([key, translation]) => {
    translations[`payment.${key}`] = translation[locale] || translation.en;
  });

  return translations;
}

/**
 * Get Admin Order Notification Translations
 *
 * Retrieves all translations specific to admin order notification emails.
 *
 * @param locale - The target locale (defaults to 'en')
 * @returns Record containing admin order notification translations
 */
export function getAdminOrderNotificationTranslations(
  locale: SupportedLocale = 'en'
): Record<string, string> {
  const translations: Record<string, string> = {};

  // Get admin order notification translations
  Object.entries(EMAIL_TRANSLATIONS.adminOrderNotification).forEach(
    ([key, translation]) => {
      translations[key] = translation[locale] || translation.en;
    }
  );

  // Include common translations
  Object.entries(EMAIL_TRANSLATIONS.common).forEach(([key, translation]) => {
    translations[`common.${key}`] = translation[locale] || translation.en;
  });

  return translations;
}

/**
 * Get Order Status Update Translations
 *
 * Retrieves all translations specific to order status update emails.
 *
 * @param locale - The target locale (defaults to 'en')
 * @returns Record containing order status update translations
 */
export function getOrderStatusUpdateTranslations(
  locale: SupportedLocale = 'en'
): Record<string, string> {
  const translations: Record<string, string> = {};

  // Get order status update translations
  Object.entries(EMAIL_TRANSLATIONS.orderStatusUpdate).forEach(
    ([key, translation]) => {
      translations[key] = translation[locale] || translation.en;
    }
  );

  // Include common translations
  Object.entries(EMAIL_TRANSLATIONS.common).forEach(([key, translation]) => {
    translations[`common.${key}`] = translation[locale] || translation.en;
  });

  // Include shipping translations
  Object.entries(EMAIL_TRANSLATIONS.shipping).forEach(([key, translation]) => {
    translations[`shipping.${key}`] = translation[locale] || translation.en;
  });

  return translations;
}

/**
 * Get Welcome Email Translations
 *
 * Retrieves all translations specific to welcome emails.
 *
 * @param locale - The target locale (defaults to 'en')
 * @returns Record containing welcome email translations
 */
export function getWelcomeEmailTranslations(
  locale: SupportedLocale = 'en'
): Record<string, string> {
  const translations: Record<string, string> = {};

  // Get welcome email translations
  Object.entries(EMAIL_TRANSLATIONS.welcomeEmail).forEach(
    ([key, translation]) => {
      if (key === 'features' && typeof translation === 'object' && 'en' in translation) {
        // Handle array translations specially
        const features = translation as unknown as { en: string[]; vi: string[] };
        const featureList = features[locale] || features.en;
        translations[key] = JSON.stringify(featureList);
      } else if (typeof translation === 'object' && 'en' in translation) {
        const translationObj = translation as { en: string; vi: string };
        translations[key] = translationObj[locale] || translationObj.en;
      }
    }
  );

  // Include common translations
  Object.entries(EMAIL_TRANSLATIONS.common).forEach(([key, translation]) => {
    translations[`common.${key}`] = translation[locale] || translation.en;
  });

  return translations;
}

/**
 * Get Shipping Notification Email Translations
 *
 * Retrieves all translations specific to shipping notification emails.
 *
 * @param locale - The target locale (defaults to 'en')
 * @returns Record containing shipping notification email translations
 */
export function getShippingNotificationTranslations(
  locale: SupportedLocale = 'en'
): Record<string, string> {
  const translations: Record<string, string> = {};

  // Get shipping notification email translations
  Object.entries(EMAIL_TRANSLATIONS.shippingNotification).forEach(
    ([key, translation]) => {
      if (typeof translation === 'object' && 'en' in translation) {
        const translationObj = translation as { en: string; vi: string };
        translations[key] = translationObj[locale] || translationObj.en;
      }
    }
  );

  // Include common translations
  Object.entries(EMAIL_TRANSLATIONS.common).forEach(([key, translation]) => {
    translations[`common.${key}`] = translation[locale] || translation.en;
  });

  return translations;
}

/**
 * Get Payment Status Update Email Translations
 *
 * Retrieves all translations specific to payment status update emails.
 *
 * @param locale - The target locale (defaults to 'en')
 * @returns Record containing payment status update email translations
 */
export function getPaymentStatusUpdateTranslations(
  locale: SupportedLocale = 'en'
): Record<string, string> {
  const translations: Record<string, string> = {};

  // Get payment status update email translations
  Object.entries(EMAIL_TRANSLATIONS.paymentStatusUpdate).forEach(
    ([key, translation]) => {
      if (typeof translation === 'object' && 'en' in translation) {
        const translationObj = translation as { en: string; vi: string };
        translations[key] = translationObj[locale] || translationObj.en;
      }
    }
  );

  // Include common translations
  Object.entries(EMAIL_TRANSLATIONS.common).forEach(([key, translation]) => {
    translations[`common.${key}`] = translation[locale] || translation.en;
  });

  return translations;
}

/**
 * Get PDF Error Handling Translations
 *
 * Retrieves all translations specific to PDF error handling.
 *
 * @param locale - The target locale (defaults to 'en')
 * @returns Record containing PDF error handling translations
 */
export function getPdfErrorHandlingTranslations(
  locale: SupportedLocale = 'en'
): Record<string, string> {
  const translations: Record<string, string> = {};

  // Get PDF error handling translations
  Object.entries(EMAIL_TRANSLATIONS.pdfErrorHandling).forEach(
    ([key, translation]) => {
      if (typeof translation === 'object' && 'en' in translation) {
        const translationObj = translation as { en: string; vi: string };
        translations[key] = translationObj[locale] || translationObj.en;
      }
    }
  );

  return translations;
}

/**
 * Get PDF Metadata Translations
 *
 * Retrieves all translations specific to PDF metadata.
 *
 * @param locale - The target locale (defaults to 'en')
 * @returns Record containing PDF metadata translations
 */
export function getPdfMetadataTranslations(
  locale: SupportedLocale = 'en'
): Record<string, string> {
  const translations: Record<string, string> = {};

  // Get PDF metadata translations
  Object.entries(EMAIL_TRANSLATIONS.pdfMetadata).forEach(
    ([key, translation]) => {
      if (typeof translation === 'object' && 'en' in translation) {
        const translationObj = translation as { en: string; vi: string };
        translations[key] = translationObj[locale] || translationObj.en;
      }
    }
  );

  return translations;
}

/**
 * Get Contact Form Email Translations
 *
 * Retrieves all translations specific to contact form emails.
 *
 * @param locale - The target locale (defaults to 'en')
 * @returns Record containing contact form email translations
 */
export function getContactFormTranslations(
  locale: SupportedLocale = 'en'
): Record<string, string> {
  const translations: Record<string, string> = {};

  // Get contact form email translations
  Object.entries(EMAIL_TRANSLATIONS.contactForm).forEach(
    ([key, translation]) => {
      if (typeof translation === 'object' && 'en' in translation) {
        const translationObj = translation as { en: string; vi: string };
        translations[key] = translationObj[locale] || translationObj.en;
      }
    }
  );

  return translations;
}

/**
 * Get Password Reset Email Translations
 *
 * Retrieves all translations specific to password reset emails.
 *
 * @param locale - The target locale (defaults to 'en')
 * @returns Record containing password reset email translations
 */
export function getPasswordResetEmailTranslations(
  locale: SupportedLocale = 'en'
): Record<string, string> {
  const translations: Record<string, string> = {};

  // Get password reset email translations
  Object.entries(EMAIL_TRANSLATIONS.passwordReset).forEach(
    ([key, translation]) => {
      translations[key] = translation[locale] || translation.en;
    }
  );

  // Include common translations
  Object.entries(EMAIL_TRANSLATIONS.common).forEach(([key, translation]) => {
    translations[`common.${key}`] = translation[locale] || translation.en;
  });

  return translations;
}

/**
 * Get Order Cancellation Translations
 *
 * Retrieves all translations specific to order cancellation emails (customer).
 *
 * @param locale - The target locale (defaults to 'en')
 * @returns Record containing order cancellation translations
 */
export function getOrderCancellationTranslations(
  locale: SupportedLocale = 'en'
): Record<string, string> {
  const translations: Record<string, string> = {};

  // Get order cancellation translations
  Object.entries(EMAIL_TRANSLATIONS.orderCancellation).forEach(
    ([key, translation]) => {
      translations[key] = translation[locale] || translation.en;
    }
  );

  // Include common translations
  Object.entries(EMAIL_TRANSLATIONS.common).forEach(([key, translation]) => {
    translations[`common.${key}`] = translation[locale] || translation.en;
  });

  // Include payment translations
  Object.entries(EMAIL_TRANSLATIONS.payment).forEach(([key, translation]) => {
    translations[`payment.${key}`] = translation[locale] || translation.en;
  });

  return translations;
}

/**
 * Get Admin Order Cancellation Translations
 *
 * Retrieves all translations specific to admin order cancellation notification emails.
 *
 * @param locale - The target locale (defaults to 'en')
 * @returns Record containing admin order cancellation translations
 */
export function getAdminOrderCancellationTranslations(
  locale: SupportedLocale = 'en'
): Record<string, string> {
  const translations: Record<string, string> = {};

  // Get admin order cancellation translations
  Object.entries(EMAIL_TRANSLATIONS.adminOrderCancellation).forEach(
    ([key, translation]) => {
      translations[key] = translation[locale] || translation.en;
    }
  );

  // Include common translations
  Object.entries(EMAIL_TRANSLATIONS.common).forEach(([key, translation]) => {
    translations[`common.${key}`] = translation[locale] || translation.en;
  });

  return translations;
}

/**
 * Generic Translation Helper
 *
 * Retrieves a translation by key with dot notation support and fallback logic.
 * Supports nested keys like 'orderConfirmation.subject' or 'common.signature'.
 *
 * @param key - The translation key (supports dot notation)
 * @param locale - The target locale (defaults to 'en')
 * @returns The translated string
 */
export function getTranslation(
  key: string,
  locale: SupportedLocale = 'en'
): string {
  const keyParts = key.split('.');

  if (keyParts.length !== 2) {
    console.warn(
      `Invalid translation key format: ${key}. Expected format: 'category.key'`
    );
    return key;
  }

  const [category, translationKey] = keyParts;

  if (!(category in EMAIL_TRANSLATIONS)) {
    console.warn(`Unknown email translation category: ${category}`);
    return key;
  }

  const categoryTranslations =
    EMAIL_TRANSLATIONS[category as EmailTranslationCategory];
  const translation = categoryTranslations[
    translationKey as keyof typeof categoryTranslations
  ] as { en: string; vi: string };

  if (!translation) {
    console.warn(`Missing email translation for ${key}`);
    return key;
  }

  return translation[locale] || translation.en;
}

/**
 * Get Order Status Message
 *
 * Retrieves a descriptive message for an order status in the specified locale.
 *
 * @param status - The order status
 * @param locale - The target locale (defaults to 'en')
 * @returns The status message string
 */
export function getOrderStatusMessage(
  status: string,
  locale: SupportedLocale = 'en'
): string {
  const statusMessages = EMAIL_TRANSLATIONS.statusMessages.order;
  const message = statusMessages[status as keyof typeof statusMessages];

  if (!message) {
    console.warn(`Missing order status message for status: ${status}`);
    return status; // Fallback to raw status
  }

  return message[locale] || message.en; // Fallback to English
}

/**
 * Get Payment Status Message
 *
 * Retrieves a descriptive message for a payment status in the specified locale.
 *
 * @param status - The payment status
 * @param locale - The target locale (defaults to 'en')
 * @returns The status message string
 */
export function getPaymentStatusMessage(
  status: string,
  locale: SupportedLocale = 'en'
): string {
  const statusMessages = EMAIL_TRANSLATIONS.statusMessages.payment;
  const message = statusMessages[status as keyof typeof statusMessages];

  if (!message) {
    console.warn(`Missing payment status message for status: ${status}`);
    return status; // Fallback to raw status
  }

  return message[locale] || message.en; // Fallback to English
}

/**
 * Get All Translations
 *
 * Retrieves all email translations for the specified locale.
 * This is useful for pre-loading all translations or for debugging.
 *
 * @param locale - The target locale (defaults to 'en')
 * @returns Record containing all email translations
 */
export function getAllTranslations(
  locale: SupportedLocale = 'en'
): Record<string, string> {
  return getEmailTemplateTranslations(locale);
}