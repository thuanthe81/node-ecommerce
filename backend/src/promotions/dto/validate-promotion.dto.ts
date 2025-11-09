import { IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class ValidatePromotionDto {
  @IsString()
  code: string;

  @IsNumber()
  @Min(0)
  orderAmount: number;

  @IsOptional()
  @IsString()
  userId?: string;
}
