import { NextResponse } from 'next/server';

// Incident statistics endpoint
export async function GET() {
  try {
    // Mock stats for demo
    const stats = {
      total: 6,
      active: 5,
      resolved: 1,
      byCategory: {
        fire: 1,
        police: 1,
        traffic: 1,
        transit: 1,
        weather: 1,
        utility: 1,
      },
      bySeverity: {
        critical: 1,
        high: 3,
        moderate: 2,
        low: 0,
        info: 0,
      },
      trend: 'up' as const,
      lastHour: 4,
      last24Hours: 18,
      updatedAt: new Date().toISOString(),
    };
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

