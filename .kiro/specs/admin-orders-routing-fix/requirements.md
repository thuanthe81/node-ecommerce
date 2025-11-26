# Requirements Document

## Introduction

The admin order management page currently displays an incorrect route path when clicking "View Details" on an order. The link shows `/undefined/admin/orders/[id]` instead of the correct locale-prefixed path like `/en/admin/orders/[id]` or `/vi/admin/orders/[id]`. This is caused by the Next.js 15 migration where route params are now asynchronous and must be awaited before use.

## Glossary

- **Admin Order Management Page**: The page at `/[locale]/admin/orders` where administrators view and manage all customer orders
- **Order Detail Link**: The "View Details" link in each order row that navigates to the specific order's detail page
- **Route Params**: Dynamic URL parameters in Next.js, specifically the `locale` parameter that determines the language
- **Async Params**: In Next.js 15, route parameters are returned as Promises and must be awaited

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
