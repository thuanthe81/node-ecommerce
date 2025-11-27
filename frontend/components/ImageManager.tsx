'use client';

import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { ProductImage } from '@/lib/product-api';
import { SvgClose } from '@/components/Svgs';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ImageManagerProps {
  productId?: string;
  existingImages: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  locale: string;
  onUpload?: (files: File[]) => Promise<void>;
  onDelete?: (imageId: string) => Promise<void>;
  onReorder?: (images: ProductImage[]) => Promise<void>;
  onUpdateAltText?: (imageId: string, altTextEn: string, altTextVi: string) => Promise<void>;
}

interface ImageItem {
  id: string;
  url: string;
  altTextEn?: string;
  altTextVi?: string;
  displayOrder: number;
  isNew?: boolean;
  file?: File;
  uploading?: boolean;
}

interface SortableImageItemProps {
  image: ImageItem;
  index: number;
  locale: string;
  onDelete: (id: string) => void;
  onEditAltText: (id: string) => void;
  isEditing: boolean;
}

function SortableImageItem({
  image,
  index,
  locale,
  onDelete,
  onEditAltText,
  isEditing,
}: SortableImageItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group bg-white rounded-lg border-2 ${
        isDragging ? 'border-blue-500' : 'border-gray-200'
      } ${isEditing ? 'ring-2 ring-blue-500' : ''}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 bg-gray-800 bg-opacity-75 text-white p-1.5 rounded cursor-move opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title={locale === 'vi' ? 'Kéo để sắp xếp' : 'Drag to reorder'}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
        </svg>
      </div>

      {/* Primary Badge */}
      {index === 0 && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full z-10">
          {locale === 'vi' ? 'Chính' : 'Primary'}
        </div>
      )}

      {/* Delete Button */}
      <button
        type="button"
        onClick={() => onDelete(image.id)}
        className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title={locale === 'vi' ? 'Xóa' : 'Delete'}
      >
        <SvgClose className="w-4 h-4" />
      </button>

      {/* Image */}
      <div className="aspect-square overflow-hidden rounded-t-lg">
        <img
          src={image.url}
          alt={image.altTextEn || ''}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Upload Progress */}
      {image.uploading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
          <div className="text-white text-sm">
            {locale === 'vi' ? 'Đang tải lên...' : 'Uploading...'}
          </div>
        </div>
      )}

      {/* Alt Text Button */}
      <button
        type="button"
        onClick={() => onEditAltText(image.id)}
        className="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 border-t border-gray-200"
      >
        {locale === 'vi' ? 'Chỉnh sửa văn bản thay thế' : 'Edit alt text'}
      </button>
    </div>
  );
}

export interface ImageManagerHandle {
  getNewFiles: () => File[];
}

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
  const [images, setImages] = useState<ImageItem[]>(
    existingImages.map((img) => ({ ...img, isNew: false }))
  );
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [altTextEn, setAltTextEn] = useState('');
  const [altTextVi, setAltTextVi] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Handle image reordering
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);

      const reorderedImages = arrayMove(images, oldIndex, newIndex).map((img, index) => ({
        ...img,
        displayOrder: index,
      }));

      setImages(reorderedImages);

      // Call onReorder if provided and productId exists
      if (onReorder && productId) {
        try {
          await onReorder(reorderedImages.filter((img) => !img.isNew) as ProductImage[]);
        } catch (error) {
          console.error('Failed to reorder images:', error);
          // Revert on error
          setImages(images);
        }
      }

      // Notify parent of changes
      onImagesChange(reorderedImages.filter((img) => !img.isNew) as ProductImage[]);
    }
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

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="text-sm text-gray-600">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {locale === 'vi' ? 'Tải lên file' : 'Upload files'}
            </button>
            {' ' + (locale === 'vi' ? 'hoặc kéo và thả' : 'or drag and drop')}
          </div>
          <p className="text-xs text-gray-500">
            {locale === 'vi'
              ? 'PNG, JPG, WebP tối đa 5MB'
              : 'PNG, JPG, WebP up to 5MB'}
          </p>
        </div>
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            {locale === 'vi' ? 'Hình ảnh' : 'Images'} ({images.length})
          </h3>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={images.map((img) => img.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <SortableImageItem
                    key={image.id}
                    image={image}
                    index={index}
                    locale={locale}
                    onDelete={handleDelete}
                    onEditAltText={handleEditAltText}
                    isEditing={editingImageId === image.id}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Alt Text Editor Modal */}
      {editingImageId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {locale === 'vi' ? 'Chỉnh sửa văn bản thay thế' : 'Edit Alt Text'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'vi' ? 'Tiếng Anh' : 'English'}
                </label>
                <input
                  type="text"
                  value={altTextEn}
                  onChange={(e) => setAltTextEn(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={locale === 'vi' ? 'Mô tả hình ảnh bằng tiếng Anh' : 'Describe the image in English'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'vi' ? 'Tiếng Việt' : 'Vietnamese'}
                </label>
                <input
                  type="text"
                  value={altTextVi}
                  onChange={(e) => setAltTextVi(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={locale === 'vi' ? 'Mô tả hình ảnh bằng tiếng Việt' : 'Describe the image in Vietnamese'}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={handleCancelAltText}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                {locale === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveAltText}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {locale === 'vi' ? 'Lưu' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default ImageManager;
