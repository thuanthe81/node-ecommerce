const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function getOrders() {
  const prisma = new PrismaClient();

  try {
    console.log('=== Getting Orders from Database ===\n');

    const orders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
      },
    });

    console.log(`Found ${orders.length} orders:`);

    orders.forEach((order, index) => {
      console.log(`\n${index + 1}. Order ${order.orderNumber}:`);
      console.log(`   Email: ${order.email}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Total: $${order.total}`);
      console.log(`   Created: ${order.createdAt}`);
      console.log(`   Items: ${order.items.length}`);
    });

    if (orders.length > 0) {
      console.log(`\n=== Testing with first order: ${orders[0].orderNumber} ===`);
      return orders[0];
    } else {
      console.log('\n❌ No orders found. Please create an order first.');
      return null;
    }

  } catch (error) {
    console.error('Error:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

getOrders();