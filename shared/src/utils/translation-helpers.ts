/**
 * Translation Helper Utilities
 *
 * Utility functions for locale detection, fallback translation logic,
 * and translation key generation used throughout the application.
 */

import type { SupportedLocale } from '../translations/types';

/**
 * Locale Detection Utilities
 *
 * Functions to detect and validate locale information.
 */

/**
 * Validate if a string is a supported locale
 * @param locale - The locale string to validate
 * @returns True if the locale is supported
 */
export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return locale === 'en' || locale === 'vi';
}

/**
 * Get the default locale
 * @returns The default locale ('en')
 */
export function getDefaultLocale(): SupportedLocale {
  return 'en';
}

/**
 * Get all supported locales
 * @returns Array of all supported locale codes
 */
export function getSupportedLocales(): SupportedLocale[] {
  return ['en', 'vi'];
}

/**
 * Detect locale from browser language preferences
 * @param acceptLanguage - The Accept-Language header value
 * @returns Detected locale or default if none supported
 */
export function detectLocaleFromAcceptLanguage(
  acceptLanguage?: string
): SupportedLocale {
  if (!acceptLanguage) {
    return getDefaultLocale();
  }

  // Parse Accept-Language header (e.g., "en-US,en;q=0.9,vi;q=0.8")
  const languages = acceptLanguage
    .split(',')
    .map((lang) => {
      const [code, qValue] = lang.trim().split(';');
      const quality = qValue ? parseFloat(qValue.split('=')[1]) : 1.0;
      return { code: code.toLowerCase(), quality };
    })
    .sort((a, b) => b.quality - a.quality);

  // Find the first supported language
  for (const { code } of languages) {
    // Check exact match first
    if (isSupportedLocale(code)) {
      return code;
    }

    // Check language prefix (e.g., 'en-US' -> 'en')
    const langPrefix = code.split('-')[0];
    if (isSupportedLocale(langPrefix)) {
      return langPrefix;
    }
  }

  return getDefaultLocale();
}

/**
 * Detect locale from URL path
 * @param pathname - The URL pathname (e.g., '/vi/products')
 * @returns Detected locale or null if not found in path
 */
export function detectLocaleFromPath(pathname: string): SupportedLocale | null {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && isSupportedLocale(firstSegment)) {
    return firstSegment;
  }

  return null;
}

/**
 * Normalize locale to supported locale with fallback
 * @param locale - The locale to normalize
 * @returns Normalized supported locale
 */
export function normalizeLocale(locale?: string): SupportedLocale {
  if (!locale) {
    return getDefaultLocale();
  }

  const normalized = locale.toLowerCase();

  // Check exact match
  if (isSupportedLocale(normalized)) {
    return normalized;
  }

  // Check language prefix
  const langPrefix = normalized.split('-')[0];
  if (isSupportedLocale(langPrefix)) {
    return langPrefix;
  }

  return getDefaultLocale();
}

/**
 * Fallback Translation Logic
 *
 * Functions to handle missing translations and provide fallbacks.
 */

/**
 * Translation with fallback interface
 */
export interface TranslationWithFallback {
  en: string;
  vi?: string;
}

/**
 * Get translation with fallback to English
 * @param translations - Object containing translations for different locales
 * @param locale - The desired locale
 * @returns Translation string with fallback to English
 */
export function getTranslationWithFallback(
  translations: TranslationWithFallback,
  locale: SupportedLocale
): string {
  // Return the requested locale if available
  if (locale === 'vi' && translations.vi) {
    return translations.vi;
  }

  // Fallback to English
  return translations.en;
}

/**
 * Get translation from nested object with fallback
 * @param translationObject - Nested translation object
 * @param key - The translation key (can be dot-separated for nested access)
 * @param locale - The desired locale
 * @returns Translation string or key if not found
 */
export function getNestedTranslation(
  translationObject: Record<string, any>,
  key: string,
  locale: SupportedLocale
): string {
  const keys = key.split('.');
  let current = translationObject;

  // Navigate through nested object
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      // Key not found, return the key itself as fallback
      return key;
    }
  }

  // If we found a translation object with locale support
  if (current && typeof current === 'object' && 'en' in current) {
    return getTranslationWithFallback(
      current as TranslationWithFallback,
      locale
    );
  }

  // If we found a string, return it
  if (typeof current === 'string') {
    return current;
  }

  // Fallback to key
  return key;
}

/**
 * Check if a translation exists for a given locale
 * @param translations - Object containing translations
 * @param locale - The locale to check
 * @returns True if translation exists for the locale
 */
export function hasTranslation(
  translations: TranslationWithFallback,
  locale: SupportedLocale
): boolean {
  if (locale === 'en') {
    return Boolean(translations.en);
  }

  if (locale === 'vi') {
    return Boolean(translations.vi);
  }

  return false;
}

/**
 * Translation Key Generation
 *
 * Functions to generate consistent translation keys.
 */

/**
 * Generate a translation key from components
 * @param components - Array of key components
 * @returns Dot-separated translation key
 */
export function generateTranslationKey(...components: string[]): string {
  return components
    .filter(Boolean)
    .map((component) => component.toLowerCase().replace(/[^a-z0-9]/g, ''))
    .join('.');
}

/**
 * Generate status translation key
 * @param category - Status category (e.g., 'order', 'payment', 'user')
 * @param status - Status value
 * @returns Translation key for the status
 */
export function generateStatusTranslationKey(
  category: string,
  status: string
): string {
  return generateTranslationKey('status', category, status);
}

/**
 * Generate email translation key
 * @param template - Email template name
 * @param component - Email component (e.g., 'subject', 'greeting')
 * @returns Translation key for the email component
 */
export function generateEmailTranslationKey(
  template: string,
  component: string
): string {
  return generateTranslationKey('email', template, component);
}

/**
 * Generate UI translation key
 * @param section - UI section (e.g., 'button', 'form', 'message')
 * @param component - UI component name
 * @returns Translation key for the UI component
 */
export function generateUITranslationKey(
  section: string,
  component: string
): string {
  return generateTranslationKey('ui', section, component);
}

/**
 * Locale Formatting Utilities
 *
 * Functions to format data according to locale conventions.
 */

/**
 * Format a number according to locale conventions
 * @param value - The number to format
 * @param locale - The locale for formatting
 * @param options - Intl.NumberFormat options
 * @returns Formatted number string
 */
export function formatNumber(
  value: number,
  locale: SupportedLocale,
  options?: Intl.NumberFormatOptions
): string {
  const localeCode = locale === 'vi' ? 'vi-VN' : 'en-US';
  return new Intl.NumberFormat(localeCode, options).format(value);
}

/**
 * Format currency according to locale conventions
 * @param value - The currency value to format
 * @param locale - The locale for formatting
 * @param currency - The currency code (default: 'VND' for vi, 'USD' for en)
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  locale: SupportedLocale,
  currency?: string
): string {
  const localeCode = locale === 'vi' ? 'vi-VN' : 'en-US';
  const currencyCode = currency || (locale === 'vi' ? 'VND' : 'USD');

  return new Intl.NumberFormat(localeCode, {
    style: 'currency',
    currency: currencyCode,
  }).format(value);
}

/**
 * Format date according to locale conventions
 * @param date - The date to format
 * @param locale - The locale for formatting
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date,
  locale: SupportedLocale,
  options?: Intl.DateTimeFormatOptions
): string {
  const localeCode = locale === 'vi' ? 'vi-VN' : 'en-US';
  return new Intl.DateTimeFormat(localeCode, options).format(date);
}

/**
 * Translation Validation Utilities
 *
 * Functions to validate translation data and keys.
 */

/**
 * Validate that all required locales have translations
 * @param translations - Translation object to validate
 * @param requiredLocales - Array of required locales (default: all supported)
 * @returns Validation result with missing locales
 */
export function validateTranslationCompleteness(
  translations: Record<string, TranslationWithFallback>,
  requiredLocales: SupportedLocale[] = getSupportedLocales()
): {
  isComplete: boolean;
  missingTranslations: Array<{ key: string; locale: SupportedLocale }>;
} {
  const missingTranslations: Array<{ key: string; locale: SupportedLocale }> =
    [];

  for (const [key, translation] of Object.entries(translations)) {
    for (const locale of requiredLocales) {
      if (!hasTranslation(translation, locale)) {
        missingTranslations.push({ key, locale });
      }
    }
  }

  return {
    isComplete: missingTranslations.length === 0,
    missingTranslations,
  };
}

/**
 * Get locale display name
 * @param locale - The locale code
 * @param displayLocale - The locale to display the name in
 * @returns Human-readable locale name
 */
export function getLocaleDisplayName(
  locale: SupportedLocale,
  displayLocale: SupportedLocale = 'en'
): string {
  const names: Record<SupportedLocale, Record<SupportedLocale, string>> = {
    en: {
      en: 'English',
      vi: 'Tiếng Anh',
    },
    vi: {
      en: 'Vietnamese',
      vi: 'Tiếng Việt',
    },
  };

  return names[locale][displayLocale] || locale;
}

/**
 * Translation interpolation utilities
 *
 * Functions to handle variable substitution in translations.
 */

/**
 * Interpolate variables in a translation string
 * @param template - Translation template with placeholders (e.g., "Hello {name}")
 * @param variables - Object with variable values
 * @returns Interpolated string
 */
export function interpolateTranslation(
  template: string,
  variables: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return variables[key]?.toString() || match;
  });
}

/**
 * Pluralization utilities
 *
 * Functions to handle plural forms in translations.
 */

/**
 * Simple pluralization for English
 * @param count - The count to determine plural form
 * @param singular - Singular form
 * @param plural - Plural form (optional, will add 's' if not provided)
 * @returns Appropriate form based on count
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string
): string {
  if (count === 1) {
    return singular;
  }
  return plural || `${singular}s`;
}

/**
 * Get plural form for Vietnamese (Vietnamese doesn't have plural forms like English)
 * @param count - The count (not used for Vietnamese)
 * @param form - The word form
 * @returns The same form (Vietnamese doesn't change for plurals)
 */
export function pluralizeVietnamese(count: number, form: string): string {
  return form;
}

/**
 * Locale-aware pluralization
 * @param count - The count to determine plural form
 * @param locale - The locale for pluralization rules
 * @param singular - Singular form
 * @param plural - Plural form (for English)
 * @returns Appropriate form based on locale and count
 */
export function pluralizeByLocale(
  count: number,
  locale: SupportedLocale,
  singular: string,
  plural?: string
): string {
  if (locale === 'vi') {
    return pluralizeVietnamese(count, singular);
  }
  return pluralize(count, singular, plural);
}
