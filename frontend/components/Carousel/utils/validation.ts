/**
 * Data validation utilities for carousel items
 */

import { CarouselItem } from '../types';

/**
 * Validates a single carousel item
 *
 * @param item - The item to validate
 * @returns true if valid, false otherwise
 */
export function isValidCarouselItem(item: any): item is CarouselItem {
  if (!item || typeof item !== 'object') return false;
  if (typeof item.id !== 'string' || !item.id.trim()) return false;
  if (typeof item.imageUrl !== 'string' || !item.imageUrl.trim()) return false;
  if (typeof item.alt !== 'string') return false;
  return true;
}

/**
 * Filters and validates carousel items
 *
 * @param items - Array of items to validate
 * @returns Array of valid items
 */
export function validateCarouselItems(items: any[]): CarouselItem[] {
  if (!Array.isArray(items)) {
    console.warn('Carousel3D: items prop must be an array');
    return [];
  }

  const validItems = items.filter((item, index) => {
    const isValid = isValidCarouselItem(item);
    if (!isValid) {
      console.warn(`Carousel3D: Invalid item at index ${index}`, item);
    }
    return isValid;
  });

  return validItems;
}
