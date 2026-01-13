# Implementation Plan: Blog Background Image

## Overview

This implementation adds background image functionality to the existing blog system by extending the BlogPostForm component with a new imageBackground field and modifying the BlogPostPage component to display background images. Additionally, it enhances the ImagePickerModal component with tabbed interface support, allowing administrators to choose images from both product images and the media library. The approach leverages existing patterns for image handling and form field management while providing a unified image selection experience.

## Tasks

- [x] 1. Extend blog post data interfaces
  - Add `imageBackground: string` field to `BlogPostFormData` interface in `frontend/components/BlogPostForm/types.ts`
  - Add `imageBackground?: string` field to `BlogPost` interface in `frontend/lib/blog-api.ts`
  - Add `imageBackground?: string` field to `CreateBlogPostData` interface in `frontend/lib/blog-api.ts`
  - _Requirements: 1.1, 1.2, 1.3_

- [ ]* 1.1 Write property test for form data handling
  - **Property 1: Background image form data handling**
  - **Validates: Requirements 1.2, 1.3, 3.4**

- [x] 2. Extend BlogPostForm with background image field
  - [x] 2.1 Add background image state management to BlogPostForm component
    - Add `showBackgroundImagePicker` state variable
    - Add `imageBackground` to form data initialization
    - Add background image change handler
    - _Requirements: 1.1, 1.2_

  - [x] 2.2 Extend PublishingSection component with background image field
    - Add background image field UI following featured image pattern
    - Add image preview display when background image is selected
    - Add button to open background image picker modal
    - Include validation error display for background image field
    - _Requirements: 1.1, 1.5, 3.1_

  - [ ]* 2.3 Write property test for background image preview
    - **Property 2: Background image preview display**
    - **Validates: Requirements 1.5, 3.5**

  - [x] 2.4 Add background image picker modal integration
    - Add second ImagePickerModal instance for background image selection
    - Implement background image selection handler
    - Ensure modal state independence from featured image picker
    - _Requirements: 1.2, 3.2_

  - [ ]* 2.5 Write property test for image picker consistency
    - **Property 4: Image picker modal consistency**
    - **Validates: Requirements 3.2**

- [x] 3. Add translations for background image field
  - Add English and Vietnamese translations for background image labels
  - Add translations for "Background Image", "Select Background Image", "Change Background Image"
  - Update `frontend/locales/translations.json` with new keys under admin.blog section
  - _Requirements: 1.1_

- [x] 4. Extend BlogPostPage with background image display
  - [x] 4.1 Add background image rendering to BlogPostPage component
    - Extract background image URL from blog post data
    - Apply CSS background-image styling to main content area
    - Implement fallback for missing background images
    - Add layout stability styling to prevent shifts
    - _Requirements: 2.1, 2.2, 2.4_

  - [ ]* 4.2 Write property test for background image display
    - **Property 3: Background image page display**
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 4.3 Write property test for layout stability
    - **Property 6: Layout stability**
    - **Validates: Requirements 2.4**

  - [x] 4.4 Add error handling for invalid background images
    - Implement graceful fallback for failed image loads
    - Add error boundary protection for invalid URLs
    - Ensure component stability with malformed image data
    - _Requirements: 2.5_

  - [ ]* 4.5 Write property test for error handling
    - **Property 7: Error handling graceful fallback**
    - **Validates: Requirements 2.5**

- [x] 5. Add form validation for background image field
  - Extend form validation to handle optional background image field
  - Apply consistent URL validation rules as other image fields
  - Ensure empty/null values are handled correctly
  - _Requirements: 3.3_

- [ ]* 5.1 Write property test for form validation
  - **Property 5: Form validation consistency**
  - **Validates: Requirements 3.3**

- [x] 6. Enhance ImagePickerModal with tabbed interface
  - [x] 6.1 Add tab interface structure to ImagePickerModal
    - Add tab state management with "Products" and "Media Library" tabs
    - Create tab navigation UI with consistent styling
    - Implement tab switching functionality
    - Default to "Products" tab for backward compatibility
    - _Requirements: 4.1, 4.6_

  - [ ]* 6.2 Write property test for tab interface
    - **Property 8: Tab switching functionality**
    - **Validates: Requirements 4.2, 4.3**

  - [x] 6.3 Integrate media library images into ImagePickerModal
    - Add media library API integration using existing contentMediaApi
    - Implement media library image loading and display
    - Add media library search functionality
    - Ensure consistent grid layout with product images
    - _Requirements: 4.3, 4.7_

  - [ ]* 6.4 Write property test for consistent grid layout
    - **Property 11: Consistent grid layout**
    - **Validates: Requirements 4.7**

  - [x] 6.5 Implement search query preservation across tabs
    - Maintain search query state when switching between tabs
    - Apply search functionality to both product and media library images
    - Preserve modal state during tab transitions
    - _Requirements: 4.4_

  - [ ]* 6.6 Write property test for search query preservation
    - **Property 9: Search query preservation**
    - **Validates: Requirements 4.4**

  - [x] 6.7 Add unified image selection handling
    - Implement consistent image selection behavior across both tabs
    - Ensure modal closes after image selection from either tab
    - Return correct image URL regardless of source (product or media)
    - _Requirements: 4.5_

  - [ ]* 6.8 Write property test for image selection across tabs
    - **Property 10: Image selection across tabs**
    - **Validates: Requirements 4.5**

  - [x] 6.9 Add empty state handling for both tabs
    - Implement appropriate empty state messages for products tab
    - Implement appropriate empty state messages for media library tab
    - Ensure consistent empty state styling across tabs
    - _Requirements: 4.8_

  - [ ]* 6.10 Write property test for empty state handling
    - **Property 12: Empty state handling**
    - **Validates: Requirements 4.8**

- [x] 7. Add translations for ImagePickerModal tabs
  - Add English and Vietnamese translations for tab labels
  - Add translations for "Products", "Media Library", empty state messages
  - Update `frontend/locales/translations.json` with new keys under admin section
  - _Requirements: 4.1, 4.2, 4.3, 4.8_

- [ ] 8. Update property tests for enhanced form functionality
  - [ ]* 8.1 Update property test for background image preview and form population
    - **Property 2: Background image preview and form population**
    - **Validates: Requirements 1.5, 3.5**

  - [ ]* 8.2 Update property test for form data handling
    - **Property 1: Background image form data handling**
    - **Validates: Requirements 1.2, 1.3, 1.4, 3.4**

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Integration testing and final verification
  - [x] 10.1 Test complete form workflow with enhanced image picker
    - Verify form submission includes imageBackground field
    - Test form initialization with existing background images
    - Validate enhanced image picker modal integration with both tabs
    - Test image selection from both product and media library sources
    - _Requirements: 1.2, 1.3, 3.4, 3.5, 4.5_

  - [ ]* 10.2 Write integration tests for enhanced image picker workflow
    - Test end-to-end form submission with background images from both sources
    - Test blog post page rendering with background images
    - Test enhanced image picker modal workflow with tab switching
    - Test search functionality across both tabs

  - [ ] 10.3 Verify visual consistency and accessibility
    - Ensure background image field matches existing form field styling
    - Verify text readability with background images
    - Test responsive behavior on different screen sizes
    - Verify tab interface accessibility and keyboard navigation
    - _Requirements: 2.3, 3.1, 4.1_

  - [ ] 10.4 Test backward compatibility
    - Verify existing components using ImagePickerModal still work correctly
    - Test that CategoryForm, ContentForm, and RichTextEditor work with enhanced modal
    - Ensure default "Products" tab maintains existing behavior
    - _Requirements: 4.6_

- [ ] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Background image field follows existing featured image patterns for consistency
- ImagePickerModal enhancement maintains backward compatibility by defaulting to "Products" tab
- Enhanced modal affects multiple components (BlogPostForm, CategoryForm, ContentForm, RichTextEditor)
- Property tests validate universal correctness properties for both blog background images and modal functionality
- Unit tests validate specific examples and edge cases
- Integration tests ensure end-to-end functionality works correctly across all affected components
- Backward compatibility testing ensures existing functionality remains intact