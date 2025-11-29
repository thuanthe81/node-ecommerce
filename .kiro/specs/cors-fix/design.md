# Design Document

## Overview

This design addresses CORS errors on admin API endpoints by ensuring that preflight OPTIONS requests bypass authentication guards. The solution modifies the existing JWT and Roles guards to detect and allow OPTIONS requests before any authentication logic executes.

## Architecture

The fix operates at the guard level in the NestJS request pipeline:

```
Incoming Request
    ↓
CORS Middleware (already configured)
    ↓
JWT Auth Guard → Check if OPTIONS → Skip if OPTIONS
    ↓                                      ↓
Roles Guard → Check if OPTIONS → Skip if OPTIONS
    ↓                                      ↓
Controller Handler ← ← ← ← ← ← ← ← ← ← ← ←
```

The guards will check the HTTP method before executing any authentication logic. If the method is OPTIONS, they immediately return `true` to allow the request through.

## Components and Interfaces

### Modified Guards

**JwtAuthGuard** (`backend/src/auth/guards/jwt-auth.guard.ts`)
- Add OPTIONS method check at the beginning of `canActivate()`
- Return `true` immediately for OPTIONS requests
- Preserve existing public route and authentication logic for other methods

**RolesGuard** (`backend/src/auth/guards/roles.guard.ts`)
- Add OPTIONS method check at the beginning of `canActivate()`
- Return `true` immediately for OPTIONS requests
- Preserve existing role validation logic for other methods

### CORS Configuration Update

**CORS Middleware** (`backend/src/main.ts`)
- Add cache-busting headers to the `allowedHeaders` array
- Include: `Cache-Control`, `Pragma`, `Expires`
- These headers are sent by the frontend's admin API cache-busting interceptor
- Without these in the allowed list, preflight requests fail for admin endpoints

### No Changes Required

The following components already work correctly and require no modifications:
- Controller routes (already have correct decorators)
- DTO validation (not affected by CORS)

## Data Models

No data model changes required. This is purely a request handling fix.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Property 1: OPTIONS requests bypass JWT authentication
*For any* protected endpoint, when an OPTIONS request is sent without authentication credentials, the JWT guard should allow the request to proceed
**Validates: Requirements 1.1, 1.3, 2.1**

Property 2: OPTIONS requests bypass role authorization
*For any* role-protected endpoint, when an OPTIONS request is sent without user context, the roles guard should allow the request to proceed
**Validates: Requirements 1.3, 2.2**

Property 3: Non-OPTIONS requests enforce authentication
*For any* protected endpoint and any HTTP method except OPTIONS, when a request is sent without valid authentication, the guards should reject the request
**Validates: Requirements 1.2, 2.4**

Property 4: Non-OPTIONS requests enforce authorization
*For any* role-protected endpoint and any HTTP method except OPTIONS, when a request is sent without the required role, the roles guard should reject the request
**Validates: Requirements 1.2, 2.4**

Property 5: Cache-busting headers are accepted
*For any* request containing Cache-Control, Pragma, or Expires headers, the CORS configuration should allow these headers and not reject the preflight request
**Validates: Requirements 3.1, 3.2, 3.3, 3.4**



## Error Handling

The fix maintains existing error handling:
- Invalid authentication tokens still return 401 Unauthorized (for non-OPTIONS requests)
- Missing required roles still return 403 Forbidden (for non-OPTIONS requests)
- OPTIONS requests never trigger authentication errors
- CORS errors from origin mismatch are handled by the existing CORS middleware

## Testing Strategy

### Unit Tests

We'll write unit tests for the modified guards:
- Test JWT guard allows OPTIONS requests without tokens
- Test JWT guard still validates tokens for other methods
- Test roles guard allows OPTIONS requests without user context
- Test roles guard still validates roles for other methods

### Property-Based Tests

We'll use property-based testing to verify guard behavior across different scenarios:
- Property 1: Test JWT guard with various endpoints and verify OPTIONS always passes
- Property 2: Test roles guard with various endpoints and verify OPTIONS always passes
- Property 3: Test JWT guard with various HTTP methods (GET, POST, PUT, DELETE, PATCH) and verify authentication is enforced
- Property 4: Test roles guard with various HTTP methods and verify authorization is enforced

The property-based testing library for TypeScript/NestJS will be **fast-check**, which provides excellent support for generating test cases and verifying properties hold across many inputs.

### Integration Tests

We'll write integration tests to verify the complete flow:
- Test OPTIONS request to `/api/admin/customers` returns 200 with CORS headers
- Test OPTIONS request to `/api/orders/admin/all` returns 200 with CORS headers
- Test authenticated GET request to `/api/admin/customers` works correctly
- Test unauthenticated GET request to `/api/admin/customers` returns 401

Each property-based test will run a minimum of 100 iterations to ensure comprehensive coverage.
