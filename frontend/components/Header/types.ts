/**
 * TypeScript interfaces and types for the Header component
 */

/**
 * Props for the Header component
 */
export interface HeaderProps {
  // Header currently has no props, but this interface is here for future extensibility
}

/**
 * State for managing header behavior
 */
export interface HeaderState {
  /** Whether the mobile menu is currently open */
  isMobileMenuOpen: boolean;
}

/**
 * Props for the MobileMenuButton component
 */
export interface MobileMenuButtonProps {
  /** Whether the mobile menu is currently open */
  isOpen: boolean;
  /** Callback when the button is clicked */
  onClick: () => void;
  /** Current locale for translations */
  locale: string;
}

/**
 * Props for the Logo component
 */
export interface LogoProps {
  /** Current locale for routing */
  locale: string;
}

/**
 * Props for the DesktopNav component
 */
export interface DesktopNavProps {
  /** Current locale for routing */
  locale: string;
  /** Current user object (if authenticated) */
  user: { role: string } | null;
  /** Function to check if a link is active */
  isActiveLink: (href: string) => boolean;
  /** Function to get CSS classes for a link */
  getLinkClasses: (href: string, baseClasses?: string) => string;
}

/**
 * Props for the MobileNav component
 */
export interface MobileNavProps {
  /** Whether the mobile menu is currently open */
  isOpen: boolean;
  /** Current locale for routing and translations */
  locale: string;
  /** Current user object (if authenticated) */
  user: { role: string } | null;
  /** Function to check if a link is active */
  isActiveLink: (href: string) => boolean;
  /** Callback to close the mobile menu */
  onClose: () => void;
  /** Callback to handle logout */
  onLogout: () => Promise<void>;
}

/**
 * Props for the UserActions component
 */
export interface UserActionsProps {
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Current user object (if authenticated) */
  user: { role: string } | null;
  /** Current locale for routing and translations */
  locale: string;
  /** Callback to handle logout */
  onLogout: () => Promise<void>;
  /** Function to get CSS classes for a link */
  getLinkClasses: (href: string, baseClasses?: string) => string;
}
