# SITUATION MONITOR — Technical Capabilities Document
## Required Technical Capabilities for Implementation

**Version:** 1.0  
**Last Updated:** January 11, 2026  
**Related Documents:** PRD-situation-monitor.md, situation-monitor-data-sources-v2_1.md

---

## Executive Summary

This document enumerates the technical capabilities required to implement the Situation Monitor platform as defined in the PRD, integrating 50+ real-time OSINT data sources. Capabilities are organized by domain and include specific technologies, skills, and infrastructure requirements.

---

## 1. Frontend Architecture Capabilities

### 1.1 Core Framework Expertise

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **React 19+ / SolidJS** | Expert-level | Primary UI framework; requires understanding of concurrent features, Suspense, Server Components |
| **TypeScript** | Advanced | Type safety across large codebase; complex data models for 6 canonical entity types |
| **State Management (Zustand/Jotai)** | Intermediate | Lightweight reactive state for real-time data; subscription patterns |
| **WebSocket Client** | Advanced | Bidirectional real-time communication; reconnection strategies; message queuing |

### 1.2 Progressive Web App (PWA) Capabilities

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **Service Worker Implementation** | Advanced | Offline caching, background sync, push notifications |
| **Web App Manifest** | Intermediate | "Add to Home Screen" functionality; app-like experience |
| **Web Push API** | Advanced | Critical alert delivery when browser closed |
| **Cache API / IndexedDB** | Intermediate | Offline map tiles; incident state persistence |
| **Background Sync API** | Intermediate | Deferred alert delivery; offline action queuing |

### 1.3 Responsive & Mobile Web

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **Mobile-First CSS** | Advanced | Bottom sheet UI, swipe gestures, safe area handling |
| **Touch Gesture Handling** | Intermediate | Pinch-zoom, swipe navigation, long-press context menus |
| **CSS Container Queries** | Intermediate | Component-level responsiveness for panels/cards |
| **Hardware Acceleration** | Intermediate | 60fps animations on mid-tier mobile devices |
| **Reduced Motion / Data Modes** | Basic | Accessibility compliance; battery/bandwidth savings |

### 1.4 Mapping & Geospatial Visualization

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **MapLibre GL JS** | Expert-level | Core map rendering; WebGL-based; touch-optimized |
| **GeoJSON Processing** | Advanced | All incident/alert geometries; polygon overlays; clustering |
| **Custom Map Styling** | Advanced | Dark tactical aesthetic; severity gradients; glow effects |
| **Layer Management** | Advanced | 15+ toggle-able layers with zoom-level density control |
| **Marker Animation** | Intermediate | Pulsing incidents; flashing alerts; expanding threat rings |
| **Tile Caching** | Intermediate | Offline map support; reduced bandwidth |

### 1.5 Real-Time Data Visualization

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **Live Data Binding** | Advanced | Sub-second UI updates for 50+ concurrent feeds |
| **Time-Series Charts** | Intermediate | Trend arrows, gauge visualizations, timeline scrubber |
| **Data Streaming UI Patterns** | Advanced | Ticker feeds, auto-scrolling lists, fade-in animations |
| **Cluster Visualization** | Intermediate | Dynamic clustering/unclustering on zoom |

### 1.6 Media Integration

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **HLS/DASH Video Streaming** | Intermediate | Camera feed playback; adaptive bitrate |
| **Picture-in-Picture API** | Basic | Camera preview overlays on map |
| **Web Audio API** | Intermediate | Scanner/dispatch audio playback |
| **Image Optimization** | Intermediate | Camera snapshot thumbnails; lazy loading |

### 1.7 Design System Implementation

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **Tailwind CSS** | Advanced | Utility-first styling; dark mode theming |
| **CSS Custom Properties** | Intermediate | Dynamic theming; severity color system |
| **Animation (CSS + Motion)** | Intermediate | Purposeful micro-interactions; page transitions |
| **Typography System** | Intermediate | Multi-font hierarchy (Geist, JetBrains Mono, Overpass Mono) |
| **Component Library Development** | Advanced | Incident cards, status badges, map markers |

---

## 2. Backend Architecture Capabilities

### 2.1 API Layer

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **Node.js/Bun or Go** | Advanced | High-throughput HTTP/WebSocket server; concurrent data collectors |
| **REST API Design** | Advanced | Client-facing API for incidents, alerts, cameras, settings |
| **GraphQL (Optional)** | Intermediate | Flexible querying for complex incident relationships |
| **WebSocket Server** | Advanced | Real-time push to clients; pub/sub channels per data type |
| **Rate Limiting** | Intermediate | Protect upstream sources; abuse prevention |
| **API Versioning** | Basic | Backward compatibility for client updates |

### 2.2 Authentication & Authorization

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **OAuth 2.0 with PKCE** | Advanced | X (Twitter) integration; client-side auth flow |
| **JWT Handling** | Intermediate | Session management; token refresh |
| **API Key Management** | Intermediate | User API access for premium features |
| **Role-Based Access Control** | Basic | Operator mode; premium feature gating |

### 2.3 Data Pipeline Architecture

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **Message Queue (Redis Streams/NATS)** | Advanced | Decouple collectors from processors; handle burst traffic |
| **Event-Driven Architecture** | Advanced | Pipeline: Fetch → Normalize → Dedupe → Enrich → Store → Publish |
| **Worker Pool Management** | Intermediate | Parallel data collection across 50+ sources |
| **Backpressure Handling** | Intermediate | Graceful degradation under load |

### 2.4 Data Collection Capabilities

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **HTTP Client (Polling)** | Advanced | REST APIs, Socrata SODA, JSON/XML endpoints |
| **GTFS-RT Protocol Buffers** | Advanced | MTA, NJT, PATH transit feeds |
| **WebSocket Client** | Intermediate | Bluesky firehose, streaming APIs |
| **SOAP/XML Parsing** | Basic | RadioReference metadata API |
| **Rate Limit Compliance** | Advanced | Exponential backoff; conditional requests (ETag/If-Modified-Since) |
| **Error Recovery** | Advanced | Retry strategies; circuit breakers; dead letter queues |

### 2.5 Data Normalization & Enrichment

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **Schema Transformation** | Advanced | Map 50+ source schemas to 6 canonical entity types |
| **Geocoding** | Advanced | Address-to-coordinate conversion; reverse geocoding |
| **Geolocation Extraction** | Intermediate | Parse locations from unstructured text (social posts) |
| **Deduplication** | Advanced | Cross-source event matching; deterministic dedupe keys |
| **Confidence Scoring** | Intermediate | Source tier weighting; corroboration multipliers; recency decay |
| **Entity Linking** | Intermediate | Connect related incidents (fire → traffic → power outage) |

---

## 3. Database & Storage Capabilities

### 3.1 Primary Database

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **PostgreSQL** | Advanced | Primary relational store; ACID transactions |
| **PostGIS Extension** | Advanced | Spatial queries; polygon containment; proximity search |
| **TimescaleDB Extension** | Intermediate | Time-series data (observations, sensor readings) |
| **Partitioning** | Intermediate | Table partitioning by time for incident history |
| **Query Optimization** | Advanced | Index strategy for spatial + temporal + category queries |

### 3.2 Caching Layer

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **Redis** | Advanced | Hot data cache; pub/sub for real-time events |
| **Cache Invalidation Strategies** | Intermediate | TTL-based; event-driven invalidation |
| **Geospatial Redis (GEOADD)** | Intermediate | Fast proximity queries for nearby incidents |

### 3.3 Search Infrastructure

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **Meilisearch / Elasticsearch** | Intermediate | Full-text incident search; faceted filtering |
| **Geo-Search** | Intermediate | Bounding box and radius queries |
| **Real-Time Indexing** | Intermediate | Sub-second index updates for live search |

### 3.4 Object Storage

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **S3-Compatible Storage** | Basic | Camera snapshots; audio clips; export files |
| **CDN Integration** | Basic | Low-latency media delivery |

---

## 4. AI & Machine Learning Capabilities

### 4.1 Natural Language Processing

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **LLM Integration (OpenAI / Local)** | Advanced | AI Situation Brief generation; incident summarization |
| **Prompt Engineering** | Advanced | Consistent, accurate summaries from multi-source data |
| **Streaming LLM Responses** | Intermediate | Real-time summary updates |
| **Context Window Management** | Intermediate | Fit multiple incident data into token limits |

### 4.2 Text Analysis

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **Named Entity Recognition (NER)** | Intermediate | Extract locations, organizations, times from text |
| **Geolocation Extraction** | Advanced | Parse addresses, landmarks, intersections from social posts |
| **Keyword Extraction** | Basic | Tag incidents with relevant terms |
| **Sentiment / Urgency Detection** | Basic | Prioritize high-urgency social signals |

### 4.3 Audio Processing

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **Speech-to-Text (Whisper / Cloud)** | Advanced | Scanner/dispatch audio transcription |
| **Real-Time Transcription** | Intermediate | Live transcript display during audio playback |
| **Keyword Spotting** | Basic | Highlight incident-related terms in transcripts |

### 4.4 Trend Detection & Prediction

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **Anomaly Detection** | Intermediate | Identify unusual call volume spikes; activity clustering |
| **Time-Series Forecasting** | Basic | Predict flood risk from upstream gauge data |
| **Cascade Prediction** | Basic | Model transit delay propagation |

### 4.5 Computer Vision (Future)

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **Scene Classification** | Basic | Camera feed analysis: crowd density, traffic level, visibility |
| **Object Detection** | Basic | Smoke, flood water, vehicle crash detection |

---

## 5. Real-Time & Streaming Capabilities

### 5.1 WebSocket Infrastructure

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **WebSocket Server Scaling** | Advanced | Handle thousands of concurrent client connections |
| **Room/Channel Management** | Intermediate | Per-layer, per-region subscription channels |
| **Message Compression** | Basic | Reduce bandwidth for mobile clients |
| **Heartbeat / Reconnection** | Intermediate | Detect dead connections; graceful reconnection |

### 5.2 Event Streaming

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **Pub/Sub Pattern** | Advanced | Broadcast new incidents to subscribed clients |
| **Event Ordering** | Intermediate | Ensure chronological delivery |
| **Replay Capability** | Basic | Client can request missed events after reconnect |

### 5.3 Polling Orchestration

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **Scheduled Task Management** | Advanced | 50+ sources with varying poll intervals (30s to 1hr) |
| **Jitter / Staggering** | Intermediate | Prevent thundering herd on source APIs |
| **Health Monitoring** | Intermediate | Detect failed collectors; alert on source outages |

---

## 6. Integration Capabilities

### 6.1 API Integration Patterns

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **REST Client** | Advanced | Majority of data sources |
| **SODA (Socrata) Client** | Intermediate | NYC Open Data (5+ datasets) |
| **GTFS-RT Protobuf Parsing** | Advanced | MTA, NJT, PATH, Amtrak transit feeds |
| **CAP (Common Alerting Protocol)** | Intermediate | NWS alerts, FEMA IPAWS |
| **GeoJSON Parsing** | Advanced | Incident geometries from all sources |
| **XML/SOAP** | Basic | RadioReference, some legacy feeds |

### 6.2 Authentication Handling

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **API Key Management** | Advanced | Store, rotate, and inject keys for 20+ authenticated sources |
| **OAuth 2.0 Client** | Advanced | X (Twitter) API, potentially others |
| **Rate Limit Tracking** | Intermediate | Per-source rate limit awareness; backoff strategies |

### 6.3 Specific Source Integrations

| Source Category | Count | Key Challenges |
|-----------------|-------|----------------|
| NYC Open Data (Socrata) | 7+ | Schema drift; incremental polling; field mapping |
| Transit (GTFS-RT) | 5+ | Protobuf parsing; feed stability; alert aggregation |
| Traffic (511NY/NJ) | 2 | Camera discovery; incident normalization |
| Weather (NOAA/NWS) | 4+ | CAP parsing; polygon handling; forecast grids |
| Utilities | 6+ | Reverse-engineered endpoints; undocumented APIs |
| Social/OSINT | 5+ | Rate limits; trust scoring; geolocation extraction |
| Cameras | 50+ | Stream URL discovery; snapshot polling; status tracking |

---

## 7. Geospatial Capabilities

### 7.1 Spatial Data Processing

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **Coordinate Systems** | Intermediate | WGS84; projections for distance calculations |
| **Polygon Operations** | Advanced | Intersection, containment, buffer zones |
| **Geocoding/Reverse Geocoding** | Advanced | Address resolution; coordinate-to-neighborhood |
| **Clustering Algorithms** | Intermediate | Dynamic marker clustering on map |
| **Spatial Indexing** | Intermediate | R-tree/GiST indexes for fast queries |

### 7.2 Map Tile Infrastructure

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **Vector Tile Serving** | Intermediate | Custom dark map style; dynamic styling |
| **Tile Caching** | Intermediate | Reduce load; enable offline |
| **Style Specification (MapLibre)** | Advanced | Dark tactical theme; dynamic layers |

---

## 8. Infrastructure & DevOps Capabilities

### 8.1 Deployment & Orchestration

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **Container Orchestration (Kubernetes/Docker)** | Advanced | Microservices deployment; scaling collectors |
| **CI/CD Pipeline** | Intermediate | Automated testing, build, deploy |
| **Infrastructure as Code** | Intermediate | Reproducible environments |
| **Blue-Green / Canary Deployments** | Basic | Zero-downtime updates |

### 8.2 Scaling & Performance

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **Horizontal Scaling** | Advanced | Handle traffic spikes during major events |
| **Auto-Scaling** | Intermediate | Dynamic resource allocation |
| **Load Balancing** | Intermediate | WebSocket-aware load balancing |
| **CDN Configuration** | Intermediate | Static assets; map tiles; camera snapshots |

### 8.3 Monitoring & Observability

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **Application Performance Monitoring** | Advanced | Latency tracking; error rates; throughput |
| **Log Aggregation** | Intermediate | Centralized logs from all services |
| **Distributed Tracing** | Intermediate | Request flow across microservices |
| **Alerting** | Intermediate | PagerDuty/Slack alerts on failures |
| **Uptime Monitoring** | Basic | External availability checks |

### 8.4 Data Source Health Monitoring

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **Feed Health Dashboard** | Advanced | Per-source status, latency, error rate |
| **Stale Data Detection** | Intermediate | Alert when source stops updating |
| **Automatic Failover** | Basic | Switch to backup sources when primary fails |

---

## 9. Security Capabilities

### 9.1 Application Security

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **TLS 1.3 Everywhere** | Required | Encryption in transit |
| **OWASP Top 10 Mitigation** | Advanced | XSS, CSRF, injection prevention |
| **Content Security Policy** | Intermediate | Prevent script injection |
| **Rate Limiting / DDoS Protection** | Intermediate | Abuse prevention |

### 9.2 Data Security

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **Encryption at Rest** | Intermediate | Database encryption |
| **Secret Management** | Advanced | Secure API key storage (Vault, AWS Secrets Manager) |
| **PII Handling** | Intermediate | Minimal PII storage; user location privacy |
| **OAuth Token Security** | Advanced | Encrypted storage; no plaintext credentials |

### 9.3 Compliance

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **ToS Compliance Engine** | Intermediate | Per-source caching/redistribution rules |
| **Data Attribution** | Basic | Proper source crediting |
| **Privacy Controls** | Intermediate | User data retention settings; GDPR-ready |

---

## 10. Accessibility Capabilities

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **WCAG 2.1 AA Compliance** | Required | Legal compliance; inclusive design |
| **Screen Reader Support** | Advanced | Semantic HTML; ARIA labels for incidents |
| **Keyboard Navigation** | Advanced | Full functionality without mouse |
| **High Contrast Mode** | Intermediate | Alternative color scheme |
| **Reduced Motion** | Basic | Respect `prefers-reduced-motion` |
| **Color-Blind Safe Indicators** | Intermediate | Shapes + patterns, not just color |

---

## 11. Testing Capabilities

### 11.1 Automated Testing

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **Unit Testing** | Advanced | Business logic; data transformations |
| **Integration Testing** | Advanced | API endpoints; database queries |
| **E2E Testing (Playwright/Cypress)** | Intermediate | Critical user flows |
| **Visual Regression Testing** | Basic | UI consistency |

### 11.2 Data Pipeline Testing

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **Source Mocking** | Intermediate | Test collectors without hitting real APIs |
| **Schema Validation** | Intermediate | Ensure canonical schema compliance |
| **Deduplication Testing** | Intermediate | Verify cross-source matching |

### 11.3 Performance Testing

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **Load Testing** | Intermediate | Verify performance targets under stress |
| **WebSocket Load Testing** | Intermediate | Concurrent connection handling |
| **Mobile Performance Profiling** | Intermediate | 60fps on mid-tier devices |

---

## 12. Operational Capabilities

### 12.1 Source Onboarding Process

For each of the 50+ data sources, the following operational workflow is required:

1. **Discovery & Documentation**
   - Locate API endpoints, authentication requirements
   - Document rate limits, ToS, attribution requirements
   - Identify schema and field mappings

2. **Collector Implementation**
   - `fetch()` → raw payload retrieval
   - `transform()` → canonical schema mapping
   - `emit()` → store + index + publish

3. **Quality Assurance**
   - Deduplication key strategy
   - Confidence tier assignment
   - Latency and freshness labeling

4. **Monitoring Setup**
   - Health checks, error alerting
   - Stale data detection

### 12.2 Incident Response

| Capability | Requirement | Justification |
|------------|-------------|---------------|
| **On-Call Rotation** | Basic | 24/7 coverage for critical alerts |
| **Runbook Documentation** | Intermediate | Standardized response procedures |
| **Post-Incident Review** | Basic | Continuous improvement |

---

## 13. Performance Targets Summary

| Metric | Target | Capability Required |
|--------|--------|---------------------|
| Time to First Meaningful Paint | < 1.5s | Frontend optimization, CDN |
| Map Interaction Latency | < 50ms | WebGL optimization, spatial indexing |
| Incident Update Latency | < 5s from source | Real-time pipeline, WebSocket push |
| AI Summary Generation | < 3s | LLM integration, prompt optimization |
| Camera Feed Load | < 2s | Video streaming, CDN |
| Search Results | < 200ms | Search engine, query optimization |
| Mobile First Contentful Paint | < 1.2s on 4G | PWA optimization, code splitting |
| Touch Response | < 100ms | Mobile optimization |
| Map Frame Rate | 60fps on mid-tier | WebGL, hardware acceleration |

---

## 14. Technology Stack Summary

### Frontend
- **Framework:** React 19+ / SolidJS
- **State:** Zustand / Jotai
- **Map:** MapLibre GL JS
- **Styling:** Tailwind CSS
- **Build:** Vite
- **Testing:** Vitest, Playwright

### Backend
- **Runtime:** Node.js (Bun) or Go
- **API:** Express/Fastify or Fiber/Echo
- **Queue:** Redis Streams / NATS
- **Real-time:** WebSocket (ws/socket.io)

### Data
- **Primary DB:** PostgreSQL + PostGIS + TimescaleDB
- **Cache:** Redis
- **Search:** Meilisearch / Elasticsearch
- **Object Store:** S3-compatible

### AI/ML
- **LLM:** OpenAI API / Local (Ollama)
- **Speech:** Whisper
- **NLP:** spaCy / Custom NER

### Infrastructure
- **Containers:** Docker
- **Orchestration:** Kubernetes
- **CDN:** Cloudflare / Fastly
- **Monitoring:** Prometheus, Grafana, Sentry

---

## 15. Capability Maturity Assessment

Use this matrix to assess current team capabilities and identify gaps:

| Domain | Beginner | Intermediate | Advanced | Expert |
|--------|----------|--------------|----------|--------|
| React/Frontend | ○ | ○ | ● | ○ |
| PWA Development | ○ | ● | ○ | ○ |
| MapLibre/GIS | ○ | ○ | ● | ○ |
| Node.js/Go Backend | ○ | ○ | ● | ○ |
| PostgreSQL/PostGIS | ○ | ○ | ● | ○ |
| Real-time Systems | ○ | ○ | ● | ○ |
| Data Pipeline | ○ | ○ | ● | ○ |
| LLM Integration | ○ | ○ | ● | ○ |
| DevOps/Kubernetes | ○ | ● | ○ | ○ |
| Security | ○ | ● | ○ | ○ |

Legend: ○ = Current level, ● = Required level

---

## 16. Risk Areas & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Undocumented/reverse-engineered APIs (utilities) | Source instability | Build fallback mechanisms; monitor for changes |
| Rate limit exhaustion | Service degradation | Aggressive caching; request pooling; tiered polling |
| Schema drift in open data | Data pipeline failures | Tolerant parsing; versioned transforms; alerting |
| LLM hallucination in summaries | User misinformation | Grounded prompts; source citation; confidence indicators |
| WebSocket scaling under load | Connection failures | Horizontal scaling; connection pooling; fallback to polling |
| Mobile performance on low-end devices | Poor UX | Progressive enhancement; reduced data mode; lazy loading |

---

## Appendix A: Capability-to-Feature Mapping

| PRD Feature | Required Capabilities |
|-------------|----------------------|
| Tactical Map | MapLibre GL, GeoJSON, Layer Management, WebGL |
| Incident Deep Dive | REST API, AI Summarization, Media Integration |
| Camera Grid | Video Streaming, Snapshot Polling, Grid Layout |
| AI Situation Brief | LLM Integration, Multi-source Synthesis, Streaming |
| Timeline & History | TimescaleDB, Time-series Queries, Scrubber UI |
| Alerts & Notifications | Web Push, Service Worker, CAP Parsing |
| X (Twitter) Feed | OAuth 2.0 PKCE, Twitter API v2, Rate Limiting |
| Scanner/Audio | Audio Streaming, Speech-to-Text, Transcription |
| Social Signals | NLP, Geolocation Extraction, Trust Scoring |
| Infrastructure Status | Utility API Integration, Status Normalization |

---

## Appendix B: Data Source Integration Complexity

| Complexity | Sources | Characteristics |
|------------|---------|-----------------|
| **Low** | NWS, USGS Earthquakes, GDACS | Well-documented REST, no auth, stable schemas |
| **Medium** | NYC Open Data, MTA, 511NY | API key required, schema drift possible |
| **High** | NJT, Utility outages, PATH | ToS restrictions, undocumented endpoints |
| **Very High** | Social, Scanner, Cameras | Rate limits, geocoding required, ToS gray areas |

---

*Document prepared for development planning. Capabilities should be reassessed as requirements evolve and technologies mature.*

