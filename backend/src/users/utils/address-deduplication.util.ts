/**
 * Address Deduplication Utility
 *
 * Provides pure functions for normalizing and comparing addresses to detect duplicates.
 * Handles variations in whitespace, capitalization, and formatting.
 */

export interface AddressInput {
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface NormalizedAddress {
  addressLine1: string;
  addressLine2: string; // Empty string if null/undefined
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export class AddressDeduplicationUtil {
  /**
   * Normalizes a string field for comparison
   * - Trims leading and trailing whitespace
   * - Collapses multiple consecutive spaces into a single space
   * - Converts to lowercase
   * - Handles null/undefined by converting to empty string
   *
   * @param value - The string value to normalize
   * @returns Normalized string
   */
  static normalizeString(value: string | null | undefined): string {
    if (value === null || value === undefined) {
      return '';
    }

    return value
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  /**
   * Normalizes a postal code for comparison
   * - Removes spaces and hyphens
   * - Converts to uppercase
   * - Trims whitespace
   *
   * @param postalCode - The postal code to normalize
   * @returns Normalized postal code
   */
  static normalizePostalCode(postalCode: string): string {
    return postalCode
      .trim()
      .replace(/[\s-]/g, '')
      .toUpperCase();
  }

  /**
   * Normalizes a country code for comparison
   * - Trims whitespace
   * - Converts to uppercase
   *
   * @param country - The country code to normalize
   * @returns Normalized country code
   */
  static normalizeCountryCode(country: string): string {
    return country
      .trim()
      .toUpperCase();
  }

  /**
   * Normalizes all fields of an address for comparison
   *
   * @param address - The address to normalize
   * @returns Normalized address with all fields standardized
   */
  static normalizeAddress(address: AddressInput): NormalizedAddress {
    return {
      addressLine1: this.normalizeString(address.addressLine1),
      addressLine2: this.normalizeString(address.addressLine2),
      city: this.normalizeString(address.city),
      state: this.normalizeString(address.state),
      postalCode: this.normalizePostalCode(address.postalCode),
      country: this.normalizeCountryCode(address.country),
    };
  }

  /**
   * Compares two addresses to determine if they are duplicates
   * Uses normalized values for comparison to handle formatting variations
   *
   * @param addr1 - First address to compare
   * @param addr2 - Second address to compare
   * @returns true if addresses are duplicates, false otherwise
   */
  static areAddressesDuplicate(
    addr1: AddressInput,
    addr2: AddressInput,
  ): boolean {
    const normalized1 = this.normalizeAddress(addr1);
    const normalized2 = this.normalizeAddress(addr2);

    return (
      normalized1.addressLine1 === normalized2.addressLine1 &&
      normalized1.addressLine2 === normalized2.addressLine2 &&
      normalized1.city === normalized2.city &&
      normalized1.state === normalized2.state &&
      normalized1.postalCode === normalized2.postalCode &&
      normalized1.country === normalized2.country
    );
  }
}
