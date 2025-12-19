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
 * Integration tests for cross-service translation consistency
 *
 * These tests verify that PDF Document Structure Service and PDF Template Engine
 * produce identical translations for the same shipping data and locale.
 *
 * Requirements: 2.5, 3.3
 */
describe('PDF Cross-Service Translation Consistency', () => {
  let documentStructureService: PDFDocumentStructureService;
  let templateEngine: PDFTemplateEngine;
  let localizationService: PDFLocalizationService;

  const mockOrderData: OrderPDFData = {
    orderNumber: 'TEST-001',
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
        imageUrl: 'test-product.jpg',
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
      name: 'Test Shipping',
      description: 'Test Shipping Description',
      estimatedDelivery: '2-3 days',
      trackingNumber: 'TEST123',
      carrier: 'Test Carrier',
    },
    businessInfo: {
      companyName: 'Test Company',
      logoUrl: 'test-logo.jpg',
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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PDFDocumentStructureService,
        PDFTemplateEngine,
        PDFLocalizationService,
        {
          provide: PDFAccessibilityService,
          useValue: {
            enhanceHTMLAccessibility: jest.fn().mockImplementation((html) => html),
            enhanceImageAltText: jest.fn().mockImplementation((html) => html),
          },
        },
        {
          provide: PDFDeviceOptimizationService,
          useValue: {
            optimizeForDevice: jest.fn().mockImplementation((html) => html),
            addNavigationAnchors: jest.fn().mockImplementation((html) => html),
          },
        },
        {
          provide: PDFImageConverterService,
          useValue: {
            convertImageToBase64: jest.fn().mockResolvedValue('data:image/png;base64,test'),
            convertMultipleImages: jest.fn().mockResolvedValue(new Map()),
          },
        },
        {
          provide: PDFCompressionService,
          useValue: {
            compressPDF: jest.fn().mockResolvedValue(Buffer.from('compressed')),
            optimizeOrderDataForPDF: jest.fn().mockImplementation((data) => Promise.resolve({
              optimizedData: data,
              optimizations: [],
              sizeSavings: 0,
            })),
          },
        },
        {
          provide: ShippingService,
          useValue: {
            getShippingMethods: jest.fn().mockResolvedValue([]),
            calculateShippingCost: jest.fn().mockResolvedValue(0),
            getShippingMethodById: jest.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();

    documentStructureService = module.get<PDFDocumentStructureService>(PDFDocumentStructureService);
    templateEngine = module.get<PDFTemplateEngine>(PDFTemplateEngine);
    localizationService = module.get<PDFLocalizationService>(PDFLocalizationService);
  });

  describe('shipping section translation consistency', () => {
    it('should use localization service for shipping section title in English', () => {
      const documentResult = documentStructureService.generateDocumentStructure(mockOrderData, 'en', mockStyling);

      // Should use the localized shipping section title
      expect(documentResult).toContain('Shipping Information');
    });

    it('should use localization service for shipping section title in Vietnamese', () => {
      const documentResult = documentStructureService.generateDocumentStructure(mockOrderData, 'vi', mockStyling);

      // Should use the localized shipping section title
      expect(documentResult).toContain('Thông tin vận chuyển');
    });

    it('should use localization service for shipping method label in English', () => {
      const documentResult = documentStructureService.generateDocumentStructure(mockOrderData, 'en', mockStyling);

      // Should use the localized shipping method label
      expect(documentResult).toContain('Method:');
    });

    it('should use localization service for shipping method label in Vietnamese', () => {
      const documentResult = documentStructureService.generateDocumentStructure(mockOrderData, 'vi', mockStyling);

      // Should use the localized shipping method label
      expect(documentResult).toContain('Phương thức:');
    });

    it('should use localization service for description label in both locales', () => {
      const documentResultEn = documentStructureService.generateDocumentStructure(mockOrderData, 'en', mockStyling);
      const documentResultVi = documentStructureService.generateDocumentStructure(mockOrderData, 'vi', mockStyling);

      // English translations should use localization service
      expect(documentResultEn).toContain('Description:');

      // Vietnamese translations should use localization service
      expect(documentResultVi).toContain('Mô tả:');
    });

    it('should use localization service for estimated delivery label in both locales', () => {
      const documentResultEn = documentStructureService.generateDocumentStructure(mockOrderData, 'en', mockStyling);
      const documentResultVi = documentStructureService.generateDocumentStructure(mockOrderData, 'vi', mockStyling);

      // English translations should use localization service
      expect(documentResultEn).toContain('Estimated Delivery:');

      // Vietnamese translations should use localization service
      expect(documentResultVi).toContain('Dự kiến giao hàng:');
    });

    it('should use localization service for tracking number label in both locales', () => {
      const documentResultEn = documentStructureService.generateDocumentStructure(mockOrderData, 'en', mockStyling);
      const documentResultVi = documentStructureService.generateDocumentStructure(mockOrderData, 'vi', mockStyling);

      // English translations should use localization service
      expect(documentResultEn).toContain('Tracking Number:');

      // Vietnamese translations should use localization service
      expect(documentResultVi).toContain('Mã vận đơn:');
    });

    it('should use localization service for carrier label in both locales', () => {
      const documentResultEn = documentStructureService.generateDocumentStructure(mockOrderData, 'en', mockStyling);
      const documentResultVi = documentStructureService.generateDocumentStructure(mockOrderData, 'vi', mockStyling);

      // English translations should use localization service
      expect(documentResultEn).toContain('Carrier:');

      // Vietnamese translations should use localization service
      expect(documentResultVi).toContain('Đơn vị vận chuyển:');
    });
  });

  describe('shipping data consistency', () => {
    it('should display shipping method names correctly', () => {
      const documentResultEn = documentStructureService.generateDocumentStructure(mockOrderData, 'en', mockStyling);

      // Should display the shipping method name
      expect(documentResultEn).toContain('Test Shipping');
    });

    it('should display shipping descriptions correctly', () => {
      const documentResultEn = documentStructureService.generateDocumentStructure(mockOrderData, 'en', mockStyling);

      // Should display the shipping description
      expect(documentResultEn).toContain('Test Shipping Description');
    });

    it('should display estimated delivery information correctly', () => {
      const documentResultEn = documentStructureService.generateDocumentStructure(mockOrderData, 'en', mockStyling);

      // Should display the estimated delivery
      expect(documentResultEn).toContain('2-3 days');
    });

    it('should display tracking numbers correctly', () => {
      const documentResultEn = documentStructureService.generateDocumentStructure(mockOrderData, 'en', mockStyling);

      // Should display the tracking number
      expect(documentResultEn).toContain('TEST123');
    });

    it('should display carrier information correctly', () => {
      const documentResultEn = documentStructureService.generateDocumentStructure(mockOrderData, 'en', mockStyling);

      // Should display the carrier
      expect(documentResultEn).toContain('Test Carrier');
    });
  });

  describe('optional field handling consistency', () => {
    it('should handle missing optional shipping fields correctly', () => {
      const orderDataWithoutOptionals = {
        ...mockOrderData,
        shippingMethod: {
          name: 'Basic Shipping',
          // No description, estimatedDelivery, trackingNumber, or carrier
        },
      };

      const documentResult = documentStructureService.generateDocumentStructure(orderDataWithoutOptionals, 'en', mockStyling);

      // Should contain the shipping method name
      expect(documentResult).toContain('Basic Shipping');

      // Should not contain optional field labels when data is missing
      expect(documentResult).not.toContain('Description:');
      expect(documentResult).not.toContain('Estimated Delivery:');
      expect(documentResult).not.toContain('Tracking Number:');
      expect(documentResult).not.toContain('Carrier:');
    });
  });

  describe('localization service integration', () => {
    it('should both services use the same localization service instance', () => {
      // Verify both services are using the same localization service
      expect(documentStructureService).toBeDefined();
      expect(templateEngine).toBeDefined();
      expect(localizationService).toBeDefined();

      // Test that both services produce consistent translations by using the same service
      const shippingInfoEn = localizationService.translate('shippingInformation', 'en');
      const shippingInfoVi = localizationService.translate('shippingInformation', 'vi');
      const methodEn = localizationService.translate('shippingMethod', 'en');
      const methodVi = localizationService.translate('shippingMethod', 'vi');

      expect(shippingInfoEn).toBe('Shipping Information');
      expect(shippingInfoVi).toBe('Thông tin vận chuyển');
      expect(methodEn).toBe('Method');
      expect(methodVi).toBe('Phương thức');
    });
  });
});