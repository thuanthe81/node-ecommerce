# Implementation Plan

- [x] 1. Update backend DTOs and validation
  - [x] 1.1 Remove imageUrl field from CreateCategoryDto
    - Modify `backend/src/categories/dto/create-category.dto.ts`
    - Remove the `@IsOptional() @IsString() imageUrl?: string;` field
    - _Requirements: 1.3, 4.1, 4.3_

  - [x] 1.2 Ensure UpdateCategoryDto includes optional imageUrl with URL validation
    - Modify `backend/src/categories/dto/update-category.dto.ts`
    - Add explicit `@IsOptional() @IsString() @IsUrl() imageUrl?: string;` field
    - _Requirements: 4.2, 4.4_

  - [ ]* 1.3 Write property test for CreateCategoryDto validation
    - **Property 2: Category creation rejects requests with imageUrl**
    - **Validates: Requirements 1.3, 4.3**

- [x] 2. Implement backend service methods for image management
  - [x] 2.1 Add getAvailableProductImages method to CategoriesService
    - Fetch all product images with associated product metadata
    - Implement deduplication logic for image URLs
    - Return array with image URL, product ID, and product names
    - _Requirements: 2.2, 3.2, 3.3_

  - [x] 2.2 Add validateProductImageUrl method to CategoriesService
    - Query ProductImage table to verify URL exists
    - Return boolean indicating validity
    - _Requirements: 4.4_

  - [x] 2.3 Modify update method to validate imageUrl
    - Call validateProductImageUrl when imageUrl is provided
    - Throw BadRequestException with descriptive message if invalid
    - _Requirements: 4.4, 4.5_

  - [ ]* 2.4 Write property test for image validation
    - **Property 8: ImageUrl validation in updates**
    - **Validates: Requirements 4.4, 4.5**

  - [ ]* 2.5 Write property test for product images deduplication
    - **Property 4: Image selector displays all product images**
    - **Validates: Requirements 2.2, 3.2**

- [x] 3. Add backend API endpoint for product images
  - [x] 3.1 Add GET /categories/product-images endpoint to CategoriesController
    - Create new controller method that calls getAvailableProductImages
    - Return formatted response with image data
    - _Requirements: 2.2_

  - [ ]* 3.2 Write unit test for product images endpoint
    - Test successful fetch of product images
    - Test empty state when no images exist
    - Test includes product metadata
    - _Requirements: 2.2, 3.3, 3.5_

- [x] 4. Create ProductImageSelector frontend component
  - [x] 4.1 Create ProductImageSelector component file
    - Create `frontend/components/ProductImageSelector.tsx`
    - Implement props interface (selectedImageUrl, onImageSelect, onImageClear, locale)
    - Add state management for loading and images
    - _Requirements: 2.1, 3.1_

  - [x] 4.2 Implement image fetching and display logic
    - Fetch product images from API on component mount
    - Display images in grid layout with thumbnails
    - Show product names alongside images
    - Handle loading and error states
    - _Requirements: 2.2, 3.1, 3.2, 3.3_

  - [x] 4.3 Implement image selection and clearing functionality
    - Handle click events on images to select
    - Highlight selected image visually
    - Provide clear/remove button for selected image
    - Call appropriate callbacks (onImageSelect, onImageClear)
    - _Requirements: 2.3, 3.4, 5.1, 5.2_

  - [x] 4.4 Implement empty state display
    - Show appropriate message when no product images exist
    - Style empty state appropriately
    - _Requirements: 3.5_

  - [ ]* 4.5 Write property test for image selection state
    - **Property 5: Image selection updates form state**
    - **Validates: Requirements 2.3**

  - [ ]* 4.6 Write property test for product metadata display
    - **Property 7: Product metadata displayed with images**
    - **Validates: Requirements 3.3**

- [x] 5. Update CategoryForm component
  - [x] 5.1 Remove image upload field from create mode
    - Modify `frontend/components/CategoryForm.tsx`
    - Conditionally hide image upload section when not in edit mode
    - Remove imageFile state and handleImageSelect for create mode
    - _Requirements: 1.1_

  - [x] 5.2 Add ProductImageSelector to edit mode
    - Import and render ProductImageSelector component in edit mode
    - Pass current imageUrl as selectedImageUrl prop
    - Implement onImageSelect handler to update formData
    - Implement onImageClear handler to clear imageUrl
    - _Requirements: 2.1, 2.5, 5.1_

  - [x] 5.3 Update form submission logic
    - Remove image upload logic from create mode
    - Ensure imageUrl is not sent in create requests
    - Ensure imageUrl is properly sent in update requests
    - _Requirements: 1.2, 2.4_

  - [ ]* 5.4 Write unit tests for CategoryForm create mode
    - Test image field is not rendered in create mode
    - Test form submits without imageUrl
    - _Requirements: 1.1, 1.2_

  - [ ]* 5.5 Write unit tests for CategoryForm edit mode
    - Test ProductImageSelector is rendered
    - Test current image is displayed
    - Test image selection updates form state
    - Test image clearing updates form state
    - _Requirements: 2.1, 2.5, 5.1, 5.2_

- [x] 6. Add frontend API client methods
  - [x] 6.1 Add getProductImages method to category API client
    - Modify `frontend/lib/admin-category-api.ts`
    - Add method to fetch product images from new endpoint
    - Return typed response with image data
    - _Requirements: 2.2_

  - [ ]* 6.2 Write unit test for API client method
    - Test successful fetch
    - Test error handling
    - _Requirements: 2.2_

- [ ] 7. Implement backend property-based tests
  - [ ]* 7.1 Write property test for category creation without imageUrl
    - **Property 1: Category creation accepts requests without imageUrl**
    - **Validates: Requirements 1.2**

  - [ ]* 7.2 Write property test for created categories having null imageUrl
    - **Property 3: Created categories have null imageUrl**
    - **Validates: Requirements 1.4**

  - [ ]* 7.3 Write property test for category update persisting imageUrl
    - **Property 6: Category update persists imageUrl**
    - **Validates: Requirements 2.4**

  - [ ]* 7.4 Write property test for clearing image
    - **Property 9: Clearing image sets null imageUrl**
    - **Validates: Requirements 5.3**

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Integration testing and validation
  - [ ]* 9.1 Write integration test for category creation flow
    - Test creating category without image
    - Verify database state
    - Verify API response
    - _Requirements: 1.2, 1.4_

  - [ ]* 9.2 Write integration test for category update with image flow
    - Test updating category with product image
    - Verify database state
    - Verify image is persisted
    - _Requirements: 2.3, 2.4_

  - [ ]* 9.3 Write integration test for image clearing flow
    - Test clearing image from category
    - Verify database state shows null imageUrl
    - _Requirements: 5.3_

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
