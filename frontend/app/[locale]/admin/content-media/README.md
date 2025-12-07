# Content Media Management Page

This page provides a centralized interface for managing content media (images) used across the site.

## Features

- **Upload Media**: Drag-and-drop or click to upload images (JPEG, PNG, GIF, WebP up to 5MB)
- **View Media Grid**: Responsive grid display of all uploaded media items
- **Search**: Filter media items by filename
- **Pagination**: Navigate through large media libraries (20 items per page)
- **Delete Media**: Remove media items with confirmation dialog
- **Copy URLs**: Copy media URLs to clipboard for use elsewhere

## Components Used

- `MediaUploader`: Handles file upload with drag-and-drop support
- `MediaGrid`: Displays media items in a responsive grid
- `AdminProtectedRoute`: Ensures only admin users can access
- `AdminLayout`: Provides consistent admin page layout

## State Management

The page manages the following state:
- `mediaItems`: Array of media items to display
- `loading`: Loading state for API calls
- `searchQuery`: Current search input value
- `currentSearch`: Active search filter
- `page`: Current pagination page
- `totalPages`: Total number of pages
- `error`: Error message to display
- `successMessage`: Success message to display

## API Integration

Uses `contentMediaApi` from `@/lib/content-media-api`:
- `getAll()`: Fetch media items with search and pagination
- `delete()`: Delete a media item

## Translations

All user-facing text uses translations from `admin.contentMedia` namespace:
- `title`: Page title
- `description`: Page description
- `searchPlaceholder`: Search input placeholder
- `search`: Search button text
- `clearSearch`: Clear search button text
- `noResults`: No results message
- `noMediaItems`: Empty state message
- `uploadSuccess`: Upload success message
- `deleteSuccess`: Delete success message
- `loadError`: Load error message
- And more...

## Requirements Validated

This page validates the following requirements from the design document:
- **1.1**: Display interface for uploading new images
- **2.1**: Display all media items in responsive grid layout
- **4.1**: Filter media items by filename
- **4.2**: Clear search to display all items
- **4.3**: Display message when no results found
- **4.4**: Implement pagination
- **4.5**: Maintain search filter when navigating pages

## Usage

Navigate to `/[locale]/admin/content-media` as an admin user to access the page.

Example URLs:
- `/en/admin/content-media`
- `/vi/admin/content-media`
