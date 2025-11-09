import { IsEnum, IsOptional, IsString, IsObject } from 'class-validator';
import { AnalyticsEventType } from '@prisma/client';

export class CreateAnalyticsEventDto {
  @IsEnum(AnalyticsEventType)
  eventType: AnalyticsEventType;

  @IsString()
  sessionId: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
