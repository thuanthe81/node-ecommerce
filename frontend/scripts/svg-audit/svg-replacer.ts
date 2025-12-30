/**
 * SVG Replacement Logic
 * Requirements: 3.2, 3.3, 4.4
 *
 * Replaces inline SVG elements with component usage while preserving
 * all existing props, styling, event handlers, and accessibility attributes
 */

import * as ts from 'typescript';
import { readFileSync, writeFileSync } from 'fs';
import { InlineSvgAudit, SvgVisualProperties } from './types';
import { GeneratedComponent } from './component-generator';
import { ImportStatementGenerator } from './import-generator';

export interface SvgReplacementResult {
  /** Updated file content */
  updatedContent: string;
  /** Number of SVGs that were replaced */
  replacedCount: number;
  /** List of component names that were used */
  usedComponents: string[];
  /** List of SVGs that couldn't be replaced */
  failedReplacements: { audit: InlineSvgAudit; reason: string }[];
  /** Any warnings encountered */
  warnings: string[];
  /** Whether the replacement was successful */
  success: boolean;
}

export interface ReplacementOptions {
  /** Whether to preserve original formatting */
  preserveFormatting?: boolean;
  /** Whether to validate component usage */
  validateComponents?: boolean;
  /** Whether to preserve comments near SVGs */
  preserveComments?: boolean;
  /** Custom component name mapping */
  componentNameMapping?: Record<string, string>;
  /** Whether to add import statements automatically */
  autoAddImports?: boolean;
}

export interface PropMapping {
  /** Original prop name */
  originalName: string;
  /** New prop name (if different) */
  newName?: string;
  /** Original prop value */
  originalValue: string;
  /** New prop value (if transformation needed) */
  newValue?: string;
  /** Whether this prop should be preserved */
  preserve: boolean;
  /** Reason for not preserving (if preserve is false) */
  skipReason?: string;
}

export class SvgReplacer {
  private readonly options: Required<ReplacementOptions>;
  private readonly importGenerator: ImportStatementGenerator;

  constructor(options: ReplacementOptions = {}) {
    this.options = {
      preserveFormatting: true,
      validateComponents: true,
      preserveComments: true,
      componentNameMapping: {},
      autoAddImports: true,
      ...options
    };

    this.importGenerator = new ImportStatementGenerator();
  }

  /**
   * Replace inline SVGs in a file with component usage
   */
  async replaceInlineSvgsInFile(
    filePath: string,
    auditResults: InlineSvgAudit[],
    generatedComponents: GeneratedComponent[]
  ): Promise<SvgReplacementResult> {
    try {
      const fileContent = readFileSync(filePath, 'utf-8');
      return this.replaceInlineSvgsInContent(fileContent, auditResults, generatedComponents);
    } catch (error: any) {
      return {
        updatedContent: '',
        replacedCount: 0,
        usedComponents: [],
        failedReplacements: auditResults.map(audit => ({
          audit,
          reason: `Failed to read file: ${error?.message || 'Unknown error'}`
        })),
        warnings: [`Failed to read file ${filePath}: ${error?.message || 'Unknown error'}`],
        success: false
      };
    }
  }

  /**
   * Replace inline SVGs in content string
   */
  replaceInlineSvgsInContent(
    fileContent: string,
    auditResults: InlineSvgAudit[],
    generatedComponents: GeneratedComponent[]
  ): SvgReplacementResult {
    const warnings: string[] = [];
    const failedReplacements: { audit: InlineSvgAudit; reason: string }[] = [];
    const usedComponents: string[] = [];
    let replacedCount = 0;

    try {
      // Create component lookup map
      const componentMap = new Map<string, GeneratedComponent>();
      generatedComponents.forEach(comp => {
        componentMap.set(comp.sourceAudit.svgContent, comp);
      });

      let updatedContent = fileContent;

      // Sort audit results by line number (descending) to avoid position shifts
      const sortedAudits = [...auditResults].sort((a, b) => b.lineNumber - a.lineNumber);

      for (const audit of sortedAudits) {
        const component = componentMap.get(audit.svgContent);
        if (!component) {
          failedReplacements.push({
            audit,
            reason: 'No matching generated component found'
          });
          continue;
        }

        // Get the component name (check for custom mapping)
        const componentName = this.options.componentNameMapping[component.name] || component.name;

        try {
          // Replace the SVG with component usage
          const replacementResult = this.replaceSingleSvg(
            updatedContent,
            audit,
            componentName
          );

          if (replacementResult.success) {
            updatedContent = replacementResult.updatedContent;
            usedComponents.push(componentName);
            replacedCount++;
            warnings.push(...replacementResult.warnings);
          } else {
            failedReplacements.push({
              audit,
              reason: replacementResult.error || 'Unknown replacement error'
            });
          }

        } catch (error: any) {
          failedReplacements.push({
            audit,
            reason: `Replacement error: ${error?.message || 'Unknown error'}`
          });
        }
      }

      // Add import statements if requested
      if (this.options.autoAddImports && usedComponents.length > 0) {
        const uniqueComponents = [...new Set(usedComponents)];
        const mockGeneratedComponents = uniqueComponents.map(name => ({
          name,
          // Mock other required properties
          sourceAudit: auditResults[0],
          category: 'ui' as const,
          code: ''
        }));

        const importResult = this.importGenerator.updateImportsInContent(
          updatedContent,
          mockGeneratedComponents
        );

        if (importResult.success) {
          updatedContent = importResult.updatedContent;
          warnings.push(...importResult.warnings);
        } else {
          warnings.push('Failed to update import statements');
          warnings.push(...importResult.warnings);
        }
      }

      return {
        updatedContent,
        replacedCount,
        usedComponents: [...new Set(usedComponents)],
        failedReplacements,
        warnings,
        success: failedReplacements.length === 0
      };

    } catch (error: any) {
      return {
        updatedContent: fileContent,
        replacedCount: 0,
        usedComponents: [],
        failedReplacements: auditResults.map(audit => ({
          audit,
          reason: `Processing error: ${error?.message || 'Unknown error'}`
        })),
        warnings: [`Error during replacement: ${error?.message || 'Unknown error'}`],
        success: false
      };
    }
  }

  /**
   * Replace a single SVG element with component usage
   */
  private replaceSingleSvg(
    fileContent: string,
    audit: InlineSvgAudit,
    componentName: string
  ): {
    updatedContent: string;
    success: boolean;
    error?: string;
    warnings: string[];
  } {
    const warnings: string[] = [];

    try {
      // Parse the SVG content to extract props
      const propMapping = this.extractSvgProps(audit.svgContent);

      // Generate component usage
      const componentUsage = this.generateComponentUsage(
        componentName,
        propMapping,
        audit.accessibilityAttributes
      );

      // Find and replace the SVG in the content
      const svgIndex = fileContent.indexOf(audit.svgContent);
      if (svgIndex === -1) {
        return {
          updatedContent: fileContent,
          success: false,
          error: 'SVG content not found in file',
          warnings
        };
      }

      // Replace the SVG with component usage
      const before = fileContent.substring(0, svgIndex);
      const after = fileContent.substring(svgIndex + audit.svgContent.length);
      const updatedContent = before + componentUsage + after;

      return {
        updatedContent,
        success: true,
        warnings
      };

    } catch (error: any) {
      return {
        updatedContent: fileContent,
        success: false,
        error: error?.message || 'Unknown error',
        warnings
      };
    }
  }

  /**
   * Extract props from SVG content
   */
  private extractSvgProps(svgContent: string): PropMapping[] {
    const propMappings: PropMapping[] = [];

    try {
      // Create a temporary React component to parse the SVG
      const tempComponent = `const TempComponent = () => (${svgContent});`;

      const sourceFile = ts.createSourceFile(
        'temp.tsx',
        tempComponent,
        ts.ScriptTarget.Latest,
        true
      );

      const visit = (node: ts.Node) => {
        if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
          const tagName = ts.isJsxElement(node)
            ? node.openingElement.tagName
            : node.tagName;

          if (ts.isIdentifier(tagName) && tagName.text === 'svg') {
            const attributes = ts.isJsxElement(node)
              ? node.openingElement.attributes
              : node.attributes;

            attributes.properties.forEach(attr => {
              if (ts.isJsxAttribute(attr) && attr.name) {
                const propName = ts.isIdentifier(attr.name)
                  ? attr.name.text
                  : attr.name.getText();

                let propValue = '';
                if (attr.initializer) {
                  if (ts.isStringLiteral(attr.initializer)) {
                    propValue = attr.initializer.text;
                  } else if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
                    propValue = attr.initializer.expression.getText();
                  }
                }

                // Determine if this prop should be preserved
                const shouldPreserve = this.shouldPreserveProp(propName, propValue);

                propMappings.push({
                  originalName: propName,
                  originalValue: propValue,
                  preserve: shouldPreserve.preserve,
                  skipReason: shouldPreserve.reason
                });
              }
            });
          }
        }

        ts.forEachChild(node, visit);
      };

      visit(sourceFile);

    } catch (error) {
      // Fallback: simple regex parsing
      const attrRegex = /(\w+)=(?:"([^"]*)"|{([^}]*)})/g;
      let match;

      while ((match = attrRegex.exec(svgContent)) !== null) {
        const propName = match[1];
        const propValue = match[2] || match[3] || '';

        const shouldPreserve = this.shouldPreserveProp(propName, propValue);

        propMappings.push({
          originalName: propName,
          originalValue: propValue,
          preserve: shouldPreserve.preserve,
          skipReason: shouldPreserve.reason
        });
      }
    }

    return propMappings;
  }

  /**
   * Determine if a prop should be preserved
   */
  private shouldPreserveProp(propName: string, propValue: string): {
    preserve: boolean;
    reason?: string;
  } {
    // Always preserve accessibility attributes
    if (propName.startsWith('aria-') || propName === 'role') {
      return { preserve: true };
    }

    // Always preserve event handlers
    if (propName.startsWith('on')) {
      return { preserve: true };
    }

    // Always preserve className and style
    if (propName === 'className' || propName === 'style') {
      return { preserve: true };
    }

    // Skip SVG-specific attributes that are handled by the component
    const svgSpecificAttrs = [
      'fill', 'stroke', 'strokeWidth', 'strokeLinecap', 'strokeLinejoin',
      'viewBox', 'xmlns', 'fillRule', 'clipRule'
    ];

    if (svgSpecificAttrs.includes(propName)) {
      return {
        preserve: false,
        reason: 'SVG-specific attribute handled by component'
      };
    }

    // Preserve width and height as they might be used for sizing
    if (propName === 'width' || propName === 'height') {
      return { preserve: true };
    }

    // Preserve data attributes
    if (propName.startsWith('data-')) {
      return { preserve: true };
    }

    // Preserve id attributes
    if (propName === 'id') {
      return { preserve: true };
    }

    // Default: preserve unknown attributes
    return { preserve: true };
  }

  /**
   * Generate component usage string
   */
  private generateComponentUsage(
    componentName: string,
    propMappings: PropMapping[],
    accessibilityAttributes: string[]
  ): string {
    const preservedProps = propMappings.filter(prop => prop.preserve);

    // Build props string
    const propsArray: string[] = [];

    preservedProps.forEach(prop => {
      const propName = prop.newName || prop.originalName;
      const propValue = prop.newValue || prop.originalValue;

      if (propValue === '') {
        // Boolean prop
        propsArray.push(propName);
      } else if (propValue.startsWith('{') && propValue.endsWith('}')) {
        // Expression prop
        propsArray.push(`${propName}=${propValue}`);
      } else {
        // String prop
        propsArray.push(`${propName}="${propValue}"`);
      }
    });

    // Ensure accessibility attributes are preserved
    accessibilityAttributes.forEach(attr => {
      const [attrName, attrValue] = attr.split('=');
      if (attrName && !preservedProps.some(prop => prop.originalName === attrName)) {
        if (attrValue) {
          propsArray.push(`${attrName}=${attrValue}`);
        } else {
          propsArray.push(attrName);
        }
      }
    });

    // Generate the component usage
    if (propsArray.length === 0) {
      return `<${componentName} />`;
    }

    if (propsArray.length === 1) {
      return `<${componentName} ${propsArray[0]} />`;
    }

    // Multi-line for many props
    if (propsArray.length > 3) {
      const propsString = propsArray.map(prop => `  ${prop}`).join('\n');
      return `<${componentName}\n${propsString}\n/>`;
    }

    // Single line for few props
    return `<${componentName} ${propsArray.join(' ')} />`;
  }

  /**
   * Validate that component usage is syntactically correct
   */
  validateComponentUsage(componentUsage: string): {
    isValid: boolean;
    errors: string[];
  } {
    try {
      const tempComponent = `const TempComponent = () => (${componentUsage});`;

      const sourceFile = ts.createSourceFile(
        'temp.tsx',
        tempComponent,
        ts.ScriptTarget.Latest,
        true
      );

      const diagnostics = ts.getPreEmitDiagnostics(
        ts.createProgram(['temp.tsx'], {}, {
          getSourceFile: () => sourceFile,
          writeFile: () => {},
          getCurrentDirectory: () => '',
          getDirectories: () => [],
          fileExists: () => true,
          readFile: () => '',
          getCanonicalFileName: (fileName) => fileName,
          useCaseSensitiveFileNames: () => true,
          getNewLine: () => '\n',
          getDefaultLibFileName: () => 'lib.d.ts'
        })
      );

      if (diagnostics.length > 0) {
        return {
          isValid: false,
          errors: diagnostics.map(d => d.messageText.toString())
        };
      }

      return { isValid: true, errors: [] };

    } catch (error: any) {
      return {
        isValid: false,
        errors: [`Syntax error: ${error?.message || 'Unknown error'}`]
      };
    }
  }

  /**
   * Preview replacement without making changes
   */
  previewReplacement(
    fileContent: string,
    auditResults: InlineSvgAudit[],
    generatedComponents: GeneratedComponent[]
  ): {
    previews: {
      audit: InlineSvgAudit;
      componentName: string;
      originalSvg: string;
      replacementComponent: string;
      propMappings: PropMapping[];
    }[];
    warnings: string[];
  } {
    const previews: {
      audit: InlineSvgAudit;
      componentName: string;
      originalSvg: string;
      replacementComponent: string;
      propMappings: PropMapping[];
    }[] = [];
    const warnings: string[] = [];

    // Create component lookup map
    const componentMap = new Map<string, GeneratedComponent>();
    generatedComponents.forEach(comp => {
      componentMap.set(comp.sourceAudit.svgContent, comp);
    });

    for (const audit of auditResults) {
      const component = componentMap.get(audit.svgContent);
      if (!component) {
        warnings.push(`No matching component found for SVG at line ${audit.lineNumber}`);
        continue;
      }

      const componentName = this.options.componentNameMapping[component.name] || component.name;
      const propMappings = this.extractSvgProps(audit.svgContent);
      const replacementComponent = this.generateComponentUsage(
        componentName,
        propMappings,
        audit.accessibilityAttributes
      );

      previews.push({
        audit,
        componentName,
        originalSvg: audit.svgContent,
        replacementComponent,
        propMappings
      });
    }

    return { previews, warnings };
  }

  /**
   * Get replacement statistics
   */
  getReplacementStatistics(result: SvgReplacementResult): {
    totalSvgs: number;
    successfulReplacements: number;
    failedReplacements: number;
    successRate: number;
    uniqueComponents: number;
    mostUsedComponent: string | null;
    failureReasons: Record<string, number>;
  } {
    const failureReasons: Record<string, number> = {};

    result.failedReplacements.forEach(failure => {
      const reason = failure.reason;
      failureReasons[reason] = (failureReasons[reason] || 0) + 1;
    });

    const componentUsage: Record<string, number> = {};
    result.usedComponents.forEach(comp => {
      componentUsage[comp] = (componentUsage[comp] || 0) + 1;
    });

    const mostUsedComponent = Object.keys(componentUsage).length > 0
      ? Object.keys(componentUsage).reduce((a, b) =>
          componentUsage[a] > componentUsage[b] ? a : b
        )
      : null;

    const totalSvgs = result.replacedCount + result.failedReplacements.length;

    return {
      totalSvgs,
      successfulReplacements: result.replacedCount,
      failedReplacements: result.failedReplacements.length,
      successRate: totalSvgs > 0 ? (result.replacedCount / totalSvgs) * 100 : 0,
      uniqueComponents: result.usedComponents.length,
      mostUsedComponent,
      failureReasons
    };
  }
}

/**
 * Utility function to create an SVG replacer
 */
export function createSvgReplacer(options?: ReplacementOptions): SvgReplacer {
  return new SvgReplacer(options);
}

/**
 * Quick utility to replace SVGs in a single file
 */
export async function replaceSvgsInFile(
  filePath: string,
  auditResults: InlineSvgAudit[],
  generatedComponents: GeneratedComponent[],
  options?: ReplacementOptions
): Promise<SvgReplacementResult> {
  const replacer = createSvgReplacer(options);
  return replacer.replaceInlineSvgsInFile(filePath, auditResults, generatedComponents);
}