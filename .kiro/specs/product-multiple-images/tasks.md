# Implementation Plan

- [x] 1. Enhance backend product creation to support multiple images
  - Create endpoint to accept product data with multiple image files in a single request
  - Implement transaction-based creation to ensure atomicity
  - Add validation for file types and sizes
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.2, 8.3, 8.4, 8.5_

- [x] 1.1 Update CreateProductDto to handle multipart form data
  - Modify DTO to work with FormData containing both product fields and files
  - Add validation decorators for image files
  - _Requirements: 1.1_

- [x] 1.2 Implement ProductsService.createWithImages method
  - Create method that accepts product data and multiple files
  - Use Prisma transaction to create product and images atomically
  - Handle rollback on failure
  - _Requirements: 1.4_

- [x] 1.3 Implement ProductsImageService.uploadMultipleImages method
  - Process multiple image files in parallel
  - Generate thumbnails for each image
  - Assign sequential display orders starting from 0
  - Return array of created ProductImage records
  - _Requirements: 1.2, 1.3, 8.4, 8.5_

- [x] 1.4 Update ProductsController.create endpoint
  - Add @UseInterceptors(FilesInterceptor('images', 10)) for multiple file upload
  - Call createWithImages service method
  - Handle partial upload failures with appropriate error responses
  - _Requirements: 1.1, 1.5_

- [ ]* 1.5 Write property tests for multi-image upload
  - **Property 1: Multiple image upload acceptance**
  - **Property 2: Unique identifiers for uploaded images**
  - **Property 3: Sequential display order assignment**
  - **Property 4: Product-image persistence round trip**
  - **Property 5: Partial upload failure reporting**
  - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

- [ ]* 1.6 Write property tests for validation
  - **Property 23: File type and size validation**
  - **Property 24: Validation error reporting**
  - **Property 25: Thumbnail generation**
  - **Property 26: Complete URL response**
  - **Validates: Requirements 8.2, 8.3, 8.4, 8.5**

- [x] 2. Implement image reordering functionality
  - Create API endpoint to reorder images
  - Implement display order normalization
  - Ensure sequential ordering is maintained
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [x] 2.1 Create ReorderImagesDto
  - Define DTO with array of {imageId, displayOrder} objects
  - Add validation decorators
  - _Requirements: 2.2_

- [x] 2.2 Implement ProductsImageService.reorderImages method
  - Accept product ID and array of image order mappings
  - Update display orders in a transaction
  - Validate all images belong to the product
  - Return updated images in new order
  - _Requirements: 2.2, 2.3_

- [x] 2.3 Implement ProductsImageService.normalizeDisplayOrder method
  - Query all images for a product ordered by displayOrder
  - Update display orders to be sequential (0, 1, 2, ...)
  - Use transaction to ensure atomicity
  - _Requirements: 2.5_

- [x] 2.4 Add PATCH /products/:id/images/reorder endpoint
  - Add controller method with admin authentication
  - Call reorderImages service method
  - Return updated images
  - _Requirements: 2.2, 2.3_

- [ ]* 2.5 Write property tests for reordering
  - **Property 6: Display order preservation on retrieval**
  - **Property 7: Reorder operation correctness**
  - **Property 8: Reorder persistence**
  - **Property 9: Sequential display order invariant**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.5**

- [x] 3. Enhance image deletion with display order normalization
  - Update deletion logic to normalize remaining images
  - Ensure file cleanup happens correctly
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [x] 3.1 Update ProductsImageService.deleteProductImage method
  - After deleting image, call normalizeDisplayOrder
  - Ensure file cleanup happens even if normalization fails
  - Add proper error handling and rollback
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [ ]* 3.2 Write property tests for deletion
  - **Property 10: Image deletion removes from product**
  - **Property 11: File cleanup on deletion**
  - **Property 12: Display order normalization after deletion**
  - **Property 13: State consistency on deletion failure**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.5**

- [x] 4. Implement adding images to existing products
  - Ensure new images are appended after existing ones
  - Calculate correct starting display order
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 4.1 Update ProductsImageService.uploadProductImage method
  - Query for highest existing display order
  - Start new images from max + 1
  - Handle case where product has no images (start from 0)
  - _Requirements: 4.2, 4.3_

- [ ]* 4.2 Write property tests for adding images
  - **Property 14: Complete image retrieval**
  - **Property 15: Appending new images preserves order**
  - **Property 16: Display order continuation**
  - **Validates: Requirements 4.1, 4.2, 4.3**

- [x] 5. Implement alt text handling
  - Support default alt text when not provided
  - Allow updating alt text for existing images
  - _Requirements: 5.2, 5.3, 5.4, 5.5_

- [x] 5.1 Update image upload methods to handle default alt text
  - If altTextEn or altTextVi not provided, use product name
  - Apply default in both uploadProductImage and uploadMultipleImages
  - _Requirements: 5.3_

- [x] 5.2 Create UpdateProductImageDto
  - Define DTO for updating image metadata
  - Include optional altTextEn, altTextVi, displayOrder fields
  - _Requirements: 5.5_

- [x] 5.3 Add PATCH /products/:id/images/:imageId endpoint
  - Allow updating alt text and display order for individual images
  - Require admin authentication
  - _Requirements: 5.5_

- [ ]* 5.4 Write property tests for alt text
  - **Property 17: Alt text round trip**
  - **Property 18: Default alt text application**
  - **Property 19: Language-appropriate alt text rendering**
  - **Property 20: Alt text update persistence**
  - **Validates: Requirements 5.2, 5.3, 5.4, 5.5**

- [x] 6. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Create ImageManager component for admin interface
  - Build reusable component for managing product images
  - Support drag-and-drop upload, reordering, and deletion
  - _Requirements: 1.1, 2.2, 3.1, 4.2, 5.5_

- [x] 7.1 Create ImageManager component structure
  - Set up component with props for productId, existingImages, onImagesChange
  - Create state management for images and upload queue
  - Add locale support for bilingual interface
  - _Requirements: 1.1_

- [x] 7.2 Implement drag-and-drop file upload
  - Add file input with multiple file support
  - Implement drag-and-drop zone
  - Show file previews before upload
  - Validate file types and sizes client-side
  - _Requirements: 1.1_

- [x] 7.3 Implement image preview grid
  - Display existing and new images in a grid
  - Show primary image indicator (first image)
  - Add delete button for each image
  - Show upload progress for new images
  - _Requirements: 3.1_

- [x] 7.4 Implement drag-to-reorder functionality
  - Use react-beautiful-dnd or similar library
  - Allow dragging images to reorder
  - Update display order on drop
  - Call reorder API endpoint
  - Show visual feedback during drag
  - _Requirements: 2.2_

- [x] 7.5 Implement inline alt text editing
  - Add expandable section for each image to edit alt text
  - Provide fields for both English and Vietnamese
  - Auto-save on blur or provide save button
  - _Requirements: 5.5_

- [x] 7.6 Integrate ImageManager into ProductForm
  - Replace existing image upload section with ImageManager
  - Handle image state in product creation and editing flows
  - Ensure proper error handling and user feedback
  - _Requirements: 1.1, 4.2_

- [x] 8. Create ProductImageGallery component for customer interface
  - Build gallery component for product detail pages
  - Support navigation, keyboard controls, and mobile gestures
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3_

- [x] 8.1 Create ProductImageGallery component structure
  - Set up component with props for images, productName, locale
  - Create state for current image index
  - Handle empty images case with placeholder
  - _Requirements: 6.5, 7.3_

- [x] 8.2 Implement main image display
  - Show current image at full size
  - Include appropriate alt text for accessibility
  - Add loading state and error handling
  - _Requirements: 6.1, 7.1_

- [x] 8.3 Implement thumbnail navigation
  - Display thumbnails below main image
  - Highlight current thumbnail
  - Click thumbnail to change main image
  - Show/hide navigation based on image count
  - _Requirements: 6.2, 6.3, 6.4_

- [x] 8.4 Add keyboard and touch navigation
  - Implement arrow key navigation (left/right)
  - Add swipe gestures for mobile
  - Add previous/next buttons
  - _Requirements: 6.3_

- [x] 8.5 Integrate ProductImageGallery into product detail page
  - Replace existing image display with gallery component
  - Ensure responsive layout
  - Test with products having 0, 1, and multiple images
  - _Requirements: 6.1_

- [ ]* 8.6 Write property tests for gallery
  - **Property 21: Ordered image display**
  - **Property 22: Primary image selection**
  - **Validates: Requirements 6.1, 7.1, 7.2**

- [x] 9. Enhance ProductCard to show primary image
  - Update ProductCard to select and display primary image
  - Add optional hover effect for second image
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 9.1 Update ProductCard component
  - Select image with lowest displayOrder as primary
  - Show placeholder if no images
  - Optionally show second image on hover (if available)
  - Ensure proper image sizing and aspect ratio
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 10. Update frontend API client
  - Add methods for new image endpoints
  - Update existing methods to handle multiple images
  - _Requirements: 1.1, 2.2, 5.5_

- [x] 10.1 Update productApi in product-api.ts
  - Add uploadMultipleImages method
  - Add reorderImages method
  - Add updateImageMetadata method
  - Update createProduct to handle multiple files
  - _Requirements: 1.1, 2.2, 5.5_

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Manual testing and polish
  - Test complete user flows in both admin and customer interfaces
  - Verify responsive design on mobile devices
  - Check accessibility with screen readers
  - Test error scenarios and edge cases
  - _Requirements: All_
