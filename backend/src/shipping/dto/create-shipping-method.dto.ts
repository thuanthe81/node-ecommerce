import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  IsObject,
} from 'class-validator';

export class CreateShippingMethodDto {
  @IsString()
  @IsNotEmpty()
  methodId: string;

  @IsString()
  @IsNotEmpty()
  nameEn: string;

  @IsString()
  @IsNotEmpty()
  nameVi: string;

  @IsString()
  @IsNotEmpty()
  descriptionEn: string;

  @IsString()
  @IsNotEmpty()
  descriptionVi: string;

  @IsOptional()
  @IsString()
  carrier?: string;

  @IsNumber()
  @Min(0)
  baseRate: number;

  @IsInt()
  @Min(0)
  estimatedDaysMin: number;

  @IsInt()
  @Min(0)
  estimatedDaysMax: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weightThreshold?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weightRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  freeShippingThreshold?: number;

  @IsOptional()
  @IsObject()
  regionalPricing?: Record<string, number>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
