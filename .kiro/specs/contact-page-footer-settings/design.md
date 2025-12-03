# Design Document

## Overview

This feature integrates the contact page with the existing footer_settings API to dynamically display contact information. The implementation leverages the existing footer settings infrastructure (API, caching, database) and only requires frontend changes to fetch and display the data.

## Architecture

The solution follows the existing Next.js App Router pattern with server-side data fetching:

- **Server Component**: Fetch footer settings on the server during page load
- **Client Component**: Display contact information and handle the contact form
- **API Layer**: Use existing `footerSettingsApi.getFooterSettings()` method
- **Caching**: Leverage existing Redis cache (1-hour TTL) for footer settings

## Components and Interfaces

### Modified Components

#### 1. ContactContent Component
**Location**: `frontend/app/[locale]/contact/ContactContent.tsx`

**Changes**:
- Accept `footerSettings` as a prop
- Replace hardcoded contact information with dynamic data from props
- Conditionally render contact information sections based on data availability
- Maintain existing contact form functionality

**Props Interface**:
```typescript
interface ContactContentProps {
  footerSettings: FooterSettings | null;
}
```

#### 2. Contact Page Component
**Location**: `frontend/app/[locale]/contact/page.tsx`

**Changes**:
- Fetch footer settings on the server using the existing API
- Pass footer settings to ContactContent component
- Handle API errors gracefully with fallback behavior

### Data Flow

1. User navigates to `/contact` page
2. Server component fetches footer settings via API (cached response if available)
3. Footer settings passed as props to client component
4. Client component renders contact information dynamically
5. Contact form submission continues to work as before (unchanged)

## Data Models

### FooterSettings Interface
Already defined in `frontend/lib/footer-settings-api.ts`:

```typescript
interface FooterSettings {
  id: string;
  copyrightText: string;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  googleMapsUrl: string | null;
  facebookUrl: string | null;
  twitterUrl: string | null;
  tiktokUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Contact information display consistency
*For any* footer settings data, if a contact field (email, phone, address) has a non-null value, then that field should be visible on the contact page.
**Validates: Requirements 1.2, 1.3, 1.4**

### Property 2: Graceful handling of missing data
*For any* footer settings data, if a contact field (email, phone, address) has a null value, then that field section should not be rendered on the contact page.
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 3: Google Maps link functionality
*For any* footer settings data with a non-null googleMapsUrl, the address section should include a clickable link that opens the Google Maps URL.
**Validates: Requirements 1.5**

## Error Handling

### API Failure Scenarios

1. **Network Error**: If footer settings API fails, display fallback message
2. **Empty Response**: Treat as null footer settings and hide all dynamic sections
3. **Partial Data**: Display only available fields, hide missing ones

### Error Messages

- English: "Contact information is temporarily unavailable. Please try again later or use the contact form below."
- Vietnamese: "Thông tin liên hệ tạm thời không khả dụng. Vui lòng thử lại sau hoặc sử dụng biểu mẫu liên hệ bên dưới."

## Testing Strategy

### Unit Tests

Unit tests will verify specific rendering scenarios:
- Contact information renders when all fields are present
- Sections are hidden when fields are null
- Google Maps link renders correctly when URL is provided
- Fallback message displays when footer settings are null
- Contact form continues to work independently of footer settings

### Property-Based Tests

Property-based tests will verify universal behaviors across random inputs:
- **Property 1**: Generate random footer settings with various field combinations, verify visible fields match non-null values
- **Property 2**: Generate random footer settings with null fields, verify those sections are not in the DOM
- **Property 3**: Generate random footer settings with googleMapsUrl, verify link element exists with correct href

**Testing Framework**: Jest with React Testing Library for component tests

**Test Configuration**: Each property-based test should run a minimum of 100 iterations to ensure comprehensive coverage across random inputs.

**Test Tagging**: Each property-based test must include a comment with the format: `**Feature: contact-page-footer-settings, Property {number}: {property_text}**`

## Implementation Notes

### Translations

All new user-facing text must be added to `frontend/locales/translations.json` with both English and Vietnamese translations:
- Error messages for API failures
- Fallback messages for missing data
- Any new labels or headings

### Existing Patterns

Follow the pattern used in `frontend/app/[locale]/layout.tsx` which already fetches footer settings on the server:

```typescript
async function getFooterSettings() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${baseUrl}/footer-settings`, {
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching footer settings:', error);
    return null;
  }
}
```

### Performance Considerations

- Footer settings are cached in Redis with 1-hour TTL
- Server-side fetching prevents client-side loading states
- No additional API calls needed (data fetched once per page load)
