import { Test, TestingModule } from '@nestjs/testing';
import { PDFDeviceOptimizationService } from './pdf-device-optimization.service';
import { PDFStyling, OrderPDFData } from '../types/pdf.types';

describe('PDFDeviceOptimizationService', () => {
  let service: PDFDeviceOptimizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PDFDeviceOptimizationService],
    }).compile();

    service = module.get<PDFDeviceOptimizationService>(PDFDeviceOptimizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateMobileOptimizedCSS', () => {
    it('should generate mobile-specific CSS', () => {
      const styling: PDFStyling = {
        fonts: { primary: 'Arial', heading: 'Arial', monospace: 'Courier' },
        colors: { primary: '#000', secondary: '#333', text: '#000', background: '#fff', border: '#ccc' },
        spacing: { small: 8, medium: 16, large: 24 },
        pageFormat: { size: 'A4', orientation: 'portrait', margins: { top: 20, right: 15, bottom: 20, left: 15 } }
      };

      const result = service.generateMobileOptimizedCSS(styling);

      expect(result).toContain('@media screen and (max-width: 768px)');
      expect(result).toContain('font-size: 14px');
      expect(result).toContain('flex-direction: column');
    });
  });

  describe('generateDesktopOptimizedCSS', () => {
    it('should generate desktop-specific CSS', () => {
      const styling: PDFStyling = {
        fonts: { primary: 'Arial', heading: 'Arial', monospace: 'Courier' },
        colors: { primary: '#000', secondary: '#333', text: '#000', background: '#fff', border: '#ccc' },
        spacing: { small: 8, medium: 16, large: 24 },
        pageFormat: { size: 'A4', orientation: 'portrait', margins: { top: 20, right: 15, bottom: 20, left: 15 } }
      };

      const result = service.generateDesktopOptimizedCSS(styling);

      expect(result).toContain('@media screen and (min-width: 1024px)');
      expect(result).toContain('max-width: 800px');
      expect(result).toContain('box-shadow');
    });
  });

  describe('generatePrintOptimizedCSS', () => {
    it('should generate print-specific CSS', () => {
      const styling: PDFStyling = {
        fonts: { primary: 'Arial', heading: 'Arial', monospace: 'Courier' },
        colors: { primary: '#000', secondary: '#333', text: '#000', background: '#fff', border: '#ccc' },
        spacing: { small: 8, medium: 16, large: 24 },
        pageFormat: { size: 'A4', orientation: 'portrait', margins: { top: 20, right: 15, bottom: 20, left: 15 } }
      };

      const result = service.generatePrintOptimizedCSS(styling);

      expect(result).toContain('@media print');
      expect(result).toContain('@page');
      expect(result).toContain('page-break-inside: avoid');
      expect(result).toContain('color-adjust: exact');
    });
  });

  describe('generateNavigationFeatures', () => {
    it('should generate navigation HTML for English', () => {
      const orderData: Partial<OrderPDFData> = {
        orderNumber: 'ORD-123',
        locale: 'en'
      };

      const result = service.generateNavigationFeatures(orderData as OrderPDFData, 'en');

      expect(result).toContain('Document navigation');
      expect(result).toContain('Customer Info');
      expect(result).toContain('Items');
      expect(result).toContain('Summary');
      expect(result).toContain('Payment');
      expect(result).toContain('Shipping');
    });

    it('should generate navigation HTML for Vietnamese', () => {
      const orderData: Partial<OrderPDFData> = {
        orderNumber: 'ORD-123',
        locale: 'vi'
      };

      const result = service.generateNavigationFeatures(orderData as OrderPDFData, 'vi');

      expect(result).toContain('Điều hướng tài liệu');
      expect(result).toContain('Thông tin khách hàng');
      expect(result).toContain('Sản phẩm');
      expect(result).toContain('Tóm tắt');
      expect(result).toContain('Thanh toán');
      expect(result).toContain('Giao hàng');
    });
  });

  describe('addNavigationAnchors', () => {
    it('should add navigation anchors to content', () => {
      const content = `
        <div class="customer-info">Customer Info</div>
        <div class="items-section">Items</div>
        <div class="order-summary">Summary</div>
        <div class="payment-info">Payment</div>
        <div class="shipping-info">Shipping</div>
      `;

      const result = service.addNavigationAnchors(content);

      expect(result).toContain('id="customer-info"');
      expect(result).toContain('id="order-items"');
      expect(result).toContain('id="order-summary"');
      expect(result).toContain('id="payment-info"');
      expect(result).toContain('id="shipping-info"');
    });
  });

  describe('getDeviceOptimizedPDFOptions', () => {
    it('should return mobile-optimized options', () => {
      const result = service.getDeviceOptimizedPDFOptions('mobile');

      expect(result.format).toBe('A4');
      expect(result.margin.top).toBe('15mm');
      expect(result.margin.right).toBe('10mm');
      expect(result.preferCSSPageSize).toBe(true);
    });

    it('should return desktop-optimized options', () => {
      const result = service.getDeviceOptimizedPDFOptions('desktop');

      expect(result.format).toBe('A4');
      expect(result.margin.top).toBe('25mm');
      expect(result.margin.right).toBe('20mm');
      expect(result.preferCSSPageSize).toBe(true);
    });

    it('should return print-optimized options', () => {
      const result = service.getDeviceOptimizedPDFOptions('print');

      expect(result.format).toBe('A4');
      expect(result.margin.top).toBe('20mm');
      expect(result.margin.right).toBe('15mm');
      expect(result.preferCSSPageSize).toBe(false);
    });
  });

  describe('generateCompleteDeviceCSS', () => {
    it('should combine all device CSS', () => {
      const styling: PDFStyling = {
        fonts: { primary: 'Arial', heading: 'Arial', monospace: 'Courier' },
        colors: { primary: '#000', secondary: '#333', text: '#000', background: '#fff', border: '#ccc' },
        spacing: { small: 8, medium: 16, large: 24 },
        pageFormat: { size: 'A4', orientation: 'portrait', margins: { top: 20, right: 15, bottom: 20, left: 15 } }
      };

      const result = service.generateCompleteDeviceCSS(styling);

      expect(result).toContain('box-sizing: border-box');
      expect(result).toContain('@media screen and (max-width: 768px)');
      expect(result).toContain('@media screen and (min-width: 1024px)');
      expect(result).toContain('@media print');
    });
  });
});