# Design Document

## Overview

This feature enhances the admin dashboard by replacing hardcoded statistics with real-time data fetched from the backend. The implementation leverages the existing analytics service for revenue and order data, and extends the backend API to provide product and customer counts. The frontend will use React hooks for data fetching, loading states, error handling, and automatic refresh functionality.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────┐
│   Admin Dashboard Component         │
│  ┌──────────────────────────────┐  │
│  │  useDashboardStats Hook      │  │
│  │  - Fetches all stats         │  │
│  │  - Manages loading states    │  │
│  │  - Handles errors            │  │
│  │  - Auto-refresh timer        │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│   Frontend API Client Layer         │
│  - getDashboardMetrics()            │
│  - getProductCount()                │
│  - getCustomerCount()               │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│   Backend API Controllers           │
│  - AnalyticsController              │
│  - ProductsController (extended)    │
│  - UsersController (extended)       │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│   Backend Services                  │
│  - AnalyticsService                 │
│  - ProductsService                  │
│  - UsersService                     │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│   Database (Prisma)                 │
│  - Orders table                     │
│  - Products table                   │
│  - Users table                      │
└─────────────────────────────────────┘
```

### Component Interaction Flow

1. **Dashboard Mount**: Admin dashboard component mounts and triggers the `useDashboardStats` hook
2. **Parallel Fetching**: Hook initiates parallel API calls for all four stats
3. **Loading State**: Each stat displays a loading skeleton while fetching
4. **Data Display**: Successfully fetched data replaces loading states
5. **Error Handling**: Failed requests show error UI with retry button
6. **Auto-Refresh**: Timer triggers refresh every 5 minutes while component is mounted

## Components and Interfaces

### Frontend Components

#### 1. Admin Dashboard Page Component
- **Location**: `frontend/app/[locale]/admin/page.tsx`
- **Responsibilities**:
  - Render dashboard layout
  - Use `useDashboardStats` hook for data
  - Display stats with loading/error states
  - Handle retry actions

#### 2. useDashboardStats Hook
- **Location**: `frontend/hooks/useDashboardStats.ts` (new file)
- **Responsibilities**:
  - Fetch all dashboard statistics
  - Manage loading states for each stat
  - Handle errors independently per stat
  - Implement auto-refresh with cleanup
  - Provide retry functionality

### Backend Components

#### 1. Analytics Controller (Extended)
- **Location**: `backend/src/analytics/analytics.controller.ts`
- **New Endpoint**: Already has `/analytics/dashboard` endpoint
- **Returns**: Revenue and order count data

#### 2. Products Controller (Extended)
- **Location**: `backend/src/products/products.controller.ts`
- **New Endpoint**: `GET /products/count`
- **Returns**: Total product count
- **Access**: Admin only

#### 3. Users Controller (Extended)
- **Location**: `backend/src/users/users.controller.ts`
- **New Endpoint**: `GET /users/count`
- **Returns**: Total customer count (users with CUSTOMER role)
- **Access**: Admin only

### API Client Functions

#### 1. Analytics API (Existing)
- **Function**: `getDashboardMetrics()`
- **Returns**: Revenue and order count

#### 2. Product API (Extended)
- **Location**: `frontend/lib/product-api.ts`
- **New Function**: `getProductCount()`
- **Returns**: `{ count: number }`

#### 3. User API (Extended)
- **Location**: `frontend/lib/user-api.ts`
- **New Function**: `getCustomerCount()`
- **Returns**: `{ count: number }`

## Data Models

### Dashboard Stats State

```typescript
interface DashboardStats {
  revenue: {
    value: number | null;
    loading: boolean;
    error: string | null;
  };
  orders: {
    value: number | null;
    loading: boolean;
    error: string | null;
  };
  products: {
    value: number | null;
    loading: boolean;
    error: string | null;
  };
  customers: {
    value: number | null;
    loading: boolean;
    error: string | null;
  };
}
```

### API Response Types

```typescript
// From existing analytics API
interface DashboardMetrics {
  revenue: {
    totalRevenue: number;
    totalOrders: number;
  };
  // ... other fields
}

// New product count response
interface ProductCountResponse {
  count: number;
}

// New customer count response
interface CustomerCountResponse {
  count: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Acceptance Criteria Testing Prework

1.1 WHEN the admin dashboard loads, THE system SHALL fetch the total revenue from paid orders via the backend analytics service
Thoughts: This is about the system behavior when loading the dashboard. We can test that the API is called with correct parameters and that the response is properly handled. This is testable as a property across different dashboard loads.
Testable: yes - property

1.2 WHEN the revenue data is loading, THE system SHALL display a loading indicator in place of the hardcoded value
Thoughts: This is about UI state during loading. We can test that when the loading state is true, a loading indicator is rendered. This applies to all loading scenarios.
Testable: yes - property

1.3 WHEN the revenue data is successfully fetched, THE system SHALL display the formatted revenue amount with currency symbol
Thoughts: This is about formatting logic that should work for any revenue value. We can generate random revenue amounts and verify they're formatted correctly with currency symbols.
Testable: yes - property

1.4 IF the revenue fetch fails, THEN THE system SHALL display an error state with a retry option
Thoughts: This is about error handling behavior. We can simulate API failures and verify error UI appears with retry button. This should work for any error scenario.
Testable: yes - property

1.5 THE system SHALL format revenue values according to locale conventions
Thoughts: This is about locale-specific formatting. We can test with different locales and revenue values to ensure proper formatting. This is a property that should hold for all locale/value combinations.
Testable: yes - property

2.1 WHEN the admin dashboard loads, THE system SHALL fetch the total count of orders from the backend
Thoughts: Similar to 1.1, this tests that the correct API call is made. This is a property about system behavior on load.
Testable: yes - property

2.2 WHEN the order count data is loading, THE system SHALL display a loading indicator
Thoughts: Same pattern as 1.2, testing loading state UI for order count.
Testable: yes - property

2.3 WHEN the order count is successfully fetched, THE system SHALL display the numeric count
Thoughts: This tests that fetched order counts are displayed. Should work for any valid count value.
Testable: yes - property

2.4 IF the order count fetch fails, THEN THE system SHALL display an error state with a retry option
Thoughts: Error handling for order count, similar to 1.4.
Testable: yes - property

3.1 WHEN the admin dashboard loads, THE system SHALL fetch the total count of products from the backend
Thoughts: API call verification for product count on dashboard load.
Testable: yes - property

3.2 WHEN the product count data is loading, THE system SHALL display a loading indicator
Thoughts: Loading state UI for product count.
Testable: yes - property

3.3 WHEN the product count is successfully fetched, THE system SHALL display the numeric count
Thoughts: Display of fetched product count values.
Testable: yes - property

3.4 IF the product count fetch fails, THEN THE system SHALL display an error state with a retry option
Thoughts: Error handling for product count.
Testable: yes - property

4.1 WHEN the admin dashboard loads, THE system SHALL fetch the total count of registered customers from the backend
Thoughts: API call verification for customer count on dashboard load.
Testable: yes - property

4.2 WHEN the customer count data is loading, THE system SHALL display a loading indicator
Thoughts: Loading state UI for customer count.
Testable: yes - property

4.3 WHEN the customer count is successfully fetched, THE system SHALL display the numeric count
Thoughts: Display of fetched customer count values.
Testable: yes - property

4.4 IF the customer count fetch fails, THEN THE system SHALL display an error state with a retry option
Thoughts: Error handling for customer count.
Testable: yes - property

5.1 IF any dashboard stat API call fails, THEN THE system SHALL display an error message for that specific stat
Thoughts: This tests independent error handling - one stat failing shouldn't affect others. We can test with various failure combinations.
Testable: yes - property

5.2 WHEN an error occurs, THE system SHALL provide a retry button for the failed stat
Thoughts: Error UI should include retry button. This should be true for any error scenario.
Testable: yes - property

5.3 WHEN the retry button is clicked, THE system SHALL re-attempt to fetch the failed stat data
Thoughts: Retry functionality should trigger a new API call. Testable for any failed stat.
Testable: yes - property

5.4 THE system SHALL continue to display successfully fetched stats even when other stats fail
Thoughts: This is about isolation - successful stats remain visible during partial failures. This is a key property about independent stat handling.
Testable: yes - property

5.5 THE system SHALL log errors to the console for debugging purposes
Thoughts: Error logging behavior. We can verify console.error is called with appropriate messages for any error.
Testable: yes - property

6.1 WHEN the admin dashboard is visible, THE system SHALL refresh dashboard stats every 5 minutes
Thoughts: This tests the auto-refresh timer behavior. We can verify that refresh is triggered at the correct interval.
Testable: yes - property

6.2 WHEN the user navigates away from the dashboard, THE system SHALL stop automatic refresh
Thoughts: This tests cleanup behavior. We can verify that the timer is cleared on component unmount.
Testable: yes - property

6.3 WHEN the user returns to the dashboard, THE system SHALL resume automatic refresh
Thoughts: This tests that refresh restarts on remount. Testable through mount/unmount cycles.
Testable: yes - property

6.4 THE system SHALL not interrupt the user experience during background refresh
Thoughts: This is about UX - background refresh shouldn't cause jarring UI changes. This is somewhat subjective but we can test that loading states don't flash during refresh.
Testable: yes - property

### Property Reflection

After reviewing all properties, I've identified the following patterns:

**Redundancy Analysis:**
- Properties 1.2, 2.2, 3.2, 4.2 all test the same loading indicator pattern for different stats - these can be combined into one property about loading state display
- Properties 1.4, 2.4, 3.4, 4.4 all test the same error handling pattern - these can be combined into one property about error state with retry
- Properties 2.3, 3.3, 4.3 all test numeric display - these can be combined with 1.3 into a general property about stat value display

**Consolidated Properties:**
1. Loading indicators appear for any stat during fetch
2. Error states with retry appear for any failed stat fetch
3. Successfully fetched stat values are displayed correctly (with appropriate formatting)
4. Independent stat handling (one failure doesn't affect others)
5. Auto-refresh behavior (start, stop, resume)

This consolidation reduces 24 individual test cases to 5 comprehensive properties that provide better coverage with less redundancy.

### Correctness Properties

Property 1: Loading state display
*For any* dashboard stat (revenue, orders, products, customers), when that stat is in a loading state, a loading indicator should be displayed in place of the stat value
**Validates: Requirements 1.2, 2.2, 3.2, 4.2**

Property 2: Error state with retry
*For any* dashboard stat that fails to fetch, an error message and retry button should be displayed, and clicking retry should trigger a new fetch attempt for that specific stat
**Validates: Requirements 1.4, 2.4, 3.4, 4.4, 5.2, 5.3**

Property 3: Stat value display and formatting
*For any* successfully fetched dashboard stat, the value should be displayed correctly: revenue with currency formatting according to locale, and counts as numeric values
**Validates: Requirements 1.3, 1.5, 2.3, 3.3, 4.3**

Property 4: Independent stat handling
*For any* combination of successful and failed stat fetches, successfully fetched stats should remain visible and functional while failed stats show error states independently
**Validates: Requirements 5.1, 5.4**

Property 5: Auto-refresh lifecycle
*For any* dashboard session, stats should refresh every 5 minutes while the component is mounted, stop refreshing when unmounted, and resume when remounted, without causing disruptive UI changes during background refresh
**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

Property 6: API call correctness
*For any* dashboard load, the system should make the correct API calls (analytics/dashboard for revenue and orders, products/count for products, users/count for customers) with appropriate authentication
**Validates: Requirements 1.1, 2.1, 3.1, 4.1**

Property 7: Error logging
*For any* stat fetch failure, an error should be logged to the console with sufficient detail for debugging
**Validates: Requirements 5.5**

## Error Handling

### Error Categories

1. **Network Errors**: Connection failures, timeouts
2. **Authentication Errors**: Invalid or expired tokens
3. **Authorization Errors**: User lacks admin privileges
4. **Server Errors**: 500-level responses from backend
5. **Data Errors**: Malformed response data

### Error Handling Strategy

#### Per-Stat Error Handling
- Each stat maintains its own error state
- Errors in one stat don't affect others
- Error messages are user-friendly and actionable
- Retry functionality is available for each failed stat

#### Error Display
```typescript
// Error state UI
{error && (
  <div className="text-red-600 text-sm">
    <p>{error}</p>
    <button onClick={retry}>Retry</button>
  </div>
)}
```

#### Error Messages
- Network error: "Unable to load data. Please check your connection."
- Auth error: "Session expired. Please log in again."
- Server error: "Server error. Please try again later."
- Generic: "Failed to load data. Please try again."

### Logging
- All errors logged to console with context
- Include stat type, error message, and timestamp
- Format: `[Dashboard Stats] Failed to fetch {statType}: {error.message}`

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

1. **Hook Initialization**: Verify initial state is correct (all stats null, loading true, no errors)
2. **Successful Fetch**: Test that successful API responses update state correctly
3. **Error Handling**: Test that API errors set error state appropriately
4. **Retry Functionality**: Test that retry clears error and re-fetches
5. **Cleanup**: Test that timers are cleared on unmount
6. **Currency Formatting**: Test specific locale/currency combinations (e.g., en-US with $1234.56, vi with 1.234,56 ₫)

### Property-Based Testing

Property-based tests will verify universal properties using fast-check library:

**Testing Library**: fast-check (JavaScript/TypeScript property-based testing library)

**Configuration**: Each property test should run a minimum of 100 iterations

**Property Test Requirements**:
- Each test must include a comment tag: `**Feature: admin-dashboard-stats, Property {number}: {property_text}**`
- Each correctness property must be implemented by a SINGLE property-based test
- Tests should use generators to create diverse test inputs

**Property Tests**:

1. **Property 1 Test**: Generate random loading states for each stat type, verify loading indicator appears
2. **Property 2 Test**: Generate random error scenarios for each stat type, verify error UI and retry behavior
3. **Property 3 Test**: Generate random revenue values and locales, verify correct formatting; generate random count values, verify numeric display
4. **Property 4 Test**: Generate random combinations of successful/failed stats, verify independence
5. **Property 5 Test**: Simulate mount/unmount cycles and time progression, verify refresh behavior
6. **Property 6 Test**: Generate random dashboard loads, verify correct API calls are made
7. **Property 7 Test**: Generate random error scenarios, verify console.error is called with appropriate messages

### Integration Testing

Integration tests will verify the complete flow:

1. **Full Dashboard Load**: Mount dashboard, verify all API calls, verify all stats display
2. **Partial Failure**: Mock one API to fail, verify other stats still work
3. **Complete Failure**: Mock all APIs to fail, verify all error states
4. **Retry Flow**: Trigger error, click retry, verify re-fetch
5. **Auto-Refresh**: Mount dashboard, advance time 5 minutes, verify refresh

### End-to-End Testing

E2E tests will verify real user scenarios:

1. **Admin Login and Dashboard View**: Log in as admin, navigate to dashboard, verify stats load
2. **Error Recovery**: Disconnect network, verify errors, reconnect, retry, verify success
3. **Auto-Refresh**: Stay on dashboard for 5+ minutes, verify data updates

## Implementation Notes

### Performance Considerations

1. **Parallel Fetching**: All four stats fetch in parallel to minimize load time
2. **Memoization**: Use React.useMemo for formatted values to avoid recalculation
3. **Debouncing**: Retry actions debounced to prevent rapid repeated requests
4. **Cleanup**: Proper cleanup of timers and abort controllers to prevent memory leaks

### Accessibility

1. **Loading States**: Use aria-live regions for loading announcements
2. **Error Messages**: Ensure error messages are announced to screen readers
3. **Retry Buttons**: Proper button semantics and keyboard accessibility
4. **Focus Management**: Maintain focus context during async updates

### Internationalization

1. **Currency Formatting**: Use Intl.NumberFormat with locale-specific currency
2. **Number Formatting**: Use locale-specific number formatting for counts
3. **Error Messages**: Translate error messages using next-intl
4. **Date/Time**: If showing last updated time, use locale-specific formatting

### Security

1. **Authentication**: All API calls include JWT token
2. **Authorization**: Backend verifies admin role for all endpoints
3. **Data Validation**: Validate response data structure before using
4. **XSS Prevention**: Sanitize any user-generated content (though stats are numeric)
