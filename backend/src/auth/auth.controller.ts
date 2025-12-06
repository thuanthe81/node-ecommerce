import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Req,
  Res,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from './decorators/public.decorator';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { FacebookOAuthGuard } from './guards/facebook-oauth.guard';
import { AuthResponse } from './dto/oauth-user.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 login attempts per minute
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 refresh requests per minute
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.logout(refreshTokenDto.refreshToken);
  }

  @Public()
  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  async requestPasswordReset(@Body() body: { email: string }) {
    return this.authService.requestPasswordReset(body.email);
  }

  // ==================== OAuth Endpoints ====================

  /**
   * Initiate Google OAuth flow
   * Redirects user to Google consent screen
   */
  @Public()
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  async googleAuth(@Query('redirect') redirect?: string) {
    // Guard handles the redirect to Google
    // The redirect parameter is preserved in the session
  }

  /**
   * Google OAuth callback
   * Handles the callback from Google after user grants permission
   */
  @Public()
  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleAuthCallback(
    @Req() req: Request & { user: AuthResponse & { redirect?: string } },
    @Res() res: Response,
  ) {
    try {
      const { accessToken, refreshToken, redirect } = req.user;

      // Get frontend URL from environment
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');

      // Determine redirect URL (default to homepage)
      const redirectUrl = redirect || '/';

      // Redirect to frontend with tokens and redirect parameter in URL
      const redirectUri = `${frontendUrl}${redirectUrl}?accessToken=${accessToken}&refreshToken=${refreshToken}&redirect=${encodeURIComponent(redirectUrl)}`;

      return res.redirect(redirectUri);
    } catch (error) {
      // Handle errors by redirecting to login with error message
      return this.handleOAuthError(res, error);
    }
  }

  /**
   * Initiate Facebook OAuth flow
   * Redirects user to Facebook consent screen
   */
  @Public()
  @Get('facebook')
  @UseGuards(FacebookOAuthGuard)
  async facebookAuth(@Query('redirect') redirect?: string) {
    // Guard handles the redirect to Facebook
    // The redirect parameter is preserved in the session
  }

  /**
   * Facebook OAuth callback
   * Handles the callback from Facebook after user grants permission
   */
  @Public()
  @Get('facebook/callback')
  @UseGuards(FacebookOAuthGuard)
  async facebookAuthCallback(
    @Req() req: Request & { user: AuthResponse & { redirect?: string } },
    @Res() res: Response,
  ) {
    try {
      const { accessToken, refreshToken, redirect } = req.user;

      // Get frontend URL from environment
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');

      // Determine redirect URL (default to homepage)
      const redirectUrl = redirect || '/';

      // Redirect to frontend with tokens and redirect parameter in URL
      const redirectUri = `${frontendUrl}${redirectUrl}?accessToken=${accessToken}&refreshToken=${refreshToken}&redirect=${encodeURIComponent(redirectUrl)}`;

      return res.redirect(redirectUri);
    } catch (error) {
      // Handle errors by redirecting to login with error message
      return this.handleOAuthError(res, error);
    }
  }

  /**
   * Handle OAuth errors by redirecting to login page with error message
   */
  private handleOAuthError(res: Response, error: any) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    // Determine error message based on error type
    let errorMessage = 'authentication_failed';

    if (error?.message?.includes('cancelled') || error?.message?.includes('denied')) {
      errorMessage = 'authentication_cancelled';
    } else if (error?.message?.includes('network') || error?.message?.includes('timeout')) {
      errorMessage = 'network_error';
    } else if (error?.message?.includes('provider') || error?.message?.includes('unavailable')) {
      errorMessage = 'provider_error';
    }

    // Redirect to login page with error parameter
    return res.redirect(`${frontendUrl}/login?error=${errorMessage}`);
  }
}