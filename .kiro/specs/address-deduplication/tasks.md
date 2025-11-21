# Implementation Plan

- [x] 1. Create address deduplication utility with normalization functions
  - Create `backend/src/users/utils/address-deduplication.util.ts`
  - Implement `normalizeString()` for text field normalization (trim, collapse spaces, lowercase)
  - Implement `normalizePostalCode()` for postal code normalization (remove spaces/hyphens, uppercase)
  - Implement `normalizeCountryCode()` for country code normalization (uppercase, trim)
  - Implement `normalizeAddress()` that uses the above functions to normalize all address fields
  - Implement `areAddressesDuplicate()` that compares two addresses using normalized values
  - Handle null/undefined values by converting to empty strings for optional fields
  - _Requirements: 1.5, 2.1, 2.2, 2.4, 2.5, 4.1, 4.2, 4.4, 7.1, 7.2_

- [ ]* 1.1 Write property test for normalization preserves semantic equivalence
  - **Property 3: Normalization preserves semantic equivalence**
  - **Validates: Requirements 1.5, 2.1, 2.2, 2.3, 2.4, 2.5**

- [ ]* 1.2 Write property test for comparison function purity
  - **Property 7: Comparison function purity**
  - **Validates: Requirements 4.2**

- [ ]* 1.3 Write property test for addressLine2 significance
  - **Property 10: AddressLine2 significance**
  - **Validates: Requirements 7.1**

- [ ]* 1.4 Write property test for country code significance
  - **Property 11: Country code significance**
  - **Validates: Requirements 7.2**

- [ ]* 1.5 Write unit tests for normalization edge cases
  - Test addresses with special characters in street names
  - Test addresses with apartment numbers, unit numbers, suite numbers
  - Test various postal code formats (with/without spaces and hyphens)
  - Test country codes in different cases
  - _Requirements: 7.4, 7.5_

- [x] 2. Implement deduplication logic in UsersService
  - Add private method `findDuplicateAddress()` to query for existing addresses with matching normalized fields
  - Add private method `updateExistingAddress()` to update contact info and default status
  - Modify `createAddress()` to check for duplicates before creating new addresses
  - Only perform duplicate check for authenticated users (skip for null userId)
  - Return existing address when duplicate found
  - Update fullName and phone on existing address if they differ
  - Handle default address logic when duplicate found
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.3, 6.1, 6.2, 6.3_

- [ ]* 2.1 Write property test for duplicate detection with key fields
  - **Property 1: Duplicate detection with key fields**
  - **Validates: Requirements 1.1, 1.2, 1.3**

- [ ]* 2.2 Write property test for contact information update on duplicate
  - **Property 2: Contact information update on duplicate**
  - **Validates: Requirements 1.4**

- [ ]* 2.3 Write property test for default status update on default duplicate
  - **Property 6: Default status update on default duplicate**
  - **Validates: Requirements 3.1**

- [ ]* 2.4 Write property test for default status preservation on non-default duplicate
  - **Property 5: Default status preservation on non-default duplicate**
  - **Validates: Requirements 3.3**

- [ ]* 2.5 Write property test for guest address isolation
  - **Property 8: Guest address isolation**
  - **Validates: Requirements 6.1, 6.2**

- [ ]* 2.6 Write property test for user address isolation
  - **Property 9: User address isolation**
  - **Validates: Requirements 6.3, 6.4**

- [x] 3. Implement default address uniqueness enforcement
  - Ensure the existing default address logic in `createAddress()` works with deduplication
  - Verify that `updateExistingAddress()` properly unsets other default addresses when setting a new default
  - Test that only one address per user can have isDefault=true
  - _Requirements: 3.2_

- [ ]* 3.1 Write property test for default address uniqueness
  - **Property 4: Default address uniqueness**
  - **Validates: Requirements 3.2**

- [x] 4. Create database migration script for cleaning up existing duplicates
  - Create `backend/scripts/deduplicate-addresses.ts`
  - Implement query to find groups of duplicate addresses per user using normalization logic
  - For each duplicate group, preserve the most recently created address
  - Update order references (shippingAddressId, billingAddressId) to point to preserved address
  - Delete redundant address records
  - Preserve default address designation when merging
  - Add dry-run mode to preview changes before applying
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 4.1 Write unit tests for migration script
  - Test identification of duplicate groups
  - Test preservation of most recent address
  - Test order reference updates
  - Test default address preservation
  - _Requirements: 5.2, 5.3, 5.4, 5.5_

- [x] 5. Add end-to-end tests for address deduplication API
  - Create `backend/test/address-deduplication.e2e-spec.ts`
  - Test creating duplicate addresses via API returns existing address
  - Test that contact info is updated on duplicate creation
  - Test default address behavior with duplicates
  - Test guest user can create duplicate addresses
  - Test different users can create same address
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.3, 6.2, 6.3_

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
