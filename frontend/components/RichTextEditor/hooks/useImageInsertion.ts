/**
 * useImageInsertion Hook
 *
 * Manages image insertion logic for both product images and file uploads
 */

'use client';

import { useState, useCallback } from 'react';
import type Quill from 'quill';
import type { UseImageInsertionReturn } from '../types';
import { validateImageFile } from '../utils/fileValidation';
import { uploadImageWithRetry, formatUploadError } from '../utils/imageUpload';

/**
 * Hook for managing image insertion into the Quill editor
 *
 * Handles:
 * - Product image picker modal state
 * - Product image selection
 * - File upload from disk with validation
 * - Image insertion at cursor position
 * - Upload loading and error states
 *
 * @param editor - The Quill editor instance
 * @param onImageInsert - Optional callback when an image is inserted
 * @param locale - Current locale for error messages
 * @returns Image insertion state and handlers
 */
export function useImageInsertion(
  editor: Quill | null,
  onImageInsert?: (url: string) => void,
  locale: string = 'en'
): UseImageInsertionReturn {
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Insert an image URL into the editor at the current cursor position
   */
  const insertImageAtCursor = useCallback(
    (url: string) => {
      if (!editor) return;

      // Get current cursor position
      const range = editor.getSelection(true);
      const index = range ? range.index : editor.getLength();

      // Insert image at cursor position
      editor.insertEmbed(index, 'image', url);

      // Move cursor after the image
      editor.setSelection(index + 1, 0);

      // Show success message
      const message = locale === 'vi'
        ? 'Hình ảnh đã được chèn thành công'
        : 'Image inserted successfully';
      setSuccessMessage(message);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);

      // Call optional callback
      if (onImageInsert) {
        onImageInsert(url);
      }
    },
    [editor, onImageInsert, locale]
  );

  /**
   * Handle product image selection from the picker modal
   */
  const handleProductImageSelect = useCallback(
    (url: string) => {
      // Clear any previous messages
      setUploadError(null);
      setSuccessMessage(null);

      insertImageAtCursor(url);
      setShowProductPicker(false);
    },
    [insertImageAtCursor]
  );

  /**
   * Handle file upload from disk with validation
   */
  const handleFileUpload = useCallback(
    async (file: File) => {
      // Clear any previous messages
      setUploadError(null);
      setSuccessMessage(null);

      // Validate the file before uploading
      const validationResult = validateImageFile(file, locale);
      if (!validationResult.isValid) {
        setUploadError(validationResult.error);
        return;
      }

      // Start upload
      setIsUploading(true);

      try {
        // Upload the file with retry logic
        const imageUrl = await uploadImageWithRetry(file, {
          maxRetries: 1,
          retryDelay: 1000,
        });

        // Insert the uploaded image URL
        insertImageAtCursor(imageUrl);

        // Clear any errors on success
        setUploadError(null);
      } catch (error) {
        console.error('Failed to upload image:', error);
        const errorMessage = formatUploadError(error, locale);
        setUploadError(errorMessage);
      } finally {
        setIsUploading(false);
      }
    },
    [insertImageAtCursor, locale]
  );

  return {
    showProductPicker,
    setShowProductPicker,
    handleProductImageSelect,
    handleFileUpload,
    isUploading,
    uploadError,
    successMessage,
  };
}
