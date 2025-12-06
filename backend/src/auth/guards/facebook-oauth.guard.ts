import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class FacebookOAuthGuard extends AuthGuard('facebook') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const redirect = request.query.redirect;

    // Pass redirect parameter as state to preserve through OAuth flow
    return {
      state: redirect ? JSON.stringify({ redirect }) : undefined,
    };
  }
}
