# Requirements Document

## Introduction

The admin order management system has two issues:
1. The admin order management page displays an incorrect route path when clicking "View Details" on an order, showing `/undefined/admin/orders/[id]` instead of the correct locale-prefixed path
2. Administrators receive "unauthorized" errors when attempting to update payment status on orders, despite having admin privileges

## Glossary

- **Admin Order Management Page**: The page at `/[locale]/admin/orders` where administrators view and manage all customer orders
- **Order Detail Link**: The "View Details" link in each order row that navigates to the specific order's detail page
- **Route Params**: Dynamic URL parameters in Next.js, specifically the `locale` parameter that determines the language
- **Async Params**: In Next.js 15, route parameters are returned as Promises and must be awaited
- **Payment Status Update**: The ability for administrators to change an order's payment status (PENDING, PAID, FAILED, REFUNDED)
- **Authorization Guard**: Backend security mechanism that validates user roles before allowing access to protected endpoints

## Requirements

### Requirement 1

**User Story:** As an administrator, I want to click "View Details" on an order and navigate to the correct order detail page, so that I can view complete order information.

#### Acceptance Criteria

1. WHEN an administrator clicks "View Details" on an order THEN the system SHALL navigate to the correct locale-prefixed URL path
2. WHEN the locale is "en" THEN the system SHALL navigate to `/en/admin/orders/[orderId]`
3. WHEN the locale is "vi" THEN the system SHALL navigate to `/vi/admin/orders/[orderId]`
4. WHEN the page component receives route params THEN the system SHALL await the params Promise before accessing locale value
5. WHEN the locale value is accessed THEN the system SHALL never be undefined

### Requirement 2

**User Story:** As a developer, I want the admin orders page to follow Next.js 15 best practices, so that the application remains compatible with the framework.

#### Acceptance Criteria

1. WHEN the page component accesses route params THEN the system SHALL use async/await syntax
2. WHEN passing locale to child components THEN the system SHALL ensure the value is resolved from the Promise
3. WHEN the component renders THEN the system SHALL not cause hydration errors or runtime warnings

### Requirement 3

**User Story:** As an administrator, I want to update the payment status of an order from the order detail page, so that I can accurately track payment confirmations and manage order fulfillment.

#### Acceptance Criteria

1. WHEN an administrator views an order detail page THEN the system SHALL display the current payment status
2. WHEN an administrator clicks to update payment status THEN the system SHALL display available payment status options
3. WHEN an administrator selects a new payment status THEN the system SHALL update the order's payment status in the database
4. WHEN the payment status is successfully updated THEN the system SHALL display a success confirmation message
5. WHEN the payment status update fails THEN the system SHALL display an error message and maintain the previous status
6. WHEN the payment status is updated THEN the system SHALL refresh the order details to reflect the new status

### Requirement 4

**User Story:** As an administrator, I want my admin role to be properly recognized by the backend, so that I can perform administrative actions without authorization errors.

#### Acceptance Criteria

1. WHEN an administrator makes an API request to a protected endpoint THEN the system SHALL validate the JWT token
2. WHEN the JWT token contains an admin role THEN the system SHALL allow access to admin-only endpoints
3. WHEN the payment status update endpoint is called THEN the system SHALL verify the user has ADMIN role
4. WHEN authorization fails THEN the system SHALL return a 403 Forbidden status with a clear error message
5. WHEN the user is not authenticated THEN the system SHALL return a 401 Unauthorized status
