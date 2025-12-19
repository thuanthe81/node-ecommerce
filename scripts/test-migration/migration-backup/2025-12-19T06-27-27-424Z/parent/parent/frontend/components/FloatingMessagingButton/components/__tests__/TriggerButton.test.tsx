/**
 * TriggerButton Component Tests
 * Tests for the floating messaging button trigger component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { TriggerButton } from '../TriggerButton';

describe('TriggerButton', () => {
  const mockOnClick = jest.fn();
  const defaultProps = {
    isOpen: false,
    onClick: mockOnClick,
    ariaLabel: 'Open messaging menu',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders button with correct aria-label', () => {
    render(<TriggerButton {...defaultProps} />);
    const button = screen.getByRole('button', { name: 'Open messaging menu' });
    expect(button).toBeInTheDocument();
  });

  test('calls onClick when button is clicked', () => {
    render(<TriggerButton {...defaultProps} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  test('calls onClick when Enter key is pressed', () => {
    render(<TriggerButton {...defaultProps} />);
    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  test('calls onClick when Space key is pressed', () => {
    render(<TriggerButton {...defaultProps} />);
    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: ' ' });
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  test('does not call onClick for other keys', () => {
    render(<TriggerButton {...defaultProps} />);
    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'a' });
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  test('sets aria-expanded to false when menu is closed', () => {
    render(<TriggerButton {...defaultProps} isOpen={false} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  test('sets aria-expanded to true when menu is open', () => {
    render(<TriggerButton {...defaultProps} isOpen={true} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  test('is keyboard focusable', () => {
    render(<TriggerButton {...defaultProps} />);
    const button = screen.getByRole('button');
    button.focus();
    expect(button).toHaveFocus();
  });
});
