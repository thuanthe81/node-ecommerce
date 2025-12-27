// Translation type definitions
// This file will be implemented alongside the translation modules

export type SupportedLocale = 'en' | 'vi';

export interface StatusTranslations {
  [category: string]: {
    [status: string]: {
      en: string;
      vi: string;
    };
  };
}
