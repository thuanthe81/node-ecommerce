import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Allow OPTIONS requests to pass through for CORS preflight
    const request = context.switchToHttp().getRequest();
    if (request.method === 'OPTIONS') {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // Optional auth: if a Bearer token is present, try to authenticate
      const req = context.switchToHttp().getRequest();
      const authHeader = req.headers?.authorization || req.headers?.Authorization as string | undefined;

      const hasBearer = typeof authHeader === 'string' && authHeader.startsWith('Bearer ');
      if (hasBearer) {
        try {
          const result = super.canActivate(context);
          if (result instanceof Promise) {
            return result
              .then(() => true)
              .catch(() => true);
          }
          return true;
        } catch {
          // Ignore auth errors for public routes; proceed without user
          return true;
        }
      }
      // No auth header; treat as anonymous
      return true;
    }

    return super.canActivate(context);
  }
}
