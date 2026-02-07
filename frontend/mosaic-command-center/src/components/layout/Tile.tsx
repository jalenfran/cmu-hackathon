import React from 'react';
import clsx from 'clsx';

interface TileProps {
  title: string;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  accentColor?: string;
  badge?: React.ReactNode;
}

export function Tile({ title, icon, className, children, accentColor, badge }: TileProps) {
  return (
    <div
      className={clsx(
        'relative bg-gray-900/30 backdrop-blur-2xl border border-gray-700/15 rounded-2xl p-4 overflow-hidden glass-tile',
        'hover:border-gray-600/30 transition-all duration-300',
        'shadow-lg shadow-black/20',
        className
      )}
      style={{
        background: 'linear-gradient(135deg, rgba(15, 15, 25, 0.5) 0%, rgba(10, 10, 18, 0.4) 100%)',
      }}
    >
      {/* Subtle top accent line */}
      <div
        className="absolute top-0 left-4 right-4 h-px opacity-30"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor || '#6b7280'}, transparent)` }}
      />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon && <span className="text-lg">{icon}</span>}
          <h3
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: accentColor || '#9ca3af' }}
          >
            {title}
          </h3>
        </div>
        {badge}
      </div>
      <div className="h-[calc(100%-2.5rem)]">{children}</div>
    </div>
  );
}
