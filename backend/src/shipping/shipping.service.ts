import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CalculateShippingDto } from './dto/calculate-shipping.dto';
import { GenerateLabelDto } from './dto/generate-label.dto';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, ShippingMethod } from '@prisma/client';
import { ShippingMethodsService } from './shipping-methods.service';

export interface ShippingRate {
  method: string;
  name: string;
  description: string;
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
  constructor(
    private prisma: PrismaService,
    private shippingMethodsService: ShippingMethodsService,
  ) {}
  /**
   * Calculate shipping rates based on destination and package details
   * Fetches active shipping methods from database and applies pricing rules
   */
  async calculateShipping(
    calculateShippingDto: CalculateShippingDto,
  ): Promise<ShippingRate[]> {
    const { destinationCountry, items, orderValue } = calculateShippingDto;

    // Calculate total weight
    const totalWeight = items.reduce(
      (sum, item) => sum + item.weight * item.quantity,
      0,
    );

    // Fetch active shipping methods from database
    const activeMethods = await this.shippingMethodsService.findAllActive();

    // Calculate cost for each method
    const rates: ShippingRate[] = activeMethods.map((method) => {
      const cost = this.calculateMethodCost(
        method,
        totalWeight,
        orderValue || 0,
        destinationCountry,
      );

      return {
        method: method.methodId,
        name: method.nameEn,
        description: method.descriptionEn,
        cost: cost.finalCost,
        estimatedDays: `${method.estimatedDaysMin}-${method.estimatedDaysMax} days`,
        carrier: method.carrier || undefined,
        isFreeShipping: cost.isFreeShipping,
        originalCost: cost.isFreeShipping ? cost.originalCost : undefined,
      };
    });

    return rates;
  }

  /**
   * Calculate cost for a specific shipping method
   * Applies base rate, weight-based charges, regional pricing, and free shipping threshold
   */
  private calculateMethodCost(
    method: ShippingMethod,
    weight: number,
    orderValue: number,
    country: string,
  ): { finalCost: number; originalCost?: number; isFreeShipping: boolean } {
    // Get base rate (or regional rate if applicable)
    let cost = this.getRegionalRate(method, country);

    // Apply weight-based charges
    cost = this.applyWeightCharges(cost, method, weight);

    // Round to 2 decimal places
    cost = Math.round(cost * 100) / 100;

    // Apply free shipping threshold
    const result = this.applyFreeShipping(cost, method, orderValue);

    return result;
  }

  /**
   * Get the appropriate rate for a shipping method based on destination country
   * Checks regional pricing configuration and falls back to base rate
   */
  private getRegionalRate(method: ShippingMethod, country: string): number {
    const baseRate = Number(method.baseRate);

    // If no regional pricing configured, return base rate
    if (!method.regionalPricing) {
      return baseRate;
    }

    const regionalPricing = method.regionalPricing as Record<string, number>;
    const countryLower = country.toLowerCase();

    // Check for country-specific rate (highest precedence)
    if (regionalPricing[countryLower] !== undefined) {
      return regionalPricing[countryLower];
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
          return regionalPricing[region];
        }
      }
    }

    // Fall back to base rate
    return baseRate;
  }

  /**
   * Apply weight-based charges to the base rate
   * Adds additional cost for weight exceeding the threshold
   */
  private applyWeightCharges(
    baseRate: number,
    method: ShippingMethod,
    weight: number,
  ): number {
    // If no weight-based pricing configured, return base rate
    if (!method.weightThreshold || !method.weightRate) {
      return baseRate;
    }

    const weightThreshold = Number(method.weightThreshold);
    const weightRate = Number(method.weightRate);

    // If weight is under threshold, no additional charges
    if (weight <= weightThreshold) {
      return baseRate;
    }

    // Calculate additional weight charges
    const excessWeight = weight - weightThreshold;
    const weightCharge = excessWeight * weightRate;

    return baseRate + weightCharge;
  }

  /**
   * Apply free shipping threshold
   * Sets cost to 0 if order value meets or exceeds threshold
   */
  private applyFreeShipping(
    cost: number,
    method: ShippingMethod,
    orderValue: number,
  ): { finalCost: number; originalCost?: number; isFreeShipping: boolean } {
    // If no free shipping threshold configured, return original cost
    if (!method.freeShippingThreshold) {
      return { finalCost: cost, isFreeShipping: false };
    }

    const threshold = Number(method.freeShippingThreshold);

    // If order value meets or exceeds threshold, apply free shipping
    if (orderValue >= threshold) {
      return {
        finalCost: 0,
        originalCost: cost,
        isFreeShipping: true,
      };
    }

    return { finalCost: cost, isFreeShipping: false };
  }

  /**
   * Get shipping method details by method ID
   * Fetches from database instead of hardcoded values
   */
  async getShippingMethodDetails(methodId: string): Promise<{
    name: string;
    description: string;
  }> {
    try {
      const method = await this.shippingMethodsService.findByMethodId(methodId);
      return {
        name: method.nameEn,
        description: method.descriptionEn,
      };
    } catch (error) {
      // Fallback for backward compatibility
      return {
        name: 'Standard Shipping',
        description: 'Standard delivery',
      };
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
