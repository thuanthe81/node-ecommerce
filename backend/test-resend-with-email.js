const http = require('http');

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

async function testResendWithEmail() {
  try {
    console.log('=== Testing Resend Order Confirmation with Email ===\n');

    // Test with a proper email address
    console.log('1. Testing resend with email address...');
    const resendData = {
      email: 'test@example.com'
    };

    const resendResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/orders/ORD-001/resend-email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, JSON.stringify(resendData));

    console.log('Resend status:', resendResponse.statusCode);
    console.log('Resend response:', resendResponse.body);

    // Parse the response to see what happened
    try {
      const responseData = JSON.parse(resendResponse.body);
      console.log('\n2. Response analysis:');
      console.log('   Success:', responseData.success);
      console.log('   Message:', responseData.message);
      if (responseData.error) {
        console.log('   Error:', responseData.error);
      }
      if (responseData.jobId) {
        console.log('   Job ID:', responseData.jobId);
      }
    } catch (parseError) {
      console.log('Could not parse response as JSON');
    }

    // If the order doesn't exist, let's try to create one first
    if (resendResponse.statusCode === 400 || resendResponse.statusCode === 404) {
      console.log('\n3. Order might not exist, checking what orders are available...');

      // Let's try a different approach - test the email service directly
      console.log('4. Let\'s test the email worker directly...');

      // We can trigger the email worker by publishing an event
      const eventData = {
        orderId: 'test-order-id',
        orderNumber: 'ORD-TEST-001',
        customerEmail: 'test@example.com',
        customerName: 'Test Customer',
        locale: 'en'
      };

      const eventResponse = await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: '/api/email-queue/test-order-confirmation',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }, JSON.stringify(eventData));

      console.log('Event publish status:', eventResponse.statusCode);
      console.log('Event publish response:', eventResponse.body);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testResendWithEmail();