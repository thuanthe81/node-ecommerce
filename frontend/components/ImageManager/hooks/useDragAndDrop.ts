import { useState } from 'react';
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { ImageItem } from '../types';

/**
 * Custom hook for managing drag-and-drop functionality in the ImageManager
 *
 * @param images - Array of image items
 * @param onReorder - Callback when images are reordered
 *
 * @returns Object containing drag-and-drop state and handlers
 *
 * @example
 * ```tsx
 * const {
 *   isDragging,
 *   sensors,
 *   handleDragOver,
 *   handleDragLeave,
 *   handleDrop,
 *   handleDragEnd
 * } = useDragAndDrop(images, handleReorder);
 * ```
 */
export function useDragAndDrop(
  images: ImageItem[],
  onReorder: (reorderedImages: ImageItem[]) => void
) {
  const [isDragging, setIsDragging] = useState(false);

  // Configure sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag over for file upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Handle drag leave for file upload
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Handle drop for file upload
  const handleDrop = (e: React.DragEvent, onFilesSelected: (files: FileList | null) => void) => {
    e.preventDefault();
    setIsDragging(false);
    onFilesSelected(e.dataTransfer.files);
  };

  // Handle drag end for image reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);

      const reorderedImages = arrayMove(images, oldIndex, newIndex).map((img, index) => ({
        ...img,
        displayOrder: index,
      }));

      onReorder(reorderedImages);
    }
  };

  return {
    isDragging,
    sensors,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  };
}
