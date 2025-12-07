# MediaPickerModal Component

A modal component for selecting images from the content media library. Used in rich text editors to insert existing media without creating duplicates.

## Features

- **Modal Display**: Full-screen modal with media grid
- **Search Functionality**: Filter media items by filename
- **Pagination**: Navigate through large media libraries
- **Media Selection**: Click to select and insert media
- **Focus Management**: Proper focus handling on open/close
- **Responsive Design**: Works on all screen sizes
- **Accessibility**: Full keyboard navigation and ARIA labels

## Usage

```tsx
import { MediaPickerModal } from '@/components/MediaPickerModal';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectMedia = (url: string) => {
    // Insert the media URL into your editor or component
    console.log('Selected media URL:', url);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Select from Media Library
      </button>

      <MediaPickerModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSelectMedia={handleSelectMedia}
        locale="en"
      />
    </>
  );
}
```

## Props

### MediaPickerModalProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | Yes | Whether the modal is open |
| `onClose` | `() => void` | Yes | Callback when modal is closed |
| `onSelectMedia` | `(url: string) => void` | Yes | Callback when a media item is selected |
| `locale` | `string` | Yes | Current locale for translations ('en' or 'vi') |

## Component Structure

```
MediaPickerModal/
├── MediaPickerModal.tsx       # Main component
├── index.tsx                  # Export entry point
├── types.ts                   # TypeScript interfaces
├── components/                # Sub-components
│   ├── ModalHeader.tsx       # Header with search
│   ├── ModalBody.tsx         # Media grid display
│   └── ModalFooter.tsx       # Pagination and close
├── hooks/                     # Custom hooks
│   └── useMediaPicker.ts     # State management
└── __tests__/                 # Tests
    └── MediaPickerModal.test.tsx
```

## Features in Detail

### Search and Filter

The modal includes a search bar that filters media items by filename:

- Type in the search field
- Press Enter or click Search button
- Results update in real-time
- Clear button to reset search

### Pagination

For large media libraries, the modal implements pagination:

- 20 items per page by default
- Previous/Next buttons
- Current page indicator
- Maintains search filter across pages

### Media Selection

Click any media item to select it:

- Hover effect shows filename
- Click to select and close modal
- Selected URL is passed to `onSelectMedia` callback
- Modal closes automatically after selection

### Focus Management

The modal properly manages focus:

- Focus trapped within modal when open
- Returns focus to trigger element on close
- Keyboard navigation supported
- ESC key closes modal (via close button)

## Accessibility

- **ARIA Labels**: All interactive elements have proper labels
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper semantic HTML and ARIA attributes
- **Focus Management**: Focus trapped and restored correctly
- **Role Attributes**: Modal has `role="dialog"` and `aria-modal="true"`

## Integration with RichTextEditor

This component is designed to be integrated with the QuillJS rich text editor:

```tsx
// In RichTextEditor component
import { MediaPickerModal } from '@/components/MediaPickerModal';

function RichTextEditor() {
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const handleSelectMedia = (url: string) => {
    // Insert image into Quill editor
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const range = quill.getSelection(true);
      quill.insertEmbed(range.index, 'image', url);
    }
  };

  return (
    <>
      {/* Editor toolbar with "From Media Library" option */}
      <button onClick={() => setShowMediaPicker(true)}>
        From Media Library
      </button>

      <MediaPickerModal
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelectMedia={handleSelectMedia}
        locale={locale}
      />
    </>
  );
}
```

## Translations

All text is translated using `next-intl`. Translation keys are under `admin.contentMedia`:

- `title`: Modal title
- `searchPlaceholder`: Search input placeholder
- `search`: Search button text
- `clearSearch`: Clear search button text
- `loading`: Loading state text
- `noMediaItems`: Empty state message
- `noResults`: No search results message
- `page`, `of`, `previous`, `next`: Pagination text
- `cancel`: Close button text

## Requirements Validated

This component satisfies the following requirements from the design document:

- **Requirement 5.2**: Opens modal displaying all available media items
- **Requirement 5.3**: Allows clicking on media item to select
- **Requirement 5.4**: Uses existing image URL without creating duplicates
- **Requirement 5.5**: Returns focus to editor when modal closes

## Testing

Run tests with:

```bash
npm test -- MediaPickerModal.test.tsx
```

Tests cover:
- Modal open/close behavior
- Media loading and display
- Search functionality
- Pagination
- Media selection
- Focus management
