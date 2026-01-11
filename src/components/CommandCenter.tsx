'use client';

import { useDataLoader } from '@/hooks/useDataLoader';
import { useUIStore } from '@/stores/ui';
import { useIncidentStore } from '@/stores/incidents';
import { Header } from '@/components/Header';
import { AlertStrip } from '@/components/AlertStrip';
import { Sidebar } from '@/components/Sidebar';
import { TacticalMap } from '@/components/map/TacticalMap';
import { IncidentDetail } from '@/components/incidents/IncidentDetail';
import { SituationBrief } from '@/components/SituationBrief';
import { clsx } from 'clsx';

function StatsBar() {
  const { stats } = useIncidentStore();
  
  if (!stats) return null;
  
  return (
    <div className="h-10 bg-bg-secondary/80 backdrop-blur border-t border-bg-tertiary px-4 flex items-center gap-6 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-text-muted">Active:</span>
        <span className="mono font-medium">{stats.total}</span>
      </div>
      
      <div className="flex items-center gap-3">
        {stats.bySeverity.critical > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-severity-critical" />
            <span className="mono">{stats.bySeverity.critical}</span>
          </span>
        )}
        {stats.bySeverity.high > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-severity-high" />
            <span className="mono">{stats.bySeverity.high}</span>
          </span>
        )}
        {stats.bySeverity.moderate > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-severity-moderate" />
            <span className="mono">{stats.bySeverity.moderate}</span>
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2 ml-auto">
        <span className="text-text-muted">Trend:</span>
        <span className={clsx(
          'font-medium',
          stats.trend === 'up' && 'text-severity-high',
          stats.trend === 'down' && 'text-accent-success',
          stats.trend === 'stable' && 'text-text-secondary',
        )}>
          {stats.trend === 'up' && '↑'}
          {stats.trend === 'down' && '↓'}
          {stats.trend === 'stable' && '→'}
        </span>
      </div>
    </div>
  );
}

export function CommandCenter() {
  // Initialize data loading
  useDataLoader();
  
  const { detailPanelOpen, briefPanelOpen } = useUIStore();
  const { selectedIncidentId } = useIncidentStore();
  
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <AlertStrip />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main content area */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
          {/* Map */}
          <div className="flex-1 relative">
            <TacticalMap />
            
            {/* Situation Brief overlay */}
            {briefPanelOpen && (
              <div className="absolute top-4 right-4 w-96 max-w-[calc(100%-2rem)] z-10">
                <SituationBrief />
              </div>
            )}
          </div>
          
          {/* Stats bar */}
          <StatsBar />
        </main>
        
        {/* Detail panel */}
        {(detailPanelOpen || selectedIncidentId) && (
          <aside className="w-96 border-l border-bg-tertiary bg-bg-secondary">
            <IncidentDetail />
          </aside>
        )}
      </div>
    </div>
  );
}

