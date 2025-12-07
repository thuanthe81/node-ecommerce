/**
 * Test script to verify shipping calculation with database methods
 * Run with: npx ts-node -r tsconfig-paths/register scripts/test-shipping-calculation.ts
 */

import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

async function testShippingCalculation() {
  console.log('Testing Shipping Calculation with Database Methods\n');
  console.log('='.repeat(50));

  try {
    // Test 1: Calculate shipping for domestic order (Vietnam)
    console.log('\n1. Calculate shipping for Vietnam (domestic)');
    const domesticCalc = await api.post('/shipping/calculate', {
      destinationCity: 'Ho Chi Minh City',
      destinationState: 'Ho Chi Minh',
      destinationPostalCode: '700000',
      destinationCountry: 'Vietnam',
      items: [
        {
          weight: 0.5,
          quantity: 2,
        },
      ],
      orderValue: 50,
    });
    console.log('✓ Domestic shipping rates:');
    domesticCalc.data.forEach((rate: any) => {
      console.log(`  - ${rate.name}: $${rate.cost} (${rate.estimatedDays})`);
      if (rate.isFreeShipping) {
        console.log(`    FREE SHIPPING! (Original: $${rate.originalCost})`);
      }
    });

    // Test 2: Calculate shipping for international order (USA)
    console.log('\n2. Calculate shipping for USA (international)');
    const internationalCalc = await api.post('/shipping/calculate', {
      destinationCity: 'New York',
      destinationState: 'NY',
      destinationPostalCode: '10001',
      destinationCountry: 'USA',
      items: [
        {
          weight: 1.5,
          quantity: 1,
        },
      ],
      orderValue: 75,
    });
    console.log('✓ International shipping rates:');
    internationalCalc.data.forEach((rate: any) => {
      console.log(`  - ${rate.name}: $${rate.cost} (${rate.estimatedDays})`);
      if (rate.carrier) {
        console.log(`    Carrier: ${rate.carrier}`);
      }
    });

    // Test 3: Calculate shipping with heavy package (weight-based pricing)
    console.log('\n3. Calculate shipping with heavy package (3kg)');
    const heavyCalc = await api.post('/shipping/calculate', {
      destinationCity: 'Hanoi',
      destinationState: 'Hanoi',
      destinationPostalCode: '100000',
      destinationCountry: 'Vietnam',
      items: [
        {
          weight: 3,
          quantity: 1,
        },
      ],
      orderValue: 30,
    });
    console.log('✓ Heavy package shipping rates:');
    heavyCalc.data.forEach((rate: any) => {
      console.log(`  - ${rate.name}: $${rate.cost} (${rate.estimatedDays})`);
    });

    // Test 4: Calculate shipping with free shipping threshold
    console.log('\n4. Calculate shipping with order value >= free shipping threshold');
    const freeShippingCalc = await api.post('/shipping/calculate', {
      destinationCity: 'Da Nang',
      destinationState: 'Da Nang',
      destinationPostalCode: '550000',
      destinationCountry: 'Vietnam',
      items: [
        {
          weight: 0.5,
          quantity: 1,
        },
      ],
      orderValue: 150, // Above typical free shipping threshold
    });
    console.log('✓ High-value order shipping rates:');
    freeShippingCalc.data.forEach((rate: any) => {
      console.log(`  - ${rate.name}: $${rate.cost} (${rate.estimatedDays})`);
      if (rate.isFreeShipping) {
        console.log(`    ✓ FREE SHIPPING APPLIED! (Original: $${rate.originalCost})`);
      }
    });

    // Test 5: Calculate shipping for Asian country (regional pricing)
    console.log('\n5. Calculate shipping for Japan (regional pricing)');
    const asianCalc = await api.post('/shipping/calculate', {
      destinationCity: 'Tokyo',
      destinationState: 'Tokyo',
      destinationPostalCode: '100-0001',
      destinationCountry: 'Japan',
      items: [
        {
          weight: 1,
          quantity: 1,
        },
      ],
      orderValue: 60,
    });
    console.log('✓ Asian regional shipping rates:');
    asianCalc.data.forEach((rate: any) => {
      console.log(`  - ${rate.name}: $${rate.cost} (${rate.estimatedDays})`);
    });

    console.log('\n' + '='.repeat(50));
    console.log('✓ All shipping calculation tests passed!');
  } catch (error: any) {
    console.error('\n✗ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

testShippingCalculation()
  .then(() => {
    console.log('\nTest completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nTest failed with error:', error);
    process.exit(1);
  });
