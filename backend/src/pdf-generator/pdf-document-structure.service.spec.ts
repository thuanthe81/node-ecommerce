import { Test, TestingModule } from '@nestjs/testing';
import { PDFDocumentStructureService } from './pdf-document-structure.service';
import { OrderPDFData, PDFStyling } from './types/pdf.types';

describe('PDFDocumentStructureService', () => {
  let service: PDFDocumentStructureService;

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
    const module: TestingModule = await Test.createTestingModule({
      providers: [PDFDocumentStructureService],
    }).compile();

    service = module.get<PDFDocumentStructureService>(PDFDocumentStructureService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateDocumentStructure', () => {
    it('should generate complete HTML document structure', () => {
      const result = service.generateDocumentStructure(mockOrderData, 'en', mockStyling);

      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<html lang="en">');
      expect(result).toContain('</html>');
      expect(result).toContain('Order TEST-001');
    });

    it('should generate Vietnamese document structure', () => {
      const result = service.generateDocumentStructure(mockOrderData, 'vi', mockStyling);

      expect(result).toContain('<html lang="vi">');
      expect(result).toContain('Đơn hàng TEST-001');
    });
  });

  describe('currency formatting', () => {
    it('should format currency amounts with Vietnamese dong symbol for English locale', () => {
      const result = service.generateDocumentStructure(mockOrderData, 'en', mockStyling);

      // Check that all monetary amounts use Vietnamese dong symbol
      expect(result).toContain('100.000 ₫'); // Unit price
      expect(result).toContain('25.000 ₫');  // Shipping cost
      expect(result).toContain('120.000 ₫'); // Total

      // Should not contain dollar signs
      expect(result).not.toContain('$');
    });

    it('should format currency amounts with Vietnamese dong symbol for Vietnamese locale', () => {
      const result = service.generateDocumentStructure(mockOrderData, 'vi', mockStyling);

      // Check that all monetary amounts use Vietnamese dong symbol
      expect(result).toContain('100.000 ₫'); // Unit price
      expect(result).toContain('25.000 ₫');  // Shipping cost
      expect(result).toContain('120.000 ₫'); // Total

      // Should not contain dollar signs
      expect(result).not.toContain('$');
    });

    it('should format zero amounts as "0 ₫" for both locales', () => {
      const resultEn = service.generateDocumentStructure(mockOrderData, 'en', mockStyling);
      const resultVi = service.generateDocumentStructure(mockOrderData, 'vi', mockStyling);

      // Check zero-price item formatting
      expect(resultEn).toContain('0 ₫');
      expect(resultVi).toContain('0 ₫');

      // Should not contain "$0.00" formatting
      expect(resultEn).not.toContain('$0.00');
      expect(resultVi).not.toContain('$0.00');
    });

    it('should use Vietnamese number formatting with proper separators', () => {
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

      const result = service.generateDocumentStructure(largeAmountData, 'en', mockStyling);

      // Check Vietnamese number formatting (periods as thousands separators, comma as decimal)
      expect(result).toContain('1.234.567 ₫');
    });

    it('should position currency symbol after the amount', () => {
      const result = service.generateDocumentStructure(mockOrderData, 'en', mockStyling);

      // Check that currency symbol appears after amounts with space
      const currencyMatches = result.match(/\d+(?:\.\d{3})*(?:,\d+)?\s₫/g);
      expect(currencyMatches).toBeTruthy();
      expect(currencyMatches!.length).toBeGreaterThan(0);
    });
  });

  describe('order items section', () => {
    it('should display all order items with correct currency formatting', () => {
      const result = service.generateDocumentStructure(mockOrderData, 'en', mockStyling);

      // Check that both regular and zero-price items are displayed
      expect(result).toContain('Test Product');
      expect(result).toContain('Free Product');
      expect(result).toContain('100.000 ₫'); // Regular item price
      expect(result).toContain('0 ₫');       // Zero-price item
    });

    it('should handle zero-price items with special styling', () => {
      const result = service.generateDocumentStructure(mockOrderData, 'en', mockStyling);

      // Check for zero-price specific classes and content
      expect(result).toContain('zero-price');
      expect(result).toContain('Free');
    });
  });

  describe('order summary section', () => {
    it('should format all summary amounts with Vietnamese dong symbol', () => {
      const result = service.generateDocumentStructure(mockOrderData, 'en', mockStyling);

      // Check subtotal, shipping, discount, and total formatting
      expect(result).toContain('100.000 ₫'); // Subtotal
      expect(result).toContain('25.000 ₫');  // Shipping
      expect(result).toContain('5.000 ₫');   // Discount
      expect(result).toContain('120.000 ₫'); // Total
    });

    it('should display discount amounts with negative formatting', () => {
      const result = service.generateDocumentStructure(mockOrderData, 'en', mockStyling);

      // Check that discount is displayed with minus sign
      expect(result).toContain('-5.000 ₫');
    });
  });

  describe('payment section', () => {
    it('should format payment amounts consistently', () => {
      const result = service.generateDocumentStructure(mockOrderData, 'en', mockStyling);

      // Payment section should also use consistent currency formatting
      expect(result).toContain('Bank Transfer');
      expect(result).toContain('Pending');
    });
  });

  describe('cross-locale consistency', () => {
    it('should use identical currency formatting for both English and Vietnamese locales', () => {
      const resultEn = service.generateDocumentStructure(mockOrderData, 'en', mockStyling);
      const resultVi = service.generateDocumentStructure(mockOrderData, 'vi', mockStyling);

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
});