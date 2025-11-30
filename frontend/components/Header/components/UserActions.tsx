import Link from 'next/link';
import { useTranslations } from 'next-intl';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import MiniCart from '@/components/MiniCart';
import { SvgUser, SvgLogout } from '@/components/Svgs';
import { UserActionsProps } from '../types';

/**
 * UserActions component
 *
 * Displays user-related actions in the header for desktop viewports.
 * Includes locale switcher, mini cart, and account/login/logout links.
 *
 * @param props - Component props
 * @param props.isAuthenticated - Whether the user is authenticated
 * @param props.user - Current user object (if authenticated)
 * @param props.locale - Current locale for routing and translations
 * @param props.onLogout - Callback to handle logout
 * @param props.getLinkClasses - Function to get CSS classes for a link
 *
 * @example
 * ```tsx
 * <UserActions
 *   isAuthenticated={isAuthenticated}
 *   user={user}
 *   locale="en"
 *   onLogout={handleLogout}
 *   getLinkClasses={getLinkClasses}
 * />
 * ```
 */
export function UserActions({ isAuthenticated, user, locale, onLogout, getLinkClasses }: UserActionsProps) {
  const t = useTranslations();

  return (
    <div className="hidden lg:flex items-center space-x-2 relative">
      <LocaleSwitcher />

      <MiniCart />

      {isAuthenticated ? (
        <>
          <Link
            href={`/${locale}/account`}
            className={getLinkClasses(`/${locale}/account`, 'flex items-center')}
            aria-label={t('nav.account') || 'Account'}
          >
            <SvgUser className="w-6 h-6" />
          </Link>
          <button
            onClick={onLogout}
            className="text-gray-700 hover:text-blue-600 transition-colors touch-manipulation flex items-center"
            aria-label={t('auth.logout') || 'Logout'}
          >
            <SvgLogout className="w-6 h-6" />
          </button>
        </>
      ) : (
        <Link
          href={`/${locale}/login`}
          className={getLinkClasses(`/${locale}/login`)}
          aria-label={t('auth.login') || 'Login'}
        >
          {t('auth.login')}
        </Link>
      )}
    </div>
  );
}