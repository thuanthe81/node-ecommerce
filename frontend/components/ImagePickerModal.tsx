'use client';

import { useState, useEffect } from 'react';
import { productApi, Product } from '@/lib/product-api';
import Image from 'next/image';
import { SvgClose } from './Svgs';

interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
  locale: string;
}

export default function ImagePickerModal({
  isOpen,
  onClose,
  onSelectImage,
  locale,
}: ImagePickerModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen]);

  const loadProducts = async (search?: string) => {
    try {
      setLoadingProducts(true);
      const response = await productApi.getProducts({
        limit: 100,
        search: search || undefined,
      });
      setProducts(response.data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSearchProducts = () => {
    loadProducts(searchQuery);
  };

  const handleSelectImage = (imageUrl: string) => {
    onSelectImage(imageUrl);
    setSearchQuery('');
  };

  const handleClose = () => {
    onClose();
    setSearchQuery('');
  };

  if (!isOpen) return null;

  const totalImages = products.reduce((total, product) => total + product.images.length, 0);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {locale === 'vi' ? 'Chọn hình ảnh sản phẩm' : 'Select Product Image'}
            </h3>
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <SvgClose className="h-6 w-6" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchProducts();
                  }
                }}
                placeholder={
                  locale === 'vi'
                    ? 'Tìm kiếm sản phẩm theo tên hoặc SKU...'
                    : 'Search products by name or SKU...'
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    loadProducts();
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <SvgClose className="h-5 w-5" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleSearchProducts}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {locale === 'vi' ? 'Tìm kiếm' : 'Search'}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loadingProducts ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">
                  {locale === 'vi' ? 'Đang tải sản phẩm...' : 'Loading products...'}
                </p>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchQuery
                  ? locale === 'vi'
                    ? 'Không tìm thấy sản phẩm phù hợp'
                    : 'No products found matching your search'
                  : locale === 'vi'
                  ? 'Không có sản phẩm nào'
                  : 'No products available'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.flatMap((product) =>
                product.images.map((image) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => handleSelectImage(image.url)}
                    className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-all group"
                  >
                    <img
                      src={image.url}
                      alt={image.altTextEn || product.nameEn}
                      className="w-full h-full object-cover"
                      // style={{opacity: 1}}
                      // priority={false}
                    />
                    {/*<div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all" />*/}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {totalImages} {totalImages === 1
                ? locale === 'vi' ? 'hình ảnh' : 'image'
                : locale === 'vi' ? 'hình ảnh' : 'images'}{' '}
              {locale === 'vi' ? 'có sẵn' : 'available'}
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white transition-colors"
            >
              {locale === 'vi' ? 'Đóng' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}