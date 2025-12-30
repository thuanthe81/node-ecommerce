# Design Document

## Overview

This design addresses userId-related issues in the order system by ensuring all orders require user authentication. The solution eliminates guest orders and focuses on proper authentication validation, user-owned address validation, and access control to support seamless order operations for authenticated users only.

## Architecture

The order system follows a layered architecture:

1. **Controller Layer**: Handles HTTP requests and extracts user context
2. **Service Layer**: Contains business logic for order operations
3. **Data Layer**: Manages database operations through Prisma ORM
4. **Validation Layer**: Ensures data integrity and access control

## Components and Interfaces

### Order Controller
- **Purpose**: Handle HTTP requests for order operations
- **Key Methods**:
  - `create()`: Extract userId from authentication context
  - `findOne()`: Validate access based on userId and user role
  - `findAll()`: Filter orders based on user permissions

### Order Service
- **Purpose**: Implement business logic for order management
- **Key Methods**:
  - `create(createOrderDto, userId?)`: Handle order creation with optional userId
  - `findOne(id, userId?, userRole?)`: Retrieve orders with access control
  - `findAllByUser(userId)`: Get orders for authenticated users

### User Service
- **Purpose**: Manage user registration and profile updates with email uniqueness
- **Key Methods**:
  - `create(userData)`: Validate email uniqueness before user creation
  - `updateEmail(userId, newEmail)`: Validate new email is not already in use
  - `validateEmailUniqueness(email, excludeUserId?)`: Check if email is available

### Access Control Service
- **Purpose**: Validate order access permissions
- **Key Methods**:
  - `validateOrderAccess()`: Check if user can access specific order
  - `getOrderPermissions()`: Determine user permissions for order operations

## Data Models

### User Model (Prisma Schema)
```typescript
model User {
  id              String   @id @default(uuid())
  email           String   @unique  // UNIQUE constraint enforced
  passwordHash    String?
  firstName       String
  lastName        String
  // ... other fields

  orders          Order[]
  addresses       Address[]
  // ... other relations

  @@index([email])  // Index for performance
}
```

### Order Model (Prisma Schema)
```typescript
model Order {
  id                String        @id @default(uuid())
  orderNumber       String        @unique
  userId            String        // Required - not null
  email             String        // Required for all orders
  // ... other fields

  user            User            @relation(fields: [userId], references: [id])
  // ... other relations
}
```

### Address Model
```typescript
model Address {
  id           String   @id @default(uuid())
  userId       String   // Required - not null for user addresses
  // ... other fields

  user           User     @relation(fields: [userId], references: [id])
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Authentication and Access Control Properties

Property 1: Authentication requirement for order creation
*For any* order creation request, the system should require valid authentication and reject unauthenticated requests
**Validates: Requirements 1.1, 1.4, 4.1**

Property 2: User order access control
*For any* authenticated user, order retrieval should return only orders where userId matches their authentication context
**Validates: Requirements 2.4**

Property 3: Address ownership validation
*For any* order creation with addresses, the system should validate that all addresses belong to the authenticated user
**Validates: Requirements 2.3, 4.3**

### Database Integrity Properties

Property 4: Required userId constraint
*For any* order stored in the database, the userId field should never be null, undefined, or empty
**Validates: Requirements 1.3, 1.5, 4.2, 4.5**

Property 5: User relationship integrity
*For any* order created or updated, the system should maintain proper foreign key relationships with the User model
**Validates: Requirements 2.2, 2.5**

Property 6: UserId preservation during updates
*For any* order update operation (status change, price update, cancellation), the userId should remain unchanged and valid
**Validates: Requirements 3.3, 3.4, 3.5**

### Admin Access Properties

Property 7: Admin universal order access
*For any* order in the system, admin users should be able to retrieve, update, and manage the order with its associated user information
**Validates: Requirements 3.1, 3.2**

### Email Uniqueness Properties

Property 8: Email uniqueness validation
*For any* user registration or email update operation, the system should prevent duplicate email addresses and return appropriate error messages
**Validates: Requirements 5.1, 5.2, 5.4**

Property 9: Database email constraint enforcement
*For any* attempt to create duplicate email records, the database should enforce uniqueness constraints and handle violations gracefully
**Validates: Requirements 5.3, 5.5**

### System Robustness Properties

Property 10: Authenticated user context extraction
*For any* authenticated order creation request, the system should correctly extract and use the userId from the authentication context
**Validates: Requirements 2.1**

Property 11: Access validation without null comparison issues
*For any* order access validation, the system should properly validate userId matches using safe comparison operations
**Validates: Requirements 4.4**

## Error Handling

### UserId-Related Errors
1. **Undefined UserId Handling**: Convert undefined to null for database compatibility
2. **Null Comparison Safety**: Use proper null-safe comparison operators
3. **Access Control Validation**: Handle all combinations of null/non-null userId values
4. **Database Constraint Compliance**: Ensure null userId values don't violate foreign key constraints

### Email Uniqueness Errors
1. **Duplicate Email Detection**: Check for existing emails before user creation/update
2. **Clear Error Messages**: Provide user-friendly error messages for duplicate emails
3. **Database Constraint Enforcement**: Handle unique constraint violations gracefully
4. **Registration Flow Protection**: Prevent account creation with duplicate emails

## Testing Strategy

### Property-Based Testing
- **Framework**: Use Jest with fast-check for property-based testing
- **Test Configuration**: Minimum 100 iterations per property test
- **Coverage**: Test all userId scenarios (null, valid, undefined) and email uniqueness cases

### Unit Testing
- **Guest Order Scenarios**: Test order creation, retrieval, and management for guest users
- **Authenticated User Scenarios**: Test order operations with valid userId values
- **Admin Operations**: Test admin access to all order types
- **Email Validation**: Test user registration and email update scenarios
- **Error Conditions**: Test edge cases and error handling

### Integration Testing
- **End-to-End Order Flow**: Test complete order creation and management workflows
- **Authentication Integration**: Test userId extraction and validation across the full stack
- **Database Integrity**: Test foreign key relationships and constraint enforcement
- **User Management Flow**: Test user registration and email uniqueness enforcement

<function_calls>
<invoke name="prework">
<parameter name="featureName">order-userid-fix