import { IsEmail, IsOptional, IsIn } from 'class-validator';

export class ResendEmailDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsOptional()
  @IsIn(['en', 'vi'], { message: 'Locale must be either "en" or "vi"' })
  locale?: 'en' | 'vi';
}