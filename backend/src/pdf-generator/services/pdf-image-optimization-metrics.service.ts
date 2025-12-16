import { Injectable, Logger } from '@nestjs/common';
import {
  OptimizationMetrics,
  OptimizedImageResult,
  BatchOptimizationResult,
  PerformanceMonitoringData,
  FallbackResult
} from '../types/image-optimization.types';

/**
 * PDF Image Optimization Metrics Service
 *
 * Handles collection, tracking, and analysis of image optimization metrics:
 * - Tracks optimization performance and effectiveness
 * - Collects metrics on original size, optimized size, compression ratio, and processing time
 * - Provides aggregated statistics for monitoring and analysis
 * - Integrates with PDFMonitoringService for comprehensive system monitoring
 *
 * Requirements: 4.5 - Add performance metrics for image optimization effectiveness
 */
@Injectable()
export class PDFImageOptimizationMetricsService {
  private readonly logger = new Logger(PDFImageOptimizationMetricsService.name);

  // In-memory metrics storage (in production, consider using Redis or database)
  private readonly metricsHistory: OptimizationMetrics[] = [];
  private readonly performanceData: PerformanceMonitoringData[] = [];
  private readonly MAX_HISTORY_SIZE = 1000; // Keep last 1000 metric entries

  // Current session metrics
  private currentSessionMetrics: OptimizationMetrics = this.initializeEmptyMetrics();

  constructor() {
    this.logger.log('PDF Image Optimization Metrics Service initialized');
  }

  /**
   * Record metrics from a single image optimization operation
   * @param result - Result of image optimization
   * @param operationId - Unique identifier for the operation
   */
  recordImageOptimization(result: OptimizedImageResult, operationId?: string): void {
    try {
      this.logger.debug(`Recording image optimization metrics for operation: ${operationId || 'unknown'}`);

      // Update current session metrics
      this.currentSessionMetrics.totalImagesProcessed++;
      this.currentSessionMetrics.totalOriginalSize += result.originalSize;
      this.currentSessionMetrics.totalOptimizedSize += result.optimizedSize;
      this.currentSessionMetrics.totalProcessingTime += result.processingTime;

      if (result.error) {
        this.currentSessionMetrics.failedOptimizations++;

        // Track error types
        const errorType = this.categorizeError(result.error);
        this.currentSessionMetrics.errorBreakdown[errorType] =
          (this.currentSessionMetrics.errorBreakdown[errorType] || 0) + 1;
      } else {
        this.currentSessionMetrics.successfulOptimizations++;
      }

      // Update format breakdown
      const format = result.format || 'unknown';
      if (!this.currentSessionMetrics.formatBreakdown[format]) {
        this.currentSessionMetrics.formatBreakdown[format] = {
          count: 0,
          originalSize: 0,
          optimizedSize: 0,
          compressionRatio: 0
        };
      }

      const formatStats = this.currentSessionMetrics.formatBreakdown[format];
      formatStats.count++;
      formatStats.originalSize += result.originalSize;
      formatStats.optimizedSize += result.optimizedSize;
      formatStats.compressionRatio = formatStats.originalSize > 0 ?
        (formatStats.originalSize - formatStats.optimizedSize) / formatStats.originalSize : 0;

      // Update content type breakdown
      const contentType = result.metadata?.contentType || 'unknown';
      if (!this.currentSessionMetrics.contentTypeBreakdown[contentType]) {
        this.currentSessionMetrics.contentTypeBreakdown[contentType] = {
          count: 0,
          originalSize: 0,
          optimizedSize: 0,
          compressionRatio: 0
        };
      }

      const contentStats = this.currentSessionMetrics.contentTypeBreakdown[contentType];
      contentStats.count++;
      contentStats.originalSize += result.originalSize;
      contentStats.optimizedSize += result.optimizedSize;
      contentStats.compressionRatio = contentStats.originalSize > 0 ?
        (contentStats.originalSize - contentStats.optimizedSize) / contentStats.originalSize : 0;

      // Update overall compression ratio and average processing time
      this.updateAggregatedMetrics();

      this.logger.debug(`Metrics updated: ${this.currentSessionMetrics.totalImagesProcessed} images processed, ` +
        `${(this.currentSessionMetrics.overallCompressionRatio * 100).toFixed(1)}% overall compression`);

    } catch (error) {
      this.logger.error(`Failed to record image optimization metrics: ${error.message}`);
    }
  }

  /**
   * Record metrics from a batch optimization operation
   * @param batchResult - Result of batch optimization
   * @param operationId - Unique identifier for the batch operation
   */
  recordBatchOptimization(batchResult: BatchOptimizationResult, operationId?: string): void {
    try {
      this.logger.debug(`Recording batch optimization metrics for operation: ${operationId || 'unknown'}`);

      // Record each individual result
      batchResult.results.forEach((result, index) => {
        this.recordImageOptimization(result, `${operationId || 'batch'}-${index}`);
      });

      // Log batch summary
      this.logger.log(`Batch optimization recorded: ${batchResult.summary.totalImages} images, ` +
        `${batchResult.summary.successfulImages} successful, ${batchResult.summary.failedImages} failed, ` +
        `${this.formatFileSize(batchResult.summary.totalSizeReduction)} total reduction`);

    } catch (error) {
      this.logger.error(`Failed to record batch optimization metrics: ${error.message}`);
    }
  }

  /**
   * Record performance monitoring data for an optimization operation
   * @param data - Performance monitoring data
   */
  recordPerformanceData(data: PerformanceMonitoringData): void {
    try {
      this.performanceData.push(data);

      // Keep only recent performance data
      if (this.performanceData.length > this.MAX_HISTORY_SIZE) {
        this.performanceData.splice(0, this.performanceData.length - this.MAX_HISTORY_SIZE);
      }

      this.logger.debug(`Performance data recorded for operation ${data.operationId}: ` +
        `${data.duration}ms, ${this.formatFileSize(data.memoryUsage.peak)} peak memory`);

    } catch (error) {
      this.logger.error(`Failed to record performance data: ${error.message}`);
    }
  }

  /**
   * Record fallback operation metrics for error handling analysis
   * @param fallbackResult - Result of fallback operation
   * @param operationId - Unique identifier for the operation
   */
  recordFallbackOperation(fallbackResult: FallbackResult, operationId?: string): void {
    try {
      this.logger.debug(`Recording fallback operation metrics for operation: ${operationId || 'unknown'}`);

      // Track fallback operations in error breakdown
      const fallbackType = `fallback_${fallbackResult.fallbackStrategy}`;
      this.currentSessionMetrics.errorBreakdown[fallbackType] =
        (this.currentSessionMetrics.errorBreakdown[fallbackType] || 0) + 1;

      // If fallback succeeded, record the result
      if (fallbackResult.success && fallbackResult.result) {
        this.recordImageOptimization(fallbackResult.result, `${operationId}-fallback`);
      }

      this.logger.debug(`Fallback metrics recorded: strategy=${fallbackResult.fallbackStrategy}, ` +
        `success=${fallbackResult.success}, attempts=${fallbackResult.retryAttempts}`);

    } catch (error) {
      this.logger.error(`Failed to record fallback operation metrics: ${error.message}`);
    }
  }

  /**
   * Get current session optimization metrics
   * @returns Current optimization metrics
   */
  getCurrentMetrics(): OptimizationMetrics {
    return { ...this.currentSessionMetrics };
  }

  /**
   * Get aggregated metrics for a specific time period
   * @param hours - Number of hours to look back (default: 24)
   * @returns Aggregated metrics for the time period
   */
  getMetricsForPeriod(hours: number = 24): OptimizationMetrics {
    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));

    const periodMetrics = this.metricsHistory.filter(
      metrics => metrics.timestamp >= cutoffTime
    );

    if (periodMetrics.length === 0) {
      return this.initializeEmptyMetrics();
    }

    // Aggregate metrics from the period
    return this.aggregateMetrics(periodMetrics);
  }

  /**
   * Get performance statistics for optimization operations
   * @param hours - Number of hours to look back (default: 24)
   * @returns Performance statistics
   */
  getPerformanceStatistics(hours: number = 24): {
    averageProcessingTime: number;
    averageMemoryUsage: number;
    averageCpuUsage: number;
    totalOperations: number;
    successRate: number;
    operationsByType: { [type: string]: number };
  } {
    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));

    const recentData = this.performanceData.filter(
      data => data.startTime >= cutoffTime
    );

    if (recentData.length === 0) {
      return {
        averageProcessingTime: 0,
        averageMemoryUsage: 0,
        averageCpuUsage: 0,
        totalOperations: 0,
        successRate: 0,
        operationsByType: {}
      };
    }

    const totalOperations = recentData.length;
    const successfulOperations = recentData.filter(data => data.success).length;
    const successRate = (successfulOperations / totalOperations) * 100;

    const averageProcessingTime = recentData.reduce((sum, data) => sum + data.duration, 0) / totalOperations;
    const averageMemoryUsage = recentData.reduce((sum, data) => sum + data.memoryUsage.average, 0) / totalOperations;
    const averageCpuUsage = recentData.reduce((sum, data) => sum + data.cpuUsage.utilization, 0) / totalOperations;

    const operationsByType: { [type: string]: number } = {};
    recentData.forEach(data => {
      operationsByType[data.operationType] = (operationsByType[data.operationType] || 0) + 1;
    });

    return {
      averageProcessingTime: Math.round(averageProcessingTime),
      averageMemoryUsage: Math.round(averageMemoryUsage),
      averageCpuUsage: Math.round(averageCpuUsage * 100) / 100,
      totalOperations,
      successRate: Math.round(successRate * 100) / 100,
      operationsByType
    };
  }

  /**
   * Get optimization effectiveness metrics
   * @returns Effectiveness metrics including compression ratios and size savings
   */
  getOptimizationEffectiveness(): {
    overallCompressionRatio: number;
    totalSizeSaved: number;
    averageSizeReduction: number;
    bestPerformingFormat: string;
    bestPerformingContentType: string;
    optimizationTrends: {
      period: string;
      compressionRatio: number;
      processingTime: number;
    }[];
  } {
    const metrics = this.currentSessionMetrics;

    const totalSizeSaved = metrics.totalOriginalSize - metrics.totalOptimizedSize;
    const averageSizeReduction = metrics.totalImagesProcessed > 0 ?
      totalSizeSaved / metrics.totalImagesProcessed : 0;

    // Find best performing format
    let bestFormat = 'unknown';
    let bestFormatRatio = 0;
    Object.entries(metrics.formatBreakdown).forEach(([format, stats]) => {
      if (stats.compressionRatio > bestFormatRatio) {
        bestFormatRatio = stats.compressionRatio;
        bestFormat = format;
      }
    });

    // Find best performing content type
    let bestContentType = 'unknown';
    let bestContentRatio = 0;
    Object.entries(metrics.contentTypeBreakdown).forEach(([contentType, stats]) => {
      if (stats.compressionRatio > bestContentRatio) {
        bestContentRatio = stats.compressionRatio;
        bestContentType = contentType;
      }
    });

    // Generate optimization trends (simplified - in production, use time-series data)
    const optimizationTrends = this.generateOptimizationTrends();

    return {
      overallCompressionRatio: metrics.overallCompressionRatio,
      totalSizeSaved,
      averageSizeReduction,
      bestPerformingFormat: bestFormat,
      bestPerformingContentType: bestContentType,
      optimizationTrends
    };
  }

  /**
   * Reset current session metrics (useful for testing or periodic resets)
   */
  resetCurrentMetrics(): void {
    this.logger.log('Resetting current session metrics');

    // Archive current metrics before reset
    if (this.currentSessionMetrics.totalImagesProcessed > 0) {
      this.archiveCurrentMetrics();
    }

    this.currentSessionMetrics = this.initializeEmptyMetrics();
  }

  /**
   * Get metrics summary for integration with PDFMonitoringService
   * @returns Metrics summary suitable for monitoring dashboard
   */
  getMetricsSummaryForMonitoring(): {
    totalImagesProcessed: number;
    successRate: number;
    averageCompressionRatio: number;
    averageProcessingTime: number;
    totalSizeSaved: number;
    errorRate: number;
    lastUpdated: Date;
  } {
    const metrics = this.currentSessionMetrics;
    const totalImages = metrics.totalImagesProcessed;
    const successRate = totalImages > 0 ?
      (metrics.successfulOptimizations / totalImages) * 100 : 0;
    const errorRate = totalImages > 0 ?
      (metrics.failedOptimizations / totalImages) * 100 : 0;
    const totalSizeSaved = metrics.totalOriginalSize - metrics.totalOptimizedSize;

    return {
      totalImagesProcessed: totalImages,
      successRate: Math.round(successRate * 100) / 100,
      averageCompressionRatio: Math.round(metrics.overallCompressionRatio * 10000) / 100, // Convert to percentage
      averageProcessingTime: Math.round(metrics.averageProcessingTime),
      totalSizeSaved,
      errorRate: Math.round(errorRate * 100) / 100,
      lastUpdated: metrics.timestamp
    };
  }

  /**
   * Initialize empty metrics structure
   * @returns Empty optimization metrics
   */
  private initializeEmptyMetrics(): OptimizationMetrics {
    return {
      totalImagesProcessed: 0,
      successfulOptimizations: 0,
      failedOptimizations: 0,
      totalOriginalSize: 0,
      totalOptimizedSize: 0,
      overallCompressionRatio: 0,
      averageProcessingTime: 0,
      totalProcessingTime: 0,
      formatBreakdown: {},
      contentTypeBreakdown: {},
      errorBreakdown: {},
      timestamp: new Date()
    };
  }

  /**
   * Update aggregated metrics (compression ratio and average processing time)
   */
  private updateAggregatedMetrics(): void {
    const metrics = this.currentSessionMetrics;

    // Update overall compression ratio
    metrics.overallCompressionRatio = metrics.totalOriginalSize > 0 ?
      (metrics.totalOriginalSize - metrics.totalOptimizedSize) / metrics.totalOriginalSize : 0;

    // Update average processing time
    metrics.averageProcessingTime = metrics.totalImagesProcessed > 0 ?
      metrics.totalProcessingTime / metrics.totalImagesProcessed : 0;

    // Update timestamp
    metrics.timestamp = new Date();
  }

  /**
   * Categorize error types for tracking
   * @param error - Error message
   * @returns Error category
   */
  private categorizeError(error: string): string {
    const errorLower = error.toLowerCase();

    if (errorLower.includes('not found') || errorLower.includes('file not found')) {
      return 'file_not_found';
    }
    if (errorLower.includes('fetch') || errorLower.includes('network')) {
      return 'network_error';
    }
    if (errorLower.includes('memory') || errorLower.includes('out of memory')) {
      return 'memory_error';
    }
    if (errorLower.includes('format') || errorLower.includes('invalid')) {
      return 'format_error';
    }
    if (errorLower.includes('timeout')) {
      return 'timeout_error';
    }

    return 'unknown_error';
  }

  /**
   * Aggregate multiple metrics into a single metrics object
   * @param metricsList - List of metrics to aggregate
   * @returns Aggregated metrics
   */
  private aggregateMetrics(metricsList: OptimizationMetrics[]): OptimizationMetrics {
    if (metricsList.length === 0) {
      return this.initializeEmptyMetrics();
    }

    const aggregated = this.initializeEmptyMetrics();

    metricsList.forEach(metrics => {
      aggregated.totalImagesProcessed += metrics.totalImagesProcessed;
      aggregated.successfulOptimizations += metrics.successfulOptimizations;
      aggregated.failedOptimizations += metrics.failedOptimizations;
      aggregated.totalOriginalSize += metrics.totalOriginalSize;
      aggregated.totalOptimizedSize += metrics.totalOptimizedSize;
      aggregated.totalProcessingTime += metrics.totalProcessingTime;

      // Aggregate format breakdown
      Object.entries(metrics.formatBreakdown).forEach(([format, stats]) => {
        if (!aggregated.formatBreakdown[format]) {
          aggregated.formatBreakdown[format] = {
            count: 0,
            originalSize: 0,
            optimizedSize: 0,
            compressionRatio: 0
          };
        }
        const aggStats = aggregated.formatBreakdown[format];
        aggStats.count += stats.count;
        aggStats.originalSize += stats.originalSize;
        aggStats.optimizedSize += stats.optimizedSize;
      });

      // Aggregate content type breakdown
      Object.entries(metrics.contentTypeBreakdown).forEach(([contentType, stats]) => {
        if (!aggregated.contentTypeBreakdown[contentType]) {
          aggregated.contentTypeBreakdown[contentType] = {
            count: 0,
            originalSize: 0,
            optimizedSize: 0,
            compressionRatio: 0
          };
        }
        const aggStats = aggregated.contentTypeBreakdown[contentType];
        aggStats.count += stats.count;
        aggStats.originalSize += stats.originalSize;
        aggStats.optimizedSize += stats.optimizedSize;
      });

      // Aggregate error breakdown
      Object.entries(metrics.errorBreakdown).forEach(([errorType, count]) => {
        aggregated.errorBreakdown[errorType] = (aggregated.errorBreakdown[errorType] || 0) + count;
      });
    });

    // Calculate aggregated ratios
    Object.values(aggregated.formatBreakdown).forEach(stats => {
      stats.compressionRatio = stats.originalSize > 0 ?
        (stats.originalSize - stats.optimizedSize) / stats.originalSize : 0;
    });

    Object.values(aggregated.contentTypeBreakdown).forEach(stats => {
      stats.compressionRatio = stats.originalSize > 0 ?
        (stats.originalSize - stats.optimizedSize) / stats.originalSize : 0;
    });

    // Update overall metrics
    aggregated.overallCompressionRatio = aggregated.totalOriginalSize > 0 ?
      (aggregated.totalOriginalSize - aggregated.totalOptimizedSize) / aggregated.totalOriginalSize : 0;
    aggregated.averageProcessingTime = aggregated.totalImagesProcessed > 0 ?
      aggregated.totalProcessingTime / aggregated.totalImagesProcessed : 0;
    aggregated.timestamp = new Date();

    return aggregated;
  }

  /**
   * Archive current metrics to history
   */
  private archiveCurrentMetrics(): void {
    this.metricsHistory.push({ ...this.currentSessionMetrics });

    // Keep only recent history
    if (this.metricsHistory.length > this.MAX_HISTORY_SIZE) {
      this.metricsHistory.splice(0, this.metricsHistory.length - this.MAX_HISTORY_SIZE);
    }

    this.logger.debug(`Archived metrics: ${this.currentSessionMetrics.totalImagesProcessed} images processed`);
  }

  /**
   * Generate optimization trends (simplified implementation)
   * @returns Array of trend data points
   */
  private generateOptimizationTrends(): {
    period: string;
    compressionRatio: number;
    processingTime: number;
  }[] {
    // In a production system, this would analyze historical data
    // For now, return current metrics as a single trend point
    return [
      {
        period: 'current',
        compressionRatio: this.currentSessionMetrics.overallCompressionRatio,
        processingTime: this.currentSessionMetrics.averageProcessingTime
      }
    ];
  }

  /**
   * Format file size in human-readable format
   * @param bytes - Size in bytes
   * @returns Formatted size string
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}