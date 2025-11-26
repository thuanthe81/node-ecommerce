# Design Document: Admin Content Edit Page

## Overview

This feature implements a dedicated edit page for content items in the admin panel. The page will be located at `/admin/content/[id]` and will leverage the existing `ContentForm` component to provide a complete editing interface for all content properties. The implementation follows the established patterns used in the "new content" page and other admin edit pages in the application.

## Architecture

The feature follows Next.js 13+ App Router conventions with a client-side component pattern:

```
/admin/content/[id]/
  ├── page.tsx (Server Component wrapper with Suspense)
  └── EditContentContent.tsx (Client Component with data fetching and form handling)
```

### Component Hierarchy

```
page.tsx (Server Component)
  └── Suspense boundary
      └── EditContentContent (Client Component)
          └── ContentForm (Existing reusable form)
```

## Components and Interfaces

### 1. Page Component (`page.tsx`)

A minimal server component that provides the Suspense boundary for loading states.

**Responsibilities:**
- Wrap the client component in a Suspense boundary
- Provide loading fallback UI

**Interface:**
```typescript
export default function EditContentPage({
  params
}: {
  params: { id: string }
}): JSX.Element
```

### 2. Edit Content Client Component (`EditContentContent.tsx`)

The main client component that handles data fetching, state management, and form submission.

**Responsibilities:**
- Extract content ID from URL parameters
- Fetch existing content data using `getContentById`
- Handle loading and error states
- Pass content data to ContentForm
- Handle form submission via `updateContent` API
- Handle navigation on success/cancel

**Interface:**
```typescript
export default function EditContentContent({
  params
}: {
  params: { id: string }
}): JSX.Element
```

**State Management:**
- `content`: Content | null - The loaded content item
- `loading`: boolean - Loading state during initial fetch
- `error`: string | null - Error message if fetch fails

### 3. ContentForm Component (Existing)

The existing reusable form component that handles all content editing.

**Props Interface:**
```typescript
interface ContentFormProps {
  content?: Content;
  onSubmit: (data: CreateContentData) => Promise<void>;
  onCancel: () => void;
}
```

## Data Models

### Content Interface (Existing)

```typescript
interface Content {
  id: string;
  slug: string;
  type: 'PAGE' | 'FAQ' | 'BANNER' | 'HOMEPAGE_SECTION';
  titleEn: string;
  titleVi: string;
  contentEn: string;
  contentVi: string;
  imageUrl?: string;
  linkUrl?: string;
  displayOrder: number;
  isPublished: boolean;
  publishedAt?: string;
  buttonTextEn?: string;
  buttonTextVi?: string;
  layout?: 'centered' | 'image-left' | 'image-right';
  createdAt: string;
  updatedAt: string;
}
```

### API Methods (Existing)

```typescript
// Fetch content by ID
getContentById(id: string): Promise<Content>

// Update content
updateContent(id: string, data: Partial<CreateContentData>): Promise<Content>
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing the acceptance criteria, several properties can be consolidated:
- Properties 2.1-2.4, 2.6-2.7 all test that specific fields are editable and can be combined into a single comprehensive property about all required fields being editable
- Property 4.4 is redundant with Property 3.1 (valid data allowing submission is the same as successful save)

### Property 1: Content loading and population
*For any* valid content ID, when the edit page loads, the system should fetch the content and populate all content properties into the ContentForm component
**Validates: Requirements 1.1, 1.4**

### Property 2: All editable fields are present
*For any* content item, when the edit form is displayed, all standard content fields (slug, type, titleEn, titleVi, contentEn, contentVi, displayOrder, isPublished) should be editable in the form
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.6, 2.7**

### Property 3: Conditional banner fields
*For any* content item with type BANNER, when the edit form is displayed, the imageUrl and linkUrl fields should be editable
**Validates: Requirements 2.5**

### Property 9: Conditional homepage section fields
*For any* content item with type HOMEPAGE_SECTION, when the edit form is displayed, the imageUrl, buttonTextEn, buttonTextVi, and layout fields should be editable
**Validates: Requirements 2.8**

### Property 10: Homepage section layout options
*For any* content item with type HOMEPAGE_SECTION, when the edit form is displayed, the layout field should allow selection from centered, image-left, or image-right options
**Validates: Requirements 2.9**

### Property 4: Successful save persistence
*For any* valid content update, when submitted, the changes should be saved to the database and the administrator should be redirected to the content list page
**Validates: Requirements 3.1, 3.2**

### Property 5: Error handling with data retention
*For any* save operation that fails, the system should display an error message and retain all form data without losing user input
**Validates: Requirements 3.3**

### Property 6: Required field validation
*For any* content update where required fields are empty, the system should prevent submission and display validation errors
**Validates: Requirements 4.1**

### Property 7: URL field validation
*For any* content update where URL fields (imageUrl, linkUrl) contain invalid URLs, the system should display validation errors
**Validates: Requirements 4.2**

### Property 8: Slug validation
*For any* content update where the slug contains invalid characters, the system should display validation errors
**Validates: Requirements 4.3**

## Error Handling

### Error Scenarios

1. **Content Not Found (404)**
   - Trigger: Content ID doesn't exist in database
   - Response: Display error message "Content not found"
   - User Action: Provide link back to content list

2. **Network/API Errors**
   - Trigger: API request fails (network, server error)
   - Response: Display error message with details
   - User Action: Allow retry or navigation back

3. **Validation Errors**
   - Trigger: Invalid form data submitted
   - Response: Display field-specific validation messages
   - User Action: Form remains populated for correction

4. **Permission Errors (403)**
   - Trigger: User lacks admin permissions
   - Response: Redirect to login or show permission denied
   - User Action: Handled by auth middleware

### Error Display Pattern

```typescript
{error && (
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
    {error}
  </div>
)}
```

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. **Component Rendering**
   - Test that EditContentContent renders loading state initially
   - Test that error message displays when content not found
   - Test that ContentForm receives correct props when content loads

2. **Navigation**
   - Test that cancel button navigates to `/admin/content`
   - Test that successful save redirects to `/admin/content`

3. **Edge Cases**
   - Test handling of non-existent content ID (404 error)
   - Test handling of malformed content ID
   - Test handling of network errors during fetch

### Property-Based Tests

Property-based tests will verify universal properties across all inputs using **fast-check** (JavaScript/TypeScript property-based testing library). Each test will run a minimum of 100 iterations.

1. **Property 1: Content loading and population**
   - **Feature: admin-content-edit, Property 1: Content loading and population**
   - Generate: Random valid content objects
   - Test: Fetch content and verify all properties are passed to ContentForm
   - Assert: All content fields match the fetched data

2. **Property 2: All editable fields are present**
   - **Feature: admin-content-edit, Property 2: All editable fields are present**
   - Generate: Random content items
   - Test: Render form and verify all standard fields are present and editable
   - Assert: Form contains inputs for all required fields

3. **Property 3: Conditional banner fields**
   - **Feature: admin-content-edit, Property 3: Conditional banner fields**
   - Generate: Random content items with type BANNER
   - Test: Render form and verify imageUrl and linkUrl fields are present
   - Assert: Banner-specific fields are editable

4. **Property 4: Successful save persistence**
   - **Feature: admin-content-edit, Property 4: Successful save persistence**
   - Generate: Random valid content updates
   - Test: Submit updates and verify API call and navigation
   - Assert: updateContent called with correct data, navigation to list page occurs

5. **Property 5: Error handling with data retention**
   - **Feature: admin-content-edit, Property 5: Error handling with data retention**
   - Generate: Random content updates that will fail
   - Test: Submit and verify error display and data retention
   - Assert: Error message shown, form data unchanged

6. **Property 6: Required field validation**
   - **Feature: admin-content-edit, Property 6: Required field validation**
   - Generate: Content updates with various empty required fields
   - Test: Attempt submission and verify validation errors
   - Assert: Submission prevented, validation errors displayed

7. **Property 7: URL field validation**
   - **Feature: admin-content-edit, Property 7: URL field validation**
   - Generate: Invalid URL strings
   - Test: Enter invalid URLs and verify validation
   - Assert: Validation errors displayed for invalid URLs

8. **Property 8: Slug validation**
   - **Feature: admin-content-edit, Property 8: Slug validation**
   - Generate: Invalid slug strings (spaces, special characters)
   - Test: Enter invalid slugs and verify validation
   - Assert: Validation errors displayed for invalid slugs

9. **Property 9: Conditional homepage section fields**
   - **Feature: admin-content-edit, Property 9: Conditional homepage section fields**
   - Generate: Random content items with type HOMEPAGE_SECTION
   - Test: Render form and verify imageUrl, buttonTextEn, buttonTextVi, and layout fields are present
   - Assert: Homepage section-specific fields are editable

10. **Property 10: Homepage section layout options**
    - **Feature: admin-content-edit, Property 10: Homepage section layout options**
    - Generate: Random content items with type HOMEPAGE_SECTION
    - Test: Render form and verify layout field has centered, image-left, and image-right options
    - Assert: All three layout options are available for selection

### Integration Tests

Integration tests will verify the complete flow:

1. **Complete Edit Flow**
   - Create a content item
   - Navigate to edit page
   - Modify all fields
   - Submit and verify changes persisted
   - Verify redirect to list page

2. **Error Recovery Flow**
   - Navigate to edit page with invalid ID
   - Verify error display
   - Navigate back to list

## Implementation Notes

### Routing

The page will be created at:
```
frontend/app/[locale]/admin/content/[id]/page.tsx
frontend/app/[locale]/admin/content/[id]/EditContentContent.tsx
```

### Data Fetching Pattern

Following Next.js 13+ patterns, data fetching will occur in the client component using `useEffect`:

```typescript
useEffect(() => {
  const fetchContent = async () => {
    try {
      setLoading(true);
      const data = await getContentById(params.id);
      setContent(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchContent();
}, [params.id]);
```

### Form Submission Handler

```typescript
const handleSubmit = async (data: CreateContentData) => {
  await updateContent(params.id, data);
  router.push('/admin/content');
};
```

### Reusability

The implementation maximizes code reuse:
- Uses existing `ContentForm` component (no modifications needed)
- Uses existing API methods (`getContentById`, `updateContent`)
- Follows established patterns from other admin edit pages

## Security Considerations

- Admin role verification handled by existing auth middleware
- Content ID validation performed by backend
- XSS protection through React's built-in escaping
- CSRF protection through existing API client configuration

## Performance Considerations

- Single API call to fetch content on page load
- Form state managed locally in ContentForm
- No unnecessary re-renders
- Suspense boundary prevents layout shift during loading
