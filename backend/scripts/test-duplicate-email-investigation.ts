#!/usr/bin/env ts-node

/**
 * Focused Duplicate Email Investigation
 *
 * This script tests the actual OrdersService.create method to see
 * if it triggers multiple email events for a single order.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { OrdersService } from '../src/orders/orders.service';
import { EmailEventPublisher } from '../src/email-queue/services/email-event-publisher.service';
import { FooterSettingsService } from '../src/footer-settings/footer-settings.service';
import { EmailAttachmentService } from '../src/pdf-generator/services/email-attachment.service';

class DuplicateEmailInvestigationTest {
  private ordersService: OrdersService;
  private emailEventPublisher: EmailEventPublisher;
  private prismaService: PrismaService;
  private emailEvents: any[] = [];

  async runInvestigation(): Promise<void> {
    console.log('🔍 Starting focused duplicate email investigation...\n');

    try {
      // Set up test module
      await this.setupTestModule();

      // Create a test order using the actual service
      await this.testActualOrderCreation();

      // Analyze the results
      await this.analyzeResults();

    } catch (error) {
      console.error('❌ Investigation failed:', error);
    } finally {
      await this.cleanup();
    }
  }

  private async setupTestModule(): Promise<void> {
    console.log('⚙️  Setting up test module...');

    // Create a spy on EmailEventPublisher to track calls
    const mockEmailEventPublisher = {
      sendOrderConfirmation: jest.fn().mockImplementation(async (...args) => {
        const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.emailEvents.push({
          timestamp: new Date(),
          method: 'sendOrderConfirmation',
          args,
          jobId
        });
        console.log(`📧 EmailEventPublisher.sendOrderConfirmation called with:`, args);
        console.log(`   Job ID: ${jobId}`);
        return jobId;
      }),
      sendAdminOrderNotification: jest.fn().mockImplementation(async (...args) => {
        const jobId = `admin-job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.emailEvents.push({
          timestamp: new Date(),
          method: 'sendAdminOrderNotification',
          args,
          jobId
        });
        console.log(`📧 EmailEventPublisher.sendAdminOrderNotification called with:`, args);
        console.log(`   Job ID: ${jobId}`);
        return jobId;
      })
    };

    const mockFooterSettingsService = {
      getFooterSettings: jest.fn().mockResolvedValue({
        id: 'footer-1',
        contactEmail: 'admin@test.com',
        contactPhone: null,
        address: null,
        copyrightText: 'Test Copyright',
        googleMapsUrl: null,
        facebookUrl: null,
        twitterUrl: null,
        tiktokUrl: null,
        zaloUrl: null,
        whatsappUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    };

    const mockEmailAttachmentService = {
      sendOrderConfirmationWithPDF: jest.fn().mockResolvedValue({ success: true }),
      resendOrderConfirmation: jest.fn().mockResolvedValue({ success: true })
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        PrismaService,
        { provide: EmailEventPublisher, useValue: mockEmailEventPublisher },
        { provide: FooterSettingsService, useValue: mockFooterSettingsService },
        { provide: EmailAttachmentService, useValue: mockEmailAttachmentService },
      ],
    }).compile();

    this.ordersService = module.get<OrdersService>(OrdersService);
    this.emailEventPublisher = module.get<EmailEventPublisher>(EmailEventPublisher);
    this.prismaService = module.get<PrismaService>(PrismaService);

    console.log('✅ Test module set up successfully\n');
  }

  private async testActualOrderCreation(): Promise<void> {
    console.log('📦 Testing actual order creation...');

    try {
      // Get real data from database
      const product = await this.prismaService.product.findFirst({
        where: { isActive: true },
        include: { images: true, category: true }
      });

      if (!product) {
        throw new Error('No active products found for testing');
      }

      // Create test addresses
      const shippingAddress = await this.prismaService.address.create({
        data: {
          fullName: 'Test Customer',
          addressLine1: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          postalCode: '12345',
          country: 'US',
          phone: '+1234567890',
        }
      });

      const billingAddress = await this.prismaService.address.create({
        data: {
          fullName: 'Test Customer',
          addressLine1: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          postalCode: '12345',
          country: 'US',
          phone: '+1234567890',
        }
      });

      // Create order using the actual service
      const createOrderDto = {
        email: 'duplicate-test@example.com',
        shippingAddressId: shippingAddress.id,
        billingAddressId: billingAddress.id,
        shippingMethod: 'standard',
        shippingCost: 5.00,
        paymentMethod: 'credit_card',
        items: [
          {
            productId: product.id,
            quantity: 1,
          },
        ],
        promotionCode: undefined,
        notes: 'Duplicate email investigation test',
        locale: 'en' as 'en' | 'vi',
      };

      console.log('🚀 Calling OrdersService.create()...');
      console.log('   This should trigger email events...\n');

      const startTime = Date.now();
      const order = await this.ordersService.create(createOrderDto, undefined); // Guest order
      const endTime = Date.now();

      console.log(`✅ Order created successfully in ${endTime - startTime}ms:`);
      console.log(`   Order ID: ${order.id}`);
      console.log(`   Order Number: ${order.orderNumber}`);
      console.log(`   Customer Email: ${order.email}\n`);

      // Wait a moment for any async operations
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Clean up test addresses
      await this.prismaService.address.delete({ where: { id: shippingAddress.id } });
      await this.prismaService.address.delete({ where: { id: billingAddress.id } });

    } catch (error) {
      console.error('❌ Order creation failed:', error);
      throw error;
    }
  }

  private async analyzeResults(): Promise<void> {
    console.log('📊 ANALYSIS RESULTS:');
    console.log('='.repeat(50));
    console.log('');

    console.log(`Total email events captured: ${this.emailEvents.length}`);
    console.log('');

    if (this.emailEvents.length === 0) {
      console.log('⚠️  No email events were captured!');
      console.log('   This could mean:');
      console.log('   1. Email events are not being triggered');
      console.log('   2. The mocking is not working correctly');
      console.log('   3. There is an error in the order creation process');
      console.log('');
      return;
    }

    // Group events by method
    const eventsByMethod = this.emailEvents.reduce((acc, event) => {
      if (!acc[event.method]) {
        acc[event.method] = [];
      }
      acc[event.method].push(event);
      return acc;
    }, {} as Record<string, any[]>);

    console.log('EMAIL EVENTS BY METHOD:');
    for (const [method, events] of Object.entries(eventsByMethod)) {
      console.log(`\n${method}: ${(events as any[]).length} calls`);

      (events as any[]).forEach((event: any, index: number) => {
        console.log(`  ${index + 1}. ${event.timestamp.toISOString()}`);
        console.log(`     Job ID: ${event.jobId}`);
        console.log(`     Args: ${JSON.stringify(event.args)}`);
      });
    }

    // Check for duplicates
    const orderConfirmationEvents = eventsByMethod['sendOrderConfirmation'] || [];
    if (orderConfirmationEvents.length > 1) {
      console.log('\n🔴 DUPLICATE ORDER CONFIRMATION EVENTS DETECTED!');
      console.log(`   Found ${orderConfirmationEvents.length} calls to sendOrderConfirmation`);
      console.log('   This indicates the duplicate email bug is present.');

      // Analyze timing
      if (orderConfirmationEvents.length >= 2) {
        const timeDiff = orderConfirmationEvents[1].timestamp.getTime() - orderConfirmationEvents[0].timestamp.getTime();
        console.log(`   Time between first and second call: ${timeDiff}ms`);
      }
    } else if (orderConfirmationEvents.length === 1) {
      console.log('\n✅ SINGLE ORDER CONFIRMATION EVENT');
      console.log('   Only one call to sendOrderConfirmation detected.');
      console.log('   This is the expected behavior.');
    }

    console.log('\n🔧 RECOMMENDATIONS:');
    if (orderConfirmationEvents.length > 1) {
      console.log('1. Review OrdersService.create() method for multiple email triggers');
      console.log('2. Check if there are multiple async calls to sendOrderConfirmationEmail');
      console.log('3. Verify transaction boundaries and error handling');
      console.log('4. Consider adding deduplication at the service level');
    } else {
      console.log('1. The OrdersService appears to be working correctly');
      console.log('2. The duplicate issue may be in the EmailEventPublisher or EmailWorker');
      console.log('3. Check Redis queue for duplicate job creation');
      console.log('4. Monitor actual email delivery for duplicates');
    }
    console.log('');
  }

  private async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up...');

    if (this.prismaService) {
      await this.prismaService.$disconnect();
    }

    console.log('✅ Investigation completed');
  }
}

// Run the investigation
if (require.main === module) {
  const investigation = new DuplicateEmailInvestigationTest();
  investigation.runInvestigation().catch(console.error);
}

export { DuplicateEmailInvestigationTest };