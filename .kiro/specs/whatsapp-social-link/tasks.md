# Implementation Plan

- [x] 1. Add WhatsApp URL field to database schema
  - [x] 1.1 Update Prisma schema to add whatsappUrl field
    - Add `whatsappUrl String?` field to FooterSettings model
    - Follow same pattern as facebookUrl, twitterUrl, tiktokUrl, zaloUrl
    - _Requirements: 1.3, 3.1_

  - [x] 1.2 Create and run database migration
    - Generate Prisma migration with `npx prisma migrate dev`
    - Verify migration adds nullable whatsappUrl column
    - _Requirements: 1.3_

- [x] 2. Update backend API to support WhatsApp URL
  - [x] 2.1 Update footer settings DTO
    - Add whatsappUrl field to UpdateFooterSettingsDto
    - Add @IsOptional() and @IsUrl() decorators for validation
    - _Requirements: 1.2, 1.5, 3.2_

  - [ ]* 2.2 Write property test for URL validation
    - **Property 1: URL validation consistency**
    - **Validates: Requirements 1.2, 1.5**

  - [ ]* 2.3 Write property test for data persistence
    - **Property 6: Data persistence round trip**
    - **Validates: Requirements 1.3**

  - [ ]* 2.4 Write property test for API field inclusion
    - **Property 7: API field inclusion**
    - **Validates: Requirements 3.2**

  - [ ]* 2.5 Write unit tests for WhatsApp URL validation
    - Test valid WhatsApp URLs are accepted
    - Test invalid URLs are rejected
    - Test null/empty values are accepted
    - _Requirements: 1.2, 1.4, 1.5_

- [x] 3. Add WhatsApp icon to frontend
  - [x] 3.1 Create SvgWhatsApp component
    - Add SvgWhatsApp export to frontend/components/Svgs.tsx
    - Use WhatsApp brand SVG path
    - Follow same pattern as SvgZalo, SvgFacebook, SvgTikTok
    - _Requirements: 2.1_

- [x] 4. Update frontend Footer component
  - [x] 4.1 Update FooterProps interface
    - Add whatsappUrl?: string to FooterProps type
    - _Requirements: 2.1, 3.3_

  - [x] 4.2 Add WhatsApp link rendering logic
    - Import SvgWhatsApp component
    - Add conditional rendering for whatsappUrl in socials section
    - Include target="_blank" and rel="noopener noreferrer" attributes
    - Add aria-hidden="true" to icon
    - Use translation key for link text
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.3_

  - [ ]* 4.3 Write property test for conditional rendering with URL
    - **Property 2: Conditional rendering with URL**
    - **Validates: Requirements 2.1, 3.3**

  - [ ]* 4.4 Write property test for null value handling
    - **Property 4: Null value handling**
    - **Validates: Requirements 2.3**

  - [ ]* 4.5 Write property test for link target attributes
    - **Property 3: Link target attribute**
    - **Validates: Requirements 2.2**

  - [ ]* 4.6 Write property test for accessibility attributes
    - **Property 5: Accessibility attributes**
    - **Validates: Requirements 2.4**

  - [ ]* 4.7 Write unit tests for Footer component
    - Test WhatsApp link renders when URL is provided
    - Test WhatsApp link is hidden when URL is null
    - Test link has correct attributes
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [-] 5. Update admin footer settings form
  - [x] 5.1 Update form interface and state
    - Add whatsappUrl to FooterSettingsFormData interface
    - Add whatsappUrl to form state initialization
    - _Requirements: 1.1_

  - [ ] 5.2 Add WhatsApp URL input field
    - Add input field in social media links section
    - Follow same pattern as zaloUrl input
    - Include label, placeholder, and error display
    - _Requirements: 1.1, 1.2, 1.5_

  - [ ]* 5.3 Write unit test for admin form field
    - Test WhatsApp URL input field is present in admin form
    - _Requirements: 1.1_

- [x] 6. Add translations
  - [x] 6.1 Add WhatsApp translations to translations.json
    - Add footer.whatsapp key with English and Vietnamese translations
    - Add admin.whatsappUrl key with English and Vietnamese translations
    - Add admin.whatsappPlaceholder key with English and Vietnamese translations
    - _Requirements: 2.1, 1.1_

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 8. Write property test for cache field inclusion
  - **Property 8: Cache field inclusion**
  - **Validates: Requirements 3.4**
