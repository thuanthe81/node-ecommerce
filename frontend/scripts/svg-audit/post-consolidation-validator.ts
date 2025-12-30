/**
 * Post-consolidation validation system
 * Scans codebase after consolidation to ensure all inline SVGs have been replaced
 * Requirements: 5.3
 */

import { FileScanner, createFileScanner } from './file-scanner';
import { AstParser, createAstParser } from './ast-parser';
import { SvgAuditSystem, EnhancedAuditSummary } from './audit-system';
import {
  AuditSummary,
  FileAuditResult,
  InlineSvgAudit,
  ScanOptions
} from './types';

export interface PostConsolidationReport {
  /** Whether consolidation was complete (no remaining inline SVGs) */
  isComplete: boolean;
  /** Number of remaining inline SVGs found */
  remainingInlineSvgs: number;
  /** Files that still contain inline SVGs */
  filesWithRemainingInlineSvgs: string[];
  /** Detailed information about remaining SVGs */
  remainingSvgDetails: InlineSvgAudit[];
  /** Statistics about the validation */
  validationStats: ValidationStatistics;
  /** Recommendations for fixing remaining issues */
  recommendations: string[];
  /** Timestamp when validation was performed */
  validationTimestamp: Date;
}

export interface ValidationStatistics {
  /** Total files scanned during validation */
  totalFilesScanned: number;
  /** Files that were successfully processed */
  successfullyProcessed: number;
  /** Files that failed to process */
  processingFailures: number;
  /** Time taken for validation in milliseconds */
  processingTimeMs: number;
  /** Comparison with previous audit (if available) */
  comparisonWithPrevious?: {
    previousInlineSvgs: number;
    currentInlineSvgs: number;
    svgsSuccessfullyConsolidated: number;
    consolidationSuccessRate: number;
  };
}

export interface PostConsolidationValidatorOptions extends ScanOptions {
  /** Previous audit summary to compare against */
  previousAudit?: EnhancedAuditSummary;
  /** Whether to generate detailed recommendations */
  generateRecommendations?: boolean;
  /** Whether to include processing statistics */
  includeStatistics?: boolean;
}

export class PostConsolidationValidator {
  private auditSystem: SvgAuditSystem;
  private options: PostConsolidationValidatorOptions;

  constructor(options: PostConsolidationValidatorOptions = {}) {
    this.options = {
      generateRecommendations: true,
      includeStatistics: true,
      ...options
    };
    this.auditSystem = new SvgAuditSystem(options);
  }

  /**
   * Validate that consolidation was successful by scanning for remaining inline SVGs
   * @returns Post-consolidation validation report
   */
  public async validateConsolidation(): Promise<PostConsolidationReport> {
    console.log('Starting post-consolidation validation...');
    const startTime = Date.now();

    try {
      // Perform a fresh audit to find any remaining inline SVGs
      const currentAudit = await this.auditSystem.performAudit();
      const processingTime = Date.now() - startTime;

      // Extract remaining inline SVGs
      const remainingSvgDetails = currentAudit.fileResults.flatMap(result => result.inlineSvgs);
      const filesWithRemainingInlineSvgs = currentAudit.fileResults
        .filter(result => result.inlineSvgs.length > 0)
        .map(result => result.filePath);

      // Calculate validation statistics
      const validationStats = this.calculateValidationStatistics(
        currentAudit,
        processingTime,
        this.options.previousAudit
      );

      // Generate recommendations if requested
      const recommendations = this.options.generateRecommendations
        ? this.generateValidationRecommendations(remainingSvgDetails, validationStats)
        : [];

      const report: PostConsolidationReport = {
        isComplete: remainingSvgDetails.length === 0,
        remainingInlineSvgs: remainingSvgDetails.length,
        filesWithRemainingInlineSvgs,
        remainingSvgDetails,
        validationStats,
        recommendations,
        validationTimestamp: new Date()
      };

      this.logValidationResults(report);
      return report;

    } catch (error) {
      console.error('Post-consolidation validation failed:', error);
      throw new Error(`Validation failed: ${error}`);
    }
  }

  /**
   * Calculate detailed validation statistics
   * @param currentAudit Current audit results
   * @param processingTime Time taken for processing
   * @param previousAudit Previous audit for comparison
   * @returns Validation statistics
   */
  private calculateValidationStatistics(
    currentAudit: EnhancedAuditSummary,
    processingTime: number,
    previousAudit?: EnhancedAuditSummary
  ): ValidationStatistics {
    const stats: ValidationStatistics = {
      totalFilesScanned: currentAudit.totalFilesScanned,
      successfullyProcessed: currentAudit.fileResults.filter((r: FileAuditResult) => r.parseSuccess).length,
      processingFailures: currentAudit.fileResults.filter((r: FileAuditResult) => !r.parseSuccess).length,
      processingTimeMs: processingTime
    };

    // Add comparison with previous audit if available
    if (previousAudit) {
      const previousInlineSvgs = previousAudit.totalInlineSvgs;
      const currentInlineSvgs = currentAudit.totalInlineSvgs;
      const svgsConsolidated = Math.max(0, previousInlineSvgs - currentInlineSvgs);
      const successRate = previousInlineSvgs > 0
        ? (svgsConsolidated / previousInlineSvgs) * 100
        : 100;

      stats.comparisonWithPrevious = {
        previousInlineSvgs,
        currentInlineSvgs,
        svgsSuccessfullyConsolidated: svgsConsolidated,
        consolidationSuccessRate: successRate
      };
    }

    return stats;
  }

  /**
   * Generate recommendations for fixing remaining consolidation issues
   * @param remainingSvgs List of remaining inline SVGs
   * @param stats Validation statistics
   * @returns Array of recommendation strings
   */
  private generateValidationRecommendations(
    remainingSvgs: InlineSvgAudit[],
    stats: ValidationStatistics
  ): string[] {
    const recommendations: string[] = [];

    if (remainingSvgs.length === 0) {
      recommendations.push('✅ CONSOLIDATION COMPLETE: No remaining inline SVGs found!');
      recommendations.push('🎉 All SVGs have been successfully consolidated into Svgs.tsx');

      if (stats.comparisonWithPrevious) {
        const { svgsSuccessfullyConsolidated, consolidationSuccessRate } = stats.comparisonWithPrevious;
        recommendations.push(
          `📊 Successfully consolidated ${svgsSuccessfullyConsolidated} SVGs (${consolidationSuccessRate.toFixed(1)}% success rate)`
        );
      }

      recommendations.push('💡 NEXT STEPS:');
      recommendations.push('   1. Run your test suite to ensure no regressions');
      recommendations.push('   2. Verify visual appearance in the application');
      recommendations.push('   3. Consider adding linting rules to prevent future inline SVGs');

      return recommendations;
    }

    // High-priority issues
    recommendations.push(`❌ CONSOLIDATION INCOMPLETE: ${remainingSvgs.length} inline SVGs still found`);

    if (stats.comparisonWithPrevious) {
      const { consolidationSuccessRate, svgsSuccessfullyConsolidated } = stats.comparisonWithPrevious;
      recommendations.push(
        `📊 Progress: ${svgsSuccessfullyConsolidated} SVGs consolidated (${consolidationSuccessRate.toFixed(1)}% complete)`
      );
    }

    // Analyze remaining SVGs by file
    const svgsByFile = new Map<string, InlineSvgAudit[]>();
    for (const svg of remainingSvgs) {
      if (!svgsByFile.has(svg.filePath)) {
        svgsByFile.set(svg.filePath, []);
      }
      svgsByFile.get(svg.filePath)!.push(svg);
    }

    // Files with most remaining SVGs
    const filesByCount = Array.from(svgsByFile.entries())
      .sort((a, b) => b[1].length - a[1].length);

    if (filesByCount.length > 0) {
      recommendations.push('🔥 FILES NEEDING ATTENTION:');
      for (const [filePath, svgs] of filesByCount.slice(0, 5)) {
        recommendations.push(`   - ${filePath}: ${svgs.length} remaining SVGs`);
      }
    }

    // Analyze by SVG complexity
    const complexSvgs = remainingSvgs.filter(svg =>
      svg.hasCustomProps || svg.accessibilityAttributes.length > 0
    );

    if (complexSvgs.length > 0) {
      recommendations.push(`⚠️  COMPLEX SVGS: ${complexSvgs.length} SVGs have custom props or accessibility attributes`);
      recommendations.push('   These may require manual attention during consolidation');
    }

    // Analyze by usage frequency
    const highUsageSvgs = remainingSvgs.filter(svg => svg.usageCount > 1);
    if (highUsageSvgs.length > 0) {
      recommendations.push(`🔄 REUSED SVGS: ${highUsageSvgs.length} SVGs are used multiple times`);
      recommendations.push('   Prioritize these for consolidation to maximize impact');
    }

    // Processing failures
    if (stats.processingFailures > 0) {
      recommendations.push(`⚠️  PROCESSING ISSUES: ${stats.processingFailures} files failed to process`);
      recommendations.push('   Check these files for syntax errors or unusual patterns');
    }

    // Action items
    recommendations.push('🔧 RECOMMENDED ACTIONS:');
    recommendations.push('   1. Review files with most remaining SVGs first');
    recommendations.push('   2. Handle complex SVGs with custom props carefully');
    recommendations.push('   3. Prioritize frequently-used SVGs');
    recommendations.push('   4. Fix any processing failures');
    recommendations.push('   5. Re-run consolidation for remaining SVGs');
    recommendations.push('   6. Validate again after fixes');

    return recommendations;
  }

  /**
   * Log validation results to console
   * @param report Post-consolidation validation report
   */
  private logValidationResults(report: PostConsolidationReport): void {
    console.log('\n=== POST-CONSOLIDATION VALIDATION RESULTS ===');

    if (report.isComplete) {
      console.log('✅ SUCCESS: Consolidation is complete!');
      console.log(`📊 Scanned ${report.validationStats.totalFilesScanned} files in ${report.validationStats.processingTimeMs}ms`);
    } else {
      console.log(`❌ INCOMPLETE: ${report.remainingInlineSvgs} inline SVGs still found`);
      console.log(`📁 Affected files: ${report.filesWithRemainingInlineSvgs.length}`);
      console.log(`📊 Scanned ${report.validationStats.totalFilesScanned} files in ${report.validationStats.processingTimeMs}ms`);
    }

    if (report.validationStats.comparisonWithPrevious) {
      const comparison = report.validationStats.comparisonWithPrevious;
      console.log(`📈 Progress: ${comparison.svgsSuccessfullyConsolidated} SVGs consolidated (${comparison.consolidationSuccessRate.toFixed(1)}% success rate)`);
    }

    if (report.validationStats.processingFailures > 0) {
      console.log(`⚠️  Processing failures: ${report.validationStats.processingFailures} files`);
    }

    console.log('===============================================\n');
  }

  /**
   * Generate a detailed validation report
   * @param report Post-consolidation validation report
   * @returns Formatted report string
   */
  public generateValidationReport(report: PostConsolidationReport): string {
    const lines: string[] = [];

    lines.push('# Post-Consolidation Validation Report');
    lines.push('');
    lines.push(`**Generated:** ${report.validationTimestamp.toISOString()}`);
    lines.push('');

    // Status summary
    lines.push('## Validation Status');
    lines.push('');
    if (report.isComplete) {
      lines.push('✅ **CONSOLIDATION COMPLETE**');
      lines.push('');
      lines.push('All inline SVGs have been successfully consolidated into the centralized Svgs.tsx file.');
    } else {
      lines.push('❌ **CONSOLIDATION INCOMPLETE**');
      lines.push('');
      lines.push(`${report.remainingInlineSvgs} inline SVGs still found in ${report.filesWithRemainingInlineSvgs.length} files.`);
    }
    lines.push('');

    // Statistics
    lines.push('## Validation Statistics');
    lines.push('');
    lines.push(`- **Files scanned:** ${report.validationStats.totalFilesScanned}`);
    lines.push(`- **Successfully processed:** ${report.validationStats.successfullyProcessed}`);
    lines.push(`- **Processing failures:** ${report.validationStats.processingFailures}`);
    lines.push(`- **Processing time:** ${report.validationStats.processingTimeMs}ms`);

    if (report.validationStats.comparisonWithPrevious) {
      const comparison = report.validationStats.comparisonWithPrevious;
      lines.push('');
      lines.push('### Consolidation Progress');
      lines.push(`- **Previous inline SVGs:** ${comparison.previousInlineSvgs}`);
      lines.push(`- **Current inline SVGs:** ${comparison.currentInlineSvgs}`);
      lines.push(`- **Successfully consolidated:** ${comparison.svgsSuccessfullyConsolidated}`);
      lines.push(`- **Success rate:** ${comparison.consolidationSuccessRate.toFixed(1)}%`);
    }
    lines.push('');

    // Recommendations
    if (report.recommendations.length > 0) {
      lines.push('## Recommendations');
      lines.push('');
      for (const recommendation of report.recommendations) {
        lines.push(recommendation);
      }
      lines.push('');
    }

    // Remaining SVGs details (if any)
    if (report.remainingSvgDetails.length > 0) {
      lines.push('## Remaining Inline SVGs');
      lines.push('');

      // Group by file
      const svgsByFile = new Map<string, InlineSvgAudit[]>();
      for (const svg of report.remainingSvgDetails) {
        if (!svgsByFile.has(svg.filePath)) {
          svgsByFile.set(svg.filePath, []);
        }
        svgsByFile.get(svg.filePath)!.push(svg);
      }

      for (const [filePath, svgs] of svgsByFile) {
        lines.push(`### ${filePath}`);
        lines.push('');
        lines.push(`Found ${svgs.length} inline SVG${svgs.length === 1 ? '' : 's'}:`);
        lines.push('');

        for (const svg of svgs) {
          lines.push(`#### ${svg.proposedComponentName} (Line ${svg.lineNumber})`);
          lines.push(`- **Usage count:** ${svg.usageCount}`);
          lines.push(`- **Has custom props:** ${svg.hasCustomProps ? 'Yes' : 'No'}`);
          lines.push(`- **Accessibility attributes:** ${svg.accessibilityAttributes.join(', ') || 'None'}`);
          lines.push('');
          lines.push('```tsx');
          lines.push(svg.svgContent);
          lines.push('```');
          lines.push('');
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Save validation report to file
   * @param report Post-consolidation validation report
   * @param outputPath Path to save the report
   */
  public async saveValidationReport(report: PostConsolidationReport, outputPath: string): Promise<void> {
    const reportContent = this.generateValidationReport(report);
    const fs = await import('fs');
    await fs.promises.writeFile(outputPath, reportContent, 'utf-8');
    console.log(`Validation report saved to: ${outputPath}`);
  }

  /**
   * Quick validation check - returns true if consolidation is complete
   * @returns True if no inline SVGs remain, false otherwise
   */
  public async isConsolidationComplete(): Promise<boolean> {
    const report = await this.validateConsolidation();
    return report.isComplete;
  }

  /**
   * Get a summary of remaining work
   * @returns Summary of remaining consolidation work
   */
  public async getRemainingWorkSummary(): Promise<{
    remainingCount: number;
    affectedFiles: string[];
    priorityItems: string[];
  }> {
    const report = await this.validateConsolidation();

    // Identify priority items (high usage or complex SVGs)
    const priorityItems: string[] = [];
    const highUsageSvgs = report.remainingSvgDetails.filter(svg => svg.usageCount > 1);
    const complexSvgs = report.remainingSvgDetails.filter(svg =>
      svg.hasCustomProps || svg.accessibilityAttributes.length > 0
    );

    if (highUsageSvgs.length > 0) {
      priorityItems.push(`${highUsageSvgs.length} frequently-used SVGs`);
    }
    if (complexSvgs.length > 0) {
      priorityItems.push(`${complexSvgs.length} SVGs with custom props/accessibility`);
    }

    return {
      remainingCount: report.remainingInlineSvgs,
      affectedFiles: report.filesWithRemainingInlineSvgs,
      priorityItems
    };
  }
}

/**
 * Utility function to quickly validate consolidation
 * @param options Validation options
 * @returns Post-consolidation validation report
 */
export async function validateConsolidation(
  options?: PostConsolidationValidatorOptions
): Promise<PostConsolidationReport> {
  const validator = new PostConsolidationValidator(options);
  return validator.validateConsolidation();
}

/**
 * Utility function to check if consolidation is complete
 * @param options Validation options
 * @returns True if consolidation is complete
 */
export async function isConsolidationComplete(
  options?: PostConsolidationValidatorOptions
): Promise<boolean> {
  const validator = new PostConsolidationValidator(options);
  return validator.isConsolidationComplete();
}

/**
 * Utility function to generate and save validation report
 * @param options Validation options
 * @param outputPath Output file path
 */
export async function generateValidationReport(
  options?: PostConsolidationValidatorOptions,
  outputPath = 'post-consolidation-validation-report.md'
): Promise<void> {
  const validator = new PostConsolidationValidator(options);
  const report = await validator.validateConsolidation();
  await validator.saveValidationReport(report, outputPath);
}