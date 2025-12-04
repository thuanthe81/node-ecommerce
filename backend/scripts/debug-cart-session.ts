import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugCartSessions() {
  console.log('=== Cart Session Debug ===\n');

  // Get all carts
  const carts = await prisma.cart.findMany({
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              nameEn: true,
            },
          },
        },
      },
    },
  });

  console.log(`Found ${carts.length} cart(s)\n`);

  for (const cart of carts) {
    console.log(`Cart ID: ${cart.id}`);
    console.log(`User ID: ${cart.userId || 'null (guest cart)'}`);
    console.log(`Session ID: ${cart.sessionId || 'null'}`);
    console.log(`Expires At: ${cart.expiresAt}`);
    console.log(`Items: ${cart.items.length}`);

    if (cart.items.length > 0) {
      console.log('Cart Items:');
      cart.items.forEach((item, index) => {
        console.log(
          `  ${index + 1}. ${item.product.nameEn} (ID: ${item.id}) - Qty: ${item.quantity}`,
        );
      });
    }

    console.log('---\n');
  }

  await prisma.$disconnect();
}

debugCartSessions().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
