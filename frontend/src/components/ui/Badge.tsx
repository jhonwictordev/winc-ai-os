import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'lime' | 'blue' | 'purple' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = ''
}) => {
  const sizes = {
    sm: "px-1.5 py-0.5 text-[9px] gap-1",
    md: "px-2 py-0.5 text-[10px] gap-1.5"
  };

  const variants = {
    lime: "bg-[#d9ff2f]/10 text-[#d9ff2f] border border-[#d9ff2f]/25",
    blue: "bg-[#3b82f6]/10 text-[#60a5fa] border border-[#3b82f6]/25",
    purple: "bg-[#8b5cf6]/10 text-[#c084fc] border border-[#8b5cf6]/25",
    warning: "bg-amber-500/10 text-amber-400 border border-amber-500/25",
    danger: "bg-red-500/10 text-red-400 border border-red-500/25",
    neutral: "bg-white/5 text-[#94a3b8] border border-white/10"
  };

  const dotColors = {
    lime: "bg-[#d9ff2f]",
    blue: "bg-[#3b82f6]",
    purple: "bg-[#8b5cf6]",
    warning: "bg-amber-400",
    danger: "bg-red-400",
    neutral: "bg-gray-400"
  };

  return (
    <span className={`inline-flex items-center font-mono font-semibold rounded-md uppercase tracking-wider ${sizes[size]} ${variants[variant]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};
