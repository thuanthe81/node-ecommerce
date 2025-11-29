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
- Main images: `backend/uploads/products/[product-id]/*.jpg`
- Thumbnails: `backend/uploads/products/[product-id]/thumbnails/*.jpg`

These directories are already configured in the `.gitignore` to avoid committing large binary files.

## Notes

- The generated images are simple placeholders with product names overlaid on gradient backgrounds
- For production, you should replace these with actual product photos
- The image URLs in the database use relative paths (`/uploads/products/...`) which are served by the NestJS static file middleware

## Image Storage Migration

### migrate-images.ts

Migrates product images from the legacy flat directory structure to the new hierarchical structure organized by product ID.

**What it does:**
- Identifies all existing product images in the flat directory structure
- Extracts product IDs from legacy filenames
- Creates product-specific directories
- Moves both original images and thumbnails to new locations
- Updates database URLs to reflect new paths
- Verifies migration success
- Creates database backup (optional)

**Usage:**

Preview migration without making changes:
```bash
npm run migrate:images -- --dry-run
```

Run migration with database backup:
```bash
npm run migrate:images -- --backup
```

Run migration with custom batch size:
```bash
npm run migrate:images -- --backup --batch-size 100
```

**Options:**
- `--dry-run` - Preview migration without making changes
- `--backup` - Create database backup before migration (recommended)
- `--batch-size <number>` - Number of images to process per batch (default: 50)

**Output:**
```
🚀 Starting migration...
💾 Creating database backup...
✓ Backup created: product_images_backup_20241128_100000

📊 Found 150 images to migrate

Processing batch 1/3...
✓ Migrated: abc-123.jpg → abc/123.jpg
...

📈 Migration Summary:
   Total images: 150
   Migrated: 148
   Failed: 0
   Skipped: 2
```

### verify-migration.ts

Verifies that the image storage migration completed successfully.

**What it does:**
- Checks all database URLs point to existing files
- Verifies files are in correct hierarchical structure
- Reports any mismatches or missing files
- Identifies files still in legacy location

**Usage:**
```bash
npm run verify:migration
```

**Output:**
```
🔍 Verifying migration...

Checking database URLs...
✓ All 148 database URLs point to existing files

Checking file locations...
✓ All files are in correct hierarchical structure

✓ Verification complete!
```

### cleanup-images.ts

Identifies and removes orphaned image directories (directories for products that no longer exist).

**What it does:**
- Scans uploads/products directory for subdirectories
- Checks if each product ID exists in database
- Identifies orphaned directories
- Calculates total size of orphaned directories
- Removes orphaned directories (with confirmation)

**Usage:**

Preview orphaned directories:
```bash
npm run cleanup:orphaned-images -- --dry-run
```

Remove orphaned directories:
```bash
npm run cleanup:orphaned-images -- --confirm
```

**Output:**
```
🔍 Scanning for orphaned directories...

Found 2 orphaned directories:
  - 9dd8b6b8-4696-4777-93fe-5b9ecce34be6 (5.2 MB)
  - a1b2c3d4-5678-90ab-cdef-1234567890ab (3.8 MB)

Total space to reclaim: 9.0 MB
```

## Image Storage Migration Workflow

To migrate from legacy flat structure to hierarchical structure:

1. **Preview migration:**
   ```bash
   npm run migrate:images -- --dry-run
   ```

2. **Run migration with backup:**
   ```bash
   npm run migrate:images -- --backup
   ```

3. **Verify migration:**
   ```bash
   npm run verify:migration
   ```

4. **Clean up orphaned directories:**
   ```bash
   npm run cleanup:orphaned-images -- --dry-run
   npm run cleanup:orphaned-images -- --confirm
   ```

**Important:**
- Always run with `--dry-run` first
- Create database backup before migration
- Verify sufficient disk space (2x current uploads)
- See [MIGRATION_RUNBOOK.md](./MIGRATION_RUNBOOK.md) for detailed instructions

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
