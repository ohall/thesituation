// API client utilities

import type { Incident, Alert, IncidentStats, SituationBrief } from '@/types/incidents';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface IncidentsResponse {
  incidents: Incident[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

interface AlertsResponse {
  alerts: Alert[];
}

export async function fetchIncidents(params?: {
  bbox?: string;
  category?: string;
  severity?: string;
  since?: string;
  limit?: number;
}): Promise<IncidentsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.bbox) searchParams.set('bbox', params.bbox);
  if (params?.category) searchParams.set('category', params.category);
  if (params?.severity) searchParams.set('severity', params.severity);
  if (params?.since) searchParams.set('since', params.since);
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  
  const res = await fetch(`${BASE_URL}/api/incidents?${searchParams}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch incidents: ${res.statusText}`);
  }
  
  const data = await res.json();
  
  // Transform dates
  return {
    ...data,
    incidents: data.incidents.map((i: Record<string, unknown>) => ({
      ...i,
      eventTime: new Date(i.eventTime as string),
      createdAt: new Date(i.createdAt as string),
      updatedAt: new Date(i.updatedAt as string),
      resolvedAt: i.resolvedAt ? new Date(i.resolvedAt as string) : null,
    })),
  };
}

export async function fetchAlerts(params?: {
  active?: boolean;
  severity?: string;
}): Promise<AlertsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.active !== undefined) searchParams.set('active', params.active.toString());
  if (params?.severity) searchParams.set('severity', params.severity);
  
  const res = await fetch(`${BASE_URL}/api/alerts?${searchParams}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch alerts: ${res.statusText}`);
  }
  
  const data = await res.json();
  
  // Transform dates
  return {
    alerts: data.alerts.map((a: Record<string, unknown>) => ({
      ...a,
      effective: a.effective ? new Date(a.effective as string) : null,
      expires: a.expires ? new Date(a.expires as string) : null,
      createdAt: new Date(a.createdAt as string),
    })),
  };
}

export async function fetchStats(): Promise<IncidentStats> {
  const res = await fetch(`${BASE_URL}/api/stats`);
  if (!res.ok) {
    throw new Error(`Failed to fetch stats: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchBrief(): Promise<SituationBrief> {
  const res = await fetch(`${BASE_URL}/api/ai/brief`);
  if (!res.ok) {
    throw new Error(`Failed to fetch brief: ${res.statusText}`);
  }
  
  const data = await res.json();
  return {
    ...data,
    generatedAt: new Date(data.generatedAt),
  };
}

// SSE connection for real-time updates
export function subscribeToUpdates(onMessage: (data: unknown) => void): () => void {
  const eventSource = new EventSource(`${BASE_URL}/api/stream`);
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('Error parsing SSE message:', error);
    }
  };
  
  eventSource.onerror = (error) => {
    console.error('SSE connection error:', error);
  };
  
  return () => {
    eventSource.close();
  };
}

