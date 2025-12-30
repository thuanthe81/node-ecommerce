import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking for duplicate addresses in the database\n');
  console.log('='.repeat(60));

  // Check for duplicate addresses for authenticated users
  console.log('\n📊 Checking for duplicate addresses (authenticated users):\n');

  const duplicates = await prisma.$queryRaw<any[]>`
    SELECT
      "userId",
      "fullName",
      "addressLine1",
      "city",
      "postalCode",
      COUNT(*) as duplicate_count
    FROM addresses
    WHERE "userId" IS NOT NULL
    GROUP BY "userId", "fullName", "addressLine1", "city", "postalCode"
    HAVING COUNT(*) > 1
  `;

  if (duplicates.length === 0) {
    console.log('✅ No duplicate addresses found for authenticated users');
  } else {
    console.log(`⚠️  Found ${duplicates.length} sets of duplicate addresses:`);
    duplicates.forEach((dup, index) => {
      console.log(`\n${index + 1}. User ID: ${dup.userId}`);
      console.log(`   Address: ${dup.addressLine1}, ${dup.city}, ${dup.postalCode}`);
      console.log(`   Duplicate count: ${dup.duplicate_count}`);
    });
  }

  // Check guest addresses (addresses without userId)
  console.log('\n📊 Guest addresses (userId = null):\n');

  const guestAddressCount = await prisma.address.count({
    where: { userId: null },
  });

  console.log(`Total guest addresses: ${guestAddressCount}`);

  // Get recent guest addresses with order count
  const recentGuestAddresses = await prisma.$queryRaw<any[]>`
    SELECT
      a.id as address_id,
      a."fullName",
      a."addressLine1",
      a."city",
      a."createdAt" as address_created,
      COUNT(DISTINCT o.id) as order_count
    FROM addresses a
    LEFT JOIN orders o ON (o."shippingAddressId" = a.id OR o."billingAddressId" = a.id)
    WHERE a."userId" IS NULL
      AND a."createdAt" > NOW() - INTERVAL '7 days'
    GROUP BY a.id, a."fullName", a."addressLine1", a."city", a."createdAt"
    ORDER BY a."createdAt" DESC
    LIMIT 10
  `;

  if (recentGuestAddresses.length > 0) {
    console.log('\nRecent guest addresses (last 7 days):');
    recentGuestAddresses.forEach((addr, index) => {
      console.log(`\n${index + 1}. ${addr.fullName}`);
      console.log(`   Address: ${addr.addressLine1}, ${addr.city}`);
      console.log(`   Created: ${new Date(addr.address_created).toLocaleString()}`);
      console.log(`   Orders: ${addr.order_count}`);
    });
  } else {
    console.log('No guest addresses created in the last 7 days');
  }

  // Check recent orders and their addresses
  console.log('\n📊 Recent orders (last 24 hours):\n');

  const recentOrders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
    include: {
      shippingAddress: true,
      billingAddress: true,
      user: {
        select: {
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });

  if (recentOrders.length === 0) {
    console.log('No orders created in the last 24 hours');
  } else {
    console.log(`Found ${recentOrders.length} recent orders:\n`);

    recentOrders.forEach((order, index) => {
      const sameAddress = order.shippingAddressId === order.billingAddressId;
      const userType = 'Authenticated'; // All orders now require userId

      console.log(`${index + 1}. Order ${order.orderNumber}`);
      console.log(`   Type: ${userType}`);
      console.log(`   Email: ${order.email}`);
      console.log(`   Created: ${order.createdAt.toLocaleString()}`);
      console.log(`   Same address for shipping/billing: ${sameAddress ? 'Yes' : 'No'}`);
      console.log(`   Shipping: ${order.shippingAddress.addressLine1}, ${order.shippingAddress.city}`);
      if (!sameAddress) {
        console.log(`   Billing: ${order.billingAddress.addressLine1}, ${order.billingAddress.city}`);
      }
      console.log('');
    });
  }

  // Summary statistics
  console.log('='.repeat(60));
  console.log('\n📈 Summary Statistics:\n');

  const totalAddresses = await prisma.address.count();
  const authenticatedAddresses = await prisma.address.count({
    where: { userId: { not: null } },
  });
  const guestAddresses = await prisma.address.count({
    where: { userId: null },
  });

  const totalOrders = await prisma.order.count();
  // Note: All orders now require userId (no guest orders after migration)
  const authenticatedOrders = await prisma.order.count();

  console.log(`Total addresses: ${totalAddresses}`);
  console.log(`  - Authenticated user addresses: ${authenticatedAddresses}`);
  console.log(`  - Guest addresses: ${guestAddresses}`);
  console.log('');
  console.log(`Total orders: ${totalOrders}`);
  console.log(`  - All orders are now authenticated (userId required): ${authenticatedOrders}`);

  // Check for orphaned guest addresses (no associated orders)
  const orphanedGuestAddresses = await prisma.$queryRaw<any[]>`
    SELECT COUNT(*) as orphaned_count
    FROM addresses a
    WHERE a."userId" IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM orders o
        WHERE o."shippingAddressId" = a.id OR o."billingAddressId" = a.id
      )
  `;

  const orphanedCount = Number(orphanedGuestAddresses[0]?.orphaned_count || 0);
  console.log(`\nOrphaned guest addresses (no orders): ${orphanedCount}`);

  if (orphanedCount > 0) {
    console.log('ℹ️  Note: Orphaned guest addresses may be from incomplete checkout attempts');
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Database check complete\n');
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
