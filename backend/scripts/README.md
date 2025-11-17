# Backend Scripts

This directory contains utility scripts for managing the backend application.

## Product Image Management

### generate-product-images.ts

Generates placeholder product images and updates the database with local file paths.

**What it does:**
- Creates colorful gradient placeholder images for all products in the database
- Generates both main images (800x800) and thumbnails (400x400)
- Saves images to `backend/uploads/products/` directory
- Updates the database `product_images` table with local file paths (`/uploads/products/...`)

**Usage:**
```bash
npm run generate:images
```

**Features:**
- Uses Sharp library to generate high-quality JPEG images
- Creates SVG-based images with gradient backgrounds
- Each product gets a unique color from a predefined palette
- Automatically creates directory structure if it doesn't exist

### cleanup-old-images.ts

Removes old placeholder image URLs from the database.

**What it does:**
- Finds all product images with external placeholder URLs (e.g., `placeholder.com`)
- Deletes these old image records from the database
- Displays summary of removed images

**Usage:**
```bash
npm run cleanup:images
```

### verify-images.ts

Verifies product images in the database.

**What it does:**
- Lists all products and their associated images
- Shows image URLs and alt text for each product
- Useful for debugging and verification

**Usage:**
```bash
npm run verify:images
```

## Complete Workflow

To replace all product images with locally generated ones:

1. Generate new images and update database:
   ```bash
   npm run generate:images
   ```

2. Clean up old placeholder URLs:
   ```bash
   npm run cleanup:images
   ```

3. Verify the changes:
   ```bash
   npm run verify:images
   ```

## Image Storage

Generated images are stored in:
- Main images: `backend/uploads/products/*.jpg`
- Thumbnails: `backend/uploads/products/thumbnails/*.jpg`

These directories are already configured in the `.gitignore` to avoid committing large binary files.

## Notes

- The generated images are simple placeholders with product names overlaid on gradient backgrounds
- For production, you should replace these with actual product photos
- The image URLs in the database use relative paths (`/uploads/products/...`) which are served by the NestJS static file middleware
