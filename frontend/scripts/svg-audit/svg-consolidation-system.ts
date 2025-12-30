/**
 * SVG Consolidation System
 * Requirements: 2.1, 2.2, 2.3, 2.5, 4.5
 *
 * Main orchestration system that combines component generation and file integration
 * Provides a unified interface for the complete SVG consolidation workflow
 */

import { InlineSvgAudit, AuditSummary } from './types';
import {
  SvgComponentGenerator,
  GeneratedComponent,
  ComponentGenerationOptions,
  createComponentGenerator
} from './component-generator';
import {
  SvgsFileIntegrator,
  IntegrationResult,
  createSvgsFileIntegrator
} from './svgs-file-integrator';
import {
  SvgReplacer,
  SvgReplacementResult,
  createSvgReplacer
} from './svg-replacer';
import {
  ImportStatementGenerator,
  createImportGenerator
} from './import-generator';

export interface ConsolidationOptions {
  /** Frontend directory path */
  frontendDir?: string;
  /** Component generation options */
  componentOptions?: ComponentGenerationOptions;
  /** Whether to perform a dry run (no file modifications) */
  dryRun?: boolean;
  /** Whether to create backup of original files */
  createBackups?: boolean;
  /** Whether to preserve alphabetical ordering */
  preserveOrder?: boolean;
  /** Whether to validate generated components */
  validateComponents?: boolean;
  /** Whether to replace inline SVGs with component usage */
  replaceInlineSvgs?: boolean;
  /** File paths to process for SVG replacement (if empty, processes all files from audit) */
  filesToProcess?: string[];
}

export interface ConsolidationResult {
  /** Components that were successfully generated */
  generatedComponents: GeneratedComponent[];
  /** Result of integrating components into Svgs.tsx */
  integrationResult: IntegrationResult;
  /** Result of replacing inline SVGs with component usage */
  replacementResults: SvgReplacementResult[];
  /** Components that failed validation */
  failedValidation: { component: GeneratedComponent; errors: string[] }[];
  /** Overall success status */
  success: boolean;
  /** Summary statistics */
  statistics: ConsolidationStatistics;
  /** Any warnings or issues encountered */
  warnings: string[];
}

export interface ConsolidationStatistics {
  /** Total inline SVGs processed */
  totalProcessed: number;
  /** Components successfully generated */
  componentsGenerated: number;
  /** Components successfully integrated */
  componentsIntegrated: number;
  /** Components that had naming conflicts */
  namingConflicts: number;
  /** Components that failed validation */
  validationFailures: number;
  /** Files processed for SVG replacement */
  filesProcessed: number;
  /** Total SVGs replaced in files */
  svgsReplaced: number;
  /** SVG replacements that failed */
  replacementFailures: number;
  /** Processing time in milliseconds */
  processingTime: number;
}

export class SvgConsolidationSystem {
  private readonly componentGenerator: SvgComponentGenerator;
  private readonly fileIntegrator: SvgsFileIntegrator;
  private readonly svgReplacer: SvgReplacer;
  private readonly importGenerator: ImportStatementGenerator;
  private readonly options: Required<ConsolidationOptions>;

  constructor(options: ConsolidationOptions = {}) {
    this.options = {
      frontendDir: 'frontend',
      componentOptions: {},
      dryRun: false,
      createBackups: true,
      preserveOrder: true,
      validateComponents: true,
      replaceInlineSvgs: true,
      filesToProcess: [],
      ...options
    };

    this.componentGenerator = createComponentGenerator();
    this.fileIntegrator = createSvgsFileIntegrator(this.options.frontendDir);
    this.svgReplacer = createSvgReplacer({
      autoAddImports: true,
      preserveFormatting: true
    });
    this.importGenerator = createImportGenerator();
  }

  /**
   * Consolidate inline SVGs from audit results
   */
  async consolidateFromAudit(auditResults: InlineSvgAudit[]): Promise<ConsolidationResult> {
    const startTime = Date.now();
    const warnings: string[] = [];
    const failedValidation: { component: GeneratedComponent; errors: string[] }[] = [];
    const usedComponents: string[] = [];
    let replacedCount = 0;
    const replacementResults: SvgReplacementResult[] = [];

    try {
      // Step 1: Generate components from audit results
      console.log(`Generating components for ${auditResults.length} inline SVGs...`);
      const generatedComponents = this.componentGenerator.generateComponents(
        auditResults,
        this.options.componentOptions
      );

      // Step 2: Validate components if requested
      if (this.options.validateComponents) {
        console.log('Validating generated components...');
        for (const component of generatedComponents) {
          const validation = this.componentGenerator.validateComponent(component);
          if (!validation.isValid) {
            failedValidation.push({ component, errors: validation.errors });
            warnings.push(`Component ${component.name} failed validation: ${validation.errors.join(', ')}`);
          }
        }
      }

      // Filter out failed components
      const validComponents = generatedComponents.filter(component =>
        !failedValidation.some(failed => failed.component.name === component.name)
      );

      // Step 3: Integrate components into Svgs.tsx
      console.log(`Integrating ${validComponents.length} components into Svgs.tsx...`);
      const integrationResult = await this.fileIntegrator.integrateComponents(
        validComponents,
        {
          dryRun: this.options.dryRun,
          preserveOrder: this.options.preserveOrder,
          backupOriginal: this.options.createBackups
        }
      );

      // Step 4: Replace inline SVGs with component usage (if enabled)
      if (this.options.replaceInlineSvgs && !this.options.dryRun) {
        console.log('Replacing inline SVGs with component usage...');

        // Group audit results by file
        const fileGroups = new Map<string, InlineSvgAudit[]>();
        auditResults.forEach(audit => {
          const filePath = audit.filePath;
          if (!fileGroups.has(filePath)) {
            fileGroups.set(filePath, []);
          }
          fileGroups.get(filePath)!.push(audit);
        });

        // Process each file
        const filesToProcess = this.options.filesToProcess.length > 0
          ? this.options.filesToProcess
          : Array.from(fileGroups.keys());

        for (const filePath of filesToProcess) {
          const fileAudits = fileGroups.get(filePath) || [];
          if (fileAudits.length === 0) continue;

          try {
            const replacementResult = await this.svgReplacer.replaceInlineSvgsInFile(
              filePath,
              fileAudits,
              validComponents
            );

            replacementResults.push(replacementResult);
            replacedCount += replacementResult.replacedCount;
            usedComponents.push(...replacementResult.usedComponents);
            warnings.push(...replacementResult.warnings);

            if (!replacementResult.success) {
              warnings.push(`Some SVG replacements failed in ${filePath}`);
            }

          } catch (error) {
            warnings.push(`Failed to process file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }

      // Combine warnings
      warnings.push(...integrationResult.warnings);

      // Calculate statistics
      const processingTime = Date.now() - startTime;
      const statistics: ConsolidationStatistics = {
        totalProcessed: auditResults.length,
        componentsGenerated: generatedComponents.length,
        componentsIntegrated: integrationResult.addedComponents.length,
        namingConflicts: integrationResult.warnings.filter(w => w.includes('conflict')).length,
        validationFailures: failedValidation.length,
        filesProcessed: replacementResults.length,
        svgsReplaced: replacedCount,
        replacementFailures: replacementResults.reduce((sum, result) =>
          sum + result.failedReplacements.length, 0
        ),
        processingTime
      };

      const success = integrationResult.success &&
                     failedValidation.length === 0 &&
                     replacementResults.every(r => r.success);

      return {
        generatedComponents,
        integrationResult,
        replacementResults,
        failedValidation,
        success,
        statistics,
        warnings
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;

      return {
        generatedComponents: [],
        integrationResult: {
          updatedContent: '',
          addedComponents: [],
          updatedComponents: [],
          warnings: [`Error during consolidation: ${error instanceof Error ? error.message : String(error)}`],
          success: false
        },
        replacementResults: [],
        failedValidation,
        success: false,
        statistics: {
          totalProcessed: auditResults.length,
          componentsGenerated: 0,
          componentsIntegrated: 0,
          namingConflicts: 0,
          validationFailures: failedValidation.length,
          filesProcessed: 0,
          svgsReplaced: 0,
          replacementFailures: 0,
          processingTime
        },
        warnings: [`Fatal error: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  /**
   * Consolidate from a complete audit summary
   */
  async consolidateFromAuditSummary(auditSummary: AuditSummary): Promise<ConsolidationResult> {
    // Extract all inline SVGs from the audit summary
    const allInlineSvgs: InlineSvgAudit[] = [];

    for (const fileResult of auditSummary.fileResults) {
      allInlineSvgs.push(...fileResult.inlineSvgs);
    }

    return this.consolidateFromAudit(allInlineSvgs);
  }

  /**
   * Preview consolidation without making changes
   */
  async previewConsolidation(auditResults: InlineSvgAudit[]): Promise<ConsolidationResult> {
    const originalDryRun = this.options.dryRun;
    this.options.dryRun = true;

    try {
      const result = await this.consolidateFromAudit(auditResults);
      return result;
    } finally {
      this.options.dryRun = originalDryRun;
    }
  }

  /**
   * Get current Svgs.tsx file statistics
   */
  async getCurrentFileStatistics() {
    return this.fileIntegrator.getFileStatistics();
  }

  /**
   * Validate a specific component
   */
  validateComponent(component: GeneratedComponent) {
    return this.componentGenerator.validateComponent(component);
  }

  /**
   * Generate a single component from audit data
   */
  generateSingleComponent(audit: InlineSvgAudit, options?: ComponentGenerationOptions): GeneratedComponent {
    return this.componentGenerator.generateComponent(audit, options);
  }

  /**
   * Preview SVG replacements without making changes
   */
  async previewSvgReplacements(
    auditResults: InlineSvgAudit[],
    generatedComponents: GeneratedComponent[]
  ): Promise<{
    previews: {
      filePath: string;
      replacements: {
        audit: InlineSvgAudit;
        componentName: string;
        originalSvg: string;
        replacementComponent: string;
      }[];
    }[];
    warnings: string[];
  }> {
    const previews: {
      filePath: string;
      replacements: {
        audit: InlineSvgAudit;
        componentName: string;
        originalSvg: string;
        replacementComponent: string;
      }[];
    }[] = [];
    const warnings: string[] = [];

    // Group audit results by file
    const fileGroups = new Map<string, InlineSvgAudit[]>();
    auditResults.forEach(audit => {
      const filePath = audit.filePath;
      if (!fileGroups.has(filePath)) {
        fileGroups.set(filePath, []);
      }
      fileGroups.get(filePath)!.push(audit);
    });

    // Process each file
    for (const [filePath, fileAudits] of fileGroups) {
      try {
        const fileContent = require('fs').readFileSync(filePath, 'utf-8');
        const previewResult = this.svgReplacer.previewReplacement(
          fileContent,
          fileAudits,
          generatedComponents
        );

        previews.push({
          filePath,
          replacements: previewResult.previews.map(p => ({
            audit: p.audit,
            componentName: p.componentName,
            originalSvg: p.originalSvg,
            replacementComponent: p.replacementComponent
          }))
        });

        warnings.push(...previewResult.warnings);

      } catch (error) {
        warnings.push(`Failed to preview replacements for ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return { previews, warnings };
  }

  /**
   * Replace SVGs in specific files only
   */
  async replaceSvgsInFiles(
    filePaths: string[],
    auditResults: InlineSvgAudit[],
    generatedComponents: GeneratedComponent[]
  ): Promise<SvgReplacementResult[]> {
    const results: SvgReplacementResult[] = [];

    // Group audit results by file
    const fileGroups = new Map<string, InlineSvgAudit[]>();
    auditResults.forEach(audit => {
      const filePath = audit.filePath;
      if (!fileGroups.has(filePath)) {
        fileGroups.set(filePath, []);
      }
      fileGroups.get(filePath)!.push(audit);
    });

    // Process only specified files
    for (const filePath of filePaths) {
      const fileAudits = fileGroups.get(filePath) || [];
      if (fileAudits.length === 0) {
        results.push({
          updatedContent: '',
          replacedCount: 0,
          usedComponents: [],
          failedReplacements: [],
          warnings: [`No SVGs found in ${filePath}`],
          success: true
        });
        continue;
      }

      try {
        const result = await this.svgReplacer.replaceInlineSvgsInFile(
          filePath,
          fileAudits,
          generatedComponents
        );
        results.push(result);

      } catch (error) {
        results.push({
          updatedContent: '',
          replacedCount: 0,
          usedComponents: [],
          failedReplacements: fileAudits.map(audit => ({
            audit,
            reason: `Processing error: ${error instanceof Error ? error.message : String(error)}`
          })),
          warnings: [`Failed to process ${filePath}: ${error instanceof Error ? error.message : String(error)}`],
          success: false
        });
      }
    }

    return results;
  }
  async checkNamingConflicts(auditResults: InlineSvgAudit[]): Promise<{
    conflicts: { proposedName: string; existingName: string }[];
    suggestions: { original: string; suggested: string }[];
  }> {
    const svgsFile = await this.fileIntegrator.loadSvgsFile();
    const existingNames = svgsFile.existingComponents.map(c => c.name.toLowerCase());

    const conflicts: { proposedName: string; existingName: string }[] = [];
    const suggestions: { original: string; suggested: string }[] = [];

    for (const audit of auditResults) {
      const proposedName = audit.proposedComponentName.toLowerCase();
      const existingMatch = svgsFile.existingComponents.find(c =>
        c.name.toLowerCase() === proposedName
      );

      if (existingMatch) {
        conflicts.push({
          proposedName: audit.proposedComponentName,
          existingName: existingMatch.name
        });

        // Generate alternative name
        let counter = 1;
        let alternativeName = `${audit.proposedComponentName}${counter}`;
        while (existingNames.includes(alternativeName.toLowerCase())) {
          counter++;
          alternativeName = `${audit.proposedComponentName}${counter}`;
        }

        suggestions.push({
          original: audit.proposedComponentName,
          suggested: alternativeName
        });
      }
    }

    return { conflicts, suggestions };
  }

  /**
   * Generate a consolidation report
   */
  generateReport(result: ConsolidationResult): string {
    const { statistics, generatedComponents, integrationResult, replacementResults, failedValidation, warnings } = result;

    let report = '# SVG Consolidation Report\n\n';

    // Summary
    report += '## Summary\n\n';
    report += `- **Total SVGs Processed**: ${statistics.totalProcessed}\n`;
    report += `- **Components Generated**: ${statistics.componentsGenerated}\n`;
    report += `- **Components Integrated**: ${statistics.componentsIntegrated}\n`;
    report += `- **Validation Failures**: ${statistics.validationFailures}\n`;
    report += `- **Naming Conflicts**: ${statistics.namingConflicts}\n`;
    report += `- **Files Processed**: ${statistics.filesProcessed}\n`;
    report += `- **SVGs Replaced**: ${statistics.svgsReplaced}\n`;
    report += `- **Replacement Failures**: ${statistics.replacementFailures}\n`;
    report += `- **Processing Time**: ${statistics.processingTime}ms\n`;
    report += `- **Overall Success**: ${result.success ? '✅' : '❌'}\n\n`;

    // Generated Components
    if (generatedComponents.length > 0) {
      report += '## Generated Components\n\n';
      generatedComponents.forEach(component => {
        report += `### ${component.name}\n`;
        report += `- **Category**: ${component.category}\n`;
        report += `- **Source File**: ${component.sourceAudit.filePath}\n`;
        report += `- **Line**: ${component.sourceAudit.lineNumber}\n\n`;
      });
    }

    // Integration Results
    if (integrationResult.addedComponents.length > 0) {
      report += '## Successfully Integrated\n\n';
      integrationResult.addedComponents.forEach(name => {
        report += `- ${name}\n`;
      });
      report += '\n';
    }

    // Replacement Results
    if (replacementResults.length > 0) {
      report += '## SVG Replacement Results\n\n';
      replacementResults.forEach((result, index) => {
        report += `### File ${index + 1}\n`;
        report += `- **Replaced**: ${result.replacedCount} SVGs\n`;
        report += `- **Failed**: ${result.failedReplacements.length} SVGs\n`;
        report += `- **Components Used**: ${result.usedComponents.join(', ')}\n`;

        if (result.failedReplacements.length > 0) {
          report += `- **Failure Reasons**:\n`;
          result.failedReplacements.forEach(failure => {
            report += `  - Line ${failure.audit.lineNumber}: ${failure.reason}\n`;
          });
        }
        report += '\n';
      });
    }

    // Validation Failures
    if (failedValidation.length > 0) {
      report += '## Validation Failures\n\n';
      failedValidation.forEach(({ component, errors }) => {
        report += `### ${component.name}\n`;
        errors.forEach(error => {
          report += `- ❌ ${error}\n`;
        });
        report += '\n';
      });
    }

    // Warnings
    if (warnings.length > 0) {
      report += '## Warnings\n\n';
      warnings.forEach(warning => {
        report += `- ⚠️ ${warning}\n`;
      });
      report += '\n';
    }

    return report;
  }
}

/**
 * Utility function to create a consolidation system
 */
export function createConsolidationSystem(options?: ConsolidationOptions): SvgConsolidationSystem {
  return new SvgConsolidationSystem(options);
}

/**
 * Quick consolidation function for simple use cases
 */
export async function consolidateInlineSvgs(
  auditResults: InlineSvgAudit[],
  options?: ConsolidationOptions
): Promise<ConsolidationResult> {
  const system = createConsolidationSystem(options);
  return system.consolidateFromAudit(auditResults);
}