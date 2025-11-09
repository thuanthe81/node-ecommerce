'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { contentApi, Content } from '@/lib/content-api';

export default function BannerListContent({ locale }: { locale: string }) {
  const [banners, setBanners] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const data = await contentApi.getAll('BANNER');
      setBanners(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete banner "${title}"?`)) {
      return;
    }

    try {
      await contentApi.delete(id);
      setBanners(banners.filter(b => b.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete banner');
    }
  };

  return (
    <AdminLayout locale={locale}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Promotional Banners</h1>
          <Link
            href={`/${locale}/admin/banners/new`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Banner
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Loading banners...</p>
          </div>
        ) : banners.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">No banners found</p>
            <Link
              href={`/${locale}/admin/banners/new`}
              className="mt-4 inline-block text-blue-600 hover:text-blue-700"
            >
              Create your first banner
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((banner) => (
              <div key={banner.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {banner.imageUrl && (
                  <img
                    src={banner.imageUrl}
                    alt={banner.titleEn}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {banner.titleEn}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        banner.isPublished
                          ? 'bg-green-200 text-green-800'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {banner.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{banner.titleVi}</p>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {banner.contentEn}
                  </p>
                  <div className="text-xs text-gray-500 mb-4">
                    Order: {banner.displayOrder}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/${locale}/admin/banners/${banner.id}/edit`}
                      className="flex-1 text-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(banner.id, banner.titleEn)}
                      className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
