'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import ProductForm from '@/components/ProductForm';
import { Product, productApi } from '@/lib/product-api';

export default function EditProductPage() {
  const params = useParams();
  const locale = params.locale as string;
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      // We need to fetch by ID, but the API uses slug. Let's assume we can get by ID
      // For now, we'll need to modify this based on actual API
      const foundProduct = await productApi.getProductById(productId);

      if (foundProduct) {
        setProduct(foundProduct);
      } else {
        setError(locale === 'vi' ? 'Không tìm thấy sản phẩm' : 'Product not found');
      }
    } catch (err) {
      console.error('Failed to load product:', err);
      setError(locale === 'vi' ? 'Không thể tải sản phẩm' : 'Failed to load product');
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
              {locale === 'vi' ? 'Chỉnh sửa sản phẩm' : 'Edit Product'}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {locale === 'vi'
                ? 'Cập nhật thông tin sản phẩm'
                : 'Update product information'}
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
          ) : product ? (
            <ProductForm locale={locale} product={product} isEdit={true} />
          ) : null}
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}