import { IsString, Matches } from 'class-validator';

export class CreateBlogCategoryDto {
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'Slug must be lowercase, alphanumeric, and use hyphens to separate words',
  })
  slug: string;

  @IsString()
  nameEn: string;

  @IsString()
  nameVi: string;
}
