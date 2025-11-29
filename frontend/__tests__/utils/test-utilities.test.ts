/**
 * Test Utilities Verification Tests
 *
 * Tests to verify that the test utilities are working correctly.
 */

import {
  countComponentLines,
  isRefactoringCandidate,
  comparePropsInterface,
  extractEventHandlers,
} from './component-comparison';

import {
  componentNameArbitrary,
  hookNameArbitrary,
  lineCountArbitrary,
  DEFAULT_NUM_RUNS,
} from './property-test-helpers';

import * as fc from 'fast-check';

describe('Test Utilities', () => {
  describe('Component Comparison Utilities', () => {
    it('should count lines correctly', () => {
      const content = 'line1\nline2\nline3';
      expect(countComponentLines(content)).toBe(3);
    });

    it('should identify refactoring candidates', () => {
      const shortContent = Array(299).fill('line').join('\n');
      const longContent = Array(301).fill('line').join('\n');

      expect(isRefactoringCandidate(shortContent)).toBe(false);
      expect(isRefactoringCandidate(longContent)).toBe(true);
    });

    it('should compare props interfaces', () => {
      const original = { name: 'test', value: 123, onClick: () => {} };
      const refactored = { name: 'test', value: 123, onClick: () => {}, extra: 'new' };

      expect(comparePropsInterface(original, refactored)).toBe(true);
    });

    it('should extract event handlers', () => {
      const props = {
        name: 'test',
        onClick: () => {},
        onHover: () => {},
        value: 123,
      };

      const handlers = extractEventHandlers(props);
      expect(handlers).toEqual(['onClick', 'onHover']);
    });
  });

  describe('Property Test Helpers', () => {
    it('should generate valid component names', () => {
      fc.assert(
        fc.property(componentNameArbitrary, (name) => {
          // Component names should start with uppercase
          expect(name[0]).toMatch(/[A-Z]/);
          // Should only contain alphanumeric characters
          expect(name).toMatch(/^[A-Z][a-zA-Z0-9]*$/);
        }),
        { numRuns: 50 }
      );
    });

    it('should generate valid hook names', () => {
      fc.assert(
        fc.property(hookNameArbitrary, (name) => {
          // Hook names should start with 'use'
          expect(name).toMatch(/^use[A-Z]/);
        }),
        { numRuns: 50 }
      );
    });

    it('should generate valid line counts', () => {
      fc.assert(
        fc.property(lineCountArbitrary, (count) => {
          expect(count).toBeGreaterThan(0);
          expect(count).toBeLessThanOrEqual(2000);
        }),
        { numRuns: 50 }
      );
    });

    it('should have correct default number of runs', () => {
      expect(DEFAULT_NUM_RUNS).toBe(100);
    });
  });
});
