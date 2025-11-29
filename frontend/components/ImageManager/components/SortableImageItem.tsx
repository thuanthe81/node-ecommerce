import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SvgClose } from '@/components/Svgs';
import { SortableImageItemProps } from '../types';

/**
 * SortableImageItem component for displaying an individual image with drag handle
 *
 * Displays a single image with controls for deletion, reordering via drag-and-drop,
 * and editing alt text. The first image is marked as primary.
 *
 * @param props - Component props
 * @returns JSX element
 */
export function SortableImageItem({
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
