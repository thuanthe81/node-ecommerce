# Design Document: Zero-Price Products

## Overview

This feature enables the e-commerce platform to support products with a price of zero, allowing customers to add them to cart and place orders. The shop administrator can then set custom prices for these products within each order, enabling a quote-based pricing workflow. This is particularly useful for custom-made items, bespoke products, or items with variable pricing based on customer specifications.

The implementation involves modifications to:
- Backend validation rules to permit zero prices
- Frontend display logic to show "Contact for Price" messaging
- Cart and checkout flows to accept zero-price products
- Order management to allow admin price setting per order item
- Admin interface to set prices for zero-price products in orders
- Order total calculation based on admin-set prices

## Architecture

### Backend Changes

The backend currently enforces a minimum price of 0 through the `@Min(0)` decorator in DTOs, which already permits zero values. However, the business logic and validation need to be updated to explicitly handle zero-price products as a special case.

**Key Components:**
- **Product DTOs**: Already permit zero prices but need documentation
- **Product Service**: Add helper methods to identify zero-price products
- **Cart Service**: Accept zero-price products with special handling
- **Order Service**: Accept orders with zero-price products and track pricing status
- **Order Item Management**: Add functionality to set custom prices for order items
- **Order Status**: Add new status or flag for orders requiring price quotes

### Frontend Changes

The frontend needs significant updates to handle zero-price products appropriately across multiple components.

**Key Components:**
- **ProductCard**: Display "Contact for Price" instead of price formatting
- **Product Detail Page**: Allow "Add to Cart" with special messaging
- **Cart Components**: Display zero-price products with "Price TBD" indicator
- **Checkout**: Allow orders with zero-price products
- **Admin Order Management**: Add interface to set prices for zero-price order items
- **ProductForm (Admin)**: Add visual indicators for zero-price products
- **Product Listing**: Handle zero-price products in filtering and sorting

## Components and Interfaces

### Backend

#### Product Service Enhancement

```typescript
// New helper method in ProductsService
isContactForPrice(product: Product): boolean {
  return Number(product.price) === 0;
}
```

#### Cart Service Enhancement

```typescript
// Enhanced handling in CartService.addToCart()
async addToCart(userId: string, productId: string, quantity: number) {
  const product = await this.getProduct(productId);

  // Accept zero-price products, store with price = 0
  const cartItem = {
    productId,
    quantity,
    price: product.price, // Will be 0 for contact-for-price products
  };

  // ... existing cart logic
}
```

#### Order Service Enhancement

```typescript
// Enhanced handling in OrdersService.createOrder()
async createOrder(createOrderDto: CreateOrderDto) {
  let hasZeroPriceItems = false;

  // Check for zero-price products
  for (const item of createOrderDto.items) {
    const product = await this.getProduct(item.productId);
    if (Number(product.price) === 0) {
      hasZeroPriceItems = true;
    }
  }

  // Create order with special status if it has zero-price items
  const order = await this.create({
    ...createOrderDto,
    status: hasZeroPriceItems ? OrderStatus.PENDING_QUOTE : OrderStatus.PENDING,
    requiresPricing: hasZeroPriceItems,
  });

  return order;
}

// New method to set price for order item
async setOrderItemPrice(orderId: string, orderItemId: string, price: number) {
  // Update the order item price
  await this.updateOrderItem(orderItemId, { price, total: price * quantity });

  // Recalculate order total
  await this.recalculateOrderTotal(orderId);

  // Check if all items are priced, update order status
  const order = await this.getOrder(orderId);
  const allItemsPriced = order.items.every(item => Number(item.price) > 0);

  if (allItemsPriced && order.status === OrderStatus.PENDING_QUOTE) {
    await this.updateOrderStatus(orderId, OrderStatus.PENDING);
  }
}
```

### Frontend

#### Product Type Extension

```typescript
// Utility function to check if product requires contact
export function isContactForPrice(product: Product): boolean {
  return Number(product.price) === 0;
}
```

#### ProductCard Component

```typescript
// Price display logic
{isContactForPrice(product) ? (
  <div className="text-lg font-semibold text-blue-600">
    {locale === 'vi' ? 'Liên hệ để biết giá' : 'Contact for Price'}
  </div>
) : (
  <span className="text-xl font-bold text-gray-900">
    {formatPrice(product.price)}
  </span>
)}
```

#### Product Detail Page

```typescript
// Button logic - allow adding to cart with messaging
<button onClick={handleAddToCart} className="...">
  {locale === 'vi' ? 'Thêm vào giỏ' : 'Add to Cart'}
</button>

{isContactForPrice(product) && (
  <p className="mt-2 text-sm text-gray-600">
    {locale === 'vi'
      ? 'Giá sẽ được cung cấp sau khi bạn đặt hàng'
      : 'Price will be provided after you place your order'}
  </p>
)}
```

#### Cart Component

```typescript
// Display zero-price items with indicator
{cartItems.map(item => (
  <div key={item.id}>
    <h3>{item.product.name}</h3>
    <p>
      {isContactForPrice(item.product) ? (
        <span className="text-blue-600 font-semibold">
          {locale === 'vi' ? 'Giá: Đang chờ báo giá' : 'Price: TBD'}
        </span>
      ) : (
        <span>{formatPrice(item.price)}</span>
      )}
    </p>
  </div>
))}

{hasZeroPriceItems && (
  <div className="bg-blue-50 p-4 rounded">
    <p className="text-sm text-blue-800">
      {locale === 'vi'
        ? 'Đơn hàng của bạn có sản phẩm cần báo giá. Chúng tôi sẽ liên hệ với bạn sau khi đặt hàng.'
        : 'Your order contains items requiring quotes. We will contact you after order placement.'}
    </p>
  </div>
)}
```

#### Admin Order Detail Page

```typescript
// Interface to set prices for zero-price items
{order.items.map(item => (
  <div key={item.id}>
    <h4>{item.productName}</h4>
    {Number(item.price) === 0 ? (
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder="Set price"
          value={itemPrices[item.id] || ''}
          onChange={(e) => handlePriceChange(item.id, e.target.value)}
          className="border rounded px-2 py-1"
        />
        <button
          onClick={() => handleSetPrice(item.id)}
          className="bg-blue-600 text-white px-3 py-1 rounded"
        >
          {locale === 'vi' ? 'Đặt giá' : 'Set Price'}
        </button>
      </div>
    ) : (
      <p>{formatPrice(item.price)}</p>
    )}
  </div>
))}

{order.requiresPricing && (
  <div className="bg-yellow-50 p-4 rounded mt-4">
    <p className="text-sm text-yellow-800">
      {locale === 'vi'
        ? '⚠️ Đơn hàng này cần đặt giá cho các sản phẩm trước khi xử lý'
        : '⚠️ This order requires pricing before processing'}
    </p>
  </div>
)}
```

#### Admin Product Form

```typescript
// Visual indicator for zero price
{formData.price === 0 && (
  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
    <p className="text-sm text-blue-800">
      {locale === 'vi'
        ? '💡 Giá 0 = Khách hàng cần liên hệ để biết giá'
        : '💡 Price 0 = Customer must contact for pricing'}
    </p>
  </div>
)}
```

### Email Template Robustness

The email templates need to be enhanced to handle undefined, null, or NaN price values gracefully. This is critical because when orders contain products without prices, the email template rendering can fail.

#### Enhanced formatCurrency Helper

```typescript
// Enhanced formatCurrency helper in EmailHandlebarsHelpers
private static formatCurrencyHelper(): HelperDelegate {
  return function(amount: number, currency: string = 'VND', locale?: string) {
    // Handle undefined, null, NaN, or non-numeric values
    if (amount === undefined || amount === null || typeof amount !== 'number' || isNaN(amount)) {
      const templateLocale = locale || (this as any).locale || 'en';

      // Log the occurrence for debugging
      console.warn(`[EmailTemplate] Undefined price encountered in formatCurrency: ${amount}`);

      // Return localized "Contact for Price" text
      return templateLocale === 'vi' ? 'Liên hệ để biết giá' : 'Contact for Price';
    }

    // Use the locale from template context if not provided
    const templateLocale = locale || (this as any).locale || 'en';

    try {
      if (templateLocale === 'vi') {
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: currency === 'VND' ? 0 : 2
        }).format(amount);
      } else {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency === 'VND' ? 'USD' : currency,
          minimumFractionDigits: 2
        }).format(amount);
      }
    } catch (error) {
      // Fallback to simple formatting if Intl fails
      const formattedAmount = amount.toLocaleString();
      return currency === 'VND' ? `${formattedAmount} ₫` : `${formattedAmount}`;
    }
  };
}
```

#### Safe Total Calculation Helper

```typescript
// New helper for safe total calculation
private static safeCalculateTotalHelper(): HelperDelegate {
  return function(items: any[], locale?: string) {
    if (!Array.isArray(items)) return '0';

    const templateLocale = locale || (this as any).locale || 'en';
    let total = 0;
    let hasUndefinedPrices = false;

    for (const item of items) {
      const price = item.price || item.total;
      if (price === undefined || price === null || typeof price !== 'number' || isNaN(price)) {
        hasUndefinedPrices = true;
        // Treat undefined prices as 0 for calculation
        continue;
      }
      total += price;
    }

    if (hasUndefinedPrices) {
      console.warn(`[EmailTemplate] Order contains items with undefined prices`);

      // Return total with note about quote items
      const formattedTotal = this.formatCurrency(total, 'VND', templateLocale);
      const quoteNote = templateLocale === 'vi'
        ? ' (+ giá sản phẩm cần báo giá)'
        : ' (+ quote items)';

      return formattedTotal + quoteNote;
    }

    return this.formatCurrency(total, 'VND', templateLocale);
  };
}
```

#### Template Data Sanitization

```typescript
// Enhanced email template service to sanitize data
export class EmailTemplateService {
  private sanitizeOrderData(data: any): any {
    const sanitized = { ...data };

    // Sanitize order items
    if (sanitized.items && Array.isArray(sanitized.items)) {
      sanitized.items = sanitized.items.map(item => ({
        ...item,
        price: this.sanitizePrice(item.price),
        total: this.sanitizePrice(item.total)
      }));
    }

    // Sanitize order totals
    sanitized.subtotal = this.sanitizePrice(sanitized.subtotal);
    sanitized.total = this.sanitizePrice(sanitized.total);
    sanitized.shippingCost = this.sanitizePrice(sanitized.shippingCost);
    sanitized.taxAmount = this.sanitizePrice(sanitized.taxAmount);
    sanitized.discountAmount = this.sanitizePrice(sanitized.discountAmount);

    return sanitized;
  }

  private sanitizePrice(price: any): number {
    if (price === undefined || price === null || typeof price !== 'number' || isNaN(price)) {
      return 0; // Default to 0 for calculation purposes
    }
    return price;
  }
}
```

## Data Models

### Database Schema Changes

We need to add a field to track whether an order requires pricing:

```prisma
model Order {
  // ... existing fields
  requiresPricing   Boolean       @default(false)
  // ... rest of fields
}
```

### Order Status Enhancement

Consider adding a new order status for quote-pending orders:

```prisma
enum OrderStatus {
  PENDING
  PENDING_QUOTE  // New status for orders awaiting price quotes
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}
```

### Order Item Price Override

The existing `OrderItem` model already supports custom prices per item through the `price` field. When a product has price = 0, the order item will initially have price = 0, which the admin can then update.

**Key Points:**
- Product base price remains 0 (never modified)
- OrderItem price is set by admin for each order independently
- Multiple orders can have different prices for the same zero-price product

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Zero-price product persistence

*For any* product data with price set to zero, creating or updating the product should successfully persist to the database, and retrieving it should return price = 0 without validation errors.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Contact-for-price display consistency

*For any* product with zero price, when rendered in any customer-facing component (card, detail, listing), the displayed text should contain "Contact for Price" (or localized equivalent) and should not contain numeric price formatting or currency symbols.

**Validates: Requirements 2.1, 2.2**

### Property 3: Pricing guidance presence

*For any* zero-price product detail page, the rendered output should contain messaging explaining that pricing will be provided after order placement.

**Validates: Requirements 2.3, 2.4**

### Property 4: Cart acceptance for zero-price products

*For any* zero-price product, adding it to cart should succeed, and the cart display should show "Price TBD" or similar indicator instead of a numeric price.

**Validates: Requirements 3.1**

### Property 5: Cart messaging for quote items

*For any* cart containing at least one zero-price product, the cart view should display a message indicating that final pricing will be provided by the shop.

**Validates: Requirements 3.2**

### Property 6: Checkout acceptance with zero-price items

*For any* cart containing zero-price products, proceeding to checkout should successfully create an order with total = 0 (or sum of non-zero items).

**Validates: Requirements 3.3**

### Property 7: Order quote status assignment

*For any* order containing at least one zero-price product, the order should have requiresPricing = true or status = PENDING_QUOTE.

**Validates: Requirements 3.4**

### Property 8: Admin price setting interface

*For any* order containing zero-price items, the admin order detail view should display price input fields for each zero-price item.

**Validates: Requirements 4.1**

### Property 9: Product price isolation

*For any* zero-price product in an order, when the admin sets the order item price, the product's base price should remain 0 (unchanged).

**Validates: Requirements 4.2**

### Property 10: Order total calculation with custom prices

*For any* order where all items have prices > 0 (including admin-set prices), the order total should equal the sum of (item price × quantity) plus shipping and tax.

**Validates: Requirements 4.3**

### Property 11: Fulfillment blocking for unpriced items

*For any* order containing at least one item with price = 0, attempting to move the order to PROCESSING or SHIPPED status should be rejected.

**Validates: Requirements 4.4**

### Property 12: Total recalculation on price update

*For any* order item price update, the order total should immediately reflect the new calculation.

**Validates: Requirements 4.5**

### Property 13: Price filtering robustness

*For any* product filtering or sorting operation by price on a dataset containing zero-price products, the operation should complete without errors and handle zero-price products consistently.

**Validates: Requirements 5.2**

### Property 14: Admin product visual indication

*For any* zero-price product displayed in the admin product list, the interface should include a visual indicator (badge, message, or styling) that clearly identifies it as a contact-for-price product.

**Validates: Requirements 6.1**

### Property 15: Admin order visual indication

*For any* order with requiresPricing = true, the admin order list should display a visual indicator highlighting that the order needs pricing.

**Validates: Requirements 6.2**

### Property 16: Email template undefined price handling

*For any* email template rendering with undefined, null, or NaN price values, the template should render successfully without throwing errors and display appropriate fallback text.

**Validates: Requirements 7.1, 7.2, 7.3**

### Property 17: Email template total calculation robustness

*For any* order data with undefined or null item prices, email templates should calculate totals by treating undefined prices as zero and display appropriate messaging about quote items.

**Validates: Requirements 7.4**

### Property 18: Email template error logging

*For any* email template that encounters undefined price values, the system should log the occurrence for debugging while still successfully rendering and sending the email.

**Validates: Requirements 7.5**

## Error Handling

### Backend Error Responses

**Order Fulfillment Error (unpriced items):**
```json
{
  "statusCode": 400,
  "message": "Cannot process order with unpriced items. Please set prices for all items first.",
  "error": "Bad Request"
}
```

**Invalid Price Setting:**
```json
{
  "statusCode": 400,
  "message": "Price must be greater than 0",
  "error": "Bad Request"
}
```

### Frontend Error Handling

- Display user-friendly messages in cart when zero-price items are present
- Show clear admin warnings when orders have unpriced items
- Provide helpful guidance for customers about the quote process
- Log errors for debugging while showing graceful UI feedback

## Testing Strategy

### Unit Testing

**Backend:**
- Test product creation with price = 0
- Test cart service rejection of zero-price products
- Test order service validation against zero-price products
- Test helper methods for identifying zero-price products

**Frontend:**
- Test `isContactForPrice()` utility function with various price values
- Test ProductCard rendering with zero-price products
- Test product detail page button logic
- Test admin form visual indicators

### Property-Based Testing

We will use **fast-check** for JavaScript/TypeScript property-based testing. Each test should run a minimum of 100 iterations.

**Property Tests:**

1. **Zero-price creation property** - Generate random product data with price = 0, verify successful creation
2. **Display consistency property** - Generate random zero-price products, verify all rendering functions return "Contact for Price" text
3. **Cart rejection property** - Generate random zero-price products, verify cart addition always fails with appropriate error
4. **Button replacement property** - Generate random zero-price products, verify detail page always shows contact button
5. **Order validation property** - Generate random orders with at least one zero-price item, verify all are rejected
6. **Price filtering property** - Generate random product sets including zero-price items, verify filtering handles them consistently
7. **Admin indication property** - Generate random zero-price products, verify admin UI always shows indicator

### Integration Testing

- End-to-end test: Create zero-price product in admin, verify customer-facing display
- End-to-end test: Attempt to add zero-price product to cart, verify rejection
- End-to-end test: Navigate from zero-price product to contact page
- Test product listing with mixed regular and zero-price products

### Edge Cases

- Product with price exactly 0.00
- Product updated from non-zero to zero price
- Product updated from zero to non-zero price
- Filtering products when all products are zero-price
- Sorting products by price with zero-price products included

## Implementation Notes

### Backward Compatibility

This feature is backward compatible. Existing products with non-zero prices will continue to function normally. The system already permits zero prices at the database and DTO level.

### Localization

All user-facing messages must be properly localized:
- "Contact for Price" / "Liên hệ để biết giá"
- "Contact Us for Pricing" / "Liên hệ để biết giá"
- Error messages in both English and Vietnamese

### Performance Considerations

- The `isContactForPrice()` check is a simple numeric comparison with negligible performance impact
- No additional database queries are required
- Frontend rendering logic adds minimal overhead

### Accessibility

- Ensure "Contact for Price" text has appropriate ARIA labels
- Contact buttons should have clear accessible names
- Screen readers should announce the pricing status clearly

## Future Enhancements

- Analytics tracking for zero-price product views and contact conversions
- Admin dashboard showing inquiry rates for zero-price products
- Automated email notifications when customers view zero-price products
- Integration with CRM for tracking price inquiries
