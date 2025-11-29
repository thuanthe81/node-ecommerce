# Requirements Document

## Introduction

This feature addresses CORS (Cross-Origin Resource Sharing) errors occurring on admin API endpoints for orders and customers. The system currently blocks preflight OPTIONS requests because authentication guards are applied before CORS handling completes. This prevents the frontend from making authenticated requests to these endpoints.

## Glossary

- **CORS**: Cross-Origin Resource Sharing - a security mechanism that allows or restricts web applications from making requests to a different domain
- **Preflight Request**: An OPTIONS HTTP request sent by browsers before the actual request to check if the CORS protocol is understood
- **Authentication Guard**: A NestJS guard that validates JWT tokens before allowing access to protected routes
- **Backend API**: The NestJS backend application serving API endpoints
- **Admin Endpoints**: API routes that require admin role authentication

## Requirements

### Requirement 1

**User Story:** As an admin user, I want to access admin API endpoints from the frontend, so that I can manage orders and customers without CORS errors.

#### Acceptance Criteria

1. WHEN a browser sends a preflight OPTIONS request to any admin endpoint, THEN the Backend API SHALL respond with appropriate CORS headers without requiring authentication
2. WHEN a browser sends an authenticated request to admin endpoints after preflight, THEN the Backend API SHALL validate the JWT token and enforce role-based access control
3. WHEN the Backend API processes OPTIONS requests, THEN the Backend API SHALL bypass all authentication and authorization guards
4. WHEN CORS headers are sent in responses, THEN the Backend API SHALL include all necessary headers for credentials, methods, and allowed headers
5. WHEN an admin makes requests to `/api/admin/customers` or `/api/orders/admin/all`, THEN the Backend API SHALL process the requests without CORS errors

### Requirement 2

**User Story:** As a developer, I want the authentication guards to properly handle OPTIONS requests, so that CORS preflight requests don't fail authentication.

#### Acceptance Criteria

1. WHEN an OPTIONS request reaches the JWT authentication guard, THEN the Backend API SHALL allow the request to proceed without token validation
2. WHEN an OPTIONS request reaches the roles guard, THEN the Backend API SHALL allow the request to proceed without role validation
3. WHEN guards detect an OPTIONS request, THEN the Backend API SHALL skip all authentication and authorization logic
4. WHEN a non-OPTIONS request reaches the guards, THEN the Backend API SHALL enforce authentication and authorization as normal

### Requirement 3

**User Story:** As an admin user, I want the frontend cache-busting headers to be accepted by the backend, so that admin API requests don't fail CORS validation.

#### Acceptance Criteria

1. WHEN the frontend sends Cache-Control headers in admin requests, THEN the Backend API SHALL accept these headers in the CORS configuration
2. WHEN the frontend sends Pragma headers in admin requests, THEN the Backend API SHALL accept these headers in the CORS configuration
3. WHEN the frontend sends Expires headers in admin requests, THEN the Backend API SHALL accept these headers in the CORS configuration
4. WHEN the Backend API receives preflight requests with cache-busting headers, THEN the Backend API SHALL respond with appropriate CORS headers allowing these custom headers
