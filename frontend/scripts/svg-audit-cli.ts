#!/usr/bin/env ts-node

/**
 * CLI script for running SVG audit and consolidation
 * Usage:
 *   npm run svg-audit [output-file]
 *   npm run svg-consolidate [options]
 */

import * as path from 'path';
import { generateAuditReport, performSvgAudit, auditAndConsolidate } from './svg-audit';
import { runConsolidationCli } from './svg-audit/consolidation-cli';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  // Check if this is a consolidation command
  if (command === 'consolidate' || process.argv[1].includes('consolidation-cli')) {
    return runConsolidationCli();
  }

  // Default to audit command
  const outputPath = command && !command.startsWith('--') ? command : 'svg-audit-report.md';

  console.log('🔍 Starting SVG Consolidation Audit...');
  console.log(`📁 Scanning frontend directory...`);
  console.log(`📄 Report will be saved to: ${outputPath}`);
  console.log('');

  try {
    // Run the audit
    const startTime = Date.now();
    await generateAuditReport(
      {
        rootDir: '.',
        extensions: ['.tsx', '.jsx'],
        excludeDirs: ['node_modules', '.next', 'dist', 'build', 'coverage', '__tests__'],
        includeContext: true,
        contextLines: 3
      },
      outputPath
    );

    const duration = Date.now() - startTime;
    console.log('');
    console.log(`✅ Audit completed successfully in ${duration}ms`);
    console.log(`📄 Report saved to: ${path.resolve(outputPath)}`);
    console.log('');
    console.log('💡 Next steps:');
    console.log('   - Review the audit report for inline SVGs');
    console.log('   - Run consolidation: npm run svg-consolidate --preview');
    console.log('   - Apply changes: npm run svg-consolidate');

  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}