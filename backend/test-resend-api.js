const axios = require('axios');

async function testResendAPI() {
  try {
    console.log('=== Testing Resend Order Confirmation API ===\n');

    // First, let's get a list of orders to find one to resend
    console.log('1. Fetching orders...');
    const ordersResponse = await axios.get('http://localhost:3001/api/orders/admin/all', {
      headers: {
        'Authorization': 'Bearer admin-token' // You might need to adjust this
      }
    });

    if (ordersResponse.data.length === 0) {
      console.log('No orders found. Please create an order first.');
      return;
    }

    const firstOrder = ordersResponse.data[0];
    console.log(`Found order: ${firstOrder.orderNumber} (${firstOrder.email})`);

    // Now test the resend functionality
    console.log('\n2. Testing resend order confirmation...');
    const resendResponse = await axios.post(
      `http://localhost:3001/api/orders/${firstOrder.orderNumber}/resend-email`,
      {},
      {
        headers: {
          'Authorization': 'Bearer admin-token' // You might need to adjust this
        }
      }
    );

    console.log('Resend Response:', resendResponse.data);

    if (resendResponse.data.success) {
      console.log('✅ Resend request successful!');
      console.log('Job ID:', resendResponse.data.jobId);
      console.log('Message:', resendResponse.data.message);
    } else {
      console.log('❌ Resend request failed');
      console.log('Error:', resendResponse.data.error);
    }

  } catch (error) {
    console.error('Error testing resend API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testResendAPI();