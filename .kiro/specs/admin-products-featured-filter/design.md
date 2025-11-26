# Design Document

## Overview

This feature adds a "Featured" filter dropdown to the admin products page. The implementation is straightforward since the backend already supports the `isFeatured` query parameter through the existing `QueryProductsDto`. The frontend will add a new dropdown control that follows the same pattern as the existing stock status filter.

## Architecture

The feature follows the existing architecture pattern:
- **Frontend**: React component state management with filter controls
- **API Layer**: Existing `productApi.getProducts()` method already supports `isFeatured` parameter
- **Backend**: Existing `QueryProductsDto` and products service already handle `isFeatured` filtering

No new API endpoints or backend changes are required.

## Components and Interfaces

### Frontend Component Changes

**File**: `frontend/app/[locale]/admin/products/page.tsx`

The component already manages filters through the `filters` state object of type `ProductQueryParams`. We will add a new dropdown control similar to the existing `inStock` filter.

### Existing Interface

```typescript
interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isFeatured?: boolean;  // Already exists in the interface
  sortBy?: 'price' | 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
```

## Data Models

No changes to data models are required. The Product model already includes:

```prisma
model Product {
  // ... other fields
  isFeatured        Boolean        @default(false)
  // ... other fields

  @@index([isFeatured])
  @@index([isActive, isFeatured])
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Acceptance Criteria Testing Prework

1.1 WHEN an administrator views the admin products page THEN the system SHALL display a featured filter dropdown alongside existing filters
Thoughts: This is testing that a UI element exists on the page. We can verify that the dropdown is rendered with the correct options.
Testable: yes - example

1.2 WHEN the featured filter is set to "All" THEN the system SHALL display all products regardless of featured status
Thoughts: This is about verifying that when a specific filter value is selected, the API is called without the isFeatured parameter. This is a specific example test.
Testable: yes - example

1.3 WHEN the featured filter is set to "Featured" THEN the system SHALL display only products where isFeatured is true
Thoughts: This is testing that the filter correctly passes isFeatured=true to the API and only featured products are displayed. This is a specific example.
Testable: yes - example

1.4 WHEN the featured filter is set to "Not Featured" THEN the system SHALL display only products where isFeatured is false
Thoughts: This is testing that the filter correctly passes isFeatured=false to the API. This is a specific example.
Testable: yes - example

1.5 WHEN the featured filter value changes THEN the system SHALL reset pagination to page 1 and fetch filtered results
Thoughts: This is testing that changing the filter triggers the correct side effects (pagination reset and API call). This is a specific behavior test.
Testable: yes - example

2.1 WHEN multiple filters are applied THEN the system SHALL combine all filter criteria using AND logic
Thoughts: This is about testing that multiple filter parameters are correctly combined. We can test with various combinations of filters.
Testable: yes - property

2.2 WHEN the featured filter is combined with stock status filter THEN the system SHALL return products matching both criteria
Thoughts: This is a specific case of combining two filters. This is an example of the more general property 2.1.
Testable: edge-case

2.3 WHEN the featured filter is combined with search query THEN the system SHALL return products matching both the search and featured status
Thoughts: This is another specific case of combining filters. This is an example of the more general property 2.1.
Testable: edge-case

2.4 WHEN filters are applied THEN the system SHALL preserve sort order and other query parameters
Thoughts: This is testing that applying filters doesn't inadvertently clear other query parameters. This is a general property about state preservation.
Testable: yes - property

3.1 WHEN the interface language is English THEN the featured filter SHALL display "All Featured", "Featured", and "Not Featured" options
Thoughts: This is testing that specific text appears when the locale is English. This is a specific example.
Testable: yes - example

3.2 WHEN the interface language is Vietnamese THEN the featured filter SHALL display "Tất cả", "Nổi bật", and "Không nổi bật" options
Thoughts: This is testing that specific text appears when the locale is Vietnamese. This is a specific example.
Testable: yes - example

3.3 WHEN the language is switched THEN the featured filter labels SHALL update to match the selected language
Thoughts: This is testing the dynamic behavior of language switching. This is a specific interaction test.
Testable: yes - example

### Property Reflection

Reviewing the prework analysis:
- Properties 2.2 and 2.3 are specific examples of property 2.1 (combining filters with AND logic)
- These can be consolidated into property 2.1 which covers all filter combinations
- Property 2.4 is distinct and provides unique validation value
- All other criteria are specific examples rather than general properties

### Correctness Properties

Property 1: Filter combination preserves all parameters
*For any* set of filter parameters, when a new filter is applied, all previously set filter parameters should remain in the query except for pagination which resets to page 1
**Validates: Requirements 2.1, 2.4**

Property 2: Filter state consistency
*For any* filter value change, the component state and the API request parameters should contain matching values for all filter fields
**Validates: Requirements 1.5, 2.1**

## Error Handling

No new error handling is required. The feature uses existing error handling patterns:
- API errors are caught and logged to console
- Loading states are managed through existing `loading` state
- Failed requests maintain current product list display

## Testing Strategy

### Unit Tests

The following specific examples should be tested:

1. **Filter Rendering**: Verify the featured filter dropdown renders with correct options
2. **Filter Value "All"**: Verify selecting "All" removes `isFeatured` from query params
3. **Filter Value "Featured"**: Verify selecting "Featured" sets `isFeatured=true`
4. **Filter Value "Not Featured"**: Verify selecting "Not Featured" sets `isFeatured=false`
5. **Pagination Reset**: Verify filter change resets page to 1
6. **Localization**: Verify correct labels display for English and Vietnamese locales

### Property-Based Tests

Property-based tests will use `@fast-check/jest` for JavaScript/TypeScript. Each test should run a minimum of 100 iterations.

**Property 1: Filter combination preserves all parameters**
- Generate random combinations of filter parameters (search, categoryId, inStock, sortBy, sortOrder)
- Apply a new isFeatured filter value
- Verify all original parameters remain except page resets to 1

**Property 2: Filter state consistency**
- Generate random filter states
- Simulate filter changes
- Verify component state matches API request parameters

### Integration Tests

1. Test featured filter works with existing stock filter
2. Test featured filter works with search functionality
3. Test featured filter works with sorting options
4. Test language switching updates filter labels correctly

## Implementation Notes

### UI Placement

The featured filter dropdown should be placed in the filters section after the stock status filter, maintaining visual consistency with existing filter controls.

### Filter Value Mapping

```typescript
// Map dropdown value to API parameter
'all' -> isFeatured: undefined (omit from query)
'true' -> isFeatured: true
'false' -> isFeatured: false
```

### Styling

Use existing Tailwind CSS classes matching the stock status filter:
- Same border, padding, and focus styles
- Same hover states
- Same responsive behavior
