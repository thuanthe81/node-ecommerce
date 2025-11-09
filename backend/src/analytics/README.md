# Analytics Module

This module provides comprehensive analytics tracking and reporting for the e-commerce platform.

## Features

### Event Tracking
- Page views
- Product views
- Add to cart events
- Purchase events
- Search queries

### Analytics Dashboard
- Overview metrics (page views, product views, add to cart, purchases)
- Revenue tracking (total revenue, order count)
- Sales reports (daily, weekly, monthly)
- Top performing products
- Low stock alerts
- Cart abandonment rate

### Product Performance
- Individual product analytics
- View counts
- Add to cart counts
- Purchase counts
- Conversion rates

## API Endpoints

### Public Endpoints

#### Track Event
```
POST /analytics/events
```

**Request Body:**
```json
{
  "eventType": "PAGE_VIEW" | "PRODUCT_VIEW" | "ADD_TO_CART" | "PURCHASE" | "SEARCH",
  "sessionId": "string",
  "productId": "string (optional)",
  "orderId": "string (optional)",
  "metadata": {
    // Any additional data
  }
}
```

**Response:** 201 Created

### Admin Endpoints (Requires ADMIN role)

#### Get Dashboard Metrics
```
GET /analytics/dashboard?startDate=2024-01-01&endDate=2024-12-31
```

**Query Parameters:**
- `startDate` (optional): Start date for analytics period (ISO 8601 format)
- `endDate` (optional): End date for analytics period (ISO 8601 format)

**Response:**
```json
{
  "overview": {
    "totalPageViews": 1000,
    "totalProductViews": 500,
    "totalAddToCarts": 200,
    "totalPurchases": 50,
    "totalSearches": 150
  },
  "revenue": {
    "totalRevenue": 5000.00,
    "totalOrders": 50
  },
  "topProducts": [
    {
      "productId": "uuid",
      "nameEn": "Product Name",
      "nameVi": "Tên sản phẩm",
      "views": 100,
      "purchases": 20
    }
  ],
  "lowStockProducts": [
    {
      "id": "uuid",
      "nameEn": "Product Name",
      "nameVi": "Tên sản phẩm",
      "sku": "SKU-123",
      "stockQuantity": 5,
      "lowStockThreshold": 10
    }
  ],
  "cartAbandonment": {
    "addToCartCount": 200,
    "purchaseCount": 50,
    "abandonmentRate": 75.00
  }
}
```

#### Get Sales Report
```
GET /analytics/sales?startDate=2024-01-01&endDate=2024-12-31
```

**Query Parameters:**
- `startDate` (optional): Start date for report period
- `endDate` (optional): End date for report period

**Response:**
```json
{
  "totalRevenue": 5000.00,
  "dailySales": [
    {
      "date": "2024-01-01",
      "revenue": 100.00,
      "orders": 5
    }
  ],
  "weeklySales": [
    {
      "week": "2024-01",
      "revenue": 700.00,
      "orders": 35
    }
  ],
  "monthlySales": [
    {
      "month": "2024-01",
      "revenue": 3000.00,
      "orders": 150
    }
  ]
}
```

#### Get Product Performance
```
GET /analytics/products/:id/performance?startDate=2024-01-01&endDate=2024-12-31
```

**Path Parameters:**
- `id`: Product ID

**Query Parameters:**
- `startDate` (optional): Start date for analytics period
- `endDate` (optional): End date for analytics period

**Response:**
```json
{
  "productId": "uuid",
  "views": 100,
  "addToCarts": 30,
  "purchases": 10,
  "conversionRate": 10.00
}
```

## Database Schema

### AnalyticsEvent Model
```prisma
model AnalyticsEvent {
  id          String            @id @default(uuid())
  eventType   AnalyticsEventType
  userId      String?
  sessionId   String
  productId   String?
  orderId     String?
  metadata    Json?
  createdAt   DateTime          @default(now())

  user        User?             @relation(fields: [userId], references: [id])
  product     Product?          @relation(fields: [productId], references: [id])
  order       Order?            @relation(fields: [orderId], references: [id])

  @@index([eventType])
  @@index([userId])
  @@index([sessionId])
  @@index([productId])
  @@index([createdAt])
}

enum AnalyticsEventType {
  PAGE_VIEW
  PRODUCT_VIEW
  ADD_TO_CART
  PURCHASE
  SEARCH
}
```

## Usage Examples

### Track a Product View
```typescript
// From frontend
await trackEvent({
  eventType: 'PRODUCT_VIEW',
  sessionId: 'session_123',
  productId: 'product_uuid',
  metadata: {
    name: 'Handmade Vase',
    price: 49.99
  }
});
```

### Track a Purchase
```typescript
await trackEvent({
  eventType: 'PURCHASE',
  sessionId: 'session_123',
  orderId: 'order_uuid',
  metadata: {
    total: 149.99,
    items: [...]
  }
});
```

### Get Dashboard Metrics
```typescript
const metrics = await getDashboardMetrics({
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});
```

## Performance Considerations

- Analytics events are tracked asynchronously to avoid blocking user interactions
- Database queries use indexes on frequently queried columns (eventType, createdAt, productId)
- Aggregation queries are optimized with raw SQL for better performance
- Consider implementing caching for dashboard metrics if traffic is high

## Privacy & GDPR Compliance

- Session IDs are generated client-side and don't contain personal information
- User IDs are only tracked for authenticated users
- No sensitive personal data is stored in analytics events
- Consider implementing data retention policies (e.g., delete events older than 2 years)
- Provide users with ability to opt-out of tracking

## Future Enhancements

- Real-time analytics dashboard with WebSocket updates
- Funnel analysis (product view → add to cart → purchase)
- Cohort analysis
- A/B testing support
- Custom event types
- Export analytics data to CSV/Excel
- Integration with external analytics platforms (Mixpanel, Amplitude)
