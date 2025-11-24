# Homepage Sections Admin Interface

This admin interface allows you to create and manage content sections that appear on the homepage below the carousel.

## Features

### List View (`/admin/homepage-sections`)
- View all homepage sections ordered by display order
- See section status (Published/Draft)
- Quick access to edit and delete actions
- Create new sections

### Create New Section (`/admin/homepage-sections/new`)
- Bilingual form (English/Vietnamese)
- Three layout options:
  - **Centered**: Text-only layout with centered content (no image required)
  - **Image Left**: Image on left, content on right
  - **Image Right**: Content on left, image on right
- Live preview panel that updates as you type
- Required fields validation
- Conditional image requirement based on layout

### Edit Section (`/admin/homepage-sections/[id]/edit`)
- Load existing section data
- Same form and preview functionality as create
- Update all section properties

## Form Fields

### Required Fields
- **Title (EN/VI)**: Section heading
- **Description (EN/VI)**: Section content/description
- **Button Text (EN/VI)**: Call-to-action button label
- **Button URL**: Where the button should navigate
- **Layout Type**: Visual arrangement (centered, image-left, image-right)
- **Display Order**: Numeric order (lower numbers appear first)

### Optional Fields
- **Image URL**: Required for image-left and image-right layouts, optional for centered
- **Published**: Toggle to show/hide section on homepage

## Layout Types

### Centered
- No image
- Centered text alignment
- Best for text-focused announcements or calls-to-action

### Image Left
- Image on left side (50% width)
- Content on right side with left-aligned text
- Requires image URL

### Image Right
- Content on left side with right-aligned text
- Image on right side (50% width)
- Requires image URL

## Preview Panel

The live preview panel shows:
- Real-time updates as you edit
- Language toggle (EN/VI) to preview both versions
- Scaled-down version of how the section will appear on homepage
- Responsive to layout changes

## Tips

1. **Display Order**: Use increments of 10 (10, 20, 30) to make it easier to insert sections later
2. **Image URLs**: Use high-quality images (recommended: 1200x900px or similar aspect ratio)
3. **Button URLs**: Can be internal (`/products`) or external (`https://example.com`)
4. **Draft Mode**: Create sections as drafts to preview before publishing
5. **Bilingual Content**: Always fill both English and Vietnamese fields for complete localization

## Validation Rules

- All text fields are required in both languages
- Button URL must be a valid URL format
- Image URL is required for image-left and image-right layouts
- Image URL is optional for centered layout
- Layout type must be one of: centered, image-left, image-right

## API Endpoints Used

- `GET /content?type=HOMEPAGE_SECTION` - List all sections
- `GET /content/:id` - Get single section
- `POST /content` - Create new section
- `PATCH /content/:id` - Update section
- `DELETE /content/:id` - Delete section
- `GET /content/homepage-sections` - Get published sections (public endpoint)
