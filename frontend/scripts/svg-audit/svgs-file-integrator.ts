/**
 * Svgs.tsx File Integration System
 * Requirements: 2.5, 4.5
 *
 * Add new components to existing Svgs.tsx file structure
 * Maintain alphabetical ordering and category organization
 * Preserve existing export patterns and formatting
 */

import * as fs from 'fs';
import * as path from 'path';
import { GeneratedComponent } from './component-generator';
import { SvgComponentInfo } from './types';

export interface SvgsFileIntegration {
  /** Path to the Svgs.tsx file */
  filePath: string;
  /** Current content of the file */
  currentContent: string;
  /** Parsed existing components */
  existingComponents: ExistingComponent[];
  /** Type definitions found in the file */
  typeDefinitions: string[];
}

export interface ExistingComponent {
  /** Component name */
  name: string;
  /** Full component code */
  code: string;
  /** Line number where component starts */
  startLine: number;
  /** Line number where component ends */
  endLine: number;
  /** Estimated category based on name */
  category: string;
}

export interface IntegrationResult {
  /** Updated file content */
  updatedContent: string;
  /** List of components that were added */
  addedComponents: string[];
  /** List of components that were updated */
  updatedComponents: string[];
  /** Any warnings or issues encountered */
  warnings: string[];
  /** Whether the integration was successful */
  success: boolean;
}

export class SvgsFileIntegrator {
  private readonly svgsFilePath: string;

  constructor(frontendDir: string = 'frontend') {
    this.svgsFilePath = path.join(frontendDir, 'components', 'Svgs.tsx');
  }

  /**
   * Load and parse the existing Svgs.tsx file
   */
  async loadSvgsFile(): Promise<SvgsFileIntegration> {
    if (!fs.existsSync(this.svgsFilePath)) {
      throw new Error(`Svgs.tsx file not found at ${this.svgsFilePath}`);
    }

    const currentContent = fs.readFileSync(this.svgsFilePath, 'utf-8');
    const existingComponents = this.parseExistingComponents(currentContent);
    const typeDefinitions = this.extractTypeDefinitions(currentContent);

    return {
      filePath: this.svgsFilePath,
      currentContent,
      existingComponents,
      typeDefinitions
    };
  }

  /**
   * Integrate new components into the Svgs.tsx file
   */
  async integrateComponents(
    newComponents: GeneratedComponent[],
    options: {
      dryRun?: boolean;
      preserveOrder?: boolean;
      backupOriginal?: boolean;
    } = {}
  ): Promise<IntegrationResult> {
    const svgsFile = await this.loadSvgsFile();
    const warnings: string[] = [];
    const addedComponents: string[] = [];
    const updatedComponents: string[] = [];

    // Check for naming conflicts
    const existingNames = svgsFile.existingComponents.map(c => c.name);
    const conflictingComponents = newComponents.filter(c =>
      existingNames.includes(c.name)
    );

    if (conflictingComponents.length > 0) {
      warnings.push(
        `Found naming conflicts: ${conflictingComponents.map(c => c.name).join(', ')}`
      );
    }

    // Filter out conflicting components (don't overwrite existing ones)
    const componentsToAdd = newComponents.filter(c =>
      !existingNames.includes(c.name)
    );

    if (componentsToAdd.length === 0) {
      return {
        updatedContent: svgsFile.currentContent,
        addedComponents: [],
        updatedComponents: [],
        warnings: ['No new components to add'],
        success: true
      };
    }

    // Generate updated content
    const updatedContent = this.generateUpdatedContent(
      svgsFile,
      componentsToAdd,
      options.preserveOrder || false
    );

    // Create backup if requested
    if (options.backupOriginal && !options.dryRun) {
      const backupPath = `${this.svgsFilePath}.backup.${Date.now()}`;
      fs.writeFileSync(backupPath, svgsFile.currentContent);
      warnings.push(`Backup created at ${backupPath}`);
    }

    // Write updated content if not dry run
    if (!options.dryRun) {
      fs.writeFileSync(this.svgsFilePath, updatedContent);
    }

    addedComponents.push(...componentsToAdd.map(c => c.name));

    return {
      updatedContent,
      addedComponents,
      updatedComponents,
      warnings,
      success: true
    };
  }

  /**
   * Parse existing components from the file content
   */
  private parseExistingComponents(content: string): ExistingComponent[] {
    const components: ExistingComponent[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Look for component export pattern
      const exportMatch = line.match(/^export const (Svg\w+) = \(props: \w+\) => \(/);
      if (exportMatch) {
        const componentName = exportMatch[1];
        const startLine = i;

        // Find the end of the component (look for closing parenthesis and semicolon)
        let endLine = i;
        let openParens = 0;
        let foundStart = false;

        for (let j = i; j < lines.length; j++) {
          const currentLine = lines[j];

          // Count parentheses to find the end
          for (const char of currentLine) {
            if (char === '(') {
              openParens++;
              foundStart = true;
            } else if (char === ')') {
              openParens--;
              if (foundStart && openParens === 0) {
                endLine = j;
                break;
              }
            }
          }

          if (foundStart && openParens === 0) {
            break;
          }
        }

        const componentCode = lines.slice(startLine, endLine + 1).join('\n');
        const category = this.estimateCategory(componentName);

        components.push({
          name: componentName,
          code: componentCode,
          startLine,
          endLine,
          category
        });
      }
    }

    return components;
  }

  /**
   * Extract type definitions from the file
   */
  private extractTypeDefinitions(content: string): string[] {
    const typeDefinitions: string[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.startsWith('export type ') || line.startsWith('type ')) {
        typeDefinitions.push(line.trim());
      }
    }

    return typeDefinitions;
  }

  /**
   * Estimate component category based on name
   */
  private estimateCategory(componentName: string): string {
    const name = componentName.toLowerCase();

    if (name.includes('chevron') || name.includes('arrow') ||
        name.includes('menu') || name.includes('home') || name.includes('nav')) {
      return 'navigation';
    }

    if (name.includes('facebook') || name.includes('twitter') ||
        name.includes('instagram') || name.includes('social') ||
        name.includes('whatsapp') || name.includes('zalo')) {
      return 'social';
    }

    if (name.includes('settings') || name.includes('config') ||
        name.includes('tool') || name.includes('search')) {
      return 'utility';
    }

    if (name.includes('document') || name.includes('file') ||
        name.includes('image') || name.includes('content')) {
      return 'content';
    }

    return 'ui';
  }

  /**
   * Generate updated file content with new components
   */
  private generateUpdatedContent(
    svgsFile: SvgsFileIntegration,
    newComponents: GeneratedComponent[],
    preserveOrder: boolean
  ): string {
    const lines = svgsFile.currentContent.split('\n');

    // Find where to insert new components (after the last existing component)
    let insertionPoint = lines.length;

    // Find the last component export
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].match(/^export const Svg\w+ = \(props: \w+\) => \(/)) {
        // Find the end of this component
        let openParens = 0;
        let foundStart = false;

        for (let j = i; j < lines.length; j++) {
          const currentLine = lines[j];

          for (const char of currentLine) {
            if (char === '(') {
              openParens++;
              foundStart = true;
            } else if (char === ')') {
              openParens--;
              if (foundStart && openParens === 0) {
                insertionPoint = j + 1;
                break;
              }
            }
          }

          if (foundStart && openParens === 0) {
            break;
          }
        }
        break;
      }
    }

    // Prepare new component code
    const newComponentsCode = newComponents.map(component => {
      return '\n' + component.code;
    }).join('\n');

    // Insert new components
    const beforeInsertion = lines.slice(0, insertionPoint);
    const afterInsertion = lines.slice(insertionPoint);

    const updatedLines = [
      ...beforeInsertion,
      ...newComponentsCode.split('\n'),
      ...afterInsertion
    ];

    // If preserveOrder is true, sort components alphabetically
    if (preserveOrder) {
      return this.sortComponentsAlphabetically(updatedLines.join('\n'));
    }

    return updatedLines.join('\n');
  }

  /**
   * Sort components alphabetically while preserving file structure
   */
  private sortComponentsAlphabetically(content: string): string {
    const lines = content.split('\n');
    const components: { name: string; code: string; startLine: number; endLine: number }[] = [];
    const nonComponentLines: { line: string; index: number }[] = [];

    // Extract all components and non-component lines
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const exportMatch = line.match(/^export const (Svg\w+) = \(props: \w+\) => \(/);

      if (exportMatch) {
        const componentName = exportMatch[1];
        const startLine = i;

        // Find component end
        let endLine = i;
        let openParens = 0;
        let foundStart = false;

        for (let j = i; j < lines.length; j++) {
          const currentLine = lines[j];

          for (const char of currentLine) {
            if (char === '(') {
              openParens++;
              foundStart = true;
            } else if (char === ')') {
              openParens--;
              if (foundStart && openParens === 0) {
                endLine = j;
                break;
              }
            }
          }

          if (foundStart && openParens === 0) {
            break;
          }
        }

        const componentCode = lines.slice(startLine, endLine + 1).join('\n');
        components.push({
          name: componentName,
          code: componentCode,
          startLine,
          endLine
        });

        i = endLine + 1;
      } else {
        nonComponentLines.push({ line, index: i });
        i++;
      }
    }

    // Sort components alphabetically
    components.sort((a, b) => a.name.localeCompare(b.name));

    // Find where components should be inserted (after imports and types)
    let componentInsertionPoint = 0;
    for (let j = 0; j < nonComponentLines.length; j++) {
      const { line } = nonComponentLines[j];
      if (line.startsWith('export const Svg') || line.trim() === '') {
        continue;
      }
      if (line.startsWith('import ') || line.startsWith('export type ') || line.startsWith('type ')) {
        componentInsertionPoint = j + 1;
      }
    }

    // Rebuild the file
    const result: string[] = [];

    // Add imports and types
    for (let j = 0; j < componentInsertionPoint; j++) {
      if (j < nonComponentLines.length) {
        result.push(nonComponentLines[j].line);
      }
    }

    // Add empty line before components
    if (result.length > 0 && result[result.length - 1].trim() !== '') {
      result.push('');
    }

    // Add sorted components
    components.forEach((component, index) => {
      if (index > 0) {
        result.push(''); // Empty line between components
      }
      result.push(component.code);
    });

    // Add any remaining non-component lines
    for (let j = componentInsertionPoint; j < nonComponentLines.length; j++) {
      const { line } = nonComponentLines[j];
      if (!line.startsWith('export const Svg')) {
        result.push(line);
      }
    }

    return result.join('\n');
  }

  /**
   * Validate the updated file content
   */
  validateUpdatedContent(content: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for required imports
    if (!content.includes("import React from 'react'")) {
      errors.push('Missing React import');
    }

    // Check for type definitions
    if (!content.includes('export type SvgProps')) {
      errors.push('Missing SvgProps type definition');
    }

    // Check for proper component structure
    const componentMatches = content.match(/export const Svg\w+ = \(props: \w+\) => \(/g);
    if (!componentMatches || componentMatches.length === 0) {
      errors.push('No valid SVG components found');
    }

    // Check for syntax issues
    try {
      // Basic syntax validation - count parentheses
      const openParens = (content.match(/\(/g) || []).length;
      const closeParens = (content.match(/\)/g) || []).length;

      if (openParens !== closeParens) {
        errors.push('Mismatched parentheses in file');
      }
    } catch (e: any) {
      errors.push(`Syntax validation error: ${e.message}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get statistics about the current Svgs.tsx file
   */
  async getFileStatistics(): Promise<{
    totalComponents: number;
    componentsByCategory: Record<string, number>;
    fileSize: number;
    lastModified: Date;
  }> {
    const svgsFile = await this.loadSvgsFile();
    const stats = fs.statSync(this.svgsFilePath);

    const componentsByCategory: Record<string, number> = {};
    svgsFile.existingComponents.forEach(component => {
      const category = component.category;
      componentsByCategory[category] = (componentsByCategory[category] || 0) + 1;
    });

    return {
      totalComponents: svgsFile.existingComponents.length,
      componentsByCategory,
      fileSize: stats.size,
      lastModified: stats.mtime
    };
  }
}

/**
 * Utility function to create an integrator instance
 */
export function createSvgsFileIntegrator(frontendDir?: string): SvgsFileIntegrator {
  return new SvgsFileIntegrator(frontendDir);
}

/**
 * Quick integration function for simple use cases
 */
export async function integrateComponentsToSvgsFile(
  components: GeneratedComponent[],
  options: {
    frontendDir?: string;
    dryRun?: boolean;
    backupOriginal?: boolean;
  } = {}
): Promise<IntegrationResult> {
  const integrator = createSvgsFileIntegrator(options.frontendDir);
  return integrator.integrateComponents(components, {
    dryRun: options.dryRun,
    backupOriginal: options.backupOriginal,
    preserveOrder: true // Always preserve alphabetical order
  });
}