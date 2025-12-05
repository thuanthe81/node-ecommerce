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
   * If slug is provided, wraps the image in a link to the product page
   */
  const insertImageAtCursor = useCallback(
    (url: string, slug?: string) => {
      if (!editor) return;

      // Get current cursor position
      const range = editor.getSelection(true);
      const index = range ? range.index : editor.getLength();

      // If this is a product image, insert as a linked image
      if (slug) {
        // Generate locale-aware product URL
        const productUrl = `/products/${slug}`;

        // Create HTML with link wrapping the image
        const html = `<a href="${productUrl}"><img src="${url}" width="300" /></a>`;

        // Insert the HTML using clipboard API
        editor.clipboard.dangerouslyPasteHTML(index, html);

        // Move cursor after the inserted content
        editor.setSelection(index + 1, 0);
      } else {
        // For uploaded images (no slug), insert as standalone image
        editor.insertEmbed(index, 'image', url);

        // Set default width of 300px immediately after insertion
        // Use setTimeout to ensure the image is in the DOM
        setTimeout(() => {
          const images = editor.root.querySelectorAll('img');
          // Find the image we just inserted - it should be the last one without a width attribute
          // or we can find it by checking if the src ends with the same path
          let targetImg: HTMLImageElement | null = null;

          // Try to find by exact URL match first
          for (let i = images.length - 1; i >= 0; i--) {
            const img = images[i] as HTMLImageElement;
            if (img.src === url || img.src.endsWith(url) || url.endsWith(img.getAttribute('src') || '')) {
              targetImg = img;
              break;
            }
          }

          // If not found by URL, get the last image without width attribute
          if (!targetImg) {
            for (let i = images.length - 1; i >= 0; i--) {
              const img = images[i] as HTMLImageElement;
              if (!img.hasAttribute('width')) {
                targetImg = img;
                break;
              }
            }
          }

          // Apply default width if we found the image
          if (targetImg && !targetImg.hasAttribute('width')) {
            targetImg.setAttribute('width', '300');
          }
        }, 0);

        // Move cursor after the image
        editor.setSelection(index + 1, 0);
      }

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
    (url: string, slug?: string) => {
      // Clear any previous messages
      setUploadError(null);
      setSuccessMessage(null);

      insertImageAtCursor(url, slug);
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