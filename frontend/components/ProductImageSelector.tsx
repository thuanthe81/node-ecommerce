'use client';

import { useState, useEffect } from 'react';
import { adminCategoryApi, ProductImage } from '@/lib/admin-category-api';

interface ProductImageSelectorProps {
  selectedImageUrl: string | null;
  onImageSelect: (imageUrl: string) => void;
  onImageClear: () => void;
  locale: string;
}

export default function ProductImageSelector({
  selectedImageUrl,
  onImageSelect,
  onImageClear,
  locale,
}: ProductImageSelectorProps) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProductImages();
  }, []);

  const loadProductImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminCategoryApi.getProductImages();
      setImages(data);
    } catch (err) {
      console.error('Failed to load product images:', err);
      setError(
        locale === 'vi'
          ? 'Không thể tải hình ảnh sản phẩm. Vui lòng thử lại.'
          : 'Unable to load product images. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    loadProductImages();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          {locale === 'vi' ? 'Chọn hình ảnh từ sản phẩm' : 'Select from Product Images'}
        </h3>
        {selectedImageUrl && (
          <button
            type="button"
            onClick={onImageClear}
            className="text-sm text-red-600 hover:text-red-700"
          >
            {locale === 'vi' ? 'Xóa hình ảnh' : 'Clear Image'}
          </button>
        )}
      </div>

      {loading && (
        <div className="text-center py-8 text-gray-500">
          {locale === 'vi' ? 'Đang tải...' : 'Loading...'}
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-red-600 mb-2">{error}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {locale === 'vi' ? 'Thử lại' : 'Retry'}
          </button>
        </div>
      )}

      {!loading && !error && images.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-4 text-sm text-gray-600">
            {locale === 'vi'
              ? 'Không có hình ảnh sản phẩm nào. Vui lòng thêm hình ảnh vào sản phẩm trước.'
              : 'No product images available. Please add images to products first.'}
          </p>
        </div>
      )}

      {!loading && !error && images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                selectedImageUrl === image.url
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onImageSelect(image.url)}
            >
              <div className="aspect-square relative">
                <img
                  src={image.url}
                  alt={locale === 'vi' ? image.altTextVi || image.productNameVi : image.altTextEn || image.productNameEn}
                  className="w-full h-full object-cover"
                />
                {selectedImageUrl === image.url && (
                  <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-2 bg-white">
                <p className="text-xs text-gray-700 truncate">
                  {locale === 'vi' ? image.productNameVi : image.productNameEn}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
