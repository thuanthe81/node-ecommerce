import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import csrf from 'csrf';

@Injectable()
export class CsrfTokenMiddleware implements NestMiddleware {
  private tokens = new csrf();

  use(req: Request, res: Response, next: NextFunction) {
    console.log(`CSRF Token Middleware applied to: ${req.method} ${req.path}`);

    // Get or create the secret
    if (!(req.session as any)?.csrfSecret) {
      (req.session as any).csrfSecret = this.tokens.secretSync();
    }

    // Attach the token generation function to the request
    (req as any).csrfToken = () => {
      const secret = (req.session as any).csrfSecret;
      return this.tokens.create(secret);
    };

    console.log('CSRF Token middleware setup successful');
    console.log('csrfToken function available:', typeof (req as any).csrfToken);
    next();
  }
}