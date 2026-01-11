'use client';

import { clsx } from 'clsx';

interface StatusBadgeProps {
  variant: 'live' | 'alert' | 'info' | 'success' | 'offline';
  children: React.ReactNode;
  pulse?: boolean;
  className?: string;
}

export function StatusBadge({ variant, children, pulse, className }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium uppercase tracking-wider rounded',
        'font-mono',
        {
          'bg-accent-danger/20 text-accent-danger': variant === 'live',
          'bg-accent-warning/20 text-accent-warning': variant === 'alert',
          'bg-accent-info/20 text-accent-info': variant === 'info',
          'bg-accent-success/20 text-accent-success': variant === 'success',
          'bg-bg-tertiary text-text-muted': variant === 'offline',
        },
        className
      )}
    >
      {(variant === 'live' || pulse) && (
        <span className="relative flex h-2 w-2">
          <span className={clsx(
            'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
            {
              'bg-accent-danger': variant === 'live',
              'bg-accent-warning': variant === 'alert',
              'bg-accent-info': variant === 'info',
              'bg-accent-success': variant === 'success',
            }
          )} />
          <span className={clsx(
            'relative inline-flex rounded-full h-2 w-2',
            {
              'bg-accent-danger': variant === 'live',
              'bg-accent-warning': variant === 'alert',
              'bg-accent-info': variant === 'info',
              'bg-accent-success': variant === 'success',
            }
          )} />
        </span>
      )}
      {children}
    </span>
  );
}

