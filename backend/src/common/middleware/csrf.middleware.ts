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
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  });

  use(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF protection for GET requests and preflight OPTIONS
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
      return next();
    }

    // Apply CSRF protection
    this.csrfProtection(req, res, (err: any) => {
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