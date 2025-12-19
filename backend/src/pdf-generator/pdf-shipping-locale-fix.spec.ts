import { Test, TestingModule } from '@nestjs/testing';
import { PDFDocumentStructureService } from './pdf-document-structure.service';
import { PDFLocalizationService } from './services/pdf-localization.service';
import { ShippingService } from '../shipping/shipping.service';

/**
 * Test to verify PDF generation uses localized shipping method data
 */
describe('PDF Shipping Locale Fix', () => {
  let service: PDFDocumentStructureService;
  let shippingService: ShippingService;

  const mockPDFLocalizationService = {
    translate: jest.fn((key: string, locale: string) => {
      const translations: Record<string, Record<string, string>> = {
        shippingInformation: { en: 'Shipping Information', vi: 'Thông tin giao hàng' },
        shippingMethod: { en: 'Shipping Method', vi: 'Phương thức giao hàng' },
        description: { en: 'Description', vi: 'Mô tả' },
        estimatedDelivery: { en: 'Estimated Delivery', vi: 'Thời gian giao hàng dự kiến' },
        trackingNumber: { en: 'Tracking Number', vi: 'Mã vận đơn' },
        carrier: { en: 'Carrier', vi: 'Đơn vị vận chuyển' },
      };
      return translations[key]?.[locale] || key;
    }),
  };

  const mockShippingService = {
    getShippingMethodDetails: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PDFDocumentStructureService,
        {
          provide: PDFLocalizationService,
          useValue: mockPDFLocalizationService,
        },
        {
          provide: ShippingService,
          useValue: mockShippingService,
        },
      ],
    }).compile();

    service = module.get<PDFDocumentStructureService>(PDFDocumentStructureService);
    shippingService = module.get<ShippingService>(ShippingService);
    jest.clearAllMocks();
  });

  it('should call getShippingMethodDetails with correct locale parameter', async () => {
    // Mock shipping method details response
    mockShippingService.getShippingMethodDetails.mockResolvedValue({
      name: 'Giao hàng tiêu chuẩn',
      description: 'Giao hàng trong 3-5 ngày làm việc',
    });

    const mockOrderData = {
      orderNumber: 'ORD-123',
      orderDate: '2024-01-15',
      customerInfo: {
        name: 'Test Customer',
        email: 'test@example.com',
      },
      shippingAddress: {
        fullName: 'Test Customer',
        addressLine1: '123 Test St',
        city: 'Ho Chi Minh City',
        state: 'Ho Chi Minh',
        postalCode: '70000',
        country: 'Vietnam',
      },
      billingAddress: {
        fullName: 'Test Customer',
        addressLine1: '123 Test St',
        city: 'Ho Chi Minh City',
        state: 'Ho Chi Minh',
        postalCode: '70000',
        country: 'Vietnam',
      },
      items: [
        {
          name: 'Test Product',
          quantity: 1,
          unitPrice: 100000,
          totalPrice: 100000,
          sku: 'TEST-001',
        },
      ],
      pricing: {
        subtotal: 100000,
        shippingCost: 25000,
        total: 125000,
      },
      paymentMethod: {
        type: 'bank_transfer',
        status: 'pending',
      },
      shippingMethod: {
        name: 'standard',
        description: 'Standard shipping',
        estimatedDelivery: '3-5 days',
      },
      businessInfo: {
        companyName: 'Test Company',
        address: {
          addressLine1: '456 Business St',
          city: 'Ho Chi Minh City',
          state: 'Ho Chi Minh',
          postalCode: '70000',
        },
        contactEmail: 'business@example.com',
      },
    };

    const styling = {
      fonts: { primary: 'Arial, sans-serif' },
      colors: {
        primary: '#333',
        text: '#000',
        background: '#fff',
        border: '#ccc'
      },
      spacing: { small: 8, medium: 16, large: 24 },
    };

    // Test Vietnamese locale
    await service.generateDocumentStructure(mockOrderData, 'vi', styling);

    // Verify that getShippingMethodDetails was called with Vietnamese locale
    expect(mockShippingService.getShippingMethodDetails).toHaveBeenCalledWith('standard', 'vi');

    // Reset mocks and test English locale
    jest.clearAllMocks();
    mockShippingService.getShippingMethodDetails.mockResolvedValue({
      name: 'Standard Shipping',
      description: 'Delivery in 3-5 business days',
    });

    await service.generateDocumentStructure(mockOrderData, 'en', styling);

    // Verify that getShippingMethodDetails was called with English locale
    expect(mockShippingService.getShippingMethodDetails).toHaveBeenCalledWith('standard', 'en');
  });

  it('should use localized shipping method data in generated HTML', async () => {
    // Mock Vietnamese shipping method details
    mockShippingService.getShippingMethodDetails.mockResolvedValue({
      name: 'Giao hàng nhanh',
      description: 'Giao hàng trong 1-2 ngày làm việc',
    });

    const mockOrderData = {
      orderNumber: 'ORD-456',
      orderDate: '2024-01-15',
      customerInfo: {
        name: 'Khách hàng test',
        email: 'test@example.com',
      },
      shippingAddress: {
        fullName: 'Khách hàng test',
        addressLine1: '123 Đường Test',
        city: 'Thành phố Hồ Chí Minh',
        state: 'Hồ Chí Minh',
        postalCode: '70000',
        country: 'Việt Nam',
      },
      billingAddress: {
        fullName: 'Khách hàng test',
        addressLine1: '123 Đường Test',
        city: 'Thành phố Hồ Chí Minh',
        state: 'Hồ Chí Minh',
        postalCode: '70000',
        country: 'Việt Nam',
      },
      items: [
        {
          name: 'Sản phẩm test',
          quantity: 2,
          unitPrice: 50000,
          totalPrice: 100000,
          sku: 'TEST-002',
        },
      ],
      pricing: {
        subtotal: 100000,
        shippingCost: 30000,
        total: 130000,
      },
      paymentMethod: {
        type: 'cash_on_delivery',
        status: 'pending',
      },
      shippingMethod: {
        name: 'express',
        description: 'Express shipping',
        estimatedDelivery: '1-2 days',
      },
      businessInfo: {
        companyName: 'Công ty Test',
        address: {
          addressLine1: '456 Đường Kinh Doanh',
          city: 'Thành phố Hồ Chí Minh',
          state: 'Hồ Chí Minh',
          postalCode: '70000',
        },
        contactEmail: 'business@example.com',
      },
    };

    const styling = {
      fonts: { primary: 'Arial, sans-serif' },
      colors: {
        primary: '#333',
        text: '#000',
        background: '#fff',
        border: '#ccc'
      },
      spacing: { small: 8, medium: 16, large: 24 },
    };

    // Generate Vietnamese PDF
    const htmlContent = await service.generateDocumentStructure(mockOrderData, 'vi', styling);

    // Verify that the HTML contains the localized shipping method data
    expect(htmlContent).toContain('Giao hàng nhanh'); // Vietnamese name
    expect(htmlContent).toContain('Giao hàng trong 1-2 ngày làm việc'); // Vietnamese description
    expect(htmlContent).toContain('Thông tin giao hàng'); // Vietnamese section title
    expect(htmlContent).toContain('Phương thức giao hàng'); // Vietnamese field label

    // Verify that it does NOT contain the original English data from orderData
    expect(htmlContent).not.toContain('Express shipping');
    expect(htmlContent).not.toContain('express'); // Should not contain the method ID

    // Verify that getShippingMethodDetails was called with correct parameters
    expect(mockShippingService.getShippingMethodDetails).toHaveBeenCalledWith('express', 'vi');
  });

  it('should fallback gracefully when shipping service fails', async () => {
    // Mock shipping service to throw an error
    mockShippingService.getShippingMethodDetails.mockRejectedValue(
      new Error('Shipping service unavailable')
    );

    const mockOrderData = {
      orderNumber: 'ORD-789',
      orderDate: '2024-01-15',
      customerInfo: {
        name: 'Test Customer',
        email: 'test@example.com',
      },
      shippingAddress: {
        fullName: 'Test Customer',
        addressLine1: '123 Test St',
        city: 'Ho Chi Minh City',
        state: 'Ho Chi Minh',
        postalCode: '70000',
        country: 'Vietnam',
      },
      billingAddress: {
        fullName: 'Test Customer',
        addressLine1: '123 Test St',
        city: 'Ho Chi Minh City',
        state: 'Ho Chi Minh',
        postalCode: '70000',
        country: 'Vietnam',
      },
      items: [
        {
          name: 'Test Product',
          quantity: 1,
          unitPrice: 75000,
          totalPrice: 75000,
          sku: 'TEST-003',
        },
      ],
      pricing: {
        subtotal: 75000,
        shippingCost: 20000,
        total: 95000,
      },
      paymentMethod: {
        type: 'bank_transfer',
        status: 'completed',
      },
      shippingMethod: {
        name: 'Standard Shipping',
        description: 'Standard delivery service',
        estimatedDelivery: '3-5 days',
      },
      businessInfo: {
        companyName: 'Test Company',
        address: {
          addressLine1: '456 Business St',
          city: 'Ho Chi Minh City',
          state: 'Ho Chi Minh',
          postalCode: '70000',
        },
        contactEmail: 'business@example.com',
      },
    };

    const styling = {
      fonts: { primary: 'Arial, sans-serif' },
      colors: {
        primary: '#333',
        text: '#000',
        background: '#fff',
        border: '#ccc'
      },
      spacing: { small: 8, medium: 16, large: 24 },
    };

    // Should not throw an error even when shipping service fails
    const htmlContent = await service.generateDocumentStructure(mockOrderData, 'en', styling);

    // Should still generate valid HTML content
    expect(htmlContent).toContain('ORDER CONFIRMATION');
    expect(htmlContent).toContain('Standard Shipping'); // Should use fallback data from order
    expect(htmlContent).toContain('Standard delivery service');

    // Verify that getShippingMethodDetails was called with correct parameters
    expect(mockShippingService.getShippingMethodDetails).toHaveBeenCalledWith('Standard Shipping', 'en');
  });
});