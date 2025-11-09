import { Transform } from 'class-transformer';
import {
  sanitizeString,
  sanitizeEmail,
  sanitizeHtml,
} from '../utils/sanitization.util';

/**
 * Decorator to sanitize string input
 */
export function SanitizeString() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return sanitizeString(value);
    }
    return value;
  });
}

/**
 * Decorator to sanitize email input
 */
export function SanitizeEmail() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return sanitizeEmail(value);
    }
    return value;
  });
}

/**
 * Decorator to sanitize HTML content
 */
export function SanitizeHtml() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return sanitizeHtml(value);
    }
    return value;
  });
}
