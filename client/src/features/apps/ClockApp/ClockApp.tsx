/**
 * Clock Application
 * Digital and analog clock with date display
 */

import { useState, useEffect } from 'react';
import { AppComponentProps } from '../../../types/desktop';

export function ClockApp(_props: AppComponentProps) {
  const [time, setTime] = useState(new Date());
  const [showAnalog, setShowAnalog] = useState(true);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const formattedTime = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const formattedDate = time.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate clock hand angles
  const secondAngle = (seconds / 60) * 360;
  const minuteAngle = ((minutes + seconds / 60) / 60) * 360;
  const hourAngle = ((hours % 12 + minutes / 60) / 12) * 360;

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-8">
      {/* Toggle Button */}
      <button
        onClick={() => setShowAnalog(!showAnalog)}
        className="absolute top-4 right-4 px-3 py-1.5 text-sm font-medium text-white bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
      >
        {showAnalog ? 'Digital' : 'Analog'}
      </button>

      {showAnalog ? (
        /* Analog Clock */
        <div className="relative">
          <svg width="280" height="280" viewBox="0 0 280 280">
            {/* Clock face */}
            <circle
              cx="140"
              cy="140"
              r="130"
              fill="white"
              stroke="rgba(0,0,0,0.1)"
              strokeWidth="2"
            />

            {/* Hour markers */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 30 - 90) * (Math.PI / 180);
              const x1 = 140 + 110 * Math.cos(angle);
              const y1 = 140 + 110 * Math.sin(angle);
              const x2 = 140 + 120 * Math.cos(angle);
              const y2 = 140 + 120 * Math.sin(angle);
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#333"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              );
            })}

            {/* Hour hand */}
            <line
              x1="140"
              y1="140"
              x2={140 + 60 * Math.sin((hourAngle * Math.PI) / 180)}
              y2={140 - 60 * Math.cos((hourAngle * Math.PI) / 180)}
              stroke="#333"
              strokeWidth="6"
              strokeLinecap="round"
            />

            {/* Minute hand */}
            <line
              x1="140"
              y1="140"
              x2={140 + 85 * Math.sin((minuteAngle * Math.PI) / 180)}
              y2={140 - 85 * Math.cos((minuteAngle * Math.PI) / 180)}
              stroke="#555"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Second hand */}
            <line
              x1="140"
              y1="140"
              x2={140 + 95 * Math.sin((secondAngle * Math.PI) / 180)}
              y2={140 - 95 * Math.cos((secondAngle * Math.PI) / 180)}
              stroke="#e11d48"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Center dot */}
            <circle cx="140" cy="140" r="8" fill="#333" />
            <circle cx="140" cy="140" r="4" fill="white" />
          </svg>
        </div>
      ) : (
        /* Digital Clock */
        <div className="text-center">
          <div className="text-8xl font-bold text-white mb-4 font-mono tabular-nums">
            {formattedTime}
          </div>
        </div>
      )}

      {/* Date Display */}
      <div className="mt-8 text-center">
        <div className="text-2xl font-semibold text-white mb-2">{formattedDate}</div>
        <div className="text-lg text-white/80">
          Week {Math.ceil(time.getDate() / 7)} · Day {time.getDate()}
        </div>
      </div>

      {/* Time Zones */}
      <div className="mt-8 grid grid-cols-3 gap-4 w-full max-w-md">
        <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <div className="text-xs text-white/60 mb-1">New York</div>
          <div className="text-sm font-semibold text-white">
            {new Date().toLocaleTimeString('en-US', {
              timeZone: 'America/New_York',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
        <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <div className="text-xs text-white/60 mb-1">London</div>
          <div className="text-sm font-semibold text-white">
            {new Date().toLocaleTimeString('en-US', {
              timeZone: 'Europe/London',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
        <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <div className="text-xs text-white/60 mb-1">Tokyo</div>
          <div className="text-sm font-semibold text-white">
            {new Date().toLocaleTimeString('en-US', {
              timeZone: 'Asia/Tokyo',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// App metadata for registration
export const ClockAppManifest = {
  id: 'clock',
  name: 'Clock',
  version: '1.0.0',
  description: 'Digital and analog clock with world time',
  author: 'BrowserOS',
  icon: '🕐',
  category: 'Utilities',
  permissions: [],
  windowConfig: {
    defaultSize: { width: 500, height: 600 },
    minSize: { width: 400, height: 500 },
    resizable: true,
    maximizable: true
  },
  component: ClockApp
};
