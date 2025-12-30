# SVG Discovery and Audit System

This system provides comprehensive tools for discovering, analyzing, and auditing SVG usage in the React codebase. It helps identify inline SVG elements that should be consolidated into the centralized `Svgs.tsx` file.

## Features

- **File System Scanning**: Recursively scans `.tsx` and `.jsx` files
- **AST Parsing**: Uses TypeScript compiler API to accurately identify inline SVG elements
- **SVG Classification**: Differentiates between inline SVGs and existing component imports
- **Visual Property Extraction**: Analyzes SVG attributes, viewBox, colors, and accessibility features
- **Usage Analysis**: Tracks SVG usage patterns and generates consolidation recommendations
- **Comprehensive Reporting**: Generates detailed audit reports with actionable insights

## Requirements Coverage

This system addresses the following requirements:

- **1.1**: Identify all files containing inline SVG elements
- **1.2**: Document SVG location, usage context, and visual properties
- **1.4**: Differentiate between actual inline SVGs and existing SVG component imports
- **1.5**: Check for SVG elements in all TypeScript React files (.tsx) and JavaScript React files (.jsx)

## Core Components

### Types (`types.ts`)
Defines TypeScript interfaces for all audit data structures:
- `InlineSvgAudit`: Complete information about discovered inline SVGs
- `SvgVisualProperties`: Visual characteristics and attributes
- `SvgComponentInfo`: Metadata about existing SVG components
- `FileAuditResult`: Per-file audit results
- `AuditSummary`: Complete audit summary with statistics

### File Scanner (`file-scanner.ts`)
Handles file system operations:
- Recursive directory scanning with configurable exclusions
- File filtering by extension (.tsx, .jsx)
- Context extraction around SVG elements
- Safe file reading with error handling

### AST Parser (`ast-parser.ts`)
Performs TypeScript AST analysis:
- Accurate SVG element detection using TypeScript compiler API
- SVG attribute and property extraction
- Accessibility attribute identification
- Import statement analysis for existing SVG components
- Component name generation based on SVG characteristics

### Audit System (`audit-system.ts`)
Coordinates the complete audit process:
- Orchestrates file scanning and parsing
- Deduplicates similar SVG patterns
- Calculates usage statistics
- Generates comprehensive reports
- Provides summary analytics

## Usage

### Basic Usage

```typescript
import { performSvgAudit } from './svg-audit';

// Perform a complete audit
const summary = await performSvgAudit({
  rootDir: 'frontend',
  extensions: ['.tsx', '.jsx'],
  excludeDirs: ['node_modules', '.next', 'dist', 'build', 'coverage']
});

console.log(`Found ${summary.totalInlineSvgs} inline SVGs in ${summary.filesWithInlineSvgs} files`);
```

### Generate Report

```typescript
import { generateAuditReport } from './svg-audit';

// Generate and save a detailed report
await generateAuditReport(
  {
    rootDir: 'frontend',
    includeContext: true,
    contextLines: 3
  },
  'svg-audit-report.md'
);
```

### Advanced Usage

```typescript
import { SvgAuditSystem } from './svg-audit';

const auditSystem = new SvgAuditSystem({
  rootDir: 'frontend',
  extensions: ['.tsx', '.jsx'],
  excludeDirs: ['node_modules', '.next', 'scripts'],
  includeContext: true,
  contextLines: 5
});

const summary = await auditSystem.performAudit();
const report = auditSystem.generateReport(summary);
await auditSystem.saveReport(summary, 'detailed-audit.md');
```

## Configuration Options

```typescript
interface ScanOptions {
  rootDir?: string;           // Root directory to scan (default: 'frontend')
  extensions?: string[];      // File extensions to include (default: ['.tsx', '.jsx'])
  excludeDirs?: string[];     // Directories to exclude
  includeContext?: boolean;   // Whether to include code context
  contextLines?: number;      // Number of context lines to capture
}
```

## Output Format

### Audit Summary
```typescript
interface AuditSummary {
  totalFilesScanned: number;
  filesWithInlineSvgs: number;
  totalInlineSvgs: number;
  uniqueSvgPatterns: number;
  fileResults: FileAuditResult[];
  existingComponents: SvgComponentInfo[];
  auditTimestamp: Date;
}
```

### Inline SVG Information
```typescript
interface InlineSvgAudit {
  filePath: string;                    // Relative file path
  lineNumber: number;                  // Line number (1-based)
  svgContent: string;                  // Complete SVG element
  context: string;                     // Surrounding code context
  proposedComponentName: string;       // Suggested component name
  usageCount: number;                  // Usage frequency
  hasCustomProps: boolean;             // Has dynamic properties
  accessibilityAttributes: string[];   // Accessibility features
  visualProperties: SvgVisualProperties;
}
```

## Error Handling

The system includes comprehensive error handling:
- **File Access Errors**: Gracefully handles permission issues
- **Parse Errors**: Continues processing when individual files fail
- **Memory Management**: Handles large codebases efficiently
- **TypeScript Compilation**: Robust AST parsing with fallbacks

## Performance Considerations

- **Incremental Processing**: Processes files in batches with progress reporting
- **Memory Efficient**: Streams file content rather than loading everything into memory
- **Configurable Exclusions**: Skip unnecessary directories to improve performance
- **Context Control**: Optional context extraction to reduce processing time

## Integration

This audit system integrates with the broader SVG consolidation workflow:

1. **Discovery Phase**: Identifies all inline SVGs requiring consolidation
2. **Analysis Phase**: Provides detailed information for component generation
3. **Planning Phase**: Generates recommendations for consolidation strategy
4. **Validation Phase**: Verifies completeness after consolidation

## Testing

Run the validation script to verify system integrity:

```bash
node frontend/scripts/validate-audit-system.js
```

## Next Steps

After running the audit:

1. Review the generated report to understand current SVG usage
2. Identify high-priority SVGs for consolidation (high usage count)
3. Use the proposed component names as starting points
4. Preserve accessibility attributes and custom properties during consolidation
5. Update import statements in affected files

## Dependencies

- **TypeScript Compiler API**: For accurate AST parsing
- **Node.js File System**: For file operations
- **Path Utilities**: For cross-platform path handling

This system provides the foundation for systematic SVG consolidation while maintaining code quality and accessibility standards.