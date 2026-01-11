'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useIncidentStore } from '@/stores/incidents';
import { useUIStore } from '@/stores/ui';
import type { Incident } from '@/types/incidents';

// Convert incidents to GeoJSON
function incidentsToGeoJSON(incidents: Incident[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: incidents
      .filter(i => i.location)
      .map(incident => ({
        type: 'Feature' as const,
        id: incident.id,
        geometry: incident.location!,
        properties: {
          id: incident.id,
          title: incident.title,
          category: incident.category,
          severity: incident.severity,
          eventTime: typeof incident.eventTime === 'string'
            ? incident.eventTime
            : incident.eventTime.toISOString(),
          resolved: !!incident.resolvedAt,
        },
      })),
  };
}

// Severity colors for map markers
const severityColors: Record<string, string> = {
  critical: '#ff2d55',
  high: '#ff6b35',
  moderate: '#ffb800',
  low: '#00d4ff',
  info: '#8b5cf6',
};

// Dark tactical map style
const mapStyle: maplibregl.StyleSpecification = {
  version: 8,
  name: 'Tactical Dark',
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [
    {
      id: 'osm-tiles',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export function TacticalMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const { incidents, selectIncident } = useIncidentStore();
  const { mapView, setMapView, setDetailPanelOpen } = useUIStore();
  
  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: mapView.center,
      zoom: mapView.zoom,
      attributionControl: false,
    });
    
    // Add navigation controls
    map.current.addControl(
      new maplibregl.NavigationControl({ showCompass: true }),
      'top-right'
    );
    
    // Add attribution
    map.current.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-right'
    );
    
    // Add scale
    map.current.addControl(
      new maplibregl.ScaleControl({ maxWidth: 100 }),
      'bottom-left'
    );
    
    map.current.on('load', () => {
      if (!map.current) return;
      
      // Add incidents source
      map.current.addSource('incidents', {
        type: 'geojson',
        data: incidentsToGeoJSON(incidents),
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });
      
      // Cluster circle layer
      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'incidents',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#ffb800',
            10, '#ff6b35',
            25, '#ff2d55',
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            10, 30,
            25, 40,
          ],
          'circle-opacity': 0.8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#0a0a0f',
        },
      });
      
      // Cluster count label
      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'incidents',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Bold'],
          'text-size': 12,
        },
        paint: {
          'text-color': '#ffffff',
        },
      });
      
      // Individual incident markers
      map.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'incidents',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'match',
            ['get', 'severity'],
            'critical', severityColors.critical,
            'high', severityColors.high,
            'moderate', severityColors.moderate,
            'low', severityColors.low,
            severityColors.info,
          ],
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#0a0a0f',
          'circle-opacity': 0.9,
        },
      });
      
      // Critical incidents pulse animation layer
      map.current.addLayer({
        id: 'critical-pulse',
        type: 'circle',
        source: 'incidents',
        filter: ['all', 
          ['!', ['has', 'point_count']],
          ['==', ['get', 'severity'], 'critical'],
        ],
        paint: {
          'circle-color': severityColors.critical,
          'circle-radius': 20,
          'circle-opacity': 0.3,
        },
      });
    });
    
    // Click handlers
    map.current.on('click', 'unclustered-point', (e) => {
      if (!e.features?.[0]) return;
      const feature = e.features[0];
      const id = feature.properties?.id;
      if (id) {
        selectIncident(id);
        setDetailPanelOpen(true);
      }
    });
    
    map.current.on('click', 'clusters', async (e) => {
      if (!map.current || !e.features?.[0]) return;
      const features = map.current.queryRenderedFeatures(e.point, {
        layers: ['clusters'],
      });
      const clusterId = features[0].properties?.cluster_id;
      const source = map.current.getSource('incidents') as maplibregl.GeoJSONSource;
      try {
        const zoom = await source.getClusterExpansionZoom(clusterId);
        if (!map.current) return;
        const geometry = features[0].geometry as GeoJSON.Point;
        map.current.easeTo({
          center: geometry.coordinates as [number, number],
          zoom: zoom ?? 14,
        });
      } catch (err) {
        console.error('Error expanding cluster:', err);
      }
    });
    
    // Cursor changes
    map.current.on('mouseenter', 'unclustered-point', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', 'unclustered-point', () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
    });
    map.current.on('mouseenter', 'clusters', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', 'clusters', () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
    });
    
    // Track map movements
    map.current.on('moveend', () => {
      if (!map.current) return;
      const center = map.current.getCenter();
      setMapView({
        center: [center.lng, center.lat],
        zoom: map.current.getZoom(),
      });
    });
    
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);
  
  // Update incidents on map when data changes
  useEffect(() => {
    if (!map.current?.loaded()) return;
    
    const source = map.current.getSource('incidents') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(incidentsToGeoJSON(incidents));
    }
  }, [incidents]);
  
  return (
    <div 
      ref={mapContainer} 
      className="w-full h-full"
      style={{ minHeight: '400px' }}
    />
  );
}

