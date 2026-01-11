# Situation Monitor

Real-time situational awareness dashboard for the NYC/NJ metro area. Aggregates 50+ public APIs (fire, police, transit, weather, utilities) and displays incidents on an interactive tactical map.

**Stack:** Next.js 14+ · TypeScript · PostgreSQL/PostGIS · MapLibre GL JS · Tailwind CSS

---

## Documentation

| Document | Description |
|----------|-------------|
| [**AGENTS.md**](./AGENTS.md) | Start here for development. Project conventions, code style, commands, and patterns. |
| [**PRD-situation-monitor.md**](./PRD-situation-monitor.md) | Product vision, features, UX specifications, and design aesthetic. |
| [**system-design-proposal-mvp.md**](./system-design-proposal-mvp.md) | Architecture decisions, deployment strategy, and cost optimization. |
| [**technical-capabilities.md**](./technical-capabilities.md) | Technical skills and infrastructure required for implementation. |
| [**situation-monitor-data-sources-v2_1.md**](./situation-monitor-data-sources-v2_1.md) | Data source catalog — 50+ APIs with integration guidance. |

---

## Quick Start

```bash
npm install
npm run dev          # Start dev server
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed test data
```

## Environment

Create `.env.local`:

```
DATABASE_URL=postgresql://...
NYC_OPEN_DATA_TOKEN=xxx
MTA_API_KEY=xxx
511NY_API_KEY=xxx
OPENAI_API_KEY=sk-xxx
```

---

## Reading Order

**Building?** Start with [AGENTS.md](./AGENTS.md) for conventions, then [system-design-proposal-mvp.md](./system-design-proposal-mvp.md) for architecture.

**Adding data sources?** See [situation-monitor-data-sources-v2_1.md](./situation-monitor-data-sources-v2_1.md) for the API catalog.

**Understanding the product?** Read [PRD-situation-monitor.md](./PRD-situation-monitor.md) for vision and features.
