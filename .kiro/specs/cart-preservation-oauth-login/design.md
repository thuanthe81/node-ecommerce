# Design Document: Cart Preservation During OAuth Login

## Overview

This design document outlines the solution for preserving shopping cart contents when users authenticate via OAuth (Google/Facebook) during checkout. The solution simplifies cart management by:

1. **Storing guest carts only in localStorage** (frontend) - no backend storage for unauthenticated users
2. **Syncing cart to backend after login** - pushing all guest cart items to the backend when user authenticates
3. **Merging with existing user cart** - combining guest cart items with any existing user cart items
4. **Removing backend guest cart infrastructure** - eliminating session ID-based cart storage on the backend

This approach eliminates the complexity of managing session IDs on the backend and reduces synchronization issues between frontend and backend.

## Architecture

### Current Flow (Problematic)

```
Guest User                    Backend
   |                             |
   |-- Add to Cart ------------->|
   |   (with session ID)         |-- Store in DB with sessionId
   |<-- Cart Response ----------|
   |                             |
   |-- Click Checkout ---------->|
   |-- Redirect to OAuth ------->|
   |                             |
   [OAuth Flow]                  |
   |                             |
   |<-- Return with tokens ------|
   |                             |
   |-- Get Cart ---------------->|
   |   (with user ID)            |-- Find cart by userId (empty!)
   |<-- Empty Cart --------------|
   |                             |
   ❌ Cart is lost!              |
```

### New Flow (Solution)

```
Guest User                    Frontend                Backend
   |                             |                       |
   |-- Add to Cart ------------->|                       |
   |                             |-- Store in localStorage
   |<-- Update UI ---------------|                       |
   |                             |                       |
   |-- Click Checkout ---------->|                       |
   |-- Redirect to OAuth ------->|                       |
   |                             |                       |
   [OAuth Flow]                  |                       |
   |                             |                       |
   |<-- Return with tokens ------|                       |
   |                             |                       |
   |                             |-- Detect login        |
   |                             |-- Read localStorage   |
   |                             |                       |
   |                             |-- Add Item 1 -------->|
   |                             |                       |-- Store with userId
   |                             |<-- Success -----------|
   |                             |                       |
   |                             |-- Add Item 2 -------->|
   |                             |                       |-- Merge quantity if exists
   |                             |<-- Success -----------|
   |                             |                       |
   |                             |-- Clear localStorage  |
   |                             |                       |
   |                             |-- Get Cart ---------->|
   |                             |                       |-- Return user cart
   |                             |<-- Full Cart ---------|
   |<-- Show merged cart --------|                       |
   |                             |                       |
   ✅ Cart preserved!            |                       |
```

## Components and Interfaces

### Frontend Changes

#### 1. Cart Context Updates

**File: `frontend/contexts/CartContext.tsx`**

The Cart Context needs to be updated to:
- Store guest cart items in localStorage instead of calling backend
- Detect when a user logs in and trigger cart sync
- Push all guest cart items to backend after login
- Handle errors during sync gracefully

```typescript
interface GuestCartItem {
  productId: string;
  quantity: number;
}

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  itemCount: number;
  subtotal: number;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  syncGuestCartToBackend: () => Promise<void>; // New method
}

// New localStorage key for guest cart
const GUEST_CART_KEY = 'guestCart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [guestCart, setGuestCart] = useState<GuestCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const [previousAuthState, setPreviousAuthState] = useState(false);

  // Load guest cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(GUEST_CART_KEY);
      if (stored) {
        try {
          setGuestCart(JSON.parse(stored));
        } catch (err) {
          console.error('Failed to parse guest cart:', err);
          localStorage.removeItem(GUEST_CART_KEY);
        }
      }
    }
  }, []);

  // Detect login and trigger cart sync
  useEffect(() => {
    const handleLogin = async () => {
      if (isAuthenticated && !previousAuthState) {
        console.log('[CartContext] User logged in, syncing guest cart to backend');
        await syncGuestCartToBackend();
      }
      setPreviousAuthState(isAuthenticated);
    };

    handleLogin();
  }, [isAuthenticated]);

  // Sync guest cart to backend after login
  const syncGuestCartToBackend = async () => {
    if (!isAuthenticated || guestCart.length === 0) {
      console.log('[CartContext] Skipping sync - no guest cart items or not authenticated');
      return;
    }

    console.log(`[CartContext] Syncing ${guestCart.length} guest cart items to backend`);
    setLoading(true);
    const errors: string[] = [];

    try {
      // Push each item to backend
      for (const item of guestCart) {
        try {
          console.log(`[CartContext] Syncing item: ${item.productId}, quantity: ${item.quantity}`);
          await cartApi.addItem(item.productId, item.quantity);
        } catch (err: any) {
          const errorMsg = err.response?.data?.message || 'Failed to add item';
          console.error(`[CartContext] Failed to sync item ${item.productId}:`, errorMsg);
          errors.push(`Product ${item.productId}: ${errorMsg}`);
        }
      }

      // Clear guest cart from localStorage after successful sync
      if (errors.length === 0) {
        console.log('[CartContext] All items synced successfully, clearing guest cart');
        localStorage.removeItem(GUEST_CART_KEY);
        setGuestCart([]);
      } else {
        console.warn('[CartContext] Some items failed to sync:', errors);
        setError(`Some items couldn't be added: ${errors.join(', ')}`);
      }

      // Refresh cart from backend to show merged items
      await refreshCart();
    } catch (err: any) {
      console.error('[CartContext] Error during cart sync:', err);
      setError('Failed to sync cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // For authenticated users: call backend
  // For guest users: update localStorage
  const addToCart = async (productId: string, quantity: number) => {
    try {
      setError(null);

      if (isAuthenticated) {
        // Authenticated: call backend
        console.log(`[CartContext] Adding item to backend cart - ProductId: ${productId}`);
        const updatedCart = await cartApi.addItem(productId, quantity);
        setCart(updatedCart);
      } else {
        // Guest: update localStorage
        console.log(`[CartContext] Adding item to guest cart - ProductId: ${productId}`);
        const existingItemIndex = guestCart.findIndex(item => item.productId === productId);

        let updatedGuestCart: GuestCartItem[];
        if (existingItemIndex >= 0) {
          // Update quantity
          updatedGuestCart = [...guestCart];
          updatedGuestCart[existingItemIndex].quantity += quantity;
        } else {
          // Add new item
          updatedGuestCart = [...guestCart, { productId, quantity }];
        }

        setGuestCart(updatedGuestCart);
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(updatedGuestCart));
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to add item to cart';
      console.error(`[CartContext] Error adding item:`, errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  // Similar updates for updateQuantity, removeItem, clearCart...
  // For authenticated users: call backend
  // For guest users: update localStorage

  return (
    <CartContext.Provider
      value={{
        cart: isAuthenticated ? cart : null,
        guestCart: !isAuthenticated ? guestCart : [],
        loading,
        error,
        itemCount,
        subtotal,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
        syncGuestCartToBackend,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
```

#### 2. Cart API Updates

**File: `frontend/lib/cart-api.ts`**

Remove session ID logic since guest carts are no longer stored on backend:

```typescript
export const cartApi = {
  // Only for authenticated users now
  getCart: async (): Promise<Cart> => {
    const response = await apiClient.get('/cart');
    return response.data;
  },

  addItem: async (productId: string, quantity: number): Promise<Cart> => {
    const response = await apiClient.post('/cart/items', { productId, quantity });
    return response.data;
  },

  updateItem: async (itemId: string, quantity: number): Promise<Cart> => {
    const response = await apiClient.put(`/cart/items/${itemId}`, { quantity });
    return response.data;
  },

  removeItem: async (itemId: string): Promise<Cart> => {
    const response = await apiClient.delete(`/cart/items/${itemId}`);
    return response.data;
  },

  clearCart: async (): Promise<Cart> => {
    const response = await apiClient.delete('/cart');
    return response.data;
  },
};

// Remove getSessionId() and syncSessionId() functions
```

### Backend Changes

#### 1. Cart Controller Updates

**File: `backend/src/cart/cart.controller.ts`**

Update to require authentication for all cart endpoints:

```typescript
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @UseGuards(JwtAuthGuard) // Require authentication
  async getCart(@Req() req: Request) {
    const userId = req.user.id;
    return this.cartService.getCart(userId);
  }

  @Post('items')
  @UseGuards(JwtAuthGuard) // Require authentication
  async addItem(@Req() req: Request, @Body() addToCartDto: AddToCartDto) {
    const userId = req.user.id;
    return this.cartService.addItem(addToCartDto, userId);
  }

  @Put('items/:id')
  @UseGuards(JwtAuthGuard) // Require authentication
  async updateItem(
    @Req() req: Request,
    @Param('id') itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    const userId = req.user.id;
    return this.cartService.updateItem(itemId, updateCartItemDto, userId);
  }

  @Delete('items/:id')
  @UseGuards(JwtAuthGuard) // Require authentication
  async removeItem(@Req() req: Request, @Param('id') itemId: string) {
    const userId = req.user.id;
    return this.cartService.removeItem(itemId, userId);
  }

  @Delete()
  @UseGuards(JwtAuthGuard) // Require authentication
  async clearCart(@Req() req: Request) {
    const userId = req.user.id;
    return this.cartService.clearCart(userId);
  }

  // Remove /cart/merge endpoint - no longer needed
}
```

#### 2. Cart Service Updates

**File: `backend/src/cart/cart.service.ts`**

Simplify to only handle authenticated user carts:

```typescript
@Injectable()
export class CartService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Get cart for authenticated user only
   */
  async getCart(userId: string) {
    const cacheKey = `cart:user:${userId}`;
    const cachedCart = await this.cacheManager.get(cacheKey);

    if (cachedCart) {
      return cachedCart;
    }

    const cart = await this.findOrCreateCart(userId);
    const cartWithItems = await this.prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: { displayOrder: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    await this.cacheManager.set(cacheKey, cartWithItems, 60 * 60 * 24 * 7);
    return cartWithItems;
  }

  /**
   * Add item to cart - handles quantity merging automatically
   */
  async addItem(addToCartDto: AddToCartDto, userId: string) {
    const { productId, quantity } = addToCartDto;

    // Verify product exists and has sufficient stock
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isActive) {
      throw new BadRequestException('Product is not available');
    }

    const isZeroPrice = Number(product.price) === 0;
    if (!isZeroPrice && product.stockQuantity < quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    const cart = await this.findOrCreateCart(userId);

    // Check if item already exists in cart
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      // Merge quantities
      const newQuantity = existingItem.quantity + quantity;

      // Check stock limit
      if (!isZeroPrice && product.stockQuantity < newQuantity) {
        // Set to max available stock
        await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: product.stockQuantity },
        });

        console.log(
          `[Cart Service] Merged quantity exceeds stock. Set to max: ${product.stockQuantity}`,
        );
      } else {
        await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity },
        });

        console.log(
          `[Cart Service] Merged quantities: ${existingItem.quantity} + ${quantity} = ${newQuantity}`,
        );
      }
    } else {
      // Create new cart item
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          price: product.price,
        },
      });
    }

    await this.invalidateCache(userId);
    return this.getCart(userId);
  }

  // Remove sessionId parameters from all methods
  // Remove mergeGuestCart method - no longer needed
  // Simplify findOrCreateCart to only use userId

  private async findOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: { items: true },
    });

    if (!cart) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      cart = await this.prisma.cart.create({
        data: {
          userId,
          expiresAt,
        },
        include: { items: true },
      });

      console.log(`[Cart Service] Created new cart for user: ${userId}`);
    }

    return cart;
  }

  private async invalidateCache(userId: string) {
    const cacheKey = `cart:user:${userId}`;
    await this.cacheManager.del(cacheKey);
  }
}
```

#### 3. Database Schema Updates

**File: `backend/prisma/schema.prisma`**

Remove sessionId field from Cart model since we no longer store guest carts:

```prisma
model Cart {
  id        String   @id @default(uuid())
  userId    String   // Make required (remove ?)
  expiresAt DateTime
  items     CartItem[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("carts")
}
```

Migration to remove sessionId:
```sql
-- Remove sessionId column and make userId required
ALTER TABLE "carts" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "carts" DROP COLUMN "sessionId";

-- Delete any carts without userId (guest carts)
DELETE FROM "carts" WHERE "userId" IS NULL;
```

## Data Models

### Frontend Data Models

```typescript
// Guest cart stored in localStorage
interface GuestCartItem {
  productId: string;
  quantity: number;
}

// Backend cart (authenticated users only)
interface Cart {
  id: string;
  userId: string; // Always present now
  expiresAt: string;
  items: CartItem[];
}

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: string;
  product: Product;
}
```

### Backend Data Models

```prisma
model Cart {
  id        String   @id @default(uuid())
  userId    String   // Required
  expiresAt DateTime
  items     CartItem[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("carts")
}

model CartItem {
  id        String   @id @default(uuid())
  cartId    String
  productId String
  quantity  Int
  price     Decimal  @db.Decimal(10, 2)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  cart    Cart    @relation(fields: [cartId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])

  @@unique([cartId, productId])
  @@index([cartId])
  @@index([productId])
  @@map("cart_items")
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Guest Cart Persistence in localStorage
*For any* guest user adding items to cart, the cart items should be stored in localStorage and persist across page reloads.
**Validates: Requirements 1.1, 1.2**

### Property 2: Cart Sync Trigger on Login
*For any* user who logs in with a non-empty guest cart in localStorage, the Cart Context should automatically trigger the cart sync process.
**Validates: Requirements 2.1, 2.2, 5.1**

### Property 3: All Guest Items Pushed to Backend
*For any* guest cart with N items, after successful login, all N items should be pushed to the backend via the add item API.
**Validates: Requirements 2.3, 2.4**

### Property 4: localStorage Cleared After Successful Sync
*For any* successful cart sync, the guest cart should be cleared from localStorage.
**Validates: Requirements 2.4, 5.5**

### Property 5: Quantity Merging
*For any* guest cart item that already exists in the user's backend cart, the quantities should be combined.
**Validates: Requirements 3.2**

### Property 6: Stock Limit Enforcement
*For any* merged cart item where combined quantity exceeds stock, the quantity should be set to maximum available stock.
**Validates: Requirements 3.3**

### Property 7: Partial Sync Error Handling
*For any* cart sync where some items fail to add, the successfully added items should remain in the backend cart and failed items should remain in localStorage.
**Validates: Requirements 4.4, 4.5**

### Property 8: Empty Guest Cart Handling
*For any* user who logs in with an empty guest cart, the cart sync should be skipped and the user's existing backend cart should be fetched.
**Validates: Requirements 8.1**

### Property 9: Backend Authentication Requirement
*For any* cart API request without authentication, the backend should reject the request with an authentication required error.
**Validates: Requirements 9.5**

### Property 10: OAuth Redirect Preservation
*For any* user who cancels OAuth flow, the guest cart in localStorage should remain unchanged.
**Validates: Requirements 7.1, 7.2**

## Error Handling

### Frontend Error Scenarios

1. **Network Error During Sync**
   - Display error message: "Failed to sync cart. Please try again."
   - Keep guest cart in localStorage
   - Provide retry button

2. **Partial Sync Failure**
   - Display which items were successfully added
   - Display which items failed and why
   - Keep failed items in localStorage
   - Allow user to retry failed items

3. **Product Not Found**
   - Skip the item
   - Log warning
   - Continue with remaining items
   - Notify user: "Some items are no longer available"

4. **Out of Stock**
   - Skip the item
   - Log warning
   - Continue with remaining items
   - Notify user: "Some items are out of stock"

5. **localStorage Unavailable**
   - Fall back to in-memory cart
   - Warn user that cart won't persist
   - Suggest enabling localStorage

### Backend Error Scenarios

1. **Unauthenticated Request**
   - Return 401 Unauthorized
   - Message: "Authentication required to access cart"

2. **Product Not Found**
   - Return 404 Not Found
   - Message: "Product not found"

3. **Insufficient Stock**
   - Return 400 Bad Request
   - Message: "Insufficient stock for product X"

4. **Database Error**
   - Return 500 Internal Server Error
   - Log error with full context
   - Message: "Failed to update cart. Please try again."

## Testing Strategy

### Unit Tests

#### Frontend Unit Tests
- Test guest cart storage in localStorage
- Test guest cart retrieval from localStorage
- Test cart sync trigger on login
- Test partial sync error handling
- Test localStorage clear after successful sync

#### Backend Unit Tests
- Test cart creation for authenticated users
- Test quantity merging when adding existing items
- Test stock limit enforcement
- Test authentication requirement for all endpoints

### Integration Tests

1. **Guest Cart Flow**
   - Add items as guest
   - Verify localStorage storage
   - Reload page
   - Verify cart persists

2. **OAuth Login Flow**
   - Add items as guest
   - Click checkout
   - Complete OAuth login
   - Verify cart sync
   - Verify localStorage cleared
   - Verify all items in backend cart

3. **Quantity Merging**
   - Add item A (qty 2) as guest
   - Login (user already has item A qty 3)
   - Verify final quantity is 5

4. **Stock Limit**
   - Add item B (qty 10) as guest
   - Login (user already has item B qty 5, stock is 12)
   - Verify final quantity is 12 (max stock)

5. **Partial Sync Failure**
   - Add items A, B, C as guest
   - Mock item B as out of stock
   - Login
   - Verify A and C synced
   - Verify B remains in localStorage
   - Verify error message displayed

## Implementation Notes

1. **Migration Strategy**
   - Deploy backend changes first (make sessionId optional)
   - Deploy frontend changes
   - Run migration to remove sessionId column
   - Delete orphaned guest carts

2. **Backward Compatibility**
   - Existing user carts remain unchanged
   - Existing guest carts will be deleted during migration
   - Users will need to re-add items (acceptable tradeoff)

3. **Performance**
   - localStorage operations are synchronous and fast
   - Cart sync happens once per login
   - Backend load reduced (no guest cart storage)

4. **Security**
   - Guest cart data in localStorage can be manipulated
   - Backend validates all items during sync
   - Stock and price checks happen on backend

5. **Testing Priority**
   - Focus on OAuth login flow with cart sync
   - Test error handling thoroughly
   - Test quantity merging edge cases
