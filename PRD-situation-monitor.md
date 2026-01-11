# SITUATION MONITOR — Product Requirements Document
## Real-Time Situational Awareness Platform

**Version:** 1.0  
**Last Updated:** January 11, 2026  

---

## Executive Summary

SITUATION MONITOR is a consumer-grade situational awareness platform delivering military/intelligence-grade utility through a cinematic, high-density information interface. The platform synthesizes real-time OSINT feeds—emergency dispatch, transit, weather, infrastructure, and social signals—into an actionable tactical display centered on an interactive map.

**Platform:** Progressive Web App (PWA) — single codebase, fully responsive, first-class mobile web experience. No native app downloads required.

**Design Philosophy:** *"Give civilians the situational awareness tools of a field operative."*

---

## 1. Product Vision

### 1.1 The Problem
Citizens lack unified, real-time awareness of threats and disruptions in their environment. Information is fragmented across:
- Multiple news apps with 15-30 minute delays
- Separate transit, weather, and traffic apps
- Social media noise requiring manual filtering
- No spatial context connecting disparate events

### 1.2 The Solution
A single-pane-of-glass tactical display that:
- Aggregates 50+ real-time data feeds into one unified interface
- Presents information with geographic context on a dark, high-contrast map
- Uses AI to synthesize, prioritize, and narrate the situation
- Enables drill-down to primary sources: video feeds, audio, raw data

### 1.3 Design Aesthetic Reference

| Reference | Elements to Incorporate |
|-----------|------------------------|
| **Palantir Gotham** | Dense data overlays, relationship graphs, timeline scrubbing, dark UI with accent glows |
| **Iron Man JARVIS** | Translucent panels, holographic feel, voice-ready interface, predictive overlays |
| **Jason Bourne Operations Centers** | Multi-feed video walls, grid layouts, urgent typography, real-time tracking |
| **Bloomberg Terminal** | Information density, keyboard-first navigation, professional typography |

**Core Visual Principles:**
- **Dark mode only** — OLED-black backgrounds (#0a0a0f), reduces eye strain during extended monitoring
- **Accent colors** — Electric blue (#00d4ff) for info, amber (#ffb800) for caution, crimson (#ff2d55) for critical
- **Typography** — Monospace for data (JetBrains Mono), geometric sans for UI (Geist, Inter Tight)
- **Glow effects** — Subtle bloom on active elements, pulsing for live feeds
- **Grid systems** — 8px base grid, military-spec alignment
- **Animation** — Purposeful motion: data streaming in, threat rings expanding, camera feeds connecting

---

## 2. User Personas

### 2.1 Primary: The Informed Citizen
**"Alex"** — 34, Brooklyn resident, works in Manhattan
- Commutes across boroughs daily
- Wants to know about incidents affecting their route *before* leaving
- Checks during severe weather events
- Appreciates data density; not intimidated by complex interfaces

### 2.2 Secondary: The Local Journalist
**"Jordan"** — 28, freelance reporter covering NYC
- Monitors for breaking news leads
- Needs to quickly identify incidents worth covering
- Values primary source access (scanner, video, dispatch logs)
- Uses platform as a tip discovery engine

### 2.3 Tertiary: The Emergency Preparedness Enthusiast
**"Morgan"** — 45, suburban NJ, volunteer firefighter
- Monitors regional incidents for awareness and learning
- Interested in patterns and historical analysis
- Appreciates technical depth and raw data access

---

## 3. Core Interface: The Tactical Map

### 3.1 Map Foundation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ▓▓ SITUATION MONITOR                        🔴 LIVE │ 14:32:07 │ [≡] [𝕏]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌──────────────────────────────────────────────────────────────────┐    │
│    │                                                                  │    │
│    │                         [TACTICAL MAP]                           │    │
│    │                                                                  │    │
│    │      🔥 Fire incidents (pulsing)                                 │    │
│    │      🚨 Police activity (flashing)                               │    │
│    │      🚧 Traffic disruptions (amber rings)                        │    │
│    │      ⚡ Power outages (shaded polygons)                          │    │
│    │      🌊 Flood warnings (animated gradients)                      │    │
│    │      📹 Camera feeds (clickable nodes)                           │    │
│    │                                                                  │    │
│    └──────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  [TIMELINE SCRUBBER ─────────●────────────────────────────────── NOW]      │
│                                                                             │
├──────────────────────────────┬──────────────────────────────────────────────┤
│   ACTIVE INCIDENTS (12)      │   AI SITUATION SUMMARY                       │
│   ─────────────────────      │   ─────────────────────                      │
│   🔴 3-Alarm Fire · BK       │   "Elevated activity in Brooklyn with        │
│   🟠 MVA w/ Injuries · QNS   │   structure fire requiring mutual aid.       │
│   🟡 Subway Delay · A/C      │   A/C line experiencing 15+ min delays.      │
│   ...                        │   No severe weather threats next 6 hrs."     │
└──────────────────────────────┴──────────────────────────────────────────────┘

[𝕏] button toggles the X Feed sidebar (see section 4.10)
```

### 3.2 Map Layers (Toggle-able)

| Layer | Data Source | Visual Treatment |
|-------|-------------|------------------|
| **Fire/EMS Dispatch** | FDNY CAD, 911 data | Pulsing rings sized by severity; red/orange gradient |
| **Police Activity** | NYPD Calls for Service | Blue diamonds; flash rate indicates recency |
| **Traffic Incidents** | 511NY, 511NJ, Waze | Amber/red lines on affected road segments |
| **Transit Disruptions** | MTA, NJT GTFS-RT | Colored route overlays with disruption markers |
| **Weather Hazards** | NWS Alerts, radar | Polygon overlays with severity gradients; animated precipitation |
| **Power Outages** | ConEd, PSE&G | Shaded polygons with customer count labels |
| **Flood Gauges** | USGS Water | River icons with gauge-style fill indicators |
| **Camera Feeds** | 511NY, NJDOT, NYC DOT | Camera icons; glow when selected |
| **Air Traffic** | OpenSky ADS-B | Aircraft icons with altitude/heading vectors |
| **Maritime** | AIS feeds | Vessel icons with trail history |
| **Air Quality** | AirNow, PurpleAir | Gradient overlay or sensor dots |

### 3.3 Map Interaction Patterns

**Zoom Levels & Data Density:**
- **Level 1 (Global):** GDACS alerts, major earthquakes, ACLED conflict zones
- **Level 2 (US):** NWS alerts, FIRMS fires, interstate traffic
- **Level 3 (Regional):** State-level incidents, transit systems, grid status
- **Level 4 (Metro):** All local feeds, individual incidents, camera nodes
- **Level 5 (Neighborhood):** Maximum density, 311 complaints, PurpleAir sensors

**Click/Tap Behaviors:**
- **Single click on incident** → Side panel slides in with details
- **Double-click** → Zoom to incident and open full detail view
- **Click on camera icon** → Picture-in-picture video preview
- **Click on cluster** → Expand to show individual incidents
- **Long-press/right-click** → Context menu: "Set alert radius", "Add to watchlist"

---

## 4. Feature Set

### 4.1 COMMAND CENTER (Primary Dashboard)

The main view. Always-on tactical display.

**Components:**
1. **Full-screen tactical map** (described above)
2. **Incident ticker** — Scrolling feed of new incidents, left sidebar
3. **AI Situation Brief** — Natural language summary, updated every 60 seconds
4. **Active alerts strip** — CAP alerts, NWS warnings, Notify NYC at top
5. **Quick stats bar** — Active incidents by category, trend arrows

---

### 4.2 INCIDENT DEEP DIVE

When user selects an incident, a detail panel appears (slide-in from right, or modal).

**Panel Structure:**
```
┌─────────────────────────────────────────────┐
│ 🔴 STRUCTURE FIRE — 3RD ALARM               │
│ 1247 Atlantic Ave, Brooklyn                 │
│ Active · Started 14:12 · 22 min ago         │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ [NEAREST CAMERA FEED - LIVE]            │ │
│ │ 📹 511NY Cam: Atlantic Ave @ Nostrand   │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ 📋 AI SUMMARY                               │
│ "Three-alarm fire at commercial building.   │
│ 12 FDNY units on scene including Ladder 132,│
│ Engine 226. Traffic diverted Atlantic Ave   │
│ between Nostrand and New York Ave. No       │
│ reported injuries. Smoke visible for 1 mi." │
├─────────────────────────────────────────────┤
│ 📡 RELATED FEEDS                            │
│ • FDNY Dispatch (Borough BK) ▶️ [LISTEN]    │
│ • 511NY Traffic Alert #4421                 │
│ • 3 Social posts (Reddit, Citizen)          │
├─────────────────────────────────────────────┤
│ 📍 IMPACT RADIUS                            │
│ [  250m  |  500m  |  1km  ]                 │
│ • 2 subway stations within 500m             │
│ • B44 bus rerouted                          │
│ • AQI elevated: 87 (Moderate)               │
├─────────────────────────────────────────────┤
│ 📊 RAW DATA                                 │
│ [View FDNY CAD Record] [View 311 Reports]   │
│ [Export GeoJSON]                            │
└─────────────────────────────────────────────┘
```

**Key Features:**
- **Live video embed** from nearest relevant camera
- **Audio player** for scanner/dispatch (where legal/available)
- **AI-generated summary** synthesizing multiple sources
- **Impact radius tool** showing affected infrastructure
- **Corroborating sources** with confidence indicators
- **Raw data access** for power users

---

### 4.3 CAMERA GRID

Full-page multi-camera monitoring view.

```
┌────────────────────────────────────────────────────────────────────┐
│ 📹 CAMERA GRID                                    [2x2][3x3][4x4] │
├───────────────────┬───────────────────┬────────────────────────────┤
│ GWB Upper Level   │ Lincoln Tunnel E  │ Holland Tunnel            │
│ [LIVE FEED]       │ [LIVE FEED]       │ [LIVE FEED]               │
│ CLEAR             │ SLOW - 12 MPH     │ ALERT: LANE CLOSURE       │
├───────────────────┼───────────────────┼────────────────────────────┤
│ Times Square      │ Penn Station 7th  │ Atlantic Ave @ Nostrand   │
│ [LIVE FEED]       │ [LIVE FEED]       │ [LIVE FEED]               │
│ ELEVATED CROWD    │ NORMAL            │ 🔴 ACTIVE INCIDENT        │
├───────────────────┴───────────────────┴────────────────────────────┤
│ + Add Camera  |  📍 Show on Map  |  🔊 Enable Audio (where avail) │
└────────────────────────────────────────────────────────────────────┘
```

**Features:**
- **Configurable grid layouts** (2x2, 3x3, 4x4, 1+5 asymmetric)
- **Preset camera groups** ("Bridges & Tunnels", "Midtown", "My Commute")
- **AI scene analysis** badges: "Heavy Traffic", "Crowd Detected", "Low Visibility"
- **Click to expand** any feed to full-screen with PTZ controls (if available)
- **Auto-rotate mode** cycles through camera groups
- **Incident-linked cameras** — When incident selected, show relevant cameras

---

### 4.4 ALERTS & NOTIFICATIONS

#### Active Alert Bar (Top of screen)
```
⚠️ WINTER STORM WARNING: NYC Metro · Until 6:00 AM Mon · 8-12" expected
🔴 SERVICE SUSPENDED: A train · Signal problems 59 St-Columbus Circle
```

#### Notification Center (Bell icon dropdown)
```
┌─────────────────────────────────────────────┐
│ 🔔 NOTIFICATIONS                   [CLEAR] │
├─────────────────────────────────────────────┤
│ 14:30 · Structure fire upgraded to 3-alarm  │
│         [View on Map]                       │
│─────────────────────────────────────────────│
│ 14:22 · Your alert zone: Power outage       │
│         affecting 500+ customers            │
│─────────────────────────────────────────────│
│ 13:45 · NWS: Winter Storm Warning issued    │
└─────────────────────────────────────────────┘
```

#### Custom Alert Configuration
```
┌─────────────────────────────────────────────┐
│ ⚙️ MY ALERT RULES                           │
├─────────────────────────────────────────────┤
│ 📍 Home Zone (Williamsburg, 1 mi radius)    │
│    ☑ Fire/EMS  ☑ Police  ☑ Power  ☑ Flood  │
│    Notify: Push + SMS                       │
│─────────────────────────────────────────────│
│ 🚇 My Commute (L train, BQE)                │
│    ☑ Transit delays  ☑ Traffic incidents   │
│    Notify: Push only, 6-9 AM / 5-8 PM      │
│─────────────────────────────────────────────│
│ + Add Alert Zone                            │
└─────────────────────────────────────────────┘
```

---

### 4.5 AI SITUATION INTELLIGENCE

The AI layer transforms raw data into actionable intelligence.

#### 4.5.1 Situation Brief (Updated every 60 seconds)
Natural language summary of current state:

> **NYC Metro Situation Brief — 14:35 EST**
> 
> **CRITICAL:** 3-alarm structure fire in Bedford-Stuyvesant causing traffic diversions on Atlantic Ave. 12 FDNY units engaged. No injuries reported. Smoke visible from Downtown Brooklyn.
> 
> **TRANSIT:** A/C trains experiencing 15-20 minute delays due to signal problems at 59th St. Recommend B/D via 7th Ave as alternate. L train normal operations.
> 
> **WEATHER:** Winter Storm Warning in effect through Monday 6 AM. Snow beginning after midnight, accumulation 8-12". Pre-storm salt spreading in progress.
> 
> **UTILITIES:** ConEd reports 312 customers without power in Jamaica, Queens. ETR 16:00. No other major outages.
> 
> **OVERALL THREAT LEVEL:** ELEVATED (Yellow)

#### 4.5.2 Trend Detection
AI identifies emerging patterns:
- "911 call volume 40% above average for this hour — investigating clustering"
- "Unusual police activity concentration in Midtown — possible planned operation"
- "Water levels rising at Passaic River gauge — monitor for flood stage"

#### 4.5.3 Predictive Alerts
- "Based on current weather trajectory, power outages likely to increase after midnight"
- "A/C line delays typically cascade to other 8th Ave lines within 45 minutes"
- "Traffic on BQE expected to worsen as fire response continues"

#### 4.5.4 Source Synthesis
For each incident, AI synthesizes:
- **What happened** — Core facts from authoritative sources
- **Confidence level** — Based on source tier and corroboration
- **Impact assessment** — What it means for the user
- **Recommended actions** — Practical guidance

---

### 4.6 TIMELINE & HISTORY

#### Timeline Scrubber
Horizontal timeline at bottom of map allows temporal navigation:
```
[◀ 24h] ─────────────●───────────────────────── [NOW ▶]
         12:00      14:00       16:00        18:00
              ▲ Fire started
                      ▲ Upgraded to 3-alarm
```

**Features:**
- Scrub back up to 24 hours (extended history for premium)
- See incident lifecycle: started → updated → resolved
- Replay incident progression on map
- Compare "then vs now" for a location

#### Incident Log
Searchable, filterable log of all incidents:
```
┌─────────────────────────────────────────────────────────────────────┐
│ 📜 INCIDENT LOG            [Filter ▼] [Search: ____________] [CSV] │
├──────────┬─────────────────────────────────────────────────────────┤
│ 14:34:12 │ 🔴 Fire/EMS · 3-Alarm Fire · Atlantic Ave, Brooklyn     │
│ 14:28:03 │ 🟠 Transit · Signal Problems · A/C 59th St              │
│ 14:15:47 │ 🟡 Traffic · MVA · BQE @ Atlantic Ave                   │
│ 14:02:19 │ 🔵 Police · Assault in Progress · Resolved              │
│ ...      │                                                         │
└──────────┴─────────────────────────────────────────────────────────┘
```

---

### 4.7 INFRASTRUCTURE STATUS DASHBOARD

Dedicated view for utility and system monitoring:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ⚡ INFRASTRUCTURE STATUS                                                │
├──────────────────────┬──────────────────────┬───────────────────────────┤
│ POWER GRID           │ TRANSIT              │ INTERNET/TELECOM          │
│ ──────────           │ ──────               │ ───────────────           │
│ ConEd: 99.7% ✓       │ Subway: 🟡 DELAYS    │ Regional: ✓ Normal        │
│  └ 312 customers out │  └ A/C/G affected    │ Cloudflare: No anomalies  │
│ PSE&G: 99.9% ✓       │ LIRR: ✓ Normal       │ IODA: No outages          │
│ National Grid: ✓     │ NJT: ✓ Normal        │                           │
│ JCP&L: ✓             │ PATH: ✓ Normal       │                           │
├──────────────────────┼──────────────────────┼───────────────────────────┤
│ WATER/FLOOD          │ AIR QUALITY          │ WEATHER THREATS           │
│ ───────────          │ ───────────          │ ───────────────           │
│ Passaic River: ⚠️    │ NYC: 42 (Good)       │ 🟡 Winter Storm Warning   │
│  └ 8.2 ft (Flood: 7) │ Newark: 58 (Moderate)│    Snow 8-12" expected    │
│ Raritan: ✓ Normal    │ JC: 45 (Good)        │    Tonight → Mon AM       │
│ Hudson: ✓ Normal     │                      │                           │
└──────────────────────┴──────────────────────┴───────────────────────────┘
```

---

### 4.8 SCANNER/AUDIO FEEDS

Where legally available, integrated audio:

```
┌─────────────────────────────────────────────┐
│ 🎙️ LIVE AUDIO FEEDS                         │
├─────────────────────────────────────────────┤
│ FDNY Brooklyn Dispatch     ▶️ [●REC] [LIVE] │
│ ├── Listeners: 847                          │
│ └── AI Transcript:                          │
│     "Engine 226 on scene, heavy smoke       │
│      showing from 2nd floor..."             │
│─────────────────────────────────────────────│
│ NYPD Manhattan South       ⏸️ [SELECT]      │
│ NYPD Brooklyn North        ⏸️ [SELECT]      │
│ NJ State Police            ⏸️ [SELECT]      │
└─────────────────────────────────────────────┘
```

**Features:**
- Live streaming where available (Broadcastify integration)
- **AI transcription** with keyword highlighting
- **AI summarization** ("Last 5 minutes: 2 EMS calls, 1 fire dispatch, routine traffic stops")
- Volume control, background play
- Incident linking ("Jump to incident mentioned")

---

### 4.9 SOCIAL SIGNAL FEED

Aggregated social/OSINT with heavy trust filtering:

```
┌─────────────────────────────────────────────┐
│ 📱 SOCIAL SIGNALS             [Filter ▼]   │
│ Confidence threshold: ████░░░░ (60%+)       │
├─────────────────────────────────────────────┤
│ 🔵 Reddit r/nyc · 14:28 · ⭐ 73%            │
│ "Huge fire on Atlantic, crazy smoke"        │
│ [📍 Geolocated: Atlantic Ave] [Matches: 1] │
│─────────────────────────────────────────────│
│ 🦋 Bluesky · 14:31 · ⭐ 68%                 │
│ "A train not moving for 10 mins at 59th"   │
│ [📍 Mentioned: 59th St] [Matches: 1]       │
│─────────────────────────────────────────────│
│ ⚠️ Low confidence items hidden (12)        │
│ [Show anyway]                               │
└─────────────────────────────────────────────┘
```

**Trust Pipeline Features:**
- Confidence scoring based on source tier
- Geolocation extraction from text/metadata
- Corroboration with official sources
- Account age/verification weighting
- Cluster detection (multiple posts = higher confidence)

---

### 4.10 X (TWITTER) INTEGRATION

Authenticated X feed for personalized, real-time social intelligence.

#### 4.10.1 Authentication Flow
- **OAuth 2.0 PKCE** login via X developer API
- User authorizes read-only access to their timeline and lists
- Token stored securely; user can revoke anytime
- Optional: connect multiple X accounts

#### 4.10.2 X Feed Panel (Collapsible Sidebar)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ COMMAND CENTER                                                    [𝕏 FEED] │
├────────────────────────────────────────────────────────────┬────────────────┤
│                                                            │ 𝕏 LIVE FEED   │
│                                                            │ @username ▼   │
│                                                            │───────────────│
│                     [TACTICAL MAP]                         │ 📋 LISTS      │
│                                                            │ ├ NYC Alerts  │
│                                                            │ ├ Transit     │
│                                                            │ ├ Journalists │
│                                                            │ └ Emergency   │
│                                                            │───────────────│
│                                                            │ 🔴 LIVE · NYC │
│                                                            │ Alerts        │
│                                                            │───────────────│
│                                                            │ @NotifyNYC 2m │
│                                                            │ ⚠️ Winter     │
│                                                            │ Storm Warning │
│                                                            │ in effect...  │
│                                                            │ [📍] [🔗]     │
│                                                            │───────────────│
│                                                            │ @NYCTSub. 5m  │
│                                                            │ 🚇 A/C trains │
│                                                            │ experiencing  │
│                                                            │ delays due to │
│                                                            │ signal...     │
│                                                            │ [📍] [🔗]     │
│                                                            │───────────────│
│                                                            │ @citizen 8m   │
│                                                            │ 🔥 3-alarm    │
│                                                            │ fire reported │
│                                                            │ Atlantic Ave  │
│                                                            │ [📍 MATCHED]  │
│                                                            │───────────────│
│                                                            │ [Load more]   │
└────────────────────────────────────────────────────────────┴────────────────┘
```

#### 4.10.3 X Feed Features

**List-Based Filtering:**
- View any X List the user follows or has created
- Pre-built recommended lists:
  - `@NYCAlerts` — Curated emergency/official accounts
  - `@TransitWatch` — MTA, NJT, PATH, Amtrak accounts
  - `@NYCJournalists` — Local reporters and newsrooms
  - `@WXAccounts` — NWS, meteorologists, weather services
- Quick-switch between lists via dropdown
- Create custom lists directly from the panel

**Smart Features:**
- **Geo-tagging:** AI extracts locations from tweet text; tweets with detected locations show `[📍]` badge
- **Incident matching:** Tweets that correlate with known incidents show `[📍 MATCHED]` with link to incident
- **Media preview:** Inline image/video thumbnails; click to expand
- **Thread detection:** "Show thread" for multi-tweet threads
- **Verification badges:** Official/verified accounts highlighted
- **Engagement metrics:** Like/RT counts for credibility signal

**Panel Controls:**
```
┌─────────────────────────────────────────────┐
│ 𝕏 FEED SETTINGS                            │
├─────────────────────────────────────────────┤
│ View: [Home ▼] [Lists ▼] [Search]          │
│                                             │
│ Filters:                                    │
│ ☑ Show media only                          │
│ ☑ Hide retweets                            │
│ ☑ Verified accounts only                   │
│ ☐ Geo-tagged only                          │
│                                             │
│ AI Enhancement:                             │
│ ☑ Auto-detect locations                    │
│ ☑ Match to active incidents                │
│ ☑ Highlight breaking news                  │
│                                             │
│ Refresh: ○ Auto (30s) ○ Manual             │
└─────────────────────────────────────────────┘
```

**Interaction:**
- Click tweet → Expand with full text, media, replies
- Click `[📍]` → Jump to location on map
- Click `[📍 MATCHED]` → Open linked incident detail
- Right-click/long-press → "Add to incident notes", "Report as misinformation"
- Drag tweet to map → Manual geolocation assignment

#### 4.10.4 X Search Integration

Quick search from command palette or dedicated search bar:

```
┌─────────────────────────────────────────────┐
│ 🔍 X SEARCH                                 │
├─────────────────────────────────────────────┤
│ [fire brooklyn                    ] [🔍]   │
│                                             │
│ Quick filters:                              │
│ [Near me] [Last hour] [Has media] [Verified]│
├─────────────────────────────────────────────┤
│ Results (47 tweets):                        │
│                                             │
│ @breaking911 · 3m · ✓                       │
│ "BROOKLYN: 3-alarm fire at Atlantic Ave..." │
│ [📷 4 images] [📍 Atlantic Ave, Brooklyn]  │
│                                             │
│ @NYCFireWire · 5m · ✓                       │
│ "All hands for box 1247, Atlantic Ave..."  │
│ [📍 MATCHED → Incident #4892]              │
└─────────────────────────────────────────────┘
```

#### 4.10.5 Recommended X Lists for Situation Monitoring

Pre-configured list suggestions for NYC/NJ users:

| List Name | Key Accounts | Purpose |
|-----------|--------------|---------|
| **NYC Emergency** | @NotifyNYC, @NYCEmergencyMgmt, @ABORTNYCEMS, @fdabortn | Official emergency alerts |
| **NYC Transit** | @NYCTSubway, @NYCTBus, @ABORTNYCEMS, @PathTrain, @NaborTTransit | Service disruptions |
| **NYC Traffic** | @511NY, @NYC_DOT, @ABORTNYCEMS | Road incidents, closures |
| **Weather Watch** | @NWSNewYorkNY, @NWSNewYorkNJ, @weatherchannel | Severe weather alerts |
| **NYC News** | @NY1, @NYPost, @nabortyimes, @ABORTNYCEMS, @ABC7NY | Breaking local news |
| **FDNY/NYPD** | @ABORTNYCEMS, @NYPDNews, @CitizenApp | First responder activity |
| **NJ Alerts** | @ABORTNJOEM, @511abortnj, @NJ_OAG | New Jersey coverage |

#### 4.10.6 Privacy & Data Handling

- X credentials never stored on server; OAuth tokens only
- User controls which lists/feeds are visible
- No tweets are permanently stored; real-time streaming only
- User can disconnect X account at any time
- Activity (likes, RTs) never performed by the app

---

### 4.11 MY SITUATION (Personalization)

#### Saved Locations
```
┌─────────────────────────────────────────────┐
│ 📍 MY LOCATIONS                             │
├─────────────────────────────────────────────┤
│ 🏠 Home — Williamsburg, Brooklyn            │
│    Status: ✓ All clear (No active incidents)│
│─────────────────────────────────────────────│
│ 🏢 Work — Midtown Manhattan                 │
│    Status: 🟡 Transit delay on A/C line     │
│─────────────────────────────────────────────│
│ 👨‍👩‍👧 Parents — Hoboken, NJ                    │
│    Status: ✓ All clear                      │
└─────────────────────────────────────────────┘
```

#### Commute Monitoring
```
┌─────────────────────────────────────────────┐
│ 🚇 MY COMMUTE                               │
│ Home → Work (Williamsburg → Midtown)        │
├─────────────────────────────────────────────┤
│ Primary: L → 6                              │
│   Status: ✓ Normal · Est. 35 min            │
│─────────────────────────────────────────────│
│ Alternate: G → 7                            │
│   Status: ✓ Normal · Est. 42 min            │
│─────────────────────────────────────────────│
│ Drive (BQE → Midtown Tunnel)                │
│   Status: 🟡 Moderate · Est. 55 min         │
│   └ Incident on BQE causing delays          │
└─────────────────────────────────────────────┘
```

---

## 5. Advanced Features

### 5.1 OPERATOR MODE

Power-user interface for maximum data density:
- Keyboard shortcuts for all actions
- Command palette (Cmd+K) for quick navigation
- Multi-panel layouts (save custom arrangements)
- Raw data views with JSON/GeoJSON display
- API access for personal integrations

### 5.2 BRIEFING GENERATOR

Export situation reports:
- **Quick Brief:** One-paragraph summary for sharing
- **Full Report:** PDF/Markdown with maps, incident list, sources
- **Scheduled Briefs:** Daily morning summary email

### 5.3 INCIDENT CORRELATION

AI-powered incident linking:
- "This power outage may be related to the structure fire 0.3 mi away"
- "Traffic backup correlates with subway delays — passengers driving instead"
- Visualize on map with connection lines

### 5.4 PREDICTIVE MODELING

- **Flood forecasting:** Based on upstream gauges + precipitation
- **Cascade prediction:** If X line fails, these lines will be affected
- **Event impact modeling:** Large event → expected crowd/traffic impact

---

## 6. Design System

### 6.1 Color Palette

```
BACKGROUND
──────────
$bg-primary:    #0a0a0f   (Deep black)
$bg-secondary:  #12121a   (Panel background)
$bg-tertiary:   #1a1a24   (Elevated panels)

ACCENTS
───────
$accent-info:    #00d4ff  (Cyan — information, links)
$accent-success: #00ff88  (Green — clear status)
$accent-warning: #ffb800  (Amber — caution, delays)
$accent-danger:  #ff2d55  (Red — critical, active threat)
$accent-purple:  #bf5af2  (Purple — AI/analysis features)

TEXT
────
$text-primary:   #ffffff
$text-secondary: #a1a1aa
$text-muted:     #52525b

SEVERITY GRADIENTS
──────────────────
Critical:  #ff2d55 → #ff6b6b (pulsing)
High:      #ff6b35 → #ffa066
Moderate:  #ffb800 → #ffd666
Low:       #00d4ff → #66e0ff
Info:      #8b5cf6 → #a78bfa
```

### 6.2 Typography

```
HEADINGS
────────
Font: "Geist", "SF Pro Display", system-ui
Weights: 500 (medium), 700 (bold)
Letter-spacing: -0.02em

BODY
────
Font: "Geist", "Inter Tight", system-ui
Weight: 400
Line-height: 1.5

DATA/MONO
─────────
Font: "JetBrains Mono", "SF Mono", monospace
Use: Timestamps, coordinates, IDs, raw data

TACTICAL
────────
Font: "Overpass Mono" or "Share Tech Mono"
Use: Alert badges, status indicators, HUD elements
Text-transform: uppercase
Letter-spacing: 0.05em
```

### 6.3 Component Library

#### Incident Cards
```css
.incident-card {
  background: linear-gradient(135deg, $bg-secondary, $bg-tertiary);
  border-left: 3px solid var(--severity-color);
  border-radius: 4px;
  padding: 12px 16px;
  backdrop-filter: blur(8px);
  box-shadow: 0 0 20px rgba(var(--severity-color), 0.1);
}

.incident-card.critical {
  animation: pulse-glow 2s infinite;
  border-color: $accent-danger;
}
```

#### Status Badges
```
[● LIVE] — Pulsing green dot, uppercase, mono font
[⚠ ALERT] — Amber background, black text
[🔴 CRITICAL] — Red with glow effect
```

#### Map Markers
- Circles with severity-colored fill
- Size indicates magnitude/impact
- Pulse animation for active incidents
- Dimmed appearance for resolved

### 6.4 Animation Principles

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Panel slide-in | translateX | 200ms | ease-out |
| Data fade-in | opacity | 150ms | ease-in |
| Incident pulse | scale + opacity | 2s loop | ease-in-out |
| Alert flash | opacity | 500ms x3 | linear |
| Camera connect | draw line | 300ms | ease-out |
| Map zoom | scale + translate | 400ms | spring |

---

## 7. Information Architecture

```
SITUATION MONITOR
├── Command Center (default view)
│   ├── Tactical Map
│   ├── Incident Sidebar
│   ├── AI Brief Panel
│   └── Alert Strip
│
├── Camera Grid
│   ├── Preset Groups
│   ├── Custom Layouts
│   └── Full-screen Mode
│
├── Incident Log
│   ├── List View
│   ├── Filter/Search
│   └── Export
│
├── Infrastructure
│   ├── Power Grid
│   ├── Transit Status
│   ├── Water/Flood
│   └── Telecom/Internet
│
├── Audio Feeds
│   ├── Scanner Streams
│   ├── Transcripts
│   └── Archive
│
├── Social Signals
│   ├── Aggregated Feed
│   ├── Trust Scoring
│   └── Source Filter
│
├── X (Twitter) Feed
│   ├── OAuth Login
│   ├── List Selector
│   ├── Live Feed Panel
│   ├── Search
│   └── Incident Matching
│
├── My Situation
│   ├── Saved Locations
│   ├── Commute Monitor
│   ├── Alert Rules
│   └── Notification History
│
└── Settings
    ├── Appearance
    ├── Notifications
    ├── Data Sources
    ├── API Keys
    ├── Connected Accounts
    │   └── X (Twitter) — Connect/Disconnect
    └── Account
```

---

## 8. Technical Requirements

### 8.1 Frontend Architecture

**Platform Strategy:** Progressive Web App (PWA) — single responsive codebase serving desktop, tablet, and mobile browsers with native-like experience on mobile.

- **Framework:** React 19+ or SolidJS (performance-critical)
- **State Management:** Zustand or Jotai (lightweight, reactive)
- **Map Library:** MapLibre GL JS (open-source, WebGL, touch-optimized)
- **Styling:** Tailwind CSS + CSS variables for theming
- **Real-time:** WebSocket connections for live data
- **PWA Features:**
  - Service worker for offline access and caching
  - Web App Manifest for "Add to Home Screen"
  - Push notifications via Web Push API
  - Background sync for alert delivery
  - Responsive breakpoints with mobile-first CSS
- **Mobile Web Optimizations:**
  - Touch gesture support (pinch-zoom, swipe panels)
  - Hardware-accelerated animations
  - Reduced motion/data modes
  - iOS Safari and Android Chrome optimized
  - Safe area insets for notched devices

### 8.2 Backend Architecture

- **API Layer:** Node.js/Bun or Go for high-throughput collectors
- **Database:** 
  - PostgreSQL + PostGIS for spatial queries
  - TimescaleDB extension for time-series
  - Redis for caching and pub/sub
- **Search:** Meilisearch or Elasticsearch for incident search
- **AI:** OpenAI API or local LLM for summarization
- **Message Queue:** Redis Streams or NATS for data pipeline
- **OAuth:** X (Twitter) API v2 with OAuth 2.0 PKCE for user authentication

### 8.2.1 X API Integration

- **API Version:** X API v2 (Essential or Basic tier minimum)
- **Authentication:** OAuth 2.0 with PKCE (client-side flow)
- **Required Scopes:** `tweet.read`, `users.read`, `list.read`, `offline.access`
- **Endpoints Used:**
  - `GET /2/users/:id/timelines/reverse_chronological` — Home timeline
  - `GET /2/lists/:id/tweets` — List tweets
  - `GET /2/tweets/search/recent` — Search (requires Elevated access)
  - `GET /2/users/:id/owned_lists` — User's lists
  - `GET /2/users/:id/followed_lists` — Followed lists
- **Rate Limits:** 
  - Cache aggressively to stay within limits
  - Implement backoff on 429 responses
  - Display "rate limited" state gracefully
- **Streaming:** Use filtered stream for real-time (requires elevated access) or poll at 30s intervals

### 8.3 Data Pipeline

```
[Data Sources] → [Collectors] → [Normalizer] → [Deduper] → [Enricher] → [Store]
                                                              ↓
                                              [AI Summarizer] → [Cache]
                                                              ↓
                                              [WebSocket Push] → [Clients]
```

### 8.4 Performance Targets

| Metric | Target |
|--------|--------|
| Time to first meaningful paint | < 1.5s |
| Map interaction latency | < 50ms |
| Incident update latency | < 5s from source |
| AI summary generation | < 3s |
| Camera feed load | < 2s |
| Search results | < 200ms |

### 8.5 Data Refresh Rates

| Data Type | Refresh Interval |
|-----------|------------------|
| Fire/EMS dispatch | 30s |
| Police calls | 60s |
| Transit alerts | 30s |
| Traffic incidents | 60s |
| Weather alerts | 60s |
| Power outages | 5 min |
| Water gauges | 15 min |
| Air quality | 1 hour |
| Social signals | 30s |
| Camera snapshots | 30-60s |
| X Feed (authenticated) | 30s (or streaming if available) |
| X Search | On-demand |

---

## 9. Mobile Web Experience (First-Class Support)

The mobile web experience is not a degraded desktop view — it's a purpose-built interface optimized for on-the-go situational awareness.

### 9.1 Responsive Breakpoints

| Breakpoint | Width | Experience |
|------------|-------|------------|
| **Desktop** | ≥1280px | Full experience, multi-panel layouts, X feed sidebar |
| **Laptop** | 1024–1279px | Collapsible sidebars, full map |
| **Tablet** | 768–1023px | Tab-based navigation, touch-optimized map |
| **Mobile** | <768px | Bottom sheet UI, swipe gestures, focused map |

### 9.2 Mobile UI Patterns

```
┌─────────────────────────────┐
│ ▓▓ SITUATION    🔴 14:32 ≡ │  ← Compact header
├─────────────────────────────┤
│                             │
│                             │
│      [FULL-SCREEN MAP]      │  ← Map fills viewport
│                             │
│                             │
│         🔥  🚨  📹          │  ← Incident markers
│                             │
├─────────────────────────────┤
│ ▲ 12 Active Incidents       │  ← Swipe-up bottom sheet
│ ─────────────────────────── │
│ 🔴 3-Alarm Fire · Brooklyn  │
│ 🟠 MVA · Queens             │
└─────────────────────────────┘

[🗺️ Map] [📋 List] [📹 Cams] [𝕏] [⚙️]  ← Bottom tab bar
```

**Bottom Sheet Behavior:**
- Swipe up to expand incident list
- Swipe down to minimize (peek mode shows count only)
- Tap incident to see detail card
- Full-screen detail on second tap

**Gesture Support:**
- Pinch-zoom on map
- Swipe between tabs
- Pull-to-refresh on lists
- Long-press for context menu

### 9.3 Mobile-Specific Features

- **Web Push Notifications:** Critical alerts delivered even when browser closed (requires user permission)
- **Add to Home Screen:** PWA install prompt for app-like experience
- **Location-aware defaults:** Center map on user location (with permission)
- **Reduced data mode:** Toggle to limit layers and polling frequency
- **Offline mode:** Cached map tiles and last-known incident state
- **Share integration:** Native share sheet for incidents and briefs
- **Haptic feedback:** Vibration on critical alerts (where supported)

### 9.4 Mobile Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.2s on 4G |
| Time to Interactive | < 2.5s on 4G |
| Lighthouse Performance | ≥ 90 |
| Lighthouse PWA | ≥ 95 |
| Touch response | < 100ms |
| Map frame rate | 60fps on mid-tier devices |

### 9.5 Progressive Enhancement

The app works across capability levels:

1. **Basic (JS disabled/slow connection):** Static map image, text-only incident list
2. **Standard (modern browser):** Full interactive map, real-time updates
3. **Enhanced (PWA installed):** Push notifications, offline access, home screen icon

### 9.6 Tested Devices & Browsers

**Primary Support:**
- iOS Safari 16+ (iPhone 12 and newer)
- Android Chrome 110+ (Pixel 6+, Samsung S21+)
- Desktop Chrome, Firefox, Safari, Edge (latest 2 versions)

**Secondary Support:**
- iPad Safari
- Android Firefox
- Samsung Internet

**Not Supported:**
- IE11 (EOL)
- Browsers without WebGL

---

## 10. Accessibility

- WCAG 2.1 AA compliance minimum
- High contrast mode available
- Screen reader compatible incident descriptions
- Keyboard navigation for all features
- Reduced motion preference respected
- Color-blind safe severity indicators (shapes + patterns, not just color)

---

## 11. Privacy & Security

- No PII storage beyond account email
- Location data optional and device-only by default
- Encryption in transit (TLS 1.3)
- Rate limiting and abuse prevention
- Transparent data source attribution
- User-controllable data retention
- **X Integration:**
  - OAuth tokens stored encrypted, never plaintext
  - Read-only access; app cannot post, like, or RT on user's behalf
  - User can disconnect X account at any time from settings
  - No X activity is logged or stored server-side
  - Tweets displayed in real-time, not archived

---

## 12. Success Metrics

| Metric | Target |
|--------|--------|
| Daily Active Users | Track growth |
| Session Duration | > 5 min average |
| Incidents Viewed | > 3 per session |
| Alert Click-through | > 40% |
| Camera Engagement | > 20% of sessions |
| User Retention (7-day) | > 30% |
| Time-to-Value | < 30s to first useful insight |

---

## 13. Rollout Phases

### Phase 1: NYC Core (MVP)
- **Responsive web app (desktop + mobile web from day one)**
- Map + incident display
- FDNY/NYPD/311 feeds
- 511NY traffic/cameras
- NWS weather alerts
- Basic AI summarization
- PWA manifest + basic service worker

### Phase 2: NJ + Transit
- NJ Transit integration
- PATH, MTA expanded
- ConEd/PSE&G outages
- USGS flood gauges
- Camera grid view

### Phase 3: National + Advanced
- US-wide weather/earthquake
- Social signal integration
- **X (Twitter) OAuth integration + feed panel**
- Scanner audio (where available)
- Full AI intelligence suite
- PWA enhancements (offline mode, background sync)

### Phase 4: Premium Features
- Historical analysis
- API access
- Custom alert rules
- Extended data retention
- White-label options

---

## Appendix: Competitive Landscape

| Product | Strengths | SITUATION MONITOR Differentiation |
|---------|-----------|-----------------------------------|
| Citizen | Real-time urban incidents, social | Higher data quality, more sources, no social drama |
| PulsePoint | EMS/fire dispatch, medical | Broader scope (transit, weather, utilities) |
| Waze | Traffic crowd-sourcing | Multi-modal, not just driving |
| Weather apps | Forecasts, alerts | Integrates weather with other threats |
| Transit apps | Service status | Unified with incidents affecting transit |
| Scanner apps | Audio feeds | Synthesized intelligence, not raw audio |

**SITUATION MONITOR is the unified operating system for personal situational awareness.**

**Platform advantage:** Web-first PWA means instant access via URL — no app store downloads, no version fragmentation, works on any device with a modern browser. Updates deploy instantly to all users.

---

*Document prepared for development team. Design and feature set subject to iteration based on user research and technical feasibility.*

