import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { FileDiscoveryOptions, DiscoveredTestFile } from './types';

/**
 * File discovery utilities for finding test files in the source tree
 */
export class FileDiscovery {
  private readonly defaultTestPatterns = [
    '**/*.spec.ts',
    '**/*.test.ts',
    '**/*.spec.tsx',
    '**/*.test.tsx'
  ];

  private readonly defaultExcludePatterns = [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.next/**',
    '**/coverage/**'
  ];

  /**
   * Discover all test files in the specified directories
   */
  async discoverTestFiles(options: FileDiscoveryOptions): Promise<DiscoveredTestFile[]> {
    const discoveredFiles: DiscoveredTestFile[] = [];

    for (const sourceDir of options.sourceDirectories) {
      if (!fs.existsSync(sourceDir)) {
        console.warn(`Source directory does not exist: ${sourceDir}`);
        continue;
      }

      const patterns = options.testPatterns.length > 0
        ? options.testPatterns
        : this.defaultTestPatterns;

      const excludePatterns = [
        ...this.defaultExcludePatterns,
        ...options.excludePatterns
      ];

      for (const pattern of patterns) {
        const fullPattern = path.join(sourceDir, pattern);

        try {
          const files = await glob(fullPattern, {
            ignore: excludePatterns,
            absolute: true
          });

          for (const filePath of files) {
            const discoveredFile = this.analyzeTestFile(filePath, sourceDir);
            if (discoveredFile) {
              discoveredFiles.push(discoveredFile);
            }
          }
        } catch (error) {
          console.error(`Error discovering files with pattern ${fullPattern}:`, error);
        }
      }
    }

    return discoveredFiles;
  }

  /**
   * Discover test files specifically in backend source directories
   */
  async discoverBackendTestFiles(backendSrcDir: string): Promise<DiscoveredTestFile[]> {
    const options: FileDiscoveryOptions = {
      sourceDirectories: [backendSrcDir],
      testPatterns: this.defaultTestPatterns,
      excludePatterns: [],
      includeSubdirectories: true
    };

    const files = await this.discoverTestFiles(options);
    return files.map(file => ({ ...file, sourceType: 'backend' as const }));
  }

  /**
   * Discover test files specifically in frontend component directories
   */
  async discoverFrontendTestFiles(frontendComponentsDir: string): Promise<DiscoveredTestFile[]> {
    const options: FileDiscoveryOptions = {
      sourceDirectories: [frontendComponentsDir],
      testPatterns: this.defaultTestPatterns,
      excludePatterns: [],
      includeSubdirectories: true
    };

    const files = await this.discoverTestFiles(options);
    return files.map(file => ({ ...file, sourceType: 'frontend' as const }));
  }

  /**
   * Analyze a test file to extract metadata
   */
  private analyzeTestFile(filePath: string, sourceDir: string): DiscoveredTestFile | null {
    try {
      const stats = fs.statSync(filePath);
      if (!stats.isFile()) {
        return null;
      }

      const fileName = path.basename(filePath);
      const directory = path.dirname(filePath);
      const relativePath = path.relative(sourceDir, filePath);

      const testType = this.determineTestType(fileName, filePath);
      const sourceType = this.determineSourceType(sourceDir);

      return {
        filePath,
        fileName,
        directory,
        relativePath,
        testType,
        sourceType
      };
    } catch (error) {
      console.error(`Error analyzing test file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Determine the type of test based on file name and content
   */
  private determineTestType(fileName: string, filePath: string): 'unit' | 'integration' | 'e2e' | 'property' {
    const lowerFileName = fileName.toLowerCase();

    if (lowerFileName.includes('e2e') || lowerFileName.includes('end-to-end')) {
      return 'e2e';
    }

    if (lowerFileName.includes('integration')) {
      return 'integration';
    }

    if (lowerFileName.includes('property') || lowerFileName.includes('pbt')) {
      return 'property';
    }

    // Try to determine from file content for property tests
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content.includes('fast-check') || content.includes('fc.') || content.includes('property(')) {
        return 'property';
      }
    } catch (error) {
      // Ignore file read errors, default to unit test
    }

    return 'unit';
  }

  /**
   * Determine source type (backend/frontend) from directory path
   */
  private determineSourceType(sourceDir: string): 'backend' | 'frontend' {
    const normalizedPath = path.normalize(sourceDir).toLowerCase();

    if (normalizedPath.includes('backend')) {
      return 'backend';
    }

    if (normalizedPath.includes('frontend')) {
      return 'frontend';
    }

    // Default to backend if unclear
    return 'backend';
  }

  /**
   * Get all test files that should be migrated (excluding those already in test directories)
   */
  async getTestFilesToMigrate(
    backendSrcDir: string,
    backendTestDir: string,
    frontendComponentsDir: string,
    frontendTestDir: string
  ): Promise<DiscoveredTestFile[]> {
    const backendFiles = await this.discoverBackendTestFiles(backendSrcDir);
    const frontendFiles = await this.discoverFrontendTestFiles(frontendComponentsDir);

    // Filter out files that are already in test directories
    const backendFilesToMigrate = backendFiles.filter(file =>
      !file.filePath.startsWith(path.resolve(backendTestDir))
    );

    const frontendFilesToMigrate = frontendFiles.filter(file =>
      !file.filePath.startsWith(path.resolve(frontendTestDir))
    );

    return [...backendFilesToMigrate, ...frontendFilesToMigrate];
  }

  /**
   * Validate that source directories exist and are accessible
   */
  validateSourceDirectories(directories: string[]): { valid: string[], invalid: string[] } {
    const valid: string[] = [];
    const invalid: string[] = [];

    for (const dir of directories) {
      try {
        const stats = fs.statSync(dir);
        if (stats.isDirectory()) {
          valid.push(dir);
        } else {
          invalid.push(dir);
        }
      } catch (error) {
        invalid.push(dir);
      }
    }

    return { valid, invalid };
  }
}