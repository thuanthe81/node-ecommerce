import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';
import { FileMigrator, MigrationResult, BatchMigrationResult } from '../file-migrator';
import { MigrationConfig, ImportStatement } from '../types';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const rmdir = promisify(fs.rmdir);
const unlink = promisify(fs.unlink);
const stat = promisify(fs.stat);

describe('FileMigrator', () => {
  let tempDir: string;
  let config: MigrationConfig;
  let migrator: FileMigrator;

  beforeEach(async () => {
    // Create temporary directory for tests
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'file-migrator-test-'));

    config = {
      backendSourceDir: path.join(tempDir, 'backend/src'),
      backendTestDir: path.join(tempDir, 'backend/test'),
      frontendSourceDir: path.join(tempDir, 'frontend/components'),
      frontendTestDir: path.join(tempDir, 'frontend/__tests__'),
      dryRun: false,
      verbose: false
    };

    migrator = new FileMigrator(config);

    // Create source directories
    await mkdir(config.backendSourceDir, { recursive: true });
    await mkdir(config.frontendSourceDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  });

  describe('createTargetDirectory', () => {
    it('should create target directory successfully', async () => {
      const targetPath = path.join(tempDir, 'backend/test/module/component.spec.ts');

      const result = await migrator.createTargetDirectory(targetPath);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      // Verify directory was created
      const targetDir = path.dirname(targetPath);
      const stats = await stat(targetDir);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should handle existing directory', async () => {
      const targetPath = path.join(tempDir, 'backend/test/existing/component.spec.ts');
      const targetDir = path.dirname(targetPath);

      // Create directory first
      await mkdir(targetDir, { recursive: true });

      const result = await migrator.createTargetDirectory(targetPath);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle dry run mode', async () => {
      const dryRunConfig = { ...config, dryRun: true, verbose: true };
      const dryRunMigrator = new FileMigrator(dryRunConfig);

      const targetPath = path.join(tempDir, 'backend/test/module/component.spec.ts');

      const result = await dryRunMigrator.createTargetDirectory(targetPath);

      expect(result.success).toBe(true);

      // Verify directory was NOT created in dry run
      const targetDir = path.dirname(targetPath);
      await expect(stat(targetDir)).rejects.toThrow();
    });
  });

  describe('updateFileContent', () => {
    it('should update import paths in file content', () => {
      const originalContent = `import { Component } from './component';
import { Service } from '../service/service';
import { Utils } from '../../utils/utils';

describe('Test', () => {
  // test content
});`;

      const imports: ImportStatement[] = [
        {
          originalPath: './component',
          updatedPath: '../../src/module/component',
          isRelative: true,
          lineNumber: 1
        },
        {
          originalPath: '../service/service',
          updatedPath: '../../src/service/service',
          isRelative: true,
          lineNumber: 2
        }
      ];

      const updatedContent = migrator.updateFileContent(originalContent, imports);

      expect(updatedContent).toContain("import { Component } from '../../src/module/component';");
      expect(updatedContent).toContain("import { Service } from '../../src/service/service';");
      expect(updatedContent).toContain("import { Utils } from '../../utils/utils';"); // unchanged
    });

    it('should handle imports with no changes', () => {
      const originalContent = `import { Component } from './component';`;

      const imports: ImportStatement[] = [
        {
          originalPath: './component',
          updatedPath: './component',
          isRelative: true,
          lineNumber: 1
        }
      ];

      const updatedContent = migrator.updateFileContent(originalContent, imports);

      expect(updatedContent).toBe(originalContent);
    });

    it('should handle multiple imports on same line', () => {
      const originalContent = `import { Component } from './component'; import { Service } from './service';`;

      const imports: ImportStatement[] = [
        {
          originalPath: './component',
          updatedPath: '../../src/component',
          isRelative: true,
          lineNumber: 1
        }
      ];

      const updatedContent = migrator.updateFileContent(originalContent, imports);

      expect(updatedContent).toContain("import { Component } from '../../src/component';");
      expect(updatedContent).toContain("import { Service } from './service';");
    });
  });

  describe('migrateFile', () => {
    it('should migrate file successfully', async () => {
      const sourceFile = path.join(config.backendSourceDir, 'component.spec.ts');
      const targetFile = path.join(config.backendTestDir, 'component.spec.ts');

      const originalContent = `import { Component } from './component';
describe('Component', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});`;

      // Create source file
      await writeFile(sourceFile, originalContent);

      const imports: ImportStatement[] = [
        {
          originalPath: './component',
          updatedPath: '../src/component',
          isRelative: true,
          lineNumber: 1
        }
      ];

      const result = await migrator.migrateFile(sourceFile, targetFile, imports);

      expect(result.success).toBe(true);
      expect(result.filePath).toBe(sourceFile);
      expect(result.targetPath).toBe(targetFile);
      expect(result.error).toBeUndefined();

      // Verify target file exists with updated content
      const targetContent = await readFile(targetFile, 'utf8');
      expect(targetContent).toContain("import { Component } from '../src/component';");

      // Verify source file was removed
      await expect(stat(sourceFile)).rejects.toThrow();
    });

    it('should handle missing source file', async () => {
      const sourceFile = path.join(config.backendSourceDir, 'nonexistent.spec.ts');
      const targetFile = path.join(config.backendTestDir, 'nonexistent.spec.ts');

      const result = await migrator.migrateFile(sourceFile, targetFile, []);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Source file does not exist');
    });

    it('should warn about existing target file', async () => {
      const sourceFile = path.join(config.backendSourceDir, 'component.spec.ts');
      const targetFile = path.join(config.backendTestDir, 'component.spec.ts');

      // Create both source and target files
      await writeFile(sourceFile, 'source content');
      await mkdir(path.dirname(targetFile), { recursive: true });
      await writeFile(targetFile, 'existing target content');

      const result = await migrator.migrateFile(sourceFile, targetFile, []);

      expect(result.success).toBe(true);
      expect(result.warnings.some(w => w.includes('Target file already exists'))).toBe(true);
    });

    it('should handle dry run mode', async () => {
      const dryRunConfig = { ...config, dryRun: true, verbose: true };
      const dryRunMigrator = new FileMigrator(dryRunConfig);

      const sourceFile = path.join(config.backendSourceDir, 'component.spec.ts');
      const targetFile = path.join(config.backendTestDir, 'component.spec.ts');

      await writeFile(sourceFile, 'test content');

      const result = await dryRunMigrator.migrateFile(sourceFile, targetFile, []);

      expect(result.success).toBe(true);

      // Verify source file still exists
      const sourceStats = await stat(sourceFile);
      expect(sourceStats.isFile()).toBe(true);

      // Verify target file was not created
      await expect(stat(targetFile)).rejects.toThrow();
    });
  });

  describe('batchMigrateFiles', () => {
    it('should migrate multiple files successfully', async () => {
      const migrations = [
        {
          filePath: path.join(config.backendSourceDir, 'component1.spec.ts'),
          targetPath: path.join(config.backendTestDir, 'component1.spec.ts'),
          imports: []
        },
        {
          filePath: path.join(config.backendSourceDir, 'component2.spec.ts'),
          targetPath: path.join(config.backendTestDir, 'component2.spec.ts'),
          imports: []
        }
      ];

      // Create source files
      for (const migration of migrations) {
        await writeFile(migration.filePath, 'test content');
      }

      const result = await migrator.batchMigrateFiles(migrations);

      expect(result.totalFiles).toBe(2);
      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
      expect(result.errors).toHaveLength(0);

      // Verify all files were migrated
      for (const migration of migrations) {
        const targetStats = await stat(migration.targetPath);
        expect(targetStats.isFile()).toBe(true);

        await expect(stat(migration.filePath)).rejects.toThrow();
      }
    });

    it('should handle mixed success and failure', async () => {
      const migrations = [
        {
          filePath: path.join(config.backendSourceDir, 'existing.spec.ts'),
          targetPath: path.join(config.backendTestDir, 'existing.spec.ts'),
          imports: []
        },
        {
          filePath: path.join(config.backendSourceDir, 'nonexistent.spec.ts'),
          targetPath: path.join(config.backendTestDir, 'nonexistent.spec.ts'),
          imports: []
        }
      ];

      // Create only the first source file
      await writeFile(migrations[0].filePath, 'test content');

      const result = await migrator.batchMigrateFiles(migrations);

      expect(result.totalFiles).toBe(2);
      expect(result.successful).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('isDirectoryEmpty', () => {
    it('should return true for empty directory', async () => {
      const emptyDir = path.join(tempDir, 'empty');
      await mkdir(emptyDir);

      const isEmpty = await migrator.isDirectoryEmpty(emptyDir);

      expect(isEmpty).toBe(true);
    });

    it('should return false for directory with files', async () => {
      const dirWithFiles = path.join(tempDir, 'with-files');
      await mkdir(dirWithFiles);
      await writeFile(path.join(dirWithFiles, 'file.txt'), 'content');

      const isEmpty = await migrator.isDirectoryEmpty(dirWithFiles);

      expect(isEmpty).toBe(false);
    });

    it('should return false for nonexistent directory', async () => {
      const nonexistentDir = path.join(tempDir, 'nonexistent');

      const isEmpty = await migrator.isDirectoryEmpty(nonexistentDir);

      expect(isEmpty).toBe(false);
    });
  });

  describe('cleanupEmptyDirectories', () => {
    it('should remove empty directories', async () => {
      const emptyDir = path.join(tempDir, 'empty');
      const nestedEmptyDir = path.join(emptyDir, 'nested');

      await mkdir(nestedEmptyDir, { recursive: true });

      const result = await migrator.cleanupEmptyDirectories([tempDir], {
        removeEmptyDirectories: true,
        preserveDirectories: [],
        dryRun: false
      });

      expect(result.removed).toContain(nestedEmptyDir);
      expect(result.removed).toContain(emptyDir);
      expect(result.errors).toHaveLength(0);

      // Verify directories were removed
      await expect(stat(nestedEmptyDir)).rejects.toThrow();
      await expect(stat(emptyDir)).rejects.toThrow();
    });

    it('should preserve specified directories', async () => {
      const preserveDir = path.join(tempDir, 'preserve');
      await mkdir(preserveDir);

      const result = await migrator.cleanupEmptyDirectories([tempDir], {
        removeEmptyDirectories: true,
        preserveDirectories: [preserveDir],
        dryRun: false
      });

      expect(result.removed).not.toContain(preserveDir);

      // Verify directory was preserved
      const stats = await stat(preserveDir);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should not remove directories with files', async () => {
      const dirWithFile = path.join(tempDir, 'with-file');
      await mkdir(dirWithFile);
      await writeFile(path.join(dirWithFile, 'file.txt'), 'content');

      const result = await migrator.cleanupEmptyDirectories([tempDir], {
        removeEmptyDirectories: true,
        preserveDirectories: [],
        dryRun: false
      });

      expect(result.removed).not.toContain(dirWithFile);

      // Verify directory still exists
      const stats = await stat(dirWithFile);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should handle dry run mode', async () => {
      const emptyDir = path.join(tempDir, 'empty');
      await mkdir(emptyDir);

      const result = await migrator.cleanupEmptyDirectories([tempDir], {
        removeEmptyDirectories: true,
        preserveDirectories: [],
        dryRun: true
      });

      expect(result.removed).toHaveLength(0);

      // Verify directory still exists in dry run
      const stats = await stat(emptyDir);
      expect(stats.isDirectory()).toBe(true);
    });
  });

  describe('validatePermissions', () => {
    it('should validate readable source files and writable target directories', async () => {
      const sourceFile = path.join(config.backendSourceDir, 'component.spec.ts');
      const targetFile = path.join(config.backendTestDir, 'component.spec.ts');

      await writeFile(sourceFile, 'test content');

      const result = await migrator.validatePermissions([sourceFile], [targetFile]);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect unreadable source files', async () => {
      const nonexistentFile = path.join(config.backendSourceDir, 'nonexistent.spec.ts');
      const targetFile = path.join(config.backendTestDir, 'target.spec.ts');

      const result = await migrator.validatePermissions([nonexistentFile], [targetFile]);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Cannot read source file'))).toBe(true);
    });
  });

  describe('createBackup', () => {
    it('should create backup of files', async () => {
      const sourceFile = path.join(config.backendSourceDir, 'component.spec.ts');
      const backupDir = path.join(tempDir, 'backup');

      await writeFile(sourceFile, 'test content');

      const result = await migrator.createBackup([sourceFile], backupDir);

      if (!result.success) {
        console.log('Backup failed with errors:', result.errors);
      }

      expect(result.success).toBe(true);
      expect(result.backupPaths).toHaveLength(1);
      expect(result.errors).toHaveLength(0);

      // Verify backup file exists
      const backupFile = result.backupPaths[0];
      const backupContent = await readFile(backupFile, 'utf8');
      expect(backupContent).toBe('test content');
    });

    it('should handle backup directory creation', async () => {
      const sourceFile = path.join(config.backendSourceDir, 'component.spec.ts');
      const backupDir = path.join(tempDir, 'nested/backup/dir');

      await writeFile(sourceFile, 'test content');

      const result = await migrator.createBackup([sourceFile], backupDir);

      expect(result.success).toBe(true);

      // Verify backup directory was created
      const stats = await stat(backupDir);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should handle multiple files with nested structure', async () => {
      const sourceFiles = [
        path.join(config.backendSourceDir, 'module1/component.spec.ts'),
        path.join(config.backendSourceDir, 'module2/service.spec.ts')
      ];
      const backupDir = path.join(tempDir, 'backup');

      // Create source files
      for (const sourceFile of sourceFiles) {
        await mkdir(path.dirname(sourceFile), { recursive: true });
        await writeFile(sourceFile, 'test content');
      }

      const result = await migrator.createBackup(sourceFiles, backupDir);

      expect(result.success).toBe(true);
      expect(result.backupPaths).toHaveLength(2);
      expect(result.errors).toHaveLength(0);

      // Verify backup structure mirrors source structure
      for (const backupPath of result.backupPaths) {
        const stats = await stat(backupPath);
        expect(stats.isFile()).toBe(true);
      }
    });
  });
});