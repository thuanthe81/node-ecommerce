/**
 * FloatingMessagingButton Component Types
 * Type definitions for the floating messaging button component
 */

import { FooterSettings } from '@/lib/footer-settings-api';

/**
 * Social media platform identifiers
 */
export type SocialMediaPlatformId = 'facebook' | 'tiktok' | 'zalo' | 'whatsapp';

/**
 * Social media URLs extracted from footer settings
 */
export interface SocialMediaUrls {
  facebook?: string | null;
  tiktok?: string | null;
  zalo?: string | null;
  whatsapp?: string | null;
}

/**
 * Social media platform configuration
 */
export interface SocialMediaPlatform {
  /** Unique identifier for the platform */
  id: SocialMediaPlatformId;
  /** Display name of the platform */
  name: string;
  /** URL for the platform (from footer settings) */
  url: string | null;
  /** Brand color for hover effects */
  color: string;
  /** Translation key for aria-label */
  translationKey: string;
}

/**
 * Position calculation for menu icons in arc layout
 */
export interface MenuPosition {
  /** Angle in degrees for arc positioning */
  angle: number;
  /** Distance from center button in pixels */
  radius: number;
  /** Animation delay in milliseconds */
  delay: number;
  /** X coordinate offset */
  x: number;
  /** Y coordinate offset */
  y: number;
}

/**
 * Props for TriggerButton sub-component
 */
export interface TriggerButtonProps {
  /** Whether the menu is currently open */
  isOpen: boolean;
  /** Callback when button is clicked */
  onClick: () => void;
  /** Accessible label for the button */
  ariaLabel: string;
}

/**
 * Props for SocialMediaMenu sub-component
 */
export interface SocialMediaMenuProps {
  /** Whether the menu is currently visible */
  isOpen: boolean;
  /** Social media URLs from footer settings */
  socialMediaUrls: SocialMediaUrls;
  /** Callback when menu should close */
  onClose: () => void;
}

/**
 * Return type for useFooterSettings hook
 */
export interface UseFooterSettingsReturn {
  /** Footer settings data */
  footerSettings: FooterSettings | null;
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Error object if request failed */
  error: Error | null;
  /** Function to refetch footer settings */
  refetch: () => Promise<void>;
}

/**
 * Return type for useMenuState hook
 */
export interface UseMenuStateReturn {
  /** Whether the menu is currently open */
  isOpen: boolean;
  /** Open the menu */
  open: () => void;
  /** Close the menu */
  close: () => void;
  /** Toggle menu open/close state */
  toggle: () => void;
}

/**
 * SVG component props
 */
export interface SvgProps {
  className?: string;
  width?: number;
  height?: number;
}
