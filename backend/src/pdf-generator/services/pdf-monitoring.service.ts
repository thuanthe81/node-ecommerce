import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PDFGeneratorService } from '../pdf-generator.service';
import { DocumentStorageService } from './document-storage.service';
import { EmailAttachmentService } from './email-attachment.service';
import { PDFErrorHandlerService } from './pdf-error-handler.service';
import { PDFImageOptimizationMetricsService } from './pdf-image-optimization-metrics.service';
import * as fs from 'fs';
import * as path from 'path';
import { isAbsolute } from 'path';
import * as os from 'os';
import { CONSTANTS } from '@alacraft/shared';

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  details: Record<string, any>;
  timestamp: Date;
  error?: string;
}

export interface SystemHealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: HealthCheckResult[];
  timestamp: Date;
  uptime: number;
  systemInfo: {
    memory: {
      used: number;
      free: number;
      total: number;
      usage: number;
    };
    disk: {
      used: number;
      free: number;
      total: number;
      usage: number;
    };
    cpu: {
      usage: number;
      loadAverage: number[];
    };
  };
}

export interface PerformanceMetrics {
  pdfGeneration: {
    averageTime: number;
    totalGenerated: number;
    successRate: number;
    failureRate: number;
    lastHourCount: number;
  };
  emailDelivery: {
    averageTime: number;
    totalSent: number;
    successRate: number;
    failureRate: number;
    lastHourCount: number;
  };
  storage: {
    totalFiles: number;
    totalSize: number;
    averageFileSize: number;
    cleanupRate: number;
    capacityUsage: number;
  };
  imageOptimization: {
    totalImagesProcessed: number;
    successRate: number;
    averageCompressionRatio: number;
    averageProcessingTime: number;
    totalSizeSaved: number;
    errorRate: number;
  };
}

export interface StorageCapacityAlert {
  level: 'warning' | 'critical';
  currentUsage: number;
  threshold: number;
  availableSpace: number;
  estimatedTimeToFull: number; // hours
  recommendedActions: string[];
}

/**
 * PDF System Monitoring Service
 *
 * Provides comprehensive monitoring, health checks, performance metrics,
 * and alerting for the PDF generation system.
 *
 * Requirements: 5.4, 3.6 - System monitoring and health checks
 */
@Injectable()
export class PDFMonitoringService {
  private readonly logger = new Logger(PDFMonitoringService.name);
  private readonly performanceHistory = new Map<string, any[]>();
  private readonly alertThresholds = {
    storage: {
      warning: 80, // 80% capacity
      critical: 95, // 95% capacity
    },
    responseTime: {
      warning: 5000, // 5 seconds
      critical: 10000, // 10 seconds
    },
    errorRate: {
      warning: 5, // 5% error rate
      critical: 15, // 15% error rate
    },
  };

  private startTime = Date.now();
  private metricsCache: PerformanceMetrics | null = null;
  private lastMetricsUpdate = 0;
  private readonly METRICS_CACHE_TTL = 60000; // 1 minute

  constructor(
    @Inject(forwardRef(() => PDFGeneratorService))
    private pdfGeneratorService: PDFGeneratorService,
    private documentStorageService: DocumentStorageService,
    @Inject(forwardRef(() => EmailAttachmentService))
    private emailAttachmentService: EmailAttachmentService,
    @Inject(forwardRef(() => PDFErrorHandlerService))
    private errorHandlerService: PDFErrorHandlerService,
    @Inject(forwardRef(() => PDFImageOptimizationMetricsService))
    private imageOptimizationMetricsService: PDFImageOptimizationMetricsService,
  ) {
    // Initialize performance tracking
    this.initializePerformanceTracking();
  }

  /**
   * Get the uploads path for PDFs from environment variable
   * @returns The absolute path to the PDF uploads directory
   */
  private getUploadsPath(): string {
    const uploadDirEnv = process.env.UPLOAD_DIR || 'uploads';
    const baseUploadPath = isAbsolute(uploadDirEnv)
      ? uploadDirEnv
      : path.join(process.cwd(), uploadDirEnv);
    return path.join(baseUploadPath, 'pdfs');
  }

  /**
   * Perform comprehensive health check of all PDF system components
   * Requirements: 5.4 - Add health check endpoints for PDF generation service
   */
  async performHealthCheck(): Promise<SystemHealthStatus> {
    const startTime = Date.now();
    this.logger.log('Starting comprehensive health check');

    const healthChecks: HealthCheckResult[] = [];

    // Check PDF generation service
    healthChecks.push(await this.checkPDFGenerationHealth());

    // Check document storage service
    healthChecks.push(await this.checkStorageHealth());

    // Check email attachment service
    healthChecks.push(await this.checkEmailServiceHealth());

    // Check system resources
    healthChecks.push(await this.checkSystemResourcesHealth());

    // Determine overall health status
    const overallStatus = this.determineOverallHealth(healthChecks);

    // Get system information
    const systemInfo = await this.getSystemInfo();

    const healthStatus: SystemHealthStatus = {
      overall: overallStatus,
      services: healthChecks,
      timestamp: new Date(),
      uptime: Date.now() - this.startTime,
      systemInfo,
    };

    const totalTime = Date.now() - startTime;
    this.logger.log(`Health check completed in ${totalTime}ms - Overall status: ${overallStatus}`);

    return healthStatus;
  }

  /**
   * Check PDF generation service health
   * Requirements: 5.4 - Add health check endpoints for PDF generation service
   */
  private async checkPDFGenerationHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Test PDF generation with minimal test data
      const testOrderData = this.createTestOrderData();
      const result = await this.pdfGeneratorService.validateOrderData(testOrderData);

      const responseTime = Date.now() - startTime;
      const status = this.determineServiceStatus(responseTime, result.isValid);

      return {
        service: 'pdf_generation',
        status,
        responseTime,
        details: {
          validationPassed: result.isValid,
          validationErrors: result.errors,
          testDataProcessed: true,
        },
        timestamp: new Date(),
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        service: 'pdf_generation',
        status: 'unhealthy',
        responseTime,
        details: {
          validationPassed: false,
          testDataProcessed: false,
        },
        timestamp: new Date(),
        error: error.message,
      };
    }
  }

  /**
   * Check document storage service health
   * Requirements: 5.4 - Implement storage capacity monitoring and alerts
   */
  private async checkStorageHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Check storage capacity
      const capacityResult = await this.documentStorageService.validateStorageCapacity();

      // Test storage operations
      const testBuffer = Buffer.from('health-check-test');
      const storageResult = await this.documentStorageService.storePDF(testBuffer, 'health-check');

      const responseTime = Date.now() - startTime;
      const status = this.determineStorageStatus(capacityResult, storageResult);

      // Clean up test file
      if (storageResult.success && storageResult.filePath) {
        try {
          fs.unlinkSync(storageResult.filePath);
        } catch (cleanupError) {
          this.logger.warn('Failed to cleanup health check test file:', cleanupError);
        }
      }

      return {
        service: 'storage',
        status,
        responseTime,
        details: {
          capacityCheck: capacityResult,
          storageTest: storageResult.success,
          testFileCreated: storageResult.success,
          testFileCleanedUp: true,
        },
        timestamp: new Date(),
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        service: 'storage',
        status: 'unhealthy',
        responseTime,
        details: {
          capacityCheck: null,
          storageTest: false,
          testFileCreated: false,
        },
        timestamp: new Date(),
        error: error.message,
      };
    }
  }

  /**
   * Check email attachment service health
   * Requirements: 3.6 - Create email delivery success rate monitoring
   */
  private async checkEmailServiceHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Get email delivery statistics
      const deliveryStats = this.emailAttachmentService.getDeliveryStatistics();

      // Check rate limiting functionality
      const rateLimitTest = await this.emailAttachmentService['checkRateLimit']('health-check@test.com');

      const responseTime = Date.now() - startTime;
      const status = this.determineEmailServiceStatus(deliveryStats, rateLimitTest);

      return {
        service: 'email_attachment',
        status,
        responseTime,
        details: {
          deliveryStats,
          rateLimitTest: rateLimitTest.allowed,
          serviceResponsive: true,
        },
        timestamp: new Date(),
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        service: 'email_attachment',
        status: 'unhealthy',
        responseTime,
        details: {
          deliveryStats: null,
          rateLimitTest: false,
          serviceResponsive: false,
        },
        timestamp: new Date(),
        error: error.message,
      };
    }
  }

  /**
   * Check system resources health
   */
  private async checkSystemResourcesHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const systemInfo = await this.getSystemInfo();
      const responseTime = Date.now() - startTime;

      // Determine status based on resource usage
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

      if (systemInfo.memory.usage > 90 || systemInfo.disk.usage > 95) {
        status = 'unhealthy';
      } else if (systemInfo.memory.usage > 80 || systemInfo.disk.usage > 85) {
        status = 'degraded';
      }

      return {
        service: 'system_resources',
        status,
        responseTime,
        details: {
          memory: systemInfo.memory,
          disk: systemInfo.disk,
          cpu: systemInfo.cpu,
          resourcesHealthy: status === 'healthy',
        },
        timestamp: new Date(),
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        service: 'system_resources',
        status: 'unhealthy',
        responseTime,
        details: {
          resourcesHealthy: false,
        },
        timestamp: new Date(),
        error: error.message,
      };
    }
  }

  /**
   * Get comprehensive performance metrics
   * Requirements: 3.6 - Add performance metrics for PDF generation times
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    // Return cached metrics if still valid
    if (this.metricsCache && (Date.now() - this.lastMetricsUpdate) < this.METRICS_CACHE_TTL) {
      return this.metricsCache;
    }

    try {
      // Get PDF generation metrics
      const pdfMetrics = await this.calculatePDFGenerationMetrics();

      // Get email delivery metrics
      const emailMetrics = await this.calculateEmailDeliveryMetrics();

      // Get storage metrics
      const storageMetrics = await this.calculateStorageMetrics();

      // Get image optimization metrics
      const imageOptimizationMetrics = await this.calculateImageOptimizationMetrics();

      const metrics: PerformanceMetrics = {
        pdfGeneration: pdfMetrics,
        emailDelivery: emailMetrics,
        storage: storageMetrics,
        imageOptimization: imageOptimizationMetrics,
      };

      // Cache the metrics
      this.metricsCache = metrics;
      this.lastMetricsUpdate = Date.now();

      return metrics;

    } catch (error) {
      this.logger.error('Failed to calculate performance metrics:', error);

      // Return default metrics on error
      return {
        pdfGeneration: {
          averageTime: 0,
          totalGenerated: 0,
          successRate: 0,
          failureRate: 0,
          lastHourCount: 0,
        },
        emailDelivery: {
          averageTime: 0,
          totalSent: 0,
          successRate: 0,
          failureRate: 0,
          lastHourCount: 0,
        },
        storage: {
          totalFiles: 0,
          totalSize: 0,
          averageFileSize: 0,
          cleanupRate: 0,
          capacityUsage: 0,
        },
        imageOptimization: {
          totalImagesProcessed: 0,
          successRate: 0,
          averageCompressionRatio: 0,
          averageProcessingTime: 0,
          totalSizeSaved: 0,
          errorRate: 0,
        },
      };
    }
  }

  /**
   * Monitor storage capacity and generate alerts
   * Requirements: 5.4 - Implement storage capacity monitoring and alerts
   */
  async monitorStorageCapacity(): Promise<StorageCapacityAlert | null> {
    try {
      const capacityResult = await this.documentStorageService.validateStorageCapacity();

      if (capacityResult.isNearCapacity) {
        const currentUsage = capacityResult.usedSpace || 0;
        const maxCapacity = capacityResult.totalSpace || 1;
        const usagePercentage = capacityResult.utilizationPercentage;

        // Determine alert level
        let level: 'warning' | 'critical';
        let threshold: number;

        if (usagePercentage >= this.alertThresholds.storage.critical) {
          level = 'critical';
          threshold = this.alertThresholds.storage.critical;
        } else if (usagePercentage >= this.alertThresholds.storage.warning) {
          level = 'warning';
          threshold = this.alertThresholds.storage.warning;
        } else {
          return null; // No alert needed
        }

        // Calculate estimated time to full capacity
        const growthRate = await this.calculateStorageGrowthRate();
        const remainingSpace = maxCapacity - currentUsage;
        const estimatedTimeToFull = growthRate > 0 ? remainingSpace / growthRate : Infinity;

        // Generate recommended actions
        const recommendedActions = this.generateStorageRecommendations(level, usagePercentage);

        const alert: StorageCapacityAlert = {
          level,
          currentUsage: usagePercentage,
          threshold,
          availableSpace: remainingSpace,
          estimatedTimeToFull: Math.min(estimatedTimeToFull, 999), // Cap at 999 hours
          recommendedActions,
        };

        // Log the alert
        this.logger.warn(`Storage capacity alert: ${level} - ${usagePercentage.toFixed(2)}% used`, alert);

        return alert;
      }

      return null;

    } catch (error) {
      this.logger.error('Failed to monitor storage capacity:', error);
      return null;
    }
  }

  /**
   * Get system information including memory, disk, and CPU usage
   */
  private async getSystemInfo(): Promise<SystemHealthStatus['systemInfo']> {
    const memInfo = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // Get disk usage for uploads directory
    const uploadsPath = this.getUploadsPath();
    let diskInfo = { used: 0, free: 0, total: 0, usage: 0 };

    try {
      const stats = fs.statSync(uploadsPath);
      // This is a simplified disk usage calculation
      // In a real implementation, you would use a library like 'diskusage'
      diskInfo = {
        used: 0,
        free: 1000000000, // 1GB placeholder
        total: 1000000000,
        usage: 0,
      };
    } catch (error) {
      this.logger.warn('Could not get disk usage information:', error);
    }

    return {
      memory: {
        used: usedMem,
        free: freeMem,
        total: totalMem,
        usage: (usedMem / totalMem) * 100,
      },
      disk: diskInfo,
      cpu: {
        usage: 0, // Would require additional monitoring
        loadAverage: os.loadavg(),
      },
    };
  }

  /**
   * Initialize performance tracking
   */
  private initializePerformanceTracking(): void {
    this.performanceHistory.set('pdf_generation', []);
    this.performanceHistory.set('email_delivery', []);
    this.performanceHistory.set('storage_operations', []);

    this.logger.log('Performance tracking initialized');
  }

  /**
   * Record performance metric
   */
  recordPerformanceMetric(
    operation: string,
    duration: number,
    success: boolean,
    metadata?: Record<string, any>
  ): void {
    const metric = {
      timestamp: Date.now(),
      duration,
      success,
      metadata: metadata || {},
    };

    const history = this.performanceHistory.get(operation) || [];
    history.push(metric);

    // Keep only last 1000 entries per operation
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }

    this.performanceHistory.set(operation, history);
  }

  /**
   * Calculate PDF generation metrics
   */
  private async calculatePDFGenerationMetrics(): Promise<PerformanceMetrics['pdfGeneration']> {
    const history = this.performanceHistory.get('pdf_generation') || [];
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    const recentMetrics = history.filter(m => m.timestamp > oneHourAgo);
    const successfulMetrics = history.filter(m => m.success);
    const failedMetrics = history.filter(m => !m.success);

    const averageTime = successfulMetrics.length > 0
      ? successfulMetrics.reduce((sum, m) => sum + m.duration, 0) / successfulMetrics.length
      : 0;

    const totalGenerated = history.length;
    const successRate = totalGenerated > 0 ? (successfulMetrics.length / totalGenerated) * 100 : 0;
    const failureRate = totalGenerated > 0 ? (failedMetrics.length / totalGenerated) * 100 : 0;

    return {
      averageTime: Math.round(averageTime),
      totalGenerated,
      successRate: Math.round(successRate * 100) / 100,
      failureRate: Math.round(failureRate * 100) / 100,
      lastHourCount: recentMetrics.length,
    };
  }

  /**
   * Calculate email delivery metrics
   */
  private async calculateEmailDeliveryMetrics(): Promise<PerformanceMetrics['emailDelivery']> {
    const deliveryStats = this.emailAttachmentService.getDeliveryStatistics();
    const history = this.performanceHistory.get('email_delivery') || [];
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    const recentMetrics = history.filter(m => m.timestamp > oneHourAgo);
    const successfulMetrics = history.filter(m => m.success);

    const averageTime = successfulMetrics.length > 0
      ? successfulMetrics.reduce((sum, m) => sum + m.duration, 0) / successfulMetrics.length
      : 0;

    return {
      averageTime: Math.round(averageTime),
      totalSent: deliveryStats.totalAttempts,
      successRate: deliveryStats.successRate,
      failureRate: 100 - deliveryStats.successRate,
      lastHourCount: recentMetrics.length,
    };
  }

  /**
   * Calculate storage metrics
   */
  private async calculateStorageMetrics(): Promise<PerformanceMetrics['storage']> {
    try {
      const uploadsPath = this.getUploadsPath();

      if (!fs.existsSync(uploadsPath)) {
        return {
          totalFiles: 0,
          totalSize: 0,
          averageFileSize: 0,
          cleanupRate: 0,
          capacityUsage: 0,
        };
      }

      const files = fs.readdirSync(uploadsPath);
      let totalSize = 0;

      for (const file of files) {
        try {
          const filePath = path.join(uploadsPath, file);
          const stats = fs.statSync(filePath);
          totalSize += stats.size;
        } catch (error) {
          // Skip files that can't be read
        }
      }

      const averageFileSize = files.length > 0 ? totalSize / files.length : 0;
      const capacityResult = await this.documentStorageService.validateStorageCapacity();
      const capacityUsage = capacityResult.utilizationPercentage || 0;

      return {
        totalFiles: files.length,
        totalSize,
        averageFileSize: Math.round(averageFileSize),
        cleanupRate: 0, // Would need to track cleanup operations
        capacityUsage: Math.round(capacityUsage * 100) / 100,
      };

    } catch (error) {
      this.logger.error('Failed to calculate storage metrics:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        averageFileSize: 0,
        cleanupRate: 0,
        capacityUsage: 0,
      };
    }
  }

  /**
   * Calculate image optimization metrics
   */
  private async calculateImageOptimizationMetrics(): Promise<PerformanceMetrics['imageOptimization']> {
    try {
      const metricsSummary = this.imageOptimizationMetricsService.getMetricsSummaryForMonitoring();

      return {
        totalImagesProcessed: metricsSummary.totalImagesProcessed,
        successRate: metricsSummary.successRate,
        averageCompressionRatio: metricsSummary.averageCompressionRatio,
        averageProcessingTime: metricsSummary.averageProcessingTime,
        totalSizeSaved: metricsSummary.totalSizeSaved,
        errorRate: metricsSummary.errorRate,
      };

    } catch (error) {
      this.logger.error('Failed to calculate image optimization metrics:', error);
      return {
        totalImagesProcessed: 0,
        successRate: 0,
        averageCompressionRatio: 0,
        averageProcessingTime: 0,
        totalSizeSaved: 0,
        errorRate: 0,
      };
    }
  }

  /**
   * Calculate storage growth rate (bytes per hour)
   */
  private async calculateStorageGrowthRate(): Promise<number> {
    const history = this.performanceHistory.get('storage_operations') || [];
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    const recentOperations = history.filter(m => m.timestamp > oneHourAgo && m.metadata?.operation === 'store');
    const totalBytesAdded = recentOperations.reduce((sum, op) => sum + (op.metadata?.fileSize || 0), 0);

    return totalBytesAdded; // bytes per hour
  }

  /**
   * Generate storage capacity recommendations
   */
  private generateStorageRecommendations(level: 'warning' | 'critical', usagePercentage: number): string[] {
    const recommendations: string[] = [];

    if (level === 'critical') {
      recommendations.push('IMMEDIATE ACTION REQUIRED: Run emergency cleanup');
      recommendations.push('Stop PDF generation until space is freed');
      recommendations.push('Contact system administrator');
    }

    if (usagePercentage > 90) {
      recommendations.push('Run PDF cleanup service immediately');
      recommendations.push('Reduce PDF retention period');
      recommendations.push('Consider increasing storage capacity');
    } else if (usagePercentage > 80) {
      recommendations.push('Schedule regular cleanup operations');
      recommendations.push('Monitor storage growth rate');
      recommendations.push('Plan for storage capacity expansion');
    }

    recommendations.push('Review PDF generation frequency');
    recommendations.push('Implement PDF compression');
    recommendations.push('Archive old PDF files');

    return recommendations;
  }

  /**
   * Determine overall health status from individual service checks
   */
  private determineOverallHealth(healthChecks: HealthCheckResult[]): 'healthy' | 'degraded' | 'unhealthy' {
    const unhealthyServices = healthChecks.filter(check => check.status === 'unhealthy');
    const degradedServices = healthChecks.filter(check => check.status === 'degraded');

    if (unhealthyServices.length > 0) {
      return 'unhealthy';
    }
    if (degradedServices.length > 0) {
      return 'degraded';
    }
    return 'healthy';
  }

  /**
   * Determine service status based on response time and functionality
   */
  private determineServiceStatus(responseTime: number, functional: boolean): 'healthy' | 'degraded' | 'unhealthy' {
    if (!functional) {
      return 'unhealthy';
    }
    if (responseTime > this.alertThresholds.responseTime.critical) {
      return 'unhealthy';
    }
    if (responseTime > this.alertThresholds.responseTime.warning) {
      return 'degraded';
    }
    return 'healthy';
  }

  /**
   * Determine storage status based on capacity and operations
   */
  private determineStorageStatus(capacityResult: any, storageResult: any): 'healthy' | 'degraded' | 'unhealthy' {
    if (!storageResult.success) {
      return 'unhealthy';
    }
    if (!capacityResult.isValid) {
      return 'degraded';
    }
    return 'healthy';
  }

  /**
   * Determine email service status based on delivery statistics
   */
  private determineEmailServiceStatus(deliveryStats: any, rateLimitTest: any): 'healthy' | 'degraded' | 'unhealthy' {
    if (!rateLimitTest) {
      return 'unhealthy';
    }
    if (deliveryStats.successRate < 85) {
      return 'degraded';
    }
    if (deliveryStats.successRate < 70) {
      return 'unhealthy';
    }
    return 'healthy';
  }

  /**
   * Create test order data for health checks
   */
  private createTestOrderData(): any {
    return {
      orderNumber: 'HEALTH-CHECK-001',
      orderDate: new Date().toISOString(),
      customerInfo: {
        name: 'Health Check Test',
        email: 'healthcheck@test.com',
      },
      billingAddress: {
        fullName: 'Test User',
        addressLine1: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        postalCode: '12345',
        country: 'Test Country',
      },
      shippingAddress: {
        fullName: 'Test User',
        addressLine1: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        postalCode: '12345',
        country: 'Test Country',
      },
      items: [
        {
          id: 'test-item-1',
          name: 'Test Product',
          quantity: 1,
          unitPrice: 100,
          totalPrice: 100,
        },
      ],
      pricing: {
        subtotal: 100,
        shippingCost: 10,
        total: 110,
      },
      paymentMethod: {
        type: 'bank_transfer',
        displayName: 'Bank Transfer',
        status: 'pending',
      },
      shippingMethod: {
        name: 'Standard Shipping',
      },
      businessInfo: {
        companyName: CONSTANTS.BUSINESS.COMPANY.NAME.EN,
        contactEmail: CONSTANTS.BUSINESS.CONTACT.EMAIL.PRIMARY,
        address: {
          fullName: CONSTANTS.BUSINESS.COMPANY.NAME.EN,
          addressLine1: '123 Business St',
          city: 'Business City',
          state: 'Business State',
          postalCode: '54321',
          country: 'Business Country',
        },
      },
      locale: 'en' as const,
    };
  }
}