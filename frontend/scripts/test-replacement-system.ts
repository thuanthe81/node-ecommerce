/**
 * Test script for SVG replacement system
 * Tests the import generator and SVG replacer functionality
 */

import { createImportGenerator } from './svg-audit/import-generator';
import { createSvgReplacer } from './svg-audit/svg-replacer';
import { InlineSvgAudit, SvgVisualProperties } from './svg-audit/types';
import { GeneratedComponent } from './svg-audit/component-generator';

// Test data
const mockAudit: InlineSvgAudit = {
  filePath: 'test.tsx',
  lineNumber: 10,
  svgContent: '<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>',
  context: 'const icon = <svg className="w-6 h-6">...</svg>',
  proposedComponentName: 'SvgPlus',
  usageCount: 1,
  hasCustomProps: true,
  accessibilityAttributes: ['aria-hidden="true"'],
  visualProperties: {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    usesCurrentColor: true,
    customAttributes: { className: 'w-6 h-6' }
  } as SvgVisualProperties
};

const mockComponent: GeneratedComponent = {
  name: 'SvgPlus',
  sourceAudit: mockAudit,
  category: 'ui',
  code: 'export const SvgPlus = (props: SvgProps) => (<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>)'
};

const testFileContent = `
import React from 'react';

const TestComponent = () => {
  return (
    <div>
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </div>
  );
};

export default TestComponent;
`;

async function testImportGenerator() {
  console.log('Testing Import Generator...');

  const generator = createImportGenerator();

  // Test single import generation
  const singleImport = generator.generateImportStatement('SvgPlus');
  console.log('Single import:', singleImport);

  // Test multiple import generation
  const multipleImport = generator.generateMultipleImportStatement(['SvgPlus', 'SvgMinus', 'SvgCheck']);
  console.log('Multiple imports:', multipleImport);

  // Test import parsing
  const existingImports = generator.parseExistingImports(testFileContent);
  console.log('Existing imports:', existingImports);

  // Test import updating
  const updateResult = generator.updateImportsInContent(testFileContent, [mockComponent]);
  console.log('Update result:', {
    success: updateResult.success,
    addedImports: updateResult.addedImports,
    warnings: updateResult.warnings
  });

  console.log('Import Generator tests completed.\n');
}

async function testSvgReplacer() {
  console.log('Testing SVG Replacer...');

  const replacer = createSvgReplacer();

  // Test SVG replacement
  const replacementResult = replacer.replaceInlineSvgsInContent(
    testFileContent,
    [mockAudit],
    [mockComponent]
  );

  console.log('Replacement result:', {
    success: replacementResult.success,
    replacedCount: replacementResult.replacedCount,
    usedComponents: replacementResult.usedComponents,
    warnings: replacementResult.warnings
  });

  if (replacementResult.success) {
    console.log('Updated content preview:');
    console.log(replacementResult.updatedContent.substring(0, 300) + '...');
  }

  // Test replacement preview
  const previewResult = replacer.previewReplacement(
    testFileContent,
    [mockAudit],
    [mockComponent]
  );

  console.log('Preview result:', {
    previewCount: previewResult.previews.length,
    warnings: previewResult.warnings
  });

  if (previewResult.previews.length > 0) {
    const preview = previewResult.previews[0];
    console.log('Preview example:');
    console.log('Original:', preview.originalSvg.substring(0, 100) + '...');
    console.log('Replacement:', preview.replacementComponent);
  }

  console.log('SVG Replacer tests completed.\n');
}

async function runTests() {
  console.log('Starting SVG Replacement System Tests\n');

  try {
    await testImportGenerator();
    await testSvgReplacer();

    console.log('All tests completed successfully!');

  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

export { runTests };