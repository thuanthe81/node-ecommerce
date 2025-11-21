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

## Address Deduplication

### deduplicate-addresses.ts

Identifies and merges duplicate addresses in the database using the same normalization logic as the runtime deduplication system.

**What it does:**
- Finds groups of duplicate addresses per user based on normalized key fields (addressLine1, addressLine2, city, state, postalCode, country)
- Preserves the most recently created address in each duplicate group
- Updates order references (shippingAddressId, billingAddressId) to point to the preserved address
- Deletes redundant address records
- Preserves default address designation when merging duplicates
- Skips guest addresses (userId = null) as they are transient

**Usage:**

Preview changes without modifying the database (recommended first step):
```bash
npx ts-node scripts/deduplicate-addresses.ts --dry-run
```

Apply changes to the database:
```bash
npx ts-node scripts/deduplicate-addresses.ts
```

**⚠️ Warning:**
- Always run with `--dry-run` first to preview the changes
- This script modifies the database and deletes records
- Make sure you have a database backup before running in live mode
- The script waits 3 seconds before applying changes to give you time to cancel

**Output:**
The script provides detailed output showing:
- Number of users affected
- Each duplicate group with addresses to keep and delete
- Order references that will be updated
- Summary statistics (addresses deleted, orders updated, defaults preserved)

**Example output:**
```
=== DRY RUN PREVIEW ===

Users affected: 1
Duplicate groups found: 2

Group for user abc-123:
  Address to KEEP: xyz-789
    - 123 Main St
    - New York, NY 10001
    - Created: 2025-11-21T06:23:30.699Z
    - Default: true
  Address to DELETE: def-456
    - 123 Main St
    - New York, NY 10001
    - Created: 2025-11-20T06:23:30.687Z
    - Default: false
    - Orders to update: 5 (3 shipping, 2 billing)

=== SUMMARY ===
Total addresses to delete: 1
Total order references to update: 5
Groups with default address: 1
```
