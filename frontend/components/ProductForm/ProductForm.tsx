'use client';

import { useRouter } from 'next/navigation';
import ImageManager from '@/components/ImageManager';
import { ProductFormProps } from './types';
import { useProductForm } from './hooks/useProductForm';
import { BasicInfoFields } from './components/BasicInfoFields';
import { PricingFields } from './components/PricingFields';
import { ProductOptions } from './components/ProductOptions';

/**
 * ProductForm component for creating and editing products
 *
 * Provides a comprehensive form for managing product information including
 * basic details, bilingual content, pricing, images, and settings.
 *
 * @param locale - Current locale for translations
 * @param product - Product to edit (undefined for create mode)
 * @param isEdit - Whether the form is in edit mode
 */
export default function ProductForm({ locale, product, isEdit = false }: ProductFormProps) {
  const router = useRouter();
  const {
    formData,
    images,
    categories,
    activeTab,
    loading,
    lowStockWarning,
    outOfStock,
    handleInputChange,
    handleImagesChange,
    handleDeleteImage,
    handleReorderImages,
    handleUpdateAltText,
    handleSubmit,
    setActiveTab,
    imageManagerRef,
  } = useProductForm(locale, product, isEdit);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Language Tab Switcher */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('en')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'en'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vi')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'vi'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tiếng Việt
          </button>
        </div>
      </div>

      {/* Basic Information and Content */}
      <BasicInfoFields
        formData={formData}
        categories={categories}
        activeTab={activeTab}
        onChange={handleInputChange}
        locale={locale}
      />

      {/* Pricing and Inventory */}
      <PricingFields
        formData={formData}
        onChange={handleInputChange}
        locale={locale}
        lowStockWarning={lowStockWarning}
        outOfStock={outOfStock}
      />

      {/* Images */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          {locale === 'vi' ? 'Hình ảnh' : 'Images'}
        </h2>
        <ImageManager
          ref={imageManagerRef}
          productId={product?.id}
          existingImages={images}
          onImagesChange={handleImagesChange}
          locale={locale}
          onDelete={handleDeleteImage}
          onReorder={handleReorderImages}
          onUpdateAltText={handleUpdateAltText}
        />
      </div>

      {/* Settings */}
      <ProductOptions formData={formData} onChange={handleInputChange} locale={locale} />

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {locale === 'vi' ? 'Hủy' : 'Cancel'}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? locale === 'vi'
              ? 'Đang lưu...'
              : 'Saving...'
            : locale === 'vi'
            ? 'Lưu sản phẩm'
            : 'Save Product'}
        </button>
      </div>
    </form>
  );
}
