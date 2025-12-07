# MediaUploader Component

A React component for uploading images to the content media library with drag-and-drop support and client-side validation.

## Features

- **Drag-and-Drop Support**: Users can drag files directly onto the upload zone
- **Click to Browse**: Traditional file selection via button click
- **Client-Side Validation**:
  - File type validation (JPEG, PNG, GIF, WebP only)
  - File size validation (5MB maximum)
- **Upload Progress**: Visual indicator during upload
- **Error Handling**: Clear error messages for validation and upload failures
- **Localization**: Full support for English and Vietnamese

## Usage

```tsx
import { MediaUploader } from '@/components/MediaUploader';

function MyComponent() {
  const handleUploadComplete = (media: ContentMedia) => {
    console.log('Upload successful:', media);
    // Update your UI with the new media item
  };

  const handleUploadError = (error: string) => {
    console.error('Upload failed:', error);
    // Show error message to user
  };

  return (
    <MediaUploader
      onUploadComplete={handleUploadComplete}
      onUploadError={handleUploadError}
      locale="en"
    />
  );
}
```

## Props

### MediaUploaderProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onUploadComplete` | `(media: ContentMedia) => void` | Yes | Callback when upload completes successfully |
| `onUploadError` | `(error: string) => void` | Yes | Callback when upload fails |
| `locale` | `string` | Yes | Current locale for translations ('en' or 'vi') |

## File Validation

The component validates files before uploading:

### Accepted File Types
- JPEG (image/jpeg)
- PNG (image/png)
- GIF (image/gif)
- WebP (image/webp)

### File Size Limit
- Maximum: 5MB

## Error Messages

The component provides localized error messages for:
- Invalid file type
- File size exceeded
- Network errors
- Server errors

## Component Structure

```
MediaUploader/
├── MediaUploader.tsx          # Main component
├── index.tsx                  # Export entry point
├── types.ts                   # TypeScript interfaces
├── components/                # Sub-components
│   ├── UploadZone.tsx        # Drag-and-drop zone
│   └── UploadProgress.tsx    # Upload progress indicator
├── hooks/                     # Custom hooks
│   └── useMediaUpload.ts     # Upload logic and state
└── __tests__/                 # Tests
    └── MediaUploader.test.tsx
```

## Implementation Details

### Client-Side Validation

The component performs validation before making API calls:

1. **File Type Check**: Validates MIME type against allowed types
2. **File Size Check**: Ensures file doesn't exceed 5MB limit
3. **Error Feedback**: Immediate feedback to user without server round-trip

### Upload Flow

1. User selects or drops a file
2. Client-side validation runs
3. If valid, upload progress indicator appears
4. File is uploaded via API
5. On success, `onUploadComplete` is called with media metadata
6. On error, `onUploadError` is called with error message

### Accessibility

- Hidden file input with proper ARIA label
- Keyboard accessible upload button
- Clear visual feedback for drag-and-drop state
- Screen reader friendly error messages

## Related Components

- **MediaGrid**: Displays uploaded media items
- **MediaPickerModal**: Allows selecting media from library
- **ContentMediaPage**: Admin page that uses MediaUploader

## API Integration

Uses the `contentMediaApi.upload()` method from `@/lib/content-media-api` to upload files to the backend.

## Requirements Satisfied

This component satisfies the following requirements from the Content Media Management spec:

- **Requirement 1.1**: Display interface for uploading new images
- **Requirement 1.2**: Validate file type (JPEG, PNG, GIF, WebP)
- **Requirement 1.3**: Validate file size (max 5MB)
- **Requirement 10.1**: Display error for invalid file type
- **Requirement 10.2**: Display error for oversized file
