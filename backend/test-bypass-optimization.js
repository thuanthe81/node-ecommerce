const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function testBypassOptimization() {
  try {
    console.log('=== Testing Bypass Optimization ===\n');

    // Get the order with images
    const order = await prisma.order.findUnique({
      where: { orderNumber: 'ORD-1766207385272-881' },
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
        shippingAddress: true,
        billingAddress: true,
      },
    });

    if (!order) {
      console.log('Order not found');
      return;
    }

    console.log('1. Order found with items:', order.items.length);

    // Create OrderPDFData with simple image processing (no optimization)
    const orderPDFData = {
      orderNumber: order.orderNumber,
      orderDate: order.createdAt.toISOString().split('T')[0],
      customerInfo: {
        name: order.shippingAddress?.fullName || 'Test Customer',
        email: order.email,
        phone: order.shippingAddress?.phone,
      },
      billingAddress: order.billingAddress || {
        fullName: 'Test Customer',
        addressLine1: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        postalCode: '12345',
        country: 'VN',
      },
      shippingAddress: order.shippingAddress || {
        fullName: 'Test Customer',
        addressLine1: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        postalCode: '12345',
        country: 'VN',
      },
      items: [],
      pricing: {
        subtotal: Number(order.subtotal),
        shippingCost: Number(order.shippingCost),
        taxAmount: Number(order.taxAmount || 0),
        discountAmount: Number(order.discountAmount || 0),
        total: Number(order.total),
      },
      paymentMethod: {
        type: order.paymentMethod,
        displayName: order.paymentMethod,
        status: order.paymentStatus,
      },
      shippingMethod: {
        name: order.shippingMethod || 'Standard',
        description: 'Standard shipping',
      },
      businessInfo: {
        companyName: 'Test Company',
        logoUrl: null,
        address: 'Test Address',
        phone: '123-456-7890',
        email: 'test@example.com'
      },
      locale: 'en',
    };

    console.log('2. Processing items with simple image conversion...');

    // Process items with simple image conversion (no Sharp optimization)
    for (let i = 0; i < order.items.length; i++) {
      const item = order.items[i];
      console.log(`   Processing item ${i + 1}: ${item.product.nameEn}`);

      // Extract image URL
      let imageUrl;
      if (item.product?.images && Array.isArray(item.product.images) && item.product.images.length > 0) {
        imageUrl = item.product.images[0].url || item.product.images[0];
        console.log(`   Original image URL: ${imageUrl}`);

        // Convert to base64 without optimization
        try {
          const uploadDirEnv = process.env.UPLOAD_DIR || 'uploads';
          const baseUploadPath = path.isAbsolute(uploadDirEnv)
            ? uploadDirEnv
            : path.join(process.cwd(), uploadDirEnv);

          const relativePath = imageUrl.substring('/uploads/'.length);
          const resolvedPath = path.join(baseUploadPath, relativePath);

          if (fs.existsSync(resolvedPath)) {
            const buffer = fs.readFileSync(resolvedPath);
            console.log(`   Original image size: ${buffer.length} bytes`);

            // Simple resize using Sharp (but not aggressive optimization)
            const sharp = require('sharp');
            const resizedBuffer = await sharp(buffer)
              .resize(400, 300, { // Smaller size to reduce PDF complexity
                fit: 'inside',
                withoutEnlargement: true,
              })
              .jpeg({ quality: 70 }) // Lower quality for smaller size
              .toBuffer();

            console.log(`   Resized image size: ${resizedBuffer.length} bytes`);

            const base64 = resizedBuffer.toString('base64');
            imageUrl = `data:image/jpeg;base64,${base64}`;
            console.log(`   Base64 conversion successful: ${imageUrl.length} characters`);
          } else {
            console.log(`   Image file not found: ${resolvedPath}`);
            imageUrl = undefined;
          }
        } catch (imageError) {
          console.error(`   Image processing error: ${imageError.message}`);
          imageUrl = undefined;
        }
      }

      orderPDFData.items.push({
        id: item.product.id,
        name: item.product.nameEn,
        description: item.product.descriptionEn,
        sku: item.product.sku,
        quantity: item.quantity,
        unitPrice: Number(item.price),
        totalPrice: Number(item.total || item.price * item.quantity),
        imageUrl,
        category: item.product.category?.nameEn,
      });
    }

    console.log('3. Items processed successfully');

    // Test with the NestJS service (if available)
    console.log('\n4. Testing with actual service...');

    try {
      // Try to use the actual service
      const { NestFactory } = require('@nestjs/core');
      const { AppModule } = require('./dist/app.module');

      const app = await NestFactory.createApplicationContext(AppModule);
      const emailAttachmentService = app.get('EmailAttachmentService');

      console.log('   Service loaded, testing sendOrderConfirmationWithPDF...');

      const result = await emailAttachmentService.sendOrderConfirmationWithPDF(
        order.email,
        orderPDFData,
        'en'
      );

      console.log('   Result:', {
        success: result.success,
        error: result.error,
        attachmentSize: result.attachmentSize,
        deliveryStatus: result.deliveryStatus
      });

      await app.close();

    } catch (serviceError) {
      console.log(`   Service test failed: ${serviceError.message}`);
      console.log('   This is expected if the build is not available');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBypassOptimization();