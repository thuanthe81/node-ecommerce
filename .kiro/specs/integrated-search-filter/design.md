# Design Document

## Overview

This design transforms the products page filtering experience by consolidating the separate FilterPanel sidebar into an enhanced search interface. The new SearchFilterBar component will combine text search with category filtering in a single, intuitive UI element positioned at the top of the products page. This approach reduces visual clutter, maximizes screen space for the product grid, and provides a more streamlined user experience.

## Architecture

### Component Structure

```
ProductsPage
├── SearchFilterBar (new, replaces SearchBar + FilterPanel)
│   ├── CategoryDropdown (left side)
│   ├── SearchInput (right side, flex-1)
│   └── ClearFiltersButton
└── ProductsContent
    ├── ProductGrid
    └── Pagination
```

### Data Flow

1. User interacts with SearchFilterBar (types search query or selects category)
2. Component updates local state and URL query parameters
3. ProductsContent reads query parameters via useSearchParams
4. ProductsContent fetches filtered products via useProducts hook
5. ProductGrid renders filtered results

### State Management

- **URL Query Parameters**: Source of truth for filter state (search, categoryId)
- **Local Component State**: Manages input values and dropdown state before applying filters
- **Categories**: Fetched once on mount and cached in component state

## Components and Interfaces

### SearchFilterBar Component

**Location**: `frontend/components/SearchFilterBar.tsx`

**Props Interface**:
```typescript
interface SearchFilterBarProps {
  className?: string;
}
```

**Internal State**:
```typescript
{
  searchQuery: string;           // Current search input value
  selectedCategoryId: string;    // Currently selected category ID
  categories: Category[];        // Available categories
  isDropdownOpen: boolean;       // Category dropdown visibility
  isLoading: boolean;           // Categories loading state
}
```

**Key Features**:
- Category dropdown positioned on the left side
- Debounced search input (300ms delay) on the right side
- Category dropdown with locale-aware names
- Clear filters button (visible when filters are active)
- Keyboard navigation support (Tab, Enter, Escape)
- Mobile-responsive layout (stacks vertically on small screens)

### Updated ProductsPage

**Location**: `frontend/app/[locale]/products/page.tsx`

**Changes**:
- Remove FilterPanel import and usage
- Replace SearchBar with SearchFilterBar
- Update layout from grid with sidebar to full-width layout
- Remove aside element

## Data Models

### Category Interface
```typescript
interface Category {
  id: string;
  slug: string;
  nameEn: string;
  nameVi: string;
}
```

### Filter State (URL Parameters)
```typescript
interface FilterParams {
  search?: string;      // Text search query
  categoryId?: string;  // Selected category ID
  page?: string;        // Current page number
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Search query updates URL parameter
*For any* non-empty search query string, when a user enters it into the search input, the URL SHALL contain a "search" parameter with that query value.
**Validates: Requirements 1.2, 4.1**

### Property 2: Category selection updates URL parameter
*For any* category from the available categories list, when a user selects that category, the URL SHALL contain a "categoryId" parameter with that category's ID.
**Validates: Requirements 1.3, 4.2**

### Property 3: Combined filters apply simultaneously
*For any* combination of search query and category selection, when both filters are applied, the URL SHALL contain both "search" and "categoryId" parameters with their respective values.
**Validates: Requirements 1.4**

### Property 4: Filter changes synchronize to URL
*For any* filter state change (search or category), the URL query parameters SHALL be updated to reflect the new filter state.
**Validates: Requirements 1.5**

### Property 5: Category names display in current locale
*For any* category and locale combination, the displayed category name SHALL match the locale-specific name field (nameEn for English, nameVi for Vietnamese).
**Validates: Requirements 2.5**

### Property 6: Active category shows visual indication
*For any* selected category (excluding "All Categories"), the category dropdown SHALL display visual indication that a filter is active.
**Validates: Requirements 2.4**

### Property 7: Clearing search removes URL parameter
*For any* active search query, when the user clears the search input, the "search" parameter SHALL be removed from the URL.
**Validates: Requirements 4.3**

### Property 8: URL parameters hydrate UI state
*For any* valid combination of URL parameters (search and/or categoryId), when the page loads with those parameters, the search input and category dropdown SHALL be initialized with the corresponding values.
**Validates: Requirements 4.5**

### Property 9: Clear button visibility reflects filter state
*For any* filter state, the clear/reset button SHALL be visible if and only if at least one filter (search or category) is active.
**Validates: Requirements 5.1**

### Property 10: Clearing filters removes all URL parameters
*For any* active filter combination, when the user clicks the clear button, all filter-related query parameters (search, categoryId) SHALL be removed from the URL.
**Validates: Requirements 5.4**

## Error Handling

### API Errors
- **Categories fetch failure**: Display search input with disabled category dropdown and show error message
- **Network timeout**: Retry category fetch once, then gracefully degrade to search-only mode
- **Invalid category ID in URL**: Ignore invalid parameter and default to "All Categories"

### User Input Validation
- **Empty search query**: Allow empty state, remove search parameter from URL
- **Special characters in search**: URL-encode search query properly
- **Invalid URL parameters**: Sanitize and ignore malformed parameters

### Edge Cases
- **No categories available**: Hide category dropdown, show search input only
- **Single category**: Still show dropdown for consistency
- **Very long search queries**: Truncate display but preserve full query in URL
- **Rapid filter changes**: Debounce search input, use latest category selection

## Testing Strategy

### Unit Testing

We will use Jest and React Testing Library for unit tests covering:

1. **SearchFilterBar Component**
   - Renders search input and category dropdown
   - Handles search input changes with debouncing
   - Handles category selection changes
   - Displays clear button when filters are active
   - Clears all filters when clear button is clicked
   - Initializes from URL parameters on mount

2. **ProductsPage Layout**
   - Renders SearchFilterBar instead of FilterPanel
   - Uses full-width layout without sidebar
   - Passes correct props to child components

3. **URL Parameter Management**
   - Updates URL when search query changes
   - Updates URL when category changes
   - Removes parameters when filters are cleared
   - Handles multiple simultaneous parameter updates

### Property-Based Testing

We will use **fast-check** for property-based testing. Each property-based test will run a minimum of 100 iterations to ensure robust coverage across random inputs.

Each property-based test MUST be tagged with a comment explicitly referencing the correctness property from this design document using the format: `**Feature: integrated-search-filter, Property {number}: {property_text}**`

Property-based tests will cover:

1. **Property 1**: Search query URL synchronization
   - Generate random search strings
   - Verify URL contains correct search parameter

2. **Property 2**: Category selection URL synchronization
   - Generate random category selections
   - Verify URL contains correct categoryId parameter

3. **Property 3**: Combined filters URL synchronization
   - Generate random combinations of search and category
   - Verify both parameters present in URL

4. **Property 5**: Locale-aware category names
   - Generate random locale and category combinations
   - Verify correct name field is displayed

5. **Property 8**: URL to UI state hydration
   - Generate random URL parameter combinations
   - Verify UI initializes with correct values

6. **Property 9**: Clear button visibility
   - Generate random filter states
   - Verify clear button visibility matches filter state

7. **Property 10**: Clear action removes all parameters
   - Generate random active filter combinations
   - Verify all parameters removed after clear

### Integration Testing

Integration tests will verify:
- SearchFilterBar works correctly with ProductsContent
- Filter changes trigger product refetch
- URL navigation maintains filter state
- Browser back/forward buttons work correctly

### Accessibility Testing

Accessibility tests will verify:
- Keyboard navigation between elements
- Screen reader announcements (ARIA labels)
- Focus management
- Touch target sizes on mobile
- Color contrast ratios

## Implementation Notes

### Performance Considerations
- Debounce search input (300ms) to reduce API calls
- Memoize category list to prevent unnecessary re-renders
- Use URL parameters as single source of truth to avoid state synchronization issues

### Browser Compatibility
- Use Next.js router for URL manipulation (supports all modern browsers)
- Test dropdown behavior across browsers (Safari, Chrome, Firefox, Edge)
- Ensure mobile touch interactions work on iOS and Android

### Accessibility
- Use semantic HTML (form, input, select elements)
- Provide ARIA labels for screen readers
- Ensure keyboard navigation works (Tab, Enter, Escape)
- Maintain focus management when filters change
- Use sufficient color contrast for visual indicators

### Mobile Optimization
- Stack category dropdown and search input vertically on small screens (category first, then search)
- Ensure touch targets meet 44x44px minimum
- Use native select element on mobile for better UX
- Test with various mobile viewport sizes

### Migration Strategy
1. Create new SearchFilterBar component
2. Update ProductsPage to use new component
3. Remove FilterPanel component and related code
4. Update tests to reflect new structure
5. Verify all existing filter functionality works
6. Deploy and monitor for issues
