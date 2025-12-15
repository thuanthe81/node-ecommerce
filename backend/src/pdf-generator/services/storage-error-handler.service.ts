import { Injectable, Logger } from '@nestjs/common';

/**
 * Storage Error Handler Service
 *
 * Centralized error handling and logging for storage operations.
 * Provides comprehensive error categorization and recovery strategies.
 */
@Injectable()
export class StorageErrorHandlerService {
  private readonly logger = new Logger(StorageErrorHandlerService.name);

  /**
   * Handle storage operation errors with appropriate logging and recovery
   * Requirements: 5.6 - Comprehensive error handling for storage operations
   */
  handleStorageError(operation: string, error: any, context?: any): never {
    const errorInfo = this.categorizeError(error);

    // Log error with context
    this.logger.error(
      `Storage operation failed: ${operation}`,
      {
        error: errorInfo,
        context,
        timestamp: new Date().toISOString(),
      }
    );

    // Throw appropriate error based on category
    throw new Error(`${operation} failed: ${errorInfo.message}`);
  }

  /**
   * Handle filename conflict errors specifically
   * Requirements: 5.6 - Handle filename conflicts appropriately
   */
  handleFilenameConflictError(originalPath: string, error: any): never {
    this.logger.warn(
      `Filename conflict detected for: ${originalPath}`,
      {
        error: error.message,
        timestamp: new Date().toISOString(),
      }
    );

    throw new Error(`Filename conflict: ${error.message}`);
  }

  /**
   * Handle capacity limit errors
   * Requirements: 5.4 - Storage capacity handling and emergency cleanup procedures
   */
  handleCapacityError(currentUsage: number, maxCapacity: number): never {
    const utilizationPercentage = (currentUsage / maxCapacity) * 100;

    this.logger.error(
      `Storage capacity exceeded: ${utilizationPercentage.toFixed(2)}% used`,
      {
        currentUsage,
        maxCapacity,
        availableSpace: maxCapacity - currentUsage,
        timestamp: new Date().toISOString(),
      }
    );

    throw new Error(
      `Storage capacity exceeded. Current usage: ${utilizationPercentage.toFixed(2)}%`
    );
  }

  /**
   * Handle cleanup operation errors
   * Requirements: 5.2, 5.3 - Cleanup scheduling and expired file cleanup
   */
  handleCleanupError(operation: string, filePath: string, error: any): void {
    this.logger.error(
      `Cleanup operation failed: ${operation}`,
      {
        filePath,
        error: error.message,
        timestamp: new Date().toISOString(),
      }
    );

    // Don't throw for cleanup errors - log and continue
  }

  /**
   * Handle file permission errors
   * Requirements: 5.5 - Ensure proper file permissions and security measures
   */
  handlePermissionError(filePath: string, operation: string, error: any): never {
    this.logger.error(
      `File permission error during ${operation}`,
      {
        filePath,
        error: error.message,
        timestamp: new Date().toISOString(),
      }
    );

    throw new Error(`Permission denied for ${operation}: ${error.message}`);
  }

  /**
   * Log successful storage operations for audit trail
   * Requirements: 5.6 - Create logging for storage operations and cleanup activities
   */
  logStorageOperation(operation: string, details: any): void {
    this.logger.log(
      `Storage operation completed: ${operation}`,
      {
        details,
        timestamp: new Date().toISOString(),
      }
    );
  }

  /**
   * Log cleanup activities for audit trail
   * Requirements: 5.6 - Create logging for storage operations and cleanup activities
   */
  logCleanupActivity(activity: string, result: any): void {
    this.logger.log(
      `Cleanup activity completed: ${activity}`,
      {
        result,
        timestamp: new Date().toISOString(),
      }
    );
  }

  /**
   * Categorize errors for better handling
   */
  private categorizeError(error: any): { category: string; message: string; recoverable: boolean } {
    const message = error.message || 'Unknown error';

    // File system errors
    if (error.code === 'ENOENT') {
      return { category: 'FILE_NOT_FOUND', message, recoverable: false };
    }
    if (error.code === 'EACCES') {
      return { category: 'PERMISSION_DENIED', message, recoverable: false };
    }
    if (error.code === 'ENOSPC') {
      return { category: 'NO_SPACE', message, recoverable: true };
    }
    if (error.code === 'EMFILE' || error.code === 'ENFILE') {
      return { category: 'TOO_MANY_FILES', message, recoverable: true };
    }

    // Custom application errors
    if (message.includes('capacity')) {
      return { category: 'CAPACITY_EXCEEDED', message, recoverable: true };
    }
    if (message.includes('conflict')) {
      return { category: 'FILENAME_CONFLICT', message, recoverable: true };
    }
    if (message.includes('permission')) {
      return { category: 'PERMISSION_ERROR', message, recoverable: false };
    }

    // Generic error
    return { category: 'UNKNOWN', message, recoverable: false };
  }

  /**
   * Check if error is recoverable
   */
  isRecoverableError(error: any): boolean {
    const errorInfo = this.categorizeError(error);
    return errorInfo.recoverable;
  }

  /**
   * Get error recovery suggestions
   */
  getRecoverySuggestions(error: any): string[] {
    const errorInfo = this.categorizeError(error);

    switch (errorInfo.category) {
      case 'NO_SPACE':
        return [
          'Run cleanup to free up space',
          'Increase storage capacity',
          'Check disk usage',
        ];
      case 'TOO_MANY_FILES':
        return [
          'Close unused file handles',
          'Increase system file limits',
          'Run cleanup to reduce file count',
        ];
      case 'CAPACITY_EXCEEDED':
        return [
          'Trigger emergency cleanup',
          'Increase storage limits',
          'Archive old files',
        ];
      case 'FILENAME_CONFLICT':
        return [
          'Use unique filename generation',
          'Check for existing files before creation',
          'Implement conflict resolution',
        ];
      default:
        return ['Check system logs', 'Contact system administrator'];
    }
  }
}