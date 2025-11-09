import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CalculateShippingDto } from './dto/calculate-shipping.dto';
import { GenerateLabelDto } from './dto/generate-label.dto';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

export interface ShippingRate {
  method: string;
  name: string;
  description: string;
  cost: number;
  estimatedDays: string;
  carrier?: string;
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
  constructor(private prisma: PrismaService) {}
  /**
   * Calculate shipping rates based on destination and package details
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

    // Calculate total volume (if dimensions provided)
    const totalVolume = items.reduce((sum, item) => {
      if (item.length && item.width && item.height) {
        return sum + item.length * item.width * item.height * item.quantity;
      }
      return sum;
    }, 0);

    // Base rates (simplified calculation)
    const rates: ShippingRate[] = [];

    // Domestic shipping (Vietnam)
    if (destinationCountry.toLowerCase() === 'vietnam') {
      rates.push({
        method: 'standard',
        name: 'Standard Shipping',
        description: 'Delivery in 5-7 business days',
        cost: this.calculateDomesticStandardRate(totalWeight, orderValue),
        estimatedDays: '5-7 days',
        carrier: 'Vietnam Post',
      });

      rates.push({
        method: 'express',
        name: 'Express Shipping',
        description: 'Delivery in 2-3 business days',
        cost: this.calculateDomesticExpressRate(totalWeight, orderValue),
        estimatedDays: '2-3 days',
        carrier: 'Express Delivery',
      });

      rates.push({
        method: 'overnight',
        name: 'Overnight Shipping',
        description: 'Next business day delivery',
        cost: this.calculateDomesticOvernightRate(totalWeight, orderValue),
        estimatedDays: '1 day',
        carrier: 'Express Delivery',
      });
    } else {
      // International shipping
      rates.push({
        method: 'international_standard',
        name: 'International Standard',
        description: 'Delivery in 10-15 business days',
        cost: this.calculateInternationalStandardRate(
          totalWeight,
          destinationCountry,
        ),
        estimatedDays: '10-15 days',
        carrier: 'International Post',
      });

      rates.push({
        method: 'international_express',
        name: 'International Express',
        description: 'Delivery in 5-7 business days',
        cost: this.calculateInternationalExpressRate(
          totalWeight,
          destinationCountry,
        ),
        estimatedDays: '5-7 days',
        carrier: 'DHL/FedEx',
      });
    }

    // Apply free shipping for orders over a certain amount
    if (orderValue && orderValue >= 100) {
      rates.forEach((rate) => {
        if (rate.method === 'standard') {
          rate.cost = 0;
          rate.description += ' (FREE)';
        }
      });
    }

    return rates;
  }

  /**
   * Calculate domestic standard shipping rate
   */
  private calculateDomesticStandardRate(
    weight: number,
    orderValue?: number,
  ): number {
    // Base rate
    let cost = 5.0;

    // Add weight-based charges (per kg)
    if (weight > 1) {
      cost += (weight - 1) * 2.0;
    }

    return Math.round(cost * 100) / 100;
  }

  /**
   * Calculate domestic express shipping rate
   */
  private calculateDomesticExpressRate(
    weight: number,
    orderValue?: number,
  ): number {
    // Base rate
    let cost = 15.0;

    // Add weight-based charges (per kg)
    if (weight > 1) {
      cost += (weight - 1) * 3.0;
    }

    return Math.round(cost * 100) / 100;
  }

  /**
   * Calculate domestic overnight shipping rate
   */
  private calculateDomesticOvernightRate(
    weight: number,
    orderValue?: number,
  ): number {
    // Base rate
    let cost = 25.0;

    // Add weight-based charges (per kg)
    if (weight > 1) {
      cost += (weight - 1) * 5.0;
    }

    return Math.round(cost * 100) / 100;
  }

  /**
   * Calculate international standard shipping rate
   */
  private calculateInternationalStandardRate(
    weight: number,
    country: string,
  ): number {
    // Base rate varies by region
    let baseRate = 20.0;

    // Adjust base rate by region
    const asianCountries = [
      'china',
      'japan',
      'korea',
      'thailand',
      'singapore',
      'malaysia',
    ];
    const europeanCountries = [
      'uk',
      'france',
      'germany',
      'italy',
      'spain',
      'netherlands',
    ];

    if (asianCountries.includes(country.toLowerCase())) {
      baseRate = 15.0;
    } else if (europeanCountries.includes(country.toLowerCase())) {
      baseRate = 25.0;
    } else if (country.toLowerCase() === 'usa') {
      baseRate = 30.0;
    }

    // Add weight-based charges (per kg)
    if (weight > 1) {
      baseRate += (weight - 1) * 5.0;
    }

    return Math.round(baseRate * 100) / 100;
  }

  /**
   * Calculate international express shipping rate
   */
  private calculateInternationalExpressRate(
    weight: number,
    country: string,
  ): number {
    // Express is typically 2-3x standard rate
    const standardRate = this.calculateInternationalStandardRate(
      weight,
      country,
    );
    return Math.round(standardRate * 2.5 * 100) / 100;
  }

  /**
   * Get shipping method details by method ID
   */
  getShippingMethodDetails(method: string): {
    name: string;
    description: string;
  } {
    const methods: Record<string, { name: string; description: string }> = {
      standard: {
        name: 'Standard Shipping',
        description: 'Delivery in 5-7 business days',
      },
      express: {
        name: 'Express Shipping',
        description: 'Delivery in 2-3 business days',
      },
      overnight: {
        name: 'Overnight Shipping',
        description: 'Next business day delivery',
      },
      international_standard: {
        name: 'International Standard',
        description: 'Delivery in 10-15 business days',
      },
      international_express: {
        name: 'International Express',
        description: 'Delivery in 5-7 business days',
      },
    };

    return (
      methods[method] || {
        name: 'Standard Shipping',
        description: 'Standard delivery',
      }
    );
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
    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REFUNDED) {
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
