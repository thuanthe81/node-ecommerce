import { useTranslations, useLocale } from 'next-intl';

/**
 * Utility function to resolve tooltip content with comprehensive translation support
 * Supports both string content and translation objects
 */
export function useTooltipContentResolver() {
  const t = useTranslations('tooltips');
  const locale = useLocale();

  return function resolveTooltipContent(
    tooltip?: string | { en: string; vi: string }
  ): string | undefined {
    if (!tooltip) return undefined;

    // Handle string content - can be either direct text or translation key
    if (typeof tooltip === 'string') {
      // First try to use it as a translation key
      try {
        const translatedText = t(tooltip);
        // If the translation key exists and returns something different than the key itself
        if (translatedText && translatedText !== tooltip) {
          return translatedText;
        }
      } catch {
        // If translation fails, fall through to return the string as-is
      }
      // Return the string as direct content
      return tooltip;
    }

    // Handle translation object with locale-specific content
    if (typeof tooltip === 'object' && tooltip.en && tooltip.vi) {
      // Try to get the current locale content directly
      if (locale === 'vi' && tooltip.vi) {
        return tooltip.vi;
      }
      if (locale === 'en' && tooltip.en) {
        return tooltip.en;
      }

      // Fallback to English if current locale content is not available
      return tooltip.en;
    }

    return undefined;
  };
}

/**
 * Helper function to validate tooltip content structure
 */
export function isValidTooltipContent(
  content: unknown
): content is string | { en: string; vi: string } {
  if (typeof content === 'string') {
    return content.length > 0;
  }

  if (typeof content === 'object' && content !== null) {
    const obj = content as Record<string, unknown>;
    return (
      typeof obj.en === 'string' &&
      typeof obj.vi === 'string' &&
      obj.en.length > 0 &&
      obj.vi.length > 0
    );
  }

  return false;
}

/**
 * Helper function to create tooltip content objects
 */
export function createTooltipContent(en: string, vi: string): { en: string; vi: string } {
  return { en, vi };
}

/**
 * Common tooltip content for frequently used SVG icons
 */
export const COMMON_TOOLTIP_KEYS = {
  MENU: 'menu',
  CLOSE: 'close',
  CART: 'cart',
  HOME: 'home',
  SEARCH: 'search',
  USER: 'user',
  SETTINGS: 'settings',
  LOGIN: 'login',
  LOGOUT: 'logout',
  LANGUAGE: 'language',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  CATEGORIES: 'categories',
  USERS: 'users',
  MESSAGE: 'message',
  FACEBOOK: 'facebook',
  TWITTER: 'twitter',
  ZALO: 'zalo',
  WHATSAPP: 'whatsapp',
  TIKTOK: 'tiktok',
} as const;

export type CommonTooltipKey = typeof COMMON_TOOLTIP_KEYS[keyof typeof COMMON_TOOLTIP_KEYS];