/**
 * Sanitization utilities for input data
 * Helps prevent XSS and injection attacks
 */

/**
 * Sanitize string input by removing potentially dangerous characters
 * This is a basic implementation - for production, consider using a library like DOMPurify
 */
export function sanitizeString(input: string): string {
  if (!input) return input;

  return input
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .trim();
}

/**
 * Sanitize HTML content - removes script tags and dangerous attributes
 * For rich text content, use a proper HTML sanitizer library like DOMPurify
 */
export function sanitizeHtml(html: string): string {
  if (!html) return html;

  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .replace(/javascript:/gi, ''); // Remove javascript: protocol
}

/**
 * Sanitize email to prevent injection
 */
export function sanitizeEmail(email: string): string {
  if (!email) return email;

  return email.toLowerCase().trim();
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return query;

  // Remove special characters that could be used for SQL injection
  // Note: Prisma already protects against SQL injection, but this adds an extra layer
  return query
    .replace(/[;'"\\]/g, '') // Remove quotes and semicolons
    .trim()
    .substring(0, 100); // Limit length
}

/**
 * Sanitize URL to prevent open redirect vulnerabilities
 */
export function sanitizeUrl(
  url: string,
  allowedDomains: string[] = [],
): string | null {
  if (!url) return null;

  try {
    const parsedUrl = new URL(url);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return null;
    }

    // If allowed domains specified, check if URL matches
    if (allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some(
        (domain) =>
          parsedUrl.hostname === domain ||
          parsedUrl.hostname.endsWith(`.${domain}`),
      );

      if (!isAllowed) {
        return null;
      }
    }

    return url;
  } catch {
    // Invalid URL
    return null;
  }
}

/**
 * Sanitize file name to prevent directory traversal
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return fileName;

  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
    .replace(/\.{2,}/g, '.') // Remove multiple dots (prevent ../)
    .substring(0, 255); // Limit length
}

/**
 * Remove null bytes from string (can be used in injection attacks)
 */
export function removeNullBytes(input: string): string {
  if (!input) return input;

  return input.replace(/\0/g, '');
}

/**
 * Sanitize object by applying sanitization to all string properties
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  sanitizer: (value: string) => string = sanitizeString,
): T {
  const sanitized = { ...obj };

  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizer(sanitized[key] as string) as T[Extract<
        keyof T,
        string
      >];
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key], sanitizer);
    }
  }

  return sanitized;
}
