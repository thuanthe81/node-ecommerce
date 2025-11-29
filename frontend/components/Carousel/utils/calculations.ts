/**
 * 3D Transform calculation utilities for carousel positioning
 * These functions handle the mathematical calculations for positioning items in 3D space
 */

/**
 * Normalizes an angle to be within 0-360 degrees
 *
 * @param angle - The angle in degrees to normalize
 * @returns Normalized angle between 0 and 360
 *
 * @example
 * ```typescript
 * normalizeAngle(450); // Returns 90
 * normalizeAngle(-90); // Returns 270
 * ```
 */
export function normalizeAngle(angle: number): number {
  const normalized = angle % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

/**
 * Calculates the 3D transform string for positioning an item in the carousel ring
 * Uses circular motion to position items around a ring in 3D space
 *
 * @param index - The index of the item in the carousel
 * @param totalItems - Total number of items in the carousel
 * @param rotation - Current rotation angle of the carousel in degrees
 * @param ringRadius - Radius of the carousel ring in pixels
 * @returns CSS transform string for 3D positioning
 *
 * @example
 * ```typescript
 * const transform = calculateItemTransform(0, 5, 0, 300);
 * // Returns: "translate3d(0px, 0, 300px) rotateY(0deg)"
 * ```
 */
export function calculateItemTransform(
  index: number,
  totalItems: number,
  rotation: number,
  ringRadius: number
): string {
  // Calculate the base angle for this item's position in the ring
  const baseAngle = (360 / totalItems) * index;

  // Add the current rotation to get the actual angle
  const angle = baseAngle + rotation;

  // Convert to radians for trigonometric calculations
  const angleRad = (angle * Math.PI) / 180;

  // Calculate x and z positions using circular motion
  // x: horizontal position (left-right)
  // z: depth position (forward-backward)
  const x = Math.sin(angleRad) * ringRadius;
  const z = Math.cos(angleRad) * ringRadius;

  // Return the complete 3D transform
  // translate3d positions the item in 3D space
  // rotateY rotates the item to face the center of the ring
  return `translate3d(${x}px, 0, ${z}px) rotateY(${-angle}deg)`;
}

/**
 * Calculates scale, opacity, and z-index based on z-position for depth effect
 * Items closer to the viewer (positive z) are larger and more opaque
 * Items further away (negative z) are smaller and more transparent
 *
 * @param z - The z-position of the item in pixels
 * @param ringRadius - Radius of the carousel ring in pixels
 * @returns Object containing scale, opacity, and zIndex values
 *
 * @example
 * ```typescript
 * const style = calculateItemStyle(300, 300);
 * // Returns: { scale: 1.0, opacity: 1.0, zIndex: 100 }
 * ```
 */
export function calculateItemStyle(
  z: number,
  ringRadius: number
): { scale: number; opacity: number; zIndex: number } {
  // Normalize z-position to a 0-1 range
  // z ranges from -ringRadius (back) to +ringRadius (front)
  const normalizedZ = (z + ringRadius) / (ringRadius * 2);

  // Scale: items at the front (z = ringRadius) scale to 1.0
  // items at the back (z = -ringRadius) scale to 0.6
  const scale = 0.6 + normalizedZ * 0.4;

  // Opacity: items at the front are fully opaque (1.0)
  // items at the back are more transparent (0.4)
  const opacity = 0.4 + normalizedZ * 0.6;

  // Z-index: items closer to viewer should be on top
  // Convert normalized z to integer z-index (0-100)
  const zIndex = Math.round(normalizedZ * 100);

  return { scale, opacity, zIndex };
}

/**
 * Calculates the z-position for a given item
 * Used to determine depth in 3D space
 *
 * @param index - The index of the item in the carousel
 * @param totalItems - Total number of items in the carousel
 * @param rotation - Current rotation angle of the carousel in degrees
 * @param ringRadius - Radius of the carousel ring in pixels
 * @returns The z-position in pixels
 *
 * @example
 * ```typescript
 * const z = calculateZPosition(0, 5, 0, 300);
 * // Returns: 300 (item is at the front)
 * ```
 */
export function calculateZPosition(
  index: number,
  totalItems: number,
  rotation: number,
  ringRadius: number
): number {
  const baseAngle = (360 / totalItems) * index;
  const angle = baseAngle + rotation;
  const angleRad = (angle * Math.PI) / 180;
  return Math.cos(angleRad) * ringRadius;
}

/**
 * Determines which item is currently focused (closest to front/center)
 *
 * @param rotation - Current rotation angle of the carousel in degrees
 * @param totalItems - Total number of items in the carousel
 * @returns Index of the focused item
 *
 * @example
 * ```typescript
 * const focusedIndex = calculateFocusedIndex(0, 5);
 * // Returns: 0 (first item is focused)
 * ```
 */
export function calculateFocusedIndex(
  rotation: number,
  totalItems: number
): number {
  // Normalize rotation to 0-360 range
  const normalizedRotation = normalizeAngle(-rotation);

  // Calculate which item is closest to 0 degrees (front center)
  const itemAngle = 360 / totalItems;
  const focusedIndex = Math.round(normalizedRotation / itemAngle) % totalItems;

  return focusedIndex;
}
