import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import csrf from 'csrf';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private tokens = new csrf();

  use(req: Request, res: Response, next: NextFunction) {
    console.log(`CSRF Validation Middleware applied to: ${req.method} ${req.path}`);

    // Get the secret from session or create one
    if (!(req.session as any)?.csrfSecret) {
      (req.session as any).csrfSecret = this.tokens.secretSync();
    }

    const secret = (req.session as any).csrfSecret;
    const token = req.headers['x-csrf-token'] || req.body._csrf || req.query._csrf;

    // Verify the token
    if (!this.tokens.verify(secret, token as string)) {
      console.error('CSRF Protection Error:', {
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

    console.log(`CSRF validation successful - Path: ${req.path}, Method: ${req.method}`);
    next();
  }
}