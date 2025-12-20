# Email Queue Configuration Guide

This document describes all configuration options for the asynchronous email queue system built with BullMQ and Redis.

## Overview

The email queue system uses Redis as the message broker and BullMQ as the queue library. All configuration is done through environment variables that can be set in your `.env` file.

## Required Configuration

### Redis Connection

These settings configure the connection to your Redis instance:

```bash
# Redis server hostname or IP address
REDIS_HOST=localhost

# Redis server port
REDIS_PORT=6379
```

**Default Values:**
- `REDIS_HOST`: `localhost`
- `REDIS_PORT`: `6379`

**Production Notes:**
- Use a dedicated Redis instance for production
- Consider Redis Cluster for high availability
- Enable Redis persistence (RDB + AOF) for durability

## Email Queue Configuration

### Worker Settings

Control how many emails are processed simultaneously:

```bash
# Number of concurrent email workers
# Higher values = more emails processed simultaneously
# Lower values = less resource usage
EMAIL_WORKER_CONCURRENCY=5
```

**Default Value:** `5`

**Recommendations:**
- Development: `2-5`
- Production (small): `5-10`
- Production (large): `10-20`
- Monitor CPU and memory usage when increasing

### Rate Limiting

Prevent overwhelming your email service provider:

```bash
# Maximum number of emails per time window
EMAIL_RATE_LIMIT_MAX=100

# Time window in milliseconds (60000 = 1 minute)
EMAIL_RATE_LIMIT_DURATION=60000
```

**Default Values:**
- `EMAIL_RATE_LIMIT_MAX`: `100`
- `EMAIL_RATE_LIMIT_DURATION`: `60000` (1 minute)

**Common Configurations:**
- Gmail SMTP: `100/minute` or `500/day`
- SendGrid: `100/minute` (free tier)
- Postmark: `300/minute`
- Custom SMTP: Check with your provider

### Job Retention

Control how long completed and failed jobs are kept:

```bash
# How long to keep completed jobs (in milliseconds)
# 86400000 = 24 hours
EMAIL_QUEUE_COMPLETED_RETENTION_AGE=86400000

# Maximum number of completed jobs to keep
EMAIL_QUEUE_COMPLETED_RETENTION_COUNT=1000

# How long to keep failed jobs (in milliseconds)
# 604800000 = 7 days
EMAIL_QUEUE_FAILED_RETENTION_AGE=604800000

# Maximum number of failed jobs to keep
EMAIL_QUEUE_FAILED_RETENTION_COUNT=500
```

**Default Values:**
- `EMAIL_QUEUE_COMPLETED_RETENTION_AGE`: `86400000` (24 hours)
- `EMAIL_QUEUE_COMPLETED_RETENTION_COUNT`: `1000`
- `EMAIL_QUEUE_FAILED_RETENTION_AGE`: `604800000` (7 days)
- `EMAIL_QUEUE_FAILED_RETENTION_COUNT`: `500`

**Storage Considerations:**
- Each job stores ~1-5KB of data
- 1000 jobs ≈ 1-5MB storage
- Failed jobs are kept longer for debugging
- Adjust based on your Redis memory limits

### Retry Configuration

Control how failed emails are retried:

```bash
# Maximum number of retry attempts
EMAIL_QUEUE_MAX_ATTEMPTS=5

# Initial delay before first retry (in milliseconds)
# 60000 = 1 minute
EMAIL_QUEUE_INITIAL_DELAY=60000
```

**Default Values:**
- `EMAIL_QUEUE_MAX_ATTEMPTS`: `5`
- `EMAIL_QUEUE_INITIAL_DELAY`: `60000` (1 minute)

**Retry Schedule:**
With exponential backoff, retries happen at:
1. 1 minute (initial delay)
2. 5 minutes
3. 15 minutes
4. 1 hour
5. 4 hours

### Connection Resilience

Configure automatic reconnection behavior:

```bash
# Maximum number of reconnection attempts
EMAIL_QUEUE_MAX_RECONNECT_ATTEMPTS=10

# Base delay between reconnection attempts (in milliseconds)
EMAIL_QUEUE_RECONNECT_BASE_DELAY=1000

# Maximum delay between reconnection attempts (in milliseconds)
EMAIL_QUEUE_RECONNECT_MAX_DELAY=30000
```

**Default Values:**
- `EMAIL_QUEUE_MAX_RECONNECT_ATTEMPTS`: `10`
- `EMAIL_QUEUE_RECONNECT_BASE_DELAY`: `1000` (1 second)
- `EMAIL_QUEUE_RECONNECT_MAX_DELAY`: `30000` (30 seconds)

**Reconnection Schedule:**
With exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (capped), 30s...

### Graceful Shutdown

Control how long to wait for jobs to complete during shutdown:

```bash
# Timeout for graceful shutdown (in milliseconds)
# 30000 = 30 seconds
EMAIL_QUEUE_SHUTDOWN_TIMEOUT=30000
```

**Default Value:** `30000` (30 seconds)

**Behavior:**
- System waits for current jobs to complete
- After timeout, forces shutdown
- Incomplete jobs remain in queue for next startup

## Environment-Specific Configurations

### Development

```bash
# Development settings - lower resource usage
EMAIL_WORKER_CONCURRENCY=2
EMAIL_RATE_LIMIT_MAX=50
EMAIL_RATE_LIMIT_DURATION=60000
EMAIL_QUEUE_COMPLETED_RETENTION_AGE=3600000  # 1 hour
EMAIL_QUEUE_COMPLETED_RETENTION_COUNT=100
EMAIL_QUEUE_FAILED_RETENTION_AGE=86400000    # 24 hours
EMAIL_QUEUE_FAILED_RETENTION_COUNT=50
```

### Production

```bash
# Production settings - optimized for performance and reliability
EMAIL_WORKER_CONCURRENCY=10
EMAIL_RATE_LIMIT_MAX=100
EMAIL_RATE_LIMIT_DURATION=60000
EMAIL_QUEUE_COMPLETED_RETENTION_AGE=86400000   # 24 hours
EMAIL_QUEUE_COMPLETED_RETENTION_COUNT=1000
EMAIL_QUEUE_FAILED_RETENTION_AGE=604800000     # 7 days
EMAIL_QUEUE_FAILED_RETENTION_COUNT=500
EMAIL_QUEUE_MAX_RECONNECT_ATTEMPTS=20
EMAIL_QUEUE_SHUTDOWN_TIMEOUT=60000             # 60 seconds
```

### High Volume

```bash
# High volume settings - for heavy email usage
EMAIL_WORKER_CONCURRENCY=20
EMAIL_RATE_LIMIT_MAX=500
EMAIL_RATE_LIMIT_DURATION=60000
EMAIL_QUEUE_COMPLETED_RETENTION_AGE=43200000   # 12 hours
EMAIL_QUEUE_COMPLETED_RETENTION_COUNT=2000
EMAIL_QUEUE_FAILED_RETENTION_AGE=259200000     # 3 days
EMAIL_QUEUE_FAILED_RETENTION_COUNT=1000
```

## Monitoring and Health Checks

The system provides several endpoints for monitoring:

### Health Check Endpoint

```
GET /email-queue/health
```

Returns current configuration and system status.

### Queue Metrics Endpoint

```
GET /email-queue/metrics
```

Returns detailed queue statistics and performance metrics.

### System Information Endpoint

```
GET /email-queue/system
```

Returns system configuration and environment details.

## Performance Tuning

### CPU-Bound Workloads

If email template generation is CPU-intensive:

```bash
EMAIL_WORKER_CONCURRENCY=4  # Match CPU cores
EMAIL_RATE_LIMIT_MAX=200
```

### Memory-Constrained Environments

If running with limited memory:

```bash
EMAIL_WORKER_CONCURRENCY=2
EMAIL_QUEUE_COMPLETED_RETENTION_COUNT=100
EMAIL_QUEUE_FAILED_RETENTION_COUNT=50
```

### Network-Limited Environments

If network bandwidth is limited:

```bash
EMAIL_WORKER_CONCURRENCY=3
EMAIL_RATE_LIMIT_MAX=30
EMAIL_RATE_LIMIT_DURATION=60000
```

## Troubleshooting

### High Memory Usage

1. Reduce retention counts:
   ```bash
   EMAIL_QUEUE_COMPLETED_RETENTION_COUNT=500
   EMAIL_QUEUE_FAILED_RETENTION_COUNT=250
   ```

2. Reduce retention ages:
   ```bash
   EMAIL_QUEUE_COMPLETED_RETENTION_AGE=43200000  # 12 hours
   EMAIL_QUEUE_FAILED_RETENTION_AGE=259200000    # 3 days
   ```

### Slow Email Processing

1. Increase concurrency:
   ```bash
   EMAIL_WORKER_CONCURRENCY=10
   ```

2. Increase rate limits (if your provider allows):
   ```bash
   EMAIL_RATE_LIMIT_MAX=200
   ```

### Connection Issues

1. Increase reconnection attempts:
   ```bash
   EMAIL_QUEUE_MAX_RECONNECT_ATTEMPTS=20
   EMAIL_QUEUE_RECONNECT_MAX_DELAY=60000  # 1 minute
   ```

2. Check Redis configuration and network connectivity

### Queue Backlog

1. Increase processing capacity:
   ```bash
   EMAIL_WORKER_CONCURRENCY=15
   EMAIL_RATE_LIMIT_MAX=300
   ```

2. Check for failed jobs that need attention
3. Monitor email service provider limits

## Security Considerations

### Redis Security

- Use Redis AUTH if available
- Configure Redis to bind to specific interfaces
- Use Redis over TLS in production
- Regularly update Redis version

### Environment Variables

- Never commit `.env` files to version control
- Use secure secret management in production
- Rotate Redis passwords regularly
- Monitor access logs

## Migration from Synchronous Email

When migrating from synchronous email sending:

1. Start with conservative settings:
   ```bash
   EMAIL_WORKER_CONCURRENCY=2
   EMAIL_RATE_LIMIT_MAX=50
   ```

2. Monitor system performance and email delivery

3. Gradually increase concurrency and rate limits

4. Update application code to use specific event methods instead of generic `sendEmail()`

## Support and Monitoring

### Logging

The system provides structured logging for:
- Job creation and completion
- Connection issues and recovery
- Rate limiting and backoff
- Error classification and retry attempts

### Metrics

Key metrics to monitor:
- Queue depth (waiting jobs)
- Processing rate (jobs/minute)
- Error rate (failed jobs %)
- Connection stability
- Memory usage

### Alerting

Set up alerts for:
- Queue depth > 1000 jobs
- Error rate > 5%
- Redis connection failures
- Worker crashes or restarts

## Version Compatibility

This configuration is compatible with:
- BullMQ: ^5.66.1
- Redis: ^6.0+
- Node.js: ^18.0+
- NestJS: ^10.0+

## Configuration Validation

The system validates configuration on startup and logs warnings for:
- Invalid numeric values (falls back to defaults)
- Missing required Redis connection settings
- Unreasonable rate limit settings
- Memory-intensive retention settings

Check application logs on startup for any configuration warnings.

### Configuration Setup Script

A configuration setup script is available to help with setup and validation:

```bash
# Show configuration recommendations for different environments
npm run setup-email-config recommendations

# Validate current configuration
npm run setup-email-config validate

# Check for missing environment variables
npm run setup-email-config check

# Generate environment template for specific environment
npm run setup-email-config template production
npm run setup-email-config template development
npm run setup-email-config template staging
npm run setup-email-config template high-volume

# Show help
npm run setup-email-config help
```

The script provides:
- Environment-specific configuration recommendations
- Current configuration validation with warnings
- Missing variable detection
- Template generation for easy setup
- Derived metrics calculation (rate, memory usage)