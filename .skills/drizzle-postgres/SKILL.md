---
name: drizzle-postgres
description: Drizzle ORM patterns with PostgreSQL and PostGIS for spatial data. Covers schema definition, queries, migrations, spatial operations, and upsert patterns. Use when working with database operations, schema changes, or spatial queries.
metadata:
  author: situation-monitor
  version: "1.0"
---

# Drizzle ORM with PostgreSQL/PostGIS

## Schema Definition

Define tables in `src/db/schema.ts`:

```typescript
import { pgTable, text, uuid, timestamp, decimal, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Custom PostGIS geometry type
const geometry = (name: string, srid = 4326) => 
  text(name).$type<{ type: string; coordinates: number[] }>();

export const incidents = pgTable('incidents', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Source tracking
  sourceId: text('source_id').notNull(),
  sourceName: text('source_name').notNull(),
  sourceUrl: text('source_url'),
  
  // Classification
  category: text('category').notNull(), // fire, police, traffic, transit, weather, utility
  subcategory: text('subcategory'),
  severity: text('severity').notNull(), // critical, high, moderate, low, info
  
  // Content
  title: text('title').notNull(),
  description: text('description'),
  rawData: jsonb('raw_data'),
  
  // Geospatial (stored as text, queried with PostGIS functions)
  location: geometry('location'),
  locationText: text('location_text'),
  
  // Temporal
  eventTime: timestamp('event_time', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  
  // Quality
  confidence: decimal('confidence', { precision: 3, scale: 2 }).default('0.80'),
  dedupeKey: text('dedupe_key').notNull().unique(),
}, (table) => ({
  locationIdx: index('idx_incidents_location').using('gist', sql`${table.location}::geometry`),
  eventTimeIdx: index('idx_incidents_event_time').on(table.eventTime),
  categoryIdx: index('idx_incidents_category').on(table.category),
  severityIdx: index('idx_incidents_severity').on(table.severity),
}));

export type Incident = typeof incidents.$inferSelect;
export type NewIncident = typeof incidents.$inferInsert;
```

## Database Client

```typescript
// src/db/client.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
```

## Basic Queries

```typescript
import { db } from '@/db/client';
import { incidents } from '@/db/schema';
import { eq, and, or, desc, gt, isNull, sql } from 'drizzle-orm';

// Find all active incidents
const activeIncidents = await db.query.incidents.findMany({
  where: isNull(incidents.resolvedAt),
  orderBy: desc(incidents.eventTime),
  limit: 100,
});

// Find by category and severity
const criticalFires = await db.query.incidents.findMany({
  where: and(
    eq(incidents.category, 'fire'),
    eq(incidents.severity, 'critical'),
  ),
});

// Find since timestamp
const recentIncidents = await db.query.incidents.findMany({
  where: gt(incidents.eventTime, new Date(Date.now() - 3600000)),
});
```

## Spatial Queries with PostGIS

```typescript
// Find incidents within bounding box
async function getIncidentsInBbox(
  swLng: number, swLat: number, 
  neLng: number, neLat: number
) {
  return db.select()
    .from(incidents)
    .where(sql`
      ST_Within(
        ${incidents.location}::geometry,
        ST_MakeEnvelope(${swLng}, ${swLat}, ${neLng}, ${neLat}, 4326)
      )
    `);
}

// Find incidents within radius of point
async function getIncidentsNearPoint(
  lng: number, lat: number, 
  radiusMeters: number
) {
  return db.select()
    .from(incidents)
    .where(sql`
      ST_DWithin(
        ${incidents.location}::geography,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        ${radiusMeters}
      )
    `);
}

// Get distance to point
async function getIncidentsWithDistance(lng: number, lat: number) {
  return db.select({
    ...incidents,
    distance: sql<number>`
      ST_Distance(
        ${incidents.location}::geography,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
      )
    `.as('distance'),
  })
  .from(incidents)
  .orderBy(sql`distance`);
}
```

## Upsert Pattern (Deduplication)

Use for idempotent incident insertion:

```typescript
import { sql } from 'drizzle-orm';

async function upsertIncident(incident: NewIncident) {
  const result = await db.insert(incidents)
    .values(incident)
    .onConflictDoUpdate({
      target: incidents.dedupeKey,
      set: {
        description: sql`EXCLUDED.description`,
        severity: sql`EXCLUDED.severity`,
        rawData: sql`EXCLUDED.raw_data`,
        updatedAt: new Date(),
      },
    })
    .returning();
  
  return result[0];
}

// Batch upsert
async function upsertIncidents(records: NewIncident[]) {
  if (records.length === 0) return [];
  
  return db.insert(incidents)
    .values(records)
    .onConflictDoUpdate({
      target: incidents.dedupeKey,
      set: {
        description: sql`EXCLUDED.description`,
        severity: sql`EXCLUDED.severity`,
        rawData: sql`EXCLUDED.raw_data`,
        updatedAt: new Date(),
      },
    })
    .returning();
}
```

## Generating Dedupe Keys

```typescript
function generateDedupeKey(
  sourceName: string, 
  sourceId: string
): string {
  const normalizedSource = sourceName.toLowerCase().replace(/\s+/g, '-');
  return `${normalizedSource}-${sourceId}`;
}

// Example usage
const dedupeKey = generateDedupeKey('FDNY Dispatch', 'SF-2026-12345');
// Result: 'fdny-dispatch-SF-2026-12345'
```

## Aggregation Queries

```typescript
// Count by category
const categoryCounts = await db.select({
  category: incidents.category,
  count: sql<number>`count(*)::int`,
})
.from(incidents)
.where(isNull(incidents.resolvedAt))
.groupBy(incidents.category);

// Count by severity
const severityCounts = await db.select({
  severity: incidents.severity,
  count: sql<number>`count(*)::int`,
})
.from(incidents)
.where(isNull(incidents.resolvedAt))
.groupBy(incidents.severity);

// Time-series aggregation
const hourlyTrend = await db.select({
  hour: sql<string>`date_trunc('hour', ${incidents.eventTime})`,
  count: sql<number>`count(*)::int`,
})
.from(incidents)
.where(gt(incidents.eventTime, sql`NOW() - INTERVAL '24 hours'`))
.groupBy(sql`date_trunc('hour', ${incidents.eventTime})`)
.orderBy(sql`hour`);
```

## Transactions

```typescript
import { db } from '@/db/client';

async function resolveIncidentWithLog(incidentId: string) {
  return db.transaction(async (tx) => {
    // Update incident
    const updated = await tx.update(incidents)
      .set({ resolvedAt: new Date() })
      .where(eq(incidents.id, incidentId))
      .returning();
    
    // Log resolution
    await tx.insert(incidentLogs)
      .values({
        incidentId,
        action: 'resolved',
        timestamp: new Date(),
      });
    
    return updated[0];
  });
}
```

## Migrations

```bash
# Generate migration from schema changes
npx drizzle-kit generate:pg

# Push schema directly (dev only)
npx drizzle-kit push:pg

# Run migrations
npm run db:migrate
```

Migration config in `drizzle.config.ts`:

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

## Raw SQL Escape Hatch

For complex PostGIS operations:

```typescript
const result = await db.execute(sql`
  SELECT 
    id,
    title,
    ST_AsGeoJSON(location) as geojson,
    ST_Distance(
      location::geography,
      ST_SetSRID(ST_MakePoint(-73.98, 40.75), 4326)::geography
    ) as distance_meters
  FROM incidents
  WHERE resolved_at IS NULL
  ORDER BY distance_meters
  LIMIT 20
`);
```

## Type Safety Tips

1. Use `$inferSelect` and `$inferInsert` for type inference
2. Use `sql<ReturnType>` for typed raw SQL expressions
3. Validate input with Zod before database operations
4. Use `.returning()` to get inserted/updated records with types

