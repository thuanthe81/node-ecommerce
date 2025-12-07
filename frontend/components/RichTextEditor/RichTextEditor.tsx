/**
 * RichTextEditor Component
 *
 * A Quill.js-based rich text editor for content management.
 * Supports rich text formatting, image insertion from products,
 * and file uploads from disk.
 */

'use client';

import React, { useState, useRef, useCallback } from 'react';
import type { RichTextEditorProps } from './types';
import { useQuillEditor } from './hooks/useQuillEditor';
import { useImageInsertion } from './hooks/useImageInsertion';
import { ImageDropdown } from './components/ImageDropdown';
import ImagePickerModal from '../ImagePickerModal';
import { MediaPickerModal } from '../MediaPickerModal/MediaPickerModal';

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
  const [showImageDropdown, setShowImageDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom image handler for Quill toolbar
  const handleImageButtonClick = useCallback(() => {
    // Find the image button in the toolbar to position the dropdown
    const imageButton = document.querySelector('.ql-image');
    if (imageButton) {
      const rect = imageButton.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX,
      });
    }
    setShowImageDropdown(true);
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

  const {
    showProductPicker,
    setShowProductPicker,
    handleProductImageSelect,
    handleFileUpload,
    isUploading,
    uploadError,
    successMessage,
  } = useImageInsertion(editor, onImageInsert, locale);

  // Handle "From Products" option
  const handleSelectFromProducts = useCallback(() => {
    setShowProductPicker(true);
  }, [setShowProductPicker]);

  // Handle "From Media Library" option
  const handleSelectFromMediaLibrary = useCallback(() => {
    setShowMediaPicker(true);
  }, []);

  // Handle media selection from media library
  const handleMediaSelect = useCallback(
    (url: string) => {
      if (editor) {
        const range = editor.getSelection();
        if (range) {
          editor.insertEmbed(range.index, 'image', url);
          editor.setSelection(range.index + 1, 0);
        }
      }
      setShowMediaPicker(false);
    },
    [editor]
  );

  // Handle "Upload from Disk" option
  const handleSelectUploadFromDisk = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle file selection from disk
  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        await handleFileUpload(file);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [handleFileUpload]
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

      {/* Hidden file input for disk uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
        aria-label={locale === 'vi' ? 'Chọn tệp hình ảnh' : 'Select image file'}
      />

      {/* Image insertion dropdown */}
      <ImageDropdown
        isOpen={showImageDropdown}
        onClose={() => setShowImageDropdown(false)}
        onSelectFromProducts={handleSelectFromProducts}
        onSelectFromMediaLibrary={handleSelectFromMediaLibrary}
        onSelectUploadFromDisk={handleSelectUploadFromDisk}
        position={dropdownPosition}
        locale={locale}
      />

      {/* Product image picker modal */}
      <ImagePickerModal
        isOpen={showProductPicker}
        onClose={() => setShowProductPicker(false)}
        onSelectImage={(imageUrl, product) => {
          // Pass both the image URL and product slug to the handler
          handleProductImageSelect(imageUrl, product?.slug);
        }}
        locale={locale}
      />

      {/* Content media picker modal */}
      <MediaPickerModal
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelectMedia={handleMediaSelect}
        locale={locale}
      />

      {/* Status messages container */}
      <div className="mt-2 space-y-2">
        {/* Upload loading indicator with spinner */}
        {isUploading && (
          <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 animate-fade-in">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>
              {locale === 'vi' ? 'Đang tải lên hình ảnh...' : 'Uploading image...'}
            </span>
          </div>
        )}

        {/* Success message */}
        {successMessage && (
          <div
            className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 animate-fade-in"
            role="status"
            aria-live="polite"
          >
            <svg
              className="h-5 w-5 flex-shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Upload error message */}
        {uploadError && (
          <div
            className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 animate-fade-in"
            role="alert"
            aria-live="polite"
          >
            <svg
              className="h-5 w-5 flex-shrink-0 mt-0.5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{uploadError}</span>
          </div>
        )}
      </div>
    </div>
  );
}
