# Implementation Plan

- [x] 1. Add translations for error and fallback messages
  - Add new translation keys to `frontend/locales/translations.json`
  - Include English and Vietnamese translations for API error messages
  - Include translations for fallback messages when data is unavailable
  - _Requirements: 2.4_

- [x] 2. Update ContactContent component to accept footer settings
  - [x] 2.1 Modify ContactContent component interface
    - Add `footerSettings` prop with type `FooterSettings | null`
    - Update component to use prop data instead of hardcoded values
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.2_

  - [x] 2.2 Implement conditional rendering for contact information
    - Show email section only when `contactEmail` is not null
    - Show phone section only when `contactPhone` is not null
    - Show address section only when `address` is not null
    - Display fallback message when `footerSettings` is null
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 2.3 Add Google Maps link functionality
    - Render clickable link when `googleMapsUrl` is provided
    - Link should open in new tab with proper attributes
    - _Requirements: 1.5_

  - [ ]* 2.4 Write property test for contact information display
    - **Property 1: Contact information display consistency**
    - **Validates: Requirements 1.2, 1.3, 1.4**

  - [ ]* 2.5 Write property test for missing data handling
    - **Property 2: Graceful handling of missing data**
    - **Validates: Requirements 2.1, 2.2, 2.3**

  - [ ]* 2.6 Write property test for Google Maps link
    - **Property 3: Google Maps link functionality**
    - **Validates: Requirements 1.5**

  - [ ]* 2.7 Write unit tests for ContactContent component
    - Test rendering with complete footer settings
    - Test rendering with partial footer settings
    - Test rendering with null footer settings
    - Test contact form functionality remains unchanged
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4_

- [x] 3. Update contact page to fetch footer settings
  - [x] 3.1 Implement server-side footer settings fetch
    - Add async function to fetch footer settings in page component
    - Follow existing pattern from `layout.tsx`
    - Handle API errors gracefully by returning null
    - _Requirements: 1.1, 3.1, 3.2_

  - [x] 3.2 Pass footer settings to ContactContent component
    - Update page component to pass fetched data as props
    - Ensure proper TypeScript typing
    - _Requirements: 1.1, 3.2_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
