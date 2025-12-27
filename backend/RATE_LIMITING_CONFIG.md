# Rate Limiting Configuration

This document describes the rate limiting configuration options for the order cancellation and security features.

## Environment Variables

### Enhanced Rate Limiting

- `CANCELLATION_RATE_LIMIT_WINDOW`: Time window in milliseconds for cancellation rate limiting (default: 60000 = 1 minute)
- `CANCELLATION_RATE_LIMIT_MAX`: Maximum cancellation requests per window (default: 3)

### Example Configuration

```env
# Rate limiting for order cancellations
CANCELLATION_RATE_LIMIT_WINDOW=60000
CANCELLATION_RATE_LIMIT_MAX=3

# Email rate limiting (existing)
EMAIL_RATE_LIMIT_MAX=100
EMAIL_RATE_LIMIT_DURATION=60000
```

## Rate Limiting Layers

The application implements multiple layers of rate limiting for enhanced security:

### 1. NestJS Throttler (Global)
- **Configuration**: 2000 requests per minute globally
- **Scope**: All API endpoints
- **Purpose**: General API protection

### 2. NestJS Throttler (Endpoint-specific)
- **Configuration**: 3 requests per minute for cancellation endpoint
- **Scope**: Order cancellation endpoint
- **Purpose**: Basic cancellation protection

### 3. Enhanced Rate Limiting Guard
- **Configuration**: 2 requests per minute for cancellation (more restrictive)
- **Scope**: Specific sensitive endpoints
- **Purpose**: Advanced protection with detailed logging and monitoring
- **Features**:
  - User-specific tracking (by user ID, session ID, or IP)
  - Detailed logging and monitoring
  - Custom headers for rate limit status
  - Automatic cleanup of expired entries

## Rate Limiting Keys

The enhanced rate limiting uses different keys based on user context:

1. **Authenticated Users**: `enhanced:user:{userId}:{endpoint}`
2. **Guest Users with Session**: `enhanced:session:{sessionId}:{endpoint}`
3. **Anonymous Users**: `enhanced:ip:{ipAddress}:{endpoint}`

## Headers

Rate-limited responses include these headers:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Timestamp when the window resets
- `Retry-After`: Seconds to wait before retrying (when limit exceeded)

## Monitoring

Rate limiting violations are logged with the following information:

- User identification (ID, session, or IP)
- Request details (endpoint, method, user agent)
- Rate limit configuration
- Timestamp and retry information

## Security Benefits

1. **Prevents Abuse**: Limits rapid-fire cancellation attempts
2. **Protects Resources**: Reduces load on email and database systems
3. **Audit Trail**: Comprehensive logging for security monitoring
4. **Graceful Degradation**: Clear error messages and retry guidance
5. **Multi-layer Defense**: Multiple rate limiting mechanisms for redundancy