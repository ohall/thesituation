'use client';

import { clsx } from 'clsx';
import type { IncidentSeverity } from '@/types/incidents';

interface SeverityIndicatorProps {
  severity: IncidentSeverity;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const severityConfig: Record<IncidentSeverity, { color: string; label: string; icon: string }> = {
  critical: { color: 'bg-severity-critical', label: 'Critical', icon: '●' },
  high: { color: 'bg-severity-high', label: 'High', icon: '●' },
  moderate: { color: 'bg-severity-moderate', label: 'Moderate', icon: '●' },
  low: { color: 'bg-severity-low', label: 'Low', icon: '●' },
  info: { color: 'bg-severity-info', label: 'Info', icon: '○' },
};

const sizeConfig = {
  sm: 'h-2 w-2',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
};

export function SeverityIndicator({ severity, size = 'md', showLabel, className }: SeverityIndicatorProps) {
  const config = severityConfig[severity];
  
  return (
    <div className={clsx('inline-flex items-center gap-1.5', className)}>
      <span
        className={clsx(
          'rounded-full',
          config.color,
          sizeConfig[size],
          severity === 'critical' && 'animate-pulse'
        )}
      />
      {showLabel && (
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
          {config.label}
        </span>
      )}
    </div>
  );
}

export function SeverityBadge({ severity, className }: { severity: IncidentSeverity; className?: string }) {
  const config = severityConfig[severity];
  
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide',
        {
          'bg-severity-critical/20 text-severity-critical': severity === 'critical',
          'bg-severity-high/20 text-severity-high': severity === 'high',
          'bg-severity-moderate/20 text-severity-moderate': severity === 'moderate',
          'bg-severity-low/20 text-severity-low': severity === 'low',
          'bg-severity-info/20 text-severity-info': severity === 'info',
        },
        className
      )}
    >
      {config.label}
    </span>
  );
}

