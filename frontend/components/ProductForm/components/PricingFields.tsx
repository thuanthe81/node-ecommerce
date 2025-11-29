import { ProductFormData } from '../types';

/**
 * Props for PricingFields component
 */
interface PricingFieldsProps {
  /** Form data containing pricing information */
  formData: ProductFormData;
  /** Handler for input changes */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Current locale for translations */
  locale: string;
  /** Whether stock is low (< 10 and > 0) */
  lowStockWarning: boolean;
  /** Whether product is out of stock (= 0) */
  outOfStock: boolean;
}

/**
 * PricingFields component for price, compare at price, and stock quantity
 *
 * Displays pricing fields with currency formatting and stock warnings.
 * Shows special messaging for zero-price products (contact for pricing).
 */
export function PricingFields({
  formData,
  onChange,
  locale,
  lowStockWarning,
  outOfStock,
}: PricingFieldsProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        {locale === 'vi' ? 'Giá và tồn kho' : 'Pricing and Inventory'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {locale === 'vi' ? 'Giá' : 'Price'} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={onChange}
              required
              min="0"
              step="0.01"
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {formData.price === 0 && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                {locale === 'vi'
                  ? '💡 Giá 0 = Khách hàng cần liên hệ để biết giá. Bạn sẽ đặt giá tùy chỉnh cho từng đơn hàng trong trang chi tiết đơn hàng.'
                  : '💡 Price 0 = Customer must contact for pricing. You will set custom prices for each order in the order detail page.'}
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {locale === 'vi' ? 'Giá so sánh' : 'Compare at Price'}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              name="compareAtPrice"
              value={formData.compareAtPrice}
              onChange={onChange}
              min="0"
              step="0.01"
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {locale === 'vi' ? 'Số lượng tồn kho' : 'Stock Quantity'}{' '}
            <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="stockQuantity"
            value={formData.stockQuantity}
            onChange={onChange}
            required
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {lowStockWarning && (
            <p className="mt-1 text-sm text-yellow-600">
              {locale === 'vi' ? '⚠️ Cảnh báo: Tồn kho thấp' : '⚠️ Warning: Low stock'}
            </p>
          )}
          {outOfStock && (
            <p className="mt-1 text-sm text-red-600">
              {locale === 'vi' ? '❌ Đặt trước' : '❌ Pre-Order'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
