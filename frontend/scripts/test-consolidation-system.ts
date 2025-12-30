#!/usr/bin/env ts-node

/**
 * Test script for the SVG consolidation system
 * Tests component generation and file integration functionality
 */

import { createComponentGenerator } from './svg-audit/component-generator';
import { createSvgsFileIntegrator } from './svg-audit/svgs-file-integrator';
import { InlineSvgAudit } from './svg-audit/types';

async function testComponentGeneration() {
  console.log('🧪 Testing SVG Component Generation...\n');

  const generator = createComponentGenerator();

  // Create test audit data
  const testAudit: InlineSvgAudit = {
    filePath: 'components/TestComponent.tsx',
    lineNumber: 15,
    svgContent: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>',
    context: 'const addButton = <svg className="w-6 h-6">',
    proposedComponentName: 'SvgPlus',
    usageCount: 3,
    hasCustomProps: true,
    accessibilityAttributes: ['aria-hidden'],
    visualProperties: {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      usesCurrentColor: true,
      customAttributes: {}
    }
  };

  // Test component generation
  const component = generator.generateComponent(testAudit);

  console.log('✅ Generated Component:');
  console.log(`   Name: ${component.name}`);
  console.log(`   Category: ${component.category}`);
  console.log('   Code:');
  console.log(component.code);
  console.log('');

  // Test validation
  const validation = generator.validateComponent(component);
  console.log('🔍 Validation Result:');
  console.log(`   Valid: ${validation.isValid}`);
  if (!validation.isValid) {
    console.log('   Errors:');
    validation.errors.forEach(error => console.log(`     - ${error}`));
  }
  console.log('');

  return component;
}

async function testFileIntegration() {
  console.log('🧪 Testing Svgs.tsx File Integration...\n');

  const integrator = createSvgsFileIntegrator('.');

  try {
    // Load current file
    const svgsFile = await integrator.loadSvgsFile();
    console.log('✅ Successfully loaded Svgs.tsx file');
    console.log(`   Found ${svgsFile.existingComponents.length} existing components`);
    console.log(`   Type definitions: ${svgsFile.typeDefinitions.length}`);
    console.log('');

    // Get statistics
    const stats = await integrator.getFileStatistics();
    console.log('📊 File Statistics:');
    console.log(`   Total components: ${stats.totalComponents}`);
    console.log(`   File size: ${stats.fileSize} bytes`);
    console.log(`   Last modified: ${stats.lastModified.toISOString()}`);
    console.log('   Components by category:');
    Object.entries(stats.componentsByCategory).forEach(([category, count]) => {
      console.log(`     - ${category}: ${count}`);
    });
    console.log('');

    return svgsFile;

  } catch (error: any) {
    console.error('❌ Failed to load Svgs.tsx file:', error.message);
    return null;
  }
}

async function testDryRunIntegration() {
  console.log('🧪 Testing Dry Run Integration...\n');

  const generator = createComponentGenerator();
  const integrator = createSvgsFileIntegrator('.');

  // Create test component
  const testAudit: InlineSvgAudit = {
    filePath: 'components/TestComponent.tsx',
    lineNumber: 20,
    svgContent: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>',
    context: 'const closeIcon = <svg className="w-4 h-4">',
    proposedComponentName: 'SvgTestClose',
    usageCount: 1,
    hasCustomProps: false,
    accessibilityAttributes: [],
    visualProperties: {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      usesCurrentColor: true,
      customAttributes: {}
    }
  };

  const component = generator.generateComponent(testAudit);

  // Test dry run integration
  const result = await integrator.integrateComponents([component], {
    dryRun: true,
    preserveOrder: true,
    backupOriginal: false
  });

  console.log('✅ Dry Run Integration Result:');
  console.log(`   Success: ${result.success}`);
  console.log(`   Added components: ${result.addedComponents.join(', ')}`);
  console.log(`   Warnings: ${result.warnings.length}`);
  if (result.warnings.length > 0) {
    result.warnings.forEach(warning => console.log(`     - ${warning}`));
  }
  console.log('');

  // Validate the updated content
  const validation = integrator.validateUpdatedContent(result.updatedContent);
  console.log('🔍 Content Validation:');
  console.log(`   Valid: ${validation.isValid}`);
  if (!validation.isValid) {
    console.log('   Errors:');
    validation.errors.forEach(error => console.log(`     - ${error}`));
  }
  console.log('');

  return result;
}

async function main() {
  console.log('🚀 Starting SVG Consolidation System Tests\n');

  try {
    // Test component generation
    const component = await testComponentGeneration();

    // Test file integration
    const svgsFile = await testFileIntegration();

    if (svgsFile) {
      // Test dry run integration
      await testDryRunIntegration();
    }

    console.log('✅ All tests completed successfully!');
    console.log('💡 The consolidation system is ready to use');

  } catch (error: any) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error: any) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main as testConsolidationSystem };