import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LogoProps } from '../types';

/**
 * Logo component
 *
 * Displays the site logo/brand name as a clickable link to the home page.
 *
 * @param props - Component props
 * @param props.locale - Current locale for routing
 *
 * @example
 * ```tsx
 * <Logo locale="en" />
 * ```
 */
export function Logo({ locale }: LogoProps) {
  const t = useTranslations();

  return (
    <Link
      href={`/${locale}`}
      className="flex items-center border-b-transparent text-xl sm:text-2xl font-bold text-gray-900 touch-manipulation"
      aria-label={t('nav.home') || 'Home'}
    >
      Handmade
    </Link>
  );
}
