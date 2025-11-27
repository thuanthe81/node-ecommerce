import { IsArray, IsNotEmpty, IsString, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ImageOrderItem {
  @IsString()
  @IsNotEmpty()
  imageId: string;

  @IsInt()
  @Min(0)
  displayOrder: number;
}

export class ReorderImagesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageOrderItem)
  images: ImageOrderItem[];
}
