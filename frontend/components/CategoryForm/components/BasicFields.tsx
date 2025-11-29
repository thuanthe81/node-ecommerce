import { CategoryFormData, FlattenedCategory } from '../types';

/**
 * Props for the BasicFields component
 */
interface BasicFieldsProps {
  /** Current form data */
  formData: CategoryFormData;
  /** Available categories for parent selection */
  categories: FlattenedCategory[];
  /** Current locale for translations */
  locale: string;
  /** Handler for input changes */
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

/**
 * BasicFields component for category slug, parent, and display order
 *
 * Displays the basic configuration fields for a category including:
 * - Slug (URL-friendly identifier)
 * - Parent category selection
 * - Display order
 */
export function BasicFields({ formData, categories, locale, onChange }: BasicFieldsProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        {locale === 'vi' ? 'Thông tin cơ bản' : 'Basic Information'}
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Slug <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="slug"
            value={formData.slug}
            onChange={onChange}
            required
            placeholder="handmade-jewelry"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">
            {locale === 'vi'
              ? 'URL thân thiện (ví dụ: trang-suc-thu-cong)'
              : 'URL-friendly identifier (e.g., handmade-jewelry)'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {locale === 'vi' ? 'Danh mục cha' : 'Parent Category'}
          </label>
          <select
            name="parentId"
            value={formData.parentId || ''}
            onChange={onChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">
              {locale === 'vi' ? 'Không có (Danh mục gốc)' : 'None (Root Category)'}
            </option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {'—'.repeat(cat.displayOrder)} {locale === 'vi' ? cat.nameVi : cat.nameEn}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {locale === 'vi' ? 'Thứ tự hiển thị' : 'Display Order'}
          </label>
          <input
            type="number"
            name="displayOrder"
            value={formData.displayOrder}
            onChange={onChange}
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">
            {locale === 'vi'
              ? 'Số thứ tự để sắp xếp danh mục (0 = đầu tiên)'
              : 'Order number for sorting categories (0 = first)'}
          </p>
        </div>
      </div>
    </div>
  );
}
