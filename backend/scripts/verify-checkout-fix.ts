import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
  addressesCreated?: number;
  orderId?: string;
}

const results: TestResult[] = [];

// Helper function to create a test user
async function createTestUser(email: string) {
  const passwordHash = await bcrypt.hash('TestPassword123!', 10);
  return await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: 'Test',
      lastName: 'User',
      role: 'CUSTOMER',
    },
  });
}

// Helper function to create a test product
async function createTestProduct() {
  const category = await prisma.category.findFirst({
    where: { isActive: true },
  });

  if (!category) {
    throw new Error('No active category found. Please seed the database first.');
  }

  return await prisma.product.create({
    data: {
      slug: `test-product-${Date.now()}`,
      sku: `TEST-${Date.now()}`,
      nameEn: 'Test Product',
      nameVi: 'Sản phẩm thử nghiệm',
      descriptionEn: 'Test product for checkout verification',
      descriptionVi: 'Sản phẩm thử nghiệm cho xác minh thanh toán',
      price: 100.00,
      stockQuantity: 100,
      categoryId: category.id,
      isActive: true,
    },
  });
}

// Helper function to count addresses before and after
async function getAddressCount(userId?: string): Promise<number> {
  if (userId) {
    return await prisma.address.count({
      where: { userId },
    });
  } else {
    // Count guest addresses (userId is null)
    return await prisma.address.count({
      where: { userId: null },
    });
  }
}

// Test 1: Guest user checkout with same billing address
async function testGuestCheckoutSameAddress() {
  console.log('\n🧪 Test 1: Guest user checkout with same billing address');

  try {
    const product = await createTestProduct();
    const guestAddressCountBefore = await getAddressCount();

    // Create address for guest user
    const address = await prisma.address.create({
      data: {
        userId: null, // Guest user
        fullName: 'Guest User',
        phone: '1234567890',
        addressLine1: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        postalCode: '12345',
        country: 'US',
        isDefault: false,
      },
    });

    // Create order using same address for shipping and billing
    const order = await prisma.order.create({
      data: {
        orderNumber: `TEST-${Date.now()}`,
        email: 'guest@test.com',
        status: 'PENDING',
        subtotal: 100.00,
        shippingCost: 5.00,
        taxAmount: 10.00,
        total: 115.00,
        shippingAddressId: address.id,
        billingAddressId: address.id, // Same address
        shippingMethod: 'standard',
        paymentMethod: 'bank_transfer',
        items: {
          create: {
            productId: product.id,
            productNameEn: product.nameEn,
            productNameVi: product.nameVi,
            sku: product.sku,
            quantity: 1,
            price: product.price,
            total: product.price,
          },
        },
      },
    });

    const guestAddressCountAfter = await getAddressCount();
    const addressesCreated = guestAddressCountAfter - guestAddressCountBefore;

    const passed = addressesCreated === 1;
    results.push({
      testName: 'Guest checkout with same billing address',
      passed,
      details: passed
        ? `✅ Exactly 1 address created (expected: 1, actual: ${addressesCreated})`
        : `❌ Wrong number of addresses created (expected: 1, actual: ${addressesCreated})`,
      addressesCreated,
      orderId: order.id,
    });

    // Verify order references correct address
    const orderCheck = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        shippingAddress: true,
        billingAddress: true,
      },
    });

    if (orderCheck?.shippingAddressId === orderCheck?.billingAddressId) {
      console.log('✅ Order correctly uses same address for shipping and billing');
    } else {
      console.log('❌ Order has different addresses when it should be the same');
    }

    // Cleanup
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.address.delete({ where: { id: address.id } });
    await prisma.product.delete({ where: { id: product.id } });

  } catch (error) {
    results.push({
      testName: 'Guest checkout with same billing address',
      passed: false,
      details: `❌ Error: ${error.message}`,
    });
    console.error('Error:', error);
  }
}

// Test 2: Guest user checkout with different billing address
async function testGuestCheckoutDifferentAddress() {
  console.log('\n🧪 Test 2: Guest user checkout with different billing address');

  try {
    const product = await createTestProduct();
    const guestAddressCountBefore = await getAddressCount();

    // Create shipping address
    const shippingAddress = await prisma.address.create({
      data: {
        userId: null,
        fullName: 'Guest User',
        phone: '1234567890',
        addressLine1: '123 Shipping St',
        city: 'Shipping City',
        state: 'Test State',
        postalCode: '12345',
        country: 'US',
        isDefault: false,
      },
    });

    // Create billing address
    const billingAddress = await prisma.address.create({
      data: {
        userId: null,
        fullName: 'Guest User',
        phone: '1234567890',
        addressLine1: '456 Billing Ave',
        city: 'Billing City',
        state: 'Test State',
        postalCode: '54321',
        country: 'US',
        isDefault: false,
      },
    });

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: `TEST-${Date.now()}`,
        email: 'guest@test.com',
        status: 'PENDING',
        subtotal: 100.00,
        shippingCost: 5.00,
        taxAmount: 10.00,
        total: 115.00,
        shippingAddressId: shippingAddress.id,
        billingAddressId: billingAddress.id,
        shippingMethod: 'standard',
        paymentMethod: 'bank_transfer',
        items: {
          create: {
            productId: product.id,
            productNameEn: product.nameEn,
            productNameVi: product.nameVi,
            sku: product.sku,
            quantity: 1,
            price: product.price,
            total: product.price,
          },
        },
      },
    });

    const guestAddressCountAfter = await getAddressCount();
    const addressesCreated = guestAddressCountAfter - guestAddressCountBefore;

    const passed = addressesCreated === 2;
    results.push({
      testName: 'Guest checkout with different billing address',
      passed,
      details: passed
        ? `✅ Exactly 2 addresses created (expected: 2, actual: ${addressesCreated})`
        : `❌ Wrong number of addresses created (expected: 2, actual: ${addressesCreated})`,
      addressesCreated,
      orderId: order.id,
    });

    // Verify order references correct addresses
    const orderCheck = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        shippingAddress: true,
        billingAddress: true,
      },
    });

    if (orderCheck?.shippingAddressId !== orderCheck?.billingAddressId) {
      console.log('✅ Order correctly uses different addresses for shipping and billing');
    } else {
      console.log('❌ Order has same address when it should be different');
    }

    // Cleanup
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.address.delete({ where: { id: shippingAddress.id } });
    await prisma.address.delete({ where: { id: billingAddress.id } });
    await prisma.product.delete({ where: { id: product.id } });

  } catch (error) {
    results.push({
      testName: 'Guest checkout with different billing address',
      passed: false,
      details: `❌ Error: ${error.message}`,
    });
    console.error('Error:', error);
  }
}

// Test 3: Authenticated user checkout with new address
async function testAuthenticatedCheckoutNewAddress() {
  console.log('\n🧪 Test 3: Authenticated user checkout with new address');

  try {
    const user = await createTestUser(`test-${Date.now()}@example.com`);
    const product = await createTestProduct();
    const userAddressCountBefore = await getAddressCount(user.id);

    // Create address for authenticated user
    const address = await prisma.address.create({
      data: {
        userId: user.id,
        fullName: `${user.firstName} ${user.lastName}`,
        phone: '1234567890',
        addressLine1: '789 User St',
        city: 'User City',
        state: 'Test State',
        postalCode: '67890',
        country: 'US',
        isDefault: true,
      },
    });

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: `TEST-${Date.now()}`,
        userId: user.id,
        email: user.email,
        status: 'PENDING',
        subtotal: 100.00,
        shippingCost: 5.00,
        taxAmount: 10.00,
        total: 115.00,
        shippingAddressId: address.id,
        billingAddressId: address.id,
        shippingMethod: 'standard',
        paymentMethod: 'bank_transfer',
        items: {
          create: {
            productId: product.id,
            productNameEn: product.nameEn,
            productNameVi: product.nameVi,
            sku: product.sku,
            quantity: 1,
            price: product.price,
            total: product.price,
          },
        },
      },
    });

    const userAddressCountAfter = await getAddressCount(user.id);
    const addressesCreated = userAddressCountAfter - userAddressCountBefore;

    const passed = addressesCreated === 1;
    results.push({
      testName: 'Authenticated user checkout with new address',
      passed,
      details: passed
        ? `✅ Exactly 1 address created (expected: 1, actual: ${addressesCreated})`
        : `❌ Wrong number of addresses created (expected: 1, actual: ${addressesCreated})`,
      addressesCreated,
      orderId: order.id,
    });

    // Verify address is associated with user
    const addressCheck = await prisma.address.findUnique({
      where: { id: address.id },
    });

    if (addressCheck?.userId === user.id) {
      console.log('✅ Address correctly associated with user account');
    } else {
      console.log('❌ Address not properly associated with user account');
    }

    // Cleanup
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.address.delete({ where: { id: address.id } });
    await prisma.product.delete({ where: { id: product.id } });
    await prisma.user.delete({ where: { id: user.id } });

  } catch (error) {
    results.push({
      testName: 'Authenticated user checkout with new address',
      passed: false,
      details: `❌ Error: ${error.message}`,
    });
    console.error('Error:', error);
  }
}

// Test 4: Authenticated user checkout with saved address
async function testAuthenticatedCheckoutSavedAddress() {
  console.log('\n🧪 Test 4: Authenticated user checkout with saved address');

  try {
    const user = await createTestUser(`test-${Date.now()}@example.com`);
    const product = await createTestProduct();

    // Create saved address first
    const savedAddress = await prisma.address.create({
      data: {
        userId: user.id,
        fullName: `${user.firstName} ${user.lastName}`,
        phone: '1234567890',
        addressLine1: '999 Saved St',
        city: 'Saved City',
        state: 'Test State',
        postalCode: '99999',
        country: 'US',
        isDefault: true,
      },
    });

    const userAddressCountBefore = await getAddressCount(user.id);

    // Create order using saved address
    const order = await prisma.order.create({
      data: {
        orderNumber: `TEST-${Date.now()}`,
        userId: user.id,
        email: user.email,
        status: 'PENDING',
        subtotal: 100.00,
        shippingCost: 5.00,
        taxAmount: 10.00,
        total: 115.00,
        shippingAddressId: savedAddress.id,
        billingAddressId: savedAddress.id,
        shippingMethod: 'standard',
        paymentMethod: 'bank_transfer',
        items: {
          create: {
            productId: product.id,
            productNameEn: product.nameEn,
            productNameVi: product.nameVi,
            sku: product.sku,
            quantity: 1,
            price: product.price,
            total: product.price,
          },
        },
      },
    });

    const userAddressCountAfter = await getAddressCount(user.id);
    const addressesCreated = userAddressCountAfter - userAddressCountBefore;

    const passed = addressesCreated === 0;
    results.push({
      testName: 'Authenticated user checkout with saved address',
      passed,
      details: passed
        ? `✅ No new addresses created (expected: 0, actual: ${addressesCreated})`
        : `❌ Unexpected addresses created (expected: 0, actual: ${addressesCreated})`,
      addressesCreated,
      orderId: order.id,
    });

    // Verify order uses existing address
    const orderCheck = await prisma.order.findUnique({
      where: { id: order.id },
    });

    if (orderCheck?.shippingAddressId === savedAddress.id) {
      console.log('✅ Order correctly uses existing saved address');
    } else {
      console.log('❌ Order does not use the saved address');
    }

    // Cleanup
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.address.delete({ where: { id: savedAddress.id } });
    await prisma.product.delete({ where: { id: product.id } });
    await prisma.user.delete({ where: { id: user.id } });

  } catch (error) {
    results.push({
      testName: 'Authenticated user checkout with saved address',
      passed: false,
      details: `❌ Error: ${error.message}`,
    });
    console.error('Error:', error);
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Checkout Flow Verification\n');
  console.log('=' .repeat(60));

  try {
    await testGuestCheckoutSameAddress();
    await testGuestCheckoutDifferentAddress();
    await testAuthenticatedCheckoutNewAddress();
    await testAuthenticatedCheckoutSavedAddress();

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Test Results Summary:\n');

    let passedCount = 0;
    let failedCount = 0;

    results.forEach((result) => {
      console.log(`${result.passed ? '✅' : '❌'} ${result.testName}`);
      console.log(`   ${result.details}`);
      if (result.orderId) {
        console.log(`   Order ID: ${result.orderId}`);
      }
      console.log('');

      if (result.passed) {
        passedCount++;
      } else {
        failedCount++;
      }
    });

    console.log('='.repeat(60));
    console.log(`\n📈 Overall: ${passedCount}/${results.length} tests passed`);

    if (failedCount === 0) {
      console.log('\n🎉 All tests passed! The checkout flow fix is working correctly.');
    } else {
      console.log(`\n⚠️  ${failedCount} test(s) failed. Please review the implementation.`);
    }

  } catch (error) {
    console.error('\n❌ Fatal error during verification:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
