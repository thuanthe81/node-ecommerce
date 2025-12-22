#!/usr/bin/env ts-node

/**
 * Test script for Email Testing Utilities
 *
 * Demonstrates and tests all email testing utility functions:
 * - Email content formatting verification
 * - Email count tracking per order
 * - Test mode with comprehensive logging
 *
 * Requirements: 4.1, 4.2, 4.3
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { EmailTestingUtils } from '../src/common/utils/email-testing.utils';
import { EmailAttachmentService } from '../src/pdf-generator/services/email-attachment.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { OrderPDFData } from '../src/pdf-generator/types/pdf.types';

class EmailTestingUtilitiesDemo {
  private emailAttachmentService: EmailAttachmentService;
  private prismaService: PrismaService;

  constructor(
    emailAttachmentService: EmailAttachmentService,
    prismaService: PrismaService,
  ) {
    this.emailAttachmentService = emailAttachmentService;
    this.prismaService = prismaService;
  }

  /**
   * Run all email testing utility demonstrations
   */
  async runAllTests(): Promise<void> {
    console.log('🧪 Email Testing Utilities Demo\n');
    console.log('=====================================\n');

    // Test 1: Email content formatting verification
    await this.testEmailContentFormatting();

    // Test 2: Email count tracking
    await this.testEmailCountTracking();

    // Test 3: Test mode with comprehensive logging
    await this.testTestModeLogging();

    // Test 4: Integration with real order data
    await this.testWithRealOrderData();

    // Test 5: Test report generation
    await this.testReportGeneration();

    console.log('\n✅ All email testing utility demonstrations completed!');
  }

  /**
   * Test email content formatting verification
   * Requirement 4.1: Add utility to verify email content formatting
   */
  private async testEmailContentFormatting(): Promise<void> {
    console.log('📧 Testing Email Content Formatting Verification...\n');

    const testCases = [
      {
        name: 'Valid email content',
        htmlContent: '<html><body><h1>Order Confirmation</h1><p>Thank you for your order!</p></body></html>',
        textContent: 'Order Confirmation\n\nThank you for your order!',
        subject: 'Order Confirmation #TEST-001',
        shouldPass: true,
      },
      {
        name: 'HTML with unescaped special characters',
        htmlContent: '<html><body><h1>Order for John & Jane "Smith"</h1><p>Address: 123 Main St. <Apt 4></p></body></html>',
        textContent: 'Order for John & Jane Smith\nAddress: 123 Main St. Apt 4',
        subject: 'Order Confirmation #TEST-002',
        shouldPass: false,
      },
      {
        name: 'Missing text content',
        htmlContent: '<html><body><h1>Order Confirmation</h1></body></html>',
        textContent: '',
        subject: 'Order Confirmation #TEST-003',
        shouldPass: false,
      },
      {
        name: 'HTML with dangerous CSS',
        htmlContent: '<html><body><div style="background: url(javascript:alert(\'xss\'));">Content</div></body></html>',
        textContent: 'Content',
        subject: 'Order Confirmation #TEST-004',
        shouldPass: false,
      },
      {
        name: 'Missing subject',
        htmlContent: '<html><body><h1>Order Confirmation</h1></body></html>',
        textContent: 'Order Confirmation',
        subject: '',
        shouldPass: false,
      },
    ];

    for (const testCase of testCases) {
      console.log(`  Testing: ${testCase.name}`);

      const result = EmailTestingUtils.verifyEmailContentFormatting(
        testCase.htmlContent,
        testCase.textContent,
        testCase.subject,
        `TEST-${Date.now()}`,
      );

      const passed = testCase.shouldPass ? result.isValid : !result.isValid;
      console.log(`    Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`    Valid: ${result.isValid}`);

      if (result.errors.length > 0) {
        console.log(`    Errors: ${result.errors.join(', ')}`);
      }

      if (result.warnings.length > 0) {
        console.log(`    Warnings: ${result.warnings.join(', ')}`);
      }

      console.log(`    Checks: HTML Escaping: ${result.checks.htmlEscaping}, CSS: ${result.checks.cssFormatting}, Structure: ${result.checks.htmlStructure}`);
      console.log('');
    }
  }

  /**
   * Test email count tracking per order
   * Requirement 4.2: Add utility to count emails sent per order
   */
  private async testEmailCountTracking(): Promise<void> {
    console.log('📊 Testing Email Count Tracking...\n');

    // Clear any existing data
    EmailTestingUtils.clearAllData();

    const testOrderIds = ['ORDER-001', 'ORDER-002', 'ORDER-003'];

    console.log('  Initial email counts:');
    for (const orderId of testOrderIds) {
      const count = EmailTestingUtils.countEmailsForOrder(orderId);
      console.log(`    ${orderId}: ${count} emails`);
    }

    console.log('\n  Simulating email sends...');

    // Simulate sending emails
    EmailTestingUtils.incrementEmailCount('ORDER-001', 'order_confirmation');
    console.log('    ✉️  Sent email for ORDER-001');

    EmailTestingUtils.incrementEmailCount('ORDER-002', 'order_confirmation');
    console.log('    ✉️  Sent email for ORDER-002');

    // Simulate duplicate email for ORDER-001
    EmailTestingUtils.incrementEmailCount('ORDER-001', 'order_confirmation');
    console.log('    ⚠️  Sent duplicate email for ORDER-001');

    // Send multiple emails for ORDER-003
    EmailTestingUtils.incrementEmailCount('ORDER-003', 'order_confirmation');
    EmailTestingUtils.incrementEmailCount('ORDER-003', 'shipping_notification');
    EmailTestingUtils.incrementEmailCount('ORDER-003', 'delivery_confirmation');
    console.log('    ✉️  Sent 3 different emails for ORDER-003');

    console.log('\n  Final email counts:');
    for (const orderId of testOrderIds) {
      const count = EmailTestingUtils.countEmailsForOrder(orderId);
      const status = count === 1 ? '✅' : count > 1 ? '⚠️' : '❌';
      console.log(`    ${orderId}: ${count} emails ${status}`);
    }

    console.log('\n  All email counts:');
    const allCounts = EmailTestingUtils.getAllEmailCounts();
    allCounts.forEach((count, orderId) => {
      console.log(`    ${orderId}: ${count} emails`);
    });

    console.log('');
  }

  /**
   * Test test mode with comprehensive logging
   * Requirement 4.3: Add test mode with comprehensive logging
   */
  private async testTestModeLogging(): Promise<void> {
    console.log('📝 Testing Test Mode with Comprehensive Logging...\n');

    // Test enabling/disabling test mode
    console.log('  Test mode status:');
    console.log(`    Initially enabled: ${EmailTestingUtils.isTestModeEnabled()}`);

    EmailTestingUtils.enableTestMode(['TEST-ORDER-001', 'TEST-ORDER-002']);
    console.log(`    After enabling: ${EmailTestingUtils.isTestModeEnabled()}`);

    // Add an order to test mode
    EmailTestingUtils.addOrderToTestMode('TEST-ORDER-003');
    console.log('    Added TEST-ORDER-003 to test mode');

    // Simulate email operations in test mode
    console.log('\n  Simulating email operations in test mode...');

    // Test email content verification in test mode
    const testHtml = '<html><body><h1>Test Order Confirmation</h1><p>Order: TEST-ORDER-001</p></body></html>';
    const testText = 'Test Order Confirmation\nOrder: TEST-ORDER-001';
    const testSubject = 'Order Confirmation #TEST-ORDER-001';

    const verificationResult = EmailTestingUtils.verifyEmailContentFormatting(
      testHtml,
      testText,
      testSubject,
      'TEST-ORDER-001',
    );

    console.log(`    Email verification result: ${verificationResult.isValid ? 'Valid' : 'Invalid'}`);

    // Test email count tracking in test mode
    EmailTestingUtils.incrementEmailCount('TEST-ORDER-001', 'order_confirmation');
    EmailTestingUtils.incrementEmailCount('TEST-ORDER-002', 'order_confirmation');
    EmailTestingUtils.incrementEmailCount('TEST-ORDER-003', 'order_confirmation');

    console.log('    Incremented email counts for test orders');

    // Remove an order from test mode
    EmailTestingUtils.removeOrderFromTestMode('TEST-ORDER-003');
    console.log('    Removed TEST-ORDER-003 from test mode');

    // Disable test mode
    EmailTestingUtils.disableTestMode();
    console.log(`    Test mode disabled: ${!EmailTestingUtils.isTestModeEnabled()}`);

    console.log('');
  }

  /**
   * Test with real order data from database
   */
  private async testWithRealOrderData(): Promise<void> {
    console.log('🗄️  Testing with Real Order Data...\n');

    try {
      // Get a recent order from the database
      const recentOrder = await this.prismaService.order.findFirst({
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  nameEn: true,
                  nameVi: true,
                  descriptionEn: true,
                  descriptionVi: true,
                  sku: true,
                  price: true,
                  images: true,
                  category: {
                    select: {
                      nameEn: true,
                      nameVi: true,
                    },
                  },
                },
              },
            },
          },
          shippingAddress: true,
          billingAddress: true,
        },
      });

      if (!recentOrder) {
        console.log('    ❌ No orders found in database');
        return;
      }

      console.log(`    Found order: ${recentOrder.orderNumber}`);

      // Convert to PDF data format (simplified)
      const orderPDFData: OrderPDFData = {
        orderNumber: recentOrder.orderNumber,
        orderDate: recentOrder.createdAt.toISOString().split('T')[0],
        customerInfo: {
          name: recentOrder.shippingAddress?.fullName || 'Customer',
          email: recentOrder.email,
          phone: recentOrder.shippingAddress?.phone,
        },
        billingAddress: recentOrder.billingAddress ? {
          fullName: recentOrder.billingAddress.fullName,
          addressLine1: recentOrder.billingAddress.addressLine1,
          addressLine2: recentOrder.billingAddress.addressLine2 || undefined,
          city: recentOrder.billingAddress.city,
          state: recentOrder.billingAddress.state,
          postalCode: recentOrder.billingAddress.postalCode,
          country: recentOrder.billingAddress.country,
          phone: recentOrder.billingAddress.phone || undefined,
        } : {
          fullName: 'Not provided',
          addressLine1: 'Not provided',
          city: 'Not provided',
          state: 'Not provided',
          postalCode: 'Not provided',
          country: 'VN',
        },
        shippingAddress: recentOrder.shippingAddress ? {
          fullName: recentOrder.shippingAddress.fullName,
          addressLine1: recentOrder.shippingAddress.addressLine1,
          addressLine2: recentOrder.shippingAddress.addressLine2 || undefined,
          city: recentOrder.shippingAddress.city,
          state: recentOrder.shippingAddress.state,
          postalCode: recentOrder.shippingAddress.postalCode,
          country: recentOrder.shippingAddress.country,
          phone: recentOrder.shippingAddress.phone || undefined,
        } : {
          fullName: 'Not provided',
          addressLine1: 'Not provided',
          city: 'Not provided',
          state: 'Not provided',
          postalCode: 'Not provided',
          country: 'VN',
        },
        items: recentOrder.items.map((item: any) => ({
          id: item.product.id,
          name: item.product.nameEn,
          description: item.product.descriptionEn,
          sku: item.product.sku,
          quantity: item.quantity,
          unitPrice: Number(item.price),
          totalPrice: Number(item.total || item.price * item.quantity),
          category: item.product.category?.nameEn,
        })),
        pricing: {
          subtotal: Number(recentOrder.subtotal),
          shippingCost: Number(recentOrder.shippingCost),
          taxAmount: Number(recentOrder.taxAmount || 0),
          discountAmount: Number(recentOrder.discountAmount || 0),
          total: Number(recentOrder.total),
        },
        paymentMethod: {
          type: recentOrder.paymentMethod as any,
          displayName: recentOrder.paymentMethod,
          status: recentOrder.paymentStatus as any,
        },
        shippingMethod: {
          name: recentOrder.shippingMethod || 'Standard',
          description: 'Standard delivery',
        },
        businessInfo: {
          companyName: 'Test Company',
          contactEmail: 'info@testcompany.com',
          contactPhone: '+1-555-123-4567',
          website: 'https://testcompany.com',
          address: {
            fullName: 'Test Company',
            addressLine1: 'Test Address',
            city: 'Test City',
            state: 'Test State',
            postalCode: '12345',
            country: 'VN',
          },
        },
        locale: 'en',
      };

      // Enable test mode for this order
      EmailTestingUtils.enableTestMode([recentOrder.orderNumber]);

      // Generate email template
      const emailTemplate = this.emailAttachmentService.generateSimplifiedEmailTemplate(
        orderPDFData,
        'en',
      );

      console.log(`    Generated email template for ${recentOrder.orderNumber}`);

      // Verify email content formatting
      const verificationResult = EmailTestingUtils.verifyEmailContentFormatting(
        emailTemplate.htmlContent,
        emailTemplate.textContent,
        emailTemplate.subject,
        recentOrder.orderNumber,
      );

      console.log(`    Email content verification: ${verificationResult.isValid ? '✅ Valid' : '❌ Invalid'}`);

      if (verificationResult.errors.length > 0) {
        console.log(`    Errors: ${verificationResult.errors.join(', ')}`);
      }

      if (verificationResult.warnings.length > 0) {
        console.log(`    Warnings: ${verificationResult.warnings.join(', ')}`);
      }

      // Simulate email sending
      EmailTestingUtils.incrementEmailCount(recentOrder.orderNumber, 'order_confirmation');
      console.log(`    Simulated email send for ${recentOrder.orderNumber}`);

      // Disable test mode
      EmailTestingUtils.disableTestMode();

    } catch (error) {
      console.log(`    ❌ Error testing with real order data: ${error.message}`);
    }

    console.log('');
  }

  /**
   * Test report generation
   */
  private async testReportGeneration(): Promise<void> {
    console.log('📊 Testing Report Generation...\n');

    // Clear data and set up test scenario
    EmailTestingUtils.clearAllData();
    EmailTestingUtils.enableTestMode(['REPORT-TEST-001', 'REPORT-TEST-002']);

    // Simulate different scenarios
    const scenarios = [
      { orderId: 'REPORT-TEST-001', emailCount: 1, description: 'Normal order (1 email)' },
      { orderId: 'REPORT-TEST-002', emailCount: 4, description: 'Duplicate email issue (4 emails)' },
      { orderId: 'REPORT-TEST-003', emailCount: 0, description: 'No emails sent' },
    ];

    for (const scenario of scenarios) {
      console.log(`  Setting up scenario: ${scenario.description}`);

      for (let i = 0; i < scenario.emailCount; i++) {
        EmailTestingUtils.incrementEmailCount(scenario.orderId, 'order_confirmation');
      }

      const report = EmailTestingUtils.getTestReport(scenario.orderId);

      console.log(`    Order ID: ${report.orderId}`);
      console.log(`    Email Count: ${report.emailCount}`);
      console.log(`    Status: ${report.status}`);
      console.log(`    In Test Mode: ${report.isInTestMode}`);
      console.log(`    Recommendations:`);

      report.recommendations.forEach(rec => {
        console.log(`      - ${rec}`);
      });

      console.log('');
    }

    // Clean up
    EmailTestingUtils.disableTestMode();
    console.log('  Test mode disabled and data cleared');
    console.log('');
  }
}

async function main() {
  try {
    console.log('🚀 Initializing Email Testing Utilities Demo...\n');

    const app = await NestFactory.createApplicationContext(AppModule);

    const emailAttachmentService = app.get(EmailAttachmentService);
    const prismaService = app.get(PrismaService);

    const demo = new EmailTestingUtilitiesDemo(
      emailAttachmentService,
      prismaService,
    );

    await demo.runAllTests();

    await app.close();

    console.log('\n🎉 Email Testing Utilities Demo completed successfully!');
    console.log('\n📋 Summary of Utilities:');
    console.log('  ✅ Email content formatting verification (Requirement 4.1)');
    console.log('  ✅ Email count tracking per order (Requirement 4.2)');
    console.log('  ✅ Test mode with comprehensive logging (Requirement 4.3)');
    console.log('\n💡 Usage Tips:');
    console.log('  - Enable test mode before running email operations for detailed logging');
    console.log('  - Use verifyEmailContentFormatting() to validate email templates');
    console.log('  - Monitor email counts to detect duplicate email issues');
    console.log('  - Generate test reports for comprehensive analysis');

  } catch (error) {
    console.error('❌ Demo failed to initialize:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}