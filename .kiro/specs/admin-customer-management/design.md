# Design Document

## Overview

The Admin Customer Management feature provides administrators with a comprehensive interface to view, search, filter, and analyze customer data. The system consists of a customer list view with advanced filtering capabilities and a detailed customer view showing complete profile and order history information.

## Architecture

The feature follows a client-server architecture with the following layers:

### Frontend Layer
- **Customer List Page**: React component displaying paginated customer data with search, filter, and sort capabilities
- **Customer Detail Page**: React component showing detailed customer information and order history
- **Customer API Client**: TypeScript module for making HTTP requests to the backend
- **State Management**: React hooks (useState, useEffect) for managing component state

### Backend Layer
- **Admin Customers Controller**: NestJS controller handling admin customer endpoints
- **Customers Service**: Business logic for customer data retrieval and filtering
- **Prisma ORM**: Database access layer for querying customer and order data
- **Authentication Guard**: JWT-based authentication ensuring only admins can access endpoints

### Data Flow
1. Admin navigates to customer management page
2. Frontend requests customer data from backend API with pagination, filters, and sort parameters
3. Backend validates admin authentication
4. Backend queries database with applied filters and pagination
5. Backend returns customer data with aggregated statistics
6. Frontend renders customer list with interactive controls
7. Admin can click on customer to view detailed information
8. Frontend requests detailed customer data including order history
9. Backend returns complete customer profile and orders
10. Frontend renders detailed customer view

## Components and Interfaces

### Frontend Components

#### CustomerListContent Component
```typescript
interface CustomerListContentProps {
  locale: string;
}

interface Customer {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
}

interface CustomerFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'totalOrders' | 'totalSpent';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface CustomerListResponse {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

#### CustomerDetailContent Component
```typescript
interface CustomerDetailContentProps {
  customerId: string;
  locale: string;
}

interface CustomerDetail extends Customer {
  phone: string | null;
  orders: Order[];
  addresses: Address[];
}
```

### Backend Interfaces

#### Admin Customers Controller
```typescript
@Controller('admin/customers')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminCustomersController {
  @Get()
  async getAllCustomers(@Query() filters: CustomerFiltersDto): Promise<CustomerListResponse>

  @Get(':id')
  async getCustomerDetail(@Param('id') id: string): Promise<CustomerDetail>

  @Get('export')
  async exportCustomers(@Query() filters: CustomerFiltersDto): Promise<StreamableFile>
}
```

#### Customers Service
```typescript
export class CustomersService {
  async findAllWithStats(filters: CustomerFiltersDto): Promise<CustomerListResponse>
  async findOneWithDetails(id: string): Promise<CustomerDetail>
  async exportToCSV(filters: CustomerFiltersDto): Promise<Buffer>
}
```

## Data Models

### Customer Model (Extended from existing User)
```typescript
interface Customer {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  // Computed fields
  totalOrders: number;
  totalSpent: number;
}
```

### Customer Filters DTO
```typescript
class CustomerFiltersDto {
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'totalOrders' | 'totalSpent';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Pagination consistency
*For any* valid page number and limit, the total number of customers across all pages should equal the total count returned by the API
**Validates: Requirements 1.1**

### Property 2: Required fields presence
*For any* customer record in the list, the rendered output should contain email, registration date, total orders, and total spent fields
**Validates: Requirements 1.2**

### Property 3: Search text matching
*For any* search query, all returned customers should have either their name or email containing the search text (case-insensitive)
**Validates: Requirements 2.1**

### Property 4: Case-insensitive search
*For any* search string, searching with uppercase, lowercase, or mixed case should return the same set of customers
**Validates: Requirements 2.4**

### Property 5: Start date filtering
*For any* start date filter, all returned customers should have registration dates on or after the specified start date
**Validates: Requirements 3.1**

### Property 6: End date filtering
*For any* end date filter, all returned customers should have registration dates on or before the specified end date
**Validates: Requirements 3.2**

### Property 7: Date range filtering
*For any* start and end date combination, all returned customers should have registration dates within the specified range (inclusive)
**Validates: Requirements 3.3**

### Property 8: Sort order correctness
*For any* sortable column, when sorted in ascending order, each customer should have a value less than or equal to the next customer's value for that column
**Validates: Requirements 4.1**

### Property 9: Sort order toggle
*For any* sorted column, clicking the sort header twice should reverse the order of customers
**Validates: Requirements 4.2**

### Property 10: Filter persistence during sort
*For any* active filters, applying a sort operation should maintain the same filtered set of customers, only changing their order
**Validates: Requirements 4.3**

### Property 11: Customer detail completeness
*For any* customer detail view, the rendered output should include all profile fields (email, name, phone, registration date)
**Validates: Requirements 5.2**

### Property 12: Statistics calculation accuracy
*For any* customer, the total spent should equal the sum of all their order totals, and total orders should equal the count of their orders
**Validates: Requirements 5.4**

### Property 13: CSV export completeness
*For any* customer list, the exported CSV should contain the same number of rows as the filtered customer count
**Validates: Requirements 6.1**

### Property 14: CSV field inclusion
*For any* exported CSV, each row should contain all visible customer fields (email, name, registration date, total orders, total spent)
**Validates: Requirements 6.2**

### Property 15: Export respects filters
*For any* active filters, the exported CSV should contain only customers that match the current filter criteria
**Validates: Requirements 6.4**

### Property 16: Date formatting by locale
*For any* date value, when locale is 'vi' the format should use Vietnamese conventions, and when locale is 'en' the format should use English conventions
**Validates: Requirements 7.3**

### Property 17: Currency formatting by locale
*For any* currency value, when locale is 'vi' the format should use Vietnamese conventions, and when locale is 'en' the format should use USD conventions
**Validates: Requirements 7.4**

### Property 18: State persistence across layout changes
*For any* active filters and search query, changing the viewport size should maintain the same filter state and search query
**Validates: Requirements 8.4**

## Error Handling

### Frontend Error Handling
- **Network Errors**: Display user-friendly error message with retry button
- **Authentication Errors**: Redirect to login page
- **Authorization Errors**: Display "Access Denied" message
- **Validation Errors**: Display inline validation messages
- **Empty States**: Display appropriate empty state messages with helpful actions

### Backend Error Handling
- **Invalid Filters**: Return 400 Bad Request with validation details
- **Customer Not Found**: Return 404 Not Found
- **Unauthorized Access**: Return 401 Unauthorized
- **Forbidden Access**: Return 403 Forbidden (non-admin users)
- **Database Errors**: Return 500 Internal Server Error with logged details

### Error Recovery
- Implement exponential backoff for failed API requests
- Provide manual retry buttons for failed operations
- Cache successful responses to provide stale data during outages
- Log all errors to monitoring system for debugging

## Testing Strategy

### Unit Testing
- Test individual utility functions (date formatting, currency formatting, search filtering)
- Test React component rendering with various props
- Test API client methods with mocked responses
- Test backend service methods with mocked database
- Test DTO validation logic

### Property-Based Testing
- Use **fast-check** library for JavaScript/TypeScript property-based testing
- Configure each property test to run a minimum of 100 iterations
- Tag each property test with format: `**Feature: admin-customer-management, Property {number}: {property_text}**`
- Each correctness property listed above should be implemented as a single property-based test
- Generate random customer data, filter combinations, and search queries to verify properties hold across all inputs

### Integration Testing
- Test complete user flows (search → filter → sort → view details)
- Test API endpoints with real database (test database)
- Test authentication and authorization flows
- Test CSV export generation and download

### End-to-End Testing
- Test complete admin workflows using Playwright or Cypress
- Test responsive behavior across different viewport sizes
- Test multi-language support
- Test error scenarios and recovery

## Performance Considerations

### Frontend Optimization
- Implement virtual scrolling for large customer lists
- Debounce search input to reduce API calls
- Cache customer list responses with React Query or SWR
- Lazy load customer detail page
- Optimize re-renders with React.memo and useMemo

### Backend Optimization
- Add database indexes on frequently queried fields (email, createdAt)
- Implement cursor-based pagination for better performance
- Use database aggregation for calculating statistics
- Cache frequently accessed data with Redis
- Implement rate limiting to prevent abuse

### Database Queries
- Use Prisma's `include` to fetch related data in single query
- Add compound indexes for common filter combinations
- Use `select` to fetch only required fields
- Implement query result caching for expensive aggregations

## Security Considerations

- Validate all user inputs on both frontend and backend
- Implement CSRF protection for state-changing operations
- Use parameterized queries to prevent SQL injection
- Implement rate limiting on API endpoints
- Log all admin actions for audit trail
- Ensure only users with admin role can access endpoints
- Sanitize data before CSV export to prevent formula injection
- Implement proper CORS configuration
- Use HTTPS for all API communications

## Accessibility

- Ensure all interactive elements are keyboard accessible
- Provide proper ARIA labels for screen readers
- Maintain sufficient color contrast ratios
- Support screen reader announcements for dynamic content
- Provide skip links for navigation
- Ensure focus management for modals and overlays
- Support browser zoom up to 200%

## Internationalization

- Use next-intl for translation management
- Store all user-facing text in translation files
- Format dates using locale-specific formats
- Format currency using locale-specific formats
- Support RTL languages (future consideration)
- Provide language switcher in admin panel
