'use client';

import { useState, useEffect } from 'react';
import { productApi, Product } from '@/lib/product-api';
import { contentMediaApi, ContentMedia } from '@/lib/content-media-api';
import Image from 'next/image';
import { SvgClose } from './Svgs';
import { Portal } from '@/components/Portal';

interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string, source?: Product | ContentMedia) => void;
  locale: string;
}

interface TabConfig {
  id: 'products' | 'media';
  label: string;
  count: number;
}

interface ImageSource {
  id: string;
  url: string;
  altText?: string;
  title?: string;
  type: 'product' | 'media';
  source?: Product | ContentMedia;
}

export default function ImagePickerModal({
  isOpen,
  onClose,
  onSelectImage,
  locale,
}: ImagePickerModalProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'media'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [mediaItems, setMediaItems] = useState<ContentMedia[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'products') {
        loadProducts();
      } else {
        loadMediaItems();
      }
    }
  }, [isOpen, activeTab]);

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

  const loadMediaItems = async (search?: string) => {
    try {
      setLoadingMedia(true);
      const response = await contentMediaApi.getAll(search, 1, 100);
      setMediaItems(response.items);
    } catch (err) {
      console.error('Failed to load media items:', err);
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleSearch = () => {
    if (activeTab === 'products') {
      loadProducts(searchQuery);
    } else {
      loadMediaItems(searchQuery);
    }
  };

  const handleTabSwitch = (tabId: 'products' | 'media') => {
    setActiveTab(tabId);
    // Search query is preserved across tabs
  };

  const handleSelectImage = (imageUrl: string, source?: Product | ContentMedia) => {
    onSelectImage(imageUrl, source);
    setSearchQuery('');
  };

  const handleClose = () => {
    onClose();
    setSearchQuery('');
    setActiveTab('products'); // Reset to default tab
  };

  if (!isOpen) return null;

  const totalProductImages = products.reduce((total, product) => total + product.images.length, 0);
  const totalMediaItems = mediaItems.length;

  const tabs: TabConfig[] = [
    {
      id: 'products',
      label: locale === 'vi' ? 'Sản phẩm' : 'Products',
      count: totalProductImages
    },
    {
      id: 'media',
      label: locale === 'vi' ? 'Thư viện phương tiện' : 'Media Library',
      count: totalMediaItems
    }
  ];

  const isLoading = activeTab === 'products' ? loadingProducts : loadingMedia;
  const hasItems = activeTab === 'products' ? products.length > 0 : mediaItems.length > 0;

  return (
    <Portal>
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {locale === 'vi' ? 'Chọn hình ảnh' : 'Select Image'}
            </h3>
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <SvgClose className="h-6 w-6" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabSwitch(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
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
                    handleSearch();
                  }
                }}
                placeholder={
                  activeTab === 'products'
                    ? locale === 'vi'
                      ? 'Tìm kiếm sản phẩm theo tên hoặc SKU...'
                      : 'Search products by name or SKU...'
                    : locale === 'vi'
                    ? 'Tìm kiếm theo tên tệp...'
                    : 'Search by filename...'
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    if (activeTab === 'products') {
                      loadProducts();
                    } else {
                      loadMediaItems();
                    }
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <SvgClose className="h-5 w-5" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {locale === 'vi' ? 'Tìm kiếm' : 'Search'}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">
                  {activeTab === 'products'
                    ? locale === 'vi' ? 'Đang tải sản phẩm...' : 'Loading products...'
                    : locale === 'vi' ? 'Đang tải phương tiện...' : 'Loading media...'}
                </p>
              </div>
            </div>
          ) : !hasItems ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchQuery
                  ? activeTab === 'products'
                    ? locale === 'vi'
                      ? 'Không tìm thấy sản phẩm phù hợp'
                      : 'No products found matching your search'
                    : locale === 'vi'
                    ? 'Không tìm thấy phương tiện phù hợp'
                    : 'No media found matching your search'
                  : activeTab === 'products'
                  ? locale === 'vi'
                    ? 'Không có sản phẩm nào'
                    : 'No products available'
                  : locale === 'vi'
                  ? 'Không có phương tiện nào'
                  : 'No media available'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {activeTab === 'products'
                ? products.flatMap((product) =>
                    product.images.map((image) => (
                      <button
                        key={image.id}
                        type="button"
                        onClick={() => handleSelectImage(image.url, product)}
                        className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-all group"
                      >
                        <img
                          src={image.url}
                          alt={image.altTextEn || product.nameEn}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))
                  )
                : mediaItems.map((media) => (
                    <button
                      key={media.id}
                      type="button"
                      onClick={() => handleSelectImage(media.url, media)}
                      className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-all group"
                    >
                      <img
                        src={media.url}
                        alt={media.originalName}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {activeTab === 'products' ? totalProductImages : totalMediaItems}{' '}
              {(activeTab === 'products' ? totalProductImages : totalMediaItems) === 1
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
    </Portal>
  );
}