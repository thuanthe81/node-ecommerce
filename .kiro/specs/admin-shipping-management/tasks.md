# Implementation Plan

- [x] 1. Create database schema and migration
  - Create Prisma schema for ShippingMethod model with all fields (methodId, names, descriptions, pricing fields, etc.)
  - Generate and run migration to create shipping_methods table
  - Create seed data for existing hardcoded shipping methods (standard, express, overnight, international_standard, international_express)
  - _Requirements: 1.1, 2.1, 2.2, 2.3_

- [x] 2. Implement backend shipping methods service
- [x] 2.1 Create DTOs for shipping method operations
  - Write CreateShippingMethodDto with validation decorators
  - Write UpdateShippingMethodDto with partial validation
  - _Requirements: 2.2, 2.3, 3.2_

- [x] 2.2 Implement ShippingMethodsService CRUD operations
  - Implement create() method with uniqueness validation
  - Implement findAll() and findAllActive() methods with sorting
  - Implement findOne() and findByMethodId() methods
  - Implement update() method with immutable methodId check
  - Implement remove() method with order reference validation
  - _Requirements: 1.1, 1.4, 2.4, 2.5, 3.3, 7.1, 8.2, 8.3_

- [ ]* 2.3 Write property test for shipping method creation persistence
  - **Property 5: Created shipping methods are persisted**
  - **Validates: Requirements 2.4**

- [ ]* 2.4 Write property test for method identifier uniqueness
  - **Property 6: Method identifier uniqueness is enforced**
  - **Validates: Requirements 2.5**

- [ ]* 2.5 Write property test for method identifier immutability
  - **Property 7: Method identifier is immutable**
  - **Validates: Requirements 3.2**

- [ ]* 2.6 Write property test for update persistence
  - **Property 8: Updates are persisted**
  - **Validates: Requirements 3.3**

- [ ]* 2.7 Write property test for deletion
  - **Property 17: Deletion removes method from database**
  - **Validates: Requirements 8.2**

- [ ]* 2.8 Write property test for deletion with order references
  - **Property 18: Methods with order references cannot be deleted**
  - **Validates: Requirements 8.3**

- [x] 3. Implement backend shipping methods controller
  - Create ShippingMethodsController with admin-only routes
  - Implement POST /shipping-methods (create)
  - Implement GET /shipping-methods (list all)
  - Implement GET /shipping-methods/active (list active)
  - Implement GET /shipping-methods/:id (get one)
  - Implement PATCH /shipping-methods/:id (update)
  - Implement DELETE /shipping-methods/:id (delete)
  - Add proper error handling and response formatting
  - _Requirements: 1.1, 2.1, 3.1, 7.1, 8.1_

- [ ]* 3.1 Write unit tests for controller authentication
  - Test that all endpoints require ADMIN role
  - Test that non-admin users receive 403 Forbidden
  - _Requirements: All admin operations_

- [x] 4. Update shipping calculation service
- [x] 4.1 Modify ShippingService to use database methods
  - Update calculateShipping() to fetch active methods from database
  - Implement calculateMethodCost() helper for individual method calculation
  - Implement getRegionalRate() helper for regional pricing lookup
  - Implement applyWeightCharges() helper for weight-based pricing
  - Implement applyFreeShipping() helper for free shipping threshold
  - Remove hardcoded shipping method logic
  - _Requirements: 4.2, 5.2, 5.4, 6.2, 10.1, 10.2_

- [ ]* 4.2 Write property test for weight-based pricing calculation
  - **Property 9: Weight-based pricing is calculated correctly**
  - **Validates: Requirements 4.2**

- [ ]* 4.3 Write property test for regional pricing lookup
  - **Property 10: Regional pricing lookup is correct**
  - **Validates: Requirements 5.2**

- [ ]* 4.4 Write property test for regional pricing precedence
  - **Property 11: Regional pricing precedence is enforced**
  - **Validates: Requirements 5.4**

- [ ]* 4.5 Write property test for free shipping threshold
  - **Property 12: Free shipping threshold is applied correctly**
  - **Validates: Requirements 6.2**

- [ ]* 4.6 Write property test for comprehensive pricing calculation
  - **Property 20: Comprehensive pricing calculation**
  - **Validates: Requirements 10.2**

- [ ]* 4.7 Write unit tests for calculation edge cases
  - Test base rate only (no additional pricing rules)
  - Test weight under threshold (no weight charges)
  - Test regional pricing fallback chain (country → region → base)
  - Test order value below free shipping threshold
  - _Requirements: 4.2, 5.2, 6.2_

- [x] 5. Implement frontend API client
  - Create lib/shipping-method-api.ts with TypeScript interfaces
  - Implement getAll() to fetch all shipping methods
  - Implement getActive() to fetch active methods
  - Implement getOne(id) to fetch single method
  - Implement create(data) to create new method
  - Implement update(id, data) to update method
  - Implement deleteMethod(id) to delete method
  - Add proper error handling and type safety
  - _Requirements: 1.1, 2.1, 3.1, 7.1, 8.1_

- [x] 6. Create shipping method form component
- [x] 6.1 Create component structure and types
  - Create ShippingMethodForm/ directory with modular structure
  - Define TypeScript interfaces in types.ts
  - Create index.tsx export entry point
  - _Requirements: 2.1, 3.1_

- [x] 6.2 Implement form sub-components
  - Create BasicInfoSection.tsx for name, description, carrier fields
  - Create PricingSection.tsx for base rate, weight pricing, estimated days
  - Create RegionalPricingSection.tsx for country/region rate management
  - Create SettingsSection.tsx for active status and display order
  - _Requirements: 2.2, 2.3, 4.1, 5.1, 6.1, 7.1, 9.1_

- [x] 6.3 Implement form hooks
  - Create useShippingMethodForm.ts for form state and validation
  - Create useRegionalPricing.ts for regional pricing array management
  - Add validation for required fields
  - Add validation for numeric fields (non-negative)
  - _Requirements: 2.2, 5.1_

- [x] 6.4 Add translations for shipping method form
  - Add English and Vietnamese translations for all form labels
  - Add translations for validation error messages
  - Add translations for help text and placeholders
  - _Requirements: 2.1, 3.1_

- [ ]* 6.5 Write property test for required field validation
  - **Property 3: Required fields are validated on creation**
  - **Validates: Requirements 2.2**

- [ ]* 6.6 Write property test for optional fields
  - **Property 4: Optional fields can be omitted**
  - **Validates: Requirements 2.3**

- [x] 7. Create admin shipping methods list page
  - Create app/[locale]/admin/shipping-methods/page.tsx
  - Implement list view with table/card layout
  - Display method name, description, base cost, carrier, estimated days, active status
  - Add create button linking to new method form
  - Add edit and delete buttons for each method
  - Implement delete confirmation modal
  - Add empty state when no methods exist
  - Add loading state
  - Add translations for all UI text
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 3.1, 8.1_

- [ ]* 7.1 Write property test for shipping method display fields
  - **Property 1: Shipping method display contains required fields**
  - **Validates: Requirements 1.2**

- [ ]* 7.2 Write property test for sorting
  - **Property 2: Shipping methods are sorted by display order then creation date**
  - **Validates: Requirements 1.4**

- [x] 8. Create admin shipping method create/edit pages
  - Create app/[locale]/admin/shipping-methods/new/page.tsx for creation
  - Create app/[locale]/admin/shipping-methods/[id]/edit/page.tsx for editing
  - Integrate ShippingMethodForm component
  - Handle form submission with API calls
  - Display success/error messages
  - Redirect to list page on success
  - Pre-populate form with existing data in edit mode
  - Disable methodId field in edit mode
  - Add translations for page titles and messages
  - _Requirements: 2.1, 2.4, 2.5, 3.1, 3.2, 3.3_

- [x] 9. Update admin navigation
  - Add "Shipping Methods" link to admin navigation menu
  - Add appropriate icon for shipping methods
  - Add translations for navigation label
  - _Requirements: 1.1_

- [x] 10. Implement active status toggle
  - Add toggle switch to shipping methods list page
  - Implement toggle handler with API call
  - Update UI optimistically
  - Handle errors and revert on failure
  - Add translations for toggle labels
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ]* 10.1 Write property test for active status toggle persistence
  - **Property 14: Active status toggle is persisted**
  - **Validates: Requirements 7.1**

- [ ]* 10.2 Write property test for inactive method filtering
  - **Property 15: Inactive methods are excluded from customer calculations**
  - **Validates: Requirements 7.2**

- [ ]* 10.3 Write property test for deactivation data preservation
  - **Property 16: Deactivation preserves configuration data**
  - **Validates: Requirements 7.4**

- [x] 11. Update checkout shipping calculation
  - Verify checkout uses ShippingService.calculateShipping()
  - Test that active methods are displayed with calculated costs
  - Test that inactive methods are not displayed
  - Test that pricing rules are applied correctly
  - Add error handling for no active methods case
  - Add translations for error messages
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 11.1 Write property test for checkout shipping methods
  - **Property 19: Checkout returns all active methods with calculated costs**
  - **Validates: Requirements 10.1**

- [ ]* 11.2 Write property test for shipping rate structure
  - **Property 21: Shipping rate structure is complete**
  - **Validates: Requirements 10.3**

- [ ]* 11.3 Write property test for free shipping description
  - **Property 13: Free shipping indication is added to description**
  - **Validates: Requirements 6.4**

- [x] 12. Add caching for shipping methods
  - Implement cache for active shipping methods (30-minute TTL)
  - Add cache invalidation on create/update/delete operations
  - Use existing Redis cache manager
  - Add cache key constants
  - _Requirements: Performance optimization_

- [ ]* 12.1 Write integration test for cache invalidation
  - Test that creating a method invalidates cache
  - Test that updating a method invalidates cache
  - Test that deleting a method invalidates cache
  - Test that cached methods are returned on subsequent requests
  - _Requirements: Performance optimization_

- [ ] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 14. Write end-to-end integration tests
  - Test complete admin workflow: create → list → edit → delete
  - Test shipping calculation with various pricing rules
  - Test checkout integration with active/inactive methods
  - Test error cases: duplicate methodId, delete with orders, etc.
  - _Requirements: All requirements_
