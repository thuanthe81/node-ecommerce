/**
 * Business Constants
 *
 * Business-related constants including company information, contact details,
 * and branding assets used throughout the application.
 */

/**
 * Company Information Interface
 */
export interface CompanyInfo {
  /** Company names in different languages */
  NAME: {
    /** English company name */
    EN: string;
    /** Vietnamese company name */
    VI: string;
  };
  /** Legal company name for official documents */
  LEGAL_NAME: string;
}

/**
 * Contact Information Interface
 */
export interface ContactInfo {
  /** Email addresses for different purposes */
  EMAIL: {
    /** Primary contact email */
    PRIMARY: string;
    /** Vietnamese contact email */
    VIETNAMESE: string;
    /** Orders-specific email */
    ORDERS: string;
  };
  /** Phone numbers for different regions */
  PHONE: {
    /** Primary Vietnamese phone number */
    PRIMARY: string;
    /** International phone number */
    INTERNATIONAL: string;
  };
}

/**
 * Website URL Interface
 */
export interface WebsiteInfo {
  /** Primary website URL */
  PRIMARY: string;
  /** WWW version of website URL */
  WWW: string;
}

/**
 * Social Media Interface
 */
export interface SocialMediaInfo {
  /** Facebook page URL */
  FACEBOOK: string;
  /** Instagram profile URL */
  INSTAGRAM: string;
  /** Zalo contact URL */
  ZALO: string;
  /** WhatsApp contact URL */
  WHATSAPP?: string;
}

/**
 * Asset Paths Interface
 */
export interface AssetInfo {
  /** Company logo path */
  LOGO: string;
  /** Default product image placeholder */
  DEFAULT_PRODUCT_IMAGE: string;
}

/**
 * Business Constants Object
 *
 * Consolidated business constants including company information, contact details,
 * and branding assets.
 */
export const BUSINESS = {
  /**
   * Company Information Constants
   *
   * Company names and legal information for consistent branding.
   */
  COMPANY: {
    /**
     * Company Names
     *
     * Localized company names for different languages and regions.
     */
    NAME: {
      /** English company name */
      EN: 'Ala Craft',
      /** Vietnamese company name */
      VI: 'Ala Craft',
    } as const,
    /** Legal company name for official documents and contracts */
    LEGAL_NAME: 'Ala Craft',
  } as const,

  /**
   * Contact Information Constants
   *
   * Email addresses and phone numbers for different business purposes.
   */
  CONTACT: {
    /**
     * Email Addresses
     *
     * Different email addresses for various business functions.
     */
    EMAIL: {
      /** Primary contact email for general inquiries */
      PRIMARY: 'contact@alacraft.com',
      /** Vietnamese contact email for local customers */
      VIETNAMESE: 'lienhe@alacraft.com',
      /** Orders-specific email for order-related communications */
      ORDERS: 'orders@alacraft.com',
    } as const,
    /**
     * Phone Numbers
     *
     * Contact phone numbers for different regions and purposes.
     */
    PHONE: {
      /** Primary Vietnamese phone number */
      PRIMARY: '+84 123 456 789',
      /** International phone number for global customers */
      INTERNATIONAL: '+1-555-ALACRAFT',
    } as const,
  } as const,

  /**
   * Website URL Constants
   *
   * Official website URLs for the business.
   */
  WEBSITE: {
    /** Primary website URL without www */
    PRIMARY: 'https://alacraft.com',
    /** WWW version of website URL for compatibility */
    WWW: 'https://www.alacraft.com',
  } as const,

  /**
   * Social Media Constants
   *
   * Official social media platform URLs for the business.
   */
  SOCIAL: {
    /** Facebook business page URL */
    FACEBOOK: 'https://facebook.com/alacraft',
    /** Instagram business profile URL */
    INSTAGRAM: 'https://instagram.com/alacraft',
    /** Zalo business contact URL */
    ZALO: 'https://zalo.me/alacraft',
    /** WhatsApp business contact URL */
    WHATSAPP: 'https://wa.me/84123456789',
  } as const,

  /**
   * Asset Path Constants
   *
   * Paths to branding assets and default images.
   */
  ASSETS: {
    /** Company logo file path */
    LOGO: '/uploads/logo.jpg',
    /** Default product image placeholder path */
    DEFAULT_PRODUCT_IMAGE: '/placeholder-product.png',
  } as const,
} as const;

/**
 * Type Exports for Business Constants
 */
export type CompanyName =
  (typeof BUSINESS.COMPANY.NAME)[keyof typeof BUSINESS.COMPANY.NAME];
export type ContactEmail =
  (typeof BUSINESS.CONTACT.EMAIL)[keyof typeof BUSINESS.CONTACT.EMAIL];
export type ContactPhone =
  (typeof BUSINESS.CONTACT.PHONE)[keyof typeof BUSINESS.CONTACT.PHONE];
export type WebsiteUrl =
  (typeof BUSINESS.WEBSITE)[keyof typeof BUSINESS.WEBSITE];
export type SocialPlatform = keyof typeof BUSINESS.SOCIAL;
export type AssetPath = (typeof BUSINESS.ASSETS)[keyof typeof BUSINESS.ASSETS];
