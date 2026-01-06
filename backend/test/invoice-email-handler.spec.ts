import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceEmailHandlerService } from '../src/pdf-generator/services/invoice-email-handler.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { EmailAttachmentService } from '../src/pdf-generator/services/email-attachment.service';

describe('InvoiceEmailHandlerService', () => {
  let service: InvoiceEmailHandlerService;
  let prismaService: PrismaService;
  let emailAttachmentService: EmailAttachmentService;

  const mockPrismaService = {
    order: {
      findUnique: jest.fn(),
    },
  };

  const mockEmailAttachmentService = {
    sendInvoiceEmailWithPDF: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceEmailHandlerService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EmailAttachmentService, useValue: mockEmailAttachmentService },
      ],
    }).compile();

    service = module.get<InvoiceEmailHandlerService>(InvoiceEmailHandlerService);
    prismaService = module.get<PrismaService>(PrismaService);
    emailAttachmentService = module.get<EmailAttachmentService>(EmailAttachmentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateInvoiceRequest', () => {
    it('should return invalid for empty order number', async () => {
      const result = await service.validateInvoiceRequest('', 'test@example.com');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid order number format');
    });

    it('should return invalid for invalid email format', async () => {
      const result = await service.validateInvoiceRequest('ORDER123', 'invalid-email');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email address format');
    });

    it('should return invalid when order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      const result = await service.validateInvoiceRequest('ORDER123', 'test@example.com');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Order not found');
    });

    it('should return invalid when email does not match order email', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        id: '1',
        email: 'different@example.com',
        createdAt: new Date(),
        items: [],
      });

      const result = await service.validateInvoiceRequest('ORDER123', 'test@example.com');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email address does not match order email');
    });

    it('should return invalid when order contains quote items', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        createdAt: new Date(),
        items: [
          { unitPrice: 100 },
          { unitPrice: 0 }, // Quote item
        ],
      });

      const result = await service.validateInvoiceRequest('ORDER123', 'test@example.com');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Order contains items without prices set. Please set all item prices before sending invoice.');
    });

    it('should return valid for valid order with all priced items', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        createdAt: new Date(),
        items: [
          { unitPrice: 100 },
          { unitPrice: 200 },
        ],
      });

      const result = await service.validateInvoiceRequest('ORDER123', 'test@example.com');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('handleInvoiceRequest', () => {
    it('should handle successful invoice request', async () => {
      // Mock validation to pass
      mockPrismaService.order.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        createdAt: new Date(),
        items: [{ unitPrice: 100 }],
      });

      // Mock email service to succeed
      mockEmailAttachmentService.sendInvoiceEmailWithPDF.mockResolvedValue({
        success: true,
      });

      const result = await service.handleInvoiceRequest(
        'ORDER123',
        'test@example.com',
        'en',
        'admin123'
      );

      expect(result.success).toBe(true);
      expect(result.pdfGenerated).toBe(true);
      expect(mockEmailAttachmentService.sendInvoiceEmailWithPDF).toHaveBeenCalledWith(
        'ORDER123',
        'test@example.com',
        'en'
      );
    });

    it('should handle validation failure', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      const result = await service.handleInvoiceRequest(
        'ORDER123',
        'test@example.com',
        'en',
        'admin123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Order not found');
      expect(mockEmailAttachmentService.sendInvoiceEmailWithPDF).not.toHaveBeenCalled();
    });
  });

  describe('checkRateLimit', () => {
    it('should allow first request', async () => {
      const result = await service.checkRateLimit('test@example.com');

      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(4); // MAX_INVOICE_ATTEMPTS - 1
    });
  });

  describe('getInvoiceStatistics', () => {
    it('should return initial statistics', () => {
      const stats = service.getInvoiceStatistics();

      expect(stats.totalRequests).toBe(0);
      expect(stats.successfulRequests).toBe(0);
      expect(stats.failedRequests).toBe(0);
      expect(stats.rateLimitedRequests).toBe(0);
      expect(stats.successRate).toBe(0);
    });
  });
});