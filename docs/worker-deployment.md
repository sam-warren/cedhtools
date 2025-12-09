# Worker Deployment Guide

This guide covers deploying the cedhtools background worker to a Digital Ocean droplet (or any Linux server) for handling database synchronization, enrichment, and aggregation jobs.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Supabase      │     │  Digital Ocean  │     │   TopDeck.gg    │
│   Database      │◄───►│     Worker      │◄───►│      API        │
│                 │     │     (PM2)       │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│    pg_cron      │     │    Scryfall     │
│  (schedules     │     │      API        │
│    jobs)        │     │                 │
└─────────────────┘     └─────────────────┘
```

**How it works:**
1. `pg_cron` runs on Supabase and inserts jobs into the `jobs` table on a schedule
2. The worker polls the `jobs` table for pending jobs
3. When a job is found, the worker executes it (sync/enrich/aggregate)
4. The worker updates the job status when complete

## Prerequisites

- Digital Ocean Droplet (Ubuntu 22.04+ recommended)
- Node.js 20+ and npm
- PM2 (process manager)
- Git
- Supabase project with migrations applied

## Server Setup

### 1. Create a Digital Ocean Droplet

- **Image:** Ubuntu 22.04 LTS
- **Plan:** Basic, $6/mo (1 GB RAM) minimum, $12/mo (2 GB RAM) recommended
- **Region:** Choose one close to your Supabase region

### 2. Initial Server Configuration

```bash
# SSH into your droplet
ssh root@your-droplet-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify installation
node --version  # Should be v20.x.x
npm --version

# Install PM2 globally
npm install -g pm2

# Install Git
apt install -y git

# Create app user (don't run as root)
adduser --disabled-password --gecos "" cedhtools
usermod -aG sudo cedhtools

# Switch to app user
su - cedhtools
```

### 3. Clone and Setup Application

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/cedhtools.git
cd cedhtools

# Install dependencies
npm install

# Create logs directory
mkdir -p logs
```

## Environment Variables

Create a `.env.production` file with the following variables:

```bash
nano .env.production
```

```env
# Supabase Configuration
# Found in: Supabase Dashboard > Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# TopDeck.gg API Key
# Required for syncing tournament data
TOPDECK_API_KEY=your-topdeck-api-key-here

# Worker Identification (optional but recommended)
# Helps identify this worker in job logs
WORKER_ID=worker-do-1
```

### Where to Find These Values

| Variable | Location |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → `service_role` key (secret!) |
| `TOPDECK_API_KEY` | Your TopDeck.gg API key |

> ⚠️ **Security Warning:** Never commit `.env.production` to version control. The service role key has full database access.

## Database Setup

### 1. Apply Migrations

Ensure all migrations are applied to your Supabase database:

```bash
# From your local machine (with Supabase CLI configured)
supabase db push

# Or apply manually via Supabase SQL Editor:
# 1. Go to Supabase Dashboard → SQL Editor
# 2. Run contents of supabase/migrations/012_job_queue.sql
# 3. Run contents of supabase/migrations/013_setup_daily_cron.sql
```

### 2. Verify pg_cron is Enabled

In Supabase SQL Editor:

```sql
-- Check if pg_cron extension is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- View scheduled jobs
SELECT * FROM cron.job;

-- Should show:
-- - nightly-data-update (runs at 4 AM UTC)
-- - reset-stuck-jobs (runs every 6 hours)
-- - cleanup-old-jobs (runs weekly on Sunday)
```

## Starting the Worker

### Option 1: Using PM2 (Recommended for Production)

```bash
# Start with PM2
cd /home/cedhtools/cedhtools
pm2 start ecosystem.config.js --env production

# Save PM2 process list (survives reboot)
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions it prints (run the command as root)

# View worker status
pm2 status

# View logs
pm2 logs cedhtools-worker

# Monitor in real-time
pm2 monit
```

### Option 2: Direct Execution (Development/Testing)

```bash
# Run directly (for testing)
npm run worker:prod

# Or with explicit env file
dotenv -e .env.production -- npx tsx worker/index.ts
```

## Initial Database Seed

For a fresh database, you need to run an initial seed to populate tournament data.

### Method 1: Run Scripts Directly (Fastest)

Best for initial setup when you have direct access to the server:

```bash
# SSH into your server
ssh cedhtools@your-droplet-ip
cd cedhtools

# Run the full seed pipeline (can take several hours)
npm run db:seed:prod

# Or run faster version without decklist validation
npm run db:seed:prod:fast
```

### Method 2: Enqueue a Seed Job

If the worker is already running:

```bash
# Enqueue a full seed job
npm run job:enqueue full_seed -- --start-date 2025-05-19

# Or with skip validation for faster seeding
npm run job:enqueue full_seed -- --start-date 2025-05-19 --skip-validation

# Check job status
npm run job:status
```

Or via SQL in Supabase Dashboard:

```sql
-- Enqueue a full seed job
SELECT public.enqueue_job(
  'full_seed',
  '{"start_date": "2025-05-19", "skip_validation": true}'::jsonb,
  1  -- High priority
);

-- Check job status
SELECT * FROM public.jobs ORDER BY created_at DESC LIMIT 10;
```

### Method 3: Run Individual Steps

If you need more control:

```bash
# Step 1: Sync tournaments
npm run job:enqueue sync -- --start-date 2025-05-19

# Step 2: Enrich data (after sync completes)
npm run job:enqueue enrich -- --skip-validation

# Step 3: Aggregate stats (after enrich completes)
npm run job:enqueue aggregate
```

## Daily Updates

Daily updates are **automatic** once pg_cron is configured. The `nightly-data-update` cron job:

1. Runs at 4:00 AM UTC daily
2. Inserts a `daily_update` job into the queue
3. The worker picks it up and runs:
   - Sync (last 7 days of tournaments)
   - Enrich (incremental, new data only)
   - Aggregate (full rebuild of stats)

### Manual Daily Update

To trigger a daily update manually:

```bash
# Via CLI
npm run job:daily

# Or via SQL
SELECT public.enqueue_job('daily_update', '{}', 5);
```

## Job Types Reference

| Job Type | Description | Default Config |
|----------|-------------|----------------|
| `daily_update` | Full pipeline: sync → enrich → aggregate | `{"days_back": 7}` |
| `full_seed` | Full sync from start date + enrich + aggregate | `{"start_date": "2025-05-19"}` |
| `sync` | Sync tournaments only | `{"days_back": 7}` or `{"start_date": "..."}` |
| `enrich` | Enrich data only | `{"incremental": true, "skip_validation": false}` |
| `aggregate` | Rebuild stats tables only | `{}` |

### Job Configuration Options

```sql
-- Sync with custom date range
SELECT public.enqueue_job('sync', '{"start_date": "2025-01-01"}'::jsonb, 5);

-- Sync last 14 days
SELECT public.enqueue_job('sync', '{"days_back": 14}'::jsonb, 5);

-- Full enrich (clears existing data)
SELECT public.enqueue_job('enrich', '{"incremental": false}'::jsonb, 5);

-- Enrich without validation (faster)
SELECT public.enqueue_job('enrich', '{"skip_validation": true}'::jsonb, 5);
```

## Monitoring & Troubleshooting

### Check Worker Status

```bash
# PM2 status
pm2 status

# View real-time logs
pm2 logs cedhtools-worker --lines 100

# View error logs only
pm2 logs cedhtools-worker --err --lines 50
```

### Check Job Status

```bash
# Via CLI
npm run job:status
```

Or via SQL:

```sql
-- Recent jobs
SELECT id, job_type, status, 
       started_at, completed_at,
       EXTRACT(EPOCH FROM (completed_at - started_at))/60 as duration_minutes,
       error
FROM public.jobs 
ORDER BY created_at DESC 
LIMIT 20;

-- Running jobs
SELECT * FROM public.jobs WHERE status = 'running';

-- Failed jobs
SELECT * FROM public.jobs WHERE status = 'failed' ORDER BY created_at DESC;

-- Job statistics
SELECT job_type, status, COUNT(*) 
FROM public.jobs 
GROUP BY job_type, status 
ORDER BY job_type, status;
```

### Check Cron Status

```sql
-- View scheduled cron jobs
SELECT jobid, jobname, schedule, command, active 
FROM cron.job;

-- View recent cron executions
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 20;
```

### Common Issues

#### Worker Not Picking Up Jobs

1. Check worker is running: `pm2 status`
2. Check logs for errors: `pm2 logs cedhtools-worker`
3. Verify environment variables are set correctly
4. Check database connectivity

#### Jobs Stuck in "Running" State

Jobs may get stuck if the worker crashes. The `reset-stuck-jobs` cron runs every 6 hours and resets jobs stuck for more than 6 hours.

To manually reset:

```sql
-- Reset all stuck jobs
SELECT public.reset_stuck_jobs(0);

-- Or reset specific job
UPDATE public.jobs 
SET status = 'pending', started_at = NULL, worker_id = NULL 
WHERE id = <job_id>;
```

#### Sync Failing with API Errors

- Check TopDeck API key is valid
- Check for rate limiting (add delays between requests)
- View detailed error in job record: `SELECT error FROM jobs WHERE id = <job_id>`

### Restarting the Worker

```bash
# Restart worker
pm2 restart cedhtools-worker

# Reload (zero-downtime restart)
pm2 reload cedhtools-worker

# Stop worker
pm2 stop cedhtools-worker

# Start worker
pm2 start cedhtools-worker
```

## Updating the Application

```bash
# SSH into server
ssh cedhtools@your-droplet-ip
cd cedhtools

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Restart worker
pm2 restart cedhtools-worker
```

## Log Management

Logs are stored in the `logs/` directory:
- `worker-out.log` - Standard output
- `worker-error.log` - Error output

### Log Rotation with PM2

PM2 has built-in log rotation:

```bash
# Install log rotation module
pm2 install pm2-logrotate

# Configure (optional)
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 10
pm2 set pm2-logrotate:compress true
```

### Manual Log Cleanup

```bash
# Clear PM2 logs
pm2 flush

# Or delete log files manually
rm logs/*.log
```

## Security Recommendations

1. **Use a dedicated user** - Don't run as root
2. **Protect env files** - `chmod 600 .env.production`
3. **Use SSH keys** - Disable password authentication
4. **Keep updated** - Regularly update system and dependencies
5. **Firewall** - Only open necessary ports (SSH)
6. **Monitor** - Set up alerts for failed jobs

## Quick Reference

### Essential Commands

```bash
# Start worker
pm2 start ecosystem.config.js --env production

# View status
pm2 status

# View logs
pm2 logs cedhtools-worker

# Restart worker
pm2 restart cedhtools-worker

# Enqueue jobs
npm run job:daily          # Daily update
npm run job:seed           # Full seed
npm run job:status         # Check status
```

### Essential SQL

```sql
-- Enqueue daily update
SELECT public.enqueue_job('daily_update', '{}', 5);

-- Enqueue full seed
SELECT public.enqueue_job('full_seed', '{"start_date": "2025-05-19"}'::jsonb, 1);

-- Check jobs
SELECT * FROM public.jobs ORDER BY created_at DESC LIMIT 10;

-- Reset stuck jobs
SELECT public.reset_stuck_jobs(0);
```

