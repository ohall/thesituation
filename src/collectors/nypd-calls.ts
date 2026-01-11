// NYPD Calls for Service Collector
// Source: NYC Open Data - https://data.cityofnewyork.us/Public-Safety/NYPD-Calls-for-Service-Year-to-Date-/n2zq-pubd

import {
  Collector,
  RawRecord,
  CollectorResult,
  generateDedupeKey,
  parseDate,
  parseNumber,
} from './base';

const DATASET_ID = 'n2zq-pubd';
const BASE_URL = `https://data.cityofnewyork.us/resource/${DATASET_ID}.json`;

// Map call types to severity
function mapCallTypeToSeverity(callType: string | undefined): CollectorResult['severity'] {
  if (!callType) return 'info';
  
  const upper = callType.toUpperCase();
  
  // Critical incidents
  if (upper.includes('SHOOTING') || upper.includes('STABBING') || upper.includes('HOMICIDE')) {
    return 'critical';
  }
  
  // High priority
  if (upper.includes('ASSAULT') || upper.includes('ROBBERY') || upper.includes('BURGLARY IN PROGRESS')) {
    return 'high';
  }
  
  // Moderate priority
  if (upper.includes('DISPUTE') || upper.includes('DISTURBANCE') || upper.includes('LARCENY')) {
    return 'moderate';
  }
  
  // Low priority
  if (upper.includes('NOISE') || upper.includes('PARKING') || upper.includes('AIDED')) {
    return 'low';
  }
  
  return 'info';
}

function getTimeFilter(): string {
  const since = new Date(Date.now() - 6 * 60 * 60 * 1000); // Last 6 hours
  return since.toISOString();
}

export const nypdCallsCollector: Collector = {
  name: 'NYPD Calls for Service',
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
      '$where': `create_date > '${getTimeFilter()}'`,
      '$limit': '100',
      '$order': 'create_date DESC',
    });
    
    const response = await fetch(`${BASE_URL}?${params}`, { headers });
    
    if (!response.ok) {
      throw new Error(`NYPD API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },
  
  transform(raw: RawRecord): CollectorResult | null {
    // Required fields
    const cadNumber = raw.cad_evnt_id as string;
    const callType = raw.typ_desc as string;
    const createDate = parseDate(raw.create_date);
    
    if (!cadNumber || !createDate) {
      return null;
    }
    
    // Location
    const lon = parseNumber(raw.longitude);
    const lat = parseNumber(raw.latitude);
    const borough = raw.boro_nm as string | undefined;
    const precinct = raw.pct as string | undefined;
    
    // Build location text
    const locationParts = [];
    if (precinct) locationParts.push(`Pct ${precinct}`);
    if (borough) locationParts.push(borough);
    const locationText = locationParts.length > 0 ? locationParts.join(', ') : undefined;
    
    // Severity
    const severity = mapCallTypeToSeverity(callType);
    
    // Title
    const title = callType || 'Police Response';
    
    // Status
    const disposition = raw.disposition as string | undefined;
    const isClosed = disposition?.toUpperCase().includes('CLOSED') || 
                     disposition?.toUpperCase().includes('REPORT');
    
    return {
      sourceId: cadNumber,
      sourceName: 'NYPD Calls for Service',
      sourceUrl: `https://data.cityofnewyork.us/d/${DATASET_ID}`,
      
      category: 'police',
      subcategory: callType,
      severity,
      
      title: `${title}${borough ? ` · ${borough}` : ''}`,
      description: disposition ? `Status: ${disposition}` : undefined,
      
      locationLon: lon ?? undefined,
      locationLat: lat ?? undefined,
      locationText,
      
      eventTime: createDate,
      confidence: 0.90,
      dedupeKey: generateDedupeKey('nypd-calls', cadNumber),
      
      rawData: {
        ...raw,
        _resolved: isClosed,
      },
    };
  },
};

