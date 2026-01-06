/**
 * Translation Service for Backend Localization
 *
 * Provides centralized translation functionality for order statuses, payment methods,
 * shipping methods, and other backend text that needs localization for emails and PDFs.
 */

import { Injectable } from '@nestjs/common';
import { CONSTANTS } from '@alacraft/shared';

export type SupportedLocale = 'en' | 'vi';

@Injectable()
export class TranslationService {
  /**
   * Order status translations
   */
  private readonly orderStatusTranslations: Record<SupportedLocale, Record<string, string>> = {
    en: {
      [CONSTANTS.STATUS.ORDER_STATUS.PENDING]: 'Pending',
      [CONSTANTS.STATUS.ORDER_STATUS.PENDING_QUOTE]: 'Pending Quote',
      [CONSTANTS.STATUS.ORDER_STATUS.PROCESSING]: 'Processing',
      [CONSTANTS.STATUS.ORDER_STATUS.SHIPPED]: 'Shipped',
      [CONSTANTS.STATUS.ORDER_STATUS.DELIVERED]: 'Delivered',
      [CONSTANTS.STATUS.ORDER_STATUS.CANCELLED]: 'Cancelled',
      [CONSTANTS.STATUS.ORDER_STATUS.REFUNDED]: 'Refunded',
    },
    vi: {
      [CONSTANTS.STATUS.ORDER_STATUS.PENDING]: 'Chờ xử lý',
      [CONSTANTS.STATUS.ORDER_STATUS.PENDING_QUOTE]: 'Chờ báo giá',
      [CONSTANTS.STATUS.ORDER_STATUS.PROCESSING]: 'Đang xử lý',
      [CONSTANTS.STATUS.ORDER_STATUS.SHIPPED]: 'Đã giao vận',
      [CONSTANTS.STATUS.ORDER_STATUS.DELIVERED]: 'Đã giao hàng',
      [CONSTANTS.STATUS.ORDER_STATUS.CANCELLED]: 'Đã hủy',
      [CONSTANTS.STATUS.ORDER_STATUS.REFUNDED]: 'Đã hoàn tiền',
    },
  };

  /**
   * Payment status translations
   */
  private readonly paymentStatusTranslations: Record<SupportedLocale, Record<string, string>> = {
    en: {
      [CONSTANTS.STATUS.PAYMENT_STATUS.PENDING]: 'Pending',
      [CONSTANTS.STATUS.PAYMENT_STATUS.PAID]: 'Paid',
      [CONSTANTS.STATUS.PAYMENT_STATUS.FAILED]: 'Failed',
      [CONSTANTS.STATUS.PAYMENT_STATUS.REFUNDED]: 'Refunded',
    },
    vi: {
      [CONSTANTS.STATUS.PAYMENT_STATUS.PENDING]: 'Chờ thanh toán',
      [CONSTANTS.STATUS.PAYMENT_STATUS.PAID]: 'Đã thanh toán',
      [CONSTANTS.STATUS.PAYMENT_STATUS.FAILED]: 'Thất bại',
      [CONSTANTS.STATUS.PAYMENT_STATUS.REFUNDED]: 'Đã hoàn tiền',
    },
  };

  /**
   * Payment method translations
   */
  private readonly paymentMethodTranslations: Record<SupportedLocale, Record<string, string>> = {
    en: {
      'bank_transfer': 'Bank Transfer',
      'banktransfer': 'Bank Transfer',
      'cash_on_delivery': 'Cash on Delivery',
      'cashondelivery': 'Cash on Delivery',
      'cod': 'Cash on Delivery',
      'credit_card': 'Credit Card',
      'creditcard': 'Credit Card',
      'paypal': 'PayPal',
      'qr_code': 'QR Code Payment',
      'qrcode': 'QR Code Payment',
    },
    vi: {
      'bank_transfer': 'Chuyển khoản ngân hàng',
      'banktransfer': 'Chuyển khoản ngân hàng',
      'cash_on_delivery': 'Thanh toán khi nhận hàng',
      'cashondelivery': 'Thanh toán khi nhận hàng',
      'cod': 'Thanh toán khi nhận hàng',
      'credit_card': 'Thẻ tín dụng',
      'creditcard': 'Thẻ tín dụng',
      'paypal': 'PayPal',
      'qr_code': 'Thanh toán QR Code',
      'qrcode': 'Thanh toán QR Code',
    },
  };



  /**
   * Translate order status to localized text
   * @deprecated Use translateOrderStatus from @alacraft/shared instead
   * @param status - Order status value
   * @param locale - Target locale
   * @returns Translated status text
   */
  translateOrderStatus(status: string, locale: SupportedLocale = 'en'): string {
    console.warn('TranslationService.translateOrderStatus is deprecated. Use translateOrderStatus from @alacraft/shared instead.');

    if (!status) return status;

    const normalizedStatus = status.toUpperCase();
    const translations = this.orderStatusTranslations[locale] || this.orderStatusTranslations.en;

    return translations[normalizedStatus] || status;
  }

  /**
   * Translate payment status to localized text
   * @deprecated Use translatePaymentStatus from @alacraft/shared instead
   * @param status - Payment status value
   * @param locale - Target locale
   * @returns Translated status text
   */
  translatePaymentStatus(status: string, locale: SupportedLocale = 'en'): string {
    console.warn('TranslationService.translatePaymentStatus is deprecated. Use translatePaymentStatus from @alacraft/shared instead.');

    if (!status) return status;

    const normalizedStatus = status.toUpperCase();
    const translations = this.paymentStatusTranslations[locale] || this.paymentStatusTranslations.en;

    return translations[normalizedStatus] || status;
  }

  /**
   * Translate payment method to localized text
   * @param method - Payment method value
   * @param locale - Target locale
   * @returns Translated method text
   */
  translatePaymentMethod(method: string, locale: SupportedLocale = 'en'): string {
    if (!method) return method;

    // Normalize the method string to match translation keys
    const normalizedMethod = method.toLowerCase().replace(/\s+/g, '').replace(/[-_]/g, '');
    const translations = this.paymentMethodTranslations[locale] || this.paymentMethodTranslations.en;

    // Try exact match first
    if (translations[normalizedMethod]) {
      return translations[normalizedMethod];
    }

    // Try with original method
    if (translations[method.toLowerCase()]) {
      return translations[method.toLowerCase()];
    }

    // Try with underscores
    const underscoreMethod = method.toLowerCase().replace(/\s+/g, '_');
    if (translations[underscoreMethod]) {
      return translations[underscoreMethod];
    }

    // Return original if no translation found
    return method;
  }

  /**
   * Translate shipping method to localized text
   * @deprecated Use ShippingService.getShippingMethodDetails() or database shipping_methods table instead
   * @param method - Shipping method value
   * @param locale - Target locale
   * @returns Translated method text
   */
  translateShippingMethod(method: string, locale: SupportedLocale = 'en'): string {
    console.warn('TranslationService.translateShippingMethod is deprecated. Use ShippingService.getShippingMethodDetails() or query the shipping_methods database table instead.');

    if (!method) return method;

    // Return original method name as fallback
    // Applications should use ShippingService.getShippingMethodDetails() for proper localization
    return method;
  }

  /**
   * Get payment method instructions in the specified locale
   * @param method - Payment method value
   * @param locale - Target locale
   * @returns Localized instructions
   */
  getPaymentMethodInstructions(method: string, locale: SupportedLocale = 'en'): string {
    if (!method) return '';

    const normalizedMethod = method.toLowerCase().replace(/\s+/g, '').replace(/[-_]/g, '');

    if (normalizedMethod.includes('bank') || normalizedMethod.includes('transfer')) {
      return locale === 'vi'
        ? 'Vui lòng chuyển khoản theo thông tin được cung cấp và gửi ảnh chụp biên lai để xác nhận.'
        : 'Please transfer payment according to the provided information and send receipt photo for confirmation.';
    }

    if (normalizedMethod.includes('cash') || normalizedMethod.includes('cod')) {
      return locale === 'vi'
        ? 'Thanh toán bằng tiền mặt khi nhận hàng. Vui lòng chuẩn bị đúng số tiền.'
        : 'Pay with cash upon delivery. Please prepare exact amount.';
    }

    if (normalizedMethod.includes('qr')) {
      return locale === 'vi'
        ? 'Quét mã QR bằng ứng dụng ngân hàng để thanh toán.'
        : 'Scan QR code with your banking app to make payment.';
    }

    if (normalizedMethod.includes('credit') || normalizedMethod.includes('card')) {
      return locale === 'vi'
        ? 'Thanh toán bằng thẻ tín dụng/ghi nợ.'
        : 'Pay with credit/debit card.';
    }

    return '';
  }

  /**
   * Get shipping method description with estimated delivery time
   * @deprecated Use ShippingService.getShippingMethodDetails() or database shipping_methods table instead
   * @param method - Shipping method value
   * @param locale - Target locale
   * @returns Localized description with delivery estimate
   */
  getShippingMethodDescription(method: string, locale: SupportedLocale = 'en'): string {
    console.warn('TranslationService.getShippingMethodDescription is deprecated. Use ShippingService.getShippingMethodDetails() or query the shipping_methods database table instead.');

    if (!method) return '';

    // Return basic fallback description
    // Applications should use ShippingService.getShippingMethodDetails() for proper localization
    return locale === 'vi' ? 'Giao hàng tiêu chuẩn (3-7 ngày làm việc)' : 'Standard delivery (3-7 business days)';
  }

  /**
   * Format date according to locale
   * @param date - Date to format
   * @param locale - Target locale
   * @returns Formatted date string
   */
  formatDate(date: Date | string, locale: SupportedLocale = 'en'): string {
    if (!date) return '';

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (locale === 'vi') {
      return dateObj.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }

  /**
   * Format currency according to locale
   * @param amount - Amount to format
   * @param locale - Target locale
   * @returns Formatted currency string
   */
  formatCurrency(amount: number, locale: SupportedLocale = 'en'): string {
    if (typeof amount !== 'number') return '0';

    if (locale === 'vi') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    }
  }

  /**
   * Get common email phrases in the specified locale
   * @param key - Phrase key
   * @param locale - Target locale
   * @returns Translated phrase
   */
  getEmailPhrase(key: string, locale: SupportedLocale = 'en'): string {
    const phrases: Record<SupportedLocale, Record<string, string>> = {
      en: {
        'order_confirmation': 'Order Confirmation',
        'thank_you': 'Thank you for your order!',
        'order_number': 'Order Number',
        'order_date': 'Order Date',
        'customer_info': 'Customer Information',
        'shipping_address': 'Shipping Address',
        'billing_address': 'Billing Address',
        'order_items': 'Order Items',
        'payment_method': 'Payment Method',
        'shipping_method': 'Shipping Method',
        'order_summary': 'Order Summary',
        'subtotal': 'Subtotal',
        'shipping': 'Shipping',
        'tax': 'Tax',
        'discount': 'Discount',
        'total': 'Total',
        'regards': 'Best regards',
        'team': 'The Team',
      },
      vi: {
        'order_confirmation': 'Xác nhận đơn hàng',
        'thank_you': 'Cảm ơn bạn đã đặt hàng!',
        'order_number': 'Mã đơn hàng',
        'order_date': 'Ngày đặt hàng',
        'customer_info': 'Thông tin khách hàng',
        'shipping_address': 'Địa chỉ giao hàng',
        'billing_address': 'Địa chỉ thanh toán',
        'order_items': 'Sản phẩm đặt hàng',
        'payment_method': 'Phương thức thanh toán',
        'shipping_method': 'Phương thức vận chuyển',
        'order_summary': 'Tóm tắt đơn hàng',
        'subtotal': 'Tạm tính',
        'shipping': 'Phí vận chuyển',
        'tax': 'Thuế',
        'discount': 'Giảm giá',
        'total': 'Tổng cộng',
        'regards': 'Trân trọng',
        'team': 'Đội ngũ',
      },
    };

    const localesPhrases = phrases[locale] || phrases.en;
    return localesPhrases[key] || key;
  }
}