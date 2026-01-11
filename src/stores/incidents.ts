import { create } from 'zustand';
import type { Incident, IncidentCategory, IncidentSeverity, IncidentStats, Alert } from '@/types/incidents';

interface BBox {
  swLng: number;
  swLat: number;
  neLng: number;
  neLat: number;
}

interface IncidentFilters {
  categories: IncidentCategory[];
  severities: IncidentSeverity[];
  bbox: BBox | null;
  since: Date | null;
}

interface IncidentStore {
  // Data
  incidents: Incident[];
  alerts: Alert[];
  selectedIncidentId: string | null;
  stats: IncidentStats | null;
  lastUpdated: Date | null;
  
  // Filters
  filters: IncidentFilters;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setIncidents: (incidents: Incident[]) => void;
  addIncidents: (incidents: Incident[]) => void;
  setAlerts: (alerts: Alert[]) => void;
  selectIncident: (id: string | null) => void;
  setStats: (stats: IncidentStats) => void;
  setFilters: (filters: Partial<IncidentFilters>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed
  getSelectedIncident: () => Incident | null;
  getFilteredIncidents: () => Incident[];
  getActiveAlerts: () => Alert[];
}

export const useIncidentStore = create<IncidentStore>((set, get) => ({
  // Initial state
  incidents: [],
  alerts: [],
  selectedIncidentId: null,
  stats: null,
  lastUpdated: null,
  
  filters: {
    categories: ['fire', 'police', 'traffic', 'transit', 'weather', 'utility'],
    severities: ['critical', 'high', 'moderate'],
    bbox: null,
    since: null,
  },
  
  isLoading: false,
  error: null,
  
  // Actions
  setIncidents: (incidents) => set({ 
    incidents, 
    lastUpdated: new Date() 
  }),
  
  addIncidents: (newIncidents) => set((state) => {
    // Merge and dedupe by id
    const existingIds = new Set(state.incidents.map(i => i.id));
    const uniqueNew = newIncidents.filter(i => !existingIds.has(i.id));
    return { 
      incidents: [...state.incidents, ...uniqueNew],
      lastUpdated: new Date()
    };
  }),
  
  setAlerts: (alerts) => set({ alerts }),
  
  selectIncident: (id) => set({ selectedIncidentId: id }),
  
  setStats: (stats) => set({ stats }),
  
  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters }
  })),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  // Computed getters
  getSelectedIncident: () => {
    const { incidents, selectedIncidentId } = get();
    return incidents.find(i => i.id === selectedIncidentId) ?? null;
  },
  
  getFilteredIncidents: () => {
    const { incidents, filters } = get();
    return incidents.filter(incident => {
      // Filter by category
      if (!filters.categories.includes(incident.category)) {
        return false;
      }
      
      // Filter by severity
      if (!filters.severities.includes(incident.severity)) {
        return false;
      }
      
      // Filter by bounding box
      if (filters.bbox && incident.location) {
        const [lng, lat] = incident.location.coordinates;
        const { swLng, swLat, neLng, neLat } = filters.bbox;
        if (lng < swLng || lng > neLng || lat < swLat || lat > neLat) {
          return false;
        }
      }
      
      // Filter by time
      if (filters.since && incident.eventTime < filters.since) {
        return false;
      }
      
      return true;
    });
  },
  
  getActiveAlerts: () => {
    const { alerts } = get();
    const now = new Date();
    return alerts.filter(alert => {
      if (alert.expires && alert.expires < now) {
        return false;
      }
      return true;
    });
  },
}));

