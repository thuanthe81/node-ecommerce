import { Test, TestingModule } from '@nestjs/testing';
import { PDFLocalizationService } from '../../src/pdf-generator/services/pdf-localization.service';

describe('PDF Shipping Translation Keys Completeness', () => {
  let localizationService: PDFLocalizationService;

  // Required shipping translation keys based on PDF Document Structure Service usage
  const requiredShippingKeys = [
    'shippingInformation',
    'shippingMethod',
    'description',
    'estimatedDelivery',
    'trackingNumber',
    'carrier',
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PDFLocalizationService],
    }).compile();

    localizationService = module.get<PDFLocalizationService>(PDFLocalizationService);
  });

  describe('Translation Key Existence', () => {
    it('should have all required shipping translation keys in English', () => {
      const englishTranslations = localizationService.getAllTranslations('en');

      requiredShippingKeys.forEach(key => {
        expect(englishTranslations).toHaveProperty(key);
        expect(englishTranslations[key]).toBeDefined();
        expect(englishTranslations[key]).not.toBe('');
        expect(typeof englishTranslations[key]).toBe('string');
      });
    });

    it('should have all required shipping translation keys in Vietnamese', () => {
      const vietnameseTranslations = localizationService.getAllTranslations('vi');

      requiredShippingKeys.forEach(key => {
        expect(vietnameseTranslations).toHaveProperty(key);
        expect(vietnameseTranslations[key]).toBeDefined();
        expect(vietnameseTranslations[key]).not.toBe('');
        expect(typeof vietnameseTranslations[key]).toBe('string');
      });
    });

    it('should have consistent translation keys between English and Vietnamese', () => {
      const englishTranslations = localizationService.getAllTranslations('en');
      const vietnameseTranslations = localizationService.getAllTranslations('vi');

      requiredShippingKeys.forEach(key => {
        expect(englishTranslations).toHaveProperty(key);
        expect(vietnameseTranslations).toHaveProperty(key);

        // Ensure both translations exist and are different (not the same text)
        expect(englishTranslations[key]).toBeDefined();
        expect(vietnameseTranslations[key]).toBeDefined();
        expect(englishTranslations[key]).not.toBe(vietnameseTranslations[key]);
      });
    });
  });

  describe('Translation Content Quality', () => {
    it('should have meaningful English shipping translations', () => {
      const expectedEnglishTranslations = {
        shippingInformation: 'Shipping Information',
        shippingMethod: 'Method',
        description: 'Description',
        estimatedDelivery: 'Estimated Delivery',
        trackingNumber: 'Tracking Number',
        carrier: 'Carrier',
      };

      requiredShippingKeys.forEach(key => {
        const translation = localizationService.translate(key, 'en');
        expect(translation).toBe(expectedEnglishTranslations[key]);
      });
    });

    it('should have meaningful Vietnamese shipping translations', () => {
      const expectedVietnameseTranslations = {
        shippingInformation: 'Thông tin vận chuyển',
        shippingMethod: 'Phương thức',
        description: 'Mô tả',
        estimatedDelivery: 'Dự kiến giao hàng',
        trackingNumber: 'Mã vận đơn',
        carrier: 'Đơn vị vận chuyển',
      };

      requiredShippingKeys.forEach(key => {
        const translation = localizationService.translate(key, 'vi');
        expect(translation).toBe(expectedVietnameseTranslations[key]);
      });
    });
  });

  describe('Translation Service Integration', () => {
    it('should return translations using the translate method for all shipping keys', () => {
      requiredShippingKeys.forEach(key => {
        const englishTranslation = localizationService.translate(key, 'en');
        const vietnameseTranslation = localizationService.translate(key, 'vi');

        expect(englishTranslation).toBeDefined();
        expect(vietnameseTranslation).toBeDefined();
        expect(typeof englishTranslation).toBe('string');
        expect(typeof vietnameseTranslation).toBe('string');
        expect(englishTranslation.length).toBeGreaterThan(0);
        expect(vietnameseTranslation.length).toBeGreaterThan(0);
      });
    });

    it('should handle translation key case sensitivity correctly', () => {
      requiredShippingKeys.forEach(key => {
        const normalTranslation = localizationService.translate(key, 'en');
        const upperCaseTranslation = localizationService.translate(key.toUpperCase(), 'en');
        const lowerCaseTranslation = localizationService.translate(key.toLowerCase(), 'en');

        // The service should be case-sensitive, so different cases should return different results
        // Only the exact key should return the proper translation
        expect(normalTranslation).not.toBe(key); // Should return translation, not the key itself

        // Upper/lower case versions should return the key itself (fallback behavior)
        if (key !== key.toUpperCase()) {
          expect(upperCaseTranslation).toBe(key.toUpperCase());
        }
        if (key !== key.toLowerCase()) {
          expect(lowerCaseTranslation).toBe(key.toLowerCase());
        }
      });
    });
  });

  describe('Cross-Service Consistency Validation', () => {
    it('should provide translations that match expected PDF Document Structure Service usage', () => {
      // Test that the translations work as expected in the context they'll be used
      const testOrderData = {
        shippingMethod: {
          name: 'Standard Shipping',
          description: 'Standard delivery service',
          estimatedDelivery: '3-5 business days',
          trackingNumber: 'TRK123456789',
          carrier: 'Vietnam Post',
        },
      };

      // Simulate how the PDF Document Structure Service uses these translations
      const englishLabels = {
        sectionTitle: localizationService.translate('shippingInformation', 'en'),
        methodLabel: localizationService.translate('shippingMethod', 'en'),
        descriptionLabel: localizationService.translate('description', 'en'),
        deliveryLabel: localizationService.translate('estimatedDelivery', 'en'),
        trackingLabel: localizationService.translate('trackingNumber', 'en'),
        carrierLabel: localizationService.translate('carrier', 'en'),
      };

      const vietnameseLabels = {
        sectionTitle: localizationService.translate('shippingInformation', 'vi'),
        methodLabel: localizationService.translate('shippingMethod', 'vi'),
        descriptionLabel: localizationService.translate('description', 'vi'),
        deliveryLabel: localizationService.translate('estimatedDelivery', 'vi'),
        trackingLabel: localizationService.translate('trackingNumber', 'vi'),
        carrierLabel: localizationService.translate('carrier', 'vi'),
      };

      // Verify all labels are properly translated and not empty
      Object.values(englishLabels).forEach(label => {
        expect(label).toBeDefined();
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
      });

      Object.values(vietnameseLabels).forEach(label => {
        expect(label).toBeDefined();
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
      });

      // Verify English and Vietnamese labels are different
      expect(englishLabels.sectionTitle).not.toBe(vietnameseLabels.sectionTitle);
      expect(englishLabels.methodLabel).not.toBe(vietnameseLabels.methodLabel);
      expect(englishLabels.descriptionLabel).not.toBe(vietnameseLabels.descriptionLabel);
      expect(englishLabels.deliveryLabel).not.toBe(vietnameseLabels.deliveryLabel);
      expect(englishLabels.trackingLabel).not.toBe(vietnameseLabels.trackingLabel);
      expect(englishLabels.carrierLabel).not.toBe(vietnameseLabels.carrierLabel);
    });
  });
});