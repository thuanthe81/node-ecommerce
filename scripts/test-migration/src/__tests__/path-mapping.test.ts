import * as path from 'path';
import { PathMapper } from '../path-mapping';
import { MigrationConfig, DiscoveredTestFile } from '../types';

describe('PathMapper', () => {
  let pathMapper: PathMapper;
  let config: MigrationConfig;

  beforeEach(() => {
    config = {
      backendSourceDir: '/project/backend/src',
      backendTestDir: '/project/backend/test',
      frontendSourceDir: '/project/frontend/components',
      frontendTestDir: '/project/frontend/__tests__',
      dryRun: false,
      verbose: false
    };
    pathMapper = new PathMapper(config);
  });

  describe('calculateTargetPath', () => {
    it('should calculate correct target path for backend test files', () => {
      const discoveredFile: DiscoveredTestFile = {
        filePath: '/project/backend/src/auth/auth.service.spec.ts',
        fileName: 'auth.service.spec.ts',
        directory: '/project/backend/src/auth',
        relativePath: 'auth/auth.service.spec.ts',
        testType: 'unit',
        sourceType: 'backend'
      };

      const targetPath = pathMapper.calculateTargetPath(discoveredFile);
      expect(targetPath).toBe('/project/backend/test/auth/auth.service.spec.ts');
    });

    it('should calculate correct target path for frontend test files', () => {
      const discoveredFile: DiscoveredTestFile = {
        filePath: '/project/frontend/components/Header/Header.test.tsx',
        fileName: 'Header.test.tsx',
        directory: '/project/frontend/components/Header',
        relativePath: 'Header/Header.test.tsx',
        testType: 'unit',
        sourceType: 'frontend'
      };

      const targetPath = pathMapper.calculateTargetPath(discoveredFile);
      expect(targetPath).toBe('/project/frontend/__tests__/components/Header/Header.test.tsx');
    });

    it('should handle nested directory structures', () => {
      const discoveredFile: DiscoveredTestFile = {
        filePath: '/project/backend/src/pdf-generator/services/compression.service.spec.ts',
        fileName: 'compression.service.spec.ts',
        directory: '/project/backend/src/pdf-generator/services',
        relativePath: 'pdf-generator/services/compression.service.spec.ts',
        testType: 'unit',
        sourceType: 'backend'
      };

      const targetPath = pathMapper.calculateTargetPath(discoveredFile);
      expect(targetPath).toBe('/project/backend/test/pdf-generator/services/compression.service.spec.ts');
    });
  });

  describe('validateTargetPath', () => {
    it('should validate correct target paths', () => {
      const discoveredFile: DiscoveredTestFile = {
        filePath: '/project/backend/src/auth/auth.service.spec.ts',
        fileName: 'auth.service.spec.ts',
        directory: '/project/backend/src/auth',
        relativePath: 'auth/auth.service.spec.ts',
        testType: 'unit',
        sourceType: 'backend'
      };

      const targetPath = '/project/backend/test/auth/auth.service.spec.ts';
      const validation = pathMapper.validateTargetPath(discoveredFile, targetPath);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid target paths outside test directory', () => {
      const discoveredFile: DiscoveredTestFile = {
        filePath: '/project/backend/src/auth/auth.service.spec.ts',
        fileName: 'auth.service.spec.ts',
        directory: '/project/backend/src/auth',
        relativePath: 'auth/auth.service.spec.ts',
        testType: 'unit',
        sourceType: 'backend'
      };

      const targetPath = '/project/backend/src/auth/auth.service.spec.ts'; // Wrong directory
      const validation = pathMapper.validateTargetPath(discoveredFile, targetPath);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Target path must be within /project/backend/test');
    });

    it('should detect file extension mismatches', () => {
      const discoveredFile: DiscoveredTestFile = {
        filePath: '/project/backend/src/auth/auth.service.spec.ts',
        fileName: 'auth.service.spec.ts',
        directory: '/project/backend/src/auth',
        relativePath: 'auth/auth.service.spec.ts',
        testType: 'unit',
        sourceType: 'backend'
      };

      const targetPath = '/project/backend/test/auth/auth.service.spec.js'; // Wrong extension
      const validation = pathMapper.validateTargetPath(discoveredFile, targetPath);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('File extension mismatch: .ts vs .js');
    });
  });

  describe('createTestFileInfo', () => {
    it('should create TestFileInfo with calculated target path', () => {
      const discoveredFile: DiscoveredTestFile = {
        filePath: '/project/backend/src/auth/auth.service.spec.ts',
        fileName: 'auth.service.spec.ts',
        directory: '/project/backend/src/auth',
        relativePath: 'auth/auth.service.spec.ts',
        testType: 'unit',
        sourceType: 'backend'
      };

      const testFileInfo = pathMapper.createTestFileInfo(discoveredFile);

      expect(testFileInfo.currentPath).toBe('/project/backend/src/auth/auth.service.spec.ts');
      expect(testFileInfo.targetPath).toBe('/project/backend/test/auth/auth.service.spec.ts');
      expect(testFileInfo.testType).toBe('unit');
      expect(testFileInfo.imports).toEqual([]);
    });
  });

  describe('getRelativePathToSource', () => {
    it('should calculate correct relative path from test to source', () => {
      const testFilePath = '/project/backend/test/auth/auth.service.spec.ts';
      const sourceFilePath = '/project/backend/src/auth/auth.service.ts';

      const relativePath = pathMapper.getRelativePathToSource(testFilePath, sourceFilePath);
      expect(relativePath).toBe('../../src/auth/auth.service.ts');
    });

    it('should handle nested directories correctly', () => {
      const testFilePath = '/project/backend/test/pdf-generator/services/compression.service.spec.ts';
      const sourceFilePath = '/project/backend/src/pdf-generator/services/compression.service.ts';

      const relativePath = pathMapper.getRelativePathToSource(testFilePath, sourceFilePath);
      expect(relativePath).toBe('../../../src/pdf-generator/services/compression.service.ts');
    });

    it('should use forward slashes for import paths', () => {
      const testFilePath = '/project/backend/test/auth/auth.service.spec.ts';
      const sourceFilePath = '/project/backend/src/auth/auth.service.ts';

      const relativePath = pathMapper.getRelativePathToSource(testFilePath, sourceFilePath);
      expect(relativePath).not.toContain('\\');
      expect(relativePath).toContain('/');
    });
  });
});