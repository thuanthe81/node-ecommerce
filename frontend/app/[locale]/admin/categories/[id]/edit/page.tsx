'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import CategoryForm from '@/components/CategoryForm';
import { Category, categoryApi } from '@/lib/category-api';

export default function EditCategoryPage() {
  const params = useParams();
  const locale = params.locale as string;
  const categoryId = params.id as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategory();
  }, [categoryId]);

  const loadCategory = async () => {
    try {
      setLoading(true);
      const data = await categoryApi.getCategory(categoryId);
      setCategory(data);
    } catch (err) {
      console.error('Failed to load category:', err);
      setError(locale === 'vi' ? 'Không thể tải danh mục' : 'Failed to load category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminProtectedRoute locale={locale}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {locale === 'vi' ? 'Chỉnh sửa danh mục' : 'Edit Category'}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {locale === 'vi'
                ? 'Cập nhật thông tin danh mục'
                : 'Update category information'}
            </p>
          </div>

          {loading ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">
                {locale === 'vi' ? 'Đang tải...' : 'Loading...'}
              </p>
            </div>
          ) : error ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <p className="text-red-600">{error}</p>
            </div>
          ) : category ? (
            <CategoryForm locale={locale} category={category} isEdit={true} />
          ) : null}
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
