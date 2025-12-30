/**
 * Integrated completeness validation system
 * Combines post-consolidation validation, error handling, and reporting
 * Requirements: 5.3, 5.5
 */

import { PostConsolidationValidator, PostConsolidationReport, validateConsolidation } from './post-consolidation-validator';
import { SvgConsolidationErrorHandler, createErrorHandler, ErrorSeverity, ErrorCategory } from './error-handler';
import { SvgConsolidationLogger, createLogger, LogLevel } from './logger';
import { SvgConsolidationReportingSystem, createReportingSystem, ComprehensiveReport } from './reporting-system';
import { EnhancedAuditSummary } from './audit-system';
import { ConsolidationResult } from './svg-consolidation-system';

export interface CompletenessValidationOptions {
  /** Previous audit summary for comparison */
  previousAudit?: EnhancedAuditSummary;
  /** Previous consolidation results for comparison */
  previousConsolidation?: ConsolidationResult;
  /** Whether to generate detailed recommendations */
  generateRecommendations?: boolean;
  /** Whether to save validation report to file */
  saveReport?: boolean;
  /** Output directory for reports */
  outputDir?: string;
  /** Log level for validation process */
  logLevel?: LogLevel;
  /** Whether to include performance metrics */
  includePerformanceMetrics?: boolean;
  /** Maximum number of retry attempts for failed operations */
  maxRetryAttempts?: number;
  /** Delay between retry attempts in milliseconds */
  retryDelay?: number;
}

export interface CompletenessValidationResult {
  /** Whether validation was successful */
  success: boolean;
  /** Whether consolidation is complete (no remaining inline SVGs) */
  isComplete: boolean;
  /** Detailed validation report */
  validationReport: PostConsolidationReport;
  /** Comprehensive report including errors and logs */
  comprehensiveReport: ComprehensiveReport;
  /** Summary of remaining work (if any) */
  remainingWork?: {
    count: number;
    affectedFiles: string[];
    priorityItems: string[];
    estimatedEffort: 'low' | 'medium' | 'high';
  };
  /** Performance metrics */
  performance: {
    validationTime: number;
    filesScanned: number;
    processingRate: number;
  };
}

export class CompletenessValidationSystem {
  private validator: PostConsolidationValidator;
  private errorHandler: SvgConsolidationErrorHandler;
  private logger: SvgConsolidationLogger;
  private reportingSystem: SvgConsolidationReportingSystem;
  private options: CompletenessValidationOptions;

  constructor(options: CompletenessValidationOptions = {}) {
    this.options = {
      generateRecommendations: true,
      saveReport: true,
      outputDir: './reports',
      logLevel: LogLevel.INFO,
      includePerformanceMetrics: true,
      maxRetryAttempts: 3,
      retryDelay: 1000,
      ...options
    };

    // Initialize components
    this.errorHandler = createErrorHandler(
      (progress) => this.handleProgress(progress),
      (error) => this.handleError(error)
    );

    this.logger = createLogger({
      level: this.options.logLevel!,
      includeTimestamp: true,
      useColors: true,
      saveToFile: this.options.saveReport,
      logFilePath: this.options.saveReport ? `${this.options.outputDir}/validation.log` : undefined
    });

    this.reportingSystem = createReportingSystem(this.errorHandler, this.logger, {
      includeDetailedLogs: false,
      includePerformanceMetrics: this.options.includePerformanceMetrics,
      generateRecommendations: this.options.generateRecommendations,
      outputFormat: 'markdown'
    });

    this.validator = new PostConsolidationValidator({
      previousAudit: this.options.previousAudit,
      generateRecommendations: this.options.generateRecommendations,
      includeStatistics: true
    });

    this.reportingSystem.setOperationType('validation');
  }

  /**
   * Perform comprehensive completeness validation
   * @returns Validation result with detailed information
   */
  public async performValidation(): Promise<CompletenessValidationResult> {
    const startTime = Date.now();
    this.logger.info('validation', 'Starting completeness validation');

    try {
      // Perform validation with retry logic
      const validationReport = await this.performValidationWithRetry();

      const endTime = Date.now();
      const validationTime = endTime - startTime;

      // Calculate performance metrics
      const performance = {
        validationTime,
        filesScanned: validationReport.validationStats.totalFilesScanned,
        processingRate: validationTime > 0 ? (validationReport.validationStats.totalFilesScanned / (validationTime / 1000)) : 0
      };

      // Generate remaining work summary if consolidation is incomplete
      let remainingWork: CompletenessValidationResult['remainingWork'];
      if (!validationReport.isComplete) {
        remainingWork = await this.generateRemainingWorkSummary(validationReport);
      }

      // Generate comprehensive report
      const comprehensiveReport = this.reportingSystem.generateComprehensiveReport(
        this.options.previousAudit,
        this.options.previousConsolidation,
        validationReport
      );

      // Save reports if requested
      if (this.options.saveReport) {
        await this.saveReports(validationReport, comprehensiveReport);
      }

      const result: CompletenessValidationResult = {
        success: !this.errorHandler.hasBlockingErrors(),
        isComplete: validationReport.isComplete,
        validationReport,
        comprehensiveReport,
        remainingWork,
        performance
      };

      this.logValidationCompletion(result);
      return result;

    } catch (error) {
      this.errorHandler.recordError(
        ErrorSeverity.CRITICAL,
        ErrorCategory.VALIDATION,
        'Completeness validation failed',
        {
          originalError: error as Error,
          details: 'Critical failure during validation process'
        }
      );

      throw error;
    }
  }

  /**
   * Perform validation with retry logic
   * @returns Validation report
   */
  private async performValidationWithRetry(): Promise<PostConsolidationReport> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.options.maxRetryAttempts!; attempt++) {
      try {
        this.logger.info('validation', `Validation attempt ${attempt}/${this.options.maxRetryAttempts}`);
        return await this.validator.validateConsolidation();
      } catch (error) {
        lastError = error as Error;

        this.errorHandler.recordWarning(
          ErrorCategory.VALIDATION,
          `Validation attempt ${attempt} failed`,
          undefined,
          { attempt, error: error as Error }
        );

        if (attempt < this.options.maxRetryAttempts!) {
          this.logger.warn('validation', `Retrying in ${this.options.retryDelay}ms...`);
          await this.delay(this.options.retryDelay!);
        }
      }
    }

    // All attempts failed
    this.errorHandler.recordError(
      ErrorSeverity.ERROR,
      ErrorCategory.VALIDATION,
      'All validation attempts failed',
      {
        originalError: lastError!,
        details: `Failed after ${this.options.maxRetryAttempts} attempts`
      }
    );

    throw lastError;
  }

  /**
   * Generate summary of remaining work
   * @param validationReport Validation report
   * @returns Remaining work summary
   */
  private async generateRemainingWorkSummary(
    validationReport: PostConsolidationReport
  ): Promise<CompletenessValidationResult['remainingWork']> {
    const summary = await this.validator.getRemainingWorkSummary();

    // Estimate effort based on remaining work
    let estimatedEffort: 'low' | 'medium' | 'high' = 'low';

    if (summary.remainingCount > 20 || summary.affectedFiles.length > 10) {
      estimatedEffort = 'high';
    } else if (summary.remainingCount > 5 || summary.affectedFiles.length > 3) {
      estimatedEffort = 'medium';
    }

    // Increase effort estimate for complex SVGs
    if (summary.priorityItems.some(item => item.includes('custom props') || item.includes('accessibility'))) {
      estimatedEffort = estimatedEffort === 'low' ? 'medium' : 'high';
    }

    return {
      count: summary.remainingCount,
      affectedFiles: summary.affectedFiles,
      priorityItems: summary.priorityItems,
      estimatedEffort
    };
  }

  /**
   * Save validation and comprehensive reports
   * @param validationReport Validation report
   * @param comprehensiveReport Comprehensive report
   */
  private async saveReports(
    validationReport: PostConsolidationReport,
    comprehensiveReport: ComprehensiveReport
  ): Promise<void> {
    try {
      // Ensure output directory exists
      const fs = await import('fs');
      await fs.promises.mkdir(this.options.outputDir!, { recursive: true });

      // Save validation report
      const validationReportPath = `${this.options.outputDir}/post-consolidation-validation-report.md`;
      await this.validator.saveValidationReport(validationReport, validationReportPath);

      // Save comprehensive report
      const comprehensiveReportPath = `${this.options.outputDir}/comprehensive-validation-report.md`;
      await this.reportingSystem.saveComprehensiveReport(comprehensiveReport, comprehensiveReportPath);

      // Save JSON version for programmatic access
      const jsonReportPath = `${this.options.outputDir}/validation-results.json`;
      await fs.promises.writeFile(
        jsonReportPath,
        JSON.stringify({
          validationReport,
          comprehensiveReport
        }, null, 2),
        'utf-8'
      );

      this.logger.info('validation', 'Reports saved successfully', {
        validationReport: validationReportPath,
        comprehensiveReport: comprehensiveReportPath,
        jsonReport: jsonReportPath
      });

    } catch (error) {
      this.errorHandler.recordWarning(
        ErrorCategory.FILE_SYSTEM,
        'Failed to save validation reports',
        undefined,
        { error: error as Error }
      );
    }
  }

  /**
   * Handle progress updates
   * @param progress Progress report
   */
  private handleProgress(progress: any): void {
    this.logger.debug('validation', `Progress: ${progress.currentOperation}`, {
      progress: progress.progress,
      processed: progress.processed,
      total: progress.total
    });
  }

  /**
   * Handle error notifications
   * @param error Error details
   */
  private handleError(error: any): void {
    this.logger.error('validation', `Error: ${error.message}`, {
      category: error.category,
      severity: error.severity,
      filePath: error.filePath
    });
  }

  /**
   * Log validation completion
   * @param result Validation result
   */
  private logValidationCompletion(result: CompletenessValidationResult): void {
    if (result.isComplete) {
      this.logger.info('validation', '✅ Consolidation validation PASSED - All SVGs consolidated!', {
        filesScanned: result.performance.filesScanned,
        validationTime: result.performance.validationTime,
        processingRate: result.performance.processingRate
      });
    } else {
      this.logger.warn('validation', `❌ Consolidation validation FAILED - ${result.remainingWork?.count} SVGs remaining`, {
        remainingCount: result.remainingWork?.count,
        affectedFiles: result.remainingWork?.affectedFiles.length,
        estimatedEffort: result.remainingWork?.estimatedEffort,
        filesScanned: result.performance.filesScanned,
        validationTime: result.performance.validationTime
      });
    }
  }

  /**
   * Utility method to delay execution
   * @param ms Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Quick check if consolidation is complete
   * @returns True if consolidation is complete
   */
  public async isConsolidationComplete(): Promise<boolean> {
    try {
      return await this.validator.isConsolidationComplete();
    } catch (error) {
      this.errorHandler.recordError(
        ErrorSeverity.ERROR,
        ErrorCategory.VALIDATION,
        'Failed to check consolidation status',
        { originalError: error as Error }
      );
      return false;
    }
  }

  /**
   * Get a quick summary of remaining work without full validation
   * @returns Summary of remaining work
   */
  public async getQuickRemainingWorkSummary(): Promise<{
    remainingCount: number;
    affectedFiles: string[];
    priorityItems: string[];
  }> {
    try {
      return await this.validator.getRemainingWorkSummary();
    } catch (error) {
      this.errorHandler.recordError(
        ErrorSeverity.ERROR,
        ErrorCategory.VALIDATION,
        'Failed to get remaining work summary',
        { originalError: error as Error }
      );
      return {
        remainingCount: -1,
        affectedFiles: [],
        priorityItems: ['Error: Unable to determine remaining work']
      };
    }
  }

  /**
   * Generate a simple status report
   * @returns Simple status report
   */
  public async generateStatusReport(): Promise<{
    status: 'complete' | 'incomplete' | 'error';
    message: string;
    details?: any;
  }> {
    try {
      const isComplete = await this.isConsolidationComplete();

      if (isComplete) {
        return {
          status: 'complete',
          message: '✅ All SVGs have been successfully consolidated'
        };
      } else {
        const summary = await this.getQuickRemainingWorkSummary();
        return {
          status: 'incomplete',
          message: `❌ ${summary.remainingCount} SVGs still need consolidation`,
          details: {
            remainingCount: summary.remainingCount,
            affectedFiles: summary.affectedFiles.length,
            priorityItems: summary.priorityItems
          }
        };
      }
    } catch (error) {
      return {
        status: 'error',
        message: '🚨 Unable to determine consolidation status',
        details: { error: (error as Error).message }
      };
    }
  }
}

/**
 * Utility function to perform quick completeness validation
 * @param options Validation options
 * @returns Validation result
 */
export async function performCompletenessValidation(
  options?: CompletenessValidationOptions
): Promise<CompletenessValidationResult> {
  const system = new CompletenessValidationSystem(options);
  return system.performValidation();
}

/**
 * Utility function to quickly check if consolidation is complete
 * @param options Validation options
 * @returns True if consolidation is complete
 */
export async function isConsolidationComplete(
  options?: CompletenessValidationOptions
): Promise<boolean> {
  const system = new CompletenessValidationSystem(options);
  return system.isConsolidationComplete();
}

/**
 * Utility function to get a status report
 * @param options Validation options
 * @returns Status report
 */
export async function getConsolidationStatus(
  options?: CompletenessValidationOptions
): Promise<{
  status: 'complete' | 'incomplete' | 'error';
  message: string;
  details?: any;
}> {
  const system = new CompletenessValidationSystem(options);
  return system.generateStatusReport();
}

/**
 * Utility function to validate consolidation and save detailed reports
 * @param outputDir Directory to save reports
 * @param previousAudit Previous audit for comparison
 * @param previousConsolidation Previous consolidation for comparison
 * @returns Validation result
 */
export async function validateAndReport(
  outputDir: string = './reports',
  previousAudit?: EnhancedAuditSummary,
  previousConsolidation?: ConsolidationResult
): Promise<CompletenessValidationResult> {
  return performCompletenessValidation({
    outputDir,
    previousAudit,
    previousConsolidation,
    saveReport: true,
    generateRecommendations: true,
    includePerformanceMetrics: true,
    logLevel: LogLevel.INFO
  });
}