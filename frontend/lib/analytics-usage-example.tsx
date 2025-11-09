/**
 * Example: How to integrate analytics tracking in your components
 * 
 * This file demonstrates how to use the analytics tracking in various scenarios.
 * Copy and adapt these examples to your actual components.
 */

'use client';

import { useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';

// Example 1: Track product view on product detail page
export function ProductDetailPageExample({ product }: { product: any }) {
  const analytics = useAnalytics();

  useEffect(() => {
    // Track product view when component mounts
    analytics.trackProductView({
      id: product.id,
      name: product.nameEn, // or product.nameVi based on locale
      category: product.category?.nameEn,
      price: Number(product.price),
    });
  }, [product.id]); // Only track when product changes

  return (
    <div>
      <h1>{product.nameEn}</h1>
      {/* Rest of product detail UI */}
    </div>
  );
}

// Example 2: Track add to cart
export function AddToCartButtonExample({ product }: { product: any }) {
  const analytics = useAnalytics();

  const handleAddToCart = async (quantity: number) => {
    // Add to cart logic here...
    
    // Track the event
    analytics.trackAddToCart({
      id: product.id,
      name: product.nameEn,
      category: product.category?.nameEn,
      price: Number(product.price),
      quantity,
    });
  };

  return (
    <button onClick={() => handleAddToCart(1)}>
      Add to Cart
    </button>
  );
}

// Example 3: Track search
export function SearchBarExample() {
  const analytics = useAnalytics();

  const handleSearch = (searchTerm: string) => {
    // Perform search logic...
    
    // Track the search
    analytics.trackSearch(searchTerm);
  };

  return (
    <input
      type="search"
      onChange={(e) => handleSearch(e.target.value)}
      placeholder="Search products..."
    />
  );
}

// Example 4: Track begin checkout
export function CheckoutButtonExample({ cartItems, total }: { cartItems: any[], total: number }) {
  const analytics = useAnalytics();

  const handleBeginCheckout = () => {
    // Track begin checkout
    analytics.trackBeginCheckout(
      cartItems.map(item => ({
        id: item.product.id,
        name: item.product.nameEn,
        category: item.product.category?.nameEn,
        price: Number(item.price),
        quantity: item.quantity,
      })),
      total,
    );

    // Navigate to checkout...
  };

  return (
    <button onClick={handleBeginCheckout}>
      Proceed to Checkout
    </button>
  );
}

// Example 5: Track purchase on order success page
export function OrderSuccessPageExample({ order }: { order: any }) {
  const analytics = useAnalytics();

  useEffect(() => {
    // Track purchase when order success page loads
    analytics.trackPurchase(
      order.orderNumber,
      order.items.map((item: any) => ({
        id: item.productId,
        name: item.productNameEn,
        category: undefined, // Add if available
        price: Number(item.price),
        quantity: item.quantity,
      })),
      Number(order.total),
      Number(order.taxAmount),
      Number(order.shippingCost),
    );
  }, [order.orderNumber]); // Only track once per order

  return (
    <div>
      <h1>Order Successful!</h1>
      <p>Order Number: {order.orderNumber}</p>
      {/* Rest of success page UI */}
    </div>
  );
}

// Example 6: Track page view (usually done automatically, but can be manual)
export function CustomPageExample() {
  const analytics = useAnalytics();

  useEffect(() => {
    analytics.trackPageView('/custom-page');
  }, []);

  return <div>Custom Page Content</div>;
}

// Example 7: Track remove from cart
export function CartItemExample({ item, onRemove }: { item: any, onRemove: () => void }) {
  const analytics = useAnalytics();

  const handleRemove = () => {
    // Track removal
    analytics.trackRemoveFromCart({
      id: item.product.id,
      name: item.product.nameEn,
      category: item.product.category?.nameEn,
      price: Number(item.price),
      quantity: item.quantity,
    });

    // Remove from cart
    onRemove();
  };

  return (
    <div>
      <span>{item.product.nameEn}</span>
      <button onClick={handleRemove}>Remove</button>
    </div>
  );
}
