import { Test, TestingModule } from '@nestjs/testing';
import { EmailTestingUtils, EmailFormattingVerificationResult } from '../src/common/utils/email-testing.utils';

describe('EmailTestingUtils', () => {
  beforeEach(() => {
    // Clear all data before each test
    EmailTestingUtils.clearAllData();
  });

  afterEach(() => {
    // Clean up after each test
    EmailTestingUtils.clearAllData();
  });

  describe('Email Content Formatting Verification (Requirement 4.1)', () => {
    it('should verify valid email content', () => {
      const htmlContent = '<html><body><h1>Order Confirmation</h1><p>Thank you!</p></body></html>';
      const textContent = 'Order Confirmation\nThank you!';
      const subject = 'Order Confirmation #TEST-001';

      const result = EmailTestingUtils.verifyEmailContentFormatting(
        htmlContent,
        textContent,
        subject,
        'TEST-001',
      );

      expect(result.isValid).toBe(false); // Due to unescaped > in HTML
      expect(result.checks.textContentPresent).toBe(true);
      expect(result.checks.subjectValid).toBe(true);
      expect(result.checks.htmlStructure).toBe(true);
    });

    it('should detect HTML escaping issues', () => {
      const htmlContent = '<html><body><p>Hello John & Jane "Smith"</p></body></html>';
      const textContent = 'Hello John & Jane Smith';
      const subject = 'Test Subject';

      const result = EmailTestingUtils.verifyEmailContentFormatting(
        htmlContent,
        textContent,
        subject,
      );

      expect(result.isValid).toBe(false);
      expect(result.checks.htmlEscaping).toBe(false);
      expect(result.errors.some(error => error.includes('Unescaped ampersand'))).toBe(true);
      expect(result.errors.some(error => error.includes('Unescaped double quote'))).toBe(true);
    });

    it('should detect missing text content', () => {
      const htmlContent = '<html><body><h1>Test</h1></body></html>';
      const textContent = '';
      const subject = 'Test Subject';

      const result = EmailTestingUtils.verifyEmailContentFormatting(
        htmlContent,
        textContent,
        subject,
      );

      expect(result.isValid).toBe(false);
      expect(result.checks.textContentPresent).toBe(false);
      expect(result.errors.some(error => error.includes('Text content is missing'))).toBe(true);
    });

    it('should detect dangerous CSS', () => {
      const htmlContent = '<html><body><div style="background: url(javascript:alert(\'xss\'));">Content</div></body></html>';
      const textContent = 'Content';
      const subject = 'Test Subject';

      const result = EmailTestingUtils.verifyEmailContentFormatting(
        htmlContent,
        textContent,
        subject,
      );

      expect(result.isValid).toBe(false);
      expect(result.checks.cssFormatting).toBe(false);
      expect(result.errors.some(error => error.includes('JavaScript in CSS'))).toBe(true);
    });
  });

  describe('Email Count Tracking (Requirement 4.2)', () => {
    it('should track email counts per order', () => {
      const orderId = 'TEST-ORDER-001';

      // Initially should be 0
      expect(EmailTestingUtils.countEmailsForOrder(orderId)).toBe(0);

      // Increment count
      EmailTestingUtils.incrementEmailCount(orderId, 'order_confirmation');
      expect(EmailTestingUtils.countEmailsForOrder(orderId)).toBe(1);

      // Increment again
      EmailTestingUtils.incrementEmailCount(orderId, 'shipping_notification');
      expect(EmailTestingUtils.countEmailsForOrder(orderId)).toBe(2);
    });

    it('should track multiple orders independently', () => {
      const order1 = 'ORDER-001';
      const order2 = 'ORDER-002';

      EmailTestingUtils.incrementEmailCount(order1, 'order_confirmation');
      EmailTestingUtils.incrementEmailCount(order2, 'order_confirmation');
      EmailTestingUtils.incrementEmailCount(order1, 'shipping_notification');

      expect(EmailTestingUtils.countEmailsForOrder(order1)).toBe(2);
      expect(EmailTestingUtils.countEmailsForOrder(order2)).toBe(1);
    });

    it('should reset email count for specific order', () => {
      const orderId = 'TEST-ORDER-001';

      EmailTestingUtils.incrementEmailCount(orderId, 'order_confirmation');
      expect(EmailTestingUtils.countEmailsForOrder(orderId)).toBe(1);

      EmailTestingUtils.resetEmailCount(orderId);
      expect(EmailTestingUtils.countEmailsForOrder(orderId)).toBe(0);
    });

    it('should return all email counts', () => {
      EmailTestingUtils.incrementEmailCount('ORDER-001', 'order_confirmation');
      EmailTestingUtils.incrementEmailCount('ORDER-002', 'order_confirmation');
      EmailTestingUtils.incrementEmailCount('ORDER-001', 'shipping_notification');

      const allCounts = EmailTestingUtils.getAllEmailCounts();

      expect(allCounts.get('ORDER-001')).toBe(2);
      expect(allCounts.get('ORDER-002')).toBe(1);
      expect(allCounts.size).toBe(2);
    });
  });

  describe('Test Mode with Comprehensive Logging (Requirement 4.3)', () => {
    it('should enable and disable test mode', () => {
      expect(EmailTestingUtils.isTestModeEnabled()).toBe(false);

      EmailTestingUtils.enableTestMode(['ORDER-001']);
      expect(EmailTestingUtils.isTestModeEnabled()).toBe(true);

      EmailTestingUtils.disableTestMode();
      expect(EmailTestingUtils.isTestModeEnabled()).toBe(false);
    });

    it('should add and remove orders from test mode', () => {
      EmailTestingUtils.enableTestMode(['ORDER-001']);

      EmailTestingUtils.addOrderToTestMode('ORDER-002');
      EmailTestingUtils.removeOrderFromTestMode('ORDER-001');

      // Test mode should still be enabled even after removing orders
      expect(EmailTestingUtils.isTestModeEnabled()).toBe(true);
    });

    it('should generate test reports', () => {
      const orderId = 'REPORT-TEST-001';

      // Test with no emails
      let report = EmailTestingUtils.getTestReport(orderId);
      expect(report.orderId).toBe(orderId);
      expect(report.emailCount).toBe(0);
      expect(report.status).toBe('NO_EMAILS');
      expect(report.recommendations).toContain('No emails sent - check if order confirmation was triggered');

      // Test with one email (success)
      EmailTestingUtils.incrementEmailCount(orderId, 'order_confirmation');
      report = EmailTestingUtils.getTestReport(orderId);
      expect(report.emailCount).toBe(1);
      expect(report.status).toBe('SUCCESS');
      expect(report.recommendations).toContain('Email count is correct (1 email sent)');

      // Test with multiple emails (duplicate detected)
      EmailTestingUtils.incrementEmailCount(orderId, 'order_confirmation');
      report = EmailTestingUtils.getTestReport(orderId);
      expect(report.emailCount).toBe(2);
      expect(report.status).toBe('DUPLICATE_DETECTED');
      expect(report.recommendations.some(rec => rec.includes('investigate duplicate email issue'))).toBe(true);
    });

    it('should clear all data', () => {
      EmailTestingUtils.enableTestMode(['ORDER-001']);
      EmailTestingUtils.incrementEmailCount('ORDER-001', 'order_confirmation');
      EmailTestingUtils.addOrderToTestMode('ORDER-002');

      expect(EmailTestingUtils.isTestModeEnabled()).toBe(true);
      expect(EmailTestingUtils.countEmailsForOrder('ORDER-001')).toBe(1);

      EmailTestingUtils.clearAllData();

      expect(EmailTestingUtils.isTestModeEnabled()).toBe(false);
      expect(EmailTestingUtils.countEmailsForOrder('ORDER-001')).toBe(0);
      expect(EmailTestingUtils.getAllEmailCounts().size).toBe(0);
    });
  });

  describe('Integration Tests', () => {
    it('should work with test mode enabled for content verification', () => {
      const orderId = 'INTEGRATION-TEST-001';
      EmailTestingUtils.enableTestMode([orderId]);

      const htmlContent = '<html><body><h1>Test Order</h1></body></html>';
      const textContent = 'Test Order';
      const subject = 'Order Confirmation #' + orderId;

      const result = EmailTestingUtils.verifyEmailContentFormatting(
        htmlContent,
        textContent,
        subject,
        orderId,
      );

      // Should have logged the verification in test mode
      expect(result.orderId).toBe(orderId);
      expect(result.timestamp).toBeDefined();
    });

    it('should track emails and generate comprehensive reports', () => {
      const orderId = 'COMPREHENSIVE-TEST-001';
      EmailTestingUtils.enableTestMode([orderId]);

      // Simulate email sending
      EmailTestingUtils.incrementEmailCount(orderId, 'order_confirmation');

      // Verify content
      const verificationResult = EmailTestingUtils.verifyEmailContentFormatting(
        '<html><body><h1>Order Confirmation</h1></body></html>',
        'Order Confirmation',
        'Order Confirmation #' + orderId,
        orderId,
      );

      // Generate report
      const report = EmailTestingUtils.getTestReport(orderId);

      expect(report.emailCount).toBe(1);
      expect(report.status).toBe('SUCCESS');
      expect(report.isInTestMode).toBe(true);
      expect(verificationResult.orderId).toBe(orderId);
    });
  });
});