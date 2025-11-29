'use client';

import { forwardRef } from 'react';
import { ImageManagerProps, ImageManagerHandle } from './types';
import { useImageManager } from './hooks/useImageManager';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { ImageUploadZone } from './components/ImageUploadZone';
import { ImageGrid } from './components/ImageGrid';
import { AltTextEditor } from './components/AltTextEditor';

/**
 * ImageManager component for managing product images
 *
 * Provides a complete interface for uploading, reordering, deleting, and editing
 * alt text for product images. Supports drag-and-drop for both file upload and
 * image reordering.
 *
 * @param props - Component props
 * @param ref - Ref to expose getNewFiles method
 * @returns JSX element
 *
 * @example
 * ```tsx
 * const imageManagerRef = useRef<ImageManagerHandle>(null);
 *
 * <ImageManager
 *   productId={product.id}
 *   existingImages={product.images}
 *   onImagesChange={handleImagesChange}
 *   locale="en"
 *   onUpload={handleUpload}
 *   onDelete={handleDelete}
 *   onReorder={handleReorder}
 *   onUpdateAltText={handleUpdateAltText}
 *   ref={imageManagerRef}
 * />
 * ```
 */
const ImageManager = forwardRef<ImageManagerHandle, ImageManagerProps>(function ImageManager(
  {
    productId,
    existingImages,
    onImagesChange,
    locale,
    onUpload,
    onDelete,
    onReorder,
    onUpdateAltText,
  },
  ref
) {
  // Use custom hooks for state management
  const {
    images,
    newFiles,
    editingImageId,
    altTextEn,
    altTextVi,
    handleFileSelect,
    handleDelete,
    handleEditAltText,
    handleSaveAltText,
    handleCancelAltText,
    handleReorder,
    setAltTextEn,
    setAltTextVi,
  } = useImageManager({
    existingImages,
    productId,
    onImagesChange,
    onDelete,
    onReorder,
    onUpdateAltText,
    locale,
    ref,
  });

  const {
    isDragging,
    sensors,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  } = useDragAndDrop(images, handleReorder);

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <ImageUploadZone
        onFilesSelected={handleFileSelect}
        locale={locale}
        isDragging={isDragging}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, handleFileSelect)}
      />

      {/* Image Grid */}
      <ImageGrid
        images={images}
        locale={locale}
        onDelete={handleDelete}
        onEditAltText={handleEditAltText}
        editingImageId={editingImageId}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      />

      {/* Alt Text Editor Modal */}
      {editingImageId && (
        <AltTextEditor
          locale={locale}
          altTextEn={altTextEn}
          altTextVi={altTextVi}
          onAltTextEnChange={setAltTextEn}
          onAltTextViChange={setAltTextVi}
          onSave={handleSaveAltText}
          onCancel={handleCancelAltText}
        />
      )}
    </div>
  );
});

export default ImageManager;
