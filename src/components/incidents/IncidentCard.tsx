'use client';

import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import type { Incident } from '@/types/incidents';
import { SeverityIndicator } from '@/components/ui/SeverityIndicator';
import { CategoryIcon } from '@/components/ui/CategoryIcon';

interface IncidentCardProps {
  incident: Incident;
  isSelected?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

export function IncidentCard({ incident, isSelected, onClick, compact }: IncidentCardProps) {
  const timeAgo = formatDistanceToNow(new Date(incident.eventTime), { addSuffix: true });
  
  return (
    <button
      onClick={onClick}
      className={clsx(
        'incident-card w-full text-left p-3 transition-all duration-200',
        `severity-${incident.severity}`,
        isSelected && 'ring-1 ring-accent-info',
        'hover:bg-bg-tertiary/50 cursor-pointer',
        'focus:outline-none focus:ring-1 focus:ring-accent-info'
      )}
    >
      <div className="flex items-start gap-3">
        <CategoryIcon category={incident.category} size="md" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <SeverityIndicator severity={incident.severity} size="sm" />
            <span className="mono text-xs text-text-muted">{timeAgo}</span>
          </div>
          
          <h3 className="font-medium text-sm text-text-primary truncate">
            {incident.title}
          </h3>
          
          {!compact && incident.locationText && (
            <p className="text-xs text-text-secondary mt-1 truncate">
              📍 {incident.locationText}
            </p>
          )}
          
          {!compact && incident.description && (
            <p className="text-xs text-text-muted mt-1 line-clamp-2">
              {incident.description}
            </p>
          )}
        </div>
        
        {!incident.resolvedAt && incident.severity === 'critical' && (
          <span className="text-xs text-severity-critical font-medium uppercase tracking-wide animate-pulse">
            Active
          </span>
        )}
      </div>
    </button>
  );
}

