/**
 * Image Upload Handler Utilities
 *
 * Utilities for handling image file uploads to the server
 */

import { uploadContentImage } from '@/lib/content-api';
import type { UploadImageResponse } from '../types';

/**
 * Options for image upload
 */
export interface ImageUploadOptions {
  /** Maximum number of retry attempts on failure */
  maxRetries?: number;

  /** Delay between retry attempts in milliseconds */
  retryDelay?: number;

  /** Callback for upload progress (if supported) */
  onProgress?: (progress: number) => void;
}

/**
 * Upload an image file to the server with retry logic
 *
 * Handles:
 * - File upload to server
 * - Automatic retry on failure
 * - Error handling and reporting
 *
 * @param file - The image file to upload
 * @param options - Upload options including retry configuration
 * @returns Promise resolving to the uploaded image URL
 * @throws Error if upload fails after all retry attempts
 */
export async function uploadImageWithRetry(
  file: File,
  options: ImageUploadOptions = {}
): Promise<string> {
  const { maxRetries = 1, retryDelay = 1000, onProgress } = options;

  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      // Report progress if callback provided
      if (onProgress) {
        onProgress(0);
      }

      // Upload the file
      const result: UploadImageResponse = await uploadContentImage(file);

      // Report completion
      if (onProgress) {
        onProgress(100);
      }

      // Return the uploaded image URL
      return result.url;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Upload failed');

      // If we have retries left, wait and try again
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        attempt++;
      } else {
        // No more retries, throw the error
        break;
      }
    }
  }

  // All attempts failed, throw the last error
  throw lastError || new Error('Upload failed after all retry attempts');
}

/**
 * Upload an image file to the server (single attempt, no retry)
 *
 * @param file - The image file to upload
 * @returns Promise resolving to the uploaded image URL
 * @throws Error if upload fails
 */
export async function uploadImage(file: File): Promise<string> {
  try {
    const result: UploadImageResponse = await uploadContentImage(file);
    return result.url;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to upload image');
  }
}

/**
 * Format an upload error message for display to the user
 *
 * @param error - The error that occurred
 * @param locale - Current locale for error messages ('en' or 'vi')
 * @returns User-friendly error message
 */
export function formatUploadError(error: unknown, locale: string = 'en'): string {
  if (error instanceof Error) {
    // Check for specific error types
    if (error.message.includes('Network')) {
      return locale === 'vi'
        ? 'Lỗi mạng. Vui lòng kiểm tra kết nối của bạn và thử lại.'
        : 'Network error. Please check your connection and try again.';
    }

    if (error.message.includes('401') || error.message.includes('403')) {
      return locale === 'vi'
        ? 'Bạn không có quyền tải lên hình ảnh.'
        : 'You do not have permission to upload images.';
    }

    if (error.message.includes('413')) {
      return locale === 'vi'
        ? 'Tệp hình ảnh quá lớn.'
        : 'Image file is too large.';
    }

    // Return the error message if it's user-friendly
    if (error.message.length < 100) {
      return error.message;
    }
  }

  // Generic error message
  return locale === 'vi'
    ? 'Không thể tải lên hình ảnh. Vui lòng thử lại.'
    : 'Failed to upload image. Please try again.';
}
