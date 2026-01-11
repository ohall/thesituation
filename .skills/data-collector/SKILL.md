---
name: data-collector
description: Pattern for building data source collectors that fetch, transform, and deduplicate incident data from external APIs. Use when adding new data sources, fixing collector bugs, or understanding the data pipeline.
metadata:
  author: situation-monitor
  version: "1.0"
---

# Data Collector Pattern

## Collector Interface

Every collector must implement this interface:

```typescript
// src/collectors/base.ts
export interface RawRecord {
  [key: string]: unknown;
}

export interface Incident {
  sourceId: string;
  sourceName: string;
  sourceUrl?: string;
  category: 'fire' | 'police' | 'traffic' | 'transit' | 'weather' | 'utility';
  subcategory?: string;
  severity: 'critical' | 'high' | 'moderate' | 'low' | 'info';
  title: string;
  description?: string;
  location: { type: 'Point'; coordinates: [number, number] } | null;
  locationText?: string;
  eventTime: Date;
  dedupeKey: string;
  rawData: RawRecord;
}

export interface Collector {
  name: string;
  pollIntervalMs: number;
  fetch(): Promise<RawRecord[]>;
  transform(raw: RawRecord): Incident | null;
}
```

## Example: NYC Open Data (Socrata API)

```typescript
// src/collectors/fdny-dispatch.ts
import { Collector, RawRecord, Incident } from './base';

interface FDNYRecord {
  starfire_incident_id: string;
  incident_datetime: string;
  incident_type_desc: string;
  alarm_level: string;
  borough: string;
  street_highway: string;
  latitude: string;
  longitude: string;
}

function mapSeverity(alarmLevel: string): Incident['severity'] {
  const level = parseInt(alarmLevel, 10);
  if (level >= 4) return 'critical';
  if (level >= 3) return 'high';
  if (level >= 2) return 'moderate';
  return 'low';
}

export const fdnyDispatchCollector: Collector = {
  name: 'fdny-dispatch',
  pollIntervalMs: 60_000, // 1 minute
  
  async fetch() {
    const url = 'https://data.cityofnewyork.us/resource/8m42-w767.json';
    const since = new Date(Date.now() - 3600000).toISOString(); // Last hour
    
    const params = new URLSearchParams({
      '$where': `incident_datetime > '${since}'`,
      '$limit': '100',
      '$order': 'incident_datetime DESC',
      '$$app_token': process.env.NYC_OPEN_DATA_TOKEN!,
    });
    
    const res = await fetch(`${url}?${params}`, {
      headers: { 'Accept': 'application/json' },
    });
    
    if (!res.ok) {
      throw new Error(`FDNY API error: ${res.status}`);
    }
    
    return res.json();
  },
  
  transform(raw: RawRecord): Incident | null {
    const record = raw as FDNYRecord;
    
    // Skip records missing required fields
    if (!record.starfire_incident_id || !record.incident_datetime) {
      return null;
    }
    
    // Parse coordinates
    const lat = parseFloat(record.latitude);
    const lng = parseFloat(record.longitude);
    const hasLocation = !isNaN(lat) && !isNaN(lng);
    
    return {
      sourceId: record.starfire_incident_id,
      sourceName: 'FDNY Dispatch',
      sourceUrl: 'https://data.cityofnewyork.us/d/8m42-w767',
      category: 'fire',
      subcategory: record.incident_type_desc,
      severity: mapSeverity(record.alarm_level || '1'),
      title: `${record.incident_type_desc || 'Fire Incident'} - ${record.borough || 'NYC'}`,
      description: `Alarm level ${record.alarm_level}`,
      location: hasLocation 
        ? { type: 'Point', coordinates: [lng, lat] }
        : null,
      locationText: record.street_highway 
        ? `${record.street_highway}, ${record.borough}`
        : record.borough,
      eventTime: new Date(record.incident_datetime),
      dedupeKey: `fdny-dispatch-${record.starfire_incident_id}`,
      rawData: record,
    };
  },
};
```

## Example: REST API (511NY)

```typescript
// src/collectors/511ny-incidents.ts
import { Collector, RawRecord, Incident } from './base';

interface NY511Event {
  id: string;
  headline: string;
  description: string;
  event_type: string;
  severity: string;
  geography: {
    coordinates: [number, number];
  };
  start_time: string;
  road_name: string;
}

function mapSeverity(severity: string): Incident['severity'] {
  switch (severity.toLowerCase()) {
    case 'major': return 'critical';
    case 'moderate': return 'high';
    case 'minor': return 'moderate';
    default: return 'low';
  }
}

export const ny511IncidentsCollector: Collector = {
  name: '511ny-incidents',
  pollIntervalMs: 60_000,
  
  async fetch() {
    const url = 'https://511ny.org/api/v2/get/event';
    
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.NY511_API_KEY}`,
        'Accept': 'application/json',
      },
    });
    
    if (!res.ok) {
      throw new Error(`511NY API error: ${res.status}`);
    }
    
    const data = await res.json();
    return data.events || [];
  },
  
  transform(raw: RawRecord): Incident | null {
    const event = raw as NY511Event;
    
    if (!event.id || !event.geography?.coordinates) {
      return null;
    }
    
    return {
      sourceId: event.id,
      sourceName: '511NY Traffic',
      category: 'traffic',
      subcategory: event.event_type,
      severity: mapSeverity(event.severity),
      title: event.headline,
      description: event.description,
      location: {
        type: 'Point',
        coordinates: event.geography.coordinates,
      },
      locationText: event.road_name,
      eventTime: new Date(event.start_time),
      dedupeKey: `511ny-${event.id}`,
      rawData: event,
    };
  },
};
```

## Example: NWS Weather Alerts (No Auth)

```typescript
// src/collectors/nws-alerts.ts
import { Collector, RawRecord, Incident } from './base';

interface NWSAlert {
  id: string;
  properties: {
    headline: string;
    description: string;
    severity: string;
    urgency: string;
    event: string;
    effective: string;
    expires: string;
    areaDesc: string;
  };
  geometry?: {
    coordinates: number[][][];
  };
}

function mapSeverity(severity: string): Incident['severity'] {
  switch (severity.toLowerCase()) {
    case 'extreme': return 'critical';
    case 'severe': return 'critical';
    case 'moderate': return 'high';
    case 'minor': return 'moderate';
    default: return 'low';
  }
}

export const nwsAlertsCollector: Collector = {
  name: 'nws-alerts',
  pollIntervalMs: 60_000,
  
  async fetch() {
    // NYC metro zone IDs
    const zones = ['NYZ072', 'NYZ073', 'NYZ074', 'NYZ075', 'NYZ176'];
    const url = `https://api.weather.gov/alerts/active?zone=${zones.join(',')}`;
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': process.env.NWS_USER_AGENT || 'SituationMonitor/1.0',
        'Accept': 'application/geo+json',
      },
    });
    
    if (!res.ok) {
      throw new Error(`NWS API error: ${res.status}`);
    }
    
    const data = await res.json();
    return data.features || [];
  },
  
  transform(raw: RawRecord): Incident | null {
    const alert = raw as NWSAlert;
    const props = alert.properties;
    
    if (!alert.id || !props.headline) {
      return null;
    }
    
    // Use centroid of NYC if no geometry
    const defaultLocation: [number, number] = [-73.98, 40.75];
    
    return {
      sourceId: alert.id,
      sourceName: 'NWS Weather',
      category: 'weather',
      subcategory: props.event,
      severity: mapSeverity(props.severity),
      title: props.headline,
      description: props.description?.slice(0, 1000),
      location: {
        type: 'Point',
        coordinates: defaultLocation,
      },
      locationText: props.areaDesc,
      eventTime: new Date(props.effective),
      dedupeKey: `nws-${alert.id}`,
      rawData: alert,
    };
  },
};
```

## Registering Collectors

```typescript
// src/collectors/index.ts
import { Collector } from './base';
import { fdnyDispatchCollector } from './fdny-dispatch';
import { ny511IncidentsCollector } from './511ny-incidents';
import { nwsAlertsCollector } from './nws-alerts';

export const collectors: Collector[] = [
  fdnyDispatchCollector,
  ny511IncidentsCollector,
  nwsAlertsCollector,
];

export function getCollectorByName(name: string): Collector | undefined {
  return collectors.find(c => c.name === name);
}
```

## Processor

```typescript
// src/pipeline/processor.ts
import { Collector, Incident } from '@/collectors/base';
import { upsertIncident } from '@/db/queries';
import { updateSourceHealth } from '@/db/source-health';

export async function processCollector(collector: Collector): Promise<void> {
  const startTime = Date.now();
  
  try {
    // Fetch raw data
    const rawRecords = await collector.fetch();
    
    // Transform records
    const incidents: Incident[] = [];
    for (const raw of rawRecords) {
      try {
        const incident = collector.transform(raw);
        if (incident) {
          incidents.push(incident);
        }
      } catch (err) {
        console.error(`Transform error in ${collector.name}:`, err);
      }
    }
    
    // Upsert to database
    let successCount = 0;
    for (const incident of incidents) {
      try {
        await upsertIncident(incident);
        successCount++;
      } catch (err) {
        console.error(`Upsert error in ${collector.name}:`, err);
      }
    }
    
    // Update source health
    await updateSourceHealth(collector.name, {
      lastSuccessAt: new Date(),
      consecutiveFailures: 0,
      lastRecordCount: successCount,
      avgLatencyMs: Date.now() - startTime,
      status: 'healthy',
    });
    
  } catch (err) {
    console.error(`Collector ${collector.name} failed:`, err);
    
    await updateSourceHealth(collector.name, {
      lastFailureAt: new Date(),
      consecutiveFailures: sql`consecutive_failures + 1`,
      status: sql`CASE WHEN consecutive_failures >= 3 THEN 'failing' ELSE 'degraded' END`,
    });
  }
}
```

## Dedupe Key Guidelines

1. **Always deterministic** — same input produces same key
2. **Include source name** — prevent cross-source collisions
3. **Use source's unique ID** — most reliable identifier
4. **Lowercase and normalize** — consistent formatting

```typescript
function generateDedupeKey(sourceName: string, sourceId: string): string {
  const normalized = sourceName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  return `${normalized}-${sourceId}`;
}
```

## Error Handling Best Practices

1. **Fail gracefully** — skip bad records, don't abort entire batch
2. **Log with context** — include collector name and record ID
3. **Track health** — update `source_health` table on success/failure
4. **Retry logic** — use exponential backoff for transient failures
5. **Rate limiting** — respect API rate limits (usually in headers)

## Testing Collectors

```typescript
// __tests__/collectors/fdny-dispatch.test.ts
import { fdnyDispatchCollector } from '@/collectors/fdny-dispatch';

describe('fdnyDispatchCollector', () => {
  it('transforms valid record', () => {
    const raw = {
      starfire_incident_id: 'SF-2026-12345',
      incident_datetime: '2026-01-11T10:30:00',
      incident_type_desc: 'STRUCTURAL FIRE',
      alarm_level: '3',
      borough: 'MANHATTAN',
      street_highway: '5TH AVE',
      latitude: '40.7580',
      longitude: '-73.9855',
    };
    
    const result = fdnyDispatchCollector.transform(raw);
    
    expect(result).not.toBeNull();
    expect(result?.category).toBe('fire');
    expect(result?.severity).toBe('high');
    expect(result?.dedupeKey).toBe('fdny-dispatch-SF-2026-12345');
  });
  
  it('returns null for invalid record', () => {
    const raw = { incomplete: true };
    expect(fdnyDispatchCollector.transform(raw)).toBeNull();
  });
});
```

