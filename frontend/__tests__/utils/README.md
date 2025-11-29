# Test Utilities

This directory contains shared test utilities for component refactoring tests.

## Overview

These utilities support the component refactoring process by providing:
- Component comparison tools to verify functional equivalence
- Rendering helpers with common test providers
- Interaction helpers for simulating user actions
- Property-based testing helpers with fast-check arbitraries

## Files

### `component-comparison.ts`

Utilities for comparing components before and after refactoring to ensure functional equivalence.

**Key Functions:**
- `compareDOMStructure()` - Compares DOM structure of two components
- `comparePropsInterface()` - Verifies props compatibility
- `compareCallbackSignatures()` - Ensures event handlers match
- `countComponentLines()` - Counts lines in a component file
- `isRefactoringCandidate()` - Identifies components that need refactoring (>300 lines)

**Example:**
```typescript
import { compareDOMStructure, isRefactoringCandidate } from '@/__tests__/utils';

// Check if component needs refactoring
const fileContent = fs.readFileSync('Carousel.tsx', 'utf-8');
if (isRefactoringCandidate(fileContent)) {
  console.log('Component should be refactored');
}

// Compare original and refactored components
const isEquivalent = compareDOMStructure(
  <OriginalComponent {...props} />,
  <RefactoredComponent {...props} />
);
```

### `rendering-helpers.ts`

Helper functions for rendering components with common providers and test setup.

**Key Functions:**
- `renderWithProviders()` - Renders components with NextIntl and other providers
- `renderAndWaitForLoad()` - Renders and waits for loading to complete
- `setViewport()` / `setViewportPreset()` - Simulates different screen sizes
- `createMockCallback()` - Creates tracked mock functions

**Example:**
```typescript
import { renderWithProviders, setViewportPreset } from '@/__tests__/utils';

// Render with providers
const { getByText } = renderWithProviders(
  <MyComponent />,
  { locale: 'en', messages: customMessages }
);

// Test responsive behavior
setViewportPreset('mobile');
// ... test mobile layout
```

### `interaction-helpers.ts`

Helper functions for simulating user interactions in tests.

**Key Functions:**
- `clickElement()` - Simulates clicks
- `typeIntoInput()` - Simulates typing
- `dragAndDrop()` - Simulates drag and drop
- `simulateMouseDrag()` - Simulates mouse dragging
- `simulateTouchSwipe()` - Simulates touch gestures
- `uploadFiles()` - Simulates file uploads

**Example:**
```typescript
import { clickElement, typeIntoInput, dragAndDrop } from '@/__tests__/utils';

// Simulate user typing
const input = screen.getByLabelText('Name');
await typeIntoInput(input, 'John Doe');

// Simulate drag and drop
const source = screen.getByTestId('item-1');
const target = screen.getByTestId('item-2');
dragAndDrop(source, target);
```

### `property-test-helpers.ts`

Utilities and arbitraries for property-based testing with fast-check.

**Key Arbitraries:**
- `componentNameArbitrary` - Generates valid React component names
- `hookNameArbitrary` - Generates valid hook names (starting with 'use')
- `filePathArbitrary` - Generates valid file paths
- `propsObjectArbitrary` - Generates React props objects
- `componentFileContentArbitrary` - Generates component file content with specific line counts

**Key Functions:**
- `runPropertyTest()` - Runs a property test with standard configuration
- `createPropertyTestConfig()` - Creates test config with defaults

**Example:**
```typescript
import * as fc from 'fast-check';
import {
  hookNameArbitrary,
  runPropertyTest,
  DEFAULT_NUM_RUNS
} from '@/__tests__/utils';

// Test that all hook names start with 'use'
runPropertyTest(
  hookNameArbitrary,
  (hookName) => {
    expect(hookName).toMatch(/^use[A-Z]/);
  }
);

// Custom property test
fc.assert(
  fc.property(
    componentNameArbitrary,
    (name) => {
      // Test logic here
    }
  ),
  { numRuns: DEFAULT_NUM_RUNS }
);
```

## Usage in Tests

### Unit Tests

```typescript
import { renderWithProviders, clickElement } from '@/__tests__/utils';

describe('MyComponent', () => {
  it('should handle click events', async () => {
    const mockOnClick = jest.fn();
    const { getByRole } = renderWithProviders(
      <MyComponent onClick={mockOnClick} />
    );

    const button = getByRole('button');
    await clickElement(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
```

### Property-Based Tests

```typescript
import * as fc from 'fast-check';
import {
  componentFileContentArbitrary,
  isRefactoringCandidate,
  DEFAULT_NUM_RUNS
} from '@/__tests__/utils';

describe('Component Refactoring Properties', () => {
  /**
   * Feature: component-refactoring, Property 1: Component identification by line count
   * Validates: Requirements 1.1
   */
  it('should identify components over 300 lines as refactoring candidates', () => {
    fc.assert(
      fc.property(
        componentFileContentArbitrary(301, 1500),
        (fileContent) => {
          expect(isRefactoringCandidate(fileContent)).toBe(true);
        }
      ),
      { numRuns: DEFAULT_NUM_RUNS }
    );
  });
});
```

### Integration Tests

```typescript
import {
  renderWithProviders,
  clickElement,
  typeIntoInput,
  waitForAnimation
} from '@/__tests__/utils';

describe('Form Integration', () => {
  it('should submit form with valid data', async () => {
    const mockOnSubmit = jest.fn();
    const { getByLabelText, getByRole } = renderWithProviders(
      <MyForm onSubmit={mockOnSubmit} />
    );

    await typeIntoInput(getByLabelText('Name'), 'John Doe');
    await typeIntoInput(getByLabelText('Email'), 'john@example.com');

    const submitButton = getByRole('button', { name: /submit/i });
    await clickElement(submitButton);

    await waitForAnimation(300);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
    });
  });
});
```

## Configuration

### Default Settings

- **Property test runs**: 100 iterations (configurable via `DEFAULT_NUM_RUNS`)
- **Default locale**: 'en'
- **Viewport presets**: mobile (375x667), tablet (768x1024), desktop (1920x1080)

### Customization

You can override defaults by passing options:

```typescript
// Custom number of runs
runPropertyTest(arbitrary, predicate, { numRuns: 500 });

// Custom locale
renderWithProviders(<Component />, { locale: 'vi' });

// Custom viewport
setViewport(1440, 900);
```

## Best Practices

1. **Use property-based tests for universal properties** - Test behaviors that should hold across all inputs
2. **Use unit tests for specific examples** - Test concrete scenarios and edge cases
3. **Use integration tests for workflows** - Test complete user flows
4. **Mock external dependencies** - Keep tests focused and fast
5. **Clean up after tests** - Use `unmount()` and cleanup functions
6. **Use descriptive test names** - Include property numbers and requirement references

## Requirements Coverage

These utilities support testing for the following requirements:

- **Requirement 1.1**: Component identification by line count
- **Requirement 1.4**: Functional equivalence after refactoring
- **Requirement 2.4**: Import resolution after extraction
- **Requirement 2.5**: Utility function behavioral preservation
- **Requirement 3.2**: Hook naming convention compliance
- **Requirement 3.5**: State management behavioral equivalence
- **Requirement 4.4**: Form validation preservation
- **Requirement 7.1-7.4**: Backward compatibility (props, exports, callbacks, output)
- **Requirement 8.1-8.4**: Documentation requirements

## Related Documentation

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [fast-check Documentation](https://github.com/dubzzz/fast-check)
- [Component Refactoring Design](../../.kiro/specs/component-refactoring/design.md)
