'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getContents, deleteContent, getContentTypes, Content } from '@/lib/content-api';

export default function ContentListContent() {
  const router = useRouter();
  const t = useTranslations();
  const [contents, setContents] = useState<Content[]>([]);
  const [contentTypes, setContentTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadContentTypes();
  }, []);

  useEffect(() => {
    loadContents();
  }, [filterType]);

  const loadContentTypes = async () => {
    try {
      const types = await getContentTypes();
      setContentTypes(types);
    } catch (err: any) {
      console.error('Failed to load content types:', err);
      // Don't set error state, just log it - we can still show contents
    }
  };

  const loadContents = async () => {
    try {
      setLoading(true);
      const type = filterType === 'all' ? undefined : filterType;
      const data = await getContents(type as any);
      setContents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load contents');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(t('admin.confirmDelete', { title }))) {
      return;
    }

    try {
      await deleteContent(id);
      await loadContents();
    } catch (err: any) {
      alert(err.message || t('admin.failedDeleteContent'));
    }
  };

  const getTypeLabel = (type: string) => {
    // Convert enum values to readable labels
    return type
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">{t('admin.loadingContents')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('admin.contentManagement')}</h1>
        <Link
          href="/admin/content/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {t('admin.createNewContent')}
        </Link>
      </div>

      <div className="mb-4">
        <label className="mr-2 font-medium">{t('admin.filterByType')}</label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        >
          <option value="all">{t('admin.allTypes')}</option>
          {contentTypes.map((type) => (
            <option key={type} value={type}>
              {getTypeLabel(type)}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.title')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.slug')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.type')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.status')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.updated')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  {t('admin.noContentFound')}
                </td>
              </tr>
            ) : (
              contents.map((content) => (
                <tr key={content.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {content.titleEn}
                    </div>
                    <div className="text-sm text-gray-500">{content.titleVi}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {content.slug}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {getTypeLabel(content.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        content.isPublished
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {content.isPublished ? t('admin.published') : t('admin.draft')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(content.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/admin/content/${content.id}/edit`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      {t('admin.edit')}
                    </Link>
                    <button
                      onClick={() => handleDelete(content.id, content.titleEn)}
                      className="text-red-600 hover:text-red-900"
                    >
                      {t('common.delete')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
