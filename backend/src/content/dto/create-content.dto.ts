import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUrl,
  ValidateIf,
  IsIn,
  Matches,
  IsArray,
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
  @ValidateIf((o) => o.imageUrl !== '' && o.imageUrl !== null)
  @IsString()
  @Matches(/^(https?:\/\/|\/|\.\/|\.\.\/)/i, {
    message: 'imageUrl must be a valid URL or relative path',
  })
  imageUrl?: string;

  @IsOptional()
  @ValidateIf((o) => o.linkUrl !== '' && o.linkUrl !== null)
  @IsString()
  @Matches(/^(https?:\/\/|\/|\.\/|\.\.\/)/i, {
    message: 'linkUrl must be a valid URL or relative path',
  })
  linkUrl?: string;

  @IsOptional()
  @IsInt()
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  // Homepage section specific fields
  @ValidateIf((o) => o.type === ContentType.HOMEPAGE_SECTION)
  @IsString()
  @IsOptional()
  buttonTextEn?: string;

  @ValidateIf((o) => o.type === ContentType.HOMEPAGE_SECTION)
  @IsString()
  @IsOptional()
  buttonTextVi?: string;

  @ValidateIf((o) => o.type === ContentType.HOMEPAGE_SECTION)
  @IsString()
  @IsIn(['centered', 'image-left', 'image-right'])
  @IsOptional()
  layout?: string;

  // Blog specific fields
  @ValidateIf((o) => o.type === ContentType.BLOG)
  @IsString()
  @IsOptional()
  authorName?: string;

  @ValidateIf((o) => o.type === ContentType.BLOG)
  @IsString()
  @IsOptional()
  excerptEn?: string;

  @ValidateIf((o) => o.type === ContentType.BLOG)
  @IsString()
  @IsOptional()
  excerptVi?: string;

  @ValidateIf((o) => o.type === ContentType.BLOG)
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categoryIds?: string[];
}
