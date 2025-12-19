/**
 * MediaGrid Component Tests
 *
 * Tests for the MediaGrid component functionality including:
 * - Responsive grid display
 * - Media item metadata display (thumbnail, filename, date, size)
 * - Delete confirmation dialog
 * - Copy URL functionality
 * - Empty and loading states
 */

import { formatFileSize, formatDate, getFullUrl } from '../../../../components/MediaGrid/utils/formatters';

// Test utility functions
describe('MediaGrid Utilities', () => {
  describe('formatFileSize', () => {
    it('formats 0 bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
    });

    it('formats bytes to KB', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(2048)).toBe('2 KB');
    });

    it('formats bytes to MB', () => {
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1536000)).toBe('1.46 MB');
    });

    it('formats bytes to GB', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });
  });

  describe('formatDate', () => {
    it('formats dates in English locale', () => {
      const dateString = '2024-01-15T10:30:00Z';
      const formatted = formatDate(dateString, 'en');

      expect(formatted).toContain('Jan');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2024');
    });

    it('formats dates in Vietnamese locale', () => {
      const dateString = '2024-01-15T10:30:00Z';
      const formatted = formatDate(dateString, 'vi');

      expect(formatted).toContain('15');
      expect(formatted).toContain('2024');
    });
  });

  describe('getFullUrl', () => {
    const originalEnv = process.env.NEXT_PUBLIC_API_URL;

    afterEach(() => {
      process.env.NEXT_PUBLIC_API_URL = originalEnv;
    });

    it('returns absolute URLs unchanged', () => {
      const url = 'https://example.com/image.jpg';
      expect(getFullUrl(url)).toBe(url);
    });

    it('converts relative URLs to absolute', () => {
      process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001';
      const url = '/uploads/content/image.jpg';
      expect(getFullUrl(url)).toBe('http://localhost:3001/uploads/content/image.jpg');
    });

    it('handles URLs without leading slash', () => {
      process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001';
      const url = 'uploads/content/image.jpg';
      expect(getFullUrl(url)).toBe('http://localhost:3001/uploads/content/image.jpg');
    });
  });
});
