'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function NotFoundPage() {
  const t = useTranslations('notFound');

  return (
    <div className="min-h-[320px] h-[calc(100vh-451px)] flex items-center justify-center bg-zinc-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* 404 Status Code - Large and prominent */}
        <div className="mb-6 sm:mb-8">
          <div className="text-6xl md:text-8xl font-bold text-gray-300" aria-hidden="true">
            {t('statusCode')}
          </div>
        </div>

        {/* Page Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
          {t('title')}
        </h1>

        {/* Description */}
        <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">
          {t('description')}
        </p>

        {/* Home Page Button */}
        <Link
          href="/"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px] min-w-[44px]"
          aria-label={t('goHome')}
        >
          {t('goHome')}
        </Link>
      </div>
    </div>
  );
}