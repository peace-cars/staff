import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CommonProps {
  label?: string;
  error?: string;
  className?: string;
}

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement>, CommonProps {
  icon?: React.ReactNode;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className={cn("space-y-1.5 w-full", className)}>
        {label && <label className="text-xs font-semibold text-[#1d1d1f] ml-1 tracking-tight">{label}</label>}
        <div className="relative group/field">
          {icon && (
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#86868b] transition-colors group-focus-within/field:text-[#0066cc]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl py-3 px-5 text-[#1d1d1f] text-sm font-medium placeholder:text-[#86868b] focus:outline-none focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 transition-all shadow-sm",
              icon && "pl-14",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
            )}
            {...props}
          />
        </div>
        {error && <p className="text-[10px] text-red-500 font-medium ml-1 tracking-tight">{error}</p>}
      </div>
    );
  }
);

interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement>, CommonProps {}

export const TextAreaField = React.forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className={cn("space-y-1.5 w-full", className)}>
        {label && <label className="text-xs font-semibold text-[#1d1d1f] ml-1 tracking-tight">{label}</label>}
        <textarea
          ref={ref}
          className={cn(
            "w-full bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl py-3 px-5 text-[#1d1d1f] text-sm font-medium placeholder:text-[#86868b] focus:outline-none focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 transition-all shadow-sm min-h-[100px] resize-none",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
          )}
          {...props}
        />
        {error && <p className="text-[10px] text-red-500 font-medium ml-1 tracking-tight">{error}</p>}
      </div>
    );
  }
);

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement>, CommonProps {
  options: { value: string; label: string }[];
}

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, options, className, ...props }, ref) => {
    return (
      <div className={cn("space-y-1.5 w-full", className)}>
        {label && <label className="text-xs font-semibold text-[#1d1d1f] ml-1 tracking-tight">{label}</label>}
        <div className="relative group/field">
          <select
            ref={ref}
            className={cn(
              "w-full bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl py-3 px-5 text-[#1d1d1f] text-sm font-medium focus:outline-none focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 transition-all shadow-sm appearance-none cursor-pointer",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-white">{opt.label}</option>
            ))}
          </select>
          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#86868b] group-hover/field:text-[#1d1d1f] transition-colors">
             <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
        {error && <p className="text-[10px] text-red-500 font-medium ml-1 tracking-tight">{error}</p>}
      </div>
    );
  }
);

// Display names for debugging
TextField.displayName = 'TextField';
TextAreaField.displayName = 'TextAreaField';
SelectField.displayName = 'SelectField';
