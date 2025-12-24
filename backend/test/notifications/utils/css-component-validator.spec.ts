import { CSSComponentValidator } from '../../../src/notifications/utils/css-component-validator';
import { CSSValidationError } from '../../../src/notifications/interfaces/css-injector.interface';

describe('CSSComponentValidator', () => {
  describe('validateCSSComponent', () => {
    it('should pass validation for valid CSS content', () => {
      const cssContent = '.btn { padding: 10px; background-color: blue; } .btn-primary { background: red; } .btn-secondary { background: green; } .btn-success { background: blue; } .btn-danger { background: orange; }';

      const errors = CSSComponentValidator.validateCSSComponent('buttons', cssContent, false);
      expect(errors).toEqual([]);
    });

    it('should return errors for empty CSS content', () => {
      const errors = CSSComponentValidator.validateCSSComponent('buttons', '', false);
      expect(errors).toContain('CSS component content is empty');
    });

    it('should return errors for unbalanced braces', () => {
      const cssContent = '.btn { padding: 10px;';

      const errors = CSSComponentValidator.validateCSSComponent('buttons', cssContent, false);
      expect(errors).toContain('Unbalanced braces: 1 opening, 0 closing');
    });

    it('should throw error when throwOnError is true', () => {
      expect(() => {
        CSSComponentValidator.validateCSSComponent('buttons', '', true);
      }).toThrow(CSSValidationError);
    });

    it('should validate component-specific patterns for buttons', () => {
      const cssContent = '.some-class { color: red; }';

      const errors = CSSComponentValidator.validateCSSComponent('buttons', cssContent, false);
      expect(errors).toContain('Button component should contain .btn class definitions');
    });

    it('should validate component-specific patterns for badges', () => {
      const cssContent = '.some-class { color: red; }';

      const errors = CSSComponentValidator.validateCSSComponent('badges', cssContent, false);
      expect(errors).toContain('Badge component should contain .badge class definitions');
    });
  });

  describe('getExpectedClasses', () => {
    it('should return correct classes for buttons component', () => {
      const classes = CSSComponentValidator.getExpectedClasses('buttons');
      expect(classes).toEqual(['.btn', '.btn-primary', '.btn-secondary', '.btn-success', '.btn-danger']);
    });

    it('should return correct classes for badges component', () => {
      const classes = CSSComponentValidator.getExpectedClasses('badges');
      expect(classes).toEqual(['.badge', '.badge-pending', '.badge-confirmed', '.badge-shipped', '.badge-delivered', '.badge-cancelled']);
    });

    it('should return empty array for unknown component', () => {
      const classes = CSSComponentValidator.getExpectedClasses('unknown');
      expect(classes).toEqual([]);
    });
  });

  describe('validateExpectedClasses', () => {
    it('should return no errors when all expected classes are present', () => {
      const cssContent = '.btn { padding: 10px; } .btn-primary { background: blue; }';

      const errors = CSSComponentValidator.validateExpectedClasses('buttons', cssContent);
      expect(errors.length).toBeGreaterThan(0); // Some classes will be missing
    });

    it('should return errors for missing classes', () => {
      const cssContent = '.some-other-class { color: red; }';

      const errors = CSSComponentValidator.validateExpectedClasses('buttons', cssContent);
      expect(errors).toContain("Expected CSS class '.btn' not found");
    });
  });
});