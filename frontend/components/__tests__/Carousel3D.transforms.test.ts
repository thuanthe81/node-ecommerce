import {
  normalizeAngle,
  calculateItemTransform,
  calculateItemStyle,
  calculateZPosition,
  calculateFocusedIndex,
  easeInOutCubic,
  easeOutCubic,
} from '../Carousel';

describe('Carousel3D Transform Calculations', () => {
  describe('normalizeAngle', () => {
    it('should normalize positive angles within 0-360', () => {
      expect(normalizeAngle(45)).toBe(45);
      expect(normalizeAngle(360)).toBe(0);
      expect(normalizeAngle(450)).toBe(90);
      expect(normalizeAngle(720)).toBe(0);
    });

    it('should normalize negative angles to positive equivalents', () => {
      expect(normalizeAngle(-45)).toBe(315);
      expect(normalizeAngle(-90)).toBe(270);
      expect(Math.abs(normalizeAngle(-360))).toBe(0); // Handle -0 vs 0
      expect(normalizeAngle(-450)).toBe(270);
    });

    it('should handle zero', () => {
      expect(normalizeAngle(0)).toBe(0);
    });
  });

  describe('calculateItemTransform', () => {
    const ringRadius = 300;

    it('should calculate correct transform for 3 items', () => {
      const totalItems = 3;
      const rotation = 0;

      // Item 0 should be at front center (0 degrees)
      const transform0 = calculateItemTransform(0, totalItems, rotation, ringRadius);
      expect(transform0).toContain('translate3d(0px, 0');
      expect(transform0).toContain('rotateY(0deg)');

      // Item 1 should be at 120 degrees
      const transform1 = calculateItemTransform(1, totalItems, rotation, ringRadius);
      expect(transform1).toMatch(/translate3d\([^,]+,\s*0,/);
      expect(transform1).toContain('rotateY(-120deg)');

      // Item 2 should be at 240 degrees
      const transform2 = calculateItemTransform(2, totalItems, rotation, ringRadius);
      expect(transform2).toMatch(/translate3d\([^,]+,\s*0,/);
      expect(transform2).toContain('rotateY(-240deg)');
    });

    it('should calculate correct transform for 6 items', () => {
      const totalItems = 6;
      const rotation = 0;

      // Item 0 at 0 degrees
      const transform0 = calculateItemTransform(0, totalItems, rotation, ringRadius);
      expect(transform0).toContain('rotateY(0deg)');

      // Item 3 at 180 degrees (opposite side)
      const transform3 = calculateItemTransform(3, totalItems, rotation, ringRadius);
      expect(transform3).toContain('rotateY(-180deg)');
    });

    it('should calculate correct transform for 12 items', () => {
      const totalItems = 12;
      const rotation = 0;

      // Each item should be 30 degrees apart
      for (let i = 0; i < totalItems; i++) {
        const transform = calculateItemTransform(i, totalItems, rotation, ringRadius);
        const expectedAngle = i * 30;
        const expectedRotation = expectedAngle === 0 ? 'rotateY(0deg)' : `rotateY(-${expectedAngle}deg)`;
        expect(transform).toContain(expectedRotation);
      }
    });

    it('should apply rotation offset correctly', () => {
      const totalItems = 6;
      const rotation = 60; // Rotate by 60 degrees

      const transform0 = calculateItemTransform(0, totalItems, rotation, ringRadius);
      expect(transform0).toContain('rotateY(-60deg)');

      const transform1 = calculateItemTransform(1, totalItems, rotation, ringRadius);
      expect(transform1).toContain('rotateY(-120deg)');
    });

    it('should handle negative rotation', () => {
      const totalItems = 6;
      const rotation = -60;

      const transform0 = calculateItemTransform(0, totalItems, rotation, ringRadius);
      expect(transform0).toContain('rotateY(60deg)');
    });
  });

  describe('calculateItemStyle', () => {
    const ringRadius = 300;

    it('should calculate maximum scale and opacity for front items', () => {
      const z = ringRadius; // Item at front
      const style = calculateItemStyle(z, ringRadius);

      expect(style.scale).toBe(1.0);
      expect(style.opacity).toBe(1.0);
      expect(style.zIndex).toBe(100);
    });

    it('should calculate minimum scale and opacity for back items', () => {
      const z = -ringRadius; // Item at back
      const style = calculateItemStyle(z, ringRadius);

      expect(style.scale).toBe(0.6);
      expect(style.opacity).toBe(0.4);
      expect(style.zIndex).toBe(0);
    });

    it('should calculate intermediate values for middle positions', () => {
      const z = 0; // Item at middle (side)
      const style = calculateItemStyle(z, ringRadius);

      expect(style.scale).toBe(0.8);
      expect(style.opacity).toBe(0.7);
      expect(style.zIndex).toBe(50);
    });

    it('should produce values within expected ranges', () => {
      const testPositions = [-ringRadius, -ringRadius / 2, 0, ringRadius / 2, ringRadius];

      testPositions.forEach((z) => {
        const style = calculateItemStyle(z, ringRadius);

        expect(style.scale).toBeGreaterThanOrEqual(0.6);
        expect(style.scale).toBeLessThanOrEqual(1.0);
        expect(style.opacity).toBeGreaterThanOrEqual(0.4);
        expect(style.opacity).toBeLessThanOrEqual(1.0);
        expect(style.zIndex).toBeGreaterThanOrEqual(0);
        expect(style.zIndex).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('calculateZPosition', () => {
    const ringRadius = 300;

    it('should calculate correct z-position for 3 items', () => {
      const totalItems = 3;
      const rotation = 0;

      // Item 0 at front (z = ringRadius)
      const z0 = calculateZPosition(0, totalItems, rotation, ringRadius);
      expect(z0).toBeCloseTo(ringRadius, 1);

      // Item 1 at 120 degrees (z negative)
      const z1 = calculateZPosition(1, totalItems, rotation, ringRadius);
      expect(z1).toBeCloseTo(-ringRadius / 2, 1);

      // Item 2 at 240 degrees (z negative)
      const z2 = calculateZPosition(2, totalItems, rotation, ringRadius);
      expect(z2).toBeCloseTo(-ringRadius / 2, 1);
    });

    it('should calculate correct z-position for 6 items', () => {
      const totalItems = 6;
      const rotation = 0;

      // Item 0 at front
      const z0 = calculateZPosition(0, totalItems, rotation, ringRadius);
      expect(z0).toBeCloseTo(ringRadius, 1);

      // Item 3 at back (180 degrees)
      const z3 = calculateZPosition(3, totalItems, rotation, ringRadius);
      expect(z3).toBeCloseTo(-ringRadius, 1);
    });

    it('should handle rotation offset', () => {
      const totalItems = 6;
      const rotation = 60;

      // With 60 degree rotation, item 0 is no longer at front
      const z0 = calculateZPosition(0, totalItems, rotation, ringRadius);
      expect(z0).toBeLessThan(ringRadius);
    });
  });

  describe('calculateFocusedIndex', () => {
    it('should identify focused item for 3 items', () => {
      const totalItems = 3;

      expect(Math.abs(calculateFocusedIndex(0, totalItems))).toBe(0); // Handle -0 vs 0
      expect(calculateFocusedIndex(-120, totalItems)).toBe(1);
      expect(calculateFocusedIndex(-240, totalItems)).toBe(2);
    });

    it('should identify focused item for 6 items', () => {
      const totalItems = 6;

      expect(Math.abs(calculateFocusedIndex(0, totalItems))).toBe(0); // Handle -0 vs 0
      expect(calculateFocusedIndex(-60, totalItems)).toBe(1);
      expect(calculateFocusedIndex(-120, totalItems)).toBe(2);
      expect(calculateFocusedIndex(-180, totalItems)).toBe(3);
    });

    it('should identify focused item for 12 items', () => {
      const totalItems = 12;

      expect(Math.abs(calculateFocusedIndex(0, totalItems))).toBe(0); // Handle -0 vs 0
      expect(calculateFocusedIndex(-30, totalItems)).toBe(1);
      expect(calculateFocusedIndex(-90, totalItems)).toBe(3);
      expect(calculateFocusedIndex(-180, totalItems)).toBe(6);
    });

    it('should handle positive rotation angles', () => {
      const totalItems = 6;

      expect(calculateFocusedIndex(60, totalItems)).toBe(5);
      expect(calculateFocusedIndex(120, totalItems)).toBe(4);
    });

    it('should handle angles beyond 360 degrees', () => {
      const totalItems = 6;

      expect(Math.abs(calculateFocusedIndex(-360, totalItems))).toBe(0); // Handle -0 vs 0
      // -420 degrees = -60 degrees normalized = 300 degrees = item 5
      const result = calculateFocusedIndex(-420, totalItems);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(totalItems);
      expect(Math.abs(calculateFocusedIndex(360, totalItems))).toBe(0); // Handle -0 vs 0
    });
  });

  describe('easeInOutCubic', () => {
    it('should return 0 at start (t=0)', () => {
      expect(easeInOutCubic(0)).toBe(0);
    });

    it('should return 1 at end (t=1)', () => {
      expect(easeInOutCubic(1)).toBe(1);
    });

    it('should return 0.5 at midpoint (t=0.5)', () => {
      expect(easeInOutCubic(0.5)).toBe(0.5);
    });

    it('should produce smooth acceleration in first half', () => {
      const t1 = easeInOutCubic(0.1);
      const t2 = easeInOutCubic(0.2);
      const t3 = easeInOutCubic(0.3);

      // Values should increase
      expect(t2).toBeGreaterThan(t1);
      expect(t3).toBeGreaterThan(t2);

      // Rate of change should increase (acceleration)
      const delta1 = t2 - t1;
      const delta2 = t3 - t2;
      expect(delta2).toBeGreaterThan(delta1);
    });

    it('should produce smooth deceleration in second half', () => {
      const t1 = easeInOutCubic(0.7);
      const t2 = easeInOutCubic(0.8);
      const t3 = easeInOutCubic(0.9);

      // Values should increase
      expect(t2).toBeGreaterThan(t1);
      expect(t3).toBeGreaterThan(t2);

      // Rate of change should decrease (deceleration)
      const delta1 = t2 - t1;
      const delta2 = t3 - t2;
      expect(delta2).toBeLessThan(delta1);
    });

    it('should produce values between 0 and 1 for inputs between 0 and 1', () => {
      for (let t = 0; t <= 1; t += 0.1) {
        const result = easeInOutCubic(t);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('easeOutCubic', () => {
    it('should return 0 at start (t=0)', () => {
      expect(easeOutCubic(0)).toBe(0);
    });

    it('should return 1 at end (t=1)', () => {
      expect(easeOutCubic(1)).toBe(1);
    });

    it('should produce deceleration throughout', () => {
      const t1 = easeOutCubic(0.2);
      const t2 = easeOutCubic(0.4);
      const t3 = easeOutCubic(0.6);
      const t4 = easeOutCubic(0.8);

      // Values should increase
      expect(t2).toBeGreaterThan(t1);
      expect(t3).toBeGreaterThan(t2);
      expect(t4).toBeGreaterThan(t3);

      // Rate of change should decrease (deceleration)
      const delta1 = t2 - t1;
      const delta2 = t3 - t2;
      const delta3 = t4 - t3;
      expect(delta2).toBeLessThan(delta1);
      expect(delta3).toBeLessThan(delta2);
    });

    it('should produce values between 0 and 1 for inputs between 0 and 1', () => {
      for (let t = 0; t <= 1; t += 0.1) {
        const result = easeOutCubic(t);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(1);
      }
    });

    it('should start faster than easeInOutCubic', () => {
      const t = 0.2;
      const easeOut = easeOutCubic(t);
      const easeInOut = easeInOutCubic(t);

      // easeOutCubic should progress faster at the beginning
      expect(easeOut).toBeGreaterThan(easeInOut);
    });
  });
});