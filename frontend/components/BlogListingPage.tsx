'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import BlogCard from './BlogCard';
import Pagination from './Pagination';
import { getBlogPosts } from '@/lib/blog-api';
import { getBlogCategories } from '@/lib/blog-category-api';

interface BlogPost {
  id: string;
  slug: string;
  titleEn: string;
  titleVi: string;
  excerptEn: string;
  excerptVi: string;
  authorName: string;
  imageUrl: string | null;
  publishedAt: string;
  blogCategories: Array<{
    category: {
      id: string;
      slug: string;
      nameEn: string;
      nameVi: string;
    };
  }>;
}

interface BlogCategory {
  id: string;
  slug: string;
  nameEn: string;
  nameVi: string;
}

export default function BlogListingPage() {
  const locale = useLocale();
  const t = useTranslations('blog');
  const searchParams = useSearchParams();
  const router = useRouter();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const categorySlug = searchParams.get('category') || undefined;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch blog posts
        const postsData = await getBlogPosts(currentPage, 10, categorySlug, locale);
        setPosts(postsData.posts);
        setTotalPages(postsData.totalPages);

        // Fetch categories (only once)
        if (categories.length === 0) {
          const categoriesData = await getBlogCategories(locale);
          setCategories(categoriesData);
        }
      } catch (err) {
        console.error('Error fetching blog data:', err);
        setError(locale === 'vi' ? 'Không thể tải bài viết' : 'Failed to load blog posts');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, categorySlug, locale]);

  const handleCategoryChange = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (slug === '') {
      params.delete('category');
    } else {
      params.set('category', slug);
    }

    // Reset to page 1 when changing category
    params.delete('page');

    router.push(`?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('title')}</h1>

        {/* Category Filter */}
        <div className="flex items-center gap-4">
          <label htmlFor="category-filter" className="text-sm font-medium text-gray-700">
            {t('categories')}:
          </label>
          <select
            id="category-filter"
            value={categorySlug || ''}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">
              {locale === 'vi' ? 'Tất cả danh mục' : 'All categories'}
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {locale === 'vi' ? category.nameVi : category.nameEn}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Blog Posts Grid */}
      {posts.length === 0 ? (
        <div className="text-center py-16">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-xl text-gray-600">{t('noPostsFound')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>

          {/* Pagination */}
          <Pagination currentPage={currentPage} totalPages={totalPages} />
        </>
      )}
    </div>
  );
}
