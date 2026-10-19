import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'orange' | 'green' | 'light-green' | 'outline' | 'neutral' | 'warning' | 'red' | 'blue';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, className, variant = 'green', size = 'sm', ...props }) => {
  const variants = {
    orange: 'bg-saffron-orange text-white font-semibold',
    green: 'bg-primary-green text-white font-medium',
    'light-green': 'bg-[#E2EFE7] dark:bg-[#14251C] text-primary-green dark:text-emerald-400 font-semibold border border-primary-green/20 dark:border-emerald-500/30',
    outline: 'border border-border-green dark:border-[#374151] text-main-text dark:text-dark-text bg-white dark:bg-[#1F2937]',
    neutral: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    warning: 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-semibold',
    red: 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-700 font-semibold',
    blue: 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700 font-semibold',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 rounded-full uppercase tracking-wider',
    md: 'text-xs px-2.5 py-1 rounded-md',
  };

  return (
    <span className={cn('inline-flex items-center gap-1 font-sans', variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
};
