import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import {
  SanitizeString,
  SanitizeEmail,
} from '../../common/decorators/sanitize.decorator';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  @SanitizeEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @SanitizeString()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @SanitizeString()
  lastName: string;
}
