/**
 * Manual test script for shipping methods endpoints
 * Run with: npx ts-node scripts/test-shipping-methods-endpoints.ts
 */

import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3001';

// You'll need to replace this with a valid admin JWT token
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    Authorization: `Bearer ${ADMIN_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

async function testShippingMethodsEndpoints() {
  console.log('Testing Shipping Methods Endpoints\n');
  console.log('='.repeat(50));

  try {
    // Test 1: Get all shipping methods
    console.log('\n1. GET /shipping-methods (all methods)');
    const allMethods = await api.get('/shipping-methods');
    console.log(`✓ Found ${allMethods.data.length} shipping methods`);
    console.log('Methods:', allMethods.data.map((m: any) => m.methodId).join(', '));

    // Test 2: Get active shipping methods
    console.log('\n2. GET /shipping-methods/active (active only)');
    const activeMethods = await api.get('/shipping-methods/active');
    console.log(`✓ Found ${activeMethods.data.length} active shipping methods`);

    // Test 3: Create a new shipping method
    console.log('\n3. POST /shipping-methods (create)');
    const newMethod = {
      methodId: 'test-method-' + Date.now(),
      nameEn: 'Test Shipping Method',
      nameVi: 'Phương thức vận chuyển thử nghiệm',
      descriptionEn: 'A test shipping method',
      descriptionVi: 'Một phương thức vận chuyển thử nghiệm',
      carrier: 'Test Carrier',
      baseRate: 15.0,
      estimatedDaysMin: 2,
      estimatedDaysMax: 4,
      isActive: true,
      displayOrder: 100,
    };
    const created = await api.post('/shipping-methods', newMethod);
    console.log('✓ Created shipping method:', created.data.id);
    const createdId = created.data.id;

    // Test 4: Get single shipping method
    console.log('\n4. GET /shipping-methods/:id (get one)');
    const single = await api.get(`/shipping-methods/${createdId}`);
    console.log('✓ Retrieved shipping method:', single.data.methodId);

    // Test 5: Update shipping method
    console.log('\n5. PATCH /shipping-methods/:id (update)');
    const updated = await api.patch(`/shipping-methods/${createdId}`, {
      nameEn: 'Updated Test Method',
      baseRate: 20.0,
    });
    console.log('✓ Updated shipping method');
    console.log('  New name:', updated.data.nameEn);
    console.log('  New rate:', updated.data.baseRate);

    // Test 6: Delete shipping method
    console.log('\n6. DELETE /shipping-methods/:id (delete)');
    await api.delete(`/shipping-methods/${createdId}`);
    console.log('✓ Deleted shipping method');

    // Test 7: Verify deletion
    console.log('\n7. Verify deletion');
    try {
      await api.get(`/shipping-methods/${createdId}`);
      console.log('✗ Method still exists (should have been deleted)');
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('✓ Method successfully deleted (404 Not Found)');
      } else {
        throw error;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✓ All tests passed!');
  } catch (error: any) {
    console.error('\n✗ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

// Check if admin token is provided
if (!ADMIN_TOKEN) {
  console.error('Error: ADMIN_TOKEN environment variable is required');
  console.error('Usage: ADMIN_TOKEN=your_token npx ts-node scripts/test-shipping-methods-endpoints.ts');
  process.exit(1);
}

testShippingMethodsEndpoints();
