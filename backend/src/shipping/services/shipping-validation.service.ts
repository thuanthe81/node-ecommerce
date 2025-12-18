import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ShippingMethod } from '@prisma/client';

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

export interface TranslationValidationResult extends ValidationResult {
  missingTranslations: {
    methodId: string;
    missingFields: string[];
  }[];
}

@Injectable()
export class ShippingValidationService {
  private readonly logger = new Logger(ShippingValidationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Validate that all active shipping methods have complete translations
   * Returns validation result with warnings for missing translations
   */
  async validateActiveMethodTranslations(): Promise<TranslationValidationResult> {
    const activeMethods = await this.prisma.shippingMethod.findMany({
      where: { isActive: true },
    });

    const missingTranslations: { methodId: string; missingFields: string[] }[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    for (const method of activeMethods) {
      const missingFields = this.checkTranslationCompleteness(method);

      if (missingFields.length > 0) {
        missingTranslations.push({
          methodId: method.methodId,
          missingFields,
        });

        const warningMessage = `Shipping method '${method.methodId}' is missing translations for: ${missingFields.join(', ')}`;
        warnings.push(warningMessage);
        this.logger.warn(warningMessage);
      }
    }

    return {
      isValid: missingTranslations.length === 0,
      warnings,
      errors,
      missingTranslations,
    };
  }

  /**
   * Validate a single shipping method's translation completeness
   */
  validateMethodTranslations(method: ShippingMethod): ValidationResult {
    const missingFields = this.checkTranslationCompleteness(method);
    const warnings: string[] = [];

    if (missingFields.length > 0) {
      const warningMessage = `Shipping method '${method.methodId}' is missing translations for: ${missingFields.join(', ')}`;
      warnings.push(warningMessage);

      if (method.isActive) {
        this.logger.warn(warningMessage);
      }
    }

    return {
      isValid: missingFields.length === 0,
      warnings,
      errors: [],
    };
  }

  /**
   * Check which translation fields are missing for a shipping method
   */
  private checkTranslationCompleteness(method: ShippingMethod): string[] {
    const missingFields: string[] = [];

    // Check English translations
    if (!method.nameEn || method.nameEn.trim() === '') {
      missingFields.push('nameEn');
    }
    if (!method.descriptionEn || method.descriptionEn.trim() === '') {
      missingFields.push('descriptionEn');
    }

    // Check Vietnamese translations
    if (!method.nameVi || method.nameVi.trim() === '') {
      missingFields.push('nameVi');
    }
    if (!method.descriptionVi || method.descriptionVi.trim() === '') {
      missingFields.push('descriptionVi');
    }

    return missingFields;
  }

  /**
   * Get admin warnings for incomplete translations
   * Returns user-friendly messages for admin interface
   */
  async getAdminTranslationWarnings(): Promise<string[]> {
    const validationResult = await this.validateActiveMethodTranslations();

    if (validationResult.isValid) {
      return [];
    }

    const adminWarnings: string[] = [];

    for (const missing of validationResult.missingTranslations) {
      const englishMissing = missing.missingFields.filter(field => field.includes('En'));
      const vietnameseMissing = missing.missingFields.filter(field => field.includes('Vi'));

      if (englishMissing.length > 0) {
        adminWarnings.push(
          `Shipping method "${missing.methodId}" is missing English translations: ${englishMissing.join(', ')}`
        );
      }

      if (vietnameseMissing.length > 0) {
        adminWarnings.push(
          `Shipping method "${missing.methodId}" is missing Vietnamese translations: ${vietnameseMissing.join(', ')}`
        );
      }
    }

    return adminWarnings;
  }

  /**
   * Validate shipping method data integrity
   * Checks for corrupted or invalid data
   */
  async validateMethodDataIntegrity(method: ShippingMethod): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!method.methodId || method.methodId.trim() === '') {
      errors.push('Method ID is required');
    }

    // Validate base rate
    if (method.baseRate === null || method.baseRate === undefined) {
      errors.push('Base rate is required');
    } else {
      const baseRateNum = Number(method.baseRate);
      if (isNaN(baseRateNum) || baseRateNum < 0) {
        errors.push('Base rate must be a non-negative number');
      }
    }

    // Validate estimated days
    if (method.estimatedDaysMin < 0 || method.estimatedDaysMax < 0) {
      errors.push('Estimated days must be non-negative');
    }

    if (method.estimatedDaysMin > method.estimatedDaysMax) {
      errors.push('Minimum estimated days cannot be greater than maximum estimated days');
    }

    // Validate weight configuration
    if (method.weightThreshold !== null) {
      const weightThresholdNum = Number(method.weightThreshold);
      if (isNaN(weightThresholdNum) || weightThresholdNum < 0) {
        errors.push('Weight threshold must be non-negative');
      }
    }

    if (method.weightRate !== null) {
      const weightRateNum = Number(method.weightRate);
      if (isNaN(weightRateNum) || weightRateNum < 0) {
        errors.push('Weight rate must be non-negative');
      }
    }

    // Validate free shipping threshold
    if (method.freeShippingThreshold !== null) {
      const freeShippingThresholdNum = Number(method.freeShippingThreshold);
      if (isNaN(freeShippingThresholdNum) || freeShippingThresholdNum < 0) {
        errors.push('Free shipping threshold must be non-negative');
      }
    }

    // Validate regional pricing if present
    if (method.regionalPricing) {
      try {
        const pricing = method.regionalPricing as Record<string, number>;
        for (const [region, price] of Object.entries(pricing)) {
          if (typeof price !== 'number' || price < 0) {
            errors.push(`Invalid regional pricing for ${region}: must be a non-negative number`);
          }
        }
      } catch (error) {
        errors.push('Regional pricing data is corrupted');
      }
    }

    if (errors.length > 0) {
      this.logger.error(`Data integrity validation failed for method ${method.methodId}: ${errors.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
    };
  }

  /**
   * Exclude invalid shipping methods from results
   * Returns only methods that pass data integrity validation
   */
  async filterValidMethods(methods: ShippingMethod[]): Promise<ShippingMethod[]> {
    const validMethods: ShippingMethod[] = [];

    for (const method of methods) {
      const validation = await this.validateMethodDataIntegrity(method);

      if (validation.isValid) {
        validMethods.push(method);
      } else {
        this.logger.error(
          `Excluding corrupted shipping method ${method.methodId} from results: ${validation.errors.join(', ')}`
        );
      }
    }

    return validMethods;
  }
}