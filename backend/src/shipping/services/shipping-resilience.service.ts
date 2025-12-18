import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../../prisma/prisma.service';
import { ShippingRate } from '../shipping.service';
import { ShippingMethod } from '@prisma/client';

// Extended cache TTL for fallback data: 24 hours (in milliseconds)
const FALLBACK_CACHE_TTL = 24 * 60 * 60 * 1000;

// Standard cache TTL for translation data: 1 hour (in milliseconds)
const TRANSLATION_CACHE_TTL = 60 * 60 * 1000;

export interface FallbackShippingRate extends ShippingRate {
  isFallback?: boolean;
  fallbackReason?: string;
}

@Injectable()
export class ShippingResilienceService {
  private readonly logger = new Logger(ShippingResilienceService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Get shipping methods with fallback logic when localization services fail
   * Implements caching and graceful degradation
   */
  async getShippingMethodsWithFallback(
    locale: 'en' | 'vi' = 'en',
    fallbackToCache: boolean = true,
  ): Promise<FallbackShippingRate[]> {
    const cacheKey = `shipping_methods_${locale}`;

    try {
      // Try to get fresh data from database
      const activeMethods = await this.prisma.shippingMethod.findMany({
        where: { isActive: true },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      });

      // Convert to shipping rates with localization
      const rates = this.convertToShippingRates(activeMethods, locale);

      // Cache the successful result
      await this.cacheManager.set(cacheKey, rates, TRANSLATION_CACHE_TTL);
      await this.cacheManager.set(`${cacheKey}_fallback`, rates, FALLBACK_CACHE_TTL);

      return rates;
    } catch (error) {
      this.logger.error(`Failed to fetch shipping methods from database: ${error.message}`);

      if (fallbackToCache) {
        return this.getFallbackFromCache(cacheKey, locale);
      }

      // If no fallback requested, return default English methods
      return this.getDefaultEnglishMethods();
    }
  }

  /**
   * Get cached shipping method translations with fallback
   */
  async getCachedTranslations(
    methodId: string,
    locale: 'en' | 'vi' = 'en',
  ): Promise<{ name: string; description: string; isFallback?: boolean }> {
    const cacheKey = `shipping_translation_${methodId}_${locale}`;

    try {
      // Try to get from cache first
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        return cached as { name: string; description: string };
      }

      // Fetch from database
      const method = await this.prisma.shippingMethod.findUnique({
        where: { methodId },
      });

      if (!method) {
        throw new Error(`Shipping method ${methodId} not found`);
      }

      const translation = {
        name: locale === 'vi' ? (method.nameVi || method.nameEn) : method.nameEn,
        description: locale === 'vi' ? (method.descriptionVi || method.descriptionEn) : method.descriptionEn,
      };

      // Cache the translation
      await this.cacheManager.set(cacheKey, translation, TRANSLATION_CACHE_TTL);

      return translation;
    } catch (error) {
      this.logger.warn(`Failed to get translation for ${methodId} in ${locale}: ${error.message}`);

      // Try fallback cache
      const fallbackKey = `${cacheKey}_fallback`;
      const fallbackCached = await this.cacheManager.get(fallbackKey);
      if (fallbackCached) {
        return {
          ...(fallbackCached as { name: string; description: string }),
          isFallback: true,
        };
      }

      // Ultimate fallback to hardcoded values
      return this.getHardcodedFallback(methodId, locale);
    }
  }

  /**
   * Invalidate translation caches when methods are updated
   */
  async invalidateTranslationCache(methodId?: string): Promise<void> {
    try {
      if (methodId) {
        // Invalidate specific method caches
        await this.cacheManager.del(`shipping_translation_${methodId}_en`);
        await this.cacheManager.del(`shipping_translation_${methodId}_vi`);
        await this.cacheManager.del(`shipping_translation_${methodId}_en_fallback`);
        await this.cacheManager.del(`shipping_translation_${methodId}_vi_fallback`);
      } else {
        // Invalidate all translation caches
        await this.cacheManager.del('shipping_methods_en');
        await this.cacheManager.del('shipping_methods_vi');
        await this.cacheManager.del('shipping_methods_en_fallback');
        await this.cacheManager.del('shipping_methods_vi_fallback');
      }

      this.logger.log(`Translation cache invalidated for ${methodId || 'all methods'}`);
    } catch (error) {
      this.logger.error(`Failed to invalidate translation cache: ${error.message}`);
    }
  }

  /**
   * Convert shipping methods to shipping rates with locale support
   */
  private convertToShippingRates(
    methods: ShippingMethod[],
    locale: 'en' | 'vi',
  ): FallbackShippingRate[] {
    return methods.map((method) => {
      // Calculate base cost (simplified for fallback)
      const cost = Number(method.baseRate) || 0;

      return {
        method: method.methodId,
        nameEn: method.nameEn,
        nameVi: method.nameVi || method.nameEn,
        descriptionEn: method.descriptionEn,
        descriptionVi: method.descriptionVi || method.descriptionEn,
        cost,
        estimatedDays: `${method.estimatedDaysMin}-${method.estimatedDaysMax} days`,
        carrier: method.carrier || undefined,
        isFreeShipping: false,
      };
    });
  }

  /**
   * Get fallback data from cache
   */
  private async getFallbackFromCache(
    cacheKey: string,
    locale: 'en' | 'vi',
  ): Promise<FallbackShippingRate[]> {
    try {
      const fallbackKey = `${cacheKey}_fallback`;
      const cached = await this.cacheManager.get(fallbackKey);

      if (cached) {
        this.logger.warn(`Using cached fallback data for locale ${locale}`);
        const rates = cached as FallbackShippingRate[];
        return rates.map(rate => ({
          ...rate,
          isFallback: true,
          fallbackReason: 'Database unavailable, using cached data',
        }));
      }
    } catch (error) {
      this.logger.error(`Failed to get fallback from cache: ${error.message}`);
    }

    // If cache also fails, return default methods
    return this.getDefaultEnglishMethods();
  }

  /**
   * Get hardcoded fallback translations
   */
  private getHardcodedFallback(
    methodId: string,
    locale: 'en' | 'vi',
  ): { name: string; description: string; isFallback: boolean } {
    const fallbacks: Record<string, { en: { name: string; description: string }; vi: { name: string; description: string } }> = {
      standard: {
        en: { name: 'Standard Shipping', description: 'Standard delivery in 3-5 business days' },
        vi: { name: 'Giao hàng tiêu chuẩn', description: 'Giao hàng tiêu chuẩn trong 3-5 ngày làm việc' },
      },
      express: {
        en: { name: 'Express Shipping', description: 'Fast delivery in 1-2 business days' },
        vi: { name: 'Giao hàng nhanh', description: 'Giao hàng nhanh trong 1-2 ngày làm việc' },
      },
      overnight: {
        en: { name: 'Overnight Shipping', description: 'Next business day delivery' },
        vi: { name: 'Giao hàng qua đêm', description: 'Giao hàng ngày làm việc tiếp theo' },
      },
    };

    const fallback = fallbacks[methodId.toLowerCase()] || fallbacks.standard;
    const translation = fallback[locale] || fallback.en;

    this.logger.warn(`Using hardcoded fallback for method ${methodId} in locale ${locale}`);

    return {
      ...translation,
      isFallback: true,
    };
  }

  /**
   * Get default English shipping methods when all else fails
   */
  private getDefaultEnglishMethods(): FallbackShippingRate[] {
    this.logger.error('All fallback mechanisms failed, using hardcoded default methods');

    return [
      {
        method: 'standard',
        nameEn: 'Standard Shipping',
        nameVi: 'Giao hàng tiêu chuẩn',
        descriptionEn: 'Standard delivery in 3-5 business days',
        descriptionVi: 'Giao hàng tiêu chuẩn trong 3-5 ngày làm việc',
        cost: 25000,
        estimatedDays: '3-5 days',
        isFreeShipping: false,
        isFallback: true,
        fallbackReason: 'All services unavailable, using default methods',
      },
    ];
  }

  /**
   * Health check for shipping services
   */
  async healthCheck(): Promise<{
    database: boolean;
    cache: boolean;
    overall: boolean;
  }> {
    const health = {
      database: false,
      cache: false,
      overall: false,
    };

    // Test database connection
    try {
      await this.prisma.shippingMethod.count();
      health.database = true;
    } catch (error) {
      this.logger.error(`Database health check failed: ${error.message}`);
    }

    // Test cache connection
    try {
      await this.cacheManager.set('health_check', 'ok', 1000);
      const result = await this.cacheManager.get('health_check');
      health.cache = result === 'ok';
      await this.cacheManager.del('health_check');
    } catch (error) {
      this.logger.error(`Cache health check failed: ${error.message}`);
    }

    health.overall = health.database && health.cache;

    return health;
  }
}