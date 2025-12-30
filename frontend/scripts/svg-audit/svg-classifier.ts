/**
 * SVG classification system for differentiating inline SVGs and existing components
 * Requirements: 1.4, 2.1
 */

import * as path from 'path';
import { InlineSvgAudit, SvgComponentInfo, FileAuditResult } from './types';

export interface ClassificationResult {
  /** Whether this is an inline SVG or existing component import */
  isInlineSvg: boolean;
  /** Confidence score (0-1) for the classification */
  confidence: number;
  /** Reason for the classification */
  reason: string;
  /** Suggested component name following existing conventions */
  suggestedName: string;
  /** Category for organization */
  category: SvgComponentInfo['category'];
  /** Usage statistics */
  usageStats: UsageStatistics;
}

export interface UsageStatistics {
  /** Total occurrences across the codebase */
  totalOccurrences: number;
  /** Number of unique files using this SVG */
  uniqueFiles: number;
  /** Files where this SVG is used */
  usageLocations: string[];
  /** Context information for each usage */
  contextInfo: ContextInfo[];
}

export interface ContextInfo {
  /** File path where SVG is used */
  filePath: string;
  /** Line number */
  lineNumber: number;
  /** Surrounding component context */
  componentContext: string;
  /** Whether it's used in a conditional render */
  isConditional: boolean;
  /** Whether it has dynamic props */
  hasDynamicProps: boolean;
}

export class SvgClassifier {
  private existingComponents: Map<string, SvgComponentInfo> = new Map();
  private componentNamePatterns: RegExp[] = [];

  constructor() {
    this.initializeComponentPatterns();
  }

  /**
   * Initialize patterns for recognizing existing SVG component names
   */
  private initializeComponentPatterns(): void {
    this.componentNamePatterns = [
      /^Svg[A-Z][a-zA-Z0-9]*$/, // Standard SvgComponentName pattern
      /^Icon[A-Z][a-zA-Z0-9]*$/, // Alternative Icon pattern
      /^[A-Z][a-zA-Z0-9]*Icon$/, // ComponentIcon pattern
    ];
  }

  /**
   * Set existing components for classification reference
   * @param components Array of existing SVG components
   */
  public setExistingComponents(components: SvgComponentInfo[]): void {
    this.existingComponents.clear();
    for (const component of components) {
      this.existingComponents.set(component.name, component);
    }
  }

  /**
   * Classify an SVG audit result
   * @param svgAudit SVG audit data
   * @param allResults All file audit results for context
   * @returns Classification result
   */
  public classifySvg(
    svgAudit: InlineSvgAudit,
    allResults: FileAuditResult[]
  ): ClassificationResult {
    // Calculate usage statistics
    const usageStats = this.calculateUsageStatistics(svgAudit, allResults);

    // Determine if this is truly an inline SVG or a misclassified component
    const isInlineSvg = this.isInlineSvgElement(svgAudit);

    // Generate suggested name following conventions
    const suggestedName = this.generateSuggestedName(svgAudit, usageStats);

    // Categorize the SVG
    const category = this.categorizeSvg(svgAudit, suggestedName);

    // Calculate confidence score
    const confidence = this.calculateConfidence(svgAudit, usageStats, isInlineSvg);

    // Generate reason for classification
    const reason = this.generateClassificationReason(svgAudit, usageStats, isInlineSvg);

    return {
      isInlineSvg,
      confidence,
      reason,
      suggestedName,
      category,
      usageStats
    };
  }

  /**
   * Determine if this is truly an inline SVG element
   * @param svgAudit SVG audit data
   * @returns True if this is an inline SVG
   */
  private isInlineSvgElement(svgAudit: InlineSvgAudit): boolean {
    // Check if the SVG content starts with <svg tag
    if (!svgAudit.svgContent.trim().startsWith('<svg')) {
      return false;
    }

    // Check if it's not a component import
    if (this.isExistingComponentUsage(svgAudit.svgContent)) {
      return false;
    }

    return true;
  }

  /**
   * Check if the content represents usage of an existing component
   * @param content SVG content
   * @returns True if this is existing component usage
   */
  private isExistingComponentUsage(content: string): boolean {
    // Look for component-like patterns
    for (const pattern of this.componentNamePatterns) {
      if (pattern.test(content)) {
        return true;
      }
    }

    // Check against known existing components
    for (const componentName of this.existingComponents.keys()) {
      if (content.includes(componentName)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate usage statistics for an SVG
   * @param svgAudit SVG audit data
   * @param allResults All file audit results
   * @returns Usage statistics
   */
  private calculateUsageStatistics(
    svgAudit: InlineSvgAudit,
    allResults: FileAuditResult[]
  ): UsageStatistics {
    const normalizedContent = this.normalizeSvgContent(svgAudit.svgContent);
    const usageLocations: string[] = [];
    const contextInfo: ContextInfo[] = [];
    const uniqueFiles = new Set<string>();

    let totalOccurrences = 0;

    // Find all occurrences of this SVG pattern
    for (const fileResult of allResults) {
      for (const inlineSvg of fileResult.inlineSvgs) {
        const normalizedInline = this.normalizeSvgContent(inlineSvg.svgContent);

        if (normalizedInline === normalizedContent) {
          totalOccurrences++;
          uniqueFiles.add(fileResult.filePath);
          usageLocations.push(`${fileResult.filePath}:${inlineSvg.lineNumber}`);

          contextInfo.push({
            filePath: fileResult.filePath,
            lineNumber: inlineSvg.lineNumber,
            componentContext: this.extractComponentContext(inlineSvg.context),
            isConditional: this.isConditionalRender(inlineSvg.context),
            hasDynamicProps: inlineSvg.hasCustomProps
          });
        }
      }
    }

    return {
      totalOccurrences,
      uniqueFiles: uniqueFiles.size,
      usageLocations,
      contextInfo
    };
  }

  /**
   * Normalize SVG content for comparison
   * @param content SVG content
   * @returns Normalized content
   */
  private normalizeSvgContent(content: string): string {
    return content
      .replace(/\s+/g, ' ')
      .replace(/className="[^"]*"/g, '')
      .replace(/style="[^"]*"/g, '')
      .replace(/\s*\/?>$/, '')
      .trim()
      .toLowerCase();
  }

  /**
   * Extract component context from surrounding code
   * @param context Context string
   * @returns Component name or context
   */
  private extractComponentContext(context: string): string {
    // Look for function/component declarations
    const functionMatch = context.match(/(?:function|const)\s+([A-Z][a-zA-Z0-9]*)/);
    if (functionMatch) {
      return functionMatch[1];
    }

    // Look for export statements
    const exportMatch = context.match(/export\s+(?:default\s+)?(?:function\s+)?([A-Z][a-zA-Z0-9]*)/);
    if (exportMatch) {
      return exportMatch[1];
    }

    return 'Unknown';
  }

  /**
   * Check if SVG is used in conditional rendering
   * @param context Context string
   * @returns True if conditional
   */
  private isConditionalRender(context: string): boolean {
    return context.includes('?') ||
           context.includes('&&') ||
           context.includes('if') ||
           context.includes('condition');
  }

  /**
   * Generate suggested component name following existing conventions
   * @param svgAudit SVG audit data
   * @param usageStats Usage statistics
   * @returns Suggested component name
   */
  private generateSuggestedName(
    svgAudit: InlineSvgAudit,
    usageStats: UsageStatistics
  ): string {
    // Use the proposed name from the audit as base
    let baseName = svgAudit.proposedComponentName;

    // Refine based on usage context
    if (usageStats.contextInfo.length > 0) {
      const contexts = usageStats.contextInfo.map(info => info.componentContext);
      const commonContext = this.findCommonContext(contexts);

      if (commonContext && commonContext !== 'Unknown') {
        // If used primarily in one context, incorporate that
        if (usageStats.uniqueFiles === 1) {
          baseName = `Svg${commonContext}Icon`;
        }
      }
    }

    // Ensure uniqueness against existing components
    return this.ensureUniqueName(baseName);
  }

  /**
   * Find common context among usage locations
   * @param contexts Array of context names
   * @returns Most common context or null
   */
  private findCommonContext(contexts: string[]): string | null {
    const contextCounts = new Map<string, number>();

    for (const context of contexts) {
      contextCounts.set(context, (contextCounts.get(context) || 0) + 1);
    }

    let maxCount = 0;
    let commonContext: string | null = null;

    for (const [context, count] of contextCounts) {
      if (count > maxCount && context !== 'Unknown') {
        maxCount = count;
        commonContext = context;
      }
    }

    return commonContext;
  }

  /**
   * Ensure component name is unique
   * @param baseName Base component name
   * @returns Unique component name
   */
  private ensureUniqueName(baseName: string): string {
    if (!this.existingComponents.has(baseName)) {
      return baseName;
    }

    let counter = 1;
    let uniqueName = `${baseName}${counter}`;

    while (this.existingComponents.has(uniqueName)) {
      counter++;
      uniqueName = `${baseName}${counter}`;
    }

    return uniqueName;
  }

  /**
   * Categorize SVG based on content and usage
   * @param svgAudit SVG audit data
   * @param suggestedName Suggested component name
   * @returns SVG category
   */
  private categorizeSvg(
    svgAudit: InlineSvgAudit,
    suggestedName: string
  ): SvgComponentInfo['category'] {
    const name = suggestedName.toLowerCase();
    const content = svgAudit.svgContent.toLowerCase();

    // Navigation icons
    if (name.includes('menu') || name.includes('nav') || name.includes('chevron') ||
        name.includes('arrow') || name.includes('back') || name.includes('forward') ||
        content.includes('menu') || content.includes('arrow')) {
      return 'navigation';
    }

    // Social media icons
    if (name.includes('facebook') || name.includes('twitter') || name.includes('instagram') ||
        name.includes('tiktok') || name.includes('zalo') || name.includes('whatsapp') ||
        name.includes('social') || content.includes('social')) {
      return 'social';
    }

    // Content icons
    if (name.includes('document') || name.includes('file') || name.includes('image') ||
        name.includes('photo') || name.includes('video') || name.includes('text') ||
        content.includes('document') || content.includes('file')) {
      return 'content';
    }

    // Utility icons
    if (name.includes('settings') || name.includes('config') || name.includes('gear') ||
        name.includes('tool') || name.includes('utility') || name.includes('search') ||
        content.includes('settings') || content.includes('search')) {
      return 'utility';
    }

    // Default to UI
    return 'ui';
  }

  /**
   * Calculate confidence score for classification
   * @param svgAudit SVG audit data
   * @param usageStats Usage statistics
   * @param isInlineSvg Whether classified as inline SVG
   * @returns Confidence score (0-1)
   */
  private calculateConfidence(
    svgAudit: InlineSvgAudit,
    usageStats: UsageStatistics,
    isInlineSvg: boolean
  ): number {
    let confidence = 0.5; // Base confidence

    // Higher confidence for clear inline SVG patterns
    if (isInlineSvg && svgAudit.svgContent.includes('<svg')) {
      confidence += 0.3;
    }

    // Higher confidence for multiple usages (indicates it should be componentized)
    if (usageStats.totalOccurrences > 1) {
      confidence += 0.2;
    }

    // Higher confidence if used across multiple files
    if (usageStats.uniqueFiles > 1) {
      confidence += 0.2;
    }

    // Lower confidence if it has many custom props (might be too specific)
    if (svgAudit.hasCustomProps && usageStats.totalOccurrences === 1) {
      confidence -= 0.1;
    }

    // Ensure confidence is within bounds
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Generate reason for classification
   * @param svgAudit SVG audit data
   * @param usageStats Usage statistics
   * @param isInlineSvg Whether classified as inline SVG
   * @returns Classification reason
   */
  private generateClassificationReason(
    svgAudit: InlineSvgAudit,
    usageStats: UsageStatistics,
    isInlineSvg: boolean
  ): string {
    if (!isInlineSvg) {
      return 'Appears to be existing component usage, not inline SVG';
    }

    const reasons: string[] = [];

    if (usageStats.totalOccurrences > 1) {
      reasons.push(`Used ${usageStats.totalOccurrences} times across ${usageStats.uniqueFiles} files`);
    } else {
      reasons.push('Single usage - candidate for consolidation');
    }

    if (svgAudit.hasCustomProps) {
      reasons.push('Has custom properties that need preservation');
    }

    if (svgAudit.accessibilityAttributes.length > 0) {
      reasons.push(`Has accessibility attributes: ${svgAudit.accessibilityAttributes.join(', ')}`);
    }

    if (svgAudit.visualProperties.usesCurrentColor) {
      reasons.push('Uses currentColor for theming');
    }

    return reasons.join('; ');
  }

  /**
   * Classify all SVGs in audit results
   * @param allResults All file audit results
   * @returns Map of SVG content to classification results
   */
  public classifyAllSvgs(allResults: FileAuditResult[]): Map<string, ClassificationResult> {
    const classifications = new Map<string, ClassificationResult>();
    const processedSvgs = new Set<string>();

    for (const fileResult of allResults) {
      for (const svgAudit of fileResult.inlineSvgs) {
        const normalizedContent = this.normalizeSvgContent(svgAudit.svgContent);

        if (!processedSvgs.has(normalizedContent)) {
          const classification = this.classifySvg(svgAudit, allResults);
          classifications.set(normalizedContent, classification);
          processedSvgs.add(normalizedContent);
        }
      }
    }

    return classifications;
  }
}

/**
 * Utility function to create an SVG classifier
 * @returns Configured SvgClassifier instance
 */
export function createSvgClassifier(): SvgClassifier {
  return new SvgClassifier();
}