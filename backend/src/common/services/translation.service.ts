/**
 * Translation Service for Backend Localization
 *
 * Provides centralized translation functionality for order statuses, payment methods,
 * shipping methods, and other backend text that needs localization for emails and PDFs.
 */

import { Injectable } from '@nestjs/common';
import { STATUS } from '../constants';

export type SupportedLocale = 'en' | 'vi';

@Injectable()
export class TranslationService {
  /**
   * Order status translations
   */
  private readonly orderStatusTranslations: Record<SupportedLocale, Record<string, string>> = {
    en: {
      [STATUS.ORDER_STATUS.PENDING]: 'Pending',
      [STATUS.ORDER_STATUS.PENDING_QUOTE]: 'Pending Quote',
      [STATUS.ORDER_STATUS.PROCESSING]: 'Processing',
      [STATUS.ORDER_STATUS.SHIPPED]: 'Shipped',
      [STATUS.ORDER_STATUS.DELIVERED]: 'Delivered',
      [STATUS.ORDER_STATUS.CANCELLED]: 'Cancelled',
      [STATUS.ORDER_STATUS.REFUNDED]: 'Refunded',
    },
    vi: {
      [STATUS.ORDER_STATUS.PENDING]: 'Chờ xử lý',
      [STATUS.ORDER_STATUS.PENDING_QUOTE]: 'Chờ báo giá',
      [STATUS.ORDER_STATUS.PROCESSING]: 'Đang xử lý',
      [STATUS.ORDER_STATUS.SHIPPED]: 'Đã giao vận',
      [STATUS.ORDER_STATUS.DELIVERED]: 'Đã giao hàng',
      [STATUS.ORDER_STATUS.CANCELLED]: 'Đã hủy',
      [STATUS.ORDER_STATUS.REFUNDED]: 'Đã hoàn tiền',
    },
  };

  /**
   * Payment status translations
   */
  private readonly paymentStatusTranslations: Record<SupportedLocale, Record<string, string>> = {
    en: {
      [STATUS.PAYMENT_STATUS.PENDING]: 'Pending',
      [STATUS.PAYMENT_STATUS.PAID]: 'Paid',
      [STATUS.PAYMENT_STATUS.FAILED]: 'Failed',
      [STATUS.PAYMENT_STATUS.REFUNDED]: 'Refunded',
    },
    vi: {
      [STATUS.PAYMENT_STATUS.PENDING]: 'Chờ thanh toán',
      [STATUS.PAYMENT_STATUS.PAID]: 'Đã thanh toán',
      [STATUS.PAYMENT_STATUS.FAILED]: 'Thất bại',
      [STATUS.PAYMENT_STATUS.REFUNDED]: 'Đã hoàn tiền',
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
   * Shipping method translations
   */
  private readonly shippingMethodTranslations: Record<SupportedLocale, Record<string, string>> = {
    en: {
      'standard': 'Standard Shipping',
      'standard_shipping': 'Standard Shipping',
      'standardshipping': 'Standard Shipping',
      'express': 'Express Shipping',
      'express_shipping': 'Express Shipping',
      'expressshipping': 'Express Shipping',
      'overnight': 'Overnight Shipping',
      'overnight_shipping': 'Overnight Shipping',
      'overnightshipping': 'Overnight Shipping',
      'international': 'International Shipping',
      'international_shipping': 'International Shipping',
      'internationalshipping': 'International Shipping',
      'free': 'Free Shipping',
      'free_shipping': 'Free Shipping',
      'freeshipping': 'Free Shipping',
      'pickup': 'Store Pickup',
      'store_pickup': 'Store Pickup',
      'storepickup': 'Store Pickup',
      'same_day': 'Same Day Delivery',
      'sameday': 'Same Day Delivery',
      'same_day_delivery': 'Same Day Delivery',
      'samedaydelivery': 'Same Day Delivery',
    },
    vi: {
      'standard': 'Vận chuyển tiêu chuẩn',
      'standard_shipping': 'Vận chuyển tiêu chuẩn',
      'standardshipping': 'Vận chuyển tiêu chuẩn',
      'express': 'Vận chuyển nhanh',
      'express_shipping': 'Vận chuyển nhanh',
      'expressshipping': 'Vận chuyển nhanh',
      'overnight': 'Vận chuyển qua đêm',
      'overnight_shipping': 'Vận chuyển qua đêm',
      'overnightshipping': 'Vận chuyển qua đêm',
      'international': 'Vận chuyển quốc tế',
      'international_shipping': 'Vận chuyển quốc tế',
      'internationalshipping': 'Vận chuyển quốc tế',
      'free': 'Miễn phí vận chuyển',
      'free_shipping': 'Miễn phí vận chuyển',
      'freeshipping': 'Miễn phí vận chuyển',
      'pickup': 'Nhận tại cửa hàng',
      'store_pickup': 'Nhận tại cửa hàng',
      'storepickup': 'Nhận tại cửa hàng',
      'same_day': 'Giao hàng trong ngày',
      'sameday': 'Giao hàng trong ngày',
      'same_day_delivery': 'Giao hàng trong ngày',
      'samedaydelivery': 'Giao hàng trong ngày',
    },
  };

  /**
   * Translate order status to localized text
   * @param status - Order status value
   * @param locale - Target locale
   * @returns Translated status text
   */
  translateOrderStatus(status: string, locale: SupportedLocale = 'en'): string {
    if (!status) return status;

    const normalizedStatus = status.toUpperCase();
    const translations = this.orderStatusTranslations[locale] || this.orderStatusTranslations.en;

    return translations[normalizedStatus] || status;
  }

  /**
   * Translate payment status to localized text
   * @param status - Payment status value
   * @param locale - Target locale
   * @returns Translated status text
   */
  translatePaymentStatus(status: string, locale: SupportedLocale = 'en'): string {
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
   * @param method - Shipping method value
   * @param locale - Target locale
   * @returns Translated method text
   */
  translateShippingMethod(method: string, locale: SupportedLocale = 'en'): string {
    if (!method) return method;

    // Normalize the method string to match translation keys
    const normalizedMethod = method.toLowerCase().replace(/\s+/g, '').replace(/[-_]/g, '');
    const translations = this.shippingMethodTranslations[locale] || this.shippingMethodTranslations.en;

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

    // Return original if no translation found (allows for custom shipping methods)
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
   * @param method - Shipping method value
   * @param locale - Target locale
   * @returns Localized description with delivery estimate
   */
  getShippingMethodDescription(method: string, locale: SupportedLocale = 'en'): string {
    if (!method) return '';

    const normalizedMethod = method.toLowerCase().replace(/\s+/g, '').replace(/[-_]/g, '');

    if (normalizedMethod.includes('standard')) {
      return locale === 'vi' ? 'Giao hàng tiêu chuẩn (3-5 ngày làm việc)' : 'Standard delivery (3-5 business days)';
    }

    if (normalizedMethod.includes('express')) {
      return locale === 'vi' ? 'Giao hàng nhanh (1-2 ngày làm việc)' : 'Express delivery (1-2 business days)';
    }

    if (normalizedMethod.includes('overnight')) {
      return locale === 'vi' ? 'Giao hàng qua đêm (trong ngày)' : 'Overnight delivery (same day)';
    }

    if (normalizedMethod.includes('international')) {
      return locale === 'vi' ? 'Giao hàng quốc tế (7-14 ngày làm việc)' : 'International delivery (7-14 business days)';
    }

    if (normalizedMethod.includes('free')) {
      return locale === 'vi' ? 'Miễn phí vận chuyển (3-7 ngày làm việc)' : 'Free shipping (3-7 business days)';
    }

    if (normalizedMethod.includes('pickup')) {
      return locale === 'vi' ? 'Nhận tại cửa hàng (sẵn sàng trong 1-2 ngày)' : 'Store pickup (ready in 1-2 days)';
    }

    if (normalizedMethod.includes('sameday')) {
      return locale === 'vi' ? 'Giao hàng trong ngày' : 'Same day delivery';
    }

    // Default description
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