/**
 * useQuillEditor Hook
 *
 * Manages Quill editor instance lifecycle and configuration using react-quilljs
 */

'use client';

import { useEffect, useRef } from 'react';
import { useQuill } from 'react-quilljs';
import type { UseQuillEditorReturn, QuillEditorOptions } from '../types';
import { createQuillConfig } from '../utils/quillConfig';

/**
 * Hook for managing Quill editor lifecycle
 *
 * Handles:
 * - Editor initialization on mount
 * - Toolbar configuration
 * - Text change event listeners
 * - Content synchronization
 * - Cleanup on unmount
 *
 * @param initialValue - Initial HTML content
 * @param onChange - Callback when content changes
 * @param options - Editor configuration options
 * @returns Editor ref, instance, and ready state
 */
export function useQuillEditor(
  initialValue: string,
  onChange: (html: string) => void,
  options: QuillEditorOptions = {}
): UseQuillEditorReturn {
  const onChangeRef = useRef(onChange);
  const isUpdatingRef = useRef(false);

  // Keep onChange ref up to date
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Create Quill configuration
  const config = createQuillConfig({
    showToolbar: options.showToolbar,
    placeholder: options.placeholder,
    readOnly: options.readOnly,
    imageHandler: options.imageHandler,
    linkHandler: options.linkHandler,
  });

  // Initialize Quill editor using react-quilljs hook
  const { quill: editor, quillRef, Quill } = useQuill({
    theme: config.theme,
    modules: config.modules,
    formats: config.formats,
    placeholder: config.placeholder,
    readOnly: config.readOnly,
  });

  // Register ImageResize module when Quill is available
  useEffect(() => {
    if (Quill && typeof window !== 'undefined') {
      (async () => {
        try {
          const { registerImageResize } = await import('../utils/quillConfig');
          await registerImageResize(Quill);
        } catch (error) {
          console.error('Failed to register ImageResize module:', error);
        }
      })();
    }
  }, [Quill]);

  // Set up text-change event listener and initial content
  useEffect(() => {
    if (!editor) return;

    // Set initial content
    if (initialValue && editor.root.innerHTML !== initialValue) {
      isUpdatingRef.current = true;
      editor.root.innerHTML = initialValue;
      isUpdatingRef.current = false;
    }

    // Set up text-change event listener
    const handleTextChange = () => {
      // Skip if we're updating from props
      if (isUpdatingRef.current) return;

      const html = editor.root.innerHTML;
      onChangeRef.current(html);
    };

    editor.on('text-change', handleTextChange);

    return () => {
      editor.off('text-change', handleTextChange);
    };
  }, [editor, initialValue]);

  // Update content when value prop changes
  useEffect(() => {
    if (!editor) return;

    const currentContent = editor.root.innerHTML;

    // Only update if content is different
    if (currentContent !== initialValue) {
      isUpdatingRef.current = true;
      editor.root.innerHTML = initialValue;
      isUpdatingRef.current = false;
    }
  }, [initialValue, editor]);

  // Update read-only state when prop changes
  useEffect(() => {
    if (!editor) return;

    if (options.readOnly) {
      editor.disable();
    } else {
      editor.enable();
    }
  }, [options.readOnly, editor]);

  return {
    quillRef,
    editor,
    isReady: !!editor,
  };
}
