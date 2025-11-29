import { CreateContentData } from '@/lib/content-api';

/**
 * Layout options for homepage sections
 */
export type LayoutType = 'centered' | 'image-left' | 'image-right';

/**
 * Props for the HomepageSectionForm component
 */
export interface HomepageSectionFormProps {
  /** Existing section to edit (optional for create mode) */
  section?: {
    slug: string;
    titleEn: string;
    titleVi: string;
    contentEn: string;
    contentVi: string;
    imageUrl?: string;
    linkUrl?: string;
    buttonTextEn?: string;
    buttonTextVi?: string;
    layout?: string;
    displayOrder: number;
    isPublished: boolean;
  };
  /** Callback when form is submitted */
  onSubmit: (data: CreateContentData) => Promise<void>;
  /** Callback when form is cancelled */
  onCancel: () => void;
  /** Whether to show preview panel */
  showPreview?: boolean;
  /** Callback when preview data changes */
  onPreviewDataChange?: (data: PreviewData) => void;
}

/**
 * Data structure for preview panel
 */
export interface PreviewData {
  layout: LayoutType;
  titleEn: string;
  titleVi: string;
  contentEn: string;
  contentVi: string;
  buttonTextEn: string;
  buttonTextVi: string;
  buttonUrl: string;
  imageUrl: string;
}

/**
 * Form data structure for homepage section
 */
export interface HomepageSectionFormData extends CreateContentData {
  slug: string;
  type: 'HOMEPAGE_SECTION';
  titleEn: string;
  titleVi: string;
  contentEn: string;
  contentVi: string;
  imageUrl: string;
  linkUrl: string;
  buttonTextEn: string;
  buttonTextVi: string;
  layout: LayoutType;
  displayOrder: number;
  isPublished: boolean;
}

/**
 * Language tab options
 */
export type LanguageTab = 'en' | 'vi';
