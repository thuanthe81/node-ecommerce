# Implementation Plan

- [x] 1. Set up backend infrastructure for admin customer management
  - Create admin customers controller with authentication guards
  - Create customer filters DTO with validation
  - Add admin guard to verify user role
  - _Requirements: 1.1, 1.5_

- [x] 2. Implement backend customer list endpoint with filtering
  - [x] 2.1 Create service method to fetch customers with pagination
    - Implement database query with Prisma
    - Add pagination parameters (page, limit)
    - Calculate total count for pagination
    - _Requirements: 1.1_

  - [x] 2.2 Add search functionality to customer service
    - Implement case-insensitive search on name and email
    - Use Prisma's `contains` filter with `mode: 'insensitive'`
    - _Requirements: 2.1, 2.4_

  - [x] 2.3 Add date range filtering to customer service
    - Implement start date filter (gte)
    - Implement end date filter (lte)
    - Support combined date range filtering
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 2.4 Add sorting functionality to customer service
    - Implement sort by registration date
    - Implement sort by total orders (using aggregation)
    - Implement sort by total spent (using aggregation)
    - Support ascending and descending order
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 2.5 Calculate customer statistics (total orders and total spent)
    - Use Prisma aggregation to calculate order count
    - Use Prisma aggregation to sum order totals
    - Include statistics in customer response
    - _Requirements: 1.2, 5.4_

  - [ ]* 2.6 Write property test for pagination consistency
    - **Property 1: Pagination consistency**
    - **Validates: Requirements 1.1**

  - [ ]* 2.7 Write property test for search functionality
    - **Property 3: Search text matching**
    - **Property 4: Case-insensitive search**
    - **Validates: Requirements 2.1, 2.4**

  - [ ]* 2.8 Write property test for date filtering
    - **Property 5: Start date filtering**
    - **Property 6: End date filtering**
    - **Property 7: Date range filtering**
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [ ]* 2.9 Write property test for sorting
    - **Property 8: Sort order correctness**
    - **Property 9: Sort order toggle**
    - **Validates: Requirements 4.1, 4.2**

- [x] 3. Implement backend customer detail endpoint
  - [x] 3.1 Create service method to fetch customer details
    - Fetch customer profile with Prisma
    - Include related orders with order items
    - Include customer addresses
    - Calculate customer statistics
    - _Requirements: 5.2, 5.3, 5.4_

  - [x] 3.2 Add error handling for customer not found
    - Return 404 when customer doesn't exist
    - Return appropriate error message
    - _Requirements: 1.5_

  - [ ]* 3.3 Write property test for statistics calculation
    - **Property 12: Statistics calculation accuracy**
    - **Validates: Requirements 5.4**

- [x] 4. Implement CSV export functionality
  - [x] 4.1 Create CSV export service method
    - Generate CSV from customer data
    - Include all customer fields
    - Apply current filters to export
    - _Requirements: 6.1, 6.2, 6.4_

  - [x] 4.2 Create export endpoint in controller
    - Return CSV as downloadable file
    - Set appropriate headers for file download
    - _Requirements: 6.1_

  - [ ]* 4.3 Write property test for CSV export
    - **Property 13: CSV export completeness**
    - **Property 14: CSV field inclusion**
    - **Property 15: Export respects filters**
    - **Validates: Requirements 6.1, 6.2, 6.4**

- [x] 5. Create frontend API client for customer management
  - [x] 5.1 Create customer-api.ts module
    - Define Customer and CustomerDetail interfaces
    - Define CustomerFilters interface
    - Define CustomerListResponse interface
    - _Requirements: 1.1, 1.2_

  - [x] 5.2 Implement API client methods
    - Implement getAllCustomers method with filters
    - Implement getCustomerDetail method
    - Implement exportCustomers method
    - Add proper error handling
    - _Requirements: 1.1, 5.1, 6.1_

- [x] 6. Implement customer list page frontend
  - [x] 6.1 Update CustomerListContent component with data fetching
    - Add state management for customers, loading, and errors
    - Implement useEffect to fetch customers on mount
    - Display loading indicator during fetch
    - Display error message on fetch failure
    - _Requirements: 1.1, 1.4, 1.5_

  - [x] 6.2 Implement customer list table
    - Display customer email, name, registration date
    - Display total orders and total spent
    - Format dates according to locale
    - Format currency according to locale
    - Make rows clickable to navigate to detail page
    - _Requirements: 1.2, 5.1, 7.3, 7.4_

  - [x] 6.3 Implement empty state
    - Display message when no customers exist
    - Display message when search/filter returns no results
    - _Requirements: 1.3, 2.3_

  - [ ]* 6.4 Write property test for required fields rendering
    - **Property 2: Required fields presence**
    - **Validates: Requirements 1.2**

  - [ ]* 6.5 Write property test for date and currency formatting
    - **Property 16: Date formatting by locale**
    - **Property 17: Currency formatting by locale**
    - **Validates: Requirements 7.3, 7.4**

- [x] 7. Implement search functionality
  - [x] 7.1 Add search input field
    - Create controlled input component
    - Add search button
    - Handle form submission
    - _Requirements: 2.1_

  - [x] 7.2 Implement search state management
    - Update filters when search is submitted
    - Clear search when input is cleared
    - Trigger customer list refresh on search
    - _Requirements: 2.1, 2.2_

  - [ ]* 7.3 Write property test for filter persistence
    - **Property 10: Filter persistence during sort**
    - **Validates: Requirements 4.3**

- [x] 8. Implement date range filtering
  - [x] 8.1 Add date filter inputs
    - Create start date input
    - Create end date input
    - Add clear filters button
    - _Requirements: 3.1, 3.2, 3.4_

  - [x] 8.2 Implement date filter state management
    - Update filters when dates are selected
    - Clear date filters when cleared
    - Trigger customer list refresh on filter change
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 9. Implement sorting functionality
  - [x] 9.1 Make table headers sortable
    - Add click handlers to sortable column headers
    - Display sort indicators (arrows)
    - Toggle sort order on repeated clicks
    - _Requirements: 4.1, 4.2_

  - [x] 9.2 Implement sort state management
    - Track current sort column and order
    - Update filters when sort changes
    - Maintain filters when sorting
    - Trigger customer list refresh on sort change
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 10. Implement pagination
  - [x] 10.1 Add pagination controls
    - Display current page and total pages
    - Add previous/next buttons
    - Add page number buttons
    - Disable buttons appropriately
    - _Requirements: 1.1_

  - [x] 10.2 Implement pagination state management
    - Track current page
    - Update filters when page changes
    - Trigger customer list refresh on page change
    - _Requirements: 1.1_

- [x] 11. Implement CSV export button
  - [x] 11.1 Add export button to UI
    - Place button in header area
    - Show loading state during export
    - _Requirements: 6.1_

  - [x] 11.2 Implement export functionality
    - Call export API with current filters
    - Trigger file download
    - Handle export errors
    - _Requirements: 6.1, 6.4_

- [x] 12. Create customer detail page
  - [x] 12.1 Create customer detail route and page component
    - Create [customerId]/page.tsx
    - Add AdminProtectedRoute wrapper
    - Add AdminLayout wrapper
    - _Requirements: 5.1_

  - [x] 12.2 Create CustomerDetailContent component
    - Add state management for customer detail
    - Implement useEffect to fetch customer detail
    - Display loading indicator
    - Display error message on failure
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 12.3 Display customer profile information
    - Show email, name, phone
    - Show registration date
    - Show customer statistics
    - Format dates and currency by locale
    - _Requirements: 5.2, 5.4, 7.3, 7.4_

  - [x] 12.4 Display customer order history
    - Show list of all customer orders
    - Display order number, date, status, total
    - Make orders clickable to view order details
    - _Requirements: 5.3_

  - [ ]* 12.5 Write property test for customer detail completeness
    - **Property 11: Customer detail completeness**
    - **Validates: Requirements 5.2**

- [x] 13. Add translations for customer management
  - [x] 13.1 Add English translations
    - Add all labels, messages, and text
    - Add error messages
    - Add empty state messages
    - _Requirements: 7.2_

  - [x] 13.2 Add Vietnamese translations
    - Add all labels, messages, and text
    - Add error messages
    - Add empty state messages
    - _Requirements: 7.1_

- [x] 14. Implement responsive design
  - [x] 14.1 Add mobile card layout
    - Create card-based layout for mobile
    - Show key customer information
    - Make cards tappable
    - _Requirements: 8.1_

  - [x] 14.2 Add tablet optimized layout
    - Adjust table layout for tablet
    - Optimize spacing and sizing
    - _Requirements: 8.2_

  - [x] 14.3 Ensure desktop full-featured layout
    - Display complete table with all columns
    - Optimize for large screens
    - _Requirements: 8.3_

  - [ ]* 14.4 Write property test for state persistence
    - **Property 18: State persistence across layout changes**
    - **Validates: Requirements 8.4**

- [x] 15. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
