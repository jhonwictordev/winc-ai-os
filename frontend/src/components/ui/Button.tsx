import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  loading,
  disabled,
  className = '',
  ...props
}) => {
  const base = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 select-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
  
  const sizes = {
    sm: "px-2.5 py-1 text-xs gap-1.5",
    md: "px-3.5 py-1.5 text-xs gap-2 font-semibold",
    lg: "px-4.5 py-2.5 text-sm gap-2.5 font-bold"
  };

  const variants = {
    primary: "bg-[#d9ff2f] hover:bg-[#c6ec22] text-[#06090e] font-extrabold shadow-[0_1px_12px_rgba(217,255,47,0.22)] active:scale-[0.98]",
    secondary: "bg-[#101826] hover:bg-[#162235] text-[#f8fafc] border border-white/10 active:scale-[0.98]",
    outline: "bg-transparent hover:bg-white/5 text-[#94a3b8] hover:text-[#f8fafc] border border-white/15 hover:border-[#d9ff2f]/50",
    ghost: "bg-transparent hover:bg-white/5 text-[#94a3b8] hover:text-[#f8fafc]",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25"
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
