/**
 * Quote Item Utilities
 *
 * Utility functions for handling quote item detection and validation.
 * Extracted from EmailTemplateService sanitizeOrderData logic to provide
 * shared functionality across the application.
 */

export interface OrderItemData {
  id?: string;
  name: string;
  description?: string;
  sku?: string;
  quantity: number;
  price: number;
  total: number;
  unitPrice?: number;
  imageUrl?: string;
  category?: string;
  isQuoteItem?: boolean;
  hasPrice?: boolean;
  priceSetBy?: string;
  priceSetAt?: Date;
}

export interface OrderData {
  orderId?: string;
  orderNumber: string;
  items: OrderItemData[];
  subtotal?: number;
  total?: number;
  shippingCost?: number;
  taxAmount?: number;
  discountAmount?: number;
  [key: string]: any; // Allow additional properties
}

/**
 * Checks if an order contains any quote items (items without prices)
 * @param orderData - The order data to check
 * @returns true if the order contains any quote items, false otherwise
 */
export function hasQuoteItems(orderData: OrderData): boolean {
  if (!orderData.items || !Array.isArray(orderData.items)) {
    return false;
  }

  return orderData.items.some((item: OrderItemData) => {
    const price = item.price || item.unitPrice;
    const total = item.total;

    // Check if this item has undefined/null/zero prices (quote item)
    return (
      price === undefined ||
      price === null ||
      total === undefined ||
      total === null ||
      (typeof price === 'number' && price === 0) ||
      (typeof total === 'number' && total === 0)
    );
  });
}

/**
 * Validates that all items in an order have valid prices set
 * @param orderData - The order data to validate
 * @returns true if all items have valid prices, false otherwise
 */
export function validateAllItemsPriced(orderData: OrderData): boolean {
  if (!orderData.items || !Array.isArray(orderData.items)) {
    return true; // Empty orders are considered valid
  }

  return orderData.items.every((item: OrderItemData) => {
    const price = item.price || item.unitPrice;
    const total = item.total;

    // All items must have valid, positive prices
    return (
      price !== undefined &&
      price !== null &&
      total !== undefined &&
      total !== null &&
      typeof price === 'number' &&
      typeof total === 'number' &&
      price > 0 &&
      total > 0
    );
  });
}

/**
 * Determines if a PDF can be generated for an order
 * PDF generation requires all items to have valid prices
 * @param orderData - The order data to check
 * @returns true if PDF can be generated, false otherwise
 */
export function canGeneratePDF(orderData: OrderData): boolean {
  return validateAllItemsPriced(orderData);
}

/**
 * Determines if an order status can be changed
 * Order status changes are restricted when quote items exist without prices
 * @param orderData - The order data to check
 * @returns true if order status can be changed, false otherwise
 */
export function canChangeOrderStatus(orderData: OrderData): boolean {
  return !hasQuoteItems(orderData);
}

/**
 * Gets a list of items that are quote items (without prices)
 * @param orderData - The order data to check
 * @returns Array of quote items
 */
export function getQuoteItems(orderData: OrderData): OrderItemData[] {
  if (!orderData.items || !Array.isArray(orderData.items)) {
    return [];
  }

  return orderData.items.filter((item: OrderItemData) => {
    const price = item.price || item.unitPrice;
    const total = item.total;

    return (
      price === undefined ||
      price === null ||
      total === undefined ||
      total === null ||
      (typeof price === 'number' && price === 0) ||
      (typeof total === 'number' && total === 0)
    );
  });
}

/**
 * Gets a list of items that have valid prices
 * @param orderData - The order data to check
 * @returns Array of priced items
 */
export function getPricedItems(orderData: OrderData): OrderItemData[] {
  if (!orderData.items || !Array.isArray(orderData.items)) {
    return [];
  }

  return orderData.items.filter((item: OrderItemData) => {
    const price = item.price || item.unitPrice;
    const total = item.total;

    return (
      price !== undefined &&
      price !== null &&
      total !== undefined &&
      total !== null &&
      typeof price === 'number' &&
      typeof total === 'number' &&
      price > 0 &&
      total > 0
    );
  });
}

/**
 * Counts the number of quote items in an order
 * @param orderData - The order data to check
 * @returns Number of quote items
 */
export function countQuoteItems(orderData: OrderData): number {
  return getQuoteItems(orderData).length;
}

/**
 * Counts the number of priced items in an order
 * @param orderData - The order data to check
 * @returns Number of priced items
 */
export function countPricedItems(orderData: OrderData): number {
  return getPricedItems(orderData).length;
}