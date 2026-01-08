/**
 * RichTextEditor Component Types
 *
 * Type definitions for the Quill.js-based rich text editor component
 * used in the content management system.
 */

import type Quill from 'quill';

/**
 * Props for the main RichTextEditor component
 */
export interface RichTextEditorProps {
  /** HTML content value */
  value: string;

  /** Callback fired when content changes */
  onChange: (html: string) => void;

  /** Placeholder text shown when editor is empty */
  placeholder?: string;

  /** Whether the editor is in read-only mode (for preview) */
  readOnly?: boolean;

  /** Whether to show the formatting toolbar */
  showToolbar?: boolean;

  /** Optional callback fired when an image is inserted */
  onImageInsert?: (url: string) => void;

  /** Additional CSS classes to apply to the editor container */
  className?: string;

  /** Current locale for translations (en or vi) */
  locale: string;

  /** Whether the editor has a validation error */
  hasError?: boolean;
}

/**
 * Return type for the useQuillEditor hook
 */
export interface UseQuillEditorReturn {
  /** Ref to attach to the editor container div */
  quillRef: React.RefObject<HTMLDivElement | null>;

  /** The Quill editor instance (null/undefined until initialized) */
  editor: Quill | null | undefined;

  /** Whether the editor has been initialized and is ready */
  isReady: boolean;
}

/**
 * Options for configuring the Quill editor
 */
export interface QuillEditorOptions {
  /** Whether to show the toolbar */
  showToolbar?: boolean;

  /** Placeholder text */
  placeholder?: string;

  /** Whether the editor is read-only */
  readOnly?: boolean;

  /** Custom image button handler */
  imageHandler?: () => void;
}

/**
 * Product image selection data
 */
export interface ProductImageSelection {
  /** The URL of the selected image */
  url: string;

  /** The slug of the product this image belongs to */
  slug: string;
}

/**
 * Return type for the useImageInsertion hook
 */
export interface UseImageInsertionReturn {
  /** Whether the product image picker modal is visible */
  showProductPicker: boolean;

  /** Function to show/hide the product image picker */
  setShowProductPicker: (show: boolean) => void;

  /** Handler for when a product image is selected */
  handleProductImageSelect: (url: string, slug?: string) => void;

  /** Handler for file upload from disk */
  // handleFileUpload: (file: File) => Promise<void>;

  /** Whether an image upload is in progress */
  // isUploading: boolean;

  /** Error message from upload failure (null if no error) */
  uploadError: string | null;

  /** Success message after successful image insertion (null if no success) */
  successMessage: string | null;
}

/**
 * Data for image upload operations
 */
export interface ImageUploadData {
  /** The file to upload */
  file: File;

  /** Optional product slug if image is from a product */
  slug?: string;
}

/**
 * Result of an image upload operation
 */
export interface ImageUploadResult {
  /** Whether the upload was successful */
  success: boolean;

  /** The URL of the uploaded image (if successful) */
  url?: string;

  /** Error message (if unsuccessful) */
  error?: string;
}

/**
 * Response from the backend image upload endpoint
 */
export interface UploadImageResponse {
  /** Public URL of the uploaded image */
  url: string;

  /** Generated filename on the server */
  filename: string;
}

/**
 * Configuration for the Quill toolbar
 */
export interface QuillToolbarConfig {
  container: Array<string | Array<string | { [key: string]: any }>>;
  handlers?: {
    image?: () => void;
    [key: string]: (() => void) | undefined;
  };
}

/**
 * Toolbar configuration that can be disabled
 */
export type QuillToolbarConfigOrDisabled = QuillToolbarConfig | false;

/**
 * Complete Quill configuration object
 */
export interface QuillConfig {
  theme: 'snow' | 'bubble';
  modules: {
    toolbar: QuillToolbarConfigOrDisabled;
    clipboard?: any;
    history?: any;
    imageResize?: any;
  };
  formats: string[];
  placeholder?: string;
  readOnly?: boolean;
}