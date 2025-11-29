import { ContentFormData } from '../types';

/**
 * Validates a slug string for proper format
 *
 * @param slug - The slug string to validate
 * @param t - Translation function for error messages
 * @returns Error message if invalid, null if valid
 *
 * @example
 * ```typescript
 * const error = validateSlug('my-page-slug', t);
 * if (error) {
 *   console.error(error);
 * }
 * ```
 */
export function validateSlug(slug: string, t: (key: string) => string): string | null {
  if (!slug) return t('admin.slugRequired');

  // Slug should only contain lowercase letters, numbers, and hyphens
  // Should not start or end with a hyphen
  const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  if (!slugRegex.test(slug)) {
    return t('admin.slugError');
  }

  return null;
}

/**
 * Validates a URL string for proper format
 *
 * @param url - The URL string to validate
 * @param fieldName - Name of the field being validated (for error messages)
 * @param t - Translation function for error messages
 * @returns Error message if invalid, null if valid
 *
 * @example
 * ```typescript
 * const error = validateUrl('https://example.com/image.jpg', 'imageUrl', t);
 * if (error) {
 *   console.error(error);
 * }
 * ```
 */
export function validateUrl(url: string, fieldName: string, t: (key: string) => string): string | null {
  if (!url) return null; // URL fields are optional

  // Check if it's a relative path (starts with / or ./)
  if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
    return null;
  }

  // Otherwise, validate as absolute URL
  try {
    new URL(url);
    return null;
  } catch {
    return fieldName === 'imageUrl' ? t('admin.imageUrlError') : t('admin.linkUrlError');
  }
}

/**
 * Validates all fields in the content form
 *
 * @param data - The form data to validate
 * @param t - Translation function for error messages
 * @returns Object containing validation errors for each field
 *
 * @example
 * ```typescript
 * const errors = validateContentForm(formData, t);
 * if (Object.keys(errors).length > 0) {
 *   setValidationErrors(errors);
 * }
 * ```
 */
export function validateContentForm(
  data: ContentFormData,
  t: (key: string) => string
): Record<string, string> {
  const errors: Record<string, string> = {};

  // Validate required fields
  if (!data.slug) errors.slug = t('admin.slugRequired');
  if (!data.titleEn) errors.titleEn = t('admin.titleEnglishRequired');
  if (!data.titleVi) errors.titleVi = t('admin.titleVietnameseRequired');
  if (!data.contentEn) errors.contentEn = t('admin.titleEnglishRequired');
  if (!data.contentVi) errors.contentVi = t('admin.titleVietnameseRequired');

  // Validate slug format
  if (data.slug) {
    const slugError = validateSlug(data.slug, t);
    if (slugError) errors.slug = slugError;
  }

  // Validate URL fields if they have values
  if (data.imageUrl) {
    const urlError = validateUrl(data.imageUrl, 'imageUrl', t);
    if (urlError) errors.imageUrl = urlError;
  }
  if (data.linkUrl) {
    const urlError = validateUrl(data.linkUrl, 'linkUrl', t);
    if (urlError) errors.linkUrl = urlError;
  }

  return errors;
}
