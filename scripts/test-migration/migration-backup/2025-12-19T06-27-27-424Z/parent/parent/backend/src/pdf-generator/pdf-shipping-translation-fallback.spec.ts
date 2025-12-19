import { Test, TestingModule } from '@nestjs/testing';
import { PDFLocalizationService } from './services/pdf-localization.service';

describe('PDF Shipping Translation Fallback Behavior', () => {
  let localizationService: PDFLocalizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PDFLocalizationService],
    }).compile();

    localizationService = module.get<PDFLocalizationService>(PDFLocalizationService);
  });

  describe('Missing Translation Key Fallback', () => {
    it('should return the key itself when translation key does not exist in English', () => {
      const nonExistentKeys = [
        'nonExistentShippingKey',
        'missingTranslation',
        'unknownShippingLabel',
        'invalidKey123',
        'shipping.nested.key',
      ];

      nonExistentKeys.forEach(key => {
        const result = localizationService.translate(key, 'en');
        expect(result).toBe(key);
      });
    });

    it('should return the key itself when translation key does not exist in Vietnamese', () => {
      const nonExistentKeys = [
        'nonExistentShippingKey',
        'missingTranslation',
        'unknownShippingLabel',
        'invalidKey123',
        'shipping.nested.key',
      ];

      nonExistentKeys.forEach(key => {
        const result = localizationService.translate(key, 'vi');
        expect(result).toBe(key);
      });
    });

    it('should handle empty string keys gracefully', () => {
      const emptyKey = '';

      const englishResult = localizationService.translate(emptyKey, 'en');
      const vietnameseResult = localizationService.translate(emptyKey, 'vi');

      expect(englishResult).toBe(emptyKey);
      expect(vietnameseResult).toBe(emptyKey);
    });

    it('should handle null and undefined keys gracefully', () => {
      // Test with null key - the service should handle this without crashing
      // Since null is passed as key, it will be used as property accessor which returns undefined
      // Then the fallback (|| key) will return null, which gets returned as-is
      const nullResult = localizationService.translate(null as any, 'en');
      expect(nullResult).toBe(null);

      // Test with undefined key - similar behavior
      const undefinedResult = localizationService.translate(undefined as any, 'en');
      expect(undefinedResult).toBe(undefined);
    });

    it('should handle special characters in missing keys', () => {
      const specialKeys = [
        'shipping@method',
        'shipping-method-with-dashes',
        'shipping_method_with_underscores',
        'shipping.method.with.dots',
        'shipping method with spaces',
        'shippingMethod123',
        'SHIPPING_METHOD_CAPS',
      ];

      specialKeys.forEach(key => {
        const englishResult = localizationService.translate(key, 'en');
        const vietnameseResult = localizationService.translate(key, 'vi');

        expect(englishResult).toBe(key);
        expect(vietnameseResult).toBe(key);
      });
    });
  });

  describe('Locale Fallback Behavior', () => {
    it('should fall back to English when invalid locale is provided', () => {
      const validKey = 'shippingInformation';
      const expectedEnglishTranslation = 'Shipping Information';

      // Test with invalid locales - should fall back to English
      const invalidLocales = ['fr', 'de', 'es', 'ja', 'invalid', ''];

      invalidLocales.forEach(locale => {
        const result = localizationService.translate(validKey, locale as any);
        expect(result).toBe(expectedEnglishTranslation);
      });
    });

    it('should normalize locale strings correctly', () => {
      expect(localizationService.normalizeLocale('en')).toBe('en');
      expect(localizationService.normalizeLocale('vi')).toBe('vi');
      expect(localizationService.normalizeLocale('EN')).toBe('en');
      expect(localizationService.normalizeLocale('VI')).toBe('vi');
      expect(localizationService.normalizeLocale('en-US')).toBe('en');
      expect(localizationService.normalizeLocale('vi-VN')).toBe('vi');
      expect(localizationService.normalizeLocale('fr')).toBe('en'); // fallback to default
      expect(localizationService.normalizeLocale('')).toBe('en'); // fallback to default
      expect(localizationService.normalizeLocale('invalid')).toBe('en'); // fallback to default
    });

    it('should check locale support correctly', () => {
      expect(localizationService.isLocaleSupported('en')).toBe(true);
      expect(localizationService.isLocaleSupported('vi')).toBe(true);
      expect(localizationService.isLocaleSupported('fr')).toBe(false);
      expect(localizationService.isLocaleSupported('de')).toBe(false);
      expect(localizationService.isLocaleSupported('')).toBe(false);
      expect(localizationService.isLocaleSupported('EN')).toBe(false); // case sensitive
      expect(localizationService.isLocaleSupported('VI')).toBe(false); // case sensitive
    });

    it('should return correct default locale', () => {
      expect(localizationService.getDefaultLocale()).toBe('en');
    });
  });

  describe('Parameter Interpolation with Missing Keys', () => {
    it('should handle parameter interpolation for missing keys', () => {
      const missingKey = 'missingKeyWithParams';
      const params = {
        companyName: 'Test Company',
        orderNumber: '12345',
      };

      const result = localizationService.translate(missingKey, 'en', params);

      // Should return the key itself since it doesn't exist
      expect(result).toBe(missingKey);
    });

    it('should not break when parameters are provided for existing keys without placeholders', () => {
      const existingKey = 'shippingMethod';
      const params = {
        someParam: 'value',
      };

      const englishResult = localizationService.translate(existingKey, 'en', params);
      const vietnameseResult = localizationService.translate(existingKey, 'vi', params);

      // Should return normal translations, ignoring unused parameters
      expect(englishResult).toBe('Method');
      expect(vietnameseResult).toBe('Phương thức');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle very long key names gracefully', () => {
      const longKey = 'a'.repeat(1000); // 1000 character key

      const result = localizationService.translate(longKey, 'en');
      expect(result).toBe(longKey);
      expect(result.length).toBe(1000);
    });

    it('should handle keys with unicode characters', () => {
      const unicodeKeys = [
        'shipping🚚method',
        'vận_chuyển',
        'доставка',
        '配送方法',
        'شحن',
      ];

      unicodeKeys.forEach(key => {
        const englishResult = localizationService.translate(key, 'en');
        const vietnameseResult = localizationService.translate(key, 'vi');

        expect(englishResult).toBe(key);
        expect(vietnameseResult).toBe(key);
      });
    });

    it('should maintain consistent behavior across multiple calls', () => {
      const missingKey = 'consistentMissingKey';

      // Call multiple times to ensure consistent behavior
      for (let i = 0; i < 10; i++) {
        const englishResult = localizationService.translate(missingKey, 'en');
        const vietnameseResult = localizationService.translate(missingKey, 'vi');

        expect(englishResult).toBe(missingKey);
        expect(vietnameseResult).toBe(missingKey);
      }
    });
  });

  describe('Integration with PDF Document Structure Service Context', () => {
    it('should handle missing shipping keys gracefully in PDF generation context', () => {
      // Simulate what would happen if a new shipping field was added but translation was missing
      const newShippingFields = [
        'shippingInsurance',
        'shippingPriority',
        'shippingNotes',
        'shippingWarehouse',
        'shippingRoute',
      ];

      newShippingFields.forEach(field => {
        const englishLabel = localizationService.translate(field, 'en');
        const vietnameseLabel = localizationService.translate(field, 'vi');

        // Should return the key itself as fallback
        expect(englishLabel).toBe(field);
        expect(vietnameseLabel).toBe(field);

        // Should not throw errors or return null/undefined
        expect(englishLabel).toBeDefined();
        expect(vietnameseLabel).toBeDefined();
        expect(typeof englishLabel).toBe('string');
        expect(typeof vietnameseLabel).toBe('string');
      });
    });

    it('should provide meaningful fallback for shipping section generation', () => {
      // Test a complete shipping section with some missing translations
      const shippingData = {
        method: 'Express Delivery',
        description: 'Fast shipping service',
        estimatedDelivery: '1-2 business days',
        trackingNumber: 'EXP123456789',
        carrier: 'Express Courier',
        // New fields that don't have translations yet
        insurance: 'Included',
        priority: 'High',
      };

      // Existing keys should work normally
      expect(localizationService.translate('shippingMethod', 'en')).toBe('Method');
      expect(localizationService.translate('description', 'en')).toBe('Description');
      expect(localizationService.translate('estimatedDelivery', 'en')).toBe('Estimated Delivery');
      expect(localizationService.translate('trackingNumber', 'en')).toBe('Tracking Number');
      expect(localizationService.translate('carrier', 'en')).toBe('Carrier');

      // Missing keys should fall back gracefully
      expect(localizationService.translate('shippingInsurance', 'en')).toBe('shippingInsurance');
      expect(localizationService.translate('shippingPriority', 'en')).toBe('shippingPriority');

      // Vietnamese should behave the same way
      expect(localizationService.translate('shippingMethod', 'vi')).toBe('Phương thức');
      expect(localizationService.translate('shippingInsurance', 'vi')).toBe('shippingInsurance');
    });
  });

  describe('Service Reliability', () => {
    it('should never throw exceptions for any key/locale combination', () => {
      const testCases = [
        { key: '', locale: 'en' },
        { key: 'validKey', locale: 'invalid' },
        { key: 'invalidKey', locale: 'en' },
        { key: null, locale: 'en' },
        { key: undefined, locale: 'vi' },
        { key: 'key', locale: null },
        { key: 'key', locale: undefined },
      ];

      testCases.forEach(({ key, locale }) => {
        expect(() => {
          localizationService.translate(key as any, locale as any);
        }).not.toThrow();
      });
    });

    it('should always return a string value', () => {
      const testKeys = [
        'validKey',
        'invalidKey',
        '',
        'shippingMethod',
        'nonExistentKey',
      ];

      const testLocales = ['en', 'vi', 'invalid', '', null, undefined];

      testKeys.forEach(key => {
        testLocales.forEach(locale => {
          const result = localizationService.translate(key, locale as any);
          expect(typeof result).toBe('string');
          expect(result).toBeDefined();
        });
      });
    });
  });
});