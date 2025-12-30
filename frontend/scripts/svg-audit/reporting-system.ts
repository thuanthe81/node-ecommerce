/**
 * Comprehensive reporting system for SVG consolidation operations
 * Integrates error handling, logging, and progress reporting
 * Requirements: 5.5
 */

import { SvgConsolidationErrorHandler, ErrorReport, ProgressReport } from './error-handler';
import { SvgConsolidationLogger, LogLevel, LogEntry } from './logger';
import { PostConsolidationReport } from './post-consolidation-validator';
import { EnhancedAuditSummary } from './audit-system';
import { ConsolidationResult } from './svg-consolidation-system';

export interface ComprehensiveReport {
  /** Report metadata */
  metadata: {
    reportId: string;
    generatedAt: Date;
    operationType: 'audit' | 'consolidation' | 'validation' | 'complete_workflow';
    duration: number; // milliseconds
    version: string;
  };

  /** Operation status */
  status: {
    overall: 'success' | 'warning' | 'error' | 'critical';
    completed: boolean;
    progress: number; // 0-100
  };

  /** Audit results (if applicable) */
  auditResults?: EnhancedAuditSummary;

  /** Consolidation results (if applicable) */
  consolidationResults?: ConsolidationResult;

  /** Validation results (if applicable) */
  validationResults?: PostConsolidationReport;

  /** Error report */
  errorReport: ErrorReport;

  /** Log summary */
  logSummary: {
    totalEntries: number;
    entriesByLevel: Record<string, number>;
    entriesByCategory: Record<string, number>;
    recentEntries: LogEntry[];
  };

  /** Performance metrics */
  performance: {
    filesProcessed: number;
    processingRate: number; // files per second
    memoryUsage?: {
      used: number;
      total: number;
      percentage: number;
    };
    peakMemoryUsage?: number;
  };

  /** Recommendations and next steps */
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };

  /** Statistics */
  statistics: {
    svgStatistics?: {
      totalFound: number;
      consolidated: number;
      remaining: number;
      consolidationRate: number;
    };
    fileStatistics: {
      totalScanned: number;
      successfullyProcessed: number;
      failed: number;
      skipped: number;
    };
    componentStatistics?: {
      generated: number;
      integrated: number;
      failed: number;
    };
  };
}

export interface ReportingOptions {
  /** Whether to include detailed logs in the report */
  includeDetailedLogs: boolean;
  /** Maximum number of recent log entries to include */
  maxRecentLogEntries: number;
  /** Whether to include performance metrics */
  includePerformanceMetrics: boolean;
  /** Whether to generate recommendations */
  generateRecommendations: boolean;
  /** Output format for saved reports */
  outputFormat: 'markdown' | 'json' | 'html';
  /** Whether to save individual component reports */
  saveComponentReports: boolean;
}

export class SvgConsolidationReportingSystem {
  private errorHandler: SvgConsolidationErrorHandler;
  private logger: SvgConsolidationLogger;
  private options: ReportingOptions;
  private startTime: Date;
  private operationType: ComprehensiveReport['metadata']['operationType'];

  constructor(
    errorHandler: SvgConsolidationErrorHandler,
    logger: SvgConsolidationLogger,
    options: Partial<ReportingOptions> = {}
  ) {
    this.errorHandler = errorHandler;
    this.logger = logger;
    this.options = {
      includeDetailedLogs: false,
      maxRecentLogEntries: 50,
      includePerformanceMetrics: true,
      generateRecommendations: true,
      outputFormat: 'markdown',
      saveComponentReports: false,
      ...options
    };
    this.startTime = new Date();
    this.operationType = 'audit';
  }

  /**
   * Set the operation type for reporting
   * @param operationType Type of operation being performed
   */
  public setOperationType(operationType: ComprehensiveReport['metadata']['operationType']): void {
    this.operationType = operationType;
  }

  /**
   * Generate a comprehensive report
   * @param auditResults Audit results (optional)
   * @param consolidationResults Consolidation results (optional)
   * @param validationResults Validation results (optional)
   * @returns Comprehensive report
   */
  public generateComprehensiveReport(
    auditResults?: EnhancedAuditSummary,
    consolidationResults?: ConsolidationResult,
    validationResults?: PostConsolidationReport
  ): ComprehensiveReport {
    const endTime = new Date();
    const duration = endTime.getTime() - this.startTime.getTime();

    // Generate error report
    const errorReport = this.errorHandler.generateErrorReport();

    // Generate log summary
    const logSummary = this.generateLogSummary();

    // Calculate performance metrics
    const performance = this.calculatePerformanceMetrics(duration, auditResults, consolidationResults);

    // Determine overall status
    const status = this.determineOverallStatus(errorReport, auditResults, consolidationResults, validationResults);

    // Generate recommendations
    const recommendations = this.options.generateRecommendations
      ? this.generateRecommendations(auditResults, consolidationResults, validationResults, errorReport)
      : { immediate: [], shortTerm: [], longTerm: [] };

    // Calculate statistics
    const statistics = this.calculateStatistics(auditResults, consolidationResults, validationResults);

    const report: ComprehensiveReport = {
      metadata: {
        reportId: this.generateReportId(),
        generatedAt: endTime,
        operationType: this.operationType,
        duration,
        version: '1.0.0'
      },
      status,
      auditResults,
      consolidationResults,
      validationResults,
      errorReport,
      logSummary,
      performance,
      recommendations,
      statistics
    };

    this.logger.info('reporting', 'Comprehensive report generated', {
      reportId: report.metadata.reportId,
      status: report.status.overall,
      duration: report.metadata.duration
    });

    return report;
  }

  /**
   * Generate log summary
   * @returns Log summary
   */
  private generateLogSummary(): ComprehensiveReport['logSummary'] {
    const summary = this.logger.generateLogSummary();
    const recentEntries = this.logger.getLogEntries()
      .slice(-this.options.maxRecentLogEntries);

    return {
      totalEntries: summary.totalEntries,
      entriesByLevel: summary.entriesByLevel,
      entriesByCategory: summary.entriesByCategory,
      recentEntries
    };
  }

  /**
   * Calculate performance metrics
   * @param duration Operation duration in milliseconds
   * @param auditResults Audit results
   * @param consolidationResults Consolidation results
   * @returns Performance metrics
   */
  private calculatePerformanceMetrics(
    duration: number,
    auditResults?: EnhancedAuditSummary,
    consolidationResults?: ConsolidationResult
  ): ComprehensiveReport['performance'] {
    let filesProcessed = 0;

    if (auditResults) {
      filesProcessed += auditResults.totalFilesScanned;
    }
    if (consolidationResults) {
      filesProcessed += consolidationResults.statistics.filesProcessed;
    }

    const processingRate = duration > 0 ? (filesProcessed / (duration / 1000)) : 0;

    const performance: ComprehensiveReport['performance'] = {
      filesProcessed,
      processingRate
    };

    // Add memory usage if available
    if (this.options.includePerformanceMetrics && typeof process !== 'undefined' && process.memoryUsage) {
      try {
        const memUsage = process.memoryUsage();
        performance.memoryUsage = {
          used: memUsage.heapUsed,
          total: memUsage.heapTotal,
          percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
        };
      } catch (error) {
        // Memory usage not available
      }
    }

    return performance;
  }

  /**
   * Determine overall status
   * @param errorReport Error report
   * @param auditResults Audit results
   * @param consolidationResults Consolidation results
   * @param validationResults Validation results
   * @returns Status information
   */
  private determineOverallStatus(
    errorReport: ErrorReport,
    auditResults?: EnhancedAuditSummary,
    consolidationResults?: ConsolidationResult,
    validationResults?: PostConsolidationReport
  ): ComprehensiveReport['status'] {
    let overall: ComprehensiveReport['status']['overall'] = 'success';
    let completed = true;
    let progress = 100;

    // Check error report status
    if (errorReport.overallStatus === 'critical') {
      overall = 'critical';
      completed = false;
      progress = 0;
    } else if (errorReport.overallStatus === 'error') {
      overall = 'error';
      completed = false;
      progress = 50;
    } else if (errorReport.overallStatus === 'warning') {
      overall = 'warning';
    }

    // Check consolidation results
    if (consolidationResults && !consolidationResults.success) {
      overall = overall === 'success' ? 'error' : overall;
      completed = false;
      progress = Math.min(progress, 75);
    }

    // Check validation results
    if (validationResults && !validationResults.isComplete) {
      overall = overall === 'success' ? 'warning' : overall;
      if (validationResults.remainingInlineSvgs > 0) {
        const completionRate = validationResults.validationStats.comparisonWithPrevious?.consolidationSuccessRate || 0;
        progress = Math.min(progress, completionRate);
      }
    }

    return {
      overall,
      completed,
      progress
    };
  }

  /**
   * Generate recommendations based on results
   * @param auditResults Audit results
   * @param consolidationResults Consolidation results
   * @param validationResults Validation results
   * @param errorReport Error report
   * @returns Categorized recommendations
   */
  private generateRecommendations(
    auditResults?: EnhancedAuditSummary,
    consolidationResults?: ConsolidationResult,
    validationResults?: PostConsolidationReport,
    errorReport?: ErrorReport
  ): ComprehensiveReport['recommendations'] {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];

    // Error-based recommendations
    if (errorReport) {
      if (errorReport.summary.criticalErrors > 0) {
        immediate.push(`🚨 Address ${errorReport.summary.criticalErrors} critical errors immediately`);
        immediate.push('Stop all operations until critical issues are resolved');
      }

      if (errorReport.summary.errors > 0) {
        immediate.push(`❌ Fix ${errorReport.summary.errors} error-level issues before proceeding`);
      }

      if (errorReport.summary.warnings > 0) {
        shortTerm.push(`⚠️  Review and address ${errorReport.summary.warnings} warnings`);
      }
    }

    // Audit-based recommendations
    if (auditResults) {
      if (auditResults.totalInlineSvgs > 0) {
        immediate.push(`📋 ${auditResults.totalInlineSvgs} inline SVGs found - proceed with consolidation`);
        shortTerm.push('Prioritize frequently-used SVGs for consolidation');
        shortTerm.push('Handle SVGs with accessibility attributes carefully');
      } else {
        immediate.push('✅ No inline SVGs found - consolidation not needed');
        longTerm.push('Consider adding linting rules to prevent future inline SVGs');
      }
    }

    // Consolidation-based recommendations
    if (consolidationResults) {
      if (consolidationResults.success) {
        immediate.push('✅ Consolidation completed successfully');
        immediate.push('Run validation to verify all SVGs were replaced');
        shortTerm.push('Test application to ensure no visual regressions');
      } else {
        immediate.push('❌ Consolidation failed - review error details');
        immediate.push('Check failed validation items and fix manually');
      }

      if (consolidationResults.warnings.length > 0) {
        shortTerm.push(`Review ${consolidationResults.warnings.length} consolidation warnings`);
      }
    }

    // Validation-based recommendations
    if (validationResults) {
      if (validationResults.isComplete) {
        immediate.push('🎉 All SVGs successfully consolidated!');
        shortTerm.push('Run comprehensive tests to ensure no regressions');
        longTerm.push('Document the consolidation process for future reference');
      } else {
        immediate.push(`❌ ${validationResults.remainingInlineSvgs} SVGs still need consolidation`);
        immediate.push('Focus on files with the most remaining SVGs');
        shortTerm.push('Handle complex SVGs with custom props manually');
      }
    }

    // General recommendations
    if (immediate.length === 0 && shortTerm.length === 0) {
      immediate.push('✅ All operations completed successfully');
    }

    longTerm.push('Set up automated checks to prevent future inline SVG usage');
    longTerm.push('Consider creating documentation for SVG management best practices');
    longTerm.push('Review and optimize the consolidation process based on lessons learned');

    return {
      immediate,
      shortTerm,
      longTerm
    };
  }

  /**
   * Calculate comprehensive statistics
   * @param auditResults Audit results
   * @param consolidationResults Consolidation results
   * @param validationResults Validation results
   * @returns Statistics summary
   */
  private calculateStatistics(
    auditResults?: EnhancedAuditSummary,
    consolidationResults?: ConsolidationResult,
    validationResults?: PostConsolidationReport
  ): ComprehensiveReport['statistics'] {
    const statistics: ComprehensiveReport['statistics'] = {
      fileStatistics: {
        totalScanned: 0,
        successfullyProcessed: 0,
        failed: 0,
        skipped: 0
      }
    };

    // SVG statistics
    if (auditResults || validationResults) {
      const totalFound = auditResults?.totalInlineSvgs || 0;
      const remaining = validationResults?.remainingInlineSvgs || 0;
      const consolidated = Math.max(0, totalFound - remaining);
      const consolidationRate = totalFound > 0 ? (consolidated / totalFound) * 100 : 100;

      statistics.svgStatistics = {
        totalFound,
        consolidated,
        remaining,
        consolidationRate
      };
    }

    // File statistics
    if (auditResults) {
      statistics.fileStatistics.totalScanned += auditResults.totalFilesScanned;
      statistics.fileStatistics.successfullyProcessed += auditResults.fileResults.filter(r => r.parseSuccess).length;
      statistics.fileStatistics.failed += auditResults.fileResults.filter(r => !r.parseSuccess).length;
    }

    if (consolidationResults) {
      statistics.fileStatistics.totalScanned += consolidationResults.statistics.filesProcessed;
    }

    if (validationResults) {
      statistics.fileStatistics.totalScanned += validationResults.validationStats.totalFilesScanned;
      statistics.fileStatistics.successfullyProcessed += validationResults.validationStats.successfullyProcessed;
      statistics.fileStatistics.failed += validationResults.validationStats.processingFailures;
    }

    // Component statistics
    if (consolidationResults) {
      statistics.componentStatistics = {
        generated: consolidationResults.statistics.componentsGenerated,
        integrated: consolidationResults.statistics.componentsIntegrated,
        failed: consolidationResults.statistics.validationFailures
      };
    }

    return statistics;
  }

  /**
   * Generate unique report ID
   * @returns Unique report identifier
   */
  private generateReportId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `svg-report-${timestamp}-${random}`;
  }

  /**
   * Format comprehensive report as markdown
   * @param report Comprehensive report
   * @returns Formatted markdown string
   */
  public formatReportAsMarkdown(report: ComprehensiveReport): string {
    const lines: string[] = [];

    // Header
    lines.push('# SVG Consolidation Comprehensive Report');
    lines.push('');
    lines.push(`**Report ID:** ${report.metadata.reportId}`);
    lines.push(`**Generated:** ${report.metadata.generatedAt.toISOString()}`);
    lines.push(`**Operation:** ${report.metadata.operationType.replace('_', ' ').toUpperCase()}`);
    lines.push(`**Duration:** ${(report.metadata.duration / 1000).toFixed(2)}s`);
    lines.push(`**Status:** ${report.status.overall.toUpperCase()}`);
    lines.push(`**Progress:** ${report.status.progress.toFixed(1)}%`);
    lines.push('');

    // Executive Summary
    lines.push('## Executive Summary');
    lines.push('');
    if (report.status.overall === 'success') {
      lines.push('✅ **Operation completed successfully**');
    } else if (report.status.overall === 'warning') {
      lines.push('⚠️  **Operation completed with warnings**');
    } else if (report.status.overall === 'error') {
      lines.push('❌ **Operation failed with errors**');
    } else {
      lines.push('🚨 **Operation failed with critical errors**');
    }
    lines.push('');

    // Key Statistics
    lines.push('### Key Statistics');
    lines.push('');
    if (report.statistics.svgStatistics) {
      const svg = report.statistics.svgStatistics;
      lines.push(`- **SVGs Found:** ${svg.totalFound}`);
      lines.push(`- **SVGs Consolidated:** ${svg.consolidated}`);
      lines.push(`- **SVGs Remaining:** ${svg.remaining}`);
      lines.push(`- **Consolidation Rate:** ${svg.consolidationRate.toFixed(1)}%`);
    }

    const file = report.statistics.fileStatistics;
    lines.push(`- **Files Processed:** ${file.totalScanned}`);
    lines.push(`- **Processing Success Rate:** ${file.totalScanned > 0 ? ((file.successfullyProcessed / file.totalScanned) * 100).toFixed(1) : 0}%`);
    lines.push(`- **Processing Rate:** ${report.performance.processingRate.toFixed(1)} files/second`);
    lines.push('');

    // Immediate Actions Required
    if (report.recommendations.immediate.length > 0) {
      lines.push('## 🚨 Immediate Actions Required');
      lines.push('');
      for (const action of report.recommendations.immediate) {
        lines.push(`- ${action}`);
      }
      lines.push('');
    }

    // Error Summary
    if (report.errorReport.summary.totalErrors > 0) {
      lines.push('## Error Summary');
      lines.push('');
      lines.push(`- **Total Issues:** ${report.errorReport.summary.totalErrors}`);
      lines.push(`- **Critical:** ${report.errorReport.summary.criticalErrors}`);
      lines.push(`- **Errors:** ${report.errorReport.summary.errors}`);
      lines.push(`- **Warnings:** ${report.errorReport.summary.warnings}`);
      lines.push(`- **Info:** ${report.errorReport.summary.infos}`);
      lines.push('');
    }

    // Performance Metrics
    if (this.options.includePerformanceMetrics) {
      lines.push('## Performance Metrics');
      lines.push('');
      lines.push(`- **Files Processed:** ${report.performance.filesProcessed}`);
      lines.push(`- **Processing Rate:** ${report.performance.processingRate.toFixed(2)} files/second`);
      lines.push(`- **Total Duration:** ${(report.metadata.duration / 1000).toFixed(2)} seconds`);

      if (report.performance.memoryUsage) {
        const mem = report.performance.memoryUsage;
        lines.push(`- **Memory Usage:** ${(mem.used / 1024 / 1024).toFixed(1)}MB / ${(mem.total / 1024 / 1024).toFixed(1)}MB (${mem.percentage.toFixed(1)}%)`);
      }
      lines.push('');
    }

    // Recommendations
    if (report.recommendations.shortTerm.length > 0) {
      lines.push('## Short-term Recommendations');
      lines.push('');
      for (const rec of report.recommendations.shortTerm) {
        lines.push(`- ${rec}`);
      }
      lines.push('');
    }

    if (report.recommendations.longTerm.length > 0) {
      lines.push('## Long-term Recommendations');
      lines.push('');
      for (const rec of report.recommendations.longTerm) {
        lines.push(`- ${rec}`);
      }
      lines.push('');
    }

    // Detailed Results (if available)
    if (report.auditResults && report.auditResults.totalInlineSvgs > 0) {
      lines.push('## Audit Results Summary');
      lines.push('');
      lines.push(`Found ${report.auditResults.totalInlineSvgs} inline SVGs in ${report.auditResults.filesWithInlineSvgs} files.`);
      lines.push('See detailed audit report for complete analysis.');
      lines.push('');
    }

    if (report.consolidationResults) {
      lines.push('## Consolidation Results Summary');
      lines.push('');
      const stats = report.consolidationResults.statistics;
      lines.push(`- **Components Generated:** ${stats.componentsGenerated}`);
      lines.push(`- **Components Integrated:** ${stats.componentsIntegrated}`);
      lines.push(`- **SVGs Replaced:** ${stats.svgsReplaced}`);
      lines.push(`- **Validation Failures:** ${stats.validationFailures}`);
      lines.push('');
    }

    if (report.validationResults) {
      lines.push('## Validation Results Summary');
      lines.push('');
      if (report.validationResults.isComplete) {
        lines.push('✅ **Validation Passed:** All inline SVGs have been successfully consolidated.');
      } else {
        lines.push(`❌ **Validation Failed:** ${report.validationResults.remainingInlineSvgs} inline SVGs still remain.`);
        lines.push(`Affected files: ${report.validationResults.filesWithRemainingInlineSvgs.length}`);
      }
      lines.push('');
    }

    // Log Summary
    lines.push('## Log Summary');
    lines.push('');
    lines.push(`- **Total Log Entries:** ${report.logSummary.totalEntries}`);
    for (const [level, count] of Object.entries(report.logSummary.entriesByLevel)) {
      if (count > 0) {
        lines.push(`- **${level}:** ${count}`);
      }
    }
    lines.push('');

    // Footer
    lines.push('---');
    lines.push('');
    lines.push(`*Report generated by SVG Consolidation System v${report.metadata.version}*`);
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Save comprehensive report to file
   * @param report Comprehensive report
   * @param outputPath Path to save the report
   * @param format Output format
   */
  public async saveComprehensiveReport(
    report: ComprehensiveReport,
    outputPath: string,
    format: 'markdown' | 'json' | 'html' = 'markdown'
  ): Promise<void> {
    const fs = await import('fs');
    let content: string;

    switch (format) {
      case 'json':
        content = JSON.stringify(report, null, 2);
        break;
      case 'html':
        content = this.formatReportAsHtml(report);
        break;
      case 'markdown':
      default:
        content = this.formatReportAsMarkdown(report);
        break;
    }

    await fs.promises.writeFile(outputPath, content, 'utf-8');
    this.logger.info('reporting', `Comprehensive report saved to ${outputPath}`, { format, reportId: report.metadata.reportId });
  }

  /**
   * Format comprehensive report as HTML
   * @param report Comprehensive report
   * @returns Formatted HTML string
   */
  private formatReportAsHtml(report: ComprehensiveReport): string {
    // Basic HTML formatting - could be enhanced with CSS styling
    const markdown = this.formatReportAsMarkdown(report);

    // Simple markdown to HTML conversion
    let html = markdown
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^\- (.*$)/gm, '<li>$1</li>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[h|l|p])/gm, '<p>')
      .replace(/(?<!>)$/gm, '</p>');

    return `
<!DOCTYPE html>
<html>
<head>
    <title>SVG Consolidation Report - ${report.metadata.reportId}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; border-bottom: 2px solid #333; }
        h2 { color: #666; border-bottom: 1px solid #ccc; }
        .status-success { color: #28a745; }
        .status-warning { color: #ffc107; }
        .status-error { color: #dc3545; }
        .status-critical { color: #dc3545; font-weight: bold; }
        code { background-color: #f8f9fa; padding: 2px 4px; border-radius: 3px; }
        li { margin: 5px 0; }
    </style>
</head>
<body>
    ${html}
</body>
</html>`;
  }

  /**
   * Reset the reporting system for a new operation
   */
  public reset(): void {
    this.startTime = new Date();
    this.errorHandler.clearErrors();
    this.logger.clearLogs();
  }
}

/**
 * Utility function to create a reporting system
 * @param errorHandler Error handler instance
 * @param logger Logger instance
 * @param options Reporting options
 * @returns Reporting system instance
 */
export function createReportingSystem(
  errorHandler: SvgConsolidationErrorHandler,
  logger: SvgConsolidationLogger,
  options?: Partial<ReportingOptions>
): SvgConsolidationReportingSystem {
  return new SvgConsolidationReportingSystem(errorHandler, logger, options);
}