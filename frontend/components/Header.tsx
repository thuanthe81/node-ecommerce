'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import LocaleSwitcher from './LocaleSwitcher';
import SearchBar from './SearchBar';
import MiniCart from './MiniCart';
import { useAuth } from '@/contexts/AuthContext';
import CategoryNav from './CategoryNav';

export default function Header() {
  const locale = useLocale();
  const t = useTranslations();
  const { isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
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
      <div className="border-b overflow-visible">
        <div className="container mx-auto px-4 py-3 overflow-visible">
          <div className="flex items-center justify-between">
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
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* Logo */}
            <Link
              href={`/${locale}`}
              className="text-xl sm:text-2xl font-bold text-gray-900 touch-manipulation"
              aria-label={t('nav.home') || 'Home'}
              style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}
            >
              Handmade
            </Link>

            {/* Main Navigation Links - Desktop */}
            <nav className="hidden lg:flex items-center space-x-6 flex-1 ml-8" aria-label={t('nav.main') || 'Main navigation'}>
              <Link
                href={`/${locale}`}
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium touch-manipulation"
                style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}
              >
                {t('nav.home') || 'Home'}
              </Link>
              <Link
                href={`/${locale}/products`}
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium touch-manipulation"
                style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}
              >
                {t('nav.products') || 'Products'}
              </Link>
              <Link
                href={`/${locale}/contact`}
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium touch-manipulation"
                style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}
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
                    className="text-gray-700 hover:text-blue-600 transition-colors touch-manipulation"
                    aria-label={t('nav.account') || 'Account'}
                    style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}
                  >
                    {t('nav.account')}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-gray-700 hover:text-blue-600 transition-colors touch-manipulation"
                    aria-label={t('auth.logout') || 'Logout'}
                    style={{ minWidth: '44px', minHeight: '44px' }}
                  >
                    {t('auth.logout')}
                  </button>
                </>
              ) : (
                <Link
                  href={`/${locale}/login`}
                  className="text-gray-700 hover:text-blue-600 transition-colors touch-manipulation"
                  aria-label={t('auth.login') || 'Login'}
                  style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}
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
          <div className="md:hidden mt-3" role="search">
            <SearchBar />
          </div>
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
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile Menu Content */}
          <nav className="flex-1 overflow-y-auto p-4" aria-label={t('nav.main') || 'Main navigation'}>
            <ul className="space-y-2">
              {/* Main Navigation Links */}
              <li>
                <Link
                  href={`/${locale}`}
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-blue-600 rounded-md transition-colors font-medium touch-manipulation"
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{ minHeight: '44px' }}
                >
                  {t('nav.home') || 'Home'}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/products`}
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-blue-600 rounded-md transition-colors font-medium touch-manipulation"
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{ minHeight: '44px' }}
                >
                  {t('nav.products') || 'Products'}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/contact`}
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-blue-600 rounded-md transition-colors font-medium touch-manipulation"
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
                      className="block px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-blue-600 rounded-md transition-colors touch-manipulation"
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
                    className="block px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-blue-600 rounded-md transition-colors touch-manipulation"
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