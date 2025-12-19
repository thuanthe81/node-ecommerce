import { TestMigrationSystem } from '../index';
import { MigrationConfig } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';
import { tmpdir } from 'os';

describe('Migration Orchestration', () => {
  let tempDir: string;
  let config: MigrationConfig;
  let system: TestMigrationSystem;

  beforeEach(async () => {
    // Create temporary directory structure
    tempDir = await fs.mkdtemp(path.join(tmpdir(), 'migration-test-'));

    const backendSrc = path.join(tempDir, 'backend', 'src');
    const backendTest = path.join(tempDir, 'backend', 'test');
    const frontendComponents = path.join(tempDir, 'frontend', 'components');
    const frontendTests = path.join(tempDir, 'frontend', '__tests__');

    await fs.mkdir(backendSrc, { recursive: true });
    await fs.mkdir(backendTest, { recursive: true });
    await fs.mkdir(frontendComponents, { recursive: true });
    await fs.mkdir(frontendTests, { recursive: true });

    config = {
      backendSourceDir: backendSrc,
      backendTestDir: backendTest,
      frontendSourceDir: frontendComponents,
      frontendTestDir: frontendTests,
      dryRun: true,
      verbose: false
    };

    system = new TestMigrationSystem(config);
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('System Initialization', () => {
    it('should initialize successfully with valid configuration', async () => {
      const result = await system.initialize();

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail initialization with invalid directories', async () => {
      const invalidSystem = new TestMigrationSystem({
        ...config,
        backendSourceDir: '/nonexistent/path'
      });

      const result = await invalidSystem.initialize();

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Pre-migration Validation', () => {
    it('should perform pre-migration validation', async () => {
      // Create a test file
      const testFile = path.join(config.backendSourceDir, 'auth', 'auth.service.spec.ts');
      await fs.mkdir(path.dirname(testFile), { recursive: true });
      await fs.writeFile(testFile, `
        import { AuthService } from './auth.service';

        describe('AuthService', () => {
          it('should work', () => {
            expect(true).toBe(true);
          });
        });
      `);

      // Discover files
      const discoveredFiles = await system.discoverTestFiles();
      expect(discoveredFiles).toHaveLength(1);

      // Calculate target paths
      const pathMappingResult = await system.calculateTargetPaths(discoveredFiles);
      expect(pathMappingResult.mappings).toHaveLength(1);

      // Analyze imports
      const importMap = await system.analyzeImports(discoveredFiles, pathMappingResult);
      expect(importMap.size).toBe(1);

      // Perform pre-migration validation
      const validation = await system.validatePreMigration(
        discoveredFiles,
        pathMappingResult,
        importMap
      );

      expect(validation).toBeDefined();
      expect(validation.checks).toBeDefined();
      expect(validation.checks.sourceDirectoriesExist).toBe(true);
      expect(validation.checks.targetDirectoriesWritable).toBe(true);
    });
  });

  describe('Rollback Plan Management', () => {
    it('should create and list rollback plans', async () => {
      // Create a test file
      const testFile = path.join(config.backendSourceDir, 'test.spec.ts');
      await fs.writeFile(testFile, 'test content');

      const discoveredFiles = await system.discoverTestFiles();
      const pathMappingResult = await system.calculateTargetPaths(discoveredFiles);

      const backupDir = path.join(tempDir, 'backup');
      await fs.mkdir(backupDir, { recursive: true });

      // Create rollback plan
      const plan = await system.createRollbackPlan(
        discoveredFiles,
        pathMappingResult,
        backupDir
      );

      expect(plan.id).toBeDefined();
      expect(plan.timestamp).toBeInstanceOf(Date);
      expect(plan.backupDirectory).toBe(backupDir);

      // List rollback plans
      const plans = await system.listRollbackPlans();
      expect(plans.length).toBeGreaterThan(0);
      expect(plans[0].id).toBe(plan.id);
    });

    it('should verify rollback possibility', async () => {
      // Create a test file
      const testFile = path.join(config.backendSourceDir, 'test.spec.ts');
      await fs.writeFile(testFile, 'test content');

      const discoveredFiles = await system.discoverTestFiles();
      const pathMappingResult = await system.calculateTargetPaths(discoveredFiles);

      const backupDir = path.join(tempDir, 'backup');
      await fs.mkdir(backupDir, { recursive: true });

      const plan = await system.createRollbackPlan(
        discoveredFiles,
        pathMappingResult,
        backupDir
      );

      // Verify rollback is possible (should be true since backup directory exists)
      const verification = await system.verifyRollbackPossible(plan.id);

      expect(verification.possible).toBe(true);
      expect(verification.errors.length).toBe(0);
    });
  });

  describe('Complete Migration Workflow', () => {
    it('should run complete migration workflow in dry run mode', async () => {
      // Create test files
      const testFile1 = path.join(config.backendSourceDir, 'auth', 'auth.service.spec.ts');
      const testFile2 = path.join(config.frontendSourceDir, 'Button', 'Button.test.tsx');

      await fs.mkdir(path.dirname(testFile1), { recursive: true });
      await fs.mkdir(path.dirname(testFile2), { recursive: true });

      await fs.writeFile(testFile1, `
        import { AuthService } from './auth.service';
        describe('AuthService', () => {
          it('should work', () => {
            expect(true).toBe(true);
          });
        });
      `);

      await fs.writeFile(testFile2, `
        import { Button } from './Button';
        describe('Button', () => {
          it('should render', () => {
            expect(true).toBe(true);
          });
        });
      `);

      // Run complete migration
      const result = await system.runMigration({
        createBackup: true,
        cleanupEmptyDirs: true,
        skipPreValidation: false,
        skipPostValidation: false,
        autoRollbackOnFailure: true
      });

      expect(result).toBeDefined();
      expect(result.summary.totalFiles).toBe(2);
      expect(result.validationResults?.preValidation).toBeDefined();

      // In dry run mode, files shouldn't actually be migrated
      expect(result.summary.migratedFiles).toBe(0);
    });

    it('should handle migration with no test files', async () => {
      const result = await system.runMigration();

      expect(result.success).toBe(true);
      expect(result.summary.totalFiles).toBe(0);
      expect(result.warnings).toContain('No test files found to migrate');
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration correctly', async () => {
      const originalConfig = system.getConfig();
      expect(originalConfig.verbose).toBe(false);

      system.updateConfig({ verbose: true });

      const updatedConfig = system.getConfig();
      expect(updatedConfig.verbose).toBe(true);
    });
  });
});