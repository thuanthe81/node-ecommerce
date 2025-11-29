/**
 * Test Utilities Index
 *
 * Central export point for all test utilities used in component refactoring tests.
 */

// Component comparison utilities
export {
  compareDOMStructure,
  extractDataAttributes,
  comparePropsInterface,
  extractEventHandlers,
  compareCallbackSignatures,
  countComponentLines,
  isRefactoringCandidate,
} from './component-comparison';

// Rendering helper utilities
export {
  renderWithProviders,
  renderAndWaitForLoad,
  createMockCallback,
  setViewport,
  setViewportPreset,
  waitForRemoval,
  getAllTextContent,
  hasClass,
  getComputedStyles,
  VIEWPORT_SIZES,
} from './rendering-helpers';

// Interaction helper utilities
export {
  clickElement,
  typeIntoInput,
  submitForm,
  pressKey,
  dragAndDrop,
  simulateMouseDrag,
  simulateTouchSwipe,
  hoverElement,
  unhoverElement,
  focusElement,
  blurElement,
  selectOption,
  toggleCheckbox,
  waitForFocus,
  doubleClickElement,
  rightClickElement,
  scrollElement,
  waitForAnimation,
  uploadFiles,
  createMockFile,
  createMockImageFile,
} from './interaction-helpers';

// Property-based testing helpers
export {
  DEFAULT_NUM_RUNS,
  componentNameArbitrary,
  filePathArbitrary,
  cssClassNameArbitrary,
  hookNameArbitrary,
  utilityFunctionNameArbitrary,
  lineCountArbitrary,
  componentFileContentArbitrary,
  interfaceNameArbitrary,
  propNameArbitrary,
  eventHandlerNameArbitrary,
  directoryStructureArbitrary,
  propsObjectArbitrary,
  jsDocCommentArbitrary,
  importStatementArbitrary,
  exportStatementArbitrary,
  createPropertyTestConfig,
  viewportDimensionsArbitrary,
  rotationAngleArbitrary,
  normalizedAngleArbitrary,
  easingInputArbitrary,
  arrayIndexArbitrary,
  formFieldValueArbitrary,
  validationErrorArbitrary,
  fileSizeArbitrary,
  mimeTypeArbitrary,
  runPropertyTest,
} from './property-test-helpers';

export type { DirectoryStructure } from './property-test-helpers';
