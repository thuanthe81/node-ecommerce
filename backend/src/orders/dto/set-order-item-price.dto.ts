import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class SetOrderItemPriceDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(0.01, { message: 'Price must be greater than 0' })
  price: number;
}
