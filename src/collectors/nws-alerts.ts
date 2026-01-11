// NWS Weather Alerts Collector
// Source: NOAA National Weather Service API - https://www.weather.gov/documentation/services-web-api

import {
  Collector,
  RawRecord,
  CollectorResult,
  generateDedupeKey,
  parseDate,
} from './base';

// NWS zones covering NYC/NJ metro area
const NYC_NJ_ZONES = [
  'NYZ072', // Bronx
  'NYZ073', // Kings (Brooklyn)
  'NYZ074', // Queens
  'NYZ075', // Richmond (Staten Island)
  'NYZ176', // Manhattan
  'NJZ002', // Bergen
  'NJZ006', // Essex
  'NJZ008', // Union
  'NJZ012', // Hudson
  'NJZ104', // Middlesex
];

const BASE_URL = 'https://api.weather.gov/alerts/active';

// Map NWS severity to our severity
function mapNwsSeverity(severity: string | undefined): CollectorResult['severity'] {
  switch (severity?.toLowerCase()) {
    case 'extreme':
      return 'critical';
    case 'severe':
      return 'high';
    case 'moderate':
      return 'moderate';
    case 'minor':
      return 'low';
    default:
      return 'info';
  }
}

// Get center point of affected zones (simplified)
function getZoneCenter(zones: string[]): { lon: number; lat: number } | null {
  // NYC center as default for NYC/NJ alerts
  if (zones.some(z => z.startsWith('NYZ') || z.startsWith('NJZ'))) {
    return { lon: -74.006, lat: 40.7128 };
  }
  return null;
}

export const nwsAlertsCollector: Collector = {
  name: 'NWS Weather Alerts',
  pollIntervalMs: 60_000, // 1 minute
  
  async fetch(): Promise<RawRecord[]> {
    const userAgent = process.env.NWS_USER_AGENT || 'SituationMonitor/1.0 (contact@example.com)';
    
    const headers: HeadersInit = {
      'Accept': 'application/geo+json',
      'User-Agent': userAgent,
    };
    
    // Fetch alerts for NYC/NJ zones
    const params = new URLSearchParams({
      'zone': NYC_NJ_ZONES.join(','),
      'status': 'actual',
    });
    
    const response = await fetch(`${BASE_URL}?${params}`, { headers });
    
    if (!response.ok) {
      throw new Error(`NWS API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // NWS returns GeoJSON FeatureCollection
    return data.features?.map((f: { properties: RawRecord }) => f.properties) || [];
  },
  
  transform(raw: RawRecord): CollectorResult | null {
    // Required fields
    const alertId = raw.id as string || raw['@id'] as string;
    const headline = raw.headline as string;
    const event = raw.event as string;
    
    if (!alertId || (!headline && !event)) {
      return null;
    }
    
    // Dates
    const sent = parseDate(raw.sent);
    const effective = parseDate(raw.effective);
    const expires = parseDate(raw.expires);
    const eventTime = effective || sent || new Date();
    
    // Skip expired alerts
    if (expires && expires < new Date()) {
      return null;
    }
    
    // Severity
    const severity = mapNwsSeverity(raw.severity as string);
    
    // Location
    const affectedZones = raw.affectedZones as string[] || [];
    const areaDesc = raw.areaDesc as string || 'NYC Metro Area';
    const center = getZoneCenter(affectedZones);
    
    // Title
    const title = headline || event || 'Weather Alert';
    
    // Description
    const description = raw.description as string;
    const instruction = raw.instruction as string;
    
    return {
      sourceId: alertId,
      sourceName: 'NWS',
      sourceUrl: raw.web as string || 'https://alerts.weather.gov/',
      
      category: 'weather',
      subcategory: event,
      severity,
      
      title,
      description: instruction || description,
      
      locationLon: center?.lon,
      locationLat: center?.lat,
      locationText: areaDesc,
      
      eventTime,
      confidence: 0.99, // Official government source
      dedupeKey: generateDedupeKey('nws', alertId),
      
      rawData: {
        ...raw,
        expires: expires?.toISOString(),
      },
    };
  },
};

