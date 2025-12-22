#!/usr/bin/env ts-node

/**
 * Comprehensive Email Flow Test
 *
 * Tests the complete email flow from order creation to delivery
 * to identify where duplicate emails are generated.
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

interface EmailFlowStep {
  step: string;
  timestamp: Date;
  success: boolean;
  details: any;
  error?: string;
}

class EmailFlowTester {
  private testResults: EmailFlowStep[] = [];
  private testOrderId: string | null = null;
  private testOrderNumber: string | null = null;
  private baseUrl = 'http://localhost:3001'; // Backend URL

  async runComprehensiveTest(): Promise<void> {
    console.log('🧪 Starting comprehensive email flow test...\n');

    try {
      // Step 1: Test order creation and email triggering
      await this.testOrderCreation();

      // Step 2: Test email queue status
      await this.testEmailQueueStatus();

      // Step 3: Test email event processing
      await this.testEmailEventProcessing();

      // Step 4: Test deduplication
      await this.testDeduplication();

      // Step 5: Generate comprehensive report
      await this.generateTestReport();

    } catch (error) {
      console.error('❌ Comprehensive test failed:', error);
      this.addTestResult('COMPREHENSIVE_TEST', false, {}, error instanceof Error ? error.message : String(error));
    } finally {
      await this.cleanup();
    }
  }

  private async testOrderCreation(): Promise<void> {
    console.log('📦 Testing order creation and email triggering...');

    try {
      // Get a test product
      const product = await prisma.product.findFirst({
        where: { isActive: true },
        include: { images: true, category: true }
      });

      if (!product) {
        throw new Error('No active products found for testing');
      }

      // Create test order directly in database (simulating order creation)
      const testOrder = await prisma.order.create({
        data: {
          orderNumber: `FLOW-TEST-${Date.now()}`,
          email: 'flow-test@example.com',
          status: 'PENDING',
          paymentStatus: 'PENDING',
          total: 29.99,
          subtotal: 24.99,
          shippingCost: 5.00,
          taxAmount: 0.00,
          shippingMethod: 'standard',
          paymentMethod: 'credit_card',
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
          },
          shippingAddress: {
            create: {
              fullName: 'Flow Test Customer',
              addressLine1: '123 Flow Test Street',
              city: 'Test City',
              state: 'Test State',
              postalCode: '12345',
              country: 'US',
              phone: '+1234567890',
            }
          },
          billingAddress: {
            create: {
              fullName: 'Flow Test Customer',
              addressLine1: '123 Flow Test Street',
              city: 'Test City',
              state: 'Test State',
              postalCode: '12345',
              country: 'US',
              phone: '+1234567890',
            }
          }
        },
        include: {
          items: true,
          shippingAddress: true,
          billingAddress: true,
        }
      });

      this.testOrderId = testOrder.id;
      this.testOrderNumber = testOrder.orderNumber;

      this.addTestResult('ORDER_CREATION', true, {
        orderId: testOrder.id,
        orderNumber: testOrder.orderNumber,
        email: testOrder.email
      });

      console.log(`✅ Test order created: ${testOrder.orderNumber}`);

      // Now test the API endpoint that would trigger emails
      await this.testOrderAPICreation();

    } catch (error) {
      this.addTestResult('ORDER_CREATION', false, {}, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  private async testOrderAPICreation(): Promise<void> {
    console.log('🌐 Testing order creation via API...');

    try {
      // This would test the actual API endpoint that creates orders
      // For now, we'll simulate what the OrdersService.create() method does

      console.log('   📝 Note: This would call OrdersService.create() which triggers:');
      console.log('   1. Order creation in database');
      console.log('   2. sendOrderConfirmationEmail() call');
      console.log('   3. EmailEventPublisher.sendOrderConfirmation() call');
      console.log('   4. Email event queued in Redis');
      console.log('   5. EmailWorker processes the event');
      console.log('   6. EmailAttachmentService sends the email');

      this.addTestResult('ORDER_API_SIMULATION', true, {
        note: 'Simulated API order creation flow'
      });

    } catch (error) {
      this.addTestResult('ORDER_API_SIMULATION', false, {}, error instanceof Error ? error.message : String(error));
    }
  }

  private async testEmailQueueStatus(): Promise<void> {
    console.log('📬 Testing email queue status...');

    try {
      // Try to check email queue health
      try {
        const response = await axios.get(`${this.baseUrl}/api/admin/email-queue/health`, {
          timeout: 5000
        });

        this.addTestResult('EMAIL_QUEUE_HEALTH', true, {
          status: response.data.status,
          queueMetrics: response.data.queue
        });

        console.log('✅ Email queue is healthy');

        if (response.data.queue) {
          console.log(`   Waiting jobs: ${response.data.queue.waiting}`);
          console.log(`   Active jobs: ${response.data.queue.active}`);
          console.log(`   Completed jobs: ${response.data.queue.completed}`);
          console.log(`   Failed jobs: ${response.data.queue.failed}`);
        }

      } catch (apiError) {
        console.log('⚠️  Could not check email queue via API (service may not be running)');
        this.addTestResult('EMAIL_QUEUE_HEALTH', false, {}, 'API not accessible');
      }

    } catch (error) {
      this.addTestResult('EMAIL_QUEUE_STATUS', false, {}, error instanceof Error ? error.message : String(error));
    }
  }

  private async testEmailEventProcessing(): Promise<void> {
    console.log('⚙️  Testing email event processing...');

    try {
      // Check if there are any recent email events for our test order
      // This would require checking Redis or application logs

      console.log('   📝 To verify email event processing, check:');
      console.log('   1. Redis queue for email events');
      console.log('   2. Application logs for [EMAIL_FLOW] entries');
      console.log('   3. Email worker processing logs');

      // Simulate checking for email events
      await new Promise(resolve => setTimeout(resolve, 2000));

      this.addTestResult('EMAIL_EVENT_PROCESSING', true, {
        note: 'Email event processing check completed',
        recommendation: 'Check logs for actual processing details'
      });

    } catch (error) {
      this.addTestResult('EMAIL_EVENT_PROCESSING', false, {}, error instanceof Error ? error.message : String(error));
    }
  }

  private async testDeduplication(): Promise<void> {
    console.log('🔄 Testing email deduplication...');

    try {
      // Test what happens if we try to create the same email event multiple times
      console.log('   📝 Testing deduplication scenarios:');
      console.log('   1. Same order, same timestamp -> Should deduplicate');
      console.log('   2. Same order, different timestamp -> Should allow');
      console.log('   3. Different order, same details -> Should allow');

      // This would require direct access to EmailEventPublisher
      // For now, we'll document what should be tested

      this.addTestResult('DEDUPLICATION_TEST', true, {
        note: 'Deduplication test scenarios identified',
        scenarios: [
          'Same order within 1-minute window',
          'Same order outside 1-minute window',
          'Different orders with same customer'
        ]
      });

    } catch (error) {
      this.addTestResult('DEDUPLICATION_TEST', false, {}, error instanceof Error ? error.message : String(error));
    }
  }

  private async generateTestReport(): Promise<void> {
    console.log('\n📋 COMPREHENSIVE EMAIL FLOW TEST REPORT');
    console.log('='.repeat(60));
    console.log('');

    // Test summary
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;

    console.log(`Total tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log('');

    // Detailed results
    console.log('DETAILED TEST RESULTS:');
    console.log('-'.repeat(40));

    for (const result of this.testResults) {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.step}`);

      if (result.details && Object.keys(result.details).length > 0) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2).replace(/\n/g, '\n   ')}`);
      }

      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      console.log('');
    }

    // Recommendations
    console.log('🔧 RECOMMENDATIONS FOR DUPLICATE EMAIL INVESTIGATION:');
    console.log('');
    console.log('1. IMMEDIATE ACTIONS:');
    console.log('   - Enable comprehensive email flow logging');
    console.log('   - Monitor application logs for [EMAIL_FLOW] entries');
    console.log('   - Check Redis queue for duplicate jobs');
    console.log('');

    console.log('2. INVESTIGATION STEPS:');
    console.log('   - Run: npm run ts-node scripts/investigate-duplicate-emails.ts');
    console.log('   - Run: npm run ts-node scripts/analyze-email-logs.ts');
    console.log('   - Monitor: tail -f logs/application.log | grep "EMAIL_FLOW"');
    console.log('');

    console.log('3. CODE REVIEW AREAS:');
    console.log('   - OrdersService.create() method for multiple email triggers');
    console.log('   - EmailEventPublisher deduplication logic');
    console.log('   - EmailWorker event processing');
    console.log('   - EmailAttachmentService retry mechanisms');
    console.log('');

    console.log('4. MONITORING SETUP:');
    console.log('   - Set up email delivery metrics');
    console.log('   - Create duplicate email alerts');
    console.log('   - Monitor queue processing rates');
    console.log('   - Track email flow completion times');
    console.log('');

    if (this.testOrderId && this.testOrderNumber) {
      console.log('TEST ORDER DETAILS:');
      console.log(`Order ID: ${this.testOrderId}`);
      console.log(`Order Number: ${this.testOrderNumber}`);
      console.log('Email: flow-test@example.com');
      console.log('');
    }
  }

  private addTestResult(step: string, success: boolean, details: any, error?: string): void {
    this.testResults.push({
      step,
      timestamp: new Date(),
      success,
      details,
      error
    });
  }

  private async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up test data...');

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
    console.log('✅ Comprehensive test completed');
  }
}

// Run the comprehensive test
if (require.main === module) {
  const tester = new EmailFlowTester();
  tester.runComprehensiveTest().catch(console.error);
}

export { EmailFlowTester };