/**
 * PDF Generation Types
 *
 * This file contains all TypeScript interfaces and types used for PDF generation
 * functionality in the order attachment system.
 */

export interface PDFGenerationResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
  metadata: {
    generatedAt: Date;
    locale: string;
    orderNumber: string;
    /** Storage performance metrics for compressed image integration */
    storageMetrics?: {
      /** Number of images retrieved from compressed storage */
      reusedImages: number;
      /** Number of images newly optimized and stored */
      newlyOptimizedImages: number;
      /** Total time spent retrieving from storage (ms) */
      storageRetrievalTime: number;
      /** Total time spent storing new optimizations (ms) */
      storageWriteTime: number;
      /** Cache hit rate for this generation */
      cacheHitRate: number;
      /** Total storage size used by compressed images (bytes) */
      totalStorageSize: number;
      /** Overall storage utilization percentage */
      storageUtilization: number;
    };
    /** Image optimization metrics */
    optimizationMetrics?: {
      /** Total original size of all images */
      totalOriginalSize: number;
      /** Total optimized size of all images */
      totalOptimizedSize: number;
      /** Overall compression ratio */
      compressionRatio: number;
      /** Number of images optimized */
      optimizedImages: number;
      /** Number of optimization failures */
      failedOptimizations: number;
      /** Total processing time for all optimizations */
      processingTime: number;
    };
  };
}

export interface OrderPDFData {
  orderNumber: string;
  orderDate: string;
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
  };
  billingAddress: AddressData;
  shippingAddress: AddressData;
  items: OrderItemData[];
  pricing: {
    subtotal: number;
    shippingCost: number;
    taxAmount?: number;
    discountAmount?: number;
    total: number;
  };
  paymentMethod: PaymentMethodData;
  shippingMethod: ShippingMethodData;
  businessInfo: BusinessInfoData;
  locale: 'en' | 'vi';
}

export interface AddressData {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface OrderItemData {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
  category?: string;
}

export interface PaymentMethodData {
  type: 'bank_transfer' | 'cash_on_delivery' | 'qr_code';
  displayName: string;
  details?: string;
  qrCodeUrl?: string;
  instructions?: string;
  status: 'pending' | 'completed' | 'failed';
  // Bank transfer specific fields
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
}

export interface ShippingMethodData {
  name: string;
  description?: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  carrier?: string;
}

export interface BusinessInfoData {
  companyName: string;
  logoUrl?: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  address: AddressData;
  returnPolicy?: string;
  termsAndConditions?: string;
}

export interface PDFTemplate {
  header: PDFSection;
  content: PDFSection[];
  footer: PDFSection;
  styling: PDFStyling;
  metadata: PDFMetadata;
}

export interface PDFSection {
  type: 'header' | 'content' | 'footer' | 'table' | 'text' | 'image';
  content: string;
  styles?: Record<string, string>;
  data?: any;
}

export interface PDFStyling {
  fonts: {
    primary: string;
    heading: string;
    monospace: string;
  };
  colors: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
    border: string;
  };
  spacing: {
    small: number;
    medium: number;
    large: number;
  };
  pageFormat: {
    size: 'A4' | 'Letter';
    orientation: 'portrait' | 'landscape';
    margins: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };
}

export interface PDFMetadata {
  title: string;
  author: string;
  subject: string;
  creator: string;
  producer: string;
  creationDate: Date;
  keywords: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface SimplifiedEmailTemplate {
  subject: string;
  textContent: string;
  htmlContent: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  attachmentSize?: number;
  deliveryStatus: 'sent' | 'failed' | 'queued';
  timestamp: Date;
  retryCount?: number;
}

export interface StorageResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
}

export interface CleanupResult {
  filesRemoved: number;
  spaceFreed: number;
  errors: string[];
}

export interface StorageCapacityResult {
  totalSpace: number;
  usedSpace: number;
  availableSpace: number;
  utilizationPercentage: number;
  isNearCapacity: boolean;
}

export interface ResendResult {
  success: boolean;
  message: string;
  rateLimited?: boolean;
  error?: string;
  jobId?: string; // Job ID for tracking async email queue processing
}

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetTime: Date;
}

// Re-export image optimization types
export * from './image-optimization.types';