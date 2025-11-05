import React from 'react';
import { Menu, Settings, Search } from 'lucide-react';
import { cn } from '../../../utils/cn';

export interface TaskbarApp {
  id: string;
  appId: string;
  title: string;
  icon?: string;
  isActive: boolean;
  isFocused: boolean;
}

export interface TaskbarProps {
  apps?: TaskbarApp[];
  pinnedApps?: string[];
  onAppClick?: (appId: string) => void;
  onStartClick?: () => void;
  className?: string;
}

/**
 * Taskbar - The bottom taskbar showing active and pinned apps
 *
 * Features:
 * - Start menu button
 * - Pinned app shortcuts
 * - Active window indicators
 * - System tray with clock
 * - Blur backdrop effect for modern look
 */
export function Taskbar({
  apps = [],
  pinnedApps = [],
  onAppClick = () => {},
  onStartClick = () => {},
  className,
}: TaskbarProps) {
  const [currentTime, setCurrentTime] = React.useState(new Date());

  // Update time every second
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div
      data-testid="taskbar"
      className={cn(
        'fixed bottom-0 left-0 right-0 h-taskbar',
        'bg-white/80 dark:bg-slate-900/80',
        'backdrop-blur-xl',
        'border-t border-slate-200/50 dark:border-slate-700/50',
        'shadow-lg',
        'flex items-center justify-between px-2 gap-2',
        'z-50',
        className
      )}
    >
      {/* Left Section - Start Button */}
      <div className="flex items-center gap-2">
        <button
          data-testid="start-button"
          onClick={onStartClick}
          className={cn(
            'h-10 px-3 rounded-lg',
            'flex items-center gap-2',
            'bg-gradient-to-r from-blue-500 to-purple-600',
            'text-white font-medium',
            'hover:from-blue-600 hover:to-purple-700',
            'active:scale-95',
            'transition-all duration-150',
            'shadow-md hover:shadow-lg'
          )}
          aria-label="Start Menu"
        >
          <Menu className="w-5 h-5" />
          <span className="text-sm">Start</span>
        </button>

        {/* Search Button */}
        <button
          className={cn(
            'h-10 px-3 rounded-lg',
            'flex items-center gap-2',
            'bg-slate-100 dark:bg-slate-800',
            'text-slate-700 dark:text-slate-300',
            'hover:bg-slate-200 dark:hover:bg-slate-700',
            'transition-colors duration-150'
          )}
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* Center Section - App Icons */}
      <div className="flex-1 flex items-center justify-center gap-1">
        {apps.map((app) => (
          <button
            key={app.id}
            data-testid={`taskbar-icon-${app.appId}`}
            onClick={() => onAppClick(app.id)}
            className={cn(
              'relative h-10 px-3 rounded-lg',
              'flex items-center gap-2',
              'transition-all duration-150',
              'hover:bg-slate-200 dark:hover:bg-slate-700',
              app.isFocused &&
                'bg-slate-300 dark:bg-slate-600 ring-2 ring-primary/50',
              app.isActive && !app.isFocused && 'bg-slate-200 dark:bg-slate-700'
            )}
            aria-label={app.title}
            title={app.title}
          >
            {app.icon ? (
              <img src={app.icon} alt={app.title} className="w-5 h-5" />
            ) : (
              <div className="w-5 h-5 bg-gradient-to-br from-blue-400 to-purple-500 rounded" />
            )}

            {/* Active indicator dot */}
            {app.isActive && (
              <div
                className={cn(
                  'absolute bottom-1 left-1/2 -translate-x-1/2',
                  'w-1 h-1 rounded-full',
                  app.isFocused
                    ? 'bg-primary'
                    : 'bg-slate-400 dark:bg-slate-500'
                )}
              />
            )}
          </button>
        ))}

        {/* Pinned apps that aren't active */}
        {pinnedApps
          .filter((pinnedId) => !apps.some((app) => app.appId === pinnedId))
          .map((pinnedId) => (
            <button
              key={pinnedId}
              data-testid={`taskbar-pinned-${pinnedId}`}
              onClick={() => onAppClick(pinnedId)}
              className={cn(
                'h-10 px-3 rounded-lg',
                'flex items-center gap-2',
                'transition-all duration-150',
                'hover:bg-slate-200 dark:hover:bg-slate-700',
                'opacity-70 hover:opacity-100'
              )}
              aria-label={`Launch ${pinnedId}`}
              title={`Launch ${pinnedId}`}
            >
              <div className="w-5 h-5 bg-gradient-to-br from-blue-400 to-purple-500 rounded" />
            </button>
          ))}
      </div>

      {/* Right Section - System Tray */}
      <div className="flex items-center gap-2">
        {/* Settings Button */}
        <button
          className={cn(
            'h-10 px-3 rounded-lg',
            'flex items-center gap-2',
            'bg-slate-100 dark:bg-slate-800',
            'text-slate-700 dark:text-slate-300',
            'hover:bg-slate-200 dark:hover:bg-slate-700',
            'transition-colors duration-150'
          )}
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Clock */}
        <div
          data-testid="taskbar-clock"
          className={cn(
            'h-10 px-3 rounded-lg',
            'flex flex-col items-end justify-center',
            'bg-slate-100 dark:bg-slate-800',
            'text-slate-700 dark:text-slate-300',
            'cursor-pointer',
            'hover:bg-slate-200 dark:hover:bg-slate-700',
            'transition-colors duration-150',
            'min-w-[80px]'
          )}
        >
          <span className="text-xs font-medium leading-tight">
            {formatTime(currentTime)}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
            {currentTime.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
