/**
 * MediaPickerModal Component
 * Modal for selecting images from the content media library
 * Used in rich text editors to insert existing media without creating duplicates
 */

'use client';

import { useTranslations } from 'next-intl';
import { Portal } from '@/components/Portal';
import { MediaPickerModalProps } from './types';
import { ModalHeader } from './components/ModalHeader';
import { ModalBody } from './components/ModalBody';
import { ModalFooter } from './components/ModalFooter';
import { useMediaPicker } from './hooks/useMediaPicker';

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelectMedia,
  locale,
}: MediaPickerModalProps) {
  const t = useTranslations('admin.contentMedia');
  const {
    items,
    loading,
    searchQuery,
    currentPage,
    totalPages,
    totalItems,
    setSearchQuery,
    handleSearch,
    handleClearSearch,
    handlePageChange,
    handleSelectMedia,
  } = useMediaPicker(isOpen, onSelectMedia, onClose);

  if (!isOpen) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-picker-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        <ModalHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearch={handleSearch}
          onClearSearch={handleClearSearch}
          onClose={onClose}
          locale={locale}
        />

        <ModalBody
          items={items}
          loading={loading}
          searchQuery={searchQuery}
          onSelectMedia={handleSelectMedia}
          locale={locale}
        />

        <ModalFooter
          totalItems={totalItems}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onClose={onClose}
          locale={locale}
        />
      </div>
    </div>
    </Portal>
  );
}
