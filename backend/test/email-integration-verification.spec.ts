import { EmailTestingUtils } from '../src/common/utils/email-testing.utils';

/**
 * Email Integration Verification Tests
 *
 * Tests the email testing utilities and verification functions
 * that support the integration testing requirements.
 *
 * Requirements: 2.5, 4.5, 2.4, 4.4
 */
describe('Email Integration Verification', () => {
  beforeEach(() => {
    EmailTestingUtils.clearAllData();
    EmailTestingUtils.enableTestMode();
  });

  afterEach(() => {
    EmailTestingUtils.disableTestMode();
    EmailTestingUtils.clearAllData();
  });

  describe('7.1 Email Content Formatting Verification', () => {
    it('should verify HTML escaping for special characters', () => {
      const testCases = [
        {
          name: 'Nguyễn Văn Đức',
          address: '123 Phố Hàng Bông, Quận Hoàn Kiếm',
          expectedEscaping: true
        },
        {
          name: 'José María García-López',
          address: '456 Calle de Alcalá, Madrid',
          expectedEscaping: true
        },
        {
          name: 'O\'Connor & Sons Ltd.',
          address: '789 "Main Street" <Building A>',
          expectedEscaping: true
        },
        {
          name: 'Test & Co. "Premium" <Services>',
          address: 'Unit #5 @ 123 Market St. & Co.',
          expectedEscaping: true
        }
      ];

      for (const testCase of testCases) {
        const htmlContent = generateTestEmailContent(testCase.name, testCase.address);
        const textContent = generateTestTextContent(testCase.name, testCase.address);
        const subject = `Order Confirmation - ORD-${Date.now()}`;

        const verification = EmailTestingUtils.verifyEmailContentFormatting(
          htmlContent,
          textContent,
          subject,
          'test-order-id'
        );

        expect(verification.isValid).toBe(true);
        expect(verification.checks.htmlEscaping).toBe(testCase.expectedEscaping);
        expect(verification.checks.cssFormatting).toBe(true);
        expect(verification.checks.htmlStructure).toBe(true);
        expect(verification.checks.textContentPresent).toBe(true);
        expect(verification.checks.subjectValid).toBe(true);
      }
    });

    it('should verify email formatting for different email clients', () => {
      const emailClientScenarios = [
        {
          name: 'Gmail Web Client',
          content: generateEmailClientContent('Gmail Test', '123 Test St', {
            maxLineLength: 998,
            supportsCSSGrid: true,
            supportsWebFonts: true
          })
        },
        {
          name: 'Outlook Desktop',
          content: generateEmailClientContent('Outlook Test', '123 Test St', {
            maxLineLength: 76,
            supportsCSSGrid: false,
            supportsWebFonts: false
          })
        },
        {
          name: 'Apple Mail',
          content: generateEmailClientContent('Apple Test', '123 Test St', {
            maxLineLength: 998,
            supportsCSSGrid: true,
            supportsWebFonts: true
          })
        },
        {
          name: 'Mobile Email Client',
          content: generateEmailClientContent('Mobile Test', '123 Test St', {
            maxLineLength: 78,
            supportsCSSGrid: false,
            supportsWebFonts: false
          })
        }
      ];

      for (const scenario of emailClientScenarios) {
        const verification = EmailTestingUtils.verifyEmailContentFormatting(
          scenario.content,
          generateTestTextContent('Test Customer', '123 Test St'),
          'Order Confirmation - ORD-123',
          'test-order-id'
        );

        expect(verification.isValid).toBe(true);
        expect(verification.errors.length).toBe(0);

        // Should have minimal warnings for email client compatibility
        expect(verification.warnings.length).toBeLessThanOrEqual(2);
      }
    });

    it('should verify Vietnamese locale content formatting', () => {
      const vietnameseContent = generateTestEmailContent(
        'Nguyễn Văn An',
        '123 Phố Hàng Bông, Hà Nội',
        'vi'
      );

      const vietnameseTextContent = generateTestTextContent(
        'Nguyễn Văn An',
        '123 Phố Hàng Bông, Hà Nội',
        'vi'
      );

      const verification = EmailTestingUtils.verifyEmailContentFormatting(
        vietnameseContent,
        vietnameseTextContent,
        'Xác nhận đơn hàng - ORD-123',
        'test-order-id'
      );

      expect(verification.isValid).toBe(true);
      expect(verification.checks.htmlEscaping).toBe(true);
      expect(verification.checks.htmlStructure).toBe(true);
    });
  });

  describe('7.2 Email Count Tracking and Deduplication Verification', () => {
    it('should track email counts correctly for multiple orders', () => {
      const orderIds = ['order-1', 'order-2', 'order-3'];

      // Simulate sending emails for different orders
      orderIds.forEach(orderId => {
        EmailTestingUtils.incrementEmailCount(orderId, 'order_confirmation');
      });

      // Verify each order has exactly 1 email
      orderIds.forEach(orderId => {
        const count = EmailTestingUtils.countEmailsForOrder(orderId);
        expect(count).toBe(1);
      });

      // Verify total tracking
      const allCounts = EmailTestingUtils.getAllEmailCounts();
      expect(allCounts.size).toBe(3);
      orderIds.forEach(orderId => {
        expect(allCounts.get(orderId)).toBe(1);
      });
    });

    it('should detect duplicate emails correctly', () => {
      const orderId = 'duplicate-test-order';

      // Add order to test mode
      EmailTestingUtils.addOrderToTestMode(orderId);

      // Simulate first email
      EmailTestingUtils.incrementEmailCount(orderId, 'order_confirmation');
      let report = EmailTestingUtils.getTestReport(orderId);
      expect(report.status).toBe('SUCCESS');
      expect(report.emailCount).toBe(1);

      // Simulate duplicate email
      EmailTestingUtils.incrementEmailCount(orderId, 'order_confirmation');
      report = EmailTestingUtils.getTestReport(orderId);
      expect(report.status).toBe('DUPLICATE_DETECTED');
      expect(report.emailCount).toBe(2);
      expect(report.recommendations).toContain('2 emails sent - investigate duplicate email issue');
    });

    it('should provide comprehensive test reports', () => {
      const orderId = 'test-report-order';

      // Enable test mode and add order
      EmailTestingUtils.addOrderToTestMode(orderId);

      // Simulate successful email
      EmailTestingUtils.incrementEmailCount(orderId, 'order_confirmation');

      const report = EmailTestingUtils.getTestReport(orderId);

      expect(report.orderId).toBe(orderId);
      expect(report.emailCount).toBe(1);
      expect(report.isInTestMode).toBe(true);
      expect(report.testModeEnabled).toBe(true);
      expect(report.status).toBe('SUCCESS');
      expect(report.recommendations).toContain('Email count is correct (1 email sent)');
      expect(report.timestamp).toBeDefined();
    });

    it('should handle concurrent email tracking correctly', () => {
      const concurrentOrderCount = 5;
      const orderIds: string[] = [];

      // Create multiple order IDs
      for (let i = 0; i < concurrentOrderCount; i++) {
        orderIds.push(`concurrent-order-${i}`);
      }

      // Add all to test mode
      orderIds.forEach(orderId => {
        EmailTestingUtils.addOrderToTestMode(orderId);
      });

      // Simulate concurrent email sending
      orderIds.forEach(orderId => {
        EmailTestingUtils.incrementEmailCount(orderId, 'order_confirmation');
      });

      // Verify each order has exactly 1 email
      orderIds.forEach(orderId => {
        const count = EmailTestingUtils.countEmailsForOrder(orderId);
        expect(count).toBe(1);

        const report = EmailTestingUtils.getTestReport(orderId);
        expect(report.status).toBe('SUCCESS');
      });

      // Verify total count
      const totalEmails = orderIds.reduce((sum, orderId) => {
        return sum + EmailTestingUtils.countEmailsForOrder(orderId);
      }, 0);
      expect(totalEmails).toBe(concurrentOrderCount);
    });

    it('should monitor performance metrics', () => {
      const startTime = Date.now();
      const orderCount = 10;
      const orderIds: string[] = [];

      // Create multiple orders rapidly
      for (let i = 0; i < orderCount; i++) {
        const orderId = `perf-test-order-${i}`;
        orderIds.push(orderId);
        EmailTestingUtils.addOrderToTestMode(orderId);
        EmailTestingUtils.incrementEmailCount(orderId, 'order_confirmation');
      }

      const processingTime = Date.now() - startTime;

      // Verify all emails tracked correctly
      orderIds.forEach(orderId => {
        const count = EmailTestingUtils.countEmailsForOrder(orderId);
        expect(count).toBe(1);
      });

      // Performance assertions (should be very fast for in-memory operations)
      expect(processingTime).toBeLessThan(1000); // 1 second for 10 operations

      // Log performance metrics
      console.log(`Performance Test Metrics:`);
      console.log(`- Orders processed: ${orderCount}`);
      console.log(`- Total processing time: ${processingTime}ms`);
      console.log(`- Average time per order: ${processingTime / orderCount}ms`);
    });
  });

  describe('Test Mode and Logging Verification', () => {
    it('should enable and disable test mode correctly', () => {
      expect(EmailTestingUtils.isTestModeEnabled()).toBe(true);

      EmailTestingUtils.disableTestMode();
      expect(EmailTestingUtils.isTestModeEnabled()).toBe(false);

      EmailTestingUtils.enableTestMode(['test-order-1', 'test-order-2']);
      expect(EmailTestingUtils.isTestModeEnabled()).toBe(true);
    });

    it('should track orders in test mode', () => {
      const testOrderIds = ['test-order-1', 'test-order-2'];

      EmailTestingUtils.enableTestMode(testOrderIds);

      testOrderIds.forEach(orderId => {
        EmailTestingUtils.incrementEmailCount(orderId, 'order_confirmation');
        const report = EmailTestingUtils.getTestReport(orderId);
        expect(report.isInTestMode).toBe(true);
      });

      // Test adding order to test mode
      const newOrderId = 'new-test-order';
      EmailTestingUtils.addOrderToTestMode(newOrderId);
      EmailTestingUtils.incrementEmailCount(newOrderId, 'order_confirmation');

      const report = EmailTestingUtils.getTestReport(newOrderId);
      expect(report.isInTestMode).toBe(true);
    });
  });

  // Helper functions for generating test content
  function generateTestEmailContent(customerName: string, address: string, locale: string = 'en'): string {
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

  function generateTestTextContent(customerName: string, address: string, locale: string = 'en'): string {
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

  function generateEmailClientContent(customerName: string, address: string, clientOptions: any): string {
    const { maxLineLength, supportsCSSGrid, supportsWebFonts } = clientOptions;

    const fontFamily = supportsWebFonts ? 'Arial, Helvetica, sans-serif' : 'Arial, sans-serif';
    const layoutStyle = supportsCSSGrid ? 'display: grid; grid-template-columns: 1fr;' : 'display: block;';

    let content = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Order Confirmation</title>
          <style>
            body { font-family: ${fontFamily}; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; ${layoutStyle} }
            .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
            .content { padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Thank you for your order!</h1>
            </div>
            <div class="content">
              <p>Hello ${customerName},</p>
              <p>Your order will be shipped to: ${address}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Simulate line length restrictions for certain email clients
    if (maxLineLength < 100) {
      content = content.replace(/(.{60})/g, '$1\n');
    }

    return content;
  }
});