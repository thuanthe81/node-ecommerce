/**
 * Test data for Carousel3D performance testing
 * Provides sample data with various item counts
 */

import { CarouselItem } from '../Carousel';

/**
 * Generate test carousel items
 * @param count - Number of items to generate
 * @returns Array of carousel items
 */
export function generateTestItems(count: number): CarouselItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `test-item-${i}`,
    imageUrl: `https://picsum.photos/seed/${i}/400/600`,
    alt: `Test Product ${i + 1}`,
    title: `Product ${i + 1}`,
    linkUrl: `/products/test-${i}`,
  }));
}

// Pre-generated test data sets
export const TEST_DATA = {
  // Minimum items for 3D carousel
  minimum: generateTestItems(3),

  // Standard item count
  standard: generateTestItems(6),

  // Large item count
  large: generateTestItems(9),

  // Maximum recommended item count
  maximum: generateTestItems(12),

  // Insufficient items (should trigger fallback)
  insufficient: generateTestItems(2),

  // Empty (should show empty state)
  empty: [] as CarouselItem[],
};

/**
 * Performance test scenarios
 */
export const PERFORMANCE_SCENARIOS = [
  {
    name: 'Minimum Items (3)',
    items: TEST_DATA.minimum,
    expectedBehavior: 'Should render 3D carousel with 3 items',
  },
  {
    name: 'Standard Items (6)',
    items: TEST_DATA.standard,
    expectedBehavior: 'Should render 3D carousel with optimal performance',
  },
  {
    name: 'Large Items (9)',
    items: TEST_DATA.large,
    expectedBehavior: 'Should render 3D carousel with good performance',
  },
  {
    name: 'Maximum Items (12)',
    items: TEST_DATA.maximum,
    expectedBehavior: 'Should render 3D carousel with acceptable performance',
  },
  {
    name: 'Insufficient Items (2)',
    items: TEST_DATA.insufficient,
    expectedBehavior: 'Should render fallback slider',
  },
  {
    name: 'Empty Items (0)',
    items: TEST_DATA.empty,
    expectedBehavior: 'Should show empty state message',
  },
];