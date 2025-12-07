# Implementation Plan

- [x] 1. Set up backend infrastructure for content media
  - Create Prisma migration for ContentMedia model
  - Create content-media module with controller, service, and DTOs
  - Set up file upload directory structure
  - _Requirements: 1.4, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 1.1 Create Prisma schema and migration for ContentMedia
  - Add ContentMedia model to schema.prisma with all required fields
  - Generate and run migration
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 1.2 Create content-media module structure
  - Generate NestJS module, controller, and service
  - Create DTOs for upload response
  - Set up module imports and exports
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 1.3 Implement file upload endpoint
  - Create POST /content-media/upload endpoint with file interceptor
  - Implement file validation (type and size)
  - Generate unique filename and store file
  - Create database record with metadata
  - Return media item with URL
  - _Requirements: 1.2, 1.3, 1.4, 9.1_

- [ ]* 1.4 Write property test for file type validation
  - **Property 1: File type validation rejects invalid types**
  - **Validates: Requirements 1.2, 10.1**

- [ ]* 1.5 Write property test for file size validation
  - **Property 2: File size validation rejects oversized files**
  - **Validates: Requirements 1.3, 10.2**

- [ ]* 1.6 Write property test for valid uploads
  - **Property 3: Valid uploads create complete records**
  - **Validates: Requirements 1.4, 7.1, 7.2, 7.3, 7.4, 7.5**

- [ ]* 1.7 Write property test for API upload
  - **Property 16: API upload validates and stores**
  - **Validates: Requirements 9.1**

- [x] 2. Implement media list and retrieval endpoints
  - Create GET /content-media endpoint with search and pagination
  - Create GET /content-media/:id endpoint
  - Implement search filtering by filename
  - Implement pagination logic
  - _Requirements: 4.1, 4.4, 9.2, 9.4_

- [ ]* 2.1 Write property test for API list endpoint
  - **Property 17: API list returns complete metadata**
  - **Validates: Requirements 9.2**

- [ ]* 2.2 Write property test for API get by ID
  - **Property 18: API get by ID returns metadata**
  - **Validates: Requirements 9.4**

- [ ]* 2.3 Write property test for search filtering
  - **Property 9: Search filters by filename**
  - **Validates: Requirements 4.1**

- [ ]* 2.4 Write property test for pagination
  - **Property 12: Pagination divides items correctly**
  - **Validates: Requirements 4.4**

- [x] 3. Implement media deletion endpoint
  - Create DELETE /content-media/:id endpoint
  - Implement database record deletion
  - Implement physical file deletion
  - Handle deletion errors with rollback
  - _Requirements: 3.2, 3.3, 9.3_

- [ ]* 3.1 Write property test for deletion
  - **Property 6: Deletion removes both record and file**
  - **Validates: Requirements 3.2, 3.3, 9.3**

- [x] 4. Add authorization guards to all endpoints
  - Apply @Roles(UserRole.ADMIN) decorator to all endpoints
  - Test authorization with non-admin users
  - _Requirements: 8.3, 9.5_

- [ ]* 4.1 Write property test for authorization
  - **Property 15: Non-admin access is blocked**
  - **Validates: Requirements 8.3, 9.5**

- [ ]* 4.2 Write property test for error state preservation
  - **Property 19: Upload errors preserve state**
  - **Validates: Requirements 10.5**

- [ ] 5. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Create frontend API client for content media
  - Create content-media-api.ts with TypeScript interfaces
  - Implement upload, getAll, getById, and delete methods
  - Add proper error handling and type safety
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 7. Create MediaUploader component
  - Implement file selection with drag-and-drop support
  - Add client-side validation (file type and size)
  - Implement upload progress indicator
  - Handle upload success and error states
  - _Requirements: 1.1, 1.2, 1.3, 10.1, 10.2_

- [x] 8. Create MediaGrid component
  - Implement responsive grid layout for media items
  - Display thumbnail, filename, date, and size for each item
  - Add delete button with confirmation dialog
  - Add copy URL button with clipboard functionality
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 6.1_

- [ ]* 8.1 Write property test for media grid display
  - **Property 5: Media grid displays complete metadata**
  - **Validates: Requirements 2.2, 2.3, 2.4, 2.5**

- [ ]* 8.2 Write property test for deletion UI update
  - **Property 7: Deletion updates UI**
  - **Validates: Requirements 3.4**

- [ ]* 8.3 Write property test for failed deletion
  - **Property 8: Failed deletion preserves state**
  - **Validates: Requirements 3.5**

- [ ]* 8.4 Write property test for copied URLs
  - **Property 14: Copied URLs are valid**
  - **Validates: Requirements 6.1, 6.4**

- [x] 9. Create ContentMediaPage component
  - Implement main admin page layout
  - Integrate MediaUploader component
  - Integrate MediaGrid component
  - Add search input with filtering
  - Add pagination controls
  - Handle loading and error states
  - _Requirements: 1.1, 2.1, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 9.1 Write property test for upload UI update
  - **Property 4: Upload success updates UI**
  - **Validates: Requirements 1.5**

- [ ]* 9.2 Write property test for clear search
  - **Property 10: Clear search shows all items**
  - **Validates: Requirements 4.2**

- [ ]* 9.3 Write property test for pagination with search
  - **Property 11: Pagination maintains search filter**
  - **Validates: Requirements 4.5**

- [x] 10. Add content media page to admin navigation
  - Add route for /admin/content-media
  - Add navigation link in admin menu
  - Add active state highlighting
  - Wrap page with AdminProtectedRoute
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 11. Add translations for content media management
  - Add English translations for all UI text
  - Add Vietnamese translations for all UI text
  - Include error messages, labels, and buttons
  - _Requirements: All user-facing text_

- [x] 12. Create MediaPickerModal component
  - Implement modal with media grid display
  - Add search and filter functionality
  - Add pagination for large libraries
  - Implement media selection handler
  - Handle modal open/close with focus management
  - _Requirements: 5.2, 5.3, 5.4, 5.5_

- [ ]* 12.1 Write property test for media insertion
  - **Property 13: Media insertion uses existing URL**
  - **Validates: Requirements 5.3, 5.4**

- [x] 13. Enhance ImageDropdown component in RichTextEditor
  - Add "From Media Library" option to dropdown
  - Wire up option to open MediaPickerModal
  - Maintain existing "From Products" and "Upload from Disk" options
  - _Requirements: 5.1_

- [x] 14. Integrate MediaPickerModal with RichTextEditor
  - Add MediaPickerModal to RichTextEditor component
  - Implement media selection handler to insert image
  - Ensure inserted images use existing URLs without duplication
  - Test focus management after modal close
  - _Requirements: 5.2, 5.3, 5.4, 5.5_

- [ ] 15. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. End-to-end testing and verification
  - Test complete upload → display → delete flow
  - Test upload → search → select → insert into editor flow
  - Test pagination with various data sizes
  - Test authorization (admin vs non-admin)
  - Test error handling for all failure scenarios
  - Verify responsive design on different screen sizes
  - _Requirements: All requirements_
