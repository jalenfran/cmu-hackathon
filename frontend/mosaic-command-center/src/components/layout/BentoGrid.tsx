import React from 'react';

interface BentoGridProps {
  children: React.ReactNode;
}

export function BentoGrid({ children }: BentoGridProps) {
  return (
    <div
      className="grid gap-4 p-4 h-[calc(100vh-4rem)]"
      style={{
        gridTemplateColumns: 'repeat(4, 1fr)',
        gridTemplateRows: '80px 1fr 1fr',
      }}
    >
      {children}
    </div>
  );
}
