import { Category } from '@/lib/category-api';
import { ProductFormData, LanguageTab } from '../types';

/**
 * Props for BasicInfoFields component
 */
interface BasicInfoFieldsProps {
  /** Form data containing product information */
  formData: ProductFormData;
  /** Available categories for selection */
  categories: Category[];
  /** Active language tab */
  activeTab: LanguageTab;
  /** Handler for input changes */
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  /** Current locale for translations */
  locale: string;
}

/**
 * BasicInfoFieldsHead component for SKU, name, and description fields
 *
 * Displays slug, SKU, category selector, and bilingual name/description fields
 * based on the active language tab.
 */
export function BasicInfoFieldsHead({
  formData,
  categories,
  activeTab,
  onChange,
  locale,
}: BasicInfoFieldsProps) {
  return (
    <>
      {/* Basic Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          {locale === 'vi' ? 'Thông tin cơ bản' : 'Basic Information'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {locale === 'vi' ? 'Slug (URL)' : 'Slug (URL)'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={onChange}
              required
              placeholder="product-name-url"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">
              {locale === 'vi'
                ? 'URL thân thiện cho sản phẩm (ví dụ: ao-len-handmade)'
                : 'URL-friendly product identifier (e.g., handmade-sweater)'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SKU <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={onChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {locale === 'vi' ? 'Danh mục' : 'Category'} <span className="text-red-500">*</span>
            </label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={onChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">
                {locale === 'vi' ? 'Chọn danh mục' : 'Select category'}
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {'—'.repeat(cat.displayOrder)} {locale === 'vi' ? cat.nameVi : cat.nameEn}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * BasicInfoFieldsContent component for SKU, name, and description fields
 *
 * Displays slug, SKU, category selector, and bilingual name/description fields
 * based on the active language tab.
 */
export function BasicInfoFieldsContent({
  formData,
  categories,
  activeTab,
  onChange,
  locale,
}: BasicInfoFieldsProps) {
  return (
    <>
      {/* Bilingual Content */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            {locale === 'vi' ? 'Nội dung' : 'Content'}
          </h2>
        </div>

        <div className="space-y-4">
          {activeTab === 'en' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name (English) <span className="text-red-500">*</span>
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
                  Description (English) <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="descriptionEn"
                  value={formData.descriptionEn}
                  onChange={onChange}
                  required
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên sản phẩm (Tiếng Việt) <span className="text-red-500">*</span>
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
                  Mô tả (Tiếng Việt) <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="descriptionVi"
                  value={formData.descriptionVi}
                  onChange={onChange}
                  required
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}