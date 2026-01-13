# Design Document

## Overview

This feature extends the existing blog system by adding background image functionality to blog posts and enhances the ImagePickerModal component with tabbed interface support. The implementation involves adding an `imageBackground` field to the blog post form, displaying it as a CSS background image on the blog post page, and upgrading the ImagePickerModal to support both product images and media library images through a tabbed interface. The design leverages existing patterns from the codebase for image handling and form field management while providing a unified image selection experience.

## Architecture

The feature follows the existing blog system architecture with enhancements to the image selection workflow:

1. **Frontend Form Layer**: Extends `BlogPostForm` component with new background image field
2. **Data Layer**: Adds `imageBackground` field to `BlogPostFormData` interface
3. **Display Layer**: Modifies `BlogPostPage` component to render background images
4. **Image Selection Layer**: Enhances `ImagePickerModal` with tabbed interface for product and media library images
5. **API Layer**: Extends existing blog API to handle the new field (backend changes handled separately)

## Components and Interfaces

### BlogPostForm Enhancement

**Location**: `frontend/components/BlogPostForm/`

**Changes**:
- Add `imageBackground` field to `BlogPostFormData` interface in `types.ts`
- Extend `PublishingSection` component to include background image field
- Add background image state management to main `BlogPostForm` component
- Implement background image selection using existing `ImagePickerModal`

**New State Variables**:
```typescript
const [showBackgroundImagePicker, setShowBackgroundImagePicker] = useState(false);
```

**Form Field Structure**:
The background image field will follow the same pattern as the existing featured image field:
- Image preview when selected
- Button to open image picker modal
- Validation error display
- Consistent styling with other form fields

### BlogPostPage Enhancement

**Location**: `frontend/components/BlogPostPage.tsx`

**Changes**:
- Add background image rendering to the main content area
- Implement CSS-in-JS styling for background image
- Add fallback handling for missing background images
- Ensure text readability with overlay or contrast adjustments

**Background Image Implementation**:
```typescript
const backgroundImageStyle = post.imageBackground ? {
  backgroundImage: `url(${post.imageBackground})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat'
} : {};
```

### ImagePickerModal Enhancement

**Location**: `frontend/components/ImagePickerModal.tsx`

**Changes**:
- Add tabbed interface with "Products" and "Media Library" tabs
- Integrate media library image display alongside existing product images
- Maintain backward compatibility by defaulting to "Products" tab
- Preserve search functionality across both tabs
- Unify image selection experience with consistent grid layout

**New State Variables**:
```typescript
const [activeTab, setActiveTab] = useState<'products' | 'media'>('products');
const [mediaItems, setMediaItems] = useState<ContentMedia[]>([]);
const [loadingMedia, setLoadingMedia] = useState(false);
```

**Tab Interface Structure**:
```typescript
interface TabConfig {
  id: 'products' | 'media';
  label: string;
  count: number;
}

const tabs: TabConfig[] = [
  { id: 'products', label: t('products'), count: totalProductImages },
  { id: 'media', label: t('mediaLibrary'), count: totalMediaItems }
];
```

**Unified Image Selection**:
The modal will present a consistent interface regardless of the active tab:
- Same grid layout for both product and media images
- Unified search functionality that works across both sources
- Consistent image preview and selection behavior
- Same loading states and empty state messages

## Data Models

### BlogPostFormData Interface Extension

**File**: `frontend/components/BlogPostForm/types.ts`

```typescript
export interface BlogPostFormData {
  // ... existing fields
  imageBackground: string; // New field for background image URL
}
```

### BlogPost Interface Extension

**File**: `frontend/lib/blog-api.ts`

```typescript
export interface BlogPost {
  // ... existing fields
  imageBackground?: string; // New optional field for background image URL
}
```

### CreateBlogPostData Interface Extension

**File**: `frontend/lib/blog-api.ts`

```typescript
export interface CreateBlogPostData {
  // ... existing fields
  imageBackground?: string; // New optional field for background image URL
}
```

### ImagePickerModal Interface Extensions

**File**: `frontend/components/ImagePickerModal.tsx`

```typescript
interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string, source?: Product | ContentMedia) => void;
  locale: string;
}

interface TabConfig {
  id: 'products' | 'media';
  label: string;
  count: number;
}

interface ImageSource {
  id: string;
  url: string;
  altText?: string;
  title?: string;
  type: 'product' | 'media';
  source?: Product | ContentMedia;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing the acceptance criteria, several properties can be consolidated:
- Properties 1.2, 1.3, 1.4, and 3.4 all relate to form data handling and can be combined into a comprehensive form data property
- Properties 2.1 and 2.2 can be combined into a single background image display property
- Properties 1.5 and 3.5 both relate to form field population and can be combined
- Properties 4.2 and 4.3 both test tab switching and can be combined into a single tab switching property
- Properties 4.5 covers image selection from both tabs, making separate properties redundant

### Correctness Properties

Property 1: Background image form data handling
*For any* blog post form data with or without a background image, submitting the form should include the imageBackground field in the payload with the correct value (URL string, empty, or null)
**Validates: Requirements 1.2, 1.3, 1.4, 3.4**

Property 2: Background image preview and form population
*For any* blog post form state, when imageBackground has a value, the form should display a preview of that image and populate the field correctly, and when imageBackground is empty, no preview should be shown
**Validates: Requirements 1.5, 3.5**

Property 3: Background image page display
*For any* blog post, the BlogPostPage should apply background-image CSS styling when imageBackground is present and default styling when imageBackground is absent
**Validates: Requirements 2.1, 2.2**

Property 4: Image picker modal consistency
*For any* interaction with the background image field, clicking the select/change button should open the ImagePickerModal component with tabbed interface
**Validates: Requirements 3.2**

Property 5: Form validation consistency
*For any* form submission, the background image field should be validated using the same URL validation rules as other optional image fields in the system
**Validates: Requirements 3.3**

Property 6: Layout stability
*For any* blog post page with a background image, the main content area should maintain consistent dimensions regardless of image loading state
**Validates: Requirements 2.4**

Property 7: Error handling graceful fallback
*For any* blog post with an invalid background image URL, the BlogPostPage should render without errors and display default styling
**Validates: Requirements 2.5**

Property 8: Tab switching functionality
*For any* ImagePickerModal interaction, clicking either the "Products" or "Media Library" tab should display the appropriate images with search and selection functionality
**Validates: Requirements 4.2, 4.3**

Property 9: Search query preservation
*For any* search query entered in the ImagePickerModal, switching between tabs should preserve the search query and maintain modal state
**Validates: Requirements 4.4**

Property 10: Image selection across tabs
*For any* image selected from either the Products or Media Library tab, the ImagePickerModal should return the correct image URL and close the modal
**Validates: Requirements 4.5**

Property 11: Consistent grid layout
*For any* tab in the ImagePickerModal, images should be displayed in a consistent grid layout regardless of whether they are product images or media library images
**Validates: Requirements 4.7**

Property 12: Empty state handling
*For any* tab with no available images, the ImagePickerModal should display an appropriate empty state message specific to that tab
**Validates: Requirements 4.8**

<function_calls>
<invoke name="prework">
<parameter name="featureName">blog-background-image

## Error Handling

### Form Validation
- Background image field is optional - no validation errors for empty values
- Invalid image URLs should be handled gracefully without breaking form submission
- Image picker modal errors should be contained and not affect form state

### Display Error Handling
- Invalid or missing background image URLs should not break page rendering
- Failed image loads should fallback to default styling without layout shifts
- CSS background-image errors should be handled by browser defaults

### State Management
- Form state should handle undefined/null background image values
- Component re-renders should preserve background image state
- Image picker modal state should be independent of form validation state

## Testing Strategy

### Unit Tests
Unit tests will verify specific examples and edge cases:
- Form field rendering with and without background images
- Image picker modal integration
- Form data serialization with background image field
- Component error boundaries for invalid image URLs

### Property-Based Tests
Property-based tests will verify universal properties across all inputs using a minimum of 100 iterations per test:
- **Feature: blog-background-image, Property 1**: Background image form data handling
- **Feature: blog-background-image, Property 2**: Background image preview and form population
- **Feature: blog-background-image, Property 3**: Background image page display
- **Feature: blog-background-image, Property 4**: Image picker modal consistency
- **Feature: blog-background-image, Property 5**: Form validation consistency
- **Feature: blog-background-image, Property 6**: Layout stability
- **Feature: blog-background-image, Property 7**: Error handling graceful fallback
- **Feature: blog-background-image, Property 8**: Tab switching functionality
- **Feature: blog-background-image, Property 9**: Search query preservation
- **Feature: blog-background-image, Property 10**: Image selection across tabs
- **Feature: blog-background-image, Property 11**: Consistent grid layout
- **Feature: blog-background-image, Property 12**: Empty state handling

### Integration Tests
- End-to-end form submission with background images
- Blog post page rendering with various background image states
- Image picker modal workflow integration

The testing approach combines unit tests for specific scenarios with property-based tests for comprehensive input coverage, ensuring both concrete functionality and universal correctness properties are validated.