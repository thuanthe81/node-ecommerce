const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPDFGeneration() {
  try {
    console.log('=== Testing PDF Generation Fix ===\n');

    // Test the resend API endpoint directly
    const orderNumber = 'ORD-1766207385272-881';
    const customerEmail = 'thuanthe81@gmail.com';

    console.log(`1. Testing resend for order: ${orderNumber}`);
    console.log(`   Customer email: ${customerEmail}\n`);

    // Make HTTP request to the resend endpoint
    const response = await fetch(`http://localhost:3001/api/orders/${orderNumber}/resend-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: customerEmail,
        locale: 'vi'
      }),
    });

    console.log(`2. Resend API Response:`);
    console.log(`   Status: ${response.status}`);

    const responseData = await response.json();
    console.log(`   Response:`, JSON.stringify(responseData, null, 2));

    if (responseData.success) {
      console.log('\n✅ PDF generation and email sending successful!');
      console.log('   Check your email for the PDF attachment.');
    } else {
      console.log('\n❌ PDF generation failed:');
      console.log(`   Error: ${responseData.error || responseData.message}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPDFGeneration();