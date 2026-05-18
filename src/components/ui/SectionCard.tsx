import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SectionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  footer?: React.ReactNode;
}

export const SectionCard = React.forwardRef<HTMLDivElement, SectionCardProps>(
  ({ className, title, subtitle, action, footer, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-surface-card/60 backdrop-blur-md border border-border-subtle rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500',
          className
        )}
        {...props}
      >
        {(title || action) && (
          <div className="px-8 py-6 border-b border-border-subtle flex items-center justify-between bg-surface-hover/30">
            <div className="space-y-1">
              {title && <h3 className="text-sm font-bold text-text-main tracking-tight uppercase tracking-widest">{title}</h3>}
              {subtitle && <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{subtitle}</p>}
            </div>
            {action && <div className="flex items-center gap-3">{action}</div>}
          </div>
        )}
        <div className="p-8">
          {children}
        </div>
        {footer && (
          <div className="px-8 py-5 border-t border-border-subtle bg-surface-hover/10">
            {footer}
          </div>
        )}
      </div>
    );
  }
);

SectionCard.displayName = 'SectionCard';
