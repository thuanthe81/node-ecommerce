/**
 * RichTextEditor Component
 *
 * A Quill.js-based rich text editor for content management.
 * Supports rich text formatting and image insertion from products and media library.
 */

'use client';

import React, { useCallback, useState } from 'react';
import type { RichTextEditorProps } from './types';
import { useQuillEditor } from './hooks/useQuillEditor';
import ImagePickerModal from '../ImagePickerModal';

/**
 * Main RichTextEditor component
 *
 * Integrates Quill.js editor with React lifecycle and state management.
 * Provides rich text editing capabilities with custom image insertion.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = '',
  readOnly = false,
  showToolbar = true,
  onImageInsert,
  className = '',
  locale,
  hasError = false,
}: RichTextEditorProps) {
  const [showImagePicker, setShowImagePicker] = useState(false);

  // Custom image handler for Quill toolbar - directly opens ImagePickerModal
  const handleImageButtonClick = useCallback(() => {
    setShowImagePicker(true);
  }, []);

  const { quillRef, editor, isReady } = useQuillEditor(
    value,
    onChange,
    {
      showToolbar,
      placeholder,
      readOnly,
      imageHandler: handleImageButtonClick,
    }
  );

  // Handle image selection from either products or media library
  const handleImageSelect = useCallback(
    (imageUrl: string, source?: any) => {
      if (!editor) return;

      // Pass both the image URL and product slug to the handler
      // Only products have slugs, media items don't
      const slug = source && 'slug' in source ? source.slug : undefined;

      // Get current cursor position
      const range = editor.getSelection(true);
      const index = range ? range.index : editor.getLength();

      // If this is a product image, insert as a linked image
      if (slug) {
        // Generate locale-aware product URL
        const productUrl = `/${locale}/products/${slug}`;

        // Create HTML with link wrapping the image
        const html = `<a href="${productUrl}"><img src="${imageUrl}" width="300" /></a>`;

        // Insert the HTML using clipboard API
        editor.clipboard.dangerouslyPasteHTML(index, html);

        // Move cursor after the inserted content
        editor.setSelection(index + 1, 0);
      } else {
        // For media library images (no slug), insert as standalone image
        editor.insertEmbed(index, 'image', imageUrl);

        // Set default width of 300px immediately after insertion
        setTimeout(() => {
          const images = editor.root.querySelectorAll('img');
          let targetImg: HTMLImageElement | null = null;

          // Try to find by exact URL match first
          for (let i = images.length - 1; i >= 0; i--) {
            const img = images[i] as HTMLImageElement;
            if (img.src === imageUrl || img.src.endsWith(imageUrl) || imageUrl.endsWith(img.getAttribute('src') || '')) {
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

      // Call optional callback
      if (onImageInsert) {
        onImageInsert(imageUrl);
      }

      // Close the image picker modal after successful insertion
      setShowImagePicker(false);
    },
    [editor, locale, onImageInsert, setShowImagePicker]
  );

  // Determine CSS classes based on state
  const containerClasses = [
    'rich-text-editor',
    className,
    readOnly ? 'rich-text-editor--readonly' : '',
    !showToolbar ? 'rich-text-editor--no-toolbar' : '',
    hasError ? 'rich-text-editor--error' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      {/* Quill editor container */}
      <div ref={quillRef} />

      {/* Enhanced Image Picker Modal with tabs for products and media library */}
      <ImagePickerModal
        isOpen={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelectImage={handleImageSelect}
        locale={locale}
      />
    </div>
  );
}