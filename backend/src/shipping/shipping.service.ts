import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CalculateShippingDto } from './dto/calculate-shipping.dto';
import { GenerateLabelDto } from './dto/generate-label.dto';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, ShippingMethod } from '@prisma/client';
import { ShippingMethodsService } from './shipping-methods.service';
import { ShippingResilienceService, FallbackShippingRate } from './services/shipping-resilience.service';
import { ShippingValidationService, ValidationResult } from './services/shipping-validation.service';

export interface ShippingRate {
  method: string;
  nameEn: string;        // Always include English for fallback
  nameVi: string;        // Always include Vietnamese for frontend switching
  descriptionEn: string; // Always include English for fallback
  descriptionVi: string; // Always include Vietnamese for frontend switching
  cost: number;
  estimatedDays: string;
  carrier?: string;
  isFreeShipping?: boolean;
  originalCost?: number;
}

export interface ShippingLabel {
  trackingNumber: string;
  labelUrl: string;
  carrier: string;
  orderId: string;
  orderNumber: string;
  createdAt: Date;
}

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);

  constructor(
    private prisma: PrismaService,
    private shippingMethodsService: ShippingMethodsService,
    private shippingResilienceService: ShippingResilienceService,
    private shippingValidationService: ShippingValidationService,
  ) {}
  /**
   * Calculate shipping rates based on destination and package details
   * Fetches active shipping methods from database and applies pricing rules
   * Implements fallback logic when localization services fail
   * Excludes corrupted shipping methods from results
   */
  async calculateShipping(
    calculateShippingDto: CalculateShippingDto,
  ): Promise<ShippingRate[]> {
    const { destinationCountry, items, orderValue, locale } = calculateShippingDto;

    // Log locale parameter usage for analytics
    const effectiveLocale = locale || 'en';
    this.logger.log('Shipping calculation request received', {
      requestedLocale: locale,
      effectiveLocale: effectiveLocale,
      localeProvided: !!locale,
      destinationCountry: destinationCountry,
      itemCount: items.length,
      orderValue: orderValue,
      context: 'shipping_calculation_request'
    });

    // Track locale usage patterns for analytics
    this.trackLocaleUsage(locale, destinationCountry, 'shipping_calculation');

    // Log locale parameter validation and fallback behavior
    if (!locale) {
      this.logger.log('No locale parameter provided, defaulting to English', {
        defaultLocale: 'en',
        context: 'locale_parameter_fallback'
      });
    } else if (!['en', 'vi'].includes(locale)) {
      // This should be caught by validation, but log it as a safety measure
      this.logger.warn('Invalid locale parameter detected, falling back to English', {
        invalidLocale: locale,
        fallbackLocale: 'en',
        context: 'locale_parameter_validation_error'
      });
    } else {
      this.logger.log('Valid locale parameter received', {
        locale: locale,
        context: 'locale_parameter_valid'
      });
    }

    // Calculate total weight
    const totalWeight = items.reduce(
      (sum, item) => sum + item.weight * item.quantity,
      0,
    );

    try {
      // Fetch active shipping methods from database
      const activeMethods = await this.shippingMethodsService.findAllActive();

      // Process each method and handle corrupted data
      const rates: ShippingRate[] = [];

      for (const method of activeMethods) {
        try {
          // Validate method data integrity before processing
          const validation = await this.validateMethodForCalculation(method);
          if (!validation.isValid) {
            this.logger.error('Skipping corrupted shipping method', {
              methodId: method.methodId,
              errors: validation.errors,
              context: 'shipping_calculation_validation'
            });
            continue;
          }

          const cost = this.calculateMethodCost(
            method,
            totalWeight,
            orderValue || 0,
            destinationCountry,
          );

          // Log locale usage for analytics
          const effectiveLocale = locale || 'en'; // Default to English if no locale provided

          // Log missing translations with structured information
          const missingFields: string[] = [];
          if (!method.nameVi) missingFields.push('nameVi');
          if (!method.descriptionVi) missingFields.push('descriptionVi');
          if (!method.nameEn) missingFields.push('nameEn');
          if (!method.descriptionEn) missingFields.push('descriptionEn');

          if (missingFields.length > 0) {
            this.logger.warn('Missing translation fields detected', {
              methodId: method.methodId,
              missingFields: missingFields,
              requestedLocale: effectiveLocale,
              context: 'shipping_calculation'
            });
          }

          // Log specific fallback usage for Vietnamese locale
          if (effectiveLocale === 'vi') {
            if (!method.nameVi && method.nameEn) {
              this.logger.warn('Using English fallback for Vietnamese name', {
                methodId: method.methodId,
                field: 'nameVi',
                fallbackValue: method.nameEn,
                context: 'translation_fallback'
              });
            }
            if (!method.descriptionVi && method.descriptionEn) {
              this.logger.warn('Using English fallback for Vietnamese description', {
                methodId: method.methodId,
                field: 'descriptionVi',
                fallbackValue: method.descriptionEn,
                context: 'translation_fallback'
              });
            }
          }

          rates.push({
            method: method.methodId,
            nameEn: method.nameEn,
            nameVi: method.nameVi || method.nameEn, // Fallback to English if Vietnamese is missing
            descriptionEn: method.descriptionEn,
            descriptionVi: method.descriptionVi || method.descriptionEn, // Fallback to English if Vietnamese is missing
            cost: cost.finalCost,
            estimatedDays: `${method.estimatedDaysMin}-${method.estimatedDaysMax} days`,
            carrier: method.carrier || undefined,
            isFreeShipping: cost.isFreeShipping,
            originalCost: cost.isFreeShipping ? cost.originalCost : undefined,
          });
        } catch (methodError) {
          this.logger.error('Error processing shipping method', {
            methodId: method.methodId,
            error: methodError.message,
            context: 'shipping_method_processing'
          });
          // Continue processing other methods
        }
      }

      // If no valid methods found, use fallback
      if (rates.length === 0) {
        this.logger.warn('No valid shipping methods found, using fallback', {
          requestedLocale: locale || 'en',
          totalMethodsProcessed: activeMethods.length,
          context: 'shipping_calculation_fallback'
        });
        const effectiveLocale = locale || 'en';
        return this.shippingResilienceService.getShippingMethodsWithFallback(effectiveLocale, true);
      }

      // Log successful calculation with locale analytics
      this.logger.log('Shipping calculation completed successfully', {
        requestedLocale: locale,
        effectiveLocale: effectiveLocale,
        methodsReturned: rates.length,
        destinationCountry: destinationCountry,
        context: 'shipping_calculation_success'
      });

      return rates;
    } catch (error) {
      // If database or service fails, use resilience service with fallback
      this.logger.error('Shipping calculation failed, using fallback', {
        error: error.message,
        requestedLocale: locale || 'en',
        context: 'shipping_calculation_service_failure'
      });
      const effectiveLocale = locale || 'en';
      return this.shippingResilienceService.getShippingMethodsWithFallback(effectiveLocale, true);
    }
  }

  /**
   * Calculate cost for a specific shipping method
   * Applies base rate, weight-based charges, regional pricing, and free shipping threshold
   * Handles corrupted data gracefully with fallbacks
   */
  private calculateMethodCost(
    method: ShippingMethod,
    weight: number,
    orderValue: number,
    country: string,
  ): { finalCost: number; originalCost?: number; isFreeShipping: boolean } {
    try {
      // Validate required fields and provide fallbacks for corrupted data
      const safeWeight = Math.max(0, weight || 0);
      const safeOrderValue = Math.max(0, orderValue || 0);
      const safeCountry = country || 'vietnam';

      // Get base rate (or regional rate if applicable)
      let cost = this.getRegionalRate(method, safeCountry);

      // Apply weight-based charges
      cost = this.applyWeightCharges(cost, method, safeWeight);

      // Round to 2 decimal places
      cost = Math.round(cost * 100) / 100;

      // Apply free shipping threshold
      const result = this.applyFreeShipping(cost, method, safeOrderValue);

      return result;
    } catch (error) {
      this.logger.error('Error calculating cost for method, using fallback', {
        methodId: method.methodId,
        error: error.message,
        fallbackCost: Number(method.baseRate) || 25000,
        context: 'cost_calculation_error'
      });

      // Return fallback cost
      const fallbackCost = Number(method.baseRate) || 25000; // Default to 25,000 VND
      return {
        finalCost: fallbackCost,
        isFreeShipping: false,
      };
    }
  }

  /**
   * Get the appropriate rate for a shipping method based on destination country
   * Checks regional pricing configuration and falls back to base rate
   * Handles corrupted regional pricing data gracefully
   */
  private getRegionalRate(method: ShippingMethod, country: string): number {
    try {
      const baseRate = Number(method.baseRate);

      // Validate base rate
      if (isNaN(baseRate) || baseRate < 0) {
        this.logger.warn('Invalid base rate for method, using default', {
          methodId: method.methodId,
          invalidBaseRate: method.baseRate,
          fallbackRate: 25000,
          context: 'base_rate_validation'
        });
        return 25000; // Default fallback rate
      }

      // If no regional pricing configured, return base rate
      if (!method.regionalPricing) {
        return baseRate;
      }

      // Validate regional pricing data
      let regionalPricing: Record<string, number>;
      try {
        regionalPricing = method.regionalPricing as Record<string, number>;
        if (typeof regionalPricing !== 'object' || regionalPricing === null) {
          throw new Error('Invalid regional pricing format');
        }
      } catch (error) {
        this.logger.warn('Corrupted regional pricing for method, using base rate', {
          methodId: method.methodId,
          error: error.message,
          baseRate: baseRate,
          context: 'regional_pricing_validation'
        });
        return baseRate;
      }

      const countryLower = (country || '').toLowerCase();

      // Check for country-specific rate (highest precedence)
      if (regionalPricing[countryLower] !== undefined) {
        const countryRate = Number(regionalPricing[countryLower]);
        if (!isNaN(countryRate) && countryRate >= 0) {
          return countryRate;
        }
      }

      // Check for region-specific rate
      // Common regions: asia, europe, north_america, south_america, africa, oceania
      const regionMap: Record<string, string[]> = {
        asia: [
          'china',
          'japan',
          'korea',
          'south korea',
          'thailand',
          'singapore',
          'malaysia',
          'indonesia',
          'philippines',
          'india',
          'vietnam',
        ],
        europe: [
          'uk',
          'united kingdom',
          'france',
          'germany',
          'italy',
          'spain',
          'netherlands',
          'belgium',
          'switzerland',
          'austria',
        ],
        north_america: ['usa', 'united states', 'canada', 'mexico'],
        south_america: ['brazil', 'argentina', 'chile', 'colombia', 'peru'],
        africa: [
          'south africa',
          'egypt',
          'nigeria',
          'kenya',
          'morocco',
          'algeria',
        ],
        oceania: ['australia', 'new zealand', 'fiji'],
      };

      // Find which region the country belongs to
      for (const [region, countries] of Object.entries(regionMap)) {
        if (countries.includes(countryLower)) {
          if (regionalPricing[region] !== undefined) {
            const regionRate = Number(regionalPricing[region]);
            if (!isNaN(regionRate) && regionRate >= 0) {
              return regionRate;
            }
          }
        }
      }

      // Fall back to base rate
      return baseRate;
    } catch (error) {
      this.logger.error('Error getting regional rate for method, using fallback', {
        methodId: method.methodId,
        error: error.message,
        fallbackRate: 25000,
        context: 'regional_rate_error'
      });
      return 25000; // Default fallback rate
    }
  }

  /**
   * Apply weight-based charges to the base rate
   * Adds additional cost for weight exceeding the threshold
   * Handles corrupted weight configuration gracefully
   */
  private applyWeightCharges(
    baseRate: number,
    method: ShippingMethod,
    weight: number,
  ): number {
    try {
      // If no weight-based pricing configured, return base rate
      if (!method.weightThreshold || !method.weightRate) {
        return baseRate;
      }

      const weightThreshold = Number(method.weightThreshold);
      const weightRate = Number(method.weightRate);

      // Validate weight configuration
      if (isNaN(weightThreshold) || isNaN(weightRate) || weightThreshold < 0 || weightRate < 0) {
        this.logger.warn('Invalid weight configuration for method, skipping weight charges', {
          methodId: method.methodId,
          weightThreshold: method.weightThreshold,
          weightRate: method.weightRate,
          context: 'weight_configuration_validation'
        });
        return baseRate;
      }

      // If weight is under threshold, no additional charges
      if (weight <= weightThreshold) {
        return baseRate;
      }

      // Calculate additional weight charges
      const excessWeight = weight - weightThreshold;
      const weightCharge = excessWeight * weightRate;

      return baseRate + weightCharge;
    } catch (error) {
      this.logger.error('Error applying weight charges for method, using base rate', {
        methodId: method.methodId,
        error: error.message,
        baseRate: baseRate,
        context: 'weight_charges_error'
      });
      return baseRate;
    }
  }

  /**
   * Apply free shipping threshold
   * Sets cost to 0 if order value meets or exceeds threshold
   * Handles corrupted threshold configuration gracefully
   */
  private applyFreeShipping(
    cost: number,
    method: ShippingMethod,
    orderValue: number,
  ): { finalCost: number; originalCost?: number; isFreeShipping: boolean } {
    try {
      // If no free shipping threshold configured, return original cost
      if (!method.freeShippingThreshold) {
        return { finalCost: cost, isFreeShipping: false };
      }

      const threshold = Number(method.freeShippingThreshold);

      // Validate threshold
      if (isNaN(threshold) || threshold < 0) {
        this.logger.warn('Invalid free shipping threshold for method, skipping free shipping', {
          methodId: method.methodId,
          invalidThreshold: method.freeShippingThreshold,
          context: 'free_shipping_threshold_validation'
        });
        return { finalCost: cost, isFreeShipping: false };
      }

      // If order value meets or exceeds threshold, apply free shipping
      if (orderValue >= threshold) {
        return {
          finalCost: 0,
          originalCost: cost,
          isFreeShipping: true,
        };
      }

      return { finalCost: cost, isFreeShipping: false };
    } catch (error) {
      this.logger.error('Error applying free shipping for method, using original cost', {
        methodId: method.methodId,
        error: error.message,
        originalCost: cost,
        context: 'free_shipping_error'
      });
      return { finalCost: cost, isFreeShipping: false };
    }
  }

  /**
   * Get shipping method details by method ID
   * Fetches from database with fallback logic for service unavailability
   */
  async getShippingMethodDetails(
    methodId: string,
    locale: 'en' | 'vi' = 'en',
  ): Promise<{
    name: string;
    description: string;
  }> {
    try {
      // Log method details request with locale information
      this.logger.log('Shipping method details request received', {
        methodId: methodId,
        requestedLocale: locale,
        context: 'method_details_request'
      });

      const method = await this.shippingMethodsService.findByMethodId(methodId);
      const effectiveLocale = locale || 'en';

      // Log missing translations for method details request
      const missingFields: string[] = [];
      if (!method.nameVi) missingFields.push('nameVi');
      if (!method.descriptionVi) missingFields.push('descriptionVi');
      if (!method.nameEn) missingFields.push('nameEn');
      if (!method.descriptionEn) missingFields.push('descriptionEn');

      if (missingFields.length > 0) {
        this.logger.warn('Missing translation fields in method details request', {
          methodId: methodId,
          missingFields: missingFields,
          requestedLocale: effectiveLocale,
          context: 'method_details_request'
        });
      }

      // Log specific fallback usage
      const name = effectiveLocale === 'vi' ? (method.nameVi || method.nameEn) : method.nameEn;
      const description = effectiveLocale === 'vi' ? (method.descriptionVi || method.descriptionEn) : method.descriptionEn;

      if (effectiveLocale === 'vi') {
        if (!method.nameVi && method.nameEn) {
          this.logger.warn('Using English fallback for Vietnamese name in method details', {
            methodId: methodId,
            field: 'nameVi',
            fallbackValue: method.nameEn,
            context: 'method_details_fallback'
          });
        }
        if (!method.descriptionVi && method.descriptionEn) {
          this.logger.warn('Using English fallback for Vietnamese description in method details', {
            methodId: methodId,
            field: 'descriptionVi',
            fallbackValue: method.descriptionEn,
            context: 'method_details_fallback'
          });
        }
      }

      return { name, description };
    } catch (error) {
      // Use resilience service for fallback
      this.logger.warn('Failed to get shipping method details, using fallback', {
        methodId: methodId,
        requestedLocale: locale,
        error: error.message,
        context: 'method_details_service_failure'
      });
      return this.shippingResilienceService.getCachedTranslations(methodId, locale);
    }
  }

  /**
   * Generate shipping label for an order
   * Note: This is a simplified implementation. In production, integrate with shipping provider API
   * (e.g., ShipStation, EasyPost, or carrier-specific APIs like USPS, FedEx, UPS)
   */
  async generateShippingLabel(
    generateLabelDto: GenerateLabelDto,
  ): Promise<ShippingLabel> {
    const { orderId, carrier } = generateLabelDto;

    // Find the order
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shippingAddress: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if order can have a shipping label generated
    if (
      order.status === OrderStatus.CANCELLED ||
      order.status === OrderStatus.REFUNDED
    ) {
      throw new BadRequestException(
        'Cannot generate shipping label for cancelled or refunded orders',
      );
    }

    // Generate a tracking number (in production, this would come from the shipping provider API)
    const trackingNumber = this.generateTrackingNumber(carrier);

    // In production, integrate with shipping provider API here:
    // const shipstation = new ShipStation(process.env.SHIPSTATION_API_KEY);
    // const label = await shipstation.createLabel({
    //   orderId: order.orderNumber,
    //   carrier: carrier,
    //   service: order.shippingMethod,
    //   shipTo: order.shippingAddress,
    //   weight: calculateTotalWeight(order.items),
    //   dimensions: calculateDimensions(order.items),
    // });
    // trackingNumber = label.trackingNumber;
    // labelUrl = label.labelUrl;

    // For demo purposes, generate a mock label URL
    const labelUrl = `https://example.com/labels/${trackingNumber}.pdf`;

    // Update order with tracking number and status
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.SHIPPED,
        notes: order.notes
          ? `${order.notes}\n\nShipping label generated. Tracking: ${trackingNumber}`
          : `Shipping label generated. Tracking: ${trackingNumber}`,
      },
    });

    // In production, send shipping notification email here
    // await this.emailService.sendShippingNotification(order.email, {
    //   orderNumber: order.orderNumber,
    //   trackingNumber,
    //   carrier,
    //   estimatedDelivery: calculateEstimatedDelivery(order.shippingMethod),
    // });

    return {
      trackingNumber,
      labelUrl,
      carrier,
      orderId: order.id,
      orderNumber: order.orderNumber,
      createdAt: new Date(),
    };
  }

  /**
   * Validate shipping method for calculation
   * Checks data integrity and excludes corrupted methods
   */
  private async validateMethodForCalculation(method: ShippingMethod): Promise<ValidationResult> {
    return this.shippingValidationService.validateMethodDataIntegrity(method);
  }

  /**
   * Track locale usage patterns for analytics
   * Logs aggregated data about locale preferences and usage
   */
  private trackLocaleUsage(
    locale: string | undefined,
    country: string,
    context: string
  ): void {
    const effectiveLocale = locale || 'en';
    const timestamp = new Date().toISOString();

    this.logger.log('Locale usage analytics', {
      timestamp: timestamp,
      requestedLocale: locale,
      effectiveLocale: effectiveLocale,
      localeExplicitlyProvided: !!locale,
      destinationCountry: country,
      context: context,
      analytics: {
        isVietnameseRequest: effectiveLocale === 'vi',
        isDefaultFallback: !locale,
        countryLocaleMatch: (country.toLowerCase() === 'vietnam' && effectiveLocale === 'vi') ||
                           (country.toLowerCase() !== 'vietnam' && effectiveLocale === 'en')
      }
    });
  }

  /**
   * Generate a mock tracking number
   * In production, this would come from the shipping provider
   */
  private generateTrackingNumber(carrier: string): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');

    const prefix = carrier.substring(0, 3).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }
}
