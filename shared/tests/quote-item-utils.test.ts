import {
  hasQuoteItems,
  validateAllItemsPriced,
  canGeneratePDF,
  canChangeOrderStatus,
  getQuoteItems,
  getPricedItems,
  countQuoteItems,
  countPricedItems,
  OrderData,
  OrderItemData
} from '../src/utils/quote-item-utils';

describe('Quote Item Utilities', () => {
  const createOrderItem = (price: number, total: number, name: string = 'Test Item'): OrderItemData => ({
    name,
    quantity: 1,
    price,
    total,
  });

  const createOrder = (items: OrderItemData[]): OrderData => ({
    orderNumber: 'TEST-001',
    items,
  });

  describe('hasQuoteItems', () => {
    it('should return true when order has items with zero prices', () => {
      const order = createOrder([
        createOrderItem(100, 100, 'Regular Item'),
        createOrderItem(0, 0, 'Quote Item'),
      ]);

      expect(hasQuoteItems(order)).toBe(true);
    });

    it('should return true when order has items with undefined prices', () => {
      const order = createOrder([
        createOrderItem(100, 100, 'Regular Item'),
        createOrderItem(undefined as any, undefined as any, 'Quote Item'),
      ]);

      expect(hasQuoteItems(order)).toBe(true);
    });

    it('should return true when order has items with null prices', () => {
      const order = createOrder([
        createOrderItem(100, 100, 'Regular Item'),
        createOrderItem(null as any, null as any, 'Quote Item'),
      ]);

      expect(hasQuoteItems(order)).toBe(true);
    });

    it('should return false when all items have valid prices', () => {
      const order = createOrder([
        createOrderItem(100, 100, 'Item 1'),
        createOrderItem(200, 200, 'Item 2'),
      ]);

      expect(hasQuoteItems(order)).toBe(false);
    });

    it('should return false for empty order', () => {
      const order = createOrder([]);
      expect(hasQuoteItems(order)).toBe(false);
    });

    it('should handle order with no items array', () => {
      const order = { orderNumber: 'TEST-001', items: undefined as any };
      expect(hasQuoteItems(order)).toBe(false);
    });
  });

  describe('validateAllItemsPriced', () => {
    it('should return true when all items have positive prices', () => {
      const order = createOrder([
        createOrderItem(100, 100, 'Item 1'),
        createOrderItem(200, 200, 'Item 2'),
      ]);

      expect(validateAllItemsPriced(order)).toBe(true);
    });

    it('should return false when any item has zero price', () => {
      const order = createOrder([
        createOrderItem(100, 100, 'Regular Item'),
        createOrderItem(0, 0, 'Quote Item'),
      ]);

      expect(validateAllItemsPriced(order)).toBe(false);
    });

    it('should return false when any item has undefined price', () => {
      const order = createOrder([
        createOrderItem(100, 100, 'Regular Item'),
        createOrderItem(undefined as any, undefined as any, 'Quote Item'),
      ]);

      expect(validateAllItemsPriced(order)).toBe(false);
    });

    it('should return true for empty order', () => {
      const order = createOrder([]);
      expect(validateAllItemsPriced(order)).toBe(true);
    });
  });

  describe('canGeneratePDF', () => {
    it('should return true when all items are priced', () => {
      const order = createOrder([
        createOrderItem(100, 100, 'Item 1'),
        createOrderItem(200, 200, 'Item 2'),
      ]);

      expect(canGeneratePDF(order)).toBe(true);
    });

    it('should return false when order has quote items', () => {
      const order = createOrder([
        createOrderItem(100, 100, 'Regular Item'),
        createOrderItem(0, 0, 'Quote Item'),
      ]);

      expect(canGeneratePDF(order)).toBe(false);
    });
  });

  describe('canChangeOrderStatus', () => {
    it('should return true when order has no quote items', () => {
      const order = createOrder([
        createOrderItem(100, 100, 'Item 1'),
        createOrderItem(200, 200, 'Item 2'),
      ]);

      expect(canChangeOrderStatus(order)).toBe(true);
    });

    it('should return false when order has quote items', () => {
      const order = createOrder([
        createOrderItem(100, 100, 'Regular Item'),
        createOrderItem(0, 0, 'Quote Item'),
      ]);

      expect(canChangeOrderStatus(order)).toBe(false);
    });
  });

  describe('getQuoteItems', () => {
    it('should return only items with zero or invalid prices', () => {
      const order = createOrder([
        createOrderItem(100, 100, 'Regular Item'),
        createOrderItem(0, 0, 'Quote Item 1'),
        createOrderItem(null as any, null as any, 'Quote Item 2'),
        createOrderItem(200, 200, 'Another Regular Item'),
      ]);

      const quoteItems = getQuoteItems(order);
      expect(quoteItems).toHaveLength(2);
      expect(quoteItems[0].name).toBe('Quote Item 1');
      expect(quoteItems[1].name).toBe('Quote Item 2');
    });

    it('should return empty array when no quote items exist', () => {
      const order = createOrder([
        createOrderItem(100, 100, 'Item 1'),
        createOrderItem(200, 200, 'Item 2'),
      ]);

      expect(getQuoteItems(order)).toHaveLength(0);
    });
  });

  describe('getPricedItems', () => {
    it('should return only items with valid positive prices', () => {
      const order = createOrder([
        createOrderItem(100, 100, 'Regular Item 1'),
        createOrderItem(0, 0, 'Quote Item'),
        createOrderItem(200, 200, 'Regular Item 2'),
      ]);

      const pricedItems = getPricedItems(order);
      expect(pricedItems).toHaveLength(2);
      expect(pricedItems[0].name).toBe('Regular Item 1');
      expect(pricedItems[1].name).toBe('Regular Item 2');
    });
  });

  describe('countQuoteItems', () => {
    it('should return correct count of quote items', () => {
      const order = createOrder([
        createOrderItem(100, 100, 'Regular Item'),
        createOrderItem(0, 0, 'Quote Item 1'),
        createOrderItem(null as any, null as any, 'Quote Item 2'),
        createOrderItem(200, 200, 'Another Regular Item'),
      ]);

      expect(countQuoteItems(order)).toBe(2);
    });

    it('should return 0 when no quote items exist', () => {
      const order = createOrder([
        createOrderItem(100, 100, 'Item 1'),
        createOrderItem(200, 200, 'Item 2'),
      ]);

      expect(countQuoteItems(order)).toBe(0);
    });
  });

  describe('countPricedItems', () => {
    it('should return correct count of priced items', () => {
      const order = createOrder([
        createOrderItem(100, 100, 'Regular Item 1'),
        createOrderItem(0, 0, 'Quote Item'),
        createOrderItem(200, 200, 'Regular Item 2'),
      ]);

      expect(countPricedItems(order)).toBe(2);
    });

    it('should return 0 when no priced items exist', () => {
      const order = createOrder([
        createOrderItem(0, 0, 'Quote Item 1'),
        createOrderItem(null as any, null as any, 'Quote Item 2'),
      ]);

      expect(countPricedItems(order)).toBe(0);
    });
  });
});