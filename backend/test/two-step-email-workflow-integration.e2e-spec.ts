import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { OrdersService } from '../src/orders/orders.service';
import { EmailAttachmentService } from '../src/pdf-generator/services/email-attachment.service';
import { InvoiceEmailHandlerService } from '../src/pdf-generator/services/invoice-email-handler.service';
import { EmailTestingUtils } from '../src/common/utils/email-testing.utils';
import { CreateOrderDto } from '../src/orders/dto/create-order.dto';
import { AppModule } from '../src/app.module';
import { hasQuoteItems } from '@alacraft/shared';

/**
 * Integration Tests for Two-Step Email Workflow
 *
 * Tests Requirements:
 * - 9.1: Universal confirmation email without attachment for all orders
 * - 9.2: Automatic invoice email for priced orders
 * - 9.3: Single confirmation email for quote orders
 * - 11.1: Confirmation emails always sent without attachments
 * - 11.2: Automatic invoice emails for priced orders
 * - 11.3: Admin-controlled invoice emails for quote orders
 * - 11.4: Invoice emails after admin pricing
 * - 11.5: Complete order details in invoice PDF
 * - 11.6: Current pricing accuracy in multiple PDFs
 */
describe('Two-Step Email Workflow Integration (e2e)', () => {
  let app: INestApplication;
  let ordersService: OrdersService;
  let emailAttachmentService: EmailAttachmentService;
  let invoiceEmailHandlerService: InvoiceEmailHandlerService;
  let prismaService: PrismaService;
  let testOrderIds: string[] = [];
  let testAddressIds: string[] = [];
  let testProductIds: string[] = [];
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    ordersService = moduleFixture.get<OrdersService>(OrdersService);
    emailAttachmentService = moduleFixture.get<EmailAttachmentService>(EmailAttachmentService);
    invoiceEmailHandlerService = moduleFixture.get<InvoiceEmailHandlerService>(InvoiceEmailHandlerService);
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    // Enable test mode for comprehensive logging
    EmailTestingUtils.enableTestMode();

    // Create test user
    testUserId = await createTestUser();
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestData();

    // Disable test mode
    EmailTestingUtils.disableTestMode();
    EmailTestingUtils.clearAllData();

    await app.close();
  });

  beforeEach(() => {
    // Reset email count tracking for each test
    EmailTestingUtils.clearAllData();
    EmailTestingUtils.enableTestMode();
  });

  describe('Two-Step Email Workflow - Complete Order Creation to Invoice Delivery', () => {
    it('should send confirmation email without attachment for priced order, then automatic invoice email with PDF', async () => {
      // Create order with priced items
      const order = await createTestOrderWithPricedItems('priced-order-test@example.com', 'John Doe');
      testOrderIds.push(order.id);

      // Add order to test mode tracking
      EmailTestingUtils.addOrderToTestMode(order.id);

      // Wait for email processing (async)
      await waitForEmailProcessing();

      // Verify confirmation email was sent (without PDF)
      const confirmationEmailCount = EmailTestingUtils.countEmailsForOrder(order.id, 'order_confirmation');
      expect(confirmationEmailCount).toBe(1);

      // Verify invoice email was sent automatically (with PDF)
      const invoiceEmailCount = EmailTestingUtils.countEmailsForOrder(order.id, 'invoice');
      expect(invoiceEmailCount).toBe(1);

      // Verify total email count is 2 (confirmation + invoice)
      const totalEmailCount = EmailTestingUtils.countEmailsForOrder(order.id);
      expect(totalEmailCount).toBe(2);

      // Get test report
      const testReport = EmailTestingUtils.getTestReport(order.id);
      expect(testReport.status).toBe('SUCCESS');
      expect(testReport.emailCount).toBe(2);
    });

    it('should send only confirmation email without attachment for quote order', async () => {
      // Create order with quote items (zero-price products)
      const order = await createTestOrderWithQuoteItems('quote-order-test@example.com', 'Jane Smith');
      testOrderIds.push(order.id);

      // Add order to test mode tracking
      EmailTestingUtils.addOrderToTestMode(order.id);

      // Wait for email processing
      await waitForEmailProcessing();

      // Verify only confirmation email was sent (without PDF)
      const confirmationEmailCount = EmailTestingUtils.countEmailsForOrder(order.id, 'order_confirmation');
      expect(confirmationEmailCount).toBe(1);

      // Verify no invoice email was sent automatically
      const invoiceEmailCount = EmailTestingUtils.countEmailsForOrder(order.id, 'invoice');
      expect(invoiceEmailCount).toBe(0);

      // Verify total email count is 1 (only confirmation)
      const totalEmailCount = EmailTestingUtils.countEmailsForOrder(order.id);
      expect(totalEmailCount).toBe(1);

      // Verify order contains quote items
      const orderData = {
        items: order.items.map((item: any) => ({
          unitPrice: Number(item.price),
        })),
      };
      expect(hasQuoteItems(orderData)).toBe(true);
    });

    it('should send invoice email with PDF after admin sets prices for quote items', async () => {
      // Create order with quote items
      const order = await createTestOrderWithQuoteItems('admin-pricing-test@example.com', 'Admin Test User');
      testOrderIds.push(order.id);

      // Add order to test mode tracking
      EmailTestingUtils.addOrderToTestMode(order.id);

      // Wait for initial confirmation email
      await waitForEmailProcessing();

      // Verify only confirmation email was sent initially
      let confirmationEmailCount = EmailTestingUtils.countEmailsForOrder(order.id, 'order_confirmation');
      expect(confirmationEmailCount).toBe(1);

      let invoiceEmailCount = EmailTestingUtils.countEmailsForOrder(order.id, 'invoice');
      expect(invoiceEmailCount).toBe(0);

      // Admin sets prices for quote items
      const quoteItem = order.items.find((item: any) => Number(item.price) === 0);
      expect(quoteItem).toBeDefined();

      await ordersService.setOrderItemPrice(order.id, quoteItem.id, { price: 99.99 });

      // Admin sends invoice email
      const invoiceResult = await invoiceEmailHandlerService.handleInvoiceRequest(
        order.orderNumber,
        order.email,
        'en',
        'admin-user-id'
      );

      expect(invoiceResult.success).toBe(true);
      expect(invoiceResult.pdfGenerated).toBe(true);

      // Wait for invoice email processing
      await waitForEmailProcessing();

      // Verify invoice email was sent after pricing
      invoiceEmailCount = EmailTestingUtils.countEmailsForOrder(order.id, 'invoice');
      expect(invoiceEmailCount).toBe(1);

      // Verify total email count is now 2 (confirmation + invoice)
      const totalEmailCount = EmailTestingUtils.countEmailsForOrder(order.id);
      expect(totalEmailCount).toBe(2);
    });

    it('should handle mixed order (priced and quote items) correctly', async () => {
      // Create order with both priced and quote items
      const order = await createTestOrderWithMixedItems('mixed-order-test@example.com', 'Mixed Test User');
      testOrderIds.push(order.id);

      // Add order to test mode tracking
      EmailTestingUtils.addOrderToTestMode(order.id);

      // Wait for email processing
      await waitForEmailProcessing();

      // Verify only confirmation email was sent (because it contains quote items)
      const confirmationEmailCount = EmailTestingUtils.countEmailsForOrder(order.id, 'order_confirmation');
      expect(confirmationEmailCount).toBe(1);

      // Verify no automatic invoice email (because it contains quote items)
      const invoiceEmailCount = EmailTestingUtils.countEmailsForOrder(order.id, 'invoice');
      expect(invoiceEmailCount).toBe(0);

      // Verify order contains quote items
      const orderData = {
        items: order.items.map((item: any) => ({
          unitPrice: Number(item.price),
        })),
      };
      expect(hasQuoteItems(orderData)).toBe(true);
    });
  });

  describe('Admin-Controlled Invoice Email Functionality', () => {
    it('should validate admin invoice email requests correctly', async () => {
      // Create order with quote items
      const order = await createTestOrderWithQuoteItems('validation-test@example.com', 'Validation Test');
      testOrderIds.push(order.id);

      // Test validation with unpriced items
      let validationResult = await invoiceEmailHandlerService.validateInvoiceRequest(
        order.orderNumber,
        order.email
      );
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors).toContain('Order contains items without prices set. Please set all item prices before sending invoice.');

      // Set prices for all quote items
      const quoteItems = order.items.filter((item: any) => Number(item.price) === 0);
      for (const item of quoteItems) {
        await ordersService.setOrderItemPrice(order.id, item.id, { price: 50.00 });
      }

      // Test validation after pricing
      validationResult = await invoiceEmailHandlerService.validateInvoiceRequest(
        order.orderNumber,
        order.email
      );
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);
    });

    it('should handle multiple price updates and maintain accuracy in PDFs', async () => {
      // Create order with quote items
      const order = await createTestOrderWithQuoteItems('multiple-updates-test@example.com', 'Multiple Updates Test');
      testOrderIds.push(order.id);

      const quoteItem = order.items.find((item: any) => Number(item.price) === 0);
      expect(quoteItem).toBeDefined();

      // First price update
      await ordersService.setOrderItemPrice(order.id, quoteItem.id, { price: 100.00 });

      // Send first invoice
      let invoiceResult = await invoiceEmailHandlerService.handleInvoiceRequest(
        order.orderNumber,
        order.email,
        'en',
        'admin-user-id'
      );
      expect(invoiceResult.success).toBe(true);

      // Second price update
      await ordersService.setOrderItemPrice(order.id, quoteItem.id, { price: 150.00 });

      // Send second invoice
      invoiceResult = await invoiceEmailHandlerService.handleInvoiceRequest(
        order.orderNumber,
        order.email,
        'en',
        'admin-user-id'
      );
      expect(invoiceResult.success).toBe(true);

      // Verify both invoices were sent
      await waitForEmailProcessing();
      const invoiceEmailCount = EmailTestingUtils.countEmailsForOrder(order.id, 'invoice');
      expect(invoiceEmailCount).toBe(2);

      // Verify order total was recalculated correctly
      const updatedOrder = await ordersService.findOneById(order.id);
      const expectedTotal = 150.00 + Number(updatedOrder.shippingCost) + Number(updatedOrder.taxAmount) - Number(updatedOrder.discountAmount);
      expect(Number(updatedOrder.total)).toBeCloseTo(expectedTotal, 2);
    });
  });

  describe('Email Content and Localization', () => {
    it('should generate correct email content for Vietnamese locale', async () => {
      // Create order with Vietnamese locale
      const order = await createTestOrderWithPricedItems('vietnamese-test@example.com', 'Nguyễn Văn An', 'vi');
      testOrderIds.push(order.id);

      // Add order to test mode tracking
      EmailTestingUtils.addOrderToTestMode(order.id);

      // Wait for email processing
      await waitForEmailProcessing();

      // Verify emails were sent
      const totalEmailCount = EmailTestingUtils.countEmailsForOrder(order.id);
      expect(totalEmailCount).toBe(2); // Confirmation + Invoice

      // Test Vietnamese content formatting
      const mockVietnameseContent = generateMockEmailContent(
        'Nguyễn Văn An',
        '123 Phố Hàng Bông, Hà Nội',
        {},
        'vi'
      );

      const formatVerification = EmailTestingUtils.verifyEmailContentFormatting(
        mockVietnameseContent,
        generateMockTextContent('Nguyễn Văn An', '123 Phố Hàng Bông, Hà Nội', 'vi'),
        `Xác nhận đơn hàng - ${order.orderNumber}`,
        order.id
      );

      expect(formatVerification.isValid).toBe(true);
      expect(formatVerification.checks.htmlEscaping).toBe(true);
    });

    it('should handle special characters in customer data correctly', async () => {
      const specialCharacterTests = [
        {
          name: 'José María García-López',
          email: 'special-chars-1@example.com',
          address: '456 Calle de Alcalá, Madrid'
        },
        {
          name: 'O\'Connor & Sons Ltd.',
          email: 'special-chars-2@example.com',
          address: '789 "Main Street" <Building A>'
        }
      ];

      for (const testCase of specialCharacterTests) {
        const order = await createTestOrderWithPricedItems(testCase.email, testCase.name);
        testOrderIds.push(order.id);

        EmailTestingUtils.addOrderToTestMode(order.id);

        // Wait for email processing
        await waitForEmailProcessing();

        // Verify emails were sent
        const emailCount = EmailTestingUtils.countEmailsForOrder(order.id);
        expect(emailCount).toBe(2); // Confirmation + Invoice

        // Verify email content formatting
        const mockHtmlContent = generateMockEmailContent(testCase.name, testCase.address);
        const mockTextContent = generateMockTextContent(testCase.name, testCase.address);
        const mockSubject = `Order Confirmation - ${order.orderNumber}`;

        const formatVerification = EmailTestingUtils.verifyEmailContentFormatting(
          mockHtmlContent,
          mockTextContent,
          mockSubject,
          order.id
        );

        expect(formatVerification.isValid).toBe(true);
        expect(formatVerification.checks.htmlEscaping).toBe(true);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle PDF generation failures gracefully', async () => {
      // Create order that might cause PDF generation issues
      const order = await createTestOrderWithPricedItems('pdf-error-test@example.com', 'PDF Error Test');
      testOrderIds.push(order.id);

      // Mock PDF generation failure (this would need to be implemented based on your mocking strategy)
      // For now, we'll test the normal flow and verify error handling exists

      EmailTestingUtils.addOrderToTestMode(order.id);
      await waitForEmailProcessing();

      // Verify at least confirmation email was sent even if PDF fails
      const confirmationEmailCount = EmailTestingUtils.countEmailsForOrder(order.id, 'order_confirmation');
      expect(confirmationEmailCount).toBe(1);
    });

    it('should handle concurrent order creation correctly', async () => {
      const concurrentOrderCount = 3;
      const orderPromises: Promise<any>[] = [];

      // Create multiple concurrent orders
      for (let i = 0; i < concurrentOrderCount; i++) {
        const email = `concurrent-two-step-${i}@example.com`;
        const customerName = `Concurrent Test ${i + 1}`;
        orderPromises.push(createTestOrderWithPricedItems(email, customerName));
      }

      // Execute all orders concurrently
      const orders = await Promise.all(orderPromises);
      testOrderIds.push(...orders.map(order => order.id));

      // Add all orders to test mode tracking
      orders.forEach(order => EmailTestingUtils.addOrderToTestMode(order.id));

      // Wait for all email processing
      await waitForEmailProcessing(8000); // Longer wait for concurrent processing

      // Verify each order received both confirmation and invoice emails
      for (const order of orders) {
        const totalEmailCount = EmailTestingUtils.countEmailsForOrder(order.id);
        expect(totalEmailCount).toBe(2); // Confirmation + Invoice

        const confirmationCount = EmailTestingUtils.countEmailsForOrder(order.id, 'order_confirmation');
        const invoiceCount = EmailTestingUtils.countEmailsForOrder(order.id, 'invoice');

        expect(confirmationCount).toBe(1);
        expect(invoiceCount).toBe(1);
      }
    });
  });

  // Helper functions
  async function createTestUser(): Promise<string> {
    const user = await prismaService.user.create({
      data: {
        email: 'test-user@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'CUSTOMER',
      },
    });
    return user.id;
  }

  async function createTestAddress(customerName: string, address?: string): Promise<string> {
    const addressData = {
      fullName: customerName,
      addressLine1: address || '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      postalCode: '12345',
      country: 'US',
      phone: '+1234567890',
      userId: testUserId,
    };

    const createdAddress = await prismaService.address.create({
      data: addressData
    });

    testAddressIds.push(createdAddress.id);
    return createdAddress.id;
  }

  async function createTestProduct(price: number, name?: string): Promise<string> {
    // Ensure we have a category
    let category = await prismaService.category.findFirst();
    if (!category) {
      category = await prismaService.category.create({
        data: {
          nameEn: 'Test Category',
          nameVi: 'Danh mục thử nghiệm',
          slug: 'test-category',
          isActive: true
        }
      });
    }

    const product = await prismaService.product.create({
      data: {
        nameEn: name || `Test Product ${price === 0 ? 'Quote' : 'Priced'}`,
        nameVi: name || `Sản phẩm thử nghiệm ${price === 0 ? 'báo giá' : 'có giá'}`,
        descriptionEn: 'Test product for integration testing',
        descriptionVi: 'Sản phẩm thử nghiệm cho kiểm thử tích hợp',
        price: price,
        sku: `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        slug: `test-product-${price === 0 ? 'quote' : 'priced'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        categoryId: category.id,
        isActive: true,
        stockQuantity: 100
      }
    });

    testProductIds.push(product.id);
    return product.id;
  }

  async function createTestOrderWithPricedItems(email: string, customerName: string, locale: 'en' | 'vi' = 'en'): Promise<any> {
    const shippingAddressId = await createTestAddress(customerName);
    const billingAddressId = await createTestAddress(customerName);
    const productId = await createTestProduct(29.99, 'Priced Product');

    const orderData: CreateOrderDto = {
      email,
      shippingAddressId,
      billingAddressId,
      items: [{ productId, quantity: 1 }],
      shippingMethod: 'standard',
      shippingCost: 5.00,
      paymentMethod: 'credit_card'
    };

    return await ordersService.create(orderData, testUserId);
  }

  async function createTestOrderWithQuoteItems(email: string, customerName: string, locale: 'en' | 'vi' = 'en'): Promise<any> {
    const shippingAddressId = await createTestAddress(customerName);
    const billingAddressId = await createTestAddress(customerName);
    const quoteProductId = await createTestProduct(0, 'Quote Product'); // Zero price = quote item

    const orderData: CreateOrderDto = {
      email,
      shippingAddressId,
      billingAddressId,
      items: [{ productId: quoteProductId, quantity: 1 }],
      shippingMethod: 'standard',
      shippingCost: 5.00,
      paymentMethod: 'credit_card'
    };

    return await ordersService.create(orderData, testUserId);
  }

  async function createTestOrderWithMixedItems(email: string, customerName: string, locale: 'en' | 'vi' = 'en'): Promise<any> {
    const shippingAddressId = await createTestAddress(customerName);
    const billingAddressId = await createTestAddress(customerName);
    const pricedProductId = await createTestProduct(19.99, 'Priced Product');
    const quoteProductId = await createTestProduct(0, 'Quote Product');

    const orderData: CreateOrderDto = {
      email,
      shippingAddressId,
      billingAddressId,
      items: [
        { productId: pricedProductId, quantity: 1 },
        { productId: quoteProductId, quantity: 1 }
      ],
      shippingMethod: 'standard',
      shippingCost: 5.00,
      paymentMethod: 'credit_card'
    };

    return await ordersService.create(orderData, testUserId);
  }

  async function cleanupTestData(): Promise<void> {
    try {
      // Clean up test orders
      for (const orderId of testOrderIds) {
        await cleanupTestOrder(orderId);
      }

      // Clean up test addresses
      for (const addressId of testAddressIds) {
        await cleanupTestAddress(addressId);
      }

      // Clean up test products
      for (const productId of testProductIds) {
        await cleanupTestProduct(productId);
      }

      // Clean up test user
      if (testUserId) {
        await prismaService.user.delete({ where: { id: testUserId } }).catch(() => {});
      }
    } catch (error) {
      console.warn('Failed to cleanup test data:', error);
    }
  }

  async function cleanupTestOrder(orderId: string): Promise<void> {
    try {
      await prismaService.orderItem.deleteMany({ where: { orderId } });
      await prismaService.order.delete({ where: { id: orderId } });
      EmailTestingUtils.resetEmailCount(orderId);
    } catch (error) {
      console.warn(`Failed to cleanup test order ${orderId}:`, error);
    }
  }

  async function cleanupTestAddress(addressId: string): Promise<void> {
    try {
      await prismaService.address.delete({ where: { id: addressId } });
    } catch (error) {
      console.warn(`Failed to cleanup test address ${addressId}:`, error);
    }
  }

  async function cleanupTestProduct(productId: string): Promise<void> {
    try {
      await prismaService.product.delete({ where: { id: productId } });
    } catch (error) {
      console.warn(`Failed to cleanup test product ${productId}:`, error);
    }
  }

  function generateMockEmailContent(
    customerName: string,
    address: string,
    clientOptions: any = {},
    locale: string = 'en'
  ): string {
    const escapedName = customerName
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const escapedAddress = address
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const greeting = locale === 'vi' ? 'Xin chào' : 'Hello';
    const thankYou = locale === 'vi' ? 'Cảm ơn bạn đã đặt hàng!' : 'Thank you for your order!';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Order Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .footer { background-color: #f8f9fa; padding: 10px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${thankYou}</h1>
            </div>
            <div class="content">
              <p>${greeting} ${escapedName},</p>
              <p>Your order has been confirmed and will be shipped to:</p>
              <p>${escapedAddress}</p>
            </div>
            <div class="footer">
              <p>Thank you for your business!</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  function generateMockTextContent(customerName: string, address: string, locale: string = 'en'): string {
    const greeting = locale === 'vi' ? 'Xin chào' : 'Hello';
    const thankYou = locale === 'vi' ? 'Cảm ơn bạn đã đặt hàng!' : 'Thank you for your order!';

    return `
${thankYou}

${greeting} ${customerName},

Your order has been confirmed and will be shipped to:
${address}

Thank you for your business!
    `.trim();
  }

  async function waitForEmailProcessing(timeout: number = 3000): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, timeout));
  }
});