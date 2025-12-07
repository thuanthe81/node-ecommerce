# Shipping Methods Caching Implementation

## Overview

This document describes the caching implementation for shipping methods to optimize performance and reduce database queries.

## Cache Configuration

### Cache TTL
- **Duration**: 30 minutes (1,800,000 milliseconds)
- **Rationale**: Shipping methods are relatively static data that don't change frequently, making them ideal for caching

### Cache Keys

The following cache keys are used:

```typescript
const CACHE_KEYS = {
  ACTIVE_METHODS: 'shipping:methods:active',
  ALL_METHODS: 'shipping:methods:all',
  METHOD_BY_ID: (id: string) => `shipping:method:id:${id}`,
  METHOD_BY_METHOD_ID: (methodId: string) => `shipping:method:methodId:${methodId}`,
};
```

## Cached Operations

### 1. Find All Active Methods (`findAllActive()`)

**Purpose**: This is the most frequently called method, used during checkout to calculate shipping options.

**Cache Strategy**:
- First checks cache for key `shipping:methods:active`
- If cache hit: returns cached data immediately
- If cache miss: queries database, caches result for 30 minutes, returns data

**Code**:
```typescript
async findAllActive() {
  const cacheKey = CACHE_KEYS.ACTIVE_METHODS;
  const cached = await this.cacheManager.get(cacheKey);
  if (cached) {
    return cached;
  }

  const activeMethods = await this.prisma.shippingMethod.findMany({
    where: { isActive: true },
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
  });

  await this.cacheManager.set(cacheKey, activeMethods, CACHE_TTL);
  return activeMethods;
}
```

## Cache Invalidation

Cache is automatically invalidated when shipping methods are modified to ensure data consistency.

### Invalidation Triggers

1. **Create Operation** (`create()`)
   - Invalidates: `ACTIVE_METHODS`, `ALL_METHODS`
   - Reason: New method may be active and should appear in lists

2. **Update Operation** (`update()`)
   - Invalidates: `ACTIVE_METHODS`, `ALL_METHODS`, specific method caches
   - Reason: Method properties may have changed (including active status)

3. **Delete Operation** (`remove()`)
   - Invalidates: `ACTIVE_METHODS`, `ALL_METHODS`, specific method caches
   - Reason: Method no longer exists and should not appear in lists

### Invalidation Implementation

```typescript
private async invalidateCache(id?: string, methodId?: string) {
  // Invalidate list caches
  await this.cacheManager.del(CACHE_KEYS.ACTIVE_METHODS);
  await this.cacheManager.del(CACHE_KEYS.ALL_METHODS);

  // Invalidate specific method caches if provided
  if (id) {
    await this.cacheManager.del(CACHE_KEYS.METHOD_BY_ID(id));
  }
  if (methodId) {
    await this.cacheManager.del(CACHE_KEYS.METHOD_BY_METHOD_ID(methodId));
  }
}
```

## Performance Benefits

### Before Caching
- Every checkout page load: 1 database query
- High traffic scenario (1000 checkouts/hour): 1000 database queries/hour
- Database load: High

### After Caching
- First checkout after cache expiry: 1 database query
- Subsequent checkouts (within 30 min): 0 database queries (cache hit)
- High traffic scenario (1000 checkouts/hour): ~2 database queries/hour (assuming cache hits)
- Database load: Minimal

### Expected Cache Hit Rate
- **Estimated**: 95%+ for active methods
- **Reasoning**: Shipping methods rarely change, and 30-minute TTL is sufficient

## Cache Infrastructure

### Redis Integration

The caching uses the existing Redis infrastructure configured in `RedisModule`:

```typescript
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
          store: await redisStore({
            host: redisHost,
            port: redisPort,
            ttl: 60 * 60 * 24 * 7, // 7 days default TTL
          }),
        };
      },
    }),
  ],
  exports: [CacheModule],
})
export class RedisModule {}
```

### Module Configuration

The `ShippingModule` imports `CacheModule` to enable caching:

```typescript
@Module({
  imports: [PrismaModule, CacheModule.register()],
  controllers: [ShippingController, ShippingMethodsController],
  providers: [ShippingService, ShippingMethodsService],
  exports: [ShippingService, ShippingMethodsService],
})
export class ShippingModule {}
```

## Testing Cache Behavior

### Manual Testing

Use the provided test script:

```bash
npx ts-node backend/scripts/test-shipping-cache.ts
```

### Monitoring Cache Performance

To monitor cache effectiveness in production:

1. **Cache Hit Rate**: Track ratio of cache hits to total requests
2. **Response Time**: Compare response times with/without cache
3. **Database Load**: Monitor reduction in database queries

### Cache Debugging

To debug cache issues:

```typescript
// Check if value is cached
const cached = await this.cacheManager.get('shipping:methods:active');
console.log('Cached value:', cached);

// Manually invalidate cache
await this.cacheManager.del('shipping:methods:active');
```

## Best Practices

1. **Cache Invalidation**: Always invalidate cache after mutations
2. **TTL Selection**: 30 minutes balances freshness and performance
3. **Key Naming**: Use consistent, descriptive cache key patterns
4. **Error Handling**: Cache failures should not break functionality (graceful degradation)

## Future Enhancements

Potential improvements for the caching strategy:

1. **Cache Warming**: Pre-populate cache on application startup
2. **Selective Invalidation**: Only invalidate affected cache entries
3. **Cache Tags**: Use Redis tags for more sophisticated invalidation
4. **Metrics**: Add cache hit/miss metrics for monitoring
5. **Distributed Caching**: Ensure cache consistency across multiple instances

## Related Files

- `backend/src/shipping/shipping-methods.service.ts` - Service with caching implementation
- `backend/src/shipping/shipping.module.ts` - Module configuration
- `backend/src/redis/redis.module.ts` - Redis cache configuration
- `backend/scripts/test-shipping-cache.ts` - Cache testing script
