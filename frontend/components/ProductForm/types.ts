import { Product, ProductImage } from '@/lib/product-api';
import { Category } from '@/lib/category-api';

/**
 * Props for the ProductForm component
 */
export interface ProductFormProps {
  /** Current locale for translations */
  locale: string;
  /** Product to edit (undefined for create mode) */
  product?: Product;
  /** Whether the form is in edit mode */
  isEdit?: boolean;
}

/**
 * Form data structure for product creation/editing
 */
export interface ProductFormData {
  slug: string;
  sku: string;
  nameEn: string;
  nameVi: string;
  descriptionEn: string;
  descriptionVi: string;
  price: number;
  compareAtPrice: number;
  stockQuantity: number;
  categoryId: string;
  isActive: boolean;
  isFeatured: boolean;
}

/**
 * Active language tab for bilingual content
 */
export type LanguageTab = 'en' | 'vi';

/**
 * Return type for useProductForm hook
 */
export interface UseProductFormReturn {
  formData: ProductFormData;
  images: ProductImage[];
  categories: Category[];
  activeTab: LanguageTab;
  loading: boolean;
  lowStockWarning: boolean;
  outOfStock: boolean;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  handleImagesChange: (updatedImages: ProductImage[]) => void;
  handleDeleteImage: (imageId: string) => Promise<void>;
  handleReorderImages: (reorderedImages: ProductImage[]) => Promise<void>;
  handleUpdateAltText: (imageId: string, altTextEn: string, altTextVi: string) => Promise<void>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  setActiveTab: (tab: LanguageTab) => void;
  imageManagerRef: React.RefObject<any>;
}
