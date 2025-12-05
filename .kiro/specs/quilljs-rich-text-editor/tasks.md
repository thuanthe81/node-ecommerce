# Implementation Plan

- [x] 1. Install dependencies and set up project structure
  - Install quill, react-quill, and @types/quill packages
  - Create RichTextEditor component directory structure following modular pattern
  - Create types.ts file with TypeScript interfaces
  - _Requirements: 6.1, 6.4, 6.5_

- [x] 2. Create RichTextEditor component foundation
  - [x] 2.1 Implement main RichTextEditor component with basic Quill integration
    - Create RichTextEditor.tsx with component structure
    - Accept value, onChange, readOnly, showToolbar, placeholder, locale props
    - Render container div for Quill editor
    - _Requirements: 1.1, 5.1_

  - [x] 2.2 Create useQuillEditor hook for editor lifecycle management
    - Initialize Quill instance on mount
    - Configure toolbar with formatting options (headers, bold, italic, underline, lists, link, image)
    - Set up text-change event listener
    - Handle cleanup on unmount
    - Sync content changes to parent via onChange callback
    - _Requirements: 1.1, 1.2, 1.4, 6.2_

  - [ ]* 2.3 Write property test for formatting operations
    - **Property 1: Formatting operations produce correct HTML**
    - **Validates: Requirements 1.2**

  - [x] 2.4 Implement read-only mode for preview functionality
    - Add readOnly prop handling to toggle Quill's enable/disable
    - Hide toolbar when showToolbar is false
    - Apply preview-specific styling
    - _Requirements: 1.5, 5.3_

  - [ ]* 2.5 Write property test for preview mode
    - **Property 4: Preview mode preserves content**
    - **Validates: Requirements 1.5, 5.3**

- [x] 3. Implement image insertion functionality
  - [x] 3.1 Create useImageInsertion hook
    - Manage product image picker modal state
    - Handle product image selection
    - Handle file upload process
    - Insert images at cursor position
    - Track upload loading and error states
    - _Requirements: 2.1, 2.2, 2.4, 3.1, 6.2_

  - [x] 3.2 Create custom image toolbar handler with dropdown
    - Override default Quill image button handler
    - Display dropdown with "From Products" and "Upload from Disk" options
    - Handle option selection
    - _Requirements: 2.1_

  - [ ]* 3.3 Write unit tests for image insertion UI
    - Test image button click shows dropdown
    - Test "From Products" option opens modal
    - Test "Upload from Disk" option opens file dialog
    - _Requirements: 2.1, 2.2, 3.1_

  - [x] 3.4 Implement product image selection flow
    - Integrate with existing ImagePickerModal component
    - Handle image selection callback
    - Insert selected image URL into editor at cursor position
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

  - [ ]* 3.5 Write property test for product image insertion
    - **Property 6: Image insertion at cursor position**
    - **Property 7: Image inline rendering**
    - **Validates: Requirements 2.4, 2.5**

- [x] 4. Implement file upload functionality
  - [x] 4.1 Create file validation utility
    - Validate file type (JPEG, PNG, GIF, WebP)
    - Validate file size (max 5MB)
    - Return validation result with error message
    - _Requirements: 3.2, 3.5_

  - [ ]* 4.2 Write property test for file validation
    - **Property 8: File validation correctness**
    - **Property 10: Invalid file error messaging**
    - **Validates: Requirements 3.2, 3.5**

  - [x] 4.3 Create image upload handler utility
    - Accept file and upload to server
    - Handle upload errors with retry logic
    - Return uploaded image URL
    - _Requirements: 3.3, 3.4_

  - [x] 4.4 Integrate file upload with image insertion
    - Trigger file dialog on "Upload from Disk" selection
    - Validate selected file
    - Upload valid files
    - Insert uploaded image URL into editor
    - Display error messages for invalid files or upload failures
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

  - [ ]* 4.5 Write property test for file upload
    - **Property 9: Valid file upload success**
    - **Validates: Requirements 3.3**

- [x] 5. Create backend image upload endpoint
  - [x] 5.1 Create content image upload endpoint in content controller
    - Add POST /content/upload-image endpoint
    - Require ADMIN role authentication
    - Use FileInterceptor for multipart form data
    - _Requirements: 7.1_

  - [x] 5.2 Implement file validation and storage logic
    - Validate file type (JPEG, PNG, GIF, WebP)
    - Validate file size (max 5MB)
    - Generate unique filename with timestamp and random string
    - Create /uploads/content/ directory if not exists
    - Save file to directory
    - Return public URL and filename
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]* 5.3 Write property test for filename uniqueness
    - **Property 19: Filename uniqueness**
    - **Validates: Requirements 7.2**

  - [ ]* 5.4 Write unit tests for upload endpoint
    - Test successful upload returns URL
    - Test invalid file type rejection
    - Test file size limit enforcement
    - Test authentication requirement
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 6. Create frontend API client for image upload
  - [x] 6.1 Add uploadContentImage method to content-api.ts
    - Create FormData with file
    - POST to /content/upload-image endpoint
    - Handle response with URL
    - Handle errors
    - _Requirements: 3.3, 7.3_

  - [ ]* 6.2 Write unit tests for API client method
    - Test successful upload
    - Test error handling
    - _Requirements: 3.3_

- [x] 7. Integrate RichTextEditor into ContentForm
  - [x] 7.1 Update ContentFields component to use RichTextEditor
    - Replace textarea with RichTextEditor component
    - Pass appropriate props (value, onChange, readOnly, locale)
    - Maintain preview toggle functionality
    - Keep validation error display
    - _Requirements: 1.1, 5.1, 5.2, 5.3_

  - [x] 7.2 Implement bilingual content management
    - Maintain separate content state for English and Vietnamese
    - Switch editor content when language tab changes
    - Preserve content when switching tabs
    - _Requirements: 1.3, 4.1, 4.2, 4.3_

  - [ ]* 7.3 Write property test for language isolation
    - **Property 2: Language content isolation**
    - **Property 11: Image preservation during tab switches**
    - **Validates: Requirements 1.3, 4.1, 4.2, 4.3**

  - [x] 7.4 Update form submission to handle rich text content
    - Ensure HTML content is properly saved for both languages
    - Validate content is not empty
    - Clear editor state after successful submission
    - _Requirements: 1.4, 4.4, 5.5_

  - [ ]* 7.5 Write property test for content persistence
    - **Property 12: Bilingual content persistence**
    - **Property 13: Content loading round-trip**
    - **Validates: Requirements 4.4, 4.5**

  - [x] 7.6 Implement form cancellation handling
    - Discard editor changes on cancel
    - Reset editor to initial state
    - _Requirements: 5.4_

  - [ ]* 7.7 Write property test for cancel behavior
    - **Property 16: Cancel discards changes**
    - **Validates: Requirements 5.4**

- [x] 8. Add translations for rich text editor
  - Add translation keys for rich text editor UI elements
  - Add keys for image insertion options
  - Add keys for error messages (upload failed, invalid file type, file too large)
  - Add keys for loading states
  - _Requirements: 2.1, 3.5_

- [x] 9. Add styling and polish
  - [x] 9.1 Style RichTextEditor to match existing form fields
    - Match border, padding, focus states
    - Set minimum and maximum height
    - Style toolbar to match admin panel theme
    - Add responsive styles for mobile
    - _Requirements: 5.1, 5.2_

  - [x] 9.2 Style image dropdown menu
    - Position below image button
    - Add icons for visual clarity
    - Match admin panel styling
    - _Requirements: 2.1_

  - [x] 9.3 Add loading and error states UI
    - Show loading spinner during image upload
    - Display error messages with consistent styling
    - Add success feedback for image insertion
    - _Requirements: 3.5, 5.2_

- [ ] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Integration testing and bug fixes
  - [ ] 11.1 Test complete content creation flow
    - Create new content with rich formatting
    - Insert images from products
    - Upload images from disk
    - Switch between languages
    - Preview content
    - Submit form
    - _Requirements: All_

  - [ ] 11.2 Test content editing flow
    - Load existing content
    - Edit formatted content
    - Add/remove images
    - Switch languages
    - Save changes
    - _Requirements: 4.5, All_

  - [ ] 11.3 Test error scenarios
    - Invalid file upload
    - Network errors during upload
    - Form validation errors
    - Cancel without saving
    - _Requirements: 3.5, 5.4_

  - [ ] 11.4 Fix any bugs discovered during testing
    - Address edge cases
    - Improve error handling
    - Optimize performance
    - _Requirements: All_

- [x] 12. Add color formatting support
  - [x] 12.1 Add color format to Quill toolbar configuration
    - Update toolbar config in quillConfig.ts to include color picker
    - Add 'color' to allowed formats list
    - Configure custom color palette with brand colors
    - _Requirements: 8.1, 8.2_

  - [x] 12.2 Test color formatting functionality
    - Verify color picker appears in toolbar
    - Test applying colors to selected text
    - Verify color persists in HTML output
    - _Requirements: 8.3, 8.4, 8.5_

  - [ ]* 12.3 Write property test for color formatting
    - **Property 23: Color formatting application**
    - **Property 24: Color persistence round-trip**
    - **Validates: Requirements 8.3, 8.4, 8.5**

- [x] 13. Add image resizing support
  - [x] 13.1 Install and configure quill-image-resize-module-react
    - Add quill-image-resize-module-react package
    - Register ImageResize module with Quill
    - Configure resize options (Resize, DisplaySize, Toolbar modules)
    - _Requirements: 9.2, 9.3, 9.4_

  - [x] 13.2 Implement default image width on insertion
    - Update image insertion handler to set width="300" attribute
    - Apply default width for both product images and uploaded images
    - Ensure width is set immediately after insertion
    - _Requirements: 9.1_

  - [ ]* 13.3 Write property test for default image width
    - **Property 26: Default image width**
    - **Validates: Requirements 9.1**

  - [x] 13.4 Test image resizing functionality
    - Verify resize handles appear on inserted images
    - Test dragging handles updates dimensions in real-time
    - Verify aspect ratio is maintained
    - Test resized dimensions persist in HTML
    - _Requirements: 9.2, 9.3, 9.4, 9.5, 9.6_

  - [ ]* 13.5 Write property test for image resize persistence
    - **Property 27: Image resize persistence**
    - **Validates: Requirements 9.5, 9.6**

- [x] 14. Add styling for new features
  - [x] 14.1 Style color picker dropdown
    - Ensure color picker matches admin panel theme
    - Add hover states for color swatches
    - Make responsive for mobile
    - _Requirements: 8.1, 8.2_

  - [x] 14.2 Style image resize handles
    - Ensure resize handles are visible and accessible
    - Match admin panel styling
    - Add visual feedback during resize
    - _Requirements: 9.2_

- [ ] 15. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
