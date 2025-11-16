'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import { Category, categoryApi } from '@/lib/category-api';
import { adminCategoryApi } from '@/lib/admin-category-api';
import { useLocale } from 'next-intl';
import { SvgChevronRight, SvgPlus, SvgInfo } from '@/components/Svgs';

export default function AdminCategoriesPage() {
  const locale = useLocale();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryApi.getCategories();
      setCategories(data);
      // Expand all categories by default
      const allIds = new Set<string>();
      const collectIds = (cats: Category[]) => {
        cats.forEach((cat) => {
          allIds.add(cat.id);
          if (cat.children && cat.children.length > 0) {
            collectIds(cat.children);
          }
        });
      };
      collectIds(data);
      setExpandedCategories(allIds);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prevent duplicate execution in React Strict Mode (dev) causing double renders
  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    loadCategories().then();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await adminCategoryApi.deleteCategory(id);
      setDeleteConfirm(null);
      loadCategories().then();
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert(locale === 'vi' ? 'Không thể xóa danh mục' : 'Failed to delete category');
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategoryTree = (cats: Category[], level = 0) => {
    return cats.map((category) => {
      const hasChildren = category.children && category.children.length > 0;
      const isExpanded = expandedCategories.has(category.id);

      return (
        <div key={category.id}>
          <div
            className={`flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 ${
              level > 0 ? 'ml-' + level * 8 : ''
            }`}
            style={{ paddingLeft: `${level * 2 + 1}rem` }}
          >
            <div className="flex items-center space-x-3 flex-1">
              {hasChildren && (
                <button
                  onClick={() => toggleExpand(category.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <SvgChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>
              )}
              {!hasChildren && <div className="w-4" />}

              {category.imageUrl && (
                <img
                  src={category.imageUrl}
                  alt={locale === 'vi' ? category.nameVi : category.nameEn}
                  className="w-10 h-10 rounded object-cover"
                />
              )}

              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">
                    {locale === 'vi' ? category.nameVi : category.nameEn}
                  </span>
                  {!category.isActive && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      {locale === 'vi' ? 'Không hoạt động' : 'Inactive'}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {category._count?.products || 0}{' '}
                  {locale === 'vi' ? 'sản phẩm' : 'products'}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Link
                href={`/${locale}/admin/categories/${category.id}/edit`}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-900"
              >
                {locale === 'vi' ? 'Sửa' : 'Edit'}
              </Link>
              <button
                onClick={() => setDeleteConfirm(category.id)}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-900"
              >
                {locale === 'vi' ? 'Xóa' : 'Delete'}
              </button>
            </div>
          </div>

          {hasChildren && isExpanded && renderCategoryTree(category.children!, level + 1)}
        </div>
      );
    });
  };

  return (
    <AdminProtectedRoute locale={locale}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {locale === 'vi' ? 'Quản lý danh mục' : 'Category Management'}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                {locale === 'vi'
                  ? 'Quản lý cấu trúc danh mục sản phẩm'
                  : 'Manage product category structure'}
              </p>
            </div>
            <Link
              href={`/${locale}/admin/categories/new`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <SvgPlus className="w-5 h-5" />
              <span>{locale === 'vi' ? 'Thêm danh mục' : 'Add Category'}</span>
            </Link>
          </div>

          {/* Categories Tree */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">
                  {locale === 'vi' ? 'Đang tải...' : 'Loading...'}
                </p>
              </div>
            ) : categories.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {locale === 'vi' ? 'Chưa có danh mục nào' : 'No categories yet'}
              </div>
            ) : (
              <div>{renderCategoryTree(categories)}</div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <SvgInfo className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  {locale === 'vi'
                    ? 'Bạn có thể tạo danh mục con bằng cách chọn danh mục cha khi tạo danh mục mới.'
                    : 'You can create subcategories by selecting a parent category when creating a new category.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {locale === 'vi' ? 'Xác nhận xóa' : 'Confirm Delete'}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {locale === 'vi'
                  ? 'Bạn có chắc chắn muốn xóa danh mục này? Tất cả danh mục con cũng sẽ bị xóa. Hành động này không thể hoàn tác.'
                  : 'Are you sure you want to delete this category? All subcategories will also be deleted. This action cannot be undone.'}
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  {locale === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  {locale === 'vi' ? 'Xóa' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
