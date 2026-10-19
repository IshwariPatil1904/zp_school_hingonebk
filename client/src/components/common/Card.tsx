import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'subtle' | 'bordered';
}

export const Card: React.FC<CardProps> = ({ children, className, variant = 'default', ...props }) => {
  const variants = {
    default: 'bg-white dark:bg-[#1F2937] border border-border-green dark:border-[#374151] shadow-card text-main-text dark:text-dark-text',
    subtle: 'bg-light-green dark:bg-[#18251F] border border-border-green/80 dark:border-[#374151] shadow-none text-main-text dark:text-dark-text',
    bordered: 'bg-white dark:bg-[#1F2937] border-2 border-border-green dark:border-[#374151] text-main-text dark:text-dark-text',
  };

  return (
    <div className={cn('rounded-xl p-5 transition-shadow duration-200', variants[variant], className)} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => {
  return <div className={cn('flex items-center justify-between pb-3 mb-3 border-b border-border-green dark:border-[#374151]', className)} {...props}>{children}</div>;
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className, ...props }) => {
  return <h3 className={cn('text-base font-semibold text-main-text dark:text-dark-text tracking-tight', className)} {...props}>{children}</h3>;
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ children, className, ...props }) => {
  return <p className={cn('text-xs text-muted-text dark:text-dark-muted mt-0.5', className)} {...props}>{children}</p>;
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => {
  return <div className={cn('text-main-text dark:text-dark-text', className)} {...props}>{children}</div>;
};
