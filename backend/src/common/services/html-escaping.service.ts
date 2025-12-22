import { Injectable, Logger } from '@nestjs/common';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface HTMLValidationResult {
  isValid: boolean;
  hasUnclosedTags: boolean;
  hasUnescapedCharacters: boolean;
  cssIssues: string[];
  htmlIssues: string[];
  recommendations: string[];
}

@Injectable()
export class HTMLEscapingService {
  private readonly logger = new Logger(HTMLEscapingService.name);

  /**
   * HTML entity mapping for special characters
   */
  private readonly HTML_ENTITIES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };

  /**
   * Escape HTML content by converting special characters to HTML entities
   * @param content - Content to escape
   * @returns Escaped HTML content
   */
  escapeHtmlContent(content: string): string {
    if (!content || typeof content !== 'string') {
      return '';
    }

    return content.replace(/[&<>"'`=\/]/g, (match) => {
      return this.HTML_ENTITIES[match as keyof typeof this.HTML_ENTITIES] || match;
    });
  }

  /**
   * Escape HTML attributes by converting special characters to HTML entities
   * @param attributes - Attribute values to escape
   * @returns Escaped attribute values
   */
  escapeHtmlAttributes(attributes: string): string {
    if (!attributes || typeof attributes !== 'string') {
      return '';
    }

    // For attributes, we need to be more careful about quotes
    return attributes.replace(/[&<>"']/g, (match) => {
      return this.HTML_ENTITIES[match as keyof typeof this.HTML_ENTITIES] || match;
    });
  }

  /**
   * Validate HTML structure and identify issues
   * @param html - HTML content to validate
   * @returns Validation result with issues and recommendations
   */
  validateHtmlStructure(html: string): HTMLValidationResult {
    const result: HTMLValidationResult = {
      isValid: true,
      hasUnclosedTags: false,
      hasUnescapedCharacters: false,
      cssIssues: [],
      htmlIssues: [],
      recommendations: [],
    };

    if (!html || typeof html !== 'string') {
      result.isValid = false;
      result.htmlIssues.push('HTML content is empty or invalid');
      return result;
    }

    // Check for unclosed tags
    const unclosedTags = this.findUnclosedTags(html);
    if (unclosedTags.length > 0) {
      result.hasUnclosedTags = true;
      result.isValid = false;
      result.htmlIssues.push(`Unclosed tags found: ${unclosedTags.join(', ')}`);
      result.recommendations.push('Ensure all HTML tags are properly closed');
    }

    // Check for unescaped special characters in content
    const unescapedChars = this.findUnescapedCharacters(html);
    if (unescapedChars.length > 0) {
      result.hasUnescapedCharacters = true;
      result.htmlIssues.push(`Unescaped characters found: ${unescapedChars.join(', ')}`);
      result.recommendations.push('Escape special characters in HTML content');
    }

    // Check for CSS issues
    const cssIssues = this.validateCSSInHTML(html);
    if (cssIssues.length > 0) {
      result.cssIssues = cssIssues;
      result.isValid = false;
      result.recommendations.push('Fix CSS formatting and escaping issues');
    }

    // Check for other HTML structure issues
    const structureIssues = this.validateHTMLStructure(html);
    if (structureIssues.length > 0) {
      result.htmlIssues.push(...structureIssues);
      result.isValid = false;
    }

    return result;
  }

  /**
   * Sanitize CSS content to prevent formatting issues
   * @param css - CSS content to sanitize
   * @returns Sanitized CSS content
   */
  sanitizeCSS(css: string): string {
    if (!css || typeof css !== 'string') {
      return '';
    }

    let sanitized = css;

    // First, remove CSS comments to prevent HTML structure breaking
    sanitized = this.removeCSSComments(sanitized);

    // Escape quotes in CSS values
    sanitized = sanitized.replace(/"/g, '\\"');
    sanitized = sanitized.replace(/'/g, "\\'");

    // Remove potentially problematic CSS
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/expression\s*\(/gi, '');
    sanitized = sanitized.replace(/@import/gi, '');

    // Ensure CSS is properly formatted
    sanitized = sanitized.replace(/;\s*}/g, '}');
    sanitized = sanitized.replace(/{\s*;/g, '{');

    return sanitized.trim();
  }

  /**
   * Remove CSS comments to prevent HTML structure breaking
   * @param css - CSS content that may contain comments
   * @returns CSS content with all comments removed
   */
  removeCSSComments(css: string): string {
    if (!css || typeof css !== 'string') {
      return '';
    }

    try {
      // Remove CSS comments (/* comment */) while preserving the rest of the CSS
      // This regex handles multi-line comments and nested structures
      let cleaned = css.replace(/\/\*[\s\S]*?\*\//g, '');

      // Clean up any extra whitespace left by comment removal
      cleaned = cleaned.replace(/\s+/g, ' ').trim();

      // Log the comment removal for debugging
      const commentCount = (css.match(/\/\*[\s\S]*?\*\//g) || []).length;
      if (commentCount > 0) {
        this.logger.debug(`Removed ${commentCount} CSS comments from CSS content`);
      }

      return cleaned;
    } catch (error) {
      this.logger.error('Error removing CSS comments:', error);
      // Return original CSS if comment removal fails
      return css;
    }
  }

  /**
   * Find unclosed HTML tags
   * @param html - HTML content to check
   * @returns Array of unclosed tag names
   */
  private findUnclosedTags(html: string): string[] {
    const unclosedTags: string[] = [];
    const tagStack: string[] = [];

    // Self-closing tags that don't need closing tags
    const selfClosingTags = new Set([
      'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
      'link', 'meta', 'param', 'source', 'track', 'wbr'
    ]);

    // Find all tags
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
    let match;

    while ((match = tagRegex.exec(html)) !== null) {
      const fullTag = match[0];
      const tagName = match[1].toLowerCase();

      if (fullTag.startsWith('</')) {
        // Closing tag
        if (tagStack.length === 0 || tagStack[tagStack.length - 1] !== tagName) {
          // Mismatched closing tag
          if (!unclosedTags.includes(tagName)) {
            unclosedTags.push(tagName);
          }
        } else {
          tagStack.pop();
        }
      } else if (!selfClosingTags.has(tagName) && !fullTag.endsWith('/>')) {
        // Opening tag (not self-closing)
        tagStack.push(tagName);
      }
    }

    // Any remaining tags in stack are unclosed
    unclosedTags.push(...tagStack);

    return [...new Set(unclosedTags)]; // Remove duplicates
  }

  /**
   * Find unescaped special characters in HTML content
   * @param html - HTML content to check
   * @returns Array of unescaped characters found
   */
  private findUnescapedCharacters(html: string): string[] {
    const unescapedChars: string[] = [];

    // Check for unescaped characters outside of tags
    const textContent = html.replace(/<[^>]*>/g, '');

    if (textContent.includes('&') && !textContent.match(/&[a-zA-Z0-9#]+;/)) {
      unescapedChars.push('&');
    }
    if (textContent.includes('<') && !html.includes('&lt;')) {
      unescapedChars.push('<');
    }
    if (textContent.includes('>') && !html.includes('&gt;')) {
      unescapedChars.push('>');
    }

    return [...new Set(unescapedChars)];
  }

  /**
   * Validate CSS within HTML content
   * @param html - HTML content to check
   * @returns Array of CSS issues found
   */
  private validateCSSInHTML(html: string): string[] {
    const issues: string[] = [];

    // Check for unescaped quotes in style attributes
    const styleMatches = html.match(/style\s*=\s*"([^"]*)"/g);
    if (styleMatches) {
      for (const styleMatch of styleMatches) {
        // Extract the CSS content between the quotes
        const cssContent = styleMatch.match(/style\s*=\s*"([^"]*)"/)?.[1] || '';

        // Check for unescaped single quotes within the CSS content
        if (cssContent.includes("'") && !cssContent.includes("\\'")) {
          issues.push('Unescaped single quotes in CSS style attribute');
        }

        // Check for unescaped double quotes within the CSS content
        // Split by escaped quotes first, then check for remaining quotes
        const parts = cssContent.split('\\"');
        for (const part of parts) {
          if (part.includes('"')) {
            issues.push('Unescaped double quotes in CSS style attribute');
            break;
          }
        }
      }
    }

    // Check for CSS in style tags
    const styleTagMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    if (styleTagMatches) {
      for (const styleTag of styleTagMatches) {
        const cssContent = styleTag.replace(/<\/?style[^>]*>/gi, '');
        if (cssContent.includes('"') && !cssContent.includes('\\"')) {
          issues.push('Unescaped quotes in CSS style block');
        }
      }
    }

    return issues;
  }

  /**
   * Validate overall HTML structure
   * @param html - HTML content to validate
   * @returns Array of structure issues found
   */
  private validateHTMLStructure(html: string): string[] {
    const issues: string[] = [];

    // Check for basic HTML structure
    if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
      issues.push('Missing DOCTYPE or html tag');
    }

    // Check for very long lines that might cause email client issues
    const lines = html.split('\n');
    const longLines = lines.filter(line => line.length > 1000);
    if (longLines.length > 0) {
      issues.push(`${longLines.length} lines exceed 1000 characters (may cause email client issues)`);
    }

    // Check for potentially problematic elements
    if (html.includes('<script')) {
      issues.push('Script tags found (not supported in email clients)');
    }

    if (html.includes('<link')) {
      issues.push('Link tags found (external stylesheets may not work in email clients)');
    }

    return issues;
  }

  /**
   * Escape all dynamic content in an HTML template
   * @param template - HTML template with placeholders
   * @param data - Data object with values to escape and insert
   * @returns HTML template with escaped content
   */
  escapeTemplateContent(template: string, data: Record<string, any>): string {
    let escapedTemplate = template;

    // Recursively escape all string values in the data object
    const escapeDataValues = (obj: any): any => {
      if (typeof obj === 'string') {
        return this.escapeHtmlContent(obj);
      } else if (Array.isArray(obj)) {
        return obj.map(escapeDataValues);
      } else if (obj && typeof obj === 'object') {
        const escaped: any = {};
        for (const [key, value] of Object.entries(obj)) {
          escaped[key] = escapeDataValues(value);
        }
        return escaped;
      }
      return obj;
    };

    const escapedData = escapeDataValues(data);

    // Replace placeholders with escaped values
    for (const [key, value] of Object.entries(escapedData)) {
      const placeholder = new RegExp(`\\{${key}\\}`, 'g');
      escapedTemplate = escapedTemplate.replace(placeholder, String(value));
    }

    return escapedTemplate;
  }
}