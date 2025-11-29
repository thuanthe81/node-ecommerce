# Implementation Plan

- [ ] 1. Set up testing infrastructure and utilities
  - Install fast-check library for property-based testing
  - Create shared test utilities for component comparison
  - Set up test helpers for rendering and interaction testing
  - _Requirements: 7.5, 8.1-8.4_

- [ ]* 1.1 Write property test for component identification
  - **Property 1: Component identification by line count**
  - **Validates: Requirements 1.1**

- [x] 2. Refactor Carousel component (1230 lines)
  - Create directory structure: Carousel/components, Carousel/utils, Carousel/hooks
  - Extract TypeScript interfaces to types.ts
  - Extract constants to constants.ts
  - _Requirements: 1.1, 1.2, 5.1, 5.2, 9.2_

- [x] 2.1 Extract Carousel utility functions
  - Move easing functions (easeInOutCubic, easeOutCubic) to utils/easing.ts
  - Move calculation functions (normalizeAngle, calculateItemTransform, calculateItemStyle, calculateZPosition, calculateFocusedIndex) to utils/calculations.ts
  - Move performance utilities (throttle, debounce) to utils/performance.ts
  - Add JSDoc comments to all utility functions
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 8.3_

- [ ]* 2.2 Write property test for utility function preservation
  - **Property 5: Utility function behavioral preservation**
  - **Validates: Requirements 2.5**

- [ ]* 2.3 Write unit tests for Carousel utilities
  - Test easing functions with boundary values
  - Test calculation functions with various inputs
  - Test performance utilities (throttle, debounce)
  - _Requirements: 2.5_

- [x] 2.4 Extract Carousel custom hooks
  - Create useCarouselState hook for rotation and drag state management
  - Create useAutoRotation hook for auto-rotation timer logic
  - Create useResponsiveConfig hook for responsive configuration
  - Create use3DTransformSupport hook for feature detection
  - Add JSDoc comments with usage examples
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 8.4_

- [ ]* 2.5 Write property test for hook naming conventions
  - **Property 6: Hook naming convention compliance**
  - **Validates: Requirements 3.2**

- [ ]* 2.6 Write property test for state management equivalence
  - **Property 8: State management behavioral equivalence**
  - **Validates: Requirements 3.5**

- [x] 2.7 Create Carousel sub-components
  - Keep existing CarouselItem, CarouselControls, CarouselIndicators as-is
  - Refactor Carousel3D component to use extracted hooks and utilities
  - Refactor Carousel2D component to use extracted hooks and utilities
  - Ensure SimpleFallbackSlider remains functional
  - _Requirements: 1.2, 1.3, 5.2_

- [ ]* 2.8 Write property test for functional equivalence
  - **Property 2: Functional equivalence after refactoring**
  - **Validates: Requirements 1.4**

- [ ]* 2.9 Write integration tests for Carousel
  - Test rotation on button clicks
  - Test drag interactions
  - Test auto-rotation behavior
  - Test responsive behavior
  - _Requirements: 1.4, 7.4_

- [x] 2.10 Update Carousel barrel export and documentation
  - Create index.tsx with proper exports
  - Add JSDoc comments to main Carousel3D component
  - Verify all imports resolve correctly
  - _Requirements: 2.4, 7.2, 8.1_

- [ ]* 2.11 Write property test for import resolution
  - **Property 4: Import resolution after extraction**
  - **Validates: Requirements 2.4**

- [x] 3. Checkpoint - Verify Carousel refactoring
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Refactor OrderDetailView component (987 lines)
  - Create directory structure: OrderDetailView/components, OrderDetailView/hooks
  - Extract TypeScript interfaces to types.ts
  - _Requirements: 1.1, 1.2, 5.1, 5.2_

- [x] 4.1 Extract OrderDetailView custom hooks
  - Create useOrderData hook for fetching order details
  - Create useBankSettings hook for fetching bank transfer settings
  - Add JSDoc comments with usage examples
  - _Requirements: 3.1, 3.2, 3.3, 8.4_

- [x] 4.2 Create OrderDetailView sub-components
  - Create OrderHeader component for order number, date, status
  - Create OrderItems component for order items list
  - Create OrderSummary component for pricing summary
  - Create ShippingInfo component for shipping address
  - Create BankTransferInfo component for payment instructions
  - Create SuccessBanner component for success message
  - Create LoadingState component for loading skeleton
  - Create ErrorState component for error display
  - Add JSDoc comments to all components
  - _Requirements: 1.2, 1.3, 5.2, 8.1, 8.2_

- [ ]* 4.3 Write property test for props interface preservation
  - **Property 14: Props interface preservation**
  - **Validates: Requirements 7.1**

- [ ]* 4.4 Write property test for rendered output equivalence
  - **Property 17: Rendered output equivalence**
  - **Validates: Requirements 7.4**

- [x] 4.5 Refactor main OrderDetailView component
  - Use extracted hooks for data fetching
  - Compose sub-components for rendering
  - Maintain all existing props and behavior
  - Add JSDoc comments
  - _Requirements: 1.4, 7.1, 7.2, 7.3, 7.4, 8.1_

- [ ]* 4.6 Write integration tests for OrderDetailView
  - Test loading states
  - Test error states
  - Test successful order display
  - Test bank transfer info display
  - _Requirements: 1.4, 7.4_

- [x] 4.7 Update OrderDetailView exports and verify imports
  - Create index.tsx with proper exports
  - Verify all imports resolve correctly
  - _Requirements: 2.4, 7.2_

- [ ] 5. Checkpoint - Verify OrderDetailView refactoring
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Refactor ShippingAddressForm component (625 lines)
  - Create directory structure: ShippingAddressForm/components, ShippingAddressForm/hooks, ShippingAddressForm/utils
  - Extract TypeScript interfaces to types.ts
  - _Requirements: 1.1, 1.2, 5.1, 5.2_

- [x] 6.1 Extract ShippingAddressForm validation utilities
  - Create utils/validation.ts with validation functions
  - Implement validateFullName, validatePhone, validateAddressLine, validateCity, validateState, validatePostalCode, validateForm
  - Add JSDoc comments to all validation functions
  - _Requirements: 2.1, 2.2, 2.3, 4.2, 8.3_

- [ ]* 6.2 Write property test for form validation preservation
  - **Property 9: Form validation preservation**
  - **Validates: Requirements 4.4**

- [x] 6.3 Extract ShippingAddressForm custom hooks
  - Create useAddressForm hook for form state and validation
  - Create useSavedAddresses hook for fetching saved addresses
  - Add JSDoc comments with usage examples
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 8.4_

- [x] 6.4 Create ShippingAddressForm sub-components
  - Create SavedAddressList component for displaying saved addresses
  - Create AddressCard component for individual address display
  - Create NewAddressForm component for address input fields
  - Create FormField component for reusable form field with validation
  - Add JSDoc comments to all components
  - _Requirements: 1.2, 1.3, 4.3, 5.2, 8.1, 8.2_

- [x] 6.5 Refactor main ShippingAddressForm component
  - Use extracted hooks for form management
  - Compose sub-components for rendering
  - Maintain all existing props and behavior
  - Add JSDoc comments
  - _Requirements: 1.4, 4.4, 7.1, 7.2, 7.3, 7.4, 8.1_

- [ ]* 6.6 Write integration tests for ShippingAddressForm
  - Test saved address selection
  - Test new address form submission
  - Test validation error display
  - Test real-time validation
  - _Requirements: 1.4, 4.4, 7.4_

- [x] 6.7 Update ShippingAddressForm exports and verify imports
  - Create index.tsx with proper exports
  - Verify all imports resolve correctly
  - _Requirements: 2.4, 7.2_

- [ ] 7. Checkpoint - Verify ShippingAddressForm refactoring
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Refactor ContentForm component (544 lines)
  - Create directory structure: ContentForm/components, ContentForm/hooks, ContentForm/utils
  - Extract TypeScript interfaces to types.ts
  - _Requirements: 1.1, 1.2, 5.1, 5.2_

- [x] 8.1 Extract ContentForm validation utilities
  - Create utils/validation.ts with validateSlug, validateUrl, validateContentForm
  - Add JSDoc comments to all validation functions
  - _Requirements: 2.1, 2.2, 2.3, 4.2, 8.3_

- [x] 8.2 Extract ContentForm custom hook
  - Create useContentForm hook for form state and validation
  - Add JSDoc comments with usage examples
  - _Requirements: 3.1, 3.2, 3.3, 8.4_

- [x] 8.3 Create ContentForm sub-components
  - Create ContentTypeSelector component for type dropdown
  - Create LanguageTabs component for EN/VI tab switcher
  - Create ContentFields component for title and content inputs
  - Create MediaSection component for image and link URL fields
  - Create PreviewPanel component for live preview
  - Add JSDoc comments to all components
  - _Requirements: 1.2, 1.3, 4.3, 5.2, 8.1, 8.2_

- [x] 8.4 Refactor main ContentForm component
  - Use extracted hook for form management
  - Compose sub-components for rendering
  - Maintain all existing props and behavior
  - Add JSDoc comments
  - _Requirements: 1.4, 4.4, 7.1, 7.2, 7.3, 7.4, 8.1_

- [ ]* 8.5 Write integration tests for ContentForm
  - Test form submission with valid data
  - Test validation error display
  - Test language tab switching
  - Test preview functionality
  - _Requirements: 1.4, 4.4, 7.4_

- [x] 8.6 Update ContentForm exports and verify imports
  - Create index.tsx with proper exports
  - Verify all imports resolve correctly
  - _Requirements: 2.4, 7.2_

- [ ] 9. Checkpoint - Verify ContentForm refactoring
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Refactor ImageManager component (497 lines)
  - Create directory structure: ImageManager/components, ImageManager/hooks
  - Extract TypeScript interfaces to types.ts
  - _Requirements: 1.1, 1.2, 5.1, 5.2_

- [x] 10.1 Extract ImageManager custom hooks
  - Create useImageManager hook for image state management
  - Create useDragAndDrop hook for drag-and-drop functionality
  - Add JSDoc comments with usage examples
  - _Requirements: 3.1, 3.2, 3.3, 8.4_

- [x] 10.2 Create ImageManager sub-components
  - Create ImageUploadZone component for drag-and-drop upload
  - Create ImageGrid component for displaying images
  - Create SortableImageItem component for individual image with drag handle
  - Create AltTextEditor component for editing alt text
  - Add JSDoc comments to all components
  - _Requirements: 1.2, 1.3, 5.2, 8.1, 8.2_

- [x] 10.3 Refactor main ImageManager component
  - Use extracted hooks for state and drag-and-drop
  - Compose sub-components for rendering
  - Maintain all existing props and behavior
  - Add JSDoc comments
  - _Requirements: 1.4, 7.1, 7.2, 7.3, 7.4, 8.1_

- [ ]* 10.4 Write integration tests for ImageManager
  - Test image upload
  - Test image deletion
  - Test image reordering via drag-and-drop
  - Test alt text editing
  - _Requirements: 1.4, 7.4_

- [x] 10.5 Update ImageManager exports and verify imports
  - Create index.tsx with proper exports
  - Verify all imports resolve correctly
  - _Requirements: 2.4, 7.2_

- [ ] 11. Checkpoint - Verify ImageManager refactoring
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Refactor ProductForm component (477 lines)
  - Create directory structure: ProductForm/components, ProductForm/hooks
  - Extract TypeScript interfaces to types.ts
  - _Requirements: 1.1, 1.2, 5.1, 5.2_

- [x] 12.1 Extract ProductForm custom hook
  - Create useProductForm hook for form state and submission
  - Add JSDoc comments with usage examples
  - _Requirements: 3.1, 3.2, 3.3, 8.4_

- [x] 12.2 Create ProductForm sub-components
  - Create BasicInfoFields component for SKU, name, description
  - Create PricingFields component for price, compare at price, stock
  - Create ProductOptions component for active, featured checkboxes
  - Add JSDoc comments to all components
  - _Requirements: 1.2, 1.3, 5.2, 8.1, 8.2_

- [x] 12.3 Refactor main ProductForm component
  - Use extracted hook for form management
  - Compose sub-components for rendering
  - Maintain all existing props and behavior
  - Add JSDoc comments
  - _Requirements: 1.4, 7.1, 7.2, 7.3, 7.4, 8.1_

- [ ]* 12.4 Write integration tests for ProductForm
  - Test product creation
  - Test product editing
  - Test image upload integration
  - Test category selection
  - _Requirements: 1.4, 7.4_

- [x] 12.5 Update ProductForm exports and verify imports
  - Create index.tsx with proper exports
  - Verify all imports resolve correctly
  - _Requirements: 2.4, 7.2_

- [x] 13. Refactor HomepageSectionForm component (443 lines)
  - Create directory structure: HomepageSectionForm/components, HomepageSectionForm/hooks
  - Extract TypeScript interfaces to types.ts
  - Extract custom hook for form management
  - Create sub-components for layout selector, field groups, preview
  - Maintain all existing props and behavior
  - Add JSDoc comments
  - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3, 5.1, 5.2, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.4_

- [ ]* 13.1 Write integration tests for HomepageSectionForm
  - Test form submission
  - Test preview updates
  - Test layout switching
  - _Requirements: 1.4, 7.4_

- [x] 14. Refactor CategoryForm component (387 lines)
  - Create directory structure: CategoryForm/components, CategoryForm/hooks
  - Extract TypeScript interfaces to types.ts
  - Extract custom hook for form management
  - Create sub-components for field groups
  - Maintain all existing props and behavior
  - Add JSDoc comments
  - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3, 5.1, 5.2, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.4_

- [ ]* 14.1 Write integration tests for CategoryForm
  - Test category creation
  - Test category editing
  - Test parent category selection
  - _Requirements: 1.4, 7.4_

- [x] 15. Refactor Header component (324 lines)
  - Create directory structure: Header/components, Header/hooks
  - Extract TypeScript interfaces to types.ts
  - _Requirements: 1.1, 1.2, 5.1, 5.2_

- [x] 15.1 Extract Header custom hook
  - Create useHeaderState hook for mobile menu and active link detection
  - Add JSDoc comments with usage examples
  - _Requirements: 3.1, 3.2, 3.3, 8.4_

- [x] 15.2 Create Header sub-components
  - Create MobileMenuButton component for hamburger menu
  - Create Logo component for site branding
  - Create DesktopNav component for desktop navigation links
  - Create MobileNav component for mobile navigation menu
  - Create UserActions component for account/login/logout links
  - Add JSDoc comments to all components
  - _Requirements: 1.2, 1.3, 5.2, 8.1, 8.2_

- [x] 15.3 Refactor main Header component
  - Use extracted hook for state management
  - Compose sub-components for rendering
  - Maintain all existing props and behavior
  - Add JSDoc comments
  - _Requirements: 1.4, 7.1, 7.2, 7.3, 7.4, 8.1_

- [ ]* 15.4 Write integration tests for Header
  - Test mobile menu toggle
  - Test active link highlighting
  - Test user authentication states
  - Test logout functionality
  - _Requirements: 1.4, 7.4_

- [x] 15.5 Update Header exports and verify imports
  - Create index.tsx with proper exports
  - Verify all imports resolve correctly
  - _Requirements: 2.4, 7.2_

- [ ] 16. Checkpoint - Verify all refactoring complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 17. Write property tests for directory structure
  - **Property 3: Directory structure consistency**
  - **Property 10: Component-specific subdirectory structure**
  - **Property 11: Utility subdirectory placement**
  - **Property 12: Hook subdirectory placement**
  - **Property 13: Type file directory placement**
  - **Validates: Requirements 1.5, 5.2, 5.4, 5.5, 6.3**

- [ ]* 18. Write property tests for documentation
  - **Property 18: JSDoc presence for exported components**
  - **Property 19: Props interface documentation**
  - **Property 20: Utility function documentation**
  - **Property 21: Hook documentation**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

- [ ]* 19. Write property tests for React best practices
  - **Property 23: React.memo usage for stable props**
  - **Property 24: useCallback for passed callbacks**
  - **Validates: Requirements 10.1, 10.2**

- [ ]* 20. Write property test for export name preservation
  - **Property 15: Export name preservation**
  - **Validates: Requirements 7.2**

- [ ]* 21. Write property test for callback signature preservation
  - **Property 16: Callback signature preservation**
  - **Validates: Requirements 7.3**

- [ ]* 22. Write property test for component prioritization
  - **Property 22: Component prioritization by line count**
  - **Validates: Requirements 9.1**

- [x] 23. Final verification and documentation
  - Run full test suite and verify all tests pass
  - Verify bundle size has not increased significantly
  - Update any affected documentation
  - Create summary of refactoring changes
  - _Requirements: 7.5, 8.1-8.4_

- [x] 24. Final Checkpoint - Complete refactoring
  - Ensure all tests pass, ask the user if questions arise.
