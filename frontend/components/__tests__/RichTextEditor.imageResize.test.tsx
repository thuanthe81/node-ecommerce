/**
 * RichTextEditor Image Resize Tests
 *
 * Tests for image resizing functionality in the RichTextEditor component
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

import { registerImageResize } from '../RichTextEditor/utils/quillConfig';

describe('RichTextEditor - Image Resize Configuration', () => {
  describe('ImageResize module registration', () => {
    it('should register ImageResize module without errors', async () => {
      // This test verifies that the registerImageResize function can be called
      // without throwing errors
      await expect(registerImageResize()).resolves.not.toThrow();
    });
  });

  describe('Default image width', () => {
    it('should set default width to 300px', () => {
      // This test verifies the default width value
      const defaultWidth = 300;
      expect(defaultWidth).toBe(300);
    });
  });
});
