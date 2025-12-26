# Requirements Document

## Introduction

The analytics dashboard is currently failing due to PostgreSQL enum type casting errors in raw SQL queries. When the system attempts to compare PaymentStatus enum values with string literals in $queryRaw operations, PostgreSQL throws an error: "operator does not exist: PaymentStatus = text". This prevents the dashboard from loading critical business metrics including revenue data, top products, and sales reports.

## Glossary

- **Analytics_Service**: The backend service responsible for generating dashboard metrics and reports
- **PaymentStatus_Enum**: PostgreSQL enum type with values PENDING, PAID, FAILED, REFUNDED
- **Raw_SQL_Query**: Direct SQL queries executed via Prisma's $queryRaw method
- **Type_Casting**: PostgreSQL operation to convert between data types using :: or CAST syntax
- **Dashboard_Metrics**: Business intelligence data including revenue, sales, and product performance

## Requirements

### Requirement 1: Fix Enum Type Casting in Raw SQL Queries

**User Story:** As a business administrator, I want the analytics dashboard to load successfully, so that I can view critical business metrics and make informed decisions.

#### Acceptance Criteria

1. WHEN the analytics service executes raw SQL queries with PaymentStatus comparisons, THE Analytics_Service SHALL properly cast enum values to prevent type mismatch errors
2. WHEN comparing PaymentStatus enum values in SQL queries, THE Analytics_Service SHALL use explicit type casting syntax (::PaymentStatus or CAST)
3. WHEN the dashboard loads metrics, THE Analytics_Service SHALL return valid data without database errors
4. WHEN raw SQL queries reference enum columns, THE Analytics_Service SHALL ensure all enum comparisons are type-safe

### Requirement 2: Maintain Query Performance and Accuracy

**User Story:** As a business administrator, I want analytics queries to remain fast and accurate, so that dashboard performance is not degraded by the fix.

#### Acceptance Criteria

1. WHEN enum type casting is applied, THE Analytics_Service SHALL maintain existing query performance characteristics
2. WHEN retrieving dashboard metrics, THE Analytics_Service SHALL return the same accurate data as before the fix
3. WHEN executing sales reports, THE Analytics_Service SHALL filter orders correctly using properly cast PaymentStatus values
4. WHEN calculating revenue data, THE Analytics_Service SHALL only include orders with PAID status using correct type casting

### Requirement 3: Comprehensive Enum Query Coverage

**User Story:** As a system maintainer, I want all enum-related database queries to be properly typed, so that similar errors don't occur in other parts of the system.

#### Acceptance Criteria

1. WHEN reviewing all raw SQL queries in the analytics service, THE Analytics_Service SHALL have proper type casting for all enum comparisons
2. WHEN executing daily sales queries, THE Analytics_Service SHALL cast PaymentStatus enum values correctly
3. WHEN executing weekly sales queries, THE Analytics_Service SHALL cast PaymentStatus enum values correctly
4. WHEN executing monthly sales queries, THE Analytics_Service SHALL cast PaymentStatus enum values correctly
5. WHEN executing top products queries, THE Analytics_Service SHALL cast PaymentStatus enum values correctly

### Requirement 4: Error Prevention and Validation

**User Story:** As a developer, I want clear guidelines for enum usage in raw SQL, so that future database queries avoid similar type casting issues.

#### Acceptance Criteria

1. WHEN writing new raw SQL queries with enums, THE Analytics_Service SHALL follow established type casting patterns
2. WHEN the system encounters enum type mismatches, THE Analytics_Service SHALL provide clear error messages for debugging
3. WHEN validating database queries, THE Analytics_Service SHALL ensure all enum references use proper PostgreSQL syntax
4. WHEN testing analytics functionality, THE Analytics_Service SHALL verify that all enum-based filters work correctly