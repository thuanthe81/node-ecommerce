import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import BlogListingPage from '@/components/BlogListingPage';
import { generateSEOMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });

  return generateSEOMetadata({
    title: t('title'),
    description: locale === 'vi'
      ? 'Khám phá các bài viết về sản phẩm thủ công, câu chuyện và nghệ thuật'
      : 'Discover articles about handmade products, stories, and craftsmanship',
    locale,
    path: '/blog',
    type: 'website',
  });
}

export default function BlogPage() {
  return (
    <main>
      <Suspense fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      }>
        <BlogListingPage />
      </Suspense>
    </main>
  );
}
