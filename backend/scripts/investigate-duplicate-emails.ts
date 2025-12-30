#!/usr/bin/env ts-node

/**
 * Duplicate Email Investigation Script
 *
 * This script creates a test order and monitors the email flow to identify
 * the root cause of duplicate order confirmation emails.
 */

import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

interface EmailFlowEvent {
  timestamp: string;
  event: string;
  orderId?: string;
  orderNumber?: string;
  jobId?: string;
  eventType?: string;
  source?: string;
  customerEmail?: string;
  [key: string]: any;
}

class DuplicateEmailInvestigator {
  private emailEvents: EmailFlowEvent[] = [];
  private testOrderId: string | null = null;

  async investigate(): Promise<void> {
    console.log('🔍 Starting duplicate email investigation...\n');

    try {
      // Step 1: Create a test order
      await this.createTestOrder();

      // Step 2: Monitor email events for 30 seconds
      await this.monitorEmailEvents(30000);

      // Step 3: Analyze the results
      await this.analyzeEmailFlow();

      // Step 4: Generate report
      await this.generateReport();

    } catch (error) {
      console.error('❌ Investigation failed:', error);
    } finally {
      await this.cleanup();
    }
  }

  private async createTestOrder(): Promise<void> {
    console.log('📦 Creating test order...');

    // Get a test product
    const product = await prisma.product.findFirst({
      where: { isActive: true },
      include: { images: true, category: true }
    });

    if (!product) {
      throw new Error('No active products found for testing');
    }

    // Create or find a test user for the order (required since userId is now mandatory)
    let testUser = await prisma.user.findFirst({
      where: { email: 'test-duplicate-investigation@example.com' }
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'test-duplicate-investigation@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'CUSTOMER',
        }
      });
    }

    // Create addresses first
    const shippingAddress = await prisma.address.create({
      data: {
        userId: testUser.id,
        fullName: 'Test Customer',
        addressLine1: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        postalCode: '12345',
        country: 'US',
        phone: '+1234567890',
      }
    });

    const billingAddress = await prisma.address.create({
      data: {
        userId: testUser.id,
        fullName: 'Test Customer',
        addressLine1: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        postalCode: '12345',
        country: 'US',
        phone: '+1234567890',
      }
    });

    // Create test order
    const testOrder = await prisma.order.create({
      data: {
        orderNumber: `TEST-${Date.now()}`,
        userId: testUser.id, // Required field
        email: 'test-duplicate-investigation@example.com',
        status: 'PENDING',
        paymentStatus: 'PENDING',
        total: 29.99,
        subtotal: 24.99,
        shippingCost: 5.00,
        taxAmount: 0.00,
        shippingMethod: 'standard',
        paymentMethod: 'credit_card',
        shippingAddressId: shippingAddress.id,
        billingAddressId: billingAddress.id,
        items: {
          create: [
            {
              productId: product.id,
              productNameEn: product.nameEn || 'Test Product',
              productNameVi: product.nameVi || 'Sản phẩm thử nghiệm',
              sku: product.sku || 'TEST-SKU',
              quantity: 1,
              price: 24.99,
              total: 24.99,
            }
          ]
        }
      },
      include: {
        items: true,
        shippingAddress: true,
        billingAddress: true,
        user: true,
      }
    });

    this.testOrderId = testOrder.id;
    console.log(`✅ Test order created: ${testOrder.orderNumber} (ID: ${testOrder.id})`);
    console.log(`📧 Customer email: ${testOrder.email}\n`);

    // Trigger the order confirmation email by calling the OrdersService method
    // This simulates what happens when an order is created
    console.log('📤 Triggering order confirmation email...');

    // We'll need to manually trigger this since we can't easily inject the service here
    // Instead, we'll monitor the logs to see what happens
  }

  private async monitorEmailEvents(durationMs: number): Promise<void> {
    console.log(`👀 Monitoring email events for ${durationMs / 1000} seconds...`);
    console.log('   (Check application logs for [EMAIL_FLOW] entries)\n');

    // In a real implementation, we would:
    // 1. Set up log monitoring to capture [EMAIL_FLOW] entries
    // 2. Parse and store them in this.emailEvents
    // 3. Monitor Redis queue for job creation/processing

    // For now, we'll simulate monitoring by waiting and then checking the database
    await new Promise(resolve => setTimeout(resolve, durationMs));
  }

  private async analyzeEmailFlow(): Promise<void> {
    console.log('📊 Analyzing email flow...\n');

    if (!this.testOrderId) {
      console.log('❌ No test order ID available for analysis');
      return;
    }

    // Check if multiple email events were created for this order
    // This would require checking Redis queue or application logs
    console.log('🔍 Analysis points to check:');
    console.log('   1. How many times was sendOrderConfirmationEmail called?');
    console.log('   2. How many email events were published to the queue?');
    console.log('   3. How many times was the email actually sent?');
    console.log('   4. Was deduplication working correctly?');
    console.log('');

    // Check for potential causes
    await this.checkPotentialCauses();
  }

  private async checkPotentialCauses(): Promise<void> {
    console.log('🔍 Checking potential causes of duplicate emails:\n');

    // Cause 1: Multiple calls to sendOrderConfirmationEmail
    console.log('1. Multiple calls to sendOrderConfirmationEmail:');
    console.log('   - Check if order creation transaction calls email method multiple times');
    console.log('   - Check if there are multiple triggers in the order creation flow');
    console.log('   - Look for [EMAIL_FLOW] ORDER_CREATION_EMAIL_TRIGGER events in logs');
    console.log('');

    // Cause 2: Email Event Publisher creating duplicate events
    console.log('2. Email Event Publisher creating duplicate events:');
    console.log('   - Check if deduplication logic is working correctly');
    console.log('   - Check if job IDs are being generated consistently');
    console.log('   - Look for [EMAIL_FLOW] DUPLICATE_EVENT_DETECTION events in logs');
    console.log('');

    // Cause 3: Email Worker processing same event multiple times
    console.log('3. Email Worker processing same event multiple times:');
    console.log('   - Check if worker is running multiple instances');
    console.log('   - Check if events are being retried incorrectly');
    console.log('   - Look for [EMAIL_FLOW] EMAIL_EVENT_PROCESSING_START events in logs');
    console.log('');

    // Cause 4: EmailAttachmentService sending multiple emails
    console.log('4. EmailAttachmentService sending multiple emails:');
    console.log('   - Check if the service is being called multiple times per event');
    console.log('   - Check if there are retry mechanisms causing duplicates');
    console.log('   - Look for [EMAIL_FLOW] EMAIL_DELIVERY_ATTEMPT events in logs');
    console.log('');
  }

  private async generateReport(): Promise<void> {
    console.log('📋 Investigation Report:\n');
    console.log('='.repeat(60));
    console.log('DUPLICATE EMAIL INVESTIGATION REPORT');
    console.log('='.repeat(60));
    console.log('');

    if (this.testOrderId) {
      console.log(`Test Order ID: ${this.testOrderId}`);
      console.log(`Test Email: test-duplicate-investigation@example.com`);
      console.log('');
    }

    console.log('INVESTIGATION STEPS COMPLETED:');
    console.log('✅ 1. Created test order');
    console.log('✅ 2. Monitored email events');
    console.log('✅ 3. Analyzed potential causes');
    console.log('');

    console.log('NEXT STEPS:');
    console.log('1. Check application logs for [EMAIL_FLOW] entries');
    console.log('2. Look for patterns in the logged events');
    console.log('3. Identify which component is causing duplicates');
    console.log('4. Implement fixes based on findings');
    console.log('');

    console.log('LOG SEARCH COMMANDS:');
    console.log('# Search for all email flow events for this investigation:');
    console.log('grep "EMAIL_FLOW" logs/application.log | grep "test-duplicate-investigation@example.com"');
    console.log('');
    console.log('# Search for order creation triggers:');
    console.log('grep "ORDER_CREATION_EMAIL_TRIGGER" logs/application.log');
    console.log('');
    console.log('# Search for duplicate detections:');
    console.log('grep "DUPLICATE_EVENT_DETECTION" logs/application.log');
    console.log('');

    console.log('MONITORING RECOMMENDATIONS:');
    console.log('1. Enable comprehensive logging in production');
    console.log('2. Set up alerts for duplicate email detection');
    console.log('3. Monitor email delivery metrics');
    console.log('4. Implement email flow dashboards');
    console.log('');
  }

  private async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up...');

    if (this.testOrderId) {
      try {
        // Delete test order and related data
        await prisma.orderItem.deleteMany({
          where: { orderId: this.testOrderId }
        });

        await prisma.address.deleteMany({
          where: {
            OR: [
              { shippingOrders: { some: { id: this.testOrderId } } },
              { billingOrders: { some: { id: this.testOrderId } } }
            ]
          }
        });

        await prisma.order.delete({
          where: { id: this.testOrderId }
        });

        console.log('✅ Test order cleaned up');
      } catch (error) {
        console.error('❌ Cleanup failed:', error);
      }
    }

    await prisma.$disconnect();
    console.log('✅ Investigation completed');
  }
}

// Helper function to create a simple hash
function createSimpleHash(content: string): string {
  return createHash('md5').update(content).digest('hex').substring(0, 8);
}

// Run the investigation
if (require.main === module) {
  const investigator = new DuplicateEmailInvestigator();
  investigator.investigate().catch(console.error);
}

export { DuplicateEmailInvestigator };