'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import LocaleSwitcher from './LocaleSwitcher';
import SearchBar from './SearchBar';
import MiniCart from './MiniCart';
import { useAuth } from '@/contexts/AuthContext';
import { SvgClose, SvgMenu } from '@/components/Svgs';

export default function Header() {
  const locale = useLocale();
  const t = useTranslations();
  const { isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const {user} = useAuth();

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
  };

  // Helper function to check if a link is active
  const isActiveLink = (href: string) => {
    const currentPath = pathname.replace(`/${locale}`, '') || '/';
    const linkPath = href.replace(`/${locale}`, '') || '/';

    // Exact match for home page
    if (linkPath === '/' && currentPath === '/') {
      return true;
    }
    // For other pages, check if current path starts with the link path
    return linkPath !== '/' && currentPath.startsWith(linkPath);
  };

  // Helper function to get active link classes
  const getLinkClasses = (href: string, baseClasses: string = '') => {
    const isActive = isActiveLink(href);
    const activeClasses = isActive
      ? 'text-blue-600 border-b-2 border-blue-600'
      : 'text-gray-700 hover:text-blue-600';
    return `${baseClasses} ${activeClasses} transition-colors font-medium touch-manipulation`;
  };

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="bg-white shadow-sm overflow-visible" role="banner">
      {/* Top Bar */}
      <div className="overflow-visible">
        <div className="overflow-visible px-4 w-full">
          <div className="flex items-stretch justify-between h-[70px]">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors touch-manipulation"
              aria-label={isMobileMenuOpen ? (t('nav.closeMenu') || 'Close menu') : (t('nav.openMenu') || 'Open menu')}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              {isMobileMenuOpen ? (
                <SvgClose className="w-6 h-6" aria-hidden="true" />
              ) : (
                <SvgMenu className="w-6 h-6" aria-hidden="true" />
              )}
            </button>

            {/* Logo */}
            <Link
              href={`/${locale}`}
              className="flex items-center border-b-transparent text-xl sm:text-2xl font-bold text-gray-900 touch-manipulation"
              aria-label={t('nav.home') || 'Home'}
            >
              Handmade
            </Link>

            {/* Main Navigation Links - Desktop */}
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

            {/* Search Bar - Desktop */}
            {/* <div className="hidden lg:flex flex-1 max-w-md mx-8" role="search"> */}
              {/* <SearchBar /> */}
            {/* </div> */}

            {/* Right Side Navigation - Desktop */}
            <div className="hidden lg:flex items-center space-x-4 relative">
              <LocaleSwitcher />

              <MiniCart />

              {isAuthenticated ? (
                <>
                  <Link
                    href={`/${locale}/account`}
                    className={getLinkClasses(`/${locale}/account`, 'flex items-center')}
                    aria-label={t('nav.account') || 'Account'}
                  >
                    {t('nav.account')}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-gray-700 hover:text-blue-600 transition-colors touch-manipulation"
                    aria-label={t('auth.logout') || 'Logout'}
                  >
                    {t('auth.logout')}
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

            {/* Mobile Cart Icon */}
            <div className="lg:hidden">
              <MiniCart />
            </div>
          </div>

          {/* Mobile Search Bar */}
          {/*<div className="md:hidden mt-3" role="search">*/}
          {/*  <SearchBar />*/}
          {/*</div>*/}
        </div>
      </div>

      {/* Category Navigation - Desktop */}
      {/*<div className="hidden lg:block">*/}
      {/*  <CategoryNav />*/}
      {/*</div>*/}

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu */}
      <div
        id="mobile-menu"
        className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label={t('nav.mobileMenu') || 'Mobile menu'}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <span className="text-xl font-bold text-gray-900">Menu</span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
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
                  onClick={() => setIsMobileMenuOpen(false)}
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
                  onClick={() => setIsMobileMenuOpen(false)}
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
                  onClick={() => setIsMobileMenuOpen(false)}
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
                      onClick={() => setIsMobileMenuOpen(false)}
                      style={{ minHeight: '44px' }}
                    >
                      {t('nav.account')}
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
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
                    onClick={() => setIsMobileMenuOpen(false)}
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
    </header>
  );
}