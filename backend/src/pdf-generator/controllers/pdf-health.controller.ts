import { Controller, Get, Query, Post, Param, HttpStatus, HttpException } from '@nestjs/common';
import { PDFMonitoringService, SystemHealthStatus, PerformanceMetrics, StorageCapacityAlert } from '../services/pdf-monitoring.service';
import { PDFErrorHandlerService } from '../services/pdf-error-handler.service';
import { PDFAuditService, AuditSearchCriteria, AuditStatistics } from '../services/pdf-audit.service';

/**
 * PDF System Health Check Controller
 *
 * Provides REST endpoints for monitoring PDF system health,
 * performance metrics, error statistics, and audit logs.
 *
 * Requirements: 5.4, 3.6 - Health check endpoints and monitoring
 */
@Controller('api/pdf/health')
export class PDFHealthController {
  constructor(
    private monitoringService: PDFMonitoringService,
    private errorHandlerService: PDFErrorHandlerService,
    private auditService: PDFAuditService,
  ) {}

  /**
   * Get comprehensive system health status
   * Requirements: 5.4 - Add health check endpoints for PDF generation service
   */
  @Get()
  async getSystemHealth(): Promise<SystemHealthStatus> {
    try {
      return await this.monitoringService.performHealthCheck();
    } catch (error) {
      throw new HttpException(
        `Health check failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get performance metrics
   * Requirements: 3.6 - Add performance metrics for PDF generation times
   */
  @Get('metrics')
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      return await this.monitoringService.getPerformanceMetrics();
    } catch (error) {
      throw new HttpException(
        `Failed to get performance metrics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get storage capacity status and alerts
   * Requirements: 5.4 - Implement storage capacity monitoring and alerts
   */
  @Get('storage')
  async getStorageStatus(): Promise<{
    capacityAlert: StorageCapacityAlert | null;
    metrics: PerformanceMetrics['storage'];
  }> {
    try {
      const capacityAlert = await this.monitoringService.monitorStorageCapacity();
      const metrics = await this.monitoringService.getPerformanceMetrics();

      return {
        capacityAlert,
        metrics: metrics.storage,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get storage status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get error statistics and active failures
   * Requirements: 4.5, 3.5 - Add monitoring and alerting for system failures
   */
  @Get('errors')
  async getErrorStatistics(): Promise<{
    statistics: any;
    activeFailures: any[];
  }> {
    try {
      const statistics = this.errorHandlerService.getErrorStatistics();
      const activeFailures = this.errorHandlerService.getActiveFailures();

      return {
        statistics,
        activeFailures,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get error statistics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Mark a system failure as resolved
   */
  @Post('errors/:failureId/resolve')
  async resolveFailure(@Param('failureId') failureId: string): Promise<{ success: boolean }> {
    try {
      const success = this.errorHandlerService.markFailureResolved(failureId);

      if (!success) {
        throw new HttpException(
          `Failure with ID ${failureId} not found`,
          HttpStatus.NOT_FOUND
        );
      }

      return { success: true };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Failed to resolve failure: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get audit statistics
   * Requirements: 3.6, 4.5 - Comprehensive logging and audit trails
   */
  @Get('audit/statistics')
  async getAuditStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<AuditStatistics> {
    try {
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;

      return await this.auditService.getAuditStatistics(start, end);
    } catch (error) {
      throw new HttpException(
        `Failed to get audit statistics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Search audit logs
   * Requirements: 3.6 - Create audit trails for resend email operations
   */
  @Get('audit/logs')
  async searchAuditLogs(
    @Query('operationType') operationType?: string,
    @Query('status') status?: string,
    @Query('orderNumber') orderNumber?: string,
    @Query('customerEmail') customerEmail?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ): Promise<any[]> {
    try {
      const criteria: AuditSearchCriteria = {};

      if (operationType) criteria.operationType = operationType as any;
      if (status) criteria.status = status as any;
      if (orderNumber) criteria.orderNumber = orderNumber;
      if (customerEmail) criteria.customerEmail = customerEmail;
      if (startDate) criteria.startDate = new Date(startDate);
      if (endDate) criteria.endDate = new Date(endDate);
      if (limit) criteria.limit = parseInt(limit, 10);
      if (offset) criteria.offset = parseInt(offset, 10);

      return await this.auditService.searchAuditLogs(criteria);
    } catch (error) {
      throw new HttpException(
        `Failed to search audit logs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get audit trail for a specific order
   * Requirements: 3.6 - Log all PDF generation requests and results
   */
  @Get('audit/order/:orderNumber')
  async getOrderAuditTrail(@Param('orderNumber') orderNumber: string): Promise<any[]> {
    try {
      return await this.auditService.getOrderAuditTrail(orderNumber);
    } catch (error) {
      throw new HttpException(
        `Failed to get order audit trail: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get recent audit logs (last 24 hours)
   */
  @Get('audit/recent')
  async getRecentAuditLogs(@Query('limit') limit?: string): Promise<any[]> {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 100;
      return await this.auditService.getRecentAuditLogs(limitNum);
    } catch (error) {
      throw new HttpException(
        `Failed to get recent audit logs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Export audit logs
   */
  @Post('audit/export')
  async exportAuditLogs(
    @Query('format') format: 'json' | 'csv' = 'json',
    @Query('operationType') operationType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<{ exportPath: string }> {
    try {
      const criteria: AuditSearchCriteria = {};

      if (operationType) criteria.operationType = operationType as any;
      if (startDate) criteria.startDate = new Date(startDate);
      if (endDate) criteria.endDate = new Date(endDate);

      const exportPath = await this.auditService.exportAuditLogs(criteria, format);

      return { exportPath };
    } catch (error) {
      throw new HttpException(
        `Failed to export audit logs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Clean up old audit logs
   */
  @Post('audit/cleanup')
  async cleanupOldAuditLogs(@Query('retentionDays') retentionDays?: string): Promise<{ cleanedCount: number }> {
    try {
      const days = retentionDays ? parseInt(retentionDays, 10) : 90;
      const cleanedCount = await this.auditService.cleanupOldAuditLogs(days);

      return { cleanedCount };
    } catch (error) {
      throw new HttpException(
        `Failed to cleanup audit logs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Clean up old resolved failures
   */
  @Post('errors/cleanup')
  async cleanupOldFailures(): Promise<{ cleanedCount: number }> {
    try {
      const cleanedCount = this.errorHandlerService.cleanupOldFailures();

      return { cleanedCount };
    } catch (error) {
      throw new HttpException(
        `Failed to cleanup old failures: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Record performance metric (for testing purposes)
   */
  @Post('metrics/record')
  async recordPerformanceMetric(
    @Query('operation') operation: string,
    @Query('duration') duration: string,
    @Query('success') success: string
  ): Promise<{ success: boolean }> {
    try {
      const durationMs = parseInt(duration, 10);
      const isSuccess = success === 'true';

      this.monitoringService.recordPerformanceMetric(operation, durationMs, isSuccess);

      return { success: true };
    } catch (error) {
      throw new HttpException(
        `Failed to record performance metric: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Simple health check endpoint (returns 200 OK if service is running)
   */
  @Get('ping')
  async ping(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get system uptime and basic info
   */
  @Get('info')
  async getSystemInfo(): Promise<{
    uptime: number;
    version: string;
    environment: string;
    timestamp: string;
  }> {
    return {
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    };
  }
}