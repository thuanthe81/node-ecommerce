#!/bin/bash

# Deployment script for Handmade E-commerce Platform
# This script handles deployment with image storage migration

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
SKIP_MIGRATION=${SKIP_MIGRATION:-false}
SKIP_BACKUP=${SKIP_BACKUP:-false}
MIGRATION_BATCH_SIZE=${MIGRATION_BATCH_SIZE:-50}

echo -e "${BLUE}🚀 Starting deployment to ${ENVIRONMENT}...${NC}"
echo ""

# Function to print section headers
print_section() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

# Function to check command success
check_success() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ $1${NC}"
  else
    echo -e "${RED}✗ $1 failed${NC}"
    exit 1
  fi
}

# Function to check prerequisites
check_prerequisites() {
  print_section "Checking Prerequisites"

  # Check Node.js
  if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js: ${NODE_VERSION}${NC}"
  else
    echo -e "${RED}✗ Node.js not found${NC}"
    exit 1
  fi

  # Check npm
  if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓ npm: ${NPM_VERSION}${NC}"
  else
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
  fi

  # Check PostgreSQL connection
  if command -v psql &> /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL client installed${NC}"
  else
    echo -e "${YELLOW}⚠ PostgreSQL client not found (optional)${NC}"
  fi

  # Check disk space
  AVAILABLE_SPACE=$(df -h . | awk 'NR==2 {print $4}')
  echo -e "${GREEN}✓ Available disk space: ${AVAILABLE_SPACE}${NC}"
}

# Function to install dependencies
install_dependencies() {
  print_section "Installing Dependencies"

  cd backend
  npm ci --production=false
  check_success "Backend dependencies installed"

  cd ../frontend
  npm ci --production=false
  check_success "Frontend dependencies installed"

  cd ..
}

# Function to run database migrations
run_database_migrations() {
  print_section "Running Database Migrations"

  cd backend

  # Generate Prisma client
  npm run prisma:generate
  check_success "Prisma client generated"

  # Run database migrations
  npx prisma migrate deploy
  check_success "Database migrations applied"

  cd ..
}

# Function to run image storage migration
run_image_migration() {
  if [ "$SKIP_MIGRATION" = true ]; then
    echo -e "${YELLOW}⚠ Skipping image migration (SKIP_MIGRATION=true)${NC}"
    return
  fi

  print_section "Running Image Storage Migration"

  cd backend

  # Check if migration is needed
  echo "Checking if migration is needed..."
  MIGRATION_CHECK=$(npm run verify:migration 2>&1 || true)

  if echo "$MIGRATION_CHECK" | grep -q "All.*database URLs point to existing files"; then
    echo -e "${GREEN}✓ Images already migrated, skipping...${NC}"
    cd ..
    return
  fi

  # Run dry-run first
  echo "Running migration dry-run..."
  npm run migrate:images -- --dry-run
  check_success "Migration dry-run completed"

  # Confirm migration
  if [ "$ENVIRONMENT" = "production" ]; then
    echo ""
    echo -e "${YELLOW}⚠ About to migrate images in PRODUCTION${NC}"
    echo -e "${YELLOW}  This will modify file locations and database URLs${NC}"
    echo ""
    read -p "Continue with migration? (yes/no): " CONFIRM

    if [ "$CONFIRM" != "yes" ]; then
      echo -e "${RED}Migration cancelled by user${NC}"
      exit 1
    fi
  fi

  # Run migration with backup
  BACKUP_FLAG=""
  if [ "$SKIP_BACKUP" != true ]; then
    BACKUP_FLAG="--backup"
  fi

  echo "Running image migration..."
  npm run migrate:images -- $BACKUP_FLAG --batch-size $MIGRATION_BATCH_SIZE
  check_success "Image migration completed"

  # Verify migration
  echo "Verifying migration..."
  npm run verify:migration
  check_success "Migration verification completed"

  cd ..
}

# Function to build application
build_application() {
  print_section "Building Application"

  # Build backend
  cd backend
  npm run build
  check_success "Backend built"
  cd ..

  # Build frontend
  cd frontend
  npm run build
  check_success "Frontend built"
  cd ..
}

# Function to run tests
run_tests() {
  print_section "Running Tests"

  cd backend

  # Run unit tests
  npm run test -- --passWithNoTests
  check_success "Unit tests passed"

  # Run e2e tests (optional, can be skipped in production)
  if [ "$ENVIRONMENT" != "production" ]; then
    npm run test:e2e -- --passWithNoTests
    check_success "E2E tests passed"
  fi

  cd ..
}

# Function to verify deployment
verify_deployment() {
  print_section "Verifying Deployment"

  cd backend

  # Verify image storage
  npm run verify:migration
  check_success "Image storage verified"

  # Check for orphaned directories
  echo "Checking for orphaned directories..."
  npm run cleanup:orphaned-images -- --dry-run

  cd ..

  echo ""
  echo -e "${GREEN}✓ Deployment verification completed${NC}"
}

# Function to cleanup orphaned images
cleanup_orphaned_images() {
  print_section "Cleaning Up Orphaned Images (Optional)"

  cd backend

  echo "Scanning for orphaned directories..."
  CLEANUP_OUTPUT=$(npm run cleanup:orphaned-images -- --dry-run 2>&1)

  if echo "$CLEANUP_OUTPUT" | grep -q "Found 0 orphaned directories"; then
    echo -e "${GREEN}✓ No orphaned directories found${NC}"
  else
    echo "$CLEANUP_OUTPUT"
    echo ""
    echo -e "${YELLOW}⚠ Orphaned directories found${NC}"
    echo "  Run 'npm run cleanup:orphaned-images -- --confirm' to remove them"
  fi

  cd ..
}

# Function to print deployment summary
print_summary() {
  print_section "Deployment Summary"

  echo -e "${GREEN}✓ Deployment to ${ENVIRONMENT} completed successfully!${NC}"
  echo ""
  echo "Deployment steps completed:"
  echo "  ✓ Prerequisites checked"
  echo "  ✓ Dependencies installed"
  echo "  ✓ Database migrations applied"
  if [ "$SKIP_MIGRATION" != true ]; then
    echo "  ✓ Image storage migrated"
  fi
  echo "  ✓ Application built"
  if [ "$ENVIRONMENT" != "production" ]; then
    echo "  ✓ Tests passed"
  fi
  echo "  ✓ Deployment verified"
  echo ""
  echo "Next steps:"
  echo "  1. Start the application: npm run start:prod"
  echo "  2. Monitor logs for any issues"
  echo "  3. Test image retrieval in the application"
  if [ "$SKIP_MIGRATION" != true ]; then
    echo "  4. Consider running cleanup: npm run cleanup:orphaned-images -- --confirm"
  fi
  echo ""
}

# Main deployment flow
main() {
  echo -e "${BLUE}Deployment Configuration:${NC}"
  echo "  Environment: ${ENVIRONMENT}"
  echo "  Skip Migration: ${SKIP_MIGRATION}"
  echo "  Skip Backup: ${SKIP_BACKUP}"
  echo "  Migration Batch Size: ${MIGRATION_BATCH_SIZE}"
  echo ""

  check_prerequisites
  install_dependencies
  run_database_migrations
  run_image_migration
  build_application

  if [ "$ENVIRONMENT" != "production" ]; then
    run_tests
  fi

  verify_deployment
  cleanup_orphaned_images
  print_summary
}

# Run main function
main
