/**
 * MediaPickerModal Component Types
 * Type definitions for the MediaPickerModal component and its sub-components
 */

import { ContentMedia } from '@/lib/content-media-api';

/**
 * Props for the MediaPickerModal component
 */
export interface MediaPickerModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when a media item is selected */
  onSelectMedia: (url: string) => void;
  /** Current locale for translations */
  locale: string;
}

/**
 * Props for the ModalHeader component
 */
export interface ModalHeaderProps {
  /** Current search query */
  searchQuery: string;
  /** Callback when search query changes */
  onSearchChange: (query: string) => void;
  /** Callback when search is submitted */
  onSearch: () => void;
  /** Callback when search is cleared */
  onClearSearch: () => void;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Current locale for translations */
  locale: string;
}

/**
 * Props for the ModalBody component
 */
export interface ModalBodyProps {
  /** Array of media items to display */
  items: ContentMedia[];
  /** Loading state */
  loading: boolean;
  /** Current search query */
  searchQuery: string;
  /** Callback when a media item is selected */
  onSelectMedia: (url: string) => void;
  /** Current locale for translations */
  locale: string;
}

/**
 * Props for the ModalFooter component
 */
export interface ModalFooterProps {
  /** Total number of media items */
  totalItems: number;
  /** Current page number */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Current locale for translations */
  locale: string;
}
