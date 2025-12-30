/**
 * UserId Error Handler Utility
 *
 * Provides specialized error handling and logging for userId-related operations
 * including null-safe comparisons, access control validation, and debugging support.
 */

import { Logger, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

export interface UserIdContext {
  userId?: string | null;
  userRole?: string;
  operation: string;
  resourceId?: string;
  resourceType?: string;
  additionalData?: any;
}

export interface UserIdValidationResult {
  isValid: boolean;
  errorMessage?: string;
  errorType?: 'FORBIDDEN' | 'NOT_FOUND' | 'BAD_REQUEST';
  logData?: any;
}

export class UserIdErrorHandler {
  private static readonly logger = new Logger(UserIdErrorHandler.name);

  /**
   * Validate userId for order access with comprehensive logging
   * All orders now require authentication, so both orderUserId and requestUserId should be non-null
   */
  static validateOrderAccess(
    orderUserId: string,
    requestUserId: string,
    userRole?: string,
    orderId?: string
  ): UserIdValidationResult {
    const context = {
      orderUserId,
      requestUserId,
      userRole,
      orderId,
      operation: 'order_access_validation',
      timestamp: new Date().toISOString(),
    };

    // Admin users can access any order
    if (userRole === 'ADMIN') {
      this.logger.log('Admin order access granted', context);
      return { isValid: true };
    }

    // Since all orders now require authentication, both userIds should be non-null strings
    // Direct string comparison for authenticated users accessing their own orders
    if (orderUserId !== requestUserId) {
      const logData = {
        ...context,
        violation: 'authenticated_user_accessing_different_user_order',
      };
      this.logger.warn('Unauthorized order access attempt - authenticated user accessing different user order', logData);

      return {
        isValid: false,
        errorMessage: 'You do not have access to this order',
        errorType: 'FORBIDDEN',
        logData,
      };
    }

    // Valid case: authenticated user accessing their own order
    this.logger.log('Order access granted - authenticated user accessing own order', context);
    return { isValid: true };
  }

  /**
   * Validate address ownership for authenticated users only
   * Since all orders now require authentication, this method enforces strict address ownership
   */
  static validateAddressOwnership(
    addressUserId: string,
    requestUserId: string,
    addressId?: string,
    operation?: string
  ): UserIdValidationResult {
    const context = {
      addressUserId,
      requestUserId,
      addressId,
      operation: operation || 'address_ownership_validation',
      timestamp: new Date().toISOString(),
    };

    // Both userIds should be non-null strings for authenticated orders
    // Direct string comparison for address ownership validation
    if (addressUserId !== requestUserId) {
      const logData = {
        ...context,
        violation: 'authenticated_user_accessing_different_user_address',
      };
      this.logger.warn('Address ownership validation failed - userId mismatch', logData);

      return {
        isValid: false,
        errorMessage: 'Address does not belong to user',
        errorType: 'FORBIDDEN',
        logData,
      };
    }

    // Valid: authenticated user using their own address
    this.logger.log('Address ownership validation passed - authenticated user using own address', context);
    return { isValid: true };
  }

  /**
   * Log userId-related operation for debugging
   */
  static logUserIdOperation(context: UserIdContext): void {
    const logData = {
      ...context,
      timestamp: new Date().toISOString(),
    };

    this.logger.log(`UserId operation: ${context.operation}`, logData);
  }

  /**
   * Log userId-related error for debugging
   */
  static logUserIdError(context: UserIdContext, error: any): void {
    const logData = {
      ...context,
      error: error.message || error,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    };

    this.logger.error(`UserId operation failed: ${context.operation}`, logData);
  }

  /**
   * Create appropriate exception based on validation result
   */
  static createExceptionFromValidation(result: UserIdValidationResult): Error {
    if (result.isValid) {
      throw new Error('Cannot create exception for valid result');
    }

    switch (result.errorType) {
      case 'FORBIDDEN':
        return new ForbiddenException(result.errorMessage);
      case 'NOT_FOUND':
        return new NotFoundException(result.errorMessage);
      case 'BAD_REQUEST':
        return new BadRequestException(result.errorMessage);
      default:
        return new BadRequestException(result.errorMessage || 'Validation failed');
    }
  }

  /**
   * Normalize userId value (convert undefined to null)
   */
  static normalizeUserId(userId: string | null | undefined): string | null {
    return userId || null;
  }

  /**
   * Check if userId values are equal with null-safe comparison
   */
  static areUserIdsEqual(userId1: string | null | undefined, userId2: string | null | undefined): boolean {
    const normalized1 = this.normalizeUserId(userId1);
    const normalized2 = this.normalizeUserId(userId2);
    return normalized1 === normalized2;
  }

  /**
   * Get user type description for logging
   */
  static getUserType(userId: string | null | undefined): string {
    return userId ? 'authenticated' : 'guest';
  }

  /**
   * Validate and log database constraint violations related to userId
   */
  static handleDatabaseConstraintViolation(error: any, context: UserIdContext): Error {
    const logData = {
      ...context,
      error: error.message,
      errorCode: error.code,
      constraint: error.meta?.target,
      timestamp: new Date().toISOString(),
    };

    this.logger.error('Database constraint violation in userId operation', logData);

    // Handle specific constraint violations
    if (error.code === 'P2002') {
      if (error.meta?.target?.includes('email')) {
        return new BadRequestException('Email address is already in use by another account');
      }
      if (error.meta?.target?.includes('orderNumber')) {
        return new BadRequestException('Order number collision occurred. Please try again.');
      }
    }

    if (error.code === 'P2025') {
      return new NotFoundException('The requested record was not found');
    }

    if (error.code === 'P1001' || error.code === 'P1002') {
      return new BadRequestException('Database connection error. Please try again later.');
    }

    // Default to original error
    return error;
  }
}