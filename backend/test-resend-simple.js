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

async function testResend() {
  try {
    console.log('=== Testing Resend Order Confirmation ===\n');

    // First, let's test if the API is responding
    console.log('1. Testing API health...');
    const healthResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api',
      method: 'GET'
    });

    console.log('Health check status:', healthResponse.statusCode);
    console.log('Health check response:', healthResponse.body);

    if (healthResponse.statusCode !== 200) {
      console.log('❌ API is not responding properly');
      return;
    }

    // Try to get orders (this might require auth, but let's see)
    console.log('\n2. Trying to get orders...');
    const ordersResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/orders/admin/all',
      method: 'GET'
    });

    console.log('Orders status:', ordersResponse.statusCode);
    console.log('Orders response:', ordersResponse.body.substring(0, 500) + '...');

    // If we can't get orders due to auth, let's try with a known order number
    // Let's try with a common test order number
    console.log('\n3. Testing resend with test order number...');
    const resendResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/orders/ORD-001/resend-email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, '{}');

    console.log('Resend status:', resendResponse.statusCode);
    console.log('Resend response:', resendResponse.body);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testResend();