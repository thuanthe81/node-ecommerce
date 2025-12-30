# Design Document: SVG Consolidation

## Overview

This design document outlines the approach for consolidating all inline SVG elements in the frontend codebase into the centralized `Svgs.tsx` file. Based on initial analysis, the codebase already follows good practices with most SVGs centralized, but this process will ensure complete consolidation and establish robust patterns for future development.

The consolidation will involve a systematic audit of the codebase, identification of any remaining inline SVGs, creation of reusable SVG components, and replacement of inline usage with centralized imports.

## Architecture

### Current State Analysis

The project already has a well-established SVG management system:

- **Centralized Location**: `frontend/components/Svgs.tsx` serves as the single source of truth
- **Consistent Patterns**: All examined components import SVGs from `@/components/Svgs`
- **Type Safety**: Uses `SvgProps` type extending `React.SVGProps<SVGSVGElement>`
- **Accessibility**: Proper `aria-hidden="true"` attributes are consistently applied

### Target Architecture

```
frontend/components/Svgs.tsx
├── Type Definitions
│   ├── SvgProps (React.SVGProps<SVGSVGElement>)
│   └── ImageProps (for special cases like Zalo)
├── SVG Components
│   ├── Navigation Icons (SvgMenu, SvgClose, SvgChevronRight, etc.)
│   ├── UI Icons (SvgCart, SvgCheck, SvgPlus, etc.)
│   ├── Social Media Icons (SvgFacebook, SvgTwitter, etc.)
│   └── Utility Icons (SvgSearch, SvgUser, SvgSettings, etc.)
└── Export Pattern (named exports)
```

## Components and Interfaces

### Core Types

```typescript
export type SvgProps = React.SVGProps<SVGSVGElement>
export type ImageProps = {
  width?: number;
  height?: number;
  className?: string;
}
```

### SVG Component Pattern

```typescript
export const SvgComponentName = (props: SvgProps) => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="..." />
  </svg>
)
```

### Usage Pattern in Components

```typescript
import { SvgComponentName } from '@/components/Svgs';

// In component JSX
<SvgComponentName className="w-6 h-6" aria-hidden="true" />
```

## Data Models

### SVG Audit Data Structure

```typescript
interface InlineSvgAudit {
  filePath: string;
  lineNumber: number;
  svgContent: string;
  context: string;
  proposedComponentName: string;
  usageCount: number;
  hasCustomProps: boolean;
  accessibilityAttributes: string[];
}
```

### SVG Component Metadata

```typescript
interface SvgComponentInfo {
  name: string;
  category: 'navigation' | 'ui' | 'social' | 'utility';
  viewBox: string;
  hasStroke: boolean;
  hasFill: boolean;
  isCustomizable: boolean;
  usageLocations: string[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Let me analyze the acceptance criteria to determine testable properties:

<function_calls>
<invoke name="prework">
<parameter name="featureName">svg-consolidation

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

After analyzing the acceptance criteria, I've identified the following testable properties:

### Property 1: Complete SVG Discovery
*For any* codebase containing inline SVG elements, the scanner should find all SVG elements in .tsx and .jsx files without false negatives
**Validates: Requirements 1.1, 1.5**

### Property 2: Accurate SVG Classification
*For any* found SVG element, the system should correctly classify it as either an inline SVG or an existing SVG component import
**Validates: Requirements 1.4**

### Property 3: Complete Audit Metadata
*For any* discovered inline SVG, all required metadata fields (location, context, properties) should be populated correctly
**Validates: Requirements 1.2**

### Property 4: Naming Convention Consistency
*For any* generated SVG component, the name should follow the existing "SvgComponentName" pattern
**Validates: Requirements 2.1**

### Property 5: Type Safety Preservation
*For any* generated SVG component, it should accept SvgProps and maintain TypeScript type safety
**Validates: Requirements 2.2, 4.3**

### Property 6: Property Preservation
*For any* SVG with customizable properties (stroke, fill, size), those properties should remain customizable after consolidation
**Validates: Requirements 2.3**

### Property 7: Import Statement Correctness
*For any* replaced inline SVG, the corresponding import statement should be correctly added and formatted
**Validates: Requirements 3.1**

### Property 8: Props and Styling Preservation
*For any* replaced inline SVG, all original props and styling should be preserved in the component usage
**Validates: Requirements 3.2**

### Property 9: Code Pattern Consistency
*For any* generated SVG component, it should follow the existing TypeScript patterns used in Svgs.tsx
**Validates: Requirements 4.1**

### Property 10: Code Formatting Compliance
*For any* generated or modified code, it should pass Prettier formatting validation
**Validates: Requirements 4.2**

### Property 11: Accessibility Preservation
*For any* SVG with accessibility attributes (aria-hidden, aria-label), those attributes should be preserved after consolidation
**Validates: Requirements 4.4**

### Property 12: Export Pattern Consistency
*For any* new SVG component, it should follow the existing export pattern in Svgs.tsx
**Validates: Requirements 4.5**

### Property 13: Rendering Validation
*For any* consolidated SVG component, it should render without errors in the React application
**Validates: Requirements 5.1**

### Property 14: Interactive Element Preservation
*For any* SVG with interactive elements (hover, click handlers), those interactions should work correctly after consolidation
**Validates: Requirements 5.2**

### Property 15: Complete Consolidation Validation
*For any* codebase after consolidation, a subsequent scan should find zero inline SVG elements
**Validates: Requirements 5.3**

### Property 16: TypeScript Compilation Success
*For any* codebase after consolidation, TypeScript compilation should succeed without errors related to SVG imports
**Validates: Requirements 5.4**

### Property 17: Error Message Quality
*For any* validation failure, the error message should be informative and include actionable remediation steps
**Validates: Requirements 5.5**

## Error Handling

### SVG Discovery Errors
- **File Access Errors**: Handle cases where files cannot be read due to permissions or corruption
- **Parse Errors**: Gracefully handle malformed JSX/TSX files that cannot be parsed
- **Large File Handling**: Implement timeouts and memory limits for very large files

### Component Generation Errors
- **Naming Conflicts**: Detect and resolve naming conflicts with existing SVG components
- **Invalid SVG Content**: Validate SVG syntax before creating components
- **Type Generation Errors**: Handle cases where TypeScript types cannot be inferred

### File Modification Errors
- **Write Permission Errors**: Handle cases where files cannot be modified
- **Backup and Recovery**: Create backups before modifications and provide rollback capability
- **Concurrent Modification**: Detect and handle cases where files are modified during processing

### Validation Errors
- **Rendering Failures**: Detect and report SVG components that fail to render
- **TypeScript Compilation Errors**: Provide detailed error messages for compilation failures
- **Import Resolution Errors**: Handle cases where SVG imports cannot be resolved

## Testing Strategy

### Dual Testing Approach
The testing strategy combines unit tests for specific functionality and property-based tests for comprehensive validation:

**Unit Tests:**
- Test specific SVG discovery scenarios with known test files
- Validate component generation with sample SVG content
- Test error handling with malformed inputs
- Verify documentation generation with sample data

**Property-Based Tests:**
- Generate random SVG content and validate discovery accuracy
- Test component generation with various SVG patterns
- Validate consolidation completeness across different codebase structures
- Test error handling with randomly generated invalid inputs

### Property Test Configuration
- **Minimum 100 iterations** per property test to ensure comprehensive coverage
- Each property test references its corresponding design document property
- Tests use the tag format: **Feature: svg-consolidation, Property {number}: {property_text}**

### Test Categories

1. **Discovery Tests**
   - Validate SVG element detection across different file types
   - Test classification accuracy between inline SVGs and imports
   - Verify metadata completeness for discovered SVGs

2. **Generation Tests**
   - Test component naming convention adherence
   - Validate TypeScript type generation
   - Verify code formatting compliance

3. **Consolidation Tests**
   - Test import statement generation
   - Validate prop and styling preservation
   - Verify accessibility attribute preservation

4. **Validation Tests**
   - Test rendering validation for generated components
   - Validate TypeScript compilation success
   - Verify complete consolidation (no remaining inline SVGs)

5. **Integration Tests**
   - End-to-end consolidation workflow testing
   - Cross-component interaction validation
   - Performance testing with large codebases

### Testing Tools
- **Jest** for unit testing framework
- **fast-check** for property-based testing
- **TypeScript Compiler API** for compilation validation
- **Prettier API** for code formatting validation
- **React Testing Library** for component rendering tests