import React from 'react';

// Placeholder interfaces until stores are created by Backend Logic Expert
interface WindowState {
  id: string;
  appId: string;
  title: string;
  icon?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  state: 'normal' | 'minimized' | 'maximized' | 'fullscreen';
  zIndex: number;
  focused: boolean;
  resizable: boolean;
  movable: boolean;
  minimizable: boolean;
  maximizable: boolean;
  content?: React.ReactNode;
}

import { Window } from './Window';

/**
 * WindowManager - Container for all active windows
 *
 * Features:
 * - Renders all non-minimized windows
 * - Manages z-index stacking order
 * - Handles window focus management
 * - Integrates with window store (to be created by Backend Logic Expert)
 */
export interface WindowManagerProps {
  windows?: Record<string, WindowState>;
  focusedWindowId?: string | null;
  onFocusWindow?: (id: string) => void;
  onCloseWindow?: (id: string) => void;
  onMinimizeWindow?: (id: string) => void;
  onMaximizeWindow?: (id: string) => void;
  onUpdatePosition?: (id: string, position: { x: number; y: number }) => void;
  onUpdateSize?: (id: string, size: { width: number; height: number }) => void;
}

export function WindowManager({
  windows = {},
  focusedWindowId = null,
  onFocusWindow = () => {},
  onCloseWindow = () => {},
  onMinimizeWindow = () => {},
  onMaximizeWindow = () => {},
  onUpdatePosition = () => {},
  onUpdateSize = () => {},
}: WindowManagerProps) {
  const windowList = Object.values(windows);

  // Sort windows by z-index for proper rendering order
  const sortedWindows = [...windowList].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      data-testid="window-manager"
      className="absolute inset-0 overflow-hidden"
    >
      {sortedWindows.map((window) => {
        // Only render non-minimized windows
        if (window.state === 'minimized') {
          return null;
        }

        return (
          <Window
            key={window.id}
              id={window.id}
              appId={window.appId}
              title={window.title}
              icon={window.icon}
              position={window.position}
              size={window.size}
              state={window.state}
              zIndex={window.zIndex}
              focused={window.id === focusedWindowId}
              resizable={window.resizable}
              movable={window.movable}
              minimizable={window.minimizable}
              maximizable={window.maximizable}
              onClose={onCloseWindow}
              onMinimize={onMinimizeWindow}
              onMaximize={onMaximizeWindow}
              onFocus={onFocusWindow}
              onDragEnd={onUpdatePosition}
              onResizeEnd={onUpdateSize}
            >
              {window.content || (
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-2">{window.title}</h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    Window content will be rendered here when the app is loaded.
                  </p>
                </div>
              )}
          </Window>
        );
      })}
    </div>
  );
}
