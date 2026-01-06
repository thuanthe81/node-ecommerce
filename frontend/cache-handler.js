/**
 * Custom cache handler for Next.js
 * Provides enhanced caching capabilities with Redis support and performance monitoring
 */

const { CacheHandler } = require('@neshca/cache-handler');
const createRedisHandler = require('@neshca/cache-handler/redis-strings').default;
const createLruHandler = require('@neshca/cache-handler/local-lru').default;

class CustomCacheHandler extends CacheHandler {
  constructor(options) {
    super(options);

    // Initialize handlers based on environment
    this.handlers = [];

    // Redis handler for production
    if (process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
      try {
        const redisHandler = createRedisHandler({
          url: process.env.REDIS_URL,
          keyPrefix: 'nextjs-cache:',
          timeoutMs: 1000,
          // TTL configuration
          ttl: {
            defaultStaleAge: 86400, // 1 day
            estimateExpireAge: (staleAge) => staleAge * 2,
          },
        });

        this.handlers.push(redisHandler);
        console.log('Redis cache handler initialized');
      } catch (error) {
        console.error('Failed to initialize Redis cache handler:', error);
      }
    }

    // LRU handler as fallback
    const lruHandler = createLruHandler({
      maxItemsNumber: 1000,
      maxItemSizeBytes: 1024 * 1024, // 1MB per item
    });

    this.handlers.push(lruHandler);
    console.log('LRU cache handler initialized');
  }

  async get(key) {
    const startTime = Date.now();

    try {
      // Try each handler in order
      for (const handler of this.handlers) {
        try {
          const result = await handler.get(key);
          if (result) {
            this.logCacheHit(key, Date.now() - startTime, handler.constructor.name);
            return result;
          }
        } catch (error) {
          console.error(`Cache get error for handler ${handler.constructor.name}:`, error);
        }
      }

      this.logCacheMiss(key, Date.now() - startTime);
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, data, ctx) {
    const startTime = Date.now();

    try {
      // Set in all handlers
      const promises = this.handlers.map(async (handler) => {
        try {
          await handler.set(key, data, ctx);
        } catch (error) {
          console.error(`Cache set error for handler ${handler.constructor.name}:`, error);
        }
      });

      await Promise.allSettled(promises);
      this.logCacheSet(key, Date.now() - startTime);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async revalidateTag(tag) {
    const startTime = Date.now();

    try {
      // Revalidate in all handlers
      const promises = this.handlers.map(async (handler) => {
        try {
          if (handler.revalidateTag) {
            await handler.revalidateTag(tag);
          }
        } catch (error) {
          console.error(`Cache revalidateTag error for handler ${handler.constructor.name}:`, error);
        }
      });

      await Promise.allSettled(promises);
      this.logCacheRevalidation(tag, Date.now() - startTime);
    } catch (error) {
      console.error('Cache revalidateTag error:', error);
    }
  }

  // Logging methods for performance monitoring
  logCacheHit(key, duration, handlerName) {
    if (process.env.ENABLE_CACHE_LOGGING === 'true') {
      console.log(`Cache HIT: ${key} (${duration}ms) via ${handlerName}`);
    }
  }

  logCacheMiss(key, duration) {
    if (process.env.ENABLE_CACHE_LOGGING === 'true') {
      console.log(`Cache MISS: ${key} (${duration}ms)`);
    }
  }

  logCacheSet(key, duration) {
    if (process.env.ENABLE_CACHE_LOGGING === 'true') {
      console.log(`Cache SET: ${key} (${duration}ms)`);
    }
  }

  logCacheRevalidation(tag, duration) {
    if (process.env.ENABLE_CACHE_LOGGING === 'true') {
      console.log(`Cache REVALIDATE: ${tag} (${duration}ms)`);
    }
  }
}

module.exports = CustomCacheHandler;