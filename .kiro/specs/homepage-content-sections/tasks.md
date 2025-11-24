# Implementation Plan

- [x] 1. Extend database schema and backend models
  - [x] 1.1 Add HOMEPAGE_SECTION to ContentType enum in Prisma schema
    - Update `backend/prisma/schema.prisma` to include new enum value
    - _Requirements: 2.1, 2.2_

  - [x] 1.2 Create FooterSettings model in Prisma schema
    - Add FooterSettings model with all required fields (copyrightText, contactEmail, contactPhone, social URLs)
    - Add appropriate indexes
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 1.3 Generate and run database migration
    - Run `npx prisma migrate dev` to create migration
    - Verify migration applies successfully
    - _Requirements: 2.1, 4.1_

  - [ ]* 1.4 Write property test for section ordering
    - **Property 1: Section ordering consistency**
    - **Validates: Requirements 1.1, 3.1**

- [-] 2. Create footer settings backend service
  - [x] 2.1 Create FooterSettings service and controller
    - Implement `footer-settings.service.ts` with get and update methods
    - Implement `footer-settings.controller.ts` with GET and PATCH endpoints
    - Add admin authorization guards
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 2.2 Add URL validation for social media links
    - Implement validation in DTO using class-validator
    - Ensure invalid URLs are rejected
    - _Requirements: 4.2_

  - [ ]* 2.3 Write property test for URL validation
    - **Property 11: URL validation**
    - **Validates: Requirements 4.2**

  - [x] 2.3 Create footer settings module
    - Wire up service, controller, and Prisma module
    - _Requirements: 4.1_

- [x] 3. Extend content service for homepage sections
  - [x] 3.1 Add homepage sections endpoint to content controller
    - Create GET `/content/homepage-sections` endpoint
    - Filter by type=HOMEPAGE_SECTION and isPublished=true
    - Order by displayOrder ascending
    - _Requirements: 1.1, 2.1, 3.1_

  - [x] 3.2 Add validation for homepage section creation
    - Validate required fields: title, description, buttonText, buttonUrl, layout
    - Implement conditional image validation based on layout type
    - _Requirements: 2.2, 2.3, 2.4_

  - [ ]* 3.3 Write property test for required field validation
    - **Property 4: Required field validation**
    - **Validates: Requirements 2.2, 2.4**

  - [ ]* 3.4 Write property test for conditional image validation
    - **Property 5: Conditional image validation**
    - **Validates: Requirements 2.3**

  - [ ]* 3.5 Write property test for publication visibility
    - **Property 9: Publication visibility**
    - **Validates: Requirements 3.4**

- [x] 4. Create reusable ContentSection component
  - [x] 4.1 Implement ContentSection component with layout variants
    - Create `frontend/components/ContentSection.tsx`
    - Implement 'centered', 'image-left', and 'image-right' layouts
    - Use responsive Tailwind classes
    - _Requirements: 1.2, 1.3, 1.4, 6.1, 6.2_

  - [x] 4.2 Add button with proper link handling
    - Render button with href from buttonUrl
    - Ensure proper navigation
    - _Requirements: 1.5_

  - [ ]* 4.3 Write property test for button URL correctness
    - **Property 2: Button URL correctness**
    - **Validates: Requirements 1.5**

  - [ ]* 4.4 Write property test for layout-based rendering
    - **Property 15: Layout-based rendering**
    - **Validates: Requirements 6.2**

- [x] 5. Create Footer component
  - [x] 5.1 Implement Footer component
    - Create `frontend/components/Footer.tsx`
    - Render copyright, contact info, and social links
    - Handle empty/null fields by not rendering those elements
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 5.2 Add social media icons with proper attributes
    - Render Facebook, Twitter, TikTok icons when URLs provided
    - Add target="_blank" and rel="noopener noreferrer" to links
    - _Requirements: 5.3, 5.4_

  - [ ]* 5.3 Write property test for empty field handling
    - **Property 12: Empty field handling**
    - **Validates: Requirements 4.4**

  - [ ]* 5.4 Write property test for social link rendering
    - **Property 13: Social link rendering**
    - **Validates: Requirements 5.3**

  - [ ]* 5.5 Write property test for social link target attribute
    - **Property 14: Social link target attribute**
    - **Validates: Requirements 5.4**

- [x] 6. Create footer settings API client
  - [x] 6.1 Implement footer settings API methods
    - Create `frontend/lib/footer-settings-api.ts`
    - Implement getFooterSettings and updateFooterSettings methods
    - _Requirements: 4.1, 4.3_

  - [ ]* 6.2 Write property test for footer settings retrieval
    - **Property 10: Footer settings retrieval**
    - **Validates: Requirements 4.1**

- [x] 7. Update homepage to display content sections
  - [x] 7.1 Fetch and render homepage sections in HomeContent component
    - Update `frontend/app/[locale]/HomeContent.tsx`
    - Fetch published homepage sections from API
    - Map sections to ContentSection components
    - Render sections below carousel in order
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 7.2 Add loading and error states
    - Show skeleton loaders while fetching
    - Handle API errors gracefully
    - _Requirements: 1.1_

- [x] 8. Integrate Footer into layout
  - [x] 8.1 Add Footer to main layout
    - Update `frontend/app/[locale]/layout.tsx`
    - Fetch footer settings and pass to Footer component
    - Ensure footer appears on all pages
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 9. Create admin interface for homepage sections
  - [x] 9.1 Create homepage sections list page
    - Create `frontend/app/[locale]/admin/homepage-sections/page.tsx`
    - Display all homepage sections with current order
    - Add create, edit, delete, and reorder actions
    - _Requirements: 2.1, 3.1, 3.3_

  - [x] 9.2 Create homepage section form component
    - Create `frontend/components/HomepageSectionForm.tsx`
    - Include fields for title, description, buttonText, buttonUrl, layout, image
    - Add layout selector with conditional image upload
    - Implement bilingual support (English/Vietnamese)
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

  - [x] 9.3 Add preview panel to form
    - Render live preview of section as admin edits
    - Update preview when layout, content, or image changes
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 9.4 Write property test for preview reactivity
    - **Property 16: Preview reactivity**
    - **Validates: Requirements 8.2, 8.3**

  - [x] 9.5 Create new homepage section page
    - Create `frontend/app/[locale]/admin/homepage-sections/new/page.tsx`
    - Use HomepageSectionForm for creation
    - _Requirements: 2.2, 2.3, 2.4_

  - [x] 9.6 Create edit homepage section page
    - Create `frontend/app/[locale]/admin/homepage-sections/[id]/edit/page.tsx`
    - Load existing section data into form
    - _Requirements: 2.5_

  - [ ]* 9.7 Write property test for update persistence
    - **Property 6: Update persistence**
    - **Validates: Requirements 2.5, 4.3, 8.4**

- [x] 10. Create admin interface for footer settings
  - [x] 10.1 Create footer settings page
    - Create `frontend/app/[locale]/admin/footer-settings/page.tsx`
    - Display form for editing footer content
    - Include fields for copyright, contact, and social links
    - Add URL validation for social media links
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 10.2 Add footer preview to settings page
    - Show live preview of footer as admin edits
    - _Requirements: 4.3_

- [x] 11. Add drag-and-drop reordering for sections
  - [x] 11.1 Implement drag-and-drop functionality
    - Add drag-and-drop library (react-beautiful-dnd or similar)
    - Allow admins to reorder sections by dragging
    - Update displayOrder values on drop
    - _Requirements: 3.1, 3.2_

  - [ ]* 11.2 Write property test for order update consistency
    - **Property 7: Order update consistency**
    - **Validates: Requirements 3.2**

- [x] 12. Add responsive styling
  - [x] 12.1 Implement mobile-responsive layouts
    - Add Tailwind responsive classes to ContentSection
    - Stack images and text vertically on mobile
    - Maintain side-by-side on tablet/desktop
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 12.2 Optimize images for responsive display
    - Use Next.js Image component
    - Add appropriate sizes and srcset
    - _Requirements: 7.3_

- [x] 13. Seed initial data
  - [x] 13.1 Create seed script for footer settings
    - Update `backend/prisma/seed.ts`
    - Create initial FooterSettings record with default values
    - _Requirements: 4.1_

  - [x] 13.2 Create sample homepage sections
    - Add 5 sample homepage sections to seed script
    - Include examples of all layout types
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 14. Add translations
  - [x] 14.1 Add translation keys for homepage sections
    - Update `frontend/locales/translations.json`
    - Add keys for section labels, buttons, and admin UI
    - _Requirements: 2.1, 2.2_

  - [x] 14.2 Add translation keys for footer
    - Add keys for footer labels and admin UI
    - _Requirements: 5.1, 5.2_

- [x] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Write integration tests
  - [x] 16.1 Write E2E test for homepage section creation flow
    - Test admin creates section → section appears on homepage
    - _Requirements: 2.2, 2.4, 8.4_

  - [x] 16.2 Write E2E test for section reordering
    - Test admin reorders sections → homepage reflects new order
    - _Requirements: 3.2_

  - [x] 16.3 Write E2E test for section publication toggle
    - Test admin unpublishes section → section disappears from homepage
    - _Requirements: 3.4_

  - [x] 16.4 Write E2E test for footer updates
    - Test admin updates footer → footer updates across pages
    - _Requirements: 4.3_

- [x] 17. Performance optimization
  - [x] 17.1 Add caching for homepage sections
    - Implement Redis caching with 5-minute TTL
    - Invalidate cache on admin updates
    - _Requirements: 1.1_

  - [x] 17.2 Add caching for footer settings
    - Implement Redis caching with 1-hour TTL
    - Invalidate cache on admin updates
    - _Requirements: 5.1_

  - [x] 17.3 Add database indexes
    - Create composite index on (type, isPublished, displayOrder)
    - Verify query performance improvements
    - _Requirements: 1.1, 3.1_

- [x] 18. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
