import { PartialTemplateValidator } from '../../../src/notifications/utils/partial-template-validator';
import { TemplateValidationError } from '../../../src/notifications/errors/template-errors';

describe('PartialTemplateValidator', () => {
  describe('validatePartialTemplate', () => {
    it('should pass validation for valid email header partial', () => {
      const content = '<div class="email-header"><h1 class="company-name">{{companyName}}</h1></div>';

      expect(() => {
        PartialTemplateValidator.validatePartialTemplate('email-header', content);
      }).not.toThrow();
    });

    it('should fail validation for empty content', () => {
      expect(() => {
        PartialTemplateValidator.validatePartialTemplate('email-header', '');
      }).toThrow(TemplateValidationError);
    });

    it('should fail validation for unbalanced HTML tags', () => {
      const content = '<div class="email-header"><h1>{{companyName}}</div>';

      expect(() => {
        PartialTemplateValidator.validatePartialTemplate('email-header', content);
      }).toThrow(TemplateValidationError);
    });

    it('should fail validation for dangerous content', () => {
      const content = '<div class="email-header"><script>alert("xss")</script></div>';

      expect(() => {
        PartialTemplateValidator.validatePartialTemplate('email-header', content);
      }).toThrow(TemplateValidationError);
    });

    it('should fail validation for unbalanced Handlebars expressions', () => {
      const content = '<div class="email-header">{{companyName</div>';

      expect(() => {
        PartialTemplateValidator.validatePartialTemplate('email-header', content);
      }).toThrow(TemplateValidationError);
    });
  });

  describe('getExpectedParameters', () => {
    it('should return correct parameters for email-header', () => {
      const params = PartialTemplateValidator.getExpectedParameters('email-header');
      expect(params).toEqual(['companyName', 'tagline']);
    });

    it('should return correct parameters for button', () => {
      const params = PartialTemplateValidator.getExpectedParameters('button');
      expect(params).toEqual(['text', 'url', 'style']);
    });

    it('should return empty array for unknown partial', () => {
      const params = PartialTemplateValidator.getExpectedParameters('unknown');
      expect(params).toEqual([]);
    });
  });

  describe('validatePartialParameters', () => {
    it('should return no errors when all expected parameters are present', () => {
      const content = '<a href="{{url}}" class="btn btn-{{style}}">{{text}}</a>';
      const expectedParams = ['text', 'url', 'style'];

      const errors = PartialTemplateValidator.validatePartialParameters('button', content, expectedParams);
      expect(errors).toEqual([]);
    });

    it('should return errors for missing parameters', () => {
      const content = '<a href="{{url}}" class="btn">Click me</a>';
      const expectedParams = ['text', 'url', 'style'];

      const errors = PartialTemplateValidator.validatePartialParameters('button', content, expectedParams);
      expect(errors).toContain("Expected parameter 'text' not found in partial template");
      expect(errors).toContain("Expected parameter 'style' not found in partial template");
    });
  });
});