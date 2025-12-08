import { Metadata } from 'next';
import BlogPostPage from './BlogPostPage';
import StructuredData from './StructuredData';
import { generateSEOMetadata, generateBlogPostSchema } from '@/lib/seo';
import { getBlogPost } from '@/lib/blog-api';

interface BlogPostPageWithSEOProps {
  slug: string;
  locale: string;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function generateBlogPostMetadata(
  slug: string,
  locale: string
): Promise<Metadata> {
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

export async function BlogPostPageWithSEO({ slug, locale }: BlogPostPageWithSEOProps) {
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
      datePublished: post.publishedAt || '1970',
      dateModified: post.updatedAt,
      url,
    });
  } catch (error) {
    // No structured data if post not found
  }

  return (
    <>
      {structuredData && <StructuredData data={structuredData} />}
      <BlogPostPage slug={slug} />
    </>
  );
}