'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import BlogCard from './BlogCard';
import Pagination from './Pagination';
import { getBlogPosts, BlogPost } from '@/lib/blog-api';
import { BlogCategory } from '@/lib/blog-category-api';
import { SvgDocument } from '@/components/Svgs';

interface BlogListingPageProps {
  initialPosts?: BlogPost[];
  initialCategories?: BlogCategory[];
  initialTotalPages?: number;
  initialCurrentPage?: number;
  initialCategorySlug?: string;
}

export default function BlogListingPage({
  initialPosts = [],
  initialCategories = [],
  initialTotalPages = 1,
  initialCurrentPage = 1,
  initialCategorySlug,
}: BlogListingPageProps) {
  const locale = useLocale();
  const t = useTranslations('blog');
  const searchParams = useSearchParams();
  const router = useRouter();

  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [categories] = useState<BlogCategory[]>(initialCategories);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(initialTotalPages);

  const currentPage = parseInt(searchParams.get('page') || initialCurrentPage.toString(), 10);
  const categorySlug = searchParams.get('category') || initialCategorySlug || undefined;

  useEffect(() => {
    // Only fetch data if parameters have changed from initial values
    const needsRefetch =
      currentPage !== initialCurrentPage ||
      categorySlug !== initialCategorySlug;

    if (!needsRefetch) {
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const postsData = await getBlogPosts(currentPage, 10, categorySlug, locale);
        setPosts(postsData.posts);
        setTotalPages(postsData.totalPages);
      } catch (err) {
        console.error('Error fetching blog data:', err);
        setError(locale === 'vi' ? 'Không thể tải bài viết' : 'Failed to load blog posts');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, categorySlug, locale, initialCurrentPage, initialCategorySlug]);

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
          <SvgDocument
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            aria-hidden="true"
          />
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
