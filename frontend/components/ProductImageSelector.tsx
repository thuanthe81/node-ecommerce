'use client';

import { useState, useEffect } from 'react';
import { adminCategoryApi, ProductImage } from '@/lib/admin-category-api';
import { SvgImagePlaceholderEEE, SvgCheckCircleXXX } from './Svgs';

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
          <SvgImagePlaceholderEEE className="mx-auto h-12 w-12 text-gray-400" />
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
                    <SvgCheckCircleXXX className="w-8 h-8 text-blue-600" />
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