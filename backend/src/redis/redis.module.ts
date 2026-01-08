import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisHost = configService.get('REDIS_HOST', 'localhost');
        const redisPort = configService.get('REDIS_PORT', 6379);

        return {
          store: redisStore,
          host: redisHost,
          port: redisPort,
          ttl: 60 * 60 * 24 * 7, // 7 days default TTL
        };
      },
    }),
  ],
  exports: [CacheModule],
})
export class RedisModule {}
