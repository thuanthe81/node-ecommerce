#!/usr/bin/env ts-node

/**
 * Test script to verify that resend order confirmation now uses async email queue
 * This script simulates a resend request and checks that it uses the EmailEventPublisher
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { EmailAttachmentService } from '../src/pdf-generator/services/email-attachment.service';
import { EmailEventPublisher } from '../src/email-queue/services/email-event-publisher.service';
import { PrismaService } from '../src/prisma/prisma.service';

async function testResendAsync() {
  console.log('🚀 Testing async resend order confirmation...');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const emailAttachmentService = app.get(EmailAttachmentService);
    const emailEventPublisher = app.get(EmailEventPublisher);
    const prismaService = app.get(PrismaService);

    // Find a recent order to test with
    const recentOrder = await prismaService.order.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        shippingAddress: true,
      },
    });

    if (!recentOrder) {
      console.log('❌ No orders found in database. Please create an order first.');
      return;
    }

    console.log(`📦 Found order: ${recentOrder.orderNumber} (${recentOrder.email})`);

    // Get initial queue metrics
    const initialMetrics = await emailEventPublisher.getQueueMetrics();
    console.log('📊 Initial queue metrics:', initialMetrics);

    // Test the resend functionality
    console.log('📧 Testing resend order confirmation...');
    const resendResult = await emailAttachmentService.resendOrderConfirmation(
      recentOrder.orderNumber,
      recentOrder.email,
      'en'
    );

    console.log('✅ Resend result:', resendResult);

    if (resendResult.success && resendResult.jobId) {
      console.log(`🎯 Email successfully queued with Job ID: ${resendResult.jobId}`);

      // Get updated queue metrics
      const updatedMetrics = await emailEventPublisher.getQueueMetrics();
      console.log('📊 Updated queue metrics:', updatedMetrics);

      // Check if queue depth increased
      if (updatedMetrics.waiting > initialMetrics.waiting || updatedMetrics.active > initialMetrics.active) {
        console.log('✅ SUCCESS: Email was queued asynchronously!');
        console.log('📈 Queue depth increased, confirming async processing');
      } else {
        console.log('⚠️  WARNING: Queue metrics didn\'t change as expected');
      }

      // Try to get job details
      const jobDetails = await emailEventPublisher.getJob(resendResult.jobId);
      if (jobDetails) {
        console.log('📋 Job details:', {
          id: jobDetails.id,
          name: jobDetails.name,
          data: jobDetails.data,
          timestamp: jobDetails.timestamp,
        });
      }
    } else {
      console.log('❌ FAILED: Resend did not return a job ID');
      console.log('Error:', resendResult.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await app.close();
  }
}

// Run the test
testResendAsync().catch(console.error);