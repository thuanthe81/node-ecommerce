'use client';

import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumb from './Breadcrumb';
import BlogCard from './BlogCard';
import { BlogPost } from '@/lib/blog-api';
import { SvgUser, SvgCalendar, SvgChevronLeft } from './Svgs';

interface BlogPostPageProps {
  slug: string;
  post: BlogPost;
  relatedPosts: BlogPost[];
}

export default function BlogPostPage({ slug, post, relatedPosts }: BlogPostPageProps) {
  const locale = useLocale();
  const t = useTranslations('blog');

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{t('noPostsFound')}</p>
        </div>
      </div>
    );
  }

  const title = locale === 'vi' ? post.titleVi : post.titleEn;
  const content = locale === 'vi' ? post.contentVi : post.contentEn;
  const imageUrl = post.imageUrl || '/placeholder-product.png';

  // Format publication date
  const publishedDate = new Date(post.publishedAt || '1970');
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
              <SvgUser
                className="w-5 h-5"
                aria-hidden="true"
              />
              <span>
                {t('author')}: <strong>{post.authorName}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <SvgCalendar
                className="w-5 h-5"
                aria-hidden="true"
              />
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
            <SvgChevronLeft
              className="w-5 h-5 mr-2"
              aria-hidden="true"
            />
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