/**
 * QuoteItemPricingForm Component
 *
 * Provides interface for admin users to set and edit prices on order items.
 * Shows all items in the order - both quote items (without prices) and priced items.
 * Supports multiple price edits - prices can be updated multiple times.
 * Includes client-side validation for price inputs (positive numbers).
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { OrderItem } from '@/lib/order-api';
import { formatMoney } from '@/app/utils';
import { SvgExclamationCircle, SvgCheck } from '../../Svgs';

interface QuoteItemPricingFormProps {
  items: OrderItem[];
  locale: string;
  onPriceUpdate: (itemId: string, price: number) => Promise<void>;
  disabled?: boolean;
}

interface PriceInputState {
  [itemId: string]: {
    value: string;
    isValid: boolean;
    error?: string;
  };
}

export function QuoteItemPricingForm({
  items,
  locale,
  onPriceUpdate,
  disabled = false,
}: QuoteItemPricingFormProps) {
  const t = useTranslations('admin');
  const tOrders = useTranslations('orders');
  const [priceInputs, setPriceInputs] = useState<PriceInputState>({});
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  // Show all items for pricing - both quote items and items with existing prices
  const allItems = items;

  // Count items that still need initial pricing (quote items)
  const quoteItems = items.filter((item) => {
    return item.price === 0 || item.price === null || item.price === undefined;
  });

  // Count items that already have prices (can be edited)
  const pricedItems = items.filter((item) => {
    return item.price && item.price > 0;
  });

  // If no items at all, don't render the form
  if (allItems.length === 0) {
    return null;
  }

  const validatePrice = (value: string): { isValid: boolean; error?: string } => {
    if (!value || value.trim() === '') {
      return {
        isValid: false,
        error: locale === 'vi' ? 'Vui lòng nhập giá' : 'Please enter a price',
      };
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return {
        isValid: false,
        error: locale === 'vi' ? 'Giá phải là số hợp lệ' : 'Price must be a valid number',
      };
    }

    if (numValue <= 0) {
      return {
        isValid: false,
        error: locale === 'vi' ? 'Giá phải lớn hơn 0' : 'Price must be greater than 0',
      };
    }

    return { isValid: true };
  };

  const handlePriceChange = (itemId: string, value: string) => {
    const validation = validatePrice(value);
    setPriceInputs((prev) => ({
      ...prev,
      [itemId]: {
        value,
        isValid: validation.isValid,
        error: validation.error,
      },
    }));
  };

  const handleSetPrice = async (item: OrderItem) => {
    const priceInput = priceInputs[item.id];
    if (!priceInput || !priceInput.isValid) {
      return;
    }

    const price = parseFloat(priceInput.value);
    setUpdatingItems((prev) => new Set(prev).add(item.id));

    try {
      await onPriceUpdate(item.id, price);
      // Clear the input after successful update
      setPriceInputs((prev) => {
        const newInputs = { ...prev };
        delete newInputs[item.id];
        return newInputs;
      });
    } catch (error) {
      // Error handling is done by parent component
      console.error('Failed to update price:', error);
    } finally {
      setUpdatingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  const getInputValue = (itemId: string) => {
    const inputValue = priceInputs[itemId]?.value;
    if (inputValue) {
      return inputValue;
    }

    // For items with existing prices, show the current price as default
    const item = items.find(i => i.id === itemId);
    if (item && item.price && item.price > 0) {
      return item.price.toString();
    }

    return '';
  };

  const getInputError = (itemId: string) => {
    return priceInputs[itemId]?.error;
  };

  const isInputValid = (itemId: string) => {
    return priceInputs[itemId]?.isValid || false;
  };

  const isUpdating = (itemId: string) => {
    return updatingItems.has(itemId);
  };

  const hasExistingPrice = (item: OrderItem) => {
    return item.price && item.price > 0;
  };

  const isQuoteItem = (item: OrderItem) => {
    return item.price === 0 || item.price === null || item.price === undefined;
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <div className="flex items-start gap-3 mb-4">
        <SvgExclamationCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            {locale === 'vi' ? 'Quản lý giá sản phẩm' : 'Manage Product Prices'}
          </h3>
          <p className="text-sm text-yellow-700 mb-4">
            {quoteItems.length > 0 ? (
              locale === 'vi'
                ? `Đơn hàng này có ${quoteItems.length} sản phẩm chưa có giá và ${pricedItems.length} sản phẩm đã có giá. Bạn có thể đặt giá cho sản phẩm chưa có giá hoặc chỉnh sửa giá của sản phẩm đã có giá.`
                : `This order has ${quoteItems.length} items without prices and ${pricedItems.length} items with prices. You can set prices for unpriced items or edit existing prices.`
            ) : (
              locale === 'vi'
                ? `Tất cả ${pricedItems.length} sản phẩm đã có giá. Bạn có thể chỉnh sửa giá của bất kỳ sản phẩm nào.`
                : `All ${pricedItems.length} items have prices. You can edit the price of any item.`
            )}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {allItems.map((item) => (
          <div
            key={item.id}
            className={`border rounded-lg p-4 ${
              isQuoteItem(item)
                ? 'bg-white border-yellow-300'
                : 'bg-blue-50 border-blue-300'
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Product Image */}
              {item.product?.images?.[0] && (
                <img
                  src={item.product.images[0].url}
                  alt={locale === 'vi' ? item.productNameVi : item.productNameEn}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />
              )}

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    {locale === 'vi' ? item.productNameVi : item.productNameEn}
                  </h4>
                  {hasExistingPrice(item) && (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      {locale === 'vi' ? 'Đã có giá' : 'Priced'}
                    </span>
                  )}
                  {isQuoteItem(item) && (
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                      {locale === 'vi' ? 'Chưa có giá' : 'Quote Item'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  {tOrders('sku')}: {item.sku} | {tOrders('quantity')}: {item.quantity}
                  {hasExistingPrice(item) && (
                    <span className="ml-2 text-blue-600 font-medium">
                      | {locale === 'vi' ? 'Giá hiện tại' : 'Current price'}: {formatMoney(item.price, locale)}
                    </span>
                  )}
                </p>

                {/* Price Input */}
                <div className="flex items-start gap-3">
                  <div className="flex-1 max-w-xs">
                    <label htmlFor={`price-${item.id}`} className="sr-only">
                      {locale === 'vi' ? 'Giá sản phẩm' : 'Product price'}
                    </label>
                    <input
                      id={`price-${item.id}`}
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder={
                        hasExistingPrice(item)
                          ? (locale === 'vi' ? 'Nhập giá mới (VND)' : 'Enter new price (VND)')
                          : (locale === 'vi' ? 'Nhập giá (VND)' : 'Enter price (VND)')
                      }
                      value={getInputValue(item.id)}
                      onChange={(e) => handlePriceChange(item.id, e.target.value)}
                      disabled={disabled || isUpdating(item.id)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                        getInputError(item.id)
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300'
                      }`}
                      aria-describedby={
                        getInputError(item.id) ? `price-error-${item.id}` : undefined
                      }
                    />
                    {getInputError(item.id) && (
                      <p
                        id={`price-error-${item.id}`}
                        className="mt-1 text-sm text-red-600"
                        role="alert"
                      >
                        {getInputError(item.id)}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleSetPrice(item)}
                    disabled={
                      disabled ||
                      isUpdating(item.id) ||
                      !getInputValue(item.id) ||
                      !isInputValid(item.id)
                    }
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    aria-label={
                      hasExistingPrice(item)
                        ? (locale === 'vi'
                            ? `Cập nhật giá cho ${locale === 'vi' ? item.productNameVi : item.productNameEn}`
                            : `Update price for ${locale === 'vi' ? item.productNameVi : item.productNameEn}`)
                        : (locale === 'vi'
                            ? `Đặt giá cho ${locale === 'vi' ? item.productNameVi : item.productNameEn}`
                            : `Set price for ${locale === 'vi' ? item.productNameVi : item.productNameEn}`)
                    }
                  >
                    {isUpdating(item.id) ? (
                      <>
                        <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        {locale === 'vi' ? 'Đang lưu...' : 'Saving...'}
                      </>
                    ) : (
                      <>
                        {hasExistingPrice(item)
                          ? (locale === 'vi' ? 'Cập nhật giá' : 'Update Price')
                          : (locale === 'vi' ? 'Đặt giá' : 'Set Price')
                        }
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <SvgCheck className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-700">
            {quoteItems.length > 0 ? (
              locale === 'vi'
                ? 'Sau khi đặt giá cho tất cả sản phẩm chưa có giá, bạn sẽ có thể xếp hàng email hóa đơn với PDF đính kèm. Bạn cũng có thể chỉnh sửa giá của sản phẩm đã có giá bất cứ lúc nào.'
                : 'After setting prices for all unpriced items, you will be able to queue invoice email with PDF attachment. You can also edit prices of existing items at any time.'
            ) : (
              locale === 'vi'
                ? 'Tất cả sản phẩm đã có giá. Bạn có thể chỉnh sửa giá bất cứ lúc nào và xếp hàng email hóa đơn với thông tin giá cập nhật.'
                : 'All items are priced. You can edit prices at any time and queue invoice email with updated pricing information.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}