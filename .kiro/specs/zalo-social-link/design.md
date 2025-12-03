# Design Document

## Overview

This feature adds Zalo social media link support to the existing footer settings infrastructure. The implementation follows the established pattern for social media links (Facebook, Twitter, TikTok) and requires changes across the database schema, backend API, and frontend components.

## Architecture

The solution leverages the existing footer settings infrastructure with minimal changes:

- **Database Layer**: Add `zaloUrl` column to `footer_settings` table via Prisma migration
- **Backend API**: Update DTOs and validation to include Zalo URL field
- **Frontend Components**: Add Zalo icon SVG and render logic in Footer component
- **Admin Interface**: Update footer settings form to include Zalo URL input field
- **Caching**: Existing Redis cache (1-hour TTL) automatically includes new field

## Components and Interfaces

### Database Schema

**Changes to `FooterSettings` model in `backend/prisma/schema.prisma`**:

```prisma
model FooterSettings {
  id              String   @id @default(uuid())
  copyrightText   String
  contactEmail    String?
  contactPhone    String?
  address         String?
  googleMapsUrl   String?
  facebookUrl     String?
  twitterUrl      String?
  tiktokUrl       String?
  zaloUrl         String?  // NEW FIELD
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("footer_settings")
}
```

### Backend DTOs

**Update `UpdateFooterSettingsDto` in `backend/src/footer-settings/dto/update-footer-settings.dto.ts`**:

```typescript
export class UpdateFooterSettingsDto {
  @IsOptional()
  @IsString()
  copyrightText?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsUrl()
  googleMapsUrl?: string;

  @IsOptional()
  @IsUrl()
  facebookUrl?: string;

  @IsOptional()
  @IsUrl()
  twitterUrl?: string;

  @IsOptional()
  @IsUrl()
  tiktokUrl?: string;

  @IsOptional()
  @IsUrl()
  zaloUrl?: string;  // NEW FIELD
}
```

### Frontend Types

**Update `FooterSettings` interface in `frontend/lib/footer-settings-api.ts`**:

```typescript
export interface FooterSettings {
  id: string;
  copyrightText: string;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  googleMapsUrl: string | null;
  facebookUrl: string | null;
  twitterUrl: string | null;
  tiktokUrl: string | null;
  zaloUrl: string | null;  // NEW FIELD
  createdAt: Date;
  updatedAt: Date;
}
```

**Update `FooterProps` interface in `frontend/components/Footer.tsx`**:

```typescript
export interface FooterProps {
  copyrightText: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  googleMapsUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  tiktokUrl?: string;
  zaloUrl?: string;  // NEW FIELD
}
```

### SVG Icon Component

**Add `SvgZalo` component to `frontend/components/Svgs.tsx`**:

```typescript
export const SvgZalo = (props: SvgProps) => (
  <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652L4.008 24l4.581-2.411c1.046.282 2.157.433 3.411.433 6.627 0 12-4.974 12-11.111C24 4.975 18.627 0 12 0zm.001 20.556c-1.102 0-2.157-.188-3.137-.534l-.224-.08-2.315 1.218.624-2.857-.087-.112C4.472 16.616 2.667 14.03 2.667 11.111c0-4.663 4.03-8.444 9.334-8.444s9.333 3.781 9.333 8.444c0 4.664-4.03 8.445-9.333 8.445zm5.43-6.827c-.298-.149-1.765-.87-2.038-.97-.273-.099-.472-.149-.671.15-.199.298-.77.97-.944 1.168-.174.199-.348.224-.646.075-.298-.15-1.258-.464-2.395-1.478-.885-.79-1.483-1.766-1.657-2.064-.174-.298-.019-.459.131-.607.134-.134.298-.348.447-.522.149-.174.199-.298.298-.497.1-.199.05-.373-.025-.522-.075-.15-.671-1.617-.92-2.214-.242-.581-.487-.502-.671-.512-.174-.009-.373-.011-.572-.011s-.522.075-.795.373c-.273.298-1.043 1.019-1.043 2.486s1.068 2.884 1.217 3.083c.149.199 2.1 3.208 5.088 4.499.711.307 1.266.491 1.698.628.713.227 1.362.195 1.875.118.572-.085 1.765-.722 2.013-1.419.248-.696.248-1.293.174-1.419-.075-.125-.273-.199-.572-.348z" />
  </svg>
)
```

### Footer Component Rendering

**Update `Footer.tsx` to render Zalo link**:

Add Zalo to the socials section alongside Facebook and TikTok:

```typescript
{zaloUrl && (
  <li>
    <a
      href={zaloUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-gray-300 hover:text-white transition-colors inline-flex items-center gap-2"
    >
      <SvgZalo className="w-5 h-5" aria-hidden="true" />
      {t('zalo')}
    </a>
  </li>
)}
```

## Data Models

All data models follow existing patterns. The `zaloUrl` field is:
- Optional (nullable) in the database
- Validated as a URL when provided
- Cached with other footer settings data
- Passed through the same API endpoints

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: URL validation consistency
*For any* social media URL field (including zaloUrl), if a value is provided, then the system should validate it as a properly formatted URL and reject invalid formats.

**Validates: Requirements 1.2, 1.5, 3.3**

### Property 2: Conditional rendering
*For any* footer settings with a non-null zaloUrl value, the footer component should render a clickable Zalo link element.

**Validates: Requirements 2.1, 3.2**

### Property 3: Link target attribute
*For any* rendered Zalo link, the anchor element should have `target="_blank"` and `rel="noopener noreferrer"` attributes.

**Validates: Requirements 2.2**

### Property 4: Null value handling
*For any* footer settings with a null zaloUrl value, the footer component should not render any Zalo link element.

**Validates: Requirements 1.4, 2.3**

### Property 5: Accessibility attributes
*For any* rendered Zalo link, the link element should include proper ARIA attributes for screen reader accessibility.

**Validates: Requirements 2.4**

## Error Handling

### Validation Errors

- **Invalid URL Format**: Backend returns 400 Bad Request with validation error message
- **Database Constraint Violations**: Handled by Prisma with appropriate error responses

### Frontend Error Handling

- **Missing Zalo URL**: Component gracefully hides the link (no error)
- **API Fetch Failures**: Existing error handling in footer settings API applies

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:
- Valid Zalo URL formats are accepted
- Invalid URL formats are rejected
- Empty/null values are handled correctly
- Footer component renders Zalo link when URL is provided
- Footer component hides Zalo link when URL is null

### Property-Based Tests

Property-based tests will verify universal behaviors across random inputs:
- **Property 1**: Generate random valid/invalid URLs, verify validation behaves correctly
- **Property 2**: Generate random footer settings with zaloUrl, verify link renders when non-null
- **Property 3**: Generate random Zalo links, verify all have correct target attributes
- **Property 4**: Generate random footer settings with null zaloUrl, verify no link in DOM
- **Property 5**: Generate random Zalo links, verify all have accessibility attributes

**Testing Framework**: Jest with React Testing Library for frontend tests, Jest for backend tests

**Test Configuration**: Each property-based test should run a minimum of 100 iterations to ensure comprehensive coverage across random inputs.

**Test Tagging**: Each property-based test must include a comment with the format: `**Feature: zalo-social-link, Property {number}: {property_text}**`

## Implementation Notes

### Migration Strategy

1. Create Prisma migration to add `zaloUrl` column
2. Run migration on development database
3. Update backend DTOs and validation
4. Update frontend types and components
5. Add translations for "Zalo" label
6. Test end-to-end functionality

### Existing Patterns to Follow

The implementation should mirror the existing social media link patterns:

- **Database**: Optional string field, same as `facebookUrl`, `twitterUrl`, `tiktokUrl`
- **Validation**: Use `@IsUrl()` decorator, same as other social URLs
- **Frontend Rendering**: Conditional rendering with same structure as Facebook/TikTok
- **Styling**: Use same CSS classes and icon sizing as other social links
- **Translations**: Add to `footer` section in `translations.json`

### Performance Considerations

- No performance impact: Zalo URL is included in existing cached footer settings
- No additional API calls required
- SVG icon is inline, no external resource loading

### Accessibility Considerations

- Zalo link must have descriptive text for screen readers
- Icon should have `aria-hidden="true"` attribute
- Link should have proper `aria-label` if needed
- Follows WCAG 2.1 Level AA guidelines
