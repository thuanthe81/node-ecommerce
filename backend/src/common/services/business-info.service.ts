import { Injectable, Logger } from '@nestjs/common';
import { FooterSettingsService } from '../../footer-settings/footer-settings.service';
import { BusinessInfoData, AddressData } from '../../pdf-generator/types/pdf.types';
import { BUSINESS, ConstantUtils } from '../constants';

/**
 * Service for managing business information across the application
 *
 * This service provides a centralized way to retrieve business information
 * that can be used by various services like PDF generation, email templates,
 * and order processing. It combines data from constants and database settings.
 */
@Injectable()
export class BusinessInfoService {
  private readonly logger = new Logger(BusinessInfoService.name);

  constructor(
    private readonly footerSettingsService: FooterSettingsService,
  ) {}

  /**
   * Get comprehensive business information for the specified locale
   *
   * @param locale - Language locale for localized content ('en' | 'vi')
   * @returns Promise<BusinessInfoData> - Complete business information
   *
   * @example
   * ```typescript
   * const businessInfo = await this.businessInfoService.getBusinessInfo('vi');
   * console.log(businessInfo.companyName); // "Cửa hàng thủ công"
   * ```
   */
  async getBusinessInfo(locale: 'en' | 'vi' = 'en'): Promise<BusinessInfoData> {
    const companyName = ConstantUtils.getCompanyName(locale);

    try {
      // Fetch footer settings from database
      const footerSettings =
        await this.footerSettingsService.getFooterSettings();

      return {
        companyName,
        logoUrl: BUSINESS.ASSETS.LOGO,
        contactEmail: footerSettings?.contactEmail || BUSINESS.CONTACT.EMAIL.PRIMARY,
        contactPhone: footerSettings?.contactPhone || undefined,
        website: this.constructWebsiteUrl(footerSettings),
        address: this.createBusinessAddress(
          footerSettings,
          companyName,
          locale,
        ),
        returnPolicy: undefined,
        termsAndConditions: undefined,
      };
    } catch (error) {
      this.logger.error(
        'Failed to fetch business info from footer settings:',
        error,
      );

      // Return fallback business info with constants only
      return this.getFallbackBusinessInfo(companyName, locale);
    }
  }

  /**
   * Get fallback business information when database is unavailable
   *
   * @param companyName - Company name for the locale
   * @param locale - Language locale
   * @returns BusinessInfoData with fallback values
   */
  private getFallbackBusinessInfo(
    companyName: string,
    locale: 'en' | 'vi',
  ): BusinessInfoData {
    return {
      companyName,
      logoUrl: BUSINESS.ASSETS.LOGO,
      contactEmail: BUSINESS.CONTACT.EMAIL.PRIMARY,
      contactPhone: undefined,
      website: process.env.FRONTEND_URL || BUSINESS.WEBSITE.WWW,
      address: {
        fullName: companyName,
        addressLine1: '',
        addressLine2: undefined,
        city: locale === 'vi' ? 'Thành phố Hồ Chí Minh' : 'Ho Chi Minh City',
        state: locale === 'vi' ? 'Hồ Chí Minh' : 'Ho Chi Minh',
        postalCode: '70000',
        country: locale === 'vi' ? 'Việt Nam' : 'Vietnam',
        phone: undefined,
      },
      returnPolicy: undefined,
      termsAndConditions: undefined,
    };
  }

  /**
   * Construct website URL from available settings
   *
   * @param footerSettings - Footer settings from database
   * @returns Website URL or fallback URL
   */
  private constructWebsiteUrl(footerSettings: any): string | undefined {
    // Use environment variable first
    if (process.env.FRONTEND_URL) {
      return process.env.FRONTEND_URL;
    }

    // Try to use website from footer settings
    if (footerSettings?.website) {
      return footerSettings.website;
    }

    // Try to construct website URL from available social media links
    if (footerSettings?.facebookUrl) {
      // Extract domain from Facebook URL if it's a business page
      const match = footerSettings.facebookUrl.match(/facebook\.com\/([^\/]+)/);
      if (match && !match[1].includes('profile.php')) {
        return `https://www.${match[1]}.com`; // Attempt to guess website
      }
    }

    // Default to the primary website URL from constants
    return BUSINESS.WEBSITE.WWW;
  }

  /**
   * Create comprehensive business address from footer settings
   *
   * @param footerSettings - Footer settings from database
   * @param companyName - Company name
   * @param locale - Language locale
   * @returns Complete business address
   */
  private createBusinessAddress(
    footerSettings: any,
    companyName: string,
    locale: 'en' | 'vi',
  ): AddressData {
    return {
      fullName: companyName,
      addressLine1: footerSettings?.address || '',
      addressLine2: undefined,
      city: locale === 'vi' ? 'Thành phố Hồ Chí Minh' : 'Ho Chi Minh City',
      state: locale === 'vi' ? 'Hồ Chí Minh' : 'Ho Chi Minh',
      postalCode: '70000',
      country: locale === 'vi' ? 'Việt Nam' : 'Vietnam',
      phone: footerSettings?.contactPhone || undefined,
    };
  }

  /**
   * Get company name for the specified locale
   *
   * @param locale - Language locale
   * @returns Localized company name
   */
  getCompanyName(locale: 'en' | 'vi' = 'en'): string {
    return ConstantUtils.getCompanyName(locale);
  }

  /**
   * Get business contact email with fallback
   *
   * @returns Promise<string> - Business contact email
   */
  async getContactEmail(): Promise<string> {
    try {
      const footerSettings = await this.footerSettingsService.getFooterSettings();
      return footerSettings?.contactEmail || BUSINESS.CONTACT.EMAIL.PRIMARY;
    } catch (error) {
      this.logger.error('Failed to fetch contact email from footer settings:', error);
      return BUSINESS.CONTACT.EMAIL.PRIMARY;
    }
  }

  /**
   * Get business contact phone with fallback
   *
   * @returns Promise<string | undefined> - Business contact phone
   */
  async getContactPhone(): Promise<string | undefined> {
    try {
      const footerSettings = await this.footerSettingsService.getFooterSettings();
      return footerSettings?.contactPhone || undefined;
    } catch (error) {
      this.logger.error('Failed to fetch contact phone from footer settings:', error);
      return undefined;
    }
  }
}