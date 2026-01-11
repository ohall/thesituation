'use client';

import { useIncidentStore } from '@/stores/incidents';
import { clsx } from 'clsx';

const severityIcons: Record<string, string> = {
  extreme: '🔴',
  severe: '⚠️',
  moderate: '🟡',
  minor: '🔵',
};

export function AlertStrip() {
  const { getActiveAlerts } = useIncidentStore();
  const alerts = getActiveAlerts();
  
  if (alerts.length === 0) {
    return null;
  }
  
  // Show the most severe alert
  const topAlert = alerts.sort((a, b) => {
    const order = { extreme: 0, severe: 1, moderate: 2, minor: 3 };
    return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
  })[0];
  
  const alertCount = alerts.length;
  
  return (
    <div
      className={clsx(
        'px-4 py-2 flex items-center gap-3',
        topAlert.severity === 'extreme' && 'bg-severity-critical/20 border-b border-severity-critical/40',
        topAlert.severity === 'severe' && 'bg-severity-high/20 border-b border-severity-high/40',
        topAlert.severity === 'moderate' && 'bg-severity-moderate/20 border-b border-severity-moderate/40',
        topAlert.severity === 'minor' && 'bg-accent-info/10 border-b border-accent-info/30',
      )}
    >
      <span className="text-lg" role="img" aria-label={topAlert.severity}>
        {severityIcons[topAlert.severity] || '⚠️'}
      </span>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          <span className="uppercase tracking-wide text-xs mr-2">
            {topAlert.sourceName}:
          </span>
          {topAlert.headline}
        </p>
      </div>
      
      {alertCount > 1 && (
        <span className="text-xs text-text-muted whitespace-nowrap">
          +{alertCount - 1} more
        </span>
      )}
      
      <button className="text-xs text-accent-info hover:underline whitespace-nowrap">
        View All
      </button>
    </div>
  );
}

