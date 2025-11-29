# Product Image Storage API Documentation

## Overview

This document describes the product image storage system, including the new hierarchical directory structure, migration process, and cleanup utilities.

## Image Storage Structure

### New Hierarchical Structure (Current)

Images are organized by product ID in a hierarchical directory structure:

```
uploads/
  products/
    [product-id-1]/
      [timestamp]-[random].jpg          # Original images
      [timestamp]-[random].jpg
      thumbnails/
        [timestamp]-[random].jpg        # Thumbnail images
        [timestamp]-[random].jpg
    [product-id-2]/
      [timestamp]-[random].jpg
      thumbnails/
        [timestamp]-[random].jpg
```

**Benefits:**
- Improved file system performance with smaller directories
- Clear ownership: each product has its own directory
- Simplified cleanup: delete entire directory when product is removed
- Easier to identify orphaned images
- Better organization for backups and migrations

### Legacy Flat Structure (Deprecated)

The previous flat structure stored all images in a single directory:

```
uploads/
  products/
    [product-id]-[timestamp]-[random].jpg
    [product-id]-[timestamp]-[random].jpg
    thumbnails/
      [product-id]-[timestamp]-[random].jpg
      [product-id]-[timestamp]-[random].jpg
```

**Note:** The system maintains backward compatibility for reading images from the legacy structure during the transition period.

## Image URL Format

### New Format
```
/uploads/products/[product-id]/[timestamp]-[random].jpg
/uploads/products/[product-id]/thumbnails/[timestamp]-[random].jpg
```

**Example:**
```
/uploads/products/9dd8b6b8-4696-4777-93fe-5b9ecce34be6/1732800123456-a1b2c3.jpg
/uploads/products/9dd8b6b8-4696-4777-93fe-5b9ecce34be6/thumbnails/1732800123456-a1b2c3.jpg
```

### Legacy Format (Deprecated)
```
/uploads/products/[product-id]-[timestamp]-[random].jpg
/uploads/products/thumbnails/[product-id]-[timestamp]-[random].jpg
```

## API Endpoints

### Upload Product Image

**Endpoint:** `POST /api/products/:productId/images`

**Authentication:** Required (Admin role)

**Content-Type:** `multipart/form-data`

**Request Body:**
- `file`: File (required) - Image file to upload
- `altTextEn`: string (optional) - English alt text
- `altTextVi`: string (optional) - Vietnamese alt text
- `displayOrder`: number (optional) - Display order for the image

**Response:**
```json
{
  "id": "image-uuid",
  "productId": "product-uuid",
  "url": "/uploads/products/product-uuid/1732800123456-a1b2c3.jpg",
  "altTextEn": "Product front view",
  "altTextVi": "Mặt trước sản phẩm",
  "displayOrder": 0,
  "createdAt": "2024-11-28T10:00:00.000Z",
  "updatedAt": "2024-11-28T10:00:00.000Z"
}
```

**Storage Behavior:**
- Creates product-specific directory if it doesn't exist: `uploads/products/[product-id]/`
- Creates thumbnails subdirectory: `uploads/products/[product-id]/thumbnails/`
- Stores original image in product directory
- Generates and stores thumbnail in thumbnails subdirectory
- Updates database with new URL format

**Validation:**
- Allowed formats: JPEG, PNG, WebP
- Max file size: 5MB
- Image processing:
  - Main image: Resized to max 1200x1200px (maintains aspect ratio)
  - Thumbnail: Resized to 300x300px (cropped to fit)

### Upload Multiple Product Images

**Endpoint:** `POST /api/products/:productId/images/batch`

**Authentication:** Required (Admin role)

**Content-Type:** `multipart/form-data`

**Request Body:**
- `files`: File[] (required) - Array of image files
- `altTextEn`: string (optional) - English alt text for all images
- `altTextVi`: string (optional) - Vietnamese alt text for all images

**Response:**
```json
{
  "images": [
    {
      "id": "image-uuid-1",
      "productId": "product-uuid",
      "url": "/uploads/products/product-uuid/1732800123456-a1b2c3.jpg",
      "displayOrder": 0,
      ...
    },
    {
      "id": "image-uuid-2",
      "productId": "product-uuid",
      "url": "/uploads/products/product-uuid/1732800123457-d4e5f6.jpg",
      "displayOrder": 1,
      ...
    }
  ],
  "errors": []
}
```

**Storage Behavior:**
- All images for a product are stored in the same product-specific directory
- Maintains sequential display order
- Creates directories only once for the batch

### Delete Product Image

**Endpoint:** `DELETE /api/products/:productId/images/:imageId`

**Authentication:** Required (Admin role)

**Response:**
```json
{
  "message": "Image deleted successfully"
}
```

**Storage Behavior:**
- Deletes both original image and thumbnail
- If this is the last image for the product, removes the entire product directory
- If other images exist, only removes the specific image files

### Get Product Images

**Endpoint:** `GET /api/products/:productId/images`

**Authentication:** Not required

**Response:**
```json
[
  {
    "id": "image-uuid",
    "productId": "product-uuid",
    "url": "/uploads/products/product-uuid/1732800123456-a1b2c3.jpg",
    "altTextEn": "Product front view",
    "altTextVi": "Mặt trước sản phẩm",
    "displayOrder": 0,
    "createdAt": "2024-11-28T10:00:00.000Z",
    "updatedAt": "2024-11-28T10:00:00.000Z"
  }
]
```

## Image Retrieval

### Backward Compatibility

The system maintains backward compatibility during the migration period:

1. **Hierarchical Location (Priority)**: Checks new structure first
   - `uploads/products/[product-id]/[filename].jpg`
   - `uploads/products/[product-id]/thumbnails/[filename].jpg`

2. **Legacy Fallback**: If not found, checks legacy structure
   - `uploads/products/[product-id]-[timestamp]-[random].jpg`
   - `uploads/products/thumbnails/[product-id]-[timestamp]-[random].jpg`

3. **Logging**: When serving from legacy location, logs a warning for monitoring

**Note:** After migration is complete and verified, the backward compatibility code should be removed.

## Migration Process

### Overview

The migration process moves existing images from the flat directory structure to the new hierarchical structure.

### Migration Script

**Command:**
```bash
npm run migrate:images -- [options]
```

**Options:**
- `--dry-run`: Preview migration without making changes
- `--batch-size <number>`: Number of images to process per batch (default: 50)
- `--backup`: Create database backup before migration (recommended)

**Example:**
```bash
# Preview migration
npm run migrate:images -- --dry-run

# Run migration with backup
npm run migrate:images -- --backup --batch-size 100
```

### Migration Process Steps

1. **Database Backup** (if `--backup` flag is used)
   - Creates backup of ProductImage table
   - Stores backup with timestamp

2. **Image Identification**
   - Queries all ProductImage records from database
   - Extracts product ID from legacy filename format

3. **Directory Creation**
   - Creates product-specific directory: `uploads/products/[product-id]/`
   - Creates thumbnails subdirectory: `uploads/products/[product-id]/thumbnails/`

4. **File Migration**
   - Copies original image to new location
   - Copies thumbnail to new location
   - Verifies copy succeeded before deleting originals

5. **Database Update**
   - Updates ProductImage URL to new format
   - Uses transactions for atomicity
   - Rolls back on failure

6. **Verification**
   - Verifies all database URLs point to existing files
   - Reports any mismatches

### Migration Result

```json
{
  "totalImages": 150,
  "migratedImages": 148,
  "failedImages": 0,
  "skippedImages": 2,
  "errors": [
    {
      "imageId": "image-uuid",
      "filename": "invalid-filename.jpg",
      "error": "Could not extract product ID from filename"
    }
  ]
}
```

### Verification Script

**Command:**
```bash
npm run verify:migration
```

**Purpose:**
- Checks all database URLs point to existing files
- Reports any mismatches or missing files
- Should be run after migration completes

## Cleanup Process

### Overview

The cleanup process identifies and removes orphaned image directories (directories for products that no longer exist in the database).

### Cleanup Script

**Command:**
```bash
npm run cleanup:images -- [options]
```

**Options:**
- `--dry-run`: Preview cleanup without making changes
- `--confirm`: Confirm deletion of orphaned directories

**Example:**
```bash
# Preview orphaned directories
npm run cleanup:images -- --dry-run

# Remove orphaned directories
npm run cleanup:images -- --confirm
```

### Cleanup Process Steps

1. **Directory Discovery**
   - Scans `uploads/products/` directory for subdirectories
   - Extracts product IDs from directory names

2. **Orphan Detection**
   - For each directory, checks if product exists in database
   - Marks directories as orphaned if product doesn't exist
   - Calculates total size of orphaned directories

3. **Reporting**
   - Lists all orphaned directories
   - Shows total disk space that can be reclaimed
   - Provides recommendations

4. **Cleanup** (if `--confirm` flag is used)
   - Removes orphaned directories and all contents
   - Handles permission errors gracefully
   - Reports results

### Cleanup Result

```json
{
  "orphanedDirectories": [
    "9dd8b6b8-4696-4777-93fe-5b9ecce34be6",
    "a1b2c3d4-5678-90ab-cdef-1234567890ab"
  ],
  "totalSize": 15728640,
  "recommendations": [
    "Run with --confirm flag to remove 2 orphaned directories",
    "This will free up 15.0 MB of disk space"
  ]
}
```

## Error Handling

### Upload Errors

| Error | Status Code | Description | Resolution |
|-------|-------------|-------------|------------|
| Invalid file type | 400 | File is not JPEG, PNG, or WebP | Upload a valid image file |
| File too large | 400 | File exceeds 5MB limit | Reduce file size or compress image |
| Disk space full | 500 | Insufficient disk space | Free up disk space |
| Product not found | 404 | Product ID doesn't exist | Verify product ID |
| Permission denied | 500 | Cannot write to upload directory | Check file permissions |

### Migration Errors

| Error | Description | Resolution |
|-------|-------------|------------|
| Invalid filename | Cannot extract product ID from filename | File is skipped, logged in errors |
| File copy failed | Cannot copy file to new location | Check disk space and permissions |
| Database update failed | Cannot update URL in database | Transaction is rolled back, original files preserved |
| Missing thumbnail | Thumbnail file doesn't exist | Original is migrated, thumbnail is skipped |

### Cleanup Errors

| Error | Description | Resolution |
|-------|-------------|------------|
| Permission denied | Cannot delete directory | Check file permissions, may require manual deletion |
| Directory not empty | Unexpected files in directory | Review directory contents, may require manual cleanup |

## Monitoring and Logging

### Key Metrics

- **Upload success/failure rate**: Monitor upload endpoint responses
- **Migration progress**: Track migrated/failed/skipped counts
- **Legacy fallback usage**: Should decrease to zero after migration
- **Orphaned directory count**: Should remain low with proper cleanup

### Log Levels

- **INFO**: Normal operations (upload, migration progress)
- **WARN**: Legacy fallback usage, non-critical errors
- **ERROR**: Upload failures, migration failures, cleanup errors

### Example Logs

```
[INFO] Uploaded image for product 9dd8b6b8-4696-4777-93fe-5b9ecce34be6
[INFO] Migration progress: 50/150 images migrated
[WARN] Serving image from legacy location: /uploads/products/old-image.jpg
[ERROR] Failed to migrate image abc123: File copy failed
```

## Best Practices

### For Developers

1. **Always use ProductsImageService** for image operations
   - Don't manipulate files directly
   - Service handles directory creation and cleanup

2. **Test with both structures** during transition
   - Verify new uploads use hierarchical structure
   - Verify legacy images still accessible

3. **Monitor legacy fallback usage**
   - Should decrease over time
   - Investigate if usage increases

### For System Administrators

1. **Before Migration**
   - Backup database
   - Verify sufficient disk space (2x current usage)
   - Run with `--dry-run` first

2. **During Migration**
   - Monitor progress logs
   - Watch for errors
   - Don't interrupt the process

3. **After Migration**
   - Run verification script
   - Test image retrieval
   - Monitor for issues
   - Run cleanup after verification

4. **Regular Maintenance**
   - Run cleanup utility periodically
   - Monitor disk space usage
   - Review orphaned directories

## Security Considerations

### Path Traversal Prevention

- Product IDs are validated as UUIDs
- All file paths are sanitized
- User input is never used directly in paths

### File Permissions

- Upload directories have restricted permissions
- Only application can write to directories
- Proper umask settings applied

### Access Control

- Upload endpoints require admin authentication
- Public endpoints only allow read access
- No directory listing exposed

## Performance Considerations

### File System Performance

- **Before**: O(N) lookup time in single directory
- **After**: O(M) lookup time per product directory
- **Expected improvement**: Significant for N > 1000 files

### Migration Performance

- Processes images in batches (default: 50)
- Uses parallel file operations where safe
- Estimated time: ~1-2 seconds per image

### Storage Requirements

- **During migration**: 2x storage (old + new files)
- **After migration**: Same storage as before
- **Recommendation**: 50% free space before migration

## Troubleshooting

### Images Not Displaying After Migration

1. Check database URLs are updated correctly
2. Verify files exist at new locations
3. Check file permissions
4. Review migration logs for errors

### Migration Stuck or Slow

1. Check disk I/O performance
2. Reduce batch size
3. Check for file system errors
4. Monitor disk space

### Orphaned Directories Growing

1. Verify product deletion cleanup is working
2. Run cleanup utility regularly
3. Check for failed deletions in logs
4. Review application logs for errors

## Related Documentation

- [Products Module README](./README.md) - General products module documentation
- [Backward Compatibility](./BACKWARD_COMPATIBILITY.md) - Details on legacy support
- [Migration Runbook](../../scripts/MIGRATION_RUNBOOK.md) - Step-by-step migration guide
