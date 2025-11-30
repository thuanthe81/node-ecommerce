'use client';

import { useLocale } from 'next-intl';
import MiniCart from '@/components/MiniCart';
import { useAuth } from '@/contexts/AuthContext';
import { useHeaderState } from './hooks/useHeaderState';
import { MobileMenuButton } from './components/MobileMenuButton';
import { Logo } from './components/Logo';
import { DesktopNav } from './components/DesktopNav';
import { MobileNav } from './components/MobileNav';
import { UserActions } from './components/UserActions';
import { HeaderProps } from './types';
import SearchFilterBar from '@/components/SearchFilterBar';

/**
 * Header component
 *
 * Main navigation header for the application. Displays different layouts
 * for desktop and mobile viewports. Includes:
 * - Site logo/branding
 * - Main navigation links
 * - User authentication actions
 * - Mobile menu with slide-in panel
 * - Locale switcher
 * - Shopping cart
 *
 * The component is fully responsive and accessible, with proper ARIA labels
 * and keyboard navigation support.
 *
 * @example
 * ```tsx
 * <Header />
 * ```
 */
export default function Header(props: HeaderProps = {}) {
  const locale = useLocale();
  const { isAuthenticated, logout, user } = useAuth();

  const {
    isMobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu,
    isActiveLink,
    getLinkClasses,
  } = useHeaderState(locale);

  const handleLogout = async () => {
    await logout();
    closeMobileMenu();
  };

  return (
    <header className="bg-white shadow-sm overflow-visible" role="banner">
      {/* Top Bar */}
      <div className="overflow-visible">
        <div className="overflow-visible px-4 w-full">
          <div className="flex items-stretch justify-between h-[70px]">
            {/* Mobile Menu Button */}
            <MobileMenuButton
              isOpen={isMobileMenuOpen}
              onClick={toggleMobileMenu}
              locale={locale}
            />

            {/* Logo */}
            <Logo locale={locale} />

            {/* Main Navigation Links - Desktop */}
            <DesktopNav
              locale={locale}
              user={user}
              isActiveLink={isActiveLink}
              getLinkClasses={getLinkClasses}
            />

            {/* Search Bar - Desktop */}
             <div className="hidden lg:flex max-w-md self-center" role="search">
               <SearchFilterBar />
             </div>
            {/*<SearchFilterBar />*/}

            {/* Right Side Navigation - Desktop */}
            <UserActions
              isAuthenticated={isAuthenticated}
              user={user}
              locale={locale}
              onLogout={handleLogout}
              getLinkClasses={getLinkClasses}
            />

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

      {/* Mobile Menu */}
      <MobileNav
        isOpen={isMobileMenuOpen}
        locale={locale}
        user={user}
        isActiveLink={isActiveLink}
        onClose={closeMobileMenu}
        onLogout={handleLogout}
      />
    </header>
  );
}