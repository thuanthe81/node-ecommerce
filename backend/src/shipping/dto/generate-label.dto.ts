import { IsString, IsNotEmpty } from 'class-validator';

export class GenerateLabelDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  carrier: string;
}
