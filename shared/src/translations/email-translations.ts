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
    greeting: { en: 'Hello', vi: 'Xin chào' },
    statusUpdated: {
      en: 'Your order status has been updated',
      vi: 'Trạng thái đơn hàng của bạn đã được cập nhật',
    },
    newStatus: { en: 'New Status', vi: 'Trạng thái mới' },
    trackingNumber: { en: 'Tracking Number', vi: 'Mã theo dõi' },
    trackYourOrder: { en: 'Track Your Order', vi: 'Theo dõi đơn hàng của bạn' },
    contactUs: {
      en: 'Contact us if you have any questions.',
      vi: 'Liên hệ với chúng tôi nếu bạn có bất kỳ câu hỏi nào.',
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
