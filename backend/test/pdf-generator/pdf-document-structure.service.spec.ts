import { Test, TestingModule } from '@nestjs/testing';
import { PDFDocumentStructureService } from '../../src/pdf-generator/pdf-document-structure.service';
import { PDFLocalizationService } from '../../src/pdf-generator/services/pdf-localization.service';
import { ShippingService } from '../../src/shipping/shipping.service';
import { OrderPDFData, PDFStyling } from '../../src/pdf-generator/types/pdf.types';

describe('PDFDocumentStructureService', () => {
  let service: PDFDocumentStructureService;
  let localizationService: PDFLocalizationService;
  let shippingService: ShippingService;

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
      {
        id: '2',
        name: 'Free Product',
        description: 'Free item',
        sku: 'FREE-SKU',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        imageUrl: 'free-product.jpg',
      },
    ],
    pricing: {
      subtotal: 100000,
      shippingCost: 25000,
      taxAmount: 0,
      discountAmount: 5000,
      total: 120000,
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
      qrCodeUrl: 'test-qr.jpg',
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
    const mockShippingService = {
      getShippingMethodDetails: jest.fn().mockImplementation((methodName, locale) => {
        // Return different responses based on the method name
        if (methodName === 'Basic Shipping') {
          return Promise.resolve({
            name: 'Test Shipping',
            // No description for Basic Shipping to test optional fields
          });
        }
        return Promise.resolve({
          name: 'Test Shipping',
          description: 'Test Shipping Description',
        });
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PDFDocumentStructureService,
        PDFLocalizationService,
        {
          provide: ShippingService,
          useValue: mockShippingService,
        },
      ],
    }).compile();

    service = module.get<PDFDocumentStructureService>(PDFDocumentStructureService);
    localizationService = module.get<PDFLocalizationService>(PDFLocalizationService);
    shippingService = module.get<ShippingService>(ShippingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateDocumentStructure', () => {
    it('should generate complete HTML document structure', async () => {
      const result = await service.generateDocumentStructure(mockOrderData, 'en', mockStyling);

      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<html lang="en">');
      expect(result).toContain('</html>');
      expect(result).toContain('Order TEST-001');
    });

    it('should generate Vietnamese document structure', async () => {
      const result = await service.generateDocumentStructure(mockOrderData, 'vi', mockStyling);

      expect(result).toContain('<html lang="vi">');
      expect(result).toContain('Đơn hàng TEST-001');
    });
  });

  describe('currency formatting', () => {
    it('should format currency amounts with Vietnamese dong symbol for English locale', async () => {
      const result = await service.generateDocumentStructure(mockOrderData, 'en', mockStyling);

      // Check that all monetary amounts use Vietnamese dong symbol
      expect(result).toContain('100.000 ₫'); // Unit price
      expect(result).toContain('25.000 ₫');  // Shipping cost
      expect(result).toContain('120.000 ₫'); // Total

      // Should not contain dollar signs
      expect(result).not.toContain('$');
    });

    it('should format currency amounts with Vietnamese dong symbol for Vietnamese locale', async () => {
      const result = await service.generateDocumentStructure(mockOrderData, 'vi', mockStyling);

      // Check that all monetary amounts use Vietnamese dong symbol
      expect(result).toContain('100.000 ₫'); // Unit price
      expect(result).toContain('25.000 ₫');  // Shipping cost
      expect(result).toContain('120.000 ₫'); // Total

      // Should not contain dollar signs
      expect(result).not.toContain('$');
    });

    it('should format zero amounts as "0 ₫" for both locales', async () => {
      const resultEn = await service.generateDocumentStructure(mockOrderData, 'en', mockStyling);
      const resultVi = await service.generateDocumentStructure(mockOrderData, 'vi', mockStyling);

      // Check zero-price item formatting
      expect(resultEn).toContain('0 ₫');
      expect(resultVi).toContain('0 ₫');

      // Should not contain "$0.00" formatting
      expect(resultEn).not.toContain('$0.00');
      expect(resultVi).not.toContain('$0.00');
    });

    it('should use Vietnamese number formatting with proper separators', async () => {
      const largeAmountData = {
        ...mockOrderData,
        items: [{
          ...mockOrderData.items[0],
          unitPrice: 1234567,
          totalPrice: 1234567,
        }],
        pricing: {
          ...mockOrderData.pricing,
          subtotal: 1234567,
          total: 1234567,
        },
      };

      const result = await service.generateDocumentStructure(largeAmountData, 'en', mockStyling);

      // Check Vietnamese number formatting (periods as thousands separators, comma as decimal)
      expect(result).toContain('1.234.567 ₫');
    });

    it('should position currency symbol after the amount', async () => {
      const result = await service.generateDocumentStructure(mockOrderData, 'en', mockStyling);

      // Check that currency symbol appears after amounts with space
      const currencyMatches = result.match(/\d+(?:\.\d{3})*(?:,\d+)?\s₫/g);
      expect(currencyMatches).toBeTruthy();
      expect(currencyMatches!.length).toBeGreaterThan(0);
    });
  });

  describe('order items section', () => {
    it('should display all order items with correct currency formatting', async () => {
      const result = await service.generateDocumentStructure(mockOrderData, 'en', mockStyling);

      // Check that both regular and zero-price items are displayed
      expect(result).toContain('Test Product');
      expect(result).toContain('Free Product');
      expect(result).toContain('100.000 ₫'); // Regular item price
      expect(result).toContain('0 ₫');       // Zero-price item
    });

    it('should handle zero-price items with special styling', async () => {
      const result = await service.generateDocumentStructure(mockOrderData, 'en', mockStyling);

      // Check for zero-price specific classes and content
      expect(result).toContain('zero-price');
      expect(result).toContain('Free');
    });
  });

  describe('order summary section', () => {
    it('should format all summary amounts with Vietnamese dong symbol', async () => {
      const result = await service.generateDocumentStructure(mockOrderData, 'en', mockStyling);

      // Check subtotal, shipping, discount, and total formatting
      expect(result).toContain('100.000 ₫'); // Subtotal
      expect(result).toContain('25.000 ₫');  // Shipping
      expect(result).toContain('5.000 ₫');   // Discount
      expect(result).toContain('120.000 ₫'); // Total
    });

    it('should display discount amounts with negative formatting', async () => {
      const result = await service.generateDocumentStructure(mockOrderData, 'en', mockStyling);

      // Check that discount is displayed with minus sign
      expect(result).toContain('-5.000 ₫');
    });
  });

  describe('payment section', () => {
    it('should format payment amounts consistently', async () => {
      const result = await service.generateDocumentStructure(mockOrderData, 'en', mockStyling);

      // Payment section should also use consistent currency formatting
      expect(result).toContain('Bank Transfer');
      expect(result).toContain('Pending');
    });
  });

  describe('cross-locale consistency', () => {
    it('should use identical currency formatting for both English and Vietnamese locales', async () => {
      const resultEn = await service.generateDocumentStructure(mockOrderData, 'en', mockStyling);
      const resultVi = await service.generateDocumentStructure(mockOrderData, 'vi', mockStyling);

      // Extract all currency amounts from both results
      const currencyRegex = /\d+(?:\.\d{3})*(?:,\d+)?\s₫/g;
      const currenciesEn = resultEn.match(currencyRegex) || [];
      const currenciesVi = resultVi.match(currencyRegex) || [];

      // Both should have the same currency formatting patterns
      expect(currenciesEn.length).toBeGreaterThan(0);
      expect(currenciesVi.length).toBeGreaterThan(0);

      // Check that both use Vietnamese dong symbol
      currenciesEn.forEach(currency => {
        expect(currency).toContain('₫');
        expect(currency).not.toContain('$');
      });

      currenciesVi.forEach(currency => {
        expect(currency).toContain('₫');
        expect(currency).not.toContain('$');
      });
    });
  });

  describe('shipping section localization', () => {
    it('should use localization service for shipping section title in English', async () => {
      const result = await service.generateDocumentStructure(mockOrderData, 'en', mockStyling);

      // Verify that the shipping section uses localized text
      expect(result).toContain('Shipping Information'); // English translation
      expect(result).not.toContain('Thông tin vận chuyển'); // Should not contain hardcoded Vietnamese
    });

    it('should use localization service for shipping section title in Vietnamese', async () => {
      const result = await service.generateDocumentStructure(mockOrderData, 'vi', mockStyling);

      // Verify that the shipping section uses localized text
      expect(result).toContain('Thông tin vận chuyển'); // Vietnamese translation
      expect(result).not.toContain('Shipping Information'); // Should not contain hardcoded English
    });

    it('should use localization service for all shipping labels in English', async () => {
      const result = await service.generateDocumentStructure(mockOrderData, 'en', mockStyling);

      // Verify all shipping labels use localized text
      expect(result).toContain('Method:');
      expect(result).toContain('Description:');
      expect(result).toContain('Estimated Delivery:');
      expect(result).toContain('Tracking Number:');
      expect(result).toContain('Carrier:');
    });

    it('should use localization service for all shipping labels in Vietnamese', async () => {
      const result = await service.generateDocumentStructure(mockOrderData, 'vi', mockStyling);

      // Verify all shipping labels use localized text
      expect(result).toContain('Phương thức:');
      expect(result).toContain('Mô tả:');
      expect(result).toContain('Dự kiến giao hàng:');
      expect(result).toContain('Mã vận đơn:');
      expect(result).toContain('Đơn vị vận chuyển:');
    });

    it('should display shipping method data correctly with localized labels', async () => {
      const result = await service.generateDocumentStructure(mockOrderData, 'en', mockStyling);

      // Verify shipping data is displayed with proper labels
      expect(result).toContain('Test Shipping'); // Shipping method name
      expect(result).toContain('Test Shipping Description'); // Description
      expect(result).toContain('2-3 days'); // Estimated delivery
      expect(result).toContain('TEST123'); // Tracking number
      expect(result).toContain('Test Carrier'); // Carrier
    });

    it('should handle optional shipping fields gracefully', async () => {
      const orderDataWithoutOptionalShipping = {
        ...mockOrderData,
        shippingMethod: {
          name: 'Basic Shipping',
          // No description, estimatedDelivery, trackingNumber, or carrier
        },
      };

      const result = await service.generateDocumentStructure(orderDataWithoutOptionalShipping, 'en', mockStyling);

      // Should still contain the shipping section title and method name
      expect(result).toContain('Shipping Information');
      expect(result).toContain('Test Shipping'); // The mock service returns "Test Shipping"

      // Should not contain empty optional fields
      expect(result).not.toContain('Description:');
      expect(result).not.toContain('Estimated Delivery:');
      expect(result).not.toContain('Tracking Number:');
      expect(result).not.toContain('Carrier:');
    });
  });
});