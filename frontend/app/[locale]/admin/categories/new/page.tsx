'use client';

import { useParams } from 'next/navigation';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import CategoryForm from '@/components/CategoryForm';

export default function NewCategoryPage() {
  const params = useParams();
  const locale = params.locale as string;

  return (
    <AdminProtectedRoute locale={locale}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {locale === 'vi' ? 'Thêm danh mục mới' : 'Add New Category'}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {locale === 'vi'
                ? 'Tạo một danh mục mới cho sản phẩm'
                : 'Create a new category for products'}
            </p>
          </div>

          <CategoryForm locale={locale} />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
