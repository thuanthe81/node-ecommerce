/**
 * ImageDropdown Component
 *
 * Dropdown menu for image insertion options
 */

'use client';

import React, { useEffect, useRef } from 'react';

interface ImageDropdownProps {
  /** Whether the dropdown is visible */
  isOpen: boolean;

  /** Callback to close the dropdown */
  onClose: () => void;

  /** Callback when "From Products" is selected */
  onSelectFromProducts: () => void;

  /** Callback when "From Media Library" is selected */
  onSelectFromMediaLibrary: () => void;

  /** Callback when "Upload from Disk" is selected */
  onSelectUploadFromDisk: () => void;

  /** Position of the dropdown (relative to image button) */
  position: { top: number; left: number };

  /** Current locale for translations */
  locale: string;
}

/**
 * Dropdown menu for selecting image insertion method
 */
export function ImageDropdown({
  isOpen,
  onClose,
  onSelectFromProducts,
  onSelectFromMediaLibrary,
  onSelectUploadFromDisk,
  position,
  locale,
}: ImageDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const translations = {
    fromProducts: locale === 'vi' ? 'Từ sản phẩm' : 'From Products',
    fromMediaLibrary: locale === 'vi' ? 'Từ thư viện phương tiện' : 'From Media Library',
    uploadFromDisk: locale === 'vi' ? 'Tải lên từ máy tính' : 'Upload from Disk',
  };

  return (
    <div
      ref={dropdownRef}
      className="image-dropdown"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      role="menu"
      aria-label={locale === 'vi' ? 'Tùy chọn chèn hình ảnh' : 'Image insertion options'}
    >
      <button
        type="button"
        onClick={() => {
          onSelectFromProducts();
          onClose();
        }}
        role="menuitem"
        aria-label={translations.fromProducts}
      >
        <svg
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span>{translations.fromProducts}</span>
      </button>
      <button
        type="button"
        onClick={() => {
          onSelectFromMediaLibrary();
          onClose();
        }}
        role="menuitem"
        aria-label={translations.fromMediaLibrary}
      >
        <svg
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <span>{translations.fromMediaLibrary}</span>
      </button>
      <button
        type="button"
        onClick={() => {
          onSelectUploadFromDisk();
          onClose();
        }}
        role="menuitem"
        aria-label={translations.uploadFromDisk}
      >
        <svg
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <span>{translations.uploadFromDisk}</span>
      </button>
    </div>
  );
}
