import {
  IsString,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class UpdateAddressDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(200)
  fullName?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[0-9+\-\s()]+$/, { message: 'Phone number must be valid' })
  phone?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(500)
  addressLine1?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  addressLine2?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(100)
  city?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(100)
  state?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(20)
  postalCode?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(2)
  country?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
