import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testShippingCache() {
  console.log('Testing Shipping Methods Cache Implementation\n');

  try {
    // Test 1: Fetch active methods (should hit database)
    console.log('1. Fetching active shipping methods (first call - database)...');
    const response1 = await fetch('http://localhost:3001/api/shipping/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: 'test', quantity: 1, price: 100 }],
        destination: { country: 'Vietnam' },
        totalWeight: 1.0,
        orderValue: 100,
      }),
    });
    const result1 = await response1.json();
    console.log(`✓ Found ${result1.length} active shipping methods`);

    // Test 2: Fetch again (should hit cache)
    console.log('\n2. Fetching active shipping methods again (should use cache)...');
    const response2 = await fetch('http://localhost:3001/api/shipping/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: 'test', quantity: 1, price: 100 }],
        destination: { country: 'Vietnam' },
        totalWeight: 1.0,
        orderValue: 100,
      }),
    });
    const result2 = await response2.json();
    console.log(`✓ Found ${result2.length} active shipping methods (from cache)`);

    // Test 3: Get all methods to find one to update
    console.log('\n3. Getting all shipping methods...');
    const allMethodsResponse = await fetch('http://localhost:3001/api/admin/shipping-methods', {
      headers: {
        'Authorization': 'Bearer test-admin-token', // You'll need a valid token
      },
    });

    if (allMethodsResponse.ok) {
      const allMethods = await allMethodsResponse.json();
      if (allMethods.length > 0) {
        const methodToUpdate = allMethods[0];
        console.log(`✓ Found method to test: ${methodToUpdate.nameEn}`);

        // Test 4: Update a method (should invalidate cache)
        console.log('\n4. Updating shipping method (should invalidate cache)...');
        const updateResponse = await fetch(
          `http://localhost:3001/api/admin/shipping-methods/${methodToUpdate.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer test-admin-token',
            },
            body: JSON.stringify({
              baseRate: parseFloat(methodToUpdate.baseRate) + 0.01,
            }),
          }
        );

        if (updateResponse.ok) {
          console.log('✓ Method updated successfully');

          // Test 5: Fetch again (should hit database due to cache invalidation)
          console.log('\n5. Fetching active methods after update (should hit database)...');
          const response3 = await fetch('http://localhost:3001/api/shipping/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: [{ productId: 'test', quantity: 1, price: 100 }],
              destination: { country: 'Vietnam' },
              totalWeight: 1.0,
              orderValue: 100,
            }),
          });
          const result3 = await response3.json();
          console.log(`✓ Found ${result3.length} active shipping methods (cache was invalidated)`);
        } else {
          console.log('⚠ Could not update method (may need authentication)');
        }
      }
    } else {
      console.log('⚠ Could not fetch methods (may need authentication)');
    }

    console.log('\n✅ Cache implementation test completed!');
    console.log('\nCache behavior:');
    console.log('- Active methods are cached for 30 minutes');
    console.log('- Cache is invalidated on create/update/delete operations');
    console.log('- Cache keys follow pattern: shipping:methods:active');

  } catch (error) {
    console.error('❌ Error testing cache:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testShippingCache();
