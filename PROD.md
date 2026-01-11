# 🚀 Production Deployment Strategy

**Situation Monitor - NYC/NJ Real-Time Situational Awareness**

This document outlines the production deployment architecture, infrastructure choices, and operational procedures for the Situation Monitor application.

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Browsers                           │
│                  (Desktop, Mobile, Tablet)                       │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ HTTPS
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                         CDN / Edge                               │
│              (Vercel Edge, Cloudflare)                          │
│              - Static Assets                                     │
│              - Edge Caching                                      │
│              - DDoS Protection                                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                   Next.js Application                            │
│                  (Vercel, Railway, Fly.io)                      │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ API Routes   │  │ SSE Stream   │  │ React Pages  │         │
│  │ /api/*       │  │ /api/stream  │  │ RSC + Client │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────┬──────────────────┬──────────────────┬────────────────────┘
      │                  │                  │
      │                  │                  │
      ▼                  ▼                  ▼
┌──────────┐      ┌───────────┐      ┌──────────┐
│PostgreSQL│      │   Redis   │      │ OpenAI   │
│+ PostGIS │      │  (Cache)  │      │   API    │
│  (Neon,  │      │(Upstash)  │      │          │
│ Supabase)│      │           │      │          │
└──────────┘      └───────────┘      └──────────┘
      ▲
      │
      │
┌─────┴─────────────────────────────────┐
│   Background Job Runner                │
│   (Separate Process/Container)         │
│                                        │
│   ┌────────────────────────────┐      │
│   │  node-cron Scheduler       │      │
│   │  - FDNY Collector (1 min)  │      │
│   │  - NYPD Collector (1 min)  │      │
│   │  - NWS Collector (5 min)   │      │
│   │  - MTA Collector (30 sec)  │      │
│   └────────────────────────────┘      │
└───────────────────────────────────────┘
```

---

## 🏗️ Infrastructure Options

### Option 1: Budget-Friendly (~$20-40/month)

**Best for:** MVP, personal projects, low traffic (<10k requests/day)

| Component | Service | Cost | Specs |
|-----------|---------|------|-------|
| **App Hosting** | Vercel Hobby | Free | 100GB bandwidth, serverless |
| **Database** | Neon Free | Free | 0.5GB storage, 3GB transfer |
| **Cache** | Upstash Free | Free | 10k commands/day |
| **Monitoring** | Vercel Analytics | Free | Basic metrics |
| **Background Jobs** | Vercel Cron | Free | Limited executions |
| **Total** | | **$0-10/mo** | Good for testing |

**Limitations:**
- Limited database storage (0.5GB)
- No redundancy or backups
- Shared resources
- Cold starts on serverless

**Upgrade Path:**
- Neon Scale: $19/mo (3GB storage, better performance)
- Upstash Pro: $10/mo (unlimited commands)
- **Total with upgrades: ~$30/mo**

---

### Option 2: Production-Ready (~$100-200/month)

**Best for:** Production apps, moderate traffic (<1M requests/day)

| Component | Service | Cost | Specs |
|-----------|---------|------|-------|
| **App Hosting** | Vercel Pro | $20/mo | Team features, priority support |
| **Database** | Supabase Pro | $25/mo | 8GB storage, daily backups, 50GB transfer |
| **Cache** | Upstash Pro | $10/mo | Unlimited commands, Redis |
| **Background Jobs** | Railway Hobby | $5/mo | Always-on Node.js process |
| **Monitoring** | Better Stack | $29/mo | Uptime, logs, APM |
| **Error Tracking** | Sentry Developer | $29/mo | 50k errors/month |
| **Total** | | **~$118/mo** | Reliable production setup |

**Features:**
- 99.9% uptime SLA
- Automated backups
- Point-in-time recovery (7 days)
- Dedicated resources
- 24/7 monitoring

---

### Option 3: Enterprise-Grade (~$500-1000/month)

**Best for:** High traffic, mission-critical, multi-region

| Component | Service | Cost | Specs |
|-----------|---------|------|-------|
| **App Hosting** | Vercel Enterprise | Custom | Multi-region, dedicated |
| **Database** | Supabase Team | $599/mo | 500GB storage, replicas |
| **Cache** | Upstash Enterprise | $50/mo | Global replication |
| **Background Jobs** | Railway Pro | $20/mo | Auto-scaling workers |
| **Monitoring** | Datadog APM | $31/host | Full observability |
| **CDN** | Cloudflare Pro | $20/mo | Advanced DDoS protection |
| **Total** | | **~$720+/mo** | Enterprise scale |

**Features:**
- Multi-region deployment
- Read replicas for database
- Advanced security (WAF, DDoS)
- 99.99% uptime SLA
- Compliance (SOC 2, HIPAA ready)

---

## 🎯 Recommended Architecture (Option 2)

### Application Layer

**Platform:** Vercel Pro

**Why Vercel:**
- Native Next.js optimization
- Automatic deployments from Git
- Edge network (global CDN)
- Preview deployments for PRs
- Built-in analytics
- Environment variable management
- Serverless functions scale automatically

**Configuration:**
```javascript
// vercel.json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"], // US East (closest to NYC)
  "functions": {
    "app/api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 10
    },
    "app/api/stream/route.ts": {
      "memory": 512,
      "maxDuration": 300 // 5 min for SSE
    }
  },
  "crons": [{
    "path": "/api/cron/collect",
    "schedule": "*/1 * * * *" // Every minute
  }]
}
```

**Deployment Process:**
1. Push to `main` branch → auto-deploy to production
2. Push to feature branch → preview deployment
3. Merge PR → preview becomes production

---

### Database Layer

**Platform:** Supabase Pro ($25/mo)

**Why Supabase:**
- Managed PostgreSQL 15 + PostGIS
- Automatic backups (daily)
- Point-in-time recovery (7 days)
- Connection pooling (PgBouncer)
- Real-time subscriptions (optional future feature)
- Dashboard for DB management
- SSL connections enforced

**Alternative:** Neon (similar pricing, better cold start performance)

**Configuration:**
```env
# Production
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres?pgbouncer=true

# Connection Pooling (for serverless)
DATABASE_POOL_URL=postgresql://postgres:[PASSWORD]@[PROJECT]-pooler.supabase.co:6543/postgres
```

**Database Setup:**
```bash
# Run migrations in production
DATABASE_URL=$PRODUCTION_DATABASE_URL npx drizzle-kit push

# Or use Drizzle migrations
DATABASE_URL=$PRODUCTION_DATABASE_URL npx drizzle-kit migrate
```

**Indexes (Critical for Performance):**
```sql
-- PostGIS spatial index
CREATE INDEX idx_incidents_location_gist
ON incidents USING GIST (ST_SetSRID(ST_MakePoint(location_lon, location_lat), 4326));

-- Temporal indexes
CREATE INDEX idx_incidents_event_time ON incidents (event_time DESC);
CREATE INDEX idx_incidents_created_at ON incidents (created_at DESC);

-- Filtering indexes
CREATE INDEX idx_incidents_category ON incidents (category);
CREATE INDEX idx_incidents_severity ON incidents (severity);
CREATE INDEX idx_incidents_resolved ON incidents (resolved_at) WHERE resolved_at IS NULL;
```

---

### Caching Layer

**Platform:** Upstash Redis

**Why Redis:**
- Cache API responses (especially AI briefs)
- Rate limiting
- Session storage (if auth added)
- Pub/sub for real-time features

**Cache Strategy:**
```typescript
// src/lib/cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Cache AI brief for 5 minutes
export async function getCachedBrief() {
  const cached = await redis.get('ai:brief');
  if (cached) return cached;

  const brief = await generateBrief();
  await redis.setex('ai:brief', 300, brief); // 5 min TTL
  return brief;
}

// Cache stats for 30 seconds
export async function getCachedStats() {
  const cached = await redis.get('stats:current');
  if (cached) return cached;

  const stats = await getIncidentStats();
  await redis.setex('stats:current', 30, stats);
  return stats;
}
```

---

### Background Jobs

**Platform:** Railway ($5/mo Hobby or $20/mo Pro)

**Why Railway:**
- Always-on Node.js process (no cold starts)
- Simple deployment from Git
- Environment variables synced with main app
- Logs and monitoring included

**Job Runner Setup:**
```typescript
// src/worker/index.ts
import cron from 'node-cron';
import { collectors } from '@/collectors';
import { processCollector } from '@/pipeline/processor';

console.log('🚀 Worker starting...');

// Schedule collectors
for (const collector of collectors) {
  const intervalMinutes = collector.pollIntervalMs / 60000;
  const cronExpression = `*/${intervalMinutes} * * * *`;

  cron.schedule(cronExpression, async () => {
    console.log(`⏰ Running collector: ${collector.name}`);
    try {
      await processCollector(collector);
      console.log(`✅ ${collector.name} completed`);
    } catch (error) {
      console.error(`❌ ${collector.name} failed:`, error);
    }
  });

  console.log(`📅 Scheduled ${collector.name} every ${intervalMinutes} min`);
}

// Health check endpoint
import express from 'express';
const app = express();
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.listen(process.env.PORT || 3001);
```

**Dockerfile:**
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Run worker
CMD ["node", "dist/worker/index.js"]
```

**Railway Configuration:**
```toml
# railway.toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile.worker"

[deploy]
startCommand = "node dist/worker/index.js"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
```

---

## 🔐 Security Configuration

### Environment Variables

**Production Secrets (Store in hosting platform):**

```env
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Redis Cache
UPSTASH_REDIS_URL=https://...
UPSTASH_REDIS_TOKEN=...

# API Keys
NYC_OPEN_DATA_TOKEN=...
MTA_API_KEY=...
511NY_API_KEY=...
OPENAI_API_KEY=sk-...
NWS_USER_AGENT=SituationMonitor/1.0 (contact@example.com)

# Application
NEXT_PUBLIC_APP_URL=https://situation.example.com
NODE_ENV=production

# Monitoring
SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=...

# Security
NEXTAUTH_SECRET=... # If adding authentication
NEXTAUTH_URL=https://situation.example.com
```

**Never commit:**
- `.env.local`
- `.env.production`
- Any file with API keys

### Security Headers

**Configure in `next.config.js`:**

```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self)'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

### Rate Limiting

**Implement in API routes:**

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// 10 requests per 10 seconds
export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
});

// Usage in API routes
export async function GET(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  // ... rest of handler
}
```

---

## 📊 Monitoring & Observability

### Error Tracking: Sentry

**Setup:**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Configuration:**
```javascript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
  beforeSend(event, hint) {
    // Don't send errors in development
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    return event;
  },
});
```

### Uptime Monitoring: Better Uptime

**Setup:**
- Create account at betteruptime.com
- Add monitors:
  - `https://situation.example.com` (homepage)
  - `https://situation.example.com/api/health` (API health)
  - `https://situation.example.com/api/incidents` (data availability)
- Configure alerts (email, Slack, PagerDuty)
- Set check interval: 1-5 minutes

### Application Performance: Vercel Analytics

**Enable in Vercel dashboard:**
- Real User Monitoring (RUM)
- Web Vitals tracking
- API route performance
- Edge function metrics

**Add to app:**
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Custom Health Endpoint

**Create `/api/health/route.ts`:**
```typescript
import { NextResponse } from 'next/server';
import { db } from '@/db/client';

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'ok',
    services: {
      database: 'unknown',
      redis: 'unknown',
    },
  };

  // Check database
  try {
    await db.execute('SELECT 1');
    checks.services.database = 'healthy';
  } catch (error) {
    checks.services.database = 'unhealthy';
    checks.status = 'degraded';
  }

  // Check Redis (if configured)
  try {
    await redis.ping();
    checks.services.redis = 'healthy';
  } catch (error) {
    checks.services.redis = 'unhealthy';
  }

  const statusCode = checks.status === 'ok' ? 200 : 503;
  return NextResponse.json(checks, { status: statusCode });
}
```

---

## 🚢 CI/CD Pipeline

### GitHub Actions Workflow

**`.github/workflows/ci.yml`:**
```yaml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Type check
        run: npx tsc --noEmit

      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Build application
        run: npm run build

  deploy-preview:
    needs: lint-and-test
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest

    steps:
      - name: Deploy to Vercel Preview
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-production:
    needs: lint-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest

    steps:
      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

      - name: Run database migrations
        run: |
          npm run db:migrate
        env:
          DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
```

---

## 📈 Scaling Strategy

### Horizontal Scaling

**When to scale:**
- Response times > 1 second (p95)
- Database connections exhausted
- Memory usage > 80%
- Request volume > 1M/day

**Scaling levers:**

1. **Application Layer**
   - Vercel scales automatically (serverless)
   - No action needed up to ~10M requests/month

2. **Database Layer**
   - Supabase: Upgrade to Team plan ($599/mo)
     - 500GB storage
     - Read replicas (1-3)
     - Connection pooling (1000+ connections)
   - Or migrate to AWS RDS with Aurora Serverless

3. **Cache Layer**
   - Upstash scales automatically
   - Consider Redis cluster for > 1M ops/day

4. **Background Jobs**
   - Railway: Add more workers (auto-scaling)
   - Separate workers by collector type
   - Use queue system (BullMQ, Inngest)

### Database Optimization

**Read Replicas:**
```typescript
// Read from replica for heavy queries
const replicaDb = drizzle(postgres(process.env.DATABASE_REPLICA_URL));

// Write to primary
const primaryDb = drizzle(postgres(process.env.DATABASE_URL));

// Usage
export async function getIncidents(filters) {
  // Read from replica
  return replicaDb.query.incidents.findMany({ where: filters });
}

export async function createIncident(data) {
  // Write to primary
  return primaryDb.insert(incidents).values(data);
}
```

**Connection Pooling:**
```typescript
// Use PgBouncer connection string for serverless
const connectionString = process.env.DATABASE_POOL_URL
  || process.env.DATABASE_URL;

const client = postgres(connectionString, {
  max: 10, // Max connections per serverless instance
  idle_timeout: 20,
  connect_timeout: 10,
});
```

---

## 💾 Backup & Disaster Recovery

### Database Backups

**Automated (Supabase):**
- Daily automated backups (7-day retention)
- Point-in-time recovery (7 days)
- Stored in AWS S3
- No action required

**Manual Backups:**
```bash
# Backup production database
pg_dump $PRODUCTION_DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup-20260111.sql
```

**Weekly Full Backup (Recommended):**
```bash
# Cron job (runs weekly on Sunday 2am)
0 2 * * 0 pg_dump $DATABASE_URL | gzip > /backups/weekly-$(date +\%Y\%m\%d).sql.gz
```

### Disaster Recovery Plan

**RTO (Recovery Time Objective):** 1 hour
**RPO (Recovery Point Objective):** 24 hours

**Failure Scenarios:**

1. **Database Corruption**
   - Restore from latest automated backup
   - Max data loss: 24 hours

2. **Application Failure**
   - Vercel auto-rollback to last working deployment
   - Manual rollback via dashboard
   - Recovery time: < 5 minutes

3. **Regional Outage**
   - Vercel automatically fails over to nearest region
   - Recovery time: Automatic

4. **Data Center Failure**
   - Supabase: Multi-AZ by default (auto-failover)
   - Railway: Redeploy to different region

**Recovery Procedure:**
```bash
# 1. Verify backup integrity
psql $BACKUP_DATABASE_URL < latest-backup.sql

# 2. Switch environment variables to backup DB
# Update PRODUCTION_DATABASE_URL in Vercel

# 3. Verify application health
curl https://situation.example.com/api/health

# 4. Monitor error rates in Sentry

# 5. Communicate status to users (status page)
```

---

## 💰 Cost Optimization

### Expected Costs (Month 1-3)

**Low Traffic (<10k daily users):**
- Vercel Pro: $20/mo
- Supabase Pro: $25/mo
- Upstash: $10/mo
- Railway: $5/mo
- Monitoring: $30/mo (optional)
- **Total: $60-90/mo**

**Medium Traffic (10k-100k daily users):**
- Vercel Pro: $20/mo (+ overages ~$50)
- Supabase Team: $599/mo (or optimize queries)
- Upstash Pro: $10/mo
- Railway Pro: $20/mo
- Monitoring: $60/mo
- **Total: $160-760/mo**

### Cost Reduction Strategies

1. **Cache Aggressively**
   - AI briefs: 5-minute TTL (saves OpenAI costs)
   - Stats: 30-second TTL (reduces DB queries)
   - Incidents: 10-second TTL (balances freshness)

2. **Optimize Database Queries**
   - Use indexes (see earlier section)
   - Paginate results (limit to 100 per request)
   - Avoid N+1 queries (use joins)

3. **CDN for Static Assets**
   - Vercel Edge caches automatically
   - Set long cache headers for images/CSS/JS

4. **Serverless Optimization**
   - Reduce bundle size (tree shaking)
   - Lazy load heavy dependencies
   - Use Edge Runtime where possible

5. **Background Jobs**
   - Batch collector runs (collect 10 sources in 1 job)
   - Use longer poll intervals for stable sources
   - Skip collection if no new data

---

## 📋 Pre-Deployment Checklist

### Code & Configuration

- [ ] All environment variables documented
- [ ] Database migrations tested
- [ ] API rate limiting implemented
- [ ] Error boundaries added to React components
- [ ] Loading states for all async operations
- [ ] SEO meta tags configured
- [ ] Favicon and app icons added
- [ ] robots.txt and sitemap.xml created
- [ ] 404 and 500 error pages designed

### Security

- [ ] No secrets in code or Git history
- [ ] All API keys stored in environment variables
- [ ] Security headers configured
- [ ] CORS policies defined
- [ ] SQL injection prevention (using Drizzle ORM)
- [ ] XSS prevention (React auto-escapes)
- [ ] HTTPS enforced
- [ ] Rate limiting on all public endpoints

### Performance

- [ ] Lighthouse score > 90 (Performance)
- [ ] Core Web Vitals pass
- [ ] Images optimized (next/image)
- [ ] Database queries optimized (indexes)
- [ ] Bundle size < 300KB (initial load)
- [ ] API response time < 500ms (p95)

### Monitoring

- [ ] Sentry error tracking configured
- [ ] Uptime monitoring active
- [ ] Health check endpoint created
- [ ] Logs configured (Vercel/Railway)
- [ ] Alerts set up (email/Slack)
- [ ] Status page created (optional)

### Data & Backup

- [ ] Database backups automated
- [ ] Backup restoration tested
- [ ] Data retention policy defined
- [ ] GDPR compliance reviewed (if applicable)
- [ ] Privacy policy created

### Documentation

- [ ] README.md updated
- [ ] API documentation created
- [ ] Environment variables documented
- [ ] Deployment guide written
- [ ] Runbook for incidents created

---

## 🚀 Deployment Steps

### 1. Prepare Infrastructure

```bash
# 1. Create Supabase project
# - Go to supabase.com
# - Create new project
# - Copy DATABASE_URL

# 2. Create Upstash Redis
# - Go to upstash.com
# - Create Redis database
# - Copy UPSTASH_REDIS_URL and TOKEN

# 3. Create Vercel project
vercel login
vercel link

# 4. Add environment variables to Vercel
vercel env add DATABASE_URL production
vercel env add UPSTASH_REDIS_URL production
vercel env add OPENAI_API_KEY production
# ... add all other variables
```

### 2. Deploy Database

```bash
# Push schema to production database
DATABASE_URL=$PRODUCTION_DATABASE_URL npm run db:push

# Or run migrations
DATABASE_URL=$PRODUCTION_DATABASE_URL npm run db:migrate

# Seed initial data (optional)
DATABASE_URL=$PRODUCTION_DATABASE_URL npm run db:seed
```

### 3. Deploy Application

```bash
# Deploy to production
git push origin main

# Vercel auto-deploys from main branch
# Monitor deployment: https://vercel.com/dashboard

# Verify deployment
curl https://situation.example.com/api/health
```

### 4. Deploy Background Jobs

```bash
# Create Railway project
railway login
railway init

# Link to Git repo
railway link

# Add environment variables (same as Vercel)
railway variables set DATABASE_URL=$PRODUCTION_DATABASE_URL

# Deploy worker
git push railway main

# Verify worker is running
railway logs
```

### 5. Configure Domain

```bash
# Add custom domain in Vercel dashboard
# Add DNS records:
# A record: @ -> 76.76.21.21
# CNAME: www -> cname.vercel-dns.com

# Wait for DNS propagation (5-60 minutes)
# Vercel auto-provisions SSL certificate
```

### 6. Test Production

```bash
# Smoke tests
curl https://situation.example.com
curl https://situation.example.com/api/incidents
curl https://situation.example.com/api/stats

# Load testing (optional)
npm install -g artillery
artillery quick --count 100 --num 10 https://situation.example.com/api/incidents
```

---

## 🔧 Post-Deployment

### Week 1: Monitor Closely

- [ ] Check error rates daily (Sentry)
- [ ] Monitor response times (Vercel Analytics)
- [ ] Review database performance (Supabase dashboard)
- [ ] Verify background jobs running (Railway logs)
- [ ] Check uptime (Better Uptime)

### Week 2: Optimize

- [ ] Identify slow queries
- [ ] Add missing indexes
- [ ] Optimize cache TTLs
- [ ] Tune rate limits

### Month 1: Scale

- [ ] Review costs vs. traffic
- [ ] Optimize based on usage patterns
- [ ] Add more data sources
- [ ] Collect user feedback

---

## 📞 Support & Incident Response

### On-Call Rotation (If Team)

**Severity Levels:**
- **P0 (Critical):** Site down, data loss
  - Response time: 15 minutes
  - Resolution time: 1 hour
- **P1 (High):** Major feature broken
  - Response time: 1 hour
  - Resolution time: 4 hours
- **P2 (Medium):** Minor bug, degraded performance
  - Response time: 4 hours
  - Resolution time: 24 hours

### Incident Response Playbook

**Step 1: Acknowledge**
- Update status page
- Notify team (Slack/PagerDuty)

**Step 2: Investigate**
- Check Sentry for errors
- Review Vercel/Railway logs
- Check database performance
- Verify external APIs (NYC Open Data, MTA, etc.)

**Step 3: Mitigate**
- Rollback to last working deployment (Vercel dashboard)
- Scale resources if needed
- Disable problematic feature flags

**Step 4: Resolve**
- Deploy fix
- Verify in production
- Update status page

**Step 5: Postmortem**
- Document root cause
- Identify prevention measures
- Update runbook

---

## 📚 Additional Resources

- [Vercel Deployment Docs](https://vercel.com/docs/deployments/overview)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [Next.js Production Deployment](https://nextjs.org/docs/deployment)
- [Drizzle ORM Migrations](https://orm.drizzle.team/docs/migrations)
- [Railway Deployment Guide](https://docs.railway.app/)

---

**Last Updated:** 2026-01-11
**Next Review:** 2026-02-11
