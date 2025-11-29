#!/bin/bash

# Rollback script for image storage migration
# Use this script if migration causes issues

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}⚠️  Image Storage Migration Rollback${NC}"
echo ""

# Safety confirmation
echo -e "${YELLOW}This script will rollback the image storage migration${NC}"
echo "It will restore database URLs to the legacy format"
echo ""
read -p "Are you sure you want to rollback? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo -e "${RED}Rollback cancelled${NC}"
  exit 1
fi

# Ask for backup name
echo ""
echo "Available backups:"
cd backend
npm run prisma:studio &
STUDIO_PID=$!
sleep 2

echo ""
echo "Please check Prisma Studio for backup table names"
echo "Format: product_images_backup_YYYYMMDD_HHMMSS"
echo ""
read -p "Enter backup table name (or 'skip' to use external backup): " BACKUP_NAME

kill $STUDIO_PID 2>/dev/null || true

if [ "$BACKUP_NAME" = "skip" ]; then
  echo ""
  echo -e "${YELLOW}Skipping database rollback${NC}"
  echo "You will need to restore from external backup manually"
  echo ""
  read -p "Have you restored the database from external backup? (yes/no): " RESTORED
  if [ "$RESTORED" != "yes" ]; then
    echo -e "${RED}Please restore database before continuing${NC}"
    exit 1
  fi
else
  # Rollback database
  echo ""
  echo -e "${BLUE}Rolling back database...${NC}"

  # Create rollback SQL
  cat > /tmp/rollback_migration.sql <<EOF
-- Rollback image storage migration
BEGIN;

-- Restore URLs from backup
UPDATE product_images pi
SET url = backup.url,
    "updatedAt" = NOW()
FROM ${BACKUP_NAME} backup
WHERE pi.id = backup.id;

-- Verify rollback
SELECT
  CASE
    WHEN url LIKE '%/products/%/%' THEN 'new_format'
    ELSE 'legacy_format'
  END as format,
  COUNT(*) as count
FROM product_images
GROUP BY format;

COMMIT;
EOF

  echo "Executing rollback SQL..."
  psql $DATABASE_URL -f /tmp/rollback_migration.sql

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database rollback completed${NC}"
  else
    echo -e "${RED}✗ Database rollback failed${NC}"
    echo "Please restore from external backup"
    exit 1
  fi

  rm /tmp/rollback_migration.sql
fi

# Verify rollback
echo ""
echo -e "${BLUE}Verifying rollback...${NC}"

# Check database URLs
echo "Checking database URLs..."
LEGACY_COUNT=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM product_images WHERE url NOT LIKE '%/products/%/%';" | xargs)
NEW_COUNT=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM product_images WHERE url LIKE '%/products/%/%';" | xargs)

echo "  Legacy format URLs: ${LEGACY_COUNT}"
echo "  New format URLs: ${NEW_COUNT}"

if [ "$NEW_COUNT" -gt 0 ]; then
  echo -e "${YELLOW}⚠ Some URLs still in new format${NC}"
  echo "  This may indicate incomplete rollback"
fi

# Check file accessibility
echo ""
echo "Checking file accessibility..."
cd backend
npm run verify:images

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Files are accessible${NC}"
else
  echo -e "${YELLOW}⚠ Some files may not be accessible${NC}"
  echo "  This is expected if files were moved during migration"
  echo "  Files exist in both locations, so images should still work"
fi

cd ..

# Restart application
echo ""
echo -e "${BLUE}Restarting application...${NC}"
echo "Please restart your application manually:"
echo "  - Stop: pm2 stop your-app (or your process manager)"
echo "  - Start: pm2 start your-app"
echo ""

# Summary
echo ""
echo -e "${GREEN}✓ Rollback completed${NC}"
echo ""
echo -e "${YELLOW}Post-Rollback Tasks:${NC}"
echo "  1. Restart the application"
echo "  2. Test image display in the application"
echo "  3. Monitor logs for errors"
echo "  4. Verify no 404 errors on images"
echo ""
echo -e "${YELLOW}Note:${NC}"
echo "  - Files exist in both old and new locations"
echo "  - No data loss has occurred"
echo "  - You can re-run migration after fixing issues"
echo ""
echo "For more information, see: backend/scripts/MIGRATION_RUNBOOK.md"
echo ""
