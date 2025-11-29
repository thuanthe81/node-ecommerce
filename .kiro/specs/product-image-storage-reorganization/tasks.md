# Implementation Plan

- [x] 1. Update ProductsImageService for new directory structure
  - [x] 1.1 Add helper methods for product-specific paths
    - Implement `getProductUploadDir(productId: string)` to return `uploads/products/[product-id]/`
    - Implement `getProductThumbnailDir(productId: string)` to return `uploads/products/[product-id]/thumbnails/`
    - Implement `ensureProductDirectories(productId: string)` to create directories if they don't exist
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.2 Update uploadProductImage method
    - Modify filename generation to exclude product ID prefix (since it's in the directory path)
    - Update file paths to use product-specific directories
    - Update database URL format to include product ID in path
    - Ensure directories are created before saving files
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.3 Update uploadMultipleImages method
    - Modify to use product-specific directories
    - Update file paths for batch uploads
    - Update database URL format for all images
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 1.4 Write property test for image storage directory structure
    - **Property 1: Image storage directory structure**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

  - [ ]* 1.5 Write property test for multiple images same directory
    - **Property 2: Multiple images same directory**
    - **Validates: Requirements 1.5**

  - [x] 1.6 Update deleteProductImage method
    - Check if deleting the last image for a product
    - If last image, remove entire product directory
    - If not last image, just remove the specific image files
    - _Requirements: 4.1_

  - [ ]* 1.7 Write property test for product deletion cleanup
    - **Property 10: Product deletion cleanup**
    - **Validates: Requirements 4.1**

- [x] 2. Create ImageMigrationService
  - [x] 2.1 Create service file and basic structure
    - Create `backend/src/products/image-migration.service.ts`
    - Define `MigrationResult` and `MigrationOptions` interfaces
    - Inject PrismaService and ProductsImageService dependencies
    - _Requirements: 2.1_

  - [x] 2.2 Implement product ID extraction from filename
    - Implement `extractProductIdFromFilename(filename: string)` method
    - Handle various filename formats (with and without random suffix)
    - Return null for invalid filenames
    - _Requirements: 2.2_

  - [ ]* 2.3 Write property test for product ID extraction
    - **Property 4: Product ID extraction**
    - **Validates: Requirements 2.2**

  - [x] 2.4 Implement file migration logic
    - Implement `moveImageFiles(productId, oldPath, newPath)` method
    - Create target directories if they don't exist
    - Copy files to new location
    - Verify copy succeeded before deleting originals
    - Handle both original and thumbnail files
    - _Requirements: 2.3, 2.4, 3.2_

  - [ ]* 2.5 Write property test for directory creation during migration
    - **Property 5: Directory creation during migration**
    - **Validates: Requirements 2.3**

  - [ ]* 2.6 Write property test for paired file migration
    - **Property 6: Paired file migration**
    - **Validates: Requirements 2.4**

  - [ ]* 2.7 Write property test for file copy before delete
    - **Property 9: File copy before delete**
    - **Validates: Requirements 3.2**

  - [x] 2.8 Implement database URL update logic
    - Implement `updateDatabaseUrls(imageId, newUrl)` method
    - Use transactions for atomicity
    - Handle rollback on failure
    - _Requirements: 2.5, 3.4, 3.5_

  - [ ]* 2.9 Write property test for database URL update consistency
    - **Property 7: Database URL update consistency**
    - **Validates: Requirements 2.5, 2.6**

  - [x] 2.10 Implement main migration method
    - Implement `migrateImages(options)` method
    - Query all ProductImage records from database
    - Process images in batches
    - Track success, failure, and skipped counts
    - Handle errors gracefully and continue with other images
    - Return detailed MigrationResult
    - _Requirements: 2.1, 2.7, 2.8_

  - [ ]* 2.11 Write property test for migration identifies all images
    - **Property 3: Migration identifies all images**
    - **Validates: Requirements 2.1**

  - [ ]* 2.12 Write property test for migration result accuracy
    - **Property 8: Migration result accuracy**
    - **Validates: Requirements 2.8**

  - [x] 2.13 Implement migration verification
    - Implement `verifyMigration()` method
    - Check all database URLs point to existing files
    - Report any mismatches
    - _Requirements: 2.6_

  - [x] 2.14 Add database backup functionality
    - Create backup of ProductImage table before migration
    - Store backup with timestamp
    - _Requirements: 3.1_

  - [ ]* 2.15 Write unit tests for migration edge cases
    - Test migration with invalid filenames
    - Test migration with missing thumbnails
    - Test migration with file operation errors
    - Test database transaction rollback
    - _Requirements: 2.7, 3.3, 3.5_

- [x] 3. Create migration CLI command
  - [x] 3.1 Create NestJS CLI command for migration
    - Create `backend/src/products/commands/migrate-images.command.ts`
    - Use NestJS Commander or similar for CLI
    - Accept options: --dry-run, --batch-size
    - Display progress and results
    - _Requirements: 2.1, 2.8_

  - [x] 3.2 Add migration script to package.json
    - Add npm script to run migration command
    - Document usage in README
    - _Requirements: 2.1_

- [x] 4. Create ImageCleanupService
  - [x] 4.1 Create service file and basic structure
    - Create `backend/src/products/image-cleanup.service.ts`
    - Define `CleanupResult` interface
    - Inject PrismaService dependency
    - _Requirements: 4.2_

  - [x] 4.2 Implement directory discovery
    - Implement `findOrphanedDirectories()` method
    - Scan uploads/products directory for subdirectories
    - Extract product IDs from directory names
    - _Requirements: 4.2_

  - [ ]* 4.3 Write property test for directory discovery completeness
    - **Property 11: Directory discovery completeness**
    - **Validates: Requirements 4.2**

  - [x] 4.3 Implement orphan detection
    - For each directory, check if product exists in database
    - Mark directories as orphaned if product doesn't exist
    - Calculate total size of orphaned directories
    - _Requirements: 4.3, 4.4_

  - [ ]* 4.4 Write property test for orphan detection
    - **Property 12: Orphan detection**
    - **Validates: Requirements 4.3, 4.4**

  - [x] 4.5 Implement cleanup reporting
    - Generate detailed CleanupResult with all orphaned directories
    - Include recommendations for cleanup
    - _Requirements: 4.5_

  - [ ]* 4.6 Write property test for orphan reporting completeness
    - **Property 13: Orphan reporting completeness**
    - **Validates: Requirements 4.5**

  - [x] 4.7 Implement orphan removal
    - Implement `removeOrphanedDirectory(productId)` method
    - Implement `cleanupAllOrphaned(confirm)` method with safety confirmation
    - Remove directories and all contents
    - Handle permission errors gracefully
    - _Requirements: 4.1_

  - [ ]* 4.8 Write unit tests for cleanup edge cases
    - Test cleanup with no orphaned directories
    - Test cleanup with permission errors
    - Test cleanup with non-empty directories
    - _Requirements: 4.1, 4.2_

- [x] 5. Create cleanup CLI command
  - [x] 5.1 Create NestJS CLI command for cleanup
    - Create `backend/src/products/commands/cleanup-images.command.ts`
    - Accept options: --dry-run, --confirm
    - Display orphaned directories and sizes
    - Require explicit confirmation for deletion
    - _Requirements: 4.5_

  - [x] 5.2 Add cleanup script to package.json
    - Add npm script to run cleanup command
    - Document usage in README
    - _Requirements: 4.5_

- [x] 6. Add backward compatibility for image retrieval
  - [x] 6.1 Create image retrieval helper method
    - Create method to check hierarchical location first
    - Fall back to legacy flat directory if not found
    - Log warning when serving from legacy location
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 6.2 Write property test for hierarchical location priority
    - **Property 14: Hierarchical location priority**
    - **Validates: Requirements 5.1**

  - [ ]* 6.3 Write property test for legacy fallback
    - **Property 15: Legacy fallback**
    - **Validates: Requirements 5.2**

  - [ ]* 6.4 Write property test for legacy access logging
    - **Property 16: Legacy access logging**
    - **Validates: Requirements 5.3**

  - [x] 6.5 Update static file serving configuration
    - Ensure Express serves files from both old and new locations
    - Configure proper MIME types and caching headers
    - _Requirements: 5.1, 5.2_

- [x] 7. Integration testing and verification
  - [ ]* 7.1 Write integration test for complete upload flow
    - Test: Create product → Upload images → Verify storage → Verify database → Retrieve images
    - Verify new directory structure is used
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 7.2 Write integration test for complete migration flow
    - Test: Seed legacy images → Run migration → Verify new structure → Verify database → Verify retrieval
    - Verify all images migrated successfully
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 7.3 Write integration test for complete cleanup flow
    - Test: Create orphaned directories → Run cleanup → Verify detection → Verify reporting
    - Verify orphaned directories identified correctly
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [x] 8. Documentation and deployment preparation
  - [x] 8.1 Update API documentation
    - Document new image URL format
    - Document migration process
    - Document cleanup process
    - _Requirements: All_

  - [x] 8.2 Create migration runbook
    - Document pre-migration checklist (backup, disk space)
    - Document migration steps
    - Document verification steps
    - Document rollback procedure
    - _Requirements: 2.1, 3.1_

  - [x] 8.3 Update deployment scripts
    - Add migration step to deployment process
    - Add verification step after migration
    - _Requirements: 2.1_

- [x] 9. Execute migration in staging
  - [x] 9.1 Run migration in staging environment
    - Backup database
    - Run migration with --dry-run first
    - Run actual migration
    - Verify results
    - Test image retrieval
    - _Requirements: 2.1, 2.6, 3.1_

  - [x] 9.2 Monitor and validate staging
    - Check for any errors or warnings
    - Verify all images accessible
    - Test upload of new images
    - Run cleanup to check for orphans
    - _Requirements: All_

- [-] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
