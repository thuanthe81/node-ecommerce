import { ProductFormData } from '../types';

/**
 * Props for ProductOptions component
 */
interface ProductOptionsProps {
  /** Form data containing product options */
  formData: ProductFormData;
  /** Handler for checkbox changes */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Current locale for translations */
  locale: string;
}

/**
 * ProductOptions component for active and featured checkboxes
 *
 * Displays settings for product activation and featured status.
 */
export function ProductOptions({ formData, onChange, locale }: ProductOptionsProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        {locale === 'vi' ? 'Cài đặt' : 'Settings'}
      </h2>

      <div className="space-y-3">
        <label className="flex items-center">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={onChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">
            {locale === 'vi' ? 'Kích hoạt sản phẩm' : 'Active product'}
          </span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            name="isFeatured"
            checked={formData.isFeatured}
            onChange={onChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">
            {locale === 'vi' ? 'Sản phẩm nổi bật' : 'Featured product'}
          </span>
        </label>
      </div>
    </div>
  );
}
