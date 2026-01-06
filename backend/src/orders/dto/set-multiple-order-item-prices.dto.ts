import { IsArray, IsNotEmpty, IsNumber, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemPriceUpdate {
  @IsString()
  @IsNotEmpty()
  orderItemId: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0.01, { message: 'Price must be greater than 0' })
  price: number;
}

export class SetMultipleOrderItemPricesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemPriceUpdate)
  priceUpdates: OrderItemPriceUpdate[];
}