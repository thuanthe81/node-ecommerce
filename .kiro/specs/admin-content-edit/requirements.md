# Requirements Document

## Introduction

This feature adds a dedicated edit page for content items in the admin panel. Currently, the ContentForm component exists and supports editing all content properties, but there is no route or page implementation at `/admin/content/[id]` to allow administrators to edit existing content items. This feature will create the missing edit page that utilizes the existing ContentForm component.

## Glossary

- **Content Management System (CMS)**: The admin interface for managing content items
- **Content Item**: A piece of content with properties including slug, type, titles, content body, images, links, display order, and publication status
- **Content Form**: The existing reusable form component that handles content creation and editing
- **Edit Page**: A dedicated page route that loads an existing content item and allows modification of all its properties
- **Admin Panel**: The administrative interface accessible at `/admin/*` routes
- **HOMEPAGE_SECTION**: A content type used for homepage sections with additional fields for buttons and layout configuration
- **BANNER**: A content type used for promotional banners with image and link URLs

## Requirements

### Requirement 1

**User Story:** As an administrator, I want to navigate to a content edit page, so that I can modify existing content items.

#### Acceptance Criteria

1. WHEN an administrator navigates to `/admin/content/[id]` THEN the system SHALL display the content edit page with the existing content loaded
2. WHEN the content item does not exist THEN the system SHALL display an appropriate error message
3. WHEN the content is loading THEN the system SHALL display a loading indicator
4. WHEN the page loads successfully THEN the system SHALL populate the ContentForm with all existing content properties

### Requirement 2

**User Story:** As an administrator, I want to edit all properties of a content item, so that I can update any aspect of the content.

#### Acceptance Criteria

1. WHEN the edit form is displayed THEN the system SHALL allow editing of the slug field
2. WHEN the edit form is displayed THEN the system SHALL allow editing of the content type field
3. WHEN the edit form is displayed THEN the system SHALL allow editing of both English and Vietnamese titles
4. WHEN the edit form is displayed THEN the system SHALL allow editing of both English and Vietnamese content bodies
5. WHEN the content type is BANNER THEN the system SHALL allow editing of imageUrl and linkUrl fields
6. WHEN the edit form is displayed THEN the system SHALL allow editing of the displayOrder field
7. WHEN the edit form is displayed THEN the system SHALL allow toggling the isPublished status
8. WHEN the content type is HOMEPAGE_SECTION THEN the system SHALL allow editing of imageUrl, buttonTextEn, buttonTextVi, and layout fields
9. WHEN the content type is HOMEPAGE_SECTION THEN the system SHALL allow selection of layout from centered, image-left, or image-right options

### Requirement 3

**User Story:** As an administrator, I want to save my content edits, so that the changes are persisted to the database.

#### Acceptance Criteria

1. WHEN an administrator submits valid content updates THEN the system SHALL save the changes to the database
2. WHEN the save operation succeeds THEN the system SHALL redirect the administrator to the content list page
3. WHEN the save operation fails THEN the system SHALL display an error message and retain the form data
4. WHEN an administrator clicks cancel THEN the system SHALL navigate back to the content list without saving changes

### Requirement 4

**User Story:** As an administrator, I want proper validation on content edits, so that I cannot save invalid data.

#### Acceptance Criteria

1. WHEN required fields are empty THEN the system SHALL prevent form submission and display validation errors
2. WHEN URL fields contain invalid URLs THEN the system SHALL display validation errors
3. WHEN the slug contains invalid characters THEN the system SHALL display validation errors
4. WHEN all validation passes THEN the system SHALL allow form submission
