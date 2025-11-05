import React, { useRef, useState } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { cn } from '../../../utils/cn';
import { LucideIcon } from 'lucide-react';

export interface DesktopIconProps {
  id: string;
  appId: string;
  icon: string | LucideIcon;
  label: string;
  position: { x: number; y: number };
  selected?: boolean;
  onDoubleClick: (appId: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onDragEnd: (id: string, position: { x: number; y: number }) => void;
  onSelect?: (id: string) => void;
}

/**
 * DesktopIcon - A draggable icon on the desktop
 *
 * Features:
 * - Drag to reposition
 * - Double-click to launch app
 * - Right-click for context menu
 * - Selection highlighting
 * - Hover effects
 */
export function DesktopIcon({
  id,
  appId,
  icon,
  label,
  position,
  selected = false,
  onDoubleClick,
  onContextMenu,
  onDragEnd,
  onSelect,
}: DesktopIconProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const clickTimer = useRef<NodeJS.Timeout | null>(null);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragStop = (_e: DraggableEvent, data: DraggableData) => {
    setIsDragging(false);
    const newPosition = { x: data.x, y: data.y };
    onDragEnd(id, newPosition);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (onSelect) {
      onSelect(id);
    }

    // Handle double-click detection
    setClickCount((prev) => prev + 1);

    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
    }

    clickTimer.current = setTimeout(() => {
      if (clickCount + 1 === 2) {
        // Double click detected
        onDoubleClick(appId);
      }
      setClickCount(0);
    }, 300);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e, id);
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      position={position}
      onStart={handleDragStart}
      onStop={handleDragStop}
      grid={[80, 80]} // Snap to grid
      bounds="parent"
    >
      <div
        ref={nodeRef}
        data-testid={`desktop-icon-${appId}`}
        className={cn(
          'absolute w-20 flex flex-col items-center gap-1',
          'cursor-pointer select-none',
          'transition-transform duration-150',
          !isDragging && 'hover:scale-105',
          isDragging && 'opacity-70'
        )}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {/* Icon */}
        <div
          className={cn(
            'w-16 h-16 rounded-lg',
            'flex items-center justify-center',
            'bg-white/10 backdrop-blur-sm',
            'border border-white/20',
            'transition-all duration-200',
            'hover:bg-white/20 hover:border-white/30',
            selected && 'bg-primary/30 border-primary/50 ring-2 ring-primary/50'
          )}
        >
          {typeof icon === 'string' ? (
            icon.startsWith('http') || icon.startsWith('/') ? (
              <img
                src={icon}
                alt={label}
                className="w-10 h-10 object-contain"
                draggable={false}
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg" />
            )
          ) : (
            React.createElement(icon, { className: "w-10 h-10 text-white" })
          )}
        </div>

        {/* Label */}
        <div
          className={cn(
            'px-2 py-0.5 rounded',
            'text-xs text-center text-white',
            'bg-black/30 backdrop-blur-sm',
            'max-w-full break-words line-clamp-2',
            'shadow-sm',
            selected && 'bg-primary/50'
          )}
        >
          {label}
        </div>
      </div>
    </Draggable>
  );
}
