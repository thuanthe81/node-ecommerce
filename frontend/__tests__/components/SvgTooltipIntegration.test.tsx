import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { SvgMenu, SvgClose, SvgCart, SvgCheck, SvgHome } from '../../components/Svgs';

// Mock Portal component for testing
jest.mock('../../components/Portal', () => ({
  Portal: ({ children }: { children: React.ReactNode }) => <div data-testid="portal">{children}</div>
}));

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en'
}));

// Mock window.matchMedia for reduced motion
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = jest.fn(() => ({
  width: 100,
  height: 50,
  top: 100,
  left: 100,
  bottom: 150,
  right: 200,
  x: 100,
  y: 100,
  toJSON: jest.fn(),
}));

describe('SVG Tooltip Integration', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders SVG without tooltip when no tooltip prop provided', () => {
    render(<SvgMenu data-testid="svg-menu" />);

    const svg = screen.getByTestId('svg-menu');
    expect(svg).toBeInTheDocument();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('maintains backward compatibility for SVGs without tooltip props', () => {
    render(<SvgCheck className="test-class" width={24} height={24} data-testid="svg-check" />);

    const svg = screen.getByTestId('svg-check');
    expect(svg).toHaveClass('test-class');
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
  });

  it('includes proper ARIA attributes for accessibility when tooltip provided', () => {
    render(<SvgMenu tooltip="Menu" data-testid="svg-menu" />);

    const svg = screen.getByTestId('svg-menu');
    expect(svg).toHaveAttribute('aria-describedby');
  });
});