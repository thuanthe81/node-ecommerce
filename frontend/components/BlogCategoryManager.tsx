'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { blogCategoryApi } from '@/lib/blog-category-api';

interface BlogCategory {
  id: string;
  slug: string;
  nameEn: string;
  nameVi: string;
  _count?: {
    posts: number;
  };
}

interface BlogCategoryManagerProps {
  locale: string;
  token: string;
}

/**
 * Component for managing blog categories
 * Displays table of categories with inline editing and deletion
 */
export default function BlogCategoryManager({ locale, token }: BlogCategoryManagerProps) {
  const t = useTranslations('admin.blogCategories');
  const tCommon = useTranslations('common');

  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nameEn: '', nameVi: '', slug: '' });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ nameEn: '', nameVi: '', slug: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load categories
  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await blogCategoryApi.getBlogCategories(locale);
      setCategories(data);
    } catch (err: any) {
      setError(err.message || t('loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [locale]);

  // Start editing a category
  const handleEdit = (category: BlogCategory) => {
    setEditingId(category.id);
    setEditForm({
      nameEn: category.nameEn,
      nameVi: category.nameVi,
      slug: category.slug,
    });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ nameEn: '', nameVi: '', slug: '' });
  };

  // Save edited category
  const handleSaveEdit = async (id: string) => {
    if (!editForm.nameEn.trim() || !editForm.nameVi.trim() || !editForm.slug.trim()) {
      setError(t('allFieldsRequired'));
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await blogCategoryApi.updateBlogCategory(id, editForm);
      await loadCategories();
      setEditingId(null);
      setEditForm({ nameEn: '', nameVi: '', slug: '' });
    } catch (err: any) {
      setError(err.message || t('updateError'));
    } finally {
      setSubmitting(false);
    }
  };

  // Create new category
  const handleCreate = async () => {
    if (!createForm.nameEn.trim() || !createForm.nameVi.trim() || !createForm.slug.trim()) {
      setError(t('allFieldsRequired'));
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await blogCategoryApi.createBlogCategory(createForm);
      await loadCategories();
      setShowCreateForm(false);
      setCreateForm({ nameEn: '', nameVi: '', slug: '' });
    } catch (err: any) {
      setError(err.message || t('createError'));
    } finally {
      setSubmitting(false);
    }
  };

  // Delete category
  const handleDelete = async (id: string) => {
    try {
      setSubmitting(true);
      setError(null);
      await blogCategoryApi.deleteBlogCategory(id);
      await loadCategories();
      setDeleteConfirm(null);
    } catch (err: any) {
      setError(err.message || t('deleteError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="ml-3 text-gray-600">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{t('manageCategories')}</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showCreateForm ? tCommon('cancel') : t('createCategory')}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">{t('createCategory')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('nameEn')} *
              </label>
              <input
                type="text"
                value={createForm.nameEn}
                onChange={(e) => setCreateForm({ ...createForm, nameEn: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Category Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('nameVi')} *
              </label>
              <input
                type="text"
                value={createForm.nameVi}
                onChange={(e) => setCreateForm({ ...createForm, nameVi: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Tên danh mục"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('slug')} *
              </label>
              <input
                type="text"
                value={createForm.slug}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="category-slug"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowCreateForm(false);
                setCreateForm({ nameEn: '', nameVi: '', slug: '' });
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              {tCommon('cancel')}
            </button>
            <button
              onClick={handleCreate}
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {submitting ? t('creating') : t('create')}
            </button>
          </div>
        </div>
      )}

      {/* Categories Table */}
      {categories.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">{t('noCategories')}</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('nameEn')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('nameVi')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('slug')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('postCount')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {tCommon('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category.id}>
                  {editingId === category.id ? (
                    <>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editForm.nameEn}
                          onChange={(e) => setEditForm({ ...editForm, nameEn: e.target.value })}
                          className="w-full border border-gray-300 rounded px-2 py-1"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editForm.nameVi}
                          onChange={(e) => setEditForm({ ...editForm, nameVi: e.target.value })}
                          className="w-full border border-gray-300 rounded px-2 py-1"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editForm.slug}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                            })
                          }
                          className="w-full border border-gray-300 rounded px-2 py-1"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {category._count?.posts || 0}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleSaveEdit(category.id)}
                          disabled={submitting}
                          className="text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                        >
                          {tCommon('save')}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          {tCommon('cancel')}
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 text-sm text-gray-900">{category.nameEn}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{category.nameVi}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{category.slug}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {category._count?.posts || 0}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {tCommon('edit')}
                        </button>
                        {deleteConfirm === category.id ? (
                          <>
                            <button
                              onClick={() => handleDelete(category.id)}
                              disabled={submitting}
                              className="text-red-600 hover:text-red-800 disabled:text-gray-400"
                            >
                              {t('confirmDelete')}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              {tCommon('cancel')}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(category.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            {tCommon('delete')}
                          </button>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
