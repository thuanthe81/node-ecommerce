import { useState, useRef, useImperativeHandle, Ref } from 'react';
import { ProductImage } from '@/lib/product-api';
import { ImageItem, ImageManagerHandle } from '../types';

/**
 * Custom hook for managing image state in the ImageManager component
 *
 * @param existingImages - Array of existing product images
 * @param productId - Optional product ID for existing products
 * @param onImagesChange - Callback when images change
 * @param onDelete - Optional callback for deleting an image
 * @param onReorder - Optional callback for reordering images
 * @param onUpdateAltText - Optional callback for updating alt text
 * @param locale - Current locale for translations
 * @param ref - Ref to expose getNewFiles method
 *
 * @returns Object containing image state and handlers
 *
 * @example
 * ```tsx
 * const {
 *   images,
 *   newFiles,
 *   editingImageId,
 *   altTextEn,
 *   altTextVi,
 *   handleFileSelect,
 *   handleDelete,
 *   handleEditAltText,
 *   handleSaveAltText,
 *   handleCancelAltText,
 *   handleReorder,
 *   setAltTextEn,
 *   setAltTextVi
 * } = useImageManager({
 *   existingImages,
 *   productId,
 *   onImagesChange,
 *   onDelete,
 *   onReorder,
 *   onUpdateAltText,
 *   locale,
 *   ref
 * });
 * ```
 */
export function useImageManager({
  existingImages,
  productId,
  onImagesChange,
  onDelete,
  onReorder,
  onUpdateAltText,
  locale,
  ref,
}: {
  existingImages: ProductImage[];
  productId?: string;
  onImagesChange: (images: ProductImage[]) => void;
  onDelete?: (imageId: string) => Promise<void>;
  onReorder?: (images: ProductImage[]) => Promise<void>;
  onUpdateAltText?: (imageId: string, altTextEn: string, altTextVi: string) => Promise<void>;
  locale: string;
  ref?: Ref<ImageManagerHandle>;
}) {
  const [images, setImages] = useState<ImageItem[]>(
    existingImages.map((img) => ({ ...img, isNew: false }))
  );
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [altTextEn, setAltTextEn] = useState('');
  const [altTextVi, setAltTextVi] = useState('');

  // Expose getNewFiles method via ref
  useImperativeHandle(ref, () => ({
    getNewFiles: () => newFiles,
  }));

  // Validate file type and size
  const validateFile = (file: File): string | null => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      return locale === 'vi'
        ? 'Chỉ chấp nhận file JPEG, PNG, hoặc WebP'
        : 'Only JPEG, PNG, or WebP files are accepted';
    }

    if (file.size > maxSize) {
      return locale === 'vi' ? 'Kích thước file không được vượt quá 5MB' : 'File size must not exceed 5MB';
    }

    return null;
  };

  // Handle file selection
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const filesArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    filesArray.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      setNewFiles((prev) => [...prev, ...validFiles]);

      // Create preview items
      const newImageItems: ImageItem[] = validFiles.map((file, index) => ({
        id: `new-${Date.now()}-${index}`,
        url: URL.createObjectURL(file),
        displayOrder: images.length + newFiles.length + index,
        isNew: true,
        file,
      }));

      setImages((prev) => [...prev, ...newImageItems]);
    }
  };

  // Handle image reordering
  const handleReorder = async (reorderedImages: ImageItem[]) => {
    const oldImages = images;
    setImages(reorderedImages);

    // Call onReorder if provided and productId exists
    if (onReorder && productId) {
      try {
        await onReorder(reorderedImages.filter((img) => !img.isNew) as ProductImage[]);
      } catch (error) {
        console.error('Failed to reorder images:', error);
        // Revert on error
        setImages(oldImages);
        return;
      }
    }

    // Notify parent of changes
    onImagesChange(reorderedImages.filter((img) => !img.isNew) as ProductImage[]);
  };

  // Handle image deletion
  const handleDelete = async (imageId: string) => {
    const image = images.find((img) => img.id === imageId);
    if (!image) return;

    if (!confirm(locale === 'vi' ? 'Bạn có chắc muốn xóa hình ảnh này?' : 'Are you sure you want to delete this image?')) {
      return;
    }

    if (image.isNew) {
      // Remove from new files
      setNewFiles((prev) => prev.filter((_, i) => `new-${Date.now()}-${i}` !== imageId));
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } else {
      // Delete existing image
      if (onDelete && productId) {
        try {
          await onDelete(imageId);
          const updatedImages = images.filter((img) => img.id !== imageId);
          setImages(updatedImages);
          onImagesChange(updatedImages.filter((img) => !img.isNew) as ProductImage[]);
        } catch (error) {
          console.error('Failed to delete image:', error);
          alert(locale === 'vi' ? 'Không thể xóa hình ảnh' : 'Failed to delete image');
        }
      } else {
        // Just remove from state if no delete handler
        const updatedImages = images.filter((img) => img.id !== imageId);
        setImages(updatedImages);
        onImagesChange(updatedImages.filter((img) => !img.isNew) as ProductImage[]);
      }
    }
  };

  // Handle alt text editing
  const handleEditAltText = (imageId: string) => {
    const image = images.find((img) => img.id === imageId);
    if (image) {
      setEditingImageId(imageId);
      setAltTextEn(image.altTextEn || '');
      setAltTextVi(image.altTextVi || '');
    }
  };

  const handleSaveAltText = async () => {
    if (!editingImageId) return;

    const image = images.find((img) => img.id === editingImageId);
    if (!image) return;

    if (!image.isNew && onUpdateAltText && productId) {
      try {
        await onUpdateAltText(editingImageId, altTextEn, altTextVi);
      } catch (error) {
        console.error('Failed to update alt text:', error);
        alert(locale === 'vi' ? 'Không thể cập nhật văn bản thay thế' : 'Failed to update alt text');
        return;
      }
    }

    // Update local state
    const updatedImages = images.map((img) =>
      img.id === editingImageId ? { ...img, altTextEn, altTextVi } : img
    );
    setImages(updatedImages);
    onImagesChange(updatedImages.filter((img) => !img.isNew) as ProductImage[]);

    setEditingImageId(null);
    setAltTextEn('');
    setAltTextVi('');
  };

  const handleCancelAltText = () => {
    setEditingImageId(null);
    setAltTextEn('');
    setAltTextVi('');
  };

  return {
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
  };
}
