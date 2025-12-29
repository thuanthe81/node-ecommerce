import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import csrf from 'csurf';

@Injectable()
export class CsrfTokenMiddleware implements NestMiddleware {
  private csrfProtection = csrf({
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000, // 1 hour
    },
  });

  use(req: Request, res: Response, next: NextFunction) {
    console.log(`CSRF Token Middleware applied to: ${req.method} ${req.path}`);

    // Apply CSRF middleware to make req.csrfToken() available
    // This middleware is only for the token endpoint, so we don't validate
    this.csrfProtection(req, res, (err: any) => {
      console.log(`CSRF Token middleware callback - Error:`, err?.message || 'none');
      console.log('csrfToken function available:', typeof (req as any).csrfToken);

      // For token generation, we ignore any validation errors
      // We just need the middleware to set up the csrfToken function
      next();
    });
  }
}