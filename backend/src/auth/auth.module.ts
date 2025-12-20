import { Module, OnModuleInit } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { SessionService } from './services/session.service';
import { OAuthConfigValidator } from './config/oauth-config.validator';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailQueueModule } from '../email-queue/email-queue.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    EmailQueueModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    FacebookStrategy,
    SessionService,
    OAuthConfigValidator,
  ],
  exports: [AuthService, SessionService],
})
export class AuthModule implements OnModuleInit {
  constructor(private readonly oauthConfigValidator: OAuthConfigValidator) {}

  onModuleInit() {
    // Validate OAuth configuration on module initialization
    this.oauthConfigValidator.validateOAuthConfiguration();
  }
}
