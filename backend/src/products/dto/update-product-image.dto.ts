import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductImageDto {
  @IsOptional()
  @IsString()
  altTextEn?: string;

  @IsOptional()
  @IsString()
  altTextVi?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  displayOrder?: number;
}
