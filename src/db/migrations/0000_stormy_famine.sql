CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" text NOT NULL,
	"source_name" text NOT NULL,
	"headline" text NOT NULL,
	"description" text,
	"instruction" text,
	"severity" text NOT NULL,
	"urgency" text,
	"certainty" text,
	"affected_area" jsonb,
	"affected_zones" text[],
	"effective" timestamp with time zone,
	"expires" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"raw_data" jsonb,
	CONSTRAINT "alerts_source_id_unique" UNIQUE("source_id")
);
--> statement-breakpoint
CREATE TABLE "cameras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_name" text NOT NULL,
	"camera_id" text NOT NULL,
	"name" text NOT NULL,
	"location_lon" numeric(11, 8),
	"location_lat" numeric(10, 8),
	"snapshot_url" text,
	"stream_url" text,
	"last_snapshot_at" timestamp with time zone,
	"status" text DEFAULT 'active',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" text NOT NULL,
	"source_name" text NOT NULL,
	"source_url" text,
	"category" text NOT NULL,
	"subcategory" text,
	"severity" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"raw_data" jsonb,
	"location_lon" numeric(11, 8),
	"location_lat" numeric(10, 8),
	"location_text" text,
	"affected_area" jsonb,
	"event_time" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"confidence" numeric(3, 2) DEFAULT '0.80',
	"dedupe_key" text NOT NULL,
	CONSTRAINT "incidents_dedupe_key_unique" UNIQUE("dedupe_key")
);
--> statement-breakpoint
CREATE TABLE "source_health" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_name" text NOT NULL,
	"last_success_at" timestamp with time zone,
	"last_failure_at" timestamp with time zone,
	"consecutive_failures" integer DEFAULT 0,
	"last_record_count" integer,
	"avg_latency_ms" integer,
	"status" text DEFAULT 'healthy',
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_health_source_name_unique" UNIQUE("source_name")
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"saved_locations" jsonb DEFAULT '[]',
	"alert_categories" text[] DEFAULT ARRAY['fire', 'weather', 'transit'],
	"alert_severity_min" text DEFAULT 'moderate',
	"default_zoom" integer DEFAULT 12,
	"default_center_lon" numeric(11, 8),
	"default_center_lat" numeric(10, 8),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_alerts_expires" ON "alerts" USING btree ("expires");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_cameras_source_camera" ON "cameras" USING btree ("source_name","camera_id");--> statement-breakpoint
CREATE INDEX "idx_incidents_event_time" ON "incidents" USING btree ("event_time");--> statement-breakpoint
CREATE INDEX "idx_incidents_category" ON "incidents" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_incidents_severity" ON "incidents" USING btree ("severity");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_incidents_dedupe_key" ON "incidents" USING btree ("dedupe_key");