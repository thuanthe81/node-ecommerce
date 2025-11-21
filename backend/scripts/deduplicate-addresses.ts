import { PrismaClient } from '@prisma/client';
import { AddressDeduplicationUtil } from '../src/users/utils/address-deduplication.util';

const prisma = new PrismaClient();

interface DuplicateGroup {
  userId: string;
  addresses: Array<{
    id: string;
    userId: string | null;
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
    createdAt: Date;
  }>;
  normalizedKey: string;
}

interface MigrationStats {
  totalUsers: number;
  duplicateGroupsFound: number;
  addressesDeleted: number;
  ordersUpdated: number;
  defaultsPreserved: number;
}

/**
 * Finds groups of duplicate addresses for each user
 * Groups addresses by their normalized key fields
 */
async function findDuplicateGroups(): Promise<DuplicateGroup[]> {
  console.log('Finding duplicate address groups...\n');

  // Get all addresses for authenticated users (skip guest addresses with null userId)
  const addresses = await prisma.address.findMany({
    where: {
      userId: {
        not: null,
      },
    },
    orderBy: {
      createdAt: 'desc', // Most recent first
    },
  });

  console.log(`Found ${addresses.length} addresses for authenticated users\n`);

  // Group addresses by userId and normalized key
  const groupMap = new Map<string, DuplicateGroup>();

  for (const address of addresses) {
    const normalized = AddressDeduplicationUtil.normalizeAddress({
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    });

    // Create a unique key combining userId and normalized address fields
    const normalizedKey = `${address.userId}|${normalized.addressLine1}|${normalized.addressLine2}|${normalized.city}|${normalized.state}|${normalized.postalCode}|${normalized.country}`;

    if (!groupMap.has(normalizedKey)) {
      groupMap.set(normalizedKey, {
        userId: address.userId!,
        addresses: [],
        normalizedKey,
      });
    }

    groupMap.get(normalizedKey)!.addresses.push(address);
  }

  // Filter to only groups with duplicates (more than 1 address)
  const duplicateGroups = Array.from(groupMap.values()).filter(
    (group) => group.addresses.length > 1,
  );

  console.log(`Found ${duplicateGroups.length} duplicate groups\n`);

  return duplicateGroups;
}

/**
 * Previews the changes that would be made during deduplication
 */
async function previewChanges(
  duplicateGroups: DuplicateGroup[],
): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalUsers: new Set(duplicateGroups.map((g) => g.userId)).size,
    duplicateGroupsFound: duplicateGroups.length,
    addressesDeleted: 0,
    ordersUpdated: 0,
    defaultsPreserved: 0,
  };

  console.log('=== DRY RUN PREVIEW ===\n');
  console.log(`Users affected: ${stats.totalUsers}`);
  console.log(`Duplicate groups found: ${stats.duplicateGroupsFound}\n`);

  for (const group of duplicateGroups) {
    const [keepAddress, ...deleteAddresses] = group.addresses;
    const hasDefault = group.addresses.some((addr) => addr.isDefault);

    console.log(`Group for user ${group.userId}:`);
    console.log(`  Address to KEEP: ${keepAddress.id}`);
    console.log(`    - ${keepAddress.addressLine1}`);
    console.log(`    - ${keepAddress.city}, ${keepAddress.state} ${keepAddress.postalCode}`);
    console.log(`    - Created: ${keepAddress.createdAt.toISOString()}`);
    console.log(`    - Default: ${keepAddress.isDefault}`);

    if (hasDefault) {
      stats.defaultsPreserved++;
    }

    for (const addr of deleteAddresses) {
      console.log(`  Address to DELETE: ${addr.id}`);
      console.log(`    - ${addr.addressLine1}`);
      console.log(`    - ${addr.city}, ${addr.state} ${addr.postalCode}`);
      console.log(`    - Created: ${addr.createdAt.toISOString()}`);
      console.log(`    - Default: ${addr.isDefault}`);

      // Count orders that would be updated
      const shippingOrders = await prisma.order.count({
        where: { shippingAddressId: addr.id },
      });
      const billingOrders = await prisma.order.count({
        where: { billingAddressId: addr.id },
      });

      const totalOrders = shippingOrders + billingOrders;
      if (totalOrders > 0) {
        console.log(`    - Orders to update: ${totalOrders} (${shippingOrders} shipping, ${billingOrders} billing)`);
        stats.ordersUpdated += totalOrders;
      }

      stats.addressesDeleted++;
    }

    console.log('');
  }

  console.log('=== SUMMARY ===');
  console.log(`Total addresses to delete: ${stats.addressesDeleted}`);
  console.log(`Total order references to update: ${stats.ordersUpdated}`);
  console.log(`Groups with default address: ${stats.defaultsPreserved}`);
  console.log('');

  return stats;
}

/**
 * Performs the actual deduplication by merging duplicate addresses
 */
async function performDeduplication(
  duplicateGroups: DuplicateGroup[],
): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalUsers: new Set(duplicateGroups.map((g) => g.userId)).size,
    duplicateGroupsFound: duplicateGroups.length,
    addressesDeleted: 0,
    ordersUpdated: 0,
    defaultsPreserved: 0,
  };

  console.log('=== PERFORMING DEDUPLICATION ===\n');

  for (const group of duplicateGroups) {
    const [keepAddress, ...deleteAddresses] = group.addresses;
    const hasDefault = group.addresses.some((addr) => addr.isDefault);

    console.log(`Processing group for user ${group.userId}...`);
    console.log(`  Keeping address: ${keepAddress.id}`);

    // If any address in the group is default, ensure the kept address is default
    if (hasDefault && !keepAddress.isDefault) {
      await prisma.address.update({
        where: { id: keepAddress.id },
        data: { isDefault: true },
      });
      console.log(`  Set kept address as default`);
      stats.defaultsPreserved++;
    } else if (hasDefault) {
      stats.defaultsPreserved++;
    }

    // Process each duplicate address
    for (const addr of deleteAddresses) {
      console.log(`  Deleting duplicate: ${addr.id}`);

      // Update order references to point to the kept address
      const shippingOrdersUpdated = await prisma.order.updateMany({
        where: { shippingAddressId: addr.id },
        data: { shippingAddressId: keepAddress.id },
      });

      const billingOrdersUpdated = await prisma.order.updateMany({
        where: { billingAddressId: addr.id },
        data: { billingAddressId: keepAddress.id },
      });

      const totalOrdersUpdated =
        shippingOrdersUpdated.count + billingOrdersUpdated.count;

      if (totalOrdersUpdated > 0) {
        console.log(`    Updated ${totalOrdersUpdated} order references`);
        stats.ordersUpdated += totalOrdersUpdated;
      }

      // Delete the duplicate address
      await prisma.address.delete({
        where: { id: addr.id },
      });

      stats.addressesDeleted++;
    }

    console.log('');
  }

  console.log('=== DEDUPLICATION COMPLETE ===');
  console.log(`Users processed: ${stats.totalUsers}`);
  console.log(`Duplicate groups merged: ${stats.duplicateGroupsFound}`);
  console.log(`Addresses deleted: ${stats.addressesDeleted}`);
  console.log(`Order references updated: ${stats.ordersUpdated}`);
  console.log(`Default addresses preserved: ${stats.defaultsPreserved}`);
  console.log('');

  return stats;
}

/**
 * Main function to run the deduplication script
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');

  console.log('===========================================');
  console.log('Address Deduplication Migration Script');
  console.log('===========================================\n');

  if (dryRun) {
    console.log('Running in DRY RUN mode - no changes will be made\n');
  } else {
    console.log('Running in LIVE mode - changes will be applied\n');
    console.log('⚠️  WARNING: This will modify your database!');
    console.log('⚠️  Run with --dry-run flag first to preview changes\n');

    // Give user a chance to cancel
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  // Find duplicate groups
  const duplicateGroups = await findDuplicateGroups();

  if (duplicateGroups.length === 0) {
    console.log('✅ No duplicate addresses found. Database is clean!');
    return;
  }

  // Preview or perform deduplication
  if (dryRun) {
    await previewChanges(duplicateGroups);
    console.log('✅ Dry run complete. Run without --dry-run to apply changes.');
  } else {
    await performDeduplication(duplicateGroups);
    console.log('✅ Deduplication complete!');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
