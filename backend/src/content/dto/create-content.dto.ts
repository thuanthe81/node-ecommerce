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
  @IsString()
  @Matches(/^(https?:\/\/|\/|\.\/|\.\.\/)/i, {
    message: 'imageUrl must be a valid URL or relative path',
  })
  imageUrl?: string;

  @IsOptional()
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
}
