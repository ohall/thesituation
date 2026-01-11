// Core incident types for Situation Monitor

export type IncidentCategory = 
  | 'fire' 
  | 'police' 
  | 'traffic' 
  | 'transit' 
  | 'weather' 
  | 'utility';

export type IncidentSeverity = 
  | 'critical' 
  | 'high' 
  | 'moderate' 
  | 'low' 
  | 'info';

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface GeoPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface Incident {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceUrl?: string;

  category: IncidentCategory;
  subcategory?: string;
  severity: IncidentSeverity;

  title: string;
  description?: string;

  location?: GeoPoint;
  locationText?: string;
  affectedArea?: GeoPolygon;

  // Dates can be Date objects or ISO strings (when coming from API)
  eventTime: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  resolvedAt?: Date | string;

  confidence: number;
  dedupeKey: string;

  rawData?: Record<string, unknown>;
}

export interface Alert {
  id: string;
  sourceId: string;
  sourceName: string;

  headline: string;
  description?: string;
  instruction?: string;

  severity: 'extreme' | 'severe' | 'moderate' | 'minor';
  urgency?: 'immediate' | 'expected' | 'future';
  certainty?: 'observed' | 'likely' | 'possible';

  affectedArea?: GeoPolygon;
  affectedZones?: string[];

  // Dates can be Date objects or ISO strings (when coming from API)
  effective?: Date | string;
  expires?: Date | string;
  createdAt: Date | string;

  rawData?: Record<string, unknown>;
}

export interface Camera {
  id: string;
  sourceName: string;
  cameraId: string;

  name: string;
  location?: GeoPoint;

  snapshotUrl?: string;
  streamUrl?: string;

  // Dates can be Date objects or ISO strings (when coming from API)
  lastSnapshotAt?: Date | string;
  status: 'active' | 'offline' | 'unknown';

  createdAt: Date | string;
}

export interface SourceHealth {
  id: number;
  sourceName: string;
  
  lastSuccessAt?: Date;
  lastFailureAt?: Date;
  consecutiveFailures: number;
  
  lastRecordCount?: number;
  avgLatencyMs?: number;
  
  status: 'healthy' | 'degraded' | 'failing';
  updatedAt: Date;
}

// API response types
export interface IncidentStats {
  total: number;
  byCategory: Record<IncidentCategory, number>;
  bySeverity: Record<IncidentSeverity, number>;
  trend: 'up' | 'down' | 'stable';
}

export interface SituationBrief {
  brief: string;
  generatedAt: Date;
  incidentCount: number;
  alertCount: number;
}

// Collector interface
export interface RawRecord {
  [key: string]: unknown;
}

export interface Collector {
  name: string;
  pollIntervalMs: number;
  fetch(): Promise<RawRecord[]>;
  transform(raw: RawRecord): Omit<Incident, 'id' | 'createdAt' | 'updatedAt'> | null;
}

