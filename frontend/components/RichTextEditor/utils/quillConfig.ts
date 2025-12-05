/**
 * Quill Editor Configuration
 *
 * Configuration and setup utilities for Quill.js editor
 */

import type { QuillConfig, QuillToolbarConfig } from '../types';

// Import and register ImageResize module
let ImageResize: any = null;
let Quill: any = null;

/**
 * Initialize and register the ImageResize module with Quill
 * This must be called before creating any Quill instances
 */
export async function registerImageResize() {
  if (typeof window === 'undefined') return;

  try {
    // Dynamic imports to avoid SSR issues
    const QuillModule = await import('quill');
    Quill = QuillModule.default;

    const ImageResizeModule = await import('quill-image-resize-module-react');
    ImageResize = ImageResizeModule.default;

    // Register the module with Quill
    Quill.register('modules/imageResize', ImageResize);
  } catch (error) {
    console.error('Failed to register ImageResize module:', error);
  }
}

/**
 * Custom color palette for text formatting
 *
 * Includes a range of colors from basic to dark shades
 */
export const COLOR_PALETTE = [
  // Basic colors
  '#000000', '#e60000', '#ff9900', '#ffff00', '#008a00', '#0066cc', '#9933ff',
  // Light colors
  '#ffffff', '#facccc', '#ffebcc', '#ffffcc', '#cce8cc', '#cce0f5', '#ebd6ff',
  // Medium colors
  '#bbbbbb', '#f06666', '#ffc266', '#ffff66', '#66b966', '#66a3e0', '#c285ff',
  // Dark colors
  '#888888', '#a10000', '#b26b00', '#b2b200', '#006100', '#0047b2', '#6b24b2',
  // Very dark colors
  '#444444', '#5c0000', '#663d00', '#666600', '#003700', '#002966', '#3d1466'
];

/**
 * Default toolbar configuration for the Quill editor
 *
 * Includes:
 * - Headers (H1, H2, H3)
 * - Text formatting (bold, italic, underline)
 * - Color picker
 * - Lists (ordered, bullet)
 * - Links and images
 * - Clear formatting
 */
export const DEFAULT_TOOLBAR_CONFIG: QuillToolbarConfig = {
  container: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ color: COLOR_PALETTE }],
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
  'color',
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

  // Configure imageResize module if available
  const imageResizeConfig = Quill ? {
    parchment: Quill.import('parchment'),
    modules: ['Resize', 'DisplaySize', 'Toolbar']
  } : undefined;

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
      ...(imageResizeConfig && { imageResize: imageResizeConfig }),
    },
    formats: ALLOWED_FORMATS,
    placeholder,
    readOnly,
  };
}
