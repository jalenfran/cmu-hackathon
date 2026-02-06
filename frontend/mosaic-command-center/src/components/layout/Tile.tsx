import React from 'react';
import clsx from 'clsx';

interface TileProps {
  title: string;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  accentColor?: string;
}

export function Tile({ title, icon, className, children, accentColor }: TileProps) {
  return (
    <div
      className={clsx(
        'bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4 overflow-hidden',
        'hover:border-gray-600/50 transition-colors duration-300',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        {icon && <span className="text-lg">{icon}</span>}
        <h3
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ color: accentColor || '#9ca3af' }}
        >
          {title}
        </h3>
      </div>
      <div className="h-[calc(100%-2.5rem)]">{children}</div>
    </div>
  );
}
