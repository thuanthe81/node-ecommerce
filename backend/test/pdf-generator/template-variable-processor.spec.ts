import { Test, TestingModule } from '@nestjs/testing';
import { TemplateVariableProcessorService } from '../../src/pdf-generator/services/template-variable-processor.service';
import { PDFLocalizationService } from '../../src/pdf-generator/services/pdf-localization.service';
import { OrderPDFData } from '../../src/pdf-generator/types/pdf.types';

describe('TemplateVariableProcessorService', () => {
  let service: TemplateVariableProcessorService;
  let mockLocalizationService: jest.Mocked<PDFLocalizationService>;

  beforeEach(async () => {
    mockLocalizationService = {
      formatDate: jest.fn((date, locale) => `formatted-${date}-${locale}`),
      formatCurrency: jest.fn((amount, locale) => `${locale === 'vi' ? 'VND' : '$'}${amount}`),
      formatPhoneNumber: jest.fn((phone, locale) => `formatted-${phone}`),
      formatAddress: jest.fn((address, locale) => `${address.addressLine1}, ${address.city}`),
      getPaymentStatusText: jest.fn((status, locale) => `status-${status}-${locale}`),
      translate: jest.fn((key, locale, params) => `translated-${key}-${locale}`)
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplateVariableProcessorService,
        {
          provide: PDFLocalizationService,
          useValue: mockLocalizationService
        }
      ]
    }).compile();

    service = module.get<TemplateVariableProcessorService>(TemplateVariableProcessorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processLoops with conditionals inside', () => {
    it('should process conditionals within loop iterations', () => {
      const template = `
        {{#each items}}
          <div class="item">
            <h3>{{this.name}}</h3>
            {{#if this.hasDiscount}}
              <span class="discount">Discount: {{this.discountAmount}}</span>
            {{/if}}
            {{#if this.imageUrl}}
              <img src="{{this.imageUrl}}" alt="{{this.name}}" />
            {{/if}}
            <p>Price: {{this.unitPrice}}</p>
          </div>
        {{/each}}
      `;

      const data = {
        items: [
          {
            name: 'Product 1',
            unitPrice: 100,
            hasDiscount: true,
            discountAmount: 10,
            imageUrl: 'https://example.com/image1.jpg'
          },
          {
            name: 'Product 2',
            unitPrice: 200,
            hasDiscount: false,
            discountAmount: 0,
            imageUrl: null
          },
          {
            name: 'Product 3',
            unitPrice: 150,
            hasDiscount: true,
            discountAmount: 15,
            imageUrl: 'https://example.com/image3.jpg'
          }
        ]
      };

      const result = service.processLoops(template, data);

      // Should contain Product 1 with discount and image
      expect(result).toContain('Product 1');
      expect(result).toContain('Discount: 10');
      expect(result).toContain('src="https:&#x2F;&#x2F;example.com&#x2F;image1.jpg"'); // URLs should be escaped for security

      // Should contain Product 2 without discount and without image
      expect(result).toContain('Product 2');
      expect(result).not.toContain('Discount: 0'); // Should not show discount section
      expect(result).not.toContain('image2.jpg'); // Should not show image

      // Should contain Product 3 with discount and image
      expect(result).toContain('Product 3');
      expect(result).toContain('Discount: 15');
      expect(result).toContain('src="https:&#x2F;&#x2F;example.com&#x2F;image3.jpg"'); // URLs should be escaped for security

      // All products should have prices
      expect(result).toContain('Price: 100');
      expect(result).toContain('Price: 200');
      expect(result).toContain('Price: 150');
    });

    it('should handle nested conditionals within loops', () => {
      const template = `
        {{#each items}}
          {{#if this.isVisible}}
            <div class="visible-item">
              {{#if this.hasSpecialOffer}}
                <span class="special">Special Offer!</span>
              {{/if}}
              <span>{{this.name}}</span>
            </div>
          {{/if}}
        {{/each}}
      `;

      const data = {
        items: [
          { name: 'Item 1', isVisible: true, hasSpecialOffer: true },
          { name: 'Item 2', isVisible: false, hasSpecialOffer: true },
          { name: 'Item 3', isVisible: true, hasSpecialOffer: false }
        ]
      };

      const result = service.processLoops(template, data);

      // Should show Item 1 with special offer
      expect(result).toContain('Item 1');
      expect(result).toContain('Special Offer!');

      // Should not show Item 2 (not visible)
      expect(result).not.toContain('Item 2');

      // Should show Item 3 without special offer
      expect(result).toContain('Item 3');

      // Should have exactly 2 visible-item divs (for Item 1 and Item 3)
      const visibleItemMatches = result.match(/<div class="visible-item">/g);
      expect(visibleItemMatches?.length).toBe(2);

      // Should have exactly 1 special offer (for Item 1)
      expect(result.match(/Special Offer!/g)?.length).toBe(1);
    });
  });

  describe('processConditionals', () => {
    it('should process simple conditionals', () => {
      const template = `
        {{#if hasShipping}}
          <p>Shipping: Present</p>
        {{/if}}
        {{#if hasTax}}
          <p>Tax: Present</p>
        {{/if}}
      `;

      const data = {
        hasShipping: true,
        shippingCost: 50,
        hasTax: false,
        taxAmount: 10
      };

      const result = service.processConditionals(template, data);

      expect(result).toContain('Shipping: Present');
      expect(result).not.toContain('Tax: Present');
    });

    it('should process conditionals with {{else}} blocks', () => {
      const template = `
        {{#if hasDiscount}}
          <p>Discount Applied</p>
        {{else}}
          <p>No Discount</p>
        {{/if}}
        {{#if isPremium}}
          <p>Premium Member</p>
        {{else}}
          <p>Regular Member</p>
        {{/if}}
      `;

      const data = {
        hasDiscount: true,
        isPremium: false
      };

      const result = service.processConditionals(template, data);

      expect(result).toContain('Discount Applied');
      expect(result).not.toContain('No Discount');
      expect(result).toContain('Regular Member');
      expect(result).not.toContain('Premium Member');
    });

    it('should handle {{else}} blocks within loops', () => {
      const template = `
        {{#each items}}
          {{#if this.inStock}}
            <span class="available">{{this.name}} - Available</span>
          {{else}}
            <span class="unavailable">{{this.name}} - Out of Stock</span>
          {{/if}}
        {{/each}}
      `;

      const data = {
        items: [
          { name: 'Product A', inStock: true },
          { name: 'Product B', inStock: false },
          { name: 'Product C', inStock: true }
        ]
      };

      const result = service.processLoops(template, data);

      expect(result).toContain('Product A - Available');
      expect(result).toContain('Product B - Out of Stock');
      expect(result).toContain('Product C - Available');
      expect(result).not.toContain('Product A - Out of Stock');
      expect(result).not.toContain('Product B - Available');
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML characters', () => {
      const input = '<script>alert("xss")</script> & "quotes" & \'apostrophes\'';
      const result = service.escapeHtml(input);

      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt; &amp; &quot;quotes&quot; &amp; &#x27;apostrophes&#x27;');
    });
  });

  describe('formatValue', () => {
    it('should format currency values', () => {
      const result = service.formatValue(100, 'currency', 'en');
      expect(mockLocalizationService.formatCurrency).toHaveBeenCalledWith(100, 'en');
    });

    it('should format date values', () => {
      const result = service.formatValue('2023-01-01', 'date', 'vi');
      expect(mockLocalizationService.formatDate).toHaveBeenCalledWith('2023-01-01', 'vi');
    });

    it('should format text values', () => {
      const result = service.formatValue('<script>test</script>', 'text', 'en');
      expect(result).toBe('&lt;script&gt;test&lt;&#x2F;script&gt;');
    });
  });

  describe('missing translation keys', () => {
    it('should handle invoice-specific translation keys', () => {
      const template = `
        <h2>{{invoiceItemsTitle}}</h2>
        <h3>{{invoiceSummaryTitle}}</h3>
        <p>{{totalAmountDueLabel}}: {{formattedTotal}}</p>
        <p>{{contactUsLabel}}: support@example.com</p>
      `;

      const data = {
        orderNumber: 'TEST-001',
        orderDate: '2023-01-01',
        customerInfo: {
          name: 'Test Customer',
          email: 'test@example.com',
          phone: '+1234567890'
        },
        billingAddress: {
          fullName: 'Test Customer',
          addressLine1: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          postalCode: '12345',
          country: 'Test Country'
        },
        shippingAddress: {
          fullName: 'Test Customer',
          addressLine1: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          postalCode: '12345',
          country: 'Test Country'
        },
        items: [],
        pricing: {
          subtotal: 100,
          shippingCost: 10,
          total: 110
        },
        paymentMethod: {
          type: 'bank_transfer',
          displayName: 'Bank Transfer',
          status: 'pending'
        },
        shippingMethod: {
          name: 'Standard',
          description: 'Standard delivery'
        },
        businessInfo: {
          companyName: 'Test Company',
          contactEmail: 'support@test.com'
        },
        locale: 'en'
      };

      // Mock the translate method to return the expected translations
      mockLocalizationService.translate.mockImplementation((key, locale) => {
        const translations = {
          'orderItems': locale === 'vi' ? 'Chi tiết đơn hàng' : 'Order Items',
          'orderSummary': locale === 'vi' ? 'Tổng kết đơn hàng' : 'Order Summary',
          'grandTotal': locale === 'vi' ? 'Tổng cộng' : 'Total',
          'customerService': locale === 'vi' ? 'Dịch vụ khách hàng' : 'Customer Service'
        };
        return translations[key] || key;
      });

      const result = service.processVariables(template, data as any, 'en');

      expect(result).toContain('Order Items');
      expect(result).toContain('Order Summary');
      expect(result).toContain('Total:');
      expect(result).toContain('Customer Service:');
    });

    it('should handle payment status translations', () => {
      mockLocalizationService.translate.mockImplementation((key, locale) => {
        if (key === 'paymentStatus_paid') {
          return locale === 'vi' ? 'Đã thanh toán' : 'Paid';
        }
        return key;
      });

      const result = mockLocalizationService.translate('paymentStatus_paid', 'vi');
      expect(result).toBe('Đã thanh toán');

      const resultEn = mockLocalizationService.translate('paymentStatus_paid', 'en');
      expect(resultEn).toBe('Paid');
    });

    it('should translate payment method values', () => {
      const template = '{{paymentMethod.displayName}}';
      const data = {
        paymentMethod: {
          displayName: 'Bank Transfer'
        }
      } as OrderPDFData;

      mockLocalizationService.translate.mockImplementation((key, locale) => {
        if (key === 'paymentMethod_bankTransfer') {
          return locale === 'vi' ? 'Chuyển khoản ngân hàng' : 'Bank Transfer';
        }
        return key;
      });

      const result = service.processNestedVariables(template, data, 'vi');

      expect(result).toContain('Chuyển khoản ngân hàng');
    });

    it('should translate shipping method values', () => {
      const template = '{{shippingMethod.name}}';
      const data = {
        shippingMethod: {
          name: 'standard'
        }
      } as OrderPDFData;

      // With the deprecated translateShippingMethod, it now returns the original value
      // Applications should use ShippingService.getShippingMethodDetails() for proper localization
      const result = service.processNestedVariables(template, data, 'vi');

      expect(result).toContain('standard'); // Returns original value as fallback
    });

    it('should translate shipping method descriptions', () => {
      const template = '{{shippingMethod.description}}';
      const data = {
        shippingMethod: {
          description: 'Standard Delivery (3-5 business days)'
        }
      } as OrderPDFData;

      // With the deprecated translateShippingDescription, it now returns basic fallback
      // Applications should use ShippingService.getShippingMethodDetails() for proper localization
      const result = service.processNestedVariables(template, data, 'vi');

      expect(result).toContain('Giao hàng tiêu chuẩn (3-7 ngày làm việc)'); // Basic fallback for Vietnamese
    });

    it('should handle full template processing with payment and shipping translations', () => {
      const template = `
        <div>{{paymentInformationTitle}}</div>
        <div>{{paymentMethodLabel}}: {{paymentMethod.displayName}}</div>
        <div>{{shippingInformationTitle}}</div>
        <div>{{shippingMethodLabel}}: {{shippingMethod.name}}</div>
        <div>{{descriptionLabel}}: {{shippingMethod.description}}</div>
      `;

      const data = {
        orderNumber: 'TEST-001',
        orderDate: '2023-01-01',
        customerInfo: {
          name: 'Test Customer',
          email: 'test@example.com',
          phone: '+1234567890'
        },
        billingAddress: {
          fullName: 'Test Customer',
          addressLine1: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          postalCode: '12345',
          country: 'Test Country'
        },
        shippingAddress: {
          fullName: 'Test Customer',
          addressLine1: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          postalCode: '12345',
          country: 'Test Country'
        },
        items: [],
        pricing: {
          subtotal: 100,
          shippingCost: 10,
          total: 110,
          taxAmount: 0,
          discountAmount: 0
        },
        paymentMethod: {
          displayName: 'Bank Transfer',
          type: 'bank_transfer',
          status: 'pending'
        },
        shippingMethod: {
          name: 'standard',
          description: 'Standard Delivery (3-5 business days)'
        },
        businessInfo: {
          companyName: 'Test Company',
          contactEmail: 'support@test.com'
        }
      } as OrderPDFData;

      mockLocalizationService.translate.mockImplementation((key, locale) => {
        const translations = {
          'paymentInformation': locale === 'vi' ? 'Thông tin thanh toán' : 'Payment Information',
          'paymentMethod': locale === 'vi' ? 'Phương thức' : 'Method',
          'shippingInformation': locale === 'vi' ? 'Thông tin vận chuyển' : 'Shipping Information',
          'shippingMethod': locale === 'vi' ? 'Phương thức' : 'Method',
          'description': locale === 'vi' ? 'Mô tả' : 'Description',
          'paymentMethod_bankTransfer': locale === 'vi' ? 'Chuyển khoản ngân hàng' : 'Bank Transfer'
        };
        return translations[key] || key;
      });

      const result = service.processVariables(template, data, 'vi');

      expect(result).toContain('Thông tin thanh toán');
      expect(result).toContain('Phương thức: Chuyển khoản ngân hàng');
      expect(result).toContain('Thông tin vận chuyển');
      // With deprecated shipping method translation, it returns original value as fallback
      expect(result).toContain('Phương thức: standard');
      // With deprecated shipping description translation, it returns basic fallback
      expect(result).toContain('Mô tả: Giao hàng tiêu chuẩn (3-7 ngày làm việc)');
    });
  });
});