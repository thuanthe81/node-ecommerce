import React from 'react';
import { render, screen } from '@testing-library/react';
import { Tooltip } from '../../components/Tooltip/Tooltip';

// Mock Portal component for testing
jest.mock('../../components/Portal', () => ({
  Portal: ({ children }: { children: React.ReactNode }) => <div data-testid="portal">{children}</div>
}));

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key
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

describe('Tooltip', () => {
  it('renders tooltip when visible', () => {
    render(
      <Tooltip
        content="Test tooltip"
        isVisible={true}
        position={{ x: 100, y: 100 }}
      />
    );

    expect(screen.getByText('Test tooltip')).toBeInTheDocument();
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    render(
      <Tooltip
        content="Test tooltip"
        isVisible={false}
        position={{ x: 100, y: 100 }}
      />
    );

    expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument();
  });

  it('applies correct positioning styles', () => {
    render(
      <Tooltip
        content="Test tooltip"
        isVisible={true}
        position={{ x: 150, y: 200 }}
      />
    );

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveStyle({
      left: '150px',
      top: '200px'
    });
  });

  it('includes proper accessibility attributes', () => {
    render(
      <Tooltip
        content="Test tooltip"
        isVisible={true}
        position={{ x: 100, y: 100 }}
        id="test-tooltip"
      />
    );

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveAttribute('id', 'test-tooltip');
    expect(tooltip).toHaveAttribute('aria-hidden', 'false');
  });

  it('does not render when content is empty', () => {
    render(
      <Tooltip
        content=""
        isVisible={true}
        position={{ x: 100, y: 100 }}
      />
    );

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Tooltip
        content="Test tooltip"
        isVisible={true}
        position={{ x: 100, y: 100 }}
        className="custom-tooltip"
      />
    );

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveClass('custom-tooltip');
  });
});