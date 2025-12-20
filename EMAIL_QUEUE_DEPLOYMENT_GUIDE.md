# Email Queue Service Deployment Guide

This guide provides comprehensive instructions for deploying the asynchronous email queue service in different environments.

## Overview

The email queue service transforms synchronous email processing into an asynchronous, event-driven system using BullMQ and Redis. This deployment guide covers:

- Pre-deployment preparation
- Environment-specific deployment procedures
- Monitoring setup
- Troubleshooting and rollback procedures

## Prerequisites

### System Requirements

- **Node.js**: Version 18 or 20
- **Redis**: Version 6.0 or higher
- **PM2**: For process management
- **Disk Space**: At least 2GB free space for logs and queue data
- **Memory**: Minimum 1GB available RAM

### Dependencies

```bash
# Install global dependencies
npm install -g pm2

# Install Redis (if not already installed)
# Ubuntu/Debian:
sudo apt-get install redis-server

# macOS:
brew install redis

# CentOS/RHEL:
sudo yum install redis
```

### Environment Variables

Required environment variables:
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
```

Optional configuration (see EMAIL_QUEUE_CONFIGURATION.md for details):
```bash
EMAIL_WORKER_CONCURRENCY=5
EMAIL_RATE_LIMIT_MAX=100
EMAIL_QUEUE_MAX_ATTEMPTS=5
# ... additional configuration options
```

## Deployment Procedures

### Development Environment

```bash
# 1. Deploy with minimal configuration
npm run deploy-email-queue --env development --workers 1

# 2. Setup monitoring (optional for development)
npm run setup-email-queue-monitoring --env development

# 3. Verify deployment
curl http://localhost:3000/email-queue/health
```

### Staging Environment

```bash
# 1. Validate configuration first
npm run setup-email-config validate

# 2. Deploy with staging configuration
npm run deploy-email-queue --env staging --workers 2

# 3. Setup monitoring with alerts
npm run setup-email-queue-monitoring --env staging --alert-email admin@example.com

# 4. Run data migration if needed
npm run migrate-email-queue-data --dry-run
npm run migrate-email-queue-data

# 5. Verify deployment
./backend/scripts/monitor-email-queue.sh
```

### Production Environment

```bash
# 1. Pre-deployment checklist
echo "Pre-deployment checklist:"
echo "- [ ] Database backup created"
echo "- [ ] Redis backup created"
echo "- [ ] Sufficient disk space verified"
echo "- [ ] Team notified"
echo "- [ ] Maintenance window scheduled"

# 2. Validate configuration
npm run setup-email-config validate

# 3. Deploy with production configuration
npm run deploy-email-queue --env production --workers 3

# 4. Setup comprehensive monitoring
npm run setup-email-queue-monitoring --env production \
  --webhook-url https://hooks.slack.com/your-webhook \
  --alert-email alerts@example.com

# 5. Install monitoring cron job
crontab /tmp/email-queue-cron

# 6. Install log rotation (requires sudo)
sudo cp /tmp/email-queue-logrotate /etc/logrotate.d/email-queue

# 7. Run data migration
npm run migrate-email-queue-data --batch-size 50

# 8. Verify deployment
./backend/scripts/monitor-email-queue.sh
curl http://localhost:3000/email-queue/health
```

## Deployment Scripts

### Main Deployment Script

```bash
npm run deploy-email-queue [options]

Options:
  --env <environment>          Deployment environment (development|staging|production)
  --workers <number>           Number of worker instances
  --skip-validation           Skip configuration validation
  --skip-health-check         Skip health checks after deployment
  --dry-run                   Preview deployment without making changes
```

### Data Migration Script

```bash
npm run migrate-email-queue-data [options]

Options:
  --dry-run                   Preview migration without making changes
  --batch-size <number>       Number of records to process per batch
  --skip-backup              Skip creating data backup
  --skip-failed-emails       Skip reprocessing failed emails
```

### Monitoring Setup Script

```bash
npm run setup-email-queue-monitoring [options]

Options:
  --env <environment>         Environment (development|staging|production)
  --cron-interval <interval>  Cron interval (default: "*/5 * * * *")
  --webhook-url <url>         Webhook URL for Slack/Discord alerts
  --alert-email <email>       Email address for alerts
```

## Post-Deployment Verification

### 1. Service Health Check

```bash
# Check PM2 processes
pm2 list

# Check queue health
curl http://localhost:3000/email-queue/health

# Check queue metrics
curl http://localhost:3000/email-queue/metrics
```

### 2. Functional Testing

```bash
# Test email event creation (via application)
# 1. Create a test order
# 2. Verify order confirmation email is queued
# 3. Check email delivery

# Monitor queue processing
pm2 logs email-queue-worker
```

### 3. Performance Monitoring

```bash
# View real-time dashboard
./backend/scripts/monitoring/dashboard.sh --watch

# Check system resources
./backend/scripts/monitor-email-queue.sh

# Review metrics
tail -f backend/logs/email-queue-metrics.log
```

## Monitoring and Alerting

### Automated Monitoring

The monitoring system provides:
- **Health Checks**: Every 5 minutes (configurable)
- **Alert Notifications**: Via Slack/Discord webhooks and email
- **Performance Metrics**: Queue depth, processing rate, error rates
- **System Resources**: CPU, memory, disk usage
- **Weekly Reports**: Automated summary reports

### Manual Monitoring Commands

```bash
# Real-time dashboard
./backend/scripts/monitoring/dashboard.sh

# Health check
./backend/scripts/monitor-email-queue.sh

# View logs
pm2 logs email-queue-worker
tail -f backend/logs/email-queue-monitoring.log

# Queue metrics
curl http://localhost:3000/email-queue/metrics | jq
```

### Alert Thresholds

Default thresholds by environment:

**Production:**
- Queue Depth: > 1000 jobs
- Error Rate: > 5%
- Processing Time: > 300 seconds
- Disk Usage: > 75%
- Memory Usage: > 75%

**Staging:**
- Queue Depth: > 750 jobs
- Error Rate: > 7%
- Processing Time: > 450 seconds
- Disk Usage: > 80%
- Memory Usage: > 80%

## Troubleshooting

### Common Issues

#### 1. Workers Not Starting

**Symptoms:**
- PM2 shows workers as stopped or errored
- No email processing

**Solutions:**
```bash
# Check PM2 logs
pm2 logs email-queue-worker

# Restart workers
pm2 restart email-queue-worker

# Check configuration
npm run setup-email-config validate

# Verify Redis connection
redis-cli ping
```

#### 2. High Queue Depth

**Symptoms:**
- Queue metrics show high waiting job count
- Slow email delivery

**Solutions:**
```bash
# Increase worker concurrency
export EMAIL_WORKER_CONCURRENCY=10
pm2 restart email-queue-worker

# Scale worker instances
pm2 scale email-queue-worker +2

# Check for failed jobs
curl http://localhost:3000/email-queue/metrics
```

#### 3. High Error Rate

**Symptoms:**
- Many failed jobs in queue metrics
- Email delivery failures

**Solutions:**
```bash
# Check failed jobs
curl http://localhost:3000/email-queue/admin/failed-jobs

# Review error logs
pm2 logs email-queue-worker | grep ERROR

# Check email service configuration
npm run test-swaks-email
```

#### 4. Redis Connection Issues

**Symptoms:**
- Workers unable to connect to Redis
- Queue operations failing

**Solutions:**
```bash
# Check Redis status
redis-cli ping

# Restart Redis
sudo systemctl restart redis

# Check Redis logs
sudo tail -f /var/log/redis/redis-server.log

# Verify Redis configuration
redis-cli config get "*"
```

### Performance Tuning

#### High Volume Environments

```bash
# Increase worker concurrency
export EMAIL_WORKER_CONCURRENCY=20
export EMAIL_RATE_LIMIT_MAX=500

# Scale worker instances
pm2 scale email-queue-worker 5

# Optimize Redis
# Add to redis.conf:
# maxmemory-policy allkeys-lru
# save 900 1
```

#### Memory Optimization

```bash
# Reduce job retention
export EMAIL_QUEUE_COMPLETED_RETENTION_COUNT=500
export EMAIL_QUEUE_FAILED_RETENTION_COUNT=250

# Restart workers
pm2 restart email-queue-worker
```

## Rollback Procedures

### Emergency Rollback

If critical issues occur:

```bash
# 1. Stop email queue workers
pm2 stop email-queue-worker

# 2. Revert to synchronous email processing
# (Requires code changes to re-enable direct EmailService usage)

# 3. Clear queue if needed
redis-cli flushdb

# 4. Restart main application
pm2 restart your-main-app
```

### Partial Rollback

To rollback specific components:

```bash
# Stop workers only (keep queue data)
pm2 stop email-queue-worker

# Disable monitoring
crontab -r

# Remove log rotation
sudo rm /etc/logrotate.d/email-queue
```

### Data Recovery

If data migration issues occur:

```bash
# Restore from backup (if created)
# Check migration logs for backup file location
ls -la email-migration-backup-*.json

# Re-run migration with different parameters
npm run migrate-email-queue-data --batch-size 25 --skip-failed-emails
```

## Security Considerations

### Redis Security

```bash
# Enable Redis AUTH
redis-cli config set requirepass your-secure-password

# Update environment variables
export REDIS_PASSWORD=your-secure-password

# Restart workers
pm2 restart email-queue-worker
```

### Network Security

- Configure Redis to bind to specific interfaces only
- Use firewall rules to restrict Redis access
- Enable TLS for Redis connections in production
- Regularly update Redis and Node.js versions

### Access Control

- Limit access to monitoring endpoints
- Secure webhook URLs
- Use environment-specific alert channels
- Regularly rotate Redis passwords

## Maintenance

### Daily Tasks

- Automated via monitoring scripts
- Log rotation
- Health checks
- Alert notifications

### Weekly Tasks

```bash
# Review weekly reports
ls -la backend/logs/weekly-report-*.txt

# Check queue performance trends
grep "processing_rate" backend/logs/email-queue-metrics.log | tail -100

# Update alert thresholds if needed
vim backend/scripts/monitoring/alert-config.json
```

### Monthly Tasks

```bash
# Archive old logs
find backend/logs -name "*.log.*.gz" -mtime +90 -delete

# Review and update monitoring configuration
vim EMAIL_QUEUE_MONITORING_SETUP.md

# Update dependencies
npm audit
npm update
```

## Support and Documentation

### Additional Resources

- **Configuration Guide**: `backend/src/email-queue/EMAIL_QUEUE_CONFIGURATION.md`
- **Monitoring Setup**: `EMAIL_QUEUE_MONITORING_SETUP.md`
- **API Documentation**: `backend/src/email-queue/ADMIN_ENDPOINTS.md`
- **Backward Compatibility**: `backend/src/email-queue/BACKWARD_COMPATIBILITY.md`

### Getting Help

1. **Check Logs**: Review application and monitoring logs
2. **Run Diagnostics**: Use built-in health check and validation tools
3. **Review Documentation**: Check configuration and troubleshooting guides
4. **Contact Support**: Escalate to DevOps team with relevant logs and metrics

### Emergency Contacts

- **DevOps Team**: [contact information]
- **On-Call Engineer**: [contact information]
- **System Administrator**: [contact information]

## Deployment Checklist

### Pre-Deployment

- [ ] System requirements verified
- [ ] Dependencies installed
- [ ] Configuration validated
- [ ] Backups created
- [ ] Team notified
- [ ] Maintenance window scheduled

### Deployment

- [ ] Configuration deployed
- [ ] Workers started
- [ ] Monitoring setup
- [ ] Health checks passed
- [ ] Data migration completed
- [ ] Functional testing passed

### Post-Deployment

- [ ] Performance monitoring active
- [ ] Alert notifications configured
- [ ] Documentation updated
- [ ] Team training completed
- [ ] Rollback procedures tested
- [ ] Support contacts updated

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Environment**: All environments supported