import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ENHANCED_RATE_LIMIT_KEY, EnhancedRateLimitOptions } from '../decorators/enhanced-rate-limit.decorator';
import type { Request } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

@Injectable()
export class EnhancedRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(EnhancedRateLimitGuard.name);
  private readonly store: Map<string, RateLimitEntry> = new Map();

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanupExpiredEntries(), 5 * 60 * 1000);
  }

  canActivate(context: ExecutionContext): boolean {
    const rateLimitOptions = this.reflector.get<EnhancedRateLimitOptions>(
      ENHANCED_RATE_LIMIT_KEY,
      context.getHandler(),
    );

    // If no rate limit options are set, allow the request
    if (!rateLimitOptions) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();

    // Default configuration
    const config = {
      windowMs: rateLimitOptions.windowMs || 60000, // 1 minute
      maxRequests: rateLimitOptions.maxRequests || 3, // 3 requests
      skipSuccessfulRequests: rateLimitOptions.skipSuccessfulRequests || false,
      skipFailedRequests: rateLimitOptions.skipFailedRequests || false,
    };

    const key = this.generateKey(request);
    const now = Date.now();

    // Get or create entry
    let entry = this.store.get(key);
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
        firstRequest: now,
      };
      this.store.set(key, entry);
    }

    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

      // Log rate limit violation
      this.logger.warn(`Enhanced rate limit exceeded`, {
        key,
        count: entry.count,
        maxRequests: config.maxRequests,
        windowMs: config.windowMs,
        retryAfter,
        ip: request.ip,
        userAgent: request.get('User-Agent'),
        endpoint: request.url,
        method: request.method,
        timestamp: new Date().toISOString(),
      });

      // Set rate limit headers
      response.set({
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': entry.resetTime.toString(),
        'Retry-After': retryAfter.toString(),
      });

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many requests. Please try again in ${retryAfter} seconds.`,
          error: 'Too Many Requests',
          code: 'ENHANCED_RATE_LIMIT_EXCEEDED',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment counter
    entry.count++;

    // Set rate limit headers
    const remaining = Math.max(0, config.maxRequests - entry.count);
    response.set({
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': entry.resetTime.toString(),
    });

    // Log successful rate limit check
    this.logger.debug(`Enhanced rate limit check passed`, {
      key,
      count: entry.count,
      maxRequests: config.maxRequests,
      remaining,
      windowMs: config.windowMs,
      endpoint: request.url,
      method: request.method,
    });

    return true;
  }

  private generateKey(request: Request): string {
    // Generate key based on user ID, session ID, or IP address
    const user = (request as any).user;
    if (user?.userId) {
      return `enhanced:user:${user.userId}:${request.url}`;
    }

    const sessionId = (request as any).sessionID || (request as any).session?.id;
    if (sessionId) {
      return `enhanced:session:${sessionId}:${request.url}`;
    }

    return `enhanced:ip:${request.ip || request.connection.remoteAddress}:${request.url}`;
  }

  private cleanupExpiredEntries() {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime + 60000) { // Keep for extra minute after expiry
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.store.delete(key));

    if (keysToDelete.length > 0) {
      this.logger.debug(`Cleaned up ${keysToDelete.length} expired enhanced rate limit entries`);
    }
  }
}