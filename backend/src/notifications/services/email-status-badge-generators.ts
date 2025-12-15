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

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

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
        case 'pending':
          return `${commonStyle}
            background-color: ${MODERN_EMAIL_STYLES.colors.warning};
            color: #ffffff;
          `;
        case 'processing':
          return `${commonStyle}
            background-color: ${MODERN_EMAIL_STYLES.colors.secondary};
            color: #ffffff;
          `;
        case 'shipped':
          return `${commonStyle}
            background-color: #9b59b6;
            color: #ffffff;
          `;
        case 'delivered':
          return `${commonStyle}
            background-color: ${MODERN_EMAIL_STYLES.colors.success};
            color: #ffffff;
          `;
        case 'cancelled':
          return `${commonStyle}
            background-color: ${MODERN_EMAIL_STYLES.colors.accent};
            color: #ffffff;
          `;
        case 'refunded':
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
        case 'pending':
          return `${commonStyle}
            background-color: ${MODERN_EMAIL_STYLES.colors.warning};
            color: #ffffff;
          `;
        case 'paid':
          return `${commonStyle}
            background-color: ${MODERN_EMAIL_STYLES.colors.success};
            color: #ffffff;
          `;
        case 'failed':
          return `${commonStyle}
            background-color: ${MODERN_EMAIL_STYLES.colors.accent};
            color: #ffffff;
          `;
        case 'refunded':
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

    const paymentStatusTranslations = {
      en: {
        pending: 'Pending',
        paid: 'Paid',
        failed: 'Failed',
        refunded: 'Refunded',
      },
      vi: {
        pending: 'Chờ thanh toán',
        paid: 'Đã thanh toán',
        failed: 'Thất bại',
        refunded: 'Đã hoàn tiền',
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
          pending: 'Order status: Pending',
          processing: 'Order status: Processing',
          shipped: 'Order status: Shipped',
          delivered: 'Order status: Delivered',
          cancelled: 'Order status: Cancelled',
          refunded: 'Order status: Refunded',
        },
        payment: {
          pending: 'Payment status: Pending',
          paid: 'Payment status: Paid',
          failed: 'Payment status: Failed',
          refunded: 'Payment status: Refunded',
        },
      },
      vi: {
        order: {
          pending: 'Trạng thái đơn hàng: Chờ xử lý',
          processing: 'Trạng thái đơn hàng: Đang xử lý',
          shipped: 'Trạng thái đơn hàng: Đã giao vận',
          delivered: 'Trạng thái đơn hàng: Đã giao hàng',
          cancelled: 'Trạng thái đơn hàng: Đã hủy',
          refunded: 'Trạng thái đơn hàng: Đã hoàn tiền',
        },
        payment: {
          pending: 'Trạng thái thanh toán: Chờ thanh toán',
          paid: 'Trạng thái thanh toán: Đã thanh toán',
          failed: 'Trạng thái thanh toán: Thất bại',
          refunded: 'Trạng thái thanh toán: Đã hoàn tiền',
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
        case 'pending':
          return '⏳';
        case 'processing':
          return '⚙️';
        case 'shipped':
          return '🚚';
        case 'delivered':
          return '✅';
        case 'cancelled':
          return '❌';
        case 'refunded':
          return '💰';
        default:
          return '📦';
      }
    }

    if (type === 'payment') {
      switch (status.toLowerCase()) {
        case 'pending':
          return '⏳';
        case 'paid':
          return '✅';
        case 'failed':
          return '❌';
        case 'refunded':
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
    const validOrderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];

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
      return ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    }

    if (type === 'payment') {
      return ['pending', 'paid', 'failed', 'refunded'];
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
    const completedOrderStatuses = ['delivered', 'cancelled', 'refunded'];
    const completedPaymentStatuses = ['paid', 'failed', 'refunded'];

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
    const positiveOrderStatuses = ['processing', 'shipped', 'delivered'];
    const positivePaymentStatuses = ['paid'];

    if (type === 'order') {
      return positiveOrderStatuses.includes(status.toLowerCase());
    }

    if (type === 'payment') {
      return positivePaymentStatuses.includes(status.toLowerCase());
    }

    return false;
  }
}