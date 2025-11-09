import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { AnalyticsEventType } from '@prisma/client';

export class AnalyticsQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(AnalyticsEventType)
  eventType?: AnalyticsEventType;

  @IsOptional()
  productId?: string;
}
