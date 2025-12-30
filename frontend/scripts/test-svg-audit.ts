/**
 * Test script to verify SVG audit system functionality
 */

import { performSvgAudit } from './svg-audit';

async function testAudit() {
  console.log('🧪 Testing SVG Audit System...');

  try {
    const summary = await performSvgAudit({
      rootDir: '.',
      extensions: ['.tsx', '.jsx'],
      excludeDirs: ['node_modules', '.next', 'dist', 'build', 'coverage', '__tests__', 'scripts'],
      includeContext: false, // Disable context for faster testing
      contextLines: 1
    });

    console.log('\n📊 Test Results:');
    console.log(`- Files scanned: ${summary.totalFilesScanned}`);
    console.log(`- Files with inline SVGs: ${summary.filesWithInlineSvgs}`);
    console.log(`- Total inline SVGs: ${summary.totalInlineSvgs}`);
    console.log(`- Unique SVG patterns: ${summary.uniqueSvgPatterns}`);
    console.log(`- Existing components: ${summary.existingComponents.length}`);

    if (summary.totalInlineSvgs === 0) {
      console.log('\n✅ Perfect! No inline SVGs found - all SVGs are properly consolidated.');
    } else {
      console.log('\n⚠️  Found inline SVGs that need consolidation:');
      const inlineSvgs = summary.fileResults.flatMap(result => result.inlineSvgs);
      for (const svg of inlineSvgs.slice(0, 3)) { // Show first 3
        console.log(`  - ${svg.proposedComponentName} in ${svg.filePath}:${svg.lineNumber}`);
      }
      if (inlineSvgs.length > 3) {
        console.log(`  ... and ${inlineSvgs.length - 3} more`);
      }
    }

    console.log('\n📋 Existing SVG Components (sample):');
    for (const component of summary.existingComponents.slice(0, 5)) {
      console.log(`  - ${component.name} (${component.category}, used in ${component.usageLocations.length} files)`);
    }

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
testAudit().catch(error => {
  console.error('Fatal test error:', error);
  process.exit(1);
});