# Test File Migration System

This directory contains utilities for reorganizing test files from scattered locations throughout the source tree into dedicated test directories.

## Overview

The migration system discovers test files in source directories and prepares them for migration to:
- Backend tests: `backend/src/**/*.spec.ts` → `backend/test/**/*.spec.ts`
- Frontend tests: `frontend/components/**/*.test.tsx` → `frontend/__tests__/**/*.test.tsx`

## Structure

```
scripts/test-migration/
├── src/
│   ├── index.ts              # Main entry point and CLI
│   ├── file-discovery.ts     # File discovery utilities
│   ├── config.ts            # Configuration management
│   └── types.ts             # TypeScript interfaces
├── package.json             # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── README.md               # This file
```

## Installation

```bash
cd scripts/test-migration
npm install
```

## Usage

### Command Line

```bash
# Discover test files (dry run)
npm run dev

# Build and run
npm run build
npm start
```

### Programmatic Usage

```typescript
import { TestMigrationSystem } from './src';

const system = new TestMigrationSystem({
  verbose: true,
  dryRun: true
});

await system.initialize();
const testFiles = await system.discoverTestFiles();
```

## Configuration

The system uses the following default configuration:

```typescript
{
  backendSourceDir: 'backend/src',
  backendTestDir: 'backend/test',
  frontendSourceDir: 'frontend/components',
  frontendTestDir: 'frontend/__tests__',
  dryRun: false,
  verbose: false
}
```

## Test File Types

The system categorizes test files into:
- **unit**: Standard unit tests
- **integration**: Integration tests
- **e2e**: End-to-end tests
- **property**: Property-based tests (using fast-check)

## Features

- **File Discovery**: Recursively finds all test files in source directories
- **Type Detection**: Automatically categorizes test types
- **Path Validation**: Validates source and target directories
- **Conflict Detection**: Identifies potential migration conflicts
- **Dry Run Mode**: Preview changes without making modifications
- **Verbose Logging**: Detailed output for debugging

## Next Steps

This is the foundation for the complete migration system. Future components will include:
- Path mapping and calculation
- Import statement analysis and updates
- File migration and directory creation
- Post-migration validation