import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Query parameter schema
const querySchema = z.object({
  bbox: z.string().optional(), // sw_lng,sw_lat,ne_lng,ne_lat
  category: z.string().optional(), // comma-separated categories
  severity: z.string().optional(), // comma-separated severities
  since: z.string().optional(), // ISO date string
  limit: z.coerce.number().min(1).max(500).default(100),
  offset: z.coerce.number().min(0).default(0),
});

// Mock incidents for demo (in production, fetch from database)
const mockIncidents = [
  {
    id: '1',
    sourceId: 'fdny-12345',
    sourceName: 'FDNY Dispatch',
    category: 'fire',
    subcategory: 'Structure Fire',
    severity: 'critical',
    title: '3-Alarm Structure Fire',
    description: 'Multiple units responding to commercial building fire. Heavy smoke visible from 2nd floor. Traffic diversions in effect.',
    locationLon: -73.9442,
    locationLat: 40.6782,
    locationText: '1247 Atlantic Ave, Brooklyn, NY',
    eventTime: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resolvedAt: null,
    confidence: 0.95,
    dedupeKey: 'fdny-12345',
  },
  {
    id: '2',
    sourceId: 'mta-signal-001',
    sourceName: 'MTA Service Alerts',
    category: 'transit',
    subcategory: 'Signal Problems',
    severity: 'high',
    title: 'A/C Train Delays - Signal Problems',
    description: 'A and C trains experiencing 15-20 minute delays due to signal problems at 59th St-Columbus Circle.',
    locationLon: -73.9819,
    locationLat: 40.7681,
    locationText: '59th St-Columbus Circle, Manhattan',
    eventTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resolvedAt: null,
    confidence: 0.98,
    dedupeKey: 'mta-signal-001',
  },
  {
    id: '3',
    sourceId: '511ny-mva-789',
    sourceName: '511NY',
    category: 'traffic',
    subcategory: 'Motor Vehicle Accident',
    severity: 'moderate',
    title: 'MVA with Injuries - BQE',
    description: 'Multi-vehicle accident on Brooklyn-Queens Expressway at Atlantic Ave. Right lane closed. Expect delays.',
    locationLon: -73.9675,
    locationLat: 40.6892,
    locationText: 'BQE at Atlantic Ave, Brooklyn',
    eventTime: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resolvedAt: null,
    confidence: 0.90,
    dedupeKey: '511ny-mva-789',
  },
  {
    id: '4',
    sourceId: 'nypd-assault-456',
    sourceName: 'NYPD Calls for Service',
    category: 'police',
    subcategory: 'Assault in Progress',
    severity: 'high',
    title: 'Police Response - Midtown',
    description: 'Multiple units responding to disturbance call.',
    locationLon: -73.9857,
    locationLat: 40.7484,
    locationText: '7th Ave & 34th St, Manhattan',
    eventTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resolvedAt: new Date().toISOString(),
    confidence: 0.85,
    dedupeKey: 'nypd-assault-456',
  },
  {
    id: '5',
    sourceId: 'coned-outage-999',
    sourceName: 'ConEdison',
    category: 'utility',
    subcategory: 'Power Outage',
    severity: 'moderate',
    title: 'Power Outage - Jamaica, Queens',
    description: '312 customers without power. Crews on scene. ETR: 4:00 PM.',
    locationLon: -73.7949,
    locationLat: 40.6915,
    locationText: 'Jamaica, Queens',
    eventTime: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resolvedAt: null,
    confidence: 0.92,
    dedupeKey: 'coned-outage-999',
  },
  {
    id: '6',
    sourceId: 'nws-winter-2026',
    sourceName: 'NWS New York',
    category: 'weather',
    subcategory: 'Winter Storm',
    severity: 'high',
    title: 'Winter Storm Warning',
    description: 'Heavy snow expected tonight through Monday morning. 8-12 inches accumulation. Travel will become hazardous.',
    locationLon: -74.006,
    locationLat: 40.7128,
    locationText: 'NYC Metro Area',
    eventTime: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resolvedAt: null,
    confidence: 0.99,
    dedupeKey: 'nws-winter-2026',
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = querySchema.parse(Object.fromEntries(searchParams));
    
    let filtered = [...mockIncidents];
    
    // Filter by bounding box
    if (params.bbox) {
      const [swLng, swLat, neLng, neLat] = params.bbox.split(',').map(Number);
      filtered = filtered.filter(i => {
        if (!i.locationLon || !i.locationLat) return false;
        return (
          i.locationLon >= swLng &&
          i.locationLon <= neLng &&
          i.locationLat >= swLat &&
          i.locationLat <= neLat
        );
      });
    }
    
    // Filter by category
    if (params.category) {
      const categories = params.category.split(',');
      filtered = filtered.filter(i => categories.includes(i.category));
    }
    
    // Filter by severity
    if (params.severity) {
      const severities = params.severity.split(',');
      filtered = filtered.filter(i => severities.includes(i.severity));
    }
    
    // Filter by time
    if (params.since) {
      const since = new Date(params.since);
      filtered = filtered.filter(i => new Date(i.eventTime) >= since);
    }
    
    // Pagination
    const total = filtered.length;
    filtered = filtered.slice(params.offset, params.offset + params.limit);
    
    // Transform to API response format
    const incidents = filtered.map(i => ({
      id: i.id,
      sourceId: i.sourceId,
      sourceName: i.sourceName,
      category: i.category,
      subcategory: i.subcategory,
      severity: i.severity,
      title: i.title,
      description: i.description,
      location: i.locationLon && i.locationLat ? {
        type: 'Point',
        coordinates: [i.locationLon, i.locationLat],
      } : null,
      locationText: i.locationText,
      eventTime: i.eventTime,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
      resolvedAt: i.resolvedAt,
      confidence: i.confidence,
      dedupeKey: i.dedupeKey,
    }));
    
    return NextResponse.json({
      incidents,
      meta: {
        total,
        limit: params.limit,
        offset: params.offset,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error fetching incidents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

