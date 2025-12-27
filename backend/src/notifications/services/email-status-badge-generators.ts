/**
 * Status Badge Style Generators for Email Templates
 *
 * This file contains generators for creating color-coded status badges
 * for order statuses. All badges are designed with semantic colors,
 * proper accessibility compliance, and pill-shaped design.
 */

import {
  MODERN_EMAIL_STYLES,
  STATUS_BADGE_STYLES,
  ACCESSIBILITY_STANDARDS
} from './email-design-tokens';
import { CONSTANTS, OrderStatus, PaymentStatus } from '@alacraft/shared';
import { TranslationService } from '../../common/services/translation.service';

// Re-export types for backward compatibility
export type { OrderStatus, PaymentStatus } from '@alacraft/shared';

export interface StatusBadgeOptions {
  status: string;
  type: 'order' | 'payment';
  size?: 'small' | 'medium' | 'large';
  locale?: 'en' | 'vi';
}

/**
 * Status Badge Generator
 *
 * Generates color-coded status badges with semantic colors, proper contrast ratios,
 * and accessibility compliance. All badges use pill-shaped design with rounded corners.
 */
export class StatusBadgeGenerator {
  /**
   * Generate a status badge with semantic colors and proper styling
   *
   * @param options - Badge configuration options
   * @returns HTML string for the status badge
   */
  static generateStatusBadge(options: StatusBadgeOptions): string {
    const { status, type, size = 'medium', locale = 'en' } = options;

    const badgeStyle = this.getBadgeStyle(status, type, size);
    const displayText = this.getStatusDisplayText(status, type, locale);
    const ariaLabel = this.getAriaLabel(status, type, locale);

    return `
      <span style="${badgeStyle}"
            role="status"
            aria-label="${ariaLabel}">
        ${displayText}
      </span>
    `;
  }

  /**
   * Generate an order status badge
   *
   * @param status - Order status
   * @param locale - Language locale
   * @param size - Badge size
   * @returns HTML string for order status badge
   */
  static generateOrderStatusBadge(
    status: OrderStatus,
    locale: 'en' | 'vi' = 'en',
    size: 'small' | 'medium' | 'large' = 'medium'
  ): string {
    return this.generateStatusBadge({
      status,
      type: 'order',
      size,
      locale
    });
  }

  /**
   * Generate a payment status badge
   *
   * @param status - Payment status
   * @param locale - Language locale
   * @param size - Badge size
   * @returns HTML string for payment status badge
   */
  static generatePaymentStatusBadge(
    status: PaymentStatus,
    locale: 'en' | 'vi' = 'en',
    size: 'small' | 'medium' | 'large' = 'medium'
  ): string {
    return this.generateStatusBadge({
      status,
      type: 'payment',
      size,
      locale
    });
  }

  /**
   * Get badge style based on status, type, and size
   *
   * @private
   * @param status - Status value
   * @param type - Badge type
   * @param size - Badge size
   * @returns CSS style string
   */
  private static getBadgeStyle(status: string, type: string, size: string): string {
    const baseStyle = this.getBaseStatusStyle(status, type);
    const sizeStyle = this.getSizeStyle(size);

    return `${baseStyle} ${sizeStyle}`;
  }

  /**
   * Get base status style with semantic colors
   *
   * @private
   * @param status - Status value
   * @param type - Badge type
   * @returns CSS style string
   */
  private static getBaseStatusStyle(status: string, type: string): string {
    const commonStyle = `
      display: inline-block;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-radius: ${MODERN_EMAIL_STYLES.borderRadius.large};
      text-align: center;
      vertical-align: middle;
    `;

    // Order status colors
    if (type === 'order') {
      switch (status.toLowerCase()) {
        case CONSTANTS.STATUS.ORDER_STATUS.PENDING.toLowerCase():
          return `${commonStyle}
            background-color: ${MODERN_EMAIL_STYLES.colors.warning};
            color: #ffffff;
          `;
        case CONSTANTS.STATUS.ORDER_STATUS.PROCESSING.toLowerCase():
          return `${commonStyle}
            background-color: ${MODERN_EMAIL_STYLES.colors.secondary};
            color: #ffffff;
          `;
        case CONSTANTS.STATUS.ORDER_STATUS.SHIPPED.toLowerCase():
          return `${commonStyle}
            background-color: #9b59b6;
            color: #ffffff;
          `;
        case CONSTANTS.STATUS.ORDER_STATUS.DELIVERED.toLowerCase():
          return `${commonStyle}
            background-color: ${MODERN_EMAIL_STYLES.colors.success};
            color: #ffffff;
          `;
        case CONSTANTS.STATUS.ORDER_STATUS.CANCELLED.toLowerCase():
          return `${commonStyle}
            background-color: ${MODERN_EMAIL_STYLES.colors.accent};
            color: #ffffff;
          `;
        case CONSTANTS.STATUS.ORDER_STATUS.REFUNDED.toLowerCase():
          return `${commonStyle}
            background-color: #95a5a6;
            color: #ffffff;
          `;
        default:
          return `${commonStyle}
            background-color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
            color: #ffffff;
          `;
      }
    }

    // Payment status colors
    if (type === 'payment') {
      switch (status.toLowerCase()) {
        case CONSTANTS.STATUS.PAYMENT_STATUS.PENDING.toLowerCase():
          return `${commonStyle}
            background-color: ${MODERN_EMAIL_STYLES.colors.warning};
            color: #ffffff;
          `;
        case CONSTANTS.STATUS.PAYMENT_STATUS.PAID.toLowerCase():
          return `${commonStyle}
            background-color: ${MODERN_EMAIL_STYLES.colors.success};
            color: #ffffff;
          `;
        case CONSTANTS.STATUS.PAYMENT_STATUS.FAILED.toLowerCase():
          return `${commonStyle}
            background-color: ${MODERN_EMAIL_STYLES.colors.accent};
            color: #ffffff;
          `;
        case CONSTANTS.STATUS.PAYMENT_STATUS.REFUNDED.toLowerCase():
          return `${commonStyle}
            background-color: #95a5a6;
            color: #ffffff;
          `;
        default:
          return `${commonStyle}
            background-color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
            color: #ffffff;
          `;
      }
    }

    // Default style
    return `${commonStyle}
      background-color: ${MODERN_EMAIL_STYLES.colors.textSecondary};
      color: #ffffff;
    `;
  }

  /**
   * Get size-specific styles
   *
   * @private
   * @param size - Badge size
   * @returns CSS style string
   */
  private static getSizeStyle(size: string): string {
    switch (size) {
      case 'small':
        return `
          padding: ${MODERN_EMAIL_STYLES.spacing.xs} ${MODERN_EMAIL_STYLES.spacing.sm};
          font-size: 10px;
          line-height: 1.2;
        `;
      case 'medium':
        return `
          padding: ${MODERN_EMAIL_STYLES.spacing.xs} ${MODERN_EMAIL_STYLES.spacing.md};
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
          line-height: 1.2;
        `;
      case 'large':
        return `
          padding: ${MODERN_EMAIL_STYLES.spacing.sm} ${MODERN_EMAIL_STYLES.spacing.lg};
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.body};
          line-height: 1.2;
        `;
      default:
        return `
          padding: ${MODERN_EMAIL_STYLES.spacing.xs} ${MODERN_EMAIL_STYLES.spacing.md};
          font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
          line-height: 1.2;
        `;
    }
  }

  /**
   * Get localized display text for status
   *
   * @private
   * @param status - Status value
   * @param type - Badge type
   * @param locale - Language locale
   * @returns Localized status text
   */
  private static getStatusDisplayText(status: string, type: string, locale: string): string {
    const orderStatusTranslations = {
      en: {
        [CONSTANTS.STATUS.ORDER_STATUS.PENDING.toLowerCase()]: 'Pending',
        [CONSTANTS.STATUS.ORDER_STATUS.PENDING_QUOTE.toLowerCase()]: 'Pending Quote',
        [CONSTANTS.STATUS.ORDER_STATUS.PROCESSING.toLowerCase()]: 'Processing',
        [CONSTANTS.STATUS.ORDER_STATUS.SHIPPED.toLowerCase()]: 'Shipped',
        [CONSTANTS.STATUS.ORDER_STATUS.DELIVERED.toLowerCase()]: 'Delivered',
        [CONSTANTS.STATUS.ORDER_STATUS.CANCELLED.toLowerCase()]: 'Cancelled',
        [CONSTANTS.STATUS.ORDER_STATUS.REFUNDED.toLowerCase()]: 'Refunded',
      },
      vi: {
        [CONSTANTS.STATUS.ORDER_STATUS.PENDING.toLowerCase()]: 'Chờ xử lý',
        [CONSTANTS.STATUS.ORDER_STATUS.PENDING_QUOTE.toLowerCase()]: 'Chờ báo giá',
        [CONSTANTS.STATUS.ORDER_STATUS.PROCESSING.toLowerCase()]: 'Đang xử lý',
        [CONSTANTS.STATUS.ORDER_STATUS.SHIPPED.toLowerCase()]: 'Đã giao vận',
        [CONSTANTS.STATUS.ORDER_STATUS.DELIVERED.toLowerCase()]: 'Đã giao hàng',
        [CONSTANTS.STATUS.ORDER_STATUS.CANCELLED.toLowerCase()]: 'Đã hủy',
        [CONSTANTS.STATUS.ORDER_STATUS.REFUNDED.toLowerCase()]: 'Đã hoàn tiền',
      },
    };

    const paymentStatusTranslations = {
      en: {
        [CONSTANTS.STATUS.PAYMENT_STATUS.PENDING.toLowerCase()]: 'Pending',
        [CONSTANTS.STATUS.PAYMENT_STATUS.PAID.toLowerCase()]: 'Paid',
        [CONSTANTS.STATUS.PAYMENT_STATUS.FAILED.toLowerCase()]: 'Failed',
        [CONSTANTS.STATUS.PAYMENT_STATUS.REFUNDED.toLowerCase()]: 'Refunded',
      },
      vi: {
        [CONSTANTS.STATUS.PAYMENT_STATUS.PENDING.toLowerCase()]: 'Chờ thanh toán',
        [CONSTANTS.STATUS.PAYMENT_STATUS.PAID.toLowerCase()]: 'Đã thanh toán',
        [CONSTANTS.STATUS.PAYMENT_STATUS.FAILED.toLowerCase()]: 'Thất bại',
        [CONSTANTS.STATUS.PAYMENT_STATUS.REFUNDED.toLowerCase()]: 'Đã hoàn tiền',
      },
    };

    if (type === 'order') {
      const translations = orderStatusTranslations[locale as 'en' | 'vi'] || orderStatusTranslations.en;
      return (translations as any)[status.toLowerCase()] || status;
    }

    if (type === 'payment') {
      const translations = paymentStatusTranslations[locale as 'en' | 'vi'] || paymentStatusTranslations.en;
      return (translations as any)[status.toLowerCase()] || status;
    }

    return status;
  }

  /**
   * Get ARIA label for accessibility
   *
   * @private
   * @param status - Status value
   * @param type - Badge type
   * @param locale - Language locale
   * @returns ARIA label text
   */
  private static getAriaLabel(status: string, type: string, locale: string): string {
    const ariaLabels = {
      en: {
        order: {
          [CONSTANTS.STATUS.ORDER_STATUS.PENDING.toLowerCase()]: 'Order status: Pending',
          [CONSTANTS.STATUS.ORDER_STATUS.PROCESSING.toLowerCase()]: 'Order status: Processing',
          [CONSTANTS.STATUS.ORDER_STATUS.SHIPPED.toLowerCase()]: 'Order status: Shipped',
          [CONSTANTS.STATUS.ORDER_STATUS.DELIVERED.toLowerCase()]: 'Order status: Delivered',
          [CONSTANTS.STATUS.ORDER_STATUS.CANCELLED.toLowerCase()]: 'Order status: Cancelled',
          [CONSTANTS.STATUS.ORDER_STATUS.REFUNDED.toLowerCase()]: 'Order status: Refunded',
        },
        payment: {
          [CONSTANTS.STATUS.PAYMENT_STATUS.PENDING.toLowerCase()]: 'Payment status: Pending',
          [CONSTANTS.STATUS.PAYMENT_STATUS.PAID.toLowerCase()]: 'Payment status: Paid',
          [CONSTANTS.STATUS.PAYMENT_STATUS.FAILED.toLowerCase()]: 'Payment status: Failed',
          [CONSTANTS.STATUS.PAYMENT_STATUS.REFUNDED.toLowerCase()]: 'Payment status: Refunded',
        },
      },
      vi: {
        order: {
          [CONSTANTS.STATUS.ORDER_STATUS.PENDING.toLowerCase()]: 'Trạng thái đơn hàng: Chờ xử lý',
          [CONSTANTS.STATUS.ORDER_STATUS.PROCESSING.toLowerCase()]: 'Trạng thái đơn hàng: Đang xử lý',
          [CONSTANTS.STATUS.ORDER_STATUS.SHIPPED.toLowerCase()]: 'Trạng thái đơn hàng: Đã giao vận',
          [CONSTANTS.STATUS.ORDER_STATUS.DELIVERED.toLowerCase()]: 'Trạng thái đơn hàng: Đã giao hàng',
          [CONSTANTS.STATUS.ORDER_STATUS.CANCELLED.toLowerCase()]: 'Trạng thái đơn hàng: Đã hủy',
          [CONSTANTS.STATUS.ORDER_STATUS.REFUNDED.toLowerCase()]: 'Trạng thái đơn hàng: Đã hoàn tiền',
        },
        payment: {
          [CONSTANTS.STATUS.PAYMENT_STATUS.PENDING.toLowerCase()]: 'Trạng thái thanh toán: Chờ thanh toán',
          [CONSTANTS.STATUS.PAYMENT_STATUS.PAID.toLowerCase()]: 'Trạng thái thanh toán: Đã thanh toán',
          [CONSTANTS.STATUS.PAYMENT_STATUS.FAILED.toLowerCase()]: 'Trạng thái thanh toán: Thất bại',
          [CONSTANTS.STATUS.PAYMENT_STATUS.REFUNDED.toLowerCase()]: 'Trạng thái thanh toán: Đã hoàn tiền',
        },
      },
    };

    const localeLabels = ariaLabels[locale as 'en' | 'vi'] || ariaLabels.en;
    const typeLabels = (localeLabels as any)[type] || localeLabels.order;
    return (typeLabels as any)[status.toLowerCase()] || `${type} status: ${status}`;
  }

  /**
   * Generate a status badge with icon (for enhanced visual appeal)
   *
   * @param status - Status value
   * @param type - Badge type
   * @param locale - Language locale
   * @param size - Badge size
   * @returns HTML string for status badge with icon
   */
  static generateStatusBadgeWithIcon(
    status: string,
    type: 'order' | 'payment',
    locale: 'en' | 'vi' = 'en',
    size: 'small' | 'medium' | 'large' = 'medium'
  ): string {
    const icon = this.getStatusIcon(status, type);
    const badgeStyle = this.getBadgeStyle(status, type, size);
    const displayText = this.getStatusDisplayText(status, type, locale);
    const ariaLabel = this.getAriaLabel(status, type, locale);

    return `
      <span style="${badgeStyle}"
            role="status"
            aria-label="${ariaLabel}">
        ${icon} ${displayText}
      </span>
    `;
  }

  /**
   * Get status icon (Unicode symbols for email compatibility)
   *
   * @private
   * @param status - Status value
   * @param type - Badge type
   * @returns Unicode icon string
   */
  private static getStatusIcon(status: string, type: string): string {
    if (type === 'order') {
      switch (status.toLowerCase()) {
        case CONSTANTS.STATUS.ORDER_STATUS.PENDING.toLowerCase():
          return '⏳';
        case CONSTANTS.STATUS.ORDER_STATUS.PROCESSING.toLowerCase():
          return '⚙️';
        case CONSTANTS.STATUS.ORDER_STATUS.SHIPPED.toLowerCase():
          return '🚚';
        case CONSTANTS.STATUS.ORDER_STATUS.DELIVERED.toLowerCase():
          return '✅';
        case CONSTANTS.STATUS.ORDER_STATUS.CANCELLED.toLowerCase():
          return '❌';
        case CONSTANTS.STATUS.ORDER_STATUS.REFUNDED.toLowerCase():
          return '💰';
        default:
          return '📦';
      }
    }

    if (type === 'payment') {
      switch (status.toLowerCase()) {
        case CONSTANTS.STATUS.PAYMENT_STATUS.PENDING.toLowerCase():
          return '⏳';
        case CONSTANTS.STATUS.PAYMENT_STATUS.PAID.toLowerCase():
          return '✅';
        case CONSTANTS.STATUS.PAYMENT_STATUS.FAILED.toLowerCase():
          return '❌';
        case CONSTANTS.STATUS.PAYMENT_STATUS.REFUNDED.toLowerCase():
          return '💰';
        default:
          return '💳';
      }
    }

    return '•';
  }

  /**
   * Generate a progress indicator badge (for multi-step processes)
   *
   * @param currentStep - Current step number
   * @param totalSteps - Total number of steps
   * @param locale - Language locale
   * @returns HTML string for progress badge
   */
  static generateProgressBadge(
    currentStep: number,
    totalSteps: number,
    locale: 'en' | 'vi' = 'en'
  ): string {
    const progressText = locale === 'vi'
      ? `Bước ${currentStep}/${totalSteps}`
      : `Step ${currentStep}/${totalSteps}`;

    const progressPercentage = (currentStep / totalSteps) * 100;
    const backgroundColor = progressPercentage === 100
      ? MODERN_EMAIL_STYLES.colors.success
      : MODERN_EMAIL_STYLES.colors.secondary;

    return `
      <span style="
        display: inline-block;
        background-color: ${backgroundColor};
        color: #ffffff;
        padding: ${MODERN_EMAIL_STYLES.spacing.xs} ${MODERN_EMAIL_STYLES.spacing.md};
        border-radius: ${MODERN_EMAIL_STYLES.borderRadius.large};
        font-size: ${MODERN_EMAIL_STYLES.typography.fontSize.small};
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      "
      role="progressbar"
      aria-valuenow="${currentStep}"
      aria-valuemin="1"
      aria-valuemax="${totalSteps}"
      aria-label="${progressText}">
        ${progressText}
      </span>
    `;
  }
}

/**
 * Utility functions for status badge generation
 */
export class StatusBadgeUtils {
  /**
   * Validate status value
   *
   * @param status - Status to validate
   * @param type - Badge type
   * @returns boolean indicating if status is valid
   */
  static isValidStatus(status: string, type: 'order' | 'payment'): boolean {
    const validOrderStatuses = [
      CONSTANTS.STATUS.ORDER_STATUS.PENDING.toLowerCase(),
      CONSTANTS.STATUS.ORDER_STATUS.PROCESSING.toLowerCase(),
      CONSTANTS.STATUS.ORDER_STATUS.SHIPPED.toLowerCase(),
      CONSTANTS.STATUS.ORDER_STATUS.DELIVERED.toLowerCase(),
      CONSTANTS.STATUS.ORDER_STATUS.CANCELLED.toLowerCase(),
      CONSTANTS.STATUS.ORDER_STATUS.REFUNDED.toLowerCase()
    ];
    const validPaymentStatuses = [
      CONSTANTS.STATUS.PAYMENT_STATUS.PENDING.toLowerCase(),
      CONSTANTS.STATUS.PAYMENT_STATUS.PAID.toLowerCase(),
      CONSTANTS.STATUS.PAYMENT_STATUS.FAILED.toLowerCase(),
      CONSTANTS.STATUS.PAYMENT_STATUS.REFUNDED.toLowerCase()
    ];

    if (type === 'order') {
      return validOrderStatuses.includes(status.toLowerCase());
    }

    if (type === 'payment') {
      return validPaymentStatuses.includes(status.toLowerCase());
    }

    return false;
  }

  /**
   * Get all valid statuses for a type
   *
   * @param type - Badge type
   * @returns Array of valid status values
   */
  static getValidStatuses(type: 'order' | 'payment'): string[] {
    if (type === 'order') {
      return [
        CONSTANTS.STATUS.ORDER_STATUS.PENDING.toLowerCase(),
        CONSTANTS.STATUS.ORDER_STATUS.PROCESSING.toLowerCase(),
        CONSTANTS.STATUS.ORDER_STATUS.SHIPPED.toLowerCase(),
        CONSTANTS.STATUS.ORDER_STATUS.DELIVERED.toLowerCase(),
        CONSTANTS.STATUS.ORDER_STATUS.CANCELLED.toLowerCase(),
        CONSTANTS.STATUS.ORDER_STATUS.REFUNDED.toLowerCase()
      ];
    }

    if (type === 'payment') {
      return [
        CONSTANTS.STATUS.PAYMENT_STATUS.PENDING.toLowerCase(),
        CONSTANTS.STATUS.PAYMENT_STATUS.PAID.toLowerCase(),
        CONSTANTS.STATUS.PAYMENT_STATUS.FAILED.toLowerCase(),
        CONSTANTS.STATUS.PAYMENT_STATUS.REFUNDED.toLowerCase()
      ];
    }

    return [];
  }

  /**
   * Check if status represents a completed state
   *
   * @param status - Status to check
   * @param type - Badge type
   * @returns boolean indicating if status is completed
   */
  static isCompletedStatus(status: string, type: 'order' | 'payment'): boolean {
    const completedOrderStatuses = [
      CONSTANTS.STATUS.ORDER_STATUS.DELIVERED.toLowerCase(),
      CONSTANTS.STATUS.ORDER_STATUS.CANCELLED.toLowerCase(),
      CONSTANTS.STATUS.ORDER_STATUS.REFUNDED.toLowerCase()
    ];
    const completedPaymentStatuses = [
      CONSTANTS.STATUS.PAYMENT_STATUS.PAID.toLowerCase(),
      CONSTANTS.STATUS.PAYMENT_STATUS.FAILED.toLowerCase(),
      CONSTANTS.STATUS.PAYMENT_STATUS.REFUNDED.toLowerCase()
    ];

    if (type === 'order') {
      return completedOrderStatuses.includes(status.toLowerCase());
    }

    if (type === 'payment') {
      return completedPaymentStatuses.includes(status.toLowerCase());
    }

    return false;
  }

  /**
   * Check if status represents a positive state
   *
   * @param status - Status to check
   * @param type - Badge type
   * @returns boolean indicating if status is positive
   */
  static isPositiveStatus(status: string, type: 'order' | 'payment'): boolean {
    const positiveOrderStatuses = [
      CONSTANTS.STATUS.ORDER_STATUS.PROCESSING.toLowerCase(),
      CONSTANTS.STATUS.ORDER_STATUS.SHIPPED.toLowerCase(),
      CONSTANTS.STATUS.ORDER_STATUS.DELIVERED.toLowerCase()
    ];
    const positivePaymentStatuses = [CONSTANTS.STATUS.PAYMENT_STATUS.PAID.toLowerCase()];

    if (type === 'order') {
      return positiveOrderStatuses.includes(status.toLowerCase());
    }

    if (type === 'payment') {
      return positivePaymentStatuses.includes(status.toLowerCase());
    }

    return false;
  }
}