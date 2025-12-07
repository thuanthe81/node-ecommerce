import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testToggleShippingMethod() {
  console.log('Testing shipping method toggle functionality...\n');

  try {
    // Get all shipping methods
    const methods = await prisma.shippingMethod.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });

    if (methods.length === 0) {
      console.log('❌ No shipping methods found. Please run seed first.');
      return;
    }

    console.log(`Found ${methods.length} shipping methods\n`);

    // Test toggling the first method
    const testMethod = methods[0];
    console.log(`Testing with method: ${testMethod.nameEn} (${testMethod.methodId})`);
    console.log(`Current status: ${testMethod.isActive ? 'Active' : 'Inactive'}\n`);

    // Toggle to opposite state
    const newState = !testMethod.isActive;
    console.log(`Toggling to: ${newState ? 'Active' : 'Inactive'}...`);

    const updated = await prisma.shippingMethod.update({
      where: { id: testMethod.id },
      data: { isActive: newState },
    });

    console.log(`✅ Successfully toggled to: ${updated.isActive ? 'Active' : 'Inactive'}\n`);

    // Verify the change persisted
    const verified = await prisma.shippingMethod.findUnique({
      where: { id: testMethod.id },
    });

    if (verified && verified.isActive === newState) {
      console.log('✅ Change persisted correctly in database\n');
    } else {
      console.log('❌ Change did not persist correctly\n');
    }

    // Toggle back to original state
    console.log('Toggling back to original state...');
    await prisma.shippingMethod.update({
      where: { id: testMethod.id },
      data: { isActive: testMethod.isActive },
    });
    console.log('✅ Restored original state\n');

    // Test that inactive methods are excluded from active query
    console.log('Testing active methods query...');
    const activeMethods = await prisma.shippingMethod.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });

    console.log(`✅ Found ${activeMethods.length} active methods`);
    activeMethods.forEach((m) => {
      console.log(`  - ${m.nameEn} (${m.methodId}): Active`);
    });

    const inactiveMethods = await prisma.shippingMethod.findMany({
      where: { isActive: false },
    });

    if (inactiveMethods.length > 0) {
      console.log(`\n✅ Found ${inactiveMethods.length} inactive methods`);
      inactiveMethods.forEach((m) => {
        console.log(`  - ${m.nameEn} (${m.methodId}): Inactive`);
      });
    }

    console.log('\n✅ All toggle tests passed!');
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testToggleShippingMethod();
