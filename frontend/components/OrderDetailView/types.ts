/**
 * Type definitions for OrderDetailView component
 */

import { Order } from '@/lib/order-api';
import { BankTransferSettings } from '@/lib/payment-settings-api';

/**
 * Props for the OrderDetailView component
 */
export interface OrderDetailViewProps {
  /** The ID of the order to display */
  orderId: string;
  /** Current locale for formatting and translations */
  locale: string;
  /** Whether to show the success banner at the top */
  showSuccessBanner?: boolean;
  /** Whether to show bank transfer info for orders that are already paid */
  showBankTransferForPaidOrders?: boolean;
}

/**
 * State for managing order data and loading states
 */
export interface OrderState {
  /** The order data */
  order: Order | null;
  /** Bank transfer settings for payment instructions */
  bankSettings: BankTransferSettings | null;
  /** Whether the order is currently being loaded */
  isLoadingOrder: boolean;
  /** Whether the bank settings are currently being loaded */
  isLoadingSettings: boolean;
  /** Error message when loading order fails */
  orderError: string | null;
  /** Error message when loading settings fails */
  settingsError: string | null;
}
