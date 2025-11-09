import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { SanitizeEmail } from '../../common/decorators/sanitize.decorator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  @SanitizeEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
