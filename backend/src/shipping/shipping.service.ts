import { Injectable } from '@nestjs/common';
import { CalculateShippingDto } from './dto/calculate-shipping.dto';

export interface ShippingRate {
  method: string;
  name: string;
  description: string;
  cost: number;
  estimatedDays: string;
  carrier?: string;
}

@Injectable()
export class ShippingService {
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
}
