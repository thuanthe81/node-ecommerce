# Design Document

## Overview

The analytics dashboard is failing due to PostgreSQL enum type casting errors in raw SQL queries. The issue occurs when comparing PaymentStatus enum columns with string values using Prisma's $queryRaw method. PostgreSQL requires explicit type casting when comparing enum types with string literals to prevent "operator does not exist" errors.

This design addresses the problem by implementing proper type casting in all raw SQL queries that reference PaymentStatus enum values, ensuring the analytics dashboard functions correctly while maintaining query performance and accuracy.

## Architecture

The fix involves modifying the AnalyticsService class to use proper PostgreSQL type casting syntax in raw SQL queries. The solution maintains the existing service architecture while ensuring type safety for enum comparisons.

### Current Architecture
```
AnalyticsController → AnalyticsService → PrismaService → PostgreSQL
```

### Components Affected
- **AnalyticsService**: Contains raw SQL queries that need enum type casting fixes
- **Raw SQL Queries**: Four methods using $queryRaw with PaymentStatus comparisons
- **PostgreSQL Database**: Enum type validation and comparison operations

## Components and Interfaces

### AnalyticsService Methods Requiring Updates

#### 1. getDailySales Method
- **Current Issue**: Direct enum comparison `"paymentStatus" = ${STATUS.PAYMENT_STATUS.PAID}`
- **Fix Required**: Type casting to `"paymentStatus" = ${STATUS.PAYMENT_STATUS.PAID}::PaymentStatus`

#### 2. getWeeklySales Method
- **Current Issue**: Direct enum comparison `"paymentStatus" = ${STATUS.PAYMENT_STATUS.PAID}`
- **Fix Required**: Type casting to `"paymentStatus" = ${STATUS.PAYMENT_STATUS.PAID}::PaymentStatus`

#### 3. getMonthlySales Method
- **Current Issue**: Direct enum comparison `"paymentStatus" = ${STATUS.PAYMENT_STATUS.PAID}`
- **Fix Required**: Type casting to `"paymentStatus" = ${STATUS.PAYMENT_STATUS.PAID}::PaymentStatus`

#### 4. getTopProducts Method
- **Current Issue**: Direct enum comparison `o."paymentStatus" = ${STATUS.PAYMENT_STATUS.PAID}`
- **Fix Required**: Type casting to `o."paymentStatus" = ${STATUS.PAYMENT_STATUS.PAID}::PaymentStatus`

### Type Casting Approach

PostgreSQL supports two type casting syntaxes:
1. **Cast Operator**: `value::PaymentStatus` (preferred for readability)
2. **CAST Function**: `CAST(value AS PaymentStatus)` (more verbose but explicit)

The design uses the cast operator syntax for consistency and readability.

## Data Models

No changes to existing data models are required. The PaymentStatus enum remains unchanged:

```sql
enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}
```

The fix only affects how enum values are compared in raw SQL queries, not the enum definition itself.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Converting EARS to Properties

Based on the prework analysis, I'll convert the testable acceptance criteria into correctness properties:

Property 1: All analytics queries execute successfully
*For any* valid date range parameters, all analytics service methods with raw SQL queries should execute without database type casting errors
**Validates: Requirements 1.1, 1.3, 1.4, 3.2, 3.3, 3.4, 3.5**

Property 2: Data accuracy preservation
*For any* test dataset with mixed payment statuses, the analytics results after the fix should match the expected results that only include PAID orders
**Validates: Requirements 2.2, 2.3, 2.4**

Property 3: Error message clarity
*For any* intentionally malformed enum comparison, the system should provide clear, actionable error messages for debugging
**Validates: Requirements 4.2**

## Error Handling

### Database Connection Errors
- Maintain existing error handling for database connectivity issues
- Ensure type casting errors are caught and logged appropriately
- Provide fallback behavior when analytics queries fail

### Invalid Date Range Handling
- Validate date range parameters before executing queries
- Return appropriate error responses for invalid date ranges
- Log parameter validation failures for debugging

### Enum Value Validation
- Ensure only valid PaymentStatus enum values are used in queries
- Validate enum constants from the STATUS object before query execution
- Handle cases where enum values might be undefined or null

## Testing Strategy

### Dual Testing Approach
The testing strategy combines unit tests for specific scenarios and property-based tests for comprehensive coverage:

**Unit Tests:**
- Test specific date ranges with known data sets
- Verify error handling for invalid parameters
- Test edge cases like empty result sets
- Validate data transformation logic

**Property-Based Tests:**
- Generate random valid date ranges and verify queries execute successfully
- Test with various payment status combinations to ensure filtering accuracy
- Verify data consistency across different time period aggregations
- Test error scenarios with invalid enum values

### Property Test Configuration
- Use a property-based testing library compatible with NestJS (e.g., fast-check)
- Configure minimum 100 iterations per property test
- Tag each property test with: **Feature: analytics-dashboard-enum-fix, Property {number}: {property_text}**
- Each correctness property must be implemented by a single property-based test

### Test Data Management
- Create test orders with various PaymentStatus values
- Use database transactions for test isolation
- Clean up test data after each test run
- Mock external dependencies while testing database queries

### Integration Testing
- Test the complete analytics dashboard endpoint flow
- Verify frontend can successfully load dashboard data
- Test with realistic data volumes to ensure performance
- Validate caching behavior is not affected by the changes