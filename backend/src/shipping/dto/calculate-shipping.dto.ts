import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ShippingItem {
  @IsNumber()
  @Min(0)
  weight: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  length?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  width?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  height?: number;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CalculateShippingDto {
  @IsString()
  @IsNotEmpty()
  destinationCity: string;

  @IsString()
  @IsNotEmpty()
  destinationState: string;

  @IsString()
  @IsNotEmpty()
  destinationPostalCode: string;

  @IsString()
  @IsNotEmpty()
  destinationCountry: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShippingItem)
  items: ShippingItem[];

  @IsNumber()
  @Min(0)
  @IsOptional()
  orderValue?: number;
}
