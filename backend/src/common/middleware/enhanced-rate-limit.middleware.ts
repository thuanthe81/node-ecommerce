import { Injectable, NestMiddleware, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  keyGenerator: (req: Request) => string; // Custom key generator (required)
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
    firstRequest: number;
  };
}

@Injectable()
export class EnhancedRateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(EnhancedRateLimitMiddleware.name);
  private readonly store: RateLimitStore = {};
  private readonly config: RateLimitConfig;

  constructor(private configService: ConfigService) {
    this.config = {
      windowMs: parseInt(this.configService.get('CANCELLATION_RATE_LIMIT_WINDOW', '60000')), // 1 minute
      maxRequests: parseInt(this.configService.get('CANCELLATION_RATE_LIMIT_MAX', '3')), // 3 requests
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      keyGenerator: (req: Request) => {
        // Generate key based on user ID, session ID, or IP address
        const user = (req as any).user;
        if (user?.userId) {
          return `user:${user.userId}`;
        }

        const sessionId = (req as any).sessionID || (req as any).session?.id;
        if (sessionId) {
          return `session:${sessionId}`;
        }

        return `ip:${req.ip || req.connection.remoteAddress}`;
      },
    };

    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanupExpiredEntries(), 5 * 60 * 1000);
  }

  use(req: Request, res: Response, next: NextFunction) {
    const key = this.config.keyGenerator(req);
    const now = Date.now();

    // Initialize or get existing entry
    if (!this.store[key]) {
      this.store[key] = {
        count: 0,
        resetTime: now + this.config.windowMs,
        firstRequest: now,
      };
    }

    const entry = this.store[key];

    // Reset if window has expired
    if (now > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + this.config.windowMs;
      entry.firstRequest = now;
    }

    // Check if limit exceeded
    if (entry.count >= this.config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

      // Log rate limit violation
      this.logger.warn(`Rate limit exceeded for cancellation request`, {
        key,
        count: entry.count,
        maxRequests: this.config.maxRequests,
        windowMs: this.config.windowMs,
        retryAfter,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
      });

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': this.config.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': entry.resetTime.toString(),
        'Retry-After': retryAfter.toString(),
      });

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many cancellation requests. Please try again in ${retryAfter} seconds.`,
          error: 'Too Many Requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment counter
    entry.count++;

    // Set rate limit headers
    const remaining = Math.max(0, this.config.maxRequests - entry.count);
    res.set({
      'X-RateLimit-Limit': this.config.maxRequests.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': entry.resetTime.toString(),
    });

    // Log successful rate limit check
    this.logger.debug(`Rate limit check passed for cancellation request`, {
      key,
      count: entry.count,
      maxRequests: this.config.maxRequests,
      remaining,
      windowMs: this.config.windowMs,
    });

    next();
  }

  private cleanupExpiredEntries() {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of Object.entries(this.store)) {
      if (now > entry.resetTime + this.config.windowMs) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => delete this.store[key]);

    if (keysToDelete.length > 0) {
      this.logger.debug(`Cleaned up ${keysToDelete.length} expired rate limit entries`);
    }
  }

  // Method to get current rate limit status for a key
  getRateLimitStatus(req: Request): {
    limit: number;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } {
    const key = this.config.keyGenerator(req);
    const entry = this.store[key];
    const now = Date.now();

    if (!entry || now > entry.resetTime) {
      return {
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetTime: now + this.config.windowMs,
      };
    }

    const remaining = Math.max(0, this.config.maxRequests - entry.count);
    const result: any = {
      limit: this.config.maxRequests,
      remaining,
      resetTime: entry.resetTime,
    };

    if (remaining === 0) {
      result.retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    }

    return result;
  }
}