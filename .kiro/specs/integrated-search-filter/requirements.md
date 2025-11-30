# Requirements Document

## Introduction

This feature redesigns the products page filtering experience by removing the separate FilterPanel sidebar and integrating all filtering capabilities directly into an enhanced search input component. The goal is to create a more streamlined, intuitive search and filter experience where users can search for products and apply category filters from a single, unified interface.

## Glossary

- **SearchFilterBar**: The enhanced search input component that combines text search with category filtering
- **FilterPanel**: The existing sidebar component that will be removed
- **Category Dropdown**: A dropdown selector integrated into the search input area for filtering by category
- **Products Page**: The main page displaying the product grid at `/products`
- **Query Parameters**: URL parameters used to maintain filter and search state

## Requirements

### Requirement 1

**User Story:** As a user, I want to search for products and filter by category from a single search interface, so that I can quickly find products without navigating through multiple UI elements.

#### Acceptance Criteria

1. WHEN a user visits the products page THEN the system SHALL display a unified search interface with an integrated category dropdown
2. WHEN a user types in the search input THEN the system SHALL filter products based on the search query
3. WHEN a user selects a category from the dropdown THEN the system SHALL filter products to show only items from that category
4. WHEN a user combines search text with a category filter THEN the system SHALL apply both filters simultaneously
5. WHEN filter parameters change THEN the system SHALL update the URL query parameters to reflect the current state

### Requirement 2

**User Story:** As a user, I want the category dropdown to be easily accessible within the search area, so that I can quickly switch between categories while searching.

#### Acceptance Criteria

1. WHEN the search interface renders THEN the system SHALL display a category dropdown selector positioned to the left of the search input
2. WHEN a user clicks the category dropdown THEN the system SHALL display all available categories
3. WHEN no category is selected THEN the system SHALL display a default option indicating "All Categories"
4. WHEN a category is selected THEN the system SHALL visually indicate the active category filter
5. WHEN categories are loaded from the API THEN the system SHALL display category names in the user's current locale

### Requirement 3

**User Story:** As a user, I want the existing FilterPanel sidebar removed, so that I have more screen space for viewing products.

#### Acceptance Criteria

1. WHEN the products page renders THEN the system SHALL NOT display the FilterPanel sidebar component
2. WHEN the products page layout renders THEN the system SHALL use a full-width layout for the product grid
3. WHEN the FilterPanel is removed THEN the system SHALL preserve all existing filtering functionality through the new search interface
4. WHEN viewing on mobile devices THEN the system SHALL display the search interface in a mobile-optimized layout

### Requirement 4

**User Story:** As a user, I want my search and filter selections to persist in the URL, so that I can bookmark or share specific product searches.

#### Acceptance Criteria

1. WHEN a user enters a search query THEN the system SHALL add a "search" parameter to the URL
2. WHEN a user selects a category THEN the system SHALL add a "categoryId" parameter to the URL
3. WHEN a user clears the search input THEN the system SHALL remove the "search" parameter from the URL
4. WHEN a user selects "All Categories" THEN the system SHALL remove the "categoryId" parameter from the URL
5. WHEN a user navigates to a URL with existing search parameters THEN the system SHALL initialize the search interface with those values

### Requirement 5

**User Story:** As a user, I want to clear my search and filters easily, so that I can start a fresh product search.

#### Acceptance Criteria

1. WHEN filters are active THEN the system SHALL display a clear/reset button or mechanism
2. WHEN a user clicks the clear button THEN the system SHALL reset the search input to empty
3. WHEN a user clicks the clear button THEN the system SHALL reset the category dropdown to "All Categories"
4. WHEN filters are cleared THEN the system SHALL remove all filter-related query parameters from the URL
5. WHEN filters are cleared THEN the system SHALL display all products without filters applied

### Requirement 6

**User Story:** As a user, I want the search interface to be responsive and accessible, so that I can use it effectively on any device.

#### Acceptance Criteria

1. WHEN the search interface renders THEN the system SHALL meet WCAG 2.1 Level AA accessibility standards
2. WHEN using keyboard navigation THEN the system SHALL allow users to tab between search input and category dropdown
3. WHEN using a screen reader THEN the system SHALL announce filter changes and search results
4. WHEN viewing on mobile devices THEN the system SHALL stack or optimize the search input and category dropdown for small screens
5. WHEN touch targets are rendered on mobile THEN the system SHALL ensure minimum 44x44 pixel touch target sizes
