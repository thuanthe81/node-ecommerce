# Design Document

## Overview

This design document outlines the implementation of a homepage content management system that allows administrators to create and manage various content sections displayed below the carousel. The system will extend the existing Content model with a new content type `HOMEPAGE_SECTION` and introduce a flexible layout system supporting centered, image-left, and image-right arrangements. A reusable component architecture will ensure maintainability and consistency across all section types.

## Architecture

### System Components

1. **Database Layer**: Extend Prisma schema to support homepage sections with layout metadata
2. **Backend API**: Extend existing content service with homepage section-specific endpoints
3. **Frontend Components**: Create reusable `ContentSection` component with layout variants
4. **Admin Interface**: Extend existing content management UI with homepage section controls
5. **Footer Management**: Create dedicated footer settings model and admin interface

### Data Flow

```
Admin Interface → Content API → Content Service → Prisma → PostgreSQL
                                                          ↓
Homepage Component ← Content API ← Published Sections ←
```

## Components and Interfaces

### Database Schema Extensions

**New ContentType Enum Value**:
```prisma
enum ContentType {
  PAGE
  FAQ
  BANNER
  HOMEPAGE_SECTION  // New
}
```

**New Footer Settings Model**:
```prisma
model FooterSettings {
  id              String   @id @default(uuid())
  copyrightText   String
  contactEmail    String?
  contactPhone    String?
  facebookUrl     String?
  twitterUrl      String?
  tiktokUrl       String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Backend API Endpoints

**Existing endpoints to leverage**:
- `GET /content` - List all content (filter by type)
- `GET /content/published` - List published content
- `POST /content` - Create content
- `PATCH /content/:id` - Update content
- `DELETE /content/:id` - Delete content

**New endpoints**:
- `GET /content/homepage-sections` - Get published homepage sections in order
- `GET /footer-settings` - Get current footer settings
- `PATCH /footer-settings` - Update footer settings (admin only)

### Frontend Components

#### ContentSection Component

A reusable component that renders different layouts based on configuration:

```typescript
interface ContentSectionProps {
  layout: 'centered' | 'image-left' | 'image-right';
  title: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
  imageUrl?: string;
  imageAlt?: string;
}
```

**Layout Variants**:
1. **Centered**: Title, description, and button centered with no image
2. **Image-Left**: Image on left (50%), content on right (50%) with left-aligned text
3. **Image-Right**: Content on left (50%) with right-aligned text, image on right (50%)

#### Footer Component

```typescript
interface FooterProps {
  copyrightText: string;
  contactEmail?: string;
  contactPhone?: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    tiktok?: string;
  };
}
```

### Admin Interface Components

**Homepage Sections Manager**:
- List view showing all homepage sections with drag-and-drop reordering
- Create/Edit form with layout selector and conditional image upload
- Preview panel showing how section will appear
- Publish/unpublish toggle

**Footer Settings Manager**:
- Simple form for editing footer content
- URL validation for social media links
- Preview of footer appearance

## Data Models

### Content Model (Extended)

The existing Content model will be used with additional metadata stored in a JSON field:

```typescript
interface HomepageSectionMetadata {
  layout: 'centered' | 'image-left' | 'image-right';
  buttonText: string;
  buttonUrl: string;
}
```

This metadata will be stored in the existing `Content` model fields:
- `titleEn/titleVi`: Section title
- `contentEn/contentVi`: Section description
- `imageUrl`: Product/section image (optional based on layout)
- `linkUrl`: Button URL
- `displayOrder`: Order of appearance
- `isPublished`: Visibility control

For the button text, we'll use a convention in the content field or extend the schema with additional fields.

### FooterSettings Model

```typescript
interface FooterSettings {
  id: string;
  copyrightText: string;
  contactEmail?: string;
  contactPhone?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  tiktokUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

##C
orrectness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated:
- Properties 1.1 and 3.1 both test section ordering - these are redundant
- Properties 2.4 and 2.5 overlap with 2.2 on validation - can be consolidated
- Properties 4.3 and 8.4 both test persistence after updates - similar pattern

The following properties represent the unique, non-redundant correctness guarantees:

### Property 1: Section ordering consistency
*For any* set of homepage sections with different displayOrder values, when fetched from the API, the sections should be returned in ascending order by displayOrder field.
**Validates: Requirements 1.1, 3.1**

### Property 2: Button URL correctness
*For any* content section with a buttonUrl, when rendered, the button element should have an href attribute matching the buttonUrl value.
**Validates: Requirements 1.5**

### Property 3: Homepage section retrieval
*For any* query for homepage sections, the API should return only sections where type equals HOMEPAGE_SECTION.
**Validates: Requirements 2.1**

### Property 4: Required field validation
*For any* content section creation request missing required fields (title, description, buttonText, buttonUrl, layout), the API should reject the request with a validation error.
**Validates: Requirements 2.2, 2.4**

### Property 5: Conditional image validation
*For any* content section with layout type 'image-left' or 'image-right', the API should require an imageUrl field, while for 'centered' layout, imageUrl should be optional.
**Validates: Requirements 2.3**

### Property 6: Update persistence
*For any* existing content section, when updated with new values and then fetched again, the returned section should contain the updated values.
**Validates: Requirements 2.5, 4.3, 8.4**

### Property 7: Order update consistency
*For any* set of sections, when their displayOrder values are updated and the sections are refetched, they should be returned in the new order.
**Validates: Requirements 3.2**

### Property 8: Deletion completeness
*For any* content section, when deleted, subsequent queries should not return that section.
**Validates: Requirements 3.3**

### Property 9: Publication visibility
*For any* content section with isPublished set to false, public API queries should not return that section, but admin queries should still include it.
**Validates: Requirements 3.4**

### Property 10: Footer settings retrieval
*For any* request to fetch footer settings, the API should return the current footer configuration with all fields.
**Validates: Requirements 4.1**

### Property 11: URL validation
*For any* footer settings update with social media URLs, the API should reject invalid URL formats and accept valid URL formats.
**Validates: Requirements 4.2**

### Property 12: Empty field handling
*For any* footer field that is null or empty string, the footer component should not render that field's UI element.
**Validates: Requirements 4.4**

### Property 13: Social link rendering
*For any* footer settings with non-empty social media URLs, the footer component should render corresponding link elements with those URLs.
**Validates: Requirements 5.3**

### Property 14: Social link target attribute
*For any* social media link in the footer, the link element should have target="_blank" attribute to open in a new tab.
**Validates: Requirements 5.4**

### Property 15: Layout-based rendering
*For any* content section component, when given different layout prop values ('centered', 'image-left', 'image-right'), the component should render different DOM structures appropriate to each layout.
**Validates: Requirements 6.2**

### Property 16: Preview reactivity
*For any* admin form state change (layout, title, description, image), the preview component should update to reflect the new values.
**Validates: Requirements 8.2, 8.3**

## Error Handling

### API Error Responses

**Validation Errors (400)**:
- Missing required fields
- Invalid URL formats
- Invalid layout type
- Missing image for image-required layouts

**Not Found Errors (404)**:
- Content section ID doesn't exist
- Footer settings not initialized

**Authorization Errors (403)**:
- Non-admin users attempting to create/update/delete content
- Non-admin users accessing unpublished content

**Server Errors (500)**:
- Database connection failures
- File upload failures

### Frontend Error Handling

**Network Errors**:
- Display user-friendly error messages
- Retry mechanism for transient failures
- Fallback to cached data when available

**Validation Errors**:
- Inline form validation before submission
- Clear error messages next to invalid fields
- Prevent submission until errors are resolved

**Loading States**:
- Skeleton loaders for content sections
- Loading spinners for admin operations
- Optimistic UI updates with rollback on failure

## Testing Strategy

### Unit Testing

**Backend Unit Tests**:
- Content service methods (create, update, delete, query)
- Footer settings service methods
- Validation logic for required fields and URLs
- Authorization checks for admin-only operations

**Frontend Unit Tests**:
- ContentSection component rendering for each layout type
- Footer component rendering with various configurations
- Form validation logic
- API client methods

### Property-Based Testing

We will use **fast-check** for JavaScript/TypeScript property-based testing.

**Property Test Configuration**:
- Minimum 100 iterations per property test
- Each test must reference its corresponding design property using the format: `**Feature: homepage-content-sections, Property {number}: {property_text}**`

**Key Property Tests**:

1. **Section Ordering** (Property 1): Generate random arrays of sections with random displayOrder values, verify sorting
2. **Required Field Validation** (Property 4): Generate random incomplete section data, verify rejection
3. **Conditional Image Validation** (Property 5): Generate sections with various layouts, verify image requirement enforcement
4. **Update Persistence** (Property 6): Generate random section data, update, verify persistence
5. **Publication Visibility** (Property 9): Generate sections with random isPublished values, verify filtering
6. **URL Validation** (Property 11): Generate random strings (valid and invalid URLs), verify validation
7. **Empty Field Handling** (Property 12): Generate footer settings with random null/empty fields, verify rendering
8. **Layout Rendering** (Property 15): Generate sections with all layout types, verify different outputs

### Integration Testing

**End-to-End Flows**:
- Admin creates homepage section → Section appears on homepage
- Admin reorders sections → Homepage reflects new order
- Admin unpublishes section → Section disappears from homepage
- Admin updates footer → Footer updates across all pages
- Visitor clicks button → Navigates to correct URL

### Responsive Testing

**Manual Testing Required**:
- Mobile viewport (320px, 375px, 414px)
- Tablet viewport (768px, 1024px)
- Desktop viewport (1280px, 1920px)
- Image scaling and text readability at each breakpoint

## Performance Considerations

### Database Optimization

- Index on `type` and `isPublished` fields for fast filtering
- Index on `displayOrder` for efficient sorting
- Composite index on `(type, isPublished, displayOrder)` for homepage queries

### Caching Strategy

- Cache published homepage sections with 5-minute TTL
- Cache footer settings with 1-hour TTL
- Invalidate cache on admin updates
- Use Redis for distributed caching in production

### Image Optimization

- Lazy load images below the fold
- Use Next.js Image component for automatic optimization
- Serve responsive images with srcset
- Implement blur-up placeholder technique

## Security Considerations

### Authorization

- All create/update/delete operations require admin role
- Public endpoints only return published content
- Admin endpoints return all content regardless of publication status

### Input Validation

- Sanitize HTML content to prevent XSS
- Validate URL formats to prevent injection
- Limit file upload sizes for images
- Validate image file types (JPEG, PNG, WebP only)

### Rate Limiting

- Apply rate limits to admin endpoints
- Stricter limits on file upload endpoints
- Public endpoints have generous limits for visitor traffic

## Deployment Considerations

### Database Migration

1. Add `HOMEPAGE_SECTION` to ContentType enum
2. Create FooterSettings table
3. Create indexes for performance
4. Seed initial footer settings record

### Feature Flags

- Enable homepage sections feature behind flag initially
- Gradual rollout to verify performance
- Easy rollback if issues arise

### Monitoring

- Track API response times for content queries
- Monitor cache hit rates
- Alert on high error rates for admin operations
- Track user engagement with homepage sections (click-through rates)
