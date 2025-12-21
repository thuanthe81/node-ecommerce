const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Mock the required services for testing
class MockBusinessInfoService {
  async getBusinessInfo(locale) {
    return {
      companyName: 'Test Company',
      logoUrl: null,
      address: 'Test Address',
      phone: '123-456-7890',
      email: 'test@example.com'
    };
  }
}

async function testTemplateEngine() {
  try {
    console.log('=== Testing Template Engine ===\n');

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

    // Create a simplified OrderPDFData object
    const businessInfoService = new MockBusinessInfoService();
    const businessInfo = await businessInfoService.getBusinessInfo('en');

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
      items: order.items.map((item) => {
        // Extract image URL properly
        let imageUrl;
        if (item.product?.images && Array.isArray(item.product.images) && item.product.images.length > 0) {
          imageUrl = item.product.images[0].url || item.product.images[0];
        }

        return {
          id: item.product.id,
          name: item.product.nameEn,
          description: item.product.descriptionEn,
          sku: item.product.sku,
          quantity: item.quantity,
          unitPrice: Number(item.price),
          totalPrice: Number(item.total || item.price * item.quantity),
          imageUrl,
          category: item.product.category?.nameEn,
        };
      }),
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
      businessInfo,
      locale: 'en',
    };

    console.log('2. OrderPDFData created');
    console.log('3. Items with images:');
    orderPDFData.items.forEach((item, index) => {
      console.log(`   Item ${index + 1}: ${item.name}`);
      console.log(`   Image URL: ${item.imageUrl || 'NO IMAGE'}`);
    });

    // Test image conversion manually
    console.log('\n4. Testing image conversion...');

    const fs = require('fs');
    const path = require('path');

    const firstItem = orderPDFData.items[0];
    if (firstItem.imageUrl) {
      try {
        // Resolve image path
        const uploadDirEnv = process.env.UPLOAD_DIR || 'uploads';
        const baseUploadPath = path.isAbsolute(uploadDirEnv)
          ? uploadDirEnv
          : path.join(process.cwd(), uploadDirEnv);

        const relativePath = firstItem.imageUrl.substring('/uploads/'.length);
        const resolvedPath = path.join(baseUploadPath, relativePath);

        console.log(`   Resolving: ${firstItem.imageUrl} -> ${resolvedPath}`);
        console.log(`   File exists: ${fs.existsSync(resolvedPath)}`);

        if (fs.existsSync(resolvedPath)) {
          const buffer = fs.readFileSync(resolvedPath);
          const base64 = buffer.toString('base64');
          const dataUrl = `data:image/jpeg;base64,${base64}`;

          console.log(`   Base64 conversion successful: ${dataUrl.length} characters`);

          // Update the item with base64 image
          firstItem.imageUrl = dataUrl;
          console.log(`   Updated item image URL to base64`);
        }
      } catch (imageError) {
        console.error(`   Image conversion error: ${imageError.message}`);
      }
    }

    // Test simple HTML generation
    console.log('\n5. Testing simple HTML generation...');

    const simpleHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Order ${orderPDFData.orderNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .product-image { max-width: 100px; max-height: 100px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          </style>
        </head>
        <body>
          <h1>Order Confirmation</h1>
          <p>Order Number: ${orderPDFData.orderNumber}</p>
          <p>Customer: ${orderPDFData.customerInfo.name}</p>

          <h2>Items</h2>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${orderPDFData.items.map(item => `
                <tr>
                  <td>
                    ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.name}" class="product-image" />` : ''}
                    <br>${item.name}
                  </td>
                  <td>${item.quantity}</td>
                  <td>${item.unitPrice.toLocaleString('vi-VN')} ₫</td>
                  <td>${item.totalPrice.toLocaleString('vi-VN')} ₫</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h2>Total: ${orderPDFData.pricing.total.toLocaleString('vi-VN')} ₫</h2>
        </body>
      </html>
    `;

    console.log(`   HTML generated, length: ${simpleHTML.length} characters`);

    // Test PDF generation with this HTML
    console.log('\n6. Testing PDF generation with template HTML...');

    const puppeteer = require('puppeteer');
    let browser;

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 794, height: 1123 });

      console.log('   Setting HTML content...');
      await page.setContent(simpleHTML, { waitUntil: 'networkidle0' });

      console.log('   Generating PDF...');
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        }
      });

      await page.close();

      // Save PDF
      const fileName = `test-template-${Date.now()}.pdf`;
      const filePath = path.join(process.cwd(), 'uploads', 'pdfs', fileName);

      // Ensure directory exists
      const uploadDir = path.dirname(filePath);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      fs.writeFileSync(filePath, pdfBuffer);

      console.log(`   PDF saved successfully: ${filePath}`);
      console.log(`   PDF size: ${pdfBuffer.length} bytes`);

    } catch (pdfError) {
      console.error(`   PDF generation error: ${pdfError.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTemplateEngine();