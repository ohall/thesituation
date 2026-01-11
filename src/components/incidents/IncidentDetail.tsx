'use client';

import { clsx } from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';
import { useIncidentStore } from '@/stores/incidents';
import { useUIStore } from '@/stores/ui';
import { SeverityBadge } from '@/components/ui/SeverityIndicator';
import { CategoryBadge } from '@/components/ui/CategoryIcon';

export function IncidentDetail() {
  const { getSelectedIncident, selectIncident } = useIncidentStore();
  const { setDetailPanelOpen } = useUIStore();
  
  const incident = getSelectedIncident();
  
  if (!incident) {
    return null;
  }
  
  const eventTime = new Date(incident.eventTime);
  const timeAgo = formatDistanceToNow(eventTime, { addSuffix: true });
  const formattedTime = format(eventTime, 'HH:mm:ss');
  const formattedDate = format(eventTime, 'MMM d, yyyy');
  
  const handleClose = () => {
    selectIncident(null);
    setDetailPanelOpen(false);
  };
  
  return (
    <div className="tactical-panel h-full flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="tactical-header">
        <span>Incident Detail</span>
        <button 
          onClick={handleClose}
          className="text-text-muted hover:text-text-primary transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Title and badges */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <SeverityBadge severity={incident.severity} />
            <CategoryBadge category={incident.category} />
          </div>
          <h2 className="text-lg font-semibold">{incident.title}</h2>
        </div>
        
        {/* Location */}
        {incident.locationText && (
          <div className="mb-4">
            <h3 className="text-xs text-text-muted uppercase tracking-wide mb-1">Location</h3>
            <p className="text-sm text-text-secondary">📍 {incident.locationText}</p>
            {incident.location && (
              <p className="mono text-xs text-text-muted mt-1">
                {incident.location.coordinates[1].toFixed(6)}, {incident.location.coordinates[0].toFixed(6)}
              </p>
            )}
          </div>
        )}
        
        {/* Time */}
        <div className="mb-4">
          <h3 className="text-xs text-text-muted uppercase tracking-wide mb-1">Time</h3>
          <div className="flex items-baseline gap-2">
            <span className="mono text-sm">{formattedTime}</span>
            <span className="text-xs text-text-muted">{formattedDate}</span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            {incident.resolvedAt ? 'Resolved' : 'Active'} · Started {timeAgo}
          </p>
        </div>
        
        {/* Description */}
        {incident.description && (
          <div className="mb-4">
            <h3 className="text-xs text-text-muted uppercase tracking-wide mb-1">Description</h3>
            <p className="text-sm text-text-secondary whitespace-pre-wrap">
              {incident.description}
            </p>
          </div>
        )}
        
        {/* Source */}
        <div className="mb-4">
          <h3 className="text-xs text-text-muted uppercase tracking-wide mb-1">Source</h3>
          <p className="text-sm text-text-secondary">{incident.sourceName}</p>
          {incident.sourceUrl && (
            <a 
              href={incident.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent-info hover:underline"
            >
              View Original →
            </a>
          )}
        </div>
        
        {/* Confidence */}
        <div className="mb-4">
          <h3 className="text-xs text-text-muted uppercase tracking-wide mb-1">Confidence</h3>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
              <div 
                className={clsx(
                  'h-full rounded-full',
                  incident.confidence >= 0.8 ? 'bg-accent-success' :
                  incident.confidence >= 0.6 ? 'bg-accent-warning' :
                  'bg-accent-danger'
                )}
                style={{ width: `${incident.confidence * 100}%` }}
              />
            </div>
            <span className="mono text-xs text-text-muted">
              {Math.round(incident.confidence * 100)}%
            </span>
          </div>
        </div>
        
        {/* Raw data (collapsible) */}
        {incident.rawData && (
          <details className="mt-4">
            <summary className="text-xs text-text-muted uppercase tracking-wide cursor-pointer hover:text-text-secondary">
              Raw Data
            </summary>
            <pre className="mt-2 p-3 bg-bg-primary rounded text-xs mono text-text-muted overflow-x-auto">
              {JSON.stringify(incident.rawData, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

