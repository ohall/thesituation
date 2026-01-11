import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const querySchema = z.object({
  active: z.coerce.boolean().default(true),
  severity: z.string().optional(),
});

// Mock alerts for demo
const mockAlerts = [
  {
    id: '1',
    sourceId: 'NWS-NY-WSW-2026-001',
    sourceName: 'NWS New York',
    headline: 'Winter Storm Warning',
    description: 'Heavy snow expected. Total snow accumulations of 8 to 12 inches. Winds gusting as high as 35 mph.',
    instruction: 'Travel should be restricted to emergencies only. If you must travel, keep an extra flashlight, food, and water in your vehicle in case of an emergency.',
    severity: 'severe',
    urgency: 'expected',
    certainty: 'likely',
    affectedZones: ['NYZ072', 'NYZ073', 'NYZ074', 'NYZ075', 'NYZ176', 'NYZ177', 'NYZ178'],
    effective: new Date().toISOString(),
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    sourceId: 'NOTIFY-NYC-2026-456',
    sourceName: 'Notify NYC',
    headline: 'Alternate Side Parking Suspended',
    description: 'Alternate Side Parking regulations are suspended for Monday, January 12 due to Winter Storm Warning.',
    instruction: null,
    severity: 'minor',
    urgency: 'future',
    certainty: 'observed',
    affectedZones: ['NYC'],
    effective: new Date().toISOString(),
    expires: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    sourceId: 'MTA-SA-2026-789',
    sourceName: 'MTA',
    headline: 'Service Suspended: A Train',
    description: 'A train service is suspended between 59th St-Columbus Circle and 168th St due to signal problems. Shuttle buses are providing alternate service.',
    instruction: 'Use B, C, or D trains as alternate. Shuttle buses available at Columbus Circle.',
    severity: 'moderate',
    urgency: 'immediate',
    certainty: 'observed',
    affectedZones: ['A-Train-Upper'],
    effective: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    expires: null,
    createdAt: new Date().toISOString(),
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = querySchema.parse(Object.fromEntries(searchParams));
    
    let filtered = [...mockAlerts];
    
    // Filter active alerts
    if (params.active) {
      const now = new Date();
      filtered = filtered.filter(alert => {
        if (!alert.expires) return true;
        return new Date(alert.expires) > now;
      });
    }
    
    // Filter by severity
    if (params.severity) {
      const severities = params.severity.split(',');
      filtered = filtered.filter(a => severities.includes(a.severity));
    }
    
    return NextResponse.json({ alerts: filtered });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

