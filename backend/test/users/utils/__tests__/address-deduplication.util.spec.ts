import { AddressDeduplicationUtil } from '../../../../src/users/utils/address-deduplication.util';

describe('AddressDeduplicationUtil', () => {
  describe('normalizeString', () => {
    it('should trim leading and trailing whitespace', () => {
      expect(AddressDeduplicationUtil.normalizeString('  hello  ')).toBe('hello');
    });

    it('should collapse multiple spaces into single space', () => {
      expect(AddressDeduplicationUtil.normalizeString('hello    world')).toBe('hello world');
    });

    it('should convert to lowercase', () => {
      expect(AddressDeduplicationUtil.normalizeString('HELLO World')).toBe('hello world');
    });

    it('should handle null by returning empty string', () => {
      expect(AddressDeduplicationUtil.normalizeString(null)).toBe('');
    });

    it('should handle undefined by returning empty string', () => {
      expect(AddressDeduplicationUtil.normalizeString(undefined)).toBe('');
    });

    it('should handle combined whitespace and case variations', () => {
      expect(AddressDeduplicationUtil.normalizeString('  123  Main   St  ')).toBe('123 main st');
    });
  });

  describe('normalizePostalCode', () => {
    it('should remove spaces', () => {
      expect(AddressDeduplicationUtil.normalizePostalCode('12345 6789')).toBe('123456789');
    });

    it('should remove hyphens', () => {
      expect(AddressDeduplicationUtil.normalizePostalCode('12345-6789')).toBe('123456789');
    });

    it('should convert to uppercase', () => {
      expect(AddressDeduplicationUtil.normalizePostalCode('abc123')).toBe('ABC123');
    });

    it('should trim whitespace', () => {
      expect(AddressDeduplicationUtil.normalizePostalCode('  12345  ')).toBe('12345');
    });

    it('should handle combined formatting variations', () => {
      expect(AddressDeduplicationUtil.normalizePostalCode('  k1a-0b1  ')).toBe('K1A0B1');
    });
  });

  describe('normalizeCountryCode', () => {
    it('should convert to uppercase', () => {
      expect(AddressDeduplicationUtil.normalizeCountryCode('us')).toBe('US');
    });

    it('should trim whitespace', () => {
      expect(AddressDeduplicationUtil.normalizeCountryCode('  CA  ')).toBe('CA');
    });

    it('should handle mixed case', () => {
      expect(AddressDeduplicationUtil.normalizeCountryCode('Gb')).toBe('GB');
    });
  });

  describe('normalizeAddress', () => {
    it('should normalize all address fields', () => {
      const address = {
        addressLine1: '  123  Main   St  ',
        addressLine2: 'Apt  4B',
        city: '  NEW  York  ',
        state: 'ny',
        postalCode: '10001-1234',
        country: 'us',
      };

      const normalized = AddressDeduplicationUtil.normalizeAddress(address);

      expect(normalized).toEqual({
        addressLine1: '123 main st',
        addressLine2: 'apt 4b',
        city: 'new york',
        state: 'ny',
        postalCode: '100011234',
        country: 'US',
      });
    });

    it('should handle null addressLine2', () => {
      const address = {
        addressLine1: '123 Main St',
        addressLine2: null,
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      };

      const normalized = AddressDeduplicationUtil.normalizeAddress(address);

      expect(normalized.addressLine2).toBe('');
    });

    it('should handle undefined addressLine2', () => {
      const address = {
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      };

      const normalized = AddressDeduplicationUtil.normalizeAddress(address);

      expect(normalized.addressLine2).toBe('');
    });
  });

  describe('areAddressesDuplicate', () => {
    it('should return true for identical addresses', () => {
      const addr1 = {
        addressLine1: '123 Main St',
        addressLine2: 'Apt 4B',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      };

      const addr2 = {
        addressLine1: '123 Main St',
        addressLine2: 'Apt 4B',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      };

      expect(AddressDeduplicationUtil.areAddressesDuplicate(addr1, addr2)).toBe(true);
    });

    it('should return true for addresses with different whitespace', () => {
      const addr1 = {
        addressLine1: '123 Main St',
        addressLine2: 'Apt 4B',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      };

      const addr2 = {
        addressLine1: '  123   Main   St  ',
        addressLine2: '  Apt   4B  ',
        city: '  New   York  ',
        state: '  NY  ',
        postalCode: '10001',
        country: 'US',
      };

      expect(AddressDeduplicationUtil.areAddressesDuplicate(addr1, addr2)).toBe(true);
    });

    it('should return true for addresses with different capitalization', () => {
      const addr1 = {
        addressLine1: '123 Main St',
        addressLine2: 'Apt 4B',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      };

      const addr2 = {
        addressLine1: '123 MAIN ST',
        addressLine2: 'APT 4B',
        city: 'NEW YORK',
        state: 'ny',
        postalCode: '10001',
        country: 'us',
      };

      expect(AddressDeduplicationUtil.areAddressesDuplicate(addr1, addr2)).toBe(true);
    });

    it('should return true for addresses with different postal code formatting', () => {
      const addr1 = {
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001-1234',
        country: 'US',
      };

      const addr2 = {
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001 1234',
        country: 'US',
      };

      expect(AddressDeduplicationUtil.areAddressesDuplicate(addr1, addr2)).toBe(true);
    });

    it('should return false for addresses with different addressLine1', () => {
      const addr1 = {
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      };

      const addr2 = {
        addressLine1: '456 Oak Ave',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      };

      expect(AddressDeduplicationUtil.areAddressesDuplicate(addr1, addr2)).toBe(false);
    });

    it('should return false when one has addressLine2 and other does not', () => {
      const addr1 = {
        addressLine1: '123 Main St',
        addressLine2: 'Apt 4B',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      };

      const addr2 = {
        addressLine1: '123 Main St',
        addressLine2: null,
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      };

      expect(AddressDeduplicationUtil.areAddressesDuplicate(addr1, addr2)).toBe(false);
    });

    it('should return false for addresses with different country codes', () => {
      const addr1 = {
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      };

      const addr2 = {
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'CA',
      };

      expect(AddressDeduplicationUtil.areAddressesDuplicate(addr1, addr2)).toBe(false);
    });

    it('should handle special characters in street names', () => {
      const addr1 = {
        addressLine1: "123 O'Brien St",
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      };

      const addr2 = {
        addressLine1: "123 O'Brien St",
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      };

      expect(AddressDeduplicationUtil.areAddressesDuplicate(addr1, addr2)).toBe(true);
    });

    it('should handle apartment numbers correctly', () => {
      const addr1 = {
        addressLine1: '123 Main St',
        addressLine2: 'Unit 5',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      };

      const addr2 = {
        addressLine1: '123 Main St',
        addressLine2: 'Suite 5',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      };

      expect(AddressDeduplicationUtil.areAddressesDuplicate(addr1, addr2)).toBe(false);
    });
  });
});
