import '@testing-library/jest-dom'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock Quill to avoid ES module issues
const QuillMock = jest.fn().mockImplementation(() => ({
  root: { innerHTML: '' },
  getSelection: jest.fn(() => ({ index: 0 })),
  insertEmbed: jest.fn(),
  setSelection: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  disable: jest.fn(),
  enable: jest.fn(),
}));

QuillMock.register = jest.fn();

jest.mock('quill', () => ({
  __esModule: true,
  default: QuillMock,
}));

// Mock quill-image-resize-module-react
jest.mock('quill-image-resize-module-react', () => ({
  __esModule: true,
  default: {},
}));
