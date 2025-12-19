import { validate } from 'class-validator';
import { UpdateFooterSettingsDto } from './update-footer-settings.dto';

describe('UpdateFooterSettingsDto', () => {
  describe('URL validation', () => {
    it('should accept valid URLs', async () => {
      const dto = new UpdateFooterSettingsDto();
      dto.copyrightText = '© 2024 ALA Craft';
      dto.facebookUrl = 'https://facebook.com/alacraft';
      dto.twitterUrl = 'https://twitter.com/alacraft';
      dto.tiktokUrl = 'https://tiktok.com/@alacraft';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject invalid Facebook URL', async () => {
      const dto = new UpdateFooterSettingsDto();
      dto.copyrightText = '© 2024 ALA Craft';
      dto.facebookUrl = 'not-a-valid-url';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('facebookUrl');
      expect(errors[0].constraints).toHaveProperty('isUrl');
    });

    it('should reject invalid Twitter URL', async () => {
      const dto = new UpdateFooterSettingsDto();
      dto.copyrightText = '© 2024 ALA Craft';
      dto.twitterUrl = 'invalid url with spaces';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('twitterUrl');
      expect(errors[0].constraints).toHaveProperty('isUrl');
    });

    it('should reject invalid TikTok URL', async () => {
      const dto = new UpdateFooterSettingsDto();
      dto.copyrightText = '© 2024 ALA Craft';
      dto.tiktokUrl = 'just-some-text';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('tiktokUrl');
      expect(errors[0].constraints).toHaveProperty('isUrl');
    });

    it('should allow empty optional URL fields', async () => {
      const dto = new UpdateFooterSettingsDto();
      dto.copyrightText = '© 2024 ALA Craft';
      // Not setting any URL fields

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should require copyrightText', async () => {
      const dto = new UpdateFooterSettingsDto();
      // Not setting copyrightText

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('copyrightText');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });
  });
});
