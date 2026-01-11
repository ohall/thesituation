// Base collector interface and utilities

export interface RawRecord {
  [key: string]: unknown;
}

export interface CollectorResult {
  sourceId: string;
  sourceName: string;
  sourceUrl?: string;
  
  category: 'fire' | 'police' | 'traffic' | 'transit' | 'weather' | 'utility';
  subcategory?: string;
  severity: 'critical' | 'high' | 'moderate' | 'low' | 'info';
  
  title: string;
  description?: string;
  
  locationLon?: number;
  locationLat?: number;
  locationText?: string;
  
  eventTime: Date;
  confidence: number;
  dedupeKey: string;
  
  rawData: RawRecord;
}

export interface Collector {
  name: string;
  pollIntervalMs: number;
  
  // Fetch raw data from the source
  fetch(): Promise<RawRecord[]>;
  
  // Transform a raw record into a normalized result
  transform(raw: RawRecord): CollectorResult | null;
}

// Severity mapping helpers
export function mapAlarmLevelToSeverity(alarmLevel: number | string | null): CollectorResult['severity'] {
  const level = typeof alarmLevel === 'string' ? parseInt(alarmLevel, 10) : alarmLevel;
  
  if (!level || level < 1) return 'info';
  if (level === 1) return 'low';
  if (level === 2) return 'moderate';
  if (level === 3) return 'high';
  return 'critical'; // 4+ alarms
}

// Generate deterministic dedupe key
export function generateDedupeKey(sourceName: string, sourceId: string): string {
  return `${sourceName.toLowerCase().replace(/\s+/g, '-')}-${sourceId}`;
}

// Safe date parsing
export function parseDate(value: unknown): Date | null {
  if (!value) return null;
  
  if (value instanceof Date) return value;
  
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
  
  return null;
}

// Safe number parsing
export function parseNumber(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }
  return null;
}

// Extract coordinates from various formats
export function extractCoordinates(raw: RawRecord): { lon: number; lat: number } | null {
  // Direct lon/lat fields
  const lon = parseNumber(raw.longitude ?? raw.lng ?? raw.lon ?? raw.x);
  const lat = parseNumber(raw.latitude ?? raw.lat ?? raw.y);
  
  if (lon !== null && lat !== null) {
    return { lon, lat };
  }
  
  // GeoJSON point
  if (raw.geometry && typeof raw.geometry === 'object') {
    const geom = raw.geometry as { type?: string; coordinates?: number[] };
    if (geom.type === 'Point' && Array.isArray(geom.coordinates) && geom.coordinates.length >= 2) {
      return { lon: geom.coordinates[0], lat: geom.coordinates[1] };
    }
  }
  
  // Location object
  if (raw.location && typeof raw.location === 'object') {
    const loc = raw.location as RawRecord;
    const locLon = parseNumber(loc.longitude ?? loc.lng ?? loc.lon);
    const locLat = parseNumber(loc.latitude ?? loc.lat);
    if (locLon !== null && locLat !== null) {
      return { lon: locLon, lat: locLat };
    }
  }
  
  return null;
}

// Truncate string to max length
export function truncate(str: string | undefined, maxLength: number): string | undefined {
  if (!str) return undefined;
  return str.length > maxLength ? str.slice(0, maxLength - 3) + '...' : str;
}

