import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');

    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error(
        'Google OAuth credentials are not defined in environment variables',
      );
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
      passReqToCallback: true, // Enable passing request to validate method
    });
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      // Extract user information from Google profile
      const { id, emails, name, displayName } = profile;

      // Ensure email is available
      if (!emails || emails.length === 0) {
        return done(new Error('Email not provided by Google'), false);
      }

      const email = emails[0].value;
      const firstName = name?.givenName || displayName.split(' ')[0] || '';
      const lastName = name?.familyName || displayName.split(' ').slice(1).join(' ') || '';
      const username = displayName || email.split('@')[0];

      // Prepare OAuth user data
      const oauthUserData = {
        email,
        firstName,
        lastName,
        provider: 'google' as const,
        providerId: id,
        username,
        isEmailVerified: true, // Google emails are verified
      };

      // Validate and process OAuth user through AuthService
      const result = await this.authService.validateOAuthUser(oauthUserData);

      // Extract redirect from state parameter if present
      let redirect: string | undefined;
      if (req.query?.state) {
        try {
          const state = JSON.parse(req.query.state);
          redirect = state.redirect;
        } catch (e) {
          // Invalid state, ignore
        }
      }

      // Attach redirect to result for use in controller
      done(null, { ...result, redirect });
    } catch (error) {
      done(error, false);
    }
  }
}
