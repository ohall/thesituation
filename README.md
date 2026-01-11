# 🎯 SITUATION MONITOR

Real-time situational awareness dashboard for the NYC/NJ metro area. Aggregates 50+ public data feeds (fire, police, transit, weather, utilities) into a unified tactical display.

![Situation Monitor](https://placehold.co/1200x600/0a0a0f/00d4ff?text=SITUATION+MONITOR)

## Features

- 🗺️ **Interactive Tactical Map** — Dark-themed MapLibre GL map with incident markers, clusters, and layers
- 📊 **Real-Time Updates** — Server-Sent Events (SSE) for live incident streaming
- 🤖 **AI Situation Briefs** — GPT-powered natural language summaries of current conditions
- 🚨 **Multi-Source Data** — Aggregates FDNY, NYPD, MTA, 511NY, NWS, utilities, and more
- 📱 **Responsive Design** — Works on desktop and mobile with adaptive UI
- ⚡ **Fast & Efficient** — Next.js 14 with optimized data loading

## Quick Start

### Prerequisites

- Node.js 20+ (LTS recommended)
- Docker (for PostgreSQL)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd thesituation

# Install dependencies
npm install

# Start PostgreSQL (optional - demo works without database)
docker-compose up -d

# Copy environment variables
cp .env.local.example .env.local

# Run database migrations (if using database)
npm run db:push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the Command Center.

## Project Structure

```
thesituation/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Command Center (main view)
│   └── api/                # API routes
│       ├── incidents/      # Incident CRUD
│       ├── alerts/         # Weather/emergency alerts
│       ├── stream/         # SSE real-time endpoint
│       └── ai/brief/       # AI situation brief
├── src/
│   ├── components/         # React components
│   │   ├── map/            # MapLibre components
│   │   ├── incidents/      # Incident UI
│   │   └── ui/             # Shared UI primitives
│   ├── collectors/         # Data source collectors
│   ├── stores/             # Zustand state stores
│   ├── db/                 # Drizzle schema & client
│   ├── lib/                # Utility functions
│   ├── hooks/              # React hooks
│   └── types/              # TypeScript types
├── docker-compose.yml      # PostgreSQL + PostGIS
└── package.json
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js 20 LTS |
| **Framework** | Next.js 14+ (App Router) |
| **Language** | TypeScript (strict mode) |
| **Database** | PostgreSQL 16 + PostGIS 3.4 |
| **ORM** | Drizzle ORM |
| **Map** | MapLibre GL JS |
| **Styling** | Tailwind CSS |
| **State** | Zustand |
| **Real-time** | Server-Sent Events (SSE) |
| **AI** | OpenAI API (gpt-4o-mini) |

## Data Sources

### Phase 1 (Implemented)
- **FDNY Fire Dispatch** — NYC Open Data
- **NYPD Calls for Service** — NYC Open Data
- **NWS Weather Alerts** — National Weather Service API

### Phase 2 (Planned)
- MTA Service Alerts
- 511NY Traffic Incidents & Cameras
- ConEd/PSE&G Power Outages
- USGS Flood Gauges

## Configuration

Create `.env.local` with:

```env
# Database (optional for demo mode)
DATABASE_URL=postgresql://postgres:password@localhost:5432/situation

# API Keys
NYC_OPEN_DATA_TOKEN=your_token     # Higher rate limits
MTA_API_KEY=your_key               # Required for transit
511NY_API_KEY=your_key             # Required for traffic
OPENAI_API_KEY=sk-xxx              # Required for AI briefs

# Optional
NWS_USER_AGENT=SituationMonitor/1.0 (your@email.com)
```

## Development

```bash
# Start dev server
npm run dev

# Type check
npm run lint

# Database migrations
npm run db:push        # Push schema to database
npm run db:studio      # Open Drizzle Studio GUI

# Seed test data
npm run db:seed
```

## Design System

The app uses a dark tactical theme optimized for situational awareness:

| Color | Hex | Usage |
|-------|-----|-------|
| Background | `#0a0a0f` | Primary background |
| Secondary | `#12121a` | Panels, cards |
| Critical | `#ff2d55` | Critical severity |
| High | `#ff6b35` | High severity |
| Moderate | `#ffb800` | Moderate severity |
| Info | `#00d4ff` | Information, links |

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/incidents` | List incidents with filters |
| `GET /api/alerts` | Active weather/emergency alerts |
| `GET /api/stats` | Incident statistics |
| `GET /api/stream` | SSE real-time updates |
| `GET /api/ai/brief` | AI situation summary |

### Query Parameters

**Incidents:**
- `bbox` — Bounding box: `sw_lng,sw_lat,ne_lng,ne_lat`
- `category` — Comma-separated: `fire,police,traffic,transit,weather,utility`
- `severity` — Comma-separated: `critical,high,moderate,low,info`
- `since` — ISO date string
- `limit` — Max results (default: 100)

## Contributing

See [AGENTS.md](AGENTS.md) for development guidelines and conventions.

## License

MIT

---

*Built for situational awareness. Not for emergency response coordination.*
