#!/usr/bin/env tsx

/**
 * Script to detect inline SVG elements in React components
 * This helps enforce the centralized SVG management policy
 */

import { glob } from 'glob';
import fs from 'fs';
import path from 'path';

interface SvgViolation {
  file: string;
  line: number;
  content: string;
}

async function checkInlineSvgs(): Promise<void> {
  console.log('🔍 Checking for inline SVG elements...\n');

  // Find all React component files, excluding the centralized Svgs.tsx
  const files = await glob('**/*.{tsx,jsx}', {
    ignore: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      'build/**',
      'components/Svgs.tsx', // Allow SVGs in the centralized file
      'eslint-rules/**' // Ignore ESLint rule files
    ]
  });

  const violations: SvgViolation[] = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Check for opening SVG tags
        if (line.includes('<svg')) {
          violations.push({
            file,
            line: index + 1,
            content: line.trim()
          });
        }
      });
    } catch (error) {
      console.warn(`⚠️  Warning: Could not read file ${file}:`, error);
    }
  }

  // Report results
  if (violations.length === 0) {
    console.log('✅ No inline SVG elements detected!');
    console.log('🎉 All SVGs are properly centralized in components/Svgs.tsx\n');
    return;
  }

  console.log(`❌ Found ${violations.length} inline SVG element(s):\n`);

  // Group violations by file
  const violationsByFile = violations.reduce((acc, violation) => {
    if (!acc[violation.file]) {
      acc[violation.file] = [];
    }
    acc[violation.file].push(violation);
    return acc;
  }, {} as Record<string, SvgViolation[]>);

  // Display violations
  Object.entries(violationsByFile).forEach(([file, fileViolations]) => {
    console.log(`📁 ${file}:`);
    fileViolations.forEach(violation => {
      console.log(`   Line ${violation.line}: ${violation.content}`);
    });
    console.log('');
  });

  console.log('📋 To fix these violations:');
  console.log('1. Check if the SVG already exists in components/Svgs.tsx');
  console.log('2. If it exists, import and use the existing component');
  console.log('3. If it doesn\'t exist, add it to components/Svgs.tsx following the naming convention');
  console.log('4. Replace the inline SVG with the centralized component');
  console.log('');
  console.log('📖 See SVG_COMPONENT_GUIDE.md for detailed instructions');
  console.log('📖 See SVG_DEVELOPMENT_GUIDELINES.md for best practices');

  process.exit(1);
}

// Add command line options
const args = process.argv.slice(2);
const isVerbose = args.includes('--verbose') || args.includes('-v');
const isQuiet = args.includes('--quiet') || args.includes('-q');

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
SVG Inline Checker

Usage: npm run svg:check [options]

Options:
  --verbose, -v    Show detailed output
  --quiet, -q      Show minimal output
  --help, -h       Show this help message

Examples:
  npm run svg:check
  npm run svg:check --verbose
  npm run svg:check --quiet
`);
  process.exit(0);
}

// Run the check
checkInlineSvgs().catch(error => {
  console.error('❌ Error checking for inline SVGs:', error);
  process.exit(1);
});