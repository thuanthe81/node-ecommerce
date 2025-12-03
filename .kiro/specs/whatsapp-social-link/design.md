# Design Document

## Overview

This feature adds WhatsApp social media link support to the existing footer settings infrastructure. The implementation follows the established pattern for social media links (Facebook, Twitter, TikTok, Zalo) and requires changes across the database schema, backend API, and frontend components.

## Architecture

The solution leverages the existing footer settings infrastructure with minimal changes:

- **Database Layer**: Add `whatsappUrl` column to `footer_settings` table via Prisma migration
- **Backend API**: Update DTOs and validation to include WhatsApp URL field
- **Frontend Components**: Add WhatsApp icon SVG and render logic in Footer component
- **Admin Interface**: Update footer settings form to include WhatsApp URL input field
- **Caching**: Existing Redis cache (1-hour TTL) automatically includes new field

## Components and Interfaces

### Database Schema

**Update `FooterSettings` model in Prisma schema**:

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
  zaloUrl         String?
  whatsappUrl     String?  // NEW FIELD
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("footer_settings")
}
```

### Backend DTOs

**Update `UpdateFooterSettingsDto`**:

```typescript
export class UpdateFooterSettingsDto {
  @IsString()
  @IsNotEmpty()
  copyrightText: string;

  @IsString()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsUrl({}, { message: 'Google Maps URL must be a valid URL' })
  @IsOptional()
  googleMapsUrl?: string;

  @IsUrl({}, { message: 'Facebook URL must be a valid URL' })
  @IsOptional()
  facebookUrl?: string;

  @IsUrl({}, { message: 'Twitter URL must be a valid URL' })
  @IsOptional()
  twitterUrl?: string;

  @IsUrl({}, { message: 'TikTok URL must be a valid URL' })
  @IsOptional()
  tiktokUrl?: string;

  @IsUrl({}, { message: 'Zalo URL must be a valid URL' })
  @IsOptional()
  zaloUrl?: string;

  @IsUrl({}, { message: 'WhatsApp URL must be a valid URL' })
  @IsOptional()
  whatsappUrl?: string;  // NEW FIELD
}
```

### Frontend Types

**Update `FooterProps` interface**:

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
  zaloUrl?: string;
  whatsappUrl?: string;  // NEW FIELD
}
```

**Update admin form types**:

```typescript
interface FooterSettingsFormData {
  copyrightText: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  googleMapsUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  tiktokUrl?: string;
  zaloUrl?: string;
  whatsappUrl?: string;  // NEW FIELD
}
```

## Data Models

All data models follow existing patterns. The `whatsappUrl` field is:
- Optional (nullable) in the database
- Validated as a URL when provided
- Included in all API responses
- Cached with other footer settings


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: URL validation consistency

*For any* social media URL field (including whatsappUrl), if a value is provided, then the system should validate it as a properly formatted URL and reject invalid formats.

**Validates: Requirements 1.2, 1.5**

### Property 2: Conditional rendering with URL

*For any* footer settings with a non-null whatsappUrl value, the footer component should render a clickable WhatsApp link element.

**Validates: Requirements 2.1, 3.3**

### Property 3: Link target attribute

*For any* rendered WhatsApp link, the anchor element should have `target="_blank"` and `rel="noopener noreferrer"` attributes.

**Validates: Requirements 2.2**

### Property 4: Null value handling

*For any* footer settings with a null whatsappUrl value, the footer component should not render any WhatsApp link element.

**Validates: Requirements 2.3**

### Property 5: Accessibility attributes

*For any* rendered WhatsApp link, the link element should include proper ARIA attributes for screen reader accessibility.

**Validates: Requirements 2.4**

### Property 6: Data persistence round trip

*For any* valid WhatsApp URL, if it is saved to footer settings, then querying the footer settings should return the same WhatsApp URL value.

**Validates: Requirements 1.3**

### Property 7: API field inclusion

*For any* footer settings API response, the response should include the whatsappUrl field regardless of whether it is null or has a value.

**Validates: Requirements 3.2**

### Property 8: Cache field inclusion

*For any* cached footer settings data, the cached object should include the whatsappUrl field.

**Validates: Requirements 3.4**

## Error Handling

### Backend Validation Errors

- **Invalid URL Format**: Return 400 Bad Request with message "WhatsApp URL must be a valid URL"
- **Database Connection Errors**: Return 500 Internal Server Error with generic error message
- **Validation Errors**: Return detailed validation error messages to admin users

### Frontend Error Handling

- **Missing WhatsApp URL**: Component gracefully hides the link (no error)
- **API Fetch Failures**: Existing error handling in footer settings API applies
- **Invalid URL in Form**: Display inline validation error message

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:
- Valid WhatsApp URLs are accepted
- Invalid URL formats are rejected
- Empty/null values are handled correctly
- Footer component renders WhatsApp link when URL is provided
- Footer component hides WhatsApp link when URL is null
- Admin form includes WhatsApp URL input field

### Property-Based Tests

Property-based tests will verify universal behaviors across random inputs:
- **Property 1**: Generate random valid/invalid URLs, verify validation behaves correctly
- **Property 2**: Generate random footer settings with whatsappUrl, verify link renders when non-null
- **Property 3**: Generate random WhatsApp links, verify all have correct target attributes
- **Property 4**: Generate random footer settings with null whatsappUrl, verify no link in DOM
- **Property 5**: Generate random WhatsApp links, verify all have accessibility attributes
- **Property 6**: Generate random valid URLs, verify persistence round trip
- **Property 7**: Generate random footer settings, verify API responses include whatsappUrl field
- **Property 8**: Generate random footer settings, verify cached data includes whatsappUrl field

**Testing Framework**: Jest with React Testing Library for frontend tests, Jest for backend tests

**Test Configuration**: Each property-based test should run a minimum of 100 iterations to ensure comprehensive coverage across random inputs.

**Test Tagging**: Each property-based test must include a comment with the format: `**Feature: whatsapp-social-link, Property {number}: {property_text}**`

## Implementation Notes

### Migration Strategy

1. Create Prisma migration to add `whatsappUrl` column
2. Run migration on development database
3. Update backend DTOs and validation
4. Update frontend types and components
5. Add translations for "WhatsApp" label
6. Test end-to-end functionality

### SVG Icon Component

**Add `SvgWhatsApp` component to `frontend/components/Svgs.tsx`**:

```typescript
export const SvgWhatsApp = (props: SvgProps) => (
  <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
)
```

### Footer Component Rendering

**Update `Footer.tsx` to render WhatsApp link**:

Add WhatsApp to the socials section alongside Facebook, TikTok, and Zalo:

```typescript
{whatsappUrl && (
  <li>
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-gray-300 hover:text-white transition-colors inline-flex items-center gap-2"
    >
      <SvgWhatsApp className="w-5 h-5" aria-hidden="true" />
      {t('whatsapp')}
    </a>
  </li>
)}
```

### Admin Form Updates

**Update footer settings admin form**:

Add WhatsApp URL input field following the same pattern as other social media fields:

```typescript
<div>
  <label htmlFor="whatsappUrl" className="block text-sm font-medium text-gray-700">
    {t('admin.whatsappUrl')}
  </label>
  <input
    type="url"
    id="whatsappUrl"
    name="whatsappUrl"
    value={formData.whatsappUrl || ''}
    onChange={handleChange}
    placeholder={t('admin.whatsappPlaceholder')}
    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
  />
  {errors.whatsappUrl && (
    <p className="mt-1 text-sm text-red-600">{errors.whatsappUrl}</p>
  )}
</div>
```

### Translations

**Add to `frontend/locales/translations.json`**:

```json
{
  "footer": {
    "whatsapp": {
      "en": "WhatsApp",
      "vi": "WhatsApp"
    }
  },
  "admin": {
    "whatsappUrl": {
      "en": "WhatsApp URL",
      "vi": "Liên kết WhatsApp"
    },
    "whatsappPlaceholder": {
      "en": "https://wa.me/1234567890",
      "vi": "https://wa.me/1234567890"
    },
    "zaloUrl": {
      "en": "Zalo URL",
      "vi": "Liên kết Zalo"
    }
  }
}
```

### Performance Considerations

- No performance impact: WhatsApp URL is included in existing cached footer settings
- No additional API calls required
- SVG icon is inline, no external resource loading

### Accessibility Considerations

- WhatsApp link must have descriptive text for screen readers
- Icon should have `aria-hidden="true"` attribute
- Link should have proper `aria-label` if needed
