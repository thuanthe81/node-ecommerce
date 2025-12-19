import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { QueryProductsDto } from '../../../src/products/dto/query-products.dto';

describe('QueryProductsDto', () => {
  describe('isFeatured transformation', () => {
    it('should transform string "true" to boolean true', async () => {
      const plain = { isFeatured: 'true' };
      const dto = plainToInstance(QueryProductsDto, plain);

      expect(dto.isFeatured).toBe(true);
      expect(typeof dto.isFeatured).toBe('boolean');

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should transform string "false" to boolean false', async () => {
      const plain = { isFeatured: 'false' };
      const dto = plainToInstance(QueryProductsDto, plain);

      expect(dto.isFeatured).toBe(false);
      expect(typeof dto.isFeatured).toBe('boolean');

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should keep boolean true as boolean true', async () => {
      const plain = { isFeatured: true };
      const dto = plainToInstance(QueryProductsDto, plain);

      expect(dto.isFeatured).toBe(true);
      expect(typeof dto.isFeatured).toBe('boolean');

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should keep boolean false as boolean false', async () => {
      const plain = { isFeatured: false };
      const dto = plainToInstance(QueryProductsDto, plain);

      expect(dto.isFeatured).toBe(false);
      expect(typeof dto.isFeatured).toBe('boolean');

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should handle undefined', async () => {
      const plain = {};
      const dto = plainToInstance(QueryProductsDto, plain);

      expect(dto.isFeatured).toBeUndefined();

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('inStock transformation', () => {
    it('should transform string "true" to boolean true', async () => {
      const plain = { inStock: 'true' };
      const dto = plainToInstance(QueryProductsDto, plain);

      expect(dto.inStock).toBe(true);
      expect(typeof dto.inStock).toBe('boolean');

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should transform string "false" to boolean false', async () => {
      const plain = { inStock: 'false' };
      const dto = plainToInstance(QueryProductsDto, plain);

      expect(dto.inStock).toBe(false);
      expect(typeof dto.inStock).toBe('boolean');

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
