import { Injectable, Logger } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { ValidationResult } from '../types/pdf.types';
import { TemplateValidationService } from './template-validation.service';

@Injectable()
export class PDFTemplateLoaderService {
  private readonly logger = new Logger(PDFTemplateLoaderService.name);
  private readonly templateCache = new Map<string, string>();
  private readonly templateDir = this.resolveTemplateDirectory();

  constructor(private readonly templateValidation: TemplateValidationService) {}

  /**
   * Resolve template directory path for both development and production environments
   * @returns string - Resolved template directory path
   */
  private resolveTemplateDirectory(): string {
    // Try multiple possible locations for template files
    const possiblePaths = [
      // Development: source directory
      join(process.cwd(), 'backend', 'src', 'pdf-generator', 'templates'),
      join(process.cwd(), 'src', 'pdf-generator', 'templates'),
      // Production: compiled directory (correct path)
      join(process.cwd(), 'backend', 'dist', 'pdf-generator', 'templates'),
      join(process.cwd(), 'dist', 'pdf-generator', 'templates'),
      // Fallback: relative to current file
      join(__dirname, '..', 'templates'),
      // Alternative production paths
      join(process.cwd(), 'backend', 'dist', 'src', 'pdf-generator', 'templates'),
      join(process.cwd(), 'dist', 'src', 'pdf-generator', 'templates'),
    ];

    for (const templatePath of possiblePaths) {
      try {
        // Check if the directory exists and contains template files
        const fs = require('fs');
        if (fs.existsSync(templatePath)) {
          const files = fs.readdirSync(templatePath);
          // Check if it contains expected template files
          if (files.some((file: string) => file.endsWith('.html') || file.endsWith('.css'))) {
            this.logger.log(`Template directory resolved to: ${templatePath}`);
            return templatePath;
          }
        }
      } catch (error) {
        // Continue to next path
        continue;
      }
    }

    // Fallback to the original path if none found
    const fallbackPath = join(__dirname, '..', 'templates');
    this.logger.warn(`Could not find template directory, falling back to: ${fallbackPath}`);
    return fallbackPath;
  }

  /**
   * Load HTML template file from filesystem
   * @param templateName - Name of the template ('order-confirmation' or 'invoice')
   * @returns Promise<string> - Template content
   */
  async loadTemplate(templateName: 'order-confirmation' | 'invoice'): Promise<string> {
    this.logger.debug(`Loading template: ${templateName}`);

    // Check cache first
    const cacheKey = `template-${templateName}`;
    if (this.templateCache.has(cacheKey)) {
      this.logger.debug(`Template ${templateName} loaded from cache`);
      return this.templateCache.get(cacheKey)!;
    }

    try {
      const templatePath = join(this.templateDir, `${templateName}.html`);
      const templateContent = await readFile(templatePath, 'utf-8');

      // Cache the template
      this.templateCache.set(cacheKey, templateContent);
      this.logger.log(`Template ${templateName} loaded and cached successfully`);

      return templateContent;
    } catch (error) {
      this.logger.error(`Failed to load template ${templateName}: ${error.message}`, {
        templateName,
        templateDir: this.templateDir,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Template loading failed: ${error.message}`);
    }
  }

  /**
   * Load CSS stylesheet file
   * @returns Promise<string> - CSS content
   */
  async loadStylesheet(): Promise<string> {
    this.logger.debug('Loading PDF stylesheet');

    // Check cache first
    const cacheKey = 'stylesheet-pdf-styles';
    if (this.templateCache.has(cacheKey)) {
      this.logger.debug('Stylesheet loaded from cache');
      return this.templateCache.get(cacheKey)!;
    }

    try {
      const stylesheetPath = join(this.templateDir, 'pdf-styles.css');
      const stylesheetContent = await readFile(stylesheetPath, 'utf-8');

      // Cache the stylesheet
      this.templateCache.set(cacheKey, stylesheetContent);
      this.logger.log('Stylesheet loaded and cached successfully');

      return stylesheetContent;
    } catch (error) {
      this.logger.error(`Failed to load stylesheet: ${error.message}`, {
        templateDir: this.templateDir,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Stylesheet loading failed: ${error.message}`);
    }
  }

  /**
   * Validate template content for required placeholders and structure
   * @param template - Template content to validate
   * @returns ValidationResult - Validation result with errors if any
   */
  validateTemplate(template: string): ValidationResult {
    const errors: string[] = [];

    // Check for basic HTML structure
    if (!template.includes('<!DOCTYPE html>')) {
      errors.push('Template must include DOCTYPE declaration');
    }

    if (!template.includes('<html')) {
      errors.push('Template must include html element');
    }

    if (!template.includes('<head>')) {
      errors.push('Template must include head element');
    }

    if (!template.includes('<body>')) {
      errors.push('Template must include body element');
    }

    // Check for required template sections
    const requiredSections = [
      'pdf-container',
      'pdf-header',
      'pdf-content',
      'pdf-footer'
    ];

    for (const section of requiredSections) {
      if (!template.includes(section)) {
        errors.push(`Template must include ${section} section`);
      }
    }

    // Check for essential placeholders
    const requiredPlaceholders = [
      '{{orderNumber}}',
      '{{customerInfo.name}}',
      '{{customerInfo.email}}',
      '{{items}}',
      '{{formattedTotal}}'
    ];

    for (const placeholder of requiredPlaceholders) {
      if (!template.includes(placeholder)) {
        errors.push(`Template must include ${placeholder} placeholder`);
      }
    }

    // Check for proper Handlebars syntax
    const handlebarsRegex = /\{\{[^}]*\}\}/g;
    const matches = template.match(handlebarsRegex);

    if (matches) {
      for (const match of matches) {
        // Check for unclosed braces
        if (match.split('{{').length !== match.split('}}').length) {
          errors.push(`Invalid Handlebars syntax: ${match}`);
        }
      }
    }

    // Check for proper conditional syntax
    const conditionalRegex = /\{\{#if\s+[^}]+\}\}/g;
    const conditionalMatches = template.match(conditionalRegex);

    if (conditionalMatches) {
      for (const conditional of conditionalMatches) {
        const conditionName = conditional.match(/\{\{#if\s+([^}]+)\}\}/)?.[1];
        if (conditionName && !template.includes(`{{/if}}`)) {
          errors.push(`Conditional ${conditional} is not properly closed`);
        }
      }
    }

    // Check for proper loop syntax
    const loopRegex = /\{\{#each\s+[^}]+\}\}/g;
    const loopMatches = template.match(loopRegex);

    if (loopMatches) {
      for (const loop of loopMatches) {
        const loopName = loop.match(/\{\{#each\s+([^}]+)\}\}/)?.[1];
        if (loopName && !template.includes(`{{/each}}`)) {
          errors.push(`Loop ${loop} is not properly closed`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Cache template content manually
   * @param templateName - Name of the template
   * @param content - Template content to cache
   */
  cacheTemplate(templateName: string, content: string): void {
    const cacheKey = `template-${templateName}`;
    this.templateCache.set(cacheKey, content);
    this.logger.debug(`Template ${templateName} cached manually`);
  }

  /**
   * Invalidate template cache
   * @param templateName - Optional specific template to invalidate, or all if not provided
   */
  invalidateCache(templateName?: string): void {
    if (templateName) {
      const cacheKey = `template-${templateName}`;
      this.templateCache.delete(cacheKey);
      this.logger.log(`Cache invalidated for template: ${templateName}`);
    } else {
      this.templateCache.clear();
      this.logger.log('All template cache invalidated');
    }
  }

  /**
   * Get cache statistics for monitoring
   * @returns Object with cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.templateCache.size,
      keys: Array.from(this.templateCache.keys())
    };
  }

  /**
   * Check if template exists in filesystem
   * @param templateName - Name of the template to check
   * @returns Promise<boolean> - Whether template file exists
   */
  async templateExists(templateName: string): Promise<boolean> {
    try {
      const templatePath = join(this.templateDir, `${templateName}.html`);
      await readFile(templatePath, 'utf-8');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get template directory path for debugging
   * @returns string - Template directory path
   */
  getTemplateDirectory(): string {
    return this.templateDir;
  }

  /**
   * Get comprehensive validation report for a template
   * @param templateName - Name of the template to validate
   * @returns Promise<TemplateValidationReport> - Detailed validation report
   */
  async getValidationReport(templateName: 'order-confirmation' | 'invoice'): Promise<any> {
    return await this.templateValidation.validateTemplate(templateName);
  }

  /**
   * Get validation summary for all templates
   * @returns Promise<object> - Validation summary statistics
   */
  async getValidationSummary(): Promise<any> {
    return await this.templateValidation.getValidationSummary();
  }
}