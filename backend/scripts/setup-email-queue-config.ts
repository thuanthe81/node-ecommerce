#!/usr/bin/env ts-node

/**
 * Email Queue Configuration Setup Script
 *
 * This script helps set up and validate email queue configuration.
 * It can be used during deployment or for troubleshooting configuration issues.
 */

import * as dotenv from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { EmailQueueConfigService } from '../src/email-queue/services/email-queue-config.service';

// Load environment variables from .env file
dotenv.config();

interface ConfigRecommendation {
  environment: string;
  description: string;
  config: Record<string, string>;
}

const CONFIG_RECOMMENDATIONS: ConfigRecommendation[] = [
  {
    environment: 'development',
    description: 'Development environment - optimized for local development with lower resource usage',
    config: {
      EMAIL_WORKER_CONCURRENCY: '1',
      EMAIL_RATE_LIMIT_MAX: '50',
      EMAIL_RATE_LIMIT_DURATION: '60000',
      EMAIL_QUEUE_COMPLETED_RETENTION_AGE: '3600000',  // 1 hour
      EMAIL_QUEUE_COMPLETED_RETENTION_COUNT: '100',
      EMAIL_QUEUE_FAILED_RETENTION_AGE: '86400000',    // 24 hours
      EMAIL_QUEUE_FAILED_RETENTION_COUNT: '50',
      EMAIL_QUEUE_MAX_ATTEMPTS: '3',
      EMAIL_QUEUE_SHUTDOWN_TIMEOUT: '15000',           // 15 seconds
    }
  },
  {
    environment: 'staging',
    description: 'Staging environment - production-like settings with moderate resource usage',
    config: {
      EMAIL_WORKER_CONCURRENCY: '1',
      EMAIL_RATE_LIMIT_MAX: '100',
      EMAIL_RATE_LIMIT_DURATION: '60000',
      EMAIL_QUEUE_COMPLETED_RETENTION_AGE: '86400000',   // 24 hours
      EMAIL_QUEUE_COMPLETED_RETENTION_COUNT: '500',
      EMAIL_QUEUE_FAILED_RETENTION_AGE: '259200000',     // 3 days
      EMAIL_QUEUE_FAILED_RETENTION_COUNT: '250',
      EMAIL_QUEUE_MAX_ATTEMPTS: '5',
      EMAIL_QUEUE_SHUTDOWN_TIMEOUT: '30000',             // 30 seconds
    }
  },
  {
    environment: 'production',
    description: 'Production environment - optimized for performance and reliability',
    config: {
      EMAIL_WORKER_CONCURRENCY: '1',
      EMAIL_RATE_LIMIT_MAX: '100',
      EMAIL_RATE_LIMIT_DURATION: '60000',
      EMAIL_QUEUE_COMPLETED_RETENTION_AGE: '86400000',   // 24 hours
      EMAIL_QUEUE_COMPLETED_RETENTION_COUNT: '1000',
      EMAIL_QUEUE_FAILED_RETENTION_AGE: '604800000',     // 7 days
      EMAIL_QUEUE_FAILED_RETENTION_COUNT: '500',
      EMAIL_QUEUE_MAX_ATTEMPTS: '5',
      EMAIL_QUEUE_MAX_RECONNECT_ATTEMPTS: '20',
      EMAIL_QUEUE_SHUTDOWN_TIMEOUT: '60000',             // 60 seconds
    }
  },
  {
    environment: 'high-volume',
    description: 'High volume environment - for applications with heavy email usage',
    config: {
      EMAIL_WORKER_CONCURRENCY: '1',
      EMAIL_RATE_LIMIT_MAX: '500',
      EMAIL_RATE_LIMIT_DURATION: '60000',
      EMAIL_QUEUE_COMPLETED_RETENTION_AGE: '43200000',   // 12 hours
      EMAIL_QUEUE_COMPLETED_RETENTION_COUNT: '2000',
      EMAIL_QUEUE_FAILED_RETENTION_AGE: '259200000',     // 3 days
      EMAIL_QUEUE_FAILED_RETENTION_COUNT: '1000',
      EMAIL_QUEUE_MAX_ATTEMPTS: '5',
      EMAIL_QUEUE_MAX_RECONNECT_ATTEMPTS: '30',
      EMAIL_QUEUE_SHUTDOWN_TIMEOUT: '90000',             // 90 seconds
    }
  }
];

/**
 * Print configuration recommendations for different environments
 */
function printConfigRecommendations(): void {
  console.log('\n=== Email Queue Configuration Recommendations ===\n');

  CONFIG_RECOMMENDATIONS.forEach((recommendation, index) => {
    console.log(`${index + 1}. ${recommendation.environment.toUpperCase()}`);
    console.log(`   ${recommendation.description}\n`);

    Object.entries(recommendation.config).forEach(([key, value]) => {
      console.log(`   ${key}=${value}`);
    });

    console.log('');
  });
}

/**
 * Validate current environment configuration
 */
function validateCurrentConfig(): void {
  console.log('\n=== Current Configuration Validation ===\n');

  // Mock ConfigService for validation
  const mockConfigService = {
    get: (key: string, defaultValue?: any) => {
      return process.env[key] || defaultValue;
    }
  } as ConfigService;

  try {
    const configService = new EmailQueueConfigService(mockConfigService);
    const config = configService.getAllConfig();

    console.log('✅ Configuration loaded successfully');
    console.log('\nCurrent Settings:');
    console.log(`   Redis: ${config.redis.host}:${config.redis.port}`);
    console.log(`   Worker Concurrency: ${config.worker.concurrency}`);
    console.log(`   Rate Limit: ${config.worker.rateLimitMax}/${config.worker.rateLimitDuration}ms`);
    console.log(`   Max Retry Attempts: ${config.queue.maxAttempts}`);
    console.log(`   Job Retention: ${config.queue.completedRetentionCount} completed, ${config.queue.failedRetentionCount} failed`);

    // Calculate derived metrics
    const emailsPerSecond = config.worker.rateLimitMax / (config.worker.rateLimitDuration / 1000);
    const estimatedMemory = (config.queue.completedRetentionCount * 2 + config.queue.failedRetentionCount * 3) / 1000;

    console.log(`\nDerived Metrics:`);
    console.log(`   Estimated Rate: ${emailsPerSecond.toFixed(1)} emails/second`);
    console.log(`   Estimated Memory Usage: ~${estimatedMemory.toFixed(1)}MB`);

  } catch (error) {
    console.error('❌ Configuration validation failed:', error instanceof Error ? error.message : error);
  }
}

/**
 * Check for missing required environment variables
 */
function checkRequiredVariables(): void {
  console.log('\n=== Required Environment Variables Check ===\n');

  const requiredVars = [
    'REDIS_HOST',
    'REDIS_PORT',
  ];

  const optionalVars = [
    'EMAIL_WORKER_CONCURRENCY',
    'EMAIL_RATE_LIMIT_MAX',
    'EMAIL_RATE_LIMIT_DURATION',
    'EMAIL_QUEUE_MAX_ATTEMPTS',
    'EMAIL_QUEUE_INITIAL_DELAY',
    'EMAIL_QUEUE_COMPLETED_RETENTION_AGE',
    'EMAIL_QUEUE_COMPLETED_RETENTION_COUNT',
    'EMAIL_QUEUE_FAILED_RETENTION_AGE',
    'EMAIL_QUEUE_FAILED_RETENTION_COUNT',
    'EMAIL_QUEUE_MAX_RECONNECT_ATTEMPTS',
    'EMAIL_QUEUE_RECONNECT_BASE_DELAY',
    'EMAIL_QUEUE_RECONNECT_MAX_DELAY',
    'EMAIL_QUEUE_SHUTDOWN_TIMEOUT',
  ];

  console.log('Required Variables:');
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`   ✅ ${varName}=${value}`);
    } else {
      console.log(`   ❌ ${varName} - MISSING (required)`);
    }
  });

  console.log('\nOptional Variables (will use defaults if not set):');
  optionalVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`   ✅ ${varName}=${value}`);
    } else {
      console.log(`   ⚠️  ${varName} - using default`);
    }
  });
}

/**
 * Generate environment file template
 */
function generateEnvTemplate(environment: string): void {
  const recommendation = CONFIG_RECOMMENDATIONS.find(r => r.environment === environment);

  if (!recommendation) {
    console.error(`❌ Unknown environment: ${environment}`);
    console.log('Available environments:', CONFIG_RECOMMENDATIONS.map(r => r.environment).join(', '));
    return;
  }

  console.log(`\n=== Environment Template for ${environment.toUpperCase()} ===\n`);
  console.log(`# ${recommendation.description}`);
  console.log('');
  console.log('# Redis Configuration');
  console.log('REDIS_HOST=localhost');
  console.log('REDIS_PORT=6379');
  console.log('');
  console.log('# Email Queue Configuration');

  Object.entries(recommendation.config).forEach(([key, value]) => {
    console.log(`${key}=${value}`);
  });

  console.log('');
  console.log('# Copy the above configuration to your .env file');
}

/**
 * Main function
 */
function main(): void {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('Email Queue Configuration Setup Tool');
  console.log('====================================');

  switch (command) {
    case 'recommendations':
    case 'rec':
      printConfigRecommendations();
      break;

    case 'validate':
    case 'val':
      validateCurrentConfig();
      break;

    case 'check':
      checkRequiredVariables();
      break;

    case 'template':
    case 'temp':
      const environment = args[1];
      if (!environment) {
        console.log('\nUsage: npm run setup-email-config template <environment>');
        console.log('Available environments:', CONFIG_RECOMMENDATIONS.map(r => r.environment).join(', '));
        return;
      }
      generateEnvTemplate(environment);
      break;

    case 'help':
    case '--help':
    case '-h':
    default:
      console.log('\nUsage: npm run setup-email-config <command>');
      console.log('\nCommands:');
      console.log('  recommendations, rec  - Show configuration recommendations for different environments');
      console.log('  validate, val         - Validate current environment configuration');
      console.log('  check                 - Check for missing required environment variables');
      console.log('  template <env>        - Generate environment file template for specific environment');
      console.log('  help                  - Show this help message');
      console.log('\nExamples:');
      console.log('  npm run setup-email-config recommendations');
      console.log('  npm run setup-email-config validate');
      console.log('  npm run setup-email-config template production');
      break;
  }
}

// Run the script
if (require.main === module) {
  main();
}

export {
  CONFIG_RECOMMENDATIONS,
  printConfigRecommendations,
  validateCurrentConfig,
  checkRequiredVariables,
  generateEnvTemplate,
};