# Design Document

## Overview

This design simplifies the checkout flow by removing the payment method selection step, since the business only accepts bank transfer payments. The checkout will be streamlined to two steps: (1) Shipping address and (2) Shipping method selection, followed by order review. The payment method will be automatically set to bank transfer without user interaction.

After successful order placement, users are redirected to an order confirmation page that displays complete order details and bank transfer payment instructions. The confirmation page shows the order summary, shipping information, and bank account details with a QR code for easy payment. This page is accessible to both authenticated and guest users via the order ID.

## Architecture

### Component Hierarchy

```
CheckoutContent (Parent)
├── CheckoutStepper (2 steps instead of 3)
├── ShippingAddressForm (Step 1)
│   ├── Saved Addresses List (authenticated users)
│   └── New Address Form (guest users or new address)
├── ShippingMethodSelector (Step 2)
└── Order Review (Step 3)

OrderConfirmationPage (New)
├── OrderSummary
│   ├── Order Header (order number, date, status)
│   ├── Order Items List
│   └── Order Totals (subtotal, shipping, tax, total)
├── ShippingDetails
│   ├── Shipping Address Display
│   └── Shipping Method Display
└── BankTransferInstructions
    ├── Bank Account Details
    └── QR Code Image
```

### Data Flow

1. **Step 1 - Shipping Address:**
   - User enters/selects shipping address
   - Address validation occurs
   - User proceeds to step 2

2. **Step 2 - Shipping Method:**
   - User selects shipping method (standard/express/overnight)
   - Shipping cost updates in order summary
   - Payment method automatically set to 'bank_transfer'
   - User proceeds to step 3

3. **Step 3 - Order Review:**
   - User reviews complete order
   - User places order with bank transfer payment method
   - Order created successfully
   - User redirected to order confirmation page

4. **Order Confirmation:**
   - Fetch order details from backend
   - Fetch bank transfer payment settings from backend
   - Display order summary with all items and totals
   - Display shipping information
   - Display bank account details and QR code
   - Provide link to view order in account (authenticated users)

## Components and Interfaces

### CheckoutContent Component Changes

**Current State:**
- Has 3 steps with payment method selection in step 2
- Payment method state: `const [paymentMethod, setPaymentMethod] = useState('card')`
- Step 2 validation checks for both shipping method and payment method

**Required Changes:**
1. Remove payment method selection UI from step 2
2. Set payment method to 'bank_transfer' by default
3. Update step 2 validation to only check shipping method
4. Update CheckoutStepper to show 2 steps instead of 3
5. Keep step 3 as order review (no changes needed)

**Updated Step Validation Logic:**
```typescript
const canProceedToNextStep = () => {
  if (currentStep === 1) {
    // Shipping address validation
    if (!email) return false;
    if (user) {
      return !!shippingAddressId;
    } else {
      return !!newShippingAddress;
    }
  }
  if (currentStep === 2) {
    // Only validate shipping method (payment is auto-set)
    return !!shippingMethod;
  }
  return true;
}
```

### CheckoutStepper Component Changes

**Current State:**
- Displays 3 steps: Shipping, Payment, Review

**Required Changes:**
- Update to display 2 steps: Shipping, Shipping Method, Review
- Or keep 3 visual steps but rename step 2 from "Payment" to "Shipping Method"
- Ensure step indicators reflect the simplified flow

## Data Models

### Payment Method

**Current:**
```typescript
const [paymentMethod, setPaymentMethod] = useState('card');
```

**Updated:**
```typescript
const [paymentMethod] = useState('bank_transfer'); // Fixed value, no setter needed
```

### Address Model Changes

**Current Prisma Schema:**
```prisma
model Address {
  id              String   @id @default(uuid())
  userId          String   // Required - prevents guest checkout
  // ...
}
```

**Updated Prisma Schema:**
```prisma
model Address {
  id              String   @id @default(uuid())
  userId          String?  // Optional - allows guest checkout
  // ...
  user            User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Rationale:**
- Guest users need to create addresses without authentication
- Making `userId` optional allows address creation for both authenticated and guest users
- Orphaned addresses (null userId) will be cleaned up periodically
- Addresses can be linked to users later if guests register

### Order Creation Data

```typescript
interface CreateOrderData {
  email: string;
  shippingAddressId: string;
  billingAddressId: string;
  shippingMethod: 'standard' | 'express' | 'overnight';
  paymentMethod: 'bank_transfer'; // Always bank_transfer
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  notes?: string;
  promotionId?: string;
}
```

### Order Confirmation Data

```typescript
interface OrderDetails {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  email: string;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    productSlug: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  shippingMethod: string;
  paymentMethod: string;
  notes?: string;
}

interface BankTransferSettings {
  accountName: string;
  accountNumber: string;
  bankName: string;
  qrCodeUrl?: string;
}
```

### API Endpoints

**Get Order Details:**
```
GET /api/orders/:orderId
Response: OrderDetails
```

**Get Bank Transfer Settings:**
```
GET /api/payment-settings/bank-transfer
Response: BankTransferSettings
```

**Update Bank Transfer Settings (Admin):**
```
PUT /api/payment-settings/bank-transfer
Body: {
  accountName: string;
  accountNumber: string;
  bankName: string;
  qrCodeImage?: File;
}
Response: BankTransferSettings
```

## Implementation Details

### CheckoutContent Modifications

1. **Remove Payment Method Selection UI**
   - Remove the entire payment method selection section from step 2
   - Keep only the ShippingMethodSelector component in step 2
   - Remove radio buttons for payment method selection

2. **Update Payment Method State**
   - Change from `useState('card')` to fixed value `'bank_transfer'`
   - Remove `setPaymentMethod` function calls
   - Ensure order creation always uses 'bank_transfer'

3. **Update Step Validation**
   - Modify `canProceedToNextStep()` for step 2
   - Remove `&& !!paymentMethod` check from step 2 validation
   - Only validate `!!shippingMethod` for step 2

4. **Update CheckoutStepper**
   - Modify step labels if needed
   - Consider renaming step 2 from "Payment" to "Shipping Method"
   - Or keep current labels but ensure flow is clear

### User Experience Flow

**Complete Checkout Flow:**
1. **Step 1 - Shipping Address:**
   - User enters email (guest) or is auto-filled (authenticated)
   - User selects saved address or enters new address
   - User clicks "Next" → proceeds to step 2

2. **Step 2 - Shipping Method:**
   - User sees only shipping method options (no payment selection)
   - User selects standard/express/overnight shipping
   - Order summary updates with shipping cost
   - User clicks "Next" → proceeds to step 3

3. **Step 3 - Order Review:**
   - User reviews order items, address, shipping method
   - User can add order notes
   - User clicks "Place Order"
   - Order created with payment method = 'bank_transfer'
   - Redirect to `/[locale]/orders/[orderId]/confirmation`

## Order Confirmation Page Implementation

### Page Structure

**Route:** `/[locale]/orders/[orderId]/confirmation`

**Component:** `OrderConfirmationContent`

### Data Fetching

The page will fetch two pieces of data on load:

1. **Order Details** - GET `/api/orders/:orderId`
2. **Bank Transfer Settings** - GET `/api/payment-settings/bank-transfer`

Both requests happen in parallel for optimal performance.

### Component Layout

```typescript
<div className="order-confirmation-page">
  {/* Success Message */}
  <div className="success-banner">
    <CheckIcon />
    <h1>Order Placed Successfully!</h1>
    <p>Order #{orderNumber}</p>
  </div>

  {/* Order Summary Section */}
  <section className="order-summary">
    <h2>Order Details</h2>
    <div className="order-meta">
      <p>Order Date: {formattedDate}</p>
      <p>Status: {status}</p>
    </div>

    {/* Order Items */}
    <div className="order-items">
      {items.map(item => (
        <OrderItem key={item.id} {...item} />
      ))}
    </div>

    {/* Order Totals */}
    <div className="order-totals">
      <div>Subtotal: ${subtotal}</div>
      <div>Shipping: ${shippingCost}</div>
      <div>Tax: ${tax}</div>
      {discount > 0 && <div>Discount: -${discount}</div>}
      <div className="total">Total: ${total}</div>
    </div>
  </section>

  {/* Shipping Information */}
  <section className="shipping-info">
    <h2>Shipping Information</h2>
    <div className="shipping-address">
      <h3>Delivery Address</h3>
      <address>
        {shippingAddress.fullName}<br />
        {shippingAddress.addressLine1}<br />
        {shippingAddress.addressLine2 && <>{shippingAddress.addressLine2}<br /></>}
        {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}<br />
        {shippingAddress.country}<br />
        Phone: {shippingAddress.phone}
      </address>
    </div>
    <div className="shipping-method">
      <h3>Shipping Method</h3>
      <p>{shippingMethod}</p>
    </div>
  </section>

  {/* Bank Transfer Instructions */}
  <section className="payment-instructions">
    <h2>Payment Instructions</h2>
    <p className="payment-notice">
      Please complete your payment via bank transfer to the account below.
      Your order will be processed once payment is received.
    </p>

    <div className="bank-details">
      <h3>Bank Account Details</h3>
      <dl>
        <dt>Account Name:</dt>
        <dd>{bankTransferSettings.accountName}</dd>

        <dt>Account Number:</dt>
        <dd>{bankTransferSettings.accountNumber}</dd>

        <dt>Bank Name:</dt>
        <dd>{bankTransferSettings.bankName}</dd>

        <dt>Amount to Transfer:</dt>
        <dd className="amount">${total}</dd>
      </dl>
    </div>

    {bankTransferSettings.qrCodeUrl && (
      <div className="qr-code">
        <h3>Scan to Pay</h3>
        <img
          src={bankTransferSettings.qrCodeUrl}
          alt="Bank Transfer QR Code"
          className="qr-code-image"
        />
        <p className="qr-hint">Scan this QR code with your banking app</p>
      </div>
    )}
  </section>

  {/* Action Buttons */}
  <div className="actions">
    <button onClick={() => window.print()}>Print Order</button>
    {user && (
      <Link href={`/${locale}/account/orders`}>
        View All Orders
      </Link>
    )}
    <Link href={`/${locale}/products`}>
      Continue Shopping
    </Link>
  </div>
</div>
```

### Backend Implementation

#### Database Schema Changes

**1. Update Address Model:**

```prisma
model Address {
  id              String   @id @default(uuid())
  userId          String?  // Changed from String to String? (optional)
  fullName        String
  phone           String
  addressLine1    String
  addressLine2    String?
  city            String
  state           String
  postalCode      String
  country         String
  isDefault       Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User?     @relation(fields: [userId], references: [id], onDelete: Cascade)
  shippingOrders  Order[]  @relation("ShippingAddress")
  billingOrders   Order[]  @relation("BillingAddress")

  @@index([userId])
  @@map("addresses")
}
```

**2. Add Payment Settings Model:**

```prisma
model PaymentSettings {
  id            String   @id @default(cuid())
  accountName   String
  accountNumber String
  bankName      String
  qrCodeUrl     String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

#### Address Service Updates

Update the address service to handle optional userId:

```typescript
// backend/src/users/users.service.ts (or addresses.service.ts)
async createAddress(createAddressDto: CreateAddressDto, userId?: string) {
  // Allow address creation with or without userId
  return this.prisma.address.create({
    data: {
      ...createAddressDto,
      userId: userId || null, // null for guest users
    },
  });
}
```

#### Orders Service Updates

Update validation to allow addresses without userId:

```typescript
// backend/src/orders/orders.service.ts
async create(createOrderDto: CreateOrderDto, userId?: string) {
  // Verify addresses exist
  const shippingAddress = await this.prisma.address.findUnique({
    where: { id: shippingAddressId },
  });

  if (!shippingAddress) {
    throw new NotFoundException('Shipping address not found');
  }

  // Only check ownership if user is authenticated AND address has a userId
  if (userId && shippingAddress.userId && shippingAddress.userId !== userId) {
    throw new ForbiddenException('Shipping address does not belong to user');
  }

  // Similar validation for billing address...
}
```

#### Address Cleanup Service

Create a scheduled task to clean up orphaned guest addresses:

```typescript
// backend/src/addresses/address-cleanup.service.ts
@Injectable()
export class AddressCleanupService {
  constructor(private prisma: PrismaService) {}

  @Cron('0 0 * * *') // Run daily at midnight
  async cleanupOrphanedAddresses() {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Delete addresses with null userId older than 90 days
    const result = await this.prisma.address.deleteMany({
      where: {
        userId: null,
        createdAt: {
          lt: ninetyDaysAgo,
        },
      },
    });

    console.log(`Cleaned up ${result.count} orphaned guest addresses`);
  }
}
```

#### Payment Settings Service

```typescript
// backend/src/payment-settings/payment-settings.service.ts
@Injectable()
export class PaymentSettingsService {
  constructor(private prisma: PrismaService) {}

  async getBankTransferSettings(): Promise<BankTransferSettings> {
    const settings = await this.prisma.paymentSettings.findFirst({
      orderBy: { updatedAt: 'desc' }
    });

    if (!settings) {
      // Return default/empty settings
      return {
        accountName: '',
        accountNumber: '',
        bankName: '',
        qrCodeUrl: null
      };
    }

    return {
      accountName: settings.accountName,
      accountNumber: settings.accountNumber,
      bankName: settings.bankName,
      qrCodeUrl: settings.qrCodeUrl
    };
  }

  async updateBankTransferSettings(
    data: UpdateBankTransferSettingsDto,
    qrCodeFile?: Express.Multer.File
  ): Promise<BankTransferSettings> {
    let qrCodeUrl = data.qrCodeUrl;

    if (qrCodeFile) {
      // Upload QR code image and get URL
      qrCodeUrl = await this.uploadQRCode(qrCodeFile);
    }

    const settings = await this.prisma.paymentSettings.upsert({
      where: { id: data.id || 'default' },
      update: {
        accountName: data.accountName,
        accountNumber: data.accountNumber,
        bankName: data.bankName,
        qrCodeUrl
      },
      create: {
        id: 'default',
        accountName: data.accountName,
        accountNumber: data.accountNumber,
        bankName: data.bankName,
        qrCodeUrl
      }
    });

    return this.getBankTransferSettings();
  }

  private async uploadQRCode(file: Express.Multer.File): Promise<string> {
    // Upload to uploads/payment-qr/ directory
    const filename = `qr-${Date.now()}.${file.mimetype.split('/')[1]}`;
    const filepath = path.join('uploads', 'payment-qr', filename);

    await fs.promises.mkdir(path.dirname(filepath), { recursive: true });
    await fs.promises.writeFile(filepath, file.buffer);

    return `/uploads/payment-qr/${filename}`;
  }
}
```

#### Payment Settings Controller

```typescript
// backend/src/payment-settings/payment-settings.controller.ts
@Controller('payment-settings')
export class PaymentSettingsController {
  constructor(private paymentSettingsService: PaymentSettingsService) {}

  @Get('bank-transfer')
  @Public()
  async getBankTransferSettings() {
    return this.paymentSettingsService.getBankTransferSettings();
  }

  @Put('bank-transfer')
  @Roles('admin')
  @UseInterceptors(FileInterceptor('qrCodeImage'))
  async updateBankTransferSettings(
    @Body() data: UpdateBankTransferSettingsDto,
    @UploadedFile() qrCodeImage?: Express.Multer.File
  ) {
    return this.paymentSettingsService.updateBankTransferSettings(
      data,
      qrCodeImage
    );
  }
}
```

### Frontend API Client

```typescript
// frontend/lib/payment-settings-api.ts
export async function getBankTransferSettings(): Promise<BankTransferSettings> {
  const response = await apiClient.get('/payment-settings/bank-transfer');
  return response.data;
}

export async function updateBankTransferSettings(
  data: UpdateBankTransferSettingsDto,
  qrCodeImage?: File
): Promise<BankTransferSettings> {
  const formData = new FormData();
  formData.append('accountName', data.accountName);
  formData.append('accountNumber', data.accountNumber);
  formData.append('bankName', data.bankName);

  if (qrCodeImage) {
    formData.append('qrCodeImage', qrCodeImage);
  }

  const response = await apiClient.put(
    '/payment-settings/bank-transfer',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' }
    }
  );

  return response.data;
}
```

## Error Handling

### Order Creation Errors

1. **API Failure**
   - Display error message if order creation fails
   - Keep all form data intact
   - Allow user to retry order placement
   - Log error details for debugging

2. **Validation Errors**
   - Ensure shipping method is selected before proceeding
   - Validate shipping address exists
   - Show clear error messages for missing data

3. **Network Issues**
   - Show loading state during order creation
   - Display timeout message if request takes too long
   - Provide retry mechanism

### Edge Cases

1. **User navigates back from step 3**
   - Preserve shipping method selection
   - Allow user to change shipping method
   - Maintain payment method as bank_transfer

2. **User navigates back from step 2**
   - Preserve shipping address data
   - Allow user to change address if needed

3. **Cart becomes empty during checkout**
   - Redirect to cart page
   - Show appropriate message

### Order Confirmation Page Errors

1. **Order Not Found**
   - Display 404 error page
   - Provide link to view all orders (authenticated users)
   - Provide link to contact support

2. **Bank Transfer Settings Not Configured**
   - Display order details normally
   - Show message: "Payment instructions will be sent to your email"
   - Log warning for admin to configure settings

3. **Failed to Load Order Details**
   - Show error message with retry button
   - Preserve order ID in URL for retry
   - Provide link to contact support

4. **Failed to Load Payment Settings**
   - Display order details normally
   - Show generic bank transfer message
   - Allow user to contact support for payment details

5. **Guest User Access**
   - Allow access via order ID in URL
   - No authentication required
   - Same information displayed as authenticated users

## Testing Strategy

### Unit Tests

1. **Step Validation**
   - Test `canProceedToNextStep()` for each step
   - Verify step 2 only checks shipping method (not payment)
   - Test payment method is always 'bank_transfer'

2. **Order Creation**
   - Test order data includes correct payment method
   - Verify all required fields are included
   - Test order creation with valid data

### Integration Tests

1. **Complete Checkout Flow**
   - Enter shipping address
   - Proceed to step 2
   - Select shipping method (no payment selection shown)
   - Proceed to step 3
   - Review order
   - Place order
   - Verify order created with bank_transfer payment

2. **Navigation Between Steps**
   - Navigate forward through all steps
   - Navigate backward through steps
   - Verify data persists when navigating back
   - Verify shipping method selection is preserved

3. **Guest vs Authenticated Flow**
   - Test guest checkout with new address
   - Test authenticated checkout with saved address
   - Test authenticated checkout with new address
   - Verify both flows skip payment selection

### Manual Testing Checklist

**Checkout Flow:**
- [ ] Step 2 does not show payment method selection
- [ ] Shipping method selection works correctly
- [ ] Order summary updates with shipping cost
- [ ] Can proceed from step 2 with only shipping method selected
- [ ] Order is created with bank_transfer payment method
- [ ] CheckoutStepper shows correct step labels
- [ ] Navigation between steps works smoothly
- [ ] Responsive design works on mobile
- [ ] All translations display correctly

**Order Confirmation Page:**
- [ ] Redirects to confirmation page after successful order
- [ ] Displays correct order number and date
- [ ] Shows all order items with correct quantities and prices
- [ ] Displays correct order totals (subtotal, shipping, tax, total)
- [ ] Shows shipping address correctly formatted
- [ ] Displays shipping method
- [ ] Shows bank account details (name, number, bank)
- [ ] Displays QR code when configured
- [ ] QR code image loads correctly
- [ ] Print functionality works
- [ ] Guest users can access confirmation page
- [ ] Authenticated users see "View All Orders" link
- [ ] "Continue Shopping" link works
- [ ] Page is responsive on mobile devices
- [ ] All text is properly translated
- [ ] Handles missing QR code gracefully
- [ ] Shows error message when order not found
- [ ] Retry button works when data fails to load

## UI/UX Considerations

### Simplified Step 2 Layout

**Before:**
- Shipping method selector
- Payment method selector (radio buttons)

**After:**
- Shipping method selector only
- More prominent display of shipping options
- Clear indication that payment is via bank transfer

### Visual Feedback

1. **Step Indicators**
   - Clear progression through 3 steps
   - Step 2 labeled appropriately (e.g., "Shipping Method" or "Delivery")
   - Active step highlighted

2. **Order Summary**
   - Shows shipping cost based on selected method
   - Displays payment method as "Bank Transfer" (informational)
   - Updates total in real-time

3. **Informational Message**
   - Optional: Add a note in order summary or step 3 about bank transfer
   - Example: "Payment will be made via bank transfer. Bank details will be provided after order confirmation."

### Order Confirmation Page Design

1. **Success Feedback**
   - Prominent success message with checkmark icon
   - Order number displayed clearly
   - Positive, reassuring tone

2. **Information Hierarchy**
   - Most important info first: success message and order number
   - Order details in logical sections
   - Payment instructions prominent but not overwhelming
   - Clear visual separation between sections

3. **Bank Transfer Instructions**
   - Bank details in easy-to-read format
   - Copy-to-clipboard buttons for account details (optional enhancement)
   - QR code prominently displayed when available
   - Clear instructions on what to do next

4. **Visual Design**
   - Clean, uncluttered layout
   - Adequate white space between sections
   - Bank details in a highlighted card/box
   - QR code in a distinct visual container
   - Amount to transfer highlighted in larger, bold text

5. **Mobile Optimization**
   - Single column layout on mobile
   - QR code sized appropriately for scanning
   - Touch-friendly buttons
   - Easy to read on small screens
   - Print button may be hidden on mobile

6. **Print Styling**
   - Clean print layout without navigation
   - QR code prints clearly
   - All important information included
   - Optimized for A4/Letter paper

## Accessibility

### Checkout Flow

1. **Step Navigation**
   - Clear step labels for screen readers
   - Proper ARIA labels for navigation buttons
   - Focus management between steps

2. **Shipping Method Selection**
   - Radio buttons properly labeled
   - Selected method announced to screen readers
   - Keyboard navigation works correctly

3. **Order Review**
   - All order details accessible via screen reader
   - Clear indication of payment method
   - Proper button labels for actions

### Order Confirmation Page

1. **Page Structure**
   - Proper heading hierarchy (h1 for page title, h2 for sections)
   - Semantic HTML elements (section, address, dl for bank details)
   - ARIA landmarks for main content regions

2. **Order Information**
   - Order items presented in accessible list format
   - Price information clearly associated with items
   - Totals section uses definition list for clarity

3. **Bank Transfer Details**
   - Bank account information in definition list (dl/dt/dd)
   - QR code has descriptive alt text
   - Important payment amount highlighted for screen readers

4. **Interactive Elements**
   - All buttons have clear, descriptive labels
   - Links have meaningful text (not "click here")
   - Print button accessible via keyboard
   - Focus indicators visible on all interactive elements

5. **Images**
   - QR code has alt text: "Bank Transfer QR Code"
   - Decorative icons marked with aria-hidden="true"
   - Success icon has appropriate role and label

## Performance Considerations

1. **State Management**
   - Remove unused payment method state setter
   - Simplify step validation logic
   - Reduce unnecessary re-renders

2. **Component Rendering**
   - Step 2 renders faster without payment UI
   - Fewer form elements to manage
   - Cleaner component structure

## API Client Authentication Handling

### Current Issue

The current `api-client.ts` implementation has a critical flaw in its authentication error handling:

```typescript
// Current problematic code
if (!isOrderConfirmation) {
  window.location.href = '/login';  // ❌ Causes full page reload
}
```

**Problems:**
1. Uses `window.location.href` which causes a full page reload
2. Loses all browser network activity (DevTools network tab is cleared)
3. Doesn't preserve locale in redirect URL
4. Interrupts user experience with jarring page reload

### Solution

Replace `window.location.href` with Next.js router for client-side navigation:

```typescript
// Improved implementation
import { useRouter } from 'next/navigation';

// In the interceptor
if (!isOrderConfirmation) {
  // Use Next.js router for client-side navigation
  const router = useRouter();
  const locale = window.location.pathname.split('/')[1] || 'en';
  router.push(`/${locale}/login`);
}
```

**However**, axios interceptors cannot directly use React hooks. The proper solution is:

1. **Create a custom event system** to communicate authentication failures
2. **Handle redirects at the app level** using Next.js router
3. **Preserve network activity** by avoiding full page reloads

### Implementation Approach

**Step 1: Remove window.location.href redirect from api-client.ts**

```typescript
// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Clear tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        // Dispatch custom event for auth failure
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          const isOrderConfirmation = currentPath.includes('/orders/') && currentPath.includes('/confirmation');

          if (!isOrderConfirmation) {
            window.dispatchEvent(new CustomEvent('auth:logout'));
          }
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

**Step 2: Handle auth events in AuthContext**

Update the AuthContext to listen for the custom event and handle redirects using Next.js router:

```typescript
// In AuthContext
useEffect(() => {
  const handleAuthLogout = () => {
    setUser(null);
    router.push(`/${locale}/login`);
  };

  window.addEventListener('auth:logout', handleAuthLogout);
  return () => window.removeEventListener('auth:logout', handleAuthLogout);
}, [router, locale]);
```

### Benefits

1. **No page reload** - Preserves network activity in DevTools
2. **Locale-aware** - Redirects to correct locale login page
3. **Better UX** - Smooth client-side navigation
4. **Debuggable** - Network requests remain visible for debugging
5. **Consistent** - Uses Next.js navigation throughout the app

### Error Handling Strategy

1. **401 Unauthorized**
   - Try token refresh first
   - If refresh fails, dispatch auth:logout event
   - AuthContext handles redirect with router.push()

2. **Order Confirmation Page**
   - Skip redirect for guest users viewing their order
   - Allow access via order ID without authentication

3. **Network Activity Preservation**
   - No full page reloads
   - All API calls remain visible in DevTools
   - Easier debugging of authentication issues
