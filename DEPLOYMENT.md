# Deployment Guide

This document describes the deployment process for the Handmade E-commerce Platform, including the image storage migration.

## Quick Start

### Staging Deployment

```bash
npm run deploy:staging
```

### Production Deployment

```bash
npm run deploy:production
```

## Deployment Scripts

### Main Deployment Script

**Command:** `npm run deploy` or `npm run deploy:staging`

**What it does:**
1. Checks prerequisites (Node.js, npm, PostgreSQL, disk space)
2. Installs dependencies
3. Runs database migrations
4. Runs image storage migration (if needed)
5. Builds the application
6. Runs tests (in staging)
7. Verifies deployment
8. Checks for orphaned images

**Environment Variables:**
- `SKIP_MIGRATION=true` - Skip image storage migration
- `SKIP_BACKUP=true` - Skip database backup during migration
- `MIGRATION_BATCH_SIZE=50` - Number of images to process per batch

**Example:**
```bash
# Deploy without migration
SKIP_MIGRATION=true npm run deploy:staging

# Deploy with custom batch size
MIGRATION_BATCH_SIZE=100 npm run deploy:staging
```

### Production Deployment Script

**Command:** `npm run deploy:production`

**What it does:**
- Includes all steps from main deployment script
- Adds safety confirmations
- Requires pre-deployment checklist
- Creates deployment log
- Provides post-deployment instructions

**Pre-deployment Checklist:**
1. Database backup completed
2. Sufficient disk space verified (2x current uploads)
3. Team notified of deployment
4. Deployment during low-traffic period

**Output:**
- Creates deployment log: `deployment_YYYYMMDD_HHMMSS.log`
- Provides post-deployment tasks
- Includes rollback instructions

### Rollback Script

**Command:** `npm run rollback:migration`

**What it does:**
- Restores database URLs to legacy format
- Verifies rollback success
- Provides restart instructions

**When to use:**
- Migration causes critical issues
- Images not displaying correctly
- Database corruption detected
- Need to revert to previous state

## OAuth Configuration for Deployment

### Production OAuth Setup

Before deploying to production, you must configure OAuth credentials for the production environment.

**Important:** Use separate OAuth apps for development, staging, and production environments.

#### Google OAuth for Production

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth 2.0 Client ID for production
3. Add production authorized redirect URIs:
   - `https://yourdomain.com/auth/google/callback`
   - `https://api.yourdomain.com/auth/google/callback` (if using separate API domain)
4. Copy production Client ID and Client Secret
5. Add to production environment variables

#### Facebook OAuth for Production

1. Go to [Facebook Developers](https://developers.facebook.com/apps/)
2. Create a new app for production or switch existing app to Live mode
3. Configure Valid OAuth Redirect URIs:
   - `https://yourdomain.com/auth/facebook/callback`
   - `https://api.yourdomain.com/auth/facebook/callback` (if using separate API domain)
4. Submit app for review if required
5. Copy production App ID and App Secret
6. Add to production environment variables

#### Production Environment Variables

Ensure these OAuth variables are set in your production environment:

```env
# OAuth - Google (Production)
GOOGLE_CLIENT_ID=production-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=production-client-secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback

# OAuth - Facebook (Production)
FACEBOOK_APP_ID=production-app-id
FACEBOOK_APP_SECRET=production-app-secret
FACEBOOK_CALLBACK_URL=https://yourdomain.com/auth/facebook/callback

# Frontend URL (Production)
FRONTEND_URL=https://yourdomain.com
```

**Security Notes:**
- Always use HTTPS for production callback URLs
- Never commit OAuth credentials to version control
- Use different credentials for each environment
- Store credentials in a secure secrets manager
- Rotate credentials regularly

For detailed OAuth setup instructions, see [OAUTH_SETUP.md](./OAUTH_SETUP.md).

## Deployment Process

### 1. Pre-Deployment

#### Check Prerequisites

```bash
# Verify Node.js version
node -v  # Should be v18 or higher

# Verify npm version
npm -v

# Check disk space
df -h

# Verify database connection
psql $DATABASE_URL -c "SELECT 1;"
```

#### Backup Database

```bash
# PostgreSQL backup
pg_dump -h localhost -U your_user -d your_database > backup_$(date +%Y%m%d_%H%M%S).sql

# Or use cloud provider backup
# AWS RDS: Create manual snapshot
# Google Cloud SQL: Create backup
```

#### Backup Files

```bash
# Backup uploads directory
tar -czf uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz backend/uploads/
```

#### Verify Disk Space

```bash
# Check uploads directory size
du -sh backend/uploads/products/

# Ensure 2x space available
df -h backend/uploads/
```

### 2. Deployment

#### Staging Deployment

```bash
# Run deployment
npm run deploy:staging

# Monitor output for errors
# Verify all steps complete successfully
```

#### Production Deployment

```bash
# Run production deployment
npm run deploy:production

# Answer pre-deployment checklist questions
# Monitor deployment progress
# Review deployment log
```

### 3. Post-Deployment

#### Verify Deployment

```bash
# Check application status
pm2 status  # or your process manager

# Test API endpoint
curl http://localhost:3001/api/products

# Check image URLs
curl http://localhost:3001/api/products/[product-slug]

# Test OAuth endpoints
curl http://localhost:3001/auth/google
curl http://localhost:3001/auth/facebook
```

#### Test OAuth Authentication

1. Open application in browser
2. Navigate to login page
3. Test Google OAuth flow:
   - Click "Sign in with Google"
   - Complete authentication
   - Verify redirect back to application
   - Check user is authenticated
4. Test Facebook OAuth flow:
   - Log out
   - Click "Sign in with Facebook"
   - Complete authentication
   - Verify redirect back to application
   - Check user is authenticated
5. Test checkout protection:
   - Log out
   - Navigate to checkout
   - Verify redirect to login
   - Complete OAuth authentication
   - Verify redirect back to checkout

#### Monitor Logs

```bash
# Application logs
tail -f backend/logs/application.log

# Look for:
# - No image-related errors
# - No legacy fallback warnings
# - Normal operation
```

#### Test Image Display

1. Open application in browser
2. Navigate to product pages
3. Verify images load correctly
4. Check browser console for errors
5. Test multiple products

#### Run Cleanup (Optional)

```bash
# Check for orphaned directories
cd backend
npm run cleanup:orphaned-images -- --dry-run

# Remove orphaned directories if found
npm run cleanup:orphaned-images -- --confirm
```

## Troubleshooting

### Deployment Fails

**Check deployment log:**
```bash
cat deployment_YYYYMMDD_HHMMSS.log
```

**Common issues:**
- Insufficient disk space → Free up space or add storage
- Database connection failed → Check database credentials
- Migration errors → See Migration Runbook
- Build errors → Check for code issues

### Images Not Displaying

**Check image URLs:**
```bash
cd backend
npm run verify:migration
```

**Check file permissions:**
```bash
ls -la backend/uploads/products/
chmod -R 755 backend/uploads/products/
```

**Restart application:**
```bash
pm2 restart your-app
```

### Migration Issues

**See detailed troubleshooting:**
- [Migration Runbook](backend/scripts/MIGRATION_RUNBOOK.md)
- [Image Storage API Documentation](backend/src/products/IMAGE_STORAGE_API.md)

**Quick rollback:**
```bash
npm run rollback:migration
```

## Environment-Specific Configuration

### Staging

- Runs all tests
- Uses smaller batch sizes
- More verbose logging
- Allows migration retries

### Production

- Skips e2e tests (for speed)
- Requires confirmations
- Creates deployment logs
- Includes safety checks

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run deployment
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          SKIP_MIGRATION: false
          MIGRATION_BATCH_SIZE: 50
        run: npm run deploy:production

      - name: Upload deployment log
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: deployment-log
          path: deployment_*.log
```

### GitLab CI Example

```yaml
deploy:production:
  stage: deploy
  only:
    - main
  script:
    - npm ci
    - npm run deploy:production
  artifacts:
    paths:
      - deployment_*.log
    when: always
  environment:
    name: production
```

## Monitoring

### Key Metrics

- Deployment duration
- Migration success rate
- Image retrieval success rate
- Application error rate
- Disk space usage

### Alerts

Set up alerts for:
- Deployment failures
- Migration errors
- High error rates after deployment
- Disk space warnings
- Image 404 errors

## Best Practices

1. **Always backup before deployment**
   - Database backup
   - File system backup
   - Verify backup integrity

2. **Deploy during low-traffic periods**
   - Reduces impact on users
   - Easier to monitor
   - Faster rollback if needed

3. **Test in staging first**
   - Verify deployment process
   - Test migration
   - Identify issues early

4. **Monitor after deployment**
   - Watch logs for 15-30 minutes
   - Test critical flows
   - Check for user reports

5. **Keep deployment logs**
   - Archive for troubleshooting
   - Document issues
   - Track deployment history

## Related Documentation

- [OAuth Setup Guide](./OAUTH_SETUP.md) - Complete OAuth configuration guide
- [OAuth Configuration](backend/src/auth/config/README.md) - OAuth validation documentation
- [Migration Runbook](backend/scripts/MIGRATION_RUNBOOK.md) - Detailed migration guide
- [Image Storage API](backend/src/products/IMAGE_STORAGE_API.md) - API documentation
- [Products Module](backend/src/products/README.md) - Module documentation
- [Backward Compatibility](backend/src/products/BACKWARD_COMPATIBILITY.md) - Legacy support

## Support

For deployment issues:
1. Check this guide
2. Review deployment logs
3. Check Migration Runbook
4. Contact DevOps team
5. Initiate rollback if critical
