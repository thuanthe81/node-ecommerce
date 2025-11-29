'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Category, categoryApi } from '@/lib/category-api';
import { adminCategoryApi, CreateCategoryData } from '@/lib/admin-category-api';
import ImagePickerModal from './ImagePickerModal';
import { SvgClose } from './Svgs';

interface CategoryFormProps {
  locale: string;
  category?: Category;
  isEdit?: boolean;
}

export default function CategoryForm({ locale, category, isEdit = false }: CategoryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<'en' | 'vi'>('en');
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [formData, setFormData] = useState<CreateCategoryData>({
    slug: category?.slug || '',
    nameEn: category?.nameEn || '',
    nameVi: category?.nameVi || '',
    descriptionEn: category?.descriptionEn || '',
    descriptionVi: category?.descriptionVi || '',
    parentId: category?.parentId || undefined,
    imageUrl: category?.imageUrl || '',
    displayOrder: category?.displayOrder || 0,
    isActive: category?.isActive ?? true,
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
      // Don't include the current category in parent options when editing
      if (!isEdit || cat.id !== category?.id) {
        result.push({ ...cat, displayOrder: level });
        if (cat.children && cat.children.length > 0) {
          result = result.concat(flattenCategories(cat.children, level + 1));
        }
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
          ? parseInt(value) || 0
          : type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : value,
    });
  };

  const handleImageSelect = (imageUrl: string) => {
    setFormData({
      ...formData,
      imageUrl,
    });
    setShowImagePicker(false);
  };

  const handleImageClear = () => {
    setFormData({
      ...formData,
      imageUrl: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit && category) {
        // In edit mode, send imageUrl if it exists
        const dataToSend = {
          ...formData,
          parentId: formData.parentId || undefined,
          imageUrl: formData.imageUrl || undefined,
        };
        await adminCategoryApi.updateCategory(category.id, dataToSend);
      } else {
        // In create mode, exclude imageUrl from the request
        const { imageUrl, ...dataWithoutImage } = formData;
        const dataToSend = {
          ...dataWithoutImage,
          parentId: formData.parentId || undefined,
        };
        await adminCategoryApi.createCategory(dataToSend);
      }

      router.push(`/${locale}/admin/categories`);
    } catch (error) {
      console.error('Failed to save category:', error);
      alert(
        locale === 'vi'
          ? 'Không thể lưu danh mục. Vui lòng thử lại.'
          : 'Failed to save category. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

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
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
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
              onChange={handleInputChange}
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
              onChange={handleInputChange}
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
                  Category Name (English) <span className="text-red-500">*</span>
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
                  Description (English)
                </label>
                <textarea
                  name="descriptionEn"
                  value={formData.descriptionEn}
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Image - Only show in edit mode */}
      {isEdit && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {locale === 'vi' ? 'Hình ảnh' : 'Image'}
          </h2>

          <div className="space-y-4">
            {formData.imageUrl && (
              <div className="relative inline-block">
                <img
                  src={formData.imageUrl}
                  alt="Category preview"
                  className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                />
                <button
                  type="button"
                  onClick={handleImageClear}
                  className="absolute -top-2 -right-2 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 transition-colors"
                  title={locale === 'vi' ? 'Xóa hình ảnh' : 'Remove image'}
                >
                  <SvgClose className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowImagePicker(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {formData.imageUrl
                ? locale === 'vi'
                  ? 'Thay đổi hình ảnh'
                  : 'Change Image'
                : locale === 'vi'
                ? 'Chọn hình ảnh'
                : 'Select Image'}
            </button>
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          {locale === 'vi' ? 'Cài đặt' : 'Settings'}
        </h2>

        <label className="flex items-center">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">
            {locale === 'vi' ? 'Kích hoạt danh mục' : 'Active category'}
          </span>
        </label>
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
            ? 'Lưu danh mục'
            : 'Save Category'}
        </button>
      </div>

      {/* Image Picker Modal */}
      <ImagePickerModal
        isOpen={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelectImage={handleImageSelect}
        locale={locale}
      />
    </form>
  );
}
