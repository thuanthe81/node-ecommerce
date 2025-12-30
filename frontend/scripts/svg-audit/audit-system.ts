/**
 * Main SVG audit system that coordinates discovery and analysis
 * Requirements: 1.1, 1.2, 1.4, 1.5
 */

import { FileScanner, createFileScanner } from './file-scanner';
import { AstParser, createAstParser } from './ast-parser';
import { SvgClassifier, createSvgClassifier, ClassificationResult } from './svg-classifier';
import {
  SvgConsolidationSystem,
  createConsolidationSystem,
  ConsolidationOptions,
  ConsolidationResult
} from './svg-consolidation-system';
import {
  AuditSummary,
  FileAuditResult,
  InlineSvgAudit,
  SvgComponentInfo,
  ScanOptions
} from './types';

export interface EnhancedAuditSummary extends AuditSummary {
  /** Classification results for each unique SVG */
  classifications: Map<string, ClassificationResult>;
  /** Recommended actions based on analysis */
  recommendations: string[];
}

export class SvgAuditSystem {
  private fileScanner: FileScanner;
  private astParser: AstParser;
  private classifier: SvgClassifier;
  private consolidationSystem: SvgConsolidationSystem;

  constructor(options?: ScanOptions & ConsolidationOptions) {
    this.fileScanner = createFileScanner(options);
    this.astParser = createAstParser(this.fileScanner);
    this.classifier = createSvgClassifier();
    this.consolidationSystem = createConsolidationSystem(options);
  }

  /**
   * Perform a complete SVG audit of the codebase
   * @returns Comprehensive audit summary with classifications
   */
  public async performAudit(): Promise<EnhancedAuditSummary> {
    console.log('Starting SVG audit...');

    // Scan for all React component files
    const filePaths = await this.fileScanner.scanDirectory();
    console.log(`Found ${filePaths.length} React component files to scan`);

    // Parse each file for SVG content
    const fileResults: FileAuditResult[] = [];
    let processedCount = 0;

    for (const filePath of filePaths) {
      try {
        const result = await this.astParser.parseFile(filePath);
        fileResults.push(result);

        processedCount++;
        if (processedCount % 10 === 0) {
          console.log(`Processed ${processedCount}/${filePaths.length} files...`);
        }
      } catch (error) {
        console.warn(`Failed to process file ${filePath}: ${error}`);
        fileResults.push({
          filePath: this.fileScanner.getRelativePath(filePath),
          inlineSvgs: [],
          existingSvgImports: [],
          parseSuccess: false,
          parseError: `Processing error: ${error}`
        });
      }
    }

    console.log('Analyzing results and generating summary...');

    // Analyze results and create summary
    const summary = this.createAuditSummary(fileResults);

    // Perform classification analysis
    console.log('Classifying SVG elements...');
    const existingComponents = this.analyzeExistingComponents(fileResults);
    this.classifier.setExistingComponents(existingComponents);
    const classifications = this.classifier.classifyAllSvgs(fileResults);

    // Generate recommendations
    const recommendations = this.generateRecommendations(summary, classifications);

    console.log(`Audit complete! Found ${summary.totalInlineSvgs} inline SVGs in ${summary.filesWithInlineSvgs} files`);

    return {
      ...summary,
      classifications,
      recommendations
    };
  }

  /**
   * Create audit summary from file results
   * @param fileResults Array of file audit results
   * @returns Audit summary
   */
  private createAuditSummary(fileResults: FileAuditResult[]): AuditSummary {
    const filesWithInlineSvgs = fileResults.filter(result => result.inlineSvgs.length > 0);
    const allInlineSvgs = fileResults.flatMap(result => result.inlineSvgs);

    // Deduplicate SVGs and calculate usage counts
    const deduplicatedSvgs = this.deduplicateInlineSvgs(allInlineSvgs);

    // Extract existing component information
    const existingComponents = this.analyzeExistingComponents(fileResults);

    return {
      totalFilesScanned: fileResults.length,
      filesWithInlineSvgs: filesWithInlineSvgs.length,
      totalInlineSvgs: allInlineSvgs.length,
      uniqueSvgPatterns: deduplicatedSvgs.length,
      fileResults: fileResults,
      existingComponents,
      auditTimestamp: new Date()
    };
  }

  /**
   * Deduplicate inline SVGs and calculate usage counts
   * @param inlineSvgs Array of all inline SVGs found
   * @returns Array of unique SVGs with usage counts
   */
  private deduplicateInlineSvgs(inlineSvgs: InlineSvgAudit[]): InlineSvgAudit[] {
    const svgMap = new Map<string, InlineSvgAudit>();

    for (const svg of inlineSvgs) {
      // Use normalized SVG content as key for deduplication
      const normalizedContent = this.normalizeSvgContent(svg.svgContent);

      if (svgMap.has(normalizedContent)) {
        const existing = svgMap.get(normalizedContent)!;
        existing.usageCount++;
      } else {
        svgMap.set(normalizedContent, { ...svg, usageCount: 1 });
      }
    }

    return Array.from(svgMap.values());
  }

  /**
   * Normalize SVG content for comparison
   * @param svgContent Raw SVG content
   * @returns Normalized content string
   */
  private normalizeSvgContent(svgContent: string): string {
    return svgContent
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/className="[^"]*"/g, '') // Remove className attributes
      .replace(/style="[^"]*"/g, '') // Remove style attributes
      .replace(/\s*\/?>$/, '') // Normalize closing tags
      .trim()
      .toLowerCase();
  }

  /**
   * Analyze existing SVG components from imports
   * @param fileResults Array of file audit results
   * @returns Array of existing component information
   */
  private analyzeExistingComponents(fileResults: FileAuditResult[]): SvgComponentInfo[] {
    const componentUsage = new Map<string, string[]>();

    // Collect usage information for each component
    for (const result of fileResults) {
      for (const componentName of result.existingSvgImports) {
        if (!componentUsage.has(componentName)) {
          componentUsage.set(componentName, []);
        }
        componentUsage.get(componentName)!.push(result.filePath);
      }
    }

    // Convert to component info objects
    return Array.from(componentUsage.entries()).map(([name, locations]) => ({
      name,
      category: this.categorizeComponent(name),
      viewBox: '', // Would need to parse Svgs.tsx to get actual values
      hasStroke: name.toLowerCase().includes('outline') || name.toLowerCase().includes('stroke'),
      hasFill: !name.toLowerCase().includes('outline'),
      isCustomizable: true, // Assume all existing components are customizable
      usageLocations: locations
    }));
  }

  /**
   * Categorize a component based on its name
   * @param componentName Name of the SVG component
   * @returns Component category
   */
  private categorizeComponent(componentName: string): SvgComponentInfo['category'] {
    const name = componentName.toLowerCase();

    if (name.includes('menu') || name.includes('nav') || name.includes('chevron') || name.includes('arrow')) {
      return 'navigation';
    }

    if (name.includes('facebook') || name.includes('twitter') || name.includes('tiktok') ||
        name.includes('zalo') || name.includes('whatsapp')) {
      return 'social';
    }

    if (name.includes('home') || name.includes('document') || name.includes('image') ||
        name.includes('file')) {
      return 'content';
    }

    if (name.includes('settings') || name.includes('gear') || name.includes('config')) {
      return 'utility';
    }

    return 'ui';
  }

  /**
   * Generate recommendations based on audit and classification results
   * @param summary Audit summary
   * @param classifications Classification results
   * @returns Array of recommendation strings
   */
  private generateRecommendations(
    summary: AuditSummary,
    classifications: Map<string, ClassificationResult>
  ): string[] {
    const recommendations: string[] = [];

    if (summary.totalInlineSvgs === 0) {
      recommendations.push('✅ No inline SVGs found - all SVGs are properly consolidated!');
      return recommendations;
    }

    // High-priority recommendations
    const highUsageSvgs = Array.from(classifications.values())
      .filter(c => c.usageStats.totalOccurrences > 3)
      .sort((a, b) => b.usageStats.totalOccurrences - a.usageStats.totalOccurrences);

    if (highUsageSvgs.length > 0) {
      recommendations.push(
        `🔥 HIGH PRIORITY: ${highUsageSvgs.length} SVGs are used more than 3 times and should be consolidated immediately:`
      );
      for (const svg of highUsageSvgs.slice(0, 5)) {
        recommendations.push(
          `   - ${svg.suggestedName} (${svg.usageStats.totalOccurrences} uses across ${svg.usageStats.uniqueFiles} files)`
        );
      }
    }

    // Medium-priority recommendations
    const multiFileSvgs = Array.from(classifications.values())
      .filter(c => c.usageStats.uniqueFiles > 1 && c.usageStats.totalOccurrences <= 3);

    if (multiFileSvgs.length > 0) {
      recommendations.push(
        `⚠️  MEDIUM PRIORITY: ${multiFileSvgs.length} SVGs are used across multiple files:`
      );
      for (const svg of multiFileSvgs.slice(0, 3)) {
        recommendations.push(
          `   - ${svg.suggestedName} (${svg.usageStats.uniqueFiles} files)`
        );
      }
    }

    // Accessibility recommendations
    const svgsWithA11y = Array.from(classifications.values())
      .filter(c => c.usageStats.contextInfo.some(info => info.hasDynamicProps));

    if (svgsWithA11y.length > 0) {
      recommendations.push(
        `♿ ACCESSIBILITY: ${svgsWithA11y.length} SVGs have accessibility attributes that need preservation`
      );
    }

    // Category-based recommendations
    const categoryStats = new Map<string, number>();
    for (const classification of classifications.values()) {
      const count = categoryStats.get(classification.category) || 0;
      categoryStats.set(classification.category, count + 1);
    }

    if (categoryStats.size > 0) {
      recommendations.push('📊 SVG CATEGORIES:');
      for (const [category, count] of Array.from(categoryStats.entries()).sort((a, b) => b[1] - a[1])) {
        recommendations.push(`   - ${category}: ${count} SVGs`);
      }
    }

    // General recommendations
    recommendations.push('💡 NEXT STEPS:');
    recommendations.push('   1. Start with high-priority SVGs (most frequently used)');
    recommendations.push('   2. Create components in Svgs.tsx following existing patterns');
    recommendations.push('   3. Update imports and replace inline usage');
    recommendations.push('   4. Test that all functionality is preserved');
    recommendations.push('   5. Run audit again to verify consolidation');

    return recommendations;
  }

  /**
   * Perform consolidation of inline SVGs found during audit
   * @param auditSummary The audit summary containing inline SVGs to consolidate
   * @param options Consolidation options
   * @returns Consolidation result
   */
  public async performConsolidation(
    auditSummary: EnhancedAuditSummary,
    options?: ConsolidationOptions
  ): Promise<ConsolidationResult> {
    console.log('Starting SVG consolidation...');

    // Update consolidation system options if provided
    if (options) {
      this.consolidationSystem = createConsolidationSystem(options);
    }

    return this.consolidationSystem.consolidateFromAuditSummary(auditSummary);
  }

  /**
   * Preview consolidation without making changes
   * @param auditSummary The audit summary
   * @returns Preview of consolidation result
   */
  public async previewConsolidation(auditSummary: EnhancedAuditSummary): Promise<ConsolidationResult> {
    console.log('Previewing SVG consolidation...');
    return this.consolidationSystem.previewConsolidation(
      auditSummary.fileResults.flatMap(result => result.inlineSvgs)
    );
  }

  /**
   * Complete workflow: audit and consolidate in one step
   * @param consolidationOptions Options for consolidation
   * @returns Both audit and consolidation results
   */
  public async auditAndConsolidate(
    consolidationOptions?: ConsolidationOptions
  ): Promise<{
    auditSummary: EnhancedAuditSummary;
    consolidationResult: ConsolidationResult;
  }> {
    console.log('Starting complete audit and consolidation workflow...');

    const auditSummary = await this.performAudit();

    if (auditSummary.totalInlineSvgs === 0) {
      console.log('No inline SVGs found - consolidation not needed');
      return {
        auditSummary,
        consolidationResult: {
          generatedComponents: [],
          integrationResult: {
            updatedContent: '',
            addedComponents: [],
            updatedComponents: [],
            warnings: ['No inline SVGs found'],
            success: true
          },
          replacementResults: [],
          failedValidation: [],
          success: true,
          statistics: {
            totalProcessed: 0,
            componentsGenerated: 0,
            componentsIntegrated: 0,
            namingConflicts: 0,
            validationFailures: 0,
            filesProcessed: 0,
            svgsReplaced: 0,
            replacementFailures: 0,
            processingTime: 0
          },
          warnings: ['No inline SVGs found - consolidation not needed']
        }
      };
    }

    const consolidationResult = await this.performConsolidation(auditSummary, consolidationOptions);

    return {
      auditSummary,
      consolidationResult
    };
  }
  public generateReport(summary: EnhancedAuditSummary): string {
    const lines: string[] = [];

    lines.push('# SVG Consolidation Audit Report');
    lines.push('');
    lines.push(`**Generated:** ${summary.auditTimestamp.toISOString()}`);
    lines.push('');

    // Summary statistics
    lines.push('## Summary');
    lines.push(`- **Total files scanned:** ${summary.totalFilesScanned}`);
    lines.push(`- **Files with inline SVGs:** ${summary.filesWithInlineSvgs}`);
    lines.push(`- **Total inline SVGs found:** ${summary.totalInlineSvgs}`);
    lines.push(`- **Unique SVG patterns:** ${summary.uniqueSvgPatterns}`);
    lines.push(`- **Existing SVG components:** ${summary.existingComponents.length}`);
    lines.push('');

    // Recommendations
    if (summary.recommendations.length > 0) {
      lines.push('## Recommendations');
      lines.push('');
      for (const recommendation of summary.recommendations) {
        lines.push(recommendation);
      }
      lines.push('');
    }

    // Classification Results
    if (summary.classifications.size > 0) {
      lines.push('## Classification Results');
      lines.push('');

      const sortedClassifications = Array.from(summary.classifications.values())
        .sort((a, b) => b.usageStats.totalOccurrences - a.usageStats.totalOccurrences);

      for (const classification of sortedClassifications) {
        lines.push(`### ${classification.suggestedName}`);
        lines.push(`- **Category:** ${classification.category}`);
        lines.push(`- **Usage:** ${classification.usageStats.totalOccurrences} times across ${classification.usageStats.uniqueFiles} files`);
        lines.push(`- **Confidence:** ${(classification.confidence * 100).toFixed(1)}%`);
        lines.push(`- **Reason:** ${classification.reason}`);

        if (classification.usageStats.usageLocations.length > 0) {
          lines.push(`- **Locations:**`);
          for (const location of classification.usageStats.usageLocations.slice(0, 5)) {
            lines.push(`  - ${location}`);
          }
          if (classification.usageStats.usageLocations.length > 5) {
            lines.push(`  - ... and ${classification.usageStats.usageLocations.length - 5} more`);
          }
        }
        lines.push('');
      }
    }

    // Inline SVGs found (detailed view)
    if (summary.totalInlineSvgs > 0) {
      lines.push('## Detailed SVG Analysis');
      lines.push('');

      const inlineSvgs = summary.fileResults.flatMap(result => result.inlineSvgs);
      for (const svg of inlineSvgs) {
        lines.push(`### ${svg.proposedComponentName}`);
        lines.push(`- **File:** ${svg.filePath}:${svg.lineNumber}`);
        lines.push(`- **Usage count:** ${svg.usageCount}`);
        lines.push(`- **Has custom props:** ${svg.hasCustomProps ? 'Yes' : 'No'}`);
        lines.push(`- **Accessibility attributes:** ${svg.accessibilityAttributes.join(', ') || 'None'}`);

        if (svg.visualProperties.viewBox) {
          lines.push(`- **ViewBox:** ${svg.visualProperties.viewBox}`);
        }
        if (svg.visualProperties.usesCurrentColor) {
          lines.push(`- **Uses currentColor:** Yes`);
        }

        lines.push('');
        lines.push('```tsx');
        lines.push(svg.svgContent);
        lines.push('```');
        lines.push('');
      }
    } else {
      lines.push('## ✅ No Inline SVGs Found');
      lines.push('');
      lines.push('Great! All SVGs are already properly consolidated in the Svgs.tsx file.');
      lines.push('');
    }

    // Existing components
    lines.push('## Existing SVG Components');
    lines.push('');

    const componentsByCategory = new Map<string, SvgComponentInfo[]>();
    for (const component of summary.existingComponents) {
      if (!componentsByCategory.has(component.category)) {
        componentsByCategory.set(component.category, []);
      }
      componentsByCategory.get(component.category)!.push(component);
    }

    for (const [category, components] of componentsByCategory) {
      lines.push(`### ${category.charAt(0).toUpperCase() + category.slice(1)} Icons`);
      lines.push('');

      for (const component of components.sort((a, b) => a.name.localeCompare(b.name))) {
        lines.push(`- **${component.name}** (used in ${component.usageLocations.length} files)`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Save audit results to a file
   * @param summary Enhanced audit summary
   * @param outputPath Path to save the report
   */
  public async saveReport(summary: EnhancedAuditSummary, outputPath: string): Promise<void> {
    const report = this.generateReport(summary);
    const fs = await import('fs');
    await fs.promises.writeFile(outputPath, report, 'utf-8');
    console.log(`Audit report saved to: ${outputPath}`);
  }
}

/**
 * Utility function to perform a quick SVG audit
 * @param options Scan options
 * @returns Enhanced audit summary
 */
export async function performSvgAudit(options?: ScanOptions): Promise<EnhancedAuditSummary> {
  const auditSystem = new SvgAuditSystem(options);
  return auditSystem.performAudit();
}

/**
 * Utility function to generate and save an audit report
 * @param options Scan options
 * @param outputPath Output file path
 */
export async function generateAuditReport(options?: ScanOptions, outputPath = 'svg-audit-report.md'): Promise<void> {
  const auditSystem = new SvgAuditSystem(options);
  const summary = await auditSystem.performAudit();
  await auditSystem.saveReport(summary, outputPath);
}

/**
 * Utility function to perform audit and consolidation in one step
 * @param options Combined scan and consolidation options
 * @returns Both audit and consolidation results
 */
export async function auditAndConsolidate(
  options?: ScanOptions & ConsolidationOptions
): Promise<{
  auditSummary: EnhancedAuditSummary;
  consolidationResult: ConsolidationResult;
}> {
  const auditSystem = new SvgAuditSystem(options);
  return auditSystem.auditAndConsolidate(options);
}