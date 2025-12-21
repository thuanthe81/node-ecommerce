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

async function testResendRealOrder() {
  try {
    console.log('=== Testing Resend with Real Order ===\n');

    // Use the real order from the database
    const orderNumber = 'ORD-1766207385272-881';
    const customerEmail = 'thuanthe81@gmail.com';

    console.log(`1. Testing resend for order: ${orderNumber}`);
    console.log(`   Customer email: ${customerEmail}`);

    const resendData = {
      email: customerEmail
    };

    const resendResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: `/api/orders/${orderNumber}/resend-email`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, JSON.stringify(resendData));

    console.log('\n2. Resend API Response:');
    console.log('   Status:', resendResponse.statusCode);
    console.log('   Response:', resendResponse.body);

    // Parse the response
    try {
      const responseData = JSON.parse(resendResponse.body);
      console.log('\n3. Response Details:');
      console.log('   Success:', responseData.success);
      console.log('   Message:', responseData.message);
      if (responseData.error) {
        console.log('   Error:', responseData.error);
      }
      if (responseData.jobId) {
        console.log('   Job ID:', responseData.jobId);
        console.log('   ✅ Email has been queued for processing!');
      }
      if (responseData.rateLimited) {
        console.log('   Rate Limited:', responseData.rateLimited);
      }
    } catch (parseError) {
      console.log('   Could not parse response as JSON');
    }

    // Wait a moment and check the backend logs
    console.log('\n4. Waiting 3 seconds for email processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('   Check the backend logs to see if the email was processed successfully!');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testResendRealOrder();