import { Test, TestingModule } from '@nestjs/testing';
import { EmailAttachmentService } from './email-attachment.service';
import { EmailService } from '../../notifications/services/email.service';
import { PDFGeneratorService } from '../pdf-generator.service';
import { DocumentStorageService } from './document-storage.service';
import { PDFErrorHandlerService } from './pdf-error-handler.service';
import { PDFMonitoringService } from './pdf-monitoring.service';
import { PDFAuditService } from './pdf-audit.service';
import { OrderPDFData } from '../types/pdf.types';

describe('EmailAttachmentService', () => {
  let service: EmailAttachmentService;
  let emailService: EmailService;
  let pdfGeneratorService: PDFGeneratorService;
  let documentStorageService: DocumentStorageService;

  const mockEmailService = {
    sendEmailWithAttachment: jest.fn(),
    sendEmail: jest.fn(),
  };

  const mockPDFGeneratorService = {
    generateOrderPDF: jest.fn(),
  };

  const mockDocumentStorageService = {
    schedulePDFCleanup: jest.fn(),
  };

  const mockPDFErrorHandlerService = {
    handleError: jest.fn(),
    logError: jest.fn(),
  };

  const mockPDFMonitoringService = {
    recordEmailDelivery: jest.fn(),
    recordDeliveryFailure: jest.fn(),
    recordPerformanceMetric: jest.fn(),
  };

  const mockPDFAuditService = {
    logEmailSent: jest.fn(),
    logEmailFailed: jest.fn(),
    logEmailSending: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailAttachmentService,
        { provide: EmailService, useValue: mockEmailService },
        { provide: PDFGeneratorService, useValue: mockPDFGeneratorService },
        { provide: DocumentStorageService, useValue: mockDocumentStorageService },
        { provide: PDFErrorHandlerService, useValue: mockPDFErrorHandlerService },
        { provide: PDFMonitoringService, useValue: mockPDFMonitoringService },
        { provide: PDFAuditService, useValue: mockPDFAuditService },
      ],
    }).compile();

    service = module.get<EmailAttachmentService>(EmailAttachmentService);
    emailService = module.get<EmailService>(EmailService);
    pdfGeneratorService = module.get<PDFGeneratorService>(PDFGeneratorService);
    documentStorageService = module.get<DocumentStorageService>(DocumentStorageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateSimplifiedEmailTemplate', () => {
    it('should generate simplified email template with correct structure', () => {
      const orderData: OrderPDFData = {
        orderNumber: 'ORD-123',
        orderDate: '2024-01-15',
        customerInfo: {
          name: 'John Doe',
          email: 'john@example.com',
        },
        billingAddress: {
          fullName: 'John Doe',
          addressLine1: '123 Main St',
          city: 'City',
          state: 'State',
          postalCode: '12345',
          country: 'Country',
        },
        shippingAddress: {
          fullName: 'John Doe',
          addressLine1: '123 Main St',
          city: 'City',
          state: 'State',
          postalCode: '12345',
          country: 'Country',
        },
        items: [
          {
            id: '1',
            name: 'Test Product',
            quantity: 1,
            unitPrice: 100,
            totalPrice: 100,
          },
        ],
        pricing: {
          subtotal: 100,
          shippingCost: 10,
          total: 110,
        },
        paymentMethod: {
          type: 'bank_transfer',
          displayName: 'Bank Transfer',
          status: 'pending',
        },
        shippingMethod: {
          name: 'Standard Shipping',
        },
        businessInfo: {
          companyName: 'AlaCraft',
          contactEmail: 'contact@alacraft.com',
          address: {
            fullName: 'AlaCraft',
            addressLine1: '456 Business St',
            city: 'Business City',
            state: 'Business State',
            postalCode: '67890',
            country: 'Business Country',
          },
        },
        locale: 'en',
      };

      const template = service.generateSimplifiedEmailTemplate(orderData, 'en');

      expect(template.subject).toContain('ORD-123');
      expect(template.textContent).toContain('John Doe');
      expect(template.textContent).toContain('ORD-123');
      expect(template.htmlContent).toContain('AlaCraft');
      expect(template.htmlContent).toContain('ORD-123');
      expect(template.htmlContent).toContain('110');
    });

    it('should generate Vietnamese template when locale is vi', () => {
      const orderData: OrderPDFData = {
        orderNumber: 'ORD-123',
        orderDate: '2024-01-15',
        customerInfo: {
          name: 'Nguyen Van A',
          email: 'nguyen@example.com',
        },
        billingAddress: {
          fullName: 'Nguyen Van A',
          addressLine1: '123 Duong Chinh',
          city: 'Ho Chi Minh',
          state: 'Ho Chi Minh',
          postalCode: '70000',
          country: 'Vietnam',
        },
        shippingAddress: {
          fullName: 'Nguyen Van A',
          addressLine1: '123 Duong Chinh',
          city: 'Ho Chi Minh',
          state: 'Ho Chi Minh',
          postalCode: '70000',
          country: 'Vietnam',
        },
        items: [
          {
            id: '1',
            name: 'San pham test',
            quantity: 1,
            unitPrice: 100000,
            totalPrice: 100000,
          },
        ],
        pricing: {
          subtotal: 100000,
          shippingCost: 20000,
          total: 120000,
        },
        paymentMethod: {
          type: 'cash_on_delivery',
          displayName: 'Thanh toan khi nhan hang',
          status: 'pending',
        },
        shippingMethod: {
          name: 'Giao hang tieu chuan',
        },
        businessInfo: {
          companyName: 'AlaCraft',
          contactEmail: 'lienhe@alacraft.com',
          address: {
            fullName: 'AlaCraft',
            addressLine1: '456 Duong Kinh Doanh',
            city: 'Ho Chi Minh',
            state: 'Ho Chi Minh',
            postalCode: '70000',
            country: 'Vietnam',
          },
        },
        locale: 'vi',
      };

      const template = service.generateSimplifiedEmailTemplate(orderData, 'vi');

      expect(template.subject).toContain('Xác nhận đơn hàng');
      expect(template.subject).toContain('ORD-123');
      expect(template.textContent).toContain('Xin chào');
      expect(template.textContent).toContain('Nguyen Van A');
      expect(template.htmlContent).toContain('Cảm ơn bạn');
    });
  });

  describe('sendOrderConfirmationWithPDF', () => {
    it('should handle PDF generation failure gracefully', async () => {
      const orderData: OrderPDFData = {
        orderNumber: 'ORD-123',
        orderDate: '2024-01-15',
        customerInfo: {
          name: 'John Doe',
          email: 'john@example.com',
        },
        billingAddress: {
          fullName: 'John Doe',
          addressLine1: '123 Main St',
          city: 'City',
          state: 'State',
          postalCode: '12345',
          country: 'Country',
        },
        shippingAddress: {
          fullName: 'John Doe',
          addressLine1: '123 Main St',
          city: 'City',
          state: 'State',
          postalCode: '12345',
          country: 'Country',
        },
        items: [],
        pricing: {
          subtotal: 0,
          shippingCost: 0,
          total: 0,
        },
        paymentMethod: {
          type: 'bank_transfer',
          displayName: 'Bank Transfer',
          status: 'pending',
        },
        shippingMethod: {
          name: 'Standard Shipping',
        },
        businessInfo: {
          companyName: 'AlaCraft',
          contactEmail: 'contact@alacraft.com',
          address: {
            fullName: 'AlaCraft',
            addressLine1: '456 Business St',
            city: 'Business City',
            state: 'Business State',
            postalCode: '67890',
            country: 'Business Country',
          },
        },
        locale: 'en',
      };

      mockPDFGeneratorService.generateOrderPDF.mockResolvedValue({
        success: false,
        error: 'PDF generation failed',
        metadata: {
          generatedAt: new Date(),
          locale: 'en',
          orderNumber: 'ORD-123',
        },
      });

      mockEmailService.sendEmail.mockResolvedValue(true);

      const result = await service.sendOrderConfirmationWithPDF(
        'john@example.com',
        orderData,
        'en'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('PDF generation failed');
      expect(result.deliveryStatus).toBe('failed');
      // Note: Fallback notification is called internally but we can't easily test it in this unit test
    });
  });

  describe('resendOrderConfirmation', () => {
    it('should handle rate limiting correctly', async () => {
      // First call should succeed
      const result1 = await service.resendOrderConfirmation(
        'ORD-123',
        'john@example.com',
        'en'
      );

      expect(result1.success).toBe(true);
      expect(result1.rateLimited).toBeUndefined();

      // Subsequent calls within rate limit should be blocked
      for (let i = 0; i < 3; i++) {
        await service.resendOrderConfirmation('ORD-123', 'john@example.com', 'en');
      }

      const rateLimitedResult = await service.resendOrderConfirmation(
        'ORD-123',
        'john@example.com',
        'en'
      );

      expect(rateLimitedResult.success).toBe(false);
      expect(rateLimitedResult.rateLimited).toBe(true);
      expect(rateLimitedResult.message).toContain('Rate limit exceeded');
    });
  });

  describe('getDeliveryStatistics', () => {
    it('should return correct statistics', () => {
      const stats = service.getDeliveryStatistics();

      expect(stats).toHaveProperty('totalAttempts');
      expect(stats).toHaveProperty('successfulDeliveries');
      expect(stats).toHaveProperty('failedDeliveries');
      expect(stats).toHaveProperty('successRate');
      expect(typeof stats.successRate).toBe('number');
    });
  });
});