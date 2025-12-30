/**
 * Email Validation Error Handler Utility
 *
 * Provides specialized error handling and logging for email uniqueness validation
 * and related database constraint violations.
 */

import { Logger, BadRequestException, ConflictException } from '@nestjs/common';

export interface EmailValidationContext {
  email: string;
  operation: string;
  userId?: string;
  excludeUserId?: string;
  provider?: string;
  additionalData?: any;
}

export interface EmailValidationResult {
  isValid: boolean;
  errorMessage?: string;
  errorType?: 'CONFLICT' | 'BAD_REQUEST';
  logData?: any;
}

export class EmailValidationErrorHandler {
  private static readonly logger = new Logger(EmailValidationErrorHandler.name);

  /**
   * Validate email uniqueness with comprehensive logging
   */
  static async validateEmailUniqueness(
    email: string,
    checkFunction: (email: string) => Promise<any>,
    context: EmailValidationContext
  ): Promise<EmailValidationResult> {
    const logContext = {
      ...context,
      timestamp: new Date().toISOString(),
    };

    this.logger.debug('Email uniqueness validation started', logContext);

    try {
      const existingUser = await checkFunction(email);

      if (existingUser && existingUser.id !== context.excludeUserId) {
        const logData = {
          ...logContext,
          existingUserId: existingUser.id,
          conflict: true,
        };

        this.logger.warn('Email uniqueness validation failed - email already exists', logData);

        return {
          isValid: false,
          errorMessage: this.getEmailConflictMessage(context.operation),
          errorType: 'CONFLICT',
          logData,
        };
      }

      this.logger.debug('Email uniqueness validation passed', logContext);

      return { isValid: true };
    } catch (error) {
      const logData = {
        ...logContext,
        error: error.message,
        stack: error.stack,
      };

      this.logger.error('Email uniqueness validation error', logData);

      return {
        isValid: false,
        errorMessage: 'Email validation failed. Please try again.',
        errorType: 'BAD_REQUEST',
        logData,
      };
    }
  }

  /**
   * Handle database constraint violations for email-related operations
   */
  static handleEmailConstraintViolation(error: any, context: EmailValidationContext): Error {
    const logData = {
      ...context,
      error: error.message,
      errorCode: error.code,
      constraint: error.meta?.target,
      timestamp: new Date().toISOString(),
    };

    this.logger.error('Email-related database constraint violation', logData);

    // Handle Prisma unique constraint violations
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      const message = this.getEmailConflictMessage(context.operation);
      return new ConflictException(message);
    }

    // Handle other database errors
    if (error.code === 'P2025') {
      return new BadRequestException('User not found');
    }

    if (error.code === 'P1001' || error.code === 'P1002') {
      return new BadRequestException('Database connection error. Please try again later.');
    }

    // Default to original error
    return error;
  }

  /**
   * Get appropriate error message based on operation type
   */
  private static getEmailConflictMessage(operation: string): string {
    switch (operation) {
      case 'registration':
        return 'An account with this email address already exists. Please use a different email or try logging in.';
      case 'email_update':
        return 'Email address is already in use by another account';
      case 'oauth_registration':
        return 'An account with this email address already exists. Please try logging in with your existing account.';
      default:
        return 'Email address is already in use';
    }
  }

  /**
   * Log email validation operation for debugging
   */
  static logEmailValidationOperation(context: EmailValidationContext): void {
    const logData = {
      ...context,
      // Redact email for privacy in production logs
      email: this.redactEmail(context.email),
      timestamp: new Date().toISOString(),
    };

    this.logger.log(`Email validation operation: ${context.operation}`, logData);
  }

  /**
   * Log email validation success
   */
  static logEmailValidationSuccess(context: EmailValidationContext): void {
    const logData = {
      ...context,
      email: this.redactEmail(context.email),
      timestamp: new Date().toISOString(),
    };

    this.logger.log(`Email validation successful: ${context.operation}`, logData);
  }

  /**
   * Log email validation failure
   */
  static logEmailValidationFailure(context: EmailValidationContext, error: any): void {
    const logData = {
      ...context,
      email: this.redactEmail(context.email),
      error: error.message || error,
      timestamp: new Date().toISOString(),
    };

    this.logger.warn(`Email validation failed: ${context.operation}`, logData);
  }

  /**
   * Create appropriate exception based on validation result
   */
  static createExceptionFromValidation(result: EmailValidationResult): Error {
    if (result.isValid) {
      throw new Error('Cannot create exception for valid result');
    }

    switch (result.errorType) {
      case 'CONFLICT':
        return new ConflictException(result.errorMessage);
      case 'BAD_REQUEST':
        return new BadRequestException(result.errorMessage);
      default:
        return new BadRequestException(result.errorMessage || 'Email validation failed');
    }
  }

  /**
   * Redact email for privacy in logs (show first 2 chars and domain)
   */
  private static redactEmail(email: string): string {
    if (!email || email.length < 3) {
      return '***';
    }

    const [localPart, domain] = email.split('@');
    if (!domain) {
      return '***';
    }

    const redactedLocal = localPart.length > 2
      ? localPart.substring(0, 2) + '*'.repeat(localPart.length - 2)
      : '**';

    return `${redactedLocal}@${domain}`;
  }

  /**
   * Validate email format (basic validation)
   */
  static isValidEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Log email format validation
   */
  static logEmailFormatValidation(email: string, isValid: boolean, operation: string): void {
    const logData = {
      email: this.redactEmail(email),
      isValid,
      operation,
      timestamp: new Date().toISOString(),
    };

    if (isValid) {
      this.logger.debug('Email format validation passed', logData);
    } else {
      this.logger.warn('Email format validation failed', logData);
    }
  }

  /**
   * Handle OAuth email conflicts with enhanced logging
   */
  static handleOAuthEmailConflict(
    email: string,
    provider: string,
    existingUserId: string,
    operation: string
  ): ConflictException {
    const logData = {
      email: this.redactEmail(email),
      provider,
      existingUserId,
      operation,
      timestamp: new Date().toISOString(),
    };

    this.logger.warn('OAuth email conflict detected', logData);

    return new ConflictException(
      'An account with this email address already exists. Please try logging in with your existing account.'
    );
  }
}