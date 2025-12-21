const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testOrderImages() {
  try {
    console.log('=== Testing Order Images ===\n');

    // Get a recent order with items
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: 'ORD-1766207385272-881'
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true
              }
            },
          },
        },
      },
    });

    if (!order) {
      console.log('Order not found');
      return;
    }

    console.log(`Order: ${order.orderNumber}`);
    console.log(`Items count: ${order.items.length}\n`);

    order.items.forEach((item, index) => {
      console.log(`Item ${index + 1}:`);
      console.log(`  Product ID: ${item.product.id}`);
      console.log(`  Product Name: ${item.product.nameEn}`);
      console.log(`  Images count: ${item.product.images?.length || 0}`);

      if (item.product.images && item.product.images.length > 0) {
        item.product.images.forEach((image, imgIndex) => {
          console.log(`    Image ${imgIndex + 1}:`);
          console.log(`      ID: ${image.id}`);
          console.log(`      URL: ${image.url}`);
          console.log(`      Alt Text EN: ${image.altTextEn || 'N/A'}`);
          console.log(`      Display Order: ${image.displayOrder}`);
        });
      } else {
        console.log('    No images found');
      }
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testOrderImages();