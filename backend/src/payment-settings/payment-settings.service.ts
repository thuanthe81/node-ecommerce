import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { isAbsolute } from 'path';

export interface BankTransferSettings {
  accountName: string;
  accountNumber: string;
  bankName: string;
  qrCodeUrl: string | null;
}

export interface UpdateBankTransferSettingsDto {
  accountName: string;
  accountNumber: string;
  bankName: string;
}

@Injectable()
export class PaymentSettingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get bank transfer settings
   * Returns the latest payment settings from database
   * Returns default empty settings when none configured
   */
  async getBankTransferSettings(): Promise<BankTransferSettings> {
    try {
      const settings = await this.prisma.paymentSettings.findFirst({
        orderBy: { updatedAt: 'desc' },
      });

      if (!settings) {
        // Return default empty settings when none configured
        return {
          accountName: '',
          accountNumber: '',
          bankName: '',
          qrCodeUrl: null,
        };
      }

      return {
        accountName: settings.accountName,
        accountNumber: settings.accountNumber,
        bankName: settings.bankName,
        qrCodeUrl: settings.qrCodeUrl,
      };
    } catch (error) {
      // Handle database errors gracefully
      console.error('Error fetching bank transfer settings:', error);
      throw new InternalServerErrorException(
        'Failed to fetch payment settings',
      );
    }
  }

  /**
   * Update bank transfer settings
   * Implements upsert logic to create or update payment settings
   * Handles QR code image upload to uploads/payment-qr/ directory
   * Returns updated settings after save
   */
  async updateBankTransferSettings(
    data: UpdateBankTransferSettingsDto,
    qrCodeFile?: Express.Multer.File,
  ): Promise<BankTransferSettings> {
    try {
      let qrCodeUrl: string | null = null;

      // Handle QR code image upload if provided
      if (qrCodeFile) {
        qrCodeUrl = await this.uploadQRCode(qrCodeFile);
      } else {
        // Preserve existing QR code URL if no new file is uploaded
        const existingSettings = await this.prisma.paymentSettings.findFirst({
          orderBy: { updatedAt: 'desc' },
        });
        qrCodeUrl = existingSettings?.qrCodeUrl || null;
      }

      // Get the existing settings to determine if we need to create or update
      const existingSettings = await this.prisma.paymentSettings.findFirst({
        orderBy: { updatedAt: 'desc' },
      });

      let settings;
      if (existingSettings) {
        // Update existing settings
        settings = await this.prisma.paymentSettings.update({
          where: { id: existingSettings.id },
          data: {
            accountName: data.accountName,
            accountNumber: data.accountNumber,
            bankName: data.bankName,
            qrCodeUrl,
          },
        });
      } else {
        // Create new settings
        settings = await this.prisma.paymentSettings.create({
          data: {
            accountName: data.accountName,
            accountNumber: data.accountNumber,
            bankName: data.bankName,
            qrCodeUrl,
          },
        });
      }

      return {
        accountName: settings.accountName,
        accountNumber: settings.accountNumber,
        bankName: settings.bankName,
        qrCodeUrl: settings.qrCodeUrl,
      };
    } catch (error) {
      console.error('Error updating bank transfer settings:', error);
      throw new InternalServerErrorException(
        'Failed to update payment settings',
      );
    }
  }

  /**
   * Upload QR code image to uploads/payment-qr/ directory
   * Returns the URL path to the uploaded image
   */
  private async uploadQRCode(file: Express.Multer.File): Promise<string> {
    try {
      // Generate unique filename
      const fileExtension = file.mimetype.split('/')[1];
      const filename = `qr-${Date.now()}.${fileExtension}`;

      // Define upload directory and file path
      const uploadDirEnv = process.env.UPLOAD_DIR || 'uploads';
      const baseUploadPath = isAbsolute(uploadDirEnv)
        ? uploadDirEnv
        : path.join(process.cwd(), uploadDirEnv);
      const uploadDir = path.join(baseUploadPath, 'payment-qr');
      const filepath = path.join(uploadDir, filename);

      // Create directory if it doesn't exist
      await fs.promises.mkdir(uploadDir, { recursive: true });

      // Write file to disk
      await fs.promises.writeFile(filepath, file.buffer);

      // Return URL path
      return `/uploads/payment-qr/${filename}`;
    } catch (error) {
      console.error('Error uploading QR code:', error);
      throw new InternalServerErrorException('Failed to upload QR code image');
    }
  }
}
