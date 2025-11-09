'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import BannerForm from '@/components/BannerForm';
import { contentApi, Content, CreateContentData } from '@/lib/content-api';

export default function EditBannerContent({ 
  locale, 
  bannerId 
}: { 
  locale: string; 
  bannerId: string;
}) {
  const [banner, setBanner] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBanner();
  }, [bannerId]);

  const loadBanner = async () => {
    try {
      setLoading(true);
      const data = await contentApi.getById(bannerId);
      setBanner(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load banner');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: CreateContentData) => {
    await contentApi.update(bannerId, data);
  };

  if (loading) {
    return (
      <AdminLayout locale={locale}>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Loading banner...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error || !banner) {
    return (
      <AdminLayout locale={locale}>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Banner not found'}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout locale={locale}>
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Banner</h1>
        <div className="bg-white shadow-md rounded-lg p-6">
          <BannerForm 
            banner={banner} 
            onSubmit={handleSubmit} 
            locale={locale} 
          />
        </div>
      </div>
    </AdminLayout>
  );
}
