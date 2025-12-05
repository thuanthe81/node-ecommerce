/**
 * Quill Editor Configuration
 *
 * Configuration and setup utilities for Quill.js editor
 */

import type { QuillConfig, QuillToolbarConfig } from '../types';

/**
 * Default toolbar configuration for the Quill editor
 *
 * Includes:
 * - Headers (H1, H2, H3)
 * - Text formatting (bold, italic, underline)
 * - Lists (ordered, bullet)
 * - Links and images
 * - Clear formatting
 */
export const DEFAULT_TOOLBAR_CONFIG: QuillToolbarConfig = {
  container: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'image'],
    ['clean'],
  ],
};

/**
 * Allowed formats for the Quill editor
 */
export const ALLOWED_FORMATS = [
  'header',
  'bold',
  'italic',
  'underline',
  'list',
  'bullet',
  'link',
  'image',
];

/**
 * Create a Quill configuration object
 *
 * @param options - Configuration options
 * @returns Complete Quill configuration
 */
export function createQuillConfig(options: {
  showToolbar?: boolean;
  placeholder?: string;
  readOnly?: boolean;
  imageHandler?: () => void;
}): QuillConfig {
  const { showToolbar = true, placeholder = '', readOnly = false, imageHandler } = options;

  const toolbarConfig: QuillToolbarConfig = {
    ...DEFAULT_TOOLBAR_CONFIG,
  };

  // Add custom image handler if provided
  if (imageHandler) {
    toolbarConfig.handlers = {
      image: imageHandler,
    };
  }

  return {
    theme: 'snow',
    modules: {
      toolbar: showToolbar ? toolbarConfig : false,
      clipboard: {
        matchVisual: false,
      },
      history: {
        delay: 1000,
        maxStack: 50,
        userOnly: true,
      },
    },
    formats: ALLOWED_FORMATS,
    placeholder,
    readOnly,
  };
}
