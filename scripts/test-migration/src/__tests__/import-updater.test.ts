import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ImportUpdater, ImportPathCalculator } from '../import-updater';
import { DiscoveredTestFile } from '../types';

describe('ImportUpdater', () => {
  let updater: ImportUpdater;
  let tempDir: string;

  beforeEach(() => {
    updater = new ImportUpdater();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'import-updater-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('analyzeTestFileImports', () => {
    it('should analyze imports and calculate updated paths', () => {
      const testContent = `
import { Component } from './component';
import { Service } from '../services/user.service';
import { external } from 'external-package';
`;

      const testFile = path.join(tempDir, 'src', 'components', 'test.spec.ts');
      fs.mkdirSync(path.dirname(testFile), { recursive: true });
      fs.writeFileSync(testFile, testContent);

      const discoveredFile: DiscoveredTestFile = {
        filePath: testFile,
        fileName: 'test.spec.ts',
        directory: path.dirname(testFile),
        relativePath: 'src/components/test.spec.ts',
        testType: 'unit',
        sourceType: 'backend'
      };

      const targetPath = path.join(tempDir, 'test', 'components', 'test.spec.ts');
      const imports = updater.analyzeTestFileImports(discoveredFile, targetPath, tempDir);

      expect(imports).toHaveLength(3);

      const relativeImports = imports.filter(imp => imp.isRelative);
      expect(relativeImports).toHaveLength(2);

      // Check that relative paths were updated
      const componentImport = imports.find(imp => imp.originalPath === './component');
      expect(componentImport?.updatedPath).toBe('../../src/components/component');

      const serviceImport = imports.find(imp => imp.originalPath === '../services/user.service');
      expect(serviceImport?.updatedPath).toBe('../../src/services/user.service');

      // Check that external import was not changed
      const externalImport = imports.find(imp => imp.originalPath === 'external-package');
      expect(externalImport?.updatedPath).toBe('external-package');
    });

    it('should handle files with no imports gracefully', () => {
      const testContent = `
const value = 42;
describe('test', () => {
  it('should work', () => {
    expect(value).toBe(42);
  });
});
`;

      const testFile = path.join(tempDir, 'test.spec.ts');
      fs.writeFileSync(testFile, testContent);

      const discoveredFile: DiscoveredTestFile = {
        filePath: testFile,
        fileName: 'test.spec.ts',
        directory: path.dirname(testFile),
        relativePath: 'test.spec.ts',
        testType: 'unit',
        sourceType: 'backend'
      };

      const targetPath = path.join(tempDir, 'test', 'test.spec.ts');
      const imports = updater.analyzeTestFileImports(discoveredFile, targetPath, tempDir);

      expect(imports).toHaveLength(0);
    });
  });

  describe('batchAnalyzeImports', () => {
    it('should analyze imports for multiple test files', () => {
      // Create test files
      const testFile1 = path.join(tempDir, 'src', 'test1.spec.ts');
      const testFile2 = path.join(tempDir, 'src', 'test2.spec.ts');

      fs.mkdirSync(path.dirname(testFile1), { recursive: true });
      fs.writeFileSync(testFile1, "import { A } from './a';");
      fs.writeFileSync(testFile2, "import { B } from './b';");

      const discoveredFiles: DiscoveredTestFile[] = [
        {
          filePath: testFile1,
          fileName: 'test1.spec.ts',
          directory: path.dirname(testFile1),
          relativePath: 'src/test1.spec.ts',
          testType: 'unit',
          sourceType: 'backend'
        },
        {
          filePath: testFile2,
          fileName: 'test2.spec.ts',
          directory: path.dirname(testFile2),
          relativePath: 'src/test2.spec.ts',
          testType: 'unit',
          sourceType: 'backend'
        }
      ];

      const targetPaths = new Map([
        [testFile1, path.join(tempDir, 'test', 'test1.spec.ts')],
        [testFile2, path.join(tempDir, 'test', 'test2.spec.ts')]
      ]);

      const importMap = updater.batchAnalyzeImports(discoveredFiles, targetPaths, tempDir);

      expect(importMap.size).toBe(2);
      expect(importMap.get(testFile1)).toHaveLength(1);
      expect(importMap.get(testFile2)).toHaveLength(1);
    });
  });

  describe('updateTestToTestImports', () => {
    it('should update imports between test files', () => {
      const testFile1 = path.join(tempDir, 'src', 'test1.spec.ts');
      const testFile2 = path.join(tempDir, 'src', 'test2.spec.ts');

      fs.mkdirSync(path.dirname(testFile1), { recursive: true });
      fs.writeFileSync(testFile1, "import { helper } from './test2.spec';");
      fs.writeFileSync(testFile2, "export const helper = {};");

      const discoveredFiles: DiscoveredTestFile[] = [
        {
          filePath: testFile1,
          fileName: 'test1.spec.ts',
          directory: path.dirname(testFile1),
          relativePath: 'src/test1.spec.ts',
          testType: 'unit',
          sourceType: 'backend'
        },
        {
          filePath: testFile2,
          fileName: 'test2.spec.ts',
          directory: path.dirname(testFile2),
          relativePath: 'src/test2.spec.ts',
          testType: 'unit',
          sourceType: 'backend'
        }
      ];

      const targetPaths = new Map([
        [testFile1, path.join(tempDir, 'test', 'test1.spec.ts')],
        [testFile2, path.join(tempDir, 'test', 'test2.spec.ts')]
      ]);

      const importMap = updater.batchAnalyzeImports(discoveredFiles, targetPaths, tempDir);
      updater.updateTestToTestImports(importMap, discoveredFiles, targetPaths);

      const test1Imports = importMap.get(testFile1);
      expect(test1Imports).toHaveLength(1);
      expect(test1Imports?.[0].updatedPath).toBe('./test2.spec');
    });
  });

  describe('generateUpdatedFileContent', () => {
    it('should generate updated file content with new import paths', () => {
      const originalContent = `
import { Component } from './component';
import { Service } from '../service';

describe('test', () => {
  // test code
});
`;

      const testFile = path.join(tempDir, 'test.spec.ts');
      fs.writeFileSync(testFile, originalContent);

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
        }
      ];

      const updatedContent = updater.generateUpdatedFileContent(testFile, imports);

      expect(updatedContent).toContain("from '../../src/component'");
      expect(updatedContent).toContain("from '../../src/service'");
      expect(updatedContent).toContain("describe('test', () => {");
    });
  });

  describe('validateUpdatedImports', () => {
    it('should validate updated import paths', () => {
      // Create source files
      const sourceFile = path.join(tempDir, 'src', 'component.ts');
      fs.mkdirSync(path.dirname(sourceFile), { recursive: true });
      fs.writeFileSync(sourceFile, 'export const component = {};');

      const testFile = path.join(tempDir, 'test', 'test.spec.ts');

      const imports = [
        {
          originalPath: './component',
          updatedPath: '../src/component',
          isRelative: true,
          lineNumber: 1
        },
        {
          originalPath: './nonexistent',
          updatedPath: '../src/nonexistent',
          isRelative: true,
          lineNumber: 2
        }
      ];

      const validation = updater.validateUpdatedImports(imports, testFile, tempDir);

      expect(validation.valid).toHaveLength(1);
      expect(validation.invalid).toHaveLength(1);
      expect(validation.warnings).toHaveLength(1);
    });
  });

  describe('getImportUpdateStats', () => {
    it('should calculate import update statistics', () => {
      const importMap = new Map([
        ['test1.spec.ts', [
          {
            originalPath: './component',
            updatedPath: '../../src/component',
            isRelative: true,
            lineNumber: 1
          },
          {
            originalPath: 'external-package',
            updatedPath: 'external-package',
            isRelative: false,
            lineNumber: 2
          }
        ]],
        ['test2.spec.ts', [
          {
            originalPath: '../service',
            updatedPath: '../../src/service',
            isRelative: true,
            lineNumber: 1
          },
          {
            originalPath: './test1.spec',
            updatedPath: './test1.spec',
            isRelative: true,
            lineNumber: 2
          }
        ]]
      ]);

      const stats = updater.getImportUpdateStats(importMap);

      expect(stats.totalImports).toBe(4);
      expect(stats.relativeImports).toBe(3);
      expect(stats.updatedImports).toBe(2);
      expect(stats.testToTestImports).toBe(1);
    });
  });
});

describe('ImportPathCalculator', () => {
  describe('calculateSourceImportPath', () => {
    it('should calculate import path from test to source file', () => {
      const testPath = '/project/test/components/user.spec.ts';
      const sourcePath = '/project/src/components/user.ts';

      const importPath = ImportPathCalculator.calculateSourceImportPath(testPath, sourcePath);
      expect(importPath).toBe('../../src/components/user');
    });
  });

  describe('calculateTestToTestImportPath', () => {
    it('should calculate import path between test files', () => {
      const fromTest = '/project/test/components/user.spec.ts';
      const toTest = '/project/test/utils/helper.spec.ts';

      const importPath = ImportPathCalculator.calculateTestToTestImportPath(fromTest, toTest);
      expect(importPath).toBe('../utils/helper.spec');
    });
  });

  describe('needsUpdate', () => {
    it('should determine if import path needs updating', () => {
      const originalPath = '../service';
      const currentTestPath = '/project/src/components/test.spec.ts';
      const newTestPath = '/project/test/components/test.spec.ts';
      const projectRoot = '/project';

      const needsUpdate = ImportPathCalculator.needsUpdate(
        originalPath,
        currentTestPath,
        newTestPath,
        projectRoot
      );

      expect(needsUpdate).toBe(true);
    });

    it('should not update non-relative imports', () => {
      const originalPath = 'external-package';
      const currentTestPath = '/project/src/test.spec.ts';
      const newTestPath = '/project/test/test.spec.ts';
      const projectRoot = '/project';

      const needsUpdate = ImportPathCalculator.needsUpdate(
        originalPath,
        currentTestPath,
        newTestPath,
        projectRoot
      );

      expect(needsUpdate).toBe(false);
    });
  });

  describe('getDepthDifference', () => {
    it('should calculate depth difference between old and new locations', () => {
      const oldPath = '/project/src/components/test.spec.ts';
      const newPath = '/project/test/components/test.spec.ts';
      const projectRoot = '/project';

      const depthDiff = ImportPathCalculator.getDepthDifference(oldPath, newPath, projectRoot);
      expect(depthDiff).toBe(0); // Same depth relative to project root
    });

    it('should handle different depths correctly', () => {
      const oldPath = '/project/src/test.spec.ts';
      const newPath = '/project/test/components/test.spec.ts';
      const projectRoot = '/project';

      const depthDiff = ImportPathCalculator.getDepthDifference(oldPath, newPath, projectRoot);
      expect(depthDiff).toBe(1); // New path is one level deeper
    });
  });
});