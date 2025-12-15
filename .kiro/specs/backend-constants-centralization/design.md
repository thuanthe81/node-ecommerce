# Design Document

## Overview

This design outlines the centralization of common string constants used throughout the backend NestJS application. The goal is to create a well-organized, type-safe constants file that eliminates hardcoded strings and provides a single source of truth for commonly used values like status enums, cache keys, role names, MIME types, and other repeated string literals.

The design follows the existing pattern established in the email design tokens file and leverages TypeScript's type system to provide excellent developer experience with autocompletion and type safety.

## Architecture

The constants will be organized in a hierarchical structure using nested objects, similar to the existing `email-design-tokens.ts` pattern. This approach provides:

- **Logical grouping** of related constants
- **Namespace isolation** to prevent naming conflicts
- **Type safety** through TypeScript interfaces and const assertions
- **Tree-shakable exports** for optimal bundle size
- **Extensibility** for future additions

### File Structure

```
backend/src/common/constants.ts
```

The constants file will be placed in the `common` module to indicate its shared nature across the entire application.

## Components and Interfaces

### 1. Status Constants

**Order Status Constants**
- Maps to Prisma `OrderStatus` enum values
- Provides string literals for all order states
- Used in services, controllers, and email templates

**Payment Status Constants**
- Maps to Prisma `PaymentStatus` enum values
- Provides string literals for payment states
- Used in payment processing and analytics

**User Role Constants**
- Maps to Prisma `UserRole` enum values
- Provides string literals for authorization
- Used in guards, decorators, and role checks

### 2. Cache Key Constants

**Category Cache Keys**
- Tree structure cache keys
- Individual category cache keys
- Slug-based cache keys

**Product Cache Keys**
- Product listing cache keys
- Individual product cache keys
- Search result cache keys

**Shipping Cache Keys**
- Shipping method cache keys
- Rate calculation cache keys

### 3. System Constants

**MIME Types**
- File upload validation
- Email attachment handling
- Content type headers

**Email Configuration**
- SMTP defaults
- Template identifiers
- Email client compatibility

**API Configuration**
- Default pagination limits
- Timeout values
- Rate limiting constants

## Data Models

### TypeScript Interfaces

```typescript
interface StatusConstants {
  ORDER_STATUS: {
    PENDING: 'PENDING';
    PENDING_QUOTE: 'PENDING_QUOTE';
    PROCESSING: 'PROCESSING';
    SHIPPED: 'SHIPPED';
    DELIVERED: 'DELIVERED';
    CANCELLED: 'CANCELLED';
    REFUNDED: 'REFUNDED';
  };
  PAYMENT_STATUS: {
    PENDING: 'PENDING';
    PAID: 'PAID';
    FAILED: 'FAILED';
    REFUNDED: 'REFUNDED';
  };
  USER_ROLES: {
    ADMIN: 'ADMIN';
    CUSTOMER: 'CUSTOMER';
  };
}

interface CacheKeyConstants {
  CATEGORIES: {
    TREE: 'categories:tree';
    BY_SLUG: (slug: string) => `category:slug:${slug}`;
    BY_ID: (id: string) => `category:id:${id}`;
  };
  PRODUCTS: {
    LIST: 'products:list';
    BY_ID: (id: string) => `product:id:${id}`;
    BY_SLUG: (slug: string) => `product:slug:${slug}`;
  };
  SHIPPING: {
    METHODS: 'shipping:methods';
    RATES: (params: string) => `shipping:rates:${params}`;
  };
}

interface SystemConstants {
  MIME_TYPES: {
    PDF: 'application/pdf';
    JPEG: 'image/jpeg';
    PNG: 'image/png';
    JSON: 'application/json';
    // ... other MIME types
  };
  EMAIL: {
    DEFAULT_FROM: 'noreply@example.com';
    SMTP_PORT: '587';
    SMTP_SERVER: 'smtp.gmail.com';
  };
  API: {
    DEFAULT_PAGE_SIZE: 20;
    MAX_PAGE_SIZE: 100;
    DEFAULT_TIMEOUT: 30000;
  };
}
```

### Const Assertions

All constants will use TypeScript's `as const` assertion to ensure immutability and precise type inference:

```typescript
export const CONSTANTS = {
  STATUS: {
    ORDER_STATUS: {
      PENDING: 'PENDING',
      PROCESSING: 'PROCESSING',
      // ...
    } as const,
    // ...
  },
  // ...
} as const;
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Property 1: Status value centralization
*For any* status value usage in the codebase, the system should reference constants from the centralized constants file rather than using hardcoded strings
**Validates: Requirements 1.1, 3.1, 3.2, 3.3**

Property 2: Cache key centralization
*For any* cache operation, the system should reference cache key constants from the centralized constants file rather than using hardcoded strings
**Validates: Requirements 1.2, 3.4**

Property 3: MIME type centralization
*For any* MIME type usage, the system should reference MIME type constants from the centralized constants file rather than using hardcoded strings
**Validates: Requirements 1.4, 3.5**

Property 4: Consistent naming conventions
*For any* constant name in the constants file, the name should follow consistent naming patterns (UPPER_CASE for constants, descriptive names)
**Validates: Requirements 2.2**

Property 5: JSDoc documentation completeness
*For any* constant or constant group in the constants file, there should be JSDoc comments explaining their purpose
**Validates: Requirements 2.4**

## Error Handling

### Import Errors
- **Missing Constants**: If a constant is referenced but not defined, TypeScript will catch this at compile time
- **Typos in Constant Names**: TypeScript's strict typing will prevent typos in constant references
- **Circular Dependencies**: The constants file will have no dependencies on other application modules to prevent circular imports

### Runtime Errors
- **Cache Key Collisions**: Cache key generation functions will include validation to prevent key collisions
- **Invalid Status Values**: Constants will be validated against Prisma enum values to ensure consistency
- **MIME Type Validation**: MIME type constants will be validated against standard MIME type specifications

### Migration Errors
- **Gradual Migration**: The refactoring will be done incrementally to avoid breaking changes
- **Backward Compatibility**: Old hardcoded values will be replaced gradually with proper testing
- **Type Safety**: TypeScript will catch any mismatched types during the migration process

## Testing Strategy

### Unit Testing
Unit tests will verify:
- Constants file structure and organization
- Proper TypeScript typing and const assertions
- JSDoc documentation presence
- Export patterns (named and grouped exports)
- Import compatibility (named and namespace imports)

### Property-Based Testing
Property-based tests will verify:
- No hardcoded status strings exist in the codebase after migration
- All cache operations use constant references
- All MIME type usage references constants
- Consistent naming conventions across all constants
- Complete JSDoc documentation for all constants

The property-based testing framework **fast-check** will be used for TypeScript/Node.js property testing, configured to run a minimum of 100 iterations per property test.

Each property-based test will be tagged with comments explicitly referencing the correctness property from this design document using the format: **Feature: backend-constants-centralization, Property {number}: {property_text}**

### Integration Testing
Integration tests will verify:
- Constants work correctly across module boundaries
- Cache operations function properly with constant keys
- Status-based logic works with constant values
- Email services work with constant identifiers
- File upload validation works with MIME type constants

### Migration Testing
Migration tests will verify:
- All hardcoded strings have been replaced
- No breaking changes in API behavior
- Performance impact is minimal
- Type safety is maintained throughout the migration