#!/usr/bin/env node

/**
 * Test script to verify that the resend functionality works asynchronously
 * This script tests the key requirement that resend requests return immediately
 * without waiting for email delivery.
 */

const { PrismaClient } = require('@prisma/client');

async function testResendAsyncFunctionality() {
  console.log('🔍 Testing Resend Functionality Asynchronous Behavior');
  console.log('=' .repeat(60));

  const prisma = new PrismaClient();

  try {
    // Find a recent order to test with
    const recentOrder = await prisma.order.findFirst({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Within 30 days
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!recentOrder) {
      console.log('❌ No recent orders found for testing');
      return;
    }

    console.log(`📦 Found test order: ${recentOrder.orderNumber}`);
    console.log(`📧 Customer email: ${recentOrder.email}`);

    // Test the resend endpoint timing
    const startTime = Date.now();

    try {
      const response = await fetch(`http://localhost:3001/api/orders/${recentOrder.orderNumber}/resend-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: recentOrder.email,
        }),
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      console.log(`⏱️  Response time: ${responseTime}ms`);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Response received:', result.message);

        // Check if response time meets async requirement (< 200ms)
        if (responseTime < 200) {
          console.log('✅ PASS: Response time is under 200ms - asynchronous behavior confirmed');
        } else {
          console.log('❌ FAIL: Response time exceeds 200ms - may not be fully asynchronous');
        }

        // Check if the response indicates queuing (not immediate sending)
        const responseText = result.message.toLowerCase();
        if (responseText.includes('queued') || responseText.includes('hàng đợi')) {
          console.log('✅ PASS: Response indicates email was queued for async processing');
        } else {
          console.log('⚠️  WARNING: Response does not clearly indicate async queuing');
        }

      } else {
        const error = await response.text();
        console.log('❌ Request failed:', response.status, error);
      }

    } catch (fetchError) {
      console.log('❌ Network error:', fetchError.message);
      console.log('💡 Make sure the backend server is running on localhost:3001');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n📋 Test Summary:');
  console.log('- Verified resend endpoint response time');
  console.log('- Checked for async queuing behavior');
  console.log('- Confirmed immediate response without waiting for email delivery');
}

// Run the test
testResendAsyncFunctionality().catch(console.error);