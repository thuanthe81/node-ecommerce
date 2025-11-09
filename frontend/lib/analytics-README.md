# Analytics Integration

This project includes both custom analytics tracking (stored in the backend database) and Google Analytics 4 integration.

## Setup

### 1. Google Analytics Setup

1. Create a Google Analytics 4 property at https://analytics.google.com
2. Get your Measurement ID (format: G-XXXXXXXXXX)
3. Add it to your `.env.local` file:

```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### 2. Backend Analytics

The backend automatically tracks analytics events in the PostgreSQL database. No additional setup is required.

## Usage

### Using the Analytics Hook

The `useAnalytics` hook provides methods to track various events:

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

function MyComponent() {
  const analytics = useAnalytics();

  // Track page view
  analytics.trackPageView('/products');

  // Track product view
  analytics.trackProductView({
    id: 'product-123',
    name: 'Handmade Vase',
    category: 'Home Decor',
    price: 49.99,
  });

  // Track add to cart
  analytics.trackAddToCart({
    id: 'product-123',
    name: 'Handmade Vase',
    category: 'Home Decor',
    price: 49.99,
    quantity: 1,
  });

  // Track purchase
  analytics.trackPurchase(
    'order-456',
    [
      {
        id: 'product-123',
        name: 'Handmade Vase',
        category: 'Home Decor',
        price: 49.99,
        quantity: 1,
      },
    ],
    54.99, // total
    5.00,  // tax
    0,     // shipping
  );

  // Track search
  analytics.trackSearch('handmade pottery');

  // Track begin checkout (Google Analytics only)
  analytics.trackBeginCheckout(items, totalValue);

  // Track remove from cart (Google Analytics only)
  analytics.trackRemoveFromCart(product);
}
```

### Direct Google Analytics Tracking

You can also use the gtag utilities directly:

```typescript
import * as gtag from '@/lib/gtag';

// Track custom event
gtag.event({
  action: 'click',
  category: 'button',
  label: 'newsletter_signup',
  value: 1,
});
```

## Analytics Dashboard

Admins can view analytics data at `/admin/analytics`:

- Total revenue and orders
- Page views, product views, add to cart events
- Top performing products
- Low stock alerts
- Cart abandonment rate
- Sales reports (daily, weekly, monthly)

## Events Tracked

### Backend Events (stored in database)
- `PAGE_VIEW` - Page visits
- `PRODUCT_VIEW` - Product detail page views
- `ADD_TO_CART` - Items added to cart
- `PURCHASE` - Completed purchases
- `SEARCH` - Search queries

### Google Analytics Events
All backend events plus:
- `begin_checkout` - Checkout process started
- `remove_from_cart` - Items removed from cart
- Custom events via gtag.event()

## Privacy Considerations

- Session IDs are generated client-side and stored in sessionStorage
- User IDs are only tracked for authenticated users
- Google Analytics respects user privacy settings
- Consider adding a cookie consent banner for GDPR compliance

## Testing

To test analytics tracking:

1. Open browser DevTools > Network tab
2. Filter by "analytics" or "gtag"
3. Perform actions (view products, add to cart, etc.)
4. Verify requests are being sent

For Google Analytics:
1. Install Google Analytics Debugger extension
2. Open DevTools > Console
3. Look for GA debug messages

## API Endpoints

### Track Event
```
POST /analytics/events
Body: {
  eventType: 'PAGE_VIEW' | 'PRODUCT_VIEW' | 'ADD_TO_CART' | 'PURCHASE' | 'SEARCH',
  sessionId: string,
  productId?: string,
  orderId?: string,
  metadata?: object
}
```

### Get Dashboard Metrics (Admin only)
```
GET /analytics/dashboard?startDate=2024-01-01&endDate=2024-12-31
```

### Get Sales Report (Admin only)
```
GET /analytics/sales?startDate=2024-01-01&endDate=2024-12-31
```

### Get Product Performance (Admin only)
```
GET /analytics/products/:id/performance?startDate=2024-01-01&endDate=2024-12-31
```
