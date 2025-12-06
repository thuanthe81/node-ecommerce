import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const clientID = configService.get<string>('FACEBOOK_APP_ID');
    const clientSecret = configService.get<string>('FACEBOOK_APP_SECRET');
    const callbackURL = configService.get<string>('FACEBOOK_CALLBACK_URL');

    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error(
        'Facebook OAuth credentials are not defined in environment variables',
      );
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'public_profile'],
      profileFields: ['id', 'emails', 'name', 'displayName'],
      passReqToCallback: true, // Enable passing request to validate method
    });
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any) => void,
  ): Promise<any> {
    try {
      // Extract user information from Facebook profile
      const { id, emails, name, displayName } = profile;

      // Ensure email is available
      if (!emails || emails.length === 0) {
        return done(new Error('Email not provided by Facebook'), false);
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
        provider: 'facebook' as const,
        providerId: id,
        username,
        isEmailVerified: true, // Facebook emails are verified
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
