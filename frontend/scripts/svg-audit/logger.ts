/**
 * Comprehensive logging system for SVG consolidation operations
 * Requirements: 5.5
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: string;
  message: string;
  details?: any;
  context?: Record<string, any>;
}

export interface LoggerOptions {
  /** Minimum log level to output */
  level: LogLevel;
  /** Whether to include timestamps in output */
  includeTimestamp: boolean;
  /** Whether to use colors in console output */
  useColors: boolean;
  /** Whether to save logs to file */
  saveToFile: boolean;
  /** File path for log output */
  logFilePath?: string;
  /** Maximum number of log entries to keep in memory */
  maxLogEntries: number;
}

export class SvgConsolidationLogger {
  private options: LoggerOptions;
  private logEntries: LogEntry[] = [];
  private logFile?: string;

  constructor(options: Partial<LoggerOptions> = {}) {
    this.options = {
      level: LogLevel.INFO,
      includeTimestamp: true,
      useColors: true,
      saveToFile: false,
      maxLogEntries: 1000,
      ...options
    };

    if (this.options.saveToFile && this.options.logFilePath) {
      this.logFile = this.options.logFilePath;
    }
  }

  /**
   * Log a debug message
   * @param category Log category
   * @param message Log message
   * @param details Additional details
   * @param context Context information
   */
  public debug(category: string, message: string, details?: any, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, category, message, details, context);
  }

  /**
   * Log an info message
   * @param category Log category
   * @param message Log message
   * @param details Additional details
   * @param context Context information
   */
  public info(category: string, message: string, details?: any, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, category, message, details, context);
  }

  /**
   * Log a warning message
   * @param category Log category
   * @param message Log message
   * @param details Additional details
   * @param context Context information
   */
  public warn(category: string, message: string, details?: any, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, category, message, details, context);
  }

  /**
   * Log an error message
   * @param category Log category
   * @param message Log message
   * @param details Additional details
   * @param context Context information
   */
  public error(category: string, message: string, details?: any, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, category, message, details, context);
  }

  /**
   * Log a message with specified level
   * @param level Log level
   * @param category Log category
   * @param message Log message
   * @param details Additional details
   * @param context Context information
   */
  private log(
    level: LogLevel,
    category: string,
    message: string,
    details?: any,
    context?: Record<string, any>
  ): void {
    // Skip if below minimum log level
    if (level < this.options.level) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      details,
      context
    };

    // Add to memory log
    this.logEntries.push(entry);

    // Trim log entries if exceeding maximum
    if (this.logEntries.length > this.options.maxLogEntries) {
      this.logEntries = this.logEntries.slice(-this.options.maxLogEntries);
    }

    // Output to console
    this.outputToConsole(entry);

    // Save to file if enabled
    if (this.options.saveToFile && this.logFile) {
      this.outputToFile(entry);
    }
  }

  /**
   * Output log entry to console
   * @param entry Log entry to output
   */
  private outputToConsole(entry: LogEntry): void {
    const timestamp = this.options.includeTimestamp
      ? `[${entry.timestamp.toISOString()}] `
      : '';

    const levelStr = LogLevel[entry.level].padEnd(5);
    const categoryStr = entry.category.padEnd(12);

    let message = `${timestamp}${levelStr} ${categoryStr} ${entry.message}`;

    if (entry.details) {
      message += `\n  Details: ${typeof entry.details === 'string' ? entry.details : JSON.stringify(entry.details, null, 2)}`;
    }

    if (entry.context && Object.keys(entry.context).length > 0) {
      message += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`;
    }

    // Apply colors if enabled
    if (this.options.useColors) {
      message = this.applyColors(message, entry.level);
    }

    // Output based on level
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message);
        break;
      case LogLevel.INFO:
        console.info(message);
        break;
      case LogLevel.WARN:
        console.warn(message);
        break;
      case LogLevel.ERROR:
        console.error(message);
        break;
    }
  }

  /**
   * Apply colors to log message based on level
   * @param message Message to colorize
   * @param level Log level
   * @returns Colorized message
   */
  private applyColors(message: string, level: LogLevel): string {
    // ANSI color codes
    const colors = {
      reset: '\x1b[0m',
      debug: '\x1b[36m',    // Cyan
      info: '\x1b[32m',     // Green
      warn: '\x1b[33m',     // Yellow
      error: '\x1b[31m',    // Red
    };

    switch (level) {
      case LogLevel.DEBUG:
        return `${colors.debug}${message}${colors.reset}`;
      case LogLevel.INFO:
        return `${colors.info}${message}${colors.reset}`;
      case LogLevel.WARN:
        return `${colors.warn}${message}${colors.reset}`;
      case LogLevel.ERROR:
        return `${colors.error}${message}${colors.reset}`;
      default:
        return message;
    }
  }

  /**
   * Output log entry to file
   * @param entry Log entry to output
   */
  private async outputToFile(entry: LogEntry): Promise<void> {
    if (!this.logFile) return;

    try {
      const fs = await import('fs');
      const logLine = this.formatLogEntryForFile(entry);
      await fs.promises.appendFile(this.logFile, logLine + '\n', 'utf-8');
    } catch (error) {
      // Avoid infinite recursion by not logging file write errors
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Format log entry for file output
   * @param entry Log entry to format
   * @returns Formatted log line
   */
  private formatLogEntryForFile(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = LogLevel[entry.level];
    const category = entry.category;
    const message = entry.message;

    let logLine = `${timestamp} [${level}] ${category}: ${message}`;

    if (entry.details) {
      logLine += ` | Details: ${typeof entry.details === 'string' ? entry.details : JSON.stringify(entry.details)}`;
    }

    if (entry.context && Object.keys(entry.context).length > 0) {
      logLine += ` | Context: ${JSON.stringify(entry.context)}`;
    }

    return logLine;
  }

  /**
   * Get all log entries
   * @returns Array of all log entries
   */
  public getLogEntries(): LogEntry[] {
    return [...this.logEntries];
  }

  /**
   * Get log entries filtered by level
   * @param level Minimum log level to include
   * @returns Filtered log entries
   */
  public getLogEntriesByLevel(level: LogLevel): LogEntry[] {
    return this.logEntries.filter(entry => entry.level >= level);
  }

  /**
   * Get log entries filtered by category
   * @param category Category to filter by
   * @returns Filtered log entries
   */
  public getLogEntriesByCategory(category: string): LogEntry[] {
    return this.logEntries.filter(entry => entry.category === category);
  }

  /**
   * Clear all log entries from memory
   */
  public clearLogs(): void {
    this.logEntries = [];
  }

  /**
   * Set log level
   * @param level New log level
   */
  public setLogLevel(level: LogLevel): void {
    this.options.level = level;
  }

  /**
   * Generate a summary of log entries
   * @returns Log summary
   */
  public generateLogSummary(): {
    totalEntries: number;
    entriesByLevel: Record<string, number>;
    entriesByCategory: Record<string, number>;
    timeRange: { start: Date; end: Date } | null;
  } {
    const entriesByLevel: Record<string, number> = {};
    const entriesByCategory: Record<string, number> = {};

    // Initialize level counts
    Object.values(LogLevel).forEach(level => {
      if (typeof level === 'string') {
        entriesByLevel[level] = 0;
      }
    });

    let startTime: Date | null = null;
    let endTime: Date | null = null;

    for (const entry of this.logEntries) {
      // Count by level
      const levelName = LogLevel[entry.level];
      entriesByLevel[levelName]++;

      // Count by category
      entriesByCategory[entry.category] = (entriesByCategory[entry.category] || 0) + 1;

      // Track time range
      if (!startTime || entry.timestamp < startTime) {
        startTime = entry.timestamp;
      }
      if (!endTime || entry.timestamp > endTime) {
        endTime = entry.timestamp;
      }
    }

    return {
      totalEntries: this.logEntries.length,
      entriesByLevel,
      entriesByCategory,
      timeRange: startTime && endTime ? { start: startTime, end: endTime } : null
    };
  }

  /**
   * Export logs as JSON
   * @returns JSON string of all log entries
   */
  public exportLogsAsJson(): string {
    return JSON.stringify(this.logEntries, null, 2);
  }

  /**
   * Export logs as CSV
   * @returns CSV string of all log entries
   */
  public exportLogsAsCsv(): string {
    const headers = ['timestamp', 'level', 'category', 'message', 'details', 'context'];
    const csvLines = [headers.join(',')];

    for (const entry of this.logEntries) {
      const row = [
        entry.timestamp.toISOString(),
        LogLevel[entry.level],
        entry.category,
        `"${entry.message.replace(/"/g, '""')}"`,
        entry.details ? `"${JSON.stringify(entry.details).replace(/"/g, '""')}"` : '',
        entry.context ? `"${JSON.stringify(entry.context).replace(/"/g, '""')}"` : ''
      ];
      csvLines.push(row.join(','));
    }

    return csvLines.join('\n');
  }

  /**
   * Save logs to file in specified format
   * @param filePath Path to save logs
   * @param format Export format
   */
  public async saveLogs(filePath: string, format: 'json' | 'csv' | 'txt' = 'txt'): Promise<void> {
    const fs = await import('fs');
    let content: string;

    switch (format) {
      case 'json':
        content = this.exportLogsAsJson();
        break;
      case 'csv':
        content = this.exportLogsAsCsv();
        break;
      case 'txt':
      default:
        content = this.logEntries.map(entry => this.formatLogEntryForFile(entry)).join('\n');
        break;
    }

    await fs.promises.writeFile(filePath, content, 'utf-8');
    this.info('logger', `Logs saved to ${filePath} in ${format} format`);
  }

  /**
   * Create a child logger with additional context
   * @param category Category for the child logger
   * @param context Additional context to include in all logs
   * @returns Child logger instance
   */
  public createChildLogger(category: string, context?: Record<string, any>): ChildLogger {
    return new ChildLogger(this, category, context);
  }
}

/**
 * Child logger that automatically includes category and context
 */
export class ChildLogger {
  constructor(
    private parent: SvgConsolidationLogger,
    private category: string,
    private context?: Record<string, any>
  ) {}

  public debug(message: string, details?: any, additionalContext?: Record<string, any>): void {
    this.parent.debug(this.category, message, details, { ...this.context, ...additionalContext });
  }

  public info(message: string, details?: any, additionalContext?: Record<string, any>): void {
    this.parent.info(this.category, message, details, { ...this.context, ...additionalContext });
  }

  public warn(message: string, details?: any, additionalContext?: Record<string, any>): void {
    this.parent.warn(this.category, message, details, { ...this.context, ...additionalContext });
  }

  public error(message: string, details?: any, additionalContext?: Record<string, any>): void {
    this.parent.error(this.category, message, details, { ...this.context, ...additionalContext });
  }
}

/**
 * Utility function to create a logger with default options
 * @param options Logger options
 * @returns Logger instance
 */
export function createLogger(options?: Partial<LoggerOptions>): SvgConsolidationLogger {
  return new SvgConsolidationLogger(options);
}

/**
 * Utility function to create a logger for development
 * @returns Logger configured for development
 */
export function createDevelopmentLogger(): SvgConsolidationLogger {
  return new SvgConsolidationLogger({
    level: LogLevel.DEBUG,
    includeTimestamp: true,
    useColors: true,
    saveToFile: false
  });
}

/**
 * Utility function to create a logger for production
 * @param logFilePath Path to save logs
 * @returns Logger configured for production
 */
export function createProductionLogger(logFilePath: string): SvgConsolidationLogger {
  return new SvgConsolidationLogger({
    level: LogLevel.INFO,
    includeTimestamp: true,
    useColors: false,
    saveToFile: true,
    logFilePath
  });
}