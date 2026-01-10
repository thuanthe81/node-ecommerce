/**
 * Next.js Cache Invariant Error Handler
 *
 * This module provides detection and handling for Next.js cache invariant errors
 * that occur during static generation, specifically the "Expected cached value
 * for cache key to be a 'FETCH' kind, got undefined instead" error.
 */

export interface CacheInvariantConfig {
  maxRetryAttempts: number; // 3 attempts
  retryDelayMs: number; // 1000ms between retries
  cacheValidationEnabled: boolean; // true
  fallbackToSSR: boolean; // true
  logLevel: 'error' | 'warn' | 'info'; // 'error'
  enableDetailedLogging: boolean; // true for debugging
}

export interface CacheInvariantError {
  type: 'FETCH_KIND_MISMATCH' | 'UNDEFINED_CACHE_VALUE' | 'CACHE_CORRUPTION' | 'UNKNOWN_INVARIANT';
  cacheKey: string;
  expectedKind: string;
  actualKind: string | undefined;
  message: string;
  timestamp: Date;
  pageId?: string;
  originalError: Error;
  stackTrace?: string;
}

export interface CacheValidationResult {
  isValid: boolean;
  corruptedKeys: string[];
  errors: CacheInvariantError[];
  validationTimestamp: Date;
}

export interface RecoveryResult {
  success: boolean;
  strategy: 'cache_clear' | 'retry' | 'fallback_ssr' | 'selective_clear';
  attemptsUsed: number;
  recoveryTime: number;
  error?: Error;
}

// Default configuration
const DEFAULT_CONFIG: CacheInvariantConfig = {
  maxRetryAttempts: 3,
  retryDelayMs: 1000,
  cacheValidationEnabled: true,
  fallbackToSSR: true,
  logLevel: 'error',
  enableDetailedLogging: process.env.NODE_ENV === 'development',
};

// Error pattern matching for Next.js cache invariant errors
const INVARIANT_ERROR_PATTERNS = [
  // Primary pattern for the main error
  /Invariant.*Expected cached value.*for cache key.*to be a.*kind.*got.*instead/i,

  // Secondary patterns for related errors
  /This is a bug in Next\.js/i,
  /cache key.*FETCH.*undefined/i,
  /Expected.*FETCH.*got.*undefined/i,

  // Additional patterns for cache corruption
  /Cache.*corrupted/i,
  /Invalid cache state/i,
  /Cache.*inconsistent/i,

  // Build-time specific patterns
  /Static generation.*cache.*error/i,
  /Build.*cache.*invariant/i,
] as const;

// Cache key extraction patterns
const CACHE_KEY_PATTERNS = [
  /cache key "([^"]+)"/i,
  /key "([^"]+)"/i,
  /cache.*key.*:.*"([^"]+)"/i,
  /for key ([^\s]+)/i,
] as const;

// Expected/actual kind extraction patterns
const KIND_PATTERNS = {
  expected: [
    /to be a[n]? "([^"]+)" kind/i,
    /expected.*"([^"]+)"/i,
    /should be "([^"]+)"/i,
  ],
  actual: [
    /got "([^"]+)" instead/i,
    /but got "([^"]+)"/i,
    /actual.*"([^"]+)"/i,
    /received "([^"]+)"/i,
  ],
} as const;

/**
 * Cache Invariant Error Detection and Handling System
 */
export class CacheInvariantHandler {
  private config: CacheInvariantConfig;
  private detectedErrors: CacheInvariantError[] = [];
  private recoveryAttempts: Map<string, number> = new Map();

  constructor(config: Partial<CacheInvariantConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (this.config.enableDetailedLogging) {
      console.log('[CACHE INVARIANT] Handler initialized with config:', this.config);
    }
  }

  /**
   * Detects if an error is a Next.js cache invariant error
   */
  detectInvariantError(error: Error): boolean {
    if (!error || !error.message) {
      return false;
    }

    const message = error.message;
    const stack = error.stack || '';
    const fullText = `${message} ${stack}`;

    // Check against all known patterns
    const isInvariantError = INVARIANT_ERROR_PATTERNS.some(pattern =>
      pattern.test(fullText)
    );

    if (isInvariantError && this.config.enableDetailedLogging) {
      console.log('[CACHE INVARIANT] Detected cache invariant error:', {
        message: message.substring(0, 200),
        hasStack: !!error.stack,
        errorType: error.constructor.name,
      });
    }

    return isInvariantError;
  }

  /**
   * Extracts cache key from error message
   */
  extractCacheKey(error: Error): string {
    const message = error.message;
    const stack = error.stack || '';
    const fullText = `${message} ${stack}`;

    for (const pattern of CACHE_KEY_PATTERNS) {
      const match = fullText.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    // Fallback: try to extract any quoted string that looks like a cache key
    const quotedStrings = fullText.match(/"([^"]+)"/g);
    if (quotedStrings) {
      // Look for strings that contain typical cache key patterns
      const cacheKeyLike = quotedStrings.find(str =>
        str.includes('fetch') ||
        str.includes('static') ||
        str.includes('page') ||
        str.length > 10
      );

      if (cacheKeyLike) {
        return cacheKeyLike.replace(/"/g, '');
      }
    }

    return 'unknown';
  }

  /**
   * Extracts expected and actual kinds from error message
   */
  extractKinds(error: Error): { expected: string; actual: string | undefined } {
    const message = error.message;
    const stack = error.stack || '';
    const fullText = `${message} ${stack}`;

    let expected = 'unknown';
    let actual: string | undefined = undefined;

    // Extract expected kind
    for (const pattern of KIND_PATTERNS.expected) {
      const match = fullText.match(pattern);
      if (match && match[1]) {
        expected = match[1];
        break;
      }
    }

    // Extract actual kind
    for (const pattern of KIND_PATTERNS.actual) {
      const match = fullText.match(pattern);
      if (match && match[1]) {
        actual = match[1];
        break;
      }
    }

    // Special handling for "undefined" case
    if (fullText.includes('got undefined instead')) {
      actual = 'undefined';
    }

    return { expected, actual };
  }

  /**
   * Categorizes the type of cache invariant error
   */
  categorizeError(error: Error, cacheKey: string, kinds: { expected: string; actual: string | undefined }): CacheInvariantError['type'] {
    const message = error.message.toLowerCase();

    if (message.includes('fetch') && kinds.actual === 'undefined') {
      return 'FETCH_KIND_MISMATCH';
    }

    if (kinds.actual === 'undefined' || message.includes('undefined')) {
      return 'UNDEFINED_CACHE_VALUE';
    }

    if (message.includes('corrupt') || message.includes('inconsistent')) {
      return 'CACHE_CORRUPTION';
    }

    return 'UNKNOWN_INVARIANT';
  }

  /**
   * Creates a structured cache invariant error object
   */
  createInvariantError(error: Error, pageId?: string): CacheInvariantError {
    const cacheKey = this.extractCacheKey(error);
    const kinds = this.extractKinds(error);
    const type = this.categorizeError(error, cacheKey, kinds);

    const invariantError: CacheInvariantError = {
      type,
      cacheKey,
      expectedKind: kinds.expected,
      actualKind: kinds.actual,
      message: error.message,
      timestamp: new Date(),
      pageId,
      originalError: error,
      stackTrace: error.stack,
    };

    // Store for tracking
    this.detectedErrors.push(invariantError);

    return invariantError;
  }

  /**
   * Logs cache invariant error with appropriate detail level
   */
  logInvariantError(error: CacheInvariantError): void {
    const logLevel = this.config.logLevel;
    const logFunction = console[logLevel] || console.error;

    const basicInfo = {
      type: error.type,
      cacheKey: error.cacheKey,
      expectedKind: error.expectedKind,
      actualKind: error.actualKind,
      pageId: error.pageId,
      timestamp: error.timestamp.toISOString(),
    };

    logFunction('[CACHE INVARIANT ERROR]', basicInfo);

    if (this.config.enableDetailedLogging) {
      console.error('[CACHE INVARIANT ERROR] Full details:', {
        ...basicInfo,
        message: error.message,
        stackTrace: error.stackTrace?.substring(0, 500) + '...',
      });
    }

    // Log recovery suggestions based on error type
    this.logRecoverySuggestions(error);
  }

  /**
   * Logs recovery suggestions based on error type
   */
  private logRecoverySuggestions(error: CacheInvariantError): void {
    const suggestions: string[] = [];

    switch (error.type) {
      case 'FETCH_KIND_MISMATCH':
        suggestions.push('Try clearing the fetch cache for this key');
        suggestions.push('Check if the API endpoint is returning consistent data');
        break;

      case 'UNDEFINED_CACHE_VALUE':
        suggestions.push('Clear the entire cache directory');
        suggestions.push('Verify cache initialization is working correctly');
        break;

      case 'CACHE_CORRUPTION':
        suggestions.push('Perform full cache cleanup');
        suggestions.push('Check for concurrent cache access issues');
        break;

      default:
        suggestions.push('Try clearing all caches and rebuilding');
        suggestions.push('Check Next.js version for known cache issues');
    }

    if (suggestions.length > 0 && this.config.enableDetailedLogging) {
      console.warn('[CACHE INVARIANT] Recovery suggestions:', suggestions);
    }
  }

  /**
   * Gets all detected cache invariant errors
   */
  getDetectedErrors(): CacheInvariantError[] {
    return [...this.detectedErrors];
  }

  /**
   * Gets error statistics for monitoring
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<CacheInvariantError['type'], number>;
    errorsByPage: Record<string, number>;
    mostCommonCacheKeys: Array<{ key: string; count: number }>;
  } {
    const errorsByType: Record<CacheInvariantError['type'], number> = {
      FETCH_KIND_MISMATCH: 0,
      UNDEFINED_CACHE_VALUE: 0,
      CACHE_CORRUPTION: 0,
      UNKNOWN_INVARIANT: 0,
    };

    const errorsByPage: Record<string, number> = {};
    const cacheKeyCount: Record<string, number> = {};

    this.detectedErrors.forEach(error => {
      errorsByType[error.type]++;

      if (error.pageId) {
        errorsByPage[error.pageId] = (errorsByPage[error.pageId] || 0) + 1;
      }

      cacheKeyCount[error.cacheKey] = (cacheKeyCount[error.cacheKey] || 0) + 1;
    });

    const mostCommonCacheKeys = Object.entries(cacheKeyCount)
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalErrors: this.detectedErrors.length,
      errorsByType,
      errorsByPage,
      mostCommonCacheKeys,
    };
  }

  /**
   * Clears error tracking (useful for testing)
   */
  clearErrorTracking(): void {
    this.detectedErrors.length = 0;
    this.recoveryAttempts.clear();
  }

  /**
   * Updates configuration
   */
  updateConfig(newConfig: Partial<CacheInvariantConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (this.config.enableDetailedLogging) {
      console.log('[CACHE INVARIANT] Configuration updated:', this.config);
    }
  }
}

/**
 * Creates a default cache invariant handler instance
 */
export function createCacheInvariantHandler(config?: Partial<CacheInvariantConfig>): CacheInvariantHandler {
  return new CacheInvariantHandler(config);
}

/**
 * Quick detection function for use in error boundaries
 */
export function isNextJsCacheInvariantError(error: Error): boolean {
  const handler = new CacheInvariantHandler({ enableDetailedLogging: false });
  return handler.detectInvariantError(error);
}

/**
 * Quick extraction function for cache key
 */
export function extractCacheKeyFromError(error: Error): string {
  const handler = new CacheInvariantHandler({ enableDetailedLogging: false });
  return handler.extractCacheKey(error);
}

/**
 * Cache Clearing and Recovery Mechanisms
 */
export class CacheRecoveryManager {
  private config: CacheInvariantConfig;
  private fs: any;
  private path: any;

  constructor(config: Partial<CacheInvariantConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Dynamically import Node.js modules to avoid issues in browser environments
    try {
      this.fs = require('fs');
      this.path = require('path');
    } catch (error) {
      console.warn('[CACHE RECOVERY] Node.js modules not available, cache clearing disabled');
    }
  }

  /**
   * Clears corrupted cache for a specific cache key
   */
  async clearCorruptedCache(cacheKey?: string): Promise<void> {
    if (!this.fs || !this.path) {
      console.warn('[CACHE RECOVERY] File system access not available');
      return;
    }

    const startTime = Date.now();

    try {
      if (cacheKey && cacheKey !== 'unknown') {
        await this.clearSpecificCacheKey(cacheKey);
      } else {
        await this.clearAllBuildCache();
      }

      const duration = Date.now() - startTime;
      console.log(`[CACHE RECOVERY] Cache clearing completed in ${duration}ms`);
    } catch (error) {
      console.error('[CACHE RECOVERY] Failed to clear cache:', error);
      throw error;
    }
  }

  /**
   * Attempts to clear a specific cache key (selective clearing)
   */
  private async clearSpecificCacheKey(cacheKey: string): Promise<void> {
    console.warn(`[CACHE RECOVERY] Attempting selective cache clear for key: ${cacheKey}`);

    const cacheDir = this.path.join(process.cwd(), '.next/cache');

    if (!this.fs.existsSync(cacheDir)) {
      console.log('[CACHE RECOVERY] Cache directory does not exist, nothing to clear');
      return;
    }

    try {
      // Try to find and remove specific cache files related to the key
      const cacheFiles = await this.findCacheFilesForKey(cacheDir, cacheKey);

      if (cacheFiles.length > 0) {
        console.log(`[CACHE RECOVERY] Found ${cacheFiles.length} cache files for key ${cacheKey}`);

        for (const file of cacheFiles) {
          try {
            this.fs.unlinkSync(file);
            console.log(`[CACHE RECOVERY] Removed cache file: ${this.path.basename(file)}`);
          } catch (error) {
            console.warn(`[CACHE RECOVERY] Failed to remove cache file ${file}:`, error);
          }
        }
      } else {
        console.log(`[CACHE RECOVERY] No specific cache files found for key ${cacheKey}, falling back to full cache clear`);
        await this.clearAllBuildCache();
      }
    } catch (error) {
      console.warn(`[CACHE RECOVERY] Selective cache clear failed, falling back to full cache clear:`, error);
      await this.clearAllBuildCache();
    }
  }

  /**
   * Finds cache files related to a specific cache key
   */
  private async findCacheFilesForKey(cacheDir: string, cacheKey: string): Promise<string[]> {
    const cacheFiles: string[] = [];

    try {
      const searchPatterns = [
        cacheKey,
        Buffer.from(cacheKey).toString('base64').substring(0, 20),
        cacheKey.replace(/[^a-zA-Z0-9]/g, ''),
      ];

      await this.searchCacheDirectory(cacheDir, searchPatterns, cacheFiles);
    } catch (error) {
      console.warn('[CACHE RECOVERY] Error searching cache directory:', error);
    }

    return cacheFiles;
  }

  /**
   * Recursively searches cache directory for files matching patterns
   */
  private async searchCacheDirectory(dir: string, patterns: string[], results: string[]): Promise<void> {
    if (!this.fs.existsSync(dir)) {
      return;
    }

    const entries = this.fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = this.path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await this.searchCacheDirectory(fullPath, patterns, results);
      } else if (entry.isFile()) {
        // Check if filename contains any of the patterns
        const filename = entry.name.toLowerCase();
        const matchesPattern = patterns.some(pattern =>
          filename.includes(pattern.toLowerCase()) ||
          filename.includes(pattern.substring(0, 10).toLowerCase())
        );

        if (matchesPattern) {
          results.push(fullPath);
        }
      }
    }
  }

  /**
   * Clears the entire Next.js build cache directory
   */
  private async clearAllBuildCache(): Promise<void> {
    console.warn('[CACHE RECOVERY] Clearing entire build cache directory');

    const cacheDir = this.path.join(process.cwd(), '.next/cache');

    if (!this.fs.existsSync(cacheDir)) {
      console.log('[CACHE RECOVERY] Cache directory does not exist, nothing to clear');
      return;
    }

    try {
      // Remove the entire cache directory
      this.fs.rmSync(cacheDir, { recursive: true, force: true });
      console.log('[CACHE RECOVERY] Successfully removed cache directory');

      // Recreate the cache directory to avoid issues
      this.fs.mkdirSync(cacheDir, { recursive: true });
      console.log('[CACHE RECOVERY] Recreated cache directory');
    } catch (error) {
      console.error('[CACHE RECOVERY] Failed to clear cache directory:', error);
      throw error;
    }
  }

  /**
   * Validates cache state before operations
   */
  async validateCacheState(): Promise<CacheValidationResult> {
    const startTime = Date.now();
    const result: CacheValidationResult = {
      isValid: true,
      corruptedKeys: [],
      errors: [],
      validationTimestamp: new Date(),
    };

    if (!this.fs || !this.path) {
      console.warn('[CACHE RECOVERY] Cannot validate cache state - file system access not available');
      return result;
    }

    try {
      const cacheDir = this.path.join(process.cwd(), '.next/cache');

      if (!this.fs.existsSync(cacheDir)) {
        console.log('[CACHE RECOVERY] Cache directory does not exist - cache is valid (empty)');
        return result;
      }

      // Check for common cache corruption indicators
      await this.checkCacheIntegrity(cacheDir, result);

      const duration = Date.now() - startTime;
      console.log(`[CACHE RECOVERY] Cache validation completed in ${duration}ms - Valid: ${result.isValid}`);

    } catch (error) {
      console.error('[CACHE RECOVERY] Cache validation failed:', error);
      result.isValid = false;
      result.errors.push({
        type: 'CACHE_CORRUPTION',
        cacheKey: 'validation',
        expectedKind: 'valid',
        actualKind: 'corrupted',
        message: `Cache validation failed: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date(),
        originalError: error as Error,
      });
    }

    return result;
  }

  /**
   * Checks cache integrity by looking for corruption indicators
   */
  private async checkCacheIntegrity(cacheDir: string, result: CacheValidationResult): Promise<void> {
    try {
      const entries = this.fs.readdirSync(cacheDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = this.path.join(cacheDir, entry.name);

        if (entry.isFile()) {
          try {
            // Check if file is readable and not corrupted
            const stats = this.fs.statSync(fullPath);

            // Check for zero-byte files (potential corruption)
            if (stats.size === 0) {
              result.corruptedKeys.push(entry.name);
              result.isValid = false;
              console.warn(`[CACHE RECOVERY] Found zero-byte cache file: ${entry.name}`);
            }

            // Check for very old cache files (potential stale data)
            const ageMs = Date.now() - stats.mtime.getTime();
            const maxAgeMs = 24 * 60 * 60 * 1000; // 24 hours

            if (ageMs > maxAgeMs) {
              console.warn(`[CACHE RECOVERY] Found stale cache file: ${entry.name} (${Math.round(ageMs / 1000 / 60 / 60)}h old)`);
            }

          } catch (error) {
            result.corruptedKeys.push(entry.name);
            result.isValid = false;
            console.warn(`[CACHE RECOVERY] Cannot access cache file ${entry.name}:`, error);
          }
        } else if (entry.isDirectory()) {
          // Recursively check subdirectories
          await this.checkCacheIntegrity(fullPath, result);
        }
      }
    } catch (error) {
      console.warn('[CACHE RECOVERY] Error checking cache integrity:', error);
      result.isValid = false;
    }
  }

  /**
   * Implements retry logic with cache clearing between attempts
   */
  async retryWithCacheClear<T>(
    operation: () => Promise<T>,
    maxAttempts: number = this.config.maxRetryAttempts,
    cacheKey?: string
  ): Promise<T> {
    let lastError: Error = new Error('No attempts made');
    const startTime = Date.now();

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`[CACHE RECOVERY] Retry attempt ${attempt}/${maxAttempts}`);

        const result = await operation();

        if (attempt > 1) {
          const duration = Date.now() - startTime;
          console.log(`[CACHE RECOVERY] Operation succeeded on attempt ${attempt} after ${duration}ms`);
        }

        return result;
      } catch (error) {
        lastError = error as Error;

        console.warn(`[CACHE RECOVERY] Attempt ${attempt} failed:`, error instanceof Error ? error.message : String(error));

        if (attempt < maxAttempts) {
          // Clear cache before next attempt
          try {
            await this.clearCorruptedCache(cacheKey);
          } catch (clearError) {
            console.error('[CACHE RECOVERY] Failed to clear cache between retries:', clearError);
          }

          // Wait before next attempt with exponential backoff
          const delay = this.config.retryDelayMs * Math.pow(2, attempt - 1);
          console.log(`[CACHE RECOVERY] Waiting ${delay}ms before next attempt`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    const totalDuration = Date.now() - startTime;
    console.error(`[CACHE RECOVERY] All ${maxAttempts} attempts failed after ${totalDuration}ms`);
    throw lastError;
  }

  /**
   * Handles cache invariant error with appropriate recovery strategy
   */
  async handleInvariantError(error: CacheInvariantError): Promise<RecoveryResult> {
    const startTime = Date.now();

    console.error(`[CACHE RECOVERY] Handling cache invariant error: ${error.type}`);
    console.error(`[CACHE RECOVERY] Cache key: ${error.cacheKey}`);
    console.error(`[CACHE RECOVERY] Expected: ${error.expectedKind}, Got: ${error.actualKind}`);

    try {
      let strategy: RecoveryResult['strategy'];

      // Choose recovery strategy based on error type
      switch (error.type) {
        case 'FETCH_KIND_MISMATCH':
          strategy = 'selective_clear';
          await this.clearCorruptedCache(error.cacheKey);
          break;

        case 'UNDEFINED_CACHE_VALUE':
          strategy = 'cache_clear';
          await this.clearCorruptedCache();
          break;

        case 'CACHE_CORRUPTION':
          strategy = 'cache_clear';
          await this.clearCorruptedCache();
          break;

        default:
          strategy = 'cache_clear';
          await this.clearCorruptedCache();
      }

      const recoveryTime = Date.now() - startTime;

      return {
        success: true,
        strategy,
        attemptsUsed: 1,
        recoveryTime,
      };
    } catch (recoveryError) {
      const recoveryTime = Date.now() - startTime;

      console.error('[CACHE RECOVERY] Recovery failed:', recoveryError);

      return {
        success: false,
        strategy: 'cache_clear',
        attemptsUsed: 1,
        recoveryTime,
        error: recoveryError as Error,
      };
    }
  }

  /**
   * Performs cache cleanup and optimization
   */
  async optimizeCache(): Promise<void> {
    console.log('[CACHE RECOVERY] Starting cache optimization');

    if (!this.fs || !this.path) {
      console.warn('[CACHE RECOVERY] Cannot optimize cache - file system access not available');
      return;
    }

    const cacheDir = this.path.join(process.cwd(), '.next/cache');

    if (!this.fs.existsSync(cacheDir)) {
      console.log('[CACHE RECOVERY] No cache directory to optimize');
      return;
    }

    try {
      let removedFiles = 0;
      let totalSizeBefore = 0;
      let totalSizeAfter = 0;

      // Calculate initial cache size and remove stale files
      await this.optimizeCacheDirectory(cacheDir, (removed, sizeBefore, sizeAfter) => {
        removedFiles += removed;
        totalSizeBefore += sizeBefore;
        totalSizeAfter += sizeAfter;
      });

      const savedSpace = totalSizeBefore - totalSizeAfter;

      console.log('[CACHE RECOVERY] Cache optimization completed:', {
        removedFiles,
        savedSpaceMB: Math.round(savedSpace / 1024 / 1024 * 100) / 100,
        finalSizeMB: Math.round(totalSizeAfter / 1024 / 1024 * 100) / 100,
      });
    } catch (error) {
      console.error('[CACHE RECOVERY] Cache optimization failed:', error);
    }
  }

  /**
   * Recursively optimizes cache directory
   */
  private async optimizeCacheDirectory(
    dir: string,
    callback: (removed: number, sizeBefore: number, sizeAfter: number) => void
  ): Promise<void> {
    if (!this.fs.existsSync(dir)) {
      return;
    }

    const entries = this.fs.readdirSync(dir, { withFileTypes: true });
    let removedFiles = 0;
    let sizeBefore = 0;
    let sizeAfter = 0;

    for (const entry of entries) {
      const fullPath = this.path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await this.optimizeCacheDirectory(fullPath, callback);
      } else if (entry.isFile()) {
        try {
          const stats = this.fs.statSync(fullPath);
          sizeBefore += stats.size;

          // Remove files that are too old or corrupted
          const ageMs = Date.now() - stats.mtime.getTime();
          const maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 days

          if (ageMs > maxAgeMs || stats.size === 0) {
            this.fs.unlinkSync(fullPath);
            removedFiles++;
            console.log(`[CACHE RECOVERY] Removed stale/corrupted cache file: ${entry.name}`);
          } else {
            sizeAfter += stats.size;
          }
        } catch (error) {
          console.warn(`[CACHE RECOVERY] Error processing cache file ${entry.name}:`, error);
        }
      }
    }

    callback(removedFiles, sizeBefore, sizeAfter);
  }
}

/**
 * Creates a cache recovery manager instance
 */
export function createCacheRecoveryManager(config?: Partial<CacheInvariantConfig>): CacheRecoveryManager {
  return new CacheRecoveryManager(config);
}