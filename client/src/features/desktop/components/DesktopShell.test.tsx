import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DesktopShell, DesktopShellProps } from './DesktopShell';

describe('DesktopShell', () => {
  const defaultProps: DesktopShellProps = {
    wallpaper: '/assets/wallpapers/default.jpg',
    theme: 'dark',
  };

  describe('Rendering', () => {
    it('should render the desktop shell', () => {
      render(<DesktopShell {...defaultProps} />);

      const desktopShell = screen.getByTestId('desktop-shell');
      expect(desktopShell).toBeInTheDocument();
    });

    it('should render children when provided', () => {
      render(
        <DesktopShell {...defaultProps}>
          <div data-testid="child-content">Test Content</div>
        </DesktopShell>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should apply default wallpaper when not provided', () => {
      render(<DesktopShell />);

      const desktopShell = screen.getByTestId('desktop-shell');
      expect(desktopShell).toHaveStyle({
        backgroundImage: 'url(/assets/wallpapers/default.jpg)',
      });
    });

    it('should apply custom wallpaper when provided', () => {
      render(<DesktopShell wallpaper="/assets/wallpapers/custom.jpg" />);

      const desktopShell = screen.getByTestId('desktop-shell');
      expect(desktopShell).toHaveStyle({
        backgroundImage: 'url(/assets/wallpapers/custom.jpg)',
      });
    });

    it('should not apply background image when wallpaper is empty', () => {
      render(<DesktopShell wallpaper="" />);

      const desktopShell = screen.getByTestId('desktop-shell');
      expect(desktopShell).toHaveStyle({
        backgroundImage: undefined,
      });
    });
  });

  describe('Theme', () => {
    it('should apply dark theme by default', () => {
      render(<DesktopShell />);

      const desktopShell = screen.getByTestId('desktop-shell');
      expect(desktopShell).toHaveClass('dark');
    });

    it('should apply dark theme when theme is dark', () => {
      render(<DesktopShell theme="dark" />);

      const desktopShell = screen.getByTestId('desktop-shell');
      expect(desktopShell).toHaveClass('dark');
    });

    it('should apply light theme when theme is light', () => {
      render(<DesktopShell theme="light" />);

      const desktopShell = screen.getByTestId('desktop-shell');
      expect(desktopShell).toHaveClass('light');
    });
  });

  describe('Styling', () => {
    it('should apply base styling classes', () => {
      render(<DesktopShell {...defaultProps} />);

      const desktopShell = screen.getByTestId('desktop-shell');
      expect(desktopShell).toHaveClass('relative');
      expect(desktopShell).toHaveClass('w-full');
      expect(desktopShell).toHaveClass('h-screen');
      expect(desktopShell).toHaveClass('overflow-hidden');
      expect(desktopShell).toHaveClass('select-none');
    });

    it('should apply custom className when provided', () => {
      render(<DesktopShell {...defaultProps} className="custom-class" />);

      const desktopShell = screen.getByTestId('desktop-shell');
      expect(desktopShell).toHaveClass('custom-class');
    });

    it('should have proper background styling', () => {
      render(<DesktopShell {...defaultProps} />);

      const desktopShell = screen.getByTestId('desktop-shell');
      expect(desktopShell).toHaveStyle({
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      });
    });
  });

  describe('Layout', () => {
    it('should have overlay for contrast', () => {
      const { container } = render(<DesktopShell {...defaultProps} />);

      const overlay = container.querySelector('.absolute.inset-0.bg-black\\/10');
      expect(overlay).toBeInTheDocument();
    });

    it('should have content area with proper structure', () => {
      const { container } = render(
        <DesktopShell {...defaultProps}>
          <div data-testid="content">Content</div>
        </DesktopShell>
      );

      const contentArea = container.querySelector('.relative.h-full.flex.flex-col');
      expect(contentArea).toBeInTheDocument();
      expect(contentArea).toContainElement(screen.getByTestId('content'));
    });
  });

  describe('Accessibility', () => {
    it('should have testid attribute for testing', () => {
      render(<DesktopShell {...defaultProps} />);

      expect(screen.getByTestId('desktop-shell')).toBeInTheDocument();
    });

    it('should prevent text selection on desktop area', () => {
      render(<DesktopShell {...defaultProps} />);

      const desktopShell = screen.getByTestId('desktop-shell');
      expect(desktopShell).toHaveClass('select-none');
    });
  });

  describe('Multiple Children', () => {
    it('should render multiple children correctly', () => {
      render(
        <DesktopShell {...defaultProps}>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <div data-testid="child-3">Child 3</div>
        </DesktopShell>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
    });
  });
});
