import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';
import {
  SanitizeString,
  SanitizeEmail,
} from '../../common/decorators/sanitize.decorator';

export class ContactFormDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @SanitizeString()
  name: string;

  @IsEmail()
  @SanitizeEmail()
  email: string;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  @SanitizeString()
  subject: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  @SanitizeString()
  message: string;
}
