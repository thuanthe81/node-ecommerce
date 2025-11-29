#!/bin/bash

# Production deployment script for Handmade E-commerce Platform
# This script includes additional safety checks and confirmations

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Production Deployment Script${NC}"
echo ""

# Safety confirmation
echo -e "${RED}⚠️  WARNING: This will deploy to PRODUCTION${NC}"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo -e "${RED}Deployment cancelled${NC}"
  exit 1
fi

# Pre-deployment checklist
echo ""
echo -e "${YELLOW}Pre-Deployment Checklist:${NC}"
echo ""

read -p "1. Have you backed up the database? (yes/no): " DB_BACKUP
if [ "$DB_BACKUP" != "yes" ]; then
  echo -e "${RED}Please backup the database before proceeding${NC}"
  exit 1
fi

read -p "2. Have you verified sufficient disk space (2x current uploads)? (yes/no): " DISK_SPACE
if [ "$DISK_SPACE" != "yes" ]; then
  echo -e "${RED}Please verify disk space before proceeding${NC}"
  exit 1
fi

read -p "3. Have you notified the team of the deployment? (yes/no): " TEAM_NOTIFIED
if [ "$TEAM_NOTIFIED" != "yes" ]; then
  echo -e "${YELLOW}⚠ Consider notifying the team before proceeding${NC}"
  read -p "Continue anyway? (yes/no): " CONTINUE
  if [ "$CONTINUE" != "yes" ]; then
    exit 1
  fi
fi

read -p "4. Is this a maintenance window or low-traffic period? (yes/no): " LOW_TRAFFIC
if [ "$LOW_TRAFFIC" != "yes" ]; then
  echo -e "${YELLOW}⚠ Consider deploying during low-traffic periods${NC}"
  read -p "Continue anyway? (yes/no): " CONTINUE
  if [ "$CONTINUE" != "yes" ]; then
    exit 1
  fi
fi

echo ""
echo -e "${GREEN}✓ Pre-deployment checklist completed${NC}"
echo ""

# Create deployment log
DEPLOYMENT_LOG="deployment_$(date +%Y%m%d_%H%M%S).log"
echo "Creating deployment log: ${DEPLOYMENT_LOG}"

# Run deployment with production settings
{
  echo "==================================="
  echo "Production Deployment Log"
  echo "Date: $(date)"
  echo "User: $(whoami)"
  echo "==================================="
  echo ""

  # Run the main deployment script
  ENVIRONMENT=production \
  SKIP_BACKUP=false \
  MIGRATION_BATCH_SIZE=50 \
  bash scripts/deploy.sh

} 2>&1 | tee "$DEPLOYMENT_LOG"

# Check deployment status
if [ ${PIPESTATUS[0]} -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✓ Production deployment completed successfully!${NC}"
  echo ""
  echo "Deployment log saved to: ${DEPLOYMENT_LOG}"
  echo ""
  echo -e "${YELLOW}Post-Deployment Tasks:${NC}"
  echo "  1. Monitor application logs for errors"
  echo "  2. Test critical user flows (product viewing, image display)"
  echo "  3. Check for any 404 errors on images"
  echo "  4. Monitor server resources (CPU, memory, disk)"
  echo "  5. Keep deployment log for records"
  echo ""
  echo -e "${YELLOW}If issues occur:${NC}"
  echo "  - Review deployment log: ${DEPLOYMENT_LOG}"
  echo "  - Check application logs"
  echo "  - Follow rollback procedure in MIGRATION_RUNBOOK.md"
  echo ""
else
  echo ""
  echo -e "${RED}✗ Production deployment failed!${NC}"
  echo ""
  echo "Deployment log saved to: ${DEPLOYMENT_LOG}"
  echo ""
  echo -e "${RED}Action Required:${NC}"
  echo "  1. Review deployment log: ${DEPLOYMENT_LOG}"
  echo "  2. Check error messages above"
  echo "  3. Follow rollback procedure if needed"
  echo "  4. Contact DevOps team if assistance needed"
  echo ""
  exit 1
fi
