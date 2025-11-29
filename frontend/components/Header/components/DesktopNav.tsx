import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { DesktopNavProps } from '../types';

/**
 * DesktopNav component
 *
 * Displays the main navigation links for desktop viewports.
 * Shows admin link if user has admin role.
 *
 * @param props - Component props
 * @param props.locale - Current locale for routing
 * @param props.user - Current user object (if authenticated)
 * @param props.isActiveLink - Function to check if a link is active
 * @param props.getLinkClasses - Function to get CSS classes for a link
 *
 * @example
 * ```tsx
 * <DesktopNav
 *   locale="en"
 *   user={user}
 *   isActiveLink={isActiveLink}
 *   getLinkClasses={getLinkClasses}
 * />
 * ```
 */
export function DesktopNav({ locale, user, isActiveLink, getLinkClasses }: DesktopNavProps) {
  const t = useTranslations();

  return (
    <nav className="hidden lg:flex items-stretch flex-1 ml-8" aria-label={t('nav.main') || 'Main navigation'}>
      {user?.role === 'ADMIN' && (
        <Link
          href={`/${locale}/admin`}
          className={getLinkClasses(`/${locale}/admin`, 'flex items-center h-full px-4')}
        >
          Admin
        </Link>
      )}
      <Link
        href={`/${locale}`}
        className={getLinkClasses(`/${locale}`, 'flex items-center h-full px-4')}
      >
        {t('nav.home') || 'Home'}
      </Link>
      <Link
        href={`/${locale}/products`}
        className={getLinkClasses(`/${locale}/products`, 'flex items-center h-full px-4')}
      >
        {t('nav.products') || 'Products'}
      </Link>
      <Link
        href={`/${locale}/contact`}
        className={getLinkClasses(`/${locale}/contact`, 'flex items-center h-full px-4')}
      >
        {t('nav.contact') || 'Contact'}
      </Link>
    </nav>
  );
}
