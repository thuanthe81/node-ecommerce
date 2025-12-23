/**
 * Interface for CSS injection functionality in email templates.
 * Handles loading CSS design files, preprocessing with design tokens, and injecting into templates.
 */
export interface ICSSInjector {
  /**
   * Load CSS file and inject it into the provided template
   * @param templateName - Name of the template (used to find corresponding CSS file)
   * @param template - HTML template content
   * @returns Template with injected CSS
   */
  loadAndInjectCSS(templateName: string, template: string): Promise<string>;

  /**
   * Load a CSS file from the file system
   * @param cssFileName - Name of the CSS file to load
   * @returns CSS content as string
   */
  loadCSSFile(cssFileName: string): Promise<string>;

  /**
   * Preprocess CSS content by replacing design token placeholders with actual values
   * @param cssContent - Raw CSS content
   * @param designTokens - Design token values to inject
   * @returns Processed CSS content
   */
  preprocessCSS(cssContent: string, designTokens: any): string;

  /**
   * Reload all CSS files (useful for development)
   */
  reloadCSS(): Promise<void>;

  /**
   * Enable hot-reloading for all CSS files (development mode only)
   */
  enableHotReloading(): Promise<void>;

  /**
   * Disable hot-reloading for all CSS files
   */
  disableHotReloading(): Promise<void>;

  /**
   * Get hot-reloading status
   * @returns True if hot-reloading is enabled and active
   */
  isHotReloadingEnabled(): boolean;

  /**
   * Get list of currently watched CSS files
   * @returns Array of CSS file names being watched
   */
  getWatchedFiles(): string[];

  /**
   * Check if a CSS file exists
   * @param cssFileName - Name of the CSS file to check
   * @returns True if file exists, false otherwise
   */
  cssFileExists(cssFileName: string): boolean;

  /**
   * Get the full path to a CSS file
   * @param cssFileName - Name of the CSS file
   * @returns Full file system path
   */
  getCSSFilePath(cssFileName: string): string;
}

/**
 * Configuration for CSS Injector
 */
export interface CSSInjectorConfig {
  /** Base directory for CSS files */
  stylesPath: string;

  /** Whether running in development mode (enables hot reloading) */
  isDevelopment: boolean;

  /** Whether to minify CSS in production */
  minifyCSS: boolean;

  /** Whether to include fallback styles for missing CSS files */
  includeFallbacks: boolean;

  /** Default CSS content to use when CSS files are missing */
  defaultCSS?: string;
}

/**
 * Error thrown when CSS file operations fail
 */
export class CSSLoadError extends Error {
  constructor(
    public readonly cssFileName: string,
    public readonly filePath: string,
    public readonly originalError: Error
  ) {
    super(`Failed to load CSS file '${cssFileName}' from '${filePath}': ${originalError.message}`);
    this.name = 'CSSLoadError';
  }
}

/**
 * Error thrown when CSS validation fails
 */
export class CSSValidationError extends Error {
  constructor(
    public readonly cssFileName: string,
    public readonly validationErrors: string[]
  ) {
    super(`CSS validation failed for '${cssFileName}': ${validationErrors.join(', ')}`);
    this.name = 'CSSValidationError';
  }
}