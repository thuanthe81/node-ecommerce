/**
 * SVG Discovery and Audit System
 * Main entry point for SVG consolidation audit functionality
 * Requirements: 1.1, 1.2, 1.5
 */

// Core classes
export { FileScanner, createFileScanner, scanForReactFiles } from './file-scanner';
export { AstParser, createAstParser } from './ast-parser';
export { SvgAuditSystem, performSvgAudit, generateAuditReport } from './audit-system';

// Type definitions
export type {
  InlineSvgAudit,
  SvgVisualProperties,
  SvgComponentInfo,
  FileAuditResult,
  AuditSummary,
  ScanOptions
} from './types';

// Re-export main functionality for convenience
export { performSvgAudit as audit } from './audit-system';
export { generateAuditReport as report } from './audit-system';