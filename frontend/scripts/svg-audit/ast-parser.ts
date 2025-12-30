/**
 * AST parsing logic to identify inline SVG elements
 * Requirements: 1.1, 1.2, 1.4
 */

import * as ts from 'typescript';
import { InlineSvgAudit, SvgVisualProperties, FileAuditResult } from './types';
import { FileScanner } from './file-scanner';

export class AstParser {
  private fileScanner: FileScanner;

  constructor(fileScanner: FileScanner) {
    this.fileScanner = fileScanner;
  }

  /**
   * Parse a file and extract SVG information
   * @param filePath Path to the file to parse
   * @returns File audit result
   */
  public async parseFile(filePath: string): Promise<FileAuditResult> {
    const content = await this.fileScanner.readFileContent(filePath);
    const relativePath = this.fileScanner.getRelativePath(filePath);

    if (!content) {
      return {
        filePath: relativePath,
        inlineSvgs: [],
        existingSvgImports: [],
        parseSuccess: false,
        parseError: 'Failed to read file content'
      };
    }

    try {
      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

      const inlineSvgs = this.extractInlineSvgs(sourceFile, content, relativePath);
      const existingSvgImports = this.extractSvgImports(sourceFile);

      return {
        filePath: relativePath,
        inlineSvgs,
        existingSvgImports,
        parseSuccess: true
      };
    } catch (error) {
      return {
        filePath: relativePath,
        inlineSvgs: [],
        existingSvgImports: [],
        parseSuccess: false,
        parseError: `Parse error: ${error}`
      };
    }
  }

  /**
   * Extract inline SVG elements from the AST
   * @param sourceFile TypeScript source file
   * @param content Original file content
   * @param filePath Relative file path
   * @returns Array of inline SVG audits
   */
  private extractInlineSvgs(
    sourceFile: ts.SourceFile,
    content: string,
    filePath: string
  ): InlineSvgAudit[] {
    const inlineSvgs: InlineSvgAudit[] = [];

    const visit = (node: ts.Node) => {
      if (this.isSvgElement(node)) {
        const svgAudit = this.createSvgAudit(node as ts.JsxElement | ts.JsxSelfClosingElement, sourceFile, content, filePath);
        if (svgAudit) {
          inlineSvgs.push(svgAudit);
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return inlineSvgs;
  }

  /**
   * Extract existing SVG component imports
   * @param sourceFile TypeScript source file
   * @returns Array of imported SVG component names
   */
  private extractSvgImports(sourceFile: ts.SourceFile): string[] {
    const svgImports: string[] = [];

    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) {
        const importClause = node.importClause;
        const moduleSpecifier = node.moduleSpecifier;

        // Check if importing from Svgs component
        if (ts.isStringLiteral(moduleSpecifier) &&
            (moduleSpecifier.text.includes('/Svgs') || moduleSpecifier.text.includes('@/components/Svgs'))) {

          if (importClause?.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
            for (const element of importClause.namedBindings.elements) {
              const importName = element.name.text;
              if (importName.startsWith('Svg')) {
                svgImports.push(importName);
              }
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return svgImports;
  }

  /**
   * Check if a node represents an SVG element
   * @param node AST node to check
   * @returns True if node is an SVG element
   */
  private isSvgElement(node: ts.Node): boolean {
    if (!ts.isJsxElement(node) && !ts.isJsxSelfClosingElement(node)) {
      return false;
    }

    const tagName = this.getJsxTagName(node);
    return tagName === 'svg';
  }

  /**
   * Get the tag name from a JSX element
   * @param node JSX element node
   * @returns Tag name or null
   */
  private getJsxTagName(node: ts.JsxElement | ts.JsxSelfClosingElement): string | null {
    const tagNameNode = ts.isJsxElement(node)
      ? node.openingElement.tagName
      : node.tagName;

    if (ts.isIdentifier(tagNameNode)) {
      return tagNameNode.text;
    }
    return null;
  }

  /**
   * Create an SVG audit record from an AST node
   * @param node SVG element node
   * @param sourceFile Source file containing the node
   * @param content Original file content
   * @param filePath Relative file path
   * @returns SVG audit record or null if creation fails
   */
  private createSvgAudit(
    node: ts.JsxElement | ts.JsxSelfClosingElement,
    sourceFile: ts.SourceFile,
    content: string,
    filePath: string
  ): InlineSvgAudit | null {
    try {
      const start = node.getStart(sourceFile);
      const end = node.getEnd();
      const svgContent = content.substring(start, end);

      const lineAndChar = sourceFile.getLineAndCharacterOfPosition(start);
      const lineNumber = lineAndChar.line + 1; // Convert to 1-based

      const context = this.fileScanner.extractContext(content, lineNumber);
      const visualProperties = this.extractVisualProperties(node);
      const accessibilityAttributes = this.extractAccessibilityAttributes(node);
      const hasCustomProps = this.hasCustomProperties(node);
      const proposedComponentName = this.generateComponentName(visualProperties, svgContent);

      return {
        filePath,
        lineNumber,
        svgContent,
        context,
        proposedComponentName,
        usageCount: 1, // Will be calculated later during deduplication
        hasCustomProps,
        accessibilityAttributes,
        visualProperties
      };
    } catch (error) {
      console.warn(`Failed to create SVG audit for node in ${filePath}: ${error}`);
      return null;
    }
  }

  /**
   * Extract visual properties from SVG element
   * @param node SVG element node
   * @returns Visual properties object
   */
  private extractVisualProperties(node: ts.JsxElement | ts.JsxSelfClosingElement): SvgVisualProperties {
    const attributes = this.getJsxAttributes(node);
    const customAttributes: Record<string, string> = {};
    let usesCurrentColor = false;

    const viewBox = attributes.get('viewBox');
    const width = attributes.get('width');
    const height = attributes.get('height');
    const fill = attributes.get('fill');
    const stroke = attributes.get('stroke');
    const strokeWidth = attributes.get('strokeWidth') || attributes.get('stroke-width');

    // Check for currentColor usage in attributes and child elements
    usesCurrentColor = this.detectCurrentColorUsage(node, attributes);

    // Collect custom attributes (excluding standard SVG attributes)
    const standardAttributes = new Set([
      'viewBox', 'width', 'height', 'fill', 'stroke', 'strokeWidth', 'stroke-width',
      'className', 'style', 'id', 'aria-hidden', 'aria-label', 'aria-labelledby',
      'aria-describedby', 'role', 'xmlns', 'xmlnsXlink', 'focusable'
    ]);

    for (const [key, value] of attributes) {
      if (!standardAttributes.has(key)) {
        customAttributes[key] = value;
      }
    }

    return {
      viewBox,
      width,
      height,
      fill,
      stroke,
      strokeWidth,
      usesCurrentColor,
      customAttributes
    };
  }

  /**
   * Detect currentColor usage in SVG element and its children
   * @param node SVG element node
   * @param attributes SVG attributes map
   * @returns True if currentColor is used
   */
  private detectCurrentColorUsage(
    node: ts.JsxElement | ts.JsxSelfClosingElement,
    attributes: Map<string, string>
  ): boolean {
    // Check direct attributes
    if (attributes.get('fill') === 'currentColor' ||
        attributes.get('stroke') === 'currentColor') {
      return true;
    }

    // Check child elements for currentColor usage
    if (ts.isJsxElement(node)) {
      const svgContent = node.getText();
      return svgContent.includes('currentColor');
    }

    return false;
  }

  /**
   * Extract accessibility attributes from SVG element
   * @param node SVG element node
   * @returns Array of accessibility attribute names
   */
  private extractAccessibilityAttributes(node: ts.JsxElement | ts.JsxSelfClosingElement): string[] {
    const attributes = this.getJsxAttributes(node);
    const accessibilityAttributes: string[] = [];

    // ARIA attributes
    const ariaAttributes = [
      'aria-hidden', 'aria-label', 'aria-labelledby', 'aria-describedby',
      'aria-expanded', 'aria-pressed', 'aria-selected', 'aria-checked',
      'aria-disabled', 'aria-readonly', 'aria-required'
    ];

    // Role and other accessibility attributes
    const otherA11yAttributes = ['role', 'tabindex', 'focusable'];

    // Check for ARIA attributes
    for (const attr of ariaAttributes) {
      if (attributes.has(attr)) {
        accessibilityAttributes.push(`${attr}="${attributes.get(attr)}"`);
      }
    }

    // Check for other accessibility attributes
    for (const attr of otherA11yAttributes) {
      if (attributes.has(attr)) {
        accessibilityAttributes.push(`${attr}="${attributes.get(attr)}"`);
      }
    }

    // Check for title and desc elements within SVG (for screen readers)
    if (ts.isJsxElement(node)) {
      const svgContent = node.getText();
      if (svgContent.includes('<title>') || svgContent.includes('<desc>')) {
        accessibilityAttributes.push('has-title-or-desc');
      }
    }

    return accessibilityAttributes;
  }

  /**
   * Check if SVG has custom properties that need preservation
   * @param node SVG element node
   * @returns True if has custom properties
   */
  private hasCustomProperties(node: ts.JsxElement | ts.JsxSelfClosingElement): boolean {
    const attributes = this.getJsxAttributes(node);
    const jsxElement = ts.isJsxElement(node) ? node.openingElement : node;

    // Check for dynamic attributes (JSX expressions)
    if (jsxElement.attributes) {
      for (const attr of jsxElement.attributes.properties) {
        if (ts.isJsxAttribute(attr) && attr.initializer && ts.isJsxExpression(attr.initializer)) {
          return true;
        }
        if (ts.isJsxSpreadAttribute(attr)) {
          return true;
        }
      }
    }

    // Check for event handlers
    const eventHandlers = ['onClick', 'onMouseEnter', 'onMouseLeave', 'onFocus', 'onBlur'];
    for (const handler of eventHandlers) {
      if (attributes.has(handler)) {
        return true;
      }
    }

    // Check for conditional styling or classes
    const className = attributes.get('className');
    const style = attributes.get('style');

    if (className && (className.includes('${') || className.includes('?'))) {
      return true;
    }

    if (style && (style.includes('${') || style.includes('?'))) {
      return true;
    }

    // Check for data attributes or other custom props
    for (const [key] of attributes) {
      if (key.startsWith('data-') || key.startsWith('aria-') || key === 'ref') {
        return true;
      }
    }

    return false;
  }

  /**
   * Get JSX attributes as a Map
   * @param node JSX element node
   * @returns Map of attribute names to values
   */
  private getJsxAttributes(node: ts.JsxElement | ts.JsxSelfClosingElement): Map<string, string> {
    const attributes = new Map<string, string>();
    const jsxElement = ts.isJsxElement(node) ? node.openingElement : node;

    if (jsxElement.attributes) {
      for (const attr of jsxElement.attributes.properties) {
        if (ts.isJsxAttribute(attr) && ts.isIdentifier(attr.name)) {
          const name = attr.name.text;
          let value = '';

          if (attr.initializer) {
            if (ts.isStringLiteral(attr.initializer)) {
              value = attr.initializer.text;
            } else if (ts.isJsxExpression(attr.initializer)) {
              value = attr.initializer.expression?.getText() || '';
            }
          }

          attributes.set(name, value);
        }
      }
    }

    return attributes;
  }

  /**
   * Generate a component name based on SVG properties
   * @param properties Visual properties
   * @param svgContent SVG content for fallback naming
   * @returns Proposed component name
   */
  private generateComponentName(properties: SvgVisualProperties, svgContent: string): string {
    // Try to infer name from path elements or common patterns
    const pathMatch = svgContent.match(/d="([^"]+)"/);
    if (pathMatch) {
      const pathData = pathMatch[1];

      // Look for common icon patterns based on path data
      if (pathData.includes('M4 6h16M4 12h16M4 18h16') ||
          pathData.includes('M3 12h18M3 6h18M3 18h18')) {
        return 'SvgMenu';
      }
      if (pathData.includes('M6 18L18 6M6 6l12 12') ||
          pathData.includes('m6 6 12 12M6 18 18 6')) {
        return 'SvgClose';
      }
      if (pathData.includes('M5 13l4 4L19 7') ||
          pathData.includes('m5 13 4 4L19 7')) {
        return 'SvgCheck';
      }
      if (pathData.includes('M12 5v14M5 12h14') ||
          pathData.includes('M12 4v16M4 12h16')) {
        return 'SvgPlus';
      }
      if (pathData.includes('M5 12h14') ||
          pathData.includes('M4 12h16')) {
        return 'SvgMinus';
      }
      if (pathData.includes('M9 5l7 7-7 7') ||
          pathData.includes('m9 5 7 7-7 7')) {
        return 'SvgChevronRight';
      }
      if (pathData.includes('M15 19l-7-7 7-7') ||
          pathData.includes('m15 19-7-7 7-7')) {
        return 'SvgChevronLeft';
      }
      if (pathData.includes('M5 9l7-7 7 7') ||
          pathData.includes('m5 9 7-7 7 7')) {
        return 'SvgChevronUp';
      }
      if (pathData.includes('M19 9l-7 7-7-7') ||
          pathData.includes('m19 9-7 7-7-7')) {
        return 'SvgChevronDown';
      }
    }

    // Check for common SVG elements and attributes
    if (svgContent.includes('circle') && svgContent.includes('path')) {
      if (svgContent.includes('search') || svgContent.includes('magnify')) {
        return 'SvgSearch';
      }
      return 'SvgIcon';
    }

    if (svgContent.includes('rect') && svgContent.includes('path')) {
      return 'SvgDocument';
    }

    // Check for social media patterns
    if (svgContent.includes('facebook') || svgContent.toLowerCase().includes('fb')) {
      return 'SvgFacebook';
    }
    if (svgContent.includes('twitter') || svgContent.includes('bird')) {
      return 'SvgTwitter';
    }
    if (svgContent.includes('instagram') || svgContent.includes('camera')) {
      return 'SvgInstagram';
    }

    // Check viewBox for common dimensions
    if (properties.viewBox) {
      const viewBoxMatch = properties.viewBox.match(/0 0 (\d+) (\d+)/);
      if (viewBoxMatch) {
        const [, width, height] = viewBoxMatch;
        if (width === height) {
          return 'SvgSquareIcon';
        }
      }
    }

    // Fallback to generic naming with better uniqueness
    const contentHash = this.generateContentHash(svgContent);
    return `SvgIcon${contentHash}`;
  }

  /**
   * Generate a short hash from SVG content for unique naming
   * @param content SVG content
   * @returns Short hash string
   */
  private generateContentHash(content: string): string {
    // Simple hash function for generating unique suffixes
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 4).toUpperCase();
  }
}

/**
 * Utility function to create an AST parser
 * @param fileScanner File scanner instance
 * @returns Configured AstParser instance
 */
export function createAstParser(fileScanner: FileScanner): AstParser {
  return new AstParser(fileScanner);
}