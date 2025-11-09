'use client';

import { useParams } from 'next/navigation';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import ProductForm from '@/components/ProductForm';

export default function NewProductPage() {
  const params = useParams();
  const locale = params.locale as string;

  return (
    <AdminProtectedRoute locale={locale}>
      <AdminLayout locale={locale}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {locale === 'vi' ? 'Thêm sản phẩm mới' : 'Add New Product'}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {locale === 'vi'
                ? 'Tạo một sản phẩm mới cho cửa hàng của bạn'
                : 'Create a new product for your store'}
            </p>
          </div>

          <ProductForm locale={locale} />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
