# Orders Module

This module handles order creation, management, and status updates for the e-commerce platform.

## Features

### Order Creation
- Create orders from cart items
- Support for both authenticated and guest checkout
- Automatic order number generation (format: `ORD-{timestamp}-{random}`)
- Inventory deduction on order creation
- Promotion code validation and discount application
- Tax calculation (10% rate)
- Shipping cost calculation based on method

### Order Management
- List all orders for a user
- Get order details by ID
- Admin: List all orders with filters (status, payment status, date range)
- Admin: Update order status

### Inventory Management
- Automatic stock validation before order creation
- Inventory deduction within transaction to ensure atomicity
- Stock availability checks

### Promotion Support
- Apply discount codes during checkout
- Validate promotion constraints (min order, usage limits, dates)
- Track promotion usage count
- Support for percentage and fixed amount discounts

## API Endpoints

### Public/Authenticated Endpoints

#### Create Order
```
POST /orders
```
Creates a new order. Can be used by both authenticated users and guests.

**Request Body:**
```json
{
  "email": "customer@example.com",
  "shippingAddressId": "uuid",
  "billingAddressId": "uuid",
  "shippingMethod": "standard",
  "paymentMethod": "card",
  "items": [
    {
      "productId": "uuid",
      "quantity": 2
    }
  ],
  "promotionCode": "SAVE10",
  "notes": "Please gift wrap"
}
```

#### Get User Orders
```
GET /orders
```
Returns all orders for the authenticated user.

#### Get Order Details
```
GET /orders/:id
```
Returns detailed information about a specific order. Users can only access their own orders.

### Admin Endpoints

#### Get All Orders
```
GET /orders/admin/all?status=PENDING&paymentStatus=PAID&startDate=2024-01-01&endDate=2024-12-31
```
Returns all orders with optional filters.

**Query Parameters:**
- `status`: Filter by order status (PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED)
- `paymentStatus`: Filter by payment status (PENDING, PAID, FAILED, REFUNDED)
- `startDate`: Filter orders created after this date
- `endDate`: Filter orders created before this date

#### Update Order Status
```
PATCH /orders/:id/status
```
Updates the status of an order.

**Request Body:**
```json
{
  "status": "PROCESSING"
}
```

## Order Statuses

- `PENDING`: Order created, awaiting payment
- `PROCESSING`: Payment received, order being prepared
- `SHIPPED`: Order has been shipped
- `DELIVERED`: Order delivered to customer
- `CANCELLED`: Order cancelled
- `REFUNDED`: Order refunded

## Payment Statuses

- `PENDING`: Payment not yet processed
- `PAID`: Payment successful
- `FAILED`: Payment failed
- `REFUNDED`: Payment refunded

## Shipping Methods

- `standard`: Standard Shipping ($5.00) - 5-7 business days
- `express`: Express Shipping ($15.00) - 2-3 business days
- `overnight`: Overnight Shipping ($25.00) - Next business day

## Order Calculation

### Subtotal
Sum of (product price × quantity) for all items

### Shipping Cost
Based on selected shipping method (see above)

### Tax
10% of subtotal

### Discount
Applied if valid promotion code provided:
- Percentage discount: (subtotal × percentage) / 100
- Fixed discount: fixed amount
- Respects max discount amount if set

### Total
Subtotal + Shipping Cost + Tax - Discount

## Transaction Safety

Order creation uses database transactions to ensure:
1. Order is created
2. Order items are created
3. Inventory is deducted
4. Promotion usage is incremented

If any step fails, all changes are rolled back.

## Error Handling

- `NotFoundException`: Address or product not found
- `ForbiddenException`: User trying to access another user's data
- `BadRequestException`: Invalid data, insufficient stock, inactive products

## Future Enhancements

- Email notifications on order status changes
- Order tracking integration
- Partial refunds
- Order cancellation by customer
- Shipping label generation
- Integration with external shipping providers
