const { PrismaClient } = require('@prisma/client');
const http = require('http');
require('dotenv').config();

const prisma = new PrismaClient();

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function createTestOrderAndResend() {
  try {
    console.log('=== Creating Test Order and Testing Resend ===\n');

    // 1. Check if we have products and users
    const products = await prisma.product.findMany({ take: 1 });
    const users = await prisma.user.findMany({ take: 1 });

    if (products.length === 0) {
      console.log('❌ No products found. Please run the seed first.');
      return;
    }

    if (users.length === 0) {
      console.log('❌ No users found. Please run the seed first.');
      return;
    }

    console.log('✅ Found products and users');

    // 2. Create a test order
    console.log('\n2. Creating test order...');

    const testOrder = await prisma.order.create({
      data: {
        orderNumber: 'TEST-' + Date.now(),
        email: 'test@example.com',
        customerName: 'Test Customer',
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: 'BANK_TRANSFER',
        shippingMethod: 'standard',
        subtotal: 25.00,
        shippingCost: 5.00,
        taxAmount: 2.50,
        discountAmount: 0.00,
        total: 32.50,
        currency: 'USD',
        locale: 'en',
        items: {
          create: [
            {
              productId: products[0].id,
              quantity: 1,
              price: 25.00,
              total: 25.00,
            }
          ]
        },
        shippingAddress: {
          create: {
            fullName: 'Test Customer',
            addressLine1: '123 Test Street',
            city: 'Test City',
            state: 'Test State',
            postalCode: '12345',
            country: 'US',
          }
        },
        billingAddress: {
          create: {
            fullName: 'Test Customer',
            addressLine1: '123 Test Street',
            city: 'Test City',
            state: 'Test State',
            postalCode: '12345',
            country: 'US',
          }
        }
      },
      include: {
        items: true,
        shippingAddress: true,
      }
    });

    console.log(`✅ Created test order: ${testOrder.orderNumber}`);
    console.log(`   Email: ${testOrder.email}`);
    console.log(`   Total: $${testOrder.total}`);

    // 3. Test the resend API
    console.log('\n3. Testing resend API...');

    const resendResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: `/api/orders/${testOrder.orderNumber}/resend-email`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, '{}');

    console.log('Resend API Response:');
    console.log('Status:', resendResponse.statusCode);
    console.log('Body:', resendResponse.body);

    if (resendResponse.statusCode === 200 || resendResponse.statusCode === 201) {
      const responseData = JSON.parse(resendResponse.body);
      console.log('\n✅ Resend request successful!');
      console.log('Job ID:', responseData.jobId);
      console.log('Message:', responseData.message);

      // Wait a moment for the email worker to process
      console.log('\n4. Waiting for email worker to process...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log('Check the backend logs for email processing details.');
    } else {
      console.log('\n❌ Resend request failed');
      console.log('Response:', resendResponse.body);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestOrderAndResend();