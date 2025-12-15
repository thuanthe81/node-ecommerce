import { Test, TestingModule } from '@nestjs/testing';
import { DocumentStorageService } from './document-storage.service';
import { StorageErrorHandlerService } from './storage-error-handler.service';
import * as path from 'path';

describe('DocumentStorageService', () => {
  let service: DocumentStorageService;
  let errorHandler: StorageErrorHandlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentStorageService, StorageErrorHandlerService],
    }).compile();

    service = module.get<DocumentStorageService>(DocumentStorageService);
    errorHandler = module.get<StorageErrorHandlerService>(StorageErrorHandlerService);
  });

  describe('service initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
      expect(errorHandler).toBeDefined();
    });
  });

  describe('resolveFilenameConflict', () => {
    it('should generate unique filename when no conflict exists', async () => {
      const originalPath = path.join(process.cwd(), 'uploads', 'pdfs', 'nonexistent-file.pdf');

      const resolvedPath = await service.resolveFilenameConflict(originalPath);

      // Should return original path if no conflict
      expect(resolvedPath).toBe(originalPath);
    });
  });

  describe('validateStorageCapacity', () => {
    it('should return storage capacity information', async () => {
      const result = await service.validateStorageCapacity();

      expect(result).toHaveProperty('totalSpace');
      expect(result).toHaveProperty('usedSpace');
      expect(result).toHaveProperty('availableSpace');
      expect(result).toHaveProperty('utilizationPercentage');
      expect(result).toHaveProperty('isNearCapacity');
      expect(typeof result.totalSpace).toBe('number');
      expect(typeof result.usedSpace).toBe('number');
      expect(typeof result.utilizationPercentage).toBe('number');
      expect(typeof result.isNearCapacity).toBe('boolean');
    });
  });

  describe('cleanupExpiredPDFs', () => {
    it('should return cleanup result structure', async () => {
      const result = await service.cleanupExpiredPDFs();

      expect(result).toHaveProperty('filesRemoved');
      expect(result).toHaveProperty('spaceFreed');
      expect(result).toHaveProperty('errors');
      expect(typeof result.filesRemoved).toBe('number');
      expect(typeof result.spaceFreed).toBe('number');
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });

  describe('retrievePDF security', () => {
    it('should reject paths outside upload directory', async () => {
      const maliciousPath = '/etc/passwd';

      await expect(service.retrievePDF(maliciousPath)).rejects.toThrow(
        'Invalid file path - outside upload directory'
      );
    });

    it('should reject relative paths that escape upload directory', async () => {
      const maliciousPath = path.join(process.cwd(), 'uploads', 'pdfs', '..', '..', 'etc', 'passwd');

      await expect(service.retrievePDF(maliciousPath)).rejects.toThrow(
        'Invalid file path - outside upload directory'
      );
    });
  });

  describe('schedulePDFCleanup', () => {
    it('should schedule cleanup without throwing', async () => {
      const filePath = path.join(process.cwd(), 'uploads', 'pdfs', 'test.pdf');
      const retentionHours = 24;

      await expect(service.schedulePDFCleanup(filePath, retentionHours)).resolves.not.toThrow();
    });
  });
});