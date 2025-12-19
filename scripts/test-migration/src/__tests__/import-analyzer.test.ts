import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ImportAnalyzer, ImportPathUtils } from '../import-analyzer';

describe('ImportAnalyzer', () => {
  let analyzer: ImportAnalyzer;
  let tempDir: string;

  beforeEach(() => {
    analyzer = new ImportAnalyzer();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'import-analyzer-test-'));
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('parseFile', () => {
    it('should parse import statements from TypeScript file', () => {
      const testContent = `
import { Component } from './component';
import * as utils from '../utils';
import defaultExport from '../../shared/default';
import { external } from 'external-package';

const dynamicImport = import('./dynamic');
const requireImport = require('../required');
`;

      const testFile = path.join(tempDir, 'test.ts');
      fs.writeFileSync(testFile, testContent);

      const imports = analyzer.parseFile(testFile);

      expect(imports).toHaveLength(6);

      // Check relative imports
      const relativeImports = imports.filter(imp => imp.isRelative);
      expect(relativeImports).toHaveLength(5);

      // Check non-relative imports
      const nonRelativeImports = imports.filter(imp => !imp.isRelative);
      expect(nonRelativeImports).toHaveLength(1);
      expect(nonRelativeImports[0].originalPath).toBe('external-package');
    });

    it('should handle files with no imports', () => {
      const testContent = `
const value = 42;
function test() {
  return value;
}
`;

      const testFile = path.join(tempDir, 'no-imports.ts');
      fs.writeFileSync(testFile, testContent);

      const imports = analyzer.parseFile(testFile);
      expect(imports).toHaveLength(0);
    });

    it('should throw error for non-existent file', () => {
      expect(() => {
        analyzer.parseFile('/non/existent/file.ts');
      }).toThrow('File not found');
    });
  });

  describe('calculateUpdatedImportPath', () => {
    it('should calculate correct relative path for moved test file', () => {
      const originalImportPath = '../../services/user.service';
      const currentTestPath = '/project/src/components/user/user.component.spec.ts';
      const newTestPath = '/project/test/components/user/user.component.spec.ts';
      const projectRoot = '/project';

      const updatedPath = analyzer.calculateUpdatedImportPath(
        originalImportPath,
        currentTestPath,
        newTestPath,
        projectRoot
      );

      // The original import '../../services/user.service' from '/project/src/components/user/'
      // resolves to '/project/src/services/user.service'
      // From the new location '/project/test/components/user/', the path should be
      // '../../../src/services/user.service'
      expect(updatedPath).toBe('../../../src/services/user.service');
    });

    it('should not change non-relative imports', () => {
      const originalImportPath = 'lodash';
      const currentTestPath = '/project/src/test.spec.ts';
      const newTestPath = '/project/test/test.spec.ts';
      const projectRoot = '/project';

      const updatedPath = analyzer.calculateUpdatedImportPath(
        originalImportPath,
        currentTestPath,
        newTestPath,
        projectRoot
      );

      expect(updatedPath).toBe('lodash');
    });

    it('should handle same-level moves correctly', () => {
      const originalImportPath = './helper';
      const currentTestPath = '/project/src/utils/test.spec.ts';
      const newTestPath = '/project/test/utils/test.spec.ts';
      const projectRoot = '/project';

      const updatedPath = analyzer.calculateUpdatedImportPath(
        originalImportPath,
        currentTestPath,
        newTestPath,
        projectRoot
      );

      expect(updatedPath).toBe('../../src/utils/helper');
    });
  });

  describe('updateImportsInContent', () => {
    it('should update import statements in file content', () => {
      const originalContent = `
import { Component } from './component';
import { Service } from '../service';
import { external } from 'external-package';
`;

      const imports = [
        {
          originalPath: './component',
          updatedPath: '../../src/component',
          isRelative: true,
          lineNumber: 2
        },
        {
          originalPath: '../service',
          updatedPath: '../../src/service',
          isRelative: true,
          lineNumber: 3
        },
        {
          originalPath: 'external-package',
          updatedPath: 'external-package',
          isRelative: false,
          lineNumber: 4
        }
      ];

      const updatedContent = analyzer.updateImportsInContent(originalContent, imports);

      expect(updatedContent).toContain("from '../../src/component'");
      expect(updatedContent).toContain("from '../../src/service'");
      expect(updatedContent).toContain("from 'external-package'");
    });

    it('should handle different quote styles', () => {
      const originalContent = `
import { A } from "./a";
import { B } from '../b';
import { C } from \`../c\`;
`;

      const imports = [
        {
          originalPath: './a',
          updatedPath: '../../src/a',
          isRelative: true,
          lineNumber: 2
        },
        {
          originalPath: '../b',
          updatedPath: '../../src/b',
          isRelative: true,
          lineNumber: 3
        },
        {
          originalPath: '../c',
          updatedPath: '../../src/c',
          isRelative: true,
          lineNumber: 4
        }
      ];

      const updatedContent = analyzer.updateImportsInContent(originalContent, imports);

      expect(updatedContent).toContain('from "../../src/a"');
      expect(updatedContent).toContain("from '../../src/b'");
      expect(updatedContent).toContain('from `../../src/c`');
    });
  });

  describe('validateImportPaths', () => {
    it('should validate import paths correctly', () => {
      // Create test files
      const sourceFile = path.join(tempDir, 'source.ts');
      const testFile = path.join(tempDir, 'test.spec.ts');

      fs.writeFileSync(sourceFile, 'export const value = 42;');
      fs.writeFileSync(testFile, '');

      const imports = [
        {
          originalPath: './source',
          updatedPath: './source',
          isRelative: true,
          lineNumber: 1
        },
        {
          originalPath: './nonexistent',
          updatedPath: './nonexistent',
          isRelative: true,
          lineNumber: 2
        },
        {
          originalPath: 'external-package',
          updatedPath: 'external-package',
          isRelative: false,
          lineNumber: 3
        }
      ];

      const validation = analyzer.validateImportPaths(imports, testFile, tempDir);

      expect(validation.valid).toHaveLength(2); // source file + external package
      expect(validation.invalid).toHaveLength(1); // nonexistent file
    });
  });

  describe('getTestFileImports', () => {
    it('should identify imports that reference other test files', () => {
      const testFile1 = path.join(tempDir, 'test1.spec.ts');
      const testFile2 = path.join(tempDir, 'test2.spec.ts');
      const allTestFiles = [testFile1, testFile2];

      const imports = [
        {
          originalPath: './test2.spec',
          updatedPath: './test2.spec',
          isRelative: true,
          lineNumber: 1
        },
        {
          originalPath: './source',
          updatedPath: './source',
          isRelative: true,
          lineNumber: 2
        }
      ];

      const testFileImports = analyzer.getTestFileImports(imports, testFile1, allTestFiles);

      expect(testFileImports).toHaveLength(1);
      expect(testFileImports[0].originalPath).toBe('./test2.spec');
    });
  });
});

describe('ImportPathUtils', () => {
  describe('normalizeImportPath', () => {
    it('should convert backslashes to forward slashes', () => {
      const windowsPath = '..\\src\\component';
      const normalized = ImportPathUtils.normalizeImportPath(windowsPath);
      expect(normalized).toBe('../src/component');
    });
  });

  describe('toRelativeImportPath', () => {
    it('should create correct relative import path', () => {
      const fromPath = '/project/test/components/user.spec.ts';
      const toPath = '/project/src/services/user.service.ts';

      const relativePath = ImportPathUtils.toRelativeImportPath(fromPath, toPath);
      expect(relativePath).toBe('../../src/services/user.service');
    });

    it('should remove file extensions', () => {
      const fromPath = '/project/test/test.spec.ts';
      const toPath = '/project/src/component.tsx';

      const relativePath = ImportPathUtils.toRelativeImportPath(fromPath, toPath);
      expect(relativePath).toBe('../src/component');
    });

    it('should ensure path starts with ./ or ../', () => {
      const fromPath = '/project/test/test.spec.ts';
      const toPath = '/project/test/helper.ts';

      const relativePath = ImportPathUtils.toRelativeImportPath(fromPath, toPath);
      expect(relativePath).toBe('./helper');
    });
  });

  describe('isTestFile', () => {
    it('should identify test files correctly', () => {
      expect(ImportPathUtils.isTestFile('component.test.ts')).toBe(true);
      expect(ImportPathUtils.isTestFile('service.spec.tsx')).toBe(true);
      expect(ImportPathUtils.isTestFile('__tests__/helper.ts')).toBe(true);
      expect(ImportPathUtils.isTestFile('test/utils.js')).toBe(true);
      expect(ImportPathUtils.isTestFile('component.ts')).toBe(false);
      expect(ImportPathUtils.isTestFile('service.tsx')).toBe(false);
    });
  });

  describe('getCorrespondingSourceFile', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'source-file-test-'));
    });

    afterEach(() => {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('should find corresponding source file', () => {
      const srcDir = path.join(tempDir, 'src');
      const testDir = path.join(tempDir, 'test');

      fs.mkdirSync(srcDir, { recursive: true });
      fs.mkdirSync(testDir, { recursive: true });

      const sourceFile = path.join(srcDir, 'component.ts');
      const testFile = path.join(testDir, 'component.spec.ts');

      fs.writeFileSync(sourceFile, 'export const component = {};');

      const foundSource = ImportPathUtils.getCorrespondingSourceFile(
        testFile,
        [srcDir]
      );

      expect(foundSource).toBe(sourceFile);
    });

    it('should return null if source file not found', () => {
      const testFile = path.join(tempDir, 'nonexistent.spec.ts');

      const foundSource = ImportPathUtils.getCorrespondingSourceFile(
        testFile,
        [path.join(tempDir, 'src')]
      );

      expect(foundSource).toBeNull();
    });
  });
});