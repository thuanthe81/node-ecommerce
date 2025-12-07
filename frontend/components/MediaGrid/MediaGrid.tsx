/**
 * MediaGrid Component
 * Displays a responsive grid of media items with delete and copy URL functionality
 */

'use client';

import { useTranslations } from 'next-intl';
import { MediaGridProps } from './types';
import { MediaGridItem } from './components/MediaGridItem';
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog';
import { EmptyState } from './components/EmptyState';
import { useMediaGrid } from './hooks/useMediaGrid';
import { useEffect } from 'react';

export function MediaGrid({
  items,
  onDelete,
  onCopyUrl,
  locale,
  loading = false,
}: MediaGridProps) {
  const t = useTranslations('admin.contentMedia');
  const {
    deleteConfirmItem,
    deleting,
    setDeleting,
    copiedUrl,
    openDeleteConfirm,
    closeDeleteConfirm,
    handleCopyUrl,
  } = useMediaGrid();

  // Show success message when URL is copied
  useEffect(() => {
    if (copiedUrl) {
      onCopyUrl(copiedUrl);
    }
  }, [copiedUrl, onCopyUrl]);

  /**
   * Handle delete confirmation
   */
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmItem) return;

    setDeleting(true);
    try {
      await onDelete(deleteConfirmItem.id);
      closeDeleteConfirm();
    } catch (error) {
      console.error('Failed to delete media item:', error);
      setDeleting(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-2 text-sm text-gray-600">{t('loading')}</p>
      </div>
    );
  }

  // Show empty state if no items
  if (items.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      {/* Responsive grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {items.map((item) => (
          <MediaGridItem
            key={item.id}
            item={item}
            onDelete={(id) => {
              const itemToDelete = items.find(i => i.id === id);
              if (itemToDelete) openDeleteConfirm(itemToDelete);
            }}
            onCopyUrl={handleCopyUrl}
            locale={locale}
          />
        ))}
      </div>

      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        isOpen={!!deleteConfirmItem}
        item={deleteConfirmItem}
        onConfirm={handleDeleteConfirm}
        onCancel={closeDeleteConfirm}
        locale={locale}
        deleting={deleting}
      />
    </>
  );
}
