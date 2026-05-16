import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, ...props }, ref) => {
    const variants = {
      primary: 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 active:scale-[0.98]',
      secondary: 'bg-black/5 text-slate-900 hover:bg-black/10 active:scale-[0.98]',
      outline: 'bg-transparent border border-black/10 text-slate-600 hover:text-slate-900 hover:border-black/20 active:scale-[0.98]',
      ghost: 'bg-transparent text-slate-500 hover:bg-black/5 hover:text-slate-900 active:scale-[0.98]',
      danger: 'bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500 hover:text-white active:scale-[0.98]',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-[10px] rounded-lg',
      md: 'px-5 py-2.5 text-[11px] rounded-xl',
      lg: 'px-8 py-4 text-[13px] rounded-2xl',
      icon: 'p-2.5 rounded-xl',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-bold uppercase tracking-widest transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:pointer-events-none gap-2',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
