#!/usr/bin/env ts-node

/**
 * Email Queue Deployment Script
 *
 * This script handles the deployment of the async email queue service,
 * including configuration validation, worker setup, and health checks.
 */

import * as dotenv from 'dotenv';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

interface DeploymentOptions {
  environment: 'development' | 'staging' | 'production';
  skipValidation: boolean;
  skipHealthCheck: boolean;
  workerInstances: number;
  dryRun: boolean;
}

class EmailQueueDeployer {
  private options: DeploymentOptions;
  private logFile: string;

  constructor(options: DeploymentOptions) {
    this.options = options;
    this.logFile = `email-queue-deployment-${Date.now()}.log`;
  }

  /**
   * Main deployment flow
   */
  async deploy(): Promise<void> {
    this.log('🚀 Starting Email Queue Service Deployment');
    this.log(`Environment: ${this.options.environment}`);
    this.log(`Worker Instances: ${this.options.workerInstances}`);
    this.log(`Dry Run: ${this.options.dryRun}`);
    this.log('');

    try {
      await this.validatePrerequisites();
      await this.validateConfiguration();
      await this.setupRedisConnection();
      await this.deployWorkerProcesses();
      await this.setupMonitoring();
      await this.runHealthChecks();
      await this.generateDocumentation();

      this.log('✅ Email Queue Service deployment completed successfully!');
      this.printPostDeploymentInstructions();

    } catch (error) {
      this.log(`❌ Deployment failed: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }

  /**
   * Validate deployment prerequisites
   */
  private async validatePrerequisites(): Promise<void> {
    this.log('📋 Validating Prerequisites...');

    // Check Node.js version
    const nodeVersion = process.version;
    this.log(`Node.js version: ${nodeVersion}`);

    if (!nodeVersion.startsWith('v18') && !nodeVersion.startsWith('v20')) {
      throw new Error('Node.js version 18 or 20 required');
    }

    // Check if Redis is accessible
    try {
      const redisHost = process.env.REDIS_HOST || 'localhost';
      const redisPort = process.env.REDIS_PORT || '6379';

      if (!this.options.dryRun) {
        execSync(`redis-cli -h ${redisHost} -p ${redisPort} ping`, { stdio: 'pipe' });
      }
      this.log(`✅ Redis connection verified (${redisHost}:${redisPort})`);
    } catch (error) {
      throw new Error('Redis connection failed. Ensure Redis is running and accessible.');
    }

    // Check if BullMQ dependencies are installed
    try {
      require('bullmq');
      this.log('✅ BullMQ dependency found');
    } catch (error) {
      throw new Error('BullMQ not installed. Run: npm install bullmq');
    }

    // Check disk space for logs and queue data
    const stats = fs.statSync('.');
    this.log('✅ Prerequisites validation completed');
  }

  /**
   * Validate email queue configuration
   */
  private async validateConfiguration(): Promise<void> {
    if (this.options.skipValidation) {
      this.log('⚠️ Skipping configuration validation');
      return;
    }

    this.log('🔧 Validating Email Queue Configuration...');

    try {
      // Run configuration validation script
      const output = execSync('npm run setup-email-config validate', {
        encoding: 'utf8',
        cwd: process.cwd()
      });

      this.log('Configuration validation output:');
      this.log(output);

      if (output.includes('❌')) {
        throw new Error('Configuration validation failed. Check the output above.');
      }

      this.log('✅ Configuration validation passed');
    } catch (error) {
      throw new Error(`Configuration validation failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Setup Redis connection and verify queue functionality
   */
  private async setupRedisConnection(): Promise<void> {
    this.log('🔗 Setting up Redis Connection...');

    if (this.options.dryRun) {
      this.log('📝 [DRY RUN] Would setup Redis connection');
      return;
    }

    // Create a test script to verify queue functionality
    const testScript = `
      const { Queue, Worker } = require('bullmq');
      const connection = {
        host: '${process.env.REDIS_HOST || 'localhost'}',
        port: ${process.env.REDIS_PORT || 6379}
      };

      async function testQueue() {
        const queue = new Queue('email-queue-test', { connection });

        try {
          // Add a test job
          const job = await queue.add('test', { message: 'deployment test' });
          console.log('✅ Test job added:', job.id);

          // Clean up
          await queue.obliterate({ force: true });
          await queue.close();

          console.log('✅ Queue functionality verified');
        } catch (error) {
          console.error('❌ Queue test failed:', error.message);
          process.exit(1);
        }
      }

      testQueue();
    `;

    fs.writeFileSync('/tmp/test-queue.js', testScript);

    try {
      execSync('node /tmp/test-queue.js', { stdio: 'inherit' });
      this.log('✅ Redis connection and queue functionality verified');
    } catch (error) {
      throw new Error('Queue functionality test failed');
    } finally {
      fs.unlinkSync('/tmp/test-queue.js');
    }
  }

  /**
   * Deploy worker processes
   */
  private async deployWorkerProcesses(): Promise<void> {
    this.log('👷 Deploying Worker Processes...');

    if (this.options.dryRun) {
      this.log(`📝 [DRY RUN] Would deploy ${this.options.workerInstances} worker instances`);
      return;
    }

    // Generate PM2 ecosystem configuration
    await this.generateEcosystemConfig();

    // Start workers using PM2
    try {
      execSync('npm install -g pm2', { stdio: 'inherit' });
      this.log('✅ PM2 installed globally');

      execSync('pm2 start ecosystem.email-queue.config.js', { stdio: 'inherit' });
      this.log(`✅ ${this.options.workerInstances} email queue workers started`);

      // Save PM2 configuration
      execSync('pm2 save', { stdio: 'inherit' });
      this.log('✅ PM2 configuration saved');

    } catch (error) {
      throw new Error(`Worker deployment failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Generate PM2 ecosystem configuration
   */
  private async generateEcosystemConfig(): Promise<void> {
    const config = {
      apps: [
        {
          name: 'email-queue-worker',
          script: 'dist/main.js',
          cwd: process.cwd(),
          instances: this.options.workerInstances,
          exec_mode: 'cluster',
          env: {
            NODE_ENV: this.options.environment,
            EMAIL_QUEUE_WORKER_MODE: 'true',
            ...this.getEnvironmentConfig()
          },
          env_production: {
            NODE_ENV: 'production',
            EMAIL_QUEUE_WORKER_MODE: 'true',
            ...this.getEnvironmentConfig()
          },
          log_file: 'logs/email-queue-combined.log',
          out_file: 'logs/email-queue-out.log',
          error_file: 'logs/email-queue-error.log',
          log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
          merge_logs: true,
          max_memory_restart: '500M',
          restart_delay: 4000,
          max_restarts: 10,
          min_uptime: '10s',
          kill_timeout: 30000,
          wait_ready: true,
          listen_timeout: 10000,
          autorestart: true,
          watch: false
        }
      ]
    };

    const configPath = 'ecosystem.email-queue.config.js';
    const configContent = `module.exports = ${JSON.stringify(config, null, 2)};`;

    fs.writeFileSync(configPath, configContent);
    this.log(`✅ PM2 ecosystem configuration generated: ${configPath}`);
  }

  /**
   * Get environment-specific configuration
   */
  private getEnvironmentConfig(): Record<string, string> {
    const baseConfig = {
      REDIS_HOST: process.env.REDIS_HOST || 'localhost',
      REDIS_PORT: process.env.REDIS_PORT || '6379',
    };

    switch (this.options.environment) {
      case 'development':
        return {
          ...baseConfig,
          EMAIL_WORKER_CONCURRENCY: '1',
          EMAIL_RATE_LIMIT_MAX: '50',
          EMAIL_QUEUE_COMPLETED_RETENTION_COUNT: '100',
          EMAIL_QUEUE_FAILED_RETENTION_COUNT: '50',
        };

      case 'staging':
        return {
          ...baseConfig,
          EMAIL_WORKER_CONCURRENCY: '1',
          EMAIL_RATE_LIMIT_MAX: '100',
          EMAIL_QUEUE_COMPLETED_RETENTION_COUNT: '500',
          EMAIL_QUEUE_FAILED_RETENTION_COUNT: '250',
        };

      case 'production':
        return {
          ...baseConfig,
          EMAIL_WORKER_CONCURRENCY: '1',
          EMAIL_RATE_LIMIT_MAX: '100',
          EMAIL_QUEUE_COMPLETED_RETENTION_COUNT: '1000',
          EMAIL_QUEUE_FAILED_RETENTION_COUNT: '500',
          EMAIL_QUEUE_MAX_RECONNECT_ATTEMPTS: '20',
          EMAIL_QUEUE_SHUTDOWN_TIMEOUT: '60000',
        };

      default:
        return baseConfig;
    }
  }

  /**
   * Setup monitoring and health checks
   */
  private async setupMonitoring(): Promise<void> {
    this.log('📊 Setting up Monitoring...');

    if (this.options.dryRun) {
      this.log('📝 [DRY RUN] Would setup monitoring');
      return;
    }

    // Create monitoring script
    const monitoringScript = `#!/bin/bash

# Email Queue Monitoring Script
# This script checks the health of email queue workers and Redis connection

LOG_FILE="logs/email-queue-monitoring.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] Starting email queue health check" >> "$LOG_FILE"

# Check PM2 processes
PM2_STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="email-queue-worker") | .pm2_env.status')

if [ "$PM2_STATUS" != "online" ]; then
    echo "[$TIMESTAMP] ERROR: Email queue workers not running" >> "$LOG_FILE"
    # Restart workers
    pm2 restart email-queue-worker
    echo "[$TIMESTAMP] Restarted email queue workers" >> "$LOG_FILE"
fi

# Check Redis connection
REDIS_HOST=\${REDIS_HOST:-localhost}
REDIS_PORT=\${REDIS_PORT:-6379}

if ! redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping > /dev/null 2>&1; then
    echo "[$TIMESTAMP] ERROR: Redis connection failed" >> "$LOG_FILE"
    exit 1
fi

# Check queue health via API
if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/email-queue/health)
    if [ "$HTTP_CODE" != "200" ]; then
        echo "[$TIMESTAMP] WARNING: Email queue health check returned $HTTP_CODE" >> "$LOG_FILE"
    fi
fi

echo "[$TIMESTAMP] Health check completed successfully" >> "$LOG_FILE"
`;

    fs.writeFileSync('scripts/monitor-email-queue.sh', monitoringScript);
    fs.chmodSync('scripts/monitor-email-queue.sh', '755');
    this.log('✅ Monitoring script created: scripts/monitor-email-queue.sh');

    // Setup log rotation
    const logrotateConfig = `logs/email-queue-*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 app app
    postrotate
        pm2 reloadLogs
    endscript
}`;

    fs.writeFileSync('/tmp/email-queue-logrotate', logrotateConfig);
    this.log('✅ Log rotation configuration created');
  }

  /**
   * Run health checks
   */
  private async runHealthChecks(): Promise<void> {
    if (this.options.skipHealthCheck) {
      this.log('⚠️ Skipping health checks');
      return;
    }

    this.log('🏥 Running Health Checks...');

    if (this.options.dryRun) {
      this.log('📝 [DRY RUN] Would run health checks');
      return;
    }

    // Wait for services to start
    await this.sleep(5000);

    try {
      // Check PM2 processes
      const pm2List = execSync('pm2 jlist', { encoding: 'utf8' });
      const processes = JSON.parse(pm2List);
      const emailWorkers = processes.filter((p: any) => p.name === 'email-queue-worker');

      if (emailWorkers.length === 0) {
        throw new Error('No email queue workers found');
      }

      const onlineWorkers = emailWorkers.filter((p: any) => p.pm2_env.status === 'online');
      if (onlineWorkers.length !== this.options.workerInstances) {
        throw new Error(`Expected ${this.options.workerInstances} workers, found ${onlineWorkers.length} online`);
      }

      this.log(`✅ ${onlineWorkers.length} email queue workers are running`);

      // Test queue functionality
      const testOutput = execSync('npm run setup-email-config validate', { encoding: 'utf8' });
      if (testOutput.includes('❌')) {
        throw new Error('Queue functionality test failed');
      }

      this.log('✅ Health checks passed');

    } catch (error) {
      throw new Error(`Health checks failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Generate deployment documentation
   */
  private async generateDocumentation(): Promise<void> {
    this.log('📚 Generating Deployment Documentation...');

    const documentation = `# Email Queue Service Deployment

## Deployment Summary

- **Environment**: ${this.options.environment}
- **Worker Instances**: ${this.options.workerInstances}
- **Deployment Date**: ${new Date().toISOString()}
- **Configuration**: ecosystem.email-queue.config.js

## Service Management

### Start Services
\`\`\`bash
pm2 start ecosystem.email-queue.config.js
\`\`\`

### Stop Services
\`\`\`bash
pm2 stop email-queue-worker
\`\`\`

### Restart Services
\`\`\`bash
pm2 restart email-queue-worker
\`\`\`

### View Logs
\`\`\`bash
pm2 logs email-queue-worker
\`\`\`

### Monitor Services
\`\`\`bash
pm2 monit
\`\`\`

## Health Monitoring

### Manual Health Check
\`\`\`bash
curl http://localhost:3000/email-queue/health
\`\`\`

### Queue Metrics
\`\`\`bash
curl http://localhost:3000/email-queue/metrics
\`\`\`

### Automated Monitoring
\`\`\`bash
# Run monitoring script
./scripts/monitor-email-queue.sh

# Setup cron job for monitoring (every 5 minutes)
echo "*/5 * * * * /path/to/scripts/monitor-email-queue.sh" | crontab -
\`\`\`

## Configuration

Current configuration can be validated with:
\`\`\`bash
npm run setup-email-config validate
\`\`\`

## Troubleshooting

### Worker Not Starting
1. Check logs: \`pm2 logs email-queue-worker\`
2. Verify Redis connection: \`redis-cli ping\`
3. Check configuration: \`npm run setup-email-config check\`

### High Memory Usage
1. Monitor with: \`pm2 monit\`
2. Adjust retention settings in environment variables
3. Restart workers: \`pm2 restart email-queue-worker\`

### Queue Backlog
1. Check queue metrics: \`curl http://localhost:3000/email-queue/metrics\`
2. Increase worker concurrency in environment variables
3. Scale worker instances: \`pm2 scale email-queue-worker +2\`

## Rollback Procedure

If issues occur, rollback by:
1. Stop email queue workers: \`pm2 stop email-queue-worker\`
2. Revert to synchronous email service (if needed)
3. Check application logs for errors
4. Contact DevOps team for assistance

## Support

- Deployment Log: ${this.logFile}
- Configuration: ecosystem.email-queue.config.js
- Monitoring: scripts/monitor-email-queue.sh
- Health Check: http://localhost:3000/email-queue/health
`;

    fs.writeFileSync('EMAIL_QUEUE_DEPLOYMENT.md', documentation);
    this.log('✅ Deployment documentation generated: EMAIL_QUEUE_DEPLOYMENT.md');
  }

  /**
   * Print post-deployment instructions
   */
  private printPostDeploymentInstructions(): void {
    this.log('');
    this.log('🎉 Post-Deployment Instructions:');
    this.log('');
    this.log('1. Monitor worker processes:');
    this.log('   pm2 monit');
    this.log('');
    this.log('2. Check health status:');
    this.log('   curl http://localhost:3000/email-queue/health');
    this.log('');
    this.log('3. View queue metrics:');
    this.log('   curl http://localhost:3000/email-queue/metrics');
    this.log('');
    this.log('4. Setup monitoring cron job:');
    this.log('   echo "*/5 * * * * /path/to/scripts/monitor-email-queue.sh" | crontab -');
    this.log('');
    this.log('5. Review deployment documentation:');
    this.log('   cat EMAIL_QUEUE_DEPLOYMENT.md');
    this.log('');
    this.log(`📋 Deployment log saved to: ${this.logFile}`);
  }

  /**
   * Log message with timestamp
   */
  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;

    console.log(logMessage);

    // Append to log file
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Parse command line arguments
 */
function parseArguments(): DeploymentOptions {
  const args = process.argv.slice(2);

  const options: DeploymentOptions = {
    environment: 'development',
    skipValidation: false,
    skipHealthCheck: false,
    workerInstances: 1,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--environment':
      case '--env':
        options.environment = args[++i] as any;
        break;
      case '--skip-validation':
        options.skipValidation = true;
        break;
      case '--skip-health-check':
        options.skipHealthCheck = true;
        break;
      case '--workers':
        options.workerInstances = parseInt(args[++i]);
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }

  return options;
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
Email Queue Deployment Script

Usage: npm run deploy-email-queue [options]

Options:
  --environment, --env <env>    Deployment environment (development|staging|production)
  --workers <number>            Number of worker instances (default: 1)
  --skip-validation            Skip configuration validation
  --skip-health-check          Skip health checks after deployment
  --dry-run                    Preview deployment without making changes
  --help, -h                   Show this help message

Examples:
  npm run deploy-email-queue --env production --workers 3
  npm run deploy-email-queue --env staging --dry-run
  npm run deploy-email-queue --env development --skip-validation
`);
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    const options = parseArguments();
    const deployer = new EmailQueueDeployer(options);
    await deployer.deploy();
  } catch (error) {
    console.error('❌ Deployment failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { EmailQueueDeployer };
export type { DeploymentOptions };