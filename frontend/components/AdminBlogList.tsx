'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { blogApi, BlogPost } from '@/lib/blog-api';
import { blogCategoryApi } from '@/lib/blog-category-api';
import Pagination from './Pagination';

interface BlogCategory {
  id: string;
  slug: string;
  nameEn: string;
  nameVi: string;
}

interface AdminBlogListProps {
  locale: string;
  token: string;
}

/**
 * Admin component for managing blog posts
 * Displays table with filtering, search, and quick actions
 */
export default function AdminBlogList({ locale, token }: AdminBlogListProps) {
  const t = useTranslations('admin.blog');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const postsPerPage = 10;

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await blogCategoryApi.getBlogCategories(locale);
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };

    loadCategories();
  }, [locale]);

  // Load posts
  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      // For admin, we want to see all posts (published and drafts)
      const response = await blogApi.getBlogPosts(
        currentPage,
        postsPerPage,
        categoryFilter || undefined,
        locale
      );

      let filteredPosts = response.posts;

      // Apply status filter
      if (statusFilter === 'published') {
        filteredPosts = filteredPosts.filter((post: BlogPost) => post.isPublished);
      } else if (statusFilter === 'draft') {
        filteredPosts = filteredPosts.filter((post: BlogPost) => !post.isPublished);
      }

      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredPosts = filteredPosts.filter(
          (post: BlogPost) =>
            post.titleEn.toLowerCase().includes(query) ||
            post.titleVi.toLowerCase().includes(query)
        );
      }

      setPosts(filteredPosts);
      setTotalPages(Math.ceil(response.total / postsPerPage));
    } catch (err: any) {
      setError(err.message || t('loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [currentPage, statusFilter, categoryFilter, locale]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        loadPosts();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Toggle publish status
  const handleTogglePublish = async (post: BlogPost) => {
    try {
      setToggling(post.id);
      setError(null);

      await blogApi.updateBlogPost(
        post.id,
        {
          ...post,
          isPublished: !post.isPublished,
          categoryIds: post.blogCategories?.map((bc) => bc.category.id) || [],
        }
      );

      await loadPosts();
    } catch (err: any) {
      setError(err.message || t('toggleError'));
    } finally {
      setToggling(null);
    }
  };

  // Delete post
  const handleDelete = async (id: string) => {
    try {
      setError(null);
      await blogApi.deleteBlogPost(id);
      await loadPosts();
      setDeleteConfirm(null);
    } catch (err: any) {
      setError(err.message || t('deleteError'));
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && posts.length === 0) {
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
        <h2 className="text-2xl font-bold text-gray-900">{t('managePosts')}</h2>
        <Link
          href={`/${locale}/admin/blog/new`}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {t('createPost')}
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('searchByTitle')}
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('filterByStatus')}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'all' | 'published' | 'draft');
                setCurrentPage(1);
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">{t('allPosts')}</option>
              <option value="published">{t('published')}</option>
              <option value="draft">{t('draft')}</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('filterByCategory')}
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">{t('allCategories')}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {locale === 'vi' ? category.nameVi : category.nameEn}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Posts Table */}
      {posts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">{t('noPosts')}</p>
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('title')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('author')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('categories')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('publishedDate')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {tCommon('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {locale === 'vi' ? post.titleVi : post.titleEn}
                      </div>
                      <div className="text-sm text-gray-500">{post.slug}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{post.authorName}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          post.isPublished
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {post.isPublished ? t('published') : t('draft')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {post.blogCategories && post.blogCategories.length > 0
                        ? post.blogCategories
                            .map((bc) => (locale === 'vi' ? bc.category.nameVi : bc.category.nameEn))
                            .join(', ')
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(post.publishedAt || null)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm space-x-2">
                      <button
                        onClick={() => handleTogglePublish(post)}
                        disabled={toggling === post.id}
                        className="text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                      >
                        {post.isPublished ? t('unpublish') : t('publish')}
                      </button>
                      <Link
                        href={`/${locale}/admin/blog/${post.id}/edit`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {tCommon('edit')}
                      </Link>
                      {deleteConfirm === post.id ? (
                        <>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="text-red-600 hover:text-red-800"
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
                          onClick={() => setDeleteConfirm(post.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          {tCommon('delete')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </div>
  );
}
