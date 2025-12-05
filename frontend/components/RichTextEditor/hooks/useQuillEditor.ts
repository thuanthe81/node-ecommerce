/**
 * useQuillEditor Hook
 *
 * Manages Quill editor instance lifecycle and configuration
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import type Quill from 'quill';
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
  const quillRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<Quill | null>(null);
  const [isReady, setIsReady] = useState(false);
  const onChangeRef = useRef(onChange);
  const isUpdatingRef = useRef(false);

  // Keep onChange ref up to date
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Initialize Quill editor
  useEffect(() => {
    if (!quillRef.current || editor) return;

    let isMounted = true;

    // Dynamic import of Quill to avoid SSR issues
    import('quill').then(({ default: Quill }) => {
      if (!isMounted || !quillRef.current) return;

      // Create Quill configuration
      const config = createQuillConfig({
        showToolbar: options.showToolbar,
        placeholder: options.placeholder,
        readOnly: options.readOnly,
        imageHandler: options.imageHandler,
      });

      // Initialize Quill instance
      const quillInstance = new Quill(quillRef.current, config);

      // Set initial content
      if (initialValue) {
        isUpdatingRef.current = true;
        quillInstance.root.innerHTML = initialValue;
        isUpdatingRef.current = false;
      }

      // Set up text-change event listener
      quillInstance.on('text-change', () => {
        // Skip if we're updating from props
        if (isUpdatingRef.current) return;

        const html = quillInstance.root.innerHTML;
        onChangeRef.current(html);
      });

      setEditor(quillInstance);
      setIsReady(true);
    });

    return () => {
      isMounted = false;
    };
  }, []); // Only run once on mount

  // Update content when value prop changes
  useEffect(() => {
    if (!editor || !isReady) return;

    const currentContent = editor.root.innerHTML;

    // Only update if content is different
    if (currentContent !== initialValue) {
      isUpdatingRef.current = true;
      editor.root.innerHTML = initialValue;
      isUpdatingRef.current = false;
    }
  }, [initialValue, editor, isReady]);

  // Update read-only state when prop changes
  useEffect(() => {
    if (!editor || !isReady) return;

    if (options.readOnly) {
      editor.disable();
    } else {
      editor.enable();
    }
  }, [options.readOnly, editor, isReady]);

  return {
    quillRef,
    editor,
    isReady,
  };
}
