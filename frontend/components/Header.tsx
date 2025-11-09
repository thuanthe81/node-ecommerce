'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import LocaleSwitcher from './LocaleSwitcher';
import SearchBar from './SearchBar';
import { useAuth } from '@/contexts/AuthContext';
import CategoryNav from './CategoryNav';

export default function Header() {
  const locale = useLocale();
  const t = useTranslations();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-white shadow-sm">
      {/* Top Bar */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href={`/${locale}`} className="text-2xl font-bold text-gray-900">
              Handmade
            </Link>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <SearchBar />
            </div>

            {/* Right Side Navigation */}
            <div className="flex items-center space-x-6">
              <LocaleSwitcher />

              {isAuthenticated ? (
                <>
                  <Link
                    href={`/${locale}/account`}
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    {t('nav.account')}
                  </Link>
                  <Link
                    href={`/${locale}/cart`}
                    className="text-gray-700 hover:text-blue-600 transition-colors relative"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    {t('auth.logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href={`/${locale}/login`}
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    {t('auth.login')}
                  </Link>
                  <Link
                    href={`/${locale}/register`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {t('auth.register')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <CategoryNav />
    </header>
  );
}
