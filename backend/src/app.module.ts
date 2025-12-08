import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { ShippingModule } from './shipping/shipping.module';
import { PaymentsModule } from './payments/payments.module';
import { PromotionsModule } from './promotions/promotions.module';
import { ContentModule } from './content/content.module';
import { ContactModule } from './contact/contact.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentSettingsModule } from './payment-settings/payment-settings.module';
import { FooterSettingsModule } from './footer-settings/footer-settings.module';
import { ContentMediaModule } from './content-media/content-media.module';
import { BlogCategoryModule } from './blog-category/blog-category.module';
import { ImageRetrievalMiddleware } from './products/image-retrieval.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 2000, // 200 requests per minute (default)
      },
    ]),
    CommonModule,
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    ShippingModule,
    PaymentsModule,
    PromotionsModule,
    ContentModule,
    ContactModule,
    AnalyticsModule,
    NotificationsModule,
    PaymentSettingsModule,
    FooterSettingsModule,
    ContentMediaModule,
    BlogCategoryModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply image retrieval middleware to handle backward compatibility
    // for product images (checks hierarchical location first, then legacy)
    consumer
      .apply(ImageRetrievalMiddleware)
      .forRoutes('/uploads/products/*');
  }
}