// Simple test script to verify shipping API integration
import { shippingApi } from './lib/shipping-api';

async function testShippingCalculation() {
  try {
    console.log('Testing shipping calculation API...\n');

    const testData = {
      destinationCity: 'Ho Chi Minh City',
      destinationState: 'Ho Chi Minh',
      destinationPostalCode: '700000',
      destinationCountry: 'VN',
      items: [
        { weight: 1, quantity: 2 },
      ],
      orderValue: 150,
    };

    console.log('Request data:', JSON.stringify(testData, null, 2));

    const rates = await shippingApi.calculateShipping(testData);

    console.log('\nShipping rates received:');
    console.log(JSON.stringify(rates, null, 2));

    console.log('\n✓ Test passed!');
  } catch (error: any) {
    console.error('\n✗ Test failed:');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testShippingCalculation();
