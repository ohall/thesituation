'use client';

import { useEffect, useCallback } from 'react';
import { useIncidentStore } from '@/stores/incidents';
import { useUIStore } from '@/stores/ui';
import { fetchIncidents, fetchAlerts, fetchStats, subscribeToUpdates } from '@/lib/api';
import type { Incident } from '@/types/incidents';

export function useDataLoader() {
  const { 
    setIncidents, 
    addIncidents, 
    setAlerts, 
    setStats,
    setLoading, 
    setError 
  } = useIncidentStore();
  
  const { setConnected } = useUIStore();
  
  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [incidentsRes, alertsRes, statsRes] = await Promise.all([
        fetchIncidents(),
        fetchAlerts({ active: true }),
        fetchStats(),
      ]);
      
      setIncidents(incidentsRes.incidents);
      setAlerts(alertsRes.alerts);
      setStats(statsRes);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [setIncidents, setAlerts, setStats, setLoading, setError]);
  
  // Handle real-time updates
  const handleUpdate = useCallback((data: unknown) => {
    const message = data as { type: string; incident?: Incident };
    
    if (message.type === 'connected') {
      setConnected(true);
    } else if (message.type === 'incident' && message.incident) {
      addIncidents([message.incident]);
    }
  }, [setConnected, addIncidents]);
  
  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToUpdates(handleUpdate);
    
    return () => {
      unsubscribe();
      setConnected(false);
    };
  }, [handleUpdate, setConnected]);
  
  // Periodic refresh (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);
  
  return { refresh: loadData };
}

