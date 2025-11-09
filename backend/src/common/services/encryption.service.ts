import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Encryption service for sensitive data
 * Uses AES-256-GCM for encryption
 */
@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private configService: ConfigService) {
    // Get encryption key from environment or generate a default one for development
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');

    if (!encryptionKey) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('ENCRYPTION_KEY must be set in production environment');
      }
      // Use a default key for development (NOT SECURE - only for development)
      console.warn(
        'WARNING: Using default encryption key. Set ENCRYPTION_KEY in production!',
      );
      this.key = crypto.scryptSync(
        'default-dev-key-change-in-production',
        'salt',
        32,
      );
    } else {
      // Derive key from the provided encryption key
      this.key = crypto.scryptSync(encryptionKey, 'salt', 32);
    }
  }

  /**
   * Encrypt a string value
   * @param text - Plain text to encrypt
   * @returns Encrypted string in format: iv:authTag:encryptedData
   */
  encrypt(text: string): string {
    if (!text) return text;

    try {
      // Generate a random initialization vector
      const iv = crypto.randomBytes(16);

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

      // Encrypt the text
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      // Return format: iv:authTag:encryptedData
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt an encrypted string
   * @param encryptedData - Encrypted string in format: iv:authTag:encryptedData
   * @returns Decrypted plain text
   */
  decrypt(encryptedData: string): string {
    if (!encryptedData) return encryptedData;

    try {
      // Split the encrypted data
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const [ivHex, authTagHex, encrypted] = parts;

      // Convert from hex
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt the text
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Hash a value using SHA-256 (one-way hash)
   * Useful for data that needs to be compared but not decrypted
   * @param text - Text to hash
   * @returns Hashed value
   */
  hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  /**
   * Generate a secure random token
   * @param length - Length of the token in bytes (default: 32)
   * @returns Random token as hex string
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Compare a plain text value with a hashed value
   * @param plainText - Plain text to compare
   * @param hashedText - Hashed text to compare against
   * @returns True if they match
   */
  compareHash(plainText: string, hashedText: string): boolean {
    const hash = this.hash(plainText);
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hashedText));
  }
}
