# Implementation Plan

- [x] 1. Create SearchFilterBar component with basic structure
  - Create new component file at `frontend/components/SearchFilterBar.tsx`
  - Implement component with search input and category dropdown UI
  - Add TypeScript interfaces for props and internal state
  - Implement basic styling with Tailwind CSS for desktop layout
  - Add locale support using next-intl for labels and placeholders
  - _Requirements: 1.1, 2.1, 2.2_

- [x] 2. Implement search input functionality
  - Add controlled input state for search query
  - Implement debounced search with 300ms delay
  - Add URL parameter synchronization for search query
  - Handle empty search state (remove parameter from URL)
  - Add proper URL encoding for special characters
  - _Requirements: 1.2, 4.1, 4.3_

- [ ]* 2.1 Write property test for search query URL synchronization
  - **Property 1: Search query updates URL parameter**
  - **Validates: Requirements 1.2, 4.1**

- [ ]* 2.2 Write property test for clearing search removes URL parameter
  - **Property 7: Clearing search removes URL parameter**
  - **Validates: Requirements 4.3**

- [x] 3. Implement category dropdown functionality
  - Fetch categories from API on component mount
  - Add controlled state for selected category
  - Implement category selection handler
  - Add URL parameter synchronization for categoryId
  - Display "All Categories" as default option
  - Show locale-appropriate category names (nameEn/nameVi)
  - _Requirements: 1.3, 2.2, 2.3, 2.5, 4.2_

- [ ]* 3.1 Write property test for category selection URL synchronization
  - **Property 2: Category selection updates URL parameter**
  - **Validates: Requirements 1.3, 4.2**

- [ ]* 3.2 Write property test for locale-aware category names
  - **Property 5: Category names display in current locale**
  - **Validates: Requirements 2.5**

- [x] 4. Implement combined filter functionality
  - Ensure search and category filters work simultaneously
  - Update URL with both parameters when both are active
  - Handle filter state changes correctly
  - Test various combinations of search and category filters
  - _Requirements: 1.4, 1.5_

- [ ]* 4.1 Write property test for combined filters
  - **Property 3: Combined filters apply simultaneously**
  - **Validates: Requirements 1.4**

- [ ]* 4.2 Write property test for filter synchronization
  - **Property 4: Filter changes synchronize to URL**
  - **Validates: Requirements 1.5**

- [x] 5. Implement clear filters functionality
  - Add clear/reset button to component
  - Show button only when filters are active
  - Implement clear handler to reset search and category
  - Remove all filter parameters from URL when cleared
  - Add visual indication for active filters
  - _Requirements: 2.4, 5.1, 5.2, 5.3, 5.4_

- [ ]* 5.1 Write property test for clear button visibility
  - **Property 9: Clear button visibility reflects filter state**
  - **Validates: Requirements 5.1**

- [ ]* 5.2 Write property test for clearing all filters
  - **Property 10: Clearing filters removes all URL parameters**
  - **Validates: Requirements 5.4**

- [ ]* 5.3 Write property test for active category visual indication
  - **Property 6: Active category shows visual indication**
  - **Validates: Requirements 2.4**

- [x] 6. Implement URL parameter hydration
  - Read URL parameters on component mount
  - Initialize search input from "search" parameter
  - Initialize category dropdown from "categoryId" parameter
  - Handle invalid or missing parameters gracefully
  - Ensure state updates when URL changes (browser back/forward)
  - _Requirements: 4.5_

- [ ]* 6.1 Write property test for URL to UI state hydration
  - **Property 8: URL parameters hydrate UI state**
  - **Validates: Requirements 4.5**

- [x] 7. Update ProductsPage to use SearchFilterBar
  - Remove FilterPanel import and component usage
  - Replace SearchBar with SearchFilterBar
  - Update page layout from grid with sidebar to full-width
  - Remove aside element for filter sidebar
  - Adjust spacing and styling for new layout
  - _Requirements: 3.1, 3.2_

- [ ]* 7.1 Write unit tests for ProductsPage layout changes
  - Test that FilterPanel is not rendered
  - Test that SearchFilterBar is rendered
  - Test that layout uses full-width structure
  - _Requirements: 3.1, 3.2_

- [x] 8. Implement mobile responsive design
  - Add responsive Tailwind classes for mobile layout
  - Stack search input and category dropdown on small screens
  - Ensure touch targets meet 44x44px minimum size
  - Test dropdown behavior on mobile devices
  - Optimize spacing and padding for mobile
  - _Requirements: 3.4, 6.4, 6.5_

- [ ]* 8.1 Write unit tests for mobile responsive behavior
  - Test mobile layout classes are applied
  - Test touch target sizes meet minimum requirements
  - _Requirements: 3.4, 6.4, 6.5_

- [x] 9. Implement accessibility features
  - Add proper ARIA labels for search input and dropdown
  - Implement keyboard navigation (Tab, Enter, Escape)
  - Add screen reader announcements for filter changes
  - Ensure focus management works correctly
  - Test with keyboard-only navigation
  - Verify color contrast meets WCAG AA standards
  - _Requirements: 6.1, 6.2, 6.3_

- [ ]* 9.1 Write unit tests for accessibility features
  - Test ARIA labels are present
  - Test keyboard navigation works
  - Test focus management
  - _Requirements: 6.2, 6.3_

- [x] 10. Add error handling and edge cases
  - Handle category fetch failures gracefully
  - Show error message if categories cannot be loaded
  - Disable category dropdown if fetch fails
  - Handle invalid categoryId in URL parameters
  - Handle empty categories list
  - Add loading state for categories
  - _Requirements: 2.2, 4.2_

- [ ]* 10.1 Write unit tests for error handling
  - Test category fetch failure handling
  - Test invalid URL parameter handling
  - Test empty categories list handling
  - Test loading state display

- [x] 11. Remove FilterPanel component and cleanup
  - Delete FilterPanel.tsx component file
  - Remove FilterPanel imports from any other files
  - Update any tests that reference FilterPanel
  - Remove unused filter-related translation keys if any
  - Verify no broken imports or references remain
  - _Requirements: 3.1, 3.3_

- [x] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
