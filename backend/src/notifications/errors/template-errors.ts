/**
 * Custom error classes for the email template system.
 * Provides specific error types for different template processing failures.
 */

/**
 * Base class for all template-related errors
 */
export abstract class TemplateError extends Error {
  constructor(
    message: string,
    public readonly templateName?: string,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Thrown when a template file cannot be found
 */
export class TemplateNotFoundError extends TemplateError {
  constructor(templateName: string, expectedPath: string) {
    super(
      `Template '${templateName}' not found at path: ${expectedPath}`,
      templateName,
      { expectedPath }
    );
  }
}

/**
 * Thrown when a template file cannot be loaded due to file system errors
 */
export class TemplateLoadError extends TemplateError {
  public readonly originalError: Error;

  constructor(templateName: string, filePath: string, cause: Error) {
    super(
      `Failed to load template '${templateName}' from ${filePath}: ${cause.message}`,
      templateName,
      { filePath, originalError: cause.message }
    );
    this.originalError = cause;
  }
}

/**
 * Thrown when a template contains invalid HTML structure
 */
export class TemplateValidationError extends TemplateError {
  constructor(templateName: string, validationErrors: string[]) {
    super(
      `Template '${templateName}' failed validation: ${validationErrors.join(', ')}`,
      templateName,
      { validationErrors }
    );
  }
}

/**
 * Thrown when Handlebars cannot compile a template due to syntax errors
 */
export class TemplateCompilationError extends TemplateError {
  constructor(templateName: string, compilationError: string, lineNumber?: number) {
    super(
      `Failed to compile template '${templateName}': ${compilationError}`,
      templateName,
      { compilationError, lineNumber }
    );
  }
}

/**
 * Thrown when template execution fails during variable replacement
 */
export class TemplateRuntimeError extends TemplateError {
  constructor(templateName: string, runtimeError: string, data?: any) {
    super(
      `Runtime error in template '${templateName}': ${runtimeError}`,
      templateName,
      { runtimeError, templateData: data }
    );
  }
}

/**
 * Thrown when templates directory is not found or inaccessible
 */
export class TemplateDirectoryError extends TemplateError {
  public readonly originalError?: Error;

  constructor(templatesPath: string, cause?: Error) {
    super(
      `Templates directory not found or inaccessible: ${templatesPath}`,
      undefined,
      { templatesPath, originalError: cause?.message }
    );
    this.originalError = cause;
  }
}

/**
 * Thrown when a required template variable is missing in strict mode
 */
export class MissingVariableError extends TemplateError {
  constructor(templateName: string, variableName: string, availableVariables: string[]) {
    super(
      `Required variable '${variableName}' is missing in template '${templateName}'`,
      templateName,
      { variableName, availableVariables }
    );
  }
}

/**
 * Thrown when design system injection fails
 */
export class DesignSystemInjectionError extends TemplateError {
  constructor(templateName: string, injectionError: string) {
    super(
      `Failed to inject design system into template '${templateName}': ${injectionError}`,
      templateName,
      { injectionError }
    );
  }
}

/**
 * Thrown when a partial template cannot be found or loaded
 */
export class PartialTemplateError extends TemplateError {
  constructor(partialName: string, message: string, expectedPath?: string) {
    super(
      `Partial template '${partialName}' error: ${message}`,
      partialName,
      { partialName, expectedPath }
    );
  }
}