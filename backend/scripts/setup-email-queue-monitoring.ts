#!/usr/bin/env ts-node

/**
 * Email Queue Monitoring Setup Script
 *
 * This script sets up monitoring infrastructure for the email queue service,
 * including cron jobs, log rotation, and alerting configuration.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface MonitoringConfig {
  environment: 'development' | 'staging' | 'production';
  cronInterval: string;
  logRetentionDays: number;
  alertWebhookUrl?: string;
  enableSlackAlerts: boolean;
  enableEmailAlerts: boolean;
  alertEmail?: string;
}

class EmailQueueMonitoringSetup {
  private config: MonitoringConfig;
  private scriptDir: string;
  private logDir: string;

  constructor(config: MonitoringConfig) {
    this.config = config;
    this.scriptDir = path.resolve(__dirname);
    this.logDir = path.join(this.scriptDir, '..', 'logs');
  }

  /**
   * Main setup flow
   */
  async setup(): Promise<void> {
    console.log('🔧 Setting up Email Queue Monitoring...');
    console.log(`Environment: ${this.config.environment}`);
    console.log(`Cron Interval: ${this.config.cronInterval}`);
    console.log('');

    try {
      await this.createDirectories();
      await this.setupLogRotation();
      await this.setupCronJob();
      await this.setupAlerting();
      await this.createDashboard();
      await this.generateDocumentation();

      console.log('✅ Email Queue Monitoring setup completed successfully!');
      this.printSetupSummary();

    } catch (error) {
      console.error(`❌ Setup failed: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }

  /**
   * Create necessary directories
   */
  private async createDirectories(): Promise<void> {
    console.log('📁 Creating directories...');

    const directories = [
      this.logDir,
      path.join(this.logDir, 'archive'),
      path.join(this.scriptDir, 'monitoring'),
    ];

    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      }
    }
  }

  /**
   * Setup log rotation
   */
  private async setupLogRotation(): Promise<void> {
    console.log('🔄 Setting up log rotation...');

    const logrotateConfig = `# Email Queue Log Rotation Configuration
${this.logDir}/email-queue-*.log {
    daily
    missingok
    rotate ${this.config.logRetentionDays}
    compress
    delaycompress
    notifempty
    create 644 $(whoami) $(whoami)
    copytruncate
    postrotate
        # Archive old logs
        find ${this.logDir} -name "*.log.*.gz" -mtime +${this.config.logRetentionDays} -delete
        # Reload PM2 logs if available
        if command -v pm2 &> /dev/null; then
            pm2 reloadLogs 2>/dev/null || true
        fi
    endscript
}`;

    const logrotateFile = '/tmp/email-queue-logrotate';
    fs.writeFileSync(logrotateFile, logrotateConfig);

    console.log(`✅ Log rotation configuration created: ${logrotateFile}`);
    console.log('   To install: sudo cp /tmp/email-queue-logrotate /etc/logrotate.d/email-queue');
  }

  /**
   * Setup cron job for monitoring
   */
  private async setupCronJob(): Promise<void> {
    console.log('⏰ Setting up cron job...');

    const monitoringScript = path.join(this.scriptDir, 'monitor-email-queue.sh');
    const cronEntry = `${this.config.cronInterval} ${monitoringScript} --quiet`;

    // Create cron configuration
    const cronConfig = `# Email Queue Monitoring Cron Job
# Runs monitoring checks at regular intervals
${cronEntry}

# Log cleanup (daily at 2 AM)
0 2 * * * find ${this.logDir} -name "*.log" -size +50M -exec truncate -s 10M {} \\;

# Weekly health report (Sundays at 9 AM)
0 9 * * 0 ${this.scriptDir}/generate-weekly-report.sh
`;

    const cronFile = '/tmp/email-queue-cron';
    fs.writeFileSync(cronFile, cronConfig);

    console.log(`✅ Cron configuration created: ${cronFile}`);
    console.log('   To install: crontab /tmp/email-queue-cron');
    console.log(`   Or add manually: ${cronEntry}`);
  }

  /**
   * Setup alerting configuration
   */
  private async setupAlerting(): Promise<void> {
    console.log('🚨 Setting up alerting...');

    // Create alerting configuration file
    const alertConfig = {
      environment: this.config.environment,
      webhookUrl: this.config.alertWebhookUrl,
      slackEnabled: this.config.enableSlackAlerts,
      emailEnabled: this.config.enableEmailAlerts,
      alertEmail: this.config.alertEmail,
      thresholds: this.getAlertThresholds(),
    };

    const alertConfigFile = path.join(this.scriptDir, 'monitoring', 'alert-config.json');
    fs.writeFileSync(alertConfigFile, JSON.stringify(alertConfig, null, 2));

    // Create alert script
    const alertScript = this.generateAlertScript();
    const alertScriptFile = path.join(this.scriptDir, 'monitoring', 'send-alert.sh');
    fs.writeFileSync(alertScriptFile, alertScript);
    fs.chmodSync(alertScriptFile, '755');

    console.log(`✅ Alert configuration created: ${alertConfigFile}`);
    console.log(`✅ Alert script created: ${alertScriptFile}`);
  }

  /**
   * Get environment-specific alert thresholds
   */
  private getAlertThresholds(): Record<string, number> {
    switch (this.config.environment) {
      case 'development':
        return {
          queueDepth: 500,
          errorRate: 10,
          processingTime: 600,
          diskUsage: 85,
          memoryUsage: 85,
        };

      case 'staging':
        return {
          queueDepth: 750,
          errorRate: 7,
          processingTime: 450,
          diskUsage: 80,
          memoryUsage: 80,
        };

      case 'production':
        return {
          queueDepth: 1000,
          errorRate: 5,
          processingTime: 300,
          diskUsage: 75,
          memoryUsage: 75,
        };

      default:
        return {
          queueDepth: 1000,
          errorRate: 5,
          processingTime: 300,
          diskUsage: 80,
          memoryUsage: 80,
        };
    }
  }

  /**
   * Generate alert script
   */
  private generateAlertScript(): string {
    return `#!/bin/bash

# Email Queue Alert Script
# Sends alerts via various channels based on configuration

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="\$SCRIPT_DIR/alert-config.json"

# Read configuration
if [ ! -f "\$CONFIG_FILE" ]; then
    echo "Alert configuration not found: \$CONFIG_FILE"
    exit 1
fi

WEBHOOK_URL=\$(jq -r '.webhookUrl // empty' "\$CONFIG_FILE")
SLACK_ENABLED=\$(jq -r '.slackEnabled' "\$CONFIG_FILE")
EMAIL_ENABLED=\$(jq -r '.emailEnabled' "\$CONFIG_FILE")
ALERT_EMAIL=\$(jq -r '.alertEmail // empty' "\$CONFIG_FILE")
ENVIRONMENT=\$(jq -r '.environment' "\$CONFIG_FILE")

# Alert message
MESSAGE="\$1"
SEVERITY="\${2:-WARNING}"
TIMESTAMP=\$(date '+%Y-%m-%d %H:%M:%S')

if [ -z "\$MESSAGE" ]; then
    echo "Usage: \$0 <message> [severity]"
    exit 1
fi

# Format alert message
ALERT_MESSAGE="[\$ENVIRONMENT] [\$SEVERITY] \$MESSAGE (at \$TIMESTAMP)"

echo "Sending alert: \$ALERT_MESSAGE"

# Send to webhook (Slack, Discord, etc.)
if [ "\$SLACK_ENABLED" = "true" ] && [ -n "\$WEBHOOK_URL" ]; then
    curl -X POST -H "Content-Type: application/json" \\
         -d "{\\"text\\": \\"\$ALERT_MESSAGE\\"}" \\
         "\$WEBHOOK_URL" 2>/dev/null || echo "Failed to send webhook alert"
fi

# Send email alert
if [ "\$EMAIL_ENABLED" = "true" ] && [ -n "\$ALERT_EMAIL" ]; then
    if command -v mail &> /dev/null; then
        echo "\$ALERT_MESSAGE" | mail -s "Email Queue Alert - \$ENVIRONMENT" "\$ALERT_EMAIL" || echo "Failed to send email alert"
    else
        echo "mail command not available for email alerts"
    fi
fi

# Log alert
echo "[\$TIMESTAMP] \$ALERT_MESSAGE" >> "\$SCRIPT_DIR/../logs/email-queue-alerts.log"
`;
  }

  /**
   * Create monitoring dashboard
   */
  private async createDashboard(): Promise<void> {
    console.log('📊 Creating monitoring dashboard...');

    const dashboardScript = `#!/bin/bash

# Email Queue Monitoring Dashboard
# Displays real-time status and metrics

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="\$SCRIPT_DIR/../logs"

# Colors
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
NC='\\033[0m'

clear
echo -e "\${BLUE}=== Email Queue Monitoring Dashboard ===\${NC}"
echo "Last updated: \$(date)"
echo ""

# PM2 Status
echo -e "\${BLUE}PM2 Processes:\${NC}"
if command -v pm2 &> /dev/null; then
    pm2 list | grep email-queue-worker || echo "No email queue workers found"
else
    echo "PM2 not available"
fi
echo ""

# Queue Metrics
echo -e "\${BLUE}Queue Metrics:\${NC}"
if command -v curl &> /dev/null; then
    METRICS=\$(curl -s http://localhost:3000/email-queue/metrics 2>/dev/null)
    if [ \$? -eq 0 ]; then
        echo "Waiting Jobs: \$(echo "\$METRICS" | jq -r '.waiting // "N/A"')"
        echo "Active Jobs: \$(echo "\$METRICS" | jq -r '.active // "N/A"')"
        echo "Completed Jobs: \$(echo "\$METRICS" | jq -r '.completed // "N/A"')"
        echo "Failed Jobs: \$(echo "\$METRICS" | jq -r '.failed // "N/A"')"
    else
        echo "Unable to fetch queue metrics"
    fi
else
    echo "curl not available"
fi
echo ""

# Recent Alerts
echo -e "\${BLUE}Recent Alerts (last 5):\${NC}"
if [ -f "\$LOG_DIR/email-queue-alerts.log" ]; then
    tail -n 5 "\$LOG_DIR/email-queue-alerts.log" || echo "No recent alerts"
else
    echo "No alert log found"
fi
echo ""

# System Resources
echo -e "\${BLUE}System Resources:\${NC}"
echo "Disk Usage: \$(df -h . | awk 'NR==2 {print \$5}')"
if command -v free &> /dev/null; then
    echo "Memory Usage: \$(free | awk 'NR==2{printf "%.0f%%", \$3*100/\$2}')"
fi
echo "Load Average: \$(uptime | awk -F'load average:' '{print \$2}')"
echo ""

# Log Files
echo -e "\${BLUE}Log Files:\${NC}"
for log_file in "\$LOG_DIR"/email-queue-*.log; do
    if [ -f "\$log_file" ]; then
        SIZE=\$(ls -lh "\$log_file" | awk '{print \$5}')
        echo "  \$(basename "\$log_file"): \$SIZE"
    fi
done
echo ""

echo "Press Ctrl+C to exit, or run with --watch for continuous updates"

# Watch mode
if [ "\$1" = "--watch" ]; then
    while true; do
        sleep 30
        exec "\$0"
    done
fi
`;

    const dashboardFile = path.join(this.scriptDir, 'monitoring', 'dashboard.sh');
    fs.writeFileSync(dashboardFile, dashboardScript);
    fs.chmodSync(dashboardFile, '755');

    console.log(`✅ Monitoring dashboard created: ${dashboardFile}`);
  }

  /**
   * Generate weekly report script
   */
  private async createWeeklyReportScript(): Promise<void> {
    const reportScript = `#!/bin/bash

# Weekly Email Queue Report Generator

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="\$SCRIPT_DIR/../logs"
REPORT_FILE="\$LOG_DIR/weekly-report-\$(date +%Y%m%d).txt"

echo "Email Queue Weekly Report" > "\$REPORT_FILE"
echo "Generated: \$(date)" >> "\$REPORT_FILE"
echo "==============================" >> "\$REPORT_FILE"
echo "" >> "\$REPORT_FILE"

# Analyze metrics from the past week
if [ -f "\$LOG_DIR/email-queue-metrics.log" ]; then
    echo "Metrics Summary (Last 7 Days):" >> "\$REPORT_FILE"

    # Get metrics from last 7 days
    WEEK_AGO=\$(date -d '7 days ago' '+%Y-%m-%d' 2>/dev/null || date -v-7d '+%Y-%m-%d' 2>/dev/null)

    if [ -n "\$WEEK_AGO" ]; then
        grep "\$WEEK_AGO" "\$LOG_DIR/email-queue-metrics.log" | tail -n 100 >> "\$REPORT_FILE"
    fi
fi

# Alert summary
if [ -f "\$LOG_DIR/email-queue-alerts.log" ]; then
    echo "" >> "\$REPORT_FILE"
    echo "Alert Summary (Last 7 Days):" >> "\$REPORT_FILE"

    WEEK_AGO=\$(date -d '7 days ago' '+%Y-%m-%d' 2>/dev/null || date -v-7d '+%Y-%m-%d' 2>/dev/null)

    if [ -n "\$WEEK_AGO" ]; then
        ALERT_COUNT=\$(grep "\$WEEK_AGO" "\$LOG_DIR/email-queue-alerts.log" | wc -l)
        echo "Total Alerts: \$ALERT_COUNT" >> "\$REPORT_FILE"

        if [ "\$ALERT_COUNT" -gt 0 ]; then
            echo "Recent Alerts:" >> "\$REPORT_FILE"
            grep "\$WEEK_AGO" "\$LOG_DIR/email-queue-alerts.log" | tail -n 10 >> "\$REPORT_FILE"
        fi
    fi
fi

echo "" >> "\$REPORT_FILE"
echo "Report saved to: \$REPORT_FILE"

# Send report via email if configured
CONFIG_FILE="\$SCRIPT_DIR/monitoring/alert-config.json"
if [ -f "\$CONFIG_FILE" ]; then
    EMAIL_ENABLED=\$(jq -r '.emailEnabled' "\$CONFIG_FILE")
    ALERT_EMAIL=\$(jq -r '.alertEmail // empty' "\$CONFIG_FILE")

    if [ "\$EMAIL_ENABLED" = "true" ] && [ -n "\$ALERT_EMAIL" ]; then
        if command -v mail &> /dev/null; then
            cat "\$REPORT_FILE" | mail -s "Email Queue Weekly Report" "\$ALERT_EMAIL"
            echo "Report sent to: \$ALERT_EMAIL"
        fi
    fi
fi
`;

    const reportScriptFile = path.join(this.scriptDir, 'generate-weekly-report.sh');
    fs.writeFileSync(reportScriptFile, reportScript);
    fs.chmodSync(reportScriptFile, '755');

    console.log(`✅ Weekly report script created: ${reportScriptFile}`);
  }

  /**
   * Generate setup documentation
   */
  private async generateDocumentation(): Promise<void> {
    console.log('📚 Generating documentation...');

    await this.createWeeklyReportScript();

    const documentation = `# Email Queue Monitoring Setup

## Overview

This monitoring setup provides comprehensive monitoring for the email queue service including:
- Automated health checks via cron jobs
- Log rotation and retention
- Alert notifications
- Performance metrics collection
- Weekly reporting

## Configuration

- **Environment**: ${this.config.environment}
- **Cron Interval**: ${this.config.cronInterval}
- **Log Retention**: ${this.config.logRetentionDays} days
- **Slack Alerts**: ${this.config.enableSlackAlerts ? 'Enabled' : 'Disabled'}
- **Email Alerts**: ${this.config.enableEmailAlerts ? 'Enabled' : 'Disabled'}

## Files Created

### Scripts
- \`monitor-email-queue.sh\` - Main monitoring script
- \`monitoring/dashboard.sh\` - Real-time dashboard
- \`monitoring/send-alert.sh\` - Alert notification script
- \`generate-weekly-report.sh\` - Weekly report generator

### Configuration
- \`monitoring/alert-config.json\` - Alert configuration
- \`/tmp/email-queue-logrotate\` - Log rotation configuration
- \`/tmp/email-queue-cron\` - Cron job configuration

### Log Files
- \`logs/email-queue-monitoring.log\` - Main monitoring log
- \`logs/email-queue-alerts.log\` - Alert log
- \`logs/email-queue-metrics.log\` - Metrics log

## Installation Steps

### 1. Install Cron Job
\`\`\`bash
# Install the cron configuration
crontab /tmp/email-queue-cron

# Or add manually to crontab
crontab -e
# Add: ${this.config.cronInterval} ${path.join(this.scriptDir, 'monitor-email-queue.sh')} --quiet
\`\`\`

### 2. Install Log Rotation
\`\`\`bash
# Install logrotate configuration (requires sudo)
sudo cp /tmp/email-queue-logrotate /etc/logrotate.d/email-queue

# Test log rotation
sudo logrotate -d /etc/logrotate.d/email-queue
\`\`\`

### 3. Configure Alerts
Edit \`monitoring/alert-config.json\` to configure:
- Webhook URLs for Slack/Discord
- Email addresses for alerts
- Alert thresholds

### 4. Test Monitoring
\`\`\`bash
# Run monitoring check manually
./monitor-email-queue.sh

# View dashboard
./monitoring/dashboard.sh

# Test alerts
./monitoring/send-alert.sh "Test alert message" "INFO"
\`\`\`

## Usage

### Manual Monitoring
\`\`\`bash
# Run health check
./monitor-email-queue.sh

# View real-time dashboard
./monitoring/dashboard.sh --watch

# Check configuration
./monitor-email-queue.sh --config
\`\`\`

### Log Analysis
\`\`\`bash
# View recent alerts
tail -f logs/email-queue-alerts.log

# View metrics
tail -f logs/email-queue-metrics.log

# View monitoring log
tail -f logs/email-queue-monitoring.log
\`\`\`

### Weekly Reports
\`\`\`bash
# Generate weekly report manually
./generate-weekly-report.sh

# View latest report
ls -la logs/weekly-report-*.txt
\`\`\`

## Alert Thresholds

Current thresholds for ${this.config.environment}:
${JSON.stringify(this.getAlertThresholds(), null, 2)}

## Troubleshooting

### Cron Job Not Running
1. Check cron service: \`sudo service cron status\`
2. Check cron logs: \`sudo tail -f /var/log/cron\`
3. Verify script permissions: \`ls -la monitor-email-queue.sh\`

### Alerts Not Sending
1. Check alert configuration: \`cat monitoring/alert-config.json\`
2. Test webhook URL manually
3. Verify email configuration

### High Resource Usage
1. Adjust log retention: Edit alert thresholds
2. Reduce monitoring frequency: Modify cron interval
3. Archive old logs: Run cleanup manually

## Maintenance

### Daily
- Automated via cron jobs
- Log rotation
- Health checks

### Weekly
- Review weekly reports
- Check alert patterns
- Update thresholds if needed

### Monthly
- Archive old logs
- Review monitoring configuration
- Update alert contacts

## Support

For issues with monitoring setup:
1. Check script logs in \`logs/\` directory
2. Verify all dependencies are installed
3. Test individual components manually
4. Review configuration files

## Dependencies

Required tools:
- \`pm2\` - Process management
- \`redis-cli\` - Redis connectivity checks
- \`curl\` - API health checks
- \`jq\` - JSON parsing
- \`bc\` - Mathematical calculations
- \`mail\` - Email notifications (optional)
`;

    fs.writeFileSync('EMAIL_QUEUE_MONITORING_SETUP.md', documentation);
    console.log('✅ Documentation generated: EMAIL_QUEUE_MONITORING_SETUP.md');
  }

  /**
   * Print setup summary
   */
  private printSetupSummary(): void {
    console.log('');
    console.log('🎉 Monitoring Setup Complete!');
    console.log('');
    console.log('Next Steps:');
    console.log('1. Install cron job:');
    console.log('   crontab /tmp/email-queue-cron');
    console.log('');
    console.log('2. Install log rotation (requires sudo):');
    console.log('   sudo cp /tmp/email-queue-logrotate /etc/logrotate.d/email-queue');
    console.log('');
    console.log('3. Configure alerts:');
    console.log('   Edit monitoring/alert-config.json');
    console.log('');
    console.log('4. Test monitoring:');
    console.log('   ./monitor-email-queue.sh');
    console.log('');
    console.log('5. View dashboard:');
    console.log('   ./monitoring/dashboard.sh');
    console.log('');
    console.log('📋 Documentation: EMAIL_QUEUE_MONITORING_SETUP.md');
  }
}

/**
 * Parse command line arguments
 */
function parseArguments(): MonitoringConfig {
  const args = process.argv.slice(2);

  const config: MonitoringConfig = {
    environment: 'development',
    cronInterval: '*/5 * * * *', // Every 5 minutes
    logRetentionDays: 30,
    enableSlackAlerts: false,
    enableEmailAlerts: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--environment':
      case '--env':
        config.environment = args[++i] as any;
        break;
      case '--cron-interval':
        config.cronInterval = args[++i];
        break;
      case '--log-retention':
        config.logRetentionDays = parseInt(args[++i]);
        break;
      case '--webhook-url':
        config.alertWebhookUrl = args[++i];
        config.enableSlackAlerts = true;
        break;
      case '--alert-email':
        config.alertEmail = args[++i];
        config.enableEmailAlerts = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }

  return config;
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
Email Queue Monitoring Setup Script

Usage: npm run setup-email-queue-monitoring [options]

Options:
  --environment, --env <env>     Environment (development|staging|production)
  --cron-interval <interval>     Cron interval (default: "*/5 * * * *")
  --log-retention <days>         Log retention in days (default: 30)
  --webhook-url <url>            Webhook URL for Slack/Discord alerts
  --alert-email <email>          Email address for alerts
  --help, -h                     Show this help message

Examples:
  npm run setup-email-queue-monitoring --env production --webhook-url https://hooks.slack.com/...
  npm run setup-email-queue-monitoring --env staging --alert-email admin@example.com
  npm run setup-email-queue-monitoring --env development --cron-interval "*/10 * * * *"
`);
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    const config = parseArguments();
    const setup = new EmailQueueMonitoringSetup(config);
    await setup.setup();
  } catch (error) {
    console.error('❌ Setup failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { EmailQueueMonitoringSetup };
export type { MonitoringConfig };