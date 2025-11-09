'use client';

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
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-white shadow-sm" role="banner">
      {/* Top Bar */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link 
              href={`/${locale}`} 
              className="text-2xl font-bold text-gray-900"
              aria-label={t('nav.home') || 'Home'}
            >
              Handmade
            </Link>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8" role="search">
              <SearchBar />
            </div>

            {/* Right Side Navigation */}
            <nav className="flex items-center space-x-4" aria-label={t('nav.main') || 'Main navigation'}>
              <LocaleSwitcher />
              
              <MiniCart />

              {isAuthenticated ? (
                <>
                  <Link
                    href={`/${locale}/account`}
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                    aria-label={t('nav.account') || 'Account'}
                  >
                    {t('nav.account')}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                    aria-label={t('auth.logout') || 'Logout'}
                  >
                    {t('auth.logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href={`/${locale}/login`}
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                    aria-label={t('auth.login') || 'Login'}
                  >
                    {t('auth.login')}
                  </Link>
                  <Link
                    href={`/${locale}/register`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    aria-label={t('auth.register') || 'Register'}
                  >
                    {t('auth.register')}
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <CategoryNav />
    </header>
  );
}
