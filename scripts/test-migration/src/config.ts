import * as path from 'path';
import { MigrationConfig } from './types';

/**
 * Default configuration for test file migration
 */
export const DEFAULT_CONFIG: MigrationConfig = {
  backendSourceDir: path.resolve(process.cwd(), '../../backend/src'),
  backendTestDir: path.resolve(process.cwd(), '../../backend/test'),
  frontendSourceDir: path.resolve(process.cwd(), '../../frontend'),
  frontendTestDir: path.resolve(process.cwd(), '../../frontend/__tests__'),
  dryRun: false,
  verbose: false
};

/**
 * Load configuration with overrides
 */
export function loadConfig(overrides: Partial<MigrationConfig> = {}): MigrationConfig {
  return {
    ...DEFAULT_CONFIG,
    ...overrides
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: MigrationConfig): { valid: boolean, errors: string[] } {
  const errors: string[] = [];

  if (!config.backendSourceDir) {
    errors.push('Backend source directory is required');
  }

  if (!config.backendTestDir) {
    errors.push('Backend test directory is required');
  }

  if (!config.frontendSourceDir) {
    errors.push('Frontend source directory is required');
  }

  if (!config.frontendTestDir) {
    errors.push('Frontend test directory is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}