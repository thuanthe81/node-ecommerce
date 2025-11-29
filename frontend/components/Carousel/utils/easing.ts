/**
 * Easing functions for smooth animations
 * These functions transform linear progress (0-1) into eased progress
 */

/**
 * Cubic easing in-out function for smooth animations
 * Starts slow, speeds up in the middle, and slows down at the end
 *
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 *
 * @example
 * ```typescript
 * const progress = 0.5;
 * const easedProgress = easeInOutCubic(progress);
 * // Use easedProgress for smooth animation
 * ```
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Ease out cubic function for natural deceleration
 * Starts fast and slows down at the end
 *
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 *
 * @example
 * ```typescript
 * const progress = 0.75;
 * const easedProgress = easeOutCubic(progress);
 * // Use for animations that should decelerate naturally
 * ```
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
