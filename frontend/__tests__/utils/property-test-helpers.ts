/**
 * Property-Based Testing Helpers
 *
 * Utilities and arbitraries for property-based testing with fast-check.
 */

import * as fc from 'fast-check';

/**
 * Default number of runs for property-based tests
 */
export const DEFAULT_NUM_RUNS = 100;

/**
 * Arbitrary for generating valid React component names
 */
export const componentNameArbitrary = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => /^[A-Z][a-zA-Z0-9]*$/.test(s));

/**
 * Arbitrary for generating valid file paths
 */
export const filePathArbitrary = fc
  .array(fc.stringMatching(/^[a-z0-9-]+$/), { minLength: 1, maxLength: 5 })
  .map((parts) => parts.join('/'));

/**
 * Arbitrary for generating valid CSS class names
 */
export const cssClassNameArbitrary = fc
  .stringMatching(/^[a-z][a-z0-9-]*$/)
  .filter((s) => s.length > 0 && s.length <= 50);

/**
 * Arbitrary for generating valid hook names (must start with 'use')
 */
export const hookNameArbitrary = fc
  .string({ minLength: 1, maxLength: 40 })
  .filter((s) => /^[a-z][a-zA-Z0-9]*$/.test(s))
  .map((s) => `use${s.charAt(0).toUpperCase()}${s.slice(1)}`);

/**
 * Arbitrary for generating valid utility function names
 */
export const utilityFunctionNameArbitrary = fc
  .stringMatching(/^[a-z][a-zA-Z0-9]*$/)
  .filter((s) => s.length > 0 && s.length <= 50);

/**
 * Arbitrary for generating line counts
 */
export const lineCountArbitrary = fc.integer({ min: 1, max: 2000 });

/**
 * Arbitrary for generating component file content with specific line count
 */
export function componentFileContentArbitrary(
  minLines: number = 1,
  maxLines: number = 1500
): fc.Arbitrary<string> {
  return fc
    .integer({ min: minLines, max: maxLines })
    .chain((lineCount) =>
      fc.array(fc.string({ maxLength: 80 }), {
        minLength: lineCount,
        maxLength: lineCount,
      })
    )
    .map((lines) => lines.join('\n'));
}

/**
 * Arbitrary for generating valid TypeScript interface names
 */
export const interfaceNameArbitrary = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => /^[A-Z][a-zA-Z0-9]*$/.test(s));

/**
 * Arbitrary for generating valid prop names
 */
export const propNameArbitrary = fc
  .stringMatching(/^[a-z][a-zA-Z0-9]*$/)
  .filter((s) => s.length > 0 && s.length <= 30);

/**
 * Arbitrary for generating event handler names (must start with 'on')
 */
export const eventHandlerNameArbitrary = fc
  .string({ minLength: 1, maxLength: 30 })
  .filter((s) => /^[A-Z][a-zA-Z0-9]*$/.test(s))
  .map((s) => `on${s}`);

/**
 * Arbitrary for generating directory structures
 */
export interface DirectoryStructure {
  name: string;
  files: string[];
  subdirectories: string[];
}

export const directoryStructureArbitrary: fc.Arbitrary<DirectoryStructure> = fc.record({
  name: fc.stringMatching(/^[a-z][a-z0-9-]*$/),
  files: fc.array(fc.stringMatching(/^[a-z][a-z0-9-]*\.(ts|tsx|js|jsx)$/), {
    maxLength: 10,
  }),
  subdirectories: fc.array(fc.stringMatching(/^[a-z][a-z0-9-]*$/), {
    maxLength: 5,
  }),
});

/**
 * Arbitrary for generating React props objects
 */
export function propsObjectArbitrary<T extends Record<string, any>>(): fc.Arbitrary<T> {
  return fc.dictionary(
    propNameArbitrary,
    fc.oneof(
      fc.string(),
      fc.integer(),
      fc.boolean(),
      fc.constant(undefined),
      fc.constant(null),
      fc.func(fc.anything())
    )
  ) as fc.Arbitrary<T>;
}

/**
 * Arbitrary for generating JSDoc comment strings
 */
export const jsDocCommentArbitrary = fc
  .string({ minLength: 10, maxLength: 200 })
  .map((description) => `/**\n * ${description}\n */`);

/**
 * Arbitrary for generating import statements
 */
export const importStatementArbitrary = fc
  .tuple(
    fc.array(componentNameArbitrary, { minLength: 1, maxLength: 3 }),
    filePathArbitrary
  )
  .map(([names, path]) => `import { ${names.join(', ')} } from './${path}';`);

/**
 * Arbitrary for generating export statements
 */
export const exportStatementArbitrary = fc
  .tuple(componentNameArbitrary, filePathArbitrary)
  .map(([name, path]) => `export { ${name} } from './${path}';`);

/**
 * Helper to create a property test configuration with default settings
 */
export function createPropertyTestConfig(
  overrides?: Partial<fc.Parameters<unknown>>
): fc.Parameters<unknown> {
  return {
    numRuns: DEFAULT_NUM_RUNS,
    ...overrides,
  };
}

/**
 * Arbitrary for generating viewport dimensions
 */
export const viewportDimensionsArbitrary = fc.record({
  width: fc.integer({ min: 320, max: 3840 }),
  height: fc.integer({ min: 568, max: 2160 }),
});

/**
 * Arbitrary for generating rotation angles
 */
export const rotationAngleArbitrary = fc.integer({ min: -720, max: 720 });

/**
 * Arbitrary for generating normalized angles (0-360)
 */
export const normalizedAngleArbitrary = fc.integer({ min: 0, max: 359 });

/**
 * Arbitrary for generating easing function input (0-1)
 */
export const easingInputArbitrary = fc.double({ min: 0, max: 1 });

/**
 * Arbitrary for generating array indices
 */
export function arrayIndexArbitrary(arrayLength: number): fc.Arbitrary<number> {
  return fc.integer({ min: 0, max: Math.max(0, arrayLength - 1) });
}

/**
 * Arbitrary for generating form field values
 */
export const formFieldValueArbitrary = fc.oneof(
  fc.string({ maxLength: 100 }),
  fc.emailAddress(),
  fc.webUrl(),
  fc.integer({ min: 0, max: 1000 }),
  fc.boolean()
);

/**
 * Arbitrary for generating validation error messages
 */
export const validationErrorArbitrary = fc.string({ minLength: 5, maxLength: 100 });

/**
 * Arbitrary for generating file sizes in bytes
 */
export const fileSizeArbitrary = fc.integer({ min: 0, max: 10 * 1024 * 1024 }); // 0 to 10MB

/**
 * Arbitrary for generating MIME types
 */
export const mimeTypeArbitrary = fc.constantFrom(
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
  'application/json',
  'application/pdf'
);

/**
 * Helper to run a property test with standard configuration
 */
export function runPropertyTest<T>(
  arbitrary: fc.Arbitrary<T>,
  predicate: (value: T) => boolean | void,
  config?: Partial<fc.Parameters<unknown>>
): void {
  fc.assert(fc.property(arbitrary, predicate), createPropertyTestConfig(config));
}
