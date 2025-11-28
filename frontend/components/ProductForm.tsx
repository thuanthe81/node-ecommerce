'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Product, productApi, ProductImage } from '@/lib/product-api';
import { SvgClose } from '@/components/Svgs';
import { Category, categoryApi } from '@/lib/category-api';
import ImageManager, { ImageManagerHandle } from '@/components/ImageManager';

interface ProductFormProps {
  locale: string;
  product?: Product;
  isEdit?: boolean;
}

export default function ProductForm({ locale, product, isEdit = false }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<'en' | 'vi'>('en');
  const [images, setImages] = useState<ProductImage[]>(product?.images || []);
  const imageManagerRef = useRef<ImageManagerHandle>(null);
  const [formData, setFormData] = useState({
    slug: product?.slug || '',
    sku: product?.sku || '',
    nameEn: product?.nameEn || '',
    nameVi: product?.nameVi || '',
    descriptionEn: product?.descriptionEn || '',
    descriptionVi: product?.descriptionVi || '',
    price: product?.price || 0,
    compareAtPrice: product?.compareAtPrice || 0,
    stockQuantity: product?.stockQuantity || 0,
    categoryId: product?.category?.id || '',
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoryApi.getCategories();
      setCategories(flattenCategories(data));
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const flattenCategories = (cats: Category[], level = 0): Category[] => {
    let result: Category[] = [];
    cats.forEach((cat) => {
      result.push({ ...cat, displayOrder: level });
      if (cat.children && cat.children.length > 0) {
        result = result.concat(flattenCategories(cat.children, level + 1));
      }
    });
    return result;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]:
        type === 'number'
          ? parseFloat(value) || 0
          : type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : value,
    });
  };

  const handleImagesChange = (updatedImages: ProductImage[]) => {
    setImages(updatedImages);
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!product) return;
    await productApi.deleteProductImage(product.id, imageId);
  };

  const handleReorderImages = async (reorderedImages: ProductImage[]) => {
    if (!product) return;
    const imageOrder = reorderedImages.map((img, index) => ({
      imageId: img.id,
      displayOrder: index,
    }));
    await productApi.reorderImages(product.id, imageOrder);
  };

  const handleUpdateAltText = async (imageId: string, altTextEn: string, altTextVi: string) => {
    if (!product) return;
    await productApi.updateImageMetadata(product.id, imageId, { altTextEn, altTextVi });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let savedProduct: Product;

      if (isEdit && product) {
        // Update existing product
        savedProduct = await productApi.updateProduct(product.id, formData);

        // Upload new images for edit mode
        const newFiles = imageManagerRef.current?.getNewFiles() || [];
        if (newFiles.length > 0) {
          for (let i = 0; i < newFiles.length; i++) {
            await productApi.uploadProductImage(savedProduct.id, newFiles[i], {
              displayOrder: images.length + i,
            });
          }
        }
      } else {
        // Create new product - need to use FormData for file upload
        const formDataToSend = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          // Convert boolean values properly for FormData
          if (typeof value === 'boolean') {
            formDataToSend.append(key, value ? 'true' : 'false');
          } else {
            formDataToSend.append(key, value.toString());
          }
        });

        // Add images from ImageManager
        const newFiles = imageManagerRef.current?.getNewFiles() || [];
        newFiles.forEach((file) => {
          formDataToSend.append('images', file);
        });

        savedProduct = await productApi.createProduct(formDataToSend);
      }

      router.push(`/${locale}/admin/products`);
    } catch (error) {
      console.error('Failed to save product:', error);
      alert(
        locale === 'vi'
          ? 'Không thể lưu sản phẩm. Vui lòng thử lại.'
          : 'Failed to save product. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const lowStockWarning = formData.stockQuantity < 10 && formData.stockQuantity > 0;
  const outOfStock = formData.stockQuantity === 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
              onChange={handleInputChange}
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
              onChange={handleInputChange}
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
              onChange={handleInputChange}
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

      {/* Bilingual Content */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            {locale === 'vi' ? 'Nội dung' : 'Content'}
          </h2>
          <div className="flex space-x-2">
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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pricing and Inventory */}
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
                onChange={handleInputChange}
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
                onChange={handleInputChange}
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
              onChange={handleInputChange}
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
                {locale === 'vi' ? '❌ Hết hàng' : '❌ Out of stock'}
              </p>
            )}
          </div>
        </div>
      </div>

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
              onChange={handleInputChange}
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
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              {locale === 'vi' ? 'Sản phẩm nổi bật' : 'Featured product'}
            </span>
          </label>
        </div>
      </div>

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
