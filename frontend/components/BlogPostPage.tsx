'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumb from './Breadcrumb';
import BlogCard from './BlogCard';
import { getBlogPost, getRelatedPosts } from '@/lib/blog-api';

interface BlogPost {
  id: string;
  slug: string;
  titleEn: string;
  titleVi: string;
  contentEn: string;
  contentVi: string;
  excerptEn: string;
  excerptVi: string;
  authorName: string;
  imageUrl: string | null;
  publishedAt: string;
  updatedAt: string;
  blogCategories: Array<{
    category: {
      id: string;
      slug: string;
      nameEn: string;
      nameVi: string;
    };
  }>;
}

interface BlogPostPageProps {
  slug: string;
}

export default function BlogPostPage({ slug }: BlogPostPageProps) {
  const locale = useLocale();
  const t = useTranslations('blog');
  const router = useRouter();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch blog post
        const postData = await getBlogPost(slug, locale);
        setPost(postData);

        // Fetch related posts
        const relatedData = await getRelatedPosts(postData.id, locale);
        setRelatedPosts(relatedData);
      } catch (err: any) {
        console.error('Error fetching blog post:', err);

        // Handle 404
        if (err.message?.includes('404') || err.message?.includes('not found')) {
          router.push(`/${locale}/404`);
        } else {
          setError(locale === 'vi' ? 'Không thể tải bài viết' : 'Failed to load blog post');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, locale, router]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error || t('noPostsFound')}</p>
        </div>
      </div>
    );
  }

  const title = locale === 'vi' ? post.titleVi : post.titleEn;
  const content = locale === 'vi' ? post.contentVi : post.contentEn;
  const imageUrl = post.imageUrl || '/placeholder-product.png';

  // Format publication date
  const publishedDate = new Date(post.publishedAt);
  const formattedDate = new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(publishedDate);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: t('title'), href: `/${locale}/blog` },
          { label: title },
        ]}
      />

      {/* Article */}
      <article className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {title}
          </h1>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-6">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>
                {t('author')}: <strong>{post.authorName}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <time dateTime={post.publishedAt}>
                {t('publishedOn')}: {formattedDate}
              </time>
            </div>
          </div>

          {/* Category Tags */}
          {post.blogCategories && post.blogCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.blogCategories.map(({ category }) => (
                <Link
                  key={category.id}
                  href={`/${locale}/blog?category=${category.slug}`}
                  className="inline-block px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
                >
                  {locale === 'vi' ? category.nameVi : category.nameEn}
                </Link>
              ))}
            </div>
          )}
        </header>

        {/* Featured Image */}
        <div className="relative aspect-[16/9] mb-8 rounded-lg overflow-hidden bg-gray-100">
          <Image
            src={imageUrl}
            alt={title}
            fill
            style={{ opacity: 1 }}
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 1024px"
            priority
            unoptimized
          />
        </div>

        {/* Content */}
        <div
          className="prose prose-lg max-w-none mb-12"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {/* Back to Blog Link */}
        <div className="border-t border-gray-200 pt-8 mb-12">
          <Link
            href={`/${locale}/blog`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            {t('backToList')}
          </Link>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="border-t border-gray-200 pt-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              {t('relatedPosts')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedPosts.map((relatedPost) => (
                <BlogCard key={relatedPost.id} post={relatedPost} />
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}