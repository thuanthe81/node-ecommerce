import { SetMetadata } from '@nestjs/common';

export const ENHANCED_RATE_LIMIT_KEY = 'enhanced_rate_limit';

export interface EnhancedRateLimitOptions {
  windowMs?: number; // Time window in milliseconds
  maxRequests?: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: string; // Name of key generator function
}

export const EnhancedRateLimit = (options: EnhancedRateLimitOptions = {}) =>
  SetMetadata(ENHANCED_RATE_LIMIT_KEY, options);