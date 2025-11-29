# Implementation Plan

- [x] 1. Modify JWT authentication guard to allow OPTIONS requests
  - Update `JwtAuthGuard.canActivate()` to check HTTP method
  - Return `true` immediately for OPTIONS requests before any authentication logic
  - Preserve existing public route and token validation logic for other methods
  - _Requirements: 1.1, 1.3, 2.1_

- [ ]* 1.1 Write property test for JWT guard OPTIONS handling
  - **Property 1: OPTIONS requests bypass JWT authentication**
  - **Validates: Requirements 1.1, 1.3, 2.1**

- [ ]* 1.2 Write property test for JWT guard non-OPTIONS authentication
  - **Property 3: Non-OPTIONS requests enforce authentication**
  - **Validates: Requirements 1.2, 2.4**

- [x] 2. Modify roles guard to allow OPTIONS requests
  - Update `RolesGuard.canActivate()` to check HTTP method
  - Return `true` immediately for OPTIONS requests before any role validation
  - Preserve existing role checking logic for other methods
  - _Requirements: 1.3, 2.2_

- [ ]* 2.1 Write property test for roles guard OPTIONS handling
  - **Property 2: OPTIONS requests bypass role authorization**
  - **Validates: Requirements 1.3, 2.2**

- [ ]* 2.2 Write property test for roles guard non-OPTIONS authorization
  - **Property 4: Non-OPTIONS requests enforce authorization**
  - **Validates: Requirements 1.2, 2.4**

- [x] 3. Update CORS configuration to allow cache-busting headers
  - Add `Cache-Control`, `Pragma`, and `Expires` to the `allowedHeaders` array in `main.ts`
  - These headers are sent by the frontend's admin API cache-busting interceptor
  - Without these, preflight requests fail for admin endpoints
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ]* 3.1 Write property test for CORS cache-busting headers
  - **Property 5: Cache-busting headers are accepted**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

- [ ]* 4. Write integration tests for admin endpoints
  - Test OPTIONS request to `/api/admin/customers` returns 200 with CORS headers
  - Test OPTIONS request to `/api/orders/admin/all` returns 200 with CORS headers
  - Test authenticated GET request to `/api/admin/customers` works correctly
  - Test unauthenticated GET request to `/api/admin/customers` returns 401
  - Test requests with cache-busting headers are accepted
  - _Requirements: 1.5, 3.4_

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
