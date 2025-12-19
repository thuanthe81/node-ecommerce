/**
 * Animation Utilities Tests
 * Tests for responsive positioning and animation calculations
 */

import { calculateArcPosition, getResponsiveRadius, ANIMATION_TIMINGS } from '../animations';

describe('Animation Utilities', () => {
  describe('getResponsiveRadius', () => {
    // Mock window.innerWidth and window.innerHeight
    const mockWindowSize = (width: number, height: number) => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: width,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: height,
      });
    };

    test('returns 60 for extra small screens (< 375px)', () => {
      mockWindowSize(360, 640);
      expect(getResponsiveRadius()).toBe(60);
    });

    test('returns 70 for small mobile screens (< 640px)', () => {
      mockWindowSize(480, 800);
      expect(getResponsiveRadius()).toBe(70);
    });

    test('returns 65 for small viewport height (< 600px)', () => {
      mockWindowSize(800, 550);
      expect(getResponsiveRadius()).toBe(65);
    });

    test('returns 80 for tablet and desktop screens', () => {
      mockWindowSize(1024, 768);
      expect(getResponsiveRadius()).toBe(80);
    });

    test('returns 80 for large desktop screens', () => {
      mockWindowSize(1920, 1080);
      expect(getResponsiveRadius()).toBe(80);
    });
  });

  describe('calculateArcPosition', () => {
    test('calculates position for single icon', () => {
      const position = calculateArcPosition(0, 1, 80);
      expect(position.radius).toBe(80);
      expect(position.delay).toBe(0);
      // Single icon positioned at 180° (left)
      expect(position.x).toBeCloseTo(-80, 1); // cos(180°) * 80 = -80
      expect(position.y).toBeCloseTo(0, 1); // -sin(180°) * 80 = 0
    });

    test('calculates positions for multiple icons in arc', () => {
      const positions = [0, 1, 2].map((i) => calculateArcPosition(i, 3, 80));

      // First icon at 180 degrees (left)
      expect(positions[0].x).toBeCloseTo(-80, 1);
      expect(positions[0].y).toBeCloseTo(0, 1);

      // Middle icon at 135 degrees (top-left)
      expect(positions[1].x).toBeCloseTo(-56.57, 1);
      expect(positions[1].y).toBeCloseTo(-56.57, 1);

      // Last icon at 90 degrees (top)
      expect(positions[2].x).toBeCloseTo(0, 1);
      expect(positions[2].y).toBeCloseTo(-80, 1);
    });

    test('applies staggered animation delays', () => {
      const positions = [0, 1, 2, 3].map((i) => calculateArcPosition(i, 4, 80));

      expect(positions[0].delay).toBe(0);
      expect(positions[1].delay).toBe(50);
      expect(positions[2].delay).toBe(100);
      expect(positions[3].delay).toBe(150);
    });

    test('uses responsive radius when not provided', () => {
      // Mock a small screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 360,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 640,
      });

      const position = calculateArcPosition(0, 1);
      expect(position.radius).toBe(60); // Should use responsive radius for small screen
    });
  });

  describe('ANIMATION_TIMINGS', () => {
    test('defines all required timing constants', () => {
      expect(ANIMATION_TIMINGS.menuTransition).toBe(250);
      expect(ANIMATION_TIMINGS.iconEntrance).toBe(200);
      expect(ANIMATION_TIMINGS.iconStagger).toBe(50);
      expect(ANIMATION_TIMINGS.hover).toBe(150);
    });
  });
});
