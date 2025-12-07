# MediaGrid Component

A responsive grid component for displaying and managing content media items in the admin panel.

## Features

- **Responsive Grid Layout**: Adapts from 2 columns on mobile to 5 columns on extra-large screens
- **Media Item Display**: Shows thumbnail, filename, upload date, and file size for each item
- **Delete Functionality**: Confirmation dialog before deletion with preview of item being deleted
- **Copy URL**: One-click URL copying to clipboard with visual feedback
- **Empty State**: User-friendly message when no media items exist
- **Loading State**: Spinner and message during data fetching

## Usage

```tsx
import { MediaGrid } from '@/components/MediaGrid';
import { contentMediaApi } from '@/lib/content-media-api';

function ContentMediaPage() {
  const [items, setItems] = useState<ContentMedia[]>([]);
  const [loading, setLoading] = useState(true);

  const handleDelete = async (id: string) => {
    await contentMediaApi.delete(id);
    // Refresh the list
    setItems(items.filter(item => item.id !== id));
  };

  const handleCopyUrl = (url: string) => {
    // Show success toast/notification
    console.log('URL copied:', url);
  };

  return (
    <MediaGrid
      items={items}
      onDelete={handleDelete}
      onCopyUrl={handleCopyUrl}
      locale="en"
      loading={loading}
    />
  );
}
```

## Props

### MediaGridProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `items` | `ContentMedia[]` | Yes | Array of media items to display |
| `onDelete` | `(id: string) => void` | Yes | Callback when a media item is deleted |
| `onCopyUrl` | `(url: string) => void` | Yes | Callback when a media URL is copied |
| `locale` | `string` | Yes | Current locale for translations ('en' or 'vi') |
| `loading` | `boolean` | No | Loading state (default: false) |

## Component Structure

```
MediaGrid/
├── MediaGrid.tsx              # Main component
├── index.tsx                  # Export entry point
├── types.ts                   # TypeScript interfaces
├── components/
│   ├── MediaGridItem.tsx      # Individual media item card
│   ├── DeleteConfirmDialog.tsx # Delete confirmation modal
│   └── EmptyState.tsx         # Empty state display
├── hooks/
│   └── useMediaGrid.ts        # State management hook
└── utils/
    └── formatters.ts          # Utility functions for formatting
```

## Sub-Components

### MediaGridItem

Displays an individual media item with:
- Square aspect ratio image preview
- Filename (truncated with ellipsis)
- Upload date (localized format)
- File size (human-readable format)
- Copy URL button
- Delete button

### DeleteConfirmDialog

Modal dialog that:
- Shows media item preview
- Displays filename and size
- Requires explicit confirmation
- Shows loading state during deletion
- Prevents accidental deletions

### EmptyState

Friendly empty state that:
- Shows an image icon
- Displays "No media items" message
- Encourages user to upload first media item

## Utilities

### formatFileSize(bytes: number): string

Converts bytes to human-readable format (Bytes, KB, MB, GB).

```tsx
formatFileSize(1024) // "1 KB"
formatFileSize(1536000) // "1.46 MB"
```

### formatDate(dateString: string, locale: string): string

Formats ISO date string to localized format.

```tsx
formatDate('2024-01-15T10:30:00Z', 'en') // "Jan 15, 2024"
formatDate('2024-01-15T10:30:00Z', 'vi') // "15 thg 1, 2024"
```

### getFullUrl(url: string): string

Converts relative URLs to absolute URLs.

```tsx
getFullUrl('/uploads/content/image.jpg')
// "http://localhost:3001/uploads/content/image.jpg"
```

## Translations

All user-facing text is translated using `next-intl`. Translation keys are under `admin.contentMedia`:

- `confirmDelete`: Dialog title
- `confirmDeleteMessage`: Confirmation message
- `cancel`: Cancel button
- `delete`: Delete button
- `deleting`: Deleting state
- `copyUrl`: Copy URL button
- `urlCopied`: Success message
- `noMediaItems`: Empty state title
- `uploadFirstMedia`: Empty state message
- `loading`: Loading state message

## Accessibility

- Semantic HTML structure
- Proper ARIA labels and roles
- Keyboard navigation support
- Focus management in modal dialogs
- Alt text for images
- Color contrast compliance

## Requirements Validated

This component validates the following requirements from the design document:

- **Requirement 2.1**: Displays all media items in a responsive grid layout
- **Requirement 2.2**: Shows thumbnail previews
- **Requirement 2.3**: Shows filename for each image
- **Requirement 2.4**: Shows upload date for each image
- **Requirement 2.5**: Shows file size for each image
- **Requirement 3.1**: Delete button with confirmation dialog
- **Requirement 6.1**: Copy URL button with clipboard functionality
