# Requirements Document

## Introduction

This feature enhances the admin panel's left-side navigation by adding sub-items under the "Content" menu item. Each content type (PAGE, FAQ, BANNER, HOMEPAGE_SECTION) will have its own dedicated navigation link, allowing administrators to quickly access specific content types without needing to filter on the main content page.

## Glossary

- **Admin Panel**: The administrative interface for managing the e-commerce platform
- **Left-Side Navigator**: The vertical navigation menu on the left side of the admin panel
- **Content**: User-facing text, images, and information managed through the CMS
- **Content Type**: A category of content (PAGE, FAQ, BANNER, HOMEPAGE_SECTION)
- **Sub-Item**: A nested navigation link that appears under a parent menu item
- **AdminLayout Component**: The React component that renders the admin panel layout and navigation

## Requirements

### Requirement 1

**User Story:** As an administrator, I want to see expandable sub-items under the Content menu in the left-side navigator, so that I can quickly navigate to specific content types without filtering.

#### Acceptance Criteria

1. WHEN the admin panel loads THEN the Content menu item SHALL display an expandable/collapsible indicator
2. WHEN an administrator clicks the Content menu item THEN the system SHALL expand or collapse the sub-items list
3. WHEN the Content menu is expanded THEN the system SHALL display sub-items for each content type (Pages, FAQs, Banners, Homepage Sections)
4. WHEN an administrator clicks a content type sub-item THEN the system SHALL navigate to the content list page and display only content items of that specific type
5. WHEN viewing a content type-specific page THEN the system SHALL highlight the active sub-item in the navigation and show the filtered content list

### Requirement 2

**User Story:** As an administrator, I want the navigation state to persist during my session, so that the menu remains expanded or collapsed as I navigate between pages.

#### Acceptance Criteria

1. WHEN an administrator expands the Content menu THEN the system SHALL maintain the expanded state when navigating to other admin pages
2. WHEN an administrator collapses the Content menu THEN the system SHALL maintain the collapsed state when navigating to other admin pages
3. WHEN an administrator refreshes the page THEN the system SHALL restore the previous expansion state from session storage
4. WHEN the current route matches a content type sub-item THEN the system SHALL automatically expand the Content menu

### Requirement 3

**User Story:** As an administrator, I want the content type sub-items to be properly translated, so that I can use the admin panel in my preferred language (English or Vietnamese).

#### Acceptance Criteria

1. WHEN the admin panel displays in English THEN the system SHALL show content type labels in English (Pages, FAQs, Banners, Homepage Sections)
2. WHEN the admin panel displays in Vietnamese THEN the system SHALL show content type labels in Vietnamese
3. WHEN switching languages THEN the system SHALL update all content type labels immediately
4. WHEN adding new content types THEN the system SHALL require translation keys for both English and Vietnamese

### Requirement 4

**User Story:** As an administrator, I want the navigation to be visually clear and accessible, so that I can easily distinguish between parent items and sub-items.

#### Acceptance Criteria

1. WHEN viewing the navigation THEN the system SHALL indent sub-items to visually distinguish them from parent items
2. WHEN hovering over sub-items THEN the system SHALL provide visual feedback with hover states
3. WHEN a sub-item is active THEN the system SHALL apply distinct styling to indicate the current page
4. WHEN using keyboard navigation THEN the system SHALL allow tab navigation through all menu items and sub-items
5. WHEN using screen readers THEN the system SHALL announce the hierarchical relationship between parent and sub-items
