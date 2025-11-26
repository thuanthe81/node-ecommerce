import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

async function testPaymentStatusAuth() {
  console.log('Testing payment status authorization...\n');

  try {
    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@handmade.com',
      password: 'admin123',
    });

    const { accessToken, user } = loginResponse.data;
    console.log('✓ Login successful');
    console.log('  User:', user.email);
    console.log('  Role:', user.role);
    console.log('  Token:', accessToken.substring(0, 20) + '...\n');

    // Step 2: Get all orders
    console.log('2. Fetching orders...');
    const ordersResponse = await axios.get(`${API_URL}/orders/admin/all`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const orders = ordersResponse.data;
    console.log(`✓ Found ${orders.length} orders\n`);

    if (orders.length === 0) {
      console.log('No orders found. Please create an order first.');
      return;
    }

    // Step 3: Try to update payment status
    const testOrder = orders[0];
    console.log('3. Testing payment status update...');
    console.log('  Order ID:', testOrder.id);
    console.log('  Current payment status:', testOrder.paymentStatus);

    const newStatus = testOrder.paymentStatus === 'PENDING' ? 'PAID' : 'PENDING';
    console.log('  New payment status:', newStatus);

    const updateResponse = await axios.patch(
      `${API_URL}/orders/${testOrder.id}/payment-status`,
      {
        paymentStatus: newStatus,
        notes: 'Test update from script',
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log('✓ Payment status updated successfully!');
    console.log('  Updated order:', updateResponse.data.orderNumber);
    console.log('  New payment status:', updateResponse.data.paymentStatus);

  } catch (error: any) {
    console.error('✗ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testPaymentStatusAuth();
