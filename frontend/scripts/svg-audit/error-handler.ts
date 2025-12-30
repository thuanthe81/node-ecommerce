/**
 * Comprehensive error handling and reporting system for SVG consolidation
 * Requirements: 5.5
 */

export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  FILE_SYSTEM = 'file_system',
  PARSING = 'parsing',
  VALIDATION = 'validation',
  GENERATION = 'generation',
  INTEGRATION = 'integration',
  REPLACEMENT = 'replacement',
  TYPESCRIPT = 'typescript',
  FORMATTING = 'formatting',
  NETWORK = 'network',
  CONFIGURATION = 'configuration'
}

export interface SvgConsolidationError {
  /** Unique error identifier */
  id: string;
  /** Error severity level */
  severity: ErrorSeverity;
  /** Error category */
  category: ErrorCategory;
  /** Human-readable error message */
  message: string;
  /** Detailed error description */
  details?: string;
  /** File path where error occurred (if applicable) */
  filePath?: string;
  /** Line number where error occurred (if applicable) */
  lineNumber?: number;
  /** Original error object */
  originalError?: Error;
  /** Timestamp when error occurred */
  timestamp: Date;
  /** Context information */
  context?: Record<string, any>;
  /** Suggested remediation steps */
  remediation: string[];
  /** Whether this error can be automatically recovered */
  canRecover: boolean;
  /** Recovery strategy if available */
  recoveryStrategy?: string;
}

export interface ErrorReport {
  /** Summary of all errors */
  summary: {
    totalErrors: number;
    criticalErrors: number;
    errors: number;
    warnings: number;
    infos: number;
    errorsByCategory: Record<ErrorCategory, number>;
  };
  /** List of all errors */
  errors: SvgConsolidationError[];
  /** Timestamp when report was generated */
  reportTimestamp: Date;
  /** Overall status */
  overallStatus: 'success' | 'warning' | 'error' | 'critical';
  /** Recommendations for fixing errors */
  recommendations: string[];
}

export interface ProgressReport {
  /** Current operation being performed */
  currentOperation: string;
  /** Progress percentage (0-100) */
  progress: number;
  /** Number of items processed */
  processed: number;
  /** Total number of items to process */
  total: number;
  /** Estimated time remaining in milliseconds */
  estimatedTimeRemaining?: number;
  /** Current processing rate (items per second) */
  processingRate?: number;
  /** Any warnings or issues encountered */
  warnings: string[];
}

export type ProgressCallback = (report: ProgressReport) => void;
export type ErrorCallback = (error: SvgConsolidationError) => void;

export class SvgConsolidationErrorHandler {
  private errors: SvgConsolidationError[] = [];
  private progressCallback?: ProgressCallback;
  private errorCallback?: ErrorCallback;
  private startTime: Date = new Date();

  constructor(
    progressCallback?: ProgressCallback,
    errorCallback?: ErrorCallback
  ) {
    this.progressCallback = progressCallback;
    this.errorCallback = errorCallback;
  }

  /**
   * Record an error with comprehensive details
   * @param severity Error severity
   * @param category Error category
   * @param message Error message
   * @param options Additional error options
   */
  public recordError(
    severity: ErrorSeverity,
    category: ErrorCategory,
    message: string,
    options: {
      details?: string;
      filePath?: string;
      lineNumber?: number;
      originalError?: Error;
      context?: Record<string, any>;
      canRecover?: boolean;
      recoveryStrategy?: string;
    } = {}
  ): SvgConsolidationError {
    const error: SvgConsolidationError = {
      id: this.generateErrorId(),
      severity,
      category,
      message,
      details: options.details,
      filePath: options.filePath,
      lineNumber: options.lineNumber,
      originalError: options.originalError,
      timestamp: new Date(),
      context: options.context,
      remediation: this.generateRemediation(severity, category, message, options),
      canRecover: options.canRecover ?? false,
      recoveryStrategy: options.recoveryStrategy
    };

    this.errors.push(error);

    // Call error callback if provided
    if (this.errorCallback) {
      this.errorCallback(error);
    }

    // Log error to console based on severity
    this.logError(error);

    return error;
  }

  /**
   * Record a file system error
   * @param operation The operation that failed
   * @param filePath Path to the file
   * @param originalError Original error
   */
  public recordFileSystemError(
    operation: string,
    filePath: string,
    originalError: Error
  ): SvgConsolidationError {
    return this.recordError(
      ErrorSeverity.ERROR,
      ErrorCategory.FILE_SYSTEM,
      `File system operation failed: ${operation}`,
      {
        details: `Failed to ${operation} file: ${filePath}`,
        filePath,
        originalError,
        context: { operation },
        canRecover: true,
        recoveryStrategy: 'retry_with_backoff'
      }
    );
  }

  /**
   * Record a parsing error
   * @param filePath Path to the file that failed to parse
   * @param lineNumber Line number where parsing failed
   * @param originalError Original parsing error
   */
  public recordParsingError(
    filePath: string,
    lineNumber?: number,
    originalError?: Error
  ): SvgConsolidationError {
    return this.recordError(
      ErrorSeverity.ERROR,
      ErrorCategory.PARSING,
      'Failed to parse React component file',
      {
        details: `Unable to parse JSX/TSX content in ${filePath}${lineNumber ? ` at line ${lineNumber}` : ''}`,
        filePath,
        lineNumber,
        originalError,
        context: { parsingStage: 'ast_generation' },
        canRecover: false
      }
    );
  }

  /**
   * Record a validation error
   * @param validationType Type of validation that failed
   * @param message Error message
   * @param filePath File path (if applicable)
   * @param context Additional context
   */
  public recordValidationError(
    validationType: string,
    message: string,
    filePath?: string,
    context?: Record<string, any>
  ): SvgConsolidationError {
    return this.recordError(
      ErrorSeverity.ERROR,
      ErrorCategory.VALIDATION,
      `Validation failed: ${validationType}`,
      {
        details: message,
        filePath,
        context: { validationType, ...context },
        canRecover: true,
        recoveryStrategy: 'manual_review_required'
      }
    );
  }

  /**
   * Record a TypeScript compilation error
   * @param filePath File with TypeScript errors
   * @param errors Array of TypeScript diagnostic messages
   */
  public recordTypeScriptError(
    filePath: string,
    errors: string[]
  ): SvgConsolidationError {
    return this.recordError(
      ErrorSeverity.ERROR,
      ErrorCategory.TYPESCRIPT,
      'TypeScript compilation failed',
      {
        details: `TypeScript errors in ${filePath}:\n${errors.join('\n')}`,
        filePath,
        context: { typeScriptErrors: errors },
        canRecover: true,
        recoveryStrategy: 'fix_type_errors'
      }
    );
  }

  /**
   * Record a component generation error
   * @param componentName Name of component that failed to generate
   * @param reason Reason for failure
   * @param originalError Original error
   */
  public recordGenerationError(
    componentName: string,
    reason: string,
    originalError?: Error
  ): SvgConsolidationError {
    return this.recordError(
      ErrorSeverity.ERROR,
      ErrorCategory.GENERATION,
      `Failed to generate SVG component: ${componentName}`,
      {
        details: reason,
        originalError,
        context: { componentName, generationStage: 'component_creation' },
        canRecover: true,
        recoveryStrategy: 'manual_component_creation'
      }
    );
  }

  /**
   * Record a warning
   * @param category Warning category
   * @param message Warning message
   * @param filePath File path (if applicable)
   * @param context Additional context
   */
  public recordWarning(
    category: ErrorCategory,
    message: string,
    filePath?: string,
    context?: Record<string, any>
  ): SvgConsolidationError {
    return this.recordError(
      ErrorSeverity.WARNING,
      category,
      message,
      {
        filePath,
        context,
        canRecover: true
      }
    );
  }

  /**
   * Record an info message
   * @param category Info category
   * @param message Info message
   * @param context Additional context
   */
  public recordInfo(
    category: ErrorCategory,
    message: string,
    context?: Record<string, any>
  ): SvgConsolidationError {
    return this.recordError(
      ErrorSeverity.INFO,
      category,
      message,
      {
        context,
        canRecover: true
      }
    );
  }

  /**
   * Report progress of current operation
   * @param operation Current operation name
   * @param processed Number of items processed
   * @param total Total number of items
   * @param warnings Any warnings to include
   */
  public reportProgress(
    operation: string,
    processed: number,
    total: number,
    warnings: string[] = []
  ): void {
    const progress = total > 0 ? Math.round((processed / total) * 100) : 0;
    const elapsedTime = Date.now() - this.startTime.getTime();
    const processingRate = processed > 0 ? processed / (elapsedTime / 1000) : 0;
    const estimatedTimeRemaining = processingRate > 0
      ? ((total - processed) / processingRate) * 1000
      : undefined;

    const report: ProgressReport = {
      currentOperation: operation,
      progress,
      processed,
      total,
      estimatedTimeRemaining,
      processingRate,
      warnings
    };

    if (this.progressCallback) {
      this.progressCallback(report);
    }
  }

  /**
   * Generate comprehensive error report
   * @returns Complete error report
   */
  public generateErrorReport(): ErrorReport {
    const summary = this.generateErrorSummary();
    const overallStatus = this.determineOverallStatus(summary);
    const recommendations = this.generateRecommendations();

    return {
      summary,
      errors: [...this.errors],
      reportTimestamp: new Date(),
      overallStatus,
      recommendations
    };
  }

  /**
   * Generate error summary statistics
   * @returns Error summary
   */
  private generateErrorSummary(): ErrorReport['summary'] {
    const errorsByCategory: Record<ErrorCategory, number> = {} as Record<ErrorCategory, number>;

    // Initialize all categories to 0
    Object.values(ErrorCategory).forEach(category => {
      errorsByCategory[category] = 0;
    });

    let criticalErrors = 0;
    let errors = 0;
    let warnings = 0;
    let infos = 0;

    for (const error of this.errors) {
      errorsByCategory[error.category]++;

      switch (error.severity) {
        case ErrorSeverity.CRITICAL:
          criticalErrors++;
          break;
        case ErrorSeverity.ERROR:
          errors++;
          break;
        case ErrorSeverity.WARNING:
          warnings++;
          break;
        case ErrorSeverity.INFO:
          infos++;
          break;
      }
    }

    return {
      totalErrors: this.errors.length,
      criticalErrors,
      errors,
      warnings,
      infos,
      errorsByCategory
    };
  }

  /**
   * Determine overall status based on error summary
   * @param summary Error summary
   * @returns Overall status
   */
  private determineOverallStatus(summary: ErrorReport['summary']): ErrorReport['overallStatus'] {
    if (summary.criticalErrors > 0) {
      return 'critical';
    }
    if (summary.errors > 0) {
      return 'error';
    }
    if (summary.warnings > 0) {
      return 'warning';
    }
    return 'success';
  }

  /**
   * Generate recommendations based on recorded errors
   * @returns Array of recommendation strings
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const summary = this.generateErrorSummary();

    if (summary.totalErrors === 0) {
      recommendations.push('✅ No errors encountered - operation completed successfully!');
      return recommendations;
    }

    // Critical errors
    if (summary.criticalErrors > 0) {
      recommendations.push(`🚨 CRITICAL: ${summary.criticalErrors} critical errors must be resolved immediately`);
      recommendations.push('   - Stop all operations and address critical issues first');
      recommendations.push('   - Check system resources and permissions');
    }

    // File system errors
    if (summary.errorsByCategory[ErrorCategory.FILE_SYSTEM] > 0) {
      recommendations.push(`📁 FILE SYSTEM: ${summary.errorsByCategory[ErrorCategory.FILE_SYSTEM]} file system errors`);
      recommendations.push('   - Check file permissions and disk space');
      recommendations.push('   - Ensure files are not locked by other processes');
      recommendations.push('   - Consider running with elevated permissions if needed');
    }

    // Parsing errors
    if (summary.errorsByCategory[ErrorCategory.PARSING] > 0) {
      recommendations.push(`🔍 PARSING: ${summary.errorsByCategory[ErrorCategory.PARSING]} parsing errors`);
      recommendations.push('   - Check for syntax errors in affected files');
      recommendations.push('   - Ensure files contain valid JSX/TSX syntax');
      recommendations.push('   - Consider excluding problematic files from processing');
    }

    // TypeScript errors
    if (summary.errorsByCategory[ErrorCategory.TYPESCRIPT] > 0) {
      recommendations.push(`📝 TYPESCRIPT: ${summary.errorsByCategory[ErrorCategory.TYPESCRIPT]} TypeScript errors`);
      recommendations.push('   - Run TypeScript compiler to see detailed error messages');
      recommendations.push('   - Fix type errors in generated components');
      recommendations.push('   - Ensure all imports are properly typed');
    }

    // Validation errors
    if (summary.errorsByCategory[ErrorCategory.VALIDATION] > 0) {
      recommendations.push(`✅ VALIDATION: ${summary.errorsByCategory[ErrorCategory.VALIDATION]} validation errors`);
      recommendations.push('   - Review validation failures and fix manually');
      recommendations.push('   - Check that generated components render correctly');
      recommendations.push('   - Verify all props and styling are preserved');
    }

    // Generation errors
    if (summary.errorsByCategory[ErrorCategory.GENERATION] > 0) {
      recommendations.push(`⚙️  GENERATION: ${summary.errorsByCategory[ErrorCategory.GENERATION]} generation errors`);
      recommendations.push('   - Review SVG content for invalid syntax');
      recommendations.push('   - Check for naming conflicts with existing components');
      recommendations.push('   - Consider manual component creation for complex SVGs');
    }

    // General recommendations
    recommendations.push('💡 GENERAL RECOMMENDATIONS:');
    recommendations.push('   1. Address critical and error-level issues first');
    recommendations.push('   2. Review detailed error messages for specific guidance');
    recommendations.push('   3. Test fixes incrementally to avoid introducing new issues');
    recommendations.push('   4. Consider creating backups before making changes');
    recommendations.push('   5. Run validation after each fix to verify success');

    return recommendations;
  }

  /**
   * Generate remediation steps for a specific error
   * @param severity Error severity
   * @param category Error category
   * @param message Error message
   * @param options Error options
   * @returns Array of remediation steps
   */
  private generateRemediation(
    severity: ErrorSeverity,
    category: ErrorCategory,
    message: string,
    options: any
  ): string[] {
    const remediation: string[] = [];

    switch (category) {
      case ErrorCategory.FILE_SYSTEM:
        remediation.push('Check file permissions and ensure the file is not locked');
        remediation.push('Verify sufficient disk space is available');
        remediation.push('Try running the operation again');
        if (options.filePath) {
          remediation.push(`Manually verify the file exists: ${options.filePath}`);
        }
        break;

      case ErrorCategory.PARSING:
        remediation.push('Check the file for syntax errors');
        remediation.push('Ensure the file contains valid JSX/TSX syntax');
        remediation.push('Try opening the file in your IDE to see syntax highlighting');
        if (options.lineNumber) {
          remediation.push(`Focus on line ${options.lineNumber} and surrounding code`);
        }
        break;

      case ErrorCategory.VALIDATION:
        remediation.push('Review the validation failure details');
        remediation.push('Check that the generated component matches expected patterns');
        remediation.push('Manually test the component to ensure it works correctly');
        break;

      case ErrorCategory.GENERATION:
        remediation.push('Review the SVG content for invalid syntax or attributes');
        remediation.push('Check for naming conflicts with existing components');
        remediation.push('Consider simplifying complex SVG structures');
        break;

      case ErrorCategory.TYPESCRIPT:
        remediation.push('Run TypeScript compiler to see detailed error messages');
        remediation.push('Fix type errors in the affected file');
        remediation.push('Ensure all imports have proper type definitions');
        break;

      case ErrorCategory.FORMATTING:
        remediation.push('Run Prettier on the affected file');
        remediation.push('Check Prettier configuration for any issues');
        remediation.push('Manually format the code if automatic formatting fails');
        break;

      default:
        remediation.push('Review the error details and context');
        remediation.push('Check the documentation for guidance');
        remediation.push('Consider seeking help if the issue persists');
        break;
    }

    // Add severity-specific remediation
    if (severity === ErrorSeverity.CRITICAL) {
      remediation.unshift('CRITICAL: Stop all operations and address this issue immediately');
    } else if (severity === ErrorSeverity.ERROR) {
      remediation.unshift('ERROR: This issue must be resolved before continuing');
    }

    return remediation;
  }

  /**
   * Generate unique error ID
   * @returns Unique error identifier
   */
  private generateErrorId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `svg-err-${timestamp}-${random}`;
  }

  /**
   * Log error to console based on severity
   * @param error Error to log
   */
  private logError(error: SvgConsolidationError): void {
    const prefix = `[${error.severity.toUpperCase()}] ${error.category}:`;
    const location = error.filePath
      ? ` (${error.filePath}${error.lineNumber ? `:${error.lineNumber}` : ''})`
      : '';

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        console.error(`🚨 ${prefix} ${error.message}${location}`);
        if (error.details) console.error(`   Details: ${error.details}`);
        break;
      case ErrorSeverity.ERROR:
        console.error(`❌ ${prefix} ${error.message}${location}`);
        if (error.details) console.error(`   Details: ${error.details}`);
        break;
      case ErrorSeverity.WARNING:
        console.warn(`⚠️  ${prefix} ${error.message}${location}`);
        break;
      case ErrorSeverity.INFO:
        console.info(`ℹ️  ${prefix} ${error.message}${location}`);
        break;
    }
  }

  /**
   * Clear all recorded errors
   */
  public clearErrors(): void {
    this.errors = [];
    this.startTime = new Date();
  }

  /**
   * Get all errors of a specific severity
   * @param severity Error severity to filter by
   * @returns Array of errors with specified severity
   */
  public getErrorsBySeverity(severity: ErrorSeverity): SvgConsolidationError[] {
    return this.errors.filter(error => error.severity === severity);
  }

  /**
   * Get all errors of a specific category
   * @param category Error category to filter by
   * @returns Array of errors with specified category
   */
  public getErrorsByCategory(category: ErrorCategory): SvgConsolidationError[] {
    return this.errors.filter(error => error.category === category);
  }

  /**
   * Check if there are any critical or error-level issues
   * @returns True if there are blocking errors
   */
  public hasBlockingErrors(): boolean {
    return this.errors.some(error =>
      error.severity === ErrorSeverity.CRITICAL ||
      error.severity === ErrorSeverity.ERROR
    );
  }

  /**
   * Get count of errors by severity
   * @returns Object with counts by severity
   */
  public getErrorCounts(): Record<ErrorSeverity, number> {
    const counts: Record<ErrorSeverity, number> = {
      [ErrorSeverity.CRITICAL]: 0,
      [ErrorSeverity.ERROR]: 0,
      [ErrorSeverity.WARNING]: 0,
      [ErrorSeverity.INFO]: 0
    };

    for (const error of this.errors) {
      counts[error.severity]++;
    }

    return counts;
  }

  /**
   * Format error report as markdown
   * @param report Error report to format
   * @returns Formatted markdown string
   */
  public formatErrorReportAsMarkdown(report: ErrorReport): string {
    const lines: string[] = [];

    lines.push('# SVG Consolidation Error Report');
    lines.push('');
    lines.push(`**Generated:** ${report.reportTimestamp.toISOString()}`);
    lines.push(`**Overall Status:** ${report.overallStatus.toUpperCase()}`);
    lines.push('');

    // Summary
    lines.push('## Summary');
    lines.push('');
    lines.push(`- **Total Issues:** ${report.summary.totalErrors}`);
    lines.push(`- **Critical:** ${report.summary.criticalErrors}`);
    lines.push(`- **Errors:** ${report.summary.errors}`);
    lines.push(`- **Warnings:** ${report.summary.warnings}`);
    lines.push(`- **Info:** ${report.summary.infos}`);
    lines.push('');

    // Errors by category
    lines.push('### Issues by Category');
    lines.push('');
    for (const [category, count] of Object.entries(report.summary.errorsByCategory)) {
      if (count > 0) {
        lines.push(`- **${category.replace('_', ' ').toUpperCase()}:** ${count}`);
      }
    }
    lines.push('');

    // Recommendations
    if (report.recommendations.length > 0) {
      lines.push('## Recommendations');
      lines.push('');
      for (const recommendation of report.recommendations) {
        lines.push(recommendation);
      }
      lines.push('');
    }

    // Detailed errors
    if (report.errors.length > 0) {
      lines.push('## Detailed Error List');
      lines.push('');

      // Group by severity
      const errorsBySeverity = new Map<ErrorSeverity, SvgConsolidationError[]>();
      for (const error of report.errors) {
        if (!errorsBySeverity.has(error.severity)) {
          errorsBySeverity.set(error.severity, []);
        }
        errorsBySeverity.get(error.severity)!.push(error);
      }

      // Display in order of severity
      const severityOrder = [ErrorSeverity.CRITICAL, ErrorSeverity.ERROR, ErrorSeverity.WARNING, ErrorSeverity.INFO];

      for (const severity of severityOrder) {
        const errors = errorsBySeverity.get(severity);
        if (!errors || errors.length === 0) continue;

        lines.push(`### ${severity.toUpperCase()} (${errors.length})`);
        lines.push('');

        for (const error of errors) {
          lines.push(`#### ${error.message}`);
          lines.push('');
          lines.push(`- **ID:** ${error.id}`);
          lines.push(`- **Category:** ${error.category}`);
          lines.push(`- **Timestamp:** ${error.timestamp.toISOString()}`);

          if (error.filePath) {
            lines.push(`- **File:** ${error.filePath}${error.lineNumber ? `:${error.lineNumber}` : ''}`);
          }

          if (error.details) {
            lines.push(`- **Details:** ${error.details}`);
          }

          if (error.remediation.length > 0) {
            lines.push('- **Remediation:**');
            for (const step of error.remediation) {
              lines.push(`  - ${step}`);
            }
          }

          if (error.canRecover && error.recoveryStrategy) {
            lines.push(`- **Recovery Strategy:** ${error.recoveryStrategy}`);
          }

          lines.push('');
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Save error report to file
   * @param report Error report to save
   * @param outputPath Path to save the report
   */
  public async saveErrorReport(report: ErrorReport, outputPath: string): Promise<void> {
    const reportContent = this.formatErrorReportAsMarkdown(report);
    const fs = await import('fs');
    await fs.promises.writeFile(outputPath, reportContent, 'utf-8');
    console.log(`Error report saved to: ${outputPath}`);
  }
}

/**
 * Utility function to create a new error handler
 * @param progressCallback Optional progress callback
 * @param errorCallback Optional error callback
 * @returns New error handler instance
 */
export function createErrorHandler(
  progressCallback?: ProgressCallback,
  errorCallback?: ErrorCallback
): SvgConsolidationErrorHandler {
  return new SvgConsolidationErrorHandler(progressCallback, errorCallback);
}

/**
 * Utility function to handle errors with fallback strategies
 * @param operation Function to execute
 * @param errorHandler Error handler instance
 * @param fallbackStrategies Array of fallback functions to try
 * @returns Result of successful operation or fallback
 */
export async function executeWithFallback<T>(
  operation: () => Promise<T>,
  errorHandler: SvgConsolidationErrorHandler,
  fallbackStrategies: Array<() => Promise<T>> = []
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    errorHandler.recordError(
      ErrorSeverity.ERROR,
      ErrorCategory.VALIDATION,
      'Primary operation failed',
      {
        originalError: error as Error,
        canRecover: fallbackStrategies.length > 0,
        recoveryStrategy: fallbackStrategies.length > 0 ? 'try_fallback_strategies' : 'manual_intervention'
      }
    );

    // Try fallback strategies
    for (let i = 0; i < fallbackStrategies.length; i++) {
      try {
        errorHandler.recordInfo(
          ErrorCategory.VALIDATION,
          `Attempting fallback strategy ${i + 1}/${fallbackStrategies.length}`
        );
        return await fallbackStrategies[i]();
      } catch (fallbackError) {
        errorHandler.recordWarning(
          ErrorCategory.VALIDATION,
          `Fallback strategy ${i + 1} failed`,
          undefined,
          { fallbackError: fallbackError as Error }
        );
      }
    }

    // All strategies failed
    throw error;
  }
}