import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import BlogListingPage from '@/components/BlogListingPage';
import { generateEnhancedSEOMetadata } from '@/lib/seo-enhanced';
import { generateBreadcrumbSchema } from '@/lib/structured-data';
import { getBlogPosts } from '@/lib/blog-api';
import { getBlogCategories } from '@/lib/blog-category-api';
import StructuredData from '@/components/StructuredData';
import { Metadata } from 'next';

// Configure ISR revalidation for blog listings (15 minutes)
export const revalidate = 900;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });

  return generateEnhancedSEOMetadata({
    title: t('title'),
    description: locale === 'vi'
      ? 'Khám phá các bài viết về sản phẩm thủ công, câu chuyện và nghệ thuật'
      : 'Discover articles about handmade products, stories, and craftsmanship',
    locale,
    path: '/blog',
    type: 'website',
  });
}

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; category?: string; sort?: string }>;
}) {
  const { locale } = await params;
  const { page = '1', category, sort } = await searchParams;

  const currentPage = parseInt(page, 10);

  // Fetch data server-side with ISR caching
  const [postsData, categories] = await Promise.all([
    getBlogPosts(currentPage, 10, true, category, locale).catch(() => ({
      posts: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
    })),
    getBlogCategories(locale).catch(() => []),
  ]);

  // Generate breadcrumb structured data
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: locale === 'vi' ? 'Trang chủ' : 'Home', path: '/' },
    { name: 'Blog', path: '/blog' }
  ], locale);

  return (
    <main>
      <StructuredData data={breadcrumbSchema} />
      <Suspense fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      }>
        <BlogListingPage
          initialPosts={postsData.posts}
          initialCategories={categories}
          initialTotalPages={postsData.totalPages}
          initialCurrentPage={currentPage}
          initialCategorySlug={category}
        />
      </Suspense>
    </main>
  );
}