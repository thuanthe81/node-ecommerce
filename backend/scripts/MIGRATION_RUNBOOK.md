# Product Image Storage Migration Runbook

## Overview

This runbook provides step-by-step instructions for migrating product images from the legacy flat directory structure to the new hierarchical structure organized by product ID.

**Migration Goal:** Move all product images from `uploads/products/[product-id]-[timestamp]-[random].jpg` to `uploads/products/[product-id]/[timestamp]-[random].jpg`

**Estimated Duration:** 1-2 seconds per image (e.g., 150 images ≈ 3-5 minutes)

**Risk Level:** Low (with proper backup and verification)

## Pre-Migration Checklist

### 1. Environment Verification

- [ ] Confirm target environment (staging/production)
- [ ] Verify Node.js version (v18 or higher)
- [ ] Verify npm packages are installed (`npm install`)
- [ ] Verify database connection is working
- [ ] Verify application is running normally

### 2. Backup Requirements

#### Database Backup

**Critical:** Always backup the database before migration.

```bash
# PostgreSQL backup example
pg_dump -h localhost -U your_user -d your_database > backup_$(date +%Y%m%d_%H%M%S).sql

# Or use your cloud provider's backup tool
# AWS RDS: Create manual snapshot
# Google Cloud SQL: Create backup
# Azure Database: Create backup
```

**Verify backup:**
```bash
# Check backup file exists and has content
ls -lh backup_*.sql
```

#### File System Backup

**Recommended:** Backup the uploads directory.

```bash
# Create compressed backup of uploads directory
tar -czf uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz backend/uploads/products/

# Verify backup
tar -tzf uploads_backup_*.tar.gz | head -20
```

**Alternative:** Use your cloud storage backup (S3 versioning, GCS snapshots, etc.)

### 3. Disk Space Verification

**Critical:** Ensure sufficient disk space for migration.

**Required Space:** 2x current uploads directory size (temporary during migration)

```bash
# Check current uploads directory size
du -sh backend/uploads/products/

# Check available disk space
df -h backend/uploads/

# Ensure available space is at least 2x the uploads directory size
```

**Example:**
- Current uploads: 500 MB
- Required free space: 1 GB minimum
- Recommended free space: 1.5 GB (with buffer)

### 4. Application State

- [ ] Verify no active deployments in progress
- [ ] Notify team of maintenance window (if applicable)
- [ ] Consider enabling maintenance mode (optional)
- [ ] Verify no critical operations running

### 5. Access Verification

```bash
# Verify write permissions on uploads directory
touch backend/uploads/products/test_write && rm backend/uploads/products/test_write

# Verify database access
npm run prisma:studio # Should open successfully
```

## Migration Steps

### Step 1: Dry Run (Preview)

**Purpose:** Preview migration without making any changes.

```bash
cd backend
npm run migrate:images -- --dry-run
```

**Expected Output:**
```
🔍 Starting migration (DRY RUN)...
📊 Found 150 images to migrate
✓ Would migrate: /uploads/products/abc-123.jpg → /uploads/products/abc/123.jpg
✓ Would migrate: /uploads/products/def-456.jpg → /uploads/products/def/456.jpg
...
📈 Migration Summary (DRY RUN):
   Total images: 150
   Would migrate: 148
   Would skip: 2
   Estimated time: ~3-5 minutes
```

**Review:**
- [ ] Total image count matches expected
- [ ] No unexpected errors
- [ ] Skipped images are acceptable (invalid filenames)
- [ ] Estimated time is reasonable

### Step 2: Create Database Backup (Automated)

**Purpose:** Create backup of ProductImage table before migration.

```bash
npm run migrate:images -- --backup --dry-run
```

**Expected Output:**
```
💾 Creating database backup...
✓ Backup created: product_images_backup_20241128_100000
```

**Verify:**
```bash
# Check backup table exists
npm run prisma:studio
# Look for table: product_images_backup_YYYYMMDD_HHMMSS
```

### Step 3: Run Migration

**Purpose:** Execute the actual migration.

```bash
npm run migrate:images -- --backup --batch-size 50
```

**Parameters:**
- `--backup`: Creates database backup before migration
- `--batch-size 50`: Processes 50 images per batch (adjust based on system performance)

**Expected Output:**
```
🚀 Starting migration...
💾 Creating database backup...
✓ Backup created: product_images_backup_20241128_100000

📊 Found 150 images to migrate

Processing batch 1/3...
✓ Migrated: abc-123.jpg → abc/123.jpg
✓ Migrated: def-456.jpg → def/456.jpg
...
✓ Batch 1/3 complete (50/150)

Processing batch 2/3...
✓ Migrated: ghi-789.jpg → ghi/789.jpg
...
✓ Batch 2/3 complete (100/150)

Processing batch 3/3...
✓ Migrated: jkl-012.jpg → jkl/012.jpg
...
✓ Batch 3/3 complete (150/150)

📈 Migration Summary:
   Total images: 150
   Migrated: 148
   Failed: 0
   Skipped: 2
   Duration: 4m 32s

✓ Migration completed successfully!
```

**Monitor:**
- [ ] No errors during migration
- [ ] Progress updates are regular
- [ ] Failed count is 0 or acceptable
- [ ] Skipped images are logged with reasons

**If Errors Occur:**
1. Note the error message
2. Check disk space: `df -h`
3. Check file permissions: `ls -la backend/uploads/products/`
4. Review error logs
5. See "Rollback Procedure" section if needed

### Step 4: Verify Migration

**Purpose:** Verify all images migrated successfully and database URLs are correct.

```bash
npm run verify:migration
```

**Expected Output:**
```
🔍 Verifying migration...

Checking database URLs...
✓ All 148 database URLs point to existing files

Checking file locations...
✓ All files are in correct hierarchical structure

Checking for orphaned files...
⚠ Found 2 files in legacy location (skipped during migration)
  - invalid-filename-1.jpg
  - invalid-filename-2.jpg

✓ Verification complete!
  - Valid images: 148/148
  - Issues: 0
```

**Review:**
- [ ] All database URLs point to existing files
- [ ] No missing files
- [ ] Orphaned files are acceptable (invalid filenames)

**If Issues Found:**
1. Review verification report
2. Check specific files mentioned
3. See "Troubleshooting" section
4. Consider rollback if critical issues

### Step 5: Test Image Retrieval

**Purpose:** Verify images are accessible through the application.

#### Test via API

```bash
# Get a product with images
curl http://localhost:3000/api/products/[product-slug]

# Verify image URLs in response
# Should see: /uploads/products/[product-id]/[filename].jpg
```

#### Test via Browser

1. Open application in browser
2. Navigate to product detail page
3. Verify images load correctly
4. Check browser console for errors
5. Test multiple products

**Checklist:**
- [ ] Product images display correctly
- [ ] Thumbnails display correctly
- [ ] No 404 errors in browser console
- [ ] Image URLs use new format
- [ ] No warnings about legacy fallback

### Step 6: Monitor Application

**Purpose:** Ensure application is functioning normally after migration.

```bash
# Check application logs
tail -f backend/logs/application.log

# Look for:
# - No image-related errors
# - No legacy fallback warnings (should be zero)
# - Normal operation
```

**Monitor for 15-30 minutes:**
- [ ] No increase in error rate
- [ ] Image requests successful
- [ ] No performance degradation
- [ ] No user reports of issues

### Step 7: Run Cleanup (Optional)

**Purpose:** Identify and remove orphaned directories.

**Note:** Only run after migration is verified and stable.

```bash
# Preview orphaned directories
npm run cleanup:images -- --dry-run

# If acceptable, remove orphaned directories
npm run cleanup:images -- --confirm
```

**Expected Output:**
```
🔍 Scanning for orphaned directories...

Found 2 orphaned directories:
  - 9dd8b6b8-4696-4777-93fe-5b9ecce34be6 (5.2 MB)
  - a1b2c3d4-5678-90ab-cdef-1234567890ab (3.8 MB)

Total space to reclaim: 9.0 MB

✓ Cleanup complete!
```

## Post-Migration Checklist

### Immediate (Within 1 hour)

- [ ] Verify migration completed successfully
- [ ] Test image retrieval via API
- [ ] Test image display in application
- [ ] Check application logs for errors
- [ ] Verify no legacy fallback warnings

### Short-term (Within 24 hours)

- [ ] Monitor application performance
- [ ] Check for user-reported issues
- [ ] Verify backup integrity
- [ ] Document any issues encountered
- [ ] Run cleanup utility (if not done during migration)

### Long-term (Within 1 week)

- [ ] Remove legacy files (after verification period)
- [ ] Remove backward compatibility code (optional)
- [ ] Update monitoring dashboards
- [ ] Archive migration logs
- [ ] Update team documentation

## Rollback Procedure

### When to Rollback

Rollback if:
- Critical errors during migration
- Data loss or corruption detected
- Application functionality severely impacted
- Verification fails with critical issues

### Rollback Steps

#### Option 1: Database Rollback (Recommended)

**If migration created backup:**

```bash
# 1. Stop application (if running)
pm2 stop your-app  # or your process manager

# 2. Restore database from backup
npm run restore:migration-backup -- --backup-name product_images_backup_20241128_100000

# 3. Restart application
pm2 start your-app

# 4. Verify images accessible
curl http://localhost:3000/api/products/[product-slug]
```

**Manual database restore:**

```sql
-- Connect to database
psql -h localhost -U your_user -d your_database

-- Restore URLs from backup table
BEGIN;

UPDATE product_images pi
SET url = backup.url
FROM product_images_backup_20241128_100000 backup
WHERE pi.id = backup.id;

COMMIT;
```

#### Option 2: Full System Rollback

**If database backup was created externally:**

```bash
# 1. Stop application
pm2 stop your-app

# 2. Restore database from backup
psql -h localhost -U your_user -d your_database < backup_20241128_100000.sql

# 3. Restore file system (if needed)
rm -rf backend/uploads/products/
tar -xzf uploads_backup_20241128_100000.tar.gz

# 4. Restart application
pm2 start your-app

# 5. Verify application
curl http://localhost:3000/api/products/[product-slug]
```

#### Option 3: Keep Both Structures (Temporary)

**If rollback is not urgent:**

1. Keep both old and new files (no data loss)
2. Restore database URLs to old format
3. Application will serve from legacy location
4. Investigate issues
5. Re-run migration after fixes

### Verify Rollback

- [ ] Application starts successfully
- [ ] Images display correctly
- [ ] Database URLs point to existing files
- [ ] No errors in application logs
- [ ] Users can access products normally

## Troubleshooting

### Issue: Migration Fails with "Disk Space Full"

**Symptoms:**
- Migration stops with disk space error
- Cannot write files

**Resolution:**
1. Check disk space: `df -h`
2. Free up space or add more storage
3. Run migration again (it will skip already-migrated images)

### Issue: Migration Fails with "Permission Denied"

**Symptoms:**
- Cannot create directories
- Cannot write files

**Resolution:**
```bash
# Check permissions
ls -la backend/uploads/products/

# Fix permissions
chmod -R 755 backend/uploads/products/
chown -R your-user:your-group backend/uploads/products/

# Run migration again
npm run migrate:images -- --backup
```

### Issue: Some Images Not Migrated

**Symptoms:**
- Skipped images count > 0
- Some images still in legacy location

**Resolution:**
1. Check migration logs for skipped files
2. Common reasons:
   - Invalid filename format (cannot extract product ID)
   - Missing thumbnail
   - File read/write errors
3. Manually review skipped files
4. If needed, manually migrate or delete

### Issue: Images Not Displaying After Migration

**Symptoms:**
- 404 errors for images
- Broken image icons

**Resolution:**
1. Check database URLs:
   ```sql
   SELECT id, url FROM product_images LIMIT 10;
   ```
2. Verify files exist:
   ```bash
   ls -la backend/uploads/products/[product-id]/
   ```
3. Check file permissions:
   ```bash
   chmod -R 755 backend/uploads/products/
   ```
4. Restart application:
   ```bash
   pm2 restart your-app
   ```

### Issue: Legacy Fallback Warnings in Logs

**Symptoms:**
- Warnings about serving from legacy location
- Images work but use old paths

**Resolution:**
1. This means some images weren't migrated
2. Run verification:
   ```bash
   npm run verify:migration
   ```
3. Check which images are in legacy location
4. Re-run migration if needed

### Issue: Database Transaction Failures

**Symptoms:**
- Migration reports database errors
- URLs not updated

**Resolution:**
1. Check database connection
2. Check database logs
3. Verify database has space
4. Run migration again (uses transactions, safe to retry)

## Emergency Contacts

**During Migration:**
- Database Admin: [contact info]
- DevOps Lead: [contact info]
- On-Call Engineer: [contact info]

**Escalation Path:**
1. Check this runbook first
2. Review application logs
3. Contact DevOps Lead
4. If critical, initiate rollback
5. Document issue for post-mortem

## Success Criteria

Migration is successful when:

- [ ] All images migrated (or acceptable skip count)
- [ ] Verification passes with no critical issues
- [ ] Images display correctly in application
- [ ] No errors in application logs
- [ ] No legacy fallback warnings
- [ ] Application performance normal
- [ ] No user-reported issues

## Notes and Observations

**Date:** _______________

**Environment:** _______________

**Executed By:** _______________

**Start Time:** _______________

**End Time:** _______________

**Total Images:** _______________

**Migrated:** _______________

**Failed:** _______________

**Skipped:** _______________

**Issues Encountered:**
-
-
-

**Resolution:**
-
-
-

**Lessons Learned:**
-
-
-

## Appendix

### Useful Commands

```bash
# Check migration status
npm run verify:migration

# Count images in legacy location
find backend/uploads/products/ -maxdepth 1 -type f -name "*.jpg" | wc -l

# Count images in new structure
find backend/uploads/products/ -mindepth 2 -type f -name "*.jpg" | wc -l

# Check database image count
psql -d your_database -c "SELECT COUNT(*) FROM product_images;"

# Check disk usage
du -sh backend/uploads/products/

# Check specific product directory
ls -la backend/uploads/products/[product-id]/

# View recent application logs
tail -100 backend/logs/application.log

# Search for image-related errors
grep -i "image\|upload" backend/logs/application.log | tail -50
```

### Migration Script Options

```bash
# Full options list
npm run migrate:images -- --help

# Common combinations
npm run migrate:images -- --dry-run                    # Preview only
npm run migrate:images -- --backup                     # With backup
npm run migrate:images -- --backup --batch-size 100    # Custom batch size
npm run migrate:images -- --backup --batch-size 25     # Slower, safer
```

### Database Queries

```sql
-- Check image URLs format
SELECT url FROM product_images LIMIT 10;

-- Count images by URL format
SELECT
  CASE
    WHEN url LIKE '%/products/%/%' THEN 'new_format'
    ELSE 'legacy_format'
  END as format,
  COUNT(*) as count
FROM product_images
GROUP BY format;

-- Find images for specific product
SELECT * FROM product_images WHERE "productId" = '[product-id]';

-- Check for missing products (orphaned images)
SELECT pi.*
FROM product_images pi
LEFT JOIN products p ON pi."productId" = p.id
WHERE p.id IS NULL;
```

## Related Documentation

- [Image Storage API Documentation](../src/products/IMAGE_STORAGE_API.md)
- [Products Module README](../src/products/README.md)
- [Backward Compatibility](../src/products/BACKWARD_COMPATIBILITY.md)
