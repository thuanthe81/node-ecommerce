# Backend - Handmade E-commerce Platform

NestJS backend API with TypeScript, PostgreSQL, and Redis.

## Features

- NestJS framework with TypeScript
- PostgreSQL database with Prisma ORM
- Redis for caching and session management
- JWT authentication
- RESTful API design
- Swagger API documentation

## Getting Started

### Install Dependencies

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key variables:
- `UPLOAD_DIR` — directory for static uploads served at `/uploads/*`. Accepts absolute paths or project-relative (default `uploads`).

### Database Setup

Make sure PostgreSQL and Redis are running locally:

**Check PostgreSQL:**
```bash
pg_isready -h localhost -p 5432
```

**Check Redis:**
```bash
redis-cli ping
```

**Create Database:**
```bash
createdb handmade_ecommerce
```

### Run Development Server

```bash
npm run start:dev
```

The API will be available at [http://localhost:3001](http://localhost:3001).

## Project Structure

```
backend/
├── src/
│   ├── auth/           # Authentication module
│   ├── users/          # User management
│   ├── products/       # Product catalog
│   ├── orders/         # Order processing
│   ├── common/         # Shared utilities
│   └── main.ts         # Application entry point
├── prisma/             # Database schema and migrations
└── test/               # E2E tests
```

## Available Scripts

### Development
- `npm run start:dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start:prod` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run E2E tests

### Database
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed database with sample data
- `npm run prisma:studio` - Open Prisma Studio

### Image Management
- `npm run generate:images` - Generate sample product images
- `npm run verify:images` - Verify image integrity
- `npm run cleanup:images` - Clean up old/orphaned images
- `npm run migrate:images` - Migrate images to hierarchical structure
- `npm run verify:migration` - Verify migration success
- `npm run cleanup:orphaned-images` - Clean up orphaned product directories

## Image Migration

The product image storage has been reorganized from a flat directory structure to a hierarchical structure organized by product ID for better performance and management.

### Migration Process

**1. Preview Migration (Dry Run)**

Run a dry run first to see what changes will be made without actually modifying anything:

```bash
npm run migrate:images -- --dry-run
```

**2. Run Migration**

Once you're satisfied with the preview, run the actual migration:

```bash
npm run migrate:images
```

**3. Verify Migration**

After migration, verify that all images are correctly migrated:

```bash
npm run verify:migration
```

### Migration Options

- `--dry-run` - Preview changes without making modifications
- `--batch-size <num>` - Number of images to process per batch (default: 50)
- `--help` - Show help message

### Examples

```bash
# Preview migration with default batch size
npm run migrate:images -- --dry-run

# Run migration with custom batch size
npm run migrate:images -- --batch-size 100

# Preview with custom batch size
npm run migrate:images -- --dry-run --batch-size 25
```

### Directory Structure

**Before Migration:**
```
uploads/products/
  [product-id]-[timestamp]-[random].jpg
  [product-id]-[timestamp]-[random].jpg
  thumbnails/
    [product-id]-[timestamp]-[random].jpg
```

**After Migration:**
```
uploads/products/
  [product-id-1]/
    [timestamp]-[random].jpg
    thumbnails/
      [timestamp]-[random].jpg
  [product-id-2]/
    [timestamp]-[random].jpg
    thumbnails/
      [timestamp]-[random].jpg
```

### Migration Safety

- Database backup is automatically created before migration
- Files are copied before deletion to prevent data loss
- Database updates use transactions for atomicity
- Detailed error reporting for any issues
- Verification tool to check migration success

## Orphaned Image Cleanup

After migration or product deletion, you may have orphaned directories (directories for products that no longer exist in the database). Use the cleanup script to identify and remove them.

### Cleanup Process

**1. Scan for Orphaned Directories (Dry Run)**

First, scan to see what orphaned directories exist without deleting anything:

```bash
npm run cleanup:orphaned-images -- --dry-run
```

**2. Remove Orphaned Directories**

Once you've reviewed the scan results, remove the orphaned directories:

```bash
npm run cleanup:orphaned-images -- --confirm
```

### Cleanup Options

- `--dry-run` - Scan for orphaned directories without deleting them (preview mode)
- `--confirm` - Confirm deletion of orphaned directories (required for actual cleanup)
- `--help` - Show help message

### Examples

```bash
# Scan for orphaned directories
npm run cleanup:orphaned-images -- --dry-run

# Remove orphaned directories
npm run cleanup:orphaned-images -- --confirm
```

### What Gets Cleaned Up

The cleanup script:
1. Scans `uploads/products/` for product-specific directories
2. Checks each directory against the database
3. Identifies directories for non-existent products
4. Calculates total disk space used by orphaned directories
5. Optionally removes orphaned directories (with `--confirm`)

### Safety Features

- Validates directory names are valid UUIDs
- Verifies product doesn't exist before deletion
- Requires explicit `--confirm` flag for deletion
- Continues processing even if individual deletions fail
- Provides detailed reporting of what was cleaned up

**Always run with `--dry-run` first to preview what will be deleted!**

## API Documentation

Swagger documentation is available at [http://localhost:3001/api](http://localhost:3001/api) when running in development mode.

## Learn More

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
