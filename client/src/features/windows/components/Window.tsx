import React, { useRef, useState, useEffect } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { Resizable, ResizeCallbackData } from 'react-resizable';
import { cn } from '../../../utils/cn';
import { WindowTitleBar } from './WindowTitleBar';
import 'react-resizable/css/styles.css';

export interface WindowProps {
  id: string;
  appId: string;
  title: string;
  icon?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  state: 'normal' | 'minimized' | 'maximized' | 'fullscreen';
  zIndex: number;
  focused: boolean;
  resizable?: boolean;
  movable?: boolean;
  minimizable?: boolean;
  maximizable?: boolean;
  children: React.ReactNode;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onFocus: (id: string) => void;
  onDragEnd: (id: string, position: { x: number; y: number }) => void;
  onResizeEnd: (id: string, size: { width: number; height: number }) => void;
}

/**
 * Window - A draggable, resizable window component
 *
 * Features:
 * - Drag by title bar
 * - 8-direction resizing
 * - Minimize, maximize, close controls
 * - Focus management
 * - Smooth animations
 * - Hardware-accelerated transforms for 60fps performance
 */
export const Window = React.memo(function Window({
  id,
  title,
  icon,
  position,
  size,
  state,
  zIndex,
  focused,
  resizable = true,
  movable = true,
  minimizable = true,
  maximizable = true,
  children,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onDragEnd,
  onResizeEnd,
}: WindowProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Keep track of current size for resize operations only
  // Position is fully controlled by parent to avoid state conflicts
  const [currentSize, setCurrentSize] = useState(size);

  // Log initial mount
  useEffect(() => {
    console.log(`[WINDOW MOUNT] Window ${id} mounted with:`, {
      id,
      position,
      size,
      state,
      zIndex,
      viewport: { width: window.innerWidth, height: window.innerHeight },
    });
  }, []);

  // Update size when prop changes
  useEffect(() => {
    setCurrentSize(size);
  }, [size.width, size.height]);

  // Don't render if minimized
  if (state === 'minimized') {
    return null;
  }

  const handleDragStart = (_e: DraggableEvent, data: DraggableData) => {
    console.log(`[DRAG START] Window ${id} starting drag from:`, {
      x: data.x,
      y: data.y,
      size: currentSize,
    });
  };

  const handleDrag = (_e: DraggableEvent, data: DraggableData) => {
    // Only log every 10th drag event to reduce noise
    if (Math.random() < 0.1) {
      console.log(`[DRAGGING] Window ${id} at: x=${data.x}, y=${data.y}, deltaX=${data.deltaX}, deltaY=${data.deltaY}`);
    }
  };

  const handleDragStop = (_e: DraggableEvent, data: DraggableData) => {
    // Constrain position to keep window visible
    const taskbarHeight = 48; // Height of taskbar
    const minY = 0; // Don't allow window to go above viewport
    const maxY = window.innerHeight - taskbarHeight - 100; // Keep window above taskbar
    const minX = -currentSize.width + 100; // Allow partial off-screen left
    const maxX = window.innerWidth - 100; // Keep at least 100px visible on right

    const constrainedX = Math.max(minX, Math.min(maxX, data.x));
    const constrainedY = Math.max(minY, Math.min(maxY, data.y));

    const newPosition = { x: constrainedX, y: constrainedY };

    console.log(`[DRAG STOP] Window ${id}:
      Original: x=${data.x}, y=${data.y}
      Constrained: x=${constrainedX}, y=${constrainedY}
      Viewport: ${window.innerWidth}x${window.innerHeight}
      Window Size: ${currentSize.width}x${currentSize.height}`);

    // Only notify parent of final position - parent is single source of truth
    onDragEnd(id, newPosition);
  };

  const handleResize = (_e: React.SyntheticEvent, data: ResizeCallbackData) => {
    const newSize = { width: data.size.width, height: data.size.height };
    setCurrentSize(newSize);
  };

  const handleResizeStop = (_e: React.SyntheticEvent, data: ResizeCallbackData) => {
    const newSize = { width: data.size.width, height: data.size.height };
    setCurrentSize(newSize);
    onResizeEnd(id, newSize);
  };

  const handleFocus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!focused) {
      onFocus(id);
    }
  };

  const handleClose = () => {
    setIsAnimating(true);
    setTimeout(() => {
      onClose(id);
    }, 150);
  };

  const isMaximized = state === 'maximized' || state === 'fullscreen';

  // Maximized window styles
  const maximizedStyles = isMaximized
    ? {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        width: '100%',
        height: 'calc(100% - var(--spacing-taskbar, 48px))',
        transform: 'none',
      }
    : undefined;

  const windowContent = (
    <div
      ref={nodeRef}
      data-testid="window"
      data-window-id={id}
      className={cn(
        'absolute rounded-lg shadow-2xl',
        'bg-white dark:bg-slate-800',
        'border border-slate-200 dark:border-slate-700',
        'flex flex-col overflow-hidden',
        'transition-shadow duration-200',
        focused
          ? 'ring-2 ring-primary/50 shadow-2xl'
          : 'shadow-lg',
        isAnimating && 'animate-window-close',
        !isAnimating && 'animate-window-open'
      )}
      style={{
        zIndex,
        width: isMaximized ? undefined : currentSize.width,
        height: isMaximized ? undefined : currentSize.height,
        ...maximizedStyles,
      }}
      onMouseDown={handleFocus}
      onClick={handleFocus}
    >
      {/* Title Bar */}
      <WindowTitleBar
        title={title}
        icon={icon}
        focused={focused}
        onMinimize={minimizable ? () => onMinimize(id) : undefined}
        onMaximize={maximizable ? () => onMaximize(id) : undefined}
        onClose={handleClose}
        isMaximized={isMaximized}
      />

      {/* Window Content */}
      <div
        className={cn(
          'flex-1 overflow-auto',
          'bg-white dark:bg-slate-900'
        )}
      >
        {children}
      </div>
    </div>
  );

  // If maximized, don't wrap in Draggable/Resizable
  if (isMaximized) {
    return windowContent;
  }

  // Normal window with drag and resize
  if (resizable && movable) {
    return (
      <Draggable
        nodeRef={nodeRef}
        position={position}
        onStart={handleDragStart}
        onDrag={handleDrag}
        onStop={handleDragStop}
        handle=".window-title-bar"
        disabled={!movable || isMaximized}
      >
        <Resizable
          width={currentSize.width}
          height={currentSize.height}
          onResize={handleResize}
          onResizeStop={handleResizeStop}
          minConstraints={[400, 300]}
          maxConstraints={[window.innerWidth - 100, window.innerHeight - 100]}
          resizeHandles={['se', 'sw', 'ne', 'nw', 'e', 'w', 'n', 's']}
        >
          {windowContent}
        </Resizable>
      </Draggable>
    );
  }

  if (movable) {
    return (
      <Draggable
        nodeRef={nodeRef}
        position={position}
        onStart={handleDragStart}
        onDrag={handleDrag}
        onStop={handleDragStop}
        handle=".window-title-bar"
        disabled={!movable || isMaximized}
      >
        {windowContent}
      </Draggable>
    );
  }

  return windowContent;
});
