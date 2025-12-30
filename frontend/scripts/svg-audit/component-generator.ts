/**
 * SVG Component Template Generator
 * Requirements: 2.1, 2.2, 2.3
 *
 * Generates TypeScript SVG components following existing patterns
 * Ensures SvgProps type usage and proper prop spreading
 * Maintains customizable properties (stroke, fill, size)
 */

import { InlineSvgAudit, SvgComponentInfo, SvgVisualProperties } from './types';

export interface GeneratedComponent {
  /** Component name (e.g., "SvgHome") */
  name: string;
  /** Generated TypeScript component code */
  code: string;
  /** Component category for organization */
  category: 'navigation' | 'ui' | 'social' | 'utility' | 'content';
  /** Original audit data this component was generated from */
  sourceAudit: InlineSvgAudit;
}

export interface ComponentGenerationOptions {
  /** Whether to preserve original fill attributes */
  preserveFill?: boolean;
  /** Whether to preserve original stroke attributes */
  preserveStroke?: boolean;
  /** Whether to make size customizable via props */
  customizableSize?: boolean;
  /** Default viewBox if none exists */
  defaultViewBox?: string;
}

export class SvgComponentGenerator {
  private readonly defaultOptions: ComponentGenerationOptions = {
    preserveFill: false, // Use currentColor by default
    preserveStroke: true,
    customizableSize: true,
    defaultViewBox: '0 0 24 24'
  };

  /**
   * Generate a TypeScript SVG component from audit data
   */
  generateComponent(
    audit: InlineSvgAudit,
    options: ComponentGenerationOptions = {}
  ): GeneratedComponent {
    const opts = { ...this.defaultOptions, ...options };
    const componentName = this.sanitizeComponentName(audit.proposedComponentName);
    const category = this.determineCategory(componentName, audit.svgContent);

    // Parse the SVG content to extract and modify attributes
    const processedSvg = this.processSvgContent(audit.svgContent, audit.visualProperties, opts);

    // Generate the component code
    const code = this.generateComponentCode(componentName, processedSvg, audit.visualProperties);

    return {
      name: componentName,
      code,
      category,
      sourceAudit: audit
    };
  }

  /**
   * Generate multiple components from audit results
   */
  generateComponents(
    audits: InlineSvgAudit[],
    options: ComponentGenerationOptions = {}
  ): GeneratedComponent[] {
    return audits.map(audit => this.generateComponent(audit, options));
  }

  /**
   * Sanitize and ensure component name follows conventions
   */
  private sanitizeComponentName(proposedName: string): string {
    // Ensure it starts with "Svg"
    if (!proposedName.startsWith('Svg')) {
      proposedName = 'Svg' + proposedName;
    }

    // Remove any invalid characters and ensure PascalCase
    const sanitized = proposedName
      .replace(/[^a-zA-Z0-9]/g, '')
      .replace(/^./, char => char.toUpperCase())
      .replace(/([a-z])([A-Z])/g, '$1$2'); // Preserve existing PascalCase

    return sanitized;
  }

  /**
   * Determine component category based on name and content
   */
  private determineCategory(
    name: string,
    svgContent: string
  ): 'navigation' | 'ui' | 'social' | 'utility' | 'content' {
    const lowerName = name.toLowerCase();
    const lowerContent = svgContent.toLowerCase();

    // Navigation indicators
    if (lowerName.includes('menu') || lowerName.includes('nav') ||
        lowerName.includes('chevron') || lowerName.includes('arrow') ||
        lowerName.includes('home') || lowerName.includes('back')) {
      return 'navigation';
    }

    // Social media indicators
    if (lowerName.includes('facebook') || lowerName.includes('twitter') ||
        lowerName.includes('instagram') || lowerName.includes('linkedin') ||
        lowerName.includes('youtube') || lowerName.includes('tiktok') ||
        lowerName.includes('whatsapp') || lowerName.includes('zalo')) {
      return 'social';
    }

    // Content indicators
    if (lowerName.includes('image') || lowerName.includes('video') ||
        lowerName.includes('document') || lowerName.includes('file') ||
        lowerName.includes('text') || lowerName.includes('content')) {
      return 'content';
    }

    // Utility indicators
    if (lowerName.includes('settings') || lowerName.includes('config') ||
        lowerName.includes('tool') || lowerName.includes('gear') ||
        lowerName.includes('search') || lowerName.includes('filter')) {
      return 'utility';
    }

    // Default to UI
    return 'ui';
  }

  /**
   * Process SVG content to follow component patterns
   */
  private processSvgContent(
    svgContent: string,
    visualProps: SvgVisualProperties,
    options: ComponentGenerationOptions
  ): string {
    let processed = svgContent;

    // Remove any existing React props that might conflict
    processed = processed.replace(/\s+className\s*=\s*[^>\s]+/gi, '');
    processed = processed.replace(/\s+style\s*=\s*\{[^}]*\}/gi, '');

    // Ensure proper SVG attributes
    if (!visualProps.viewBox && options.defaultViewBox) {
      processed = processed.replace('<svg', `<svg viewBox="${options.defaultViewBox}"`);
    }

    // Handle fill attribute
    if (!options.preserveFill) {
      // Replace specific fill colors with currentColor or none
      if (visualProps.fill && visualProps.fill !== 'none' && visualProps.fill !== 'currentColor') {
        processed = processed.replace(/fill\s*=\s*["'][^"']*["']/gi, 'fill="currentColor"');
      } else if (!visualProps.fill) {
        processed = processed.replace('<svg', '<svg fill="none"');
      }
    }

    // Handle stroke attribute
    if (options.preserveStroke && !visualProps.stroke) {
      processed = processed.replace('<svg', '<svg stroke="currentColor"');
    }

    // Add props spreading at the end of opening svg tag
    processed = processed.replace(/(<svg[^>]*?)>/, '$1 {...props}>');

    return processed;
  }

  /**
   * Generate the complete component code
   */
  private generateComponentCode(
    componentName: string,
    processedSvg: string,
    visualProps: SvgVisualProperties
  ): string {
    // Determine if we need special props (like ImageProps for Zalo-style components)
    const needsImageProps = componentName.toLowerCase().includes('zalo') ||
                           processedSvg.includes('Image') ||
                           processedSvg.includes('data:image');

    const propsType = needsImageProps ? 'ImageProps' : 'SvgProps';

    // Format the SVG content with proper indentation
    const formattedSvg = this.formatSvgContent(processedSvg);

    return `export const ${componentName} = (props: ${propsType}) => (
  ${formattedSvg}
)`;
  }

  /**
   * Format SVG content with proper indentation
   */
  private formatSvgContent(svgContent: string): string {
    // Split into lines and add proper indentation
    const lines = svgContent.split('\n');
    const indentedLines = lines.map((line, index) => {
      if (index === 0) return line; // First line doesn't need extra indent
      return '  ' + line.trim(); // Add 2 spaces for continuation
    });

    return indentedLines.join('\n');
  }

  /**
   * Generate component info for tracking
   */
  generateComponentInfo(component: GeneratedComponent): SvgComponentInfo {
    const { sourceAudit } = component;

    return {
      name: component.name,
      category: component.category,
      viewBox: sourceAudit.visualProperties.viewBox || '0 0 24 24',
      hasStroke: sourceAudit.visualProperties.stroke !== undefined,
      hasFill: sourceAudit.visualProperties.fill !== undefined,
      isCustomizable: sourceAudit.hasCustomProps ||
                     sourceAudit.visualProperties.usesCurrentColor,
      usageLocations: [sourceAudit.filePath]
    };
  }

  /**
   * Validate generated component code
   */
  validateComponent(component: GeneratedComponent): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check component name
    if (!component.name.startsWith('Svg')) {
      errors.push('Component name must start with "Svg"');
    }

    if (!/^[A-Z][a-zA-Z0-9]*$/.test(component.name)) {
      errors.push('Component name must be valid PascalCase');
    }

    // Check code structure
    if (!component.code.includes('export const')) {
      errors.push('Component must be exported as const');
    }

    if (!component.code.includes('props:')) {
      errors.push('Component must accept props parameter');
    }

    if (!component.code.includes('{...props}')) {
      errors.push('Component must spread props to SVG element');
    }

    // Check SVG structure
    if (!component.code.includes('<svg')) {
      errors.push('Component must contain SVG element');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Utility function to create a component generator instance
 */
export function createComponentGenerator(): SvgComponentGenerator {
  return new SvgComponentGenerator();
}

/**
 * Generate component name from SVG content analysis
 */
export function generateComponentName(svgContent: string, context: string): string {
  // Extract meaningful keywords from context and SVG content
  const contextWords = context.toLowerCase().match(/\b\w+\b/g) || [];
  const svgWords = svgContent.toLowerCase().match(/\b\w+\b/g) || [];

  // Common SVG-related keywords to look for
  const iconKeywords = [
    'menu', 'close', 'home', 'user', 'cart', 'search', 'settings',
    'arrow', 'chevron', 'plus', 'minus', 'check', 'cross', 'star',
    'heart', 'share', 'download', 'upload', 'edit', 'delete', 'info',
    'warning', 'error', 'success', 'play', 'pause', 'stop', 'next',
    'previous', 'forward', 'back', 'up', 'down', 'left', 'right'
  ];

  // Find matching keywords
  const foundKeywords = iconKeywords.filter(keyword =>
    (contextWords as string[]).includes(keyword) || (svgWords as string[]).includes(keyword)
  );

  if (foundKeywords.length > 0) {
    // Use the first found keyword, capitalize it
    const keyword = foundKeywords[0];
    return 'Svg' + keyword.charAt(0).toUpperCase() + keyword.slice(1);
  }

  // Fallback: try to extract from class names or IDs in context
  const classMatch = context.match(/className\s*=\s*["']([^"']*icon[^"']*)["']/i);
  if (classMatch) {
    const className = classMatch[1];
    const iconPart = className.split(/[-_\s]/).find(part =>
      part.toLowerCase().includes('icon') || iconKeywords.includes(part.toLowerCase())
    );
    if (iconPart) {
      const cleaned = iconPart.replace(/icon/i, '').trim();
      if (cleaned) {
        return 'Svg' + cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      }
    }
  }

  // Final fallback
  return 'SvgIcon';
}