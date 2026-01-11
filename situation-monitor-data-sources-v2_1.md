# Situation Monitor Dashboard — OSINT Data Provider Survey (NY/NJ + US + Global)
## Version 2.0 — Expanded

Goal: give a coding agent an **enumerated, implementation-oriented** list of data sources/APIs that support a crisis / situational-awareness dashboard:
- **Most granular coverage** in **NY/NJ** (crime, fire/EMS dispatch, 911/311, traffic, transit).
- Ability to **zoom out** to **US-wide** and **global** hazards and events (without needing town-level detail everywhere).

This document is intentionally **no UI/design and no code**; it is a source inventory + integration guidance.

---

## 0) Core integration rules for the coding agent

### 0.1 Normalize everything into a small set of canonical entities
Your collectors should emit these canonical objects (store as JSON, and optionally index in a search engine):
1. **Incident** (point/area, timestamped, type taxonomy, severity, confidence, source refs)
2. **Alert** (CAP-style message or equivalent, start/end, polygons, recommended action, issuer)
3. **Observation** (time series: weather, sensor, traffic speed, ridership, etc.)
4. **Media** (video/post/audio clip metadata + stable URL + extracted location/time, if any)
5. **Asset Track** (aircraft/vessel/vehicle positions with track history + identity fields)
6. **Infrastructure Status** *(new)* — System state for grid, water, telecom, transit. Degradation levels, affected areas, ETR. Different from Observation (continuous) or Alert (discrete notification).

**Required common fields**:
- `source_id`, `source_name`, `source_url`, `retrieved_at`
- `event_time` (or `valid_from/valid_to`)
- `geom` (GeoJSON), plus `geocode_confidence`
- `category` (your taxonomy), plus `raw_category`
- `confidence` (0–1) + `why` (short string)
- `dedupe_key` (deterministic)

### 0.2 Data quality controls (non-negotiable)
- **Dedupe** across sources (same crash may appear in 511, Waze, social, etc.)
- **Confidence scoring** by source class:
  - Official alert/agency feed > official open data dispatch logs > reputable news aggregators > social/video
- **Latency labeling**: show "last updated" and "expected refresh interval" per layer.
- **Rate limit discipline**: caching, conditional requests, exponential backoff, and queue-based polling.

### 0.3 Legal/ToS guardrails
- Many sources restrict redistribution/caching (notably some transit feeds, commercial trackers, scanner audio).
- Build a compliance switchboard per source:
  - `allowed_cache_ttl`
  - `allowed_redistribution` (yes/no)
  - `requires_attribution` (string)

---

## 1) NY / NJ — high-granularity public safety and "crime-ish" signals

### 1.1 NYC Open Data (Socrata / OData) — *best-in-class granularity*
NYC Open Data is the backbone for NYC-level incident awareness. Most datasets support **Socrata Open Data API (SODA)** queries (JSON over HTTPS), with rich filtering and paging.

**General SODA pattern**
- Base: `https://data.cityofnewyork.us/resource/<dataset_id>.json`
- Query options: `$select`, `$where`, `$limit`, `$offset`, `$order`, `$group`
- Example: filter last 24h by timestamp, bbox, type, etc.

> Tip: implement a generic Socrata adapter once, then configure datasets by ID + field mapping.

#### A) NYPD Complaint Data (reported crimes)
- Dataset: **NYPD Complaint Data** (historic and newer variants exist)
- Use: crime heatmaps, category trends, location/time clustering
- Access:
  - Dataset page: https://data.cityofnewyork.us/Public-Safety/NYPD-Complaint-Data-Historic/qgea-i56i
  - SODA endpoint: `https://data.cityofnewyork.us/resource/qgea-i56i.json`

#### B) NYPD Calls for Service (911/CAD entries)
- Dataset: **NYPD Calls for Service** (Historic + Year-to-Date)
- Use: more granular "what police are responding to" vs finalized crime reports
- Access:
  - YTD dataset: https://data.cityofnewyork.us/Public-Safety/NYPD-Calls-for-Service-Year-to-Date-/n2zq-pubd
  - (Historic catalog listing exists via data.gov; confirm best dataset id for your timeframe)

#### C) FDNY Fire Incident Dispatch Data (CAD)
- Dataset: **Fire Incident Dispatch Data**
- Use: real-time-ish fire response signals (units dispatched, times, borough/zone, etc.)
- Access:
  - Dataset page: https://data.cityofnewyork.us/Public-Safety/Fire-Incident-Dispatch-Data/8m42-w767
  - SODA endpoint: `https://data.cityofnewyork.us/resource/8m42-w767.json`

#### D) FDNY EMS Incident Dispatch Data (CAD)
- Dataset: **EMS Incident Dispatch Data**
- Use: EMS call volume spikes, medical crisis indicators (with privacy caveats)
- Access:
  - Dataset page: https://data.cityofnewyork.us/Public-Safety/EMS-Incident-Dispatch-Data/76xm-jjuj
  - SODA endpoint: `https://data.cityofnewyork.us/resource/76xm-jjuj.json`

#### E) NYC 311 Service Requests (quality-of-life + early hazard signals)
- Dataset: **311 Service Requests**
- Use: "flooded basement", "downed tree", "no heat", "power outage" proxies; great for storms
- Access:
  - Current dataset page: https://data.cityofnewyork.us/Social-Services/311-Service-Requests-from-2010-to-Present/erm2-nwe9
  - Note: NYC split older 2010–2019 vs 2020–present in late 2025; verify which ID maps to which range.

#### F) 911 End-to-End Data (NYC) (system-level, less granular)
- Dataset: **911 End-to-End Data**
- Use: latency/volume analytics rather than incident-level mapping
- Access:
  - Dataset page: https://data.cityofnewyork.us/Public-Safety/911-End-to-End-Data/t7p9-n9dy

#### G) Film Permits *(new)*
- Dataset: **Film Permits**
- Use: street closures, unusual activity, large crew presence
- Access:
  - Dataset page: https://data.cityofnewyork.us/City-Government/Film-Permits/tg4x-b46p
  - SODA endpoint: `https://data.cityofnewyork.us/resource/tg4x-b46p.json`

**Implementation notes (NYC Open Data)**
- Start with **polling** (e.g., every 1–5 minutes depending on dataset update cadence).
- Use incremental pulls: `$where=created_date > '...'` or `incident_datetime > '...'`.
- Expect schema drift; build tolerant field mapping + versioned transforms.

---

### 1.2 Jersey City Open Data — calls for service (NJ, municipal)
A rare NJ example with "calls for service" openly published.

- Dataset: **Jersey City Police Department – Service Calls**
- Use: municipal calls-for-service layer for NJ side of metro area
- Access:
  - Dataset page: https://data.jerseycitynj.gov/explore/dataset/jcpd-calls-for-service/
  - Export endpoint exists from dataset tools; confirm if it supports an API-style query pattern (often CKAN/OpenDataSoft style).

**Implementation notes**
- Don't assume all NJ municipalities publish this; treat as "opportunistic wins."
- Add a "Municipal portal adapter" module with per-city config.

---

### 1.3 FBI Crime Data API (UCR/CDE) — US-wide comparisons + NJ/NY rollups
This is not real-time dispatch data, but it gives consistent national/state/city statistics (SRS/NIBRS flavors).

- Entry point: FBI Crime Data Explorer + API docs are linked from DOJ developer resources:
  - DOJ developer page (links to API): https://www.justice.gov/developer
  - Crime Data API reference: https://cde.ucr.cjis.gov/LATEST/webapp/#/pages/docApi

**Use**
- State-to-state comparisons, longer-range trendlines for NJ vs NY vs US, baseline risk context.

---

### 1.4 NJ State-level open data + justice dashboards (varies by dataset)
#### A) NJ Open Data Center (data.nj.gov)
- Portal: https://data.nj.gov/
- Example dataset: **NJGUNStat** (NJ State Police gun statistics): https://data.nj.gov/Public-Safety/State-Police-NJGUNStat/xyxq-hsa3

**Use**
- State-wide program statistics, enforcement, and trend context.

#### B) NJ Attorney General — Justice Data dashboards
- Landing: https://www.njoag.gov/justicedata/
**Use**
- Accountability / system-level indicators (often dashboards rather than clean APIs; verify downloadable data options per dashboard).

#### C) NJ Crash data resources (NJDOT / NJSP)
- NJDOT crash data page: https://dot.nj.gov/transportation/refdata/accident/crash_data.shtm
**Use**
- Safety + crash context; may be bulk downloads rather than a real-time API.

---

## 2) Traffic, road incidents, cameras, and closures (NY/NJ + US)

### 2.1 511NY (NY State DOT) — incidents, roadwork, cameras, speeds
- Developer docs: https://511ny.org/developers/help
- API docs: https://511ny.org/developers/doc
- Resources: https://511ny.org/developers/resources
- Access agreement exists (request/acknowledge disclaimer): https://511ny.org/developers/daa

**Use**
- "Right now" incident layer for NY, plus camera URLs and roadwork.
- Ideal for storm response (closures, winter road conditions) and mass-incident routing.

**Implementation notes**
- Treat as authoritative for NY roads.
- Add a "camera snapshot" sub-pipeline (store thumbnails, not full video, if ToS allows).

### 2.2 511NJ (NJDOT) — traffic map + cameras (API availability unclear)
- Main: https://web9.511nj.org/
- NJDOT page describing 511NJ: https://dot.nj.gov/transportation/commuter/motoristassistance/511nj.shtm

**Use**
- NJ-side incidents and cameras.

**Implementation notes**
- Public developer API is not clearly documented like 511NY. The coding agent should:
  1) Confirm whether NJDOT exposes Open511, WZDx, ArcGIS services, or another documented endpoint.
  2) If not, rely on alternative NJDOT/NJTA/Port Authority open feeds (see 2.3/2.4).

### 2.3 Open511 (spec) — if any local agency provides it
- Spec PDF: https://511.org/sites/default/files/pdfs/Open_511_Data_Exchange_Specification_v1.0_Traffic.pdf

**Use**
- A "unified event schema" for traffic incidents if you find an Open511 endpoint.

### 2.4 Waze for Cities (partnered feed) — if you can get access
- 511NY notes Waze partnership and Waze incidents visible in 511NY UI in some form.
- Waze "partner feed" is not universally open; it's often via Waze for Cities programs.

**Use**
- Crowd-sourced hazards complementing 511 incidents (lower confidence, high recall).

---

## 3) Transit disruption + mobility (NY/NJ)

### 3.1 MTA (Subway/LIRR/MNR + alerts) — GTFS-RT
- MTA developer resources: https://www.mta.info/developers
- MTA API portal: https://api.mta.info/

**Use**
- Service outages, headways, delays; critical for crisis routing.

**Implementation notes**
- Ingest GTFS-RT for alerts and vehicle/trip updates where available.
- Cache aggressively; do not hammer endpoints.

### 3.2 MTA Bus Time (NYC buses) — GTFS-RT (API key)
- GTFS-RT docs (Bus Time): https://bustime-beta.mta.info/developers/gtfs-realtime/

**Use**
- Street-level mobility impact signals when subways are disrupted.

### 3.3 NJ TRANSIT — developer portal + data feeds (API key + ToS)
- NJT developer tools portal: https://www.njtransit.com/developer-tools
- NJT developer terms: https://developer.njtransit.com/terms/

**Use**
- NJ-side commuter rail/bus disruptions.

**Important ToS note**
- NJT terms include restrictions on re-serving their data feed directly from NJT servers; design your caching/proxy accordingly.

### 3.4 PATH (Port Authority Trans-Hudson) *(new)*
- Operator: Port Authority of NY & NJ
- GTFS static available; GTFS-RT availability varies
- Check: https://www.panynj.gov/path/en/index.html for developer resources
- Use: Critical NJ ↔ Manhattan link; outages affect commuter flow significantly

**Implementation notes**
- If no official GTFS-RT, monitor service alerts page or integrate unofficial scrapers.

### 3.5 Amtrak (Northeast Corridor) *(new)*
- No official public API
- Unofficial GTFS-RT: https://github.com/amtrak-gtfs-rt (community maintained)
- Use: NEC delays ripple through Penn Station, affect NJT/LIRR

**Implementation notes**
- Treat as lower-confidence; cross-reference with NJT/MTA alerts.

### 3.6 Ferry Services *(new)*
- NYC Ferry: https://www.ferry.nyc/ — Check for GTFS availability
- NY Waterway: Service alerts on website
- Seastreak: Seasonal service to NJ shore points
- Use: Alternative transit during tunnel/bridge incidents

---

## 4) Weather and geophysical hazards (NY/NJ + US + global)

### 4.1 NOAA / NWS API (US) — forecasts + severe alerts
- Docs: https://www.weather.gov/documentation/services-web-api

**Use**
- Severe weather alerts, watches/warnings (critical for NY/NJ storms).
- Forecast and observation layers.

### 4.2 USGS Earthquakes (global)
- API docs: https://earthquake.usgs.gov/fdsnws/event/1/
- Real-time feeds overview: https://earthquake.usgs.gov/earthquakes/feed/

**Use**
- Global "big picture" seismic awareness; US drill-down.

### 4.3 NASA FIRMS (active fire detections)
- FIRMS API (requires MAP_KEY): https://firms.modaps.eosdis.nasa.gov/api/

**Use**
- Wildfire situational awareness; smoke-related public health context.

### 4.4 GDACS (global disaster alerts)
- API/feeds: https://www.gdacs.org/Services/

**Use**
- Global watchboard for floods/cyclones/earthquakes; use at zoomed-out levels.

### 4.5 ReliefWeb (global humanitarian reports)
- API: https://api.reliefweb.int/
- Docs: https://apidoc.rwlabs.org/

**Use**
- Curated situation reports and official humanitarian updates.

### 4.6 USGS Water Resources (stream gauges, flood stage) *(new)*
- API docs: https://waterservices.usgs.gov/
- Real-time data: https://waterdata.usgs.gov/nwis/rt

**Use**
- Flood early warning; stream gauge levels for NJ/NY watersheds
- Critical for Passaic, Raritan, Hudson tributaries

**Implementation notes**
- High-value for Phase 1; flood risk is primary NJ/NY hazard
- Poll interval: 15 minutes typical for gauge updates

### 4.7 NOAA PORTS (Physical Oceanographic Real-Time System) *(new)*
- Portal: https://tidesandcurrents.noaa.gov/ports.html
- API: https://api.tidesandcurrents.noaa.gov/api/prod/

**Use**
- Real-time water levels, currents, visibility for NY/NJ harbors
- Storm surge monitoring; port operational status

**Implementation notes**
- Covers NY Harbor, Kill Van Kull, Newark Bay, Arthur Kill
- Essential for coastal flood and maritime situational awareness

### 4.8 GOES-East Satellite Imagery *(new)*
- Access: https://www.star.nesdis.noaa.gov/GOES/index.php
- Direct imagery: AWS Open Data Registry has GOES-16/17/18

**Use**
- Mesoscale storm tracking beyond radar range
- Fog, cloud cover, tropical system monitoring

---

## 5) Air & sea traffic (for situational context)

### 5.1 OpenSky Network (open ADS-B)
- REST API docs: https://openskynetwork.github.io/opensky-api/rest.html

**Use**
- Open "what's in the air" situational context (partial coverage).

### 5.2 ADS-B Exchange (commercial)
- API landing: https://www.adsbexchange.com/data/
- "REST API" product pages vary; confirm current access model and pricing.

**Use**
- Higher coverage and data breadth (paid).

### 5.3 MarineTraffic (commercial AIS)
- API documentation: https://www.marinetraffic.com/en/ais-api-services

**Use**
- Port congestion, maritime incident context (paid).

### 5.4 VesselFinder *(new)*
- API: https://www.vesselfinder.com/api
- Use: Alternative to MarineTraffic; some free tier options

### 5.5 USCG NAIS (official AIS) *(new)*
- Access: Restricted; requires agreement with USCG/MARAD
- Use: Authoritative vessel tracking if access obtainable

---

## 6) Social + video (OSINT discovery layers; not authoritative)

These are best used for **triage and discovery**, not "truth."

### 6.1 Reddit API
- API docs: https://www.reddit.com/dev/api/

### 6.2 Mastodon (federated) streaming API
- Streaming docs: https://docs.joinmastodon.org/methods/streaming/

### 6.3 Bluesky (AT Protocol) firehose
- Firehose docs: https://docs.bsky.app/docs/advanced-guides/firehose

### 6.4 YouTube Data API (video discovery)
- Docs: https://developers.google.com/youtube/v3

### 6.5 Citizen App *(new)*
- No official API
- Primary source for urban incident chatter with geolocation
- Integration: Would require monitoring/scraping (ToS concerns)

**Implementation notes**
- High signal for real-time urban incidents
- Often faster than official sources for initial detection
- Treat as discovery layer only; verify against official sources

### 6.6 Ring Neighbors *(new)*
- Public posts viewable without account
- No official API
- Use: Neighborhood-level incident reports, package theft, suspicious activity

### 6.7 Nextdoor *(new)*
- Closed ecosystem; no API
- Use: Local incident chatter, utility outage reports
- Integration: Not recommended due to ToS; note as potential signal source

**Implementation notes (social/video)**
- Build a "trust pipeline": account age/verification where relevant, cross-source corroboration, clustering by time/location.
- Extract and store: `claimed_location`, `detected_location`, `media_url`, `channel/user`, `engagement`, `first_seen`.

---

## 7) Radio/scanner and first-responder-adjacent (powerful, sensitive)

### 7.1 Broadcastify (scanner feeds + calls)
- Developer docs: https://www.broadcastify.com/api/
- Broadcastify Calls concept & access: https://www.broadcastify.com/calls/

**Use**
- Supplemental, fast "what responders are talking about," where legally available.

**Implementation notes**
- Coverage varies and encryption limits availability.
- Consider delay/redaction/role-based access.

### 7.2 RadioReference (metadata about radio systems)
- API (SOAP/XML, key required): https://www.radioreference.com/apps/xml/

**Use**
- Labeling & organizing scanner systems, channels, talkgroups (metadata).

### 7.3 OpenMHz / Trunk Recorder ecosystem (self-host option)
- Public site notes about API usage limits: https://openmhz.com/
- Trunk-Recorder (open source): https://github.com/robotastic/trunk-recorder

**Use**
- If you want maximum control, run your own recorder + archive + search.

---

## 8) "Zoom out" conflict and global event layers (optional)

### 8.1 GDELT (global news + events)
- Docs & API: https://www.gdeltproject.org/
- GDELT 2.1 API docs: https://blog.gdeltproject.org/gdelt-2-1-api-debuts/

**Use**
- Global "what's trending / where" overlays and time-series spikes.

### 8.2 ACLED (conflict event data)
- API docs: https://acleddata.com/acleddatanew/wp-content/uploads/2020/01/ACLED_API-User-Guide_2020.pdf
**Use**
- Structured conflict monitoring (not tactical real-time).

---

## 9) Power Grid and Utilities *(new section)*

### 9.1 Con Edison Outage Map (NYC + Westchester)
- Public map: https://www.coned.com/en/outages/outage-map
- API: Undocumented; JSON endpoints power the public map
- Integration: Reverse-engineer XHR requests or monitor for official API

**Use**
- Real-time outage counts, affected areas, ETR
- Critical for storm response

**Implementation notes**
- Polygon and point data available
- Update frequency: ~5 minutes during events

### 9.2 PSE&G Outage Map (NJ)
- Public map: https://www.pseg.com/outages
- API: Undocumented; similar situation to ConEd

**Use**
- NJ-side power outage awareness

### 9.3 NYISO Real-Time Grid
- Dashboard: https://www.nyiso.com/real-time-dashboard
- Data feeds: XML/CSV available for load, pricing, grid conditions

**Use**
- Grid stress indicators; demand spikes during heat waves/cold snaps
- Price spikes can indicate supply constraints

### 9.4 PJM Interconnection (covers NJ + PA + mid-Atlantic)
- Data portal: https://dataminer2.pjm.com/
- Use: Grid operator data for NJ region

### 9.5 National Grid (Long Island, parts of NYC)
- Outage map: https://www.nationalgridus.com/outages
- Coverage: Brooklyn, Queens, Staten Island, Long Island

### 9.6 Orange & Rockland (Hudson Valley, NJ border) *(new)*
- Public map: https://www.oru.com/en/outages/outage-map
- Coverage: Rockland County NY, northern NJ counties

### 9.7 JCP&L (Jersey Central Power & Light) *(new)*
- Public map: https://www.firstenergycorp.com/outages.html
- Coverage: Central and northern NJ

---

## 10) Environmental and Air Quality *(new section)*

### 10.1 EPA AirNow API
- Docs: https://docs.airnowapi.org/
- Use: Official AQI readings, forecasts, fire/smoke alerts

**Implementation notes**
- Covers major metro areas
- Update frequency: hourly

### 10.2 PurpleAir
- API: https://api.purpleair.com/
- Use: Crowd-sourced air quality with higher spatial density than AirNow

**Implementation notes**
- Better for hyperlocal smoke/pollution detection
- Sensor quality varies; apply confidence scoring

### 10.3 NOAA Air Resources Laboratory (HYSPLIT)
- Portal: https://www.ready.noaa.gov/HYSPLIT.php
- Use: Smoke/plume dispersion modeling

---

## 11) Emergency Management Alerts *(new section)*

### 11.1 NYC Emergency Management (Notify NYC)
- Portal: https://www1.nyc.gov/site/em/
- Notify NYC: https://notify.nyc.gov/
- API: Available for registered users

**Use**
- Official city emergency alerts, evacuations, shelter locations

### 11.2 NJ Office of Emergency Management
- Portal: https://www.nj.gov/njoem/
- Alerts: https://www.njsp.org/njoem/

**Use**
- State-level emergency declarations, evacuation orders

### 11.3 FEMA IPAWS (Integrated Public Alert and Warning System)
- Portal: https://www.fema.gov/emergency-managers/practitioners/integrated-public-alert-warning-system
- CAP feeds aggregated from WEA, EAS, NOAA

**Use**
- Authoritative national alert aggregation
- Includes Amber alerts, nuclear/radiological, civil emergencies

---

## 12) Digital Infrastructure and Internet *(new section)*

### 12.1 Cloudflare Radar
- Portal: https://radar.cloudflare.com/
- API: https://developers.cloudflare.com/radar/

**Use**
- Internet outage detection by region/ASN
- DDoS activity, traffic anomalies

### 12.2 IODA (Internet Outage Detection and Analysis)
- Portal: https://ioda.inetintel.cc.gatech.edu/
- API available

**Use**
- Academic-quality internet outage detection
- BGP routing anomalies, country/region-level connectivity

### 12.3 Downdetector
- Portal: https://downdetector.com/
- API: No official API; data scrapeable

**Use**
- Crowd-sourced service outage reports
- Good for detecting AWS/Azure/major service issues affecting region

**Implementation notes**
- Lower confidence; use for early detection, verify against official status pages

---

## 13) Public Camera Feeds — Integration Guide

Public camera feeds provide **visual ground truth** for traffic, weather, transit, ports, and major public spaces. They are observation layers, not incident feeds, and must be rate-limited and ToS-aware.

### 13.1 NY State — 511NY DOT Traffic Cameras
- Scope: Statewide highway and arterial cameras
- Access: https://511ny.org/developers/doc
- Data: Still images (HTTP), some MJPEG streams, camera metadata with lat/lon
- Use: Traffic congestion, weather impacts, closures, large events
- Notes:
  - Poll snapshots (30–60s)
  - Cache aggressively
  - Do not hotlink video streams unless explicitly allowed

### 13.2 New Jersey — NJDOT / 511NJ Cameras
- Public UI: https://web9.511nj.org/
- API status: No clearly documented public REST API
- Likely sources:
  - ArcGIS FeatureServer / MapServer layers used by NJDOT
  - Embedded snapshot URLs in NJDOT traffic map
- Agent tasks:
  1. Enumerate ArcGIS endpoints hosting camera point layers
  2. Extract snapshot URLs and metadata
  3. Store in camera registry with refresh rules

### 13.3 NYC DOT Traffic Cameras
- Metadata available via NYC Open Data (Socrata)
- Camera feeds vary by operator; many expose still snapshots
- Integration:
  - Pull camera metadata via SODA
  - Validate snapshot URLs individually
  - Respect per-camera ToS

### 13.4 Port Authority NY/NJ (Bridges, Tunnels, Ports)
- Scope: Hudson crossings, terminals, port facilities
- Access: Public-facing dashboards with embedded camera images
- API: Not formally documented
- Integration:
  - Manual discovery + cataloging
  - Snapshot polling only
- Use: Tunnel flooding, port congestion, storm surge monitoring

### 13.5 Transit & Airport Cameras
- MTA / PATH:
  - Some station or crossing cameras publicly viewable
  - No unified API
- Airports (JFK, LGA, EWR):
  - Weather/runway webcams occasionally available
- Use: Visibility, operational disruption confirmation

### 13.6 Weather & Environmental Cameras
- NOAA / NWS local office webcams
- State DOT weather cameras
- Use: Storm surge, flooding, fog, snow, rainfall intensity
- Integration:
  - No unified API
  - Regional discovery + static URL polling

### 13.7 Public Space / Event Cameras
- Examples: Times Square, Midtown NYC webcams
- Often tourist or municipal operated
- Use: Crowd density, mass event monitoring
- Notes:
  - Treat as low-confidence OSINT
  - Do not attempt facial recognition or identification

### 13.8 Camera Registry Schema (Required)
For every camera, store:
- camera_id
- name
- lat, lon
- jurisdiction (NYC, NY State, NJDOT, Port Authority, etc.)
- category (traffic | transit | weather | port | public_space)
- snapshot_url
- refresh_interval_seconds
- tos_notes
- last_checked
- status (active | unreachable | restricted)

### 13.9 Polling & Compliance Rules
- Default polling: 30–120 seconds depending on source
- Never scrape behind authentication walls
- Honor robots.txt and published usage limits
- Disable or throttle cameras dynamically on errors

---

## 14) Satellite and Remote Sensing *(new section)*

### 14.1 Sentinel Hub
- Portal: https://www.sentinel-hub.com/
- Use: Near-real-time optical/SAR imagery for flood/fire extent

**Implementation notes**
- Free tier available with registration
- Best for post-event damage assessment

### 14.2 Planet Labs
- Portal: https://www.planet.com/
- Use: Sub-daily revisit commercial imagery
- Access: Paid; some disaster response programs offer free access

### 14.3 Maxar Open Data Program
- Portal: https://www.maxar.com/open-data
- Use: High-resolution imagery released for major disasters

### 14.4 NASA Worldview / GIBS
- Portal: https://worldview.earthdata.nasa.gov/
- API: https://wiki.earthdata.nasa.gov/display/GIBS/
- Use: MODIS, VIIRS imagery layers; fire, flood, smoke detection

---

## 15) Priority build order (recommended)

### Phase 1 (NYC + NY state, quick wins)
1. NYC: FDNY Fire Dispatch + EMS Dispatch + NYPD Calls + NYPD complaints + 311 (Socrata)
2. 511NY incidents/cameras/closures
3. NWS alerts for NY/NJ
4. **USGS water gauges** (flood early warning) *(added)*
5. **Notify NYC alerts** *(added)*

### Phase 2 (NJ + transit + utilities)
6. NJT developer feeds (bus/rail)
7. PATH GTFS/alerts
8. Jersey City calls-for-service (and add more municipalities opportunistically)
9. Fill NJ traffic gap: confirm 511NJ API or find NJDOT ArcGIS/WZDx/Open511 equivalents
10. **Con Edison + PSE&G outage feeds** *(added)*
11. **NOAA PORTS** (storm surge, port ops) *(added)*

### Phase 3 (US + global zoom-out)
12. USGS earthquakes + FIRMS + GDACS + ReliefWeb
13. Optional: OpenSky / AIS
14. Social/video discovery feeds (with strict trust pipeline)
15. **EPA AirNow + PurpleAir** *(added)*
16. **Cloudflare Radar / IODA** (internet outages) *(added)*

### Phase 4 (Advanced / specialized)
17. Grid operators (NYISO, PJM)
18. Satellite imagery integration
19. Scanner/radio feeds (with appropriate access controls)
20. FEMA IPAWS aggregation

---

## 16) Checklist for the coding agent (per-source onboarding)

For each enumerated source above, create a short config file:
- `name`
- `category` (incident | alert | track | observation | media | infrastructure_status)
- `base_url`
- `auth` (none | api_key | oauth | agreement | reverse_engineered)
- `poll_interval_seconds`
- `cache_ttl_seconds`
- `expected_latency_seconds`
- `attribution`
- `tos_notes`
- `confidence_tier` (1=official agency | 2=official open data | 3=commercial/aggregator | 4=crowd-sourced | 5=social/unverified)
- `fields` mapping → canonical schema
- `dedupe_strategy` (keys and rules)

Then implement collectors as:
- `fetch()` → raw payload
- `transform()` → canonical objects
- `emit()` → store + index + publish to dashboard back end

---

## Appendix A: Known gaps (NY/NJ) to investigate next

These are high-value, but availability varies and may require agreements:
- County/municipal **CAD** feeds outside NYC (often not open).
- Hospital capacity / ER wait time (often not open; sometimes regional systems publish delayed stats).
- Port Authority NY/NJ incident feeds (check for open data or GTFS-RT/service-alert channels).
- NJ Turnpike Authority real-time feeds
- George Washington Bridge / Lincoln Tunnel / Holland Tunnel specific status APIs

---

## Appendix B: Source confidence tiers *(new)*

| Tier | Description | Examples | Default Confidence |
|------|-------------|----------|-------------------|
| 1 | Official agency real-time feed | NWS alerts, MTA GTFS-RT, 511NY | 0.95 |
| 2 | Official open data (delayed) | NYC Open Data dispatch logs, FBI UCR | 0.85 |
| 3 | Commercial/aggregator | MarineTraffic, ADS-B Exchange | 0.80 |
| 4 | Crowd-sourced structured | Waze, PurpleAir, Citizen | 0.60 |
| 5 | Social/unverified | Twitter, Reddit, YouTube | 0.30 |

Apply multipliers based on:
- Corroboration across sources (+0.1 per confirming source, max +0.3)
- Recency (decay confidence for stale data)
- Geographic precision (higher confidence for precise coordinates vs city-level)

---

## Appendix C: Canonical schema examples *(new)*

### Infrastructure Status object
```json
{
  "source_id": "coned-outage-12345",
  "source_name": "ConEdison",
  "entity_type": "infrastructure_status",
  "system_type": "electric_grid",
  "operator": "Consolidated Edison",
  "status": "degraded",
  "severity": "moderate",
  "customers_affected": 2340,
  "geom": {
    "type": "Polygon",
    "coordinates": [...]
  },
  "cause": "equipment_failure",
  "etr": "2026-01-11T18:00:00Z",
  "event_time": "2026-01-11T14:30:00Z",
  "retrieved_at": "2026-01-11T14:35:00Z",
  "confidence": 0.95,
  "dedupe_key": "coned-outage-12345-20260111"
}
```

### Observation object (water gauge)
```json
{
  "source_id": "usgs-01389500",
  "source_name": "USGS",
  "entity_type": "observation",
  "observation_type": "stream_gauge",
  "site_name": "Passaic River at Little Falls NJ",
  "value": 8.2,
  "unit": "ft",
  "flood_stage": 7.0,
  "action_stage": 6.0,
  "geom": {
    "type": "Point",
    "coordinates": [-74.226, 40.886]
  },
  "event_time": "2026-01-11T14:30:00Z",
  "retrieved_at": "2026-01-11T14:35:00Z",
  "confidence": 0.98,
  "dedupe_key": "usgs-01389500-20260111-1430"
}
```

---

## Appendix D: Quick reference — API authentication summary *(new)*

| Source | Auth Type | Notes |
|--------|-----------|-------|
| NYC Open Data (Socrata) | App token (optional, higher limits) | Free registration |
| 511NY | Agreement + API key | DAA required |
| MTA | API key | Free registration |
| NJ Transit | API key + ToS | Restrictions on redistribution |
| NWS | None | Rate limit: 60 req/min |
| USGS Water | None | Rate limit guidance in docs |
| EPA AirNow | API key | Free registration |
| OpenSky | None (limited) / API key (higher limits) | Authenticated gets history |
| MarineTraffic | API key (paid) | Tiered pricing |
| Broadcastify | API key (paid) | Premium subscription |
| Con Edison | None (reverse-engineered) | ToS gray area |
| Cloudflare Radar | API token | Free tier available |
