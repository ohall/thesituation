// FDNY Fire Incident Dispatch Data Collector
// Source: NYC Open Data - https://data.cityofnewyork.us/Public-Safety/Fire-Incident-Dispatch-Data/8m42-w767

import {
  Collector,
  RawRecord,
  CollectorResult,
  mapAlarmLevelToSeverity,
  generateDedupeKey,
  parseDate,
  parseNumber,
} from './base';

const DATASET_ID = '8m42-w767';
const BASE_URL = `https://data.cityofnewyork.us/resource/${DATASET_ID}.json`;

// Time window for fetching recent incidents (last 24 hours)
function getTimeFilter(): string {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return since.toISOString();
}

export const fdnyDispatchCollector: Collector = {
  name: 'FDNY Fire Dispatch',
  pollIntervalMs: 60_000, // 1 minute
  
  async fetch(): Promise<RawRecord[]> {
    const token = process.env.NYC_OPEN_DATA_TOKEN;
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };
    
    if (token) {
      headers['X-App-Token'] = token;
    }
    
    const params = new URLSearchParams({
      '$where': `incident_datetime > '${getTimeFilter()}'`,
      '$limit': '100',
      '$order': 'incident_datetime DESC',
    });
    
    const response = await fetch(`${BASE_URL}?${params}`, { headers });
    
    if (!response.ok) {
      throw new Error(`FDNY API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },
  
  transform(raw: RawRecord): CollectorResult | null {
    // Required fields
    const incidentId = raw.starfire_incident_id as string;
    const incidentType = raw.incident_type_desc as string;
    const incidentDatetime = parseDate(raw.incident_datetime);
    
    if (!incidentId || !incidentType || !incidentDatetime) {
      return null;
    }
    
    // Location
    const lon = parseNumber(raw.longitude);
    const lat = parseNumber(raw.latitude);
    const borough = raw.borough as string | undefined;
    const streetHighway = raw.street_highway as string | undefined;
    const zipCode = raw.zipcode as string | undefined;
    
    // Build location text
    const locationParts = [streetHighway, borough, zipCode].filter(Boolean);
    const locationText = locationParts.length > 0 ? locationParts.join(', ') : undefined;
    
    // Alarm level
    const alarmLevel = parseNumber(raw.alarm_level ?? raw.highest_alarm_level);
    const severity = mapAlarmLevelToSeverity(alarmLevel);
    
    // Build title
    const alarmText = alarmLevel && alarmLevel > 1 ? ` - ${alarmLevel}-Alarm` : '';
    const title = `${incidentType}${alarmText}${borough ? ` · ${borough}` : ''}`;
    
    // Units info for description
    const unitsDispatched = raw.engines_assigned_quantity || raw.ladders_assigned_quantity
      ? `Units: ${raw.engines_assigned_quantity || 0} engines, ${raw.ladders_assigned_quantity || 0} ladders`
      : undefined;
    
    return {
      sourceId: incidentId,
      sourceName: 'FDNY Fire Dispatch',
      sourceUrl: `https://data.cityofnewyork.us/d/${DATASET_ID}`,
      
      category: 'fire',
      subcategory: incidentType,
      severity,
      
      title,
      description: unitsDispatched,
      
      locationLon: lon ?? undefined,
      locationLat: lat ?? undefined,
      locationText,
      
      eventTime: incidentDatetime,
      confidence: 0.95,
      dedupeKey: generateDedupeKey('fdny-fire', incidentId),
      
      rawData: raw,
    };
  },
};

