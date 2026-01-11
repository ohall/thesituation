import {
  pgTable,
  uuid,
  text,
  timestamp,
  decimal,
  jsonb,
  serial,
  integer,
  index,
  uniqueIndex
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Incident categories and severities
export const incidentCategories = ['fire', 'police', 'traffic', 'transit', 'weather', 'utility'] as const;
export const incidentSeverities = ['critical', 'high', 'moderate', 'low', 'info'] as const;

// Core incidents table
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
  
  // Geospatial - stored as GeoJSON for simplicity (PostGIS geometry in production)
  locationLon: decimal('location_lon', { precision: 11, scale: 8 }),
  locationLat: decimal('location_lat', { precision: 10, scale: 8 }),
  locationText: text('location_text'),
  affectedArea: jsonb('affected_area'), // GeoJSON Polygon
  
  // Temporal
  eventTime: timestamp('event_time', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  
  // Quality
  confidence: decimal('confidence', { precision: 3, scale: 2 }).default('0.80'),
  dedupeKey: text('dedupe_key').notNull().unique(),
}, (table) => ({
  eventTimeIdx: index('idx_incidents_event_time').on(table.eventTime),
  categoryIdx: index('idx_incidents_category').on(table.category),
  severityIdx: index('idx_incidents_severity').on(table.severity),
  dedupeKeyIdx: uniqueIndex('idx_incidents_dedupe_key').on(table.dedupeKey),
}));

// Weather/emergency alerts (CAP-style)
export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceId: text('source_id').notNull().unique(),
  sourceName: text('source_name').notNull(),
  
  headline: text('headline').notNull(),
  description: text('description'),
  instruction: text('instruction'),
  severity: text('severity').notNull(), // extreme, severe, moderate, minor
  urgency: text('urgency'), // immediate, expected, future
  certainty: text('certainty'), // observed, likely, possible
  
  affectedArea: jsonb('affected_area'), // GeoJSON MultiPolygon
  affectedZones: text('affected_zones').array(),
  
  effective: timestamp('effective', { withTimezone: true }),
  expires: timestamp('expires', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  
  rawData: jsonb('raw_data'),
}, (table) => ({
  expiresIdx: index('idx_alerts_expires').on(table.expires),
}));

// Traffic cameras
export const cameras = pgTable('cameras', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceName: text('source_name').notNull(),
  cameraId: text('camera_id').notNull(),
  
  name: text('name').notNull(),
  locationLon: decimal('location_lon', { precision: 11, scale: 8 }),
  locationLat: decimal('location_lat', { precision: 10, scale: 8 }),
  
  snapshotUrl: text('snapshot_url'),
  streamUrl: text('stream_url'),
  
  lastSnapshotAt: timestamp('last_snapshot_at', { withTimezone: true }),
  status: text('status').default('active'), // active, offline, unknown
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  sourceCameraIdx: uniqueIndex('idx_cameras_source_camera').on(table.sourceName, table.cameraId),
}));

// Data source health tracking
export const sourceHealth = pgTable('source_health', {
  id: serial('id').primaryKey(),
  sourceName: text('source_name').notNull().unique(),
  
  lastSuccessAt: timestamp('last_success_at', { withTimezone: true }),
  lastFailureAt: timestamp('last_failure_at', { withTimezone: true }),
  consecutiveFailures: integer('consecutive_failures').default(0),
  
  lastRecordCount: integer('last_record_count'),
  avgLatencyMs: integer('avg_latency_ms'),
  
  status: text('status').default('healthy'), // healthy, degraded, failing
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// User settings (local storage proxy for MVP)
export const userSettings = pgTable('user_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  savedLocations: jsonb('saved_locations').default('[]'),
  alertCategories: text('alert_categories').array().default(sql`ARRAY['fire', 'weather', 'transit']`),
  alertSeverityMin: text('alert_severity_min').default('moderate'),
  
  defaultZoom: integer('default_zoom').default(12),
  defaultCenterLon: decimal('default_center_lon', { precision: 11, scale: 8 }),
  defaultCenterLat: decimal('default_center_lat', { precision: 10, scale: 8 }),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Types for database operations
export type InsertIncident = typeof incidents.$inferInsert;
export type SelectIncident = typeof incidents.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;
export type SelectAlert = typeof alerts.$inferSelect;
export type InsertCamera = typeof cameras.$inferInsert;
export type SelectCamera = typeof cameras.$inferSelect;

