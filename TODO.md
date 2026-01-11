# 📋 TODO: Implementation Roadmap

This document tracks all mocked, incomplete, and planned features for the Situation Monitor project.

---

## 🔴 Critical - Core Functionality

### 1. Database Integration
**Status:** Schema exists, but APIs use mock data

- [ ] **Replace mock data in API endpoints with database queries**
  - [ ] `app/api/incidents/route.ts` - Currently returns `mockIncidents` array
  - [ ] `app/api/alerts/route.ts` - Currently returns `mockAlerts` array
  - [ ] `app/api/stats/route.ts` - Currently returns hardcoded stats object
  - [ ] `app/api/stream/route.ts` - Currently sends simulated updates

- [ ] **Implement database query functions**
  - [ ] Create `src/db/queries/incidents.ts` with functions:
    - `getIncidents(filters)` - Spatial & temporal filtering
    - `getIncidentById(id)` - Single incident retrieval
    - `getIncidentStats()` - Aggregation queries
    - `upsertIncident(data)` - Insert/update with deduplication
  - [ ] Create `src/db/queries/alerts.ts` with functions:
    - `getActiveAlerts(filters)` - Active alerts query
    - `upsertAlert(data)` - Insert/update alerts
  - [ ] Add PostGIS spatial queries for bounding box searches

- [ ] **Create database seed script**
  - [ ] Implement `src/db/seed.ts` to populate test data
  - [ ] Add realistic sample incidents across all categories
  - [ ] Include spatial distribution across NYC/NJ metro

---

### 2. Data Collection Pipeline
**Status:** Collectors exist but not running

- [ ] **Implement background job runner**
  - [ ] Create `src/pipeline/scheduler.ts` using `node-cron`
  - [ ] Schedule collectors based on `pollIntervalMs` config
  - [ ] Implement error handling and retry logic
  - [ ] Add source health tracking (update `source_health` table)

- [ ] **Create pipeline processor**
  - [ ] Implement `src/pipeline/processor.ts` to:
    - Execute collector `fetch()` methods
    - Transform raw data with `transform()` methods
    - Upsert to database using dedupe keys
    - Track metrics (latency, success rate, record count)

- [ ] **Add API endpoint to trigger manual collection**
  - [ ] `POST /api/admin/collect` - Trigger specific collector
  - [ ] `POST /api/admin/collect-all` - Run all collectors once

- [ ] **Run collectors as background process**
  - [ ] Option 1: Add to Next.js startup (development)
  - [ ] Option 2: Separate Node.js process (production)
  - [ ] Option 3: Deploy as serverless cron jobs

---

### 3. AI Integration
**Status:** Returns hardcoded brief text

- [ ] **Integrate OpenAI API**
  - [ ] Update `app/api/ai/brief/route.ts` to:
    - Fetch real incidents from database
    - Build context prompt with incident summaries
    - Call OpenAI API (gpt-4o-mini recommended)
    - Stream response or return complete brief
  - [ ] Add environment variable validation for `OPENAI_API_KEY`
  - [ ] Implement token counting and cost tracking
  - [ ] Add caching (brief regenerates every 5-15 minutes)

- [ ] **Improve AI prompt engineering**
  - [ ] Create `src/lib/prompts.ts` with templates:
    - System prompt defining role and format
    - Context building from incident data
    - Response formatting instructions
  - [ ] Test prompt variations for accuracy and conciseness

- [ ] **Add AI brief settings**
  - [ ] Allow user to configure brief style (tactical, detailed, concise)
  - [ ] Add "regenerate" button to force fresh brief
  - [ ] Show timestamp of last generation

---

## 🟡 High Priority - External Data Sources

### 4. NYC Open Data Integration
**Status:** Collectors implemented, need API keys

- [ ] **FDNY Fire Dispatch** (`src/collectors/fdny-dispatch.ts`)
  - [ ] Obtain NYC Open Data app token (optional but recommended)
  - [ ] Add `NYC_OPEN_DATA_TOKEN` to `.env.local`
  - [ ] Test collector with live API
  - [ ] Verify deduplication logic

- [ ] **NYPD Calls for Service** (`src/collectors/nypd-calls.ts`)
  - [ ] Verify dataset ID and endpoint
  - [ ] Test with NYC Open Data token
  - [ ] Map call types to severity levels
  - [ ] Add location parsing logic

### 5. Weather & Alerts
**Status:** Collector implemented, needs testing

- [ ] **NWS Weather Alerts** (`src/collectors/nws-alerts.ts`)
  - [ ] Set `NWS_USER_AGENT` environment variable
  - [ ] Test alert fetching for NYC zones (NYZ072-NYZ178)
  - [ ] Implement alert expiration logic
  - [ ] Parse affected area polygons (CAP format)

### 6. Transit Data
**Status:** Not implemented

- [ ] **MTA Service Alerts**
  - [ ] Create `src/collectors/mta-service-alerts.ts`
  - [ ] Register for MTA API key
  - [ ] Implement GTFS-RT feed parsing
  - [ ] Map service disruptions to incidents
  - [ ] Handle route/station entity relationships

- [ ] **MTA Subway Status**
  - [ ] Create `src/collectors/mta-subway-status.ts`
  - [ ] Parse status JSON endpoint
  - [ ] Extract line-level service changes
  - [ ] Classify severity (delays, suspensions, planned work)

### 7. Traffic & Cameras
**Status:** Not implemented

- [ ] **511NY Traffic Incidents**
  - [ ] Create `src/collectors/511ny-incidents.ts`
  - [ ] Obtain 511NY API key
  - [ ] Parse incident feed (accidents, closures, construction)
  - [ ] Extract location coordinates

- [ ] **511NY Traffic Cameras**
  - [ ] Create `src/collectors/511ny-cameras.ts`
  - [ ] Fetch camera locations and snapshot URLs
  - [ ] Store in `cameras` table
  - [ ] Update snapshot timestamps

### 8. Utility Outages
**Status:** Not implemented

- [ ] **ConEdison Power Outages**
  - [ ] Create `src/collectors/coned-outages.ts`
  - [ ] Scrape or API (check availability)
  - [ ] Parse outage areas (polygons or zip codes)
  - [ ] Track customer count and ETR

- [ ] **PSE&G Outages (NJ)**
  - [ ] Create `src/collectors/pseg-outages.ts`
  - [ ] Check for API or scraping approach
  - [ ] Map to NJ municipalities

---

## 🟢 Medium Priority - Features & UX

### 9. Map Enhancements
**Status:** Basic map working, needs features

- [ ] **PostGIS Spatial Queries**
  - [ ] Convert `location_lon/lat` to PostGIS `geometry(Point, 4326)`
  - [ ] Update schema to use native PostGIS types
  - [ ] Implement `ST_Within` for bounding box queries
  - [ ] Add `ST_DWithin` for radius searches
  - [ ] Create spatial indices (`GIST`)

- [ ] **Map Features**
  - [ ] Add heat map layer for incident density
  - [ ] Implement drawing tools for custom areas
  - [ ] Add geocoding search bar
  - [ ] Show traffic camera overlays
  - [ ] Add weather radar layer (RainViewer API)

### 10. Real-Time Updates
**Status:** SSE endpoint mocked

- [ ] **Implement true SSE streaming**
  - [ ] Query database for incidents since last poll
  - [ ] Push new/updated incidents to connected clients
  - [ ] Add alert notifications via SSE
  - [ ] Implement reconnection logic on client

- [ ] **WebSocket Alternative**
  - [ ] Evaluate if WebSocket is better for bi-directional needs
  - [ ] Implement if needed for future features (chat, collaboration)

### 11. User Settings & Preferences
**Status:** Database table exists, no UI

- [ ] **Implement settings UI**
  - [ ] Create `/settings` page
  - [ ] Allow saving favorite locations
  - [ ] Configure alert categories & severity threshold
  - [ ] Set default map view (center, zoom)

- [ ] **Notification Preferences**
  - [ ] Choose alert delivery (in-app, email, SMS)
  - [ ] Set quiet hours
  - [ ] Configure alert radius

### 12. Incident Detail View
**Status:** Component exists, needs features

- [ ] **Enhance IncidentDetail component**
  - [ ] Show raw source data in expandable section
  - [ ] Display related incidents (nearby, same category)
  - [ ] Add timeline of updates (if incident changes)
  - [ ] Show affected area polygon on map
  - [ ] Add "share incident" functionality

### 13. Analytics & Reporting
**Status:** Not implemented

- [ ] **Create analytics dashboard**
  - [ ] Incident trends over time (hourly, daily, weekly)
  - [ ] Category breakdown charts
  - [ ] Heatmap of incident locations
  - [ ] Source health monitoring dashboard

- [ ] **Export & Reporting**
  - [ ] Export incidents to CSV/JSON
  - [ ] Generate PDF reports
  - [ ] Schedule automated reports (email digest)

---

## 🔵 Low Priority - Polish & Infrastructure

### 14. Testing
**Status:** No tests

- [ ] **Unit Tests**
  - [ ] Test collectors' `transform()` methods
  - [ ] Test database query functions
  - [ ] Test API validation schemas
  - [ ] Use Vitest (already in `package.json`)

- [ ] **Integration Tests**
  - [ ] Test API endpoints with test database
  - [ ] Test collector fetch + transform + upsert pipeline
  - [ ] Test SSE streaming

- [ ] **E2E Tests**
  - [ ] Test map interactions (Playwright/Cypress)
  - [ ] Test incident filtering
  - [ ] Test real-time updates

### 15. Performance Optimization
**Status:** Not optimized

- [ ] **Database Optimization**
  - [ ] Add database connection pooling config
  - [ ] Optimize queries with `EXPLAIN ANALYZE`
  - [ ] Add Redis caching layer for API responses
  - [ ] Implement database read replicas (if needed)

- [ ] **Frontend Optimization**
  - [ ] Lazy load map markers (virtualization)
  - [ ] Implement infinite scroll for incident list
  - [ ] Add service worker for offline support
  - [ ] Optimize bundle size (analyze with `next bundle-analyzer`)

### 16. Deployment & DevOps
**Status:** Local development only

- [ ] **Environment Setup**
  - [ ] Create `.env.local.example` template
  - [ ] Document all required environment variables
  - [ ] Add environment variable validation on startup

- [ ] **Deployment**
  - [ ] Set up Vercel/Netlify deployment
  - [ ] Deploy PostgreSQL (Neon, Supabase, Railway, or self-hosted)
  - [ ] Configure production environment variables
  - [ ] Set up custom domain and SSL

- [ ] **Monitoring**
  - [ ] Add error tracking (Sentry)
  - [ ] Set up uptime monitoring (Uptime Robot, Better Uptime)
  - [ ] Track API response times (Vercel Analytics)
  - [ ] Monitor data source health

- [ ] **CI/CD**
  - [ ] GitHub Actions for lint + type-check
  - [ ] Automated tests on PR
  - [ ] Automatic deployment on merge to main

### 17. Documentation
**Status:** Basic README exists

- [ ] **API Documentation**
  - [ ] Generate OpenAPI/Swagger spec
  - [ ] Create API reference docs
  - [ ] Add example requests/responses

- [ ] **Developer Docs**
  - [ ] Architecture diagram
  - [ ] Data flow documentation
  - [ ] Collector development guide
  - [ ] Contribution guidelines

- [ ] **User Documentation**
  - [ ] User guide for features
  - [ ] FAQ section
  - [ ] Video walkthrough

### 18. Security
**Status:** Basic security, needs hardening

- [ ] **API Security**
  - [ ] Add rate limiting (upstash/rate-limit)
  - [ ] Implement API authentication (optional)
  - [ ] Add CORS configuration
  - [ ] Validate all user inputs with Zod

- [ ] **Infrastructure Security**
  - [ ] Use secrets manager for API keys (not .env in prod)
  - [ ] Enable database SSL connections
  - [ ] Implement CSP headers
  - [ ] Regular dependency updates (Dependabot)

---

## 📊 Feature Completeness Matrix

| Feature | Designed | Implemented | Tested | Deployed |
|---------|----------|-------------|--------|----------|
| Incident API | ✅ | 🔶 Mock | ❌ | ❌ |
| Alerts API | ✅ | 🔶 Mock | ❌ | ❌ |
| Stats API | ✅ | 🔶 Mock | ❌ | ❌ |
| SSE Stream | ✅ | 🔶 Mock | ❌ | ❌ |
| AI Brief | ✅ | 🔶 Mock | ❌ | ❌ |
| Tactical Map | ✅ | ✅ | ❌ | ❌ |
| Incident List | ✅ | ✅ | ❌ | ❌ |
| Alert Strip | ✅ | ✅ | ❌ | ❌ |
| FDNY Collector | ✅ | ✅ | ❌ | ❌ |
| NYPD Collector | ✅ | ✅ | ❌ | ❌ |
| NWS Collector | ✅ | ✅ | ❌ | ❌ |
| MTA Collector | ✅ | ❌ | ❌ | ❌ |
| 511NY Collector | ✅ | ❌ | ❌ | ❌ |
| Utility Collectors | ✅ | ❌ | ❌ | ❌ |
| Data Pipeline | ✅ | ❌ | ❌ | ❌ |
| Database Queries | ✅ | ❌ | ❌ | ❌ |
| User Settings | ✅ | ❌ | ❌ | ❌ |
| Spatial Queries | ✅ | ❌ | ❌ | ❌ |

**Legend:**
- ✅ Complete
- 🔶 Partial / Mocked
- ❌ Not started

---

## 🎯 Recommended Implementation Order

### Phase 1: Core Functionality (Week 1-2)
1. Database query functions (`src/db/queries/`)
2. Replace mock data in API endpoints
3. Implement background job scheduler
4. Connect existing collectors to pipeline

### Phase 2: Data Sources (Week 3-4)
1. Obtain API keys for all sources
2. Test and debug FDNY, NYPD, NWS collectors
3. Implement MTA and 511NY collectors
4. Implement utility outage collectors

### Phase 3: Features (Week 5-6)
1. Real SSE streaming from database
2. OpenAI integration for AI briefs
3. PostGIS spatial queries
4. User settings and preferences

### Phase 4: Polish & Deploy (Week 7-8)
1. Write tests (unit + integration)
2. Performance optimization
3. Production deployment
4. Monitoring and error tracking

---

## 🔧 Environment Variables Needed

Create `.env.local` with:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/situation

# NYC Open Data (optional but recommended for higher rate limits)
NYC_OPEN_DATA_TOKEN=

# Weather
NWS_USER_AGENT=SituationMonitor/1.0 (your@email.com)

# Transit
MTA_API_KEY=

# Traffic
511NY_API_KEY=

# AI
OPENAI_API_KEY=sk-xxx

# Utility APIs (check availability)
CONED_API_KEY=
PSEG_API_KEY=
```

---

## 📝 Notes

- **PostGIS Migration**: Consider migrating `location_lon/lat` columns to PostGIS `geometry(Point, 4326)` for better spatial query performance
- **Caching Strategy**: Implement Redis for caching API responses (especially AI briefs and stats)
- **Rate Limiting**: Most public APIs have rate limits - implement exponential backoff and respect them
- **Data Retention**: Define policy for resolving old incidents (auto-resolve after 7 days?)
- **Multi-tenancy**: Current design is single-user; consider multi-user support for team/enterprise use

---

**Last Updated:** 2026-01-11
