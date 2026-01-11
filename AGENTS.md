# AGENTS.md — Situation Monitor

> Agent instructions for AI coding assistants working on this codebase.

## Project Overview

**Situation Monitor** is a real-time situational awareness dashboard for the NYC/NJ metro area. It aggregates data from 50+ public APIs (fire, police, transit, weather, utilities) and displays incidents on an interactive tactical map.

**Architecture**: Monolith-first Next.js 14+ app with PostgreSQL/PostGIS backend. Optimized for solo developer, <10 concurrent users, <$50/month operational cost.

## Quick Reference

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20 LTS |
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL 16 + PostGIS 3.4 |
| ORM | Drizzle ORM |
| Map | MapLibre GL JS |
| Styling | Tailwind CSS |
| State | Zustand |
| Real-time | Server-Sent Events (SSE) |
| AI | OpenAI API (gpt-4o-mini) |

## Development Commands

```bash
npm run dev          # Start dev server (use this, not build)
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed test data
npm run lint         # ESLint + type check
npm run test         # Run tests
```

**Important**: Always use `npm run dev` during development sessions. Avoid `npm run build` unless preparing for deployment.

## Code Style & Conventions

### TypeScript
- **Strict mode enabled** — no `any` types; prefer explicit typing
- **Zod** for runtime validation at API boundaries
- Use type inference where obvious; explicit types for function signatures

### File Naming
- Components: `PascalCase.tsx` (e.g., `IncidentCard.tsx`)
- Utilities/hooks: `camelCase.ts` (e.g., `useIncidents.ts`)
- API routes: `route.ts` inside route directories

### Imports
- Prefer `@/` path alias for `src/` directory
- Group imports: React → third-party → local → types

### Components
- Functional components only; use hooks
- Mark client components with `'use client'` directive
- Co-locate styles near components; prefer Tailwind classes

## Project Structure

```
app/                    # Next.js App Router
├── page.tsx            # Command Center (main map view)
├── api/                # API routes
│   ├── incidents/      # Incident CRUD
│   ├── alerts/         # Weather/emergency alerts
│   ├── cameras/        # Traffic cameras
│   └── stream/         # SSE real-time endpoint
src/
├── components/         # React components
│   ├── map/            # MapLibre components
│   ├── incidents/      # Incident-related UI
│   └── ui/             # Shared UI primitives
├── collectors/         # Data source collectors
├── pipeline/           # Data processing pipeline
├── stores/             # Zustand state stores
├── db/                 # Drizzle schema & migrations
├── lib/                # Utility functions
└── types/              # TypeScript type definitions
```

## Key Patterns

### Data Collectors
Each external data source has a collector module in `src/collectors/`:

```typescript
export interface Collector {
  name: string;
  pollIntervalMs: number;
  fetch(): Promise<RawRecord[]>;
  transform(raw: RawRecord): Incident | null;
}
```

When adding new collectors:
1. Create file in `src/collectors/` named after source (e.g., `mta-alerts.ts`)
2. Export collector implementing the `Collector` interface
3. Register in `src/collectors/index.ts`
4. Add poll interval to appropriate cron group in `src/pipeline/scheduler.ts`

### Database Operations
- Use **Drizzle ORM** for all database operations
- Schema defined in `src/db/schema.ts`
- Use UPSERT pattern with `dedupe_key` for idempotent inserts
- Prefer materialized views for expensive aggregations

### API Routes (Next.js App Router)
- Use Route Handlers in `app/api/[resource]/route.ts`
- Return `Response.json()` for JSON responses
- Validate query params with Zod
- Support `bbox` parameter for spatial queries (format: `sw_lng,sw_lat,ne_lng,ne_lat`)

### Real-Time Updates
- Use **Server-Sent Events (SSE)** via `app/api/stream/route.ts`
- Poll database every 5 seconds for new incidents
- Client connects via `EventSource`

### Map Implementation
- Use **MapLibre GL JS** with custom dark tactical style
- GeoJSON source with clustering enabled
- Layer-per-severity for visual hierarchy

## Database Schema Essentials

Primary tables:
- `incidents` — Core incident records with PostGIS geometry
- `alerts` — CAP-style weather/emergency alerts
- `cameras` — Traffic camera metadata
- `source_health` — Data source monitoring

Key columns on `incidents`:
- `location: GEOMETRY(Point, 4326)` — Spatial data
- `dedupe_key: TEXT UNIQUE` — Prevents duplicates
- `category`: fire | police | traffic | transit | weather | utility
- `severity`: critical | high | moderate | low | info

## Environment Variables

Required in `.env.local`:
```
DATABASE_URL=postgresql://...
NYC_OPEN_DATA_TOKEN=xxx
MTA_API_KEY=xxx
511NY_API_KEY=xxx
OPENAI_API_KEY=sk-xxx
```

## Testing Guidelines

- Place tests in `__tests__/` directories adjacent to code
- Mock external APIs; never call real endpoints in tests
- Test collectors with sample response fixtures
- For spatial queries, use known NYC coordinates

## UI/UX Guidelines

### Dark Tactical Theme
The app uses a dark theme optimized for situational awareness:

```css
--bg-primary: #0a0a0f;
--accent-info: #00d4ff;
--accent-danger: #ff2d55;
--severity-critical: #ff2d55;
--severity-high: #ff6b35;
--severity-moderate: #ffb800;
```

- High contrast for readability
- Color-coded severity indicators
- Minimal visual noise; data density is intentional

### Responsive Considerations
- Desktop-first but mobile-usable
- Collapsible sidebars on mobile
- Touch-friendly tap targets (min 44px)

## Common Tasks

### Adding a New Data Source
1. Check `situation-monitor-data-sources-v2_1.md` for API details
2. Create collector in `src/collectors/`
3. Map response to incident schema
4. Generate deterministic `dedupe_key`
5. Register collector and set poll interval

### Adding a New Incident Category
1. Add to `category` enum in schema
2. Add color mapping in theme CSS
3. Add icon in `IncidentMarker.tsx`
4. Update filter UI in sidebar

### Debugging Collector Issues
1. Check `source_health` table for failure counts
2. Review raw API response in `raw_data` JSONB column
3. Validate transform logic with sample data

## Don't Do

- **Don't use microservices** — monolith is intentional
- **Don't add Redis** — PostgreSQL handles caching needs
- **Don't use WebSockets** — SSE is sufficient for one-way push
- **Don't store PII** — no user accounts in MVP
- **Don't over-engineer** — ship fast, optimize when pain is felt

## Agent Skills

This project includes agent skills in `.skills/` for common patterns:
- `nextjs-app-router` — Next.js 14+ App Router conventions
- `drizzle-postgres` — Drizzle ORM with PostgreSQL/PostGIS
- `data-collector` — Pattern for building data source collectors
- `maplibre-react` — MapLibre GL JS in React components

Load these skills when working on related tasks for detailed guidance.

## Safety Boundaries

**Allowed without confirmation:**
- Reading any file
- Running `npm run lint`, `npm run test`
- Editing source files in `src/`, `app/`

**Require explicit permission:**
- `npm install` (adding dependencies)
- Database migrations
- Modifying `docker-compose.yml`
- Any `git push` operations
- Deleting files

## Related Documentation

- `PRD-situation-monitor.md` — Product requirements
- `technical-capabilities.md` — Technical constraints & capabilities  
- `situation-monitor-data-sources-v2_1.md` — Data source catalog
- `system-design-proposal-mvp.md` — Architecture decisions

