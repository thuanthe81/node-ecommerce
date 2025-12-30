/**
 * Simple test to verify the audit system can scan files
 */

const fs = require('fs');
const path = require('path');

async function testBasicScanning() {
  console.log('🧪 Testing basic file scanning...');

  try {
    // Test basic file scanning
    const frontendDir = path.join(__dirname, '..');
    const files = [];

    function scanDir(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          const dirName = entry.name;
          if (!['node_modules', '.next', 'dist', 'build', 'coverage', '__tests__', 'scripts'].includes(dirName)) {
            scanDir(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (['.tsx', '.jsx'].includes(ext)) {
            files.push(path.relative(frontendDir, fullPath));
          }
        }
      }
    }

    scanDir(frontendDir);

    console.log(`📁 Found ${files.length} React component files`);

    // Test reading a few files and looking for SVG imports
    let svgImportCount = 0;
    let inlineSvgCount = 0;

    for (const file of files.slice(0, 10)) { // Test first 10 files
      try {
        const content = fs.readFileSync(path.join(frontendDir, file), 'utf-8');

        // Look for SVG imports
        if (content.includes('from') && content.includes('Svgs')) {
          svgImportCount++;
        }

        // Look for inline SVGs (basic check)
        if (content.includes('<svg')) {
          inlineSvgCount++;
        }

      } catch (error) {
        console.warn(`Failed to read ${file}: ${error.message}`);
      }
    }

    console.log(`📊 In first 10 files:`);
    console.log(`  - Files with SVG imports: ${svgImportCount}`);
    console.log(`  - Files with inline SVGs: ${inlineSvgCount}`);

    // Check the Svgs.tsx file
    const svgsPath = path.join(frontendDir, 'components', 'Svgs.tsx');
    if (fs.existsSync(svgsPath)) {
      const svgsContent = fs.readFileSync(svgsPath, 'utf-8');
      const exportMatches = svgsContent.match(/export const Svg\w+/g) || [];
      console.log(`📋 Found ${exportMatches.length} SVG components in Svgs.tsx`);

      // Show first few components
      console.log('  Sample components:');
      for (const match of exportMatches.slice(0, 5)) {
        const componentName = match.replace('export const ', '');
        console.log(`    - ${componentName}`);
      }
    }

    console.log('\n✅ Basic scanning test completed successfully!');
    console.log('🎯 The audit system structure is ready for implementation.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
testBasicScanning().catch(error => {
  console.error('Fatal test error:', error);
  process.exit(1);
});