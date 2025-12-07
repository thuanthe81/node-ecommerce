import { ShippingMethod } from '@/lib/shipping-method-api';
import { CreateShippingMethodDto, UpdateShippingMethodDto } from '@/lib/shipping-method-api';

/**
 * Props for the ShippingMethodForm component
 */
export interface ShippingMethodFormProps {
  /** Initial data for edit mode */
  initialData?: ShippingMethod;
  /** Callback when form is submitted */
  onSubmit: (data: CreateShippingMethodDto | UpdateShippingMethodDto) => Promise<void>;
  /** Callback when form is cancelled */
  onCancel: () => void;
  /** Whether the form is in edit mode */
  isEdit?: boolean;
  /** Whether the form is currently submitting */
  isSubmitting?: boolean;
}

/**
 * Form data structure for shipping method creation/editing
 */
export interface ShippingMethodFormData {
  methodId: string;
  nameEn: string;
  nameVi: string;
  descriptionEn: string;
  descriptionVi: string;
  carrier: string;
  baseRate: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  weightThreshold: number;
  weightRate: number;
  freeShippingThreshold: number;
  regionalPricing: RegionalPricingEntry[];
  isActive: boolean;
  displayOrder: number;
}

/**
 * Active language tab for bilingual content
 */
export type LanguageTab = 'en' | 'vi';

/**
 * Regional pricing entry for country/region specific rates
 */
export interface RegionalPricingEntry {
  id: string; // Unique ID for React key
  countryOrRegion: string;
  rate: number;
}
