/**
 * TypeScript interfaces for SVG audit data structures
 * Requirements: 1.1, 1.2, 1.5
 */

export interface InlineSvgAudit {
  /** File path relative to frontend directory */
  filePath: string;
  /** Line number where the SVG element starts */
  lineNumber: number;
  /** Complete SVG element content */
  svgContent: string;
  /** Surrounding JSX context for understanding usage */
  context: string;
  /** Proposed component name following existing conventions */
  proposedComponentName: string;
  /** Number of times this exact SVG appears in the codebase */
  usageCount: number;
  /** Whether the SVG has custom props that need preservation */
  hasCustomProps: boolean;
  /** List of accessibility attributes found on the SVG */
  accessibilityAttributes: string[];
  /** Visual properties extracted from the SVG */
  visualProperties: SvgVisualProperties;
}

export interface SvgVisualProperties {
  /** ViewBox attribute value */
  viewBox?: string;
  /** Width attribute value */
  width?: string;
  /** Height attribute value */
  height?: string;
  /** Fill attribute value */
  fill?: string;
  /** Stroke attribute value */
  stroke?: string;
  /** Stroke width attribute value */
  strokeWidth?: string;
  /** Whether the SVG uses currentColor */
  usesCurrentColor: boolean;
  /** List of all custom attributes */
  customAttributes: Record<string, string>;
}

export interface SvgComponentInfo {
  /** Component name (e.g., "SvgHome") */
  name: string;
  /** Category for organization */
  category: 'navigation' | 'ui' | 'social' | 'utility' | 'content';
  /** ViewBox value */
  viewBox: string;
  /** Whether the SVG has stroke properties */
  hasStroke: boolean;
  /** Whether the SVG has fill properties */
  hasFill: boolean;
  /** Whether properties can be customized via props */
  isCustomizable: boolean;
  /** List of files where this component is used */
  usageLocations: string[];
}

export interface FileAuditResult {
  /** File path relative to frontend directory */
  filePath: string;
  /** List of inline SVGs found in this file */
  inlineSvgs: InlineSvgAudit[];
  /** List of existing SVG component imports */
  existingSvgImports: string[];
  /** Whether the file was successfully parsed */
  parseSuccess: boolean;
  /** Error message if parsing failed */
  parseError?: string;
}

export interface AuditSummary {
  /** Total number of files scanned */
  totalFilesScanned: number;
  /** Number of files containing inline SVGs */
  filesWithInlineSvgs: number;
  /** Total number of inline SVGs found */
  totalInlineSvgs: number;
  /** Number of unique SVG patterns */
  uniqueSvgPatterns: number;
  /** List of all file audit results */
  fileResults: FileAuditResult[];
  /** Summary of existing SVG components */
  existingComponents: SvgComponentInfo[];
  /** Timestamp when audit was performed */
  auditTimestamp: Date;
}

export interface ScanOptions {
  /** Root directory to scan (default: frontend) */
  rootDir?: string;
  /** File extensions to include */
  extensions?: string[];
  /** Directories to exclude from scanning */
  excludeDirs?: string[];
  /** Whether to include detailed context in results */
  includeContext?: boolean;
  /** Maximum context lines to capture around SVG */
  contextLines?: number;
}