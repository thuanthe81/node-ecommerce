/**
 * Test script for the validation system
 * This script tests the validation system with sample components
 */

import { GeneratedComponent } from './svg-audit/component-generator';
import { createComprehensiveValidationSystem } from './svg-audit/validation-system';

// Sample generated component for testing
const sampleComponent: GeneratedComponent = {
  name: 'SvgTestIcon',
  code: `export const SvgTestIcon = (props: SvgProps) => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)`,
  category: 'ui',
  sourceAudit: {
    filePath: 'test/TestComponent.tsx',
    lineNumber: 10,
    svgContent: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>',
    context: 'const icon = <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>',
    proposedComponentName: 'SvgTestIcon',
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
  }
};

async function testValidationSystem() {
  console.log('🧪 Testing SVG Consolidation Validation System...\n');

  try {
    const validationSystem = createComprehensiveValidationSystem();

    console.log('📋 Testing component validation...');
    const result = await validationSystem.validateGeneratedComponents(
      [sampleComponent],
      {
        runInParallel: false,
        generateReports: false,
        renderingOptions: {
          captureHTML: true,
          testPropSpreading: true,
          testPropVariations: true
        },
        interactionOptions: {
          testClick: true,
          testHover: true,
          testKeyboard: true,
          testTouch: true,
          testAccessibility: true
        },
        typeScriptOptions: {
          frontendDir: 'frontend',
          validateImports: false, // Skip import validation for this test
          validateComponentTypes: true,
          includeWarnings: true
        }
      }
    );

    console.log('\n📊 Validation Results:');
    console.log(`✅ Overall Success: ${result.success}`);
    console.log(`📈 Success Rate: ${result.summary.successRate.toFixed(1)}%`);
    console.log(`⏱️  Validation Time: ${result.summary.validationTime}ms`);
    console.log(`🔍 Components Tested: ${result.summary.totalComponents}`);
    console.log(`✅ Fully Valid: ${result.summary.fullyValidComponents}`);
    console.log(`🎨 Rendering Valid: ${result.summary.renderingValidComponents}`);
    console.log(`🖱️  Interaction Valid: ${result.summary.interactionValidComponents}`);
    console.log(`📝 TypeScript Valid: ${result.summary.typeScriptValid}`);

    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach(error => {
        console.log(`  - ${error}`);
      });
    }

    if (result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      result.warnings.forEach(warning => {
        console.log(`  - ${warning}`);
      });
    }

    // Show detailed results for the test component
    if (result.renderingValidation.length > 0) {
      const renderingResult = result.renderingValidation[0];
      console.log(`\n🎨 Rendering Validation for ${renderingResult.componentName}:`);
      console.log(`  - Accepts Props: ${renderingResult.acceptsProps ? '✅' : '❌'}`);
      console.log(`  - Spreads Props: ${renderingResult.spreadsProps ? '✅' : '❌'}`);
      console.log(`  - Valid SVG Structure: ${renderingResult.hasValidSvgStructure ? '✅' : '❌'}`);
    }

    if (result.interactionTesting.length > 0) {
      const interactionResult = result.interactionTesting[0];
      console.log(`\n🖱️  Interaction Testing for ${interactionResult.componentName}:`);
      console.log(`  - Click Handling: ${interactionResult.testResults.clickHandling ? '✅' : '❌'}`);
      console.log(`  - Hover Handling: ${interactionResult.testResults.hoverHandling ? '✅' : '❌'}`);
      console.log(`  - Keyboard Handling: ${interactionResult.testResults.keyboardHandling ? '✅' : '❌'}`);
      console.log(`  - Touch Handling: ${interactionResult.testResults.touchHandling ? '✅' : '❌'}`);
      console.log(`  - Accessibility: ${interactionResult.testResults.accessibilityInteractions ? '✅' : '❌'}`);
    }

    console.log('\n🎉 Validation system test completed successfully!');

    return result.success;

  } catch (error) {
    console.error('❌ Validation system test failed:', error);
    return false;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testValidationSystem()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export { testValidationSystem };