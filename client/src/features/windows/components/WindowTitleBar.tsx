import { Minus, Square, X, Minimize2 } from 'lucide-react';
import { cn } from '../../../utils/cn';

export interface WindowTitleBarProps {
  title: string;
  icon?: string;
  focused: boolean;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose: () => void;
  isMaximized?: boolean;
}

/**
 * WindowTitleBar - The draggable title bar for windows
 *
 * Features:
 * - Draggable handle for moving window
 * - Window controls (minimize, maximize, close)
 * - Double-click to maximize/restore
 * - Icon and title display
 * - Focus state styling
 */
export function WindowTitleBar({
  title,
  icon,
  focused,
  onMinimize,
  onMaximize,
  onClose,
  isMaximized = false,
}: WindowTitleBarProps) {
  const handleDoubleClick = () => {
    if (onMaximize) {
      onMaximize();
    }
  };

  return (
    <div
      data-testid="window-title-bar"
      className={cn(
        'window-title-bar',
        'h-8 px-3 flex items-center justify-between',
        'border-b border-slate-200 dark:border-slate-700',
        'cursor-move select-none',
        'transition-colors duration-200',
        focused
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
      )}
      onDoubleClick={handleDoubleClick}
    >
      {/* Left side - Icon and Title */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {icon && (
          <img
            src={icon}
            alt={title}
            className="w-4 h-4 flex-shrink-0"
          />
        )}
        <span className="text-sm font-medium truncate">
          {title}
        </span>
      </div>

      {/* Right side - Window Controls */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {onMinimize && (
          <button
            data-testid="window-minimize-btn"
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
            className={cn(
              'w-8 h-6 flex items-center justify-center rounded',
              'hover:bg-white/20 active:bg-white/30',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-white/50'
            )}
            aria-label="Minimize"
          >
            <Minus className="w-4 h-4" />
          </button>
        )}

        {onMaximize && (
          <button
            data-testid="window-maximize-btn"
            onClick={(e) => {
              e.stopPropagation();
              onMaximize();
            }}
            className={cn(
              'w-8 h-6 flex items-center justify-center rounded',
              'hover:bg-white/20 active:bg-white/30',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-white/50'
            )}
            aria-label={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
          </button>
        )}

        <button
          data-testid="window-close-btn"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className={cn(
            'w-8 h-6 flex items-center justify-center rounded',
            'hover:bg-red-500 active:bg-red-600',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-red-400'
          )}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
