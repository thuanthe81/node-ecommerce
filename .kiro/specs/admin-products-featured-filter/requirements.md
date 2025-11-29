# Requirements Document

## Introduction

The admin products page currently supports filtering by stock status (in stock/out of stock) but lacks a filter for featured products. Since the Product model already includes an `isFeatured` field and the backend API supports filtering by this field, this feature will add a "Featured" filter dropdown to the admin products page to allow administrators to filter products by their featured status.

## Glossary

- **Admin Products Page**: The administrative interface at `/admin/products` where administrators manage product listings
- **Featured Product**: A product with the `isFeatured` field set to true, typically highlighted on the storefront
- **Filter Control**: A dropdown UI element that allows filtering the product list by specific criteria
- **Product Query System**: The backend API endpoint that accepts filter parameters and returns filtered product results

## Requirements

### Requirement 1

**User Story:** As an administrator, I want to filter products by featured status, so that I can quickly view and manage featured products separately from regular products.

#### Acceptance Criteria

1. WHEN an administrator views the admin products page THEN the system SHALL display a featured filter dropdown alongside existing filters
2. WHEN the featured filter is set to "All" THEN the system SHALL display all products regardless of featured status
3. WHEN the featured filter is set to "Featured" THEN the system SHALL display only products where isFeatured is true
4. WHEN the featured filter is set to "Not Featured" THEN the system SHALL display only products where isFeatured is false
5. WHEN the featured filter value changes THEN the system SHALL reset pagination to page 1 and fetch filtered results

### Requirement 2

**User Story:** As an administrator, I want the featured filter to work with other filters, so that I can combine multiple criteria to find specific products.

#### Acceptance Criteria

1. WHEN multiple filters are applied THEN the system SHALL combine all filter criteria using AND logic
2. WHEN the featured filter is combined with stock status filter (in stock/pre-order) THEN the system SHALL return products matching both criteria
3. WHEN the featured filter is combined with search query THEN the system SHALL return products matching both the search and featured status
4. WHEN filters are applied THEN the system SHALL preserve sort order and other query parameters

### Requirement 3

**User Story:** As an administrator, I want the featured filter to display in both English and Vietnamese, so that I can use the interface in my preferred language.

#### Acceptance Criteria

1. WHEN the interface language is English THEN the featured filter SHALL display "All Featured", "Featured", and "Not Featured" options
2. WHEN the interface language is Vietnamese THEN the featured filter SHALL display "Tất cả", "Nổi bật", and "Không nổi bật" options
3. WHEN the language is switched THEN the featured filter labels SHALL update to match the selected language
