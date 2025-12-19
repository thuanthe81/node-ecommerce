/**
 * RichTextEditor Color Formatting Tests
 *
 * Tests for color formatting functionality in the RichTextEditor component
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { COLOR_PALETTE, ALLOWED_FORMATS, DEFAULT_TOOLBAR_CONFIG } from '../RichTextEditor/utils/quillConfig';

describe('RichTextEditor - Color Formatting Configuration', () => {
  describe('Color format in allowed formats', () => {
    it('should include color in the allowed formats list', () => {
      expect(ALLOWED_FORMATS).toContain('color');
    });

    it('should have all required formats including color', () => {
      const requiredFormats = ['header', 'bold', 'italic', 'underline', 'color', 'list', 'bullet', 'link', 'image'];
      requiredFormats.forEach(format => {
        expect(ALLOWED_FORMATS).toContain(format);
      });
    });
  });

  describe('Color palette configuration', () => {
    it('should have color palette defined', () => {
      expect(COLOR_PALETTE).toBeDefined();
      expect(Array.isArray(COLOR_PALETTE)).toBe(true);
    });

    it('should have 35 colors in the palette (7 colors × 5 rows)', () => {
      expect(COLOR_PALETTE.length).toBe(35);
    });

    it('should include basic colors', () => {
      const basicColors = ['#000000', '#e60000', '#ff9900', '#ffff00', '#008a00', '#0066cc', '#9933ff'];
      basicColors.forEach(color => {
        expect(COLOR_PALETTE).toContain(color);
      });
    });

    it('should include light colors', () => {
      const lightColors = ['#ffffff', '#facccc', '#ffebcc', '#ffffcc', '#cce8cc', '#cce0f5', '#ebd6ff'];
      lightColors.forEach(color => {
        expect(COLOR_PALETTE).toContain(color);
      });
    });

    it('should include medium colors', () => {
      const mediumColors = ['#bbbbbb', '#f06666', '#ffc266', '#ffff66', '#66b966', '#66a3e0', '#c285ff'];
      mediumColors.forEach(color => {
        expect(COLOR_PALETTE).toContain(color);
      });
    });

    it('should include dark colors', () => {
      const darkColors = ['#888888', '#a10000', '#b26b00', '#b2b200', '#006100', '#0047b2', '#6b24b2'];
      darkColors.forEach(color => {
        expect(COLOR_PALETTE).toContain(color);
      });
    });

    it('should include very dark colors', () => {
      const veryDarkColors = ['#444444', '#5c0000', '#663d00', '#666600', '#003700', '#002966', '#3d1466'];
      veryDarkColors.forEach(color => {
        expect(COLOR_PALETTE).toContain(color);
      });
    });

    it('should have all colors in hex format', () => {
      const hexColorRegex = /^#[0-9a-f]{6}$/i;
      COLOR_PALETTE.forEach(color => {
        expect(color).toMatch(hexColorRegex);
      });
    });
  });

  describe('Toolbar configuration with color picker', () => {
    it('should include color picker in toolbar configuration', () => {
      const toolbarContainer = DEFAULT_TOOLBAR_CONFIG.container;
      expect(toolbarContainer).toBeDefined();

      // Find the color configuration in the toolbar
      const colorConfig = toolbarContainer.find((item: any) => {
        if (Array.isArray(item)) {
          return item.some((subItem: any) =>
            typeof subItem === 'object' && subItem !== null && 'color' in subItem
          );
        }
        return false;
      });

      expect(colorConfig).toBeDefined();
    });

    it('should configure color picker with custom palette', () => {
      const toolbarContainer = DEFAULT_TOOLBAR_CONFIG.container;

      // Find the color configuration
      const colorRow = toolbarContainer.find((item: any) => {
        if (Array.isArray(item)) {
          return item.some((subItem: any) =>
            typeof subItem === 'object' && subItem !== null && 'color' in subItem
          );
        }
        return false;
      }) as any[];

      expect(colorRow).toBeDefined();

      // Get the color config object
      const colorConfig = colorRow.find((item: any) =>
        typeof item === 'object' && item !== null && 'color' in item
      );

      expect(colorConfig).toBeDefined();
      expect(colorConfig.color).toEqual(COLOR_PALETTE);
    });

    it('should have color picker positioned after text formatting buttons', () => {
      const toolbarContainer = DEFAULT_TOOLBAR_CONFIG.container;

      // Verify toolbar structure
      expect(toolbarContainer[0]).toEqual([{ header: [1, 2, 3, false] }]); // Headers
      expect(toolbarContainer[1]).toEqual(['bold', 'italic', 'underline']); // Text formatting

      // Color picker should be in position 2 (third row)
      const colorRow = toolbarContainer[2];
      expect(Array.isArray(colorRow)).toBe(true);
      expect(colorRow.some((item: any) =>
        typeof item === 'object' && item !== null && 'color' in item
      )).toBe(true);
    });
  });

  describe('Color format validation', () => {
    it('should validate that color format is properly configured for Quill', () => {
      // Verify that the configuration follows Quill's expected format
      const toolbarContainer = DEFAULT_TOOLBAR_CONFIG.container;
      const colorRow = toolbarContainer[2] as any[];
      const colorConfig = colorRow[0];

      // Quill expects { color: array } format
      expect(typeof colorConfig).toBe('object');
      expect(colorConfig).toHaveProperty('color');
      expect(Array.isArray(colorConfig.color)).toBe(true);
      expect(colorConfig.color.length).toBeGreaterThan(0);
    });
  });
});
