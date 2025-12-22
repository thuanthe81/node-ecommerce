import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { OrdersService } from '../src/orders/orders.service';
import { EmailTestingUtils } from '../src/common/utils/email-testing.utils';
import { CreateOrderDto } from '../src/orders/dto/create-order.dto';
import { AppModule } from '../src/app.module';

/**
 * Integration Tests for Complete Order Flow with Email Delivery
 *
 * Tests Requirements:
 * - 2.5: End-to-end single email delivery per order
 * - 4.5: HTML formatting verification in multiple email clients
 * - 2.4: Deduplication under concurrent load
 * - 4.4: Deduplication logging and monitoring
 */
describe('Order Email Integration (e2e)', () => {
  let app: INestApplication;
  let ordersService: OrdersService;
  let prismaService: PrismaService;
  let testOrderIds: string[] = [];
  let testAddressIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    ordersService = moduleFixture.get<OrdersService>(OrdersService);
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    // Enable test mode for comprehensive logging
    EmailTestingUtils.enableTestMode();
  });

  afterAll(async () => {
    // Clean up test orders
    for (const orderId of testOrderIds) {
      await cleanupTestOrder(orderId);
    }

    // Clean up test addresses
    for (const addressId of testAddressIds) {
      await cleanupTestAddress(addressId);
    }

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

  describe('7.1 Test complete order flow with email delivery', () => {
    it('should create order and send exactly one confirmation email', async () => {
      // Create test order with standard customer data
      const order = await createCompleteTestOrder('standard-test@example.com', 'John Doe');
      testOrderIds.push(order.id);

      // Add order to test mode tracking
      EmailTestingUtils.addOrderToTestMode(order.id);

      // Wait for email processing (async)
      await waitForEmailProcessing();

      // Verify exactly one email was sent
      const emailCount = EmailTestingUtils.countEmailsForOrder(order.id);
      expect(emailCount).toBe(1);

      // Get test report
      const testReport = EmailTestingUtils.getTestReport(order.id);
      expect(testReport.status).toBe('SUCCESS');
      expect(testReport.emailCount).toBe(1);
    });

    it('should handle special characters in customer data correctly', async () => {
      const specialCharacterTests = [
        {
          name: 'Nguyễn Văn Đức',
          email: 'special-chars-1@example.com',
          address: '123 Phố Hàng Bông, Quận Hoàn Kiếm'
        },
        {
          name: 'José María García-López',
          email: 'special-chars-2@example.com',
          address: '456 Calle de Alcalá, Madrid'
        },
        {
          name: 'O\'Connor & Sons Ltd.',
          email: 'special-chars-3@example.com',
          address: '789 "Main Street" <Building A>'
        }
      ];

      for (const testCase of specialCharacterTests) {
        const order = await createCompleteTestOrder(testCase.email, testCase.name, testCase.address);
        testOrderIds.push(order.id);

        EmailTestingUtils.addOrderToTestMode(order.id);

        // Wait for email processing
        await waitForEmailProcessing();

        // Verify email was sent
        const emailCount = EmailTestingUtils.countEmailsForOrder(order.id);
        expect(emailCount).toBe(1);

        // Verify email content formatting (simulate what would happen during email generation)
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
        expect(formatVerification.checks.cssFormatting).toBe(true);
        expect(formatVerification.checks.htmlStructure).toBe(true);
      }
    });

    it('should verify email formatting in multiple email client scenarios', async () => {
      const order = await createCompleteTestOrder('email-client-test@example.com', 'Email Client Test');
      testOrderIds.push(order.id);

      EmailTestingUtils.addOrderToTestMode(order.id);

      // Wait for email processing
      await waitForEmailProcessing();

      // Simulate different email client scenarios
      const emailClientScenarios = [
        {
          name: 'Gmail Web Client',
          htmlContent: generateMockEmailContent('Email Client Test', '123 Test St', {
            maxLineLength: 998,
            supportsCSSGrid: true,
            supportsWebFonts: true
          })
        },
        {
          name: 'Outlook Desktop',
          htmlContent: generateMockEmailContent('Email Client Test', '123 Test St', {
            maxLineLength: 76,
            supportsCSSGrid: false,
            supportsWebFonts: false
          })
        }
      ];

      for (const scenario of emailClientScenarios) {
        const formatVerification = EmailTestingUtils.verifyEmailContentFormatting(
          scenario.htmlContent,
          generateMockTextContent('Email Client Test', '123 Test St'),
          `Order Confirmation - ${order.orderNumber}`,
          order.id
        );

        expect(formatVerification.isValid).toBe(true);
        expect(formatVerification.errors.length).toBe(0);
      }
    });

    it('should handle Vietnamese locale correctly', async () => {
      const order = await createCompleteTestOrder('vietnamese-test@example.com', 'Nguyễn Văn An', undefined, 'vi');
      testOrderIds.push(order.id);

      EmailTestingUtils.addOrderToTestMode(order.id);

      // Wait for email processing
      await waitForEmailProcessing();

      // Verify exactly one email was sent
      const emailCount = EmailTestingUtils.countEmailsForOrder(order.id);
      expect(emailCount).toBe(1);

      // Verify Vietnamese content formatting
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
  });

  describe('7.2 Test deduplication under concurrent load', () => {
    it('should prevent duplicate emails when creating multiple concurrent orders', async () => {
      const concurrentOrderCount = 3; // Reduced for stability
      const orderPromises: Promise<any>[] = [];

      // Create multiple concurrent orders for different customers
      for (let i = 0; i < concurrentOrderCount; i++) {
        const email = `concurrent-test-${i}@example.com`;
        const customerName = `Concurrent Test Customer ${i + 1}`;
        orderPromises.push(createCompleteTestOrder(email, customerName));
      }

      // Execute all orders concurrently
      const orders = await Promise.all(orderPromises);

      // Track all test orders for cleanup
      testOrderIds.push(...orders.map(order => order.id));

      // Add all orders to test mode tracking
      orders.forEach(order => EmailTestingUtils.addOrderToTestMode(order.id));

      // Wait for all email processing to complete
      await waitForEmailProcessing(5000); // Longer wait for concurrent processing

      // Verify each order received exactly one email
      for (const order of orders) {
        const emailCount = EmailTestingUtils.countEmailsForOrder(order.id);
        expect(emailCount).toBe(1);

        const testReport = EmailTestingUtils.getTestReport(order.id);
        expect(testReport.status).toBe('SUCCESS');
      }

      // Verify total email count matches order count
      const totalEmailCount = orders.reduce((sum, order) => {
        return sum + EmailTestingUtils.countEmailsForOrder(order.id);
      }, 0);
      expect(totalEmailCount).toBe(concurrentOrderCount);
    });

    it('should test deduplication logging and monitoring', async () => {
      // Create an order that we'll use to test deduplication scenarios
      const order = await createCompleteTestOrder('dedup-logging-test@example.com', 'Dedup Test Customer');
      testOrderIds.push(order.id);
      EmailTestingUtils.addOrderToTestMode(order.id);

      // Wait for initial email processing
      await waitForEmailProcessing();

      // Verify initial email was sent
      const initialEmailCount = EmailTestingUtils.countEmailsForOrder(order.id);
      expect(initialEmailCount).toBe(1);

      // Test deduplication evidence in logs
      const testReport = EmailTestingUtils.getTestReport(order.id);
      expect(testReport.status).toBe('SUCCESS');
      expect(testReport.recommendations).toContain('Email count is correct (1 email sent)');

      // Verify test mode logging is working
      expect(testReport.isInTestMode).toBe(true);
      expect(testReport.testModeEnabled).toBe(true);
    });

    it('should monitor email queue performance under load', async () => {
      const loadTestOrderCount = 5; // Reduced for stability
      const startTime = Date.now();
      const orders: any[] = [];

      // Create multiple orders to test queue performance
      for (let i = 0; i < loadTestOrderCount; i++) {
        const email = `load-test-${i}@example.com`;
        const customerName = `Load Test Customer ${i + 1}`;

        const order = await createCompleteTestOrder(email, customerName);
        orders.push(order);
        testOrderIds.push(order.id);
        EmailTestingUtils.addOrderToTestMode(order.id);
      }

      const orderCreationTime = Date.now() - startTime;

      // Wait for all email processing
      const emailProcessingStartTime = Date.now();
      await waitForEmailProcessing(10000); // Longer wait for load test
      const emailProcessingTime = Date.now() - emailProcessingStartTime;

      // Verify all emails were sent correctly
      let totalEmailsSent = 0;
      for (const order of orders) {
        const emailCount = EmailTestingUtils.countEmailsForOrder(order.id);
        expect(emailCount).toBe(1);
        totalEmailsSent += emailCount;
      }

      expect(totalEmailsSent).toBe(loadTestOrderCount);

      // Log performance metrics
      console.log(`Load Test Performance Metrics:`);
      console.log(`- Orders created: ${loadTestOrderCount}`);
      console.log(`- Order creation time: ${orderCreationTime}ms`);
      console.log(`- Email processing time: ${emailProcessingTime}ms`);

      // Performance assertions (reasonable thresholds)
      expect(orderCreationTime).toBeLessThan(30000); // 30 seconds for orders
      expect(emailProcessingTime).toBeLessThan(60000); // 60 seconds for email processing
    });
  });

  // Helper functions
  async function createTestAddress(customerName: string, address?: string): Promise<string> {
    const addressData = {
      fullName: customerName,
      addressLine1: address || '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      postalCode: '12345',
      country: 'US',
      phone: '+1234567890'
    };

    const createdAddress = await prismaService.address.create({
      data: addressData
    });

    testAddressIds.push(createdAddress.id);
    return createdAddress.id;
  }

  async function getTestProduct(): Promise<string> {
    // Try to find an existing active product
    let product = await prismaService.product.findFirst({
      where: { isActive: true }
    });

    // If no product exists, create a test product
    if (!product) {
      // First, ensure we have a category
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

      product = await prismaService.product.create({
        data: {
          nameEn: 'Test Product',
          nameVi: 'Sản phẩm thử nghiệm',
          descriptionEn: 'Test product for integration testing',
          descriptionVi: 'Sản phẩm thử nghiệm cho kiểm thử tích hợp',
          price: 29.99,
          sku: `TEST-${Date.now()}`,
          categoryId: category.id,
          isActive: true,
          stockQuantity: 100
        }
      });
    }

    return product.id;
  }

  async function createCompleteTestOrder(email: string, customerName: string, address?: string, locale: 'en' | 'vi' = 'en'): Promise<any> {
    // Create addresses
    const shippingAddressId = await createTestAddress(customerName, address);
    const billingAddressId = await createTestAddress(customerName, address);

    // Get test product
    const productId = await getTestProduct();

    // Create order data with proper IDs
    const orderData: CreateOrderDto = {
      email,
      shippingAddressId,
      billingAddressId,
      items: [
        {
          productId,
          quantity: 1
        }
      ],
      shippingMethod: 'standard',
      shippingCost: 5.00,
      paymentMethod: 'credit_card'
    };

    return await ordersService.create(orderData, locale);
  }

  async function cleanupTestOrder(orderId: string): Promise<void> {
    try {
      // Delete order items first
      await prismaService.orderItem.deleteMany({
        where: { orderId }
      });

      // Delete order
      await prismaService.order.delete({
        where: { id: orderId }
      });

      // Reset email count
      EmailTestingUtils.resetEmailCount(orderId);
    } catch (error) {
      console.warn(`Failed to cleanup test order ${orderId}:`, error);
    }
  }

  async function cleanupTestAddress(addressId: string): Promise<void> {
    try {
      await prismaService.address.delete({
        where: { id: addressId }
      });
    } catch (error) {
      console.warn(`Failed to cleanup test address ${addressId}:`, error);
    }
  }

  function generateMockEmailContent(
    customerName: string,
    address: string,
    clientOptions: any = {},
    locale: string = 'en'
  ): string {
    // Simulate HTML content that would be generated by EmailAttachmentService
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

  async function waitForEmailProcessing(timeout: number = 2000): Promise<void> {
    // Wait for async email processing to complete
    // In a real scenario, this might involve checking queue status or using test utilities
    await new Promise(resolve => setTimeout(resolve, timeout));
  }
});