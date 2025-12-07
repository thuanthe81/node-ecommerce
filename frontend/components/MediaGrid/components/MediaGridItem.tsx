/**
 * MediaGridItem Component
 * Individual media item card in the grid
 */

import { useTranslations } from 'next-intl';
import { MediaGridItemProps } from '../types';
import { formatFileSize, formatDate } from '../utils/formatters';

export function MediaGridItem({
  item,
  onDelete,
  onCopyUrl,
  locale,
}: MediaGridItemProps) {
  const t = useTranslations('admin.contentMedia');

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(item.url);
      onCopyUrl(item.url);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image preview */}
      <div className="aspect-square bg-gray-100 relative">
        <img
          src={item.url}
          alt={item.originalName}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Media info */}
      <div className="p-3">
        {/* Filename */}
        <h3
          className="text-sm font-medium text-gray-900 truncate mb-1"
          title={item.originalName}
        >
          {item.originalName}
        </h3>

        {/* Metadata */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>{formatDate(item.createdAt, locale)}</p>
          <p>{formatFileSize(item.size)}</p>
        </div>

        {/* Action buttons */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleCopyUrl}
            className="flex-1 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            title={t('copyUrl')}
          >
            {t('copyUrl')}
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
            title={t('delete')}
          >
            {t('delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
