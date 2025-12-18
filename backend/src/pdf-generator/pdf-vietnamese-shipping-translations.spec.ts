import { Test, TestingModule } from '@nestjs/testing';
import { PDFDocumentStructureService } from './pdf-document-structure.service';
import { PDFTemplateEngine } from './pdf-template.engine';
import { PDFLocalizationService } from './services/pdf-localization.service';
import { PDFAccessibilityService } from './services/pdf-accessibility.service';
import { PDFDeviceOptimizationService } from './services/pdf-device-optimization.service';
import { PDFImageConverterService } from './services/pdf-image-converter.service';
import { PDFCompressionService } from './services/pdf-compression.service';
import { OrderPDFData, PDFStyling } from './types/pdf.types';

/**
 * Vietnamese Locale Shipping Translations Tests
 *
 * These tests validate that all shipping-related text in Vietnamese matches
 * the localization service translations and verify proper Vietnamese formatting
 * and terminology.
 *
 * Requirements: 2.2
 */
describe('PDF Vietnamese Locale Shipping Translations', () => {
  let documentStructureService: PDFDocumentStructureService;
  let templateEngine: PDFTemplateEngine;
  let localizationService: PDFLocalizationService;

  const mockOrderData: OrderPDFData = {
    orderNumber: 'VN-TEST-001',
    orderDate: new Date('2023-12-15'),
    customerInfo: {
      name: 'Nguyễn Văn A',
      email: 'nguyen.van.a@example.com',
      phone: '+84901234567',
    },
    items: [
      {
        id: '1',
        name: 'Sản phẩm thử nghiệm',
        description: 'Mô tả sản phẩm',
        sku: 'VN-SKU-001',
        quantity: 2,
        unitPrice: 500000,
        totalPrice: 1000000,
        imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      },
    ],
    pricing: {
      subtotal: 1000000,
      shippingCost: 50000,
      taxAmount: 0,
      discountAmount: 0,
      total: 1050000,
    },
    shippingAddress: {
      fullName: 'Nguyễn Văn A',
      addressLine1: '123 Đường Lê Lợi',
      addressLine2: 'Phường Bến Nghé',
      city: 'Thành phố Hồ Chí Minh',
      state: 'Hồ Chí Minh',
      postalCode: '70000',
      country: 'Việt Nam',
      phone: '+84901234567',
    },
    billingAddress: {
      fullName: 'Nguyễn Văn A',
      addressLine1: '123 Đường Lê Lợi',
      addressLine2: 'Phường Bến Nghé',
      city: 'Thành phố Hồ Chí Minh',
      state: 'Hồ Chí Minh',
      postalCode: '70000',
      country: 'Việt Nam',
      phone: '+84901234567',
    },
    paymentMethod: {
      type: 'bank_transfer',
      displayName: 'Chuyển khoản ngân hàng',
      status: 'pending',
      details: 'Chi tiết thanh toán',
      instructions: 'Hướng dẫn thanh toán',
    },
    shippingMethod: {
      name: 'Giao hàng nhanh',
      description: 'Dịch vụ giao hàng trong ngày',
      estimatedDelivery: '1-2 ngày làm việc',
      trackingNumber: 'VN-TRACK-123456',
      carrier: 'Công ty vận chuyển ABC',
    },
    businessInfo: {
      companyName: 'Công ty TNHH Test',
      logoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      address: {
        addressLine1: '456 Đường Nguyễn Huệ',
        addressLine2: '',
        city: 'Thành phố Hồ Chí Minh',
        state: 'Hồ Chí Minh',
        postalCode: '70000',
        country: 'Việt Nam',
      },
      contactEmail: 'contact@test.com.vn',
      contactPhone: '+84987654321',
      website: 'https://test.com.vn',
      termsAndConditions: 'Điều khoản và điều kiện',
      returnPolicy: 'Chính sách đổi trả',
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

  describe('Vietnamese Shipping Section Translations - Requirements 2.2', () => {
    it('should display shipping information section title in Vietnamese', () => {
      const html = documentStructureService.generateDocumentStructure(mockOrderData, 'vi', mockStyling);

      const expectedTitle = localizationService.translate('shippingInformation', 'vi');
      expect(expectedTitle).toBe('Thông tin vận chuyển');
      expect(html).toContain(expectedTitle);
    });

    it('should display shipping method label in Vietnamese', () => {
      const html = documentStructureService.generateDocumentStructure(mockOrderData, 'vi', mockStyling);

      const expectedLabel = localizationService.translate('shippingMethod', 'vi');
      expect(expectedLabel).toBe('Phương thức');
      expect(html).toContain(expectedLabel);
    });

    it('should display description label in Vietnamese', () => {
      const html = documentStructureService.generateDocumentStructure(mockOrderData, 'vi', mockStyling);

      const expectedLabel = localizationService.translate('description', 'vi');
      expect(expectedLabel).toBe('Mô tả');
      expect(html).toContain(expectedLabel);
    });

    it('should display estimated delivery label in Vietnamese', () => {
      const html = documentStructureService.generateDocumentStructure(mockOrderData, 'vi', mockStyling);

      const expectedLabel = localizationService.translate('estimatedDelivery', 'vi');
      expect(expectedLabel).toBe('Dự kiến giao hàng');
      expect(html).toContain(expectedLabel);
    });

    it('should display tracking number label in Vietnamese', () => {
      const html = documentStructureService.generateDocumentStructure(mockOrderData, 'vi', mockStyling);

      const expectedLabel = localizationService.translate('trackingNumber', 'vi');
      expect(expectedLabel).toBe('Mã vận đơn');
      expect(html).toContain(expectedLabel);
    });

    it('should display carrier label in Vietnamese', () => {
      const html = documentStructureService.generateDocumentStructure(mockOrderData, 'vi', mockStyling);

      const expectedLabel = localizationService.translate('carrier', 'vi');
      expect(expectedLabel).toBe('Đơn vị vận chuyển');
      expect(html).toContain(expectedLabel);
    });

    it('should use proper Vietnamese formatting for all shipping labels', () => {
      const html = documentStructureService.generateDocumentStructure(mockOrderData, 'vi', mockStyling);

      // Verify all Vietnamese shipping labels are present and properly formatted
      const vietnameseLabels = [
        'Thông tin vận chuyển',
        'Phương thức',
        'Mô tả',
        'Dự kiến giao hàng',
        'Mã vận đơn',
        'Đơn vị vận chuyển',
      ];

      vietnameseLabels.forEach(label => {
        expect(html).toContain(label);
      });

      // Verify no English labels are present in Vietnamese locale
      const englishLabels = [
        'Shipping Information',
        'Shipping Method',
        'Description',
        'Estimated Delivery',
        'Tracking Number',
        'Carrier',
      ];

      englishLabels.forEach(label => {
        // Should not contain English labels when using Vietnamese locale
        const labelRegex = new RegExp(`>${label}:?<`, 'g');
        expect(html).not.toMatch(labelRegex);
      });
    });

    it('should display shipping data values correctly with Vietnamese labels', () => {
      const html = documentStructureService.generateDocumentStructure(mockOrderData, 'vi', mockStyling);

      // Verify shipping data is displayed with Vietnamese labels
      expect(html).toContain('Giao hàng nhanh'); // Shipping method name
      expect(html).toContain('Dịch vụ giao hàng trong ngày'); // Description
      expect(html).toContain('1-2 ngày làm việc'); // Estimated delivery
      expect(html).toContain('VN-TRACK-123456'); // Tracking number
      expect(html).toContain('Công ty vận chuyển ABC'); // Carrier
    });
  });

  describe('Vietnamese Terminology Consistency - Requirements 2.2', () => {
    it('should use consistent Vietnamese terminology across all shipping fields', () => {
      const html = documentStructureService.generateDocumentStructure(mockOrderData, 'vi', mockStyling);

      // Verify consistent use of Vietnamese terminology
      const terminologyChecks = [
        { term: 'Phương thức', context: 'shipping method label' },
        { term: 'Mô tả', context: 'description label' },
        { term: 'Dự kiến', context: 'estimated delivery label' },
        { term: 'Mã vận đơn', context: 'tracking number label' },
        { term: 'Đơn vị vận chuyển', context: 'carrier label' },
      ];

      terminologyChecks.forEach(({ term, context }) => {
        expect(html).toContain(term);
      });
    });

    it('should use proper Vietnamese date formatting in shipping context', () => {
      const html = documentStructureService.generateDocumentStructure(mockOrderData, 'vi', mockStyling);

      // Vietnamese date format should be DD/MM/YYYY
      const dateFormatRegex = /\d{2}\/\d{2}\/\d{4}/;
      expect(html).toMatch(dateFormatRegex);
    });

    it('should use Vietnamese currency formatting for shipping costs', () => {
      const html = documentStructureService.generateDocumentStructure(mockOrderData, 'vi', mockStyling);

      // Verify Vietnamese currency formatting (amount ₫)
      expect(html).toContain('50.000 ₫'); // Shipping cost
      expect(html).toContain('1.050.000 ₫'); // Total with shipping

      // Should not contain dollar formatting
      expect(html).not.toContain('$');
    });
  });

  describe('Template Engine Vietnamese Consistency - Requirements 2.2', () => {
    it('should produce identical Vietnamese shipping translations in Template Engine', async () => {
      const documentStructureHTML = documentStructureService.generateDocumentStructure(
        mockOrderData,
        'vi',
        mockStyling
      );
      const templateEngineHTML = await templateEngine.generateHTMLFromOrderData(mockOrderData, 'vi');

      // Extract shipping sections from both outputs
      const extractShippingLabels = (html: string): string[] => {
        const labels = [];
        const shippingSection = html.match(/<section class="shipping-section">[\s\S]*?<\/section>/);
        if (shippingSection) {
          const labelMatches = shippingSection[0].match(/<span class="shipping-label">([^<]+):<\/span>/g);
          if (labelMatches) {
            labels.push(...labelMatches.map(match => match.replace(/<[^>]+>/g, '').replace(':', '')));
          }
        }
        return labels;
      };

      const docStructureLabels = extractShippingLabels(documentStructureHTML);
      const templateEngineLabels = extractShippingLabels(templateEngineHTML);

      // Both should have the same Vietnamese labels
      expect(docStructureLabels.length).toBeGreaterThan(0);
      expect(templateEngineLabels.length).toBeGreaterThan(0);

      // Verify all Vietnamese shipping labels are present in both
      const expectedVietnameseLabels = [
        'Phương thức',
        'Mô tả',
        'Dự kiến giao hàng',
        'Mã vận đơn',
        'Đơn vị vận chuyển',
      ];

      expectedVietnameseLabels.forEach(label => {
        expect(documentStructureHTML).toContain(label);
        expect(templateEngineHTML).toContain(label);
      });
    });

    it('should not contain any hardcoded English text in Vietnamese shipping sections', () => {
      const html = documentStructureService.generateDocumentStructure(mockOrderData, 'vi', mockStyling);

      // Extract shipping section
      const shippingMatch = html.match(/<section class="shipping-section">[\s\S]*?<\/section>/);
      expect(shippingMatch).toBeTruthy();

      const shippingSection = shippingMatch![0];

      // Should not contain any English shipping terms
      const englishTerms = [
        'Shipping Information',
        'Shipping Method',
        'Method',
        'Description',
        'Estimated Delivery',
        'Tracking Number',
        'Carrier',
      ];

      englishTerms.forEach(term => {
        expect(shippingSection).not.toContain(term);
      });
    });
  });

  describe('Vietnamese Localization Service Integration - Requirements 2.2', () => {
    it('should retrieve all shipping translations from localization service', () => {
      // Verify that the localization service has all required Vietnamese translations
      const translations = {
        shippingInformation: localizationService.translate('shippingInformation', 'vi'),
        shippingMethod: localizationService.translate('shippingMethod', 'vi'),
        description: localizationService.translate('description', 'vi'),
        estimatedDelivery: localizationService.translate('estimatedDelivery', 'vi'),
        trackingNumber: localizationService.translate('trackingNumber', 'vi'),
        carrier: localizationService.translate('carrier', 'vi'),
      };

      // Verify all translations are in Vietnamese
      expect(translations.shippingInformation).toBe('Thông tin vận chuyển');
      expect(translations.shippingMethod).toBe('Phương thức');
      expect(translations.description).toBe('Mô tả');
      expect(translations.estimatedDelivery).toBe('Dự kiến giao hàng');
      expect(translations.trackingNumber).toBe('Mã vận đơn');
      expect(translations.carrier).toBe('Đơn vị vận chuyển');

      // Verify none are English
      Object.values(translations).forEach(translation => {
        expect(translation).not.toMatch(/^[A-Za-z\s]+$/); // Not purely English characters
      });
    });

    it('should use localization service for Vietnamese phone number formatting', () => {
      const html = documentStructureService.generateDocumentStructure(mockOrderData, 'vi', mockStyling);

      // Vietnamese phone numbers should be formatted properly
      expect(html).toContain('+84901234567');

      // Should use Vietnamese phone label
      const phoneLabel = localizationService.translate('phoneLabel', 'vi');
      expect(phoneLabel).toBe('ĐT');
      expect(html).toContain('ĐT:');
    });

    it('should format Vietnamese addresses using localization service', () => {
      const formattedAddress = localizationService.formatAddress(mockOrderData.shippingAddress, 'vi');

      // Verify Vietnamese address formatting
      expect(formattedAddress).toContain('Nguyễn Văn A');
      expect(formattedAddress).toContain('123 Đường Lê Lợi');
      expect(formattedAddress).toContain('Thành phố Hồ Chí Minh');
      expect(formattedAddress).toContain('Việt Nam');
      expect(formattedAddress).toContain('ĐT: +84901234567');
    });
  });
});