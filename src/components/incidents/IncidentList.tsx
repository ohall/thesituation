'use client';

import { useIncidentStore } from '@/stores/incidents';
import { IncidentCard } from './IncidentCard';
import { clsx } from 'clsx';

interface IncidentListProps {
  className?: string;
  maxItems?: number;
  compact?: boolean;
}

export function IncidentList({ className, maxItems, compact }: IncidentListProps) {
  const { 
    getFilteredIncidents, 
    selectedIncidentId, 
    selectIncident,
    isLoading 
  } = useIncidentStore();
  
  const incidents = getFilteredIncidents();
  const displayIncidents = maxItems ? incidents.slice(0, maxItems) : incidents;
  
  if (isLoading) {
    return (
      <div className={clsx('flex flex-col gap-2', className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="incident-card p-3 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-bg-tertiary rounded" />
              <div className="flex-1">
                <div className="h-4 w-1/4 bg-bg-tertiary rounded mb-2" />
                <div className="h-4 w-3/4 bg-bg-tertiary rounded mb-1" />
                <div className="h-3 w-1/2 bg-bg-tertiary rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (incidents.length === 0) {
    return (
      <div className={clsx('flex flex-col items-center justify-center py-12 text-center', className)}>
        <span className="text-4xl mb-4">✓</span>
        <p className="text-text-secondary text-sm">No active incidents</p>
        <p className="text-text-muted text-xs mt-1">All clear in the monitored area</p>
      </div>
    );
  }
  
  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      {displayIncidents.map((incident) => (
        <IncidentCard
          key={incident.id}
          incident={incident}
          isSelected={incident.id === selectedIncidentId}
          onClick={() => selectIncident(incident.id)}
          compact={compact}
        />
      ))}
      
      {maxItems && incidents.length > maxItems && (
        <div className="text-center py-2">
          <span className="text-xs text-text-muted">
            +{incidents.length - maxItems} more incidents
          </span>
        </div>
      )}
    </div>
  );
}

