import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Custom hook for managing Header component state and behavior
 *
 * This hook encapsulates:
 * - Mobile menu open/close state
 * - Active link detection based on current pathname
 * - CSS class generation for navigation links
 * - Keyboard event handling (Escape key to close menu)
 * - Body scroll prevention when mobile menu is open
 *
 * @param locale - The current locale for path comparison
 *
 * @returns Object containing:
 * - isMobileMenuOpen: Boolean indicating if mobile menu is open
 * - toggleMobileMenu: Function to toggle mobile menu state
 * - closeMobileMenu: Function to close mobile menu
 * - isActiveLink: Function to check if a given href matches current path
 * - getLinkClasses: Function to generate CSS classes for navigation links
 *
 * @example
 * ```tsx
 * function Header() {
 *   const locale = useLocale();
 *   const {
 *     isMobileMenuOpen,
 *     toggleMobileMenu,
 *     closeMobileMenu,
 *     isActiveLink,
 *     getLinkClasses
 *   } = useHeaderState(locale);
 *
 *   return (
 *     <header>
 *       <button onClick={toggleMobileMenu}>Menu</button>
 *       <Link href="/" className={getLinkClasses('/')}>Home</Link>
 *     </header>
 *   );
 * }
 * ```
 */
export function useHeaderState(locale: string) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  /**
   * Toggle the mobile menu open/closed state
   */
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  /**
   * Close the mobile menu
   */
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  /**
   * Check if a link is active based on the current pathname
   *
   * @param href - The href to check against current path
   * @returns true if the link is active, false otherwise
   */
  const isActiveLink = (href: string): boolean => {
    const currentPath = pathname.replace(`/${locale}`, '') || '/';
    const linkPath = href.replace(`/${locale}`, '') || '/';

    // Exact match for home page
    if (linkPath === '/' && currentPath === '/') {
      return true;
    }
    // For other pages, check if current path starts with the link path
    return linkPath !== '/' && currentPath.startsWith(linkPath);
  };

  /**
   * Get CSS classes for a navigation link based on its active state
   *
   * @param href - The href of the link
   * @param baseClasses - Optional base CSS classes to include
   * @returns Combined CSS class string
   */
  const getLinkClasses = (href: string, baseClasses: string = ''): string => {
    const isActive = isActiveLink(href);
    const activeClasses = isActive
      ? 'text-blue-600 border-b-2 border-blue-600'
      : 'text-gray-700 hover:text-blue-600';
    return `${baseClasses} ${activeClasses} transition-colors font-medium touch-manipulation`;
  };

  // Handle escape key and body scroll when mobile menu is open
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMobileMenu();
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

  return {
    isMobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu,
    isActiveLink,
    getLinkClasses,
  };
}
