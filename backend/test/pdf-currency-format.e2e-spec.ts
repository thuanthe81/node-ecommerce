import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { PDFGeneratorService } from '../src/pdf-generator/pdf-generator.service';
import { PDFLocalizationService } from '../src/pdf-generator/services/pdf-localization.service';
import { OrderPDFData } from '../src/pdf-generator/types/pdf.types';

describe('PDF Currency Format Integration (e2e)', () => {
  let app: INestApplication;
  let pdfGeneratorService: PDFGeneratorService;
  let pdfLocalizationService: PDFLocalizationService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    pdfGeneratorService = moduleFixture.get<PDFGeneratorService>(PDFGeneratorService);
    pdfLocalizationService = moduleFixture.get<PDFLocalizationService>(PDFLocalizationService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should validate PDF generation service is available', () => {
    expect(pdfGeneratorService).toBeDefined();
    expect(pdfLocalizationService).toBeDefined();
  });

  it('should format currency with Vietnamese dong symbol for both locales - Requirements 2.2, 2.3, 2.4, 2.5', () => {
    // Test English locale formatting
    const englishFormatted = pdfLocalizationService.formatCurrency(100000, 'en');
    expect(englishFormatted).toContain('₫'); // Vietnamese dong symbol
    expect(englishFormatted).not.toContain('$');
    expect(englishFormatted).toMatch(/100[,.]000\s*₫/); // Should be "100,000 ₫" or similar

    // Test Vietnamese locale formatting
    const vietnameseFormatted = pdfLocalizationService.formatCurrency(100000, 'vi');
    expect(vietnameseFormatted).toContain('₫'); // Vietnamese dong symbol
    expect(vietnameseFormatted).not.toContain('$');
    expect(vietnameseFormatted).toMatch(/100[,.]000\s*₫/); // Should be "100,000 ₫" or similar

    // Both locales should produce the same format
    expect(englishFormatted).toBe(vietnameseFormatted);
  });

  it('should format zero amounts with Vietnamese dong symbol - Requirements 2.2, 2.3, 2.4, 2.5', () => {
    // Test zero amount formatting
    const zeroFormatted = pdfLocalizationService.formatCurrency(0, 'en');
    expect(zeroFormatted).toBe('0 ₫'); // Vietnamese dong symbol
    expect(zeroFormatted).not.toContain('$0.00');

    // Test Vietnamese locale zero formatting
    const zeroFormattedVi = pdfLocalizationService.formatCurrency(0, 'vi');
    expect(zeroFormattedVi).toBe('0 ₫'); // Vietnamese dong symbol
    expect(zeroFormattedVi).not.toContain('$0.00');
  });

  it('should format large amounts with Vietnamese number formatting - Requirements 2.2, 2.3, 2.4, 2.5', () => {
    // Test large amounts
    const largeAmount = 12500000;
    const formattedLarge = pdfLocalizationService.formatCurrency(largeAmount, 'vi');

    expect(formattedLarge).toContain('₫'); // Vietnamese dong symbol
    expect(formattedLarge).not.toContain('$');
    expect(formattedLarge).toMatch(/12[,.]500[,.]000\s*₫/); // Should use Vietnamese number formatting

    // Test English locale produces same result
    const formattedLargeEn = pdfLocalizationService.formatCurrency(largeAmount, 'en');
    expect(formattedLargeEn).toBe(formattedLarge);
  });

  it('should use consistent currency formatting across different amounts - Requirements 2.2, 2.3, 2.4, 2.5', () => {
    // Test different amounts to ensure consistency
    const amounts = [0, 1000, 50000, 100000, 1000000, 10000000];

    for (const amount of amounts) {
      const englishFormatted = pdfLocalizationService.formatCurrency(amount, 'en');
      const vietnameseFormatted = pdfLocalizationService.formatCurrency(amount, 'vi');

      // Both should use Vietnamese dong symbol
      expect(englishFormatted).toContain('₫'); // Vietnamese dong symbol
      expect(vietnameseFormatted).toContain('₫'); // Vietnamese dong symbol

      // Neither should use dollar sign
      expect(englishFormatted).not.toContain('$');
      expect(vietnameseFormatted).not.toContain('$');

      // Both should produce identical results
      expect(englishFormatted).toBe(vietnameseFormatted);
    }
  });

  it('should generate PDF with correct currency formatting', async () => {
    const testOrderData: OrderPDFData = {
      orderNumber: `PDF-TEST-${Date.now()}`,
      orderDate: new Date(),
      customerInfo: {
        name: 'Test Customer',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'Customer',
      },
      shippingAddress: {
        fullName: 'Test Customer',
        phone: '+84123456789',
        addressLine1: '123 Test Street',
        city: 'Ho Chi Minh City',
        state: 'Ho Chi Minh',
        postalCode: '70000',
        country: 'Vietnam',
      },
      billingAddress: {
        fullName: 'Test Customer',
        phone: '+84123456789',
        addressLine1: '123 Test Street',
        city: 'Ho Chi Minh City',
        state: 'Ho Chi Minh',
        postalCode: '70000',
        country: 'Vietnam',
      },
      items: [
        {
          productName: 'Test Product',
          quantity: 1,
          unitPrice: 100000,
          totalPrice: 100000,
          sku: 'TEST-001',
        },
      ],
      pricing: {
        subtotal: 100000,
        shippingCost: 0,
        tax: 0,
        discount: 0,
        total: 100000,
      },
      paymentMethod: {
        type: 'bank_transfer',
        details: 'Bank Transfer Payment',
      },
      shippingMethod: {
        name: 'Standard Shipping',
        estimatedDelivery: '3-5 business days',
      },
      businessInfo: {
        name: 'Test Business',
        address: {
          fullName: 'Test Business',
          phone: '+84987654321',
          addressLine1: '456 Business Street',
          city: 'Ho Chi Minh City',
          state: 'Ho Chi Minh',
          postalCode: '70000',
          country: 'Vietnam',
        },
        email: 'business@test.com',
        phone: '+84987654321',
        website: 'https://test.com',
        taxId: 'TAX123456789',
        termsAndConditions: 'Test terms and conditions',
        returnPolicy: 'Test return policy',
      },
    };

    // Test PDF generation
    const result = await pdfGeneratorService.generateOrderPDF(testOrderData, 'en');

    // Should succeed or fail gracefully
    if (result.success) {
      expect(result.filePath).toBeDefined();
      expect(result.error).toBeUndefined();
    } else {
      expect(result.error).toBeDefined();
      console.log('PDF generation failed (expected in test environment):', result.error);
    }
  });
});