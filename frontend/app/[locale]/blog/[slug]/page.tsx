import { Suspense } from 'react';
import { Metadata } from 'next';
import BlogPostPage from '@/components/BlogPostPage';
import StructuredData from '@/components/StructuredData';
import { generateSEOMetadata, generateBlogPostSchema } from '@/lib/seo';
import { getBlogPost } from '@/lib/blog-api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;

  try {
    const post = await getBlogPost(slug, locale);

    const title = locale === 'vi' ? post.titleVi : post.titleEn;
    const excerpt = locale === 'vi' ? post.excerptVi : post.excerptEn;
    const imageUrl = post.imageUrl || `${SITE_URL}/og-image.jpg`;

    return generateSEOMetadata({
      title: `${title} | Blog`,
      description: excerpt.substring(0, 160),
      locale,
      path: `/blog/${slug}`,
      image: imageUrl,
      type: 'article',
    });
  } catch (error) {
    // Return default metadata if post not found
    return generateSEOMetadata({
      title: 'Blog Post Not Found',
      description: 'The requested blog post could not be found.',
      locale,
      path: `/blog/${slug}`,
      noindex: true,
    });
  }
}

export default async function BlogPostDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  let structuredData = null;

  try {
    const post = await getBlogPost(slug, locale);

    const title = locale === 'vi' ? post.titleVi : post.titleEn;
    const excerpt = locale === 'vi' ? post.excerptVi : post.excerptEn;
    const imageUrl = post.imageUrl || `${SITE_URL}/og-image.jpg`;
    const localePrefix = locale === 'vi' ? '' : `/${locale}`;
    const url = `${SITE_URL}${localePrefix}/blog/${slug}`;

    structuredData = generateBlogPostSchema({
      title,
      description: excerpt,
      image: imageUrl,
      author: post.authorName,
      datePublished: post.publishedAt || post.createdAt,
      dateModified: post.updatedAt,
      url,
    });
  } catch (error) {
    // No structured data if post not found
  }

  return (
    <main>
      {structuredData && <StructuredData data={structuredData} />}
      <Suspense fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      }>
        <BlogPostPage slug={slug} />
      </Suspense>
    </main>
  );
}
