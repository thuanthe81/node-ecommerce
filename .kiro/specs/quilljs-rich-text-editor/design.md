# Design Document

## Overview

This design document outlines the integration of Quill.js rich text editor into the existing ContentForm component. The solution will replace the current plain textarea with a WYSIWYG editor that supports rich text formatting and image insertion from both product images and local file uploads. The implementation will follow the existing modular component architecture pattern used throughout the codebase.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      ContentForm                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              RichTextEditor Component                  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │           Quill.js Editor Instance              │  │  │
│  │  │  - Toolbar (Bold, Italic, Headers, Lists, etc) │  │  │
│  │  │  - Custom Image Button Handler                  │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ├─────────────────────────────────┐
                            │                                 │
                ┌───────────▼──────────┐         ┌───────────▼──────────┐
                │  ImagePickerModal    │         │  File Upload Handler │
                │  (Existing)          │         │  (New API Endpoint)  │
                │  - Product Images    │         │  - Validate File     │
                │  - Search/Filter     │         │  - Upload to Server  │
                └──────────────────────┘         │  - Return URL        │
                                                 └──────────────────────┘
```

### Component Structure

Following the established pattern in the codebase (e.g., Carousel, ContentForm, Header), the RichTextEditor will be organized as:

```
components/RichTextEditor/
├── RichTextEditor.tsx          # Main component
├── index.tsx                   # Export entry point
├── types.ts                    # TypeScript interfaces
├── hooks/
│   ├── useQuillEditor.ts       # Editor initialization and lifecycle
│   └── useImageInsertion.ts    # Image insertion logic
└── utils/
    ├── quillConfig.ts          # Quill configuration and modules
    └── imageHandlers.ts        # Image upload and insertion utilities
```

## Components and Interfaces

### 1. RichTextEditor Component

**Purpose:** Main wrapper component that integrates Quill.js editor with React lifecycle and state management.

**Props Interface:**
```typescript
interface RichTextEditorProps {
  value: string;                    // HTML content
  onChange: (html: string) => void; // Callback when content changes
  placeholder?: string;             // Placeholder text
  readOnly?: boolean;              // Read-only mode (for preview)
  showToolbar?: boolean;           // Show/hide toolbar (hide in preview)
  onImageInsert?: (url: string) => void; // Optional callback for image insertion
  className?: string;              // Additional CSS classes
  locale: string;                  // Current locale for translations
}
```

**Responsibilities:**
- Render Quill editor container
- Initialize Quill instance via custom hook
- Handle content synchronization between Quill and parent component
- Manage image insertion modal visibility
- Apply custom styling and theming

### 2. useQuillEditor Hook

**Purpose:** Manage Quill editor instance lifecycle and configuration.

**Interface:**
```typescript
interface UseQuillEditorReturn {
  quillRef: React.RefObject<HTMLDivElement>;
  editor: Quill | null;
  isReady: boolean;
}

function useQuillEditor(
  initialValue: string,
  onChange: (html: string) => void,
  options?: QuillOptions
): UseQuillEditorReturn;
```

**Responsibilities:**
- Initialize Quill instance on mount
- Configure toolbar and modules
- Set up event listeners for text-change
- Clean up on unmount
- Handle content updates from parent

### 3. useImageInsertion Hook

**Purpose:** Handle image insertion logic for both product images and file uploads.

**Interface:**
```typescript
interface UseImageInsertionReturn {
  showProductPicker: boolean;
  setShowProductPicker: (show: boolean) => void;
  handleProductImageSelect: (url: string) => void;
  handleFileUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  uploadError: string | null;
}

function useImageInsertion(
  editor: Quill | null,
  onImageInsert?: (url: string) => void
): UseImageInsertionReturn;
```

**Responsibilities:**
- Manage product image picker modal state
- Handle product image selection
- Process file uploads
- Insert images into editor at cursor position
- Handle upload errors

### 4. Backend API Endpoint

**New Endpoint:** `POST /content/upload-image`

**Purpose:** Handle image uploads for content editor.

**Request:**
- Multipart form data with image file
- Supported formats: JPEG, PNG, GIF, WebP
- Max file size: 5MB

**Response:**
```typescript
interface UploadImageResponse {
  url: string;        // Public URL of uploaded image
  filename: string;   // Generated filename
}
```

**Storage Location:** `/uploads/content/`

## Data Models

### Quill Configuration

```typescript
interface QuillConfig {
  theme: 'snow';
  modules: {
    toolbar: {
      container: Array<string | Array<string>>;
      handlers: {
        image: () => void;  // Custom image handler
      };
    };
  };
  formats: string[];
  placeholder: string;
}
```

### Image Upload Data

```typescript
interface ImageUploadData {
  file: File;
  productId?: string;  // Optional, if from product
}

interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}
```

### Editor State

```typescript
interface EditorState {
  contentEn: string;  // English HTML content
  contentVi: string;  // Vietnamese HTML content
  activeLanguage: 'en' | 'vi';
  isDirty: boolean;   // Has unsaved changes
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After reviewing the prework analysis, several properties can be consolidated:

- Properties 4.1 and 4.2 (tab switching) are redundant - they describe the same bidirectional behavior
- Properties 2.4 and 3.4 (image insertion at cursor) describe the same behavior for different image sources
- Property 1.5 and 5.3 (preview mode rendering) describe the same preview behavior

These will be combined into more comprehensive properties.

### Correctness Properties

Property 1: Formatting operations produce correct HTML
*For any* text content and any formatting operation (bold, italic, underline, headers, lists), applying the formatting should produce HTML output containing the appropriate formatting tags
**Validates: Requirements 1.2**

Property 2: Language content isolation
*For any* HTML content in English and Vietnamese, switching between language tabs multiple times should preserve each language's content independently without cross-contamination
**Validates: Requirements 1.3, 4.1, 4.2**

Property 3: Editor output validity
*For any* sequence of editor operations, the resulting HTML output should be valid and parseable HTML
**Validates: Requirements 1.4**

Property 4: Preview mode preserves content
*For any* HTML content, toggling to preview mode (read-only Quill view) and back to edit mode should preserve the content exactly
**Validates: Requirements 1.5, 5.3**

Property 5: Product image display completeness
*For any* set of product images in the database, the Product Image Picker modal should display all available images
**Validates: Requirements 2.3**

Property 6: Image insertion at cursor position
*For any* cursor position in the editor and any image (from products or uploaded), inserting the image should place it at the exact cursor location
**Validates: Requirements 2.4, 3.4**

Property 7: Image inline rendering
*For any* inserted image, the editor should display the image inline with surrounding text content
**Validates: Requirements 2.5**

Property 8: File validation correctness
*For any* file, the validation should correctly accept valid image files (JPEG, PNG, GIF, WebP under 5MB) and reject invalid files
**Validates: Requirements 3.2**

Property 9: Valid file upload success
*For any* valid image file, the upload process should complete successfully and return a valid URL
**Validates: Requirements 3.3**

Property 10: Invalid file error messaging
*For any* invalid file (wrong type or too large), the system should display an appropriate error message indicating the specific validation failure
**Validates: Requirements 3.5**

Property 11: Image preservation during tab switches
*For any* content containing images, switching between language tabs should preserve all images in their original positions
**Validates: Requirements 4.3**

Property 12: Bilingual content persistence
*For any* editor state with both English and Vietnamese content, form submission should save both language versions independently and completely
**Validates: Requirements 4.4**

Property 13: Content loading round-trip
*For any* saved content (English and Vietnamese), loading the content into the editor should restore the exact same formatted content
**Validates: Requirements 4.5**

Property 14: Preview mode uses Quill view mode
*For any* content in the editor, activating preview mode should switch the Quill editor to read-only mode while preserving all formatting
**Validates: Requirements 5.3**

Property 15: Validation error display consistency
*For any* validation error on the editor, the error message display should match the styling and positioning pattern of other form field errors
**Validates: Requirements 5.2**

Property 16: Cancel discards changes
*For any* editor state with unsaved changes, cancelling the form should discard all changes without persisting them
**Validates: Requirements 5.4**

Property 17: Successful submission cleanup
*For any* successful form submission, the editor state should be cleared and reset to initial state
**Validates: Requirements 5.5**

Property 18: Upload storage location correctness
*For any* uploaded image, the file should be stored in the `/uploads/content/` directory
**Validates: Requirements 7.1**

Property 19: Filename uniqueness
*For any* two image uploads, the generated filenames should be unique to prevent conflicts
**Validates: Requirements 7.2**

Property 20: URL accessibility
*For any* uploaded image, the returned URL should be publicly accessible and correctly resolve to the image
**Validates: Requirements 7.3**

Property 21: URL format correctness
*For any* image inserted into content, the URL should be properly formatted (absolute or correctly resolved relative path)
**Validates: Requirements 7.4**

Property 22: Image URL persistence
*For any* content with embedded images, saving the content should persist all image URLs in the database as part of the HTML
**Validates: Requirements 7.5**

Property 23: Color formatting application
*For any* text selection and any color, applying the color should produce HTML output with the correct color styling
**Validates: Requirements 8.3**

Property 24: Color persistence round-trip
*For any* content with colored text, saving and reloading the content should preserve the exact colors
**Validates: Requirements 8.4, 8.5**

Property 25: Image resize dimension update
*For any* inserted image and any resize operation, the image dimensions should update in real-time during the resize
**Validates: Requirements 9.2**

Property 26: Default image width
*For any* newly inserted image, the image should be inserted with a default width of 300 pixels
**Validates: Requirements 9.1**

Property 27: Image resize persistence
*For any* resized image, saving and reloading the content should display the image at the exact saved dimensions
**Validates: Requirements 9.5, 9.6**

## Error Handling

### Editor Initialization Errors

**Scenario:** Quill.js fails to initialize
- **Detection:** Try-catch around Quill constructor
- **Response:** Display error message, fall back to plain textarea
- **User Feedback:** "Rich text editor failed to load. Using basic text input."

### Image Upload Errors

**Scenario:** File upload fails due to network error
- **Detection:** Catch axios error in upload handler
- **Response:** Retry once, then show error
- **User Feedback:** "Failed to upload image. Please try again."

**Scenario:** File validation fails (wrong type)
- **Detection:** Check file.type before upload
- **Response:** Prevent upload, show error
- **User Feedback:** "Please select a valid image file (JPEG, PNG, GIF, or WebP)"

**Scenario:** File validation fails (too large)
- **Detection:** Check file.size before upload
- **Response:** Prevent upload, show error
- **User Feedback:** "Image file is too large. Maximum size is 5MB."

### Content Synchronization Errors

**Scenario:** Content fails to save
- **Detection:** Catch API error in form submission
- **Response:** Preserve editor state, show error, allow retry
- **User Feedback:** "Failed to save content. Your changes are preserved. Please try again."

**Scenario:** Content fails to load
- **Detection:** Catch API error in content fetch
- **Response:** Show error, allow retry
- **User Feedback:** "Failed to load content. Please refresh the page."

### State Management Errors

**Scenario:** Language tab switch loses content
- **Detection:** Compare content before/after switch
- **Response:** Restore from backup state
- **User Feedback:** Silent recovery, log warning

## Testing Strategy

### Unit Testing

**Framework:** Jest with React Testing Library

**Test Coverage:**
1. RichTextEditor component rendering
2. useQuillEditor hook initialization and cleanup
3. useImageInsertion hook state management
4. Utility functions (quillConfig, imageHandlers)
5. Error handling for all error scenarios
6. Language tab switching logic
7. Form submission and cancellation

**Example Unit Tests:**
- Editor renders with correct toolbar
- onChange callback fires when content changes
- Image insertion adds image at cursor position
- File validation rejects invalid files
- Error messages display correctly

### Property-Based Testing

**Framework:** fast-check (already in project dependencies)

**Property Test Configuration:**
- Minimum 100 iterations per property test
- Use custom generators for HTML content, image URLs, file objects
- Tag each test with property number and requirement reference

**Key Property Tests:**
1. Formatting operations (Property 1)
2. Language isolation (Property 2)
3. HTML validity (Property 3)
4. Preview round-trip (Property 4)
5. Image insertion (Property 6)
6. File validation (Property 8)
7. Tab switching preservation (Property 11)
8. Content persistence round-trip (Property 13)
9. Filename uniqueness (Property 18)

**Custom Generators:**
```typescript
// Generate random HTML content
const htmlContentArbitrary = fc.string().map(text => `<p>${text}</p>`);

// Generate random image URLs
const imageUrlArbitrary = fc.webUrl({ validSchemes: ['http', 'https'] });

// Generate random file objects
const imageFileArbitrary = fc.record({
  name: fc.string(),
  type: fc.constantFrom('image/jpeg', 'image/png', 'image/gif', 'image/webp'),
  size: fc.integer({ min: 0, max: 10 * 1024 * 1024 })
});
```

### Integration Testing

**Test Scenarios:**
1. Complete content creation flow with rich text and images
2. Edit existing content with image insertion
3. Language switching with formatted content
4. Form submission with validation
5. Image upload from disk
6. Product image selection
7. Preview mode with complex formatting
8. Error recovery scenarios

### End-to-End Testing

**Test Flows:**
1. Admin creates new content with rich formatting and images
2. Admin edits existing content, adds images from products
3. Admin uploads custom image from disk
4. Admin switches languages and verifies content preservation
5. Admin previews content before publishing
6. Published content displays correctly on frontend

## Implementation Notes

### Quill.js Configuration

**Version:** Use latest stable version (2.x)

**Modules:**
- Toolbar: Standard formatting options + custom image button
- Clipboard: Handle paste events
- History: Undo/redo support

**Formats:**
- Block: header, list, blockquote
- Inline: bold, italic, underline, link, color
- Embed: image

**Custom Toolbar:**
```javascript
[
  [{ 'header': [1, 2, 3, false] }],
  ['bold', 'italic', 'underline'],
  [{ 'color': [] }],  // Color picker
  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
  ['link', 'image'],
  ['clean']
]
```

### Image Insertion Implementation

**Product Images:**
1. User clicks image button → dropdown appears
2. User selects "From Products" → ImagePickerModal opens
3. User selects image → modal closes, image inserted
4. Image URL is from existing product image (no upload needed)

**File Upload:**
1. User clicks image button → dropdown appears
2. User selects "Upload from Disk" → file dialog opens
3. User selects file → validation runs
4. If valid → upload to server → insert returned URL
5. If invalid → show error, no upload

### State Management

**Editor State:**
- Maintain separate Quill instances for EN and VI (or single instance with content swapping)
- Store HTML content in component state
- Sync with parent ContentForm via onChange callback
- Track preview mode state (read-only vs editable)

**Language Switching:**
1. Save current editor HTML content to state
2. Update active language
3. Load content for new language into editor
4. Preserve cursor position if possible

**Preview Mode:**
1. Toggle Quill editor's `readOnly` property to true
2. Hide toolbar when in preview mode
3. Apply preview-specific styling (optional border/background)
4. Toggle back to editable mode by setting `readOnly` to false

### Styling

**Editor Container:**
- Match existing form field styling
- Border, padding, focus states consistent with other inputs
- Minimum height: 300px
- Maximum height: 600px with scroll

**Toolbar:**
- Sticky positioning at top of editor
- Match admin panel color scheme
- Responsive on mobile devices

**Image Dropdown:**
- Position below image button
- Two options: "From Products" and "Upload from Disk"
- Icons for visual clarity

### Backend Implementation

**New Controller Method:**
```typescript
@Post('upload-image')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@UseInterceptors(FileInterceptor('file'))
async uploadContentImage(
  @UploadedFile() file: Express.Multer.File
): Promise<{ url: string; filename: string }> {
  // Validate file type and size
  // Generate unique filename
  // Save to /uploads/content/
  // Return public URL
}
```

**File Validation:**
- Allowed types: image/jpeg, image/png, image/gif, image/webp
- Max size: 5MB
- Use multer file filter

**Storage:**
- Directory: `backend/uploads/content/`
- Filename format: `content-{timestamp}-{random}.{ext}`
- Create directory if not exists

### Color Formatting Implementation

**Quill Color Module:**
- Use Quill's built-in color format
- Add color picker to toolbar: `[{ 'color': [] }]`
- Quill provides default color palette automatically
- Colors are applied as inline styles: `<span style="color: rgb(r, g, b)">text</span>`

**Custom Color Palette (Optional):**
```javascript
const colors = [
  '#000000', '#e60000', '#ff9900', '#ffff00', '#008a00', '#0066cc', '#9933ff',
  '#ffffff', '#facccc', '#ffebcc', '#ffffcc', '#cce8cc', '#cce0f5', '#ebd6ff',
  '#bbbbbb', '#f06666', '#ffc266', '#ffff66', '#66b966', '#66a3e0', '#c285ff',
  '#888888', '#a10000', '#b26b00', '#b2b200', '#006100', '#0047b2', '#6b24b2',
  '#444444', '#5c0000', '#663d00', '#666600', '#003700', '#002966', '#3d1466'
];

// Configure in toolbar
toolbar: {
  container: [
    [{ 'color': colors }]
  ]
}
```

### Image Resizing Implementation

**Quill ImageResize Module:**
- Use `quill-image-resize-module-react` package for React compatibility
- Provides drag handles for resizing
- Maintains aspect ratio by default
- Allows manual width/height adjustment

**Configuration:**
```javascript
import ImageResize from 'quill-image-resize-module-react';

Quill.register('modules/imageResize', ImageResize);

const modules = {
  toolbar: [...],
  imageResize: {
    parchment: Quill.import('parchment'),
    modules: ['Resize', 'DisplaySize', 'Toolbar']
  }
};
```

**Default Image Width:**
- Intercept image insertion in custom handler
- Set width attribute to 300px after insertion
- Implementation:
```javascript
const insertImage = (url: string) => {
  const range = quill.getSelection();
  quill.insertEmbed(range.index, 'image', url);

  // Set default width
  const img = quill.root.querySelector(`img[src="${url}"]`);
  if (img) {
    img.setAttribute('width', '300');
  }

  quill.setSelection(range.index + 1);
};
```

### Dependencies

**New Dependencies:**
```json
{
  "dependencies": {
    "quill": "^2.0.0",
    "react-quill": "^2.0.0",
    "quill-image-resize-module-react": "^3.0.0"
  },
  "devDependencies": {
    "@types/quill": "^2.0.0"
  }
}
```

**Backend Dependencies:**
- No new dependencies needed (multer already in use)

### Translation Keys

**New Translation Keys Needed:**
```json
{
  "admin": {
    "richTextEditor": {
      "en": "Rich Text Editor",
      "vi": "Trình soạn thảo văn bản"
    },
    "insertImage": {
      "en": "Insert Image",
      "vi": "Chèn hình ảnh"
    },
    "fromProducts": {
      "en": "From Products",
      "vi": "Từ sản phẩm"
    },
    "uploadFromDisk": {
      "en": "Upload from Disk",
      "vi": "Tải lên từ máy tính"
    },
    "imageUploadFailed": {
      "en": "Failed to upload image. Please try again.",
      "vi": "Không thể tải lên hình ảnh. Vui lòng thử lại."
    },
    "invalidImageType": {
      "en": "Please select a valid image file (JPEG, PNG, GIF, or WebP)",
      "vi": "Vui lòng chọn tệp hình ảnh hợp lệ (JPEG, PNG, GIF hoặc WebP)"
    },
    "imageTooLarge": {
      "en": "Image file is too large. Maximum size is 5MB.",
      "vi": "Tệp hình ảnh quá lớn. Kích thước tối đa là 5MB."
    },
    "uploadingImage": {
      "en": "Uploading image...",
      "vi": "Đang tải lên hình ảnh..."
    }
  }
}
```

## Performance Considerations

### Editor Initialization

- Lazy load Quill.js library (dynamic import)
- Initialize editor only when component mounts
- Debounce onChange events (300ms) to reduce parent re-renders

### Image Handling

- Compress images on upload (optional, future enhancement)
- Use thumbnails in product picker for faster loading
- Lazy load product images in picker modal

### Content Synchronization

- Debounce content sync between editor and state
- Use React.memo for RichTextEditor to prevent unnecessary re-renders
- Optimize language tab switching with content caching

## Security Considerations

### File Upload Security

- Validate file types on both client and server
- Sanitize filenames to prevent path traversal
- Limit file size to prevent DoS
- Store uploaded files outside web root if possible
- Use authentication/authorization for upload endpoint

### XSS Prevention

- Sanitize HTML output before saving to database
- Use DOMPurify or similar library for HTML sanitization
- Configure Quill to only allow safe HTML tags
- Escape user-generated content when rendering

### Access Control

- Require ADMIN role for content image uploads
- Validate user permissions on backend
- Use JWT authentication for API requests

## Migration Strategy

### Phase 1: Component Development
- Create RichTextEditor component
- Implement hooks and utilities
- Add unit tests

### Phase 2: Backend Implementation
- Create upload endpoint
- Add file validation
- Test upload functionality

### Phase 3: Integration
- Replace textarea in ContentForm with RichTextEditor
- Update ContentFields component
- Add translations

### Phase 4: Testing
- Property-based tests
- Integration tests
- Manual testing

### Phase 5: Deployment
- Deploy backend changes
- Deploy frontend changes
- Monitor for issues

### Rollback Plan

If issues arise:
1. Feature flag to toggle between textarea and RichTextEditor
2. Database content remains compatible (HTML in both cases)
3. Quick rollback by reverting frontend deployment
4. No data migration needed

## Color Formatting Implementation

### Color Picker Configuration

Quill provides built-in color formatting support. The color picker will be configured with a predefined palette of colors:

**Color Palette:**
```javascript
const colors = [
  // Basic colors
  '#000000', '#e60000', '#ff9900', '#ffff00', '#008a00', '#0066cc', '#9933ff',
  // Light colors
  '#ffffff', '#facccc', '#ffebcc', '#ffffcc', '#cce8cc', '#cce0f5', '#ebd6ff',
  // Medium colors
  '#bbbbbb', '#f06666', '#ffc266', '#ffff66', '#66b966', '#66a3e0', '#c285ff',
  // Dark colors
  '#888888', '#a10000', '#b26b00', '#b2b200', '#006100', '#0047b2', '#6b24b2',
  // Very dark colors
  '#444444', '#5c0000', '#663d00', '#666600', '#003700', '#002966', '#3d1466'
];
```

**Toolbar Configuration:**
```javascript
{
  'color': colors  // Predefined color palette
}
```

### Color Format Handling

- Quill stores colors as inline styles: `<span style="color: #ff0000">text</span>`
- Colors are preserved in HTML output
- No additional sanitization needed (Quill handles safe HTML generation)

## Image Resizing Implementation

### Quill ImageResize Module

To enable image resizing, we'll use the `quill-image-resize-module-react` package, which provides:
- Resize handles on images
- Aspect ratio preservation
- Real-time dimension updates
- Drag-to-resize functionality

**Installation:**
```bash
npm install quill-image-resize-module-react
```

**Module Configuration:**
```javascript
import ImageResize from 'quill-image-resize-module-react';

Quill.register('modules/imageResize', ImageResize);

const modules = {
  toolbar: [...],
  imageResize: {
    parchment: Quill.import('parchment'),
    modules: ['Resize', 'DisplaySize', 'Toolbar']
  }
};
```

**Resize Module Features:**
- **Resize:** Drag handles to resize image
- **DisplaySize:** Show current dimensions while resizing
- **Toolbar:** Optional toolbar with alignment options

**Image Dimension Storage:**
- Quill stores dimensions as inline styles: `<img src="..." style="width: 300px; height: 200px;" />`
- Dimensions are preserved in HTML output
- Aspect ratio maintained by default

### Styling Considerations

**Resize Handles:**
- Small squares at corners and edges
- Visible on hover or when image is selected
- Match admin panel color scheme

**Size Display:**
- Show dimensions (e.g., "300 x 200") while resizing
- Position near image, non-intrusive
- Auto-hide after resize complete

## Future Enhancements

1. **Advanced Color Features:** Custom color picker, recent colors, color themes
2. **Image Cropping:** Crop images within editor
3. **Video Embeds:** Support for YouTube/Vimeo embeds
4. **Tables:** Add table support to editor
5. **Code Blocks:** Syntax highlighting for code snippets
6. **Collaborative Editing:** Real-time collaboration features
7. **Auto-save:** Periodic auto-save of content
8. **Version History:** Track content changes over time
9. **Image Optimization:** Automatic image compression and format conversion
10. **Drag-and-Drop:** Drag images directly into editor
11. **Markdown Support:** Import/export markdown format
