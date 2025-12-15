import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DocumentStorageService } from './document-storage.service';
import { CleanupResult } from '../types/pdf.types';

/**
 * PDF Cleanup Service
 *
 * Handles automatic cleanup scheduling and expired file removal.
 * Runs periodic cleanup operations to prevent storage bloat.
 */
@Injectable()
export class PDFCleanupService {
  private readonly logger = new Logger(PDFCleanupService.name);

  constructor(private readonly documentStorageService: DocumentStorageService) {}

  /**
   * Automatic cleanup job that runs every hour
   * Requirements: 5.2, 5.3 - Automatic cleanup scheduling and expired file removal
   */
  @Cron(CronExpression.EVERY_HOUR)
  async performScheduledCleanup(): Promise<void> {
    this.logger.log('Starting scheduled PDF cleanup...');

    try {
      const result = await this.documentStorageService.cleanupExpiredPDFs();

      if (result.filesRemoved > 0) {
        this.logger.log(
          `Scheduled cleanup completed: ${result.filesRemoved} files removed, ` +
          `${Math.round(result.spaceFreed / 1024)} KB freed`
        );
      } else {
        this.logger.log('Scheduled cleanup completed: no expired files found');
      }

      if (result.errors.length > 0) {
        this.logger.warn(`Cleanup completed with ${result.errors.length} errors`);
      }
    } catch (error) {
      this.logger.error('Scheduled cleanup failed:', error);
    }
  }

  /**
   * Emergency cleanup when storage capacity is critical
   * Requirements: 5.4 - Storage capacity handling and emergency cleanup procedures
   */
  async performEmergencyCleanup(): Promise<CleanupResult> {
    this.logger.warn('Performing emergency cleanup due to storage capacity limits');

    try {
      // First, run normal cleanup
      const result = await this.documentStorageService.cleanupExpiredPDFs();

      // Check if we still need more space
      const capacityCheck = await this.documentStorageService.validateStorageCapacity();

      if (capacityCheck.isNearCapacity) {
        this.logger.warn('Storage still near capacity after cleanup, consider increasing limits');
      }

      this.logger.log(
        `Emergency cleanup completed: ${result.filesRemoved} files removed, ` +
        `${Math.round(result.spaceFreed / 1024)} KB freed`
      );

      return result;
    } catch (error) {
      this.logger.error('Emergency cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Manual cleanup trigger for administrative purposes
   */
  async performManualCleanup(): Promise<CleanupResult> {
    this.logger.log('Performing manual cleanup...');

    try {
      const result = await this.documentStorageService.cleanupExpiredPDFs();

      this.logger.log(
        `Manual cleanup completed: ${result.filesRemoved} files removed, ` +
        `${Math.round(result.spaceFreed / 1024)} KB freed`
      );

      return result;
    } catch (error) {
      this.logger.error('Manual cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Get cleanup statistics and storage status
   */
  async getCleanupStatus(): Promise<{
    storageCapacity: any;
    lastCleanupResult?: CleanupResult;
  }> {
    try {
      const storageCapacity = await this.documentStorageService.validateStorageCapacity();

      return {
        storageCapacity,
      };
    } catch (error) {
      this.logger.error('Failed to get cleanup status:', error);
      throw error;
    }
  }
}