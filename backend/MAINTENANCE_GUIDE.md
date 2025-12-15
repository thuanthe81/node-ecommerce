# PDF Generation System Maintenance Guide

## Overview

This guide covers ongoing maintenance procedures, performance optimization, troubleshooting, and system administration tasks for the PDF generation and email attachment system.

## Daily Maintenance Tasks

### 1. System Health Monitoring

**Morning Health Check:**
```bash
#!/bin/bash
# /opt/alacraft-backend/scripts/daily-health-check.sh

echo "=== Daily Health Check - $(date) ==="

# Check application status
echo "1. Application Status:"
pm2 status alacraft-backend

# Check system resources
echo -e "\n2. System Resources:"
echo "Memory Usage:"
free -h
echo "Disk Usage:"
df -h /opt/alacraft-backend
echo "CPU Load:"
uptime

# Check PDF storage
echo -e "\n3. PDF Storage:"
pdf_count=$(find /opt/alacraft-backend/uploads/pdfs -name "*.pdf" | wc -l)
pdf_size=$(du -sh /opt/alacraft-backend/uploads/pdfs | cut -f1)
echo "PDF Files: $pdf_count"
echo "Storage Used: $pdf_size"

# Check recent errors
echo -e "\n4. Recent Errors (last 24 hours):"
journalctl -u alacraft-backend --since "24 hours ago" --priority=err --no-pager | tail -10

# Check health endpoint
echo -e "\n5. Health Endpoint:"
curl -s http://localhost:3000/health | jq '.' || echo "Health endpoint unavailable"

# Check database connectivity
echo -e "\n6. Database Status:"
psql -U alacraft_user -d alacraft -c "SELECT version();" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "Database: Connected"
else
    echo "Database: Connection failed"
fi

echo -e "\n=== Health Check Complete ==="
```

**Schedule Daily Health Check:**
```bash
# Add to crontab
crontab -e
0 8 * * * /opt/alacraft-backend/scripts/daily-health-check.sh >> /var/log/daily-health-check.log 2>&1
```

### 2. Log Review and Rotation

**Log Analysis Script:**
```bash
#!/bin/bash
# /opt/alacraft-backend/scripts/analyze-logs.sh

LOG_DIR="/opt/alacraft-backend/logs"
REPORT_FILE="/tmp/log-analysis-$(date +%Y%m%d).txt"

echo "=== Log Analysis Report - $(date) ===" > "$REPORT_FILE"

# Error count analysis
echo -e "\n1. Error Summary:" >> "$REPORT_FILE"
grep -i "error" "$LOG_DIR"/*.log | wc -l | xargs echo "Total Errors:" >> "$REPORT_FILE"
grep -i "pdf generation failed" "$LOG_DIR"/*.log | wc -l | xargs echo "PDF Generation Failures:" >> "$REPORT_FILE"
grep -i "email.*failed" "$LOG_DIR"/*.log | wc -l | xargs echo "Email Failures:" >> "$REPORT_FILE"

# Performance metrics
echo -e "\n2. Performance Metrics:" >> "$REPORT_FILE"
grep "PDF generated successfully" "$LOG_DIR"/*.log | grep -o "[0-9]\+ms" | \
    awk '{sum+=$1; count++} END {if(count>0) print "Average PDF Generation Time:", sum/count "ms"}' >> "$REPORT_FILE"

# Top error patterns
echo -e "\n3. Top Error Patterns:" >> "$REPORT_FILE"
grep -i "error" "$LOG_DIR"/*.log | cut -d':' -f4- | sort | uniq -c | sort -nr | head -5 >> "$REPORT_FILE"

# Storage usage trends
echo -e "\n4. Storage Usage:" >> "$REPORT_FILE"
du -sh /opt/alacraft-backend/uploads/pdfs >> "$REPORT_FILE"

# Email the report
mail -s "Daily Log Analysis Report" admin@alacraft.com < "$REPORT_FILE"

# Cleanup old reports
find /tmp -name "log-analysis-*.txt" -mtime +7 -delete
```

### 3. PDF Storage Cleanup

**Automated Cleanup Script:**
```bash
#!/bin/bash
# /opt/alacraft-backend/scripts/pdf-cleanup.sh

PDF_DIR="/opt/alacraft-backend/uploads/pdfs"
RETENTION_HOURS=24
LOG_FILE="/var/log/pdf-cleanup.log"

echo "$(date): Starting PDF cleanup" >> "$LOG_FILE"

# Count files before cleanup
before_count=$(find "$PDF_DIR" -name "*.pdf" | wc -l)
before_size=$(du -sh "$PDF_DIR" | cut -f1)

# Remove files older than retention period
find "$PDF_DIR" -name "*.pdf" -mtime +$(($RETENTION_HOURS / 24)) -delete

# Count files after cleanup
after_count=$(find "$PDF_DIR" -name "*.pdf" | wc -l)
after_size=$(du -sh "$PDF_DIR" | cut -f1)

# Log results
echo "$(date): Cleanup completed" >> "$LOG_FILE"
echo "  Files before: $before_count ($before_size)" >> "$LOG_FILE"
echo "  Files after: $after_count ($after_size)" >> "$LOG_FILE"
echo "  Files removed: $(($before_count - $after_count))" >> "$LOG_FILE"

# Alert if cleanup didn't work as expected
if [ $after_count -gt 1000 ]; then
    echo "WARNING: High number of PDF files remaining: $after_count" >> "$LOG_FILE"
    echo "PDF cleanup warning: $after_count files remaining" | \
        mail -s "PDF Cleanup Alert" admin@alacraft.com
fi
```

## Weekly Maintenance Tasks

### 1. Performance Analysis

**Weekly Performance Report:**
```bash
#!/bin/bash
# /opt/alacraft-backend/scripts/weekly-performance.sh

REPORT_FILE="/tmp/weekly-performance-$(date +%Y%m%d).txt"
LOG_DIR="/opt/alacraft-backend/logs"

echo "=== Weekly Performance Report - $(date) ===" > "$REPORT_FILE"

# PDF Generation Statistics
echo -e "\n1. PDF Generation Statistics:" >> "$REPORT_FILE"
total_pdfs=$(grep "PDF generated successfully" "$LOG_DIR"/*.log | wc -l)
echo "Total PDFs Generated: $total_pdfs" >> "$REPORT_FILE"

# Average generation time
avg_time=$(grep "PDF generated successfully" "$LOG_DIR"/*.log | \
    grep -o "[0-9]\+ms" | sed 's/ms//' | \
    awk '{sum+=$1; count++} END {if(count>0) print sum/count}')
echo "Average Generation Time: ${avg_time}ms" >> "$REPORT_FILE"

# Email Statistics
echo -e "\n2. Email Statistics:" >> "$REPORT_FILE"
total_emails=$(grep "Email.*sent successfully" "$LOG_DIR"/*.log | wc -l)
failed_emails=$(grep "Failed to send email" "$LOG_DIR"/*.log | wc -l)
success_rate=$(echo "scale=2; $total_emails / ($total_emails + $failed_emails) * 100" | bc)
echo "Total Emails Sent: $total_emails" >> "$REPORT_FILE"
echo "Failed Emails: $failed_emails" >> "$REPORT_FILE"
echo "Success Rate: ${success_rate}%" >> "$REPORT_FILE"

# System Resource Usage
echo -e "\n3. System Resource Usage:" >> "$REPORT_FILE"
echo "Average Memory Usage:" >> "$REPORT_FILE"
sar -r 1 1 | tail -1 | awk '{print "  Memory: " $4 "% used"}' >> "$REPORT_FILE"

echo "Average CPU Usage:" >> "$REPORT_FILE"
sar -u 1 1 | tail -1 | awk '{print "  CPU: " 100-$8 "% used"}' >> "$REPORT_FILE"

# Storage Growth
echo -e "\n4. Storage Analysis:" >> "$REPORT_FILE"
current_size=$(du -sb /opt/alacraft-backend/uploads/pdfs | cut -f1)
echo "Current PDF Storage: $(($current_size / 1024 / 1024))MB" >> "$REPORT_FILE"

# Top Error Categories
echo -e "\n5. Error Analysis:" >> "$REPORT_FILE"
echo "Top 5 Error Types:" >> "$REPORT_FILE"
grep -i "error" "$LOG_DIR"/*.log | \
    sed 's/.*ERROR \[.*\] //' | cut -d':' -f1 | \
    sort | uniq -c | sort -nr | head -5 >> "$REPORT_FILE"

# Email the report
mail -s "Weekly Performance Report" admin@alacraft.com < "$REPORT_FILE"
```

### 2. Database Maintenance

**Database Optimization Script:**
```bash
#!/bin/bash
# /opt/alacraft-backend/scripts/db-maintenance.sh

DB_NAME="alacraft"
DB_USER="alacraft_user"
BACKUP_DIR="/opt/backups/alacraft"

echo "$(date): Starting database maintenance"

# Create backup before maintenance
echo "Creating backup..."
pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_DIR/pre-maintenance-$(date +%Y%m%d).sql"

# Analyze database statistics
echo "Analyzing database..."
psql -U "$DB_USER" -d "$DB_NAME" -c "ANALYZE;"

# Vacuum database
echo "Vacuuming database..."
psql -U "$DB_USER" -d "$DB_NAME" -c "VACUUM;"

# Reindex database
echo "Reindexing database..."
psql -U "$DB_USER" -d "$DB_NAME" -c "REINDEX DATABASE $DB_NAME;"

# Check database size
db_size=$(psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));")
echo "Database size after maintenance: $db_size"

# Check for long-running queries
echo "Checking for long-running queries..."
psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';"

echo "$(date): Database maintenance completed"
```

### 3. Security Updates

**Security Update Script:**
```bash
#!/bin/bash
# /opt/alacraft-backend/scripts/security-updates.sh

echo "$(date): Starting security updates"

# Update system packages
echo "Updating system packages..."
apt-get update
apt-get upgrade -y

# Update Node.js dependencies
echo "Checking for Node.js security updates..."
cd /opt/alacraft-backend
npm audit

# Check for high/critical vulnerabilities
vulnerabilities=$(npm audit --json | jq '.metadata.vulnerabilities.high + .metadata.vulnerabilities.critical')
if [ "$vulnerabilities" -gt 0 ]; then
    echo "Found $vulnerabilities high/critical vulnerabilities"
    echo "Security vulnerabilities found: $vulnerabilities" | \
        mail -s "Security Alert - AlaCraft Backend" admin@alacraft.com

    # Attempt to fix automatically
    npm audit fix
fi

# Check SSL certificate expiration
echo "Checking SSL certificate..."
cert_days=$(openssl x509 -in /etc/letsencrypt/live/api.alacraft.com/cert.pem -noout -dates | \
    grep notAfter | cut -d= -f2 | xargs -I {} date -d {} +%s)
current_days=$(date +%s)
days_until_expiry=$(( ($cert_days - $current_days) / 86400 ))

if [ $days_until_expiry -lt 30 ]; then
    echo "SSL certificate expires in $days_until_expiry days" | \
        mail -s "SSL Certificate Expiration Warning" admin@alacraft.com
fi

echo "$(date): Security updates completed"
```

## Monthly Maintenance Tasks

### 1. Comprehensive System Review

**Monthly System Audit:**
```bash
#!/bin/bash
# /opt/alacraft-backend/scripts/monthly-audit.sh

AUDIT_REPORT="/tmp/monthly-audit-$(date +%Y%m).txt"

echo "=== Monthly System Audit - $(date) ===" > "$AUDIT_REPORT"

# System Information
echo -e "\n1. System Information:" >> "$AUDIT_REPORT"
uname -a >> "$AUDIT_REPORT"
lsb_release -a >> "$AUDIT_REPORT"

# Application Version
echo -e "\n2. Application Information:" >> "$AUDIT_REPORT"
cd /opt/alacraft-backend
git log --oneline -5 >> "$AUDIT_REPORT"
node --version >> "$AUDIT_REPORT"
npm --version >> "$AUDIT_REPORT"

# Resource Usage Trends
echo -e "\n3. Resource Usage Trends:" >> "$AUDIT_REPORT"
echo "Disk Usage Growth:" >> "$AUDIT_REPORT"
df -h >> "$AUDIT_REPORT"

echo -e "\nMemory Usage:" >> "$AUDIT_REPORT"
free -h >> "$AUDIT_REPORT"

# Performance Metrics
echo -e "\n4. Performance Metrics (Last 30 Days):" >> "$AUDIT_REPORT"
total_pdfs=$(grep "PDF generated successfully" /opt/alacraft-backend/logs/*.log | wc -l)
echo "Total PDFs Generated: $total_pdfs" >> "$AUDIT_REPORT"

# Error Analysis
echo -e "\n5. Error Analysis:" >> "$AUDIT_REPORT"
error_count=$(grep -i "error" /opt/alacraft-backend/logs/*.log | wc -l)
echo "Total Errors: $error_count" >> "$AUDIT_REPORT"

# Security Status
echo -e "\n6. Security Status:" >> "$AUDIT_REPORT"
echo "Failed Login Attempts:" >> "$AUDIT_REPORT"
grep "authentication failed" /var/log/auth.log | wc -l >> "$AUDIT_REPORT"

echo "Firewall Status:" >> "$AUDIT_REPORT"
ufw status >> "$AUDIT_REPORT"

# Backup Status
echo -e "\n7. Backup Status:" >> "$AUDIT_REPORT"
echo "Recent Backups:" >> "$AUDIT_REPORT"
ls -la /opt/backups/alacraft/ | tail -5 >> "$AUDIT_REPORT"

# Recommendations
echo -e "\n8. Recommendations:" >> "$AUDIT_REPORT"
if [ $total_pdfs -gt 10000 ]; then
    echo "- Consider implementing PDF archiving strategy" >> "$AUDIT_REPORT"
fi

if [ $error_count -gt 100 ]; then
    echo "- High error count detected, review error patterns" >> "$AUDIT_REPORT"
fi

# Email the audit report
mail -s "Monthly System Audit Report" admin@alacraft.com < "$AUDIT_REPORT"
```

### 2. Capacity Planning

**Capacity Planning Analysis:**
```bash
#!/bin/bash
# /opt/alacraft-backend/scripts/capacity-planning.sh

REPORT_FILE="/tmp/capacity-planning-$(date +%Y%m).txt"

echo "=== Capacity Planning Report - $(date) ===" > "$REPORT_FILE"

# Storage Growth Analysis
echo -e "\n1. Storage Growth Analysis:" >> "$REPORT_FILE"
current_usage=$(df /opt/alacraft-backend | tail -1 | awk '{print $5}' | sed 's/%//')
echo "Current Disk Usage: ${current_usage}%" >> "$REPORT_FILE"

# Predict storage needs
pdf_growth_rate=$(find /opt/alacraft-backend/uploads/pdfs -name "*.pdf" -mtime -30 | wc -l)
monthly_growth_mb=$(echo "$pdf_growth_rate * 0.5" | bc) # Assuming 0.5MB per PDF
echo "Monthly PDF Growth: ${pdf_growth_rate} files (~${monthly_growth_mb}MB)" >> "$REPORT_FILE"

# Memory Usage Trends
echo -e "\n2. Memory Usage Analysis:" >> "$REPORT_FILE"
avg_memory=$(sar -r 1 1 | tail -1 | awk '{print $4}')
echo "Average Memory Usage: ${avg_memory}%" >> "$REPORT_FILE"

# CPU Usage Trends
echo -e "\n3. CPU Usage Analysis:" >> "$REPORT_FILE"
avg_cpu=$(sar -u 1 1 | tail -1 | awk '{print 100-$8}')
echo "Average CPU Usage: ${avg_cpu}%" >> "$REPORT_FILE"

# Database Growth
echo -e "\n4. Database Growth:" >> "$REPORT_FILE"
db_size=$(psql -U alacraft_user -d alacraft -t -c "SELECT pg_size_pretty(pg_database_size('alacraft'));")
echo "Current Database Size: $db_size" >> "$REPORT_FILE"

# Recommendations
echo -e "\n5. Capacity Recommendations:" >> "$REPORT_FILE"
if [ $current_usage -gt 80 ]; then
    echo "- URGENT: Disk usage above 80%, consider storage expansion" >> "$REPORT_FILE"
elif [ $current_usage -gt 70 ]; then
    echo "- WARNING: Disk usage above 70%, monitor closely" >> "$REPORT_FILE"
fi

if (( $(echo "$avg_memory > 80" | bc -l) )); then
    echo "- Consider memory upgrade, current usage: ${avg_memory}%" >> "$REPORT_FILE"
fi

if (( $(echo "$avg_cpu > 70" | bc -l) )); then
    echo "- Consider CPU upgrade, current usage: ${avg_cpu}%" >> "$REPORT_FILE"
fi

# Email the report
mail -s "Capacity Planning Report" admin@alacraft.com < "$REPORT_FILE"
```

## Performance Optimization

### 1. PDF Generation Optimization

**Performance Tuning Script:**
```bash
#!/bin/bash
# /opt/alacraft-backend/scripts/optimize-performance.sh

echo "$(date): Starting performance optimization"

# Optimize Puppeteer settings
echo "Optimizing Puppeteer configuration..."
cat > /opt/alacraft-backend/config/puppeteer-optimized.json << EOF
{
  "args": [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-accelerated-2d-canvas",
    "--no-first-run",
    "--no-zygote",
    "--single-process",
    "--disable-gpu",
    "--disable-extensions",
    "--disable-plugins",
    "--disable-images",
    "--disable-javascript",
    "--disable-default-apps",
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding"
  ],
  "timeout": 30000,
  "headless": true
}
EOF

# Optimize Node.js settings
echo "Optimizing Node.js settings..."
export NODE_OPTIONS="--max-old-space-size=4096 --optimize-for-size"

# Clear temporary files
echo "Cleaning temporary files..."
find /tmp -name "*.pdf" -mtime +1 -delete
find /opt/alacraft-backend/uploads/pdfs -name "*.tmp" -delete

# Restart application with optimized settings
echo "Restarting application..."
pm2 restart alacraft-backend --update-env

echo "$(date): Performance optimization completed"
```

### 2. Database Performance Tuning

**Database Performance Script:**
```bash
#!/bin/bash
# /opt/alacraft-backend/scripts/tune-database.sh

DB_NAME="alacraft"
DB_USER="alacraft_user"

echo "$(date): Starting database performance tuning"

# Analyze slow queries
echo "Analyzing slow queries..."
psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;"

# Update table statistics
echo "Updating table statistics..."
psql -U "$DB_USER" -d "$DB_NAME" -c "ANALYZE;"

# Check for missing indexes
echo "Checking for missing indexes..."
psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
AND n_distinct > 100
AND correlation < 0.1;"

# Optimize PostgreSQL configuration
echo "Optimizing PostgreSQL configuration..."
sudo tee -a /etc/postgresql/13/main/postgresql.conf << EOF

# Performance optimizations
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
EOF

# Restart PostgreSQL
sudo systemctl restart postgresql

echo "$(date): Database performance tuning completed"
```

## Troubleshooting Procedures

### 1. Application Not Starting

**Diagnostic Script:**
```bash
#!/bin/bash
# /opt/alacraft-backend/scripts/diagnose-startup.sh

echo "=== Application Startup Diagnostics ==="

# Check if port is in use
echo "1. Checking port 3000..."
netstat -tulpn | grep :3000

# Check application files
echo -e "\n2. Checking application files..."
ls -la /opt/alacraft-backend/dist/main.js
ls -la /opt/alacraft-backend/.env.production

# Check permissions
echo -e "\n3. Checking permissions..."
ls -la /opt/alacraft-backend/uploads/pdfs

# Check dependencies
echo -e "\n4. Checking dependencies..."
cd /opt/alacraft-backend
npm list --depth=0 | grep UNMET

# Check database connection
echo -e "\n5. Testing database connection..."
psql -U alacraft_user -d alacraft -c "SELECT 1;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "Database: Connected"
else
    echo "Database: Connection failed"
fi

# Check Puppeteer
echo -e "\n6. Testing Puppeteer..."
node -e "
const puppeteer = require('puppeteer');
puppeteer.launch({headless: true, args: ['--no-sandbox']})
  .then(() => console.log('Puppeteer: OK'))
  .catch(err => console.log('Puppeteer: ERROR -', err.message));
"

# Check recent logs
echo -e "\n7. Recent error logs..."
tail -20 /opt/alacraft-backend/logs/error.log

echo -e "\n=== Diagnostics Complete ==="
```

### 2. High Memory Usage

**Memory Diagnostic Script:**
```bash
#!/bin/bash
# /opt/alacraft-backend/scripts/diagnose-memory.sh

echo "=== Memory Usage Diagnostics ==="

# Overall system memory
echo "1. System Memory Usage:"
free -h

# Process memory usage
echo -e "\n2. Top Memory Consumers:"
ps aux --sort=-%mem | head -10

# Application memory usage
echo -e "\n3. Application Memory Usage:"
pm2 show alacraft-backend | grep -A 5 "Memory usage"

# Check for memory leaks
echo -e "\n4. Memory Leak Detection:"
node --expose-gc -e "
const used = process.memoryUsage();
console.log('Initial memory:', used);
global.gc();
const afterGC = process.memoryUsage();
console.log('After GC:', afterGC);
console.log('Potential leak:', used.heapUsed - afterGC.heapUsed, 'bytes');
"

# Check PDF file accumulation
echo -e "\n5. PDF File Accumulation:"
pdf_count=$(find /opt/alacraft-backend/uploads/pdfs -name "*.pdf" | wc -l)
pdf_size=$(du -sh /opt/alacraft-backend/uploads/pdfs | cut -f1)
echo "PDF Files: $pdf_count ($pdf_size)"

# Recommendations
echo -e "\n6. Recommendations:"
if [ $pdf_count -gt 1000 ]; then
    echo "- High PDF file count, run cleanup script"
fi

memory_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ $memory_usage -gt 80 ]; then
    echo "- Memory usage above 80%, consider restart or upgrade"
fi
```

### 3. PDF Generation Failures

**PDF Diagnostic Script:**
```bash
#!/bin/bash
# /opt/alacraft-backend/scripts/diagnose-pdf.sh

echo "=== PDF Generation Diagnostics ==="

# Check Puppeteer installation
echo "1. Puppeteer Status:"
which chromium-browser
chromium-browser --version

# Test basic PDF generation
echo -e "\n2. Testing PDF Generation:"
node -e "
const puppeteer = require('puppeteer');
(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent('<h1>Test PDF</h1>');
    const pdf = await page.pdf({ format: 'A4' });
    await browser.close();
    console.log('PDF generation: SUCCESS');
    console.log('PDF size:', pdf.length, 'bytes');
  } catch (error) {
    console.log('PDF generation: FAILED');
    console.log('Error:', error.message);
  }
})();
"

# Check system resources
echo -e "\n3. System Resources:"
echo "Available Memory:"
free -h | grep Mem
echo "Available Disk Space:"
df -h /opt/alacraft-backend

# Check recent PDF generation errors
echo -e "\n4. Recent PDF Errors:"
grep -i "pdf.*error\|pdf.*failed" /opt/alacraft-backend/logs/*.log | tail -5

# Check file permissions
echo -e "\n5. File Permissions:"
ls -la /opt/alacraft-backend/uploads/pdfs

echo -e "\n=== PDF Diagnostics Complete ==="
```

## Disaster Recovery

### 1. Complete System Recovery

**Disaster Recovery Script:**
```bash
#!/bin/bash
# /opt/alacraft-backend/scripts/disaster-recovery.sh

BACKUP_DIR="/opt/backups/alacraft"
RECOVERY_DATE="$1"

if [ -z "$RECOVERY_DATE" ]; then
    echo "Usage: $0 <backup_date>"
    echo "Available backups:"
    ls -la "$BACKUP_DIR" | grep database_
    exit 1
fi

echo "=== Starting Disaster Recovery for $RECOVERY_DATE ==="

# Stop all services
echo "1. Stopping services..."
pm2 stop all
systemctl stop nginx
systemctl stop postgresql

# Restore database
echo "2. Restoring database..."
systemctl start postgresql
sleep 5
dropdb -U alacraft_user alacraft 2>/dev/null
createdb -U alacraft_user alacraft
psql -U alacraft_user -d alacraft < "$BACKUP_DIR/database_$RECOVERY_DATE.sql"

# Restore application files
echo "3. Restoring application files..."
tar -xzf "$BACKUP_DIR/app_files_$RECOVERY_DATE.tar.gz" -C /

# Restore configuration
echo "4. Restoring configuration..."
cp "$BACKUP_DIR/env_$RECOVERY_DATE" /opt/alacraft-backend/.env.production
cp "$BACKUP_DIR/nginx_$RECOVERY_DATE.conf" /etc/nginx/sites-available/alacraft-backend

# Set proper permissions
echo "5. Setting permissions..."
chown -R app:app /opt/alacraft-backend
chmod 600 /opt/alacraft-backend/.env.production

# Restart services
echo "6. Restarting services..."
systemctl start nginx
cd /opt/alacraft-backend
npm install --production
pm2 start ecosystem.config.js --env production

# Verify recovery
echo "7. Verifying recovery..."
sleep 10
curl -f http://localhost:3000/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ Application is responding"
else
    echo "✗ Application is not responding"
fi

echo "=== Disaster Recovery Complete ==="
```

### 2. Data Recovery Procedures

**Data Recovery Script:**
```bash
#!/bin/bash
# /opt/alacraft-backend/scripts/recover-data.sh

RECOVERY_TYPE="$1"
RECOVERY_DATE="$2"

case "$RECOVERY_TYPE" in
    "database")
        echo "Recovering database from $RECOVERY_DATE..."
        psql -U alacraft_user -d alacraft < "/opt/backups/alacraft/database_$RECOVERY_DATE.sql"
        ;;
    "pdfs")
        echo "Recovering PDF files from $RECOVERY_DATE..."
        tar -xzf "/opt/backups/alacraft/pdf_files_$RECOVERY_DATE.tar.gz" -C /
        ;;
    "config")
        echo "Recovering configuration from $RECOVERY_DATE..."
        cp "/opt/backups/alacraft/env_$RECOVERY_DATE" /opt/alacraft-backend/.env.production
        cp "/opt/backups/alacraft/nginx_$RECOVERY_DATE.conf" /etc/nginx/sites-available/alacraft-backend
        ;;
    *)
        echo "Usage: $0 {database|pdfs|config} <backup_date>"
        echo "Available backups:"
        ls -la /opt/backups/alacraft/
        exit 1
        ;;
esac

echo "Data recovery completed for $RECOVERY_TYPE"
```

## Maintenance Schedule

### Automated Maintenance Schedule

```bash
# Add to root crontab: sudo crontab -e

# Daily tasks
0 2 * * * /opt/alacraft-backend/scripts/backup.sh
0 3 * * * /opt/alacraft-backend/scripts/pdf-cleanup.sh
0 8 * * * /opt/alacraft-backend/scripts/daily-health-check.sh
*/5 * * * * /opt/alacraft-backend/scripts/monitor.sh

# Weekly tasks
0 4 * * 0 /opt/alacraft-backend/scripts/weekly-performance.sh
0 5 * * 0 /opt/alacraft-backend/scripts/db-maintenance.sh
0 6 * * 0 /opt/alacraft-backend/scripts/security-updates.sh

# Monthly tasks
0 2 1 * * /opt/alacraft-backend/scripts/monthly-audit.sh
0 3 1 * * /opt/alacraft-backend/scripts/capacity-planning.sh
0 4 1 * * /opt/alacraft-backend/scripts/optimize-performance.sh

# Log rotation
0 0 * * * /usr/sbin/logrotate /etc/logrotate.d/alacraft-backend
```

This maintenance guide provides comprehensive procedures for keeping the PDF generation system running optimally, with automated monitoring, regular maintenance tasks, and disaster recovery procedures.