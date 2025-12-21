const fs = require('fs');
const path = require('path');

async function testImageConversion() {
  try {
    console.log('=== Testing Image Conversion ===\n');

    // Test image path from the order
    const imagePath = '/uploads/products/9dd8b6b8-4696-4777-93fe-5b9ecce34be6/9dd8b6b8-4696-4777-93fe-5b9ecce34be6-1764320380595-bb502c.jpg';

    console.log('1. Testing image path resolution...');
    console.log(`   Image URL: ${imagePath}`);

    // Resolve the actual file path
    let resolvedPath;
    if (imagePath.startsWith('/uploads/')) {
      const uploadDirEnv = process.env.UPLOAD_DIR || 'uploads';
      const baseUploadPath = path.isAbsolute(uploadDirEnv)
        ? uploadDirEnv
        : path.join(process.cwd(), uploadDirEnv);

      const relativePath = imagePath.substring('/uploads/'.length);
      resolvedPath = path.join(baseUploadPath, relativePath);
    }

    console.log(`   Resolved path: ${resolvedPath}`);
    console.log(`   File exists: ${fs.existsSync(resolvedPath)}`);

    if (fs.existsSync(resolvedPath)) {
      const stats = fs.statSync(resolvedPath);
      console.log(`   File size: ${stats.size} bytes`);
      console.log(`   File type: ${path.extname(resolvedPath)}`);

      // Test reading the file
      try {
        const buffer = fs.readFileSync(resolvedPath);
        console.log(`   Successfully read file: ${buffer.length} bytes`);

        // Convert to base64
        const base64 = buffer.toString('base64');
        const dataUrl = `data:image/jpeg;base64,${base64}`;
        console.log(`   Base64 conversion successful: ${dataUrl.length} characters`);
        console.log(`   Base64 preview: ${dataUrl.substring(0, 100)}...`);

      } catch (readError) {
        console.error(`   Error reading file: ${readError.message}`);
      }
    }

    // Test with Sharp if available
    try {
      const sharp = require('sharp');
      console.log('\n2. Testing Sharp image processing...');

      if (fs.existsSync(resolvedPath)) {
        const metadata = await sharp(resolvedPath).metadata();
        console.log(`   Image dimensions: ${metadata.width}x${metadata.height}`);
        console.log(`   Image format: ${metadata.format}`);
        console.log(`   Image channels: ${metadata.channels}`);

        // Test optimization
        const optimized = await sharp(resolvedPath)
          .resize(800, 600, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({
            quality: 80,
            progressive: true,
          })
          .toBuffer();

        console.log(`   Optimized size: ${optimized.length} bytes`);
        const compressionRatio = ((fs.statSync(resolvedPath).size - optimized.length) / fs.statSync(resolvedPath).size) * 100;
        console.log(`   Compression ratio: ${compressionRatio.toFixed(1)}%`);

        // Convert optimized to base64
        const optimizedBase64 = `data:image/jpeg;base64,${optimized.toString('base64')}`;
        console.log(`   Optimized base64 length: ${optimizedBase64.length} characters`);
      }

    } catch (sharpError) {
      console.log('\n2. Sharp not available or error:', sharpError.message);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testImageConversion();