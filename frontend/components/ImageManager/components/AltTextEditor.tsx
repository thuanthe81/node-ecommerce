import { AltTextEditorProps } from '../types';

/**
 * AltTextEditor component for editing image alt text
 *
 * Displays a modal dialog for editing alt text in both English and Vietnamese.
 * Provides save and cancel actions.
 *
 * @param props - Component props
 * @returns JSX element
 */
export function AltTextEditor({
  locale,
  altTextEn,
  altTextVi,
  onAltTextEnChange,
  onAltTextViChange,
  onSave,
  onCancel,
}: AltTextEditorProps) {
  return (
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
              onChange={(e) => onAltTextEnChange(e.target.value)}
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
              onChange={(e) => onAltTextViChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={locale === 'vi' ? 'Mô tả hình ảnh bằng tiếng Việt' : 'Describe the image in Vietnamese'}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            {locale === 'vi' ? 'Hủy' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={onSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {locale === 'vi' ? 'Lưu' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
