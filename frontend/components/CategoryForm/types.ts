import { Category } from '@/lib/category-api';
import { CreateCategoryData } from '@/lib/admin-category-api';

/**
 * Props for the CategoryForm component
 */
export interface CategoryFormProps {
  /** Current locale for translations */
  locale: string;
  /** Category to edit (undefined for create mode) */
  category?: Category;
  /** Whether the form is in edit mode */
  isEdit?: boolean;
}

/**
 * Form data structure for category creation/editing
 */
export interface CategoryFormData {
  slug: string;
  nameEn: string;
  nameVi: string;
  descriptionEn: string;
  descriptionVi: string;
  parentId?: string;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
}

/**
 * Active language tab for bilingual content
 */
export type LanguageTab = 'en' | 'vi';

/**
 * Flattened category with display level for hierarchical display
 */
export interface FlattenedCategory extends Category {
  displayOrder: number;
}
