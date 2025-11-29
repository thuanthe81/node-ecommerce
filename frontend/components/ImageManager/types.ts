import { ProductImage } from '@/lib/product-api';

/**
 * Props for the ImageManager component
 */
export interface ImageManagerProps {
  /** Optional product ID for existing products */
  productId?: string;
  /** Array of existing product images */
  existingImages: ProductImage[];
  /** Callback when images change */
  onImagesChange: (images: ProductImage[]) => void;
  /** Current locale for translations */
  locale: string;
  /** Optional callback for uploading files */
  onUpload?: (files: File[]) => Promise<void>;
  /** Optional callback for deleting an image */
  onDelete?: (imageId: string) => Promise<void>;
  /** Optional callback for reordering images */
  onReorder?: (images: ProductImage[]) => Promise<void>;
  /** Optional callback for updating alt text */
  onUpdateAltText?: (imageId: string, altTextEn: string, altTextVi: string) => Promise<void>;
}

/**
 * Internal representation of an image item
 */
export interface ImageItem {
  /** Unique identifier for the image */
  id: string;
  /** URL of the image */
  url: string;
  /** Alt text in English */
  altTextEn?: string;
  /** Alt text in Vietnamese */
  altTextVi?: string;
  /** Display order of the image */
  displayOrder: number;
  /** Whether this is a newly added image */
  isNew?: boolean;
  /** File object for new images */
  file?: File;
  /** Whether the image is currently uploading */
  uploading?: boolean;
}

/**
 * Props for the SortableImageItem component
 */
export interface SortableImageItemProps {
  /** Image item to display */
  image: ImageItem;
  /** Index of the image in the list */
  index: number;
  /** Current locale for translations */
  locale: string;
  /** Callback when delete button is clicked */
  onDelete: (id: string) => void;
  /** Callback when edit alt text button is clicked */
  onEditAltText: (id: string) => void;
  /** Whether this image is currently being edited */
  isEditing: boolean;
}

/**
 * Props for the ImageUploadZone component
 */
export interface ImageUploadZoneProps {
  /** Callback when files are selected */
  onFilesSelected: (files: FileList | null) => void;
  /** Current locale for translations */
  locale: string;
  /** Whether drag is currently active */
  isDragging: boolean;
  /** Callback when drag over event occurs */
  onDragOver: (e: React.DragEvent) => void;
  /** Callback when drag leave event occurs */
  onDragLeave: (e: React.DragEvent) => void;
  /** Callback when drop event occurs */
  onDrop: (e: React.DragEvent) => void;
}

/**
 * Props for the ImageGrid component
 */
export interface ImageGridProps {
  /** Array of images to display */
  images: ImageItem[];
  /** Current locale for translations */
  locale: string;
  /** Callback when delete button is clicked */
  onDelete: (id: string) => void;
  /** Callback when edit alt text button is clicked */
  onEditAltText: (id: string) => void;
  /** ID of the image currently being edited */
  editingImageId: string | null;
  /** Callback when drag end event occurs */
  onDragEnd: (event: any) => void;
}

/**
 * Props for the AltTextEditor component
 */
export interface AltTextEditorProps {
  /** Current locale for translations */
  locale: string;
  /** Alt text in English */
  altTextEn: string;
  /** Alt text in Vietnamese */
  altTextVi: string;
  /** Callback when alt text changes */
  onAltTextEnChange: (value: string) => void;
  /** Callback when alt text changes */
  onAltTextViChange: (value: string) => void;
  /** Callback when save button is clicked */
  onSave: () => void;
  /** Callback when cancel button is clicked */
  onCancel: () => void;
}

/**
 * Handle interface for ImageManager ref
 */
export interface ImageManagerHandle {
  /** Get array of new files that haven't been uploaded yet */
  getNewFiles: () => File[];
}
