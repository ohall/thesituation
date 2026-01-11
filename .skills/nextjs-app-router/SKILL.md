---
name: nextjs-app-router
description: Next.js 14+ App Router patterns including route handlers, server components, client components, SSE streaming, and API design. Use when creating pages, API routes, or working with Next.js-specific features.
metadata:
  author: situation-monitor
  version: "1.0"
---

# Next.js App Router Patterns

## Route Handlers (API Routes)

Create API endpoints in `app/api/[resource]/route.ts`:

```typescript
// app/api/incidents/route.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';

const QuerySchema = z.object({
  bbox: z.string().optional(),
  category: z.string().optional(),
  severity: z.string().optional(),
  since: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(500).default(100),
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Parse and validate query params
  const result = QuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!result.success) {
    return Response.json({ error: result.error.flatten() }, { status: 400 });
  }
  
  const { bbox, category, limit } = result.data;
  
  // Parse bbox if provided: sw_lng,sw_lat,ne_lng,ne_lat
  let bboxCoords = null;
  if (bbox) {
    const coords = bbox.split(',').map(Number);
    if (coords.length === 4 && coords.every(n => !isNaN(n))) {
      bboxCoords = coords;
    }
  }
  
  const incidents = await db.query.incidents.findMany({
    where: and(
      bboxCoords ? sql`ST_Within(location, ST_MakeEnvelope(${bboxCoords[0]}, ${bboxCoords[1]}, ${bboxCoords[2]}, ${bboxCoords[3]}, 4326))` : undefined,
      category ? eq(incidents.category, category) : undefined,
    ),
    limit,
    orderBy: desc(incidents.event_time),
  });
  
  return Response.json(incidents);
}
```

## Server-Sent Events (SSE)

For real-time updates without WebSockets:

```typescript
// app/api/stream/route.ts
export async function GET(request: Request) {
  const encoder = new TextEncoder();
  let lastCheck = new Date();
  
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (type: string, data: unknown) => {
        const message = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };
      
      // Send initial connection confirmation
      sendEvent('connected', { timestamp: lastCheck.toISOString() });
      
      // Poll for updates
      const interval = setInterval(async () => {
        try {
          const newIncidents = await getIncidentsSince(lastCheck);
          if (newIncidents.length > 0) {
            sendEvent('incidents', newIncidents);
          }
          lastCheck = new Date();
        } catch (error) {
          sendEvent('error', { message: 'Poll failed' });
        }
      }, 5000);
      
      // Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
```

## Client Components

Mark client components with the directive:

```typescript
// src/components/map/TacticalMap.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { useIncidentStore } from '@/stores/incidents';

export function TacticalMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const { incidents, selectedId } = useIncidentStore();
  
  // Client-side map initialization
  useEffect(() => {
    if (!mapContainer.current) return;
    // ... map setup
  }, []);
  
  return <div ref={mapContainer} className="w-full h-full" />;
}
```

## Server Components (Default)

Pages are server components by default — don't add 'use client':

```typescript
// app/page.tsx
import { TacticalMap } from '@/components/map/TacticalMap';
import { IncidentSidebar } from '@/components/incidents/IncidentSidebar';
import { getActiveIncidents } from '@/db/queries';

export default async function CommandCenter() {
  // Fetch data on server
  const initialIncidents = await getActiveIncidents({ limit: 100 });
  
  return (
    <div className="flex h-screen bg-bg-primary">
      <IncidentSidebar initialData={initialIncidents} />
      <main className="flex-1">
        <TacticalMap />
      </main>
    </div>
  );
}
```

## Dynamic Routes

```typescript
// app/incidents/[id]/page.tsx
interface Props {
  params: { id: string };
}

export default async function IncidentDetail({ params }: Props) {
  const incident = await db.query.incidents.findFirst({
    where: eq(incidents.id, params.id),
  });
  
  if (!incident) {
    notFound();
  }
  
  return <IncidentDetailView incident={incident} />;
}
```

## Loading & Error States

```typescript
// app/incidents/loading.tsx
export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-bg-tertiary rounded w-1/3 mb-4" />
      <div className="h-4 bg-bg-tertiary rounded w-full mb-2" />
      <div className="h-4 bg-bg-tertiary rounded w-2/3" />
    </div>
  );
}

// app/incidents/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="p-4 bg-red-900/20 rounded">
      <h2>Something went wrong</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

## Route Segment Config

```typescript
// app/api/incidents/route.ts

// Disable static generation for dynamic data
export const dynamic = 'force-dynamic';

// Or set revalidation interval
export const revalidate = 60; // seconds
```

## Common Patterns

### Request Validation
Always validate with Zod at API boundaries:

```typescript
const BodySchema = z.object({
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  severity: z.enum(['critical', 'high', 'moderate', 'low', 'info']),
});
```

### Response Formatting
Use consistent response structure:

```typescript
// Success
return Response.json({ data: incidents, count: incidents.length });

// Error
return Response.json({ error: 'Not found' }, { status: 404 });

// Created
return Response.json(newIncident, { status: 201 });
```

### Headers
Set appropriate cache headers:

```typescript
return Response.json(data, {
  headers: {
    'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
  },
});
```

