# Implementation Plan

- [x] 1. Set up component structure and types
  - Create the FloatingMessagingButton directory with modular structure
  - Define TypeScript interfaces in types.ts
  - Create index.tsx export file
  - _Requirements: 1.1, 3.2_

- [x] 2. Implement custom hooks for data fetching and state management
  - [x] 2.1 Create useFooterSettings hook
    - Fetch footer settings from API on mount
    - Handle loading and error states
    - Return social media URLs
    - _Requirements: 5.1, 5.5_

  - [x] 2.2 Create useMenuState hook
    - Manage menu open/close state
    - Provide toggle, open, and close functions
    - _Requirements: 2.1, 2.2_

  - [x] 2.3 Create useClickOutside hook
    - Detect clicks outside component
    - Call handler function when outside click detected
    - _Requirements: 2.3_

- [x] 3. Build TriggerButton sub-component
  - [x] 3.1 Implement button rendering and styling
    - Create fixed-position button with proper z-index
    - Apply responsive sizing for mobile (min 44x44px)
    - Add messaging icon from Svgs component
    - _Requirements: 1.1, 1.4, 1.5, 6.1_

  - [x] 3.2 Add click and keyboard interaction handlers
    - Handle button click to toggle menu
    - Handle Enter and Space key presses
    - _Requirements: 2.1, 7.3_

  - [x] 3.3 Implement icon transformation based on menu state
    - Show different icon or rotate when menu is open
    - _Requirements: 2.5_

  - [x] 3.4 Add accessibility attributes
    - Add aria-label for button
    - Add aria-expanded attribute that reflects menu state
    - Ensure button is keyboard focusable
    - Add visible focus indicators
    - _Requirements: 7.1, 7.2, 7.5_

  - [ ]* 3.5 Write property test for icon state reflection
    - **Property 3: Icon reflects menu state**
    - **Validates: Requirements 2.5**

- [x] 4. Build SocialMediaMenu sub-component
  - [x] 4.1 Implement menu container and positioning
    - Create popup container positioned above and to the left of the floating button (not at the same bottom-right position)
    - Calculate icon positions in curved arc using trigonometry, extending upward and leftward
    - Apply responsive adjustments for small viewports
    - _Requirements: 3.1, 3.2, 6.4_

  - [x] 4.2 Implement social media link filtering and rendering
    - Filter platforms based on configured URLs
    - Render only platforms with non-null URLs
    - Use correct SVG icon for each platform
    - _Requirements: 3.2, 3.3, 3.5_

  - [x] 4.3 Configure link attributes for security and accessibility
    - Add target="_blank" to all links
    - Add rel="noopener noreferrer" for security
    - Add aria-label for each platform
    - Ensure proper touch target spacing on mobile
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 6.2_

  - [x] 4.4 Add animations and transitions
    - Implement staggered entrance animation for icons
    - Add smooth transitions for menu appearance
    - Configure consistent animation timing
    - _Requirements: 8.1, 8.3, 8.5_

  - [ ]* 4.5 Write property test for URL filtering
    - **Property 4: Only configured platforms displayed**
    - **Validates: Requirements 3.3**

  - [ ]* 4.6 Write property test for correct icon usage
    - **Property 5: Correct icon for each platform**
    - **Validates: Requirements 3.5**

  - [ ]* 4.7 Write property test for link URLs
    - **Property 6: Links use configured URLs**
    - **Validates: Requirements 4.2**

  - [ ]* 4.8 Write property test for security attributes
    - **Property 7: Links have security attributes**
    - **Validates: Requirements 4.3**

  - [ ]* 4.9 Write property test for accessible labels
    - **Property 8: Links have accessible labels**
    - **Validates: Requirements 4.5, 7.4**

- [x] 5. Implement main FloatingMessagingButton component
  - [x] 5.1 Integrate hooks and sub-components
    - Use useFooterSettings to fetch data
    - Use useMenuState to manage menu visibility
    - Use useClickOutside to handle outside clicks
    - Render TriggerButton and SocialMediaMenu
    - _Requirements: 2.1, 2.2, 2.3, 5.1_

  - [x] 5.2 Implement conditional rendering logic
    - Don't render if all social media URLs are null/empty
    - Don't render if API request fails
    - Handle loading state appropriately
    - _Requirements: 5.3, 5.5_

  - [x] 5.3 Add keyboard event handling
    - Handle Escape key to close menu
    - Ensure proper keyboard navigation through links
    - _Requirements: 7.3_

  - [ ]* 5.4 Write property test for menu toggle behavior
    - **Property 1: Menu toggle on button click**
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 5.5 Write property test for outside click behavior
    - **Property 2: Menu closes on outside click**
    - **Validates: Requirements 2.3**

  - [ ]* 5.6 Write property test for component visibility
    - **Property 9: Component hidden when no URLs configured**
    - **Validates: Requirements 5.3**

  - [ ]* 5.7 Write property test for keyboard toggle
    - **Property 10: Keyboard toggle functionality**
    - **Validates: Requirements 7.3**

  - [ ]* 5.8 Write property test for ARIA attributes
    - **Property 11: ARIA attributes reflect state**
    - **Validates: Requirements 7.5**

- [x] 6. Add translations for accessibility labels
  - Add translation keys for messaging button
  - Add translation keys for each social media platform
  - Add translations for both English and Vietnamese
  - _Requirements: 4.5, 7.4_

- [x] 7. Integrate component into root layout
  - Import FloatingMessagingButton in layout.tsx
  - Add component to layout JSX
  - Verify component appears on all pages
  - Test that component doesn't interfere with existing UI
  - _Requirements: 1.1, 1.2, 6.3_

- [x] 8. Add responsive styling and mobile optimizations
  - Implement responsive positioning for mobile
  - Ensure touch-friendly sizing and spacing
  - Test on various viewport sizes
  - Verify menu fits within small viewports
  - _Requirements: 1.3, 6.1, 6.2, 6.4_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
