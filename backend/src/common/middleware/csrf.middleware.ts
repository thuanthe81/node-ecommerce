import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import csrf from 'csurf';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private csrfProtection = csrf({
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000, // 1 hour
    },
    // Don't ignore any methods - we'll handle this manually
  });

  use(req: Request, res: Response, next: NextFunction) {
    console.log(`CSRF Validation Middleware applied to: ${req.method} ${req.path}`);

    // Apply CSRF middleware for validation
    this.csrfProtection(req, res, (err: any) => {
      console.log(`CSRF validation callback - Path: ${req.path}, Method: ${req.method}, Error:`, err?.message || 'none');

      // This middleware is only for validation, so we check for errors
      if (err) {
        // Log CSRF violation for security monitoring
        console.error('CSRF Protection Error:', {
          error: err.message,
          method: req.method,
          url: req.url,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: new Date().toISOString(),
        });

        throw new HttpException(
          {
            statusCode: HttpStatus.FORBIDDEN,
            message: 'Invalid CSRF token',
            error: 'Forbidden',
            code: 'CSRF_TOKEN_INVALID',
          },
          HttpStatus.FORBIDDEN,
        );
      }
      next();
    });
  }
}