/**
 * MediaPickerModal Component Tests
 *
 * Tests for the MediaPickerModal component functionality including:
 * - Modal open/close behavior
 * - Media grid display
 * - Search and filter functionality
 * - Pagination
 * - Media selection
 * - Focus management
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MediaPickerModal } from '../MediaPickerModal';
import { contentMediaApi, ContentMedia } from '@/lib/content-media-api';

// Mock the content media API
jest.mock('@/lib/content-media-api', () => ({
  contentMediaApi: {
    getAll: jest.fn(),
  },
}));

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

const mockMediaItems: ContentMedia[] = [
  {
    id: '1',
    filename: 'test-image-1.jpg',
    originalName: 'Test Image 1.jpg',
    mimeType: 'image/jpeg',
    size: 1024000,
    url: '/uploads/content-media/test-image-1.jpg',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    filename: 'test-image-2.png',
    originalName: 'Test Image 2.png',
    mimeType: 'image/png',
    size: 2048000,
    url: '/uploads/content-media/test-image-2.png',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
];

describe('MediaPickerModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSelectMedia = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (contentMediaApi.getAll as jest.Mock).mockResolvedValue({
      items: mockMediaItems,
      total: 2,
      page: 1,
      totalPages: 1,
    });
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <MediaPickerModal
        isOpen={false}
        onClose={mockOnClose}
        onSelectMedia={mockOnSelectMedia}
        locale="en"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders modal when isOpen is true', async () => {
    render(
      <MediaPickerModal
        isOpen={true}
        onClose={mockOnClose}
        onSelectMedia={mockOnSelectMedia}
        locale="en"
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('loads and displays media items', async () => {
    render(
      <MediaPickerModal
        isOpen={true}
        onClose={mockOnClose}
        onSelectMedia={mockOnSelectMedia}
        locale="en"
      />
    );

    await waitFor(() => {
      expect(contentMediaApi.getAll).toHaveBeenCalledWith(undefined, 1, 20);
    });

    await waitFor(() => {
      expect(screen.getByAltText('Test Image 1.jpg')).toBeInTheDocument();
      expect(screen.getByAltText('Test Image 2.png')).toBeInTheDocument();
    });
  });

  it('calls onSelectMedia and onClose when media item is clicked', async () => {
    const user = userEvent.setup();

    render(
      <MediaPickerModal
        isOpen={true}
        onClose={mockOnClose}
        onSelectMedia={mockOnSelectMedia}
        locale="en"
      />
    );

    await waitFor(() => {
      expect(screen.getByAltText('Test Image 1.jpg')).toBeInTheDocument();
    });

    const mediaButton = screen.getByLabelText('Select Test Image 1.jpg');
    await user.click(mediaButton);

    expect(mockOnSelectMedia).toHaveBeenCalledWith('/uploads/content-media/test-image-1.jpg');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <MediaPickerModal
        isOpen={true}
        onClose={mockOnClose}
        onSelectMedia={mockOnSelectMedia}
        locale="en"
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Find close button by aria-label
    const closeButtons = screen.getAllByLabelText('cancel');
    await user.click(closeButtons[0]);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays empty state when no media items', async () => {
    (contentMediaApi.getAll as jest.Mock).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      totalPages: 0,
    });

    render(
      <MediaPickerModal
        isOpen={true}
        onClose={mockOnClose}
        onSelectMedia={mockOnSelectMedia}
        locale="en"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('noMediaItems')).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    const user = userEvent.setup();

    render(
      <MediaPickerModal
        isOpen={true}
        onClose={mockOnClose}
        onSelectMedia={mockOnSelectMedia}
        locale="en"
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('searchPlaceholder');
    await user.type(searchInput, 'test');

    const searchButton = screen.getByText('search');
    await user.click(searchButton);

    await waitFor(() => {
      expect(contentMediaApi.getAll).toHaveBeenCalledWith('test', 1, 20);
    });
  });

  it('handles pagination', async () => {
    const user = userEvent.setup();

    (contentMediaApi.getAll as jest.Mock).mockResolvedValue({
      items: mockMediaItems,
      total: 50,
      page: 1,
      totalPages: 3,
    });

    render(
      <MediaPickerModal
        isOpen={true}
        onClose={mockOnClose}
        onSelectMedia={mockOnSelectMedia}
        locale="en"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('page')).toBeInTheDocument();
    });

    const nextButton = screen.getByLabelText('next');
    await user.click(nextButton);

    await waitFor(() => {
      expect(contentMediaApi.getAll).toHaveBeenCalledWith(undefined, 2, 20);
    });
  });
});
