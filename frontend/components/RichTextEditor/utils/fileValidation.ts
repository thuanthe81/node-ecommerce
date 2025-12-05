/**
 * File Validation Utilities
 *
 * Utilities for validating image files before upload
 */

/**
 * Allowed image MIME types
 */
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

/**
 * Maximum file size in bytes (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Result of file validation
 */
export interface FileValidationResult {
  /** Whether the file is valid */
  isValid: boolean;

  /** Error message if validation failed (null if valid) */
  error: string | null;

  /** Error code for programmatic handling */
  errorCode?: 'INVALID_TYPE' | 'FILE_TOO_LARGE';
}

/**
 * Validate an image file for upload
 *
 * Checks:
 * - File type is one of: JPEG, PNG, GIF, WebP
 * - File size is under 5MB
 *
 * @param file - The file to validate
 * @param locale - Current locale for error messages ('en' or 'vi')
 * @returns Validation result with error message if invalid
 */
export function validateImageFile(
  file: File,
  locale: string = 'en'
): FileValidationResult {
  // Validate file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
    return {
      isValid: false,
      error:
        locale === 'vi'
          ? 'Vui lòng chọn tệp hình ảnh hợp lệ (JPEG, PNG, GIF hoặc WebP)'
          : 'Please select a valid image file (JPEG, PNG, GIF, or WebP)',
      errorCode: 'INVALID_TYPE',
    };
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error:
        locale === 'vi'
          ? 'Tệp hình ảnh quá lớn. Kích thước tối đa là 5MB.'
          : 'Image file is too large. Maximum size is 5MB.',
      errorCode: 'FILE_TOO_LARGE',
    };
  }

  // File is valid
  return {
    isValid: true,
    error: null,
  };
}

/**
 * Get a human-readable file size string
 *
 * @param bytes - File size in bytes
 * @returns Formatted file size (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get allowed file extensions as a string for display
 *
 * @returns Comma-separated list of allowed extensions
 */
export function getAllowedExtensions(): string {
  return 'JPEG, PNG, GIF, WebP';
}

/**
 * Get maximum file size as a human-readable string
 *
 * @returns Maximum file size (e.g., "5 MB")
 */
export function getMaxFileSize(): string {
  return formatFileSize(MAX_FILE_SIZE);
}
