/**
 * File system scanning utilities for .tsx and .jsx files
 * Requirements: 1.1, 1.5
 */

import * as fs from 'fs';
import * as path from 'path';
import { ScanOptions } from './types';

export class FileScanner {
  private readonly defaultOptions: Required<ScanOptions> = {
    rootDir: '.',
    extensions: ['.tsx', '.jsx'],
    excludeDirs: ['node_modules', '.next', 'dist', 'build', 'coverage'],
    includeContext: true,
    contextLines: 3
  };

  constructor(private options: ScanOptions = {}) {
    this.options = { ...this.defaultOptions, ...options };
  }

  /**
   * Scan directory recursively for React component files
   * @param dir Directory to scan
   * @returns Array of file paths
   */
  public async scanDirectory(dir?: string): Promise<string[]> {
    const scanDir = dir || this.options.rootDir!;
    const files: string[] = [];

    try {
      await this.scanDirectoryRecursive(scanDir, files);
      return files.sort();
    } catch (error) {
      throw new Error(`Failed to scan directory ${scanDir}: ${error}`);
    }
  }

  /**
   * Check if a file should be included in the scan
   * @param filePath Path to the file
   * @returns True if file should be scanned
   */
  public shouldIncludeFile(filePath: string): boolean {
    const ext = path.extname(filePath);
    const fileName = path.basename(filePath);

    // Exclude the Svgs.tsx file from scanning to avoid detecting its SVG components as inline SVGs
    if (fileName === 'Svgs.tsx') {
      return false;
    }

    return this.options.extensions!.includes(ext);
  }

  /**
   * Check if a directory should be excluded from scanning
   * @param dirPath Path to the directory
   * @returns True if directory should be excluded
   */
  public shouldExcludeDirectory(dirPath: string): boolean {
    const dirName = path.basename(dirPath);
    return this.options.excludeDirs!.includes(dirName);
  }

  /**
   * Read file content safely
   * @param filePath Path to the file
   * @returns File content or null if read fails
   */
  public async readFileContent(filePath: string): Promise<string | null> {
    try {
      return await fs.promises.readFile(filePath, 'utf-8');
    } catch (error) {
      console.warn(`Failed to read file ${filePath}: ${error}`);
      return null;
    }
  }

  /**
   * Get file stats safely
   * @param filePath Path to the file
   * @returns File stats or null if stat fails
   */
  public async getFileStats(filePath: string): Promise<fs.Stats | null> {
    try {
      return await fs.promises.stat(filePath);
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract context lines around a specific line number
   * @param content File content
   * @param lineNumber Target line number (1-based)
   * @returns Context string with surrounding lines
   */
  public extractContext(content: string, lineNumber: number): string {
    const lines = content.split('\n');
    const contextLines = this.options.contextLines!;
    const startLine = Math.max(0, lineNumber - contextLines - 1);
    const endLine = Math.min(lines.length, lineNumber + contextLines);

    const contextWithNumbers = lines
      .slice(startLine, endLine)
      .map((line, index) => {
        const actualLineNumber = startLine + index + 1;
        const marker = actualLineNumber === lineNumber ? '>' : ' ';
        return `${marker} ${actualLineNumber.toString().padStart(3)}: ${line}`;
      })
      .join('\n');

    return contextWithNumbers;
  }

  /**
   * Get relative path from the root directory
   * @param absolutePath Absolute file path
   * @returns Relative path from root directory
   */
  public getRelativePath(absolutePath: string): string {
    const rootDir = path.resolve(this.options.rootDir!);
    return path.relative(rootDir, absolutePath);
  }

  /**
   * Recursive directory scanning implementation
   * @param dir Directory to scan
   * @param files Array to collect file paths
   */
  private async scanDirectoryRecursive(dir: string, files: string[]): Promise<void> {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!this.shouldExcludeDirectory(fullPath)) {
          await this.scanDirectoryRecursive(fullPath, files);
        }
      } else if (entry.isFile() && this.shouldIncludeFile(fullPath)) {
        files.push(fullPath);
      }
    }
  }
}

/**
 * Utility function to create a file scanner with default options
 * @param options Optional scan options
 * @returns Configured FileScanner instance
 */
export function createFileScanner(options?: ScanOptions): FileScanner {
  return new FileScanner(options);
}

/**
 * Quick utility to scan for React component files
 * @param rootDir Root directory to scan
 * @returns Promise resolving to array of file paths
 */
export async function scanForReactFiles(rootDir = '.'): Promise<string[]> {
  const scanner = createFileScanner({ rootDir });
  return scanner.scanDirectory();
}