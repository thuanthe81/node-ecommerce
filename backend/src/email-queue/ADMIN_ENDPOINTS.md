# Email Queue Admin Endpoints

This document describes the REST endpoints available for administering the email queue system.

## Authentication

All admin endpoints require:
- Valid JWT token in Authorization header: `Bearer <token>`
- Admin role (`STATUS.USER_ROLES.ADMIN`)

## Base URL

All endpoints are prefixed with `/admin/email-queue`

## Endpoints

### Queue Overview
- **GET** `/overview` - Get comprehensive queue status and metrics

### Job Management
- **GET** `/jobs/failed?start=0&end=50` - Get failed jobs with pagination
- **GET** `/jobs/completed?start=0&end=50` - Get completed jobs with pagination
- **GET** `/jobs/waiting?start=0&end=50` - Get waiting jobs with pagination
- **GET** `/jobs/active?start=0&end=50` - Get active jobs with pagination
- **GET** `/jobs/{jobId}` - Get specific job details
- **POST** `/jobs/{jobId}/retry` - Retry a failed job
- **DELETE** `/jobs/{jobId}` - Remove a job from the queue

### Bulk Operations
- **POST** `/jobs/bulk-retry` - Retry multiple jobs (max 100)
- **DELETE** `/jobs/bulk-remove` - Remove multiple jobs (max 100)

### Queue Control
- **GET** `/control/status` - Get queue pause/resume status
- **POST** `/control/pause` - Pause the queue
- **POST** `/control/resume` - Resume the queue

### Maintenance
- **POST** `/maintenance/clean-completed` - Clean old completed jobs
- **POST** `/maintenance/clean-failed` - Clean old failed jobs

## Usage Examples

```bash
# Get queue overview
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/admin/email-queue/overview

# Get failed jobs
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/admin/email-queue/jobs/failed?start=0&end=10"

# Retry a specific job
curl -X POST -H "Authorization: Bearer <token>" \
  http://localhost:3000/admin/email-queue/jobs/12345/retry

# Bulk retry jobs
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"jobIds": ["job1", "job2", "job3"]}' \
  http://localhost:3000/admin/email-queue/jobs/bulk-retry

# Pause the queue
curl -X POST -H "Authorization: Bearer <token>" \
  http://localhost:3000/admin/email-queue/control/pause

# Clean old completed jobs (older than 24 hours)
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"olderThan": 86400000, "limit": 100}' \
  http://localhost:3000/admin/email-queue/maintenance/clean-completed
```