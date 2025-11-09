import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import type { Locale } from './config';

// Helper function to transform the translation structure
function transformMessages(translations: any, locale: Locale): any {
  const result: any = {};

  function traverse(obj: any, target: any) {
    for (const key in obj) {
      if (obj[key] && typeof obj[key] === 'object') {
        if ('en' in obj[key] && 'vi' in obj[key]) {
          // This is a translation leaf node
          target[key] = obj[key][locale];
        } else {
          // This is a nested object, recurse
          target[key] = {};
          traverse(obj[key], target[key]);
        }
      }
    }
  }

  traverse(translations, result);
  return result;
}

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  const translations = (await import(`../locales/translations.json`)).default;
  const messages = transformMessages(translations, locale as Locale);

  return {
    locale,
    messages,
  };
});
