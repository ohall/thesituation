# SITUATION MONITOR — MVP System Design Proposal
## Simplified Architecture for Solo Developer

**Version:** 1.0  
**Last Updated:** January 11, 2026  
**Related Documents:** PRD-situation-monitor.md, technical-capabilities.md, situation-monitor-data-sources-v2_1.md

---

## Executive Summary

This document proposes a **pragmatic, MVP-focused architecture** for Situation Monitor, optimized for:

- **Solo developer** implementation and maintenance
- **Small user base** (< 10 concurrent users)
- **Low operational cost** (< $50/month target)
- **Speed to market** (8-12 week MVP timeline)
- **Cloud-agnostic** deployment with specific recommendations

**Philosophy:** Start monolithic, extract services only when pain is felt. Optimize for developer velocity, not theoretical scale.

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SINGLE VPS/CONTAINER                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐ │
│  │   Next.js App   │    │   Data Pipeline │    │      PostgreSQL         │ │
│  │  (Frontend +    │◄──►│   (Background   │◄──►│  + PostGIS + pg_cron    │ │
│  │   API Routes)   │    │    Workers)     │    │                         │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────┘ │
│          │                      │                         │                 │
│          │                      │                         │                 │
│          ▼                      ▼                         ▼                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐ │
│  │    MapLibre     │    │   Node-Cron     │    │   Redis (Optional)      │ │
│  │    GL JS        │    │   Scheduler     │    │   (Cache/Pub-Sub)       │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │    External Data Sources      │
                    │  (50+ APIs polled on schedule)│
                    └───────────────────────────────┘
```

### 1.2 Core Principles

| Principle | Implementation |
|-----------|----------------|
| **Monolith First** | Single Next.js app with API routes; no microservices |
| **Boring Technology** | PostgreSQL, Node.js, React — battle-tested, well-documented |
| **Embrace Polling** | Skip complex real-time infra; poll sources, push via SSE |
| **Database as Queue** | Use PostgreSQL for job scheduling (pg_cron) instead of Redis/NATS |
| **Progressive Enhancement** | Core features first; AI/audio/social later |

---

## 2. Technology Stack

### 2.1 Final Stack Selection

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Runtime** | Node.js 20 LTS | Stable, excellent TS support, huge ecosystem |
| **Framework** | Next.js 14+ (App Router) | Full-stack in one; API routes, SSR, great DX |
| **Language** | TypeScript (strict mode) | Type safety across data transforms |
| **Database** | PostgreSQL 16 + PostGIS 3.4 | Spatial queries, mature, free |
| **ORM** | Drizzle ORM | Type-safe, lightweight, SQL-like |
| **Map** | MapLibre GL JS | Free, WebGL, drop-in Mapbox replacement |
| **Styling** | Tailwind CSS | Fast iteration, dark mode built-in |
| **State** | Zustand | Minimal, no boilerplate |
| **Scheduling** | node-cron + pg_cron | In-process for MVP; pg_cron for reliability |
| **Real-time** | Server-Sent Events (SSE) | Simpler than WebSocket; one-way push is sufficient |
| **AI** | OpenAI API (gpt-4o-mini) | Cheapest capable model for summaries |
| **Caching** | PostgreSQL (materialized views) | Skip Redis initially; add later if needed |

### 2.2 What We're NOT Using (and Why)

| Skipped Technology | Why |
|--------------------|-----|
| Microservices | Unnecessary complexity for small user base |
| Kubernetes | Overkill; single container is fine |
| Redis | PostgreSQL handles caching needs initially |
| Message Queues (NATS/RabbitMQ) | Use database tables + polling |
| GraphQL | REST is simpler; no complex client queries needed |
| Elasticsearch | PostgreSQL full-text search + pg_trgm is sufficient |
| WebSockets | SSE is simpler for server→client push |
| Service Workers (initially) | Add for PWA in Phase 2 |

---

## 3. Database Design

### 3.1 Core Schema

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Core incident table (denormalized for simplicity)
CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Source tracking
    source_id TEXT NOT NULL,
    source_name TEXT NOT NULL,
    source_url TEXT,
    
    -- Classification
    category TEXT NOT NULL, -- fire, police, traffic, transit, weather, utility
    subcategory TEXT,
    severity TEXT NOT NULL, -- critical, high, moderate, low, info
    
    -- Content
    title TEXT NOT NULL,
    description TEXT,
    raw_data JSONB,
    
    -- Geospatial
    location GEOMETRY(Point, 4326),
    location_text TEXT, -- human-readable address
    affected_area GEOMETRY(Polygon, 4326),
    
    -- Temporal
    event_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    
    -- Quality
    confidence DECIMAL(3,2) DEFAULT 0.80,
    dedupe_key TEXT NOT NULL,
    
    -- Indexing
    UNIQUE(dedupe_key)
);

-- Spatial and temporal indexes
CREATE INDEX idx_incidents_location ON incidents USING GIST(location);
CREATE INDEX idx_incidents_event_time ON incidents(event_time DESC);
CREATE INDEX idx_incidents_category ON incidents(category);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_active ON incidents(resolved_at) WHERE resolved_at IS NULL;

-- Full-text search
CREATE INDEX idx_incidents_search ON incidents 
    USING GIN(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

-- Alerts (CAP-style weather/emergency alerts)
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id TEXT NOT NULL UNIQUE,
    source_name TEXT NOT NULL,
    
    headline TEXT NOT NULL,
    description TEXT,
    instruction TEXT,
    severity TEXT NOT NULL, -- extreme, severe, moderate, minor
    urgency TEXT, -- immediate, expected, future
    certainty TEXT, -- observed, likely, possible
    
    affected_area GEOMETRY(MultiPolygon, 4326),
    affected_zones TEXT[], -- NWS zone codes, counties, etc.
    
    effective TIMESTAMPTZ,
    expires TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    raw_data JSONB
);

CREATE INDEX idx_alerts_expires ON alerts(expires) WHERE expires > NOW();
CREATE INDEX idx_alerts_area ON alerts USING GIST(affected_area);

-- Cameras
CREATE TABLE cameras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_name TEXT NOT NULL, -- 511NY, NJDOT, NYC DOT
    camera_id TEXT NOT NULL,
    
    name TEXT NOT NULL,
    location GEOMETRY(Point, 4326),
    
    snapshot_url TEXT,
    stream_url TEXT,
    
    last_snapshot_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active', -- active, offline, unknown
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(source_name, camera_id)
);

CREATE INDEX idx_cameras_location ON cameras USING GIST(location);

-- Data source health tracking
CREATE TABLE source_health (
    id SERIAL PRIMARY KEY,
    source_name TEXT NOT NULL,
    
    last_success_at TIMESTAMPTZ,
    last_failure_at TIMESTAMPTZ,
    consecutive_failures INT DEFAULT 0,
    
    last_record_count INT,
    avg_latency_ms INT,
    
    status TEXT DEFAULT 'healthy', -- healthy, degraded, failing
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(source_name)
);

-- Simple job queue (replaces Redis/NATS for MVP)
CREATE TABLE job_queue (
    id SERIAL PRIMARY KEY,
    job_type TEXT NOT NULL,
    payload JSONB,
    
    status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    error TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_pending ON job_queue(scheduled_for) 
    WHERE status = 'pending';

-- User settings (minimal for MVP)
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Saved locations
    saved_locations JSONB DEFAULT '[]',
    
    -- Alert preferences
    alert_categories TEXT[] DEFAULT ARRAY['fire', 'weather', 'transit'],
    alert_severity_min TEXT DEFAULT 'moderate',
    
    -- UI preferences
    default_zoom INT DEFAULT 12,
    default_center GEOMETRY(Point, 4326),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Database Sizing Estimates

| Table | Rows/Day (Est.) | 30-Day Size | Notes |
|-------|-----------------|-------------|-------|
| incidents | ~2,000 | ~50MB | Archive after 30 days |
| alerts | ~50 | ~5MB | NWS, Notify NYC |
| cameras | ~500 (static) | ~1MB | One-time discovery |
| source_health | ~50 (static) | <1MB | One per source |

**Total estimated active database size:** < 200MB

---

## 4. Data Pipeline Architecture

### 4.1 Collector Pattern

Each data source gets a simple collector module:

```typescript
// src/collectors/base.ts
export interface Collector {
  name: string;
  pollIntervalMs: number;
  fetch(): Promise<RawRecord[]>;
  transform(raw: RawRecord): Incident | null;
}

// src/collectors/fdny-dispatch.ts
export const fdnyDispatchCollector: Collector = {
  name: 'fdny-dispatch',
  pollIntervalMs: 60_000, // 1 minute
  
  async fetch() {
    const url = 'https://data.cityofnewyork.us/resource/8m42-w767.json';
    const params = new URLSearchParams({
      '$where': `incident_datetime > '${getLastPollTime()}'`,
      '$limit': '100',
      '$order': 'incident_datetime DESC'
    });
    const res = await fetch(`${url}?${params}`);
    return res.json();
  },
  
  transform(raw) {
    return {
      source_id: raw.starfire_incident_id,
      source_name: 'FDNY Dispatch',
      category: 'fire',
      subcategory: raw.incident_type_desc,
      severity: mapSeverity(raw.alarm_level),
      title: `${raw.incident_type_desc} - ${raw.borough}`,
      location: { type: 'Point', coordinates: [raw.longitude, raw.latitude] },
      location_text: `${raw.street_highway}, ${raw.borough}`,
      event_time: new Date(raw.incident_datetime),
      dedupe_key: `fdny-${raw.starfire_incident_id}`,
      raw_data: raw
    };
  }
};
```

### 4.2 Polling Scheduler

```typescript
// src/pipeline/scheduler.ts
import cron from 'node-cron';
import { collectors } from './collectors';
import { processCollector } from './processor';

export function startScheduler() {
  // Group collectors by poll interval
  const byInterval = groupBy(collectors, c => c.pollIntervalMs);
  
  // 30-second collectors (transit, traffic)
  cron.schedule('*/30 * * * * *', () => {
    byInterval[30_000]?.forEach(processCollector);
  });
  
  // 1-minute collectors (fire, police, 311)
  cron.schedule('* * * * *', () => {
    byInterval[60_000]?.forEach(processCollector);
  });
  
  // 5-minute collectors (utilities, cameras)
  cron.schedule('*/5 * * * *', () => {
    byInterval[300_000]?.forEach(processCollector);
  });
  
  // 15-minute collectors (USGS gauges)
  cron.schedule('*/15 * * * *', () => {
    byInterval[900_000]?.forEach(processCollector);
  });
  
  // Hourly collectors (air quality)
  cron.schedule('0 * * * *', () => {
    byInterval[3_600_000]?.forEach(processCollector);
  });
}
```

### 4.3 Deduplication Strategy

```typescript
// src/pipeline/dedupe.ts
export function generateDedupeKey(incident: Incident): string {
  // Deterministic key based on source + event identity
  const parts = [
    incident.source_name.toLowerCase().replace(/\s+/g, '-'),
    incident.source_id
  ];
  return parts.join('-');
}

export async function upsertIncident(incident: Incident, db: DB) {
  // PostgreSQL UPSERT handles duplicates automatically
  await db.insert(incidents)
    .values(incident)
    .onConflictDoUpdate({
      target: incidents.dedupe_key,
      set: {
        description: incident.description,
        severity: incident.severity,
        updated_at: new Date(),
        raw_data: incident.raw_data
      }
    });
}
```

### 4.4 MVP Data Sources (Phase 1)

Start with the highest-value, easiest-to-integrate sources:

| Source | Type | Poll Interval | Auth | Priority |
|--------|------|---------------|------|----------|
| FDNY Fire Dispatch | Socrata | 60s | App token | P1 |
| FDNY EMS Dispatch | Socrata | 60s | App token | P1 |
| NYPD Calls for Service | Socrata | 60s | App token | P1 |
| 511NY Traffic Incidents | REST | 60s | API key | P1 |
| 511NY Cameras | REST | 5min | API key | P1 |
| NWS Alerts (NY/NJ) | REST | 60s | None | P1 |
| MTA Service Alerts | GTFS-RT | 30s | API key | P2 |
| ConEd Outages | Scrape | 5min | None | P2 |
| USGS Water Gauges | REST | 15min | None | P2 |

---

## 5. API Design

### 5.1 REST Endpoints

```typescript
// Next.js App Router API structure
// app/api/

GET  /api/incidents
     ?bbox=sw_lng,sw_lat,ne_lng,ne_lat
     &category=fire,police,traffic
     &severity=critical,high
     &since=2026-01-11T00:00:00Z
     &limit=100

GET  /api/incidents/[id]

GET  /api/incidents/stats
     ?bbox=...
     ?since=...
     → { total, byCategory, bySeverity, trend }

GET  /api/alerts
     ?active=true
     &bbox=...

GET  /api/cameras
     ?bbox=...
     &status=active

GET  /api/cameras/[id]/snapshot
     → Proxied snapshot image (cache 30s)

GET  /api/sources/health
     → Source status dashboard data

GET  /api/stream
     → SSE stream of new incidents/alerts
```

### 5.2 Server-Sent Events for Real-Time

```typescript
// app/api/stream/route.ts
export async function GET(request: Request) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      // Poll database for new incidents every 5 seconds
      const interval = setInterval(async () => {
        const newIncidents = await getIncidentsSince(lastCheck);
        
        if (newIncidents.length > 0) {
          const data = `data: ${JSON.stringify(newIncidents)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
        
        lastCheck = new Date();
      }, 5000);
      
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

---

## 6. Frontend Architecture

### 6.1 Page Structure

```
app/
├── page.tsx                    # Command Center (main map view)
├── cameras/
│   └── page.tsx               # Camera grid
├── incidents/
│   └── [id]/page.tsx         # Incident detail
├── infrastructure/
│   └── page.tsx               # Infrastructure status dashboard
├── settings/
│   └── page.tsx               # User preferences
└── api/
    ├── incidents/route.ts
    ├── alerts/route.ts
    ├── cameras/route.ts
    ├── stream/route.ts
    └── ai/brief/route.ts
```

### 6.2 State Management

```typescript
// src/stores/incidents.ts
import { create } from 'zustand';

interface IncidentStore {
  incidents: Incident[];
  selectedId: string | null;
  filters: {
    categories: string[];
    severities: string[];
    bbox: BBox | null;
  };
  
  // Actions
  setIncidents: (incidents: Incident[]) => void;
  addIncidents: (incidents: Incident[]) => void;
  selectIncident: (id: string | null) => void;
  setFilter: (key: string, value: any) => void;
}

export const useIncidentStore = create<IncidentStore>((set) => ({
  incidents: [],
  selectedId: null,
  filters: {
    categories: ['fire', 'police', 'traffic', 'transit', 'weather', 'utility'],
    severities: ['critical', 'high', 'moderate'],
    bbox: null
  },
  
  setIncidents: (incidents) => set({ incidents }),
  addIncidents: (newIncidents) => set((state) => ({
    incidents: dedupeAndMerge(state.incidents, newIncidents)
  })),
  selectIncident: (id) => set({ selectedId: id }),
  setFilter: (key, value) => set((state) => ({
    filters: { ...state.filters, [key]: value }
  }))
}));
```

### 6.3 Map Implementation

```typescript
// src/components/TacticalMap.tsx
'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { useIncidentStore } from '@/stores/incidents';

export function TacticalMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const { incidents, selectIncident } = useIncidentStore();
  
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: '/map-style-dark.json', // Custom dark tactical style
      center: [-73.98, 40.75], // NYC
      zoom: 11
    });
    
    map.current.on('load', () => {
      // Add incident source
      map.current!.addSource('incidents', {
        type: 'geojson',
        data: incidentsToGeoJSON(incidents),
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });
      
      // Add layers for each severity
      addIncidentLayers(map.current!);
    });
  }, []);
  
  // Update incidents when data changes
  useEffect(() => {
    if (!map.current) return;
    const source = map.current.getSource('incidents') as maplibregl.GeoJSONSource;
    source?.setData(incidentsToGeoJSON(incidents));
  }, [incidents]);
  
  return (
    <div ref={mapContainer} className="w-full h-full" />
  );
}
```

### 6.4 Dark Tactical Theme

```css
/* src/app/globals.css */
:root {
  /* Backgrounds */
  --bg-primary: #0a0a0f;
  --bg-secondary: #12121a;
  --bg-tertiary: #1a1a24;
  
  /* Accents */
  --accent-info: #00d4ff;
  --accent-success: #00ff88;
  --accent-warning: #ffb800;
  --accent-danger: #ff2d55;
  --accent-purple: #bf5af2;
  
  /* Text */
  --text-primary: #ffffff;
  --text-secondary: #a1a1aa;
  --text-muted: #52525b;
  
  /* Severity */
  --severity-critical: #ff2d55;
  --severity-high: #ff6b35;
  --severity-moderate: #ffb800;
  --severity-low: #00d4ff;
}
```

---

## 7. AI Integration (Minimal MVP)

### 7.1 Situation Brief Generator

```typescript
// app/api/ai/brief/route.ts
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function GET() {
  // Get active incidents
  const incidents = await getActiveIncidents({ limit: 20 });
  const alerts = await getActiveAlerts();
  
  const prompt = `You are a situational awareness analyst. Generate a brief 2-3 paragraph summary of the current situation in the NYC/NJ metro area based on these active incidents and alerts.

Focus on:
1. Most critical/urgent items
2. Transit impacts
3. Weather threats
4. Overall threat level assessment

Active Incidents:
${incidents.map(i => `- ${i.severity.toUpperCase()}: ${i.title} (${i.category})`).join('\n')}

Active Alerts:
${alerts.map(a => `- ${a.headline}`).join('\n')}

Keep the summary concise, professional, and actionable. Use present tense.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // Cheap and fast
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 500,
    temperature: 0.3 // Low creativity for factual summary
  });
  
  return Response.json({
    brief: completion.choices[0].message.content,
    generated_at: new Date().toISOString(),
    incident_count: incidents.length,
    alert_count: alerts.length
  });
}
```

### 7.2 Cost Estimation

| Usage | Model | Tokens/Call | Calls/Hour | Monthly Cost |
|-------|-------|-------------|------------|--------------|
| Situation Brief | gpt-4o-mini | ~800 | 60 | ~$4 |
| Incident Summary | gpt-4o-mini | ~400 | 100 | ~$3 |
| **Total AI Cost** | | | | **~$7-10/month** |

---

## 8. Deployment Architecture

### 8.1 Single VPS Deployment (Recommended for MVP)

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/situation
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - NYC_OPEN_DATA_TOKEN=${NYC_OPEN_DATA_TOKEN}
      - MTA_API_KEY=${MTA_API_KEY}
      - 511NY_API_KEY=${511NY_API_KEY}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgis/postgis:16-3.4
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=situation
      - POSTGRES_PASSWORD=password
    restart: unless-stopped

  # Optional: Caddy for automatic HTTPS
  caddy:
    image: caddy:2
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  caddy_data:
```

### 8.2 Recommended VPS Providers

| Provider | Spec | Price | Notes |
|----------|------|-------|-------|
| **Hetzner** (Recommended) | CX31 (4 vCPU, 8GB RAM) | ~$12/mo | Best value; EU/US datacenters |
| DigitalOcean | Droplet (4GB) | ~$24/mo | Simple; good docs |
| Vultr | High Frequency (4GB) | ~$24/mo | Fast NVMe storage |
| Linode | Dedicated 4GB | ~$36/mo | Reliable |

**Recommendation:** Start with Hetzner CX31 for ~$12/month. More than sufficient for MVP.

### 8.3 Alternative: Railway/Render (PaaS)

If you prefer managed infrastructure:

| Service | What | Price | Notes |
|---------|------|-------|-------|
| Railway | App + Postgres | ~$20-40/mo | Simple deployment; usage-based |
| Render | App + Postgres | ~$25-50/mo | Free tier available |
| Fly.io | App | ~$10-20/mo | Need separate DB |

### 8.4 Map Tiles

| Option | Cost | Notes |
|--------|------|-------|
| **Protomaps** (Recommended) | Free tier / ~$5/mo | Self-hostable PMTiles |
| MapTiler | Free tier (100K/mo) | Commercial option |
| Stadia Maps | Free tier (200K/mo) | Good free tier |

**Recommendation:** Use Protomaps with self-hosted PMTiles file for NYC/NJ region. Store on same VPS.

---

## 9. MVP Feature Priorities

### 9.1 Phase 1 (Weeks 1-4) — Core Map

| Feature | Priority | Effort |
|---------|----------|--------|
| PostgreSQL + PostGIS setup | P1 | 1 day |
| Basic Next.js app shell | P1 | 1 day |
| Dark tactical map with MapLibre | P1 | 2 days |
| FDNY/EMS/NYPD collectors | P1 | 3 days |
| 511NY incidents + cameras | P1 | 2 days |
| NWS weather alerts | P1 | 1 day |
| Incident list sidebar | P1 | 2 days |
| Incident detail panel | P1 | 2 days |
| SSE real-time updates | P1 | 1 day |
| Basic deployment | P1 | 1 day |

### 9.2 Phase 2 (Weeks 5-8) — Enhanced Data

| Feature | Priority | Effort |
|---------|----------|--------|
| MTA transit alerts | P2 | 2 days |
| ConEd/PSE&G outages | P2 | 2 days |
| USGS flood gauges | P2 | 1 day |
| AI Situation Brief | P2 | 2 days |
| Camera grid view | P2 | 2 days |
| Infrastructure status page | P2 | 2 days |
| Source health dashboard | P2 | 1 day |
| Mobile responsive polish | P2 | 2 days |

### 9.3 Phase 3 (Weeks 9-12) — Polish & PWA

| Feature | Priority | Effort |
|---------|----------|--------|
| PWA manifest + service worker | P3 | 2 days |
| Push notifications (Web Push) | P3 | 2 days |
| Saved locations | P3 | 1 day |
| Alert configuration | P3 | 2 days |
| Timeline/history view | P3 | 2 days |
| Offline map tiles | P3 | 1 day |

---

## 10. Operational Considerations

### 10.1 Monitoring (Free Tier)

| Tool | Purpose | Cost |
|------|---------|------|
| **Uptime Kuma** (self-hosted) | Uptime monitoring | Free |
| **Better Stack** (free tier) | Uptime + incidents | Free (5 monitors) |
| PostgreSQL logs | Query performance | Free |
| Next.js built-in | Error tracking | Free |

### 10.2 Backup Strategy

```bash
# Cron job for daily PostgreSQL backup
0 3 * * * pg_dump $DATABASE_URL | gzip > /backups/situation-$(date +%Y%m%d).sql.gz

# Keep 7 days of backups
0 4 * * * find /backups -name "*.sql.gz" -mtime +7 -delete
```

### 10.3 Security Checklist

- [ ] HTTPS via Caddy/Let's Encrypt (automatic)
- [ ] Environment variables for all secrets
- [ ] Rate limiting on API endpoints
- [ ] Input validation with Zod
- [ ] SQL injection prevention (Drizzle ORM)
- [ ] CORS configuration
- [ ] No PII storage

### 10.4 Cost Summary (Monthly)

| Item | Cost |
|------|------|
| VPS (Hetzner CX31) | $12 |
| Domain | ~$1 |
| OpenAI API | ~$10 |
| Map tiles (Protomaps) | Free (self-hosted) |
| Monitoring | Free |
| **Total** | **~$25/month** |

---

## 11. Scaling Path (When Needed)

If the app grows beyond MVP, here's the upgrade path:

| Bottleneck | Solution | When to Apply |
|------------|----------|---------------|
| Database connections | Add PgBouncer | >50 concurrent users |
| Real-time latency | Add Redis pub/sub | Need <1s latency |
| Map tile bandwidth | CDN (Cloudflare free) | >1GB/day tiles |
| API rate limits | Add Redis rate limiting | Abuse detected |
| Background jobs | Switch to BullMQ | Jobs taking >5s |
| Search performance | Add Meilisearch | >100K incidents |
| LLM latency | Add response streaming | Users complaining |

---

## 12. Development Setup

### 12.1 Local Development

```bash
# Clone and install
git clone <repo>
cd situation-monitor
npm install

# Start PostgreSQL (Docker)
docker-compose up -d db

# Run migrations
npm run db:migrate

# Seed with test data (optional)
npm run db:seed

# Start dev server
npm run dev
```

### 12.2 Environment Variables

```bash
# .env.local
DATABASE_URL=postgresql://postgres:password@localhost:5432/situation

# Data source API keys
NYC_OPEN_DATA_TOKEN=xxx
MTA_API_KEY=xxx
511NY_API_KEY=xxx
NWS_USER_AGENT=SituationMonitor/1.0 (contact@example.com)

# AI
OPENAI_API_KEY=sk-xxx

# Optional
SENTRY_DSN=xxx
```

### 12.3 Recommended VS Code Extensions

- Tailwind CSS IntelliSense
- Prisma/Drizzle ORM extension
- ESLint + Prettier
- REST Client (for API testing)
- PostgreSQL extension

---

## 13. Project Structure

```
situation-monitor/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Command Center
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Tailwind + theme
│   ├── cameras/
│   ├── incidents/
│   ├── infrastructure/
│   ├── settings/
│   └── api/
│       ├── incidents/
│       ├── alerts/
│       ├── cameras/
│       ├── stream/
│       └── ai/
├── src/
│   ├── components/               # React components
│   │   ├── map/
│   │   │   ├── TacticalMap.tsx
│   │   │   ├── IncidentMarker.tsx
│   │   │   └── LayerControls.tsx
│   │   ├── incidents/
│   │   │   ├── IncidentCard.tsx
│   │   │   ├── IncidentList.tsx
│   │   │   └── IncidentDetail.tsx
│   │   └── ui/
│   │       ├── StatusBadge.tsx
│   │       └── SeverityIndicator.tsx
│   ├── stores/                   # Zustand stores
│   │   ├── incidents.ts
│   │   └── ui.ts
│   ├── collectors/               # Data source collectors
│   │   ├── base.ts
│   │   ├── fdny-dispatch.ts
│   │   ├── nypd-calls.ts
│   │   ├── 511ny.ts
│   │   ├── nws-alerts.ts
│   │   └── index.ts
│   ├── pipeline/                 # Data pipeline
│   │   ├── scheduler.ts
│   │   ├── processor.ts
│   │   └── dedupe.ts
│   ├── db/                       # Database
│   │   ├── schema.ts             # Drizzle schema
│   │   ├── client.ts
│   │   └── migrations/
│   ├── lib/                      # Utilities
│   │   ├── geo.ts
│   │   └── time.ts
│   └── types/                    # TypeScript types
│       └── incidents.ts
├── public/
│   ├── map-style-dark.json       # MapLibre style
│   └── tiles/                    # PMTiles (optional)
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── drizzle.config.ts
└── README.md
```

---

## 14. Key Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Monolith vs Microservices | **Monolith** | Solo dev; complexity not justified |
| WebSocket vs SSE | **SSE** | Simpler; one-way push sufficient |
| Redis vs PostgreSQL | **PostgreSQL only** | One less service; sufficient for MVP |
| Kubernetes vs Docker Compose | **Docker Compose** | Simpler; adequate for small scale |
| SPA vs SSR | **Next.js (hybrid)** | SEO not critical; SSR for perf |
| Build vs Buy map tiles | **Protomaps (self-host)** | Free; no vendor dependency |
| Real-time polling interval | **5 seconds** | Balance of freshness vs cost |
| Mobile app vs PWA | **PWA** | Single codebase; faster iteration |

---

## 15. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| API rate limits exceeded | Data gaps | Aggressive caching; respect rate limits |
| Source API changes | Collectors break | Tolerant parsing; schema versioning |
| OpenAI API unavailable | No AI summaries | Graceful fallback; show raw data |
| VPS downtime | Total outage | Daily backups; quick redeploy script |
| Solo developer burnout | Project stalls | Ruthless prioritization; ship MVP fast |

---

## Appendix A: Quick Start Commands

```bash
# Development
npm run dev                    # Start dev server
npm run db:migrate             # Run migrations
npm run db:seed                # Seed test data
npm run collectors:test        # Test all collectors

# Production
docker-compose up -d           # Start all services
docker-compose logs -f app     # View logs
docker-compose exec db psql    # Database shell

# Deployment
./deploy.sh                    # Build and deploy
```

---

## Appendix B: API Key Registration Links

| Source | Registration URL | Notes |
|--------|------------------|-------|
| NYC Open Data | https://data.cityofnewyork.us/profile/app_tokens | Free; higher rate limits |
| MTA | https://api.mta.info/#/signup | Free; required for GTFS-RT |
| 511NY | https://511ny.org/developers/daa | Agreement required |
| OpenAI | https://platform.openai.com/api-keys | Pay-as-you-go |
| NWS | No key needed | User-Agent required |

---

## Appendix C: Useful Resources

- [MapLibre GL JS Docs](https://maplibre.org/maplibre-gl-js/docs/)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [NYC Open Data Socrata API](https://dev.socrata.com/)

---

*This design prioritizes shipping a working product over architectural perfection. Scale concerns can be addressed if and when they become real problems.*

