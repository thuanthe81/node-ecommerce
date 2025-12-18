import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShippingMethodDto } from './dto/create-shipping-method.dto';
import { UpdateShippingMethodDto } from './dto/update-shipping-method.dto';
import { CACHE_KEYS } from '../common/constants';
import { ShippingValidationService } from './services/shipping-validation.service';

// Cache TTL: 30 minutes (in milliseconds)
const CACHE_TTL = 30 * 60 * 1000;

@Injectable()
export class ShippingMethodsService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private shippingValidationService: ShippingValidationService,
  ) {}

  /**
   * Create a new shipping method
   * Validates that methodId is unique and translations are complete
   */
  async create(createShippingMethodDto: CreateShippingMethodDto) {
    // Check if methodId already exists
    const existingMethod = await this.prisma.shippingMethod.findUnique({
      where: { methodId: createShippingMethodDto.methodId },
    });

    if (existingMethod) {
      throw new ConflictException(
        `Shipping method with methodId '${createShippingMethodDto.methodId}' already exists`,
      );
    }

    // Create the shipping method
    const shippingMethod = await this.prisma.shippingMethod.create({
      data: createShippingMethodDto,
    });

    // Validate translations for the new method
    const validation = this.shippingValidationService.validateMethodTranslations(shippingMethod);
    if (!validation.isValid && shippingMethod.isActive) {
      // Log warnings for active methods with incomplete translations
      validation.warnings.forEach(warning => console.warn(warning));
    }

    // Invalidate cache
    await this.invalidateCache();

    return shippingMethod;
  }

  /**
   * Find all shipping methods
   * Sorted by displayOrder ascending, then createdAt ascending
   */
  async findAll() {
    return this.prisma.shippingMethod.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  /**
   * Find all active shipping methods
   * Sorted by displayOrder ascending, then createdAt ascending
   * Cached for 30 minutes
   * Excludes methods with corrupted data
   */
  async findAllActive() {
    // Try to get from cache
    const cacheKey = CACHE_KEYS.SHIPPING.METHODS;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached as any[];
    }

    // Fetch from database
    const activeMethods = await this.prisma.shippingMethod.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });

    // Filter out methods with corrupted data
    const validMethods = await this.shippingValidationService.filterValidMethods(activeMethods);

    // Cache for 30 minutes
    await this.cacheManager.set(cacheKey, validMethods, CACHE_TTL);

    return validMethods;
  }

  /**
   * Find a single shipping method by ID
   */
  async findOne(id: string) {
    const shippingMethod = await this.prisma.shippingMethod.findUnique({
      where: { id },
    });

    if (!shippingMethod) {
      throw new NotFoundException('Shipping method not found');
    }

    return shippingMethod;
  }

  /**
   * Find a shipping method by methodId
   */
  async findByMethodId(methodId: string) {
    const shippingMethod = await this.prisma.shippingMethod.findUnique({
      where: { methodId },
    });

    if (!shippingMethod) {
      throw new NotFoundException('Shipping method not found');
    }

    return shippingMethod;
  }

  /**
   * Update a shipping method
   * Prevents modification of methodId (immutable)
   */
  async update(id: string, updateShippingMethodDto: UpdateShippingMethodDto) {
    // Check if shipping method exists
    const shippingMethod = await this.prisma.shippingMethod.findUnique({
      where: { id },
    });

    if (!shippingMethod) {
      throw new NotFoundException('Shipping method not found');
    }

    // Update the shipping method
    const updated = await this.prisma.shippingMethod.update({
      where: { id },
      data: updateShippingMethodDto,
    });

    // Invalidate cache
    await this.invalidateCache(id, shippingMethod.methodId);

    return updated;
  }

  /**
   * Remove a shipping method
   * Validates that the method is not referenced by any orders
   */
  async remove(id: string) {
    // Check if shipping method exists
    const shippingMethod = await this.prisma.shippingMethod.findUnique({
      where: { id },
    });

    if (!shippingMethod) {
      throw new NotFoundException('Shipping method not found');
    }

    // Check if the shipping method is referenced by any orders
    const ordersUsingMethod = await this.prisma.order.count({
      where: { shippingMethod: shippingMethod.methodId },
    });

    if (ordersUsingMethod > 0) {
      throw new ConflictException(
        `Cannot delete shipping method. It is currently used by ${ordersUsingMethod} order(s)`,
      );
    }

    // Delete the shipping method
    const deleted = await this.prisma.shippingMethod.delete({
      where: { id },
    });

    // Invalidate cache
    await this.invalidateCache(id, shippingMethod.methodId);

    return deleted;
  }

  /**
   * Validate that a methodId is unique
   * Optionally exclude a specific ID (for update validation)
   */
  async validateMethodIdUnique(
    methodId: string,
    excludeId?: string,
  ): Promise<boolean> {
    const existingMethod = await this.prisma.shippingMethod.findUnique({
      where: { methodId },
    });

    if (!existingMethod) {
      return true;
    }

    if (excludeId && existingMethod.id === excludeId) {
      return true;
    }

    return false;
  }

  /**
   * Check if a shipping method can be deleted
   * Returns true if no orders reference this method
   */
  async canDelete(id: string): Promise<boolean> {
    const shippingMethod = await this.prisma.shippingMethod.findUnique({
      where: { id },
    });

    if (!shippingMethod) {
      return false;
    }

    const ordersUsingMethod = await this.prisma.order.count({
      where: { shippingMethod: shippingMethod.methodId },
    });

    return ordersUsingMethod === 0;
  }

  /**
   * Get admin warnings for incomplete translations
   * Returns user-friendly messages for admin interface
   */
  async getTranslationWarnings(): Promise<string[]> {
    return this.shippingValidationService.getAdminTranslationWarnings();
  }

  /**
   * Validate all active shipping method translations
   * Returns detailed validation results
   */
  async validateTranslations() {
    return this.shippingValidationService.validateActiveMethodTranslations();
  }

  /**
   * Invalidate all shipping method caches
   * Called after create, update, or delete operations
   */
  private async invalidateCache(id?: string, methodId?: string) {
    // Invalidate list caches
    await this.cacheManager.del(CACHE_KEYS.SHIPPING.METHODS);
    await this.cacheManager.del(CACHE_KEYS.SHIPPING.METHOD_LIST);

    // Invalidate specific method caches if provided
    if (id) {
      await this.cacheManager.del(CACHE_KEYS.SHIPPING.METHOD_BY_ID(id));
    }
    if (methodId) {
      await this.cacheManager.del(CACHE_KEYS.SHIPPING.METHOD_BY_METHOD_ID(methodId));
    }
  }
}
