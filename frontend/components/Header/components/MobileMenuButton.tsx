import { useTranslations } from 'next-intl';
import { SvgClose, SvgMenu } from '@/components/Svgs';
import { MobileMenuButtonProps } from '../types';

/**
 * MobileMenuButton component
 *
 * Displays a hamburger menu button for mobile devices that toggles
 * between menu and close icons based on the menu state.
 *
 * @param props - Component props
 * @param props.isOpen - Whether the mobile menu is currently open
 * @param props.onClick - Callback when the button is clicked
 * @param props.locale - Current locale for translations
 *
 * @example
 * ```tsx
 * <MobileMenuButton
 *   isOpen={isMobileMenuOpen}
 *   onClick={toggleMobileMenu}
 *   locale="en"
 * />
 * ```
 */
export function MobileMenuButton({ isOpen, onClick, locale }: MobileMenuButtonProps) {
  const t = useTranslations();

  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors touch-manipulation"
      aria-label={isOpen ? (t('nav.closeMenu') || 'Close menu') : (t('nav.openMenu') || 'Open menu')}
      aria-expanded={isOpen}
      aria-controls="mobile-menu"
      style={{ minWidth: '44px', minHeight: '44px' }}
    >
      {isOpen ? (
        <SvgClose className="w-6 h-6" aria-hidden="true" />
      ) : (
        <SvgMenu className="w-6 h-6" aria-hidden="true" />
      )}
    </button>
  );
}
