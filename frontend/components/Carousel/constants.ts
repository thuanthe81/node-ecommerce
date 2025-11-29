/**
 * Configuration constants for Carousel components
 */

import { ResponsiveConfig } from './types';

/**
 * Responsive configuration for different breakpoints
 * Adjusts carousel dimensions and behavior based on screen size
 */
export const RESPONSIVE_CONFIG: Record<'mobile' | 'tablet' | 'desktop', ResponsiveConfig> = {
  mobile: {
    ringRadius: 180,
    itemWidth: 140,
    itemHeight: 200,
    dragSensitivity: 0.6, // Slightly more sensitive for touch
    perspective: 800,
  },
  tablet: {
    ringRadius: 240,
    itemWidth: 170,
    itemHeight: 250,
    dragSensitivity: 0.55,
    perspective: 1000,
  },
  desktop: {
    ringRadius: 300,
    itemWidth: 200,
    itemHeight: 600,
    dragSensitivity: 0.5,
    perspective: 1200,
  },
};

/**
 * Default configuration constants for carousel behavior
 */
export const DEFAULT_CONFIG = {
  /** Whether auto-rotation is enabled by default */
  autoRotate: false,
  /** Default interval between auto-rotations in milliseconds */
  autoRotateInterval: 5000,
  /** Default rotation speed (calculated based on item count if 0) */
  rotationSpeed: 0,
  /** Default ring radius in pixels */
  ringRadius: 300,
  /** Default item width in pixels */
  itemWidth: 200,
  /** Default item height in pixels */
  itemHeight: 400,
  /** Whether to show navigation controls by default */
  showControls: true,
  /** Whether to show position indicators by default */
  showIndicators: true,
  /** Default animation duration in milliseconds */
  animationDuration: 600,
  /** Default drag sensitivity */
  dragSensitivity: 0.5,
};
