'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { SvgChevronRight } from './Svgs';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  const locale = useLocale();
  const t = useTranslations('common');

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
      <Link
        href={`/${locale}`}
        className="hover:text-blue-600 transition-colors"
      >
        {t('home')}
      </Link>

      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <SvgChevronRight className="w-4 h-4 text-gray-400" />

          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-blue-600 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
