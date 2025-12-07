import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugCartSessions() {
  console.log('=== Cart Debug ===\n');

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
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  console.log(`Found ${carts.length} cart(s)\n`);

  for (const cart of carts) {
    console.log(`Cart ID: ${cart.id}`);
    console.log(`User ID: ${cart.userId}`);
    console.log(`User: ${cart.user.firstName} ${cart.user.lastName} (${cart.user.email})`);
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
