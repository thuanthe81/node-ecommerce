# Implementation Plan

- [x] 1. Add Zalo URL field to database schema
  - [x] 1.1 Update Prisma schema to add zaloUrl field
    - Add `zaloUrl String?` field to FooterSettings model
    - Follow same pattern as facebookUrl, twitterUrl, tiktokUrl
    - _Requirements: 1.3, 3.1_

  - [x] 1.2 Create and run database migration
    - Generate Prisma migration with `npx prisma migrate dev`
    - Verify migration adds nullable zaloUrl column
    - _Requirements: 1.3_

- [x] 2. Update backend API to support Zalo URL
  - [x] 2.1 Update footer settings DTO
    - Add zaloUrl field to UpdateFooterSettingsDto
    - Add @IsOptional() and @IsUrl() decorators for validation
    - _Requirements: 1.2, 1.5, 3.3_

  - [ ]* 2.2 Write unit tests for Zalo URL validation
    - Test valid Zalo URLs are accepted
    - Test invalid URLs are rejected
    - Test null/empty values are accepted
    - _Requirements: 1.2, 1.5_

- [x] 3. Add Zalo icon to frontend
  - [x] 3.1 Create SvgZalo component
    - Add SvgZalo export to frontend/components/Svgs.tsx
    - Use Zalo brand SVG path
    - Follow same pattern as SvgFacebook, SvgTwitter, SvgTikTok
    - _Requirements: 2.1, 3.2_

- [x] 4. Update frontend types and API
  - [x] 4.1 Update FooterSettings interface
    - Add zaloUrl field to interface in frontend/lib/footer-settings-api.ts
    - Type as `string | null`
    - _Requirements: 3.1_

  - [x] 4.2 Update FooterProps interface
    - Add zaloUrl field to FooterProps in frontend/components/Footer.tsx
    - Type as optional string
    - _Requirements: 3.1_

- [x] 5. Add translations for Zalo
  - [x] 5.1 Add Zalo translation keys
    - Add "zalo" key to footer section in frontend/locales/translations.json
    - Provide both English ("Zalo") and Vietnamese ("Zalo") translations
    - _Requirements: 2.1_

- [x] 6. Update Footer component to render Zalo link
  - [x] 6.1 Import SvgZalo component
    - Add SvgZalo to imports from @/components/Svgs
    - _Requirements: 2.1, 3.2_

  - [x] 6.2 Add zaloUrl prop to Footer component
    - Destructure zaloUrl from props
    - _Requirements: 2.1, 3.2_

  - [x] 6.3 Render Zalo link in socials section
    - Add conditional rendering for zaloUrl
    - Use same structure as Facebook and TikTok links
    - Include target="_blank" and rel="noopener noreferrer"
    - Add proper accessibility attributes
    - Use translation key for link text
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.2_

  - [ ]* 6.4 Write unit tests for Footer component Zalo rendering
    - Test Zalo link renders when zaloUrl is provided
    - Test Zalo link is hidden when zaloUrl is null
    - Test link has correct target and rel attributes
    - Test link has proper accessibility attributes
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 7. Update admin footer settings form
  - [x] 7.1 Add Zalo URL input field
    - Locate admin footer settings form component
    - Add input field for Zalo URL
    - Follow same pattern as other social media URL fields
    - Include URL validation
    - _Requirements: 1.1, 1.2, 3.1_

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
