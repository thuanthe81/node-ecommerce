import { CategoryFormData, LanguageTab } from '../types';

/**
 * Props for the ContentFields component
 */
interface ContentFieldsProps {
  /** Current form data */
  formData: CategoryFormData;
  /** Active language tab */
  activeTab: LanguageTab;
  /** Current locale for translations */
  locale: string;
  /** Handler for input changes */
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

/**
 * ContentFields component for bilingual category name and description
 *
 * Displays name and description fields for the active language (English or Vietnamese)
 */
export function ContentFields({ formData, activeTab, locale, onChange }: ContentFieldsProps) {
  return (
    <div className="space-y-4">
      {activeTab === 'en' ? (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name (English) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nameEn"
              value={formData.nameEn}
              onChange={onChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (English)
            </label>
            <textarea
              name="descriptionEn"
              value={formData.descriptionEn}
              onChange={onChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên danh mục (Tiếng Việt) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nameVi"
              value={formData.nameVi}
              onChange={onChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả (Tiếng Việt)
            </label>
            <textarea
              name="descriptionVi"
              value={formData.descriptionVi}
              onChange={onChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </>
      )}
    </div>
  );
}
