'use client';

import { useIncidentStore } from '@/stores/incidents';
import { useUIStore } from '@/stores/ui';
import { IncidentList } from '@/components/incidents/IncidentList';
import { clsx } from 'clsx';

const tabs = [
  { id: 'incidents', label: 'Incidents', icon: '📋' },
  { id: 'alerts', label: 'Alerts', icon: '⚠️' },
  { id: 'layers', label: 'Layers', icon: '🗺️' },
] as const;

const categoryFilters = [
  { id: 'fire', label: 'Fire/EMS', icon: '🔥' },
  { id: 'police', label: 'Police', icon: '🚨' },
  { id: 'traffic', label: 'Traffic', icon: '🚧' },
  { id: 'transit', label: 'Transit', icon: '🚇' },
  { id: 'weather', label: 'Weather', icon: '⛈️' },
  { id: 'utility', label: 'Utility', icon: '⚡' },
] as const;

export function Sidebar() {
  const { sidebarOpen, sidebarTab, setSidebarTab, visibleLayers, toggleLayer } = useUIStore();
  const { filters, setFilters, getActiveAlerts, incidents } = useIncidentStore();
  const alerts = getActiveAlerts();
  
  if (!sidebarOpen) {
    return null;
  }
  
  return (
    <aside className="w-80 bg-bg-secondary border-r border-bg-tertiary flex flex-col h-full overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-bg-tertiary">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSidebarTab(tab.id)}
            className={clsx(
              'flex-1 px-3 py-3 text-xs font-medium uppercase tracking-wide transition-colors',
              sidebarTab === tab.id
                ? 'text-accent-info border-b-2 border-accent-info bg-bg-tertiary/30'
                : 'text-text-muted hover:text-text-secondary hover:bg-bg-tertiary/30'
            )}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
            {tab.id === 'incidents' && incidents.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-accent-info/20 text-accent-info rounded text-xs">
                {incidents.length}
              </span>
            )}
            {tab.id === 'alerts' && alerts.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-accent-warning/20 text-accent-warning rounded text-xs">
                {alerts.length}
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {sidebarTab === 'incidents' && (
          <div className="p-3">
            {/* Category filters */}
            <div className="mb-4">
              <h3 className="text-xs text-text-muted uppercase tracking-wide mb-2">
                Filter by Category
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {categoryFilters.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      const newCategories = filters.categories.includes(cat.id)
                        ? filters.categories.filter(c => c !== cat.id)
                        : [...filters.categories, cat.id];
                      setFilters({ categories: newCategories });
                    }}
                    className={clsx(
                      'px-2 py-1 rounded text-xs transition-colors flex items-center gap-1',
                      filters.categories.includes(cat.id)
                        ? 'bg-accent-info/20 text-accent-info'
                        : 'bg-bg-tertiary text-text-muted hover:text-text-secondary'
                    )}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Incident list */}
            <IncidentList />
          </div>
        )}
        
        {sidebarTab === 'alerts' && (
          <div className="p-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                <span className="text-2xl mb-2 block">✓</span>
                <p className="text-sm">No active alerts</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={clsx(
                      'p-3 rounded-lg border-l-3',
                      alert.severity === 'extreme' && 'bg-severity-critical/10 border-l-severity-critical',
                      alert.severity === 'severe' && 'bg-severity-high/10 border-l-severity-high',
                      alert.severity === 'moderate' && 'bg-severity-moderate/10 border-l-severity-moderate',
                      alert.severity === 'minor' && 'bg-accent-info/10 border-l-accent-info',
                    )}
                  >
                    <h4 className="font-medium text-sm mb-1">{alert.headline}</h4>
                    <p className="text-xs text-text-muted">{alert.sourceName}</p>
                    {alert.description && (
                      <p className="text-xs text-text-secondary mt-2 line-clamp-3">
                        {alert.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {sidebarTab === 'layers' && (
          <div className="p-3">
            <h3 className="text-xs text-text-muted uppercase tracking-wide mb-3">
              Map Layers
            </h3>
            <div className="space-y-2">
              {[
                { id: 'incidents', label: 'Incidents', icon: '📍' },
                { id: 'alerts', label: 'Alert Zones', icon: '⚠️' },
                { id: 'cameras', label: 'Traffic Cameras', icon: '📹' },
                { id: 'transit', label: 'Transit Lines', icon: '🚇' },
                { id: 'traffic', label: 'Traffic Flow', icon: '🚗' },
              ].map((layer) => (
                <button
                  key={layer.id}
                  onClick={() => toggleLayer(layer.id)}
                  className={clsx(
                    'w-full flex items-center gap-3 p-2 rounded transition-colors',
                    visibleLayers.includes(layer.id)
                      ? 'bg-accent-info/20 text-accent-info'
                      : 'bg-bg-tertiary text-text-muted hover:text-text-secondary'
                  )}
                >
                  <span>{layer.icon}</span>
                  <span className="text-sm">{layer.label}</span>
                  <span className="ml-auto text-xs">
                    {visibleLayers.includes(layer.id) ? '✓' : ''}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

