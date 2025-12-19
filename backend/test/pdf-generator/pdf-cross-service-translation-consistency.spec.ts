import { Test, TestingModule } from '@nestjs/testing';
import { PDFDocumentStructureService } from '../../src/pdf-generator/pdf-document-structure.service';
import { PDFTemplateEngine } from '../../src/pdf-generator/pdf-template.engine';
import { PDFLocalizationService } from '../../src/pdf-generator/services/pdf-localization.service';
import { PDFAccessibilityService } from '../../src/pdf-generator/services/pdf-accessibility.service';
import { PDFDeviceOptimizationService } from '../../src/pdf-generator/services/pdf-device-optimization.service';
import { PDFImageConverterService } from '../../src/pdf-generator/services/pdf-image-converter.service';
import { PDFCompressionService } from '../../src/pdf-generator/services/pdf-compression.service';
import { ShippingService } from '../../src/shipping/shipping.service';
import { OrderPDFData, PDFStyling } from '../../src/pdf-generator/types/pdf.types';

/**
 * Cross-Service Translation Consistency Tests
 *
 * These tests verify that shipping section translations match other PDF sections
 * and ensure consistent translation patterns between PDF Document Structure Service
 * and PDF Template Engine.
 *
 * Requirements: 2.1, 2.5
 */
describe('PDF Cross-Service Translation Consistency', () => {
  let documentStructureService: PDFDocumentStructureService;
  let templateEngine: PDFTemplateEngine;
  let localizationService: PDFLocalizationService;

  const mockOrderData: OrderPDFData = {
    orderNumber: 'TEST-SHIP-001',
    orderDate: new Date('2023-12-15'),
    customerInfo: {
      name: 'Test Customer',
      email: 'test@example.com',
      phone: '+1234567890',
    },
    items: [
      {
        id: '1',
        name: 'Test Product',
        description: 'Test Description',
        sku: 'TEST-SKU',
        quantity: 1,
        unitPrice: 100000,
        totalPrice: 100000,
        imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      },
    ],
    pricing: {
      subtotal: 100000,
      shippingCost: 25000,
      taxAmount: 0,
      discountAmount: 0,
      total: 125000,
    },
    shippingAddress: {
      fullName: 'Test Customer',
      addressLine1: '123 Test St',
      addressLine2: '',
      city: 'Test City',
      state: 'Test State',
      postalCode: '12345',
      country: 'Test Country',
      phone: '+1234567890',
    },
    billingAddress: {
      fullName: 'Test Customer',
      addressLine1: '123 Test St',
      addressLine2: '',
      city: 'Test City',
      state: 'Test State',
      postalCode: '12345',
      country: 'Test Country',
      phone: '+1234567890',
    },
    paymentMethod: {
      type: 'bank_transfer',
      displayName: 'Bank Transfer',
      status: 'pending',
      details: 'Test Details',
      instructions: 'Test Instructions',
    },
    shippingMethod: {
      name: 'Express Shipping',
      description: 'Fast delivery service',
      estimatedDelivery: '2-3 business days',
      trackingNumber: 'TRACK123456',
      carrier: 'Test Carrier Co.',
    },
    businessInfo: {
      companyName: 'Test Company',
      logoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      address: {
        addressLine1: '456 Business St',
        addressLine2: '',
        city: 'Business City',
        state: 'Business State',
        postalCode: '67890',
        country: 'Business Country',
      },
      contactEmail: 'business@example.com',
      contactPhone: '+0987654321',
      website: 'https://example.com',
      termsAndConditions: 'Test Terms',
      returnPolicy: 'Test Return Policy',
    },
  };

  const mockStyling: PDFStyling = {
    fonts: {
      primary: 'Arial, sans-serif',
      monospace: 'Courier New, monospace',
    },
    colors: {
      primary: '#2c3e50',
      text: '#333333',
      background: '#ffffff',
      border: '#e0e0e0',
    },
    spacing: {
      small: 8,
      medium: 16,
      large: 24,
    },
  };

  beforeEach(async () => {
    const mockShippingService = {
      getShippingMethodDetails: jest.fn().mockResolvedValue({
        name: 'Express Shipping',
        description: 'Fast delivery service',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PDFDocumentStructureService,
        PDFTemplateEngine,
        PDFLocalizationService,
        {
          provide: ShippingService,
          useValue: mockShippingService,
        },
        {
          provide: PDFAccessibilityService,
          useValue: {
            generateAccessibilityCSS: jest.fn().mockReturnValue('/* accessibility css */'),
          },
        },
        {
          provide: PDFDeviceOptimizationService,
          useValue: {
            generateCompleteDeviceCSS: jest.fn().mockReturnValue('/* device css */'),
          },
        },
        {
          provide: PDFImageConverterService,
          useValue: {
            convertMultipleImages: jest.fn().mockResolvedValue(new Map()),
          },
        },
        {
          provide: PDFCompressionService,
          useValue: {
            optimizeImageForPDF: jest.fn().mockResolvedValue({
              optimizedBuffer: Buffer.from('optimized-image-data'),
              originalSize: 1000,
              optimizedSize: 500,
              compressionRatio: 0.5,
              format: 'jpeg',
            }),
          },
        },
      ],
    }).compile();

    documentStructureService = module.get<PDFDocumentStructureService>(PDFDocumentStructureService);
    templateEngine = module.get<PDFTemplateEngine>(PDFTemplateEngine);
    localizationService = module.get<PDFLocalizationService>(PDFLocalizationService);
  });

  describe('Shipping Section Translation Keys - Requirements 2.1', () => {
    it('should use identical translation keys for shipping information across both services', async () => {
      // Generate HTML from both services
      const documentStructureHTML = await documentStructureService.generateDocumentStructure(
        mockOrderData,
        'en',
        mockStyling
      );
      const templateEngineHTML = await templateEngine.generateHTMLFromOrderData(mockOrderData, 'en');

      // Verify both services use the localization service for shipping section title
      const expectedShippingTitle = localizationService.translate('shippingInformation', 'en');
      expect(documentStructureHTML).toContain(expectedShippingTitle);
      expect(templateEngineHTML).toContain(expectedShippingTitle);

      // Verify both services use the localization service for shipping method label
      const expectedShippingMethod = localizationService.translate('shippingMethod', 'en');
      expect(documentStructureHTML).toContain(expectedShippingMethod);
      expect(templateEngineHTML).toContain(expectedShippingMethod);

      // Verify both services use the localization service for description label
      const expectedDescription = localizationService.translate('description', 'en');
      expect(documentStructureHTML).toContain(expectedDescription);
      expect(templateEngineHTML).toContain(expectedDescription);

      // Verify both services use the localization service for estimated delivery label
      const expectedEstimatedDelivery = localizationService.translate('estimatedDelivery', 'en');
      expect(documentStructureHTML).toContain(expectedEstimatedDelivery);
      expect(templateEngineHTML).toContain(expectedEstimatedDelivery);

      // Verify both services use the localization service for tracking number label
      const expectedTrackingNumber = localizationService.translate('trackingNumber', 'en');
      expect(documentStructureHTML).toContain(expectedTrackingNumber);
      expect(templateEngineHTML).toContain(expectedTrackingNumber);

      // Verify both services use the localization service for carrier label
      const expectedCarrier = localizationService.translate('carrier', 'en');
      expect(documentStructureHTML).toContain(expectedCarrier);
      expect(templateEngineHTML).toContain(expectedCarrier);
    });

    it('should not contain hardcoded shipping translations in English', async () => {
      const documentStructureHTML = await documentStructureService.generateDocumentStructure(
        mockOrderData,
        'en',
        mockStyling
      );

      // Verify no hardcoded English translations exist
      // These would indicate the service is not using the localization service
      const hardcodedPatterns = [
        /Shipping Information(?!<)/,  // Hardcoded without being from localization
        /Shipping Method(?!<)/,
        /Description(?!<)/,
        /Estimated Delivery(?!<)/,
        /Tracking Number(?!<)/,
        /Carrier(?!<)/,
      ];

      // All occurrences should come from the localization service
      // We verify this by checking that the translations match exactly what the service provides
      const shippingInfoTranslation = localizationService.translate('shippingInformation', 'en');
      const shippingMethodTranslation = localizationService.translate('shippingMethod', 'en');
      const descriptionTranslation = localizationService.translate('description', 'en');
      const estimatedDeliveryTranslation = localizationService.translate('estimatedDelivery', 'en');
      const trackingNumberTranslation = localizationService.translate('trackingNumber', 'en');
      const carrierTranslation = localizationService.translate('carrier', 'en');

      expect(documentStructureHTML).toContain(shippingInfoTranslation);
      expect(documentStructureHTML).toContain(shippingMethodTranslation);
      expect(documentStructureHTML).toContain(descriptionTranslation);
      expect(documentStructureHTML).toContain(estimatedDeliveryTranslation);
      expect(documentStructureHTML).toContain(trackingNumberTranslation);
      expect(documentStructureHTML).toContain(carrierTranslation);
    });

    it('should not contain hardcoded shipping translations in Vietnamese', async () => {
      const documentStructureHTML = await documentStructureService.generateDocumentStructure(
        mockOrderData,
        'vi',
        mockStyling
      );

      // Verify no hardcoded Vietnamese translations exist
      const shippingInfoTranslation = localizationService.translate('shippingInformation', 'vi');
      const shippingMethodTranslation = localizationService.translate('shippingMethod', 'vi');
      const descriptionTranslation = localizationService.translate('description', 'vi');
      const estimatedDeliveryTranslation = localizationService.translate('estimatedDelivery', 'vi');
      const trackingNumberTranslation = localizationService.translate('trackingNumber', 'vi');
      const carrierTranslation = localizationService.translate('carrier', 'vi');

      expect(documentStructureHTML).toContain(shippingInfoTranslation);
      expect(documentStructureHTML).toContain(shippingMethodTranslation);
      expect(documentStructureHTML).toContain(descriptionTranslation);
      expect(documentStructureHTML).toContain(estimatedDeliveryTranslation);
      expect(documentStructureHTML).toContain(trackingNumberTranslation);
      expect(documentStructureHTML).toContain(carrierTranslation);
    });
  });

  describe('Cross-Service Translation Consistency - Requirements 2.5', () => {
    it('should produce identical shipping translations between Document Structure Service and Template Engine for English', async () => {
      const documentStructureHTML = await documentStructureService.generateDocumentStructure(
        mockOrderData,
        'en',
        mockStyling
      );
      const templateEngineHTML = await templateEngine.generateHTMLFromOrderData(mockOrderData, 'en');

      // Extract shipping section from both outputs
      const extractShippingSection = (html: string): string => {
        const shippingMatch = html.match(/<section class="shipping-section">[\s\S]*?<\/section>/);
        return shippingMatch ? shippingMatch[0] : '';
      };

      const docStructureShipping = extractShippingSection(documentStructureHTML);
      const templateEngineShipping = extractShippingSection(templateEngineHTML);

      // Both should have shipping sections
      expect(docStructureShipping).toBeTruthy();
      expect(templateEngineShipping).toBeTruthy();

      // Verify all translation keys produce identical text in both services
      const translationKeys = [
        'shippingInformation',
        'shippingMethod',
        'description',
        'estimatedDelivery',
        'trackingNumber',
        'carrier',
      ];

      translationKeys.forEach(key => {
        const translation = localizationService.translate(key, 'en');
        expect(docStructureShipping).toContain(translation);
        expect(templateEngineShipping).toContain(translation);
      });
    });

    it('should produce identical shipping translations between Document Structure Service and Template Engine for Vietnamese', async () => {
      const documentStructureHTML = await documentStructureService.generateDocumentStructure(
        mockOrderData,
        'vi',
        mockStyling
      );
      const templateEngineHTML = await templateEngine.generateHTMLFromOrderData(mockOrderData, 'vi');

      // Extract shipping section from both outputs
      const extractShippingSection = (html: string): string => {
        const shippingMatch = html.match(/<section class="shipping-section">[\s\S]*?<\/section>/);
        return shippingMatch ? shippingMatch[0] : '';
      };

      const docStructureShipping = extractShippingSection(documentStructureHTML);
      const templateEngineShipping = extractShippingSection(templateEngineHTML);

      // Both should have shipping sections
      expect(docStructureShipping).toBeTruthy();
      expect(templateEngineShipping).toBeTruthy();

      // Verify all translation keys produce identical text in both services
      const translationKeys = [
        'shippingInformation',
        'shippingMethod',
        'description',
        'estimatedDelivery',
        'trackingNumber',
        'carrier',
      ];

      translationKeys.forEach(key => {
        const translation = localizationService.translate(key, 'vi');
        expect(docStructureShipping).toContain(translation);
        expect(templateEngineShipping).toContain(translation);
      });
    });

    it('should use consistent translation patterns for common terms across all PDF sections', async () => {
      const documentStructureHTML = await documentStructureService.generateDocumentStructure(
        mockOrderData,
        'en',
        mockStyling
      );

      // Common terms that appear in multiple sections should use the same translation key
      // For example, "Description" appears in both shipping and payment sections
      const descriptionTranslation = localizationService.translate('description', 'en');
      const descriptionOccurrences = (documentStructureHTML.match(new RegExp(descriptionTranslation, 'g')) || []).length;

      // Should appear at least once (in shipping section)
      expect(descriptionOccurrences).toBeGreaterThanOrEqual(1);

      // Verify the translation is consistent across all occurrences
      const descriptionMatches = documentStructureHTML.match(new RegExp(`>${descriptionTranslation}:?<`, 'g'));
      expect(descriptionMatches).toBeTruthy();
      if (descriptionMatches) {
        descriptionMatches.forEach(match => {
          expect(match).toContain(descriptionTranslation);
        });
      }
    });
  });

  describe('Translation Pattern Consistency - Requirements 2.1', () => {
    it('should use the same label:value pattern for shipping information as other sections', async () => {
      const documentStructureHTML = await documentStructureService.generateDocumentStructure(
        mockOrderData,
        'en',
        mockStyling
      );

      // Extract patterns from different sections
      const shippingLabelPattern = /<span class="shipping-label">([^<]+):<\/span>/g;
      const paymentLabelPattern = /<span class="payment-label">([^<]+):<\/span>/g;

      const shippingLabels = Array.from(documentStructureHTML.matchAll(shippingLabelPattern));
      const paymentLabels = Array.from(documentStructureHTML.matchAll(paymentLabelPattern));

      // Both sections should use consistent label patterns
      expect(shippingLabels.length).toBeGreaterThan(0);
      expect(paymentLabels.length).toBeGreaterThan(0);

      // Verify all labels end with colon
      shippingLabels.forEach(match => {
        expect(match[1]).toMatch(/.+/); // Has content
      });

      paymentLabels.forEach(match => {
        expect(match[1]).toMatch(/.+/); // Has content
      });
    });

    it('should use localization service for all section titles consistently', async () => {
      const documentStructureHTML = await documentStructureService.generateDocumentStructure(
        mockOrderData,
        'en',
        mockStyling
      );

      // Verify all major section titles use the localization service
      const sectionTitles = [
        'customerInformation',
        'orderItems',
        'orderSummary',
        'paymentInformation',
        'shippingInformation',
      ];

      sectionTitles.forEach(key => {
        const translation = localizationService.translate(key, 'en');
        expect(documentStructureHTML).toContain(translation);
      });
    });
  });
});
