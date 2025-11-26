# Implementation Plan: Admin Content Edit Page

- [x] 1. Create the edit page structure
  - Create the directory structure at `frontend/app/[locale]/admin/content/[id]/`
  - Create `page.tsx` as a server component with Suspense boundary
  - Create `EditContentContent.tsx` as the client component
  - _Requirements: 1.1, 1.3_

- [x] 2. Implement data fetching and state management
  - Extract content ID from URL params in EditContentContent
  - Implement useEffect hook to fetch content data using `getContentById`
  - Add state management for content, loading, and error states
  - Handle loading state with appropriate UI indicator
  - Handle error state for non-existent content (404)
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ]* 2.1 Write property test for content loading
  - **Property 1: Content loading and population**
  - **Validates: Requirements 1.1, 1.4**

- [ ]* 2.2 Write unit test for error handling
  - Test non-existent content ID displays error message
  - _Requirements: 1.2_

- [x] 3. Integrate ContentForm component
  - Pass loaded content data to ContentForm component
  - Implement handleSubmit function using `updateContent` API
  - Implement handleCancel function for navigation
  - Add router navigation on successful save
  - _Requirements: 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.1, 3.2, 3.4_

- [x] 3.1 Write property test for all editable fields
  - **Property 2: All editable fields are present**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.6, 2.7**

- [ ]* 3.2 Write property test for conditional banner fields
  - **Property 3: Conditional banner fields**
  - **Validates: Requirements 2.5**

- [ ]* 3.3 Write property test for successful save
  - **Property 4: Successful save persistence**
  - **Validates: Requirements 3.1, 3.2**

- [ ]* 3.4 Write unit test for cancel navigation
  - Test cancel button navigates without saving
  - _Requirements: 3.4_

- [x] 4. Implement error handling for form submission
  - Add error state handling in handleSubmit
  - Ensure form data is retained on submission errors
  - Display error messages appropriately
  - _Requirements: 3.3_

- [ ]* 4.1 Write property test for error handling with data retention
  - **Property 5: Error handling with data retention**
  - **Validates: Requirements 3.3**

- [x] 5. Verify form validation
  - Confirm ContentForm validates required fields
  - Confirm ContentForm validates URL fields
  - Confirm ContentForm validates slug format
  - _Requirements: 4.1, 4.2, 4.3_

- [ ]* 5.1 Write property test for required field validation
  - **Property 6: Required field validation**
  - **Validates: Requirements 4.1**

- [ ]* 5.2 Write property test for URL validation
  - **Property 7: URL field validation**
  - **Validates: Requirements 4.2**

- [ ]* 5.3 Write property test for slug validation
  - **Property 8: Slug validation**
  - **Validates: Requirements 4.3**

- [x] 6. Add page styling and layout
  - Add consistent admin panel styling
  - Ensure responsive design
  - Add proper spacing and visual hierarchy
  - _Requirements: 1.1_

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 8. Write integration test for complete edit flow
  - Test full flow: load content, edit fields, save, verify redirect
  - Test error recovery flow with invalid ID
  - _Requirements: All_
