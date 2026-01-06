'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { BlogPost } from '@/lib/blog-api';
import { SvgUser, SvgCalendar, SvgChevronRight } from './Svgs';

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  const locale = useLocale();
  const t = useTranslations('blog');

  const title = locale === 'vi' ? post.titleVi : post.titleEn;
  const excerpt = locale === 'vi' ? post.excerptVi : post.excerptEn;
  const imageUrl = post.imageUrl || '/placeholder-product.png';

  // Format publication date
  const publishedDate = post.publishedAt ? new Date(post.publishedAt) : new Date();
  const formattedDate = new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(publishedDate);

  return (
    <article className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <Link
        href={`/${locale}/blog/${post.slug}`}
        className="block touch-manipulation"
        aria-label={`${t('readMore')}: ${title}`}
      >
        {/* Featured Image */}
        <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
          <Image
            src={imageUrl}
            alt={title}
            fill
            style={{opacity: 1}}
            className="object-cover object-center group-hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized
          />
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Category Tags */}
          {post.blogCategories && post.blogCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {post.blogCategories.map(({ category }) => (
                <span
                  key={category.id}
                  className="inline-block px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full"
                >
                  {locale === 'vi' ? category.nameVi : category.nameEn}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h3 className="text-xl font-semibold text-gray-900 line-clamp-2 mb-3 group-hover:text-blue-600 transition-colors">
            {title}
          </h3>

          {/* Excerpt */}
          <p className="text-gray-600 line-clamp-3 mb-4">
            {excerpt}
          </p>

          {/* Meta Information */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <SvgUser className="w-4 h-4" aria-hidden="true" />
                <span>{post.authorName}</span>
              </span>
              <span className="flex items-center gap-1">
                <SvgCalendar className="w-4 h-4" aria-hidden="true" />
                <time dateTime={post.publishedAt || ''}>{formattedDate}</time>
              </span>
            </div>
          </div>

          {/* Read More Link */}
          <div className="mt-4">
            <span className="inline-flex items-center text-blue-600 font-medium group-hover:text-blue-700">
              {t('readMore')}
              <SvgChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}