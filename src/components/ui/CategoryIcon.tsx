'use client';

import { clsx } from 'clsx';
import type { IncidentCategory } from '@/types/incidents';

interface CategoryIconProps {
  category: IncidentCategory;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const categoryConfig: Record<IncidentCategory, { icon: string; color: string; label: string }> = {
  fire: { icon: '🔥', color: 'text-severity-critical', label: 'Fire/EMS' },
  police: { icon: '🚨', color: 'text-accent-info', label: 'Police' },
  traffic: { icon: '🚧', color: 'text-severity-moderate', label: 'Traffic' },
  transit: { icon: '🚇', color: 'text-accent-purple', label: 'Transit' },
  weather: { icon: '⛈️', color: 'text-severity-high', label: 'Weather' },
  utility: { icon: '⚡', color: 'text-accent-warning', label: 'Utility' },
};

const sizeConfig = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
};

export function CategoryIcon({ category, size = 'md', className }: CategoryIconProps) {
  const config = categoryConfig[category];
  
  return (
    <span 
      className={clsx(sizeConfig[size], className)}
      title={config.label}
      role="img"
      aria-label={config.label}
    >
      {config.icon}
    </span>
  );
}

export function CategoryBadge({ category, className }: { category: IncidentCategory; className?: string }) {
  const config = categoryConfig[category];
  
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide',
        'bg-bg-tertiary',
        config.color,
        className
      )}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}

