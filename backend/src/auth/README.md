# Authentication Module

This module implements JWT-based authentication for the e-commerce platform.

## Features

- User registration with password hashing (bcrypt)
- User login with JWT token generation
- Access tokens (15 minutes expiry)
- Refresh tokens (7 days expiry)
- Token refresh endpoint
- Logout functionality
- Rate limiting on login endpoint (5 requests per minute)
- Global JWT authentication guard
- Role-based authorization guard
- Public route decorator for bypassing authentication

## Endpoints

### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER",
    "isEmailVerified": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token"
}
```

### POST /api/auth/login
Login with existing credentials.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** Same as register

### POST /api/auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Response:** Same as register

### POST /api/auth/logout
Logout and invalidate refresh token.

**Request Body:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

## Usage

### Protecting Routes

By default, all routes are protected. To make a route public, use the `@Public()` decorator:

```typescript
import { Public } from './auth/decorators/public.decorator';

@Controller('products')
export class ProductsController {
  @Public()
  @Get()
  findAll() {
    // This endpoint is accessible without authentication
  }

  @Get('my-products')
  findMyProducts(@CurrentUser() user: CurrentUserData) {
    // This endpoint requires authentication
  }
}
```

### Role-Based Authorization

Use the `@Roles()` decorator to restrict access to specific roles:

```typescript
import { Roles } from './auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('admin')
export class AdminController {
  @Roles(UserRole.ADMIN)
  @Get('dashboard')
  getDashboard() {
    // Only accessible by admin users
  }
}
```

### Accessing Current User

Use the `@CurrentUser()` decorator to access the authenticated user:

```typescript
import { CurrentUser, CurrentUserData } from './auth/decorators/current-user.decorator';

@Controller('profile')
export class ProfileController {
  @Get()
  getProfile(@CurrentUser() user: CurrentUserData) {
    return user;
  }
}
```

## Security Features

- Passwords are hashed using bcrypt with 10 salt rounds
- JWT tokens are signed with secret keys from environment variables
- Access tokens expire after 15 minutes
- Refresh tokens expire after 7 days
- Rate limiting on login endpoint (5 requests per minute)
- Global authentication guard applied to all routes by default
- Role-based authorization for admin-only endpoints

## Environment Variables

Required environment variables in `.env`:

```
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
```

## Future Improvements

- Move refresh token storage from in-memory to Redis
- Implement email verification
- Add password reset functionality
- Add two-factor authentication
- Implement session management
- Add OAuth providers (Google, Facebook, etc.)
