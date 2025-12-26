/**
 * Custom Handlebars Helpers for Email Templates
 *
 * This file contains custom Handlebars helpers for email-specific functionality
 * including currency formatting, date formatting, and utility functions.
 */

import type { HelperDelegate } from 'handlebars';
import { BUSINESS } from '../../common/constants';

/**
 * Collection of email-specific Handlebars helpers
 */
export class EmailHandlebarsHelpers {
  /**
   * Get all email-specific Handlebars helpers
   *
   * @returns Object containing all helper functions
   */
  static getAllHelpers(): Record<string, HelperDelegate> {
    return {
      // Currency formatting helpers
      formatCurrency: this.formatCurrencyHelper(),
      formatPrice: this.formatPriceHelper(),

      // Date formatting helpers
      formatDate: this.formatDateHelper(),
      formatDateTime: this.formatDateTimeHelper(),
      formatRelativeDate: this.formatRelativeDateHelper(),

      // Status text translation helper
      getStatusText: this.getStatusTextHelper(),

      // Utility helpers
      pluralize: this.pluralizeHelper(),
      truncate: this.truncateHelper(),
      formatPhoneNumber: this.formatPhoneNumberHelper(),
      formatAddress: this.formatAddressHelper(),

      // Business-specific helpers
      companyName: this.companyNameHelper(),
      supportEmail: this.supportEmailHelper(),
      websiteUrl: this.websiteUrlHelper(),
      frontendUrl: this.frontendUrlHelper(),

      // Math helpers
      add: this.addHelper(),
      subtract: this.subtractHelper(),
      multiply: this.multiplyHelper(),
      divide: this.divideHelper(),
      percentage: this.percentageHelper(),
      safeCalculateTotal: this.safeCalculateTotalHelper(),

      // Array helpers
      join: this.joinHelper(),
      first: this.firstHelper(),
      last: this.lastHelper(),
      slice: this.sliceHelper(),

      // Conditional helpers
      ifEquals: this.ifEqualsHelper(),
      ifNotEquals: this.ifNotEqualsHelper(),
      ifGreaterThan: this.ifGreaterThanHelper(),
      ifLessThan: this.ifLessThanHelper(),

      // String helpers
      replace: this.replaceHelper(),
      split: this.splitHelper(),
      trim: this.trimHelper(),
      padStart: this.padStartHelper(),
      padEnd: this.padEndHelper()
    };
  }

  /**
   * Currency formatting helper - Enhanced to handle undefined/null values
   */
  private static formatCurrencyHelper(): HelperDelegate {
    return function(amount: number, currency: string = 'VND', locale?: string) {
      // Handle undefined, null, NaN, or non-numeric values
      if (amount === undefined || amount === null || typeof amount !== 'number' || isNaN(amount)) {
        const templateLocale = locale || (this as any).locale || 'en';

        // Log the occurrence for debugging
        console.warn(`[EmailTemplate] Undefined price encountered in formatCurrency: ${amount}`);

        // Return localized "Contact for Price" text
        return templateLocale === 'vi' ? 'Liên hệ để biết giá' : 'Contact for Price';
      }

      // Use the locale from template context if not provided
      const templateLocale = locale || (this as any).locale || 'en';

      try {
        if (templateLocale === 'vi') {
          return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: currency === 'VND' ? 0 : 2
          }).format(amount);
        } else {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency === 'VND' ? 'USD' : currency,
            minimumFractionDigits: 2
          }).format(amount);
        }
      } catch (error) {
        // Fallback to simple formatting if Intl fails
        const formattedAmount = amount.toLocaleString();
        return currency === 'VND' ? `${formattedAmount} ₫` : `${formattedAmount}`;
      }
    };
  }

  /**
   * Price formatting helper (simplified currency formatting) - Enhanced to handle undefined/null values
   */
  private static formatPriceHelper(): HelperDelegate {
    return function(amount: number, locale?: string) {
      // Handle undefined, null, NaN, or non-numeric values
      if (amount === undefined || amount === null || typeof amount !== 'number' || isNaN(amount)) {
        const templateLocale = locale || (this as any).locale || 'en';

        // Log the occurrence for debugging
        console.warn(`[EmailTemplate] Undefined price encountered in formatPrice: ${amount}`);

        // Return localized "Contact for Price" text
        return templateLocale === 'vi' ? 'Liên hệ để biết giá' : 'Contact for Price';
      }

      const templateLocale = locale || (this as any).locale || 'en';

      try {
        if (templateLocale === 'vi') {
          return amount.toLocaleString('vi-VN') + ' ₫';
        } else {
          return '$' + amount.toLocaleString('en-US');
        }
      } catch (error) {
        return amount.toString();
      }
    };
  }

  /**
   * Safe total calculation helper for robust total calculation in templates
   */
  private static safeCalculateTotalHelper(): HelperDelegate {
    return function(items: any[], locale?: string) {
      if (!Array.isArray(items)) return '0';

      const templateLocale = locale || (this as any).locale || 'en';
      let total = 0;
      let hasUndefinedPrices = false;

      for (const item of items) {
        const price = item.price || item.total;
        if (price === undefined || price === null || typeof price !== 'number' || isNaN(price)) {
          hasUndefinedPrices = true;
          // Log the occurrence for debugging
          console.warn(`[EmailTemplate] Order contains items with undefined prices`);
          // Treat undefined prices as 0 for calculation
          continue;
        }
        total += price;
      }

      // Format the total using the enhanced formatCurrency helper
      const formattedTotal = EmailHandlebarsHelpers.formatCurrencyHelper()(total, 'VND', templateLocale);

      if (hasUndefinedPrices) {
        // Return total with note about quote items
        const quoteNote = templateLocale === 'vi'
          ? ' (+ giá sản phẩm cần báo giá)'
          : ' (+ quote items)';

        return formattedTotal + quoteNote;
      }

      return formattedTotal;
    };
  }

  /**
   * Date formatting helper
   */
  private static formatDateHelper(): HelperDelegate {
    return function(date: string | Date, locale?: string) {
      if (!date) return '';

      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return '';

      const templateLocale = locale || (this as any).locale || 'en';

      try {
        if (templateLocale === 'vi') {
          return dateObj.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        } else {
          return dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }
      } catch (error) {
        return dateObj.toDateString();
      }
    };
  }

  /**
   * Date and time formatting helper
   */
  private static formatDateTimeHelper(): HelperDelegate {
    return function(date: string | Date, locale?: string) {
      if (!date) return '';

      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return '';

      const templateLocale = locale || (this as any).locale || 'en';

      try {
        if (templateLocale === 'vi') {
          return dateObj.toLocaleString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        } else {
          return dateObj.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      } catch (error) {
        return dateObj.toString();
      }
    };
  }

  /**
   * Relative date formatting helper
   */
  private static formatRelativeDateHelper(): HelperDelegate {
    return function(date: string | Date, locale?: string) {
      if (!date) return '';

      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return '';

      const templateLocale = locale || (this as any).locale || 'en';
      const now = new Date();
      const diffInMs = now.getTime() - dateObj.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (templateLocale === 'vi') {
        if (diffInDays === 0) return 'Hôm nay';
        if (diffInDays === 1) return 'Hôm qua';
        if (diffInDays < 7) return `${diffInDays} ngày trước`;
        if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} tuần trước`;
        return dateObj.toLocaleDateString('vi-VN');
      } else {
        if (diffInDays === 0) return 'Today';
        if (diffInDays === 1) return 'Yesterday';
        if (diffInDays < 7) return `${diffInDays} days ago`;
        if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
        return dateObj.toLocaleDateString('en-US');
      }
    };
  }

  /**
   * Status text translation helper
   */
  private static getStatusTextHelper(): HelperDelegate {
    return function(status: string, locale?: string) {
      if (!status) return '';

      const templateLocale = locale || (this as any).locale || 'en';

      // Basic status translations
      const statusTranslations = {
        en: {
          pending: 'Pending',
          confirmed: 'Confirmed',
          processing: 'Processing',
          shipped: 'Shipped',
          delivered: 'Delivered',
          cancelled: 'Cancelled',
          refunded: 'Refunded',
          paid: 'Paid',
          unpaid: 'Unpaid',
          failed: 'Failed'
        },
        vi: {
          pending: 'Đang chờ',
          confirmed: 'Đã xác nhận',
          processing: 'Đang xử lý',
          shipped: 'Đã gửi',
          delivered: 'Đã giao',
          cancelled: 'Đã hủy',
          refunded: 'Đã hoàn tiền',
          paid: 'Đã thanh toán',
          unpaid: 'Chưa thanh toán',
          failed: 'Thất bại'
        }
      };

      const translations = statusTranslations[templateLocale as 'en' | 'vi'] || statusTranslations.en;
      return translations[status.toLowerCase() as keyof typeof translations] || status;
    };
  }

  /**
   * Pluralization helper
   */
  private static pluralizeHelper(): HelperDelegate {
    return function(count: number, singular: string, plural?: string, locale?: string) {
      if (typeof count !== 'number') return singular;

      const templateLocale = locale || (this as any).locale || 'en';

      if (templateLocale === 'vi') {
        // Vietnamese doesn't have plural forms like English
        return singular;
      } else {
        if (count === 1) return singular;
        return plural || singular + 's';
      }
    };
  }

  /**
   * Text truncation helper
   */
  private static truncateHelper(): HelperDelegate {
    return function(text: string, length: number = 50, suffix: string = '...') {
      if (!text || typeof text !== 'string') return '';
      if (text.length <= length) return text;
      return text.substring(0, length) + suffix;
    };
  }

  /**
   * Phone number formatting helper
   */
  private static formatPhoneNumberHelper(): HelperDelegate {
    return function(phoneNumber: string, locale?: string) {
      if (!phoneNumber || typeof phoneNumber !== 'string') return '';

      const templateLocale = locale || (this as any).locale || 'en';
      const cleaned = phoneNumber.replace(/\D/g, '');

      if (templateLocale === 'vi') {
        // Vietnamese phone number format
        if (cleaned.length === 10) {
          return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
        }
        if (cleaned.length === 11 && cleaned.startsWith('84')) {
          return '+84 ' + cleaned.substring(2).replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
        }
      } else {
        // US phone number format
        if (cleaned.length === 10) {
          return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
        }
        if (cleaned.length === 11 && cleaned.startsWith('1')) {
          return '+1 ' + cleaned.substring(1).replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
        }
      }

      return phoneNumber; // Return original if formatting fails
    };
  }

  /**
   * Address formatting helper
   */
  private static formatAddressHelper(): HelperDelegate {
    return function(address: any, locale?: string) {
      if (!address || typeof address !== 'object') return '';

      const templateLocale = locale || (this as any).locale || 'en';
      const parts: string[] = [];

      if (address.street) parts.push(address.street);
      if (address.city) parts.push(address.city);
      if (address.state) parts.push(address.state);
      if (address.postalCode) parts.push(address.postalCode);
      if (address.country) parts.push(address.country);

      if (templateLocale === 'vi') {
        return parts.join(', ');
      } else {
        return parts.join(', ');
      }
    };
  }

  /**
   * Company name helper
   */
  private static companyNameHelper(): HelperDelegate {
    return function(locale?: string) {
      const templateLocale = locale || (this as any).locale || 'en';
      return templateLocale === 'vi' ? BUSINESS.COMPANY.NAME.VI : BUSINESS.COMPANY.NAME.EN;
    };
  }

  /**
   * Support email helper - gets email from footer settings or fallback to constants
   */
  private static supportEmailHelper(): HelperDelegate {
    return function() {
      // This will be injected by the template context preparation
      // The actual logic is in the variable replacer service
      return (this as any).supportEmail || BUSINESS.CONTACT.EMAIL.PRIMARY;
    };
  }

  /**
   * Website URL helper - gets URL from config or fallback to constants
   */
  private static websiteUrlHelper(): HelperDelegate {
    return function() {
      // This will be injected by the template context preparation
      // The actual logic is in the variable replacer service
      return (this as any).websiteUrl || BUSINESS.WEBSITE.PRIMARY;
    };
  }

  /**
   * Frontend URL helper - gets URL from environment config
   */
  private static frontendUrlHelper(): HelperDelegate {
    return function() {
      return process.env.FRONTEND_URL || BUSINESS.WEBSITE.PRIMARY;
    };
  }

  /**
   * Addition helper
   */
  private static addHelper(): HelperDelegate {
    return function(a: number, b: number) {
      return (typeof a === 'number' ? a : 0) + (typeof b === 'number' ? b : 0);
    };
  }

  /**
   * Subtraction helper
   */
  private static subtractHelper(): HelperDelegate {
    return function(a: number, b: number) {
      return (typeof a === 'number' ? a : 0) - (typeof b === 'number' ? b : 0);
    };
  }

  /**
   * Multiplication helper
   */
  private static multiplyHelper(): HelperDelegate {
    return function(a: number, b: number) {
      return (typeof a === 'number' ? a : 0) * (typeof b === 'number' ? b : 0);
    };
  }

  /**
   * Division helper
   */
  private static divideHelper(): HelperDelegate {
    return function(a: number, b: number) {
      if (typeof b !== 'number' || b === 0) return 0;
      return (typeof a === 'number' ? a : 0) / b;
    };
  }

  /**
   * Percentage helper
   */
  private static percentageHelper(): HelperDelegate {
    return function(value: number, total: number, decimals: number = 1) {
      if (typeof value !== 'number' || typeof total !== 'number' || total === 0) return '0%';
      const percentage = (value / total) * 100;
      return percentage.toFixed(decimals) + '%';
    };
  }

  /**
   * Array join helper
   */
  private static joinHelper(): HelperDelegate {
    return function(array: any[], separator: string = ', ') {
      if (!Array.isArray(array)) return '';
      return array.join(separator);
    };
  }

  /**
   * Array first element helper
   */
  private static firstHelper(): HelperDelegate {
    return function(array: any[]) {
      if (!Array.isArray(array) || array.length === 0) return null;
      return array[0];
    };
  }

  /**
   * Array last element helper
   */
  private static lastHelper(): HelperDelegate {
    return function(array: any[]) {
      if (!Array.isArray(array) || array.length === 0) return null;
      return array[array.length - 1];
    };
  }

  /**
   * Array slice helper
   */
  private static sliceHelper(): HelperDelegate {
    return function(array: any[], start: number, end?: number) {
      if (!Array.isArray(array)) return [];
      return array.slice(start, end);
    };
  }

  /**
   * If equals helper
   */
  private static ifEqualsHelper(): HelperDelegate {
    return function(a: any, b: any, options: any) {
      if (a === b) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    };
  }

  /**
   * If not equals helper
   */
  private static ifNotEqualsHelper(): HelperDelegate {
    return function(a: any, b: any, options: any) {
      if (a !== b) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    };
  }

  /**
   * If greater than helper
   */
  private static ifGreaterThanHelper(): HelperDelegate {
    return function(a: number, b: number, options: any) {
      if (typeof a === 'number' && typeof b === 'number' && a > b) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    };
  }

  /**
   * If less than helper
   */
  private static ifLessThanHelper(): HelperDelegate {
    return function(a: number, b: number, options: any) {
      if (typeof a === 'number' && typeof b === 'number' && a < b) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    };
  }

  /**
   * String replace helper
   */
  private static replaceHelper(): HelperDelegate {
    return function(str: string, search: string, replace: string) {
      if (typeof str !== 'string') return '';
      return str.replace(new RegExp(search, 'g'), replace);
    };
  }

  /**
   * String split helper
   */
  private static splitHelper(): HelperDelegate {
    return function(str: string, separator: string) {
      if (typeof str !== 'string') return [];
      return str.split(separator);
    };
  }

  /**
   * String trim helper
   */
  private static trimHelper(): HelperDelegate {
    return function(str: string) {
      if (typeof str !== 'string') return '';
      return str.trim();
    };
  }

  /**
   * String pad start helper
   */
  private static padStartHelper(): HelperDelegate {
    return function(str: string, length: number, padString: string = ' ') {
      if (typeof str !== 'string') return '';
      return str.padStart(length, padString);
    };
  }

  /**
   * String pad end helper
   */
  private static padEndHelper(): HelperDelegate {
    return function(str: string, length: number, padString: string = ' ') {
      if (typeof str !== 'string') return '';
      return str.padEnd(length, padString);
    };
  }
}