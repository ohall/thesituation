'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fetchBrief } from '@/lib/api';
import { clsx } from 'clsx';

interface Brief {
  brief: string;
  generatedAt: Date;
  incidentCount: number;
  alertCount: number;
  threatLevel?: string;
}

const threatLevelColors: Record<string, string> = {
  low: 'bg-accent-success/20 text-accent-success',
  guarded: 'bg-accent-info/20 text-accent-info',
  elevated: 'bg-accent-warning/20 text-accent-warning',
  high: 'bg-severity-high/20 text-severity-high',
  severe: 'bg-severity-critical/20 text-severity-critical',
};

export function SituationBrief() {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function loadBrief() {
      try {
        setIsLoading(true);
        const data = await fetchBrief();
        setBrief(data as Brief);
        setError(null);
      } catch (err) {
        console.error('Failed to load brief:', err);
        setError('Failed to load situation brief');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadBrief();
    
    // Refresh every 60 seconds
    const interval = setInterval(loadBrief, 60000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="tactical-panel">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="tactical-header w-full text-left"
      >
        <span className="flex items-center gap-2">
          <span className="text-accent-purple">🤖</span>
          AI Situation Brief
        </span>
        <span className="text-xs">
          {isExpanded ? '▼' : '▶'}
        </span>
      </button>
      
      {isExpanded && (
        <div className="p-4">
          {isLoading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-bg-tertiary rounded w-3/4" />
              <div className="h-4 bg-bg-tertiary rounded w-full" />
              <div className="h-4 bg-bg-tertiary rounded w-5/6" />
            </div>
          ) : error ? (
            <p className="text-severity-high text-sm">{error}</p>
          ) : brief ? (
            <>
              {brief.threatLevel && (
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xs text-text-muted uppercase tracking-wide">
                    Threat Level:
                  </span>
                  <span className={clsx(
                    'px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide',
                    threatLevelColors[brief.threatLevel] || 'bg-bg-tertiary text-text-muted'
                  )}>
                    {brief.threatLevel}
                  </span>
                </div>
              )}
              
              <div className="prose prose-sm prose-invert max-w-none">
                <div className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                  {brief.brief.split('**').map((part, i) => 
                    i % 2 === 1 
                      ? <strong key={i} className="text-text-primary font-semibold">{part}</strong>
                      : <span key={i}>{part}</span>
                  )}
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-bg-tertiary flex items-center justify-between text-xs text-text-muted">
                <span>
                  {brief.incidentCount} incidents · {brief.alertCount} alerts
                </span>
                <span>
                  Updated {formatDistanceToNow(brief.generatedAt, { addSuffix: true })}
                </span>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

