# 🧪 Staging Environment Setup Guide

**Situation Monitor - Low-Cost Validation Environment**

This document outlines a cost-effective staging environment for testing, QA, and validation before production deployment.

---

## 🎯 Purpose & Goals

### What is Staging?

A **staging environment** is a replica of production used for:
- Testing new features before production release
- QA and user acceptance testing (UAT)
- Performance testing and load testing
- Database migration testing
- Integration testing with real APIs
- Training and demos

### Key Principles

1. **Cost-Effective** - Minimize monthly costs while maintaining functionality
2. **Production-Like** - Similar enough to catch real issues
3. **Disposable** - Can be torn down and rebuilt easily
4. **Automated** - Deployments should be hands-off
5. **Isolated** - Separate from production data and services

---

## 💰 Budget Comparison

| Environment | Monthly Cost | Use Case |
|-------------|-------------|----------|
| **Production** | $100-200/mo | Live users, 24/7 uptime, redundancy |
| **Staging** | $15-30/mo | Testing, QA, validation |
| **Development** | $0-10/mo | Local development |

**Savings:** 70-85% vs. production costs

---

## 🏗️ Architecture

### Staging Infrastructure Stack

```
┌─────────────────────────────────────────────────┐
│             GitHub (Source Control)             │
│          - feature/* branches                   │
│          - staging branch (auto-deploy)         │
└────────────┬────────────────────────────────────┘
             │
             │ Push to staging branch
             │
┌────────────▼────────────────────────────────────┐
│          GitHub Actions CI/CD                    │
│          - Lint & Type Check                     │
│          - Run Tests                             │
│          - Build Application                     │
└────────────┬────────────────────────────────────┘
             │
             │ Deploy on success
             │
┌────────────▼────────────────────────────────────┐
│         Vercel Preview Deployment                │
│         (or Vercel Staging Project)              │
│                                                  │
│         URL: staging.situation.example.com       │
│         or auto-generated preview URL            │
└─────┬──────────────────┬────────────────────────┘
      │                  │
      │                  │
      ▼                  ▼
┌──────────┐      ┌──────────────┐
│PostgreSQL│      │ Redis Cache  │
│  (Neon)  │      │  (Upstash)   │
│  Free    │      │   Free       │
│  Tier    │      │   Tier       │
└────┬─────┘      └──────────────┘
     │
     │
┌────▼──────────────────────────────────┐
│   Background Jobs (Optional)          │
│   - Railway Free Trial                │
│   - Or disabled for staging           │
└───────────────────────────────────────┘
```

---

## 💾 Infrastructure Components

### 1. Application Hosting: Vercel (Free/Hobby)

**Option A: Vercel Preview Deployments (Recommended)**
- **Cost:** $0 (included in free tier)
- **URL:** Auto-generated preview URL per PR
- **Pros:**
  - Automatic deployment on PR
  - Preview URL for each feature branch
  - No additional configuration
  - Great for testing before merge
- **Cons:**
  - URLs change with each deployment
  - May be rate-limited on free tier

**Option B: Separate Vercel Project**
- **Cost:** $0 (free tier) or $20/mo (Hobby)
- **URL:** Fixed URL (staging.yourdomain.com)
- **Pros:**
  - Persistent URL
  - Separate environment variables
  - More predictable
- **Cons:**
  - Need to manage two projects

**Recommendation:** Use **Preview Deployments** for feature testing, **Separate Project** for persistent staging

**Setup:**
```bash
# Option B: Create staging project
vercel --scope your-team --project situation-staging

# Link to staging branch
git checkout -b staging
vercel link

# Configure environment
vercel env add DATABASE_URL staging
vercel env add REDIS_URL staging
# ... add all env vars
```

---

### 2. Database: Neon Free Tier

**Service:** [Neon.tech](https://neon.tech)

**Free Tier Specs:**
- 0.5 GB storage
- 3 GB data transfer/month
- 1 shared compute
- Auto-suspend after 5 min inactivity
- No backups (manual only)

**Cost:** $0/month

**Why Neon over Supabase Free:**
- Better cold start performance
- Branching feature (database branches!)
- Simpler for staging use case
- Can create branch from production

**Setup:**
```bash
# Create Neon project
# Go to console.neon.tech
# Create project: "situation-staging"
# Copy connection string

# Create database branch from production (optional)
# This creates a copy of prod data at a point in time
neon branches create --name staging --parent main
```

**Database Branch Strategy:**
```
main (production DB)
├── staging (test with prod-like data)
└── feature/new-collector (isolated feature testing)
```

**Alternative:** Supabase Free (0.5GB, daily backups, but has cold starts)

---

### 3. Cache: Upstash Redis Free Tier

**Service:** [Upstash.com](https://upstash.com)

**Free Tier Specs:**
- 10,000 commands/day
- 256 MB storage
- Shared instances
- Global replication

**Cost:** $0/month

**Setup:**
```bash
# Create Redis database
# Go to console.upstash.com
# Create database: "situation-staging"
# Copy UPSTASH_REDIS_URL and TOKEN
```

**Usage Optimization:**
- Lower cache TTLs (save commands)
- Cache only essential data (AI briefs, stats)
- Disable cache for features under test

**Alternative:** Redis Labs Free (30MB, 30 connections) or just skip caching in staging

---

### 4. Background Jobs: Railway Free / Disabled

**Option A: Railway Free Trial**
- 500 hours/month free ($5 credit)
- Good for testing
- Deploy worker container

**Option B: Disable Background Jobs**
- Don't run collectors in staging
- Seed database with test data instead
- Saves costs and external API quota

**Option C: Serverless Cron (Vercel)**
- Use Vercel Cron (free tier limited)
- Run collectors less frequently (every 15 min vs 1 min)

**Recommendation:** **Option B** - Disable collectors, use seed data

---

### 5. External APIs: Test/Sandbox Modes

**Strategy:** Use free tier / lower polling frequency

| API | Staging Strategy |
|-----|------------------|
| NYC Open Data | Use same token, lower poll rate |
| NWS Alerts | Free, unlimited - safe to use |
| MTA API | Use same key, poll every 5 min (vs 30 sec) |
| 511NY | Use same key, poll every 5 min (vs 1 min) |
| OpenAI | Use separate API key with lower quota |

**Cost Savings:**
- Reduce polling frequency by 5-10x
- Use mock data when possible
- Disable non-critical collectors

---

## 📋 Complete Infrastructure Cost

### Free Tier Setup (Recommended for MVP)

| Component | Service | Tier | Cost |
|-----------|---------|------|------|
| App Hosting | Vercel | Free | $0 |
| Database | Neon | Free | $0 |
| Cache | Upstash | Free | $0 |
| Background Jobs | Disabled | N/A | $0 |
| Monitoring | Vercel Analytics | Free | $0 |
| **Total** | | | **$0/mo** |

**Limitations:**
- 0.5GB database storage
- Preview deployments only (no custom domain)
- No automated backups
- Limited cache quota
- No background job runner

---

### Low-Cost Paid Setup (Better for Team)

| Component | Service | Tier | Cost |
|-----------|---------|------|------|
| App Hosting | Vercel | Hobby | $20/mo |
| Database | Neon | Launch | $19/mo |
| Cache | Upstash | Free | $0 |
| Background Jobs | Railway | Hobby | $5/mo |
| Monitoring | Sentry | Free | $0 |
| **Total** | | | **$44/mo** |

**Benefits:**
- 3GB database storage
- Custom domain (staging.yourdomain.com)
- Daily automated backups
- Always-on background jobs
- Better support

---

## 🔧 Configuration

### Environment Variables

**Create `.env.staging`:**
```bash
# Database (Neon staging)
DATABASE_URL=postgresql://user:pass@ep-staging.neon.tech/situation
DIRECT_URL=postgresql://user:pass@ep-staging.neon.tech/situation

# Cache (Upstash staging)
UPSTASH_REDIS_URL=https://staging.upstash.io
UPSTASH_REDIS_TOKEN=staging_token

# External APIs (same as prod, but mark as staging)
NYC_OPEN_DATA_TOKEN=same_as_prod
MTA_API_KEY=same_as_prod
NY511_API_KEY=same_as_prod
NWS_USER_AGENT=SituationMonitor-Staging/1.0 (staging@example.com)

# OpenAI (separate key or lower quota)
OPENAI_API_KEY=sk-staging-xxx

# Application
NEXT_PUBLIC_APP_URL=https://staging.situation.example.com
NODE_ENV=staging
NEXT_PUBLIC_ENV=staging

# Feature Flags
ENABLE_BACKGROUND_JOBS=false  # Disable collectors
ENABLE_REAL_TIME_STREAM=true  # Test SSE
ENABLE_AI_BRIEF=true          # Test AI (with limits)

# Monitoring (optional)
SENTRY_DSN=https://staging-dsn@sentry.io
SENTRY_ENVIRONMENT=staging
```

**Add to Vercel:**
```bash
# Add all staging vars to Vercel
vercel env pull .env.staging

# Or add manually in Vercel dashboard
# Settings > Environment Variables > Staging
```

---

## 🌱 Database Seeding

### Seed Script Strategy

Instead of running live collectors, seed database with realistic test data.

**Create `src/db/seed-staging.ts`:**
```typescript
import { db } from './client';
import { incidents, alerts } from './schema';

const SEED_INCIDENTS = [
  {
    sourceId: 'seed-fdny-001',
    sourceName: 'FDNY Dispatch (Test)',
    category: 'fire',
    subcategory: 'Structure Fire',
    severity: 'critical',
    title: '[TEST] 3-Alarm Fire - Brooklyn',
    description: 'Test incident for staging validation',
    locationLon: -73.9442,
    locationLat: 40.6782,
    locationText: '1247 Atlantic Ave, Brooklyn, NY (TEST DATA)',
    eventTime: new Date(Date.now() - 30 * 60 * 1000),
    confidence: 0.95,
    dedupeKey: 'seed-fdny-001',
  },
  // ... more test incidents covering all categories
];

export async function seedStaging() {
  console.log('🌱 Seeding staging database...');

  // Clear existing data
  await db.delete(incidents);
  await db.delete(alerts);

  // Insert test incidents
  await db.insert(incidents).values(SEED_INCIDENTS);

  // Insert test alerts
  await db.insert(alerts).values(SEED_ALERTS);

  console.log('✅ Staging database seeded successfully');
}

seedStaging();
```

**Run seed script:**
```bash
# Add to package.json
{
  "scripts": {
    "db:seed:staging": "tsx src/db/seed-staging.ts"
  }
}

# Run
DATABASE_URL=$STAGING_DATABASE_URL npm run db:seed:staging
```

**Seed Data Categories:**
- 2-3 critical incidents (fire, police emergency)
- 5-10 moderate incidents (traffic, transit delays)
- 3-5 weather alerts
- Mix of active and resolved incidents
- Incidents across all NYC boroughs
- Recent timestamps (last 24 hours)

---

## 🚀 CI/CD Pipeline

### GitHub Actions Workflow

**`.github/workflows/staging.yml`:**
```yaml
name: Staging Deployment

on:
  push:
    branches: [staging, develop]
  pull_request:
    branches: [staging]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_STAGING_PROJECT_ID }}

jobs:
  test:
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

      - name: Run linter
        run: npm run lint

      - name: Type check
        run: npx tsc --noEmit

      - name: Run unit tests
        run: npm test
        env:
          NODE_ENV: test

      - name: Build application
        run: npm run build
        env:
          NODE_ENV: staging

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel Staging
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_STAGING_PROJECT_ID }}
          vercel-args: '--prod' # Deploy as "production" of staging project
          scope: ${{ secrets.VERCEL_ORG_ID }}

      - name: Seed staging database
        run: npm run db:seed:staging
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}

      - name: Run smoke tests
        run: npm run test:e2e:staging
        env:
          STAGING_URL: ${{ steps.deploy.outputs.preview-url }}

      - name: Notify team
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Staging deployment complete!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()
```

**Deployment Flow:**
1. Push to `staging` branch
2. GitHub Actions runs tests
3. If tests pass, deploy to Vercel staging
4. Seed database with test data
5. Run smoke tests
6. Notify team (Slack/Discord)

---

## 🧪 Testing Strategy

### Test Types in Staging

#### 1. Smoke Tests (Critical Path)
```bash
# scripts/smoke-test.sh
#!/bin/bash

STAGING_URL=${1:-https://staging.situation.example.com}

echo "🧪 Running smoke tests on $STAGING_URL"

# Test homepage loads
curl -f "$STAGING_URL" || exit 1

# Test API endpoints
curl -f "$STAGING_URL/api/health" || exit 1
curl -f "$STAGING_URL/api/incidents" || exit 1
curl -f "$STAGING_URL/api/stats" || exit 1

# Test database connection (via health endpoint)
HEALTH=$(curl -s "$STAGING_URL/api/health")
echo "$HEALTH" | jq -e '.services.database == "healthy"' || exit 1

echo "✅ All smoke tests passed"
```

#### 2. Integration Tests
Test API routes with real database:
```typescript
// __tests__/integration/api.test.ts
import { expect, test, beforeAll } from 'vitest';

const STAGING_URL = process.env.STAGING_URL || 'http://localhost:3000';

beforeAll(async () => {
  // Seed test data
  await fetch(`${STAGING_URL}/api/admin/seed`, { method: 'POST' });
});

test('GET /api/incidents returns data', async () => {
  const res = await fetch(`${STAGING_URL}/api/incidents`);
  const data = await res.json();

  expect(res.status).toBe(200);
  expect(data.incidents).toBeInstanceOf(Array);
  expect(data.incidents.length).toBeGreaterThan(0);
});

test('GET /api/incidents filters by category', async () => {
  const res = await fetch(`${STAGING_URL}/api/incidents?category=fire`);
  const data = await res.json();

  expect(res.status).toBe(200);
  expect(data.incidents.every(i => i.category === 'fire')).toBe(true);
});
```

#### 3. E2E Tests (Playwright)
Test critical user flows:
```typescript
// e2e/staging.spec.ts
import { test, expect } from '@playwright/test';

test.use({ baseURL: process.env.STAGING_URL });

test('user can view incidents on map', async ({ page }) => {
  await page.goto('/');

  // Wait for map to load
  await page.waitForSelector('.maplibregl-map');

  // Check incidents appear in sidebar
  const incidentList = page.locator('[data-testid="incident-list"]');
  await expect(incidentList).toBeVisible();

  // Count incidents
  const incidents = page.locator('[data-testid="incident-card"]');
  await expect(incidents).toHaveCount.greaterThan(0);
});

test('user can filter incidents by category', async ({ page }) => {
  await page.goto('/');

  // Click fire category filter
  await page.click('button:has-text("Fire/EMS")');

  // Verify only fire incidents shown
  const incidents = page.locator('[data-testid="incident-card"]');
  const count = await incidents.count();

  for (let i = 0; i < count; i++) {
    const category = await incidents.nth(i).getAttribute('data-category');
    expect(category).toBe('fire');
  }
});
```

**Run E2E tests:**
```bash
# Install Playwright
npm install -D @playwright/test

# Add to package.json
{
  "scripts": {
    "test:e2e:staging": "STAGING_URL=https://staging.situation.example.com playwright test"
  }
}

# Run
npm run test:e2e:staging
```

#### 4. Performance Testing (Optional)
```bash
# Install k6
brew install k6

# Create load test
# tests/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 10 },  // Ramp up to 10 users
    { duration: '2m', target: 10 },  // Stay at 10 users
    { duration: '1m', target: 0 },   // Ramp down
  ],
};

export default function () {
  const res = http.get('https://staging.situation.example.com/api/incidents');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}

# Run
k6 run tests/load-test.js
```

---

## 📊 Monitoring & Observability

### Lightweight Monitoring

**Use Free Tiers:**

1. **Vercel Analytics** (Free)
   - Page views
   - Web Vitals
   - API response times

2. **Sentry** (Free Tier)
   - 5,000 errors/month
   - Basic error tracking
   - Set environment to "staging"

3. **Better Uptime** (Free Tier)
   - 1 monitor
   - Check staging URL every 5 minutes
   - Email alerts

**Health Check Endpoint:**
```typescript
// app/api/health/route.ts
export async function GET() {
  const health = {
    status: 'ok',
    environment: 'staging',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      cache: 'unknown',
    },
    version: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
  };

  try {
    await db.execute('SELECT 1');
    health.services.database = 'healthy';
  } catch {
    health.services.database = 'unhealthy';
    health.status = 'degraded';
  }

  try {
    await redis.ping();
    health.services.cache = 'healthy';
  } catch {
    health.services.cache = 'unhealthy';
  }

  return Response.json(health, {
    status: health.status === 'ok' ? 200 : 503,
  });
}
```

---

## 🔐 Security Considerations

### Staging-Specific Security

**What to Keep:**
- ✅ HTTPS enforcement
- ✅ Environment variable secrets
- ✅ Input validation
- ✅ SQL injection protection (ORM)

**What Can Be Relaxed:**
- ⚠️ Rate limiting (allow higher limits for testing)
- ⚠️ CORS (allow internal tools)
- ⚠️ Authentication (optional if internal-only)

**Access Control:**

**Option 1: HTTP Basic Auth (Simple)**
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // Only in staging
  if (process.env.NEXT_PUBLIC_ENV !== 'staging') {
    return NextResponse.next();
  }

  const basicAuth = req.headers.get('authorization');

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    if (user === 'staging' && pwd === process.env.STAGING_PASSWORD) {
      return NextResponse.next();
    }
  }

  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Staging"',
    },
  });
}
```

**Option 2: Vercel Password Protection**
- Enable in Vercel dashboard
- Settings > Deployment Protection
- Password protect staging deployments

**Option 3: IP Allowlist**
- Restrict to office/VPN IPs
- Configure in Vercel or Cloudflare

---

## 🎭 Feature Flags

### Testing Features in Staging

**Use environment-based flags:**

```typescript
// src/lib/features.ts
export const features = {
  enableAIBrief: process.env.NEXT_PUBLIC_ENABLE_AI_BRIEF === 'true',
  enableRealTimeStream: process.env.NEXT_PUBLIC_ENABLE_STREAM === 'true',
  enableBackgroundJobs: process.env.ENABLE_BACKGROUND_JOBS === 'true',
  debugMode: process.env.NODE_ENV !== 'production',
};

// Usage
import { features } from '@/lib/features';

if (features.enableAIBrief) {
  // Use real OpenAI API
} else {
  // Use mock data
}
```

**Staging flags:**
```bash
# .env.staging
NEXT_PUBLIC_ENABLE_AI_BRIEF=true
NEXT_PUBLIC_ENABLE_STREAM=true
ENABLE_BACKGROUND_JOBS=false  # Use seed data instead
```

---

## 📚 Best Practices

### DO ✅

1. **Automate Everything**
   - Auto-deploy on push to staging branch
   - Auto-seed database after deployment
   - Auto-run tests before deployment

2. **Use Seed Data**
   - Don't poll external APIs frequently
   - Create comprehensive test dataset
   - Reset staging DB regularly (weekly)

3. **Test Migrations**
   - Run DB migrations in staging first
   - Verify data integrity
   - Then run in production

4. **Monitor Costs**
   - Check Vercel bandwidth usage
   - Monitor database size (0.5GB limit)
   - Track API quota usage

5. **Document Changes**
   - Keep changelog of staging deployments
   - Note breaking changes
   - Track what's tested vs. not tested

### DON'T ❌

1. **Don't Use Production Data**
   - Never copy production DB to staging
   - Use synthetic/anonymized data only
   - Avoid exposing PII

2. **Don't Rely on Staging Availability**
   - Staging can be down for maintenance
   - Not mission-critical
   - Can be rebuilt from scratch

3. **Don't Skip Testing**
   - Always test in staging before production
   - Don't merge to main without staging validation
   - Don't skip smoke tests

4. **Don't Store Sensitive Data**
   - No real user data
   - No production API keys (use separate staging keys)
   - No real credit cards/payment info

5. **Don't Over-Engineer**
   - Keep it simple
   - Don't need production-level redundancy
   - Focus on functionality, not uptime

---

## 🔄 Workflow

### Development → Staging → Production

**Step 1: Feature Development**
```bash
# Create feature branch
git checkout -b feature/new-collector

# Develop locally
npm run dev

# Test locally
npm test

# Commit
git add .
git commit -m "Add new collector for MTA alerts"
```

**Step 2: Deploy to Staging**
```bash
# Push to staging branch
git checkout staging
git merge feature/new-collector
git push origin staging

# GitHub Actions automatically:
# - Runs tests
# - Deploys to Vercel staging
# - Seeds database
# - Runs smoke tests
```

**Step 3: QA & Validation**
```bash
# Open staging URL
open https://staging.situation.example.com

# Manual QA checklist:
# - Feature works as expected
# - No console errors
# - Performance acceptable
# - Mobile responsive

# Run E2E tests
npm run test:e2e:staging
```

**Step 4: Production Deployment**
```bash
# Merge to main
git checkout main
git merge staging
git push origin main

# Vercel auto-deploys to production
```

**Rollback Procedure:**
```bash
# If staging tests fail, revert
git checkout staging
git revert HEAD
git push origin staging

# Or rollback in Vercel dashboard
vercel rollback [deployment-id]
```

---

## 📋 Pre-Deployment Checklist

Before deploying to staging:

- [ ] All tests pass locally
- [ ] Linter has no errors
- [ ] TypeScript compiles without errors
- [ ] Database migrations tested
- [ ] Environment variables documented
- [ ] Seed data script updated (if schema changed)
- [ ] Breaking changes documented
- [ ] Feature flag configured (if new feature)

After deploying to staging:

- [ ] Deployment successful
- [ ] Health check passes
- [ ] Smoke tests pass
- [ ] Manual QA completed
- [ ] E2E tests pass
- [ ] Performance acceptable
- [ ] No errors in Sentry
- [ ] Database migrations applied correctly
- [ ] All stakeholders notified

---

## 💡 Cost Optimization Tips

### Reducing Staging Costs

1. **Database:**
   - Stay under 0.5GB (use Neon auto-suspend)
   - Clear old test data weekly
   - Use database branches (free) instead of separate DBs

2. **API Calls:**
   - Disable background collectors
   - Use seed data instead
   - Lower cache TTLs (fewer Redis commands)

3. **Compute:**
   - Use Vercel free tier (100GB/mo bandwidth)
   - Optimize images with next/image
   - Enable edge caching

4. **Monitoring:**
   - Use free tiers only
   - Disable expensive integrations
   - Log locally for debugging

5. **Cleanup:**
   - Delete old preview deployments
   - Remove unused Vercel projects
   - Archive old staging branches

---

## 🚨 Troubleshooting

### Common Issues

**Issue: Staging deployment fails**
```bash
# Check GitHub Actions logs
# Common causes:
# - Environment variable missing
# - Database connection failed
# - Build error

# Fix:
# 1. Check Vercel environment variables
# 2. Verify DATABASE_URL is correct
# 3. Check build logs for errors
```

**Issue: Database migration fails**
```bash
# Check if migration already applied
DATABASE_URL=$STAGING_DB npx drizzle-kit push

# If error, reset staging DB
# (OK to do in staging, NEVER in production)
DATABASE_URL=$STAGING_DB psql -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
DATABASE_URL=$STAGING_DB npm run db:push
DATABASE_URL=$STAGING_DB npm run db:seed:staging
```

**Issue: Seed data not appearing**
```bash
# Check if seed script ran
# Manually run:
DATABASE_URL=$STAGING_DB npm run db:seed:staging

# Verify data:
DATABASE_URL=$STAGING_DB psql -c "SELECT COUNT(*) FROM incidents;"
```

**Issue: Preview URL not working**
```bash
# Check Vercel deployment status
vercel ls

# Check deployment logs
vercel logs [deployment-url]

# Redeploy
git commit --allow-empty -m "Trigger redeploy"
git push origin staging
```

---

## 📊 Monthly Maintenance

### Weekly Tasks
- [ ] Check staging is working (smoke test)
- [ ] Review error logs (Sentry)
- [ ] Check database size (should be < 0.5GB)
- [ ] Clear old test data

### Monthly Tasks
- [ ] Review staging costs (should be $0-30)
- [ ] Update dependencies
- [ ] Test database backup/restore
- [ ] Review and update seed data
- [ ] Archive old deployments

---

## 📚 Additional Resources

- [Vercel Preview Deployments](https://vercel.com/docs/concepts/deployments/preview-deployments)
- [Neon Database Branching](https://neon.tech/docs/guides/branching)
- [GitHub Actions for Vercel](https://github.com/amondnet/vercel-action)
- [Playwright Testing](https://playwright.dev/docs/intro)

---

**Last Updated:** 2026-01-11
**Estimated Monthly Cost:** $0-30
**Recommended For:** Pre-production testing, QA, demos
