import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

const prisma = new PrismaClient();

// Generate a simple colored placeholder image with text overlay
async function generatePlaceholderImage(
  text: string,
  width: number,
  height: number,
  outputPath: string,
  color: string,
): Promise<void> {
  // Create SVG with text
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${adjustColor(color, -30)};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad)"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="36" font-weight="bold"
            fill="white" text-anchor="middle" dominant-baseline="middle">
        ${escapeXml(text)}
      </text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .jpeg({ quality: 90 })
    .toFile(outputPath);
}

// Helper to darken/lighten color
function adjustColor(color: string, amount: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// Escape XML special characters
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function main() {
  console.log('Starting product image generation...');

  // Ensure uploads directory exists
  const uploadsDir = path.join(__dirname, '..', 'uploads', 'products');
  const thumbnailsDir = path.join(uploadsDir, 'thumbnails');

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  if (!fs.existsSync(thumbnailsDir)) {
    fs.mkdirSync(thumbnailsDir, { recursive: true });
  }

  // Get all products with their images
  const products = await prisma.product.findMany({
    include: {
      images: true,
    },
  });

  console.log(`Found ${products.length} products`);

  // Color palette for different products
  const colors = [
    '#667eea', // Purple
    '#f093fb', // Pink
    '#4facfe', // Blue
    '#43e97b', // Green
    '#fa709a', // Rose
    '#feca57', // Yellow
  ];

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const color = colors[i % colors.length];

    console.log(`Processing product: ${product.nameEn}`);

    // Generate image filename based on product slug
    const imageFilename = `${product.slug}-main.jpg`;
    const thumbnailFilename = `${product.slug}-thumb.jpg`;

    const imagePath = path.join(uploadsDir, imageFilename);
    const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);

    // Generate main image (800x800)
    await generatePlaceholderImage(product.nameEn, 800, 800, imagePath, color);
    console.log(`  Generated main image: ${imageFilename}`);

    // Generate thumbnail (400x400)
    await generatePlaceholderImage(product.nameEn, 400, 400, thumbnailPath, color);
    console.log(`  Generated thumbnail: ${thumbnailFilename}`);

    // Update or create product image record
    const imageUrl = `/uploads/products/${imageFilename}`;

    if (product.images.length > 0) {
      // Update existing image
      await prisma.productImage.update({
        where: { id: product.images[0].id },
        data: {
          url: imageUrl,
          altTextEn: product.nameEn,
          altTextVi: product.nameVi,
        },
      });
      console.log(`  Updated image URL in database`);
    } else {
      // Create new image record
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: imageUrl,
          altTextEn: product.nameEn,
          altTextVi: product.nameVi,
          displayOrder: 0,
        },
      });
      console.log(`  Created new image record in database`);
    }
  }

  console.log('Product image generation completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error generating product images:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
