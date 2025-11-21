# Design Document

## Overview

The address deduplication system prevents users from creating duplicate address records by detecting when a new address matches an existing one. The system normalizes address data to a consistent format before comparison, ensuring that minor formatting differences (like extra spaces or different capitalization) don't create false duplicates. When a duplicate is detected, the system returns the existing address record instead of creating a new one, optionally updating the contact information (fullName, phone) and default status if they differ.

The design focuses on authenticated users, as guest addresses are transient and cleaned up automatically. The system provides both runtime deduplication during address creation and utilities for cleaning up historical duplicates.

## Architecture

The deduplication system consists of three main layers:

1. **Service Layer** (`UsersService`): Orchestrates the deduplication logic during address creation
2. **Utility Layer** (`AddressDeduplicationUtil`): Provides pure functions for address normalization and comparison
3. **Data Layer** (Prisma): Handles database queries to find existing addresses

The flow for address creation with deduplication:

```
User creates address
  ↓
UsersService.createAddress()
  ↓
Normalize incoming address
  ↓
Query for existing addresses (if authenticated user)
  ↓
Compare normalized addresses
  ↓
If duplicate found:
  - Update contact info if changed
  - Update default status if requested
  - Return existing address
Else:
  - Create new address
  - Return new address
```

## Components and Interfaces

### AddressDeduplicationUtil

A utility class providing pure functions for address operations:

```typescript
export class AddressDeduplicationUtil {
  /**
   * Normalizes an address for comparison
   */
  static normalizeAddress(address: AddressInput): NormalizedAddress;

  /**
   * Compares two addresses to determine if they are duplicates
   */
  static areAddressesDuplicate(addr1: AddressInput, addr2: AddressInput): boolean;

  /**
   * Normalizes a string field (trim, collapse spaces, lowercase)
   */
  static normalizeString(value: string | null | undefined): string;

  /**
   * Normalizes a postal code (remove spaces and hyphens, uppercase)
   */
  static normalizePostalCode(postalCode: string): string;

  /**
   * Normalizes a country code (uppercase, trim)
   */
  static normalizeCountryCode(country: string): string;
}
```

### AddressInput Interface

```typescript
interface AddressInput {
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}
```

### NormalizedAddress Interface

```typescript
interface NormalizedAddress {
  addressLine1: string;
  addressLine2: string; // Empty string if null/undefined
  city: string;
  state: string;
  postalCode: string;
  country: string;
}
```

### Modified UsersService Methods

```typescript
class UsersService {
  /**
   * Creates an address with deduplication for authenticated users
   * Returns existing address if duplicate found, otherwise creates new
   */
  async createAddress(
    userId: string | null,
    createAddressDto: CreateAddressDto
  ): Promise<Address>;

  /**
   * Finds an existing duplicate address for a user
   * Returns null if no duplicate found
   */
  private async findDuplicateAddress(
    userId: string,
    normalizedAddress: NormalizedAddress
  ): Promise<Address | null>;

  /**
   * Updates contact info and default status on existing address
   */
  private async updateExistingAddress(
    addressId: string,
    userId: string,
    fullName: string,
    phone: string,
    isDefault: boolean
  ): Promise<Address>;
}
```

## Data Models

No changes to the Prisma schema are required. The existing Address model supports all necessary operations:

```prisma
model Address {
  id              String   @id @default(uuid())
  userId          String?
  fullName        String
  phone           String
  addressLine1    String
  addressLine2    String?
  city            String
  state           String
  postalCode      String
  country         String
  isDefault       Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  // ... relations
}
```

The deduplication logic uses the existing `userId` index for efficient queries.


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Duplicate detection with key fields

*For any* authenticated user and any two addresses with identical normalized key fields (addressLine1, addressLine2, city, state, postalCode, country), attempting to create the second address should return the existing address instead of creating a new record.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Contact information update on duplicate

*For any* existing address and duplicate address with different fullName or phone, creating the duplicate should update the existing address's fullName and phone fields to match the new values.

**Validates: Requirements 1.4**

### Property 3: Normalization preserves semantic equivalence

*For any* two addresses that differ only in whitespace (leading/trailing spaces, multiple consecutive spaces), capitalization of text fields, postal code formatting (spaces/hyphens), or country code casing, the normalized versions should be identical.

**Validates: Requirements 1.5, 2.1, 2.2, 2.3, 2.4, 2.5**

### Property 4: Default address uniqueness

*For any* user with multiple addresses, after setting any address as default, exactly one address should have isDefault=true and all others should have isDefault=false.

**Validates: Requirements 3.2**

### Property 5: Default status preservation on non-default duplicate

*For any* existing address with isDefault=true, creating a duplicate with isDefault=false should preserve the existing address's default status as true.

**Validates: Requirements 3.3**

### Property 6: Default status update on default duplicate

*For any* existing address with isDefault=false, creating a duplicate with isDefault=true should update the existing address's default status to true and unset default on all other addresses.

**Validates: Requirements 3.1**

### Property 7: Comparison function purity

*For any* two addresses, calling the comparison function multiple times with the same inputs should always return the same result.

**Validates: Requirements 4.2**

### Property 8: Guest address isolation

*For any* address, creating it as a guest user (null userId) should always create a new record, even if an identical address exists for the same or different guest sessions.

**Validates: Requirements 6.1, 6.2**

### Property 9: User address isolation

*For any* two different authenticated users and any address, creating the same address for both users should result in two separate address records.

**Validates: Requirements 6.3, 6.4**

### Property 10: AddressLine2 significance

*For any* two addresses identical except that one has addressLine2 as null/empty and the other has a non-empty addressLine2, they should be treated as different addresses.

**Validates: Requirements 7.1**

### Property 11: Country code significance

*For any* two addresses identical except for the country code, they should be treated as different addresses.

**Validates: Requirements 7.2**

## Error Handling

The deduplication system handles errors gracefully:

1. **Database Query Failures**: If the duplicate check query fails, the system falls back to creating a new address rather than blocking the user
2. **Null/Undefined Values**: The normalization functions handle null and undefined values by converting them to empty strings for optional fields
3. **Invalid Data**: The existing DTO validation catches invalid data before it reaches the deduplication logic
4. **Concurrent Creation**: The database's ACID properties ensure that concurrent address creation attempts don't create race conditions

Error responses:
- `400 Bad Request`: Invalid address data (caught by DTO validation)
- `500 Internal Server Error`: Database failures during deduplication check (with fallback to creation)

## Testing Strategy

The address deduplication system will be tested using both property-based testing and unit testing:

### Property-Based Testing

We will use **fast-check** (a TypeScript property-based testing library) to verify the correctness properties. Each property-based test will run a minimum of 100 iterations with randomly generated inputs.

Property-based tests will:
- Generate random addresses with variations in whitespace, casing, and formatting
- Generate random user IDs to test isolation
- Test the pure normalization and comparison functions independently
- Test the full deduplication flow with mocked database operations

Each property-based test must be tagged with a comment explicitly referencing the correctness property:
```typescript
// Feature: address-deduplication, Property 1: Duplicate detection with key fields
```

### Unit Testing

Unit tests will cover:
- Specific examples of address normalization (e.g., "123  Main  St" → "123 main st")
- Edge cases like addresses with special characters, apartment numbers, and international formats
- Integration with the database layer (using test database)
- Default address management logic
- Error handling scenarios

### Test Organization

Tests will be organized as follows:
- `backend/src/users/__tests__/address-deduplication.util.test.ts`: Pure function tests for normalization and comparison
- `backend/src/users/__tests__/address-deduplication.service.test.ts`: Service layer tests with database mocking
- `backend/test/address-deduplication.e2e-spec.ts`: End-to-end tests for the full API flow

## Implementation Notes

### Performance Considerations

1. **Query Optimization**: The duplicate check query uses the existing `userId` index, making it efficient even for users with many addresses
2. **Normalization Caching**: Normalization is performed once per address creation, not repeatedly
3. **Guest User Bypass**: Guest users skip the duplicate check entirely, avoiding unnecessary database queries

### Migration Strategy

For existing duplicate addresses in the database:

1. Create a migration script that identifies duplicates using the same normalization logic
2. For each group of duplicates:
   - Keep the most recently created address
   - Update order references to point to the kept address
   - Delete the redundant addresses
3. Run the migration during a maintenance window to avoid conflicts with active sessions

### Future Enhancements

Potential improvements for future iterations:

1. **Address Validation API**: Integrate with a third-party address validation service to catch typos and suggest corrections
2. **Fuzzy Matching**: Detect near-duplicates (e.g., "123 Main St" vs "123 Main Street") using string similarity algorithms
3. **Address Standardization**: Use postal service APIs to standardize addresses to official formats
4. **Bulk Deduplication UI**: Provide an admin interface to review and merge duplicates manually
