import { create } from 'zustand';

interface MapView {
  center: [number, number]; // [lng, lat]
  zoom: number;
}

interface UIStore {
  // Sidebar state
  sidebarOpen: boolean;
  sidebarTab: 'incidents' | 'alerts' | 'layers';
  
  // Panel state
  detailPanelOpen: boolean;
  briefPanelOpen: boolean;
  
  // Map state
  mapView: MapView;
  visibleLayers: string[];
  
  // Real-time connection
  isConnected: boolean;
  
  // Actions
  toggleSidebar: () => void;
  setSidebarTab: (tab: 'incidents' | 'alerts' | 'layers') => void;
  setDetailPanelOpen: (open: boolean) => void;
  setBriefPanelOpen: (open: boolean) => void;
  setMapView: (view: Partial<MapView>) => void;
  toggleLayer: (layerId: string) => void;
  setConnected: (connected: boolean) => void;
}

// Default center on NYC
const DEFAULT_CENTER: [number, number] = [-73.98, 40.75];
const DEFAULT_ZOOM = 11;

export const useUIStore = create<UIStore>((set) => ({
  // Initial state
  sidebarOpen: true,
  sidebarTab: 'incidents',
  
  detailPanelOpen: false,
  briefPanelOpen: true,
  
  mapView: {
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
  },
  
  visibleLayers: ['incidents', 'alerts', 'cameras'],
  
  isConnected: false,
  
  // Actions
  toggleSidebar: () => set((state) => ({ 
    sidebarOpen: !state.sidebarOpen 
  })),
  
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  
  setDetailPanelOpen: (open) => set({ detailPanelOpen: open }),
  
  setBriefPanelOpen: (open) => set({ briefPanelOpen: open }),
  
  setMapView: (view) => set((state) => ({
    mapView: { ...state.mapView, ...view }
  })),
  
  toggleLayer: (layerId) => set((state) => {
    const layers = state.visibleLayers.includes(layerId)
      ? state.visibleLayers.filter(l => l !== layerId)
      : [...state.visibleLayers, layerId];
    return { visibleLayers: layers };
  }),
  
  setConnected: (connected) => set({ isConnected: connected }),
}));

