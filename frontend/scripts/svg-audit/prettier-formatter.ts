/**
 * Prettier Formatting Integration System
 * Requirements: 4.2
 *
 * Applies Prettier formatting to all generated and modified code
 * Validates formatting compliance before file writes
 * Handles formatting errors gracefully
 */

import prettier from 'prettier';
import * as fs from 'fs';
import * as path from 'path';

export interface FormattingResult {
  /** Whether formatting was successful */
  success: boolean;
  /** Formatted code (if successful) */
  formattedCode?: string;
  /** Original code for comparison */
  originalCode: string;
  /** Error message if formatting failed */
  error?: string;
  /** Whether the code was already properly formatted */
  wasAlreadyFormatted: boolean;
}

export interface FormattingOptions {
  /** File path for context (helps determine parser) */
  filePath?: string;
  /** Prettier parser to use */
  parser?: string;
  /** Custom Prettier options */
  prettierOptions?: prettier.Options;
}

export class PrettierFormatter {
  private prettierConfig: prettier.Options = {};
  private configLoaded = false;

  /**
   * Load Prettier configuration from project
   */
  private async loadPrettierConfig(): Promise<prettier.Options> {
    if (this.configLoaded) {
      return this.prettierConfig;
    }

    try {
      // Try to load from project root
      const configPath = path.resolve(process.cwd(), '.prettierrc');

      if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, 'utf8');
        this.prettierConfig = JSON.parse(configContent);
      } else {
        // Fallback to default configuration matching project standards
        this.prettierConfig = {
          semi: true,
          trailingComma: 'all',
          singleQuote: true,
          printWidth: 100,
          tabWidth: 2,
          arrowParens: 'always',
          parser: 'typescript'
        };
      }
    } catch (error) {
      console.warn('Failed to load Prettier config, using defaults:', error);
      this.prettierConfig = {
        semi: true,
        trailingComma: 'all',
        singleQuote: true,
        printWidth: 100,
        tabWidth: 2,
        arrowParens: 'always',
        parser: 'typescript'
      };
    }

    this.configLoaded = true;
    return this.prettierConfig;
  }

  /**
   * Format TypeScript/JavaScript code using Prettier
   */
  async formatCode(
    code: string,
    options: FormattingOptions = {}
  ): Promise<FormattingResult> {
    try {
      const prettierConfig = await this.loadPrettierConfig();

      // Merge options
      const formatOptions: prettier.Options = {
        ...prettierConfig,
        ...options.prettierOptions,
        parser: options.parser || this.determineParser(options.filePath) || 'typescript'
      };

      // Check if code is already formatted
      const wasAlreadyFormatted = await this.isAlreadyFormatted(code, formatOptions);

      // Format the code
      const formattedCode = await prettier.format(code, formatOptions);

      return {
        success: true,
        formattedCode,
        originalCode: code,
        wasAlreadyFormatted
      };
    } catch (error) {
      return {
        success: false,
        originalCode: code,
        error: error instanceof Error ? error.message : 'Unknown formatting error',
        wasAlreadyFormatted: false
      };
    }
  }

  /**
   * Format multiple code snippets
   */
  async formatMultiple(
    codeSnippets: Array<{ code: string; options?: FormattingOptions }>
  ): Promise<FormattingResult[]> {
    const results: FormattingResult[] = [];

    for (const snippet of codeSnippets) {
      const result = await this.formatCode(snippet.code, snippet.options);
      results.push(result);
    }

    return results;
  }

  /**
   * Check if code is already properly formatted
   */
  async isAlreadyFormatted(
    code: string,
    formatOptions?: prettier.Options
  ): Promise<boolean> {
    try {
      const prettierConfig = formatOptions || await this.loadPrettierConfig();
      const formatted = await prettier.format(code, prettierConfig);
      return code.trim() === formatted.trim();
    } catch {
      return false;
    }
  }

  /**
   * Validate that code meets formatting standards
   */
  async validateFormatting(
    code: string,
    options: FormattingOptions = {}
  ): Promise<{ isValid: boolean; errors: string[]; suggestions: string[] }> {
    const errors: string[] = [];
    const suggestions: string[] = [];

    try {
      const prettierConfig = await this.loadPrettierConfig();
      const formatOptions: prettier.Options = {
        ...prettierConfig,
        ...options.prettierOptions,
        parser: options.parser || this.determineParser(options.filePath) || 'typescript'
      };

      // Check if code can be parsed
      const formatted = await prettier.format(code, formatOptions);

      // Check if formatting changes the code
      if (code.trim() !== formatted.trim()) {
        errors.push('Code is not properly formatted according to Prettier rules');
        suggestions.push('Run Prettier formatting to fix formatting issues');
      }

      // Additional validation checks
      this.validateCodeStyle(code, errors, suggestions);

    } catch (error) {
      errors.push(`Code formatting validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      suggestions
    };
  }

  /**
   * Additional code style validation beyond Prettier
   */
  private validateCodeStyle(code: string, errors: string[], suggestions: string[]): void {
    // Check for common style issues that Prettier might not catch

    // Check for inconsistent spacing in JSX
    if (code.includes('<svg') && /\s{3,}/.test(code)) {
      suggestions.push('Consider consistent spacing in JSX attributes');
    }

    // Check for missing semicolons (if semi: true)
    if (this.prettierConfig?.semi && /export const \w+[^;]$/.test(code.trim())) {
      errors.push('Missing semicolon at end of export statement');
    }

    // Check for inconsistent quotes
    if (this.prettierConfig?.singleQuote) {
      const doubleQuoteCount = (code.match(/"/g) || []).length;
      const singleQuoteCount = (code.match(/'/g) || []).length;

      if (doubleQuoteCount > singleQuoteCount && doubleQuoteCount > 2) {
        suggestions.push('Consider using single quotes for consistency');
      }
    }

    // Check line length
    const maxLineLength = this.prettierConfig?.printWidth || 100;
    const lines = code.split('\n');
    const longLines = lines.filter(line => line.length > maxLineLength);

    if (longLines.length > 0) {
      suggestions.push(`${longLines.length} lines exceed maximum length of ${maxLineLength} characters`);
    }
  }

  /**
   * Determine appropriate parser based on file path
   */
  private determineParser(filePath?: string): string | undefined {
    if (!filePath) return undefined;

    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case '.ts':
      case '.tsx':
        return 'typescript';
      case '.js':
      case '.jsx':
        return 'babel';
      case '.json':
        return 'json';
      case '.css':
        return 'css';
      case '.scss':
        return 'scss';
      case '.md':
        return 'markdown';
      default:
        return 'typescript'; // Default for SVG component generation
    }
  }

  /**
   * Format and write file with proper formatting
   */
  async formatAndWriteFile(
    filePath: string,
    content: string,
    options: FormattingOptions = {}
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Format the content
      const formatResult = await this.formatCode(content, {
        ...options,
        filePath
      });

      if (!formatResult.success) {
        return {
          success: false,
          error: `Formatting failed: ${formatResult.error}`
        };
      }

      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write formatted content
      fs.writeFileSync(filePath, formatResult.formattedCode!, 'utf8');

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error writing file'
      };
    }
  }

  /**
   * Format existing file in place
   */
  async formatFile(filePath: string): Promise<FormattingResult> {
    try {
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          originalCode: '',
          error: `File not found: ${filePath}`,
          wasAlreadyFormatted: false
        };
      }

      const originalCode = fs.readFileSync(filePath, 'utf8');
      const formatResult = await this.formatCode(originalCode, { filePath });

      if (formatResult.success && formatResult.formattedCode && !formatResult.wasAlreadyFormatted) {
        // Write back the formatted code
        fs.writeFileSync(filePath, formatResult.formattedCode, 'utf8');
      }

      return formatResult;
    } catch (error) {
      return {
        success: false,
        originalCode: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        wasAlreadyFormatted: false
      };
    }
  }

  /**
   * Generate formatting report
   */
  generateFormattingReport(results: FormattingResult[]): string {
    const totalFiles = results.length;
    const successfulFormats = results.filter(r => r.success).length;
    const alreadyFormatted = results.filter(r => r.wasAlreadyFormatted).length;
    const errors = results.filter(r => !r.success);

    let report = `# Code Formatting Report\n\n`;
    report += `## Summary\n`;
    report += `- Total Files: ${totalFiles}\n`;
    report += `- Successfully Formatted: ${successfulFormats}\n`;
    report += `- Already Formatted: ${alreadyFormatted}\n`;
    report += `- Formatting Errors: ${errors.length}\n`;
    report += `- Success Rate: ${((successfulFormats / totalFiles) * 100).toFixed(1)}%\n\n`;

    if (errors.length > 0) {
      report += `## Formatting Errors\n`;
      errors.forEach((error, index) => {
        report += `${index + 1}. ${error.error}\n`;
      });
      report += `\n`;
    }

    report += `## Recommendations\n`;
    if (errors.length > 0) {
      report += `- Review and fix formatting errors before proceeding\n`;
    }
    if (alreadyFormatted < totalFiles) {
      report += `- ${totalFiles - alreadyFormatted} files were reformatted for consistency\n`;
    }
    report += `- Ensure all generated code follows project formatting standards\n`;

    return report;
  }
}

/**
 * Utility function to create a formatter instance
 */
export function createFormatter(): PrettierFormatter {
  return new PrettierFormatter();
}

/**
 * Quick format function for single code snippet
 */
export async function formatCode(code: string, options: FormattingOptions = {}): Promise<FormattingResult> {
  const formatter = createFormatter();
  return formatter.formatCode(code, options);
}

/**
 * Quick validation function for code formatting
 */
export async function validateCodeFormatting(
  code: string,
  options: FormattingOptions = {}
): Promise<{ isValid: boolean; errors: string[]; suggestions: string[] }> {
  const formatter = createFormatter();
  return formatter.validateFormatting(code, options);
}