import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateBankTransferSettingsDto {
  @IsString()
  @IsNotEmpty()
  accountName: string;

  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @IsString()
  @IsNotEmpty()
  bankName: string;
}
