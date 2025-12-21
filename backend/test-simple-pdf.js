const { PrismaClient } = require('@prisma/client');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function testSimplePDF() {
  let browser;

  try {
    console.log('=== Testing Simple PDF Generation ===\n');

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
      },
    });

    if (!order) {
      console.log('Order not found');
      return;
    }

    console.log('1. Order found with items:', order.items.length);

    // Extract image URL
    const firstItem = order.items[0];
    const imageUrl = firstItem.product.images[0]?.url;
    console.log('2. First product image URL:', imageUrl);

    if (imageUrl) {
      // Test image path resolution
      const uploadDirEnv = process.env.UPLOAD_DIR || 'uploads';
      const baseUploadPath = path.isAbsolute(uploadDirEnv)
        ? uploadDirEnv
        : path.join(process.cwd(), uploadDirEnv);

      const relativePath = imageUrl.substring('/uploads/'.length);
      const resolvedPath = path.join(baseUploadPath, relativePath);

      console.log('3. Resolved image path:', resolvedPath);
      console.log('4. Image exists:', fs.existsSync(resolvedPath));

      if (fs.existsSync(resolvedPath)) {
        // Convert to base64
        const buffer = fs.readFileSync(resolvedPath);
        const base64 = buffer.toString('base64');
        const dataUrl = `data:image/jpeg;base64,${base64}`;

        console.log('5. Base64 conversion successful, length:', dataUrl.length);

        // Create simple HTML with the image
        const simpleHTML = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>Test PDF</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .product-image { max-width: 200px; max-height: 200px; }
              </style>
            </head>
            <body>
              <h1>Order: ${order.orderNumber}</h1>
              <h2>Product: ${firstItem.product.nameEn}</h2>
              <p>Testing image display in PDF:</p>
              <img src="${dataUrl}" alt="${firstItem.product.nameEn}" class="product-image" />
              <p>Image should appear above this text.</p>
            </body>
          </html>
        `;

        console.log('6. HTML generated, length:', simpleHTML.length);

        // Test Puppeteer PDF generation
        console.log('7. Launching Puppeteer...');
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

        console.log('8. Creating page...');
        const page = await browser.newPage();

        console.log('9. Setting viewport...');
        await page.setViewport({ width: 794, height: 1123 });

        console.log('10. Setting content...');
        await page.setContent(simpleHTML, { waitUntil: 'networkidle0' });

        console.log('11. Generating PDF...');
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

        console.log('12. Closing page...');
        await page.close();

        // Save PDF
        const fileName = `test-simple-${Date.now()}.pdf`;
        const filePath = path.join(process.cwd(), 'uploads', 'pdfs', fileName);

        // Ensure directory exists
        const uploadDir = path.dirname(filePath);
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        fs.writeFileSync(filePath, pdfBuffer);

        console.log('13. PDF saved successfully:', filePath);
        console.log('14. PDF size:', pdfBuffer.length, 'bytes');

      } else {
        console.log('5. Image file not found, skipping PDF test');
      }
    } else {
      console.log('3. No image URL found, skipping PDF test');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
    await prisma.$disconnect();
  }
}

testSimplePDF();