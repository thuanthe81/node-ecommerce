import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUrl,
} from 'class-validator';
import { ContentType } from '@prisma/client';

export class CreateContentDto {
  @IsString()
  slug: string;

  @IsEnum(ContentType)
  type: ContentType;

  @IsString()
  titleEn: string;

  @IsString()
  titleVi: string;

  @IsString()
  contentEn: string;

  @IsString()
  contentVi: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsUrl()
  linkUrl?: string;

  @IsOptional()
  @IsInt()
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
