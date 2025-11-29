import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, Matches } from 'class-validator';
import { CreateCategoryDto } from './create-category.dto';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  @IsOptional()
  @IsString()
  @Matches(/^(https?:\/\/|\/|\.\/|\.\.\/)/i, {
    message: 'imageUrl must be a valid URL or relative path',
  })
  imageUrl?: string;
}
