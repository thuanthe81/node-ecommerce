import { Suspense } from 'react';
import { Metadata } from 'next';
import BlogPostPage from '@/components/BlogPostPage';
import StructuredData from '@/components/StructuredData';
import { generateEnhancedSEOMetadata } from '@/lib/seo-enhanced';
import { generateBlogPostSchema, generateBreadcrumbSchema } from '@/lib/structured-data';
import { getBlogPost, getRelatedPosts } from '@/lib/blog-api';
import { notFound } from 'next/navigation';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Configure ISR revalidation for blog posts (30 minutes)
export const revalidate = 1800;

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

    return generateEnhancedSEOMetadata({
      title: `${title} | Blog`,
      description: excerpt.substring(0, 160),
      locale,
      path: `/blog/${slug}`,
      image: imageUrl,
      type: 'article',
    });
  } catch (error) {
    // Return default metadata if post not found
    return generateEnhancedSEOMetadata({
      title: 'Blog Post Not Found',
      description: 'The requested blog post could not be found.',
      locale,
      path: `/blog/${slug}`,
      type: 'article',
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

  let post = null;
  let relatedPosts = [];
  let structuredData = [];

  try {
    // Fetch blog post data server-side
    post = await getBlogPost(slug, locale);

    // Fetch related posts server-side
    relatedPosts = await getRelatedPosts(post.id, locale);

    const title = locale === 'vi' ? post.titleVi : post.titleEn;
    const excerpt = locale === 'vi' ? post.excerptVi : post.excerptEn;
    const imageUrl = post.imageUrl || `${SITE_URL}/og-image.jpg`;
    const localePrefix = locale === 'vi' ? '' : `/${locale}`;
    const url = `${SITE_URL}${localePrefix}/blog/${slug}`;

    // Generate comprehensive structured data
    const blogPostSchema = generateBlogPostSchema({
      title,
      description: excerpt,
      image: imageUrl,
      author: post.authorName,
      datePublished: post.publishedAt || post.createdAt,
      dateModified: post.updatedAt,
      url,
      locale,
      categories: post.blogCategories?.map(({ category }) => ({
        name: locale === 'vi' ? category.nameVi : category.nameEn,
        url: `${SITE_URL}${localePrefix}/blog?category=${category.slug}`
      })) || []
    });

    // Generate breadcrumb structured data
    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: locale === 'vi' ? 'Trang chủ' : 'Home', path: '/' },
      { name: 'Blog', path: '/blog' },
      { name: title, path: `/blog/${slug}` }
    ], locale);

    structuredData = [blogPostSchema, breadcrumbSchema];
  } catch (error) {
    // If post not found, return 404
    notFound();
  }

  return (
    <main>
      {structuredData.map((data, index) => (
        <StructuredData key={index} data={data} />
      ))}
      <Suspense fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      }>
        <BlogPostPage slug={slug} post={post} relatedPosts={relatedPosts} />
      </Suspense>
    </main>
  );
}
