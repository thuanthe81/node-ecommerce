/**
 * Type definitions for BlogPostForm component
 */

export interface BlogPostFormData {
  titleEn: string;
  titleVi: string;
  slug: string;
  excerptEn: string;
  excerptVi: string;
  contentEn: string;
  contentVi: string;
  authorName: string;
  imageUrl: string;
  categoryIds: string[];
  displayOrder: number;
  isPublished: boolean;
}

export interface BlogCategory {
  id: string;
  slug: string;
  nameEn: string;
  nameVi: string;
}

export interface BlogPostFormProps {
  blogPost?: any; // Existing blog post for edit mode
  onSubmit: (data: BlogPostFormData) => Promise<void>;
  onCancel: () => void;
  locale: string;
}

export interface ValidationErrors {
  [key: string]: string;
}
