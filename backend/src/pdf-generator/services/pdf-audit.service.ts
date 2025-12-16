import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  operation: string;
  operationType: 'pdf_generation' | 'email_sending' | 'storage_operation' | 'resend_email' | 'cleanup' | 'system';
  status: 'started' | 'completed' | 'failed' | 'cancelled';
  details: Record<string, any>;
  duration?: number;
  error?: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface PDFGenerationAudit extends AuditLogEntry {
  operationType: 'pdf_generation';
  details: {
    orderNumber: string;
    customerEmail: string;
    locale: 'en' | 'vi';
    pdfType: 'order' | 'invoice';
    fileSize?: number;
    filePath?: string;
    compressionLevel?: string;
    deviceOptimization?: string;
    itemCount: number;
    totalAmount: number;
    paymentMethod: string;
  };
}

export interface EmailSendingAudit extends AuditLogEntry {
  operationType: 'email_sending';
  details: {
    orderNumber: string;
    customerEmail: string;
    locale: 'en' | 'vi';
    attachmentSize?: number;
    attachmentPath?: string;
    emailTemplate: string;
    deliveryAttempts: number;
    finalDeliveryStatus: 'sent' | 'failed' | 'queued';
    retryCount?: number;
    messageId?: string;
  };
}

export interface StorageOperationAudit extends AuditLogEntry {
  operationType: 'storage_operation';
  details: {
    operation: 'store' | 'retrieve' | 'delete' | 'cleanup';
    filePath?: string;
    fileName?: string;
    fileSize?: number;
    orderNumber?: string;
    retentionPeriod?: number;
    cleanupReason?: string;
    filesAffected?: number;
    spaceFreed?: number;
  };
}

export interface ResendEmailAudit extends AuditLogEntry {
  operationType: 'resend_email';
  details: {
    orderNumber: string;
    customerEmail: string;
    locale: 'en' | 'vi';
    requestSource: 'customer' | 'admin' | 'system';
    rateLimitStatus: 'allowed' | 'blocked';
    remainingAttempts?: number;
    pdfRegenerated: boolean;
    deliveryStatus: 'sent' | 'failed';
  };
}

export interface AuditSearchCriteria {
  operationType?: AuditLogEntry['operationType'];
  status?: AuditLogEntry['status'];
  orderNumber?: string;
  customerEmail?: string;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  limit?: number;
  offset?: number;
}

export interface AuditStatistics {
  totalOperations: number;
  operationsByType: Record<string, number>;
  operationsByStatus: Record<string, number>;
  averageDuration: number;
  errorRate: number;
  topErrors: Array<{ error: string; count: number }>;
  dailyOperationCounts: Array<{ date: string; count: number }>;
  performanceMetrics: {
    pdfGeneration: {
      averageTime: number;
      successRate: number;
      totalGenerated: number;
    };
    emailDelivery: {
      averageTime: number;
      successRate: number;
      totalSent: number;
    };
    storageOperations: {
      averageTime: number;
      successRate: number;
      totalOperations: number;
    };
  };
}

/**
 * PDF System Audit Service
 *
 * Provides comprehensive logging and audit trails for all PDF system operations.
 * Tracks PDF generation, email sending, storage operations, and resend activities.
 *
 * Requirements: 3.6, 4.5 - Comprehensive logging and audit trails
 */
@Injectable()
export class PDFAuditService {
  private readonly logger = new Logger(PDFAuditService.name);
  private readonly auditLogs = new Map<string, AuditLogEntry>();
  private readonly auditLogFile: string;
  private readonly maxInMemoryLogs = 10000;
  private readonly logRotationSize = 100 * 1024 * 1024; // 100MB

  constructor() {
    // Initialize audit log file path
    const logsDir = path.join(process.cwd(), 'logs', 'audit');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    this.auditLogFile = path.join(logsDir, 'pdf-system-audit.log');
    this.initializeAuditLogging();
  }

  /**
   * Log PDF generation request and result
   * Requirements: 3.6, 4.5 - Log all PDF generation requests and results
   */
  async logPDFGeneration(
    orderNumber: string,
    customerEmail: string,
    locale: 'en' | 'vi',
    pdfType: 'order' | 'invoice',
    status: 'started' | 'completed' | 'failed',
    details: Partial<PDFGenerationAudit['details']> = {},
    duration?: number,
    error?: string
  ): Promise<string> {
    const auditId = this.generateAuditId('pdf', orderNumber);

    const auditEntry: PDFGenerationAudit = {
      id: auditId,
      timestamp: new Date(),
      operation: `generate_${pdfType}_pdf`,
      operationType: 'pdf_generation',
      status,
      details: {
        orderNumber,
        customerEmail,
        locale,
        pdfType,
        itemCount: details.itemCount || 0,
        totalAmount: details.totalAmount || 0,
        paymentMethod: details.paymentMethod || 'unknown',
        ...details,
      },
      duration,
      error,
    };

    await this.storeAuditEntry(auditEntry);

    this.logger.log(`PDF generation ${status}: ${orderNumber} (${auditId})`, {
      auditId,
      orderNumber,
      status,
      duration,
      error,
    });

    return auditId;
  }

  /**
   * Log email sending attempts and delivery status
   * Requirements: 3.6 - Track email sending attempts and delivery status
   */
  async logEmailSending(
    orderNumber: string,
    customerEmail: string,
    locale: 'en' | 'vi',
    status: 'started' | 'completed' | 'failed',
    details: Partial<EmailSendingAudit['details']> = {},
    duration?: number,
    error?: string
  ): Promise<string> {
    const auditId = this.generateAuditId('email', orderNumber);

    const auditEntry: EmailSendingAudit = {
      id: auditId,
      timestamp: new Date(),
      operation: 'send_order_confirmation_email',
      operationType: 'email_sending',
      status,
      details: {
        orderNumber,
        customerEmail,
        locale,
        emailTemplate: details.emailTemplate || 'simplified',
        deliveryAttempts: details.deliveryAttempts || 1,
        finalDeliveryStatus: details.finalDeliveryStatus || 'queued',
        ...details,
      },
      duration,
      error,
    };

    await this.storeAuditEntry(auditEntry);

    this.logger.log(`Email sending ${status}: ${orderNumber} to ${customerEmail} (${auditId})`, {
      auditId,
      orderNumber,
      customerEmail,
      status,
      duration,
      error,
    });

    return auditId;
  }

  /**
   * Log file storage operations and cleanup activities
   * Requirements: 3.6, 4.5 - Monitor file storage operations and cleanup activities
   */
  async logStorageOperation(
    operation: 'store' | 'retrieve' | 'delete' | 'cleanup',
    status: 'started' | 'completed' | 'failed',
    details: Partial<StorageOperationAudit['details']> = {},
    duration?: number,
    error?: string
  ): Promise<string> {
    const auditId = this.generateAuditId('storage', details.orderNumber || 'system');

    const auditEntry: StorageOperationAudit = {
      id: auditId,
      timestamp: new Date(),
      operation: `storage_${operation}`,
      operationType: 'storage_operation',
      status,
      details: {
        operation,
        ...details,
      },
      duration,
      error,
    };

    await this.storeAuditEntry(auditEntry);

    this.logger.log(`Storage ${operation} ${status}: ${details.filePath || 'multiple files'} (${auditId})`, {
      auditId,
      operation,
      status,
      duration,
      error,
    });

    return auditId;
  }

  /**
   * Log resend email operations with rate limiting information
   * Requirements: 3.6 - Create audit trails for resend email operations
   */
  async logResendEmail(
    orderNumber: string,
    customerEmail: string,
    locale: 'en' | 'vi',
    requestSource: 'customer' | 'admin' | 'system',
    status: 'started' | 'completed' | 'failed',
    details: Partial<ResendEmailAudit['details']> = {},
    duration?: number,
    error?: string,
    userContext?: { userId?: string; ipAddress?: string; userAgent?: string }
  ): Promise<string> {
    const auditId = this.generateAuditId('resend', orderNumber);

    const auditEntry: ResendEmailAudit = {
      id: auditId,
      timestamp: new Date(),
      operation: 'resend_order_confirmation',
      operationType: 'resend_email',
      status,
      details: {
        orderNumber,
        customerEmail,
        locale,
        requestSource,
        rateLimitStatus: details.rateLimitStatus || 'allowed',
        pdfRegenerated: details.pdfRegenerated || false,
        deliveryStatus: details.deliveryStatus || 'failed',
        ...details,
      },
      duration,
      error,
      userId: userContext?.userId,
      ipAddress: userContext?.ipAddress,
      userAgent: userContext?.userAgent,
    };

    await this.storeAuditEntry(auditEntry);

    this.logger.log(`Resend email ${status}: ${orderNumber} by ${requestSource} (${auditId})`, {
      auditId,
      orderNumber,
      requestSource,
      status,
      duration,
      error,
    });

    return auditId;
  }

  /**
   * Search audit logs based on criteria
   */
  async searchAuditLogs(criteria: AuditSearchCriteria): Promise<AuditLogEntry[]> {
    const allLogs = Array.from(this.auditLogs.values());
    let filteredLogs = allLogs;

    // Apply filters
    if (criteria.operationType) {
      filteredLogs = filteredLogs.filter(log => log.operationType === criteria.operationType);
    }

    if (criteria.status) {
      filteredLogs = filteredLogs.filter(log => log.status === criteria.status);
    }

    if (criteria.orderNumber) {
      filteredLogs = filteredLogs.filter(log =>
        log.details.orderNumber === criteria.orderNumber
      );
    }

    if (criteria.customerEmail) {
      filteredLogs = filteredLogs.filter(log =>
        log.details.customerEmail === criteria.customerEmail
      );
    }

    if (criteria.startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= criteria.startDate!);
    }

    if (criteria.endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= criteria.endDate!);
    }

    if (criteria.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === criteria.userId);
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = criteria.offset || 0;
    const limit = criteria.limit || 100;

    return filteredLogs.slice(offset, offset + limit);
  }

  /**
   * Get comprehensive audit statistics
   */
  async getAuditStatistics(startDate?: Date, endDate?: Date): Promise<AuditStatistics> {
    const allLogs = Array.from(this.auditLogs.values());
    let filteredLogs = allLogs;

    // Apply date filters
    if (startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= startDate);
    }
    if (endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= endDate);
    }

    // Calculate basic statistics
    const totalOperations = filteredLogs.length;
    const operationsByType = this.groupBy(filteredLogs, 'operationType');
    const operationsByStatus = this.groupBy(filteredLogs, 'status');

    // Calculate average duration
    const logsWithDuration = filteredLogs.filter(log => log.duration !== undefined);
    const averageDuration = logsWithDuration.length > 0
      ? logsWithDuration.reduce((sum, log) => sum + (log.duration || 0), 0) / logsWithDuration.length
      : 0;

    // Calculate error rate
    const failedOperations = filteredLogs.filter(log => log.status === 'failed').length;
    const errorRate = totalOperations > 0 ? (failedOperations / totalOperations) * 100 : 0;

    // Get top errors
    const errorLogs = filteredLogs.filter(log => log.error);
    const errorCounts = new Map<string, number>();
    errorLogs.forEach(log => {
      const error = log.error!;
      errorCounts.set(error, (errorCounts.get(error) || 0) + 1);
    });
    const topErrors = Array.from(errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate daily operation counts
    const dailyOperationCounts = this.calculateDailyOperationCounts(filteredLogs);

    // Calculate performance metrics
    const performanceMetrics = this.calculatePerformanceMetrics(filteredLogs);

    return {
      totalOperations,
      operationsByType: Object.fromEntries(operationsByType),
      operationsByStatus: Object.fromEntries(operationsByStatus),
      averageDuration: Math.round(averageDuration),
      errorRate: Math.round(errorRate * 100) / 100,
      topErrors,
      dailyOperationCounts,
      performanceMetrics,
    };
  }

  /**
   * Get audit logs for a specific order
   */
  async getOrderAuditTrail(orderNumber: string): Promise<AuditLogEntry[]> {
    return this.searchAuditLogs({ orderNumber });
  }

  /**
   * Get recent audit logs (last 24 hours)
   */
  async getRecentAuditLogs(limit: number = 100): Promise<AuditLogEntry[]> {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.searchAuditLogs({ startDate: yesterday, limit });
  }

  /**
   * Export audit logs to file
   */
  async exportAuditLogs(
    criteria: AuditSearchCriteria,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const logs = await this.searchAuditLogs(criteria);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `audit-export-${timestamp}.${format}`;
    const exportPath = path.join(process.cwd(), 'logs', 'exports', filename);

    // Ensure export directory exists
    const exportDir = path.dirname(exportPath);
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    if (format === 'json') {
      fs.writeFileSync(exportPath, JSON.stringify(logs, null, 2));
    } else if (format === 'csv') {
      const csvContent = this.convertLogsToCSV(logs);
      fs.writeFileSync(exportPath, csvContent);
    }

    this.logger.log(`Audit logs exported to: ${exportPath}`);
    return exportPath;
  }

  /**
   * Clean up old audit logs (older than specified days)
   */
  async cleanupOldAuditLogs(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [id, log] of this.auditLogs.entries()) {
      if (log.timestamp < cutoffDate) {
        this.auditLogs.delete(id);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`Cleaned up ${cleanedCount} old audit log entries`);
      await this.logStorageOperation('cleanup', 'completed', {
        operation: 'cleanup',
        cleanupReason: `Retention policy: ${retentionDays} days`,
        filesAffected: cleanedCount,
      });
    }

    return cleanedCount;
  }

  /**
   * Initialize audit logging system
   */
  private initializeAuditLogging(): void {
    this.logger.log('Initializing PDF system audit logging');

    // Load existing audit logs from file if it exists
    if (fs.existsSync(this.auditLogFile)) {
      try {
        const logContent = fs.readFileSync(this.auditLogFile, 'utf-8');
        const lines = logContent.split('\n').filter(line => line.trim());

        lines.forEach(line => {
          try {
            const logEntry = JSON.parse(line) as AuditLogEntry;
            // Convert timestamp back to Date object after JSON parsing
            logEntry.timestamp = new Date(logEntry.timestamp);
            this.auditLogs.set(logEntry.id, logEntry);
          } catch (parseError) {
            // Skip invalid log entries
          }
        });

        this.logger.log(`Loaded ${this.auditLogs.size} existing audit log entries`);
      } catch (error) {
        this.logger.error('Failed to load existing audit logs:', error);
      }
    }

    // Set up periodic log rotation
    setInterval(() => {
      this.rotateLogFileIfNeeded();
    }, 60 * 60 * 1000); // Check every hour
  }

  /**
   * Store audit entry in memory and file
   */
  private async storeAuditEntry(entry: AuditLogEntry): Promise<void> {
    // Store in memory
    this.auditLogs.set(entry.id, entry);

    // Maintain memory limit
    if (this.auditLogs.size > this.maxInMemoryLogs) {
      const oldestEntries = Array.from(this.auditLogs.entries())
        .sort(([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime())
        .slice(0, 1000); // Remove oldest 1000 entries

      oldestEntries.forEach(([id]) => this.auditLogs.delete(id));
    }

    // Append to file
    try {
      const logLine = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.auditLogFile, logLine);
    } catch (error) {
      this.logger.error('Failed to write audit log to file:', error);
    }
  }

  /**
   * Generate unique audit ID
   */
  private generateAuditId(prefix: string, identifier: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}_${identifier}_${timestamp}_${random}`;
  }

  /**
   * Group array by property
   */
  private groupBy<T>(array: T[], property: keyof T): Map<string, number> {
    const groups = new Map<string, number>();

    array.forEach(item => {
      const key = String(item[property]);
      groups.set(key, (groups.get(key) || 0) + 1);
    });

    return groups;
  }

  /**
   * Calculate daily operation counts
   */
  private calculateDailyOperationCounts(logs: AuditLogEntry[]): Array<{ date: string; count: number }> {
    const dailyCounts = new Map<string, number>();

    logs.forEach(log => {
      const date = log.timestamp.toISOString().split('T')[0];
      dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1);
    });

    return Array.from(dailyCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Calculate performance metrics by operation type
   */
  private calculatePerformanceMetrics(logs: AuditLogEntry[]): AuditStatistics['performanceMetrics'] {
    const pdfLogs = logs.filter(log => log.operationType === 'pdf_generation');
    const emailLogs = logs.filter(log => log.operationType === 'email_sending');
    const storageLogs = logs.filter(log => log.operationType === 'storage_operation');

    return {
      pdfGeneration: this.calculatePDFGenerationMetrics(pdfLogs),
      emailDelivery: this.calculateEmailDeliveryMetrics(emailLogs),
      storageOperations: this.calculateStorageOperationMetrics(storageLogs),
    };
  }

  /**
   * Calculate metrics for a specific operation type
   */
  private calculateOperationMetrics(logs: AuditLogEntry[]): {
    averageTime: number;
    successRate: number;
    totalGenerated: number;
  } {
    const total = logs.length;
    const successful = logs.filter(log => log.status === 'completed').length;
    const logsWithDuration = logs.filter(log => log.duration !== undefined);

    const averageTime = logsWithDuration.length > 0
      ? logsWithDuration.reduce((sum, log) => sum + (log.duration || 0), 0) / logsWithDuration.length
      : 0;

    const successRate = total > 0 ? (successful / total) * 100 : 0;

    return {
      averageTime: Math.round(averageTime),
      successRate: Math.round(successRate * 100) / 100,
      totalGenerated: total,
    };
  }

  /**
   * Calculate PDF generation specific metrics
   */
  private calculatePDFGenerationMetrics(logs: AuditLogEntry[]): {
    averageTime: number;
    successRate: number;
    totalGenerated: number;
  } {
    return this.calculateOperationMetrics(logs);
  }

  /**
   * Calculate email delivery specific metrics
   */
  private calculateEmailDeliveryMetrics(logs: AuditLogEntry[]): {
    averageTime: number;
    successRate: number;
    totalSent: number;
  } {
    const baseMetrics = this.calculateOperationMetrics(logs);
    return {
      averageTime: baseMetrics.averageTime,
      successRate: baseMetrics.successRate,
      totalSent: baseMetrics.totalGenerated,
    };
  }

  /**
   * Calculate storage operation specific metrics
   */
  private calculateStorageOperationMetrics(logs: AuditLogEntry[]): {
    averageTime: number;
    successRate: number;
    totalOperations: number;
  } {
    const baseMetrics = this.calculateOperationMetrics(logs);
    return {
      averageTime: baseMetrics.averageTime,
      successRate: baseMetrics.successRate,
      totalOperations: baseMetrics.totalGenerated,
    };
  }

  /**
   * Convert logs to CSV format
   */
  private convertLogsToCSV(logs: AuditLogEntry[]): string {
    if (logs.length === 0) {
      return 'No data to export';
    }

    const headers = [
      'ID',
      'Timestamp',
      'Operation',
      'Operation Type',
      'Status',
      'Duration',
      'Error',
      'Order Number',
      'Customer Email',
      'User ID',
      'IP Address',
    ];

    const csvRows = [headers.join(',')];

    logs.forEach(log => {
      const row = [
        log.id,
        log.timestamp.toISOString(),
        log.operation,
        log.operationType,
        log.status,
        log.duration || '',
        log.error || '',
        log.details.orderNumber || '',
        log.details.customerEmail || '',
        log.userId || '',
        log.ipAddress || '',
      ];

      csvRows.push(row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));
    });

    return csvRows.join('\n');
  }

  /**
   * Rotate log file if it exceeds size limit
   */
  private rotateLogFileIfNeeded(): void {
    try {
      if (fs.existsSync(this.auditLogFile)) {
        const stats = fs.statSync(this.auditLogFile);

        if (stats.size > this.logRotationSize) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const rotatedFile = this.auditLogFile.replace('.log', `-${timestamp}.log`);

          fs.renameSync(this.auditLogFile, rotatedFile);
          this.logger.log(`Rotated audit log file to: ${rotatedFile}`);
        }
      }
    } catch (error) {
      this.logger.error('Failed to rotate audit log file:', error);
    }
  }
}