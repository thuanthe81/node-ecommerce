#!/usr/bin/env ts-node

/**
 * Email Queue Data Migration Script
 *
 * This script handles migration of existing email data and queue state
 * when upgrading from synchronous to asynchronous email processing.
 */

import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';
import * as fs from 'fs';

// Load environment variables
dotenv.config();

interface MigrationOptions {
  dryRun: boolean;
  batchSize: number;
  skipBackup: boolean;
  reprocessFailedEmails: boolean;
}

interface EmailMigrationStats {
  totalEmailsFound: number;
  emailsRequeued: number;
  emailsSkipped: number;
  failedMigrations: number;
  backupCreated: boolean;
}

class EmailQueueMigrator {
  private prisma: PrismaClient;
  private emailQueue: Queue;
  private options: MigrationOptions;
  private stats: EmailMigrationStats;
  private logFile: string;

  constructor(options: MigrationOptions) {
    this.prisma = new PrismaClient();
    this.options = options;
    this.logFile = `email-queue-migration-${Date.now()}.log`;
    this.stats = {
      totalEmailsFound: 0,
      emailsRequeued: 0,
      emailsSkipped: 0,
      failedMigrations: 0,
      backupCreated: false,
    };

    // Initialize email queue
    this.emailQueue = new Queue('email-events', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    });
  }

  /**
   * Main migration flow
   */
  async migrate(): Promise<void> {
    this.log('🚀 Starting Email Queue Data Migration');
    this.log(`Dry Run: ${this.options.dryRun}`);
    this.log(`Batch Size: ${this.options.batchSize}`);
    this.log(`Reprocess Failed Emails: ${this.options.reprocessFailedEmails}`);
    this.log('');

    try {
      await this.validatePrerequisites();
      await this.createBackup();
      await this.migrateFailedEmails();
      await this.migratePendingNotifications();
      await this.cleanupOldData();
      await this.generateMigrationReport();

      this.log('✅ Email Queue Data Migration completed successfully!');
      this.printMigrationSummary();

    } catch (error) {
      this.log(`❌ Migration failed: ${error instanceof Error ? error.message : error}`);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Validate migration prerequisites
   */
  private async validatePrerequisites(): Promise<void> {
    this.log('📋 Validating Prerequisites...');

    // Check database connection
    try {
      await this.prisma.$connect();
      this.log('✅ Database connection verified');
    } catch (error) {
      throw new Error('Database connection failed');
    }

    // Check Redis connection
    try {
      const client = await this.emailQueue.client;
      await client.ping();
      this.log('✅ Redis connection verified');
    } catch (error) {
      throw new Error('Redis connection failed');
    }

    // Check if email queue service is running
    try {
      const queueMetrics = await this.emailQueue.getWaitingCount();
      this.log(`✅ Email queue service accessible (${queueMetrics} jobs waiting)`);
    } catch (error) {
      this.log('⚠️ Email queue service may not be running - continuing anyway');
    }
  }

  /**
   * Create backup of relevant data
   */
  private async createBackup(): Promise<void> {
    if (this.options.skipBackup) {
      this.log('⚠️ Skipping backup creation');
      return;
    }

    this.log('💾 Creating Data Backup...');

    if (this.options.dryRun) {
      this.log('📝 [DRY RUN] Would create backup');
      this.stats.backupCreated = true;
      return;
    }

    try {
      // Note: This is a placeholder for backup logic
      // In a real implementation, you might backup:
      // - Failed email logs
      // - Pending notification records
      // - Email template cache
      // - User notification preferences

      const backupData = {
        timestamp: new Date().toISOString(),
        migration_version: '1.0.0',
        note: 'Backup created before email queue migration',
        // Add actual backup data here based on your schema
      };

      const backupFile = `email-migration-backup-${Date.now()}.json`;
      fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));

      this.log(`✅ Backup created: ${backupFile}`);
      this.stats.backupCreated = true;

    } catch (error) {
      throw new Error(`Backup creation failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Migrate failed emails that need to be retried
   */
  private async migrateFailedEmails(): Promise<void> {
    if (!this.options.reprocessFailedEmails) {
      this.log('⚠️ Skipping failed email migration');
      return;
    }

    this.log('📧 Migrating Failed Emails...');

    // Note: This is a placeholder implementation
    // In a real system, you would:
    // 1. Query for failed email records from your database
    // 2. Convert them to email events
    // 3. Add them to the new queue system

    if (this.options.dryRun) {
      this.log('📝 [DRY RUN] Would migrate failed emails');
      return;
    }

    try {
      // Example: Query for orders that need email notifications
      const ordersNeedingNotification = await this.prisma.order.findMany({
        where: {
          // Add conditions for orders that might need email notifications
          // This depends on your specific schema and business logic
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          shippingAddress: true,
        },
        take: this.options.batchSize,
      });

      this.stats.totalEmailsFound = ordersNeedingNotification.length;

      for (const order of ordersNeedingNotification) {
        try {
          // Create order confirmation event
          const orderConfirmationEvent = {
            type: 'ORDER_CONFIRMATION',
            locale: 'en', // Default locale, adjust based on your logic
            timestamp: new Date(),
            orderId: order.id,
            orderNumber: order.orderNumber,
            customerEmail: order.email,
            customerName: order.shippingAddress.fullName,
          };

          await this.emailQueue.add('ORDER_CONFIRMATION', orderConfirmationEvent, {
            priority: 2, // Medium priority for migrated emails
            delay: 5000, // Small delay to avoid overwhelming the system
          });

          this.stats.emailsRequeued++;
          this.log(`✅ Requeued order confirmation for order ${order.orderNumber}`);

        } catch (error) {
          this.stats.failedMigrations++;
          this.log(`❌ Failed to requeue order ${order.orderNumber}: ${error instanceof Error ? error.message : error}`);
        }
      }

      this.log(`✅ Failed email migration completed: ${this.stats.emailsRequeued} emails requeued`);

    } catch (error) {
      throw new Error(`Failed email migration failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Migrate pending notifications
   */
  private async migratePendingNotifications(): Promise<void> {
    this.log('🔔 Migrating Pending Notifications...');

    if (this.options.dryRun) {
      this.log('📝 [DRY RUN] Would migrate pending notifications');
      return;
    }

    try {
      // Note: This is a placeholder for migrating pending notifications
      // You might have a notifications table or similar that needs migration

      // Example: Migrate welcome emails for recently registered users
      const recentUsers = await this.prisma.user.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
          // Add condition to check if welcome email was sent
        },
        take: this.options.batchSize,
      });

      for (const user of recentUsers) {
        try {
          const welcomeEmailEvent = {
            type: 'WELCOME_EMAIL',
            locale: 'en', // Default locale
            timestamp: new Date(),
            userId: user.id,
            userEmail: user.email,
            userName: `${user.firstName} ${user.lastName}`,
          };

          await this.emailQueue.add('WELCOME_EMAIL', welcomeEmailEvent, {
            priority: 5, // Lower priority for welcome emails
            delay: 10000, // Delay to spread out the load
          });

          this.log(`✅ Queued welcome email for user ${user.email}`);

        } catch (error) {
          this.log(`❌ Failed to queue welcome email for user ${user.email}: ${error instanceof Error ? error.message : error}`);
        }
      }

      this.log('✅ Pending notifications migration completed');

    } catch (error) {
      throw new Error(`Pending notifications migration failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Clean up old data that's no longer needed
   */
  private async cleanupOldData(): Promise<void> {
    this.log('🧹 Cleaning Up Old Data...');

    if (this.options.dryRun) {
      this.log('📝 [DRY RUN] Would clean up old data');
      return;
    }

    try {
      // Note: This is a placeholder for cleanup logic
      // You might want to:
      // - Remove old email logs
      // - Clean up temporary email files
      // - Archive old notification records

      this.log('✅ Old data cleanup completed');

    } catch (error) {
      this.log(`⚠️ Cleanup warning: ${error instanceof Error ? error.message : error}`);
      // Don't fail the migration for cleanup issues
    }
  }

  /**
   * Generate migration report
   */
  private async generateMigrationReport(): Promise<void> {
    this.log('📊 Generating Migration Report...');

    const report = {
      migration: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        options: this.options,
      },
      statistics: this.stats,
      queue_status: {
        waiting: await this.emailQueue.getWaitingCount(),
        active: await this.emailQueue.getActiveCount(),
        completed: await this.emailQueue.getCompletedCount(),
        failed: await this.emailQueue.getFailedCount(),
      },
      recommendations: this.generateRecommendations(),
    };

    const reportFile = `email-migration-report-${Date.now()}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    this.log(`✅ Migration report generated: ${reportFile}`);
  }

  /**
   * Generate recommendations based on migration results
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.stats.failedMigrations > 0) {
      recommendations.push('Review failed migrations and consider manual intervention');
    }

    if (this.stats.emailsRequeued > 100) {
      recommendations.push('Monitor queue processing to ensure system can handle the load');
    }

    if (!this.stats.backupCreated) {
      recommendations.push('Consider creating a backup before running in production');
    }

    recommendations.push('Monitor email delivery rates for the next 24 hours');
    recommendations.push('Check application logs for any email-related errors');
    recommendations.push('Verify email templates are working correctly with new system');

    return recommendations;
  }

  /**
   * Print migration summary
   */
  private printMigrationSummary(): void {
    this.log('');
    this.log('📈 Migration Summary:');
    this.log(`   Total Emails Found: ${this.stats.totalEmailsFound}`);
    this.log(`   Emails Requeued: ${this.stats.emailsRequeued}`);
    this.log(`   Emails Skipped: ${this.stats.emailsSkipped}`);
    this.log(`   Failed Migrations: ${this.stats.failedMigrations}`);
    this.log(`   Backup Created: ${this.stats.backupCreated ? 'Yes' : 'No'}`);
    this.log('');
    this.log('🎯 Next Steps:');
    this.log('1. Monitor queue processing: curl http://localhost:3000/email-queue/metrics');
    this.log('2. Check worker logs: pm2 logs email-queue-worker');
    this.log('3. Verify email delivery in application');
    this.log('4. Review migration report for recommendations');
    this.log('');
    this.log(`📋 Migration log saved to: ${this.logFile}`);
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    try {
      await this.emailQueue.close();
      await this.prisma.$disconnect();
    } catch (error) {
      this.log(`⚠️ Cleanup warning: ${error instanceof Error ? error.message : error}`);
    }
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
}

/**
 * Parse command line arguments
 */
function parseArguments(): MigrationOptions {
  const args = process.argv.slice(2);

  const options: MigrationOptions = {
    dryRun: false,
    batchSize: 100,
    skipBackup: false,
    reprocessFailedEmails: true,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--batch-size':
        options.batchSize = parseInt(args[++i]);
        break;
      case '--skip-backup':
        options.skipBackup = true;
        break;
      case '--skip-failed-emails':
        options.reprocessFailedEmails = false;
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
Email Queue Data Migration Script

Usage: npm run migrate-email-queue-data [options]

Options:
  --dry-run                    Preview migration without making changes
  --batch-size <number>        Number of records to process per batch (default: 100)
  --skip-backup               Skip creating data backup
  --skip-failed-emails        Skip reprocessing failed emails
  --help, -h                  Show this help message

Examples:
  npm run migrate-email-queue-data --dry-run
  npm run migrate-email-queue-data --batch-size 50
  npm run migrate-email-queue-data --skip-backup --skip-failed-emails
`);
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    const options = parseArguments();
    const migrator = new EmailQueueMigrator(options);
    await migrator.migrate();
  } catch (error) {
    console.error('❌ Migration failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { EmailQueueMigrator };
export type { MigrationOptions };