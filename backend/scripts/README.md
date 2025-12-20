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

## Email Queue Deployment and Migration Scripts

### Email Queue Deployment

Deploy the asynchronous email queue service with worker processes and monitoring:

```bash
# Deploy to development environment
npm run deploy-email-queue --env development --workers 1

# Deploy to staging environment
npm run deploy-email-queue --env staging --workers 2

# Deploy to production environment
npm run deploy-email-queue --env production --workers 3

# Preview deployment without making changes
npm run deploy-email-queue --env production --dry-run

# Deploy with custom options
npm run deploy-email-queue --env production --workers 5 --skip-validation
```

**Features:**
- Validates prerequisites and configuration
- Sets up Redis connection and queue functionality
- Deploys PM2-managed worker processes
- Creates monitoring infrastructure
- Runs health checks and verification
- Generates deployment documentation

### Email Queue Data Migration

Migrate existing email data when upgrading from synchronous to asynchronous processing:

```bash
# Preview migration without making changes
npm run migrate-email-queue-data --dry-run

# Run migration with default settings
npm run migrate-email-queue-data

# Run migration with custom batch size
npm run migrate-email-queue-data --batch-size 50

# Skip backup creation and failed email reprocessing
npm run migrate-email-queue-data --skip-backup --skip-failed-emails
```

**Features:**
- Creates backup of relevant data
- Migrates failed emails for retry
- Migrates pending notifications
- Processes data in configurable batches
- Generates migration reports with recommendations

### Email Queue Schema Migration

Handle database schema changes for email queue service (currently no changes needed):

```bash
# Preview schema migration
npm run migrate-email-queue-schema --dry-run

# Run schema migration
npm run migrate-email-queue-schema

# Force migration even if validation fails
npm run migrate-email-queue-schema --force
```

**Note:** The current email queue implementation uses Redis for storage and doesn't require database schema changes. This script is provided as a template for future migrations.

### Email Queue Monitoring Setup

Set up comprehensive monitoring infrastructure:

```bash
# Setup monitoring for development
npm run setup-email-queue-monitoring --env development

# Setup monitoring with Slack alerts
npm run setup-email-queue-monitoring --env production \
  --webhook-url https://hooks.slack.com/your-webhook

# Setup monitoring with email alerts
npm run setup-email-queue-monitoring --env production \
  --alert-email admin@example.com

# Setup with custom cron interval
npm run setup-email-queue-monitoring --env staging \
  --cron-interval "*/10 * * * *"
```

**Features:**
- Creates monitoring scripts and dashboards
- Sets up automated health checks via cron
- Configures log rotation and retention
- Sets up alert notifications (Slack, email)
- Creates weekly reporting system
- Generates monitoring documentation

## Email Queue Monitoring Scripts

### Health Monitoring

Monitor email queue service health and performance:

```bash
# Run health check manually
./scripts/monitor-email-queue.sh

# View current configuration
./scripts/monitor-email-queue.sh --config

# Run quietly (for cron jobs)
./scripts/monitor-email-queue.sh --quiet
```

**Monitors:**
- PM2 worker processes
- Redis connection and memory usage
- Queue health via API endpoints
- Queue metrics (depth, error rates)
- System resources (CPU, memory, disk)

### Real-time Dashboard

View real-time email queue status:

```bash
# View dashboard once
./scripts/monitoring/dashboard.sh

# Continuous monitoring (updates every 30 seconds)
./scripts/monitoring/dashboard.sh --watch
```

**Displays:**
- PM2 process status
- Queue metrics (waiting, active, completed, failed jobs)
- Recent alerts
- System resource usage
- Log file sizes

### Alert Management

Send alerts via configured channels:

```bash
# Send test alert
./scripts/monitoring/send-alert.sh "Test alert message" "INFO"

# Send warning alert
./scripts/monitoring/send-alert.sh "Queue depth high" "WARNING"

# Send critical alert
./scripts/monitoring/send-alert.sh "Workers offline" "CRITICAL"
```

### Weekly Reports

Generate and send weekly performance reports:

```bash
# Generate weekly report manually
./scripts/generate-weekly-report.sh

# View latest report
ls -la logs/weekly-report-*.txt
```

## Email Queue Workflow

Complete workflow for deploying email queue service:

```bash
# 1. Validate configuration
npm run setup-email-config validate

# 2. Deploy email queue service
npm run deploy-email-queue --env production --workers 3

# 3. Setup monitoring
npm run setup-email-queue-monitoring --env production \
  --webhook-url https://hooks.slack.com/your-webhook \
  --alert-email admin@example.com

# 4. Install monitoring cron job
crontab /tmp/email-queue-cron

# 5. Install log rotation (requires sudo)
sudo cp /tmp/email-queue-logrotate /etc/logrotate.d/email-queue

# 6. Migrate existing data
npm run migrate-email-queue-data --batch-size 50

# 7. Verify deployment
./scripts/monitor-email-queue.sh
curl http://localhost:3000/email-queue/health
```

## Email Queue Troubleshooting

### Common Issues

**Workers not starting:**
```bash
pm2 logs email-queue-worker
npm run setup-email-config validate
redis-cli ping
```

**High queue depth:**
```bash
curl http://localhost:3000/email-queue/metrics
pm2 scale email-queue-worker +2
```

**Redis connection issues:**
```bash
redis-cli ping
sudo systemctl restart redis
```

### Email Queue Log Files

- `logs/email-queue-monitoring.log` - Main monitoring log
- `logs/email-queue-alerts.log` - Alert notifications
- `logs/email-queue-metrics.log` - Performance metrics
- `logs/weekly-report-*.txt` - Weekly performance reports

### Email Queue Support

For deployment and monitoring issues:
1. Check script logs in `logs/` directory
2. Review deployment documentation: `EMAIL_QUEUE_DEPLOYMENT_GUIDE.md`
3. Check monitoring setup: `EMAIL_QUEUE_MONITORING_SETUP.md`
4. Contact DevOps team with relevant logs and metrics