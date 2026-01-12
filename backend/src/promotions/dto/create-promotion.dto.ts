import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PromotionType } from '@prisma/client';

export class CreatePromotionDto {
  @IsString()
  code: string;

  @IsEnum(PromotionType)
  type: PromotionType;

  @Transform(({ value }) => typeof value === 'string' ? parseFloat(value) : value)
  @IsNumber()
  @Min(0)
  value: number;

  @Transform(({ value }) => value === undefined || value === null || value === '' ? undefined : (typeof value === 'string' ? parseFloat(value) : value))
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @Transform(({ value }) => value === undefined || value === null || value === '' ? undefined : (typeof value === 'string' ? parseFloat(value) : value))
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscountAmount?: number;

  @Transform(({ value }) => value === undefined || value === null || value === '' ? undefined : (typeof value === 'string' ? parseInt(value, 10) : value))
  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  @Transform(({ value }) => value === undefined || value === null || value === '' ? undefined : (typeof value === 'string' ? parseInt(value, 10) : value))
  @IsOptional()
  @IsNumber()
  @Min(1)
  perCustomerLimit?: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
