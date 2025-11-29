import { SvgClose } from '../../Svgs';

/**
 * Props for the ImageSection component
 */
interface ImageSectionProps {
  /** Current image URL */
  imageUrl: string;
  /** Current locale for translations */
  locale: string;
  /** Handler for opening image picker */
  onOpenPicker: () => void;
  /** Handler for clearing the image */
  onClearImage: () => void;
}

/**
 * ImageSection component for category image management
 *
 * Displays the current category image (if any) and provides buttons to
 * select or change the image. Only shown in edit mode.
 */
export function ImageSection({ imageUrl, locale, onOpenPicker, onClearImage }: ImageSectionProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        {locale === 'vi' ? 'Hình ảnh' : 'Image'}
      </h2>

      <div className="space-y-4">
        {imageUrl && (
          <div className="relative inline-block">
            <img
              src={imageUrl}
              alt="Category preview"
              className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
            />
            <button
              type="button"
              onClick={onClearImage}
              className="absolute -top-2 -right-2 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 transition-colors"
              title={locale === 'vi' ? 'Xóa hình ảnh' : 'Remove image'}
            >
              <SvgClose className="w-4 h-4" />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onOpenPicker}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {imageUrl
            ? locale === 'vi'
              ? 'Thay đổi hình ảnh'
              : 'Change Image'
            : locale === 'vi'
            ? 'Chọn hình ảnh'
            : 'Select Image'}
        </button>
      </div>
    </div>
  );
}
