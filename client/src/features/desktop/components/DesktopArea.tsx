import React from 'react';
import { cn } from '../../../utils/cn';

export interface DesktopAreaProps {
  children?: React.ReactNode;
  className?: string;
  onContextMenu?: (e: React.MouseEvent) => void;
}

/**
 * DesktopArea - The main area where desktop icons and windows are rendered
 *
 * This component provides:
 * - Grid layout for desktop icons
 * - Context menu support (right-click)
 * - Proper spacing to account for taskbar
 */
export function DesktopArea({ children, className, onContextMenu }: DesktopAreaProps) {
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu?.(e);
  };

  return (
    <div
      data-testid="desktop-area"
      className={cn(
        'flex-1 relative',
        'pb-taskbar', // Space for taskbar at bottom
        'overflow-hidden',
        className
      )}
      onContextMenu={handleContextMenu}
    >
      {/* Desktop grid for icons - remove padding to give windows full space */}
      <div className="absolute inset-0">
        {children}
      </div>
    </div>
  );
}
