/**
 * Interface for loading and caching HTML template files from the file system.
 * Supports template caching for performance and hot-reloading for development.
 */
export interface ITemplateLoader {
  /**
   * Load a template by name from the templates directory.
   * Templates are cached after first load for performance.
   *
   * @param templateName - Name of the template file without extension (e.g., 'order-confirmation')
   * @returns Promise resolving to the template HTML content
   * @throws TemplateNotFoundError if template file doesn't exist
   * @throws TemplateLoadError if file cannot be read
   */
  loadTemplate(templateName: string): Promise<string>;

  /**
   * Reload all cached templates from the file system.
   * Useful for development when templates are modified.
   *
   * @returns Promise that resolves when all templates are reloaded
   */
  reloadTemplates(): Promise<void>;

  /**
   * Check if a template file exists in the templates directory.
   *
   * @param templateName - Name of the template file without extension
   * @returns True if template exists, false otherwise
   */
  templateExists(templateName: string): boolean;

  /**
   * Clear the template cache.
   * Forces next loadTemplate call to read from file system.
   */
  clearCache(): void;

  /**
   * Get the full path to a template file.
   *
   * @param templateName - Name of the template file without extension
   * @returns Full file system path to the template
   */
  getTemplatePath(templateName: string): string;

  /**
   * Load a partial template by name from the partials directory.
   * Partial templates are cached after first load for performance.
   *
   * @param partialName - Name of the partial template file without extension (e.g., 'email-header')
   * @returns Promise resolving to the partial template content
   * @throws TemplateNotFoundError if partial template file doesn't exist
   * @throws TemplateLoadError if file cannot be read
   */
  loadPartial(partialName: string): Promise<string>;

  /**
   * Check if a partial template file exists in the partials directory.
   *
   * @param partialName - Name of the partial template file without extension
   * @returns True if partial template exists, false otherwise
   */
  partialExists(partialName: string): boolean;

  /**
   * Get the full path to a partial template file.
   *
   * @param partialName - Name of the partial template file without extension
   * @returns Full file system path to the partial template
   */
  getPartialPath(partialName: string): string;

  /**
   * Get all available partial template names.
   *
   * @returns Array of partial template names (without extensions)
   */
  getAvailablePartials(): Promise<string[]>;
}

/**
 * Configuration options for TemplateLoader
 */
export interface TemplateLoaderConfig {
  /** Base path to templates directory */
  templatesPath: string;

  /** Whether running in development mode (enables hot reloading) */
  isDevelopment: boolean;

  /** Template file extension (default: '.html') */
  templateExtension?: string;

  /** Whether to enable template caching (default: true) */
  enableCaching?: boolean;

  /** Path to partial templates directory */
  partialsPath?: string;

  /** Partial template file extension (default: '.hbs') */
  partialExtension?: string;
}