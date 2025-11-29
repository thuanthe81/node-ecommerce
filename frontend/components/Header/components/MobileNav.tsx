import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { SvgClose } from '@/components/Svgs';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import { MobileNavProps } from '../types';

/**
 * MobileNav component
 *
 * Displays the mobile navigation menu as a slide-in panel.
 * Includes main navigation links, user account links, and language switcher.
 *
 * @param props - Component props
 * @param props.isOpen - Whether the mobile menu is currently open
 * @param props.locale - Current locale for routing and translations
 * @param props.user - Current user object (if authenticated)
 * @param props.isActiveLink - Function to check if a link is active
 * @param props.onClose - Callback to close the mobile menu
 * @param props.onLogout - Callback to handle logout
 *
 * @example
 * ```tsx
 * <MobileNav
 *   isOpen={isMobileMenuOpen}
 *   locale="en"
 *   user={user}
 *   isActiveLink={isActiveLink}
 *   onClose={closeMobileMenu}
 *   onLogout={handleLogout}
 * />
 * ```
 */
export function MobileNav({ isOpen, locale, user, isActiveLink, onClose, onLogout }: MobileNavProps) {
  const t = useTranslations();
  const isAuthenticated = !!user;

  return (
    <>
      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu */}
      <div
        id="mobile-menu"
        className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label={t('nav.mobileMenu') || 'Mobile menu'}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <span className="text-xl font-bold text-gray-900">Menu</span>
            <button
              onClick={onClose}
              className="p-2 text-gray-700 hover:text-blue-600 transition-colors touch-manipulation"
              aria-label={t('nav.closeMenu') || 'Close menu'}
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              <SvgClose className="w-6 h-6" aria-hidden="true" />
            </button>
          </div>

          {/* Mobile Menu Content */}
          <nav className="flex-1 overflow-y-auto p-4" aria-label={t('nav.main') || 'Main navigation'}>
            <ul className="space-y-2">
              {/* Main Navigation Links */}
              <li>
                <Link
                  href={`/${locale}`}
                  className={`block px-4 py-3 rounded-md transition-colors font-medium touch-manipulation ${
                    isActiveLink(`/${locale}`)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                  }`}
                  onClick={onClose}
                  style={{ minHeight: '44px' }}
                >
                  {t('nav.home') || 'Home'}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/products`}
                  className={`block px-4 py-3 rounded-md transition-colors font-medium touch-manipulation ${
                    isActiveLink(`/${locale}/products`)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                  }`}
                  onClick={onClose}
                  style={{ minHeight: '44px' }}
                >
                  {t('nav.products') || 'Products'}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/contact`}
                  className={`block px-4 py-3 rounded-md transition-colors font-medium touch-manipulation ${
                    isActiveLink(`/${locale}/contact`)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                  }`}
                  onClick={onClose}
                  style={{ minHeight: '44px' }}
                >
                  {t('nav.contact') || 'Contact'}
                </Link>
              </li>

              {/* Divider */}
              <li className="pt-4 border-t"></li>

              {/* User Account Links */}
              {isAuthenticated ? (
                <>
                  <li>
                    <Link
                      href={`/${locale}/account`}
                      className={`block px-4 py-3 rounded-md transition-colors touch-manipulation ${
                        isActiveLink(`/${locale}/account`)
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                      }`}
                      onClick={onClose}
                      style={{ minHeight: '44px' }}
                    >
                      {t('nav.account')}
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={onLogout}
                      className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-blue-600 rounded-md transition-colors touch-manipulation"
                      style={{ minHeight: '44px' }}
                    >
                      {t('auth.logout')}
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <Link
                    href={`/${locale}/login`}
                    className={`block px-4 py-3 rounded-md transition-colors touch-manipulation ${
                      isActiveLink(`/${locale}/login`)
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                    }`}
                    onClick={onClose}
                    style={{ minHeight: '44px' }}
                  >
                    {t('auth.login')}
                  </Link>
                </li>
              )}

              {/* Language Switcher */}
              <li className="pt-4 border-t">
                <div className="px-4 py-2">
                  <LocaleSwitcher />
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
