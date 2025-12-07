# Design Document

## Overview

The Content Media Management system provides a centralized repository for managing images used in content across the application. This system addresses the current issue where uploading images from disk in the QuillJS editor creates duplicate files for each locale. By implementing a media library, administrators can upload images once and reuse them across all content items, reducing storage overhead and simplifying media management.

The system consists of three main components:
1. **Backend API** - Provides endpoints for media CRUD operations and file storage
2. **Admin Media Management Page** - A dedicated interface for browsing, uploading, and managing media
3. **Enhanced QuillJS Integration** - Modified image insertion to use the media library instead of direct file uploads

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                           │
├─────────────────────────────────────────────────────────────┤
│  Admin Media Page    │  QuillJS Editor  │  Media Picker     │
│  - Upload UI         │  - Image Button  │  - Grid Display   │
│  - Grid Display      │  - Dropdown      │  - Search/Filter  │
│  - Search/Filter     │                  │  - Selection      │
└──────────────┬───────────────────────────────────────────────┘
               │
               │ HTTP/REST API
               │
┌──────────────▼───────────────────────────────────────────────┐
│                     Backend Layer                            │
├─────────────────────────────────────────────────────────────┤
│  Content Media Module                                        │
│  ├── Controller (Routes & Validation)                       │
│  ├── Service (Business Logic)                               │
│  └── Repository (Database Access)                           │
└──────────────┬───────────────────────────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
┌───────▼──────┐ ┌───▼────────┐
│  PostgreSQL  │ │ File System│
│  (Metadata)  │ │  (Images)  │
└──────────────┘ └────────────┘
```

### Data Flow

**Upload Flow:**
1. Admin selects image file in UI
2. Frontend validates file type and size
3. File sent to backend via multipart/form-data
4. Backend validates and stores file in `/uploads/content-media/`
5. Backend creates database record with metadata
6. Backend returns media item with URL
7. Frontend updates grid display

**Insertion Flow:**
1. User clicks image button in QuillJS
2. Dropdown shows "From Media Library" option
3. Media picker modal opens with grid of available media
4. User searches/filters and selects image
5. Image URL inserted into editor at cursor position
6. Modal closes, editor retains focus

## Components and Interfaces

### Backend Components

#### 1. ContentMedia Entity (Prisma Model)

```prisma
model ContentMedia {
  id           String   @id @default(uuid())
  filename     String   // Generated unique filename
  originalName String   // Original uploaded filename
  mimeType     String   // image/jpeg, image/png, etc.
  size         Int      // File size in bytes
  url          String   // Public URL path
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([createdAt])
  @@map("content_media")
}
```

#### 2. ContentMediaService

```typescript
class ContentMediaService {
  // Upload and store media file
  async uploadMedia(file: Express.Multer.File): Promise<ContentMedia>

  // Get all media items with optional search
  async findAll(search?: string, page?: number, limit?: number): Promise<{
    items: ContentMedia[];
    total: number;
    page: number;
    totalPages: number;
  }>

  // Get single media item by ID
  async findOne(id: string): Promise<ContentMedia>

  // Delete media item and file
  async remove(id: string): Promise<void>

  // Helper: Generate unique filename
  private generateFilename(originalName: string): string

  // Helper: Validate file type
  private validateFileType(mimeType: string): boolean
}
```

#### 3. ContentMediaController

```typescript
@Controller('content-media')
export class ContentMediaController {
  @Post('upload')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  uploadMedia(@UploadedFile() file: Express.Multer.File): Promise<ContentMedia>

  @Get()
  @Roles(UserRole.ADMIN)
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ): Promise<PaginatedResponse<ContentMedia>>

  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string): Promise<ContentMedia>

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string): Promise<void>
}
```

### Frontend Components

#### 1. ContentMediaPage Component

Main admin page for media management.

```typescript
interface ContentMediaPageProps {
  locale: string;
}

// Features:
// - Upload button with file picker
// - Search/filter input
// - Responsive grid of media items
// - Pagination controls
// - Delete confirmation dialog
```

#### 2. MediaGrid Component

Displays media items in a responsive grid.

```typescript
interface MediaGridProps {
  items: ContentMedia[];
  onDelete: (id: string) => void;
  onCopyUrl: (url: string) => void;
  locale: string;
}

// Each grid item shows:
// - Thumbnail preview
// - Filename
// - Upload date
// - File size
// - Action buttons (copy URL, delete)
```

#### 3. MediaUploader Component

Handles file selection and upload.

```typescript
interface MediaUploaderProps {
  onUploadComplete: (media: ContentMedia) => void;
  onUploadError: (error: string) => void;
  locale: string;
}

// Features:
// - Drag and drop support
// - File type validation
// - Size validation
// - Upload progress indicator
```

#### 4. MediaPickerModal Component

Modal for selecting media from library (used in QuillJS).

```typescript
interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: (url: string) => void;
  locale: string;
}

// Features:
// - Search/filter
// - Grid display
// - Pagination
// - Click to select
```

#### 5. Enhanced ImageDropdown Component

Modified to include media library option.

```typescript
// Add new option:
// - From Products (existing)
// - From Media Library (new)
// - Upload from Disk (existing, but discouraged)
```

### API Client

```typescript
// frontend/lib/content-media-api.ts
export interface ContentMedia {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedMediaResponse {
  items: ContentMedia[];
  total: number;
  page: number;
  totalPages: number;
}

export const contentMediaApi = {
  upload: async (file: File): Promise<ContentMedia>
  getAll: async (search?: string, page?: number, limit?: number): Promise<PaginatedMediaResponse>
  getById: async (id: string): Promise<ContentMedia>
  delete: async (id: string): Promise<void>
}
```

## Data Models

### ContentMedia Database Schema

```sql
CREATE TABLE content_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size INTEGER NOT NULL,
  url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_media_created_at ON content_media(created_at DESC);
```

### File Storage Structure

```
uploads/
└── content-media/
    ├── media-1733600000000-abc123.jpg
    ├── media-1733600001000-def456.png
    └── media-1733600002000-ghi789.webp
```

Filename format: `media-{timestamp}-{random}.{ext}`

##
Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

After reviewing the prework analysis, many properties can be consolidated to avoid redundancy. For example, properties about displaying metadata (filename, date, size) can be combined into a single comprehensive property. Similarly, properties about storing metadata during upload can be unified.

### Property 1: File type validation rejects invalid types
*For any* file upload attempt, if the file type is not JPEG, PNG, GIF, or WebP, then the system should reject the upload with an appropriate error message.
**Validates: Requirements 1.2, 10.1**

### Property 2: File size validation rejects oversized files
*For any* file upload attempt, if the file size exceeds 5MB, then the system should reject the upload with an appropriate error message.
**Validates: Requirements 1.3, 10.2**

### Property 3: Valid uploads create complete records
*For any* valid image upload (correct type and size), the system should create both a database record and store the physical file, with the record containing all required metadata (original filename, file size, MIME type, timestamp, unique ID).
**Validates: Requirements 1.4, 7.1, 7.2, 7.3, 7.4, 7.5**

### Property 4: Upload success updates UI
*For any* successful image upload, the new media item should appear in the media library grid.
**Validates: Requirements 1.5**

### Property 5: Media grid displays complete metadata
*For any* media item in the grid, the rendered output should contain the thumbnail preview, filename, upload date, and file size.
**Validates: Requirements 2.2, 2.3, 2.4, 2.5**

### Property 6: Deletion removes both record and file
*For any* media item, when deletion is confirmed, both the database record and the physical file should be removed from the system.
**Validates: Requirements 3.2, 3.3, 9.3**

### Property 7: Deletion updates UI
*For any* successfully deleted media item, the item should no longer appear in the media library grid.
**Validates: Requirements 3.4**

### Property 8: Failed deletion preserves state
*For any* media deletion that fails, the media item should remain in both the database and the grid, and an error message should be displayed.
**Validates: Requirements 3.5**

### Property 9: Search filters by filename
*For any* search query and collection of media items, the filtered results should only include items whose filename contains the search query (case-insensitive).
**Validates: Requirements 4.1**

### Property 10: Clear search shows all items
*For any* media library state, when the search field is cleared, all media items should be displayed.
**Validates: Requirements 4.2**

### Property 11: Pagination maintains search filter
*For any* active search filter, navigating between pages should preserve the filter and show only matching results on each page.
**Validates: Requirements 4.5**

### Property 12: Pagination divides items correctly
*For any* collection of media items and page size, the pagination should divide items into pages such that each page (except possibly the last) contains exactly the specified number of items.
**Validates: Requirements 4.4**

### Property 13: Media insertion uses existing URL
*For any* media item selected from the library, inserting it into the QuillJS editor should use the existing image URL without creating a new file or duplicate.
**Validates: Requirements 5.3, 5.4**

### Property 14: Copied URLs are valid
*For any* media item, when the copy URL action is performed, the copied URL should be a valid public path that resolves to the image.
**Validates: Requirements 6.1, 6.4**

### Property 15: Non-admin access is blocked
*For any* non-admin user, attempts to access the media management page or API endpoints should be rejected with an unauthorized error.
**Validates: Requirements 8.3, 9.5**

### Property 16: API upload validates and stores
*For any* POST request to the upload endpoint with a valid file, the API should validate the file and store it, returning the complete media metadata.
**Validates: Requirements 9.1**

### Property 17: API list returns complete metadata
*For any* GET request to the media list endpoint, the API should return all media items with complete metadata (id, filename, originalName, mimeType, size, url, timestamps).
**Validates: Requirements 9.2**

### Property 18: API get by ID returns metadata
*For any* existing media item ID, a GET request to the specific item endpoint should return the complete metadata for that item.
**Validates: Requirements 9.4**

### Property 19: Upload errors preserve state
*For any* upload that fails (due to validation, network, or server errors), the media library should remain in its previous state with no partial records or files created.
**Validates: Requirements 10.5**

## Error Handling

### Client-Side Error Handling

**File Validation Errors:**
- Invalid file type: "Please select a valid image file (JPEG, PNG, GIF, or WebP)"
- File too large: "File size exceeds 5MB limit. Please select a smaller file"
- No file selected: "Please select a file to upload"

**Network Errors:**
- Upload timeout: "Upload timed out. Please check your connection and try again"
- Connection lost: "Connection lost. Please check your internet connection"
- Server unreachable: "Unable to reach server. Please try again later"

**Operation Errors:**
- Delete failed: "Failed to delete media item. Please try again"
- Copy failed: "Failed to copy URL to clipboard"
- Load failed: "Failed to load media library. Please refresh the page"

### Server-Side Error Handling

**Validation Errors (400):**
- Invalid file type
- File size exceeded
- Missing required fields
- Invalid media ID format

**Authorization Errors (401/403):**
- User not authenticated
- User not authorized (non-admin)

**Not Found Errors (404):**
- Media item not found
- File not found on disk

**Server Errors (500):**
- File system write failure
- Database operation failure
- Unexpected errors

**Error Response Format:**
```typescript
{
  statusCode: number;
  message: string;
  error?: string;
}
```

### Error Recovery Strategies

1. **Upload Failures:** Retry mechanism with exponential backoff
2. **Deletion Failures:** Rollback database changes if file deletion fails
3. **File System Errors:** Log errors and notify administrators
4. **Partial State:** Transaction-based operations to prevent inconsistency

## Testing Strategy

### Unit Testing

**Backend Unit Tests:**
- ContentMediaService methods (upload, findAll, findOne, remove)
- File validation logic
- Filename generation
- Error handling for each operation
- Database operations with mocked Prisma client

**Frontend Unit Tests:**
- MediaGrid component rendering
- MediaUploader file validation
- Search and filter logic
- Pagination calculations
- URL copy functionality
- API client methods

**Test Coverage Goals:**
- Service layer: 90%+
- Component logic: 85%+
- API client: 90%+

### Property-Based Testing

Property-based tests will use **fast-check** (TypeScript/JavaScript property testing library) configured to run a minimum of 100 iterations per test.

Each property-based test must be tagged with a comment explicitly referencing the correctness property from this design document using the format: `**Feature: content-media-management, Property {number}: {property_text}**`

**Backend Property Tests:**
- Property 1: File type validation (generate random file types)
- Property 2: File size validation (generate files of various sizes)
- Property 3: Valid uploads create complete records (generate valid images)
- Property 6: Deletion removes both record and file (generate media items)
- Property 16: API upload validates and stores (generate upload requests)
- Property 17: API list returns complete metadata (generate media collections)
- Property 18: API get by ID returns metadata (generate media items)
- Property 19: Upload errors preserve state (simulate failures)

**Frontend Property Tests:**
- Property 5: Media grid displays complete metadata (generate media items)
- Property 7: Deletion updates UI (generate media items and deletions)
- Property 9: Search filters by filename (generate media items and queries)
- Property 10: Clear search shows all items (generate media collections)
- Property 11: Pagination maintains search filter (generate items and queries)
- Property 12: Pagination divides items correctly (generate various collection sizes)
- Property 13: Media insertion uses existing URL (generate media selections)
- Property 14: Copied URLs are valid (generate media items)

**Integration Property Tests:**
- Property 15: Non-admin access is blocked (generate user roles)

### Integration Testing

**End-to-End Flows:**
1. Upload → Display → Delete flow
2. Upload → Search → Select → Insert into editor flow
3. Upload → Copy URL → Verify accessibility flow
4. Pagination with search filter flow
5. Authorization checks for all endpoints

**Test Scenarios:**
- Multiple concurrent uploads
- Large media library (1000+ items)
- Search with special characters
- Pagination edge cases (empty results, single page)
- Network interruption during upload
- File system permission errors

### Manual Testing Checklist

- [ ] Upload various image formats (JPEG, PNG, GIF, WebP)
- [ ] Attempt upload of invalid file types
- [ ] Attempt upload of oversized files
- [ ] Verify responsive grid layout on different screen sizes
- [ ] Test search functionality with various queries
- [ ] Test pagination with different page sizes
- [ ] Delete media and verify file removal
- [ ] Insert media into QuillJS editor
- [ ] Copy URL and verify it works in browser
- [ ] Test as non-admin user (should be blocked)
- [ ] Test with slow network connection
- [ ] Test with JavaScript disabled (graceful degradation)

## Implementation Notes

### File Storage Considerations

1. **Directory Structure:** Use dedicated `/uploads/content-media/` directory
2. **Filename Generation:** Include timestamp and random string to prevent collisions
3. **File Permissions:** Ensure web server can read files but not execute
4. **Cleanup Strategy:** Consider implementing orphaned file cleanup job

### Performance Considerations

1. **Thumbnail Generation:** Consider generating thumbnails for faster grid loading
2. **Lazy Loading:** Implement lazy loading for large media libraries
3. **Caching:** Cache media list on frontend with invalidation on changes
4. **Pagination:** Default to 20-50 items per page for optimal performance

### Security Considerations

1. **File Validation:** Validate both MIME type and file extension
2. **File Size Limits:** Enforce 5MB limit at both frontend and backend
3. **Authorization:** Require admin role for all media operations
4. **Path Traversal:** Sanitize filenames to prevent directory traversal attacks
5. **Content-Type Headers:** Serve images with correct Content-Type headers

### Migration Strategy

1. **Existing Content Images:** No migration needed - existing images in `/uploads/content/` remain unchanged
2. **QuillJS Integration:** Add new "From Media Library" option alongside existing options
3. **Gradual Adoption:** Admins can continue using "Upload from Disk" during transition
4. **Future Deprecation:** Consider deprecating "Upload from Disk" after media library is established

### Accessibility Considerations

1. **Keyboard Navigation:** Full keyboard support for grid navigation and selection
2. **Screen Readers:** Proper ARIA labels for all interactive elements
3. **Focus Management:** Maintain logical focus order throughout interactions
4. **Alt Text:** Consider adding alt text field to media metadata (future enhancement)
5. **Color Contrast:** Ensure all text meets WCAG AA standards

## Future Enhancements

1. **Image Editing:** Basic crop/resize functionality
2. **Bulk Operations:** Select multiple items for deletion
3. **Folders/Categories:** Organize media into folders
4. **Alt Text Management:** Add alt text field for accessibility
5. **Usage Tracking:** Track where each media item is used
6. **Automatic Cleanup:** Delete unused media after X days
7. **CDN Integration:** Serve media from CDN for better performance
8. **Image Optimization:** Automatic compression and format conversion
