# 🔑 Data Sources & API Integration Guide

**Situation Monitor - NYC/NJ Real-Time Situational Awareness**

This guide provides step-by-step instructions for obtaining API keys and configuring all data source integrations.

---

## 📋 Quick Reference

| Data Source | API Key Required | Cost | Rate Limit | Status |
|-------------|------------------|------|------------|--------|
| FDNY Fire Dispatch | Optional | Free | 1000/day (2000 with token) | ✅ Implemented |
| NYPD Calls | Optional | Free | 1000/day (2000 with token) | ✅ Implemented |
| NWS Weather Alerts | Email only | Free | Unlimited | ✅ Implemented |
| MTA Service Alerts | Yes | Free | 300/min | ⏳ Planned |
| 511NY Traffic | Yes | Free | 120/min | ⏳ Planned |
| ConEd Outages | No (scraping) | Free | N/A | ⏳ Planned |

---

## 🗽 NYC Open Data (FDNY, NYPD)

### Overview

NYC Open Data provides access to over 3,000 public datasets including fire incidents, police calls, 311 requests, and more. The platform uses the Socrata API.

**Base URL:** `https://data.cityofnewyork.us`

### Step 1: Create Account (Optional but Recommended)

1. Go to [NYC Open Data](https://data.cityofnewyork.us/)
2. Click **Sign Up** in the top right
3. Fill out registration:
   - Email address
   - Full name
   - Password
4. Verify email
5. Sign in

**Without an account:**
- Rate limit: 1,000 requests/day
- Throttled to ~100 requests/rolling hour

**With an account:**
- Rate limit: 2,000 requests/day
- Better throttling (up to 1,000/hour)
- Access to API management dashboard

### Step 2: Get App Token

1. Sign in to NYC Open Data
2. Go to [Developer Settings](https://data.cityofnewyork.us/profile/edit/developer_settings)
3. Click **Create New App Token**
4. Fill out form:
   - **Application Name:** Situation Monitor
   - **Description:** Real-time situational awareness dashboard for NYC/NJ metro area
   - **Application Website:** (your URL or leave blank)
5. Click **Create**
6. Copy your **App Token** (format: `AbCdEfGhIjKlMnOpQrStUv`)

### Step 3: Add to Environment

```bash
# Add to .env.local
NYC_OPEN_DATA_TOKEN=your_app_token_here
```

### Step 4: Test Integration

```bash
# Test FDNY API
curl -H "X-App-Token: YOUR_TOKEN" \
  "https://data.cityofnewyork.us/resource/8m42-w767.json?\$limit=5"

# Test NYPD API
curl -H "X-App-Token: YOUR_TOKEN" \
  "https://data.cityofnewyork.us/resource/qiz3-axqb.json?\$limit=5"
```

**Expected Response:**
```json
[
  {
    "starfire_incident_id": "...",
    "incident_datetime": "2026-01-11T10:30:00.000",
    "incident_type_desc": "...",
    // ... more fields
  }
]
```

### Available Datasets

#### FDNY Fire Incident Dispatch Data
- **Dataset ID:** `8m42-w767`
- **Endpoint:** `https://data.cityofnewyork.us/resource/8m42-w767.json`
- **Documentation:** [View Dataset](https://data.cityofnewyork.us/Public-Safety/Fire-Incident-Dispatch-Data/8m42-w767)
- **Update Frequency:** Real-time (2-5 minute delay)
- **Key Fields:**
  - `starfire_incident_id` - Unique incident ID
  - `incident_datetime` - When incident occurred
  - `incident_type_desc` - Type of fire incident
  - `alarm_level` - Alarm level (1-5)
  - `borough` - NYC borough
  - `zipcode` - Location zip code
  - `latitude`, `longitude` - Coordinates

#### NYPD Calls for Service (Year to Date)
- **Dataset ID:** `qiz3-axqb`
- **Endpoint:** `https://data.cityofnewyork.us/resource/qiz3-axqb.json`
- **Documentation:** [View Dataset](https://data.cityofnewyork.us/Public-Safety/NYPD-Calls-for-Service-Year-to-Date-/qiz3-axqb)
- **Update Frequency:** Daily (previous day's data)
- **Key Fields:**
  - `cad_incident_id` - Unique call ID
  - `create_date` - When call was created
  - `incident_type` - Type of call
  - `incident_type_desc` - Description
  - `borough` - NYC borough
  - `precinct` - Police precinct
  - `latitude`, `longitude` - Coordinates

**Note:** NYPD data has a 1-day lag for privacy/operational reasons.

### Rate Limits & Best Practices

**Rate Limits:**
- No token: 1,000 requests/day
- With token: 2,000 requests/day
- Throttle: ~100 requests/hour (rolling)

**Best Practices:**
1. **Use Filters** - Reduce data transferred:
   ```
   $where=incident_datetime > '2026-01-11T00:00:00'
   ```

2. **Use Pagination**:
   ```
   $limit=100&$offset=0
   ```

3. **Cache Results** - Don't fetch same data repeatedly

4. **Respect Rate Limits** - Implement exponential backoff

5. **Add App Token** - Always include `X-App-Token` header

### Troubleshooting

**Problem:** `403 Forbidden` error
- **Solution:** Check if app token is valid, or you've exceeded rate limit

**Problem:** `400 Bad Request` with SoQL query
- **Solution:** Check query syntax, ensure dates are ISO 8601 format

**Problem:** No recent data returned
- **Solution:** NYPD data has 24-hour lag; FDNY should be real-time

**Problem:** Coordinates missing
- **Solution:** Not all incidents have coordinates; filter with `WHERE latitude IS NOT NULL`

---

## 🌦️ National Weather Service (NWS)

### Overview

The National Weather Service provides free, unlimited access to weather forecasts, alerts, and observations. No API key required, but you must provide a User-Agent.

**Base URL:** `https://api.weather.gov`
**Documentation:** [Weather.gov API](https://www.weather.gov/documentation/services-web-api)

### Step 1: Set User-Agent

NWS requires a User-Agent header identifying your application and contact info.

**Format:** `ApplicationName/Version (contact@email.com)`

```bash
# Add to .env.local
NWS_USER_AGENT="SituationMonitor/1.0 (your.email@example.com)"
```

**Why:** NWS uses this to contact developers if there's an issue with your application's usage.

### Step 2: Identify Target Zones

NYC/NJ Metro Area Weather Zones:

| Zone ID | Area |
|---------|------|
| NYZ072 | New York (Manhattan) |
| NYZ073 | Bronx |
| NYZ074 | Richmond (Staten Island) |
| NYZ075 | Kings (Brooklyn) |
| NYZ176 | Queens |
| NYZ177 | Northern Nassau |
| NYZ178 | Southern Nassau |
| NYZ179 | Southeast Suffolk |
| NJZ002 | Bergen |
| NJZ004 | Hudson |
| NJZ006 | Essex |
| NJZ104 | Northern Middlesex |
| NJZ106 | Union |

### Step 3: Test Integration

```bash
# Get active alerts for NYC
curl -H "User-Agent: SituationMonitor/1.0 (test@example.com)" \
  "https://api.weather.gov/alerts/active?zone=NYZ072,NYZ073,NYZ074,NYZ075,NYZ176"

# Get forecast for a point (Manhattan)
curl -H "User-Agent: SituationMonitor/1.0 (test@example.com)" \
  "https://api.weather.gov/points/40.7128,-74.0060"
```

**Expected Response:**
```json
{
  "features": [
    {
      "id": "https://api.weather.gov/alerts/urn:oid:...",
      "properties": {
        "headline": "Winter Storm Warning",
        "severity": "Severe",
        "urgency": "Expected",
        "event": "Winter Storm Warning",
        "effective": "2026-01-11T18:00:00-05:00",
        "expires": "2026-01-12T18:00:00-05:00",
        "description": "...",
        "instruction": "..."
      }
    }
  ]
}
```

### Available Endpoints

#### Active Alerts
```
GET /alerts/active?zone=NYZ072,NYZ073
```
Returns active weather alerts for specified zones.

#### Alerts by Point
```
GET /alerts/active?point=40.7128,-74.0060
```
Returns alerts affecting a specific coordinate.

#### Forecast by Grid
```
GET /gridpoints/OKX/33,37/forecast
```
7-day forecast for a grid point (requires grid coordinates from `/points`).

### CAP Alert Format

NWS uses the Common Alerting Protocol (CAP) format:

**Alert Severity:**
- `Extreme` - Extraordinary threat to life/property
- `Severe` - Significant threat to life/property
- `Moderate` - Possible threat to life/property
- `Minor` - Minimal threat to life/property
- `Unknown` - Severity unknown

**Alert Urgency:**
- `Immediate` - Within the next hour
- `Expected` - Within the next 6 hours
- `Future` - After the next 6 hours
- `Past` - Event has already occurred

**Alert Certainty:**
- `Observed` - Determined to have occurred
- `Likely` - Probability > 50%
- `Possible` - Probability <= 50%
- `Unlikely` - Probability not expected

### Rate Limits

**Rate Limit:** None officially documented, but be respectful
**Best Practices:**
- Poll alerts every 5-15 minutes (not every second)
- Cache forecast data for at least 1 hour
- Use conditional requests (If-Modified-Since header)

### Troubleshooting

**Problem:** `403 Forbidden`
- **Solution:** Add User-Agent header with contact email

**Problem:** Empty features array
- **Solution:** No active alerts for that zone (good news!)

**Problem:** `500 Internal Server Error`
- **Solution:** NWS API occasionally has outages; implement retry logic

**Problem:** Alerts for wrong area
- **Solution:** Verify zone IDs are correct for NYC/NJ metro

---

## 🚇 MTA (Metropolitan Transportation Authority)

### Overview

MTA provides real-time subway, bus, and rail data through multiple APIs. Requires free API key.

**Base URL:** `https://api-endpoint.mta.info`
**Documentation:** [MTA Developer Resources](https://new.mta.info/developers)

### Step 1: Register for API Key

1. Go to [MTA API Portal](https://api.mta.info/)
2. Click **Request an API Key**
3. Fill out form:
   - **Email:** Your email address
   - **Organization:** Situation Monitor (or personal)
   - **Use Case:** Real-time situational awareness dashboard
   - **Estimated Monthly Requests:** 100,000
4. Check email for API key
5. Activate key by clicking link

**Approval Time:** Usually instant, but can take up to 24 hours

### Step 2: Add to Environment

```bash
# Add to .env.local
MTA_API_KEY=your_api_key_here
```

### Step 3: Choose API Endpoints

MTA offers several APIs:

#### Service Status API (Recommended)
- **Endpoint:** `https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fsubway-alerts.json`
- **Format:** JSON
- **Auth:** Query parameter `?key=YOUR_API_KEY`
- **Update Frequency:** Real-time
- **Content:** Service alerts, delays, suspensions, planned work

#### GTFS-RT Feeds (Advanced)
- **Format:** Protocol Buffers
- **Endpoints:**
  - Subway: `https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace`
  - Bus: `https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bus-mta-lirr`
- **Libraries:** Use `gtfs-realtime-bindings` npm package
- **Content:** Vehicle positions, trip updates, service alerts

### Step 4: Test Integration

```bash
# Test Service Status API
curl "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fsubway-alerts.json?key=YOUR_KEY"
```

**Expected Response:**
```json
{
  "updated": "2026-01-11T15:30:00-05:00",
  "alerts": [
    {
      "route": "A",
      "description": "Delays due to signal problems",
      "severity": "Delays",
      "stations": ["59 St-Columbus Circle"],
      "planned": false
    }
  ]
}
```

### Available Data

**Subway Lines Covered:**
- A, C, E (8th Ave)
- B, D, F, M (6th Ave)
- G (Crosstown)
- J, Z (Jamaica)
- L (14th St-Canarsie)
- N, Q, R, W (Broadway)
- 1, 2, 3 (Broadway-7th Ave)
- 4, 5, 6 (Lexington Ave)
- 7 (Flushing)
- S (Shuttle)

**Bus Routes:** All MTA NYC bus routes

**Rail:** LIRR, Metro-North (separate feeds)

### Rate Limits

**Rate Limit:** 300 requests/minute
**Daily Limit:** Unlimited (fair use)

**Best Practices:**
- Poll service status every 30-60 seconds
- Poll GTFS-RT feeds every 30 seconds (vehicle positions change frequently)
- Implement caching to reduce redundant requests

### Troubleshooting

**Problem:** `401 Unauthorized`
- **Solution:** Check API key is correct and activated

**Problem:** Protocol Buffer parsing errors (GTFS-RT)
- **Solution:** Use `gtfs-realtime-bindings` library:
  ```bash
  npm install gtfs-realtime-bindings
  ```

**Problem:** Old/stale data
- **Solution:** Check `updated` timestamp; MTA feeds can lag during outages

---

## 🚗 511NY (Traffic & Cameras)

### Overview

511NY provides real-time traffic incidents, construction, camera feeds, and travel times for New York State.

**Base URL:** `https://511ny.org/api/v2`
**Documentation:** [511NY Developers](https://511ny.org/developers)

### Step 1: Register for API Key

1. Go to [511NY Developers](https://511ny.org/developers)
2. Click **Register** or **Sign Up**
3. Fill out registration:
   - Email
   - Organization (optional)
   - Application description
4. Agree to Terms of Service
5. API key sent to email (instant)

### Step 2: Add to Environment

```bash
# Add to .env.local
NY511_API_KEY=your_api_key_here
```

### Step 3: Test Integration

```bash
# Get traffic incidents
curl -H "Authorization: Bearer YOUR_KEY" \
  "https://511ny.org/api/v2/get/event?key=YOUR_KEY"

# Get traffic cameras
curl -H "Authorization: Bearer YOUR_KEY" \
  "https://511ny.org/api/v2/get/camera?key=YOUR_KEY"
```

**Note:** Auth can be via header OR query parameter (both work)

### Available Endpoints

#### Traffic Events
```
GET /api/v2/get/event
```
Returns current incidents, accidents, construction, road closures.

**Response Fields:**
- `id` - Unique event ID
- `headline` - Short description
- `description` - Full details
- `event_type` - Accident, Construction, Closure, etc.
- `severity` - Major, Moderate, Minor
- `start_time` - When event started
- `geography` - GeoJSON coordinates
- `road_name` - Road/highway name

#### Traffic Cameras
```
GET /api/v2/get/camera
```
Returns camera locations and snapshot URLs.

**Response Fields:**
- `id` - Camera ID
- `name` - Camera location name
- `url` - Live snapshot URL
- `video_url` - Stream URL (if available)
- `latitude`, `longitude` - Camera coordinates
- `direction` - View direction (N, S, E, W)

#### Travel Times
```
GET /api/v2/get/traveltime
```
Returns estimated travel times for major corridors.

### Rate Limits

**Rate Limit:** 120 requests/minute
**Daily Limit:** 10,000 requests/day

**Best Practices:**
- Poll events every 1-2 minutes
- Cache camera locations (they don't change often)
- Update snapshots every 30 seconds

### Filtering for NYC Metro

511NY covers entire NYS. Filter by bounding box:

```javascript
// NYC Metro Bounding Box
const NYC_BBOX = {
  swLat: 40.4774,
  swLng: -74.2591,
  neLat: 40.9176,
  neLng: -73.7004,
};

// Filter events
const nycEvents = events.filter(event => {
  const [lng, lat] = event.geography.coordinates;
  return lat >= NYC_BBOX.swLat && lat <= NYC_BBOX.neLat &&
         lng >= NYC_BBOX.swLng && lng <= NYC_BBOX.neLng;
});
```

### Troubleshooting

**Problem:** `403 Forbidden`
- **Solution:** API key invalid or quota exceeded

**Problem:** Too many events outside NYC
- **Solution:** Implement bounding box filter (see above)

**Problem:** Camera snapshots broken/404
- **Solution:** Some cameras go offline; check `status` field

---

## ⚡ ConEdison Power Outages

### Overview

ConEdison (NYC/Westchester electric utility) provides power outage information. **No official API** - requires web scraping or checking their outage map.

**Outage Map URL:** `https://www.coned.com/en/outages/outage-map`

### Step 1: Understand Data Source

ConEd provides outage data through:
1. **Outage Map** (web interface)
2. **Embedded JSON** (in page source)
3. **Real-time updates** (WebSocket or polling)

**No API key needed**, but scraping has risks:
- Rate limiting (IP ban if excessive)
- Structure changes break scrapers
- Legal considerations (check Terms of Service)

### Step 2: Implementation Options

#### Option A: Page Scraping (Not Recommended)
```typescript
// Use Puppeteer or Playwright
const page = await browser.newPage();
await page.goto('https://www.coned.com/en/outages/outage-map');
const outages = await page.evaluate(() => {
  // Extract data from page
});
```

#### Option B: JSON Endpoint (If Found)
ConEd may have an internal JSON endpoint used by their map:
```bash
# Inspect network traffic on outage map to find endpoint
# Example (may not be real):
curl "https://www.coned.com/api/outages/current"
```

#### Option C: Third-Party Aggregator
- PowerOutage.us aggregates utility outages
- May have API access

### Step 3: Data Schema

Typical outage data structure:
```typescript
{
  outageId: string;
  customersAffected: number;
  area: string; // e.g., "Queens", "Jamaica"
  zipCode: string;
  cause: string; // "Equipment failure", "Weather", etc.
  crew: "Assigned" | "En Route" | "On Site";
  estimatedRestoration: Date | null;
  reportedAt: Date;
  polygon?: GeoJSON.Polygon; // Affected area
}
```

### Rate Limits

**Recommendation:** Poll every 5-15 minutes (outages don't change rapidly)

### Troubleshooting

**Problem:** IP blocked from excessive requests
- **Solution:** Reduce polling frequency, add delays, use proxy rotation

**Problem:** Data structure changed
- **Solution:** Regularly test scraper, add error handling, have fallback

**Problem:** No geocoding data
- **Solution:** Geocode ZIP codes or neighborhoods to coordinates

### Legal Considerations

⚠️ **Important:** Web scraping may violate Terms of Service
- Check ConEd's ToS before implementing
- Consider contacting ConEd for official API access
- Use data responsibly and ethically

---

## 🔧 Testing All Data Sources

### Create Test Script

```bash
# Create test script
cat > test-sources.sh << 'EOF'
#!/bin/bash

echo "Testing NYC Open Data (FDNY)..."
curl -s -H "X-App-Token: $NYC_OPEN_DATA_TOKEN" \
  "https://data.cityofnewyork.us/resource/8m42-w767.json?\$limit=1" | jq '.[0].starfire_incident_id'

echo "Testing NWS Alerts..."
curl -s -H "User-Agent: $NWS_USER_AGENT" \
  "https://api.weather.gov/alerts/active?zone=NYZ072" | jq '.features | length'

echo "Testing MTA Service Status..."
curl -s "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fsubway-alerts.json?key=$MTA_API_KEY" \
  | jq '.updated'

echo "Testing 511NY Events..."
curl -s -H "Authorization: Bearer $NY511_API_KEY" \
  "https://511ny.org/api/v2/get/event?key=$NY511_API_KEY" | jq '. | length'

echo "All tests complete!"
EOF

chmod +x test-sources.sh
```

### Run Tests

```bash
# Load environment variables
source .env.local

# Run test script
./test-sources.sh
```

**Expected Output:**
```
Testing NYC Open Data (FDNY)...
"12345678"

Testing NWS Alerts...
2

Testing MTA Service Status...
"2026-01-11T15:30:00-05:00"

Testing 511NY Events...
47

All tests complete!
```

---

## 📊 Data Source Summary Table

| Source | Collector File | Poll Interval | Required Env Vars | Data Type |
|--------|---------------|---------------|-------------------|-----------|
| FDNY | `src/collectors/fdny-dispatch.ts` | 1 min | `NYC_OPEN_DATA_TOKEN` (optional) | Fire incidents |
| NYPD | `src/collectors/nypd-calls.ts` | 1 min | `NYC_OPEN_DATA_TOKEN` (optional) | Police calls |
| NWS | `src/collectors/nws-alerts.ts` | 5 min | `NWS_USER_AGENT` | Weather alerts |
| MTA | `src/collectors/mta-service-alerts.ts` | 30 sec | `MTA_API_KEY` | Transit delays |
| 511NY | `src/collectors/511ny-incidents.ts` | 1 min | `NY511_API_KEY` | Traffic incidents |
| ConEd | `src/collectors/coned-outages.ts` | 5 min | None | Power outages |

---

## 🚨 Common Issues & Solutions

### Issue: "API Key Invalid"

**Symptoms:** `401 Unauthorized` or `403 Forbidden`

**Solutions:**
1. Verify key is correct (no extra spaces)
2. Check key is activated (click email link)
3. Verify key hasn't expired
4. Test key with curl before using in app

### Issue: "Rate Limit Exceeded"

**Symptoms:** `429 Too Many Requests`

**Solutions:**
1. Reduce polling frequency
2. Implement exponential backoff
3. Cache responses
4. Check if you need higher tier API key

### Issue: "No Data Returned"

**Symptoms:** Empty array `[]` or no features

**Solutions:**
1. Check if there's actually data (may be quiet period)
2. Verify filter parameters (date range, location)
3. Check API status/uptime
4. Review API documentation for changes

### Issue: "CORS Error" (Browser)

**Symptoms:** Browser console shows CORS policy error

**Solutions:**
1. APIs should be called from server-side (Next.js API routes)
2. Never call external APIs directly from client
3. Use `/api/*` routes as proxy

---

## 📚 Additional Resources

### NYC Open Data
- [Socrata API Documentation](https://dev.socrata.com/docs/queries/)
- [SoQL Query Language](https://dev.socrata.com/docs/queries/)
- [NYC Open Data Portal](https://data.cityofnewyork.us/)

### National Weather Service
- [API Documentation](https://www.weather.gov/documentation/services-web-api)
- [CAP Standard](https://docs.oasis-open.org/emergency/cap/v1.2/CAP-v1.2.html)
- [Zone Definitions](https://www.weather.gov/gis/ZoneCounty)

### MTA
- [Developer Portal](https://new.mta.info/developers)
- [GTFS-RT Specification](https://developers.google.com/transit/gtfs-realtime)
- [Service Status Guide](https://new.mta.info/developers/service-status)

### 511NY
- [Developer Documentation](https://511ny.org/developers)
- [API Reference](https://511ny.org/developers/api)

---

## ✅ Final Checklist

Before running data collectors in production:

- [ ] All API keys obtained and activated
- [ ] Keys added to `.env.local` (development)
- [ ] Keys added to hosting platform (Vercel/Railway)
- [ ] Test script runs successfully
- [ ] Rate limits understood and respected
- [ ] Error handling implemented (retry logic)
- [ ] Caching strategy in place
- [ ] Monitoring/alerts configured
- [ ] Terms of Service reviewed for each API
- [ ] Contact information added to User-Agent (NWS)

---

**Last Updated:** 2026-01-11
**Maintainer:** Situation Monitor Team
