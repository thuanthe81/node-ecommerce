#!/usr/bin/env node

/**
 * CLI interface for SVG consolidation system
 * Requirements: 2.1, 2.2, 2.3, 2.5, 4.5
 *
 * Provides command-line access to the SVG consolidation functionality
 */

import { auditAndConsolidate, performSvgAudit } from './audit-system';
import { ConsolidationOptions } from './svg-consolidation-system';
import { performCompletenessValidation, isConsolidationComplete, getConsolidationStatus } from './completeness-validation-system';

interface CliOptions {
  dryRun?: boolean;
  preview?: boolean;
  backup?: boolean;
  verbose?: boolean;
  output?: string;
  frontendDir?: string;
  validate?: boolean;
  status?: boolean;
}

async function main() {
  const args = process.argv.slice(2);
  const options: CliOptions = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--preview':
        options.preview = true;
        break;
      case '--backup':
        options.backup = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--frontend-dir':
        options.frontendDir = args[++i];
        break;
      case '--validate':
        options.validate = true;
        break;
      case '--status':
        options.status = true;
        break;
      case '--help':
        printHelp();
        process.exit(0);
        break;
      default:
        if (arg.startsWith('--')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
        break;
    }
  }

  try {
    if (options.status) {
      await runStatusCheck(options);
    } else if (options.validate) {
      await runValidation(options);
    } else if (options.preview) {
      await runPreview(options);
    } else {
      await runConsolidation(options);
    }
  } catch (error) {
    console.error('Error:', (error as Error).message);
    if (options.verbose) {
      console.error((error as Error).stack);
    }
    process.exit(1);
  }
}

async function runStatusCheck(options: CliOptions) {
  console.log('📊 Checking SVG consolidation status...\n');

  try {
    const status = await getConsolidationStatus({
      outputDir: options.output ? require('path').dirname(options.output) : './reports'
    });

    console.log(`Status: ${status.status.toUpperCase()}`);
    console.log(`Message: ${status.message}`);

    if (status.details) {
      console.log('\nDetails:');
      if (status.details.remainingCount !== undefined) {
        console.log(`   - Remaining SVGs: ${status.details.remainingCount}`);
        console.log(`   - Affected files: ${status.details.affectedFiles}`);
        if (status.details.priorityItems && status.details.priorityItems.length > 0) {
          console.log('   - Priority items:');
          status.details.priorityItems.forEach((item: string) => {
            console.log(`     • ${item}`);
          });
        }
      }
      if (status.details.error) {
        console.log(`   - Error: ${status.details.error}`);
      }
    }

    console.log('\n💡 Use --validate for detailed validation report');
  } catch (error) {
    console.error('❌ Failed to check consolidation status:', (error as Error).message);
    if (options.verbose) {
      console.error((error as Error).stack);
    }
  }
}

async function runValidation(options: CliOptions) {
  console.log('🔍 Running post-consolidation validation...\n');

  try {
    const outputDir = options.output ? require('path').dirname(options.output) : './reports';

    const result = await performCompletenessValidation({
      outputDir,
      saveReport: true,
      generateRecommendations: true,
      includePerformanceMetrics: true,
      logLevel: options.verbose ? 0 : 1 // DEBUG if verbose, INFO otherwise
    });

    // Display validation results
    console.log('📊 Validation Results:');
    console.log(`   - Success: ${result.success ? '✅' : '❌'}`);
    console.log(`   - Consolidation Complete: ${result.isComplete ? '✅' : '❌'}`);
    console.log(`   - Files Scanned: ${result.performance.filesScanned}`);
    console.log(`   - Validation Time: ${(result.performance.validationTime / 1000).toFixed(2)}s`);
    console.log(`   - Processing Rate: ${result.performance.processingRate.toFixed(1)} files/second`);
    console.log('');

    if (result.isComplete) {
      console.log('🎉 All SVGs have been successfully consolidated!');
      console.log('✅ No remaining inline SVGs found in the codebase');
    } else {
      console.log(`❌ Consolidation incomplete - ${result.remainingWork?.count || 0} SVGs still need attention`);

      if (result.remainingWork) {
        console.log(`📁 Affected files: ${result.remainingWork.affectedFiles.length}`);
        console.log(`⚡ Estimated effort: ${result.remainingWork.estimatedEffort.toUpperCase()}`);

        if (result.remainingWork.priorityItems.length > 0) {
          console.log('\n🔥 Priority items:');
          result.remainingWork.priorityItems.forEach(item => {
            console.log(`   - ${item}`);
          });
        }

        if (result.remainingWork.affectedFiles.length > 0) {
          console.log('\n📂 Files needing attention:');
          result.remainingWork.affectedFiles.slice(0, 10).forEach(file => {
            console.log(`   - ${file}`);
          });
          if (result.remainingWork.affectedFiles.length > 10) {
            console.log(`   ... and ${result.remainingWork.affectedFiles.length - 10} more files`);
          }
        }
      }
    }

    // Show error summary if there are issues
    const errorReport = result.comprehensiveReport.errorReport;
    if (errorReport.summary.totalErrors > 0) {
      console.log('\n⚠️  Issues encountered:');
      console.log(`   - Critical: ${errorReport.summary.criticalErrors}`);
      console.log(`   - Errors: ${errorReport.summary.errors}`);
      console.log(`   - Warnings: ${errorReport.summary.warnings}`);
      console.log(`   - Info: ${errorReport.summary.infos}`);
    }

    // Show immediate recommendations
    if (result.comprehensiveReport.recommendations.immediate.length > 0) {
      console.log('\n🚨 Immediate Actions Required:');
      result.comprehensiveReport.recommendations.immediate.forEach(action => {
        console.log(`   - ${action}`);
      });
    }

    console.log(`\n📄 Detailed reports saved to: ${outputDir}/`);
    console.log('   - post-consolidation-validation-report.md');
    console.log('   - comprehensive-validation-report.md');
    console.log('   - validation-results.json');

  } catch (error) {
    console.error('❌ Validation failed:', (error as Error).message);
    if (options.verbose) {
      console.error((error as Error).stack);
    }
  }
}

async function runPreview(options: CliOptions) {
  console.log('🔍 Running SVG consolidation preview...\n');

  const auditSummary = await performSvgAudit({
    rootDir: options.frontendDir || 'frontend'
  });

  if (auditSummary.totalInlineSvgs === 0) {
    console.log('✅ No inline SVGs found - all SVGs are already consolidated!');
    return;
  }

  console.log(`📊 Found ${auditSummary.totalInlineSvgs} inline SVGs in ${auditSummary.filesWithInlineSvgs} files`);
  console.log(`🎯 ${auditSummary.uniqueSvgPatterns} unique SVG patterns identified\n`);

  // Show recommendations
  if (auditSummary.recommendations.length > 0) {
    console.log('💡 Recommendations:');
    auditSummary.recommendations.forEach(rec => console.log(`   ${rec}`));
    console.log('');
  }

  // Show what would be generated
  const inlineSvgs = auditSummary.fileResults.flatMap(result => result.inlineSvgs);
  console.log('🔧 Components that would be generated:');
  inlineSvgs.forEach(svg => {
    console.log(`   - ${svg.proposedComponentName} (${svg.filePath}:${svg.lineNumber})`);
  });

  console.log('\n💡 Run without --preview to perform actual consolidation');
}

async function runConsolidation(options: CliOptions) {
  console.log('🚀 Starting SVG consolidation...\n');

  const consolidationOptions: ConsolidationOptions = {
    frontendDir: options.frontendDir || 'frontend',
    dryRun: options.dryRun || false,
    createBackups: options.backup !== false, // Default to true unless explicitly disabled
    preserveOrder: true,
    validateComponents: true
  };

  const { auditSummary, consolidationResult } = await auditAndConsolidate(consolidationOptions);

  // Display audit results
  console.log(`📊 Audit Results:`);
  console.log(`   - Files scanned: ${auditSummary.totalFilesScanned}`);
  console.log(`   - Inline SVGs found: ${auditSummary.totalInlineSvgs}`);
  console.log(`   - Unique patterns: ${auditSummary.uniqueSvgPatterns}`);
  console.log('');

  if (auditSummary.totalInlineSvgs === 0) {
    console.log('✅ No inline SVGs found - all SVGs are already consolidated!');
    return;
  }

  // Display consolidation results
  console.log(`🔧 Consolidation Results:`);
  console.log(`   - Components generated: ${consolidationResult.statistics.componentsGenerated}`);
  console.log(`   - Components integrated: ${consolidationResult.statistics.componentsIntegrated}`);
  console.log(`   - Validation failures: ${consolidationResult.statistics.validationFailures}`);
  console.log(`   - Processing time: ${consolidationResult.statistics.processingTime}ms`);
  console.log('');

  // Show successful integrations
  if (consolidationResult.integrationResult.addedComponents.length > 0) {
    console.log('✅ Successfully integrated components:');
    consolidationResult.integrationResult.addedComponents.forEach(name => {
      console.log(`   - ${name}`);
    });
    console.log('');
  }

  // Show validation failures
  if (consolidationResult.failedValidation.length > 0) {
    console.log('❌ Components that failed validation:');
    consolidationResult.failedValidation.forEach(({ component, errors }) => {
      console.log(`   - ${component.name}:`);
      errors.forEach(error => console.log(`     • ${error}`));
    });
    console.log('');
  }

  // Show warnings
  if (consolidationResult.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    consolidationResult.warnings.forEach(warning => {
      console.log(`   - ${warning}`);
    });
    console.log('');
  }

  // Final status
  if (consolidationResult.success) {
    if (options.dryRun) {
      console.log('✅ Dry run completed successfully - no files were modified');
      console.log('💡 Run without --dry-run to apply changes');
    } else {
      console.log('✅ SVG consolidation completed successfully!');
      console.log('🔍 Running post-consolidation validation...\n');

      // Automatically run validation after successful consolidation
      try {
        const isComplete = await isConsolidationComplete();
        if (isComplete) {
          console.log('🎉 Validation PASSED: All SVGs have been successfully consolidated!');
        } else {
          console.log('⚠️  Validation WARNING: Some SVGs may still need attention');
          console.log('💡 Run --validate for detailed validation report');
        }
      } catch (validationError) {
        console.log('⚠️  Could not run automatic validation - please run --validate manually');
        if (options.verbose) {
          console.error('Validation error:', validationError);
        }
      }

      console.log('\n💡 Remember to test your application to ensure all SVGs render correctly');
    }
  } else {
    console.log('❌ SVG consolidation completed with errors');
    console.log('💡 Review the warnings and validation failures above');
  }

  // Save report if requested
  if (options.output) {
    const reportContent = generateConsolidationReport(auditSummary, consolidationResult);
    const fs = await import('fs');
    await fs.promises.writeFile(options.output, reportContent, 'utf-8');
    console.log(`📄 Report saved to: ${options.output}`);
  }
}

function generateConsolidationReport(auditSummary: any, consolidationResult: any): string {
  const lines: string[] = [];

  lines.push('# SVG Consolidation Report');
  lines.push('');
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push('');

  // Audit Summary
  lines.push('## Audit Summary');
  lines.push(`- **Files scanned:** ${auditSummary.totalFilesScanned}`);
  lines.push(`- **Inline SVGs found:** ${auditSummary.totalInlineSvgs}`);
  lines.push(`- **Unique patterns:** ${auditSummary.uniqueSvgPatterns}`);
  lines.push('');

  // Consolidation Results
  lines.push('## Consolidation Results');
  lines.push(`- **Components generated:** ${consolidationResult.statistics.componentsGenerated}`);
  lines.push(`- **Components integrated:** ${consolidationResult.statistics.componentsIntegrated}`);
  lines.push(`- **Validation failures:** ${consolidationResult.statistics.validationFailures}`);
  lines.push(`- **Processing time:** ${consolidationResult.statistics.processingTime}ms`);
  lines.push(`- **Success:** ${consolidationResult.success ? '✅' : '❌'}`);
  lines.push('');

  // Integrated Components
  if (consolidationResult.integrationResult.addedComponents.length > 0) {
    lines.push('## Successfully Integrated Components');
    consolidationResult.integrationResult.addedComponents.forEach((name: string) => {
      lines.push(`- ${name}`);
    });
    lines.push('');
  }

  // Validation Failures
  if (consolidationResult.failedValidation.length > 0) {
    lines.push('## Validation Failures');
    consolidationResult.failedValidation.forEach(({ component, errors }: any) => {
      lines.push(`### ${component.name}`);
      errors.forEach((error: string) => {
        lines.push(`- ❌ ${error}`);
      });
      lines.push('');
    });
  }

  // Warnings
  if (consolidationResult.warnings.length > 0) {
    lines.push('## Warnings');
    consolidationResult.warnings.forEach((warning: string) => {
      lines.push(`- ⚠️ ${warning}`);
    });
    lines.push('');
  }

  return lines.join('\n');
}

function printHelp() {
  console.log(`
SVG Consolidation CLI

USAGE:
  npm run svg-consolidate [OPTIONS]

OPTIONS:
  --status          Check current consolidation status (quick check)
  --validate        Run comprehensive post-consolidation validation
  --preview         Show what would be consolidated without making changes
  --dry-run         Generate components but don't modify files
  --backup          Create backup of original files (default: true)
  --verbose         Show detailed error information
  --output <file>   Save consolidation report to file (or directory for validation)
  --frontend-dir    Specify frontend directory (default: frontend)
  --help            Show this help message

EXAMPLES:
  npm run svg-consolidate --status
  npm run svg-consolidate --validate
  npm run svg-consolidate --preview
  npm run svg-consolidate --dry-run
  npm run svg-consolidate --output report.md
  npm run svg-consolidate --validate --output ./validation-reports
  npm run svg-consolidate --frontend-dir ./my-frontend

WORKFLOW:
  1. Use --preview to see what SVGs would be consolidated
  2. Run consolidation (with or without --dry-run)
  3. Use --validate to verify consolidation was successful
  4. Use --status for quick status checks
`);
}

// Run the CLI if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main as runConsolidationCli };