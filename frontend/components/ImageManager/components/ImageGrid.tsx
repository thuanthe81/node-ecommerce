import { DndContext, closestCenter, SensorDescriptor, SensorOptions } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { SortableImageItem } from './SortableImageItem';
import { ImageGridProps } from '../types';

/**
 * ImageGrid component for displaying a grid of sortable images
 *
 * Renders a responsive grid of images with drag-and-drop reordering support.
 * Each image can be deleted or have its alt text edited.
 *
 * @param props - Component props
 * @returns JSX element
 */
export function ImageGrid({
  images,
  locale,
  onDelete,
  onEditAltText,
  editingImageId,
  onDragEnd,
  sensors,
}: ImageGridProps & { sensors: SensorDescriptor<SensorOptions>[] }) {
  if (images.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        {locale === 'vi' ? 'Hình ảnh' : 'Images'} ({images.length})
      </h3>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={images.map((img) => img.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <SortableImageItem
                key={image.id}
                image={image}
                index={index}
                locale={locale}
                onDelete={onDelete}
                onEditAltText={onEditAltText}
                isEditing={editingImageId === image.id}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
