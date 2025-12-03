import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class UpdateFooterSettingsDto {
  @IsString()
  @IsNotEmpty()
  copyrightText: string;

  @IsString()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsUrl({}, { message: 'Google Maps URL must be a valid URL' })
  @IsOptional()
  googleMapsUrl?: string;

  @IsUrl({}, { message: 'Facebook URL must be a valid URL' })
  @IsOptional()
  facebookUrl?: string;

  @IsUrl({}, { message: 'Twitter URL must be a valid URL' })
  @IsOptional()
  twitterUrl?: string;

  @IsUrl({}, { message: 'TikTok URL must be a valid URL' })
  @IsOptional()
  tiktokUrl?: string;
}
