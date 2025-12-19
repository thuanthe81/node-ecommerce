import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('Footer', () => {
  const baseProps = {
    copyrightText: '© 2024 ALA Craft. All rights reserved.',
  };

  it('renders copyright text', () => {
    render(<Footer {...baseProps} />);
    expect(screen.getByText('© 2024 ALA Craft. All rights reserved.')).toBeInTheDocument();
  });

  describe('contact information', () => {
    it('renders email when provided', () => {
      render(<Footer {...baseProps} contactEmail="info@alacraft.com" />);

      const emailLink = screen.getByText('info@alacraft.com');
      expect(emailLink).toBeInTheDocument();
      expect(emailLink).toHaveAttribute('href', 'mailto:info@alacraft.com');
    });

    it('renders phone when provided', () => {
      render(<Footer {...baseProps} contactPhone="+1234567890" />);

      const phoneLink = screen.getByText('+1234567890');
      expect(phoneLink).toBeInTheDocument();
      expect(phoneLink).toHaveAttribute('href', 'tel:+1234567890');
    });

    it('renders both email and phone when provided', () => {
      render(
        <Footer
          {...baseProps}
          contactEmail="info@alacraft.com"
          contactPhone="+1234567890"
        />
      );

      expect(screen.getByText('info@alacraft.com')).toBeInTheDocument();
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
    });

    it('does not render contact section when no contact info provided', () => {
      render(<Footer {...baseProps} />);

      expect(screen.queryByText(/mailto:/)).not.toBeInTheDocument();
      expect(screen.queryByText(/tel:/)).not.toBeInTheDocument();
    });
  });

  describe('social media links', () => {
    it('renders Facebook link when provided', () => {
      render(<Footer {...baseProps} facebookUrl="https://facebook.com/alacraft" />);

      const facebookLink = screen.getByLabelText('Facebook');
      expect(facebookLink).toBeInTheDocument();
      expect(facebookLink).toHaveAttribute('href', 'https://facebook.com/alacraft');
      expect(facebookLink).toHaveAttribute('target', '_blank');
      expect(facebookLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('renders Twitter link when provided', () => {
      render(<Footer {...baseProps} twitterUrl="https://twitter.com/alacraft" />);

      const twitterLink = screen.getByLabelText('Twitter');
      expect(twitterLink).toBeInTheDocument();
      expect(twitterLink).toHaveAttribute('href', 'https://twitter.com/alacraft');
      expect(twitterLink).toHaveAttribute('target', '_blank');
      expect(twitterLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('renders TikTok link when provided', () => {
      render(<Footer {...baseProps} tiktokUrl="https://tiktok.com/@alacraft" />);

      const tiktokLink = screen.getByLabelText('TikTok');
      expect(tiktokLink).toBeInTheDocument();
      expect(tiktokLink).toHaveAttribute('href', 'https://tiktok.com/@alacraft');
      expect(tiktokLink).toHaveAttribute('target', '_blank');
      expect(tiktokLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('renders all social links when provided', () => {
      render(
        <Footer
          {...baseProps}
          facebookUrl="https://facebook.com/alacraft"
          twitterUrl="https://twitter.com/alacraft"
          tiktokUrl="https://tiktok.com/@alacraft"
        />
      );

      expect(screen.getByLabelText('Facebook')).toBeInTheDocument();
      expect(screen.getByLabelText('Twitter')).toBeInTheDocument();
      expect(screen.getByLabelText('TikTok')).toBeInTheDocument();
    });

    it('does not render social section when no social links provided', () => {
      render(<Footer {...baseProps} />);

      expect(screen.queryByLabelText('Facebook')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Twitter')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('TikTok')).not.toBeInTheDocument();
    });
  });

  describe('empty field handling', () => {
    it('does not render contact section when email is empty string', () => {
      render(<Footer {...baseProps} contactEmail="" />);

      expect(screen.queryByText(/mailto:/)).not.toBeInTheDocument();
    });

    it('does not render contact section when phone is empty string', () => {
      render(<Footer {...baseProps} contactPhone="" />);

      expect(screen.queryByText(/tel:/)).not.toBeInTheDocument();
    });

    it('does not render social links when URLs are empty strings', () => {
      render(
        <Footer
          {...baseProps}
          facebookUrl=""
          twitterUrl=""
          tiktokUrl=""
        />
      );

      expect(screen.queryByLabelText('Facebook')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Twitter')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('TikTok')).not.toBeInTheDocument();
    });
  });

  describe('complete footer', () => {
    it('renders all sections when all props provided', () => {
      render(
        <Footer
          copyrightText="© 2024 ALA Craft. All rights reserved."
          contactEmail="info@alacraft.com"
          contactPhone="+1234567890"
          facebookUrl="https://facebook.com/alacraft"
          twitterUrl="https://twitter.com/alacraft"
          tiktokUrl="https://tiktok.com/@alacraft"
        />
      );

      // Copyright
      expect(screen.getByText('© 2024 ALA Craft. All rights reserved.')).toBeInTheDocument();

      // Contact
      expect(screen.getByText('info@alacraft.com')).toBeInTheDocument();
      expect(screen.getByText('+1234567890')).toBeInTheDocument();

      // Social
      expect(screen.getByLabelText('Facebook')).toBeInTheDocument();
      expect(screen.getByLabelText('Twitter')).toBeInTheDocument();
      expect(screen.getByLabelText('TikTok')).toBeInTheDocument();
    });
  });
});
