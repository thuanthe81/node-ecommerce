import { Test, TestingModule } from '@nestjs/testing';
import { PDFAccessibilityService } from './pdf-accessibility.service';
import { PDFStyling, OrderPDFData } from '../types/pdf.types';

describe('PDFAccessibilityService', () => {
  let service: PDFAccessibilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PDFAccessibilityService],
    }).compile();

    service = module.get<PDFAccessibilityService>(PDFAccessibilityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('enhanceHTMLAccessibility', () => {
    it('should add language attributes to HTML', () => {
      const content = '<html><body><h1>Test</h1></body></html>';
      const result = service.enhanceHTMLAccessibility(content, 'en');

      expect(result).toContain('lang="en"');
      expect(result).toContain('xml:lang="en"');
    });

    it('should add ARIA roles to semantic elements', () => {
      const content = '<html><body><header>Header</header><main>Main</main><footer>Footer</footer></body></html>';
      const result = service.enhanceHTMLAccessibility(content, 'en');

      expect(result).toContain('role="banner"');
      expect(result).toContain('role="main"');
      expect(result).toContain('role="contentinfo"');
    });

    it('should add skip navigation', () => {
      const content = '<html><body><main>Content</main></body></html>';
      const result = service.enhanceHTMLAccessibility(content, 'en');

      expect(result).toContain('Skip to main content');
      expect(result).toContain('class="skip-nav"');
      expect(result).toContain('id="main-content"');
    });
  });

  describe('generateHighContrastStyling', () => {
    it('should generate high contrast colors', () => {
      const baseStyling: PDFStyling = {
        fonts: { primary: 'Arial', heading: 'Arial', monospace: 'Courier' },
        colors: { primary: '#blue', secondary: '#green', text: '#gray', background: '#white', border: '#lightgray' },
        spacing: { small: 8, medium: 16, large: 24 },
        pageFormat: { size: 'A4', orientation: 'portrait', margins: { top: 20, right: 15, bottom: 20, left: 15 } }
      };

      const result = service.generateHighContrastStyling(baseStyling);

      expect(result.colors.primary).toBe('#000000');
      expect(result.colors.text).toBe('#000000');
      expect(result.colors.background).toBe('#ffffff');
      expect(result.colors.border).toBe('#000000');
    });
  });

  describe('enhanceImageAltText', () => {
    it('should enhance company logo alt text', () => {
      const content = '<img class="company-logo" alt="logo" src="logo.png">';
      const orderData: Partial<OrderPDFData> = {
        businessInfo: { companyName: 'Test Company' } as any,
        items: [],
        paymentMethod: { type: 'cash_on_delivery', displayName: 'Cash', status: 'pending' } as any
      };

      const result = service.enhanceImageAltText(content, orderData as OrderPDFData, 'en');

      expect(result).toContain('alt="Test Company logo"');
    });

    it('should enhance product image alt text', () => {
      const content = '<img src="product.jpg" alt="product" class="product-image">';
      const orderData: Partial<OrderPDFData> = {
        businessInfo: { companyName: 'Test Company' } as any,
        items: [
          {
            id: '1',
            name: 'Test Product',
            description: 'A test product',
            quantity: 1,
            unitPrice: 10,
            totalPrice: 10,
            imageUrl: 'product.jpg'
          }
        ],
        paymentMethod: { type: 'cash_on_delivery', displayName: 'Cash', status: 'pending' } as any
      };

      const result = service.enhanceImageAltText(content, orderData as OrderPDFData, 'en');

      expect(result).toContain('Product image of Test Product');
    });
  });

  describe('generateAccessibilityMetadata', () => {
    it('should generate proper accessibility metadata', () => {
      const orderData: Partial<OrderPDFData> = {
        orderNumber: 'ORD-123',
        businessInfo: { companyName: 'Test Company' } as any
      };

      const result = service.generateAccessibilityMetadata(orderData as OrderPDFData, 'en');

      expect(result['dc:title']).toContain('Order ORD-123');
      expect(result['dc:language']).toBe('en');
      expect(result['accessibility:accessMode']).toBe('textual, visual');
      expect(result['accessibility:accessibilityFeature']).toContain('alternativeText');
    });

    it('should generate Vietnamese metadata', () => {
      const orderData: Partial<OrderPDFData> = {
        orderNumber: 'ORD-123',
        businessInfo: { companyName: 'Test Company' } as any
      };

      const result = service.generateAccessibilityMetadata(orderData as OrderPDFData, 'vi');

      expect(result['dc:title']).toContain('Đơn hàng ORD-123');
      expect(result['dc:language']).toBe('vi');
      expect(result['dc:description']).toContain('Chi tiết đơn hàng');
    });
  });

  describe('generateAccessibilityCSS', () => {
    it('should generate accessibility CSS', () => {
      const styling: PDFStyling = {
        fonts: { primary: 'Arial', heading: 'Arial', monospace: 'Courier' },
        colors: { primary: '#000', secondary: '#333', text: '#000', background: '#fff', border: '#ccc' },
        spacing: { small: 8, medium: 16, large: 24 },
        pageFormat: { size: 'A4', orientation: 'portrait', margins: { top: 20, right: 15, bottom: 20, left: 15 } }
      };

      const result = service.generateAccessibilityCSS(styling);

      expect(result).toContain('.skip-nav');
      expect(result).toContain('*:focus');
      expect(result).toContain('@media (prefers-contrast: high)');
      expect(result).toContain('.sr-only');
    });
  });
});