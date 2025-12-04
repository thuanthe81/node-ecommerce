/**
 * Animation utilities for FloatingMessagingButton
 * Provides helpers for calculating positions and animation timings
 */

import { MenuPosition } from '../types';

/**
 * Get responsive radius based on viewport width
 * Adjusts arc radius for different screen sizes
 *
 * @returns Appropriate radius for current viewport
 */
export function getResponsiveRadius(): number {
  if (typeof window === 'undefined') {
    return 80; // Default for SSR
  }

  const width = window.innerWidth;
  const height = window.innerHeight;

  // Extra small screens (< 375px) - very compact
  if (width < 375) {
    return 60;
  }

  // Small mobile screens (< 640px) - compact
  if (width < 640) {
    return 70;
  }

  // Small viewports in height (< 600px) - reduce radius to fit
  if (height < 600) {
    return 65;
  }

  // Tablet and up - standard radius
  return 80;
}

/**
 * Calculate position for an icon in a curved arc layout
 * Icons are positioned in a 90-degree arc extending upward and leftward from the button
 *
 * @param index - Index of the icon (0-based)
 * @param total - Total number of icons
 * @param radius - Distance from center button in pixels (optional, uses responsive default)
 * @returns Position object with x, y coordinates, angle, and animation delay
 */
export function calculateArcPosition(
  index: number,
  total: number,
  radius?: number
): MenuPosition {
  // Use provided radius or get responsive radius
  const effectiveRadius = radius ?? getResponsiveRadius();

  // Arc spans 90 degrees extending upward and leftward
  // Start at 180 degrees (left) and end at 90 degrees (top)
  // In standard math: 0° is right, 90° is up, 180° is left, 270° is down
  const startAngle = Math.PI; // 180 degrees (left)
  const endAngle = Math.PI / 2; // 90 degrees (top)

  // Calculate angle step between icons
  const angleStep = total > 1 ? (endAngle - startAngle) / (total - 1) : 0;
  const angle = startAngle + angleStep * index;

  // Convert to degrees for CSS
  const angleDegrees = (angle * 180) / Math.PI;

  // Calculate x and y offsets using trigonometry
  // Note: In CSS, positive Y goes down, so we negate it to go up
  const x = Math.cos(angle) * effectiveRadius;
  const y = -Math.sin(angle) * effectiveRadius; // Negative to move upward in CSS

  // Stagger animation delay (50ms between each icon)
  const delay = index * 50;

  return {
    angle: angleDegrees,
    radius: effectiveRadius,
    x,
    y,
    delay,
  };
}

/**
 * Animation timing constants
 */
export const ANIMATION_TIMINGS = {
  /** Duration for menu open/close animation */
  menuTransition: 250,
  /** Duration for icon entrance animation */
  iconEntrance: 200,
  /** Delay between each icon animation */
  iconStagger: 50,
  /** Duration for hover effects */
  hover: 150,
} as const;
