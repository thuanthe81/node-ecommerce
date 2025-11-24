import { render, screen } from '@testing-library/react';
import ContentSection from '../ContentSection';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('ContentSection', () => {
  const baseProps = {
    title: 'Test Title',
    description: 'Test Description',
    buttonText: 'Shop Now',
    buttonUrl: '/products',
  };

  describe('centered layout', () => {
    it('renders title, description, and button', () => {
      render(<ContentSection {...baseProps} layout="centered" />);

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('Shop Now')).toBeInTheDocument();
    });

    it('renders button with correct href', () => {
      render(<ContentSection {...baseProps} layout="centered" />);

      const button = screen.getByText('Shop Now');
      expect(button).toHaveAttribute('href', '/products');
    });

    it('does not render image for centered layout', () => {
      render(
        <ContentSection
          {...baseProps}
          layout="centered"
          imageUrl="/test.jpg"
          imageAlt="Test Image"
        />
      );

      expect(screen.queryByAltText('Test Image')).not.toBeInTheDocument();
    });
  });

  describe('image-left layout', () => {
    it('renders title, description, button, and image', () => {
      render(
        <ContentSection
          {...baseProps}
          layout="image-left"
          imageUrl="/test.jpg"
          imageAlt="Test Image"
        />
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('Shop Now')).toBeInTheDocument();
      expect(screen.getByAltText('Test Image')).toBeInTheDocument();
    });

    it('uses title as alt text when imageAlt is not provided', () => {
      render(
        <ContentSection
          {...baseProps}
          layout="image-left"
          imageUrl="/test.jpg"
        />
      );

      expect(screen.getByAltText('Test Title')).toBeInTheDocument();
    });
  });

  describe('image-right layout', () => {
    it('renders title, description, button, and image', () => {
      render(
        <ContentSection
          {...baseProps}
          layout="image-right"
          imageUrl="/test.jpg"
          imageAlt="Test Image"
        />
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('Shop Now')).toBeInTheDocument();
      expect(screen.getByAltText('Test Image')).toBeInTheDocument();
    });
  });

  describe('button URL correctness', () => {
    it('renders button with correct href for all layouts', () => {
      const layouts: Array<'centered' | 'image-left' | 'image-right'> = [
        'centered',
        'image-left',
        'image-right',
      ];

      layouts.forEach((layout) => {
        const { unmount } = render(
          <ContentSection
            {...baseProps}
            layout={layout}
            buttonUrl="/custom-url"
            imageUrl="/test.jpg"
          />
        );

        const button = screen.getByText('Shop Now');
        expect(button).toHaveAttribute('href', '/custom-url');

        unmount();
      });
    });
  });
});
