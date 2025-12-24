import { Logger } from '@nestjs/common';
import { TemplateValidationError } from '../errors/template-errors';

/**
 * Utility class for validating partial template HTML structure and content
 */
export class PartialTemplateValidator {
  private static readonly logger = new Logger(PartialTemplateValidator.name);

  /**
   * Validate that a partial template contains valid HTML structure
   * @param partialName - Name of the partial template
   * @param content - HTML content to validate
   * @throws TemplateValidationError if validation fails
   */
  static validatePartialTemplate(partialName: string, content: string): void {
    const validationErrors: string[] = [];

    // Check if content is empty or only whitespace
    if (!content || content.trim().length === 0) {
      validationErrors.push('Partial template content is empty or contains only whitespace');
    }

    // Check for balanced HTML tags
    const tagValidation = this.validateHTMLTags(content);
    if (tagValidation.length > 0) {
      validationErrors.push(...tagValidation);
    }

    // Check for valid HTML structure
    const structureValidation = this.validateHTMLStructure(content);
    if (structureValidation.length > 0) {
      validationErrors.push(...structureValidation);
    }

    // Check for Handlebars syntax validity
    const handlebarsValidation = this.validateHandlebarsSyntax(content);
    if (handlebarsValidation.length > 0) {
      validationErrors.push(...handlebarsValidation);
    }

    // Check for required partial template patterns
    const patternValidation = this.validatePartialPatterns(partialName, content);
    if (patternValidation.length > 0) {
      validationErrors.push(...patternValidation);
    }

    if (validationErrors.length > 0) {
      this.logger.error(`Partial template '${partialName}' validation failed: ${validationErrors.join(', ')}`);
      throw new TemplateValidationError(partialName, validationErrors);
    }

    this.logger.debug(`Partial template '${partialName}' passed validation`);
  }

  /**
   * Validate HTML tag balance and structure
   */
  private static validateHTMLTags(content: string): string[] {
    const errors: string[] = [];

    // Check for balanced angle brackets
    const openBrackets = (content.match(/</g) || []).length;
    const closeBrackets = (content.match(/>/g) || []).length;

    if (openBrackets !== closeBrackets) {
      errors.push(`Unbalanced angle brackets: ${openBrackets} opening, ${closeBrackets} closing`);
    }

    // Check for self-closing tags and paired tags
    const selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
    const tagPattern = /<(\/?)([\w-]+)(?:\s[^>]*)?>/g;
    const tagStack: string[] = [];
    let match;

    while ((match = tagPattern.exec(content)) !== null) {
      const isClosing = match[1] === '/';
      const tagName = match[2].toLowerCase();

      if (isClosing) {
        // Closing tag
        if (tagStack.length === 0) {
          errors.push(`Unexpected closing tag: </${tagName}>`);
        } else {
          const lastTag = tagStack.pop();
          if (lastTag !== tagName) {
            errors.push(`Mismatched tags: expected </${lastTag}>, found </${tagName}>`);
          }
        }
      } else if (!selfClosingTags.includes(tagName) && !match[0].endsWith('/>')) {
        // Opening tag (not self-closing)
        tagStack.push(tagName);
      }
    }

    // Check for unclosed tags
    if (tagStack.length > 0) {
      errors.push(`Unclosed tags: ${tagStack.map(tag => `<${tag}>`).join(', ')}`);
    }

    return errors;
  }

  /**
   * Validate overall HTML structure
   */
  private static validateHTMLStructure(content: string): string[] {
    const errors: string[] = [];

    // Check for basic HTML structure (should contain at least one HTML element)
    const hasHTMLElements = /<[^>]+>/.test(content);
    if (!hasHTMLElements) {
      errors.push('No HTML elements found - partial template should contain HTML markup');
    }

    // Check for potentially dangerous content
    const dangerousPatterns = [
      { pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, message: 'Script tags are not allowed in email templates' },
      { pattern: /<iframe\b[^>]*>/gi, message: 'Iframe tags are not allowed in email templates' },
      { pattern: /<object\b[^>]*>/gi, message: 'Object tags are not allowed in email templates' },
      { pattern: /<embed\b[^>]*>/gi, message: 'Embed tags are not allowed in email templates' },
      { pattern: /javascript:/gi, message: 'JavaScript URLs are not allowed' },
      { pattern: /on\w+\s*=/gi, message: 'Inline event handlers are not allowed' }
    ];

    for (const { pattern, message } of dangerousPatterns) {
      if (pattern.test(content)) {
        errors.push(message);
      }
    }

    // Check for proper attribute quoting
    const unquotedAttributes = content.match(/\s\w+=[^"'\s>]+/g);
    if (unquotedAttributes) {
      errors.push(`Unquoted attributes found: ${unquotedAttributes.join(', ')}`);
    }

    return errors;
  }

  /**
   * Validate Handlebars syntax in the template
   */
  private static validateHandlebarsSyntax(content: string): string[] {
    const errors: string[] = [];

    // Check for balanced Handlebars expressions
    const openExpressions = (content.match(/\{\{/g) || []).length;
    const closeExpressions = (content.match(/\}\}/g) || []).length;

    if (openExpressions !== closeExpressions) {
      errors.push(`Unbalanced Handlebars expressions: ${openExpressions} opening, ${closeExpressions} closing`);
    }

    // Check for balanced Handlebars blocks
    const blockOpenPattern = /\{\{#\w+/g;
    const blockClosePattern = /\{\{\/\w+/g;
    const openBlocks = (content.match(blockOpenPattern) || []).length;
    const closeBlocks = (content.match(blockClosePattern) || []).length;

    if (openBlocks !== closeBlocks) {
      errors.push(`Unbalanced Handlebars blocks: ${openBlocks} opening, ${closeBlocks} closing`);
    }

    // Check for invalid Handlebars syntax patterns
    const invalidPatterns = [
      { pattern: /\{\{[^}]*\{\{/g, message: 'Nested Handlebars expressions are not allowed' },
      { pattern: /\}\}[^{]*\}\}/g, message: 'Invalid Handlebars expression syntax' },
      { pattern: /\{\{[^}]*$/gm, message: 'Unclosed Handlebars expression' },
      { pattern: /^[^{]*\}\}/gm, message: 'Unopened Handlebars expression' }
    ];

    for (const { pattern, message } of invalidPatterns) {
      if (pattern.test(content)) {
        errors.push(message);
      }
    }

    return errors;
  }

  /**
   * Validate partial-specific patterns based on partial name
   */
  private static validatePartialPatterns(partialName: string, content: string): string[] {
    const errors: string[] = [];

    switch (partialName) {
      case 'email-header':
        if (!content.includes('email-header') && !content.includes('header')) {
          errors.push('Email header partial should contain header-related CSS classes or structure');
        }
        break;

      case 'email-footer':
        if (!content.includes('email-footer') && !content.includes('footer')) {
          errors.push('Email footer partial should contain footer-related CSS classes or structure');
        }
        break;

      case 'button':
        if (!content.includes('btn') && !content.includes('button')) {
          errors.push('Button partial should contain button-related CSS classes or structure');
        }
        if (!content.includes('{{url}}') && !content.includes('href')) {
          errors.push('Button partial should include URL/href functionality');
        }
        break;

      case 'status-badge':
        if (!content.includes('badge') && !content.includes('status')) {
          errors.push('Status badge partial should contain badge-related CSS classes or structure');
        }
        break;

      case 'address-card':
        if (!content.includes('address')) {
          errors.push('Address card partial should contain address-related CSS classes or structure');
        }
        break;
    }

    return errors;
  }

  /**
   * Validate that partial template parameters are properly used
   */
  static validatePartialParameters(partialName: string, content: string, expectedParams: string[]): string[] {
    const errors: string[] = [];

    for (const param of expectedParams) {
      const paramPattern = new RegExp(`\\{\\{\\s*${param}\\s*\\}\\}`, 'g');
      if (!paramPattern.test(content)) {
        errors.push(`Expected parameter '${param}' not found in partial template`);
      }
    }

    return errors;
  }

  /**
   * Get expected parameters for a partial template based on its name
   */
  static getExpectedParameters(partialName: string): string[] {
    switch (partialName) {
      case 'email-header':
        return ['companyName', 'tagline'];
      case 'email-footer':
        return ['currentYear', 'companyName', 'supportEmail', 'websiteUrl', 'disclaimer'];
      case 'button':
        return ['text', 'url', 'style'];
      case 'status-badge':
        return ['status', 'statusText'];
      case 'address-card':
        return ['title'];
      default:
        return [];
    }
  }
}