# Implementation Plan

- [x] 1. Add translations for content type sub-items
  - Add translation keys for all content types (Pages, FAQs, Banners, Homepage Sections) in both English and Vietnamese
  - Add keys under the `admin` section in `frontend/locales/translations.json`
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 2. Update AdminLayout component to support expandable navigation
  - [x] 2.1 Add state management for expanded menus
    - Create state to track which menus are expanded
    - Implement toggle function for expanding/collapsing menus
    - _Requirements: 1.2_

  - [x] 2.2 Add session storage persistence
    - Implement functions to save/load navigation state from session storage
    - Handle session storage errors gracefully
    - Add state restoration on component mount
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 2.3 Update navigation data structure
    - Modify navigation array to support sub-items
    - Add Content menu sub-items for each content type (PAGE, FAQ, BANNER, HOMEPAGE_SECTION)
    - Use query parameters for sub-item hrefs (e.g., `/admin/content?type=PAGE`)
    - _Requirements: 1.3, 1.4_

  - [x] 2.4 Implement expandable menu rendering
    - Add chevron icon to Content menu item
    - Implement click handler to toggle expansion (prevent navigation for parent item)
    - Render sub-items when menu is expanded
    - Apply proper indentation and styling to sub-items
    - Add smooth CSS transitions for chevron rotation
    - _Requirements: 1.1, 1.2, 4.1_

  - [x] 2.5 Implement active state detection
    - Detect when current route matches a sub-item
    - Auto-expand Content menu when route matches any sub-item
    - Apply active styling to matching sub-item
    - _Requirements: 1.5, 2.4_

  - [x] 2.6 Add accessibility features
    - Add `aria-expanded` attribute to expandable menu items
    - Add `aria-current="page"` to active navigation items
    - Ensure keyboard navigation works for all items and sub-items
    - Add proper ARIA labels for screen readers
    - _Requirements: 4.4, 4.5_

- [x] 3. Update ContentListContent component to handle type filtering from URL
  - [x] 3.1 Read type parameter from URL query string
    - Use Next.js router to read query parameters
    - Set initial filterType state from URL parameter
    - _Requirements: 1.4_

  - [x] 3.2 Update page title based on content type filter
    - Display specific content type name in page heading when filtered
    - Show "All Content" when no filter is applied
    - _Requirements: 1.5_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

