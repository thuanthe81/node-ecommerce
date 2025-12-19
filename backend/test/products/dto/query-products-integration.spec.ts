import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { QueryProductsDto } from '../../../src/products/dto/query-products.dto';

describe('QueryProductsDto Integration', () => {
  let validationPipe: ValidationPipe;

  beforeEach(() => {
    validationPipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
    });
  });

  it('should transform query string with isFeatured=false correctly', async () => {
    // Simulate what happens when Express parses query string ?isFeatured=false
    const rawQuery = { isFeatured: 'false' };

    const transformed = await validationPipe.transform(rawQuery, {
      type: 'query',
      metatype: QueryProductsDto,
    });

    console.log('Transformed query:', transformed);
    console.log('isFeatured value:', transformed.isFeatured);
    console.log('isFeatured type:', typeof transformed.isFeatured);

    expect(transformed.isFeatured).toBe(false);
    expect(typeof transformed.isFeatured).toBe('boolean');
  });

  it('should transform query string with isFeatured=true correctly', async () => {
    const rawQuery = { isFeatured: 'true' };

    const transformed = await validationPipe.transform(rawQuery, {
      type: 'query',
      metatype: QueryProductsDto,
    });

    expect(transformed.isFeatured).toBe(true);
    expect(typeof transformed.isFeatured).toBe('boolean');
  });

  it('should handle missing isFeatured', async () => {
    const rawQuery = {};

    const transformed = await validationPipe.transform(rawQuery, {
      type: 'query',
      metatype: QueryProductsDto,
    });

    expect(transformed.isFeatured).toBeUndefined();
  });

  it('should transform inStock=false correctly', async () => {
    const rawQuery = { inStock: 'false' };

    const transformed = await validationPipe.transform(rawQuery, {
      type: 'query',
      metatype: QueryProductsDto,
    });

    expect(transformed.inStock).toBe(false);
    expect(typeof transformed.inStock).toBe('boolean');
  });
});
