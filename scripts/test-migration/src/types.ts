/**
 * Core types for test file migration system
 */

export interface TestFileInfo {
  currentPath: string;
  targetPath: string;
  sourceFilePath: string;
  testType: 'unit' | 'integration' | 'e2e' | 'property';
  imports: ImportStatement[];
}

export interface ImportStatement {
  originalPath: string;
  updatedPath: string;
  isRelative: boolean;
  lineNumber: number;
}

export interface MigrationPlan {
  backendTests: TestFileInfo[];
  frontendTests: TestFileInfo[];
  totalFiles: number;
  conflicts: string[];
}

export interface FileDiscoveryOptions {
  sourceDirectories: string[];
  testPatterns: string[];
  excludePatterns: string[];
  includeSubdirectories: boolean;
}

export interface DiscoveredTestFile {
  filePath: string;
  fileName: string;
  directory: string;
  relativePath: string;
  testType: 'unit' | 'integration' | 'e2e' | 'property';
  sourceType: 'backend' | 'frontend';
}

export interface MigrationConfig {
  backendSourceDir: string;
  backendTestDir: string;
  frontendSourceDir: string;
  frontendTestDir: string;
  dryRun: boolean;
  verbose: boolean;
}