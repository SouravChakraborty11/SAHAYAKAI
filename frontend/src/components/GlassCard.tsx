import React from 'react';

export const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return (
    <div className={`card-panel rounded-[24px] p-6 md:p-8 ${className}`}>
      {children}
    </div>
  );
};
