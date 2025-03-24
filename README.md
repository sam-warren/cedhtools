# cedhtools ETL Pipeline

This repository contains the ETL (Extract, Transform, Load) pipeline for the cedhtools application. The pipeline fetches tournament data from Topdeck.gg, processes it, and stores it in a Supabase database.

## Setup

### Prerequisites

- Node.js 18+ and npm/yarn/bun
- Supabase CLI
- Docker (for local Supabase)

### Setting up local Supabase

1. Install Supabase CLI:
   ```
   npm install -g supabase
   ```

2. Start local Supabase:
   ```
   supabase start
   ```

3. Apply migrations:
   ```
   supabase migration up
   ```

### Environment Variables

Create a `.env.local` file in the `client` directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
ETL_API_KEY=<your-secret-api-key>
```

## Running the ETL Pipeline

### Local Testing

To test the ETL pipeline locally:

1. Install dependencies:
   ```
   cd client
   npm install
   ```

2. Run the test script:
   ```
   npm run etl:test
   ```

This will process tournament data from the last 7 days.

### Asynchronous Job Queue System

The ETL pipeline now uses an asynchronous job queue system to handle long-running tasks. This architecture separates the web application from the ETL processing, allowing for more resilient handling of rate limits and long processing times.

#### Components:

1. **ETL Jobs Table**: Stores job metadata, status, and progress
2. **ETL Worker**: Processes jobs from the queue one by one
3. **Cron Trigger**: Schedules daily update jobs
4. **API Endpoints**: For job management and monitoring

#### Running the Worker

The worker service runs independently of the web application and can be deployed to a separate server:

```
# For local development:
npm run etl:worker

# For production:
npm run etl:worker:prod
```

The worker will:
- Process one job at a time
- Automatically retry on rate limit errors
- Report job progress and status
- Create follow-up jobs for batch processing

#### Job Types

The system supports three types of jobs:

- **SEED**: For initial database seeding (6 months of data)
- **DAILY_UPDATE**: For daily incremental updates
- **BATCH_PROCESS**: For processing data in smaller chunks with cursor-based resumption

### API Endpoints

- `GET /api/etl` - Check if the ETL API is running
- `GET /api/etl?jobId=123` - Get status of a specific job
- `GET /api/etl?list=true` - List recent jobs
- `POST /api/etl` - Trigger a new ETL job

The POST endpoint requires authentication with the ETL_API_KEY as a Bearer token.

Example request to queue a seed job:
```
curl -X POST https://your-domain.com/api/etl \
  -H "Authorization: Bearer YOUR_ETL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jobType": "SEED", 
    "startDate": "2023-01-01", 
    "endDate": "2023-06-30",
    "priority": 0
  }'
```

## Deployment

### Deploying to Vercel

1. Push your changes to GitHub
2. Connect your repository to Vercel
3. Set the environment variables in the Vercel dashboard
4. Deploy!

### Setting up Scheduled ETL Runs

To run the ETL process daily, you can set up a scheduled job using Vercel Cron Jobs:

1. Create a `vercel.json` file:
   ```json
   {
     "crons": [
       {
         "path": "/api/etl-cron",
         "schedule": "0 0 * * *"
       }
     ]
   }
   ```

2. Create the cron endpoint at `app/api/etl-cron/route.ts`

## Database Schema

The database schema includes the following tables:

- `commanders` - Information about commanders
- `cards` - Information about cards
- `statistics` - Statistics for each commander-card pair
- `users` - User information and subscription status
- `deck_analyses` - Record of deck analyses performed by users
- `etl_status` - Status and logs of ETL runs 