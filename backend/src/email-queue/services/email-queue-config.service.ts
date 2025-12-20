import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Email Queue Configuration Service
 *
 * Validates and provides centralized access to email queue configuration.
 * Logs warnings for potentially problematic settings.
 */
@Injectable()
export class EmailQueueConfigService implements OnModuleInit {
  private readonly logger = new Logger(EmailQueueConfigService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.validateConfiguration();
    this.logConfigurationSummary();
  }

  /**
   * Get Redis connection configuration
   */
  getRedisConfig() {
    return {
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: parseInt(this.configService.get('REDIS_PORT', '6379')),
    };
  }

  /**
   * Get worker configuration
   */
  getWorkerConfig() {
    const concurrency = parseInt(this.configService.get('EMAIL_WORKER_CONCURRENCY', '5'));
    const rateLimitMax = parseInt(this.configService.get('EMAIL_RATE_LIMIT_MAX', '100'));
    const rateLimitDuration = parseInt(this.configService.get('EMAIL_RATE_LIMIT_DURATION', '60000'));

    return {
      concurrency,
      rateLimitMax,
      rateLimitDuration,
    };
  }

  /**
   * Get queue job configuration
   */
  getQueueConfig() {
    const maxAttempts = parseInt(this.configService.get('EMAIL_QUEUE_MAX_ATTEMPTS', '5'));
    const initialDelay = parseInt(this.configService.get('EMAIL_QUEUE_INITIAL_DELAY', '60000'));
    const completedRetentionAge = parseInt(this.configService.get('EMAIL_QUEUE_COMPLETED_RETENTION_AGE', '86400000'));
    const completedRetentionCount = parseInt(this.configService.get('EMAIL_QUEUE_COMPLETED_RETENTION_COUNT', '1000'));
    const failedRetentionAge = parseInt(this.configService.get('EMAIL_QUEUE_FAILED_RETENTION_AGE', '604800000'));
    const failedRetentionCount = parseInt(this.configService.get('EMAIL_QUEUE_FAILED_RETENTION_COUNT', '500'));

    return {
      maxAttempts,
      initialDelay,
      completedRetentionAge,
      completedRetentionCount,
      failedRetentionAge,
      failedRetentionCount,
    };
  }

  /**
   * Get resilience configuration
   */
  getResilienceConfig() {
    const maxReconnectAttempts = parseInt(this.configService.get('EMAIL_QUEUE_MAX_RECONNECT_ATTEMPTS', '10'));
    const reconnectBaseDelay = parseInt(this.configService.get('EMAIL_QUEUE_RECONNECT_BASE_DELAY', '1000'));
    const reconnectMaxDelay = parseInt(this.configService.get('EMAIL_QUEUE_RECONNECT_MAX_DELAY', '30000'));
    const shutdownTimeout = parseInt(this.configService.get('EMAIL_QUEUE_SHUTDOWN_TIMEOUT', '30000'));
    const connectTimeout = parseInt(this.configService.get('REDIS_CONNECT_TIMEOUT', '30000'));
    const commandTimeout = parseInt(this.configService.get('REDIS_COMMAND_TIMEOUT', '30000'));

    return {
      maxReconnectAttempts,
      reconnectBaseDelay,
      reconnectMaxDelay,
      shutdownTimeout,
      connectTimeout,
      commandTimeout,
    };
  }

  /**
   * Get all configuration as a single object
   */
  getAllConfig() {
    return {
      redis: this.getRedisConfig(),
      worker: this.getWorkerConfig(),
      queue: this.getQueueConfig(),
      resilience: this.getResilienceConfig(),
    };
  }

  /**
   * Validate configuration and log warnings for potential issues
   */
  private validateConfiguration(): void {
    const redis = this.getRedisConfig();
    const worker = this.getWorkerConfig();
    const queue = this.getQueueConfig();
    const resilience = this.getResilienceConfig();

    // Validate Redis configuration
    if (!redis.host || redis.host === '') {
      this.logger.error('REDIS_HOST is not configured - email queue will not work');
    }

    if (redis.port < 1 || redis.port > 65535) {
      this.logger.warn(`Invalid REDIS_PORT: ${redis.port} - using default 6379`);
    }

    // Validate worker configuration
    if (worker.concurrency < 1) {
      this.logger.warn(`EMAIL_WORKER_CONCURRENCY too low: ${worker.concurrency} - minimum is 1`);
    }

    if (worker.concurrency > 50) {
      this.logger.warn(
        `EMAIL_WORKER_CONCURRENCY very high: ${worker.concurrency} - ` +
        `this may overwhelm your email service provider`
      );
    }

    if (worker.rateLimitMax < 1) {
      this.logger.warn(`EMAIL_RATE_LIMIT_MAX too low: ${worker.rateLimitMax} - minimum is 1`);
    }

    if (worker.rateLimitDuration < 1000) {
      this.logger.warn(
        `EMAIL_RATE_LIMIT_DURATION too low: ${worker.rateLimitDuration}ms - ` +
        `minimum recommended is 1000ms (1 second)`
      );
    }

    // Check for potentially overwhelming rate limits
    const emailsPerSecond = worker.rateLimitMax / (worker.rateLimitDuration / 1000);
    if (emailsPerSecond > 10) {
      this.logger.warn(
        `High email rate: ${emailsPerSecond.toFixed(1)} emails/second - ` +
        `ensure your email provider can handle this volume`
      );
    }

    // Validate queue configuration
    if (queue.maxAttempts < 1) {
      this.logger.warn(`EMAIL_QUEUE_MAX_ATTEMPTS too low: ${queue.maxAttempts} - minimum is 1`);
    }

    if (queue.maxAttempts > 10) {
      this.logger.warn(
        `EMAIL_QUEUE_MAX_ATTEMPTS very high: ${queue.maxAttempts} - ` +
        `failed emails will retry for a very long time`
      );
    }

    if (queue.initialDelay < 1000) {
      this.logger.warn(
        `EMAIL_QUEUE_INITIAL_DELAY too low: ${queue.initialDelay}ms - ` +
        `minimum recommended is 1000ms (1 second)`
      );
    }

    // Check retention settings for memory usage
    const estimatedCompletedMemory = queue.completedRetentionCount * 2; // ~2KB per job
    const estimatedFailedMemory = queue.failedRetentionCount * 3; // ~3KB per job (includes error info)
    const totalEstimatedMemory = estimatedCompletedMemory + estimatedFailedMemory;

    if (totalEstimatedMemory > 10000) { // > 10MB
      this.logger.warn(
        `High memory usage estimated: ~${Math.round(totalEstimatedMemory / 1000)}MB for job retention - ` +
        `consider reducing EMAIL_QUEUE_*_RETENTION_COUNT values`
      );
    }

    // Validate resilience configuration
    if (resilience.maxReconnectAttempts < 1) {
      this.logger.warn(
        `EMAIL_QUEUE_MAX_RECONNECT_ATTEMPTS too low: ${resilience.maxReconnectAttempts} - ` +
        `system may not recover from connection issues`
      );
    }

    if (resilience.reconnectBaseDelay < 100) {
      this.logger.warn(
        `EMAIL_QUEUE_RECONNECT_BASE_DELAY too low: ${resilience.reconnectBaseDelay}ms - ` +
        `may cause excessive reconnection attempts`
      );
    }

    if (resilience.shutdownTimeout < 5000) {
      this.logger.warn(
        `EMAIL_QUEUE_SHUTDOWN_TIMEOUT too low: ${resilience.shutdownTimeout}ms - ` +
        `jobs may not complete during graceful shutdown`
      );
    }

    if (resilience.shutdownTimeout > 120000) {
      this.logger.warn(
        `EMAIL_QUEUE_SHUTDOWN_TIMEOUT very high: ${resilience.shutdownTimeout}ms - ` +
        `shutdown may take a very long time`
      );
    }

    // Validate Redis timeout configuration
    if (resilience.connectTimeout < 5000) {
      this.logger.warn(
        `REDIS_CONNECT_TIMEOUT too low: ${resilience.connectTimeout}ms - ` +
        `may cause connection failures on slow networks`
      );
    }

    if (resilience.commandTimeout < 5000) {
      this.logger.warn(
        `REDIS_COMMAND_TIMEOUT too low: ${resilience.commandTimeout}ms - ` +
        `may cause command timeouts under load`
      );
    }

    if (resilience.commandTimeout > 60000) {
      this.logger.warn(
        `REDIS_COMMAND_TIMEOUT very high: ${resilience.commandTimeout}ms - ` +
        `may cause long delays when Redis is unresponsive`
      );
    }
  }

  /**
   * Log a summary of the current configuration
   */
  private logConfigurationSummary(): void {
    const config = this.getAllConfig();

    this.logger.log('Email Queue Configuration Summary:');
    this.logger.log(`  Redis: ${config.redis.host}:${config.redis.port}`);
    this.logger.log(`  Worker Concurrency: ${config.worker.concurrency}`);
    this.logger.log(
      `  Rate Limit: ${config.worker.rateLimitMax} emails per ${config.worker.rateLimitDuration}ms`
    );
    this.logger.log(`  Max Retry Attempts: ${config.queue.maxAttempts}`);
    this.logger.log(`  Initial Retry Delay: ${config.queue.initialDelay}ms`);
    this.logger.log(
      `  Job Retention: ${config.queue.completedRetentionCount} completed, ` +
      `${config.queue.failedRetentionCount} failed`
    );
    this.logger.log(`  Graceful Shutdown Timeout: ${config.resilience.shutdownTimeout}ms`);
    this.logger.log(`  Redis Connect Timeout: ${config.resilience.connectTimeout}ms`);
    this.logger.log(`  Redis Command Timeout: ${config.resilience.commandTimeout}ms`);

    // Calculate and log some derived metrics
    const emailsPerSecond = config.worker.rateLimitMax / (config.worker.rateLimitDuration / 1000);
    const estimatedMemory = (config.queue.completedRetentionCount * 2 + config.queue.failedRetentionCount * 3) / 1000;

    this.logger.log(`  Estimated Rate: ${emailsPerSecond.toFixed(1)} emails/second`);
    this.logger.log(`  Estimated Memory Usage: ~${estimatedMemory.toFixed(1)}MB for job retention`);
  }

  /**
   * Get configuration for health checks and monitoring
   */
  getConfigurationForMonitoring() {
    const config = this.getAllConfig();

    return {
      redis: {
        host: config.redis.host,
        port: config.redis.port,
      },
      worker: {
        concurrency: config.worker.concurrency,
        rateLimitMax: config.worker.rateLimitMax,
        rateLimitDuration: config.worker.rateLimitDuration,
        estimatedRate: (config.worker.rateLimitMax / (config.worker.rateLimitDuration / 1000)).toFixed(1) + ' emails/second',
      },
      queue: {
        maxAttempts: config.queue.maxAttempts,
        initialDelay: config.queue.initialDelay,
        retentionPolicy: {
          completed: `${config.queue.completedRetentionCount} jobs, ${config.queue.completedRetentionAge}ms age`,
          failed: `${config.queue.failedRetentionCount} jobs, ${config.queue.failedRetentionAge}ms age`,
        },
      },
      resilience: {
        maxReconnectAttempts: config.resilience.maxReconnectAttempts,
        reconnectDelayRange: `${config.resilience.reconnectBaseDelay}-${config.resilience.reconnectMaxDelay}ms`,
        shutdownTimeout: config.resilience.shutdownTimeout,
      },
      environment: process.env.NODE_ENV || 'development',
      estimatedMemoryUsage: Math.round((config.queue.completedRetentionCount * 2 + config.queue.failedRetentionCount * 3) / 1000) + 'MB',
    };
  }
}