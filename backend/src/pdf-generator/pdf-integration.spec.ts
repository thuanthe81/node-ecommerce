import { Test, TestingModule } from '@nestjs/testing';
import { PDFGeneratorService } from './pdf-generator.service';
import { PDFTemplateEngine } from './pdf-template.engine';
import { PDFDocumentStructureService } from './pdf-document-structure.service';
import { PaymentSettingsService } from '../payment-settings/payment-settings.service';
import { PrismaService } from '../prisma/prisma.service';
import { PDFLocalizationService } from './services/pdf-localization.service';
import { PDFAccessibilityService } from './services/pdf-accessibility.service';
import { PDFDeviceOptimizationService } from './services/pdf-device-optimization.service';
import { PDFCompressionService } from './services/pdf-compression.service';
import { PDFErrorHandlerService } from './services/pdf-error-handler.service';
import { PDFMonitoringService } from './services/pdf-monitoring.service';
import { PDFAuditService } from './services/pdf-audit.service';
import { OrderPDFData } from './types/pdf.types';
import * as fs from 'fs';
import * as path from 'path';

describe('PDF Generation Integration', () => {
  let service: PDFGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PDFGeneratorService,
        PDFTemplateEngine,
        PDFDocumentStructureService,
        {
          provide: PDFLocalizationService,
          useValue: {
            getLocalizedText: jest.fn().mockReturnValue('Localized Text'),
            formatCurrency: jest.fn().mockReturnValue('$10.00'),
            formatDate: jest.fn().mockReturnValue('Dec 15, 2023'),
          },
        },
        {
          provide: PDFAccessibilityService,
          useValue: {
            addAccessibilityFeatures: jest.fn().mockReturnValue('<html>Accessible HTML</html>'),
            enhanceHTMLAccessibility: jest.fn().mockReturnValue('<html>Enhanced Accessible HTML</html>'),
            enhanceImageAltText: jest.fn().mockReturnValue('<html>Enhanced Image Alt Text</html>'),
            generateAccessibilityMetadata: jest.fn().mockReturnValue({ title: 'Test PDF', author: 'Test' }),
          },
        },
        {
          provide: PDFDeviceOptimizationService,
          useValue: {
            optimizeForDevice: jest.fn().mockReturnValue('<html>Optimized HTML</html>'),
            addNavigationAnchors: jest.fn().mockReturnValue('<html>Navigation HTML</html>'),
          },
        },
        {
          provide: PDFCompressionService,
          useValue: {
            compressPDF: jest.fn().mockResolvedValue(Buffer.from('compressed pdf')),
          },
        },
        {
          provide: PDFErrorHandlerService,
          useValue: {
            handleError: jest.fn(),
            logError: jest.fn(),
            handlePDFGenerationError: jest.fn().mockResolvedValue({ handled: true }),
          },
        },
        {
          provide: PDFMonitoringService,
          useValue: {
            recordGenerationTime: jest.fn(),
            recordFileSize: jest.fn(),
            recordPerformanceMetric: jest.fn(),
          },
        },
        {
          provide: PDFAuditService,
          useValue: {
            logPDFGeneration: jest.fn(),
          },
        },
        {
          provide: PaymentSettingsService,
          useValue: {
            getBankTransferSettings: jest.fn().mockResolvedValue({
              accountName: 'Test Account',
              accountNumber: '1234567890',
              bankName: 'Test Bank',
              qrCodeUrl: '/uploads/payment-qr/test-qr.png',
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            // Mock PrismaService methods if needed
          },
        },
      ],
    }).compile();

    service = module.get<PDFGeneratorService>(PDFGeneratorService);
  });

  afterEach(() => {
    // Clean up any generated test files
    const testFilesPattern = /^(order|invoice)-.*-\d+\.pdf$/;
    const uploadsDir = 'uploads/pdfs';

    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      files.forEach(file => {
        if (testFilesPattern.test(file)) {
          fs.unlinkSync(path.join(uploadsDir, file));
        }
      });
    }
  });

  const createTestOrderData = (): OrderPDFData => ({
    orderNumber: 'ORD-TEST-123',
    orderDate: '2023-12-15',
    customerInfo: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-123-4567',
    },
    billingAddress: {
      fullName: 'John Doe',
      addressLine1: '123 Main Street',
      addressLine2: 'Apt 4B',
      city: 'Anytown',
      state: 'California',
      postalCode: '90210',
      country: 'United States',
      phone: '+1-555-123-4567',
    },
    shippingAddress: {
      fullName: 'John Doe',
      addressLine1: '456 Oak Avenue',
      city: 'Somewhere',
      state: 'California',
      postalCode: '90211',
      country: 'United States',
      phone: '+1-555-987-6543',
    },
    items: [
      {
        id: '1',
        name: 'Handmade Ceramic Vase',
        description: 'Beautiful blue ceramic vase with intricate patterns',
        sku: 'VASE-001',
        quantity: 2,
        unitPrice: 45.00,
        totalPrice: 90.00,
        category: 'Home Decor',
      },
      {
        id: '2',
        name: 'Artisan Wooden Bowl',
        description: 'Hand-carved wooden bowl made from sustainable oak',
        sku: 'BOWL-002',
        quantity: 1,
        unitPrice: 35.00,
        totalPrice: 35.00,
        category: 'Kitchenware',
      },
    ],
    pricing: {
      subtotal: 125.00,
      shippingCost: 15.00,
      taxAmount: 12.50,
      discountAmount: 5.00,
      total: 147.50,
    },
    paymentMethod: {
      type: 'bank_transfer',
      displayName: 'Bank Transfer',
      status: 'pending',
      details: 'Transfer to AlaCraft Business Account',
      instructions: 'Please include your order number in the transfer reference.',
    },
    shippingMethod: {
      name: 'Standard Shipping',
      description: '5-7 business days delivery',
      estimatedDelivery: '2023-12-22',
      carrier: 'FedEx',
    },
    businessInfo: {
      companyName: 'AlaCraft Handmade Goods',
      contactEmail: 'orders@alacraft.com',
      contactPhone: '+1-555-ALACRAFT',
      website: 'https://www.alacraft.com',
      address: {
        fullName: 'AlaCraft Handmade Goods',
        addressLine1: '789 Artisan Way',
        addressLine2: 'Suite 100',
        city: 'Craftsville',
        state: 'California',
        postalCode: '90301',
        country: 'United States',
      },
      termsAndConditions: 'All sales are final. Returns accepted within 30 days for defective items only.',
      returnPolicy: 'Items must be returned in original condition with receipt.',
    },
    locale: 'en',
  });

  it('should generate a complete order PDF successfully', async () => {
    const orderData = createTestOrderData();

    const result = await service.generateOrderPDF(orderData, 'en');

    expect(result.success).toBe(true);
    expect(result.filePath).toBeDefined();
    expect(result.fileName).toBeDefined();
    expect(result.fileSize).toBeGreaterThan(0);
    expect(result.metadata.orderNumber).toBe('ORD-TEST-123');
    expect(result.metadata.locale).toBe('en');

    // Verify file was actually created
    if (result.filePath) {
      expect(fs.existsSync(result.filePath)).toBe(true);

      // Verify file has content
      const stats = fs.statSync(result.filePath);
      expect(stats.size).toBeGreaterThan(1000); // PDF should be at least 1KB
    }
  }, 30000); // 30 second timeout for PDF generation

  it('should generate a Vietnamese locale PDF successfully', async () => {
    const orderData = createTestOrderData();
    orderData.locale = 'vi';

    const result = await service.generateOrderPDF(orderData, 'vi');

    expect(result.success).toBe(true);
    expect(result.metadata.locale).toBe('vi');

    // Verify file was created
    if (result.filePath) {
      expect(fs.existsSync(result.filePath)).toBe(true);
    }
  }, 30000);

  it('should generate an invoice PDF successfully', async () => {
    const orderData = createTestOrderData();

    const result = await service.generateInvoicePDF(orderData, 'en');

    expect(result.success).toBe(true);
    expect(result.fileName).toContain('invoice-');
    expect(result.metadata.orderNumber).toBe('ORD-TEST-123');

    // Verify file was created
    if (result.filePath) {
      expect(fs.existsSync(result.filePath)).toBe(true);
    }
  }, 30000);

  it('should handle missing required data gracefully', async () => {
    const invalidOrderData = {
      orderNumber: '',
      orderDate: '',
      customerInfo: {},
      items: [],
    } as OrderPDFData;

    const result = await service.generateOrderPDF(invalidOrderData, 'en');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid order data');
    expect(result.filePath).toBeUndefined();
  });

  it('should handle zero-price products correctly', async () => {
    const orderData = createTestOrderData();
    orderData.items.push({
      id: '3',
      name: 'Free Sample Item',
      description: 'Complimentary sample product',
      sku: 'SAMPLE-001',
      quantity: 1,
      unitPrice: 0.00,
      totalPrice: 0.00,
      category: 'Samples',
    });

    const result = await service.generateOrderPDF(orderData, 'en');

    expect(result.success).toBe(true);
    expect(result.filePath).toBeDefined();
  }, 30000);
});