# Requirements Document

## Introduction

The address storage system currently allows users to save duplicate addresses, leading to database bloat and poor user experience. Users may inadvertently create multiple identical address records when they enter the same shipping information during different checkout sessions. This specification defines a system to detect and prevent duplicate addresses while preserving user intent when addresses are genuinely different.

## Glossary

- **Address System**: The backend service and database models that store and manage user shipping addresses
- **Duplicate Address**: Two or more address records that have identical values for all key address fields
- **Address Normalization**: The process of standardizing address data to a consistent format for comparison
- **Key Address Fields**: The fields that uniquely identify an address: addressLine1, addressLine2, city, state, postalCode, country
- **User Address Collection**: All addresses associated with a specific authenticated user
- **Guest Address**: An address record with a null userId created during guest checkout

## Requirements

### Requirement 1

**User Story:** As a user, I want the system to prevent me from saving duplicate addresses, so that my address list remains clean and manageable

#### Acceptance Criteria

1. WHEN a user attempts to create an address, THE Address System SHALL check for existing addresses with identical key address fields
2. THE Address System SHALL compare addressLine1, addressLine2, city, state, postalCode, and country when detecting duplicates
3. WHEN a duplicate address is detected for an authenticated user, THE Address System SHALL return the existing address instead of creating a new record
4. WHEN a duplicate address is detected, THE Address System SHALL update the fullName and phone fields if they differ from the existing record
5. THE Address System SHALL perform case-insensitive comparison for text fields when detecting duplicates

### Requirement 2

**User Story:** As a user, I want addresses to be compared in a standardized format, so that minor formatting differences don't create false duplicates

#### Acceptance Criteria

1. WHEN comparing addresses, THE Address System SHALL normalize whitespace by trimming leading and trailing spaces
2. THE Address System SHALL normalize whitespace by collapsing multiple consecutive spaces into a single space
3. THE Address System SHALL perform case-insensitive comparison for addressLine1, addressLine2, city, and state
4. THE Address System SHALL normalize postalCode by removing spaces and hyphens before comparison
5. THE Address System SHALL normalize country codes to uppercase before comparison

### Requirement 3

**User Story:** As a user, I want to update the default status of an existing address when I try to save a duplicate, so that my preferences are respected

#### Acceptance Criteria

1. WHEN a duplicate address is detected and the new address has isDefault set to true, THE Address System SHALL update the existing address to be the default
2. WHEN setting an address as default, THE Address System SHALL unset the default flag on all other addresses for that user
3. WHEN a duplicate address is detected and the new address has isDefault set to false, THE Address System SHALL preserve the existing address's default status
4. THE Address System SHALL return the updated existing address with the new default status

### Requirement 4

**User Story:** As a developer, I want the address deduplication logic to be testable with property-based tests, so that I can verify it works correctly across many input variations

#### Acceptance Criteria

1. THE Address System SHALL expose a pure function for address normalization that takes an address object and returns a normalized version
2. THE Address System SHALL expose a pure function for address comparison that takes two address objects and returns a boolean indicating if they are duplicates
3. THE Address System SHALL implement deduplication logic in a way that can be tested independently of database operations
4. THE Address System SHALL handle null and undefined values in address fields during normalization and comparison

### Requirement 5

**User Story:** As a system administrator, I want to identify and merge existing duplicate addresses in the database, so that I can clean up historical data

#### Acceptance Criteria

1. THE Address System SHALL provide a database query to identify groups of duplicate addresses for each user
2. WHEN merging duplicate addresses, THE Address System SHALL preserve the most recently created address record
3. WHEN merging duplicate addresses, THE Address System SHALL update all order references to point to the preserved address
4. WHEN merging duplicate addresses, THE Address System SHALL delete the redundant address records
5. THE Address System SHALL preserve the default address designation when merging duplicates

### Requirement 6

**User Story:** As a user, I want guest addresses to be deduplicated separately from authenticated user addresses, so that guest checkout remains fast and doesn't interfere with my saved addresses

#### Acceptance Criteria

1. WHEN a guest user creates an address, THE Address System SHALL not check for duplicates against authenticated user addresses
2. WHEN a guest user creates an address, THE Address System SHALL allow duplicate addresses with null userId
3. WHEN an authenticated user creates an address, THE Address System SHALL only check for duplicates within their own address collection
4. THE Address System SHALL not deduplicate across different users' address collections

### Requirement 7

**User Story:** As a developer, I want the deduplication system to handle edge cases gracefully, so that the system remains robust

#### Acceptance Criteria

1. WHEN addressLine2 is null or empty in one address and present in another, THE Address System SHALL treat them as different addresses
2. WHEN comparing addresses with different country codes, THE Address System SHALL treat them as different addresses regardless of other fields
3. WHEN a user has no existing addresses, THE Address System SHALL create the new address without performing duplicate checks
4. THE Address System SHALL handle addresses with special characters in street names correctly during normalization
5. THE Address System SHALL handle addresses with apartment numbers, unit numbers, and suite numbers correctly during comparison
