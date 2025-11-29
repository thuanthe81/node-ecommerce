# Design Document

## Overview

This design implements a cache prevention mechanism for all admin API calls in the frontend application. The solution uses axios request interceptors to automatically add cache-busting headers and query parameters to admin endpoints, ensuring administrators always receive fresh data from the server. The implementation is transparent to existing code and requires no changes to individual API calls.

## Architecture

The solution follows a middleware pattern using axios interceptors:

1. **Request Interceptor Layer**: Intercepts outgoing requests and identifies admin endpoints
2. **Cache-Busting Logic**: Applies appropriate headers and query parameters to prevent caching
3. **Existing API Layer**: All existing admin API functions continue to work without modification

The architecture maintains separation of concerns by centralizing cache control logic in the HTTP client configuration rather than scattering it across individual API functions.

## Components and Interfaces

### Modified Components

#### api-client.ts

The existing axios client will be enhanced with an additional request interceptor:

```typescript
// New request interceptor for admin cache-busting
apiClient.interceptors.request.use(
  (config) => {
    // Check if this is an admin API call
    const isAdminEndpoint = config.url?.includes('/admin');

    if (isAdminEndpoint) {
      // Add cache-busting headers
      config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      config.headers['Pragma'] = 'no-cache';
      config.headers['Expires'] = '0';

      // Add timestamp query parameter for GET requests
      if (config.method?.toUpperCase() === 'GET') {
        const separator = config.url?.includes('?') ? '&' : '?';
        config.url = `${config.url}${separator}_t=${Date.now()}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
```

### Interfaces

No new interfaces are required. The solution works with existing axios configuration types.

## Data Models

No new data models are required. The solution operates at the HTTP transport layer.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Admin endpoints always include cache-busting headers

*For any* admin API request (URL containing `/admin`), the request headers SHALL include `Cache-Control: no-cache, no-store, must-revalidate`, `Pragma: no-cache`, and `Expires: 0`.

**Validates: Requirements 1.1, 3.1, 3.2, 3.3**

### Property 2: Admin GET requests include timestamp parameter

*For any* admin API GET request, the URL SHALL include a `_t` query parameter with a timestamp value.

**Validates: Requirements 1.2, 3.4**

### Property 3: Non-admin endpoints remain unaffected

*For any* non-admin API request (URL not containing `/admin`), the request SHALL NOT include cache-busting headers or timestamp parameters added by the admin cache-busting logic.

**Validates: Requirements 2.4**

### Property 4: Cache-busting applies to all HTTP methods

*For any* admin API request regardless of HTTP method (GET, POST, PUT, PATCH, DELETE), the request SHALL include cache-busting headers.

**Validates: Requirements 1.1, 1.3**

### Property 5: Timestamp uniqueness for concurrent requests

*For any* two admin GET requests made within a short time window, each SHALL have a unique timestamp value in the `_t` parameter.

**Validates: Requirements 1.4**

## Error Handling

The cache-busting interceptor operates on the request path and should not introduce new error conditions. However:

1. **Interceptor Errors**: If the interceptor throws an error, axios will reject the request. The interceptor should be defensive and handle edge cases gracefully.

2. **URL Manipulation Errors**: When appending timestamp parameters, the code should handle URLs that may already have query parameters.

3. **Backward Compatibility**: The solution should not break existing functionality. If cache-busting fails for any reason, the request should still proceed (fail-safe approach).

## Testing Strategy

### Unit Tests

1. **Test cache headers on admin endpoints**: Verify that requests to `/admin/*` endpoints include all three cache-busting headers
2. **Test timestamp parameter on GET requests**: Verify that GET requests to admin endpoints include the `_t` parameter
3. **Test non-admin endpoints unchanged**: Verify that requests to non-admin endpoints do not have cache-busting modifications
4. **Test URL parameter handling**: Verify correct handling of URLs with and without existing query parameters
5. **Test different HTTP methods**: Verify cache headers are added for POST, PUT, PATCH, DELETE requests

### Property-Based Tests

Property-based tests will use `fast-check` (JavaScript property testing library) to verify correctness across many random inputs:

1. **Property 1 Test**: Generate random admin URLs and verify all have cache-busting headers
2. **Property 2 Test**: Generate random admin GET requests and verify timestamp parameters
3. **Property 3 Test**: Generate random non-admin URLs and verify they remain unmodified
4. **Property 4 Test**: Generate admin requests with random HTTP methods and verify headers
5. **Property 5 Test**: Generate concurrent admin GET requests and verify unique timestamps

Each property-based test will run a minimum of 100 iterations with randomly generated test data.

### Integration Tests

1. **Browser cache verification**: Make admin API calls and verify responses are not served from browser cache
2. **Multiple request verification**: Make sequential admin API calls and verify each fetches fresh data
3. **Cross-browser testing**: Verify cache-busting works in Chrome, Firefox, Safari, and Edge

## Implementation Notes

### Interceptor Order

The cache-busting interceptor should be added after the authentication interceptor to ensure:
1. Authentication headers are added first
2. Cache-busting headers are added to the complete request configuration

### Performance Considerations

- Adding headers and query parameters has negligible performance impact
- Timestamp generation using `Date.now()` is fast and sufficient for uniqueness
- No additional network requests are made

### Browser Compatibility

The cache-busting headers used are standard HTTP headers supported by all modern browsers:
- `Cache-Control`: HTTP/1.1 standard
- `Pragma`: HTTP/1.0 backward compatibility
- `Expires`: Widely supported

### Documentation

The implementation should include:
1. Inline comments explaining the cache-busting logic
2. JSDoc comments describing the interceptor's purpose
3. README section explaining why admin APIs are not cached
