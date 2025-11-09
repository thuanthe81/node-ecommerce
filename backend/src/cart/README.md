# Cart Module

This module handles shopping cart functionality for the e-commerce platform.

## Features

- **Session-based carts**: Support for both authenticated users and guest sessions
- **Redis caching**: Fast cart retrieval with Redis cache layer
- **Database persistence**: Reliable storage in PostgreSQL
- **Cart expiration**: Automatic cleanup of expired carts (7 days)
- **Cart merging**: Merge guest cart with user cart on login
- **Stock validation**: Ensure sufficient inventory before adding items

## API Endpoints

### GET /api/cart
Get the current cart for the user or session.

**Response:**
```json
{
  "id": "cart-uuid",
  "userId": "user-uuid",
  "sessionId": null,
  "expiresAt": "2024-11-16T00:00:00.000Z",
  "items": [
    {
      "id": "item-uuid",
      "productId": "product-uuid",
      "quantity": 2,
      "price": "29.99",
      "product": {
        "id": "product-uuid",
        "nameEn": "Handmade Vase",
        "nameVi": "Bình gốm thủ công",
        "slug": "handmade-vase",
        "price": "29.99",
        "stockQuantity": 10,
        "images": [...]
      }
    }
  ]
}
```

### POST /api/cart/items
Add an item to the cart.

**Request Body:**
```json
{
  "productId": "product-uuid",
  "quantity": 2
}
```

### PUT /api/cart/items/:id
Update the quantity of a cart item.

**Request Body:**
```json
{
  "quantity": 3
}
```

### DELETE /api/cart/items/:id
Remove an item from the cart.

### DELETE /api/cart
Clear all items from the cart.

### POST /api/cart/merge
Merge guest cart with user cart (requires authentication).

## Session Management

The cart module uses session IDs to track guest carts. Session IDs can be provided via:
- Cookie: `sessionId`
- Header: `x-session-id`

If no session ID is provided, a new one is generated automatically.

## Caching Strategy

- Carts are cached in Redis with a 7-day TTL
- Cache is invalidated on any cart modification
- Database is the source of truth; cache is used for performance

## Cart Expiration

Carts expire after 7 days of inactivity. The expiration date is updated on every cart access. A cleanup job should be scheduled to remove expired carts periodically.

## Implementation Details

- **Service**: `CartService` - Business logic for cart operations
- **Controller**: `CartController` - HTTP endpoints
- **DTOs**: Input validation for cart operations
- **Redis**: Cache layer for performance
- **Prisma**: Database ORM for persistence
