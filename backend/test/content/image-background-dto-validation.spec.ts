import { validate } from 'class-validator';
import { CreateContentDto } from '../../src/content/dto/create-content.dto';
import { UpdateContentDto } from '../../src/content/dto/update-content.dto';
import { ContentType } from '@prisma/client';

describe('Content DTOs - Image Background Validation', () => {
  describe('CreateContentDto', () => {
    it('should accept valid imageBackground URL', async () => {
      const dto = new CreateContentDto();
      dto.slug = 'test-blog';
      dto.type = ContentType.BLOG;
      dto.titleEn = 'Test Blog';
      dto.titleVi = 'Blog Test';
      dto.contentEn = 'Test content';
      dto.contentVi = 'Nội dung test';
      dto.excerptEn = 'Test excerpt';
      dto.excerptVi = 'Tóm tắt test';
      dto.authorName = 'Test Author';
      dto.imageBackground = '/uploads/background.jpg';

      const errors = await validate(dto);
      const imageBackgroundErrors = errors.filter(error =>
        error.property === 'imageBackground'
      );

      expect(imageBackgroundErrors).toHaveLength(0);
    });

    it('should accept valid imageBackground HTTPS URL', async () => {
      const dto = new CreateContentDto();
      dto.slug = 'test-blog';
      dto.type = ContentType.BLOG;
      dto.titleEn = 'Test Blog';
      dto.titleVi = 'Blog Test';
      dto.contentEn = 'Test content';
      dto.contentVi = 'Nội dung test';
      dto.excerptEn = 'Test excerpt';
      dto.excerptVi = 'Tóm tắt test';
      dto.authorName = 'Test Author';
      dto.imageBackground = 'https://example.com/background.jpg';

      const errors = await validate(dto);
      const imageBackgroundErrors = errors.filter(error =>
        error.property === 'imageBackground'
      );

      expect(imageBackgroundErrors).toHaveLength(0);
    });

    it('should reject invalid imageBackground URL', async () => {
      const dto = new CreateContentDto();
      dto.slug = 'test-blog';
      dto.type = ContentType.BLOG;
      dto.titleEn = 'Test Blog';
      dto.titleVi = 'Blog Test';
      dto.contentEn = 'Test content';
      dto.contentVi = 'Nội dung test';
      dto.excerptEn = 'Test excerpt';
      dto.excerptVi = 'Tóm tắt test';
      dto.authorName = 'Test Author';
      dto.imageBackground = 'invalid-url';

      const errors = await validate(dto);
      const imageBackgroundErrors = errors.filter(error =>
        error.property === 'imageBackground'
      );

      expect(imageBackgroundErrors.length).toBeGreaterThan(0);
      expect(imageBackgroundErrors[0].constraints).toHaveProperty('matches');
    });

    it('should accept empty imageBackground', async () => {
      const dto = new CreateContentDto();
      dto.slug = 'test-blog';
      dto.type = ContentType.BLOG;
      dto.titleEn = 'Test Blog';
      dto.titleVi = 'Blog Test';
      dto.contentEn = 'Test content';
      dto.contentVi = 'Nội dung test';
      dto.excerptEn = 'Test excerpt';
      dto.excerptVi = 'Tóm tắt test';
      dto.authorName = 'Test Author';
      dto.imageBackground = '';

      const errors = await validate(dto);
      const imageBackgroundErrors = errors.filter(error =>
        error.property === 'imageBackground'
      );

      expect(imageBackgroundErrors).toHaveLength(0);
    });

    it('should accept undefined imageBackground', async () => {
      const dto = new CreateContentDto();
      dto.slug = 'test-blog';
      dto.type = ContentType.BLOG;
      dto.titleEn = 'Test Blog';
      dto.titleVi = 'Blog Test';
      dto.contentEn = 'Test content';
      dto.contentVi = 'Nội dung test';
      dto.excerptEn = 'Test excerpt';
      dto.excerptVi = 'Tóm tắt test';
      dto.authorName = 'Test Author';
      // imageBackground is undefined

      const errors = await validate(dto);
      const imageBackgroundErrors = errors.filter(error =>
        error.property === 'imageBackground'
      );

      expect(imageBackgroundErrors).toHaveLength(0);
    });
  });

  describe('UpdateContentDto', () => {
    it('should accept valid imageBackground URL in update', async () => {
      const dto = new UpdateContentDto();
      dto.imageBackground = '/uploads/new-background.jpg';

      const errors = await validate(dto);
      const imageBackgroundErrors = errors.filter(error =>
        error.property === 'imageBackground'
      );

      expect(imageBackgroundErrors).toHaveLength(0);
    });

    it('should reject invalid imageBackground URL in update', async () => {
      const dto = new UpdateContentDto();
      dto.imageBackground = 'not-a-valid-url';

      const errors = await validate(dto);
      const imageBackgroundErrors = errors.filter(error =>
        error.property === 'imageBackground'
      );

      expect(imageBackgroundErrors.length).toBeGreaterThan(0);
      expect(imageBackgroundErrors[0].constraints).toHaveProperty('matches');
    });
  });
});