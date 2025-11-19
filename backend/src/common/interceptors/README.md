# Logging Interceptor

## Overview

The `LoggingInterceptor` automatically logs all HTTP requests and responses throughout the application.

## Features

- Logs HTTP method, URL, status code, response size, and response time
- Logs client IP address and user agent
- Separate logging for successful responses and errors
- Uses NestJS built-in Logger with 'HTTP' context for easy filtering

## Log Format

### Successful Requests
```
[HTTP] GET /api/products 200 1234bytes - 45ms - ::1 - Mozilla/5.0...
```

### Failed Requests
```
[HTTP] POST /api/orders 400 - 23ms - ::1 - Mozilla/5.0... - Error: Validation failed
```

## Implementation

The interceptor is registered globally in `main.ts`:

```typescript
app.useGlobalInterceptors(new LoggingInterceptor());
```

## Log Levels

- **Success (200-299)**: Uses `logger.log()` - INFO level
- **Errors (400+)**: Uses `logger.error()` - ERROR level

## Configuration

No additional configuration needed. The interceptor works out of the box.

To adjust log levels or format, modify the `LoggingInterceptor` class in `logging.interceptor.ts`.

## Filtering Logs

Since logs use the 'HTTP' context, you can filter them in your log aggregation tool or by searching for `[HTTP]` in your logs.
