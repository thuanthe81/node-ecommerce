import { Content, CreateContentData } from '@/lib/content-api';

/**
 * Props for the ContentForm component
 */
export interface ContentFormProps {
  /** Existing content to edit (optional for create mode) */
  content?: Content;
  /** Callback function to handle form submission */
  onSubmit: (data: CreateContentData) => Promise<void>;
  /** Callback function to handle form cancellation */
  onCancel: () => void;
}

/**
 * Form data structure for content management
 */
export interface ContentFormData {
  slug: string;
  type: 'PAGE' | 'FAQ' | 'BANNER' | 'HOMEPAGE_SECTION';
  titleEn: string;
  titleVi: string;
  contentEn: string;
  contentVi: string;
  imageUrl: string;
  linkUrl: string;
  buttonTextEn: string;
  buttonTextVi: string;
  layout: 'centered' | 'image-left' | 'image-right';
  displayOrder: number;
  isPublished: boolean;
}

/**
 * Language tab options
 */
export type LanguageTab = 'en' | 'vi';

/**
 * Validation errors for form fields
 */
export interface ValidationErrors {
  [key: string]: string;
}
