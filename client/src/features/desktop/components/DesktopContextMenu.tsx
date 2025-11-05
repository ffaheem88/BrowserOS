import React from 'react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import {
  RefreshCw,
  Image,
  Monitor,
  Grid3x3,
  ArrowUpDown,
  Folder,
  File,
  Clipboard,
} from 'lucide-react';
import { cn } from '../../../utils/cn';

export interface DesktopContextMenuProps {
  children: React.ReactNode;
  onRefresh?: () => void;
  onPersonalize?: () => void;
  onNewFolder?: () => void;
  onNewFile?: () => void;
  onPaste?: () => void;
  hasClipboard?: boolean;
}

/**
 * DesktopContextMenu - Right-click context menu for desktop
 *
 * Features:
 * - View options (icon size, sort by)
 * - Refresh desktop
 * - New folder/file creation
 * - Paste from clipboard
 * - Personalization settings
 * - Full keyboard navigation
 */
export function DesktopContextMenu({
  children,
  onRefresh = () => {},
  onPersonalize = () => {},
  onNewFolder = () => {},
  onNewFile = () => {},
  onPaste = () => {},
  hasClipboard = false,
}: DesktopContextMenuProps) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content
          data-testid="desktop-context-menu"
          className={cn(
            'min-w-[220px] rounded-lg',
            'bg-white dark:bg-slate-800',
            'border border-slate-200 dark:border-slate-700',
            'shadow-lg',
            'p-1',
            'animate-fade-in'
          )}
        >
          {/* View Submenu */}
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded',
                'text-sm text-slate-700 dark:text-slate-300',
                'hover:bg-slate-100 dark:hover:bg-slate-700',
                'focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700',
                'cursor-pointer'
              )}
            >
              <Monitor className="w-4 h-4" />
              <span>View</span>
              <span className="ml-auto text-xs">▸</span>
            </ContextMenu.SubTrigger>

            <ContextMenu.Portal>
              <ContextMenu.SubContent
                className={cn(
                  'min-w-[180px] rounded-lg',
                  'bg-white dark:bg-slate-800',
                  'border border-slate-200 dark:border-slate-700',
                  'shadow-lg',
                  'p-1',
                  'animate-fade-in'
                )}
              >
                <ContextMenu.Item
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded',
                    'text-sm text-slate-700 dark:text-slate-300',
                    'hover:bg-slate-100 dark:hover:bg-slate-700',
                    'focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700',
                    'cursor-pointer'
                  )}
                >
                  <Grid3x3 className="w-4 h-4" />
                  <span>Large icons</span>
                </ContextMenu.Item>

                <ContextMenu.Item
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded',
                    'text-sm text-slate-700 dark:text-slate-300',
                    'hover:bg-slate-100 dark:hover:bg-slate-700',
                    'focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700',
                    'cursor-pointer'
                  )}
                >
                  <Grid3x3 className="w-3 h-3" />
                  <span>Medium icons</span>
                </ContextMenu.Item>

                <ContextMenu.Separator className="h-px bg-slate-200 dark:bg-slate-700 my-1" />

                <ContextMenu.Item
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded',
                    'text-sm text-slate-700 dark:text-slate-300',
                    'hover:bg-slate-100 dark:hover:bg-slate-700',
                    'focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700',
                    'cursor-pointer'
                  )}
                >
                  <ArrowUpDown className="w-4 h-4" />
                  <span>Sort by name</span>
                </ContextMenu.Item>

                <ContextMenu.Item
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded',
                    'text-sm text-slate-700 dark:text-slate-300',
                    'hover:bg-slate-100 dark:hover:bg-slate-700',
                    'focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700',
                    'cursor-pointer'
                  )}
                >
                  <ArrowUpDown className="w-4 h-4" />
                  <span>Sort by date</span>
                </ContextMenu.Item>
              </ContextMenu.SubContent>
            </ContextMenu.Portal>
          </ContextMenu.Sub>

          <ContextMenu.Separator className="h-px bg-slate-200 dark:bg-slate-700 my-1" />

          {/* Refresh */}
          <ContextMenu.Item
            onClick={onRefresh}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded',
              'text-sm text-slate-700 dark:text-slate-300',
              'hover:bg-slate-100 dark:hover:bg-slate-700',
              'focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700',
              'cursor-pointer'
            )}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </ContextMenu.Item>

          <ContextMenu.Separator className="h-px bg-slate-200 dark:bg-slate-700 my-1" />

          {/* Paste */}
          <ContextMenu.Item
            onClick={onPaste}
            disabled={!hasClipboard}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded',
              'text-sm',
              hasClipboard
                ? 'text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700'
                : 'text-slate-400 dark:text-slate-600 cursor-not-allowed',
              'focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700'
            )}
          >
            <Clipboard className="w-4 h-4" />
            <span>Paste</span>
          </ContextMenu.Item>

          <ContextMenu.Separator className="h-px bg-slate-200 dark:bg-slate-700 my-1" />

          {/* New Submenu */}
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded',
                'text-sm text-slate-700 dark:text-slate-300',
                'hover:bg-slate-100 dark:hover:bg-slate-700',
                'focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700',
                'cursor-pointer'
              )}
            >
              <File className="w-4 h-4" />
              <span>New</span>
              <span className="ml-auto text-xs">▸</span>
            </ContextMenu.SubTrigger>

            <ContextMenu.Portal>
              <ContextMenu.SubContent
                className={cn(
                  'min-w-[180px] rounded-lg',
                  'bg-white dark:bg-slate-800',
                  'border border-slate-200 dark:border-slate-700',
                  'shadow-lg',
                  'p-1',
                  'animate-fade-in'
                )}
              >
                <ContextMenu.Item
                  onClick={onNewFolder}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded',
                    'text-sm text-slate-700 dark:text-slate-300',
                    'hover:bg-slate-100 dark:hover:bg-slate-700',
                    'focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700',
                    'cursor-pointer'
                  )}
                >
                  <Folder className="w-4 h-4" />
                  <span>Folder</span>
                </ContextMenu.Item>

                <ContextMenu.Item
                  onClick={onNewFile}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded',
                    'text-sm text-slate-700 dark:text-slate-300',
                    'hover:bg-slate-100 dark:hover:bg-slate-700',
                    'focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700',
                    'cursor-pointer'
                  )}
                >
                  <File className="w-4 h-4" />
                  <span>Text File</span>
                </ContextMenu.Item>
              </ContextMenu.SubContent>
            </ContextMenu.Portal>
          </ContextMenu.Sub>

          <ContextMenu.Separator className="h-px bg-slate-200 dark:bg-slate-700 my-1" />

          {/* Personalize */}
          <ContextMenu.Item
            onClick={onPersonalize}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded',
              'text-sm text-slate-700 dark:text-slate-300',
              'hover:bg-slate-100 dark:hover:bg-slate-700',
              'focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700',
              'cursor-pointer'
            )}
          >
            <Image className="w-4 h-4" />
            <span>Personalize</span>
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
