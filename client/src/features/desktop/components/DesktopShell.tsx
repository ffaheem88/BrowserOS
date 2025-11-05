import React from 'react';
import { cn } from '../../../utils/cn';

export interface DesktopShellProps {
  wallpaper?: string;
  theme?: 'light' | 'dark';
  children?: React.ReactNode;
  className?: string;
}

/**
 * DesktopShell - The main container for the desktop environment
 *
 * Features:
 * - Full-screen container with wallpaper support
 * - Theme switching (light/dark)
 * - Proper z-index layering for desktop elements
 * - Prevents text selection on desktop area
 */
export function DesktopShell({
  wallpaper = '/assets/wallpapers/default.jpg',
  theme = 'dark',
  children,
  className
}: DesktopShellProps) {
  return (
    <div
      data-testid="desktop-shell"
      className={cn(
        'relative w-full h-screen overflow-hidden select-none',
        'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900',
        theme === 'light' ? 'light' : 'dark',
        className
      )}
      style={{
        backgroundImage: wallpaper ? `url(${wallpaper})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Overlay for better contrast */}
      <div className="absolute inset-0 bg-black/10 dark:bg-black/20 transition-colors duration-300" />

      {/* Desktop content area - z-index layering */}
      <div className="relative h-full flex flex-col">
        {children}
      </div>
    </div>
  );
}
