'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import { productApi, Product, ProductQueryParams } from '@/lib/product-api';
import { SvgPlus, SvgChevronLeftSolid, SvgChevronRightSolid } from '@/components/Svgs';

export default function AdminProductsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ProductQueryParams>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [totalPages, setTotalPages] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, [filters]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productApi.getProducts(filters);
      setProducts(response.data);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, search: searchQuery, page: 1 });
  };

  const handleDelete = async (id: string) => {
    try {
      await productApi.deleteProduct(id);
      setDeleteConfirm(null);
      loadProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert(locale === 'vi' ? 'Không thể xóa sản phẩm' : 'Failed to delete product');
    }
  };

  const handleFilterChange = (key: keyof ProductQueryParams, value: any) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  return (
    <AdminProtectedRoute locale={locale}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {locale === 'vi' ? 'Quản lý sản phẩm' : 'Product Management'}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                {locale === 'vi'
                  ? 'Quản lý tất cả sản phẩm trong cửa hàng'
                  : 'Manage all products in your store'}
              </p>
            </div>
            <Link
              href={`/${locale}/admin/products/new`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <SvgPlus className="w-5 h-5" />
              <span>{locale === 'vi' ? 'Thêm sản phẩm' : 'Add Product'}</span>
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="bg-white shadow rounded-lg p-4">
            <form onSubmit={handleSearch} className="flex gap-4 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={locale === 'vi' ? 'Tìm kiếm sản phẩm...' : 'Search products...'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {locale === 'vi' ? 'Tìm kiếm' : 'Search'}
              </button>
            </form>

            <div className="flex gap-4 flex-wrap">
              <select
                value={filters.sortBy || 'createdAt'}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="createdAt">{locale === 'vi' ? 'Ngày tạo' : 'Date Created'}</option>
                <option value="name">{locale === 'vi' ? 'Tên' : 'Name'}</option>
                <option value="price">{locale === 'vi' ? 'Giá' : 'Price'}</option>
              </select>

              <select
                value={filters.sortOrder || 'desc'}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="desc">{locale === 'vi' ? 'Giảm dần' : 'Descending'}</option>
                <option value="asc">{locale === 'vi' ? 'Tăng dần' : 'Ascending'}</option>
              </select>

              <select
                value={filters.inStock === undefined ? 'all' : filters.inStock ? 'true' : 'false'}
                onChange={(e) =>
                  handleFilterChange(
                    'inStock',
                    e.target.value === 'all' ? undefined : e.target.value === 'true'
                  )
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">{locale === 'vi' ? 'Tất cả' : 'All Stock'}</option>
                <option value="true">{locale === 'vi' ? 'Còn hàng' : 'In Stock'}</option>
                <option value="false">{locale === 'vi' ? 'Hết hàng' : 'Out of Stock'}</option>
              </select>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">
                  {locale === 'vi' ? 'Đang tải...' : 'Loading...'}
                </p>
              </div>
            ) : products.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {locale === 'vi' ? 'Không tìm thấy sản phẩm' : 'No products found'}
              </div>
            ) : (
              <>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {locale === 'vi' ? 'Sản phẩm' : 'Product'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {locale === 'vi' ? 'Giá' : 'Price'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {locale === 'vi' ? 'Tồn kho' : 'Stock'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {locale === 'vi' ? 'Trạng thái' : 'Status'}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {locale === 'vi' ? 'Thao tác' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {product.images[0] && (
                              <img
                                src={product.images[0].url}
                                alt={locale === 'vi' ? product.nameVi : product.nameEn}
                                className="h-10 w-10 rounded object-cover"
                              />
                            )}
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {locale === 'vi' ? product.nameVi : product.nameEn}
                              </div>
                              <div className="text-sm text-gray-500">
                                {product.category[locale === 'vi' ? 'nameVi' : 'nameEn']}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${product.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-sm ${
                              product.stockQuantity === 0
                                ? 'text-red-600'
                                : product.stockQuantity < 10
                                ? 'text-yellow-600'
                                : 'text-green-600'
                            }`}
                          >
                            {product.stockQuantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              product.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {product.isActive
                              ? locale === 'vi'
                                ? 'Hoạt động'
                                : 'Active'
                              : locale === 'vi'
                              ? 'Không hoạt động'
                              : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/${locale}/admin/products/${product.id}/edit`}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            {locale === 'vi' ? 'Sửa' : 'Edit'}
                          </Link>
                          <button
                            onClick={() => setDeleteConfirm(product.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            {locale === 'vi' ? 'Xóa' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                        disabled={filters.page === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        {locale === 'vi' ? 'Trước' : 'Previous'}
                      </button>
                      <button
                        onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                        disabled={filters.page === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        {locale === 'vi' ? 'Sau' : 'Next'}
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          {locale === 'vi' ? 'Trang' : 'Page'} {filters.page} {locale === 'vi' ? 'của' : 'of'}{' '}
                          {totalPages}
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                            disabled={filters.page === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            <span className="sr-only">{locale === 'vi' ? 'Trước' : 'Previous'}</span>
                            <SvgChevronLeftSolid className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                            disabled={filters.page === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            <span className="sr-only">{locale === 'vi' ? 'Sau' : 'Next'}</span>
                            <SvgChevronRightSolid className="h-5 w-5" />
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
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
                  ? 'Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác.'
                  : 'Are you sure you want to delete this product? This action cannot be undone.'}
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
