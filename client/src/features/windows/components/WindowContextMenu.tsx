import React from 'react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import {
  Maximize2,
  Minimize2,
  Move,
  ArrowsUpFromLine,
  X,
  Pin,
} from 'lucide-react';
import { cn } from '../../../utils/cn';

export interface WindowContextMenuProps {
  children: React.ReactNode;
  isMaximized?: boolean;
  onRestore?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
  onMove?: () => void;
  onResize?: () => void;
}

/**
 * WindowContextMenu - Right-click context menu for window title bar
 *
 * Features:
 * - Window control actions (restore, minimize, maximize, close)
 * - Move and resize options
 * - Always on top toggle (future feature)
 * - Keyboard navigation support
 */
export function WindowContextMenu({
  children,
  isMaximized = false,
  onRestore = () => {},
  onMinimize = () => {},
  onMaximize = () => {},
  onClose = () => {},
  onMove = () => {},
  onResize = () => {},
}: WindowContextMenuProps) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content
          data-testid="window-context-menu"
          className={cn(
            'min-w-[200px] rounded-lg',
            'bg-white dark:bg-slate-800',
            'border border-slate-200 dark:border-slate-700',
            'shadow-lg',
            'p-1',
            'animate-fade-in'
          )}
        >
          {/* Restore or Maximize */}
          {isMaximized ? (
            <ContextMenu.Item
              onClick={onRestore}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded',
                'text-sm text-slate-700 dark:text-slate-300',
                'hover:bg-slate-100 dark:hover:bg-slate-700',
                'focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700',
                'cursor-pointer'
              )}
            >
              <Minimize2 className="w-4 h-4" />
              <span>Restore</span>
            </ContextMenu.Item>
          ) : (
            <ContextMenu.Item
              onClick={onMaximize}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded',
                'text-sm text-slate-700 dark:text-slate-300',
                'hover:bg-slate-100 dark:hover:bg-slate-700',
                'focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700',
                'cursor-pointer'
              )}
            >
              <Maximize2 className="w-4 h-4" />
              <span>Maximize</span>
            </ContextMenu.Item>
          )}

          {/* Minimize */}
          <ContextMenu.Item
            onClick={onMinimize}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded',
              'text-sm text-slate-700 dark:text-slate-300',
              'hover:bg-slate-100 dark:hover:bg-slate-700',
              'focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700',
              'cursor-pointer'
            )}
          >
            <ArrowsUpFromLine className="w-4 h-4" />
            <span>Minimize</span>
          </ContextMenu.Item>

          <ContextMenu.Separator className="h-px bg-slate-200 dark:bg-slate-700 my-1" />

          {/* Move */}
          <ContextMenu.Item
            onClick={onMove}
            disabled={isMaximized}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded',
              'text-sm',
              !isMaximized
                ? 'text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700'
                : 'text-slate-400 dark:text-slate-600 cursor-not-allowed',
              'focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700'
            )}
          >
            <Move className="w-4 h-4" />
            <span>Move</span>
          </ContextMenu.Item>

          {/* Resize */}
          <ContextMenu.Item
            onClick={onResize}
            disabled={isMaximized}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded',
              'text-sm',
              !isMaximized
                ? 'text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700'
                : 'text-slate-400 dark:text-slate-600 cursor-not-allowed',
              'focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700'
            )}
          >
            <ArrowsUpFromLine className="w-4 h-4 rotate-45" />
            <span>Resize</span>
          </ContextMenu.Item>

          <ContextMenu.Separator className="h-px bg-slate-200 dark:bg-slate-700 my-1" />

          {/* Always on Top (Future Feature) */}
          <ContextMenu.Item
            disabled
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded',
              'text-sm text-slate-400 dark:text-slate-600',
              'cursor-not-allowed'
            )}
          >
            <Pin className="w-4 h-4" />
            <span>Always on Top</span>
            <span className="ml-auto text-xs">(Soon)</span>
          </ContextMenu.Item>

          <ContextMenu.Separator className="h-px bg-slate-200 dark:bg-slate-700 my-1" />

          {/* Close */}
          <ContextMenu.Item
            onClick={onClose}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded',
              'text-sm text-red-600 dark:text-red-400',
              'hover:bg-red-50 dark:hover:bg-red-900/20',
              'focus:outline-none focus:bg-red-50 dark:focus:bg-red-900/20',
              'cursor-pointer'
            )}
          >
            <X className="w-4 h-4" />
            <span>Close</span>
            <span className="ml-auto text-xs opacity-70">Alt+F4</span>
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
