import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import { join, isAbsolute } from 'path';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable cookie parser (required for CSRF protection)
  app.use(cookieParser());

  // Security headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: true,
      },
      frameguard: {
        action: 'deny',
      },
      noSniff: true,
      xssFilter: true,
      // Additional security headers for CSRF protection
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
    }),
  );

  // Enable validation with sanitization
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: false, // Allow extra properties (like cache-busting _t parameter) to pass through
      transform: true, // Transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: false, // Disabled to allow explicit @Transform decorators to work correctly
      },
      disableErrorMessages: process.env.NODE_ENV === 'production', // Hide detailed errors in production
    }),
  );

  // Enable global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Enable CORS with whitelist
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [process.env.FRONTEND_URL || 'http://localhost:3000'];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // In development, allow any localhost origin to simplify local testing
      const isLocalhostDev =
        process.env.NODE_ENV !== 'production' &&
        /^https?:\/\/localhost:\d{2,5}$/.test(origin);

      if (allowedOrigins.includes(origin) || isLocalhostDev) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    // Include custom headers used by the app (e.g., x-session-id, x-csrf-token)
    // Cache-busting headers (Cache-Control, Pragma, Expires) are added by frontend for admin requests
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'x-session-id',
      'x-csrf-token',
      'Cache-Control',
      'Pragma',
      'Expires',
    ],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 3600, // Cache preflight requests for 1 hour
  });

  // HTTPS redirect middleware (only in production)
  if (process.env.NODE_ENV === 'production') {
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.header('x-forwarded-proto') !== 'https') {
        res.redirect(`https://${req.header('host')}${req.url}`);
      } else {
        next();
      }
    });
  }

  // Serve static files
  const uploadDirEnv = process.env.UPLOAD_DIR || 'uploads';
  const uploadDirPath = isAbsolute(uploadDirEnv)
    ? uploadDirEnv
    : join(process.cwd(), uploadDirEnv);

  app.useStaticAssets(uploadDirPath, {
    prefix: '/uploads/',
  });

  // Global prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}

void bootstrap();