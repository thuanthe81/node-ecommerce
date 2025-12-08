# Design Document

## Overview

This design document outlines the approach for consolidating the duplicated `BlogPost` TypeScript interface across the frontend codebase. The refactoring will eliminate four duplicate type definitions and establish `frontend/lib/blog-api.ts` as the single source of truth for blog-related types. This is a straightforward refactoring task that improves code maintainability without changing any runtime behavior.

## Architecture

### Current State

The `BlogPost` interface is currently defined in five locations:

1. **Canonical Definition**: `frontend/lib/blog-api.ts` (exported)
2. **Duplicate 1**: `frontend/components/BlogPostPage.tsx` (local interface)
3. **Duplicate 2**: `frontend/components/BlogCard.tsx` (local interface)
4. **Duplicate 3**: `frontend/components/AdminBlogList.tsx` (local interface)
5. **Duplicate 4**: `frontend/components/BlogListingPage.tsx` (local interface)

All five definitions are structurally identical, containing the same fields with the same types.

### Target State

After refactoring:

1. **Single Definition**: `frontend/lib/blog-api.ts` (exported)
2. **Import in BlogPostPage**: `import { BlogPost } from '@/lib/blog-api'`
3. **Import in BlogCard**: `import { BlogPost } from '@/lib/blog-api'`
4. **Import in AdminBlogList**: `import { BlogPost } from '@/lib/blog-api'`
5. **Import in BlogListingPage**: `import { BlogPost } from '@/lib/blog-api'`

### Rationale

Keeping the type definition in `blog-api.ts` makes sense because:
- It's already exported from this module
- The API client is the source of truth for data structures returned from the backend
- Components that use blog data already import functions from this module
- It follows the pattern of co-locating types with their related API functions

## Components and Interfaces

### Affected Components

#### 1. BlogPostPage Component
- **File**: `frontend/components/BlogPostPage.tsx`
- **Current**: Defines local `BlogPost` interface
- **Change**: Remove local interface, import from `@/lib/blog-api`
- **Impact**: No behavioral change, only import modification

#### 2. BlogCard Component
- **File**: `frontend/components/BlogCard.tsx`
- **Current**: Defines local `BlogPost` interface
- **Change**: Remove local interface, import from `@/lib/blog-api`
- **Impact**: No behavioral change, only import modification

#### 3. AdminBlogList Component
- **File**: `frontend/components/AdminBlogList.tsx`
- **Current**: Defines local `BlogPost` interface
- **Change**: Remove local interface, import from `@/lib/blog-api`
- **Impact**: No behavioral change, only import modification

#### 4. BlogListingPage Component
- **File**: `frontend/components/BlogListingPage.tsx`
- **Current**: Defines local `BlogPost` interface
- **Change**: Remove local interface, import from `@/lib/blog-api`
- **Impact**: No behavioral change, only import modification

### Type Definition Module

#### blog-api.ts
- **File**: `frontend/lib/blog-api.ts`
- **Current**: Already exports `BlogPost` interface
- **Change**: No changes needed - this is already the canonical source
- **Exports**: `BlogPost`, `BlogCategory`, `PaginatedBlogPosts`, `CreateBlogPostData`

## Data Models

### BlogPost Interface

The canonical `BlogPost` interface in `frontend/lib/blog-api.ts`:

```typescript
export interface BlogPost {
  id: string;
  slug: string;
  type: 'BLOG';
  titleEn: string;
  titleVi: string;
  contentEn: string;
  contentVi: string;
  excerptEn: string;
  excerptVi: string;
  authorName: string;
  imageUrl?: string;
  displayOrder: number;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  blogCategories?: Array<{
    category: BlogCategory;
  }>;
}
```

This interface will remain unchanged. All components will reference this single definition.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Acceptance Criteria Testing Prework

1.1. WHEN the BlogPost interface is defined THEN it SHALL exist in exactly one location in the codebase
Thoughts: This is about code structure, not runtime behavior. We can verify this by searching the codebase for interface definitions.
Testable: no

1.2. WHEN components need the BlogPost type THEN they SHALL import it from the canonical source rather than redefining it locally
Thoughts: This is about code organization and import statements, not runtime behavior.
Testable: no

1.3. WHEN the BlogPost type structure changes THEN all components SHALL automatically use the updated type without requiring individual updates
Thoughts: This is a consequence of proper imports, not a testable property itself.
Testable: no

1.4. WHEN TypeScript compilation occurs THEN there SHALL be no type conflicts or inconsistencies related to BlogPost
Thoughts: This is verified by the TypeScript compiler itself during the build process.
Testable: no

1.5. WHEN developers search for the BlogPost type definition THEN they SHALL find only one authoritative definition
Thoughts: This is about code organization and searchability, not a functional requirement.
Testable: no

2.1. WHEN BlogPostPage component is rendered THEN it SHALL use the BlogPost type imported from `@/lib/blog-api`
Thoughts: This is about import statements and code structure, not runtime behavior.
Testable: no

2.2. WHEN BlogCard component is rendered THEN it SHALL use the BlogPost type imported from `@/lib/blog-api`
Thoughts: This is about import statements and code structure, not runtime behavior.
Testable: no

2.3. WHEN AdminBlogList component is rendered THEN it SHALL use the BlogPost type imported from `@/lib/blog-api`
Thoughts: This is about import statements and code structure, not runtime behavior.
Testable: no

2.4. WHEN BlogListingPage component is rendered THEN it SHALL use the BlogPost type imported from `@/lib/blog-api`
Thoughts: This is about import statements and code structure, not runtime behavior.
Testable: no

2.5. WHEN any component imports BlogPost THEN the import statement SHALL reference `@/lib/blog-api` as the source
Thoughts: This is about code organization, not runtime behavior.
Testable: no

3.1. WHEN the type consolidation is complete THEN all blog components SHALL render identically to their pre-refactor behavior
Thoughts: This is about ensuring no behavioral changes occur. Since we're only changing imports and removing duplicate type definitions, the runtime behavior should be identical. This is a general goal rather than a specific testable property.
Testable: no

3.2. WHEN blog posts are fetched and displayed THEN the data structure SHALL match the existing BlogPost interface
Thoughts: This is already true before the refactoring and will remain true after. The interface structure isn't changing.
Testable: no

3.3. WHEN TypeScript type checking runs THEN no new type errors SHALL be introduced
Thoughts: This is verified by the TypeScript compiler during the build process.
Testable: no

3.4. WHEN the application builds THEN the build process SHALL complete successfully without type-related errors
Thoughts: This is verified by running the build command.
Testable: no

3.5. WHEN existing tests run THEN they SHALL pass without modification
Thoughts: This verifies that behavior hasn't changed. We can run the existing test suite.
Testable: yes - example

### Property Reflection

After reviewing all acceptance criteria, there are no properties that require property-based testing. This is a pure refactoring task focused on code organization. The only testable criterion is running existing tests to ensure no behavioral changes occurred.

No testable properties identified for this refactoring task.

## Error Handling

This refactoring does not introduce new error handling logic. All existing error handling in the affected components will remain unchanged.

### Potential Issues

1. **TypeScript Compilation Errors**: If imports are incorrect, TypeScript will fail to compile
   - **Mitigation**: Run `npm run build` or `tsc --noEmit` after changes

2. **Missing Export**: If `BlogPost` is not properly exported from `blog-api.ts`
   - **Mitigation**: Verify export statement exists (it already does)

3. **Path Resolution**: If import paths are incorrect
   - **Mitigation**: Use the existing `@/lib/blog-api` alias pattern used throughout the codebase

## Testing Strategy

### Verification Approach

Since this is a refactoring task with no behavioral changes, testing focuses on verification rather than new test creation:

1. **TypeScript Compilation**: Run `npm run build` or `tsc --noEmit` to verify no type errors
2. **Existing Tests**: Run the existing test suite to ensure no behavioral changes
3. **Manual Verification**: Search codebase to confirm no duplicate `BlogPost` definitions remain

### Test Commands

```bash
# TypeScript type checking
cd frontend
npm run build

# Run existing tests (if any)
npm test

# Search for duplicate BlogPost definitions
grep -r "interface BlogPost" frontend/components/
```

### Success Criteria

- TypeScript compilation succeeds without errors
- All existing tests pass
- No duplicate `BlogPost` interface definitions found in component files
- All components successfully import `BlogPost` from `@/lib/blog-api`
